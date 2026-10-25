import { getAudioGraph, isMusicEnabled } from './engine';
import { loadMusic } from './loader';
import { AUDIO_MANIFEST } from './manifest';
import { noise, tone } from './synth';

export type MusicTier = 0 | 1 | 2 | 3 | 4;
const BPM = 84;
const BEAT = 60 / BPM;
const CHORDS = [
  { root: 65.41, keys: [261.63, 329.63, 392, 493.88], arp: [261.63, 329.63, 392, 493.88] },
  { root: 55, keys: [261.63, 329.63, 392, 440], arp: [220, 261.63, 329.63, 392] },
  { root: 43.65, keys: [261.63, 349.23, 392, 440], arp: [174.61, 261.63, 349.23, 392] },
  { root: 49, keys: [246.94, 293.66, 392, 440], arp: [196, 246.94, 293.66, 392] },
] as const;
let timer: ReturnType<typeof setInterval> | null = null;
let running = false;
let paused = false;
let gameOver = false;
let tier: MusicTier = 0;
let cursor = 0;
let nextAt = 0;
let bedSource: AudioBufferSourceNode | null = null;

export const music = {
  start(): void {
    if (!isMusicEnabled()) return;
    const graph = getAudioGraph();
    if (!graph || running) return;
    running = true;
    cursor = 0;
    nextAt = graph.context.currentTime + 0.05;
    timer = setInterval(schedule, 25);
    void loadMusic(graph.context).then((buffer) => {
      if (!buffer || !running || !isMusicEnabled()) return;
      if (timer !== null) clearInterval(timer);
      timer = null;
      const source = graph.context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.loopStart = AUDIO_MANIFEST.music.loopStart;
      source.loopEnd = AUDIO_MANIFEST.music.loopEnd;
      source.connect(graph.musicBus);
      source.start(graph.context.currentTime + 0.01, AUDIO_MANIFEST.music.loopStart);
      bedSource = source;
    });
  },
  stop(): void {
    if (timer !== null) clearInterval(timer);
    timer = null;
    running = false;
    if (bedSource) { try { bedSource.stop(); } catch { /* Already ended. */ } }
    bedSource = null;
  },
  setTier(value: MusicTier): void {
    tier = Math.max(0, Math.min(4, Math.floor(value))) as MusicTier;
    const graph = getAudioGraph(); if (!graph) return;
    graph.musicFilter.frequency.setTargetAtTime(tier >= 3 ? 5000 : 1200, graph.context.currentTime, 0.6);
  },
  setPaused(value: boolean): void { paused = value; applyDuck(); },
  setGameOver(value: boolean): void { gameOver = value; applyDuck(); },
};

function applyDuck(): void {
  const graph = getAudioGraph(); if (!graph) return;
  const now = graph.context.currentTime;
  graph.musicFilter.frequency.setTargetAtTime(paused ? 400 : gameOver ? 600 : tier >= 3 ? 5000 : 1200, now, 0.2);
  graph.musicBus.gain.setTargetAtTime(paused ? 0.16 : 0.32, now, 0.05);
}

function schedule(): void {
  const graph = getAudioGraph(); if (!graph || !running || paused || gameOver) return;
  // SG §13.3 lookahead: schedule through AudioContext time, 120 ms in advance.
  while (nextAt < graph.context.currentTime + 0.12) {
    const step = cursor % 32;
    const bar = Math.floor(step / 8) % 4;
    const beat = step % 8;
    const chord = CHORDS[bar] ?? CHORDS[0];
    const barStart = step % 8 === 0;
    if (barStart || beat === 3) {
      for (const frequency of chord.keys) {
        tone({ frequency, duration: 0.9, peak: 0.075, bus: 'music', at: nextAt, sustain: 0.35 });
        tone({ frequency: frequency * 2, duration: 0.9, peak: 0.019, wave: 'triangle', bus: 'music', at: nextAt, sustain: 0.35 });
      }
    }
    if (beat === 0 || beat === 4) {
      tone({ frequency: chord.root, duration: 0.3, peak: 0.35, bus: 'music', at: nextAt, sustain: 0.4 });
      tone({ frequency: 120, endFrequency: 45, duration: 0.12, peak: 0.4, bus: 'music', at: nextAt });
    }
    noise({ duration: 0.03, peak: beat % 2 === 0 ? 0.04 : 0.06, bus: 'music', at: nextAt, filterType: 'highpass', frequency: 7000 });
    if (tier >= 4) {
      const note = chord.arp[(beat / 2) % chord.arp.length] ?? chord.arp[0];
      tone({ frequency: note * 2, duration: 0.04, peak: 0.06, wave: 'triangle', bus: 'music', at: nextAt });
    }
    cursor += 1;
    nextAt += BEAT / 2;
  }
}
// spec-note: the stated 4-bar harmonic loop is scheduled on eighth-note slots; hats follow the specified 8th-note pulse.
