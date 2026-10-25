import { getAudioGraph, isMusicEnabled } from './engine';
import { getSegmentBuffer, loadMusic } from './loader';
import { AUDIO_MANIFEST } from './manifest';
import { tone } from './synth';
import { nextFloat, createRng } from '../core/rng';
import type { MusicState } from './musicState';

export type { MusicTier } from './musicState';
const BPM = 120.04;
const BAR = 4 * 60 / BPM;
const LOOP = AUDIO_MANIFEST.music.loopEnd - AUDIO_MANIFEST.music.loopStart;
const LOOP_START = AUDIO_MANIFEST.music.loopStart;
const PAD_FREQS = [329.63, 440, 659.26] as const;
const rng = createRng('gloop-pop/music-twinkles/v2');

interface PadVoice { oscillators: OscillatorNode[]; gain: GainNode }
let source: AudioBufferSourceNode | null = null;
const pads: PadVoice[] = [];
let bufferPromise: Promise<AudioBuffer | null> | null = null;
let wanted = false;
let loadedBuffer: AudioBuffer | null = null;
let state: MusicState | null = null;
let bedStartedAt = 0;
let bedOffset = LOOP_START;
let restUntil = -1;
let gameOverAt = -1;
let paused = false;
let nextTwinkleAt = 0;
let twinkles = 0;
let restarting = false;

