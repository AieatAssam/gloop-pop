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

describe('save written by the previous release (v2026.11.10.8)', () => {
  it('loads an in-progress Daily run whose per-tray arrays are empty, and records it without losing the score', () => {
    // The previous release always wrote daily.trayLines and daily.traySpecial as [] and never filled them in.
    const save = defaultSave();
    const run = newGame('daily', '2026-11-10').state;
    save.dailyInProgress = { ...run, traysDealt: 2, moves: 3, score: 120, daily: { ...run.daily!, trayLines: [], traySpecial: [] } };
    const resumed = dailyRunToResume(save, '2026-11-10');
    expect(resumed).toBe(save.dailyInProgress);
    const saved = recordDaily(save, resumed!, '2026-11-10');
    const result = dailyResult(saved, '2026-11-10');
    expect(result?.score).toBe(120);
    // Trays dealt before the upgrade had no stored results, so they record as 0. Nothing else is lost.
    expect(result?.trays).toEqual([0, 0]);
  });
  it('a previous-release Classic run is not touched by the Daily record', () => {
    const save = defaultSave();
    save.inProgress = newGame('classic', 'seed-old').state;
    const run = newGame('daily', '2026-11-10').state;
    save.dailyInProgress = { ...run, daily: { ...run.daily!, trayLines: [], traySpecial: [] } };
    const saved = recordDaily(save, save.dailyInProgress, '2026-11-10');
    expect(saved.inProgress).toEqual(save.inProgress);
  });
});
