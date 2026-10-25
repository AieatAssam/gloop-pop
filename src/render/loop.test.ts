import { describe, expect, it } from 'vitest';
import { advanceClocks, type Frame } from './loop';

describe('M10.1 render clocks', () => {
  it('keeps R moving while B is frozen and scales W independently', () => {
    const frame: Frame = { realDt: 0, worldDt: 0, boardDt: 0, realNow: 0, worldNow: 0, boardNow: 0 };
    advanceClocks(frame, 16, 1, 0.0001);
    expect(frame.realDt).toBe(16); expect(frame.worldDt).toBe(16); expect(frame.boardDt).toBeCloseTo(0.0016);
    advanceClocks(frame, 20, 0.35, 1);
    expect(frame.realDt).toBe(20); expect(frame.worldDt).toBe(7); expect(frame.boardDt).toBe(7);
  });
});
