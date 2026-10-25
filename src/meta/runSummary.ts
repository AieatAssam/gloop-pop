import type { GameState, ModeId } from '../core/types';

export interface RunSummary { mode: ModeId; score: number; lines: number; pops: number; biggestPop: number; bestCombo: number; pieces: number; allClears: number }
export function summarizeRun(state: GameState): RunSummary {
  return { mode: state.mode, score: state.score, lines: state.linesCleared, pops: state.stats.pops, biggestPop: state.stats.biggestPop,
    bestCombo: state.bestCombo, pieces: state.stats.placements, allClears: state.stats.allClears };
}
