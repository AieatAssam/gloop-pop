import { describe, expect, it } from 'vitest';
import { makeBoard } from './board';
import { seedStringForDay } from './daily';
import { canPlace, fitsAnywhere, newGame, previewPlacement, step } from './game';
import { tutorialGame } from './tutorial';
import type { GameState } from './types';

describe('game reducer', () => {
  it('replays a move identically after JSON serialisation', () => {
    const original = newGame('classic', 'replay-seed').state;
    const restored = JSON.parse(JSON.stringify(original)) as GameState;
    const left = step(original, { type: 'place', slot: 0, row: 0, col: 0 });
    const right = step(restored, { type: 'place', slot: 0, row: 0, col: 0 });
    expect(left).toEqual(right); expect(original.moves).toBe(0);
  });
  it('emits crossed target events after scoring and resumes mini progress', () => {
    const state = newGame('classic', 'target-resume', { goals: true }).state; state.score = 4880; state.board = [...makeBoard()];
    for (let col = 0; col < 7; col += 1) state.board[7 * 8 + col] = 2;
    state.tray = [{ defId: 0, flavour: 2 }, { defId: 0, flavour: 2 }, { defId: 0, flavour: 2 }];
    const result = step(state, { type: 'place', slot: 0, row: 7, col: 7 });
    const scoreIndex = result.events.findIndex((event) => event.type === 'scored'); const targetIndex = result.events.findIndex((event) => event.type === 'targetReached');
    expect(targetIndex).toBeGreaterThan(scoreIndex); expect(result.events[targetIndex]).toMatchObject({ type: 'targetReached', target: 5000 });
    const restored = JSON.parse(JSON.stringify(result.state)) as GameState; expect(restored.goals?.targetsHit).toBe(1);
  });
  it('keeps the Classic reducer stream identical with targets enabled', () => {
    let plain = newGame('classic', 'goal-neutral').state; let tracked = newGame('classic', 'goal-neutral', { goals: true, best: 40000 }).state;
    for (let move = 0; move < 5; move += 1) {
      let action: { type: 'place'; slot: 0 | 1 | 2; row: number; col: number } | undefined;
      for (let slot = 0; slot < 3 && !action; slot += 1) for (let row = 0; row < 8 && !action; row += 1) for (let col = 0; col < 8 && !action; col += 1) if (canPlace(plain, slot, row, col)) action = { type: 'place', slot: slot as 0 | 1 | 2, row, col };
      expect(action).toBeDefined(); const left = step(plain, action!); const right = step(tracked, action!); plain = left.state; tracked = right.state;
      expect({ board: tracked.board, tray: tracked.tray, score: tracked.score, rng: tracked.rng }).toEqual({ board: plain.board, tray: plain.tray, score: plain.score, rng: plain.rng });
    }
  });
  it('returns the same state and no events for an invalid action', () => {
    const state = newGame('classic', 'invalid').state;
    const result = step(state, { type: 'place', slot: 0, row: -1, col: 0 });
    expect(result).toEqual({ state, events: [] });
  });
  it('previews legal placements and emits tutorial placement events in reducer order', () => {
    const state = tutorialGame(1);
    expect(canPlace(state, 1, 6, 6)).toBe(true); expect(previewPlacement(state, 1, 6, 6)?.rows).toEqual([6]);
    expect(fitsAnywhere(makeBoard(), 10)).toBe(true);
    const result = step(state, { type: 'place', slot: 1, row: 6, col: 6 });
    expect(result.state.score).toBe(102); expect(result.state.board.every((cell) => cell === 0)).toBe(true);
    expect(result.events.map((event) => event.type)).toEqual(['placed', 'cleared', 'scored', 'comboUp', 'dealt']);
    const second = step(tutorialGame(2), { type: 'place', slot: 1, row: 6, col: 3 });
    expect(second.state.score).toBe(554); expect(second.events.some((event) => event.type === 'allClear')).toBe(false);
    const third = step(tutorialGame(3), { type: 'place', slot: 1, row: 4, col: 6 });
    expect(third.state.score).toBe(1476); expect(third.state.stage).toBe(1);
    expect(third.events.find((event) => event.type === 'scored')).toMatchObject({ points: 922, parts: { allClear: 0 } });
  });
  it('charges rescue at ten cleared lines and offers it only when stuck', () => {
    const state = newGame('classic', 'rescue').state;
    state.board = [...makeBoard()]; for (let row = 0; row < 7; row += 1) for (let col = 0; col < 8; col += 1) state.board[row * 8 + col] = 1;
    state.board[7 * 8] = 0; for (let col = 1; col < 8; col += 1) state.board[7 * 8 + col] = 2;
    state.tray = [{ defId: 0, flavour: 2 }, null, null]; state.rescue.charge = 9;
    const result = step(state, { type: 'place', slot: 0, row: 7, col: 0 });
    expect(result.state.rescue.ready).toBe(true); expect(result.events.some((event) => event.type === 'rescueReady')).toBe(true);
    const stuck = { ...result.state, board: Array.from({ length: 64 }, (_, index) => Math.floor(index / 8) === index % 8 ? 0 : (Math.floor(index / 8) + index % 8) % 2 === 0 ? 1 : 2), tray: [{ defId: 0, flavour: 1 as const }, { defId: 10, flavour: 1 as const }, null], status: 'playing' as const };
    stuck.rescue = { charge: 10, ready: true, used: false };
    const offered = step(stuck, { type: 'place', slot: 0, row: 0, col: 0 });
    expect(offered.events.some((event) => event.type === 'rescueOffered')).toBe(true);
    expect(step(offered.state, { type: 'useRescue' }).state.rescue.used).toBe(true);
  });
  it('Zen shake pops up to two largest gloops and deals a fresh tray', () => {
    const state = newGame('zen', 'zen-shake').state;
    state.board = Array.from({ length: 64 }, (_, index) => Math.floor(index / 8) === index % 8 ? 0 : (Math.floor(index / 8) + index % 8) % 2 === 0 ? 1 : 2);
    state.tray = [{ defId: 0, flavour: 1 }, { defId: 10, flavour: 2 }, null]; state.combo = 4; state.fuse = 2;
    const result = step(state, { type: 'place', slot: 0, row: 0, col: 0 });
    expect(result.events.some((event) => event.type === 'zenShake')).toBe(true); expect(result.state.combo).toBe(0);
    expect(result.events.filter((event) => event.type === 'dealt')).toHaveLength(1);
  });
  it('ends Daily after the thirtieth tray is fully placed', () => {
    const state = newGame('daily', '2026-10-25').state;
    state.board = [...makeBoard()]; state.traysDealt = 30; state.tray = [null, { defId: 0, flavour: 1 }, null];
    if (state.daily) state.daily.trays = Array.from({ length: 30 }, () => [{ defId: 0, flavour: 1 }, { defId: 0, flavour: 2 }, { defId: 0, flavour: 3 }]);
    const result = step(state, { type: 'place', slot: 1, row: 0, col: 0 });
    expect(result.state.status).toBe('over'); expect(result.events[result.events.length - 1]).toEqual({ type: 'gameOver', reason: 'traysDone' });
  });
  it('keeps each daily deal independent of moves', () => {
    const seed = seedStringForDay('2026-11-01');
    const a = newGame('daily', seed).state; const b = newGame('daily', seed).state;
    expect(a.daily?.dayKey).toBe('2026-11-01'); expect(a.daily?.dayNumber).toBe(8);
    const trayA = JSON.stringify(a.daily?.trays); const trayB = JSON.stringify(b.daily?.trays);
    step(a, { type: 'place', slot: 0, row: 0, col: 0 });
    expect(JSON.stringify(a.daily?.trays)).toBe(trayA); expect(JSON.stringify(b.daily?.trays)).toBe(trayB);
  });
  it('lets a Daily run end explicitly', () => {
    const state = newGame('daily', seedStringForDay('2026-10-25')).state;
    expect(step(state, { type: 'endRun' })).toMatchObject({ state: { status: 'over' }, events: [{ type: 'gameOver', reason: 'endRun' }] });
  });
  it('places the tutorial boards and middle-slot pieces from design §16.2', () => {
    const one = tutorialGame(1); const expectedOne = Array<number>(64).fill(0);
    for (const [index, flavour] of [[48,1],[49,1],[50,3],[51,3],[52,5],[53,5]]) expectedOne[index ?? 0] = flavour ?? 0;
    expect(one.board).toEqual(expectedOne); expect(one.tray[1]).toEqual({ defId: 1, flavour: 4 });
    const two = tutorialGame(2); const expectedTwo = Array<number>(64).fill(0);
    for (const [index, flavour] of [[3,2],[11,2],[19,5],[27,5],[35,1],[43,1],[56,3],[57,3],[58,3],[60,4],[61,4],[62,2],[63,2]]) expectedTwo[index ?? 0] = flavour ?? 0;
    expect(two.board).toEqual(expectedTwo); expect(two.tray[1]).toEqual({ defId: 2, flavour: 1 });
    const three = tutorialGame(3); const expectedThree = Array<number>(64).fill(0);
    for (const [index, flavour] of [[9,4],[10,4],[17,4],[18,4],[19,4],[25,4],[26,4],[27,4],[33,4],[34,4],[32,1],[35,3],[36,5],[37,2]]) expectedThree[index ?? 0] = flavour ?? 0;
    expect(three.board).toEqual(expectedThree); expect(three.tray[1]).toEqual({ defId: 1, flavour: 1 });
  });
});
