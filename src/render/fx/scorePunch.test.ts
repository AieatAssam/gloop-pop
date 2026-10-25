import { describe, expect, it } from 'vitest';
import { scoreAt, scorePunchScale, scorePunchSize } from './scorePunch';

describe('SG §9.13.i score motion', () => {
  it('updates at most every 40 ms and is exact at D', () => {
    expect(scoreAt(0, 1000, 39, 250, false)).toBe(0);
    expect(scoreAt(0, 1000, 40, 250, false)).toBeGreaterThan(0);
    expect(scoreAt(0, 1000, 249, 250, false)).toBe(scoreAt(0, 1000, 240, 250, false));
    expect(scoreAt(0, 1000, 250, 250, false)).toBe(1000);
  });
  it('uses point tiers and settles the punch around one', () => {
    expect(scorePunchSize(499)).toBe(1.1); expect(scorePunchSize(500)).toBe(1.14); expect(scorePunchSize(2000)).toBe(1.18); expect(scorePunchSize(10000)).toBe(1.24);
    expect(scorePunchScale(250, 250, 1000, false)).toBeGreaterThan(1);
    expect(scorePunchScale(2500, 250, 1000, false)).toBeCloseTo(1, 2);
    expect(scorePunchScale(300, 250, 1000, true)).toBe(1);
  });
});
