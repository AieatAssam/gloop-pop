import { describe, expect, it } from 'vitest';
import { newGame } from './game';
import { chooseGreedyMove, runSimGame, runSimulation } from './sim';

describe('greedy simulation', () => {
  it('chooses deterministically, preferring lower slot and board index on ties', () => {
    const state = newGame('classic', 'bot-tie').state;
    state.tray = [{ defId: 0, flavour: 1 }, { defId: 0, flavour: 1 }, { defId: 0, flavour: 1 }];
    expect(chooseGreedyMove(state)).toEqual(chooseGreedyMove(state));
    expect(chooseGreedyMove(state)?.slot).toBe(0);
  });
  it('produces a repeatable game for a seed', () => {
    const result = runSimGame('golden');
    expect(result).toEqual({ placements: 4750, score: 2_453_597, stage: 6, f2Fallbacks: 0, trays: 1583, truncated: false });
    expect(runSimGame('golden')).toEqual(result);
  });
  it('runs 20 Classic games with a median of at least 40 placements', () => {
    const result = runSimulation(20, 'classic', 'test-sim');
    expect(result.runs).toBe(20); expect(result.placements.median).toBeGreaterThanOrEqual(40);
  }, 30_000);
});
