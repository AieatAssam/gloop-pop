import { loadSprite } from './loader';
import { popVoiceStealIndex, stealCandidate } from './voices';

// spec-note: DynamicsCompressorNode adds automatic makeup gain of (1 / full-range gain)^0.6, which is +3.42 dB at threshold −6, knee 0, ratio 20. This trim cancels it so the limiter stays a safety net (SG §13.8).
const MASTER_TRIM = 0.674;

// SG §13.8: the limiter is the final safety stage; independent buses keep settings isolated.
export type VoicePriority = 'ui' | 'deal' | 'coin' | 'pop' | 'place' | 'ladder' | 'stinger';
export interface AudioGraph {
  context: AudioContext;
  master: GainNode;
  sfxBus: GainNode;
  musicBus: GainNode;
  musicFilter: BiquadFilterNode;
  duckFilter: BiquadFilterNode;
  bedGain: GainNode;
  layerGain: GainNode;
  duckGain: GainNode;
  musicStateGain: GainNode;
  limiter: DynamicsCompressorNode;
  noiseBuffer: AudioBuffer;
}

interface ActiveVoice { source: AudioScheduledSourceNode; priority: VoicePriority; order: number; gain?: GainNode }
const voices: ActiveVoice[] = [];
let voiceOrder = 0;
let graph: AudioGraph | null = null;
let muted = false;
let sfxEnabled = true;
let musicEnabled = true;
let sfxVolume = 1;
let musicVolume = 1;
let visibilityBound = false;
export interface AudioTraceEntry { t: number; kind: 'playSegment' | 'tone' | 'playCandyBar'; id: string; gainDb: number; bus: 'sfx' | 'music' }
let debugAudioTrace: AudioTraceEntry[] | null = null;
let noiseSeed = (typeof performance === 'undefined' ? 1 : performance.now()) | 0;
function noiseSample(): number {
  noiseSeed = (noiseSeed + 0x6d2b79f5) | 0;
  let value = noiseSeed;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}

interface AudioSessionNavigator extends Navigator { audioSession?: { type: string } }

// SG §13.9 requires the hint before creating an AudioContext. Unsupported browsers ignore it.
try {
  const nav = typeof navigator === 'undefined' ? undefined : navigator as AudioSessionNavigator;
  if (nav?.audioSession) nav.audioSession.type = 'ambient';
} catch { /* Audio session hints are optional. */ }

export function getAudioGraph(): AudioGraph | null { return graph; }

/** Debug-only hook, installed by the lazy debug chunk. */
export function enableDebugAudioTrace(): AudioTraceEntry[] {
  if (!debugAudioTrace) debugAudioTrace = [];
  return debugAudioTrace;
}

export function clearDebugAudioTrace(): void { if (debugAudioTrace) debugAudioTrace.length = 0; }

export function traceAudioCall(t: number, kind: AudioTraceEntry['kind'], id: string, gainDb: number, bus: AudioTraceEntry['bus']): void {
  if (debugAudioTrace) debugAudioTrace.push({ t, kind, id, gainDb, bus });
}

export function initAudioOnFirstInput(): AudioGraph | null {
  if (graph) {
    if (graph.context.state === 'suspended') { try { void graph.context.resume().catch(() => undefined); } catch { /* Input must proceed if audio cannot resume. */ } }
    return graph;
  }
  if (typeof AudioContext === 'undefined') return null;
  let context: AudioContext;
  try { context = new AudioContext(); } catch { return null; }
  const sfxBus = context.createGain();
  const musicBus = context.createGain();
  const musicFilter = context.createBiquadFilter();
  const bedGain = context.createGain();
  const layerGain = context.createGain();
  const duckGain = context.createGain();
  const duckFilter = context.createBiquadFilter();
  const musicStateGain = context.createGain();
  const master = context.createGain();
  const limiter = context.createDynamicsCompressor();
  const noiseBuffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseData.length; i += 1) noiseData[i] = noiseSample() * 2 - 1;

  sfxBus.gain.value = 1;
  musicBus.gain.value = 1;
  bedGain.gain.value = 0;
  layerGain.gain.value = 1;
  musicFilter.type = 'lowpass';
  musicFilter.frequency.value = 1200;
  duckFilter.type = 'lowpass';
  duckFilter.frequency.value = 20000;
  master.gain.value = muted ? 0 : MASTER_TRIM;
  limiter.threshold.value = -6;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.002;
  limiter.release.value = 0.15;
  sfxBus.connect(master);
  musicFilter.connect(bedGain);
  bedGain.connect(duckGain);
  layerGain.connect(duckGain);
  duckGain.connect(duckFilter);
  duckFilter.connect(musicStateGain);
  musicStateGain.connect(musicBus);
  musicBus.connect(master);
  master.connect(limiter);
  limiter.connect(context.destination);
  graph = { context, master, sfxBus, musicBus, musicFilter, duckFilter, bedGain, layerGain, duckGain, musicStateGain, limiter, noiseBuffer };
  bindVisibility();
  applyAudioSettings();
  try { void context.resume().catch(() => undefined); } catch { /* The gesture may not unlock audio in this browser. */ }
  // Loading starts only after the user gesture has created the context.
  void loadSprite(context);
  return graph;
}

