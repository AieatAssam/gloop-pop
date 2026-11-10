import type { GameState } from '../core/types';
import type { SaveV2 } from './saveSchema';

export interface DailyResult { dayKey: string; score: number; trays: number[]; bestCombo: number; lines: number; biggestPop: number; allClears: number; freezeUsed: number }

export function recordDaily(save: SaveV2, state: GameState, dayKey: string): SaveV2 {
  const next = structuredClone(save);
  if (next.daily.records[dayKey]) return next;
  // The per-tray results live in the state (see addTrayProgress), so a resumed run keeps the trays dealt before the kill.
  const dealt = Math.min(30, state.traysDealt);
  const trays = Array.from({ length: dealt }, (_, index) => (state.daily?.traySpecial[index] ? 7 : state.daily?.trayLines[index] ?? 0));
  const result: DailyResult = { dayKey, score: state.score, trays, bestCombo: state.bestCombo, lines: state.linesCleared, biggestPop: state.stats.biggestPop, allClears: state.stats.allClears, freezeUsed: 0 };
  next.daily.records[dayKey] = { score: result.score, finished: true, trays: result.trays, bestCombo: result.bestCombo, lines: result.lines, biggestPop: result.biggestPop, allClears: result.allClears, freezeUsed: 0 };
  next.daily.finished += 1; next.daily.best = Math.max(next.daily.best, result.score); return next;
}

export function dailyResult(save: SaveV2, dayKey: string): DailyResult | null {
  const result = save.daily.records[dayKey];
  return result ? { dayKey, score: result.score, trays: [...result.trays], bestCombo: result.bestCombo, lines: result.lines, biggestPop: result.biggestPop, allClears: result.allClears, freezeUsed: result.freezeUsed } : null;
}

/**
 * The saved Daily run that may resume now. A run only resumes on the UTC day it was started. An older one is over:
 * resuming it used to record its result into that old day, so today's Daily was never recorded (round 10 report).
 * The caller drops a run that returns null.
 */
// spec-note: Stale Daily runs are dropped, not resumed. The old run was never finished, so it earns no record or streak.
export function dailyRunToResume(save: SaveV2, todayKey: string): GameState | null {
  const run = save.dailyInProgress;
  if (!run || run.mode !== 'daily' || run.daily?.dayKey !== todayKey) return null;
  return run;
}
