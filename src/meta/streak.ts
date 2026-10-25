import { dayNumber } from '../core/daily';
import type { SaveV1 } from './saveSchema';

export interface StreakUpdate { save: SaveV1; freezeUsed: number; endedAt: number }
export function streakMilestone(days: number): boolean { return days >= 3 && ([3, 7, 14, 30, 50].includes(days) || days % 100 === 0); }

export function updateStreak(save: SaveV1, dayKey: string): StreakUpdate {
  const next = structuredClone(save); const streak = next.streak; const today = dayNumber(dayKey); let freezeUsed = 0; let endedAt = 0;
  if (streak.lastDay) {
    const last = dayNumber(streak.lastDay); const gap = today - last;
    if (gap >= 2) {
      const missed = gap - 1;
      if (streak.freezes >= missed) { streak.freezes -= missed; freezeUsed = missed; for (let offset = 1; offset < gap; offset += 1) streak.frozenDays.push(dayKeyFromNumber(last + offset)); streak.frozenDays = streak.frozenDays.slice(-60); streak.lastDay = dayKeyFromNumber(today - 1); }
      else { endedAt = streak.current; streak.current = 0; }
    }
  }
  if (streak.lastDay && today - dayNumber(streak.lastDay) === 1) streak.current += 1;
  else if (streak.lastDay !== dayKey) streak.current = 1;
  streak.lastDay = dayKey; streak.best = Math.max(streak.best, streak.current);
  if (streak.current % 7 === 0) streak.freezes = Math.min(2, streak.freezes + 1);
  return { save: next, freezeUsed, endedAt };
}

function dayKeyFromNumber(day: number): string {
  const z = Math.floor((1_792_886_400_000 + (day - 1) * 86_400_000) / 86_400_000) + 719_468;
  const era = Math.floor(z / 146_097); const doe = z - era * 146_097;
  const yoe = Math.floor((doe - Math.floor(doe / 1_460) + Math.floor(doe / 36_524) - Math.floor(doe / 146_096)) / 365);
  let year = yoe + era * 400; const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153); const date = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const month = mp + (mp < 10 ? 3 : -9); year += month <= 2 ? 1 : 0;
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
}
