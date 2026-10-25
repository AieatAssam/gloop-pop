import { getAudioGraph, scheduleAt } from './engine';
import { noise, tone } from './synth';

export const PENTATONIC = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760, 2093] as const;
export function noteFor(combo: number): number {
  return PENTATONIC[Math.min(Math.max(Math.floor(combo) - 1, 0), PENTATONIC.length - 1)] ?? PENTATONIC[0];
}
let rng = (typeof performance !== 'undefined' ? performance.now() : 1) | 0;
function random(): number {
  rng |= 0; rng = (rng + 0x6d2b79f5) | 0;
  let value = Math.imul(rng ^ (rng >>> 15), 1 | rng);
  value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}
let lastPopAt = -Infinity;
let popIndex = 0;
export function popVoiceDue(lastTime: number, now: number): boolean { return now - lastTime + 1e-9 >= 0.025; }
export function resetPopSequence(): void { popIndex = 0; }
export function lastPopVoiceTime(): number { return lastPopAt; }

export const sfx = {
  pickUp(): void { tone({ frequency: 620, endFrequency: 880, duration: 0.07, peak: 0.16 }); },
  snapTick(): void { tone({ frequency: 1568, duration: 0.012, peak: 0.032, attack: 0.001 }); },
  place(params: { cells?: number } = {}): void {
    const pitch = (0.96 + random() * 0.08) * (1 - 0.03 * Math.max(0, (params.cells ?? 1) - 1));
    tone({ frequency: 240 * pitch, endFrequency: 110 * pitch, duration: 0.09, peak: 0.42, attack: 0.002 });
    noise({ duration: 0.03, peak: 0.12, frequency: 900 });
  },
  returnToTray(): void { tone({ frequency: 330, endFrequency: 220, duration: 0.12, peak: 0.12, wave: 'triangle', attack: 0.005 }); },
  invalidHover(): void { /* Silent by design. */ },
  deal(): void { for (let i = 0; i < 3; i += 1) tone({ frequency: 1320, duration: 0.025, peak: 0.07, at: scheduleAt() + i * 0.06 }); },
  lineClear(params: { combo: number; lines?: number; tier?: number }): void {
    const count = Math.min(5, params.lines ?? 1); const start = Math.min(Math.max(Math.floor(params.combo) - 1, 0), 10);
    for (let i = 0; i < count; i += 1) {
      const at = scheduleAt() + i * 0.045;
      const freq = PENTATONIC[Math.min(10, start + i)] ?? PENTATONIC[10];
      tone({ frequency: freq, duration: 0.26, peak: 0.3, wave: 'triangle', attack: 0.004, at });
      tone({ frequency: freq * 1.25, duration: 0.2, peak: 0.08, at });
    }
    if (count > 0) noise({ duration: 0.12, peak: 0.063, filterType: 'bandpass', frequency: 3000, at: scheduleAt() });
  },
  comboHarmony(params: { combo: number; lineIndex?: number; delayMs?: number }): void {
    const lastRung = Math.min(10, Math.max(0, Math.floor(params.combo) - 1) + (params.lineIndex ?? 0));
    tone({ frequency: PENTATONIC[Math.min(10, lastRung + 2)]!, duration: 0.2, peak: 10 ** (-20 / 20), at: scheduleAt() + (params.delayMs ?? 0) / 1000 });
  },
  sparkle(params: { combo: number; lineIndex?: number; delayMs?: number }): void {
    const start = Math.min(10, Math.max(0, Math.floor(params.combo) - 1) + (params.lineIndex ?? 0)); const at = scheduleAt() + (params.delayMs ?? 0) / 1000;
    for (let ping = 0; ping < 4; ping += 1) tone({ frequency: PENTATONIC[Math.min(10, start + ping)]!, duration: 0.04, peak: 10 ** (-22 / 20), at: at + ping * 0.03 });
  },
  gloopPop(params: { index?: number; base?: number } = {}): void {
    const graph = getAudioGraph(); if (!graph) return;
    const index = params.index ?? popIndex;
    popIndex = Math.max(popIndex, index + 1);
    const now = graph.context.currentTime;
    if (!popVoiceDue(lastPopAt, now)) return;
    lastPopAt = now;
    const frequency = 380 * 2 ** (((params.base ?? 0) + Math.min(0.5 * index, 10)) / 12) * 2 ** ((random() * 20 - 10) / 1200);
    tone({ frequency, endFrequency: frequency * 1.6, duration: 0.07, peak: 0.2, attack: 0.002, filter: { type: 'bandpass', frequency, q: 4 } });
  },
  bigPop(params: { combo: number }): void { const at = scheduleAt(); [1, 1.5].forEach((ratio, i) => tone({ frequency: noteFor(params.combo) * ratio, duration: 0.09, peak: 0.18, wave: 'square', at: at + i * 0.09, filter: { type: 'lowpass', frequency: 2200 } })); },
  hugePop(params: { combo: number }): void { this.popArp(params.combo, [1, 1.25, 1.5]); },
  megaPop(params: { combo: number }): void { this.popArp(params.combo, [1, 1.25, 1.5, 2, 2.5]); },
  popArp(combo: number, ratios: number[]): void { const at = scheduleAt(); ratios.forEach((ratio, i) => tone({ frequency: noteFor(combo) * ratio, duration: 0.07, peak: 0.2, wave: 'square', at: at + i * 0.07, filter: { type: 'lowpass', frequency: 2600 } })); tone({ frequency: 90, endFrequency: 40, duration: 0.22, peak: 0.35, at }); },
  allClear(): void { const at = scheduleAt(); noise({ duration: 0.4, peak: 0.12, attack: 0.38, filterType: 'bandpass', frequency: 2000, endFrequency: 8000, at }); [523, 659, 784, 1047, 1319, 1568].forEach((frequency, i) => { const when = at + 0.4 + i * 0.06; tone({ frequency, duration: 0.22, peak: 0.24, wave: 'triangle', at: when }); tone({ frequency: frequency * 2, duration: 0.22, peak: 0.1, at: when }); }); },
  comboLost(): void { tone({ frequency: 440, endFrequency: 330, duration: 0.16, peak: 0.08 }); },
  stageUp(): void { tone({ frequency: 784, duration: 0.4, peak: 0.14 }); tone({ frequency: 1175, duration: 0.4, peak: 0.14 }); },
  newBest(): void { [784, 988, 1175, 1568].forEach((f, i) => tone({ frequency: f, duration: i === 3 ? 0.4 : 0.09, peak: 0.2, wave: 'square', at: scheduleAt() + i * 0.09, filter: { type: 'lowpass', frequency: 3000 } })); },
  stuck(): void { [392, 330, 262].forEach((f, i) => tone({ frequency: f, duration: 0.18, peak: 0.18, wave: 'triangle', at: scheduleAt() + i * 0.18 })); },
  rescue(): void { const at = scheduleAt(); noise({ duration: 0.3, peak: 0.16, at }); tone({ frequency: 523, duration: 0.15, peak: 0.2, at: at + 0.3 }); tone({ frequency: 659, duration: 0.15, peak: 0.2, at: at + 0.3 }); },
  uiTap(): void { tone({ frequency: 1200, duration: 0.025, peak: 0.08 }); },
  toggleOn(): void { tone({ frequency: 880, endFrequency: 1320, duration: 0.06, peak: 0.08 }); },
  toggleOff(): void { tone({ frequency: 1320, endFrequency: 880, duration: 0.06, peak: 0.08 }); },
  coinTick(params: { count?: number } = {}): void { for (let i = 0; i < Math.min(params.count ?? 1, 12); i += 1) { const at = scheduleAt() + i * 0.05; tone({ frequency: 1568, duration: 0.04, peak: 0.06, at }); tone({ frequency: 2093, duration: 0.04, peak: 0.06, at }); } },
  levelUp(): void { [523, 659, 784, 1047].forEach((f, i) => tone({ frequency: f, duration: 0.15, peak: 0.2, wave: 'triangle', at: scheduleAt() + i * 0.08 })); tone({ frequency: 2093, duration: 0.6, peak: 0.2, at: scheduleAt() + 0.32 }); },
  achievement(): void { tone({ frequency: 1319, duration: 0.9, peak: 0.14 }); tone({ frequency: 1976, duration: 0.9, peak: 0.042 }); },
};
