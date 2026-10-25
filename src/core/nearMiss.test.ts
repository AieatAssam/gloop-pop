import { describe, expect, it } from 'vitest';
import { makeBoard } from './board';
import { nearMissFacts, nearMissMessages } from './nearMiss';
import { newGame } from './game';
import { newAdventureGame } from './adventure';
import { LEVELS } from './levelTable';

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
  it('lists all unmet Adventure goals before stuck and board facts, then keeps the first two', () => {
    const state = newAdventureGame(LEVELS[0]!, { bonusMoves: 0, boosters: { shuffle: 0, pop: 0 }, freeShuffle: false }).state;
    state.adventure!.goals = [{ kind: 'L', target: 5, progress: 2 }, { kind: 'F', flavour: 3, target: 8, progress: 4 }];
    state.adventure!.result = { won: false, reason: 'stuck', movesLeft: 2, stars: 0 };
    expect(nearMissMessages(state, 0, 0, 0).map((item) => [item.kind, item.amount, item.unit])).toEqual([['adventureNeed', 3, 'L'], ['adventureNeed', 4, '3']]);
    state.adventure!.goals = [{ kind: 'L', target: 5, progress: 4 }];
    expect(nearMissMessages(state, 0, 0, 0).map((item) => item.kind)).toEqual(['adventureNeed', 'stuck']);
  });
  it('reports Adventure goal units in singular and plural and only reports empty space on stuck losses', () => {
    const state = newAdventureGame(LEVELS[0]!, { bonusMoves: 0, boosters: { shuffle: 0, pop: 0 }, freeShuffle: false }).state;
    state.adventure!.goals = [{ kind: 'F', flavour: 6, target: 4, progress: 3 }]; state.adventure!.result = { won: false, reason: 'moves', movesLeft: 0, stars: 0 };
    expect(nearMissMessages(state, 0, 0, 0).map((item) => [item.kind, item.amount, item.unit])).toEqual([['adventureNeed', 1, '6']]);
    state.adventure!.goals[0]!.progress = 2;
    expect(nearMissMessages(state, 0, 0, 0)[0]).toMatchObject({ kind: 'adventureNeed', amount: 2, unit: '6' });
    state.adventure!.result = { won: false, reason: 'stuck', movesLeft: 3, stars: 0 };
    expect(nearMissMessages(state, 0, 0, 0).map((item) => item.kind)).toEqual(['adventureNeed', 'stuck']);
  });
});
