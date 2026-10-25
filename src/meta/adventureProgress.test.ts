import { describe, expect, it } from 'vitest';
import { defaultSave } from './saveSchema';
import { assistAvailable, recordLevelResult, unlockAdventure } from './adventureProgress';

describe('Adventure progress', () => {
  it('pays first wins, new stars, replays and losses from the specified table', () => {
    for (const [stars, xp, coins] of [[1, 50, 35], [2, 60, 50], [3, 70, 65]] as const) {
      const first = recordLevelResult(defaultSave(), { level: 1, won: true, stars });
      expect([first.xp, first.coins, first.save.adventure.frontier]).toEqual([xp, coins, 2]);
    }
    let save = defaultSave();
    let result = recordLevelResult(save, { level: 1, won: true, stars: 1 });
    save = result.save;
    result = recordLevelResult(save, { level: 1, won: true, stars: 3 });
    expect([result.xp, result.coins, result.newStars]).toEqual([20, 30, 2]);
    save = result.save;
    result = recordLevelResult(save, { level: 1, won: true, stars: 3 });
    expect([result.xp, result.coins]).toEqual([10, 5]);
    result = recordLevelResult(save, { level: 1, won: false, stars: 0 });
    expect([result.xp, result.coins]).toEqual([5, 2]);
  });
  it('keeps the best Adventure score for each level', () => {
    let save = recordLevelResult(defaultSave(), { level: 1, won: true, stars: 1, score: 850 }).save;
    save = recordLevelResult(save, { level: 1, won: false, stars: 0, score: 1200 }).save;
    expect(save.adventure.levels['1']?.bestScore).toBe(1200);
  });
  it('grants the level 2 unlock gift once, capped at five', () => {
    const save = defaultSave(); save.adventure.boosters = { moves: 5, shuffle: 0, pop: 2 };
    const unlocked = unlockAdventure(save);
    expect(unlocked.adventure.boosters).toEqual({ moves: 5, shuffle: 1, pop: 3 });
    expect(unlockAdventure(unlocked).adventure.boosters).toEqual(unlocked.adventure.boosters);
  });
  it('pays chapter rewards once and moves the frontier only across first wins', () => {
    const save = defaultSave();
    for (let level = 1; level < 20; level += 1) save.adventure.levels[String(level)] = { stars: 3, wins: 1, losses: 0, lossRun: 0, bestScore: 0 };
    save.adventure.frontier = 20;
    const chapter = recordLevelResult(save, { level: 20, won: true, stars: 3 });
    expect([chapter.chapterDone, chapter.chapterAllStars, chapter.xp, chapter.coins]).toEqual([true, true, 170, 565]);
    expect([chapter.save.adventure.frontier, chapter.save.adventure.chaptersDone, chapter.save.adventure.chaptersAllStars]).toEqual([21, [1], [1]]);
    const replay = recordLevelResult(chapter.save, { level: 20, won: true, stars: 3 });
    expect([replay.chapterDone, replay.chapterAllStars, replay.xp, replay.coins]).toEqual([false, false, 10, 5]);
    const outOfOrder = recordLevelResult(defaultSave(), { level: 3, won: true, stars: 1 });
    expect(outOfOrder.save.adventure.frontier).toBe(1);
  });
  it('tracks frontier-only win streaks, retains the best, and offers assist after three losses', () => {
    let save = defaultSave();
    for (let level = 1; level <= 3; level += 1) save = recordLevelResult(save, { level, won: true, stars: 1 }).save;
    expect([save.adventure.winStreak, save.adventure.bestWinStreak]).toEqual([3, 3]);
    const replayLoss = recordLevelResult(save, { level: 1, won: false, stars: 0 }).save;
    expect(replayLoss.adventure.winStreak).toBe(3);
    for (let loss = 1; loss <= 3; loss += 1) save = recordLevelResult(save, { level: 4, won: false, stars: 0 }).save;
    expect([save.adventure.winStreak, save.adventure.bestWinStreak, assistAvailable(save, 4)]).toEqual([0, 3, true]);
    save = recordLevelResult(save, { level: 4, won: true, stars: 1 }).save;
    expect([save.adventure.winStreak, save.adventure.bestWinStreak, assistAvailable(save, 4)]).toEqual([1, 3, false]);
    const replayWin = recordLevelResult(save, { level: 1, won: true, stars: 2 }).save;
    expect(replayWin.adventure.winStreak).toBe(1);
  });
});
