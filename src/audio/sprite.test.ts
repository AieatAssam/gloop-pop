import { describe, expect, it } from 'vitest';
import { findSpriteOffset } from './sprite';

describe('findSpriteOffset', () => {
  it.each([-0.05, 0, 0.04])('finds a click delayed by %s seconds', (delay) => {
    const rate = 48_000;
    const data = new Float32Array(rate);
    const index = Math.round((0.1 + delay) * rate);
    data[index] = 0.9;
    data[index + 1] = -0.9;
    expect(findSpriteOffset(data, rate)).toBeCloseTo(delay, 5);
  });

  it('returns zero for a silent buffer', () => {
    expect(findSpriteOffset(new Float32Array(100), 48_000)).toBe(0);
  });
});
