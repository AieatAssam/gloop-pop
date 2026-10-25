import { describe, expect, it } from 'vitest';
import { defaultSave } from './saveSchema';
import { assistAvailable, dropStaleAdventureAttempt, isStaleAttempt, recordLevelResult, unlockAdventure } from './adventureProgress';
import { newAdventureGame } from '../core/adventure';
import { LEVELS } from '../core/levels.data';
import { migrate } from './migrate';
import veteran from './fixtures/save-v1-veteran.json';

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

  it('keeps earned stars and drops an M13 paused cube attempt without a loss', () => {
    let save = migrate(veteran);
    save.adventure.levels['25'] = { stars: 3, wins: 1, losses: 0, lossRun: 0, bestScore: 900 };
    save.adventure.levels['64'] = { stars: 2, wins: 1, losses: 0, lossRun: 0, bestScore: 500 };
    save.adventure.frontier = 41;
    save.adventure.winStreak = 4; save.adventure.bestWinStreak = 7;
    save.adventure.chaptersDone = [1]; save.adventure.chaptersAllStars = [2];
    save.adventure.boosters = { moves: 2, shuffle: 1, pop: 0 };
    const current = LEVELS[63]!;
    const oldDef = { ...current, s: (current.s + 1) % 64, goals: [{ kind: 'C' as const, target: 1 }] };
    const attempt = newAdventureGame(oldDef, { bonusMoves: 0, boosters: { shuffle: 1, pop: 1 }, freeShuffle: false }).state;
    save.adventure.inProgress = attempt;

    save.adventure.inProgress = attempt;
    expect(isStaleAttempt(attempt, current)).toBe(true);
    const dropped = dropStaleAdventureAttempt(save, current);
    expect(dropped.dropped).toBe(true); save = dropped.save;
    expect([save.adventure.levels['25']?.stars, save.adventure.levels['25']?.wins, save.adventure.levels['64']?.stars, save.adventure.levels['64']?.wins, save.adventure.frontier, save.adventure.winStreak, save.adventure.bestWinStreak, save.adventure.chaptersDone, save.adventure.chaptersAllStars]).toEqual([3, 1, 2, 1, 41, 4, 7, [1], [2]]);
    expect(save.adventure.boosters).toEqual({ moves: 2, shuffle: 2, pop: 1 });
    expect([save.adventure.levels['64']?.losses ?? 0, save.stats.adventureLosses]).toEqual([0, 0]);
    const laterWin = recordLevelResult(save, { level: 25, won: true, stars: 1 });
    expect(laterWin.save.adventure.levels['25']?.stars).toBe(3);
  });

  it('keeps an attempt made from the current table', () => {
    const attempt = newAdventureGame(LEVELS[0]!, { bonusMoves: 0, boosters: { shuffle: 0, pop: 0 }, freeShuffle: false }).state;
    expect(isStaleAttempt(attempt, LEVELS[0]!)).toBe(false);
  });
  it('sanitizes Adventure stars from the M12 save fixture without lowering them', () => {
    const loaded = migrate(veteran);
    loaded.adventure.levels['25'] = { stars: 3, wins: 2, losses: 1, lossRun: 0, bestScore: 900 };
    loaded.adventure.levels['30'] = { stars: 1, wins: 1, losses: 0, lossRun: 0, bestScore: 500 };
    loaded.adventure.frontier = 31;
    const sanitized = migrate(loaded);
    expect(sanitized.adventure.levels['25']).toEqual({ stars: 3, wins: 2, losses: 1, lossRun: 0, bestScore: 900 });
    expect(sanitized.adventure.levels['30']).toEqual({ stars: 1, wins: 1, losses: 0, lossRun: 0, bestScore: 500 });
    expect(sanitized.adventure.frontier).toBe(31);
  });
  it('uses the same stale-attempt drop result at map open and resume', () => {
    const def = LEVELS[38]!; const staleDef = { ...def, s: (def.s + 1) % 64 };
    const attempt = newAdventureGame(staleDef, { bonusMoves: 0, boosters: { shuffle: 1, pop: 0 }, freeShuffle: false }).state;
    const save = defaultSave(); save.adventure.inProgress = attempt; save.adventure.boosters.shuffle = 0;
    const onMapOpen = dropStaleAdventureAttempt(save, def);
    const onResume = dropStaleAdventureAttempt(save, def);
    expect(onMapOpen.dropped).toBe(true); expect(onMapOpen.save).toEqual(onResume.save);
    expect(onMapOpen.save.adventure.inProgress).toBeNull(); expect(onMapOpen.save.adventure.boosters.shuffle).toBe(1);
    expect(onMapOpen.save.adventure.levels['39']).toBeUndefined(); expect(onMapOpen.save.stats.adventureLosses).toBe(0);
  });
});
