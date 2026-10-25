import { describe, expect, it } from 'vitest';
import { newGame } from '../core/game';
import { createSession } from './session';

describe('session restore', () => {
  it('continues from a JSON-round-tripped board, tray, score, and combo', () => {
    const original = newGame('classic', 'session-restore').state;
    const saved = { ...original, score: 1240, combo: 3, fuse: 2 };
    const restored = createSession({ state: JSON.parse(JSON.stringify(saved)) as typeof saved, best: 1000 });
    expect(restored.state).toEqual(saved); expect(restored.best).toBe(1000);
  });
  it.each(['zen', 'expert'] as const)('starts %s with that mode configuration', (mode) => { expect(createSession({ mode }).state.mode).toBe(mode); });
});
