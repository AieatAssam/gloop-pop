import { describe, expect, it } from 'vitest';
import { newGame } from './game';
import { seededRng } from './rng';
import { chooseBotMove, chooseGreedyMove, rankMoves, runSimGame, runSimulation } from './sim';

describe('greedy simulation', () => {
  it('chooses deterministically, preferring lower slot and board index on ties', () => {
    const state = newGame('classic', 'bot-tie').state;
    state.tray = [{ defId: 0, flavour: 1 }, { defId: 0, flavour: 1 }, { defId: 0, flavour: 1 }];
    expect(chooseGreedyMove(state)).toEqual(chooseGreedyMove(state));
    expect(chooseGreedyMove(state)?.slot).toBe(0);
  });
  it('produces a repeatable game for a seed', () => {
    const result = runSimGame('golden');
    expect(result).toEqual({ placements: 84, score: 8921, stage: 4, f2Fallbacks: 0, trays: 28, truncated: false });
    expect(runSimGame('golden')).toEqual(result);
  });
  it('plays one of its top 3 safe moves, never a move that strands another tray piece when it can avoid it', () => {
    const state = newGame('classic', 'bot-safe').state;
    state.board = Array<number>(64).fill(0); for (let index = 0; index < 64; index += 1) if (index % 8 < 5 && index !== 3 && index !== 11) state.board[index] = 1 + (index % 3);
    state.tray = [{ defId: 10, flavour: 4 }, { defId: 0, flavour: 5 }, null];
    const safeTop = rankMoves(state).filter((move) => move.safe).slice(0, 3).map((move) => `${move.slot}:${move.row}:${move.col}`);
    const rng = seededRng('bot-safe');
    for (let pick = 0; pick < 30; pick += 1) {
      const move = chooseBotMove(state, rng); expect(move).not.toBeNull();
      expect(safeTop).toContain(`${move?.slot}:${move?.row}:${move?.col}`);
    }
  });
  it('runs 20 Classic games inside the design §8 sanity band and none hit the cap', () => {
    const result = runSimulation(20, 'classic', 'test-sim');
    expect(result.runs).toBe(20); expect(result.truncatedRuns).toBe(0);
    expect(result.placements.median).toBeGreaterThanOrEqual(40); expect(result.placements.median).toBeLessThanOrEqual(300);
  }, 30_000);
});
