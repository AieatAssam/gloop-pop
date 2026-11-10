// Arch §6: one viewport canvas, capped DPR, with a one-way adaptive quality drop.
export interface CanvasSurface {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  dpr: number;
  resize(width: number, height: number): boolean;
  reportFrame(frameMs: number): boolean;
}

/** spec-note: Backing-store budget in device pixels. Above it the DPR drops below the cap of 2. A 600x960 dp tablet at DPR 2 (2.3 M px) ran at 36 fps on the Android 8 device, and 1.3 M px ran at 58 fps. Phones at 360x760 dp stay at DPR 2 (1.1 M px). */
export const MAX_CANVAS_PIXELS = 1_300_000;

/** The DPR used for a canvas of this CSS size: capped at 2 and at the pixel budget, never below 1. */
export function canvasDpr(capDpr: number, width: number, height: number): number {
  const area = Math.max(1, width * height);
  return Math.max(1, Math.min(capDpr, Math.sqrt(MAX_CANVAS_PIXELS / area)));
}

/** spec-note: A frame is slow above this rAF interval. A 60 Hz display runs at 16.7 ms, so 25 ms is about 40 fps. */
export const SLOW_FRAME_MS = 25;
const SLOW_WINDOW_FRAMES = 120;
const SLOW_WINDOW_MS = 2000;

/**
 * Decides when the DPR cap should drop. The test is the median of the last 120 frames: more than half
 * are slow, sustained for 2 s. The old test was a mean over 20 ms, and one cold start (font and sprite
 * setup) or a few long frames pushed it over and dropped a phone to DPR 1.5 for the whole session.
 */
export function createSlowFrameDetector(): { report(frameMs: number): boolean } {
  const samples = new Float32Array(SLOW_WINDOW_FRAMES);
  let cursor = 0;
  let filled = 0;
  let slowCount = 0;
  let slowMs = 0;
  return {
    report(frameMs) {
      const value = Math.max(0, frameMs);
      if (filled === samples.length) { if ((samples[cursor] ?? 0) > SLOW_FRAME_MS) slowCount -= 1; } else filled += 1;
      samples[cursor] = value;
      if (value > SLOW_FRAME_MS) slowCount += 1;
      cursor = (cursor + 1) % samples.length;
      if (filled === samples.length && slowCount * 2 > samples.length) slowMs += value;
      else slowMs = 0;
      if (slowMs < SLOW_WINDOW_MS) return false;
      slowMs = 0;
      return true;
    },
  };
}

/** spec-note: Recovery step-up. A frame whose average over a streak is at or under 18 ms (about 55 fps or better) counts as fast. */
export const FAST_MEAN_MS = 18;
/** spec-note: Recovery needs 20 s of fast frames with no frame over SLOW_FRAME_MS. Each later step-up needs 20 s more (40 s, then 60 s), and at most 2 step-ups happen per session, so a phone that keeps dropping cannot oscillate between DPR levels. */
export const RECOVER_MS = 20_000;
export const MAX_RECOVERIES = 2;

/**
 * Reports true once frames have been fast for `requiredMs`. Any frame over SLOW_FRAME_MS restarts the streak,
 * and the streak's mean frame time must stay at or under FAST_MEAN_MS.
 */
export function createFastFrameDetector(requiredMs: number): { report(frameMs: number): boolean } {
  let streakMs = 0;
  let streakFrames = 0;
  return {
    report(frameMs) {
      const value = Math.max(0, frameMs);
      if (value > SLOW_FRAME_MS) { streakMs = 0; streakFrames = 0; return false; }
      streakMs += value; streakFrames += 1;
      return streakMs >= requiredMs && streakMs / streakFrames <= FAST_MEAN_MS;
    },
  };
}

export function createCanvasSurface(canvas: HTMLCanvasElement): CanvasSurface {
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Canvas2D is not available.');
  let width = 0;
  let height = 0;
  let dprCap = Math.min(window.devicePixelRatio || 1, 2);
  let dpr = dprCap;
  const dprMax = dprCap;
  let recoveries = 0;
  const slow = createSlowFrameDetector();
  let fast = createFastFrameDetector(RECOVER_MS);

  const applySize = (): void => {
    dpr = canvasDpr(dprCap, width, height);
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  return {
    canvas, context,
    get width() { return width; },
    get height() { return height; },
    get dpr() { return dpr; },
    resize(nextWidth, nextHeight) {
      const nextW = Math.max(1, Math.round(nextWidth));
      const nextH = Math.max(1, Math.round(nextHeight));
      if (nextW === width && nextH === height) return false;
      width = nextW;
      height = nextH;
      applySize();
      return true;
    },
    reportFrame(frameMs) {
      if (dprCap < dprMax && recoveries < MAX_RECOVERIES) {
        if (fast.report(frameMs)) {
          recoveries += 1;
          dprCap = dprCap < 1.5 ? 1.5 : dprMax;
          fast = createFastFrameDetector(RECOVER_MS * (recoveries + 1));
          applySize();
          return true;
        }
      }
      if (!slow.report(frameMs) || dprCap <= 1.25) return false;
      dprCap = dprCap > 1.5 ? 1.5 : 1.25;
      fast = createFastFrameDetector(RECOVER_MS * (recoveries + 1));
      applySize();
      return true;
    },
  };
}
