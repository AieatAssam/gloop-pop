import { describe, expect, it, vi } from 'vitest';
import { newAdventureGame } from '../core/adventure';
import { LEVELS } from '../core/levels.data';
import type { GameEvent } from '../core/types';
import { adventureResultLabel, qualifiesForRescueSave, recordPendingAdventureResult } from './adventureResult';

describe('Adventure result routing', () => {
  it('records a completed result before a quick restart replaces the session', () => {
    const state = newAdventureGame(LEVELS[0]!, { bonusMoves: 0, boosters: { shuffle: 0, pop: 0 }, freeShuffle: false }).state;
    state.adventure!.result = { won: true, reason: 'goals', movesLeft: 6, stars: 3 }; state.status = 'over';
    const finish = vi.fn();
    // The R/Space/Enter route calls this backstop before starting the replacement attempt.
    recordPendingAdventureResult(state, false, finish);
    expect(finish).toHaveBeenCalledOnce();
    recordPendingAdventureResult(state, true, finish);
    expect(finish).toHaveBeenCalledOnce();
  });
  it('does not count an Adventure Pop booster as the Classic Saved achievement', () => {
    const events: GameEvent[] = [{ type: 'rescued', poppedCells: [0] }, { type: 'placed', slot: 0, piece: { defId: 0, flavour: 1 }, cells: [1], mergedInto: [] }, { type: 'cleared', rows: [0], cols: [], cells: [], flavoursByCell: [] }];
    expect(qualifiesForRescueSave('adventure', events)).toBe(false); expect(qualifiesForRescueSave('classic', events)).toBe(true);
  });
  it.each([
    [{ won: true, reason: 'goals', movesLeft: 1, stars: 2 }, 'Level 1 complete'],
    [{ won: false, reason: 'moves', movesLeft: 0, stars: 0 }, 'Out of moves'],
    [{ won: false, reason: 'stuck', movesLeft: 2, stars: 0 }, 'No room left'],
    [{ won: false, reason: 'gaveUp', movesLeft: 2, stars: 0 }, 'Level 1 ended'],
  ] as const)('uses the matching aria result label for %s', (result, label) => {
    const state = newAdventureGame(LEVELS[0]!, { bonusMoves: 0, boosters: { shuffle: 0, pop: 0 }, freeShuffle: false }).state;
    state.adventure!.result = result;
    expect(adventureResultLabel(state)).toBe(label);
  });
});
