import { describe, expect, it } from 'vitest';
import { createTweenPool } from './tweens';
import { createShake } from './shake';
describe('FX pools', () => {
  it('updates tween timing and eases to its endpoint', () => { const pool = createTweenPool(1); const tween = pool.start(0, 10, 100); expect(tween?.value).toBe(0); pool.update(50); expect(tween?.value).toBe(5); pool.update(50); expect(tween?.active).toBe(false); expect(tween?.value).toBe(10); });
  it('decays shake to zero by its duration', () => { const shake = createShake(); shake.trigger(6, 200); shake.update(100); expect(Math.abs(shake.state.x)).toBeLessThan(6); shake.update(100); expect(shake.state).toMatchObject({ active: false, x: 0, y: 0 }); });
});
