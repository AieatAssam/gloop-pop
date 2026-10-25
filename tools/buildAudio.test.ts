import { describe, expect, it } from 'vitest';
import { bakeLoop } from './build-audio.mjs';

describe('music loop bake', () => {
  it('returns a loop window with the specified equal-power tail crossfade and a closed wrap endpoint', () => {
    const source = Float32Array.from([0, 1, 2, 3, 4, 5, 6, 7]);
    const loop = bakeLoop(source, 2);
    expect(loop).toHaveLength(6);
    expect(loop[4]).toBeCloseTo(6 * Math.cos(Math.PI / 8) + 0 * Math.sin(Math.PI / 8), 6);
    expect(loop[5]).toBe(loop[0]);
    for (let k = 0; k < 2; k += 1) {
      const phase = Math.PI / 2 * (k + 0.5) / 2;
      expect(Math.sin(phase) ** 2 + Math.cos(phase) ** 2).toBeCloseTo(1, 12);
    }
  });
});
