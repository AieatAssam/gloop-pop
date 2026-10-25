import { afterEach, describe, expect, it, vi } from 'vitest';

const fixture = vi.hoisted(() => ({ playSegment: vi.fn((id: string, options?: { at?: number; variants?: number; group?: string }) => { void id; void options; return true; }) }));
vi.mock('./loader', () => ({ playSegment: fixture.playSegment, getSegmentBuffer: () => null }));

import { noteFor, popVoiceDue, sfx } from './sfx';

afterEach(() => {
  fixture.playSegment.mockClear();
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

  it('plays the level and achievement samples at their specified gains', () => {
    sfx.levelUp();
    sfx.achievement();
    expect(fixture.playSegment).toHaveBeenNthCalledWith(1, 'level', {
      group: 'ladder', priority: 'ladder', gain: 10 ** (-8 / 20),
    });
    expect(fixture.playSegment).toHaveBeenNthCalledWith(2, 'ach', {
      group: 'ladder', priority: 'ladder', gain: 10 ** (-10 / 20),
    });
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
});
