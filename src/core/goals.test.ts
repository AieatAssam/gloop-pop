import { describe, expect, it } from 'vitest';
import { newGame } from './game';
import { LADDER, MINI, ladderValue, miniProgress, nextTarget, pickMini, targetsPassed } from './goals';

describe('run targets and mini goals', () => {
  it('keeps the fixed ladder and continues by fifty thousand', () => {
    expect([...LADDER, ladderValue(12), ladderValue(13)]).toEqual([1000,2500,5000,7500,10000,15000,20000,30000,40000,50000,75000,100000,150000,200000]);
    expect(nextTarget(0, 0)).toBe(1000); expect(nextTarget(4999, 0)).toBe(5000); expect(nextTarget(0, 10000)).toBe(10000);
    expect(targetsPassed(4900, 10100)).toEqual([5000,7500,10000]);
  });
  it('pins eight independent seed hashes', () => {
    const expected = ['grow12','double','pop15','grow12','double','bigpop','flavour12','lines12'];
    expect(['a','b','c','d','e','f','g','h'].map((seed) => pickMini(seed))).toEqual(expected.map((id) => ({ id, ...(id === 'flavour12' ? { flavour: 1 } : {}), target: id === 'double' || id === 'grow12' || id === 'bigpop' ? 1 : id === 'pop15' ? 15 : id === 'lines12' || id === 'flavour12' ? 12 : 1, progress: 0, done: false })));
  });
  it('completes each mini from its matching events and reports completion once', () => {
    const state = newGame('classic', 'mini-test').state; state.bestCombo = 4;
    const events = [
      [{ type: 'popped', gloops: [{ flavour: 1 as const, size: 8, cells: [], bfs: [] }] }],
      [{ type: 'comboUp', combo: 4, tier: 1 }],
      [{ type: 'cleared', rows: [0, 1], cols: [], cells: [], flavoursByCell: [] }],
      [{ type: 'cleared', rows: [0], cols: [0], cells: [], flavoursByCell: [] }],
      [{ type: 'cleared', rows: [], cols: [], cells: Array.from({ length: 12 }, (_, i) => i), flavoursByCell: Array(12).fill(4) }],
      [{ type: 'cleared', rows: Array(12).fill(0), cols: [], cells: [], flavoursByCell: [] }],
      [{ type: 'popped', gloops: [{ flavour: 1 as const, size: 15, cells: Array.from({ length: 15 }, (_, i) => i), bfs: [] }] }],
      [{ type: 'bigGloop', size: 12 }],
    ] as const;
    expect(MINI).toHaveLength(8);
    for (const [index, id] of MINI.entries()) {
      const goal = { id, ...(id === 'flavour12' ? { flavour: 4 as const } : {}), target: id === 'combo4' ? 4 : id === 'lines12' || id === 'flavour12' ? 12 : id === 'pop15' ? 15 : 1, progress: 0, done: false };
      const complete = miniProgress(goal, events[index] as never, state); expect(complete.done, id).toBe(true); expect(miniProgress(complete, events[index] as never, state)).toBe(complete);
    }
  });
  it('adds goals only to opted-in Classic and Expert runs without changing deal RNG', () => {
    const base = newGame('classic', 'same-seed').state; const goals = newGame('classic', 'same-seed', { goals: true, best: 40000 }).state;
    expect(goals.goals).toMatchObject({ floor: 10000, mini: { target: expect.any(Number), progress: 0 } });
    expect(goals.tray).toEqual(base.tray); expect(goals.rng).toEqual(base.rng);
    expect(newGame('expert', 'e', { goals: true }).state.goals).toBeDefined();
    for (const mode of ['daily','zen','tutorial'] as const) expect(newGame(mode, 'no-goals', { goals: true }).state.goals).toBeUndefined();
  });
});
