import type { Flavour, ScoreParts } from './types';

export function lineBase(lines: number): number { return 100 * lines * (lines + 1) / 2; }
export function comboMultiplier(combo: number): number { return Math.min(10, 1 + 0.5 * (Math.max(1, combo) - 1)); }
export function bigPopBonus(size: number): number { return size >= 24 ? 1500 : size >= 15 ? 600 : size >= 8 ? 200 : 0; }
export function scoreMove(input: {
  placedCells: number; lines: number; popped: readonly { flavour: Flavour; size: number; extraCells: readonly number[] }[];
  combo: number; allClear: boolean; flavourOfDay?: Flavour;
}): { points: number; parts: ScoreParts; mult: number } {
  const place = input.placedCells;
  const base = lineBase(input.lines);
  const pop = input.popped.reduce((sum, gloop) => sum + gloop.extraCells.reduce((subtotal) => subtotal + (gloop.flavour === input.flavourOfDay && input.flavourOfDay !== undefined ? 40 : 20), 0), 0);
  const bonus = input.popped.reduce((sum, gloop) => sum + bigPopBonus(gloop.size), 0);
  const allClear = input.allClear ? 2000 : 0;
  const mult = comboMultiplier(input.combo);
  const parts = { place, lineBase: base, pop, bigPopBonus: bonus, allClear };
  return { points: input.lines === 0 ? place : place + Math.floor((base + pop + bonus + allClear) * mult + 0.5), parts, mult };
}
