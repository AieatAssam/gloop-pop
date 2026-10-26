import { claimVoice, getAudioGraph, scheduleAt, traceAudioCall, type VoicePriority } from './engine';

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

export function tone(options: { frequency: number; endFrequency?: number; duration: number; peak: number; wave?: Wave; bus?: 'sfx' | 'music'; at?: number; filter?: { type: BiquadFilterType; frequency: number; q?: number }; attack?: number; sustain?: number; tremolo?: { frequency: number; depth: number }; priority?: VoicePriority }): void {
  const graph = getAudioGraph();
  if (!graph) return;
  const { context } = graph;
  const at = safeTime(context, options.at);
  const trace = (granted: boolean): void => traceAudioCall(at, 'tone', `${options.wave ?? 'sine'}:${Math.round(options.frequency)}Hz`, 20 * Math.log10(options.peak), options.bus ?? 'sfx', granted);
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
  let tremoloGain: GainNode | undefined;
  if (options.tremolo) {
    tremoloGain = context.createGain(); tremoloGain.gain.value = 1;
    envelope.connect(tremoloGain);
    tremoloGain.connect(options.bus === 'music' ? graph.layerGain : graph.sfxBus);
  } else envelope.connect(options.bus === 'music' ? graph.layerGain : graph.sfxBus);
  if (!claimVoice(oscillator, options.priority ?? 'ladder', envelope, at, at + options.duration + 0.01)) { trace(false); return; }
  if (options.tremolo && tremoloGain) {
    const lfo = context.createOscillator(); const depth = context.createGain();
    lfo.frequency.value = options.tremolo.frequency; depth.gain.value = options.tremolo.depth;
    lfo.connect(depth); depth.connect(tremoloGain.gain);
    // spec-note: If only the optional LFO is denied, keep the already-claimed tone audible without tremolo.
    if (claimVoice(lfo, options.priority ?? 'ladder', undefined, at, at + options.duration + 0.01)) {
      lfo.start(at); lfo.stop(at + options.duration + 0.01);
    }
  }
  oscillator.start(at);
  oscillator.stop(at + options.duration + 0.01);
  trace(true);
}

export function noise(options: { duration: number; peak: number; bus?: 'sfx' | 'music'; at?: number; attack?: number; filterType?: BiquadFilterType; frequency?: number; endFrequency?: number; q?: number; priority?: VoicePriority }): void {
  const graph = getAudioGraph();
  if (!graph) return;
  const { context } = graph;
  const at = safeTime(context, options.at);
  const source = context.createBufferSource();
  source.buffer = graph.noiseBuffer;
  const envelope = context.createGain();
  envelope.gain.setValueAtTime(0.0001, at);
  envelope.gain.linearRampToValueAtTime(options.peak, at + Math.min(options.attack ?? 0.005, options.duration * 0.95));
  envelope.gain.exponentialRampToValueAtTime(0.0001, at + options.duration);
  const filter = context.createBiquadFilter();
  filter.type = options.filterType ?? 'lowpass';
  filter.frequency.setValueAtTime(options.frequency ?? 900, at);
  if (options.endFrequency !== undefined) filter.frequency.linearRampToValueAtTime(options.endFrequency, at + options.duration);
  filter.Q.value = options.q ?? 0.7;
  source.connect(filter);
  filter.connect(envelope);
  envelope.connect(options.bus === 'music' ? graph.layerGain : graph.sfxBus);
  if (!claimVoice(source, options.priority ?? 'ladder', envelope, at, at + options.duration)) {
    traceAudioCall(at, 'tone', `noise:${Math.round(options.frequency ?? 900)}Hz`, 20 * Math.log10(options.peak), options.bus ?? 'sfx', false);
    return;
  }
  source.start(at, noiseRandom() * Math.max(0, 1 - options.duration), options.duration);
  source.stop(at + options.duration + 0.01);
  traceAudioCall(at, 'tone', `noise:${Math.round(options.frequency ?? 900)}Hz`, 20 * Math.log10(options.peak), options.bus ?? 'sfx', true);
}

// WebAudio throws on negative or non-finite times, so every scheduled time is clamped to "now or later".
export function safeTime(context: BaseAudioContext, at: number | undefined): number {
  const now = context.currentTime;
  const value = at ?? scheduleAt();
  return Number.isFinite(value) ? Math.max(now, value) : now;
}
