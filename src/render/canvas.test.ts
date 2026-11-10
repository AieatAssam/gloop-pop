import { describe, expect, it } from 'vitest';
import { canvasDpr, createSlowFrameDetector, MAX_CANVAS_PIXELS } from './canvas';

describe('canvasDpr', () => {
  it('keeps the cap of 2 on phone-sized canvases', () => {
    expect(canvasDpr(2, 360, 760)).toBe(2);
    expect(canvasDpr(2, 360, 640)).toBe(2);
  });

  it('drops below 2 on tablet-sized canvases and stays within the pixel budget', () => {
    const dpr = canvasDpr(2, 600, 960);
    expect(dpr).toBeLessThan(2);
    expect(dpr).toBeGreaterThanOrEqual(1);
    expect(Math.round(600 * dpr) * Math.round(960 * dpr)).toBeLessThanOrEqual(MAX_CANVAS_PIXELS * 1.01);
  });

  it('never goes below 1 and never exceeds the device cap', () => {
    expect(canvasDpr(1, 600, 960)).toBe(1);
    expect(canvasDpr(1.5, 100, 100)).toBe(1.5);
  });
});

describe('createSlowFrameDetector', () => {
  it('ignores a cold start and a few long frames', () => {
    const detector = createSlowFrameDetector();
    let dropped = false;
    for (let i = 0; i < 10; i += 1) dropped = detector.report(200) || dropped;
    for (let i = 0; i < 300; i += 1) dropped = detector.report(i % 40 === 0 ? 60 : 17) || dropped;
    expect(dropped).toBe(false);
  });

  it('reports a drop when most frames stay slow for 2 s', () => {
    const detector = createSlowFrameDetector();
    let dropped = false;
    for (let i = 0; i < 300; i += 1) dropped = detector.report(30) || dropped;
    expect(dropped).toBe(true);
  });
});
