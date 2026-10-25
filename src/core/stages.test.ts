import { describe, expect, it } from 'vitest';
import { f2Probability, flavoursForStage, stageForScore, weightsForStage } from './stages';
import { MODES } from './modes';

describe('stage tables and mode presets', () => {
  it('moves Classic stages and flavour sets at the exact score thresholds', () => {
    expect([0,1499,1500,4999,5000,12000,25000,45000].map(stageForScore)).toEqual([1,1,2,2,3,4,5,6]);
    expect(flavoursForStage(2)).toEqual([1,2,3,4,5]); expect(flavoursForStage(3)).toEqual([1,2,3,4,5,6]); expect(flavoursForStage(5)).toHaveLength(7);
  });
  it('uses specified F2 probabilities and mode differences', () => {
    expect([1,2,3,4,5,6].map(f2Probability)).toEqual([1,1,0.9,0.75,0.6,0.5]);
    expect(MODES.classic.rescue).toBe(true); expect(MODES.expert.f2Probability(1)).toBe(0.5);
    expect(MODES.zen.f2Probability(6)).toBe(1); expect(MODES.daily.maxTrays).toBe(30);
    expect(weightsForStage(1).Dot).toBe(6); expect(weightsForStage(3, true).Dot).toBe(3);
  });
});
