import type { ModeId } from '../core/types';
import type { SaveV2 } from './saveSchema';
import type { RunSummary } from './runSummary';

export interface RewardResult { save: SaveV2; xp: number; coins: number; levels: number[]; unlocked: string[] }
export function xpToNext(level: number): number { return level >= 50 ? 0 : 60 + 40 * (level - 1); }
export function totalXpForLevel(level: number): number { let total = 0; for (let current = 1; current < Math.min(50, level); current += 1) total += xpToNext(current); return total; }
export function rewardsForRun(save: SaveV2, run: RunSummary, countedDaily = false): RewardResult {
  const mult = run.mode === 'expert' ? 1.5 : run.mode === 'zen' ? 0.5 : 1;
  const xp = Math.floor((20 + Math.floor(run.score / 100)) * mult) + (countedDaily ? 100 : 0);
  const coins = Math.floor((5 + Math.floor(run.score / 200)) * mult) + (countedDaily ? 30 : 0) + (run.goals?.targetsHit ?? 0) * 5 + (run.goals?.miniDone ? 15 : 0);
  const goalXp = run.goals?.miniDone ? 10 : 0;
  const result = grantXp(save, xp + goalXp); result.save.profile.coins += coins; result.save.profile.coinsEarned += coins;
  return { ...result, xp: xp + goalXp, coins };
}
export function grantXp(save: SaveV2, xp: number): RewardResult {
  const next = structuredClone(save); next.profile.xp += Math.max(0, Math.floor(xp));
  const levels: number[] = [];
  while (next.profile.level < 50 && next.profile.xp >= totalXpForLevel(next.profile.level + 1)) { next.profile.level += 1; levels.push(next.profile.level); next.profile.coins += 50; next.profile.coinsEarned += 50; }
  if (next.profile.level === 50) {
    const stars = Math.floor((next.profile.xp - totalXpForLevel(50)) / 2500);
    if (stars > next.profile.stars) { const extra = stars - next.profile.stars; next.profile.stars = stars; next.profile.coins += extra * 100; next.profile.coinsEarned += extra * 100; }
  }
  const unlocked: string[] = [];
  for (const level of levels) {
    if (level === 3) { next.owned.modes.push('zen'); unlocked.push('Zen'); }
    if (level === 8) { next.owned.modes.push('expert'); unlocked.push('Expert'); }
    if (level === 5) { next.owned.skins.push('googly'); unlocked.push('Googly Eyes'); }
    if (level === 12) { next.owned.skins.push('freckles'); unlocked.push('Freckles'); }
    if (level === 20) { next.owned.themes.push('snowglobe'); unlocked.push('Snow Globe'); }
    if (level === 30) { next.owned.pops.push('fireworks'); unlocked.push('Fireworks'); }
    if (level === 50) { next.owned.themes.push('dawn'); unlocked.push('Golden Dawn'); }
    if (level === 2) { next.owned.pops.push('hearts'); unlocked.push('Hearts'); }
    if (level === 2 && !next.owned.modes.includes('adventure')) { next.owned.modes.push('adventure'); next.adventure.boosters.moves = Math.min(5, next.adventure.boosters.moves + 1); next.adventure.boosters.shuffle = Math.min(5, next.adventure.boosters.shuffle + 1); next.adventure.boosters.pop = Math.min(5, next.adventure.boosters.pop + 1); unlocked.push('Adventure'); }
  }
  return { save: next, xp: Math.max(0, Math.floor(xp)), coins: 0, levels, unlocked };
}
export function isModeUnlocked(save: SaveV2, mode: ModeId): boolean { return save.owned.modes.includes(mode); }
