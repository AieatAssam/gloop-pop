// M2.1–M2.6: boot a live Classic run and connect canvas, reducer, input and HUD.
// spec-note: this milestone keeps the personal best in memory for the session; durable save wiring is M3.1.
import { createCanvasSurface } from '../render/canvas';
import { createBackground } from '../render/background';
import { computeLayout, type Layout } from '../render/layout';
import { startRenderLoop } from '../render/loop';
import { PALETTE } from '../render/palette';
import { createBoardView } from '../render/boardView';
import { drawHud } from '../render/hudView';
import { createDirector } from '../render/director';
import { createPointerInput } from '../input/pointer';
import { attachKeyboard } from '../input/keyboard';
import { createSession } from './session';
import { createGameUi } from '../ui/dom';
import { createTopBar } from '../ui/topBar';
import { S } from '../ui/strings';

export function bootApp(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('#game'); const uiRoot = document.querySelector<HTMLElement>('#ui');
  if (!canvas || !uiRoot) throw new Error('Missing game surface.');
  const surface = createCanvasSurface(canvas); const background = createBackground('midnight'); const view = createBoardView(); const director = createDirector(); const session = createSession();
  const ui = createGameUi(uiRoot); let paused = false; let shownScore = 0; let shownStatus = '';
  let layout: Layout = computeLayout(window.innerWidth, window.innerHeight); let renderElapsed = 0; const query = new URLSearchParams(window.location.search); const demoBoard = query.get('demo') === 'board'; const demoFaces = query.get('demo') === 'faces'; const demoBg = query.get('demo') === 'bg'; const debug = query.get('debug') === '1';
  const showPause = (): void => { paused = true; ui.showPause(() => { paused = false; ui.hide(); }, () => { if (session.state.score > 0) ui.showRestartConfirm(() => restart(), () => showPause()); else restart(); }); };
  const pause = (): void => { if (session.state.status !== 'playing') return; if (paused) { paused = false; ui.hide(); } else showPause(); };
  const topBar = createTopBar(() => { if (session.state.status === 'over') return; if (!paused) showPause(); }); uiRoot.append(topBar.element);
  const pointer = createPointerInput(view, () => layout, () => session.state, (slot, row, col) => apply({ type: 'place', slot: slot as 0 | 1 | 2, row, col }));
  const keyboard = attachKeyboard(view, () => layout, () => session.state, (slot, row, col) => apply({ type: 'place', slot: slot as 0 | 1 | 2, row, col }), () => pointer.cancel(), pause);
  const resize = (): void => {
    surface.resize(window.innerWidth, window.innerHeight);
    const rootStyle = getComputedStyle(document.documentElement); const safeTop = Number.parseFloat(rootStyle.getPropertyValue('--safe-area-top')) || 0; const safeBottom = Number.parseFloat(rootStyle.getPropertyValue('--safe-area-bottom')) || 0;
    layout = computeLayout(surface.width, surface.height, { top: safeTop, bottom: safeBottom }); background.resize(surface.width, surface.height, layout);
    topBar.element.style.left = `${layout.column.x}px`; topBar.element.style.width = `${layout.column.width}px`; topBar.element.style.top = `${layout.topBar.y}px`; topBar.element.style.height = `${layout.topBar.height}px`;
  };
  resize(); window.addEventListener('resize', resize, { passive: true });
  canvas.addEventListener('pointerdown', (event) => { if (paused || session.state.status !== 'playing') return; canvas.setPointerCapture(event.pointerId); pointer.pointerDown(event.offsetX, event.offsetY, event.pointerType); });
  canvas.addEventListener('pointermove', (event) => { if (session.state.status === 'playing') pointer.pointerMove(event.offsetX, event.offsetY, event.pointerType); });
  canvas.addEventListener('pointerup', (event) => { if (paused || session.state.status !== 'playing') return; pointer.pointerUp(event.offsetX, event.offsetY, event.pointerType); });
  canvas.addEventListener('pointercancel', () => pointer.cancel());
  document.addEventListener('visibilitychange', () => { if (document.hidden && !paused && session.state.status === 'playing') showPause(); });
  window.addEventListener('keydown', (event) => {
    if (session.state.status === 'over' && [' ', 'Enter', 'r', 'R'].includes(event.key)) { event.preventDefault(); restart(); }
  });
  startRenderLoop((dtMs, elapsedMs) => {
    renderElapsed = elapsedMs;
    const ctx = surface.context; ctx.setTransform(surface.dpr, 0, 0, surface.dpr, 0, 0); background.draw(ctx, elapsedMs, layout, session.state.stage);
    if (!demoBg) {
      view.draw(ctx, layout, session.state, elapsedMs, paused ? undefined : pointer.drag ?? keyboard.drag(), demoBoard ? 'board' : demoFaces ? 'faces' : '');
      director.draw(ctx, layout, elapsedMs);
      if (paused) { ctx.fillStyle = PALETTE.ui.scrim; ctx.fillRect(0, 0, layout.width, layout.height); }
      shownScore = drawHud(ctx, layout, session.state, session.best, elapsedMs, shownScore);
      if (debug) drawDebug(ctx, layout, surface.dpr, dtMs);
    }
    updateOverlay();
  }, (elapsed) => surface.reportFrame(elapsed));

  function apply(action: Parameters<typeof session.dispatch>[0]): void { const events = session.dispatch(action); director.receive(events, renderElapsed); paused = false; ui.hide(); }
  function restart(): void { session.restart(); shownScore = 0; shownStatus = ''; director.receive([], renderElapsed); paused = false; ui.hide(); pointer.cancel(); }
  function updateOverlay(): void {
    const status = session.state.status;
    if (status === shownStatus) return; shownStatus = status;
    if (status === 'over') { paused = false; ui.showGameOver(() => restart(), session.state.score, session.best, S.gameOverFallback(session.state.stats.biggestPop, session.state.linesCleared)); }
    else if (status === 'rescueOffer') ui.showRescue(() => { const events = session.dispatch({ type: 'useRescue' }); director.receive(events, renderElapsed); ui.hide(); shownStatus = ''; }, () => { const events = session.dispatch({ type: 'declineRescue' }); director.receive(events, renderElapsed); ui.hide(); shownStatus = ''; });
    else if (!paused) ui.hide();
  }
}

function drawDebug(context: CanvasRenderingContext2D, layout: Layout, dpr: number, dt: number): void {
  context.save(); context.fillStyle = PALETTE.light.shadowDeep; context.fillRect(8, 8, 170, 52); context.fillStyle = PALETTE.ui.textPrimary; context.font = '700 12px Nunito, sans-serif'; context.fillText(`frame ${dt.toFixed(1)} ms`, 16, 28); context.fillText(`dpr ${dpr.toFixed(2)} · ${layout.width}×${layout.height}`, 16, 47); context.restore();
}
