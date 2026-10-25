import { describe, expect, it } from 'vitest';
import { goalForWeek, weekIndexFromMs } from './weekly';

describe('weekly epoch and goal rotation', () => {
  it('uses the Monday 2026-10-19 epoch', () => {
    expect(weekIndexFromMs(1_792_972_740_000)).toBe(0);
    expect(weekIndexFromMs(1_792_972_800_000)).toBe(1);
    expect(weekIndexFromMs(1_793_577_540_000)).toBe(1);
    expect(weekIndexFromMs(1_793_577_600_000)).toBe(2);
  });
  it('returns the pool index and wraps negative indices', () => {
    expect(goalForWeek(0)).toBe(0); expect(goalForWeek(8)).toBe(0); expect(goalForWeek(-1)).toBe(7);
  });
});
