// M2.1 boot → play skeleton; M2.2 draws the full Midnight background.
import { createCanvasSurface } from '../render/canvas';
import { createBackground } from '../render/background';
import { computeLayout, type Layout } from '../render/layout';
import { startRenderLoop } from '../render/loop';
import { PALETTE } from '../render/palette';

export function bootApp(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('#game');
  if (!canvas) throw new Error('Missing #game canvas.');
  const surface = createCanvasSurface(canvas);
  const background = createBackground('midnight');
  let layout: Layout = computeLayout(window.innerWidth, window.innerHeight);
  let frameMs = 0;
  let fps = 0;
  let fpsElapsed = 0;
  let fpsFrames = 0;
  const demoBg = new URLSearchParams(window.location.search).get('demo') === 'bg';
  const debug = new URLSearchParams(window.location.search).get('debug') === '1';

  const resize = (): void => {
    surface.resize(window.innerWidth, window.innerHeight);
    const rootStyle = getComputedStyle(document.documentElement);
    const safeTop = Number.parseFloat(rootStyle.getPropertyValue('--safe-area-top')) || 0;
    const safeBottom = Number.parseFloat(rootStyle.getPropertyValue('--safe-area-bottom')) || 0;
    layout = computeLayout(surface.width, surface.height, { top: safeTop, bottom: safeBottom });
    background.resize(surface.width, surface.height, layout);
  };
  resize();
  window.addEventListener('resize', resize, { passive: true });

  startRenderLoop((dtMs, elapsedMs) => {
    const ctx = surface.context;
    ctx.setTransform(surface.dpr, 0, 0, surface.dpr, 0, 0);
    background.draw(ctx, elapsedMs, layout);
    if (!demoBg) drawBoardAndTrayHook(ctx, layout);
    if (debug) {
      fpsElapsed += dtMs;
      fpsFrames += 1;
      if (fpsElapsed >= 500) { fps = fpsFrames * 1000 / fpsElapsed; fpsElapsed = 0; fpsFrames = 0; }
      drawDebug(ctx, fps, frameMs, surface.dpr);
    }
  }, (elapsed) => {
    frameMs = elapsed;
    surface.reportFrame(elapsed);
  });
}

// spec-note: M2.1/M2.2 boot has no board or tray state yet; M2.3/M2.5 attach renderers here.
function drawBoardAndTrayHook(context: CanvasRenderingContext2D, layout: Layout): void {
  void context;
  void layout;
}

function drawDebug(context: CanvasRenderingContext2D, fps: number, frameMs: number, dpr: number): void {
  context.save();
  context.fillStyle = PALETTE.light.shadowDeep;
  context.fillRect(8, 8, 150, 54);
  context.fillStyle = PALETTE.ui.textPrimary;
  context.font = '700 12px Nunito, sans-serif';
  context.fillText(`fps ${fps.toFixed(0)}  frame ${frameMs.toFixed(1)} ms`, 16, 29);
  context.fillText(`dpr ${dpr.toFixed(2)}`, 16, 48);
  context.restore();
}
