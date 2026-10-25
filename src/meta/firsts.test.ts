import { describe, expect, it } from 'vitest';
import { detectFirsts } from './firsts';
describe('detectFirsts', () => {
  it('returns each newly reached moment once, with lifetime bonus', () => {
    const result = detectFirsts([{ type: 'cleared', rows: [0, 1], cols: [], cells: [], flavoursByCell: [] }, { type: 'popped', gloops: [{ flavour: 1, size: 24, cells: [], bfs: [] }] }, { type: 'allClear' }, { type: 'scored', points: 2, parts: { place: 1, lineBase: 0, pop: 0, bigPopBonus: 0, allClear: 0 }, combo: 10, mult: 1 }], {});
    expect(result.map((item) => item.key)).toEqual(['line', 'double', 'bigPop', 'hugePop', 'megaPop', 'allClear', 'combo5', 'combo10']);
    expect(result.reduce((sum, item) => sum + item.coins, 0)).toBe(320);
  });
  it('does not return already recorded moments', () => { expect(detectFirsts([{ type: 'allClear' }], { allClear: true })).toEqual([]); });
});
