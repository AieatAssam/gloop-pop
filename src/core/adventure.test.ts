import { describe, expect, it } from 'vitest';
import { newAdventureGame, stepAdventure } from './adventure';
import { levelParams, type LevelDef } from './levels';
import type { GameState } from './types';
import { PIECES } from './pieces';

function definition(goals: LevelDef['goals']): LevelDef {
  const params = levelParams(1);
  return { n: 1, s: 0, goals, moves: params.moves, s2: 4, s3: 8, wins: 12, board: '0'.repeat(64) };
}

function stateWithRowGoal(target = 1): GameState {
  const started = newAdventureGame(definition([{ kind: 'L', target }]), { bonusMoves: 0, boosters: { shuffle: 1, pop: 1 }, freeShuffle: false });
  const state = started.state;
  state.board = Array.from({ length: 64 }, (_, index) => index < 7 ? 1 : 0);
  state.tray = [{ defId: 0, flavour: 1 }, null, null];
  return state;
}

describe('Adventure reducer', () => {
  it('wins on the goal move before checking a stuck tray', () => {
    const result = stepAdventure(stateWithRowGoal(), { type: 'place', slot: 0, row: 0, col: 7 });
    expect(result.state.adventure?.result).toMatchObject({ won: true, reason: 'goals', stars: 3 });
    expect(result.events.some((event) => event.type === 'levelWon')).toBe(true);
    expect(result.events.some((event) => event.type === 'stageUp' || event.type === 'rescueOffered')).toBe(false);
  });

  it('loses when the move limit reaches zero and supports give up', () => {
    const exhausted = stateWithRowGoal(2);
    exhausted.adventure!.goals[0]!.kind = 'S';
    exhausted.adventure!.goals[0]!.target = 1_000_000;
    exhausted.adventure!.movesLeft = 1;
    expect(stepAdventure(exhausted, { type: 'place', slot: 0, row: 0, col: 7 }).state.adventure?.result).toMatchObject({ won: false, reason: 'moves', movesLeft: 0 });
    const beforeGiveUp = stateWithRowGoal();
    expect(stepAdventure(beforeGiveUp, { type: 'endRun' }).state.adventure?.result).toMatchObject({ won: false, reason: 'gaveUp' });
    expect(beforeGiveUp.adventure?.result).toBeNull();
    expect(beforeGiveUp.status).toBe('playing');
  });

  it('loses as stuck when no remaining tray piece fits', () => {
    const state = newAdventureGame(definition([{ kind: 'S', target: 1_000_000 }]), { bonusMoves: 0, boosters: { shuffle: 0, pop: 0 }, freeShuffle: false }).state;
    state.board = Array.from({ length: 64 }, (_, index) => {
      const row = Math.floor(index / 8); const col = index % 8;
      return col === row || col === (row + 4) % 8 ? 0 : 1;
    });
    const largeSquare = PIECES.find((piece) => piece.family === 'O3')!;
    state.tray = [{ defId: 0, flavour: 1 }, { defId: largeSquare.id, flavour: 1 }, null];
    state.adventure!.movesLeft = 5;
    expect(stepAdventure(state, { type: 'place', slot: 0, row: 0, col: 0 }).state.adventure?.result).toMatchObject({ won: false, reason: 'stuck', movesLeft: 4 });
  });

  it.each([
    [12, 0, 3], [10, 0, 3], [8, 0, 2], [12, 3, 3], [9, 3, 2],
  ])('awards stars from effective moves left (%i left, %i bonus)', (movesLeft, bonusMoves, expectedStars) => {
    const state = stateWithRowGoal();
    state.adventure!.movesLeft = movesLeft;
    state.adventure!.bonusMoves = bonusMoves;
    state.adventure!.s2 = 4;
    state.adventure!.s3 = 8;
    expect(stepAdventure(state, { type: 'place', slot: 0, row: 0, col: 7 }).state.adventure?.result?.stars).toBe(expectedStars);
  });

  it('shuffles once without spending a move and rejects an unarmed booster', () => {
    const state = stateWithRowGoal();
    const shuffled = stepAdventure(state, { type: 'booster', id: 'shuffle' });
    expect(shuffled.state.moves).toBe(state.moves);
    expect(shuffled.state.adventure?.boosters.shuffle).toBe('used');
    expect(shuffled.events.some((event) => event.type === 'dealt')).toBe(true);
    expect(stepAdventure(shuffled.state, { type: 'booster', id: 'shuffle' }).events).toEqual([]);
  });

  it('pops the largest gloop without score, combo, or goal progress', () => {
    const started = newAdventureGame(definition([{ kind: 'F', flavour: 1, target: 8 }]), { bonusMoves: 0, boosters: { shuffle: 0, pop: 1 }, freeShuffle: false });
    const state = started.state;
    state.board = Array.from({ length: 64 }, (_, index) => index < 8 ? 1 : 0);
    state.board[63] = 8;
    state.combo = 3;
    state.score = 50;
    const popped = stepAdventure(state, { type: 'booster', id: 'pop' });
    expect(popped.state.board.slice(0, 8).every((cell) => cell === 0)).toBe(true);
    expect(popped.state.board[63]).toBe(8);
    expect(popped.state.combo).toBe(3);
    expect(popped.state.score).toBe(50);
    expect(popped.state.adventure?.goals[0]?.progress).toBe(0);
    expect(popped.events).toEqual([{ type: 'boosterUsed', id: 'pop', poppedCells: [0, 1, 2, 3, 4, 5, 6, 7] }]);
  });

  it('counts a cleared flavour cell once when its gloop also pops', () => {
    const started = newAdventureGame(definition([{ kind: 'F', flavour: 1, target: 3 }]), { bonusMoves: 0, boosters: { shuffle: 0, pop: 0 }, freeShuffle: false });
    const state = started.state;
    state.board = Array.from({ length: 64 }, () => 0);
    state.board[0] = 1; state.board[8] = 1; state.board[16] = 1;
    for (let col = 1; col < 7; col += 1) state.board[col] = 2;
    state.tray = [{ defId: 0, flavour: 2 }, null, null];
    const result = stepAdventure(state, { type: 'place', slot: 0, row: 0, col: 7 });
    expect(result.state.adventure?.goals[0]?.progress).toBe(3);
  });

  it('counts a row and column cleared in one move for the multi-line goal', () => {
    const started = newAdventureGame(definition([{ kind: 'M', target: 1 }]), { bonusMoves: 0, boosters: { shuffle: 0, pop: 0 }, freeShuffle: false });
    const state = started.state;
    state.board = Array.from({ length: 64 }, () => 0);
    for (let col = 1; col < 8; col += 1) state.board[col] = 1;
    for (let row = 1; row < 8; row += 1) state.board[row * 8] = 1;
    state.tray = [{ defId: 0, flavour: 1 }, null, null];
    const result = stepAdventure(state, { type: 'place', slot: 0, row: 0, col: 0 });
    expect(result.state.adventure?.goals[0]?.progress).toBe(1);
    expect(result.events.find((event) => event.type === 'cleared')).toMatchObject({ rows: [0], cols: [0] });
  });

  it('counts cubes only when removed; hard cubes count after their second clear', () => {
    const started = newAdventureGame(definition([{ kind: 'C', target: 1 }]), { bonusMoves: 0, boosters: { shuffle: 0, pop: 0 }, freeShuffle: false });
    let state = started.state;
    state.board = Array.from({ length: 64 }, (_, index) => index < 7 ? index === 2 ? 9 : 1 : 0);
    state.tray = [{ defId: 0, flavour: 1 }, null, null];
    const cracked = stepAdventure(state, { type: 'place', slot: 0, row: 0, col: 7 });
    expect(cracked.state.board[2]).toBe(8);
    expect(cracked.state.adventure?.goals[0]?.progress).toBe(0);
    state = cracked.state;
    state.board = state.board.map((cell, index) => index < 7 && index !== 2 ? 1 : cell);
    state.tray = [{ defId: 0, flavour: 1 }, null, null];
    const removed = stepAdventure(state, { type: 'place', slot: 0, row: 0, col: 7 });
    expect(removed.state.adventure?.goals[0]?.progress).toBe(1);
    expect(removed.state.adventure?.result?.won).toBe(true);
  });

  it('round-trips mid-level state and continues with the same next deal', () => {
    const state = newAdventureGame(definition([{ kind: 'S', target: 1_000_000 }]), { bonusMoves: 0, boosters: { shuffle: 0, pop: 0 }, freeShuffle: false }).state;
    state.tray = [{ defId: 0, flavour: 1 }, { defId: 0, flavour: 2 }, { defId: 0, flavour: 3 }];
    let midLevel = state;
    midLevel = stepAdventure(midLevel, { type: 'place', slot: 0, row: 0, col: 0 }).state;
    midLevel = stepAdventure(midLevel, { type: 'place', slot: 1, row: 0, col: 1 }).state;
    const reloaded = JSON.parse(JSON.stringify(midLevel)) as GameState;
    const action = { type: 'place', slot: 2, row: 0, col: 2 } as const;
    const resumed = stepAdventure(reloaded, action);
    const uninterrupted = stepAdventure(midLevel, action);
    expect(resumed).toEqual(uninterrupted);
    expect(resumed.events.some((event) => event.type === 'dealt')).toBe(true);
  });
});
