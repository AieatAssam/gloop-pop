export type ItemKind = 'theme' | 'skin' | 'pop';
export interface CatalogueItem { kind: ItemKind; id: string; price: number; level?: number; achievement?: string; }
export const CATALOGUE: readonly CatalogueItem[] = [
  { kind: 'theme', id: 'midnight', price: 0 }, { kind: 'theme', id: 'sunset', price: 600 }, { kind: 'theme', id: 'aquarium', price: 1000 },
  { kind: 'theme', id: 'observatory', price: 1500 }, { kind: 'theme', id: 'kitchen', price: 2000 }, { kind: 'theme', id: 'snowglobe', price: 0, level: 20 },
  { kind: 'theme', id: 'dawn', price: 0, level: 50 }, { kind: 'skin', id: 'plain', price: 0 }, { kind: 'skin', id: 'googly', price: 0, level: 5 },
  { kind: 'skin', id: 'freckles', price: 0, level: 12 }, { kind: 'skin', id: 'catears', price: 500 }, { kind: 'skin', id: 'glasses', price: 700 },
  { kind: 'skin', id: 'mustache', price: 900 }, { kind: 'skin', id: 'bowtie', price: 1200 }, { kind: 'skin', id: 'crown', price: 0, achievement: 'mega_pop' },
  { kind: 'pop', id: 'sparkles', price: 0 }, { kind: 'pop', id: 'hearts', price: 0, level: 2 }, { kind: 'pop', id: 'stars', price: 300 },
  { kind: 'pop', id: 'bubbles', price: 500 }, { kind: 'pop', id: 'confetti', price: 800 }, { kind: 'pop', id: 'fireworks', price: 0, level: 30 },
];

import type { SaveV2 } from './saveSchema';

export type PurchaseResult = { save: SaveV2; ok: boolean };

/** Buy an item when its requirement is met; failures return the original save. */
export function buyItem(save: SaveV2, kind: ItemKind, id: string): PurchaseResult {
  const item = CATALOGUE.find((entry) => entry.kind === kind && entry.id === id);
  if (!item || isOwned(save, item) || requirement(item, save) !== null) return { save, ok: false };
  const next = structuredClone(save);
  if (next.profile.coins < item.price) return { save, ok: false };
  next.profile.coins -= item.price;
  ownedList(next, kind).push(id);
  return { save: next, ok: true };
}

/** Equip owned items. The equipped values are part of the persisted save. */
export function equipItem(save: SaveV2, kind: ItemKind, id: string): SaveV2 {
  const item = CATALOGUE.find((entry) => entry.kind === kind && entry.id === id);
  if (!item || !isOwned(save, item)) return save;
  const next = structuredClone(save);
  if (kind === 'theme') next.equipped.theme = id;
  else if (kind === 'skin') next.equipped.skin = id;
  else next.equipped.pop = id;
  return next;
}

export function isOwned(save: SaveV2, item: CatalogueItem): boolean {
  return ownedList(save, item.kind).includes(item.id);
}

export type ItemRequirement = { kind: 'level'; level: number } | { kind: 'achievement'; achievement: string };
/** null means the save meets every item requirement. */
export function requirement(item: CatalogueItem, save: SaveV2): ItemRequirement | null {
  if (item.level !== undefined && save.profile.level < item.level) return { kind: 'level', level: item.level };
  if (item.achievement && !save.achievements[item.achievement]) return { kind: 'achievement', achievement: item.achievement };
  return null;
}

function ownedList(save: SaveV2, kind: ItemKind): string[] {
  return kind === 'theme' ? save.owned.themes : kind === 'skin' ? save.owned.skins : save.owned.pops;
}
