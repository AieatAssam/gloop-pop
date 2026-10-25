const WEEK_MS = 604_800_000;
const WEEK_EPOCH_MONDAY = 1_792_368_000_000; // 2026-10-19T00:00:00Z

export const WEEKLY_POOL = ['lines', 'pops', 'score', 'combo6', 'bigpops', 'dailies', 'allclear', 'multi'] as const;
export type WeeklyGoalId = (typeof WEEKLY_POOL)[number];

export function weekIndexFromMs(ms: number): number {
  const day = Math.floor(ms / 86_400_000);
  const weekday = ((day + 3) % 7 + 7) % 7; // 1970-01-01 was Thursday; Monday = 0.
  const monday = (day - weekday) * 86_400_000;
  return Math.floor((monday - WEEK_EPOCH_MONDAY) / WEEK_MS);
}

export function goalForWeek(weekIndex: number): number {
  return ((weekIndex % WEEKLY_POOL.length) + WEEKLY_POOL.length) % WEEKLY_POOL.length;
}
