// The v1 sound recipes remain the fallback until the sprite's matching segment is decoded.
import { PENTATONIC, popVoiceDue, sfx as fallbackSfx } from './fallback';
import { playSegment } from './loader';
import { getAudioGraph, scheduleAt } from './engine';
import { tone } from './synth';

export { PENTATONIC, lastPopVoiceTime, noteFor, popVoiceDue, resetPopSequence } from './fallback';

export const sfx = {
  ...fallbackSfx,
  snapTick(): void {
    const now = getAudioGraph()?.context.currentTime ?? 0;
    if (now - lastSnapAt < 0.12) return;
    lastSnapAt = now; fallbackSfx.snapTick();
  },
  uiTap(): void {
    const now = getAudioGraph()?.context.currentTime ?? 0;
    if (now - lastUiTapAt < 0.05) return;
    lastUiTapAt = now;
    if (!playSegment('tap', { group: 'ui', priority: 'ui', gain: 10 ** (-18 / 20), rateVariation: 0.03 })) fallbackSfx.uiTap();
  },
  deal(): void {
    const at = scheduleAt();
    const ids = ['deal1', 'deal2', 'deal3'] as const;
    let allReady = true;
    for (let slot = 0; slot < ids.length; slot += 1) allReady = playSegment(ids[slot]!, { at: at + slot * 0.06, group: 'deal', priority: 'deal', gain: 10 ** (-20 / 20), rateVariation: 0.05, gainDbVariation: 1 }) && allReady;
    if (!allReady) fallbackSfx.deal();
  },
  place(params: { cells?: number } = {}): void {
    const cells = Math.max(1, params.cells ?? 1);
    const rate = 2 ** (-0.6 * (cells - 1) / 12);
    if (playSegment('place1', { group: 'place', variants: 5, priority: 'place', rate, rateVariation: 0.04, gain: 10 ** (-8 / 20), gainDbVariation: 1.5 })) return;
    fallbackSfx.place(params);
  },
  gooPop(params: { gainDb?: number; rate?: number; delay?: number } = {}): void {
    if (playSegment('goo', { at: scheduleAt() + (params.delay ?? 0), group: 'pop', priority: 'pop', gain: 10 ** ((params.gainDb ?? -12) / 20), rate: params.rate ?? 1, rateVariation: 0.03 })) return;
    fallbackSfx.gloopPop();
  },
  gloopPop(params: { index?: number; base?: number } = {}): void {
    const index = params.index ?? 0; const base = params.base ?? 0;
    const rate = 2 ** ((base + Math.min(0.5 * index, 10)) / 12);
    const now = getAudioGraph()?.context.currentTime;
    if (now !== undefined) { if (!popVoiceDue(lastPopVoiceAt, now)) return; lastPopVoiceAt = now; }
    if (playSegment(`pop${(index % 6) + 1}` as 'pop1' | 'pop2' | 'pop3' | 'pop4' | 'pop5' | 'pop6', { at: scheduleAt(), group: 'pop', priority: 'pop', gain: 10 ** (-12 / 20), rate, rateVariation: 0.03, gainDbVariation: 1.5 })) return;
    fallbackSfx.gloopPop({ index, base });
  },
  lineClear(params: { combo: number; lines?: number; tier?: number }): void {
    fallbackSfx.lineClear(params);
    const rungs = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93, 96] as const;
    const tinkRates = [1.0595, 1.1892, 1.3348, 0.7937, 0.8909, 1.0595, 1.1892, 1.3348, 0.7937, 0.8909, 1.0595] as const;
    const r0 = Math.min(10, Math.max(0, Math.floor(params.combo) - 1)); const at = scheduleAt();
    for (let i = 0; i < Math.min(5, params.lines ?? 1); i += 1) { const rung = Math.min(10, r0 + i); const delta = rungs[rung]! + 24 - 95; const semitone = delta - 12 * Math.round(delta / 12); const rate = tinkRates[rung]! * 2 ** (semitone / 12); playSegment('tink', { at: at + i * 0.045, group: 'ladder', priority: 'ladder', gain: 10 ** (-14 / 20), rate, rateVariation: 2 ** (3 / 1200) - 1 }); }
  },
  bigPop(params: { combo: number }): void { playLadderRun(params.combo, 2, 90, -14, -18); },
  hugePop(params: { combo: number }): void { playLadderRun(params.combo, 3, 70, -12, -16); },
  stageUp(): void { if (!playSegment('stage', { group: 'ladder', priority: 'ladder', gain: 10 ** (-12 / 20) })) fallbackSfx.stageUp(); },
  newBest(): void { if (!playSegment('best', { group: 'stinger', priority: 'stinger', gain: 10 ** (-6 / 20) })) fallbackSfx.newBest(); },
  megaStinger(params: { combo: number }): void {
    const start = Math.min(Math.max(Math.floor(params.combo) - 1, 0), 5); const at = scheduleAt();
    for (let i = 0; i < 6; i += 1) { const rung = Math.min(10, start + i); tone({ frequency: PENTATONIC[rung]!, duration: i === 5 ? 0.6 : 0.24, peak: 10 ** (-10 / 20), attack: 0.002, at: at + i * 0.045 }); playSegment('tink', { at: at + i * 0.045, group: 'stinger', priority: 'stinger', gain: 10 ** (-14 / 20) }); }
    tone({ frequency: PENTATONIC[Math.min(10, start + 5)]!, duration: 0.6, peak: 10 ** (-16 / 20), at: at + 0.27 }); tone({ frequency: PENTATONIC[Math.min(10, start + 3)]!, duration: 0.6, peak: 10 ** (-16 / 20), at: at + 0.27 });
  },
  allClearStinger(): void {
    const at = scheduleAt(); for (let rung = 0; rung <= 10; rung += 1) { tone({ frequency: PENTATONIC[rung]!, duration: 0.24, peak: 10 ** (-10 / 20), at: at + rung * 0.03 }); playSegment('tink', { at: at + rung * 0.03, group: 'stinger', priority: 'stinger', gain: 10 ** (-14 / 20) }); }
    for (const rung of [5, 7, 8]) tone({ frequency: PENTATONIC[rung]!, duration: 0.9, peak: 10 ** (-14 / 20), at: at + 0.33 });
  },
  toggleOn(): void { fallbackSfx.toggleOn(); this.uiTap(); },
};

let lastSnapAt = -Infinity;
let lastUiTapAt = -Infinity;
let lastPopVoiceAt = -Infinity;

function playLadderRun(combo: number, notes: number, spacingMs: number, bodyDb: number, tinkDb: number): void {
  const rungs = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93, 96] as const;
  const rates = [1.0595, 1.1892, 1.3348, 0.7937, 0.8909, 1.0595, 1.1892, 1.3348, 0.7937, 0.8909, 1.0595] as const;
  const start = Math.min(notes === 2 ? 8 : 6, Math.max(0, Math.floor(combo) - 1)); const at = scheduleAt();
  for (let i = 0; i < notes; i += 1) {
    const rung = Math.min(10, start + 2 * i); const when = at + i * spacingMs / 1000;
    tone({ frequency: PENTATONIC[rung]!, duration: 0.26, peak: 10 ** (bodyDb / 20), attack: 0.002, at: when });
    const delta = rungs[rung]! + 24 - 95; const semitone = delta - 12 * Math.round(delta / 12);
    playSegment('tink', { at: when, group: 'ladder', priority: 'ladder', gain: 10 ** (tinkDb / 20), rate: rates[rung]! * 2 ** (semitone / 12) });
  }
}
