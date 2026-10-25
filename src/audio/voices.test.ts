import { describe, expect, it } from 'vitest';
import { pickVariant, stealCandidate, voiceDue, type RateLimiter } from './voices';

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
