import type { GameEvent, GameState } from '../core/types';
import type { SaveV2 } from './saveSchema';

export interface DailyResult { dayKey: string; score: number; trays: number[]; bestCombo: number; lines: number; biggestPop: number; allClears: number; freezeUsed: number }

export function recordDaily(save: SaveV2, state: GameState, dayKey: string, events: readonly GameEvent[]): SaveV2 {
  const next = structuredClone(save);
  if (next.daily.records[dayKey]) return next;
  const trays: number[] = [];
  let tray = 0; let linesThisTray = 0; let special = false;
  for (const event of events) {
    if (event.type === 'cleared') linesThisTray += event.rows.length + event.cols.length;
    // spec-note: 7 is reserved for the purple special tray; 6 remains the red 6+ lines bucket.
    if (event.type === 'allClear' || (event.type === 'popped' && event.gloops.some((gloop) => gloop.size >= 15))) special = true;
    if (event.type === 'dealt') { trays[tray] = special ? 7 : linesThisTray; tray += 1; linesThisTray = 0; special = false; }
  }
  if (tray < 30 && (state.moves > 0 || linesThisTray > 0 || special)) trays[tray] = special ? 7 : linesThisTray;
  const result: DailyResult = { dayKey, score: state.score, trays: trays.slice(0, 30), bestCombo: state.bestCombo, lines: state.linesCleared, biggestPop: state.stats.biggestPop, allClears: state.stats.allClears, freezeUsed: 0 };
  next.daily.records[dayKey] = { score: result.score, finished: true, trays: result.trays, bestCombo: result.bestCombo, lines: result.lines, biggestPop: result.biggestPop, allClears: result.allClears, freezeUsed: 0 };
  next.daily.finished += 1; next.daily.best = Math.max(next.daily.best, result.score); return next;
}

export function dailyResult(save: SaveV2, dayKey: string): DailyResult | null {
  const result = save.daily.records[dayKey];
  return result ? { dayKey, score: result.score, trays: [...result.trays], bestCombo: result.bestCombo, lines: result.lines, biggestPop: result.biggestPop, allClears: result.allClears, freezeUsed: result.freezeUsed } : null;
}