function now(): number { return getAudioGraph()?.context.currentTime ?? 0; }
function mixGain(offsetDb = 0): number { return 10 ** (offsetDb / 20); }
function paramRamp(param: AudioParam, value: number, at: number, duration: number): void {
  param.cancelScheduledValues(at); param.setValueAtTime(param.value, at); param.linearRampToValueAtTime(value, at + duration);
}
function position(at = now()): number {
  const graph = getAudioGraph();
  if (!graph || !source) return 0;
  return ((bedOffset - LOOP_START) + Math.max(0, at - bedStartedAt) * source.playbackRate.value) % LOOP;
}
function startSource(offset: number, fade: number): void {
  const graph = getAudioGraph();
  if (!graph || !loadedBuffer || !wanted || !isMusicEnabled() || state?.menu) return;
  stopSource(0);
  const at = graph.context.currentTime + 0.02;
  const next = graph.context.createBufferSource();
  next.buffer = loadedBuffer; next.loop = true; next.loopStart = AUDIO_MANIFEST.music.loopStart; next.loopEnd = AUDIO_MANIFEST.music.loopEnd;
  next.playbackRate.setValueAtTime(1, at); next.connect(graph.musicFilter); next.start(at, offset);
  source = next; bedStartedAt = at; bedOffset = offset; gameOverAt = -1; restUntil = -1;
  paramRamp(graph.bedGain.gain, 1, at, fade);
  next.onended = () => { if (source === next) source = null; };
}
function stopSource(fade: number): void {
  const graph = getAudioGraph(); if (!source || !graph) return;
  const old = source; const at = graph.context.currentTime;
  if (fade > 0) { paramRamp(graph.bedGain.gain, 0, at, fade); try { old.stop(at + fade + 0.02); } catch { /* already stopped */ } }
  else { try { old.stop(); } catch { /* already stopped */ } }
  if (source === old) source = null;
}
function ensurePad(): void {
  const graph = getAudioGraph(); if (!graph || pads.length) return;
  for (const frequency of PAD_FREQS) {
    const gain = graph.context.createGain(); gain.gain.value = 0; gain.connect(graph.layerGain);
    const amplitude = graph.context.createGain(); amplitude.gain.value = 1;
    const lfo = graph.context.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.2;
    const lfoDepth = graph.context.createGain(); lfoDepth.gain.value = 0.2; lfo.connect(lfoDepth); lfoDepth.connect(amplitude.gain);
    const sine = graph.context.createOscillator(); sine.type = 'sine'; sine.frequency.value = frequency;
    const triangle = graph.context.createOscillator(); triangle.type = 'triangle'; triangle.frequency.value = frequency * 2;
    const sineGain = graph.context.createGain(); sineGain.gain.value = 0.0631;
    const triangleGain = graph.context.createGain(); triangleGain.gain.value = 0.01585;
    sine.connect(sineGain); triangle.connect(triangleGain); sineGain.connect(amplitude); triangleGain.connect(amplitude); amplitude.connect(gain);
    sine.start(); triangle.start(); lfo.start(); pads.push({ oscillators: [sine, triangle, lfo], gain });
  }
}
function setPad(on: boolean, duration = BAR): void {
  const graph = getAudioGraph(); if (!graph) return;
  if (on) ensurePad();
  const at = graph.context.currentTime;
  for (const pad of pads) paramRamp(pad.gain.gain, on ? 1 : 0, at, duration);
}
function playTwinkle(at: number): void {
  const graph = getAudioGraph(); const buffer = getSegmentBuffer('tink');
  if (!graph || twinkles >= 3) return;
  if (!buffer) { tone({ frequency: [587.33, 659.26, 783.99, 880][Math.floor(nextFloat(rng) * 4)] ?? 659.26, duration: 0.12, peak: 0.0794, bus: 'music', at }); return; }
  const sourceNode = graph.context.createBufferSource(); const gain = graph.context.createGain();
  sourceNode.buffer = buffer; sourceNode.playbackRate.value = [0.7937, 0.8909, 1.1892, 1.3348][Math.floor(nextFloat(rng) * 4)] ?? 1;
  gain.gain.value = 10 ** ((-22 + (nextFloat(rng) * 6 - 3)) / 20);
  sourceNode.connect(gain); gain.connect(graph.layerGain); twinkles += 1;
  sourceNode.addEventListener('ended', () => { twinkles = Math.max(0, twinkles - 1); }, { once: true });
  sourceNode.start(at);
}
function setFilter(cutoff: number, duration = 0.6): void {
  const graph = getAudioGraph(); if (!graph) return;
  const at = graph.context.currentTime; graph.musicFilter.frequency.cancelScheduledValues(at);
  graph.musicFilter.frequency.setTargetAtTime(cutoff, at, duration / 3);
}
function applyState(next: MusicState): void {
  const graph = getAudioGraph(); if (!graph) return;
  const previous = state; state = next; const at = graph.context.currentTime;
  if (next.menu) {
    if (!previous?.menu) { restUntil = -1; if (source) bedOffset = LOOP_START + Math.floor(position(at) / BAR) * BAR; stopSource(0.6); setPad(false, 0.3); }
    return;
  }
  if (previous?.menu) { if (wanted && loadedBuffer) startSource(bedOffset, 1); }
  if (next.paused !== paused) { paused = next.paused; if (paused) { restUntil = -1; setFilter(400, 0.2); paramRamp(graph.musicStateGain.gain, mixGain(-6), at, 0.2); setPad(false, 0.2); }
    else { if (!source && loadedBuffer) startSource(LOOP_START, 0.3); bedOffset = LOOP_START + position(at); bedStartedAt = at; setFilter(effectiveCutoff(next), 0.3); paramRamp(graph.musicStateGain.gain, mixGain(), at, 0.3); } }
  if (next.gameOver && !previous?.gameOver) { gameOverAt = at; restUntil = -1; setPad(false, 0.3); if (source) { source.playbackRate.cancelScheduledValues(at); source.playbackRate.setValueAtTime(source.playbackRate.value, at); source.playbackRate.linearRampToValueAtTime(0.5, at + 0.45); }
    setFilter(600, 0.4); paramRamp(graph.musicStateGain.gain, mixGain(-6), at, 0.3); }
  if (!next.gameOver && previous?.gameOver && wanted && loadedBuffer) { restarting = true; startSource(LOOP_START, 0.3); restarting = false; setFilter(effectiveCutoff(next), 0.3); paramRamp(graph.musicStateGain.gain, mixGain(), at, 0.3); }
  if (next.idle !== previous?.idle) { if (next.idle) { setFilter(900, 0.6); paramRamp(graph.musicStateGain.gain, mixGain(-4), at, 0.6); setPad(false, 0.6); }
    else if (!next.paused && !next.gameOver) { setFilter(effectiveCutoff(next), 0.6); paramRamp(graph.musicStateGain.gain, mixGain(), at, 0.6); } }
  if (!previous || next.danger !== previous.danger || next.tier !== previous.tier) {
    const currentPosition = position(at);
    const targetBar = nextBarPosition();
    const dangerExitReady = previous?.danger === true && !next.danger;
    const waitToBar = targetBar >= currentPosition ? targetBar - currentPosition : LOOP - currentPosition + targetBar;
    const when = dangerExitReady ? at : at + waitToBar;
    setTimeout(() => { if (state && !state.menu && !state.paused && !state.gameOver) { setFilter(effectiveCutoff(state), 0.6); setPad(state.tier >= 2 && !state.danger && !state.idle); paramRamp(graph.musicStateGain.gain, mixGain(stateOffset(state)), graph.context.currentTime, 0.6); } }, Math.max(0, (when - at) * 1000));
  }
}
function cutoff(s: MusicState): number {
  const tierCutoff = [3000, 4500, 7000, 11000, 11000][s.tier] ?? 3000;
  if (s.danger) return Math.min(tierCutoff, 1600);
  return tierCutoff;
}
function effectiveCutoff(s: MusicState): number {
  if (s.paused) return 400;
  if (s.gameOver) return 600;
  if (s.idle) return 900;
  return cutoff(s);
}
function stateOffset(s: MusicState): number {
  if (s.paused || s.gameOver) return -6;
  if (s.idle) return -4;
  if (s.danger) return -2;
  return 0;
}
function nextBarPosition(): number {
  const next = Math.ceil(position() / BAR - 1e-9) * BAR;
  return next >= LOOP ? 0 : next;
}

