// SG §13.1: lazy WebAudio graph, separate buses, compressor, and a 24-voice SFX cap.
export interface AudioGraph {
  context: AudioContext;
  master: GainNode;
  sfxBus: GainNode;
  musicBus: GainNode;
  musicFilter: BiquadFilterNode;
}

let graph: AudioGraph | null = null;
let muted = false;
let sfxEnabled = true;
let musicEnabled = true;
const voices: AudioScheduledSourceNode[] = [];

export function getAudioGraph(): AudioGraph | null {
  return graph;
}

export function initAudioOnFirstInput(): AudioGraph | null {
  if (graph) {
    if (graph.context.state === 'suspended') void graph.context.resume();
    return graph;
  }
  if (typeof AudioContext === 'undefined') return null;
  const context = new AudioContext();
  const sfxBus = context.createGain();
  const musicBus = context.createGain();
  const musicFilter = context.createBiquadFilter();
  const master = context.createGain();
  const compressor = context.createDynamicsCompressor();
  sfxBus.gain.value = 0.9;
  musicBus.gain.value = 0.32;
  musicFilter.type = 'lowpass';
  musicFilter.frequency.value = 1200;
  master.gain.value = muted ? 0 : 0.8;
  compressor.threshold.value = -14;
  compressor.knee.value = 12;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.12;
  sfxBus.connect(master);
  musicBus.connect(musicFilter);
  musicFilter.connect(master);
  master.connect(compressor);
  compressor.connect(context.destination);
  graph = { context, master, sfxBus, musicBus, musicFilter };
  applyAudioSettings();
  void context.resume();
  return graph;
}

export function claimVoice(source: AudioScheduledSourceNode): void {
  while (voices.length >= 24) {
    const oldest = voices.shift();
    if (oldest) {
      try { oldest.stop(); } catch { /* Already ended. */ }
    }
  }
  voices.push(source);
  source.addEventListener('ended', () => {
    const index = voices.indexOf(source);
    if (index >= 0) voices.splice(index, 1);
  }, { once: true });
}

export function setMasterMuted(mutedValue: boolean): void {
  muted = mutedValue;
  applyAudioSettings();
}

export function toggleMasterMuted(): boolean {
  setMasterMuted(!muted);
  return muted;
}

export function setSfxEnabled(enabled: boolean): void {
  sfxEnabled = enabled;
  applyAudioSettings();
}

export function setMusicEnabled(enabled: boolean): void {
  musicEnabled = enabled;
  applyAudioSettings();
}

export function isMasterMuted(): boolean { return muted; }
export function isSfxEnabled(): boolean { return sfxEnabled; }
export function isMusicEnabled(): boolean { return musicEnabled; }

export function applyAudioSettings(): void {
  if (!graph) return;
  const now = graph.context.currentTime;
  graph.master.gain.setTargetAtTime(muted ? 0 : 0.8, now, 0.01);
  graph.sfxBus.gain.setTargetAtTime(sfxEnabled ? 0.9 : 0, now, 0.01);
  graph.musicBus.gain.setTargetAtTime(musicEnabled ? 0.32 : 0, now, 0.01);
}

export function scheduleAt(): number {
  return (graph?.context.currentTime ?? 0) + 0.005;
}

// spec-note: audio settings live for this page session until the app's save layer wires persistence.
