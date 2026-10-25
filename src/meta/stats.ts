import type { GameState } from '../core/types';
import type { SaveV2 } from './saveSchema';

export function recordRun(save: SaveV2, state: GameState): SaveV2 {
  const next = structuredClone(save); const mode = state.mode;
  next.stats.runs[mode] = (next.stats.runs[mode] ?? 0) + 1; next.ui.runsFinished += 1;
  next.stats.linesCleared += state.linesCleared; next.stats.extraCellsPopped += state.stats.pops; next.stats.biggestPop = Math.max(next.stats.biggestPop, state.stats.biggestPop);
  next.stats.bestCombo = Math.max(next.stats.bestCombo, state.bestCombo); next.stats.allClears += state.stats.allClears; next.stats.piecesPlaced += state.stats.placements;
  if (mode === 'classic') { next.stats.bestClassic = Math.max(next.stats.bestClassic, state.score); next.best.classic = Math.max(next.best.classic, state.score); next.recentClassic = [...next.recentClassic, state.score].slice(-20); }
  if (mode === 'expert') { next.stats.bestExpert = Math.max(next.stats.bestExpert, state.score); next.best.expert = Math.max(next.best.expert, state.score); }
  if (mode === 'daily') { next.stats.dailiesFinished += 1; next.stats.bestDaily = Math.max(next.stats.bestDaily, state.score); next.daily.best = Math.max(next.daily.best, state.score); }
  return next;
}
