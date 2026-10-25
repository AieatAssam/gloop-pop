import { describe, expect, it } from 'vitest';
import { f2Probability, flavoursForStage, stageForScore, weightsForStage } from './stages';
import { MODES } from './modes';

describe('stage tables and mode presets', () => {
  it('moves Classic stages and flavour sets at the exact score thresholds', () => {
    expect([0,1499,1500,3999,4000,6999,7000,10999,11000,17999,18000,10_000_000].map(stageForScore)).toEqual([1,1,2,2,3,3,4,4,5,5,6,6]);
    expect(flavoursForStage(2)).toEqual([1,2,3,4,5]); expect(flavoursForStage(3)).toEqual([1,2,3,4,5,6]); expect(flavoursForStage(5)).toHaveLength(7);
  });
  it('uses specified F2 probabilities and mode differences', () => {
    expect([1,2,3,4,5,6].map(f2Probability)).toEqual([1,1,0.5,0,0,0]);
    expect(MODES.classic.rescue).toBe(true); expect(MODES.expert.f2Probability(1)).toBe(0.9); expect(MODES.expert.f2Probability(6)).toBe(0.9);
    expect(MODES.zen.f2Probability(6)).toBe(1); expect(MODES.daily.maxTrays).toBe(30);
    expect(weightsForStage(1).Dot).toBe(6); expect(weightsForStage(3, true).Dot).toBe(3);
  });
  it('pins the design §7.2 family weights (Dot, I2, I3, I4, I5, O2, O3, R23, L3, L4, T4, S4, L5)', () => {
    const table = [1,2,3,4,5,6].map((stage) => Object.values(weightsForStage(stage)));
    expect(table).toEqual([
      [6,10,10,6,3,10,2,3,12,8,6,3,3], [4,8,9,7,4,9,3,4,10,9,7,5,4], [3,6,8,7,5,8,4,5,9,9,8,6,5],
      [2,3,5,6,6,5,5,6,5,11,11,13,7], [1,2,3,5,6,3,6,6,3,12,12,18,8], [1,1,2,4,7,2,7,7,2,12,12,20,9],
    ]);
    expect(Object.values(weightsForStage(6, true))).toEqual([3,6,8,7,5,8,4,5,9,9,8,6,5]);
  });
});
