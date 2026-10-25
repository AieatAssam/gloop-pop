import { describe, expect, it } from 'vitest';
import { LEVELS } from '../core/levels.data';
import { newAdventureGame } from '../core/adventure';
import { defaultSave } from './saveSchema';
import { armBoosters, BOOSTERS, buyBooster, returnUnused } from './boosters';

describe('Adventure boosters', () => {
  it('uses the specified prices, refuses unaffordable purchases, and caps stock', () => {
    expect(BOOSTERS.map(({ price }) => price)).toEqual([150, 100, 200]);
    const poor = defaultSave(); expect(buyBooster(poor, 'moves')).toBe(poor);
    const rich = defaultSave(); rich.profile.coins = 1_000; rich.adventure.boosters.pop = 5;
    expect(buyBooster(rich, 'moves').profile.coins).toBe(850);
    expect(buyBooster(rich, 'pop')).toBe(rich);
    expect(rich.profile.coins).toBe(1_000);
  });
  it('consumes Moves at start and adds three bonus moves', () => {
    const save = defaultSave(); save.adventure.boosters.moves = 1;
    const result = armBoosters(save, { moves: true }, 0);
    expect([result.bonusMoves, result.save.adventure.boosters.moves]).toEqual([3, 0]);
  });
  it('applies the frontier streak table and free Shuffle without spending stock', () => {
    for (const [streak, bonus, free] of [[0, 0, false], [1, 1, false], [2, 2, false], [3, 2, true], [5, 2, true]] as const) {
      const save = defaultSave(); save.adventure.frontier = 1; save.adventure.boosters.shuffle = 1;
      const result = armBoosters(save, { shuffle: true }, streak);
      expect([result.bonusMoves, result.freeShuffle, result.armed.shuffle, result.save.adventure.boosters.shuffle]).toEqual([bonus, free, free ? 0 : 1, free ? 1 : 0]);
    }
  });
  it('returns unused Shuffle and Pop on every result path, but not used or free Shuffle', () => {
    const armed = newAdventureGame(LEVELS[0]!, { bonusMoves: 0, boosters: { shuffle: 1, pop: 1 }, freeShuffle: false }).state;
    const inventory = defaultSave();
    for (const outcome of ['win', 'loss', 'give-up', 'discard'] as const) {
      const returned = returnUnused(inventory, armed);
      expect(returned.adventure.boosters).toEqual({ moves: 0, shuffle: 1, pop: 1 });
      expect(returned).not.toBe(inventory);
      void outcome;
    }
    const used = structuredClone(armed); used.adventure!.boosters.shuffle = 'used'; used.adventure!.boosters.pop = 'used';
    expect(returnUnused(inventory, used)).toBe(inventory);
    const free = newAdventureGame(LEVELS[0]!, { bonusMoves: 2, boosters: { shuffle: 0, pop: 0 }, freeShuffle: true }).state;
    expect(returnUnused(inventory, free).adventure.boosters.shuffle).toBe(0);
  });
});
