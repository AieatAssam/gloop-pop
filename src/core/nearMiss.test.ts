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
});
