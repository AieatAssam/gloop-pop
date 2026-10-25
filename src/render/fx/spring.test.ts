import { describe, expect, it } from 'vitest';
import { reciprocalScale, shearDeterminant, spring } from './spring';

describe('SG §9.13 spring helper', () => {
  it('damps the 2 Hz / ζ 0.367 example to about ten percent in half a second', () => {
    const state = { x: 1, v: 0 }; const f = 2; const zeta = 0.367;
    for (let i = 0; i < 30; i += 1) spring(state, 0, f, zeta, 1 / 60);
    const envelope = Math.hypot(state.x, state.v / (2 * Math.PI * f));
    expect(envelope).toBeGreaterThan(0.05);
    expect(envelope).toBeLessThan(0.15);
    expect(Number.isFinite(state.v)).toBe(true);
  });

  it('stays finite at the maximum 50 ms frame step', () => {
    const state = { x: 0, v: 100 }; spring(state, 1, 7, 0.75, 0.05);
    expect(Number.isFinite(state.x)).toBe(true); expect(Number.isFinite(state.v)).toBe(true);
  });

  it('preserves volume and unit shear determinant', () => {
    for (const sx of [0.85, 1, 1.12, 1.1]) expect(reciprocalScale(sx).sx * reciprocalScale(sx).sy).toBeCloseTo(1, 12);
    expect(shearDeterminant()).toBe(1);
  });
});
