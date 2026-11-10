import { describe, expect, it } from 'vitest';
import { defaultSave } from './saveSchema';
import { dailyResult, dailyRunToResume, recordDaily } from './dailyRecord';
import { newGame } from '../core/game';

describe('daily run resume (round 11, item 7)', () => {
  it('resumes a saved Daily run only on the UTC day it was started', () => {
    const save = defaultSave();
    save.dailyInProgress = newGame('daily', '2026-11-09').state;
    expect(dailyRunToResume(save, '2026-11-09')).toBe(save.dailyInProgress);
    // A run from an earlier day is over: resuming it would record into that day, and today's Daily would stay unrecorded.
    expect(dailyRunToResume(save, '2026-11-10')).toBeNull();
  });
  it('does not resume a saved run that has no Daily day or is not a Daily run', () => {
    const save = defaultSave();
    const run = newGame('daily', '2026-11-10').state;
    save.dailyInProgress = { ...run, daily: undefined };
    expect(dailyRunToResume(save, '2026-11-10')).toBeNull();
    save.dailyInProgress = { ...run, mode: 'classic' };
    expect(dailyRunToResume(save, '2026-11-10')).toBeNull();
    save.dailyInProgress = null;
    expect(dailyRunToResume(save, '2026-11-10')).toBeNull();
  });
  it('keeps every tray of a resumed run, including the trays dealt before the app was killed', () => {
    const state = newGame('daily', '2026-11-10').state;
    // Three trays were dealt before the kill; the trays' results live in the saved state, not in the events since resume.
    const resumed = { ...state, traysDealt: 3, moves: 4, daily: { ...state.daily!, trayLines: [0, 4, 2], traySpecial: [false, false, true] } };
    const saved = recordDaily(defaultSave(), resumed, '2026-11-10');
    expect(dailyResult(saved, '2026-11-10')?.trays).toEqual([0, 4, 7]);
  });
});
