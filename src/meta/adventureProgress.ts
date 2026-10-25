import type { SaveV2 } from './saveSchema';
import { grantXp } from './progression';
import type { GameState } from '../core/types';
import type { LevelDef } from '../core/levels';
import { returnUnused } from './boosters';

export interface LevelResult { level: number; won: boolean; stars: 0 | 1 | 2 | 3; score?: number }
export interface AdventureReward { save: SaveV2; xp: number; coins: number; firstWin: boolean; newStars: number; chapterDone: boolean; chapterAllStars: boolean; levels: number[]; unlocked: string[] }

/** Apply a single finished level to Adventure progress; rewards are deterministic and replay safe. */
export function recordLevelResult(save: SaveV2, result: LevelResult): AdventureReward {
  const next = structuredClone(save);
  const adventure = next.adventure;
  const key = String(result.level);
  const level = adventure.levels[key] ?? { stars: 0 as const, wins: 0, losses: 0, lossRun: 0, bestScore: 0 };
  let xp: number;
  let coins: number;
  let firstWin = false;
  let newStars = 0;
  let chapterDone = false; let chapterAllStars = false;
  if (result.won) {
    const frontierWin = result.level === adventure.frontier;
    firstWin = level.wins === 0;
    newStars = Math.max(0, result.stars - level.stars);
    xp = firstWin ? 40 : 0;
    coins = firstWin ? 20 : 0;
    xp += newStars * 10;
    coins += newStars * 15;
    if (!firstWin && newStars === 0) { xp = 10; coins = 5; }
    level.wins += 1;
    level.lossRun = 0;
    level.stars = Math.max(level.stars, result.stars) as 0 | 1 | 2 | 3;
    if (frontierWin) {
      adventure.winStreak += 1;
      adventure.bestWinStreak = Math.max(adventure.bestWinStreak, adventure.winStreak);
    }
  } else {
    xp = 5; coins = 2; level.losses += 1; level.lossRun += 1;
    if (result.level === adventure.frontier) adventure.winStreak = 0;
  }
  level.bestScore = Math.max(level.bestScore, result.score ?? 0);
  adventure.levels[key] = level;
  if (firstWin) { adventure.frontier = 1; while (adventure.frontier <= 120 && (adventure.levels[String(adventure.frontier)]?.wins ?? 0) > 0) adventure.frontier += 1; }
  const chapter = Math.ceil(result.level / 20); const chapterLevels = Array.from({ length: 20 }, (_, index) => adventure.levels[String((chapter - 1) * 20 + index + 1)]);
  if (result.won && chapterLevels.every((item) => (item?.wins ?? 0) > 0) && !adventure.chaptersDone.includes(chapter)) {
    adventure.chaptersDone.push(chapter); xp += 100; coins += 200; chapterDone = true;
  }
  if (result.won && chapterLevels.every((item) => item?.stars === 3) && !adventure.chaptersAllStars.includes(chapter)) {
    adventure.chaptersAllStars.push(chapter); coins += 300; chapterAllStars = true;
  }
  const progression = grantXp(next, xp); const progressed = progression.save;
  progressed.profile.coins += coins;
  progressed.profile.coinsEarned += coins;
  if (result.won) progressed.stats.adventureWins += 1; else progressed.stats.adventureLosses += 1;
  progressed.stats.runs.adventure = (progressed.stats.runs.adventure ?? 0) + 1;
  return { save: progressed, xp, coins, firstWin, newStars, chapterDone, chapterAllStars, levels: progression.levels, unlocked: progression.unlocked };
}

export function assistAvailable(save: SaveV2, level: number): boolean {
  return (save.adventure.levels[String(level)]?.lossRun ?? 0) >= 3;
}

/** A paused run belongs to the current level table only when its identity and goals still match. */
export function isStaleAttempt(state: GameState | null, def: LevelDef): boolean {
  const adventure = state?.adventure;
  if (!state || !adventure) return false;
  const expectedSeed = `gloop-pop/adventure/v1/${def.n}/${def.s}`;
  return state.seed !== expectedSeed || adventure.level !== def.n || adventure.moveLimit !== def.moves
    || adventure.goals.length !== def.goals.length
    || adventure.goals.some((goal, index) => {
      const current = def.goals[index];
      return !current || goal.kind !== current.kind || goal.flavour !== current.flavour || goal.target !== current.target;
    });
}

/** Drop a table-stale paused run without recording a loss and refund its armed boosters. */
export function dropStaleAdventureAttempt(save: SaveV2, def: LevelDef): { save: SaveV2; dropped: boolean } {
  const attempt = save.adventure.inProgress;
  if (!attempt || !isStaleAttempt(attempt, def)) return { save, dropped: false };
  const next = returnUnused(save, attempt);
  next.adventure.inProgress = null;
  return { save: next, dropped: true };
}

export function unlockAdventure(save: SaveV2): SaveV2 {
  const next = structuredClone(save);
  if (next.owned.modes.includes('adventure')) return next;
  next.owned.modes.push('adventure');
  next.adventure.boosters.moves = Math.min(5, next.adventure.boosters.moves + 1);
  next.adventure.boosters.shuffle = Math.min(5, next.adventure.boosters.shuffle + 1);
  next.adventure.boosters.pop = Math.min(5, next.adventure.boosters.pop + 1);
  return next;
}
