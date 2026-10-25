import { describe, expect, it } from 'vitest';
import { createDirector, waveStep } from './director';

describe('M10.1 effect reset', () => {
  it('clears active visual effects and shake immediately on restart', () => {
    const director = createDirector(); director.receive([{ type: 'stuck', unfit: [] }], 0);
    expect(director.shakeOffset().x).not.toBe(0);
    director.reset();
    expect(director.shakeOffset()).toEqual({ x: 0, y: 0 });
  });
});

describe('SG §9.13.g pop wave', () => {
  it('fits large gloops inside the 330 ms wave window and keeps small steps at 38 ms', () => {
    expect(waveStep(27)).toBe(330 / 27);
    expect((27 - 1) * waveStep(27)).toBeLessThanOrEqual(330);
    expect(waveStep(3)).toBe(38);
  });
});
