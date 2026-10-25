import { describe, expect, it } from 'vitest';
import { createDirector } from './director';

describe('M10.1 effect reset', () => {
  it('clears active visual effects and shake immediately on restart', () => {
    const director = createDirector(); director.receive([{ type: 'stuck', unfit: [] }], 0);
    expect(director.shakeOffset().x).not.toBe(0);
    director.reset();
    expect(director.shakeOffset()).toEqual({ x: 0, y: 0 });
  });
});
