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

export function createCanvasSurface(canvas: HTMLCanvasElement): CanvasSurface {
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Canvas2D is not available.');
  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let sampleCount = 0;
  let cursor = 0;
  let sum = 0;
  let overBudgetMs = 0;
  const samples = new Float32Array(120);

  const applySize = (): void => {
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
      const old = samples[cursor] ?? 0;
      if (sampleCount === samples.length) sum -= old;
      else sampleCount += 1;
      const value = Math.max(0, frameMs);
      samples[cursor] = value;
      sum += value;
      cursor = (cursor + 1) % samples.length;
      if (sampleCount === samples.length && sum / samples.length > 20) overBudgetMs += value;
      else overBudgetMs = 0;
      if (overBudgetMs < 2000 || dpr <= 1.25) return false;
      dpr = dpr > 1.5 ? 1.5 : 1.25;
      overBudgetMs = 0;
      applySize();
      return true;
    },
  };
}