export const music = {
  start(): void {
    if (!isMusicEnabled()) return;
    wanted = true;
    const graph = getAudioGraph(); if (!graph) return;
    if (state?.menu || state?.gameOver) return;
    if (loadedBuffer) { if (!source && !state?.menu) startSource(LOOP_START, restarting ? 0.3 : 2); return; }
    if (!bufferPromise) bufferPromise = loadMusic(graph.context).then((buffer) => { loadedBuffer = buffer; if (buffer && wanted && !state?.menu && !state?.gameOver) startSource(LOOP_START, 2); return buffer; });
  },
  stop(): void { wanted = false; stopSource(0.12); setPad(false, 0.12); },
  update(next: MusicState): void {
    if (!isMusicEnabled()) { if (source) stopSource(0.15); state = next; return; }
    applyState(next);
    if (!next.menu && ((!wanted) || (wanted && !loadedBuffer) || !bufferPromise)) this.start();
    const graph = getAudioGraph(); if (!graph) return;
    const at = graph.context.currentTime;
    if (source && !next.paused && !next.menu && !next.gameOver && restUntil < 0) {
      const elapsed = at - bedStartedAt;
      const loopEndAt = bedStartedAt + LOOP * 3;
      if (elapsed >= LOOP * 3 - 4) { const fade = Math.max(0, loopEndAt - at); restUntil = loopEndAt + 60; paramRamp(graph.bedGain.gain, 0, at, fade); try { source.stop(loopEndAt); } catch { /* already stopped */ } source = null; setPad(false, fade); }
    }
    if (restUntil > 0 && at >= restUntil && wanted && !next.paused && !next.menu && !next.gameOver) startSource(LOOP_START, 4);
    if (next.gameOver && gameOverAt >= 0 && at >= gameOverAt + 4 && source) stopSource(3);
    if (next.tier >= 4 && !next.paused && !next.menu && !next.gameOver && at >= nextTwinkleAt) { playTwinkle(at + 0.005); nextTwinkleAt = at + 0.3 + nextFloat(rng) * 0.4; }
  },
  setTier(value: number): void { if (state) this.update({ ...state, tier: Math.max(0, Math.min(4, Math.floor(value))) as MusicState['tier'] }); },
  setPaused(value: boolean): void { if (state) this.update({ ...state, paused: value }); },
  setGameOver(value: boolean): void { if (state) this.update({ ...state, gameOver: value }); },
  position(): number { return position(); },
  debugState(): string { return !wanted ? 'off' : state?.menu ? 'menu' : state?.gameOver ? 'game over' : state?.paused ? 'paused' : state?.danger ? 'danger' : state?.idle ? 'idle' : `tier ${state?.tier ?? 0}`; },
};

// spec-note: returning from a menu starts at the preceding bar boundary, which is the nearest complete musical phrase checkpoint.
export { nextBarPosition };
