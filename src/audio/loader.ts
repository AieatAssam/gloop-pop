import { AUDIO_MANIFEST, type SegmentId } from './manifest';
import { findSpriteOffset } from './sprite';
import { claimVoice, getAudioGraph, scheduleAt, traceAudioCall } from './engine';
import { VoiceRandom } from './voices';
import { createRng, nextFloat } from '../core/rng';

export type AudioFormat = 'ogg' | 'mp3';
const buffers = new Map<SegmentId, AudioBuffer>();
const cosmeticRng = createRng(String(typeof performance === 'undefined' ? 1 : performance.now()));
const variantRandom = new VoiceRandom(() => nextFloat(cosmeticRng));
let spritePromise: Promise<void> | null = null;
let musicPromise: Promise<AudioBuffer | null> | null = null;
let spriteLoadStartedAt = 0;
let selectedFormat: AudioFormat | 'none' = 'none';

export function pickFormat(canPlayType: (mime: string) => string): AudioFormat {
  return canPlayType('audio/ogg; codecs="opus"') === 'probably' ? 'ogg' : 'mp3';
}

function preferredFormat(): AudioFormat {
  if (typeof document === 'undefined') return 'mp3';
  const audio = document.createElement('audio');
  return pickFormat((mime) => audio.canPlayType(mime));
}

interface LowPriorityRequestInit extends RequestInit { priority?: 'high' | 'low' | 'auto' }
function fetchBytes(url: string, lowPriority = false): Promise<ArrayBuffer> {
  const options: LowPriorityRequestInit = lowPriority ? { priority: 'low' } : {};
  return fetch(url, options).then((response) => {
    if (!response.ok) throw new Error(`Audio request failed (${response.status})`);
    return response.arrayBuffer();
  });
}

function decode(context: BaseAudioContext, data: ArrayBuffer): Promise<AudioBuffer> {
  return context.decodeAudioData(data.slice(0));
}

export function loadSprite(context: BaseAudioContext): Promise<void> {
  if (spritePromise) return spritePromise;
  spriteLoadStartedAt = typeof performance === 'undefined' ? 0 : performance.now();
  spritePromise = (async () => {
    const initial = preferredFormat();
    selectedFormat = initial;
    try {
      const source = await fetchBytes(AUDIO_MANIFEST.files.sfx[initial]);
      const decoded = await decode(context, source);
      sliceSprite(decoded, context);
    } catch (error) {
      if (initial !== 'ogg') return;
      try {
        selectedFormat = 'mp3';
        const fallback = await fetchBytes(AUDIO_MANIFEST.files.sfx.mp3);
        sliceSprite(await decode(context, fallback), context);
      } catch {
        // Offline or unsupported decode: existing v1 synth recipes remain available.
        void error;
      }
    }
  })();
  return spritePromise;
}

function sliceSprite(sprite: AudioBuffer, context: BaseAudioContext): void {
  const channel = sprite.getChannelData(0);
  const offset = findSpriteOffset(channel, sprite.sampleRate);
  for (const [id, segment] of Object.entries(AUDIO_MANIFEST.segments) as [SegmentId, (typeof AUDIO_MANIFEST.segments)[SegmentId]][]) {
    const start = Math.max(0, Math.round((segment.start + offset) * sprite.sampleRate));
    const length = Math.min(Math.ceil(segment.dur * sprite.sampleRate), channel.length - start);
    if (length <= 0) continue;
    const sliced = context.createBuffer(1, length, sprite.sampleRate);
    sliced.copyToChannel(channel.slice(start, start + length), 0);
    buffers.set(id, sliced);
  }
}

export function getSegmentBuffer(id: SegmentId): AudioBuffer | null { return buffers.get(id) ?? null; }
export function isSpriteLoaded(): boolean { return buffers.size > 0; }
export function audioLoadDebug(): { format: AudioFormat | 'none'; decoded: number; total: number } {
  return { format: selectedFormat, decoded: buffers.size, total: Object.keys(AUDIO_MANIFEST.segments).length };
}

/** Play a loaded sprite segment; callers retain their v1 synth recipe as the loading fallback. */
export function playSegment(id: SegmentId, options: { at?: number; rate?: number; rateVariation?: number; gain?: number; gainDbVariation?: number; priority?: 'ui' | 'deal' | 'coin' | 'pop' | 'place' | 'ladder' | 'stinger'; group?: string; variants?: number } = {}): boolean {
  const graph = getAudioGraph();
  const buffer = buffers.get(id);
  if (!graph) return false;
  if (!buffer) {
    traceAudioCall(options.at ?? scheduleAt(), 'playSegment', id, 20 * Math.log10(options.gain ?? 1), 'sfx');
    return false;
  }
  const group = options.group ?? id;
  const variant = variantRandom.variant(group, options.variants ?? 1);
  const rateVariation = options.rateVariation ?? 0;
  const rate = (options.rate ?? 1) * (1 + (variantRandom.next() * 2 - 1) * rateVariation);
  const gainDbVariation = (variantRandom.next() * 2 - 1) * (options.gainDbVariation ?? 0);
  const level = (options.gain ?? 1) * 10 ** (gainDbVariation / 20);
  const variantId = ((options.variants ?? 1) > 1 ? `${id.slice(0, -1)}${variant + 1}` : id) as SegmentId;
  const selected = buffers.get(variantId) ?? buffer;
  const at = options.at ?? scheduleAt();
  traceAudioCall(at, 'playSegment', variantId, 20 * Math.log10(level), 'sfx');
  const source = graph.context.createBufferSource();
  const gain = graph.context.createGain();
  source.buffer = selected;
  source.playbackRate.setValueAtTime(rate, at);
  gain.gain.setValueAtTime(level, at);
  source.connect(gain);
  gain.connect(graph.sfxBus);
  if (!claimVoice(source, options.priority ?? 'place', gain)) return false;
  source.start(at);
  return true;
}

export function loadMusic(context: BaseAudioContext): Promise<AudioBuffer | null> {
  if (musicPromise) return musicPromise;
  musicPromise = (async () => {
    if (spritePromise) {
      await new Promise<void>((resolve) => {
        // spec-note: the two-second music fallback window is measured from the first gesture,
        // even when the first play-screen interaction happens later.
        const elapsed = typeof performance === 'undefined' ? 2000 : performance.now() - spriteLoadStartedAt;
        const timeout = setTimeout(resolve, Math.max(0, 2000 - elapsed));
        void spritePromise?.then(() => { clearTimeout(timeout); resolve(); });
      });
    }
    const format = selectedFormat === 'none' ? preferredFormat() : selectedFormat;
    try { return await decode(context, await fetchBytes(AUDIO_MANIFEST.files.music[format], true)); }
    catch {
      if (format !== 'ogg') return null;
      try { return await decode(context, await fetchBytes(AUDIO_MANIFEST.files.music.mp3, true)); }
      catch { return null; }
    }
  })();
  return musicPromise;
}
