import { describe, expect, it } from 'vitest';
import { bigPopBonus, comboMultiplier, lineBase, scoreMove } from './scoring';

describe('scoring formula', () => {
  it('passes both worked design §5 examples', () => {
    expect(scoreMove({ placedCells: 4, lines: 2, popped: [{ flavour: 1, size: 12, extraCells: Array(9).fill(0) as number[] }], combo: 3, allClear: false })).toMatchObject({ points: 1364, parts: { place: 4, lineBase: 300, pop: 180, bigPopBonus: 200, allClear: 0 }, mult: 2 });
    expect(scoreMove({ placedCells: 1, lines: 1, popped: [], combo: 1, allClear: false })).toMatchObject({ points: 101, parts: { place: 1, lineBase: 100, pop: 0, bigPopBonus: 0, allClear: 0 }, mult: 1 });
  });
  it('uses triangular line points and caps the combo multiplier at ten', () => {
    expect([1,2,3,4,5,6].map(lineBase)).toEqual([100,300,600,1000,1500,2100]);
    expect(comboMultiplier(19)).toBe(10); expect(comboMultiplier(40)).toBe(10);
  });
  it('gives daily flavour cells 40 points each and places alone get no multiplier', () => {
    expect(scoreMove({ placedCells: 2, lines: 1, popped: [{ flavour: 6, size: 3, extraCells: [1,2] }], combo: 2, allClear: false, flavourOfDay: 6 }).parts.pop).toBe(80);
    expect(scoreMove({ placedCells: 3, lines: 0, popped: [], combo: 12, allClear: false }).points).toBe(3);
  });
  it('does not award pop points or a big-pop bonus when a gloop is wholly in cleared cells', () => {
    const score = scoreMove({ placedCells: 1, lines: 1, popped: [], combo: 1, allClear: false });
    expect(score.parts).toMatchObject({ pop: 0, bigPopBonus: 0 }); expect(score.points).toBe(101);
  });
  it('applies the named big pop thresholds', () => {
    expect([7,8,14,15,23,24].map(bigPopBonus)).toEqual([0,200,200,600,600,1500]);
  });
});
