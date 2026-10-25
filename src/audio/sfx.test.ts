import { afterEach, describe, expect, it, vi } from 'vitest';

const fixture = vi.hoisted(() => ({
  audioGraph: null as { context: { currentTime: number } } | null,
  playSegment: vi.fn((id: string, options?: { at?: number; variants?: number; group?: string; gain?: number }) => { void id; void options; return true; }),
  playCandyBar: vi.fn((rung: number, at: number, rate: number, body: number, tink: number, priority?: string) => { void rung; void at; void rate; void body; void tink; void priority; }),
  tone: vi.fn((options: { peak: number }) => { void options; }),
}));
vi.mock('./engine', () => ({ getAudioGraph: () => fixture.audioGraph, scheduleAt: () => 0.005 }));
vi.mock('./loader', () => ({ playSegment: fixture.playSegment, getSegmentBuffer: () => null }));
vi.mock('./ladder', () => ({ playCandyBar: fixture.playCandyBar, rungFor: () => 0, rungRate: () => 1, voicedLineCount: (n: number) => n }));
vi.mock('./synth', () => ({ tone: fixture.tone, noise: vi.fn() }));

import { noteFor, popVoiceDue, sfx } from './sfx';

afterEach(() => {
  fixture.audioGraph = null;
  fixture.playSegment.mockClear();
  fixture.playCandyBar.mockClear(); fixture.tone.mockClear();
  vi.resetModules();
});

describe('sample event mapping', () => {
  it('maps combo to the capped C major pentatonic ladder and rate limits gloop pops', () => {
    expect(noteFor(1)).toBe(523.25);
    expect(noteFor(2)).toBe(587.33);
    expect(noteFor(11)).toBe(2093);
    expect(noteFor(19)).toBe(2093);
    expect(popVoiceDue(2, 2.024)).toBe(false);
    expect(popVoiceDue(2, 2.025)).toBe(true);
  });

  it('coalesces simultaneous achievement unlocks to one segment and rate limits reward cues', () => {
    vi.useFakeTimers();
    sfx.levelUp();
    for (let unlock = 0; unlock < 14; unlock += 1) sfx.achievement();
    expect(fixture.playSegment).toHaveBeenNthCalledWith(1, 'level', {
      group: 'ladder', priority: 'ladder', gain: 10 ** (-8 / 20),
    });
    expect(fixture.playSegment).toHaveBeenNthCalledWith(2, 'ach', {
      group: 'ladder', priority: 'ladder', gain: 10 ** (-10 / 20),
    });
    expect(fixture.playSegment.mock.calls.filter(([id]) => id === 'ach')).toHaveLength(1);
    vi.advanceTimersByTime(1499);
    sfx.achievement();
    expect(fixture.playSegment.mock.calls.filter(([id]) => id === 'ach')).toHaveLength(1);
    vi.advanceTimersByTime(1);
    sfx.achievement();
    expect(fixture.playSegment.mock.calls.filter(([id]) => id === 'ach')).toHaveLength(2);
  });
  it('plays target and mini-goal cues at their specified gains', () => {
    sfx.coinTick({ gainDb: -6 }); sfx.chime({ gainDb: -14 });
    expect(fixture.playSegment).toHaveBeenNthCalledWith(1, 'coin1', expect.objectContaining({ gain: 10 ** (-6 / 20), group: 'coin' }));
    expect(fixture.playSegment).toHaveBeenNthCalledWith(2, 'chime', expect.objectContaining({ gain: 10 ** (-14 / 20), group: 'ladder' }));
  });

  it('deals three no-repeat variants in tray timing order', () => {
    sfx.deal();
    expect(fixture.playSegment).toHaveBeenCalledTimes(3);
    expect(fixture.playSegment.mock.calls.map(([id, options]) => [id, options?.at, options?.variants, options?.group])).toEqual([
      ['deal1', 0.005, 3, 'deal'],
      ['deal1', 0.065, 3, 'deal'],
      ['deal1', 0.125, 3, 'deal'],
    ]);
  });

  it('uses the Mega Pop mix gains while preserving Huge Pop levels', () => {
    sfx.gooPop({ gainDb: -12, sub: true, subGainDb: -16 });
    expect(fixture.playSegment).toHaveBeenNthCalledWith(1, 'sub', expect.objectContaining({ gain: 10 ** (-16 / 20) }));
    expect(fixture.playSegment).toHaveBeenNthCalledWith(2, 'goo', expect.objectContaining({ gain: 10 ** (-12 / 20) }));
    sfx.gloopPop({ gainDb: -16 });
    expect(fixture.playSegment).toHaveBeenNthCalledWith(3, 'pop1', expect.objectContaining({ gain: 10 ** (-16 / 20) }));
    sfx.gooPop({ gainDb: -9 }); sfx.gloopPop({ gainDb: -12 });
    expect(fixture.playSegment).toHaveBeenNthCalledWith(4, 'goo', expect.objectContaining({ gain: 10 ** (-9 / 20) }));
    expect(fixture.playSegment).toHaveBeenNthCalledWith(5, 'pop1', expect.objectContaining({ gain: 10 ** (-12 / 20) }));
  });

  it('sets the Mega stinger bodies, held note and bloom to the follow-up levels', () => {
    sfx.megaStinger({ combo: 1 });
    expect(fixture.playCandyBar).toHaveBeenCalledTimes(6);
    for (const call of fixture.playCandyBar.mock.calls) expect(call.slice(3, 5)).toEqual([-16, -20]);
    expect(fixture.tone.mock.calls.map(([options]) => options.peak)).toEqual([10 ** (-16 / 20), 10 ** (-22 / 20), 10 ** (-22 / 20)]);
  });

  it('trims Mega impact layers while leaving normal line clears unchanged', () => {
    fixture.audioGraph = { context: { currentTime: 0 } };
    sfx.lineClear({ combo: 12, lines: 2 });
    expect(fixture.playCandyBar.mock.calls.map((call) => call.slice(3, 5))).toEqual([[-10, -14], [-10, -14]]);
    fixture.playCandyBar.mockClear();
    sfx.lineClear({ combo: 12, lines: 2, mega: true });
    expect(fixture.playCandyBar.mock.calls.map((call) => call.slice(3, 5))).toEqual([[-14, -18], [-14, -18]]);
  });
});
