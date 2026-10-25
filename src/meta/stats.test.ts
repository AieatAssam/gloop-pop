import { describe, expect, it } from 'vitest';
import { newGame } from '../core/game';
import { defaultSave } from './saveSchema';
import { recordAdventureRunStats, recordRun } from './stats';

describe('run statistics', () => {
  it('updates per-mode runs, best scores, and the rolling Classic chart', () => {
    const save = defaultSave(); const state = newGame('classic', 'stats-test').state; const completed = { ...state, score: 1234, linesCleared: 4, bestCombo: 3 };
    const next = recordRun(save, completed); expect(next.stats.runs.classic).toBe(1); expect(next.stats.bestClassic).toBe(1234); expect(next.recentClassic).toEqual([1234]); expect(next.stats.linesCleared).toBe(4);
  });
  it('adds the targets reached by a finished run', () => { const save = defaultSave(); const state = newGame('classic', 'target-stats', { goals: true }).state; state.goals!.targetsHit = 3; expect(recordRun(save, state).stats.targetsReached).toBe(3); });
  it('adds Adventure lifetime counters and booster uses at run end', () => {
    const save = defaultSave(); const state = newGame('adventure', 'adventure-stats').state;
    state.linesCleared = 4; state.stats.pops = 7; state.stats.biggestPop = 12; state.bestCombo = 3; state.stats.allClears = 2; state.stats.placements = 5;
    const events = [{ type: 'boosterUsed', id: 'shuffle' }, { type: 'boosterUsed', id: 'pop' }] as const;
    const next = recordAdventureRunStats(save, state, events);
    expect(next.stats).toMatchObject({ linesCleared: 4, extraCellsPopped: 7, biggestPop: 12, bestCombo: 3, allClears: 2, piecesPlaced: 5, boostersUsed: 2 });
  });
  it('keeps only the latest 20 Classic scores', () => { const save = defaultSave(); save.recentClassic = Array.from({ length: 20 }, (_, index) => index); const next = recordRun(save, newGame('classic', 'stats-limit').state); expect(next.recentClassic).toHaveLength(20); expect(next.recentClassic[0]).toBe(1); });
});
