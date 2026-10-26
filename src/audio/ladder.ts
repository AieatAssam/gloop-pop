import { claimVoice, getAudioGraph, scheduleAt, traceAudioCall } from './engine';
import { getSegmentBuffer } from './loader';
import type { CosmeticRandom } from './voices';
import { createRng, nextFloat } from '../core/rng';

const cosmeticRng = createRng(String(typeof performance === 'undefined' ? 1 : performance.now()));
const cosmeticRandom = (): number => nextFloat(cosmeticRng);

// SG §13.3 C major pentatonic ladder, C5 through C7.
export const rungMidi = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93, 96] as const;
export function rungFor(combo: number, lineIndex = 0): number {
  const first = Math.max(0, Math.min(10, Math.floor(combo) - 1));
  return Math.min(first + Math.max(0, Math.floor(lineIndex)), 10);
}
export function voicedLineCount(lines: number): number { return Math.min(5, Math.max(0, Math.floor(lines))); }
export function freq(midi: number): number { return 440 * 2 ** ((midi - 69) / 12); }
export function rate(semitones: number, rootMidi: number): number { return 2 ** ((semitones - rootMidi) / 12); }
export function foldRate(semitones: number, rootMidi: number): number {
  const delta = semitones - rootMidi;
  const folded = delta - 12 * Math.round(delta / 12);
  return 2 ** (folded / 12);
}
export function rungRate(rung: number): number { return foldRate((rungMidi[Math.max(0, Math.min(10, Math.floor(rung)))] ?? 72) + 24, 95); }

export function playCandyBar(rung: number, at = scheduleAt(), variation = 1, bodyDb = -10, tinkDb = -14, priority: 'ladder' | 'stinger' = 'ladder', random: CosmeticRandom = cosmeticRandom): void {
  const graph = getAudioGraph();
  if (!graph) return;
  let granted = false;
  const midi = rungMidi[Math.max(0, Math.min(10, Math.floor(rung)))] ?? 72;
  const pitchVariation = 2 ** (((random() * 2 - 1) * 3) / 1200);
  const gainVariation = 10 ** (((random() * 2 - 1) * 1) / 20);
  const fundamental = freq(midi) * variation * pitchVariation;
  const playPartial = (frequency: number, gain: number, decay: number): void => {
    const oscillator = graph.context.createOscillator();
    const envelope = graph.context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, at);
    envelope.gain.setValueAtTime(0.0001, at);
    envelope.gain.linearRampToValueAtTime(gain, at + 0.002);
    envelope.gain.exponentialRampToValueAtTime(0.001, at + decay);
    oscillator.connect(envelope);
    envelope.connect(graph.sfxBus);
    if (!claimVoice(oscillator, priority, envelope, at, at + decay + 0.01)) return;
    granted = true;
    oscillator.start(at);
    oscillator.stop(at + decay + 0.01);
  };
  const bodyGain = 10 ** ((bodyDb + 10) / 20) * gainVariation;
  playPartial(fundamental, 0.316 * bodyGain * variation, 0.26);
  playPartial(fundamental * 4, 0.079 * bodyGain, 0.09);
  if (fundamental * 10 < 12000) playPartial(fundamental * 10, 0.025 * bodyGain, 0.035);

  const tinkBuffer = getSegmentBuffer('tink');
  if (!tinkBuffer) {
    traceAudioCall(at, 'playCandyBar', `rung:${Math.max(0, Math.min(10, Math.floor(rung)))}`, bodyDb, 'sfx', granted);
    return;
  }
  const source = graph.context.createBufferSource();
  const gain = graph.context.createGain();
  source.buffer = tinkBuffer;
  source.playbackRate.setValueAtTime(rungRate(rung) * pitchVariation, at);
  gain.gain.setValueAtTime(10 ** (tinkDb / 20) * gainVariation, at);
  source.connect(gain);
  gain.connect(graph.sfxBus);
  if (!claimVoice(source, priority, gain, at, at + tinkBuffer.duration / (rungRate(rung) * pitchVariation))) {
    traceAudioCall(at, 'playCandyBar', `rung:${Math.max(0, Math.min(10, Math.floor(rung)))}`, bodyDb, 'sfx', granted);
    return;
  }
  granted = true;
  source.start(at);
  traceAudioCall(at, 'playCandyBar', `rung:${Math.max(0, Math.min(10, Math.floor(rung)))}`, bodyDb, 'sfx', granted);
}
