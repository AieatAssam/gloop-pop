import type { GameState, ModeId } from '../core/types';

export interface RunSummary { mode: ModeId; score: number; lines: number; pops: number; biggestPop: number; bestCombo: number; pieces: number; allClears: number; goals?: { targetsHit: number; miniDone: boolean }; biggestGloop?: { cells: number[]; flavour: number } | null }
export function summarizeRun(state: GameState, events: readonly import('../core/types').GameEvent[] = []): RunSummary {
  let biggestGloop: RunSummary['biggestGloop'] = null;
  for (const event of events) if (event.type === 'popped') for (const gloop of event.gloops) if (!biggestGloop || gloop.size > biggestGloop.cells.length) biggestGloop = { cells: [...gloop.cells], flavour: gloop.flavour };
  if (!biggestGloop) { const largest = components(state.board).sort((a, b) => b.cells.length - a.cells.length)[0]; if (largest) biggestGloop = { cells: [...largest.cells], flavour: largest.flavour }; }
  return { mode: state.mode, score: state.score, lines: state.linesCleared, pops: state.stats.pops, biggestPop: state.stats.biggestPop,
    bestCombo: state.bestCombo, pieces: state.stats.placements, allClears: state.stats.allClears, ...(state.goals ? { goals: { targetsHit: state.goals.targetsHit, miniDone: state.goals.mini.done } } : {}), biggestGloop };
}
import { components } from '../core/gloops';
