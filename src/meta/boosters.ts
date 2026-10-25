import type { GameState } from '../core/types';
import type { SaveV2 } from './saveSchema';

export type BoosterId = 'moves' | 'shuffle' | 'pop';
export const BOOSTERS: readonly { id: BoosterId; price: number; cap: 5 }[] = [
  { id: 'moves', price: 150, cap: 5 },
  { id: 'shuffle', price: 100, cap: 5 },
  { id: 'pop', price: 200, cap: 5 },
];
export type BoosterSelection = { moves?: boolean; shuffle?: boolean; pop?: boolean };

export function buyBooster(save: SaveV2, id: BoosterId): SaveV2 {
  const booster = BOOSTERS.find((item) => item.id === id)!;
  if (save.profile.coins < booster.price || save.adventure.boosters[id] >= booster.cap) return save;
  const next = structuredClone(save);
  next.profile.coins -= booster.price;
  next.adventure.boosters[id] += 1;
  return next;
}

export function armBoosters(save: SaveV2, selection: BoosterSelection, streak: number): { save: SaveV2; bonusMoves: number; armed: { shuffle: number; pop: number }; freeShuffle: boolean } {
  const next = structuredClone(save);
  const frontier = next.adventure.frontier;
  const freeShuffle = frontier <= 120 && streak >= 3;
  const onFrontier = frontier <= 120;
  const moves = selection.moves && next.adventure.boosters.moves > 0 ? 3 : 0;
  const shuffle = selection.shuffle && next.adventure.boosters.shuffle > 0 && !freeShuffle ? 1 : 0;
  const pop = selection.pop && next.adventure.boosters.pop > 0 ? 1 : 0;
  if (moves) next.adventure.boosters.moves -= 1;
  if (shuffle) next.adventure.boosters.shuffle -= 1;
  if (pop) next.adventure.boosters.pop -= 1;
  return { save: next, bonusMoves: (onFrontier ? Math.min(2, streak) : 0) + moves, armed: { shuffle, pop }, freeShuffle };
}

/** Return armed consumables when an attempt ends without using them. */
export function returnUnused(save: SaveV2, state: GameState): SaveV2 {
  const boosters = state.adventure?.boosters;
  if (!boosters || (boosters.shuffle !== 'armed' && boosters.pop !== 'armed')) return save;
  const next = structuredClone(save);
  if (boosters.shuffle === 'armed' && !boosters.freeShuffle) next.adventure.boosters.shuffle = Math.min(5, next.adventure.boosters.shuffle + 1);
  if (boosters.pop === 'armed') next.adventure.boosters.pop = Math.min(5, next.adventure.boosters.pop + 1);
  return next;
}
