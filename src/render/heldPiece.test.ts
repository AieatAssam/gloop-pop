import { describe, expect, it } from 'vitest';
import { createHeldPiece, updateHeldPiece } from './heldPiece';

describe('SG §9.13 held piece transforms', () => {
  it('keeps grab squash and drag stretch volume neutral and clamps tilt', () => {
    const state = createHeldPiece(0, 0); let result = updateHeldPiece(state, 0, 0, 16, 44);
    for (let i = 0; i < 20; i += 1) result = updateHeldPiece(state, 1000 + i * 44, 0, 16, 44);
    expect(result.grabSx * result.grabSy).toBeCloseTo(1, 12);
    expect(result.stretch * (1 / result.stretch)).toBeCloseTo(1, 12);
    expect(Math.abs(result.tilt)).toBeLessThanOrEqual(5 * Math.PI / 180);
  });

  it('sets the drawn position to the finger in reduced motion', () => {
    const state = createHeldPiece(0, 0); const result = updateHeldPiece(state, 32, 48, 16, 44, true, 32, 48, 7, 0.75, 0.4);
    expect(result.x).toBe(32); expect(result.y).toBe(48);
    expect(result.tilt).toBe(0); expect(result.stretch).toBe(1); expect(result.shear).toBe(0);
    expect(result.grabSx).toBe(1); expect(result.pickupScale).toBeCloseTo(0.496);
  });
});
