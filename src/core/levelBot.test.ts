import { describe, expect, it } from 'vitest';
import { calibrate, generateLevel } from './levelGen';
import { chooseLevelMove } from './levelBot';
import { newAdventureGame } from './adventure';
import { seededRng } from './rng';

describe('frozen Adventure level bot', () => {
  it('keeps the Level 1 seed 0 twelve-run golden calibration', () => {
    const accepted = generateLevel(1);
    const { def, runs } = calibrate(1, accepted.s);
    expect(accepted.s).toBe(16);
    expect(def.goals).toEqual([{ kind: 'L', target: 3 }]);
    expect([def.wins, def.margin, def.s2, def.s3]).toEqual([12, 4, 4, 8]);
    expect(runs.map((run) => [run.won, run.movesUsed, run.progress])).toEqual([
      [true, 19, [3]], [true, 11, [3]], [true, 16, [3]], [true, 15, [3]],
      [true, 16, [3]], [true, 19, [3]], [true, 16, [3]], [true, 16, [3]],
      [true, 16, [3]], [true, 17, [3]], [true, 14, [3]], [true, 16, [3]],
    ]);
  });

  it('chooses a legal move deterministically for the same run', () => {
    const state = newAdventureGame({ n: 1, s: 0, goals: [{ kind: 'L', target: 4 }], moves: 20, s2: 3, s3: 6, wins: 12, margin: 8, board: '0'.repeat(64) }, { bonusMoves: 0, boosters: { shuffle: 0, pop: 0 }, freeShuffle: false }).state;
    expect(chooseLevelMove(state, seededRng(`${state.seed}/bot/0`))).not.toBeNull();
    const first = seededRng(`${state.seed}/bot/0`);
    const second = seededRng(`${state.seed}/bot/0`);
    expect(chooseLevelMove(state, first)).toEqual(chooseLevelMove(state, second));
  });
});
