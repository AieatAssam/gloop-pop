import { describe, expect, it } from 'vitest';
import { defaultSave } from './saveSchema';
import { grantXp, rewardsForRun, totalXpForLevel, xpToNext } from './progression';

describe('progression', () => {
  it('uses the specified level curve and cap total', () => { expect([xpToNext(1), xpToNext(2), xpToNext(10), xpToNext(49)]).toEqual([60, 100, 420, 1980]); expect(totalXpForLevel(50)).toBe(49_980); });
  it('applies mode multipliers before flooring and awards level coins/unlocks', () => {
    const save = defaultSave(); const result = rewardsForRun(save, { mode: 'expert', score: 4_000, lines: 0, pops: 0, biggestPop: 0, bestCombo: 0, pieces: 0, allClears: 0 });
    expect(result.xp).toBe(90); expect(result.coins).toBe(37); expect(result.save.profile.level).toBe(2); expect(result.save.profile.coins).toBe(87); expect(result.unlocked).toContain('Hearts');
  });
  it.each([{ mode: 'classic' as const, xp: 20, coins: 5 }, { mode: 'expert' as const, xp: 30, coins: 7 }, { mode: 'zen' as const, xp: 10, coins: 2 }])('uses the $mode reward multiplier', ({ mode, xp, coins }) => {
    const result = rewardsForRun(defaultSave(), { mode, score: 0, lines: 0, pops: 0, biggestPop: 0, bestCombo: 0, pieces: 0, allClears: 0 }); expect([result.xp, result.coins]).toEqual([xp, coins]);
  });
  it('adds the counted daily bonus separately', () => { const result = rewardsForRun(defaultSave(), { mode: 'classic', score: 0, lines: 0, pops: 0, biggestPop: 0, bestCombo: 0, pieces: 0, allClears: 0 }, true); expect(result.xp).toBe(120); expect(result.coins).toBe(35); });
  it('banks five coins per passed target and the mini goal bonus', () => {
    const run = { mode: 'classic' as const, score: 20000, lines: 0, pops: 0, biggestPop: 0, bestCombo: 0, pieces: 0, allClears: 0, goals: { targetsHit: 7, miniDone: true } };
    const result = rewardsForRun(defaultSave(), run); expect(result.coins).toBe(155); expect(result.xp).toBe(230);
  });
  it('grants debug XP without adding a run payout', () => { const result = grantXp(defaultSave(), 5000); expect(result.save.profile.xp).toBe(5000); expect(result.coins).toBe(0); expect(result.save.profile.level).toBe(15); expect(result.save.owned.modes).toContain('zen'); expect(result.save.owned.modes).toContain('expert'); });
  it('awards one hundred coins per star after level 50', () => { const save = defaultSave(); save.profile.level = 50; save.profile.xp = totalXpForLevel(50); const result = grantXp(save, 5000); expect(result.save.profile.stars).toBe(2); expect(result.save.profile.coins).toBe(200); });
});
