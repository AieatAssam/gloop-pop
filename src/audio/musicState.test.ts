import { describe, expect, it } from 'vitest';
import { musicState, nextBar } from './musicState';

const input = (patch: Partial<Parameters<typeof musicState>[0]> = {}): Parameters<typeof musicState>[0] => ({
  tier: 0, filledCells: 0, fittingPieces: 3, zen: false, idleMs: 0, paused: false,
  screen: 'play', gameOver: false, now: 0, ...patch,
});

describe('adaptive music state', () => {
  it('maps combo tiers and turns layers on at the specified thresholds', () => {
    expect([0, 3, 5, 8, 12].map((tier) => musicState(input({ tier })).tier)).toEqual([0, 1, 2, 3, 4]);
  });
  it('enters danger at 40 cells or one fitting piece, but Zen never enters danger', () => {
    expect(musicState(input({ filledCells: 40 })).danger).toBe(true);
    expect(musicState(input({ fittingPieces: 1 })).danger).toBe(true);
    expect(musicState(input({ fittingPieces: 0, zen: true })).danger).toBe(false);
  });
  it('keeps danger for one bar after both exit conditions become true', () => {
    const dangerous = musicState(input({ filledCells: 40, now: 1 }));
    const waiting = musicState(input({ filledCells: 34, fittingPieces: 2, now: 2 }), dangerous);
    expect(waiting.danger).toBe(true);
    expect(musicState(input({ filledCells: 34, fittingPieces: 2, now: 4.1 }), waiting).danger).toBe(false);
    expect(musicState(input({ filledCells: 35, fittingPieces: 3, now: 5 }), dangerous).danger).toBe(true);
  });
  it('selects idle, pause, menu and game-over layers', () => {
    expect(musicState(input({ idleMs: 30_000 })).idle).toBe(true);
    expect(musicState(input({ paused: true })).paused).toBe(true);
    expect(musicState(input({ screen: 'home' })).menu).toBe(true);
    expect(musicState(input({ gameOver: true })).gameOver).toBe(true);
  });
  it('provides the next musical bar boundary', () => {
    expect(nextBar(0)).toBe(0);
    expect(nextBar(1.5)).toBeCloseTo(4 * 60 / 120.04, 6);
  });
});
