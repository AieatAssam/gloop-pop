import { describe, expect, it } from 'vitest';
import { coinTicksForCount, pickVariant, popVoiceStealIndex, stealCandidate, voiceDue, type RateLimiter } from './voices';
import { snapVelocityAllowed } from '../input/pointer';

describe('voice helpers', () => {
  it('never repeats the last variant and covers every alternative evenly', () => {
    expect(pickVariant(1, 0, () => 0.5)).toBe(0);
    expect([0, 1, 2, 3, 4].map((index) => pickVariant(5, -1, () => index / 5))).toEqual([0, 1, 2, 3, 4]);
    const counts = [0, 0, 0, 0, 0];
    for (let draw = 0; draw < 10_000; draw += 1) {
      const index = pickVariant(5, 2, () => (draw % 10_000) / 10_000);
      expect(index).not.toBe(2);
      counts[index] = (counts[index] ?? 0) + 1;
    }
    expect(counts[2]).toBe(0);
    for (const count of counts.filter((_, index) => index !== 2)) expect(count).toBeGreaterThan(2400);
    for (const count of counts.filter((_, index) => index !== 2)) expect(count).toBeLessThan(2600);
  });
  it('enforces configurable rate gaps', () => {
    const limiter: RateLimiter = { lastAt: 1, interval: 0.025 };
    expect(voiceDue(limiter, 1.024)).toBe(false);
    expect(voiceDue(limiter, 1.025)).toBe(true);
    expect(limiter.lastAt).toBe(1.025);
  });
  it('enforces the place, snap and UI gaps, the snap speed gate, and coin tick cap', () => {
    const place: RateLimiter = { lastAt: 5, interval: 0.04 };
    const snap: RateLimiter = { lastAt: 5, interval: 0.12 };
    const ui: RateLimiter = { lastAt: 5, interval: 0.05 };
    expect(voiceDue(place, 5.039)).toBe(false); expect(voiceDue(place, 5.04)).toBe(true);
    expect(voiceDue(snap, 5.119)).toBe(false); expect(voiceDue(snap, 5.12)).toBe(true);
    expect(snapVelocityAllowed(8)).toBe(true); expect(snapVelocityAllowed(8.01)).toBe(false);
    expect(snapVelocityAllowed(Number.NaN)).toBe(false);
    expect(voiceDue(ui, 5.049)).toBe(false); expect(voiceDue(ui, 5.05)).toBe(true);
    expect(coinTicksForCount(40)).toBe(12); expect(coinTicksForCount(-1)).toBe(0);
  });
  it('selects the oldest live pop voice for the six voice cap', () => {
    expect(popVoiceStealIndex([{ priority: 'pop', order: 4 }, { priority: 'ladder', order: 1 }, { priority: 'pop', order: 2 }])).toBe(2);
  });
  it('steals the oldest voice in the lowest class and never steals a stinger', () => {
    expect(stealCandidate([
      { priority: 'place', order: 1 },
      { priority: 'ui', order: 4 },
      { priority: 'ui', order: 2 },
      { priority: 'stinger', order: 0 },
    ])).toBe(2);
    expect(stealCandidate([{ priority: 'stinger', order: 0 }])).toBe(-1);
  });
});
