import { claimVoice, getAudioGraph, scheduleAt } from './engine';

export type Wave = OscillatorType;

// Separate cosmetic stream for generated noise; it never touches game RNG.
let noiseSeed = (typeof performance !== 'undefined' ? performance.now() : 1) | 0;
function noiseRandom(): number {
  noiseSeed = (noiseSeed + 0x6d2b79f5) | 0;
  let value = noiseSeed;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}

export function tone(options: { frequency: number; endFrequency?: number; duration: number; peak: number; wave?: Wave; bus?: 'sfx' | 'music'; at?: number; filter?: { type: BiquadFilterType; frequency: number; q?: number }; attack?: number; sustain?: number }): void {
  const graph = getAudioGraph();
  if (!graph) return;
  const { context } = graph;
  const at = options.at ?? scheduleAt();
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  oscillator.type = options.wave ?? 'sine';
  oscillator.frequency.setValueAtTime(Math.max(1, options.frequency), at);
  if (options.endFrequency !== undefined) oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, options.endFrequency), at + options.duration);
  const attack = options.attack ?? 0.003;
  envelope.gain.setValueAtTime(0.0001, at);
  envelope.gain.linearRampToValueAtTime(options.peak, at + attack);
  if (options.sustain && options.duration > attack) {
    envelope.gain.setValueAtTime(options.peak * options.sustain, at + options.duration * 0.35);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + options.duration);
  } else {
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + options.duration);
  }
  if (options.filter) {
    const filter = context.createBiquadFilter();
    filter.type = options.filter.type;
    filter.frequency.value = options.filter.frequency;
    filter.Q.value = options.filter.q ?? 1;
    oscillator.connect(filter);
    filter.connect(envelope);
  } else oscillator.connect(envelope);
  envelope.connect(options.bus === 'music' ? graph.musicBus : graph.sfxBus);
  claimVoice(oscillator);
  oscillator.start(at);
  oscillator.stop(at + options.duration + 0.01);
}

export function noise(options: { duration: number; peak: number; bus?: 'sfx' | 'music'; at?: number; filterType?: BiquadFilterType; frequency?: number; endFrequency?: number; q?: number }): void {
  const graph = getAudioGraph();
  if (!graph) return;
  const { context } = graph;
  const at = options.at ?? scheduleAt();
  const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * options.duration), context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = noiseRandom() * 2 - 1;
  const source = context.createBufferSource();
  source.buffer = buffer;
  const envelope = context.createGain();
  envelope.gain.setValueAtTime(0.0001, at);
  envelope.gain.linearRampToValueAtTime(options.peak, at + Math.min(0.005, options.duration / 4));
  envelope.gain.exponentialRampToValueAtTime(0.0001, at + options.duration);
  const filter = context.createBiquadFilter();
  filter.type = options.filterType ?? 'lowpass';
  filter.frequency.setValueAtTime(options.frequency ?? 900, at);
  if (options.endFrequency !== undefined) filter.frequency.linearRampToValueAtTime(options.endFrequency, at + options.duration);
  filter.Q.value = options.q ?? 0.7;
  source.connect(filter);
  filter.connect(envelope);
  envelope.connect(options.bus === 'music' ? graph.musicBus : graph.sfxBus);
  claimVoice(source);
  source.start(at);
  source.stop(at + options.duration + 0.01);
}
