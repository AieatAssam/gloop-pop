import { describe, expect, it } from 'vitest';
import { newGame } from '../core/game';
import { defaultSave } from './saveSchema';
import { recordRun } from './stats';

describe('run statistics', () => {
  it('updates per-mode runs, best scores, and the rolling Classic chart', () => {
    const save = defaultSave(); const state = newGame('classic', 'stats-test').state; const completed = { ...state, score: 1234, linesCleared: 4, bestCombo: 3 };
    const next = recordRun(save, completed); expect(next.stats.runs.classic).toBe(1); expect(next.stats.bestClassic).toBe(1234); expect(next.recentClassic).toEqual([1234]); expect(next.stats.linesCleared).toBe(4);
  });
  it('keeps only the latest 20 Classic scores', () => { const save = defaultSave(); save.recentClassic = Array.from({ length: 20 }, (_, index) => index); const next = recordRun(save, newGame('classic', 'stats-limit').state); expect(next.recentClassic).toHaveLength(20); expect(next.recentClassic[0]).toBe(1); });
});
