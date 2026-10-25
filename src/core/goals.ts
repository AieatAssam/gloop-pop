import { cyrb128 } from './hash';
import type { Flavour, GameEvent, GameState } from './types';

// design §24.2: targets and minis are deterministic and never consume the tray RNG.
export const LADDER = [1_000, 2_500, 5_000, 7_500, 10_000, 15_000, 20_000, 30_000, 40_000, 50_000, 75_000, 100_000] as const;
export const MINI = ['bigpop', 'combo4', 'double', 'cross', 'flavour12', 'lines12', 'pop15', 'grow12'] as const;
export type MiniId = typeof MINI[number];
export function ladderValue(index: number): number {
  if (index < 0 || !Number.isInteger(index)) return 0;
  return index < LADDER.length ? LADDER[index]! : 100_000 + 50_000 * (index - LADDER.length + 1);
}
export function nextTarget(score: number, floor: number): number {
  let index = 0; while (ladderValue(index) <= score || ladderValue(index) < floor) index += 1;
  return ladderValue(index);
}
export function targetsPassed(oldScore: number, newScore: number): number[] {
  const targets: number[] = []; let index = 0; while (ladderValue(index) <= oldScore) index += 1;
  while (ladderValue(index) <= newScore) { targets.push(ladderValue(index)); index += 1; }
  return targets;
}
export interface MiniGoal { id: string; flavour?: Flavour; target: number; progress: number; done: boolean }
export function pickMini(seed: string): MiniGoal {
  const hash = cyrb128(`${seed}/mini`); const id = MINI[hash[0] % MINI.length]!;
  return { id, ...(id === 'flavour12' ? { flavour: (1 + hash[1] % 5) as Flavour } : {}), target: id === 'combo4' ? 4 : id === 'lines12' || id === 'flavour12' ? 12 : id === 'pop15' ? 15 : 1, progress: 0, done: false };
}
export function miniProgress(mini: MiniGoal, events: readonly GameEvent[], state: GameState): MiniGoal {
  if (mini.done) return mini;
  let amount = 0; const clearedCells = new Set<number>(); const removedFlavourCells = new Set<number>();
  for (const event of events) {
    if (mini.id === 'bigpop' && event.type === 'popped') amount += event.gloops.filter((g) => g.size >= 8).length;
    if (mini.id === 'combo4' && event.type === 'comboUp') amount = Math.max(amount, event.combo);
    if (mini.id === 'double' && event.type === 'cleared' && event.rows.length + event.cols.length >= 2) amount = 1;
    if (mini.id === 'cross' && event.type === 'cleared' && event.rows.length > 0 && event.cols.length > 0) amount = 1;
    if (event.type === 'cleared') for (let i = 0; i < event.cells.length; i += 1) {
      const cell = event.cells[i]!; clearedCells.add(cell);
      if (event.flavoursByCell[i] === mini.flavour) removedFlavourCells.add(cell);
    }
    if (event.type === 'popped') for (const gloop of event.gloops) for (const cell of gloop.cells) {
      if (clearedCells.has(cell)) continue;
      if (mini.id === 'flavour12' && gloop.flavour === mini.flavour) removedFlavourCells.add(cell);
      if (mini.id === 'pop15') amount += 1;
    }
    if (mini.id === 'flavour12') amount = removedFlavourCells.size;
    if (mini.id === 'lines12' && event.type === 'cleared') amount += event.rows.length + event.cols.length;
    if (mini.id === 'grow12' && event.type === 'bigGloop' && event.size >= 12) amount = 1;
  }
  if (mini.id === 'combo4') amount = Math.max(amount, mini.progress, state.bestCombo >= 4 ? 4 : 0);
  const progress = Math.min(mini.target, mini.progress + amount);
  return progress === mini.progress ? mini : { ...mini, progress, done: progress >= mini.target };
}
