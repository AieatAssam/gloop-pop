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
