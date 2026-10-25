// The v1 sound recipes remain the fallback until the sprite's matching segment is decoded.
import { PENTATONIC, popVoiceDue, sfx as fallbackSfx } from './fallback';
import { playSegment } from './loader';
import { getAudioGraph, scheduleAt } from './engine';
import { noise, tone } from './synth';
import { playCandyBar, rungFor, rungRate, voicedLineCount } from './ladder';
import { coinTicksForCount, voiceDue, type RateLimiter } from './voices';

export { PENTATONIC, lastPopVoiceTime, noteFor, popVoiceDue, resetPopSequence } from './fallback';

export const sfx = {
  ...fallbackSfx,
  snapTick(): void {
    const now = getAudioGraph()?.context.currentTime ?? 0;
    if (!voiceDue(snapLimiter, now)) return;
    fallbackSfx.snapTick();
  },
  uiTap(): void {
    const now = getAudioGraph()?.context.currentTime ?? 0;
    if (!voiceDue(uiLimiter, now)) return;
    if (!playSegment('tap', { group: 'ui', priority: 'ui', gain: 10 ** (-18 / 20), rateVariation: 0.03 })) fallbackSfx.uiTap();
  },
  deal(): void {
    const at = scheduleAt();
    let allReady = true;
    for (let slot = 0; slot < 3; slot += 1) allReady = playSegment('deal1', { at: at + slot * 0.06, group: 'deal', variants: 3, priority: 'deal', gain: 10 ** (-20 / 20), rateVariation: 0.05, gainDbVariation: 1 }) && allReady;
    if (!allReady) fallbackSfx.deal();
  },
  place(params: { cells?: number } = {}): void {
    const now = getAudioGraph()?.context.currentTime;
    if (now !== undefined && !voiceDue(placeLimiter, now)) return;
    const cells = Math.max(1, params.cells ?? 1);
    const rate = 2 ** (-0.6 * (cells - 1) / 12);
    if (playSegment('place1', { group: 'place', variants: 5, priority: 'place', rate, rateVariation: 0.04, gain: 10 ** (-8 / 20), gainDbVariation: 1.5 })) return;
    fallbackSfx.place(params);
  },
  gooPop(params: { gainDb?: number; subGainDb?: number; rate?: number; delay?: number; sub?: boolean } = {}): void {
    const at = scheduleAt() + (params.delay ?? 0);
    if (params.sub && !playSegment('sub', { at, group: 'pop', priority: 'pop', gain: 10 ** ((params.subGainDb ?? -10) / 20) })) tone({ frequency: 70, endFrequency: 45, duration: 0.22, peak: 10 ** ((params.subGainDb ?? -10) / 20), at, priority: 'pop' });
    if (playSegment('goo', { at, group: 'pop', priority: 'pop', gain: 10 ** ((params.gainDb ?? -12) / 20), rate: params.rate ?? 1, rateVariation: 0.03 })) return;
    fallbackSfx.gloopPop({ at, gainDb: params.gainDb });
  },
  gloopPop(params: { index?: number; base?: number; at?: number; gainDb?: number } = {}): void {
    const index = params.index ?? 0; const base = params.base ?? 0;
    const rate = 2 ** ((base + Math.min(0.5 * index, 10)) / 12);
    const now = getAudioGraph()?.context.currentTime;
    if (now !== undefined) { if (!popVoiceDue(lastPopVoiceAt, now)) return; lastPopVoiceAt = now; }
    const at = params.at ?? scheduleAt();
    if (playSegment('pop1', { at, group: 'pop', variants: 6, priority: 'pop', gain: 10 ** ((params.gainDb ?? -12) / 20), rate, rateVariation: 0.03, gainDbVariation: 1.5 })) return;
    fallbackSfx.gloopPop({ index, base, at });
  },
  zenShake(): void {
    const at = scheduleAt();
    for (let i = 0; i < 3; i += 1) {
      const when = at + i * 0.04;
      if (!playSegment('pop1', { at: when, group: 'pop', variants: 6, priority: 'pop', gain: 10 ** (-12 / 20) })) fallbackSfx.gloopPop({ index: i, at: when });
    }
  },
  lineClear(params: { combo: number; lines?: number; tier?: number }): void {
    const graph = getAudioGraph();
    if (!graph) { fallbackSfx.lineClear(params); return; }
    const count = voicedLineCount(params.lines ?? 1); const at = scheduleAt();
    for (let i = 0; i < count; i += 1) playCandyBar(rungFor(params.combo, i), at + i * 0.045, 1, -10, -14);
    if (count) noise({ duration: 0.12, peak: 10 ** (-24 / 20), filterType: 'bandpass', frequency: 3000, q: 0.7, at, priority: 'ladder' });
  },
  sparkle(params: { combo: number; lineIndex?: number; delayMs?: number }): void {
    const first = rungFor(params.combo, params.lineIndex ?? 0); const at = scheduleAt() + (params.delayMs ?? 0) / 1000;
    for (let i = 0; i < 4; i += 1) {
      const rung = Math.min(10, first + i); const when = at + i * 0.03;
      if (!playSegment('tink', { at: when, group: 'sparkle', priority: 'ladder', gain: 10 ** (-22 / 20), rate: rungRate(rung), rateVariation: 2 ** (3 / 1200) - 1 })) tone({ frequency: PENTATONIC[rung]!, duration: 0.04, peak: 10 ** (-22 / 20), at: when, priority: 'ladder' });
    }
  },
  bigPop(params: { combo: number }): void { playLadderRun(params.combo, 2, 90, -14, -18); },
  hugePop(params: { combo: number }): void { playLadderRun(params.combo, 3, 70, -12, -16); },
  stageUp(): void { if (!playSegment('stage', { group: 'ladder', priority: 'ladder', gain: 10 ** (-12 / 20) })) fallbackSfx.stageUp(); },
  levelUp(): void { if (!playSegment('level', { group: 'ladder', priority: 'ladder', gain: 10 ** (-8 / 20) })) fallbackSfx.levelUp(); },
  achievement(): void { if (!playSegment('ach', { group: 'ladder', priority: 'ladder', gain: 10 ** (-10 / 20) })) fallbackSfx.achievement(); },
  rescueReady(): void { if (!playSegment('chime', { group: 'ladder', priority: 'ladder', gain: 10 ** (-18 / 20) })) tone({ frequency: 2093, duration: 0.28, peak: 10 ** (-18 / 20), priority: 'ladder' }); },
  chime(params: { gainDb?: number } = {}): void { const gain = 10 ** ((params.gainDb ?? -14) / 20); if (!playSegment('chime', { group: 'ladder', priority: 'ladder', gain })) tone({ frequency: 2093, duration: 0.28, peak: gain, priority: 'ladder' }); },
  rescue(): void {
    const at = scheduleAt();
    const swell = playSegment('swell', { at, group: 'rescue', priority: 'ladder', gain: 10 ** (-12 / 20) });
    const pop = playSegment('pop1', { at: at + 0.35, group: 'pop', variants: 6, priority: 'pop', gain: 10 ** (-10 / 20) });
    const chime = playSegment('chime', { at: at + 0.35, group: 'ladder', priority: 'ladder', gain: 10 ** (-10 / 20) });
    if (!swell || !pop || !chime) fallbackSfx.rescue();
  },
  newBest(): void { if (!playSegment('best', { group: 'stinger', priority: 'stinger', gain: 10 ** (-6 / 20) })) fallbackSfx.newBest(); },
  levelBest(): void { if (!playSegment('best', { group: 'stinger', priority: 'stinger', gain: 10 ** (-10 / 20) })) fallbackSfx.newBest(); },
  megaStinger(params: { combo: number }): void {
    const start = Math.min(Math.max(Math.floor(params.combo) - 1, 0), 5); const at = scheduleAt();
    for (let i = 0; i < 6; i += 1) playCandyBar(Math.min(10, start + i), at + i * 0.045, 1, -13, -17, 'stinger');
    tone({ frequency: PENTATONIC[Math.min(10, start + 5)]!, duration: 0.6, peak: 10 ** (-13 / 20), at: at + 0.225, tremolo: { frequency: 5, depth: 0.15 }, priority: 'stinger' });
    tone({ frequency: PENTATONIC[Math.min(10, start + 5)]!, duration: 0.6, peak: 10 ** (-19 / 20), at: at + 0.27, tremolo: { frequency: 5, depth: 0.15 }, priority: 'stinger' });
    tone({ frequency: PENTATONIC[Math.min(10, start + 3)]!, duration: 0.6, peak: 10 ** (-19 / 20), at: at + 0.27, tremolo: { frequency: 5, depth: 0.15 }, priority: 'stinger' });
  },
  allClearStinger(): void {
    const at = scheduleAt(); for (let rung = 0; rung <= 10; rung += 1) playCandyBar(rung, at + rung * 0.03, 1, -10, -14, 'stinger');
    for (const rung of [5, 7, 8]) {
      tone({ frequency: PENTATONIC[rung]!, duration: 0.9, peak: 10 ** (-14 / 20), at: at + 0.33, tremolo: { frequency: 5, depth: 0.15 }, priority: 'stinger' });
    }
  },
  coinTick(params: { count?: number; gainDb?: number } = {}): void {
    const count = coinTicksForCount(params.count ?? 1); const at = scheduleAt();
    for (let i = 0; i < count; i += 1) {
      const when = at + i * 0.05;
      if (!playSegment('coin1', { at: when, group: 'coin', variants: 4, priority: 'coin', gain: 10 ** ((params.gainDb ?? -20) / 20), rateVariation: 0.04, gainDbVariation: 1 })) fallbackSfx.coinTick({ count: 1 });
      tone({ frequency: 1568, duration: 0.04, peak: 10 ** (-26 / 20), at: when, priority: 'coin' });
      tone({ frequency: 2093, duration: 0.04, peak: 10 ** (-26 / 20), at: when, priority: 'coin' });
    }
  },
  toggleOn(): void { fallbackSfx.toggleOn(); this.uiTap(); },
};

let lastPopVoiceAt = -Infinity;
const snapLimiter: RateLimiter = { lastAt: -Infinity, interval: 0.12 };
const uiLimiter: RateLimiter = { lastAt: -Infinity, interval: 0.05 };
const placeLimiter: RateLimiter = { lastAt: -Infinity, interval: 0.04 };

function playLadderRun(combo: number, notes: number, spacingMs: number, bodyDb: number, tinkDb: number): void {
  const start = Math.min(notes === 2 ? 8 : 6, Math.max(0, Math.floor(combo) - 1)); const at = scheduleAt();
  for (let i = 0; i < notes; i += 1) {
    const rung = Math.min(10, start + 2 * i); const when = at + i * spacingMs / 1000;
    playCandyBar(rung, when, 1, bodyDb, tinkDb);
  }
}
