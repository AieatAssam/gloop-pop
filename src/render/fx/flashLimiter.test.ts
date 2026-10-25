import { describe, expect, it } from 'vitest';
import { createFlashLimiter } from './flashLimiter';

describe('SG §9.13.m flash limiter', () => {
  it('allows three starts in a rolling second and refuses the fourth', () => {
    const limiter = createFlashLimiter();
    expect(limiter.allow(0)).toBe(true); expect(limiter.allow(250)).toBe(true); expect(limiter.allow(500)).toBe(true);
    expect(limiter.allow(750)).toBe(false); expect(limiter.allow(1001)).toBe(true);
  });
});
