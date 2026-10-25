import { describe, expect, it } from 'vitest';
import { createCamera, traumaShake } from './camera';

describe('SG §9.13.g trauma camera', () => {
  it('uses squared trauma and clamps additions', () => {
    expect(traumaShake(0.3)).toBeCloseTo(0.09);
    expect(traumaShake(0.6)).toBeCloseTo(0.36);
    expect(traumaShake(0.9)).toBeCloseTo(0.81);
    const camera = createCamera(); camera.trauma(0.7); camera.trauma(0.7);
    expect(camera.traumaValue).toBe(1);
  });
  it('decays trauma linearly and stuck events shake x only', () => {
    const camera = createCamera(); camera.configure(44, false); camera.trauma(0.45, false, true); camera.update(100, 0);
    expect(camera.traumaValue).toBeCloseTo(0.29);
    expect(camera.offset.x).not.toBe(0); expect(camera.offset.y).toBe(0); expect(camera.offset.roll).toBe(0);
  });
  it('keeps noise continuous and clears all movement for reduced motion', () => {
    const camera = createCamera(); camera.trauma(1); camera.update(1, 100); const x = camera.offset.x;
    camera.update(1, 101); expect(Math.abs(camera.offset.x - x)).toBeLessThan(1);
    camera.update(16, 120, true); expect(camera.offset).toEqual({ x: 0, y: 0, roll: 0 }); expect(camera.traumaValue).toBe(0);
  });
  it('clamps combined kick and shake to 0.45 cells', () => {
    const camera = createCamera(); camera.configure(44, false); camera.trauma(1); camera.kick(100, 1, 1); camera.update(16, 20);
    expect(Math.abs(camera.offset.x)).toBeLessThanOrEqual(19.8);
    expect(Math.abs(camera.offset.y)).toBeLessThanOrEqual(19.8);
  });
});
