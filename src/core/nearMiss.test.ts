import { describe, expect, it } from 'vitest';
import { makeBoard } from './board';
import { nearMissFacts, nearMissMessages } from './nearMiss';
import { newGame } from './game';

describe('near miss facts', () => {
  it('finds one-cell-short pieces and lines from a real board', () => {
    const state = newGame('classic', 'near-miss').state; state.board = [...makeBoard()];
    state.tray = [{ defId: 1, flavour: 1 }, null, null]; for (let col = 0; col < 7; col += 1) state.board[col] = 2;
    const facts = nearMissFacts(state);
    expect(facts.pieceOneCellShort).toMatchObject({ slot: 0, shape: 'bar2' });
    expect(facts.lineOneFromFull).toEqual({ kind: 'row', index: 0 });
  });
  it('selects up to two messages in design priority order', () => {
    const state = newGame('classic', 'near-miss-order').state; state.board = [...makeBoard()];
    state.tray = [{ defId: 1, flavour: 1 }, null, null]; state.score = 120; for (let col = 0; col < 7; col += 1) state.board[col] = 2;
    expect(nearMissMessages(state, 100, 0, 2).map((item) => item.kind)).toEqual(['newBest', 'piece']);
  });
  it('reports the next target within the ten percent window after best and before board facts', () => {
    const state = newGame('classic', 'target-near', { goals: true }).state; state.score = 900; state.board = [...makeBoard()]; state.tray = [null, null, null];
    expect(nearMissMessages(state, 0, 0, 0).map((item) => [item.kind, item.amount, item.target])).toEqual([['targetShort', 100, 1000], ['fallback', 0, undefined]]);
    state.score = 4499; expect(nearMissMessages(state, 0, 0, 0)[0]?.kind).toBe('fallback');
    state.score = 4500; expect(nearMissMessages(state, 0, 0, 0)[0]?.amount).toBe(500);
  });
  it('places a mission at 80 percent after weekly and achievement near-misses', () => {
    const state = newGame('classic', 'mission-near').state; state.board = [...makeBoard()]; state.tray = [null, null, null];
    const result = nearMissMessages(state, 0, 0, 0, { mission: { remaining: 2, target: 15, text: 'Clear 15 lines' } });
    expect(result.map((item) => item.kind)).toEqual(['mission','fallback']); expect(result[0]?.amount).toBe(2);
  });
});
