import { WEEKLY_POOL, type WeeklyGoalId } from '../core/weekly';
import type { GameEvent, GameState } from '../core/types';
import type { SaveV2 } from './saveSchema';

export const WEEKLY_TARGETS: Readonly<Record<WeeklyGoalId, number>> = { lines: 150, pops: 300, score: 60_000, combo6: 5, bigpops: 10, dailies: 4, allclear: 2, multi: 25 };
export function syncWeek(save: SaveV2, weekIndex: number): SaveV2 {
  if (save.weekly.weekIndex === weekIndex) return save;
  const next = structuredClone(save); next.weekly = { weekIndex, progress: 0, claimed: false, runsWithCombo6: 0 }; return next;
}

export function addWeeklyProgress(save: SaveV2, state: GameState, events: readonly GameEvent[], weekIndex: number): SaveV2 {
  const next = syncWeek(save, weekIndex); if (next.weekly.claimed) return next;
  const id = WEEKLY_POOL[((weekIndex % WEEKLY_POOL.length) + WEEKLY_POOL.length) % WEEKLY_POOL.length]!;
  let amount = 0;
  if (id === 'lines') amount = events.filter((e) => e.type === 'cleared').reduce((n, e) => n + (e.type === 'cleared' ? e.rows.length + e.cols.length : 0), 0);
  else if (id === 'pops') amount = events.filter((e) => e.type === 'popped').reduce((n, e) => n + (e.type === 'popped' ? e.gloops.reduce((p, g) => p + Math.max(0, g.size - 1), 0) : 0), 0);
  else if (id === 'score' && state.mode !== 'zen') amount = events.reduce((n, e) => n + (e.type === 'scored' ? e.points : 0), 0);
  else if (id === 'combo6' && events.some((event) => event.type === 'comboUp' && event.combo >= 6) && next.weekly.runsWithCombo6 < 5) { next.weekly.runsWithCombo6 += 1; amount = 1; }
  else if (id === 'bigpops') amount = events.filter((e) => e.type === 'popped').reduce((n, e) => n + (e.type === 'popped' ? e.gloops.filter((g) => g.size >= 8).length : 0), 0);
  else if (id === 'dailies' && state.mode === 'daily' && events.some((event) => event.type === 'gameOver')) amount = 1;
  else if (id === 'allclear') amount = events.filter((e) => e.type === 'allClear').length;
  else if (id === 'multi') amount = events.filter((e) => e.type === 'cleared' && e.rows.length + e.cols.length >= 2).length;
  next.weekly.progress = Math.min(WEEKLY_TARGETS[id], next.weekly.progress + amount); return next;
}

export function claimWeeklyReward(save: SaveV2): SaveV2 {
  const next = structuredClone(save); const id = WEEKLY_POOL[((save.weekly.weekIndex % WEEKLY_POOL.length) + WEEKLY_POOL.length) % WEEKLY_POOL.length]!;
  if (next.weekly.claimed || next.weekly.progress < WEEKLY_TARGETS[id]) return save;
  next.weekly.claimed = true; next.profile.coins += 200; next.profile.coinsEarned += 200; next.profile.xp += 150; next.streak.freezes = Math.min(2, next.streak.freezes + 1); return next;
}

export function weeklyGoalNearMiss(save: SaveV2): number | null {
  const id = WEEKLY_POOL[((save.weekly.weekIndex % WEEKLY_POOL.length) + WEEKLY_POOL.length) % WEEKLY_POOL.length]!; const target = WEEKLY_TARGETS[id];
  if (save.weekly.claimed || save.weekly.progress < target * .8 || save.weekly.progress >= target) return null;
  return target - save.weekly.progress;
}
