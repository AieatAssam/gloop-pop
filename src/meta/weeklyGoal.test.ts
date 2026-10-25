import { describe, expect, it } from 'vitest';
import { defaultSave } from './saveSchema';
import { addWeeklyProgress, claimWeeklyReward, syncWeek, weeklyGoalNearMiss, WEEKLY_TARGETS } from './weeklyGoal';
import { newGame } from '../core/game';

describe('weekly goal', () => {
  it('resets by week and pays a completed goal once', () => {
    const save = defaultSave(); save.weekly.weekIndex = 0; save.weekly.progress = WEEKLY_TARGETS.lines;
    expect(syncWeek(save, 1).weekly.progress).toBe(0);
    const paid = claimWeeklyReward(save); expect(paid.profile.coins).toBe(200); expect(claimWeeklyReward(paid).profile.coins).toBe(200);
  });
  it('counts line clears from run events', () => {
    const state = newGame('classic', 'weekly').state;
    const next = addWeeklyProgress(defaultSave(), state, [{ type: 'cleared', rows: [0, 1], cols: [], cells: [], flavoursByCell: [] }], 0);
    expect(next.weekly.progress).toBe(2);
  });
  it('offers the near-miss amount only inside the final fifth of the goal', () => {
    const save = defaultSave(); save.weekly.progress = 130; expect(weeklyGoalNearMiss(save)).toBe(20);
    save.weekly.progress = 100; expect(weeklyGoalNearMiss(save)).toBeNull();
  });
});
