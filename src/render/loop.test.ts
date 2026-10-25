import { describe, expect, it, vi } from 'vitest';
import { advanceClocks, startRenderLoop, type Frame } from './loop';

describe('M10.1 render clocks', () => {
  it('keeps R moving while B is frozen and scales W independently', () => {
    const frame: Frame = { realDt: 0, worldDt: 0, boardDt: 0, realNow: 0, worldNow: 0, boardNow: 0 };
    advanceClocks(frame, 16, 1, 0.0001);
    expect(frame.realDt).toBe(16); expect(frame.worldDt).toBe(16); expect(frame.boardDt).toBeCloseTo(0.0016);
    advanceClocks(frame, 20, 0.35, 1);
    expect(frame.realDt).toBe(20); expect(frame.worldDt).toBe(7); expect(frame.boardDt).toBe(7);
  });
  it('advances each clock once per real frame', () => {
    const frame: Frame = { realDt: 0, worldDt: 0, boardDt: 0, realNow: 0, worldNow: 0, boardNow: 0 };
    let world = 0;
    for (let i = 0; i < 6; i += 1) { advanceClocks(frame, 16.7, 0.35, i < 2 ? 0.0001 : 1); world += 16.7 * 0.35; }
    expect(frame.realNow).toBeCloseTo(6 * 16.7);
    expect(frame.worldNow).toBeCloseTo(world);
  });
  it('uses the real startRenderLoop frame path without doubling R timestamps', () => {
    let callback: FrameRequestCallback | undefined;
    vi.stubGlobal('requestAnimationFrame', (next: FrameRequestCallback) => { callback = next; return 1; });
    vi.stubGlobal('cancelAnimationFrame', () => undefined);
    const seen: Frame[] = [];
    const loop = startRenderLoop((frame) => seen.push({ ...frame }));
    const invoke = (time: number): void => { const next = callback; if (next) next(time); };
    invoke(100); for (let i = 1; i <= 6; i += 1) invoke(100 + i * 16.7);
    loop.stop(); vi.unstubAllGlobals();
    const timed = seen.filter((frame) => frame.realDt > 0);
    expect(timed[timed.length - 1]!.realNow).toBeCloseTo(timed.reduce((sum, frame) => sum + frame.realDt, 0));
    expect(timed[timed.length - 1]!.worldNow).toBeCloseTo(timed.reduce((sum, frame) => sum + frame.worldDt, 0));
  });
});
