import { describe, expect, it } from 'vitest';
import { createTweenPool } from './tweens';
describe('FX pools', () => {
  it('updates tween timing and eases to its endpoint', () => { const pool = createTweenPool(1); const tween = pool.start(0, 10, 100); expect(tween?.value).toBe(0); pool.update(50); expect(tween?.value).toBe(5); pool.update(50); expect(tween?.active).toBe(false); expect(tween?.value).toBe(10); });
});
