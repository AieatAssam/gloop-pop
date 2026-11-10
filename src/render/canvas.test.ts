import { afterEach, describe, expect, it, vi } from 'vitest';
import { canvasDpr, createCanvasSurface, createFastFrameDetector, createSlowFrameDetector, MAX_CANVAS_PIXELS, RECOVER_MS } from './canvas';

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

describe('createFastFrameDetector', () => {
  it('needs the full streak before it reports', () => {
    const detector = createFastFrameDetector(RECOVER_MS);
    let ready = false;
    for (let i = 0; i < RECOVER_MS / 16 - 2; i += 1) ready = detector.report(16) || ready;
    expect(ready).toBe(false);
    for (let i = 0; i < 10; i += 1) ready = detector.report(16) || ready;
    expect(ready).toBe(true);
  });

  it('restarts the streak on any frame over the slow threshold', () => {
    const detector = createFastFrameDetector(1000);
    for (let i = 0; i < 50; i += 1) detector.report(16);
    detector.report(30);
    let ready = false;
    for (let i = 0; i < 40; i += 1) ready = detector.report(16) || ready;
    expect(ready).toBe(false);
  });

  it('does not report while the mean is above the fast threshold', () => {
    const detector = createFastFrameDetector(1000);
    let ready = false;
    for (let i = 0; i < 200; i += 1) ready = detector.report(i % 2 ? 24 : 14) || ready;
    expect(ready).toBe(false);
  });
});

describe('createCanvasSurface DPR recovery', () => {
  afterEach(() => vi.unstubAllGlobals());

  function makeSurface(dpr: number) {
    vi.stubGlobal('window', { devicePixelRatio: dpr });
    const canvas = { width: 0, height: 0, style: { width: '', height: '' }, getContext: () => ({ setTransform: () => undefined }) };
    const surface = createCanvasSurface(canvas as unknown as HTMLCanvasElement);
    surface.resize(360, 760);
    return surface;
  }
  // Feeds slow frames until the DPR steps down once (a 2 s slow window), so one call is exactly one drop.
  const slowFrames = (surface: ReturnType<typeof makeSurface>) => { const before = surface.dpr; for (let i = 0; i < 2000 && surface.dpr === before; i += 1) surface.reportFrame(30); };
  const fastFrames = (surface: ReturnType<typeof makeSurface>, ms: number) => { for (let t = 0; t < ms; t += 16) surface.reportFrame(16); };

  it('stays at DPR 2 on a phone through a cold start of long frames', () => {
    const surface = makeSurface(2);
    for (let i = 0; i < 10; i += 1) surface.reportFrame(200);
    fastFrames(surface, 30000);
    expect(surface.dpr).toBe(2);
  });

  it('steps back up after a sustained fast period and not sooner', () => {
    const surface = makeSurface(2);
    slowFrames(surface);
    expect(surface.dpr).toBe(1.5);
    fastFrames(surface, RECOVER_MS - 1000);
    expect(surface.dpr).toBe(1.5);
    fastFrames(surface, 3000);
    expect(surface.dpr).toBe(2);
  });

  it('does not oscillate: a second drop needs a longer fast period and recoveries are capped', () => {
    const surface = makeSurface(2);
    slowFrames(surface);
    fastFrames(surface, RECOVER_MS + 2000);
    expect(surface.dpr).toBe(2);
    slowFrames(surface);
    expect(surface.dpr).toBe(1.5);
    fastFrames(surface, RECOVER_MS + 2000);
    expect(surface.dpr).toBe(1.5);
    fastFrames(surface, RECOVER_MS + 2000);
    expect(surface.dpr).toBe(2);
    slowFrames(surface);
    fastFrames(surface, RECOVER_MS * 10);
    expect(surface.dpr).toBe(1.5);
  });
});