function bindVisibility(): void {
  if (visibilityBound || typeof document === 'undefined') return;
  visibilityBound = true;
  document.addEventListener('visibilitychange', () => {
    if (!graph) return;
    if (document.hidden) void graph.context.suspend();
    else void graph.context.resume();
  });
}

export function claimVoice(source: AudioScheduledSourceNode, priority: VoicePriority = 'place', gain?: GainNode): boolean {
  const at = scheduleAt();
  if (priority === 'pop') {
    const popCount = voices.reduce((count, voice) => count + Number(voice.priority === 'pop'), 0);
    if (popCount >= 6) { const index = popVoiceStealIndex(voices); if (index >= 0) stopVoice(voices[index]!, at); }
  }
  if (priority === 'place') {
    const priorPlace = voices.find((voice) => voice.priority === 'place');
    if (priorPlace) stopVoice(priorPlace, at, 0.01);
  }
  if (voices.length >= 24) {
    const candidate = stealCandidate(voices);
    if (candidate < 0) return false;
    if (candidate >= 0) {
      const [oldest] = voices.splice(candidate, 1);
      if (oldest) stopVoice(oldest, at);
    }
  }
  const voice = { source, priority, order: voiceOrder++, ...(gain ? { gain } : {}) };
  voices.push(voice);
  source.addEventListener('ended', () => {
    const index = voices.indexOf(voice);
    if (index >= 0) voices.splice(index, 1);
  }, { once: true });
  return true;
}

function stopVoice(voice: ActiveVoice, at: number, fade = 0): void {
  try {
    if (fade > 0 && voice.gain) {
      voice.gain.gain.cancelScheduledValues(at);
      voice.gain.gain.setValueAtTime(voice.gain.gain.value, at);
      voice.gain.gain.linearRampToValueAtTime(0, at + fade);
      voice.source.stop(at + fade + 0.001);
    } else voice.source.stop(at);
  } catch { /* Already ended or not yet started. */ }
}

export function activeVoiceCount(): number { return voices.length; }

export function setMasterMuted(value: boolean): void { muted = value; applyAudioSettings(); }
export function toggleMasterMuted(): boolean { setMasterMuted(!muted); return muted; }
export function setSfxEnabled(value: boolean): void { sfxEnabled = value; applyAudioSettings(); }
export function setMusicEnabled(value: boolean): void { musicEnabled = value; applyAudioSettings(); }
export function setEffectsVolume(value: number): void { sfxVolume = clampVolume(value); applyAudioSettings(); }
export function setMusicVolume(value: number): void { musicVolume = clampVolume(value); applyAudioSettings(); }
export function isMasterMuted(): boolean { return muted; }
export function isSfxEnabled(): boolean { return sfxEnabled; }
export function isMusicEnabled(): boolean { return musicEnabled; }
export function musicBusBaseGain(): number { return musicEnabled ? 0.71 * musicVolume ** 2 : 0; }

function clampVolume(value: number): number { return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 1; }

export function applyAudioSettings(): void {
  if (!graph) return;
  const { context } = graph;
  const now = context.currentTime;
  graph.master.gain.setTargetAtTime(muted ? 0 : MASTER_TRIM, now, 0.01);
  graph.sfxBus.gain.setTargetAtTime(sfxEnabled ? sfxVolume ** 2 : 0, now, 0.01);
  graph.musicBus.gain.setTargetAtTime(musicEnabled ? 0.71 * musicVolume ** 2 : 0, now, 0.01);
}

export function scheduleAt(): number { return (graph?.context.currentTime ?? 0) + 0.005; }
