import { describe, expect, it } from 'vitest';
import { newGame } from '../core/game';
import { createSession, runToResumeOnBoot } from './session';

describe('session restore', () => {
  it('continues from a JSON-round-tripped board, tray, score, and combo', () => {
    const original = newGame('classic', 'session-restore').state;
    const saved = { ...original, score: 1240, combo: 3, fuse: 2 };
    const restored = createSession({ state: JSON.parse(JSON.stringify(saved)) as typeof saved, best: 1000 });
    expect(restored.state).toEqual(saved); expect(restored.best).toBe(1000);
  });
  it.each(['classic', 'expert', 'zen', 'daily'] as const)('resumes a JSON-round-tripped %s state exactly', (mode) => {
    const saved = JSON.parse(JSON.stringify(newGame(mode, `resume-${mode}`).state)) as ReturnType<typeof newGame>['state'];
    expect(createSession({ state: saved }).state).toEqual(saved);
  });
  it.each(['zen', 'expert'] as const)('starts %s with that mode configuration', (mode) => { expect(createSession({ mode }).state.mode).toBe(mode); });
  it('gives each non-Daily run fresh entropy while preserving a saved seed on resume', () => {
    const first = createSession({ mode: 'classic' }); const second = createSession({ mode: 'classic' });
    expect(first.state.seed).not.toBe(second.state.seed);
    const saved = JSON.parse(JSON.stringify(first.state)) as typeof first.state;
    expect(createSession({ state: saved }).state.seed).toBe(first.state.seed);
    first.restart(); expect(first.state.seed).not.toBe(saved.seed);
  });
  it('replaces the active state when a scripted flow advances', () => {
    const session = createSession({ mode: 'classic' }); const replacement = newGame('tutorial', 'step-two').state;
    session.replace(replacement);
    expect(session.state).toBe(replacement);
  });
  it('does not resume a Daily unless the player enters Daily explicitly', () => {
    expect(runToResumeOnBoot(newGame('daily', 'saved-daily').state)).toBeNull();
    const classic = newGame('classic', 'saved-classic').state;
    expect(runToResumeOnBoot(classic)).toBe(classic);
    expect(runToResumeOnBoot(null)).toBeNull();
  });
});
