import { describe, expect, it } from 'vitest';
import { createHitStop, dispatchImmediately, hitStopMs, type HitStopTier } from './hitStop';
import { createSession } from '../../app/session';
import { newGame } from '../../core/game';

describe('M10.1 hitstop', () => {
  it('uses the specified cell and tier ladder, with combo reduction and cap', () => {
    expect(hitStopMs(8, 'lines', 0)).toBe(50);
    expect(hitStopMs(16, 'lines', 0)).toBe(66);
    expect(hitStopMs(32, 'lines', 0)).toBe(80);
    expect(hitStopMs(40, 'lines', 0)).toBe(80);
    expect(hitStopMs(16, 'big', 0)).toBe(82);
    expect(hitStopMs(23, 'huge', 0)).toBe(106);
    expect(hitStopMs(32, 'mega', 0)).toBe(120);
    expect(hitStopMs(44, 'mega', 0)).toBe(120);
    expect(hitStopMs(32, 'mega', 4)).toBe(72);
    expect(hitStopMs(8, 'lines', 4)).toBe(50);
    expect(hitStopMs(0, 'mega', 0)).toBe(0);
    for (const tier of ['lines', 'big', 'huge', 'mega'] as const satisfies readonly HitStopTier[]) {
      for (let n = 0; n <= 64; n += 1) expect(hitStopMs(n, tier, 0)).toBeLessThanOrEqual(120);
    }
  });

  it('holds at a nonzero floor and reaches one at the requested end', () => {
    const stop = createHitStop(); stop.schedule(0, 100);
    expect(stop.step(0, 0)).toBe(0.0001);
    expect(stop.step(59, 0)).toBe(0.0001);
    expect(stop.step(100, 0)).toBe(1);
  });

  it('caps overlapping freezes at 150ms from the first start', () => {
    const stop = createHitStop(); stop.schedule(0, 140); stop.step(0, 0);
    stop.schedule(20, 150); stop.step(20, 20);
    expect(stop.step(149, 20)).toBeLessThan(1);
    expect(stop.step(150, 20)).toBe(1);
  });

  it('endNow restores the board immediately and cancels armed freezes', () => {
    const stop = createHitStop(); stop.schedule(100, 80); stop.endNow();
    expect(stop.step(0, 100)).toBe(1);
    stop.schedule(0, 80); stop.step(0, 0); stop.endNow();
    expect(stop.scale).toBe(1);
    expect(stop.active).toBe(false);
  });

  it('ends a visual freeze and dispatches the input in the same call', () => {
    const stop = createHitStop(); stop.schedule(0, 80); stop.step(0, 0);
    let moves = 0;
    const result = dispatchImmediately(() => stop.endNow(), () => { moves += 1; return moves; });
    expect(result).toBe(1); expect(moves).toBe(1); expect(stop.scale).toBe(1);
  });

  it('applies a real placement during an active visual freeze on the same call', () => {
    const stop = createHitStop(); stop.schedule(0, 80); stop.step(0, 0);
    const session = createSession({ state: newGame('classic', 'hitstop-placement-test').state });
    const before = session.state.moves;
    const placed = dispatchImmediately(() => stop.endNow(), () => session.dispatch({ type: 'place', slot: 0, row: 0, col: 0 }));
    expect(placed.some((event) => event.type === 'placed')).toBe(true);
    expect(session.state.moves).toBe(before + 1); expect(stop.scale).toBe(1);
  });
});
