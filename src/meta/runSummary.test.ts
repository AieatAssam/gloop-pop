import { describe, expect, it } from 'vitest';
import { newGame } from '../core/game';
import { summarizeRun } from './runSummary';

describe('run summary highlights', () => {
  it('captures the largest popped gloop and falls back to the final board when none popped', () => {
    const state = newGame('classic', 'summary').state; state.board[0] = 2; state.board[1] = 2;
    expect(summarizeRun(state).biggestGloop).toEqual({ cells: [0, 1], flavour: 2 });
    const summary = summarizeRun(state, [{ type: 'popped', gloops: [
      { flavour: 1, size: 8, cells: [0, 1, 2, 3, 4, 5, 6, 7], bfs: [] },
      { flavour: 5, size: 10, cells: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17], bfs: [] },
    ] }]);
    expect(summary.biggestGloop).toEqual({ cells: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17], flavour: 5 });
  });
});
