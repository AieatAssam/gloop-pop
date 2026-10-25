import { describe, expect, it } from 'vitest';
import { cloneRng, createRng, nextInt, sfc32, serialiseRng } from './rng';

describe('sfc32', () => {
  it('matches the pinned seed test sequence', () => {
    const state = createRng('test');
    expect(Array.from({ length: 8 }, () => sfc32(state))).toEqual([1102423117,3580546884,447549687,4099423696,2827309343,3965170149,4271496330,551392398]);
  });
  it('clones and serialises state without shifting the stream', () => {
    const state = createRng('clone'); sfc32(state); const clone = cloneRng(state);
    expect(sfc32(state)).toBe(sfc32(clone));
    expect(serialiseRng(JSON.parse(JSON.stringify(state)) as ReturnType<typeof createRng>)).toEqual(state);
  });
  it('keeps nextInt within the requested bounds', () => {
    const state = createRng('bounds');
    for (let i = 0; i < 10_000; i += 1) expect(nextInt(state, 7)).toBeGreaterThanOrEqual(0);
    const next = createRng('bounds');
    for (let i = 0; i < 10_000; i += 1) expect(nextInt(next, 7)).toBeLessThan(7);
  });
});
