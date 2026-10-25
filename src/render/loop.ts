// Arch §6: clamp simulation time while keeping animation responsive after a tab stall.
import { easeInOutSine } from './easing';
import { createHitStopClock } from './fx/hitStop';
export type FrameCallback = (dtMs: number, elapsedMs: number, timeScale: number) => void;

export interface RenderLoop { stop(): void; setTimeScale(value: number): void; rampTimeScale(value: number, durationMs: number): void; hitStop(ms: number): void; isHitStopped(): boolean; }

export function startRenderLoop(draw: FrameCallback, frameEnded?: (frameMs: number) => void): RenderLoop {
  let active = true;
  let previous = 0;
  let elapsed = 0;
  let timeScale = 1;
  let request = 0;
  const hitStop = createHitStopClock();
  // Debug-only (?debug=1&slowmo=0.25): stretch all animation time, hit-stop included, for frame-by-frame capture.
  const debugQuery = typeof location === 'undefined' ? undefined : new URLSearchParams(location.search); const debugSlow = debugQuery?.get('debug') === '1' ? Math.min(1, Math.max(0.05, Number(debugQuery.get('slowmo') ?? '1') || 1)) : 1;
  let ramp: { from: number; to: number; start: number; duration: number } | undefined;
  const frame = (now: number): void => {
    if (!active) return;
    const start = performance.now();
    const rawDt = (previous === 0 ? 0 : Math.min(50, Math.max(0, now - previous))) * debugSlow;
    previous = now;
    if (ramp) { const t = Math.min(1, Math.max(0, (performance.now() - ramp.start) / ramp.duration)); timeScale = ramp.from + (ramp.to - ramp.from) * easeInOutSine(t); if (t >= 1) ramp = undefined; }
    const visualDt = hitStop.advance(rawDt);
    const dt = visualDt === 0 ? 0 : visualDt * timeScale;
    elapsed += dt;
    draw(dt, elapsed, timeScale);
    frameEnded?.(performance.now() - start);
    request = requestAnimationFrame(frame);
  };
  request = requestAnimationFrame(frame);
  return {
    stop() { active = false; cancelAnimationFrame(request); },
    setTimeScale(value) { timeScale = Math.max(0, value); ramp = undefined; },
    rampTimeScale(value, durationMs) { ramp = { from: timeScale, to: Math.max(0, value), start: performance.now(), duration: Math.max(1, durationMs) }; },
    hitStop(ms) { hitStop.start(ms); },
    isHitStopped() { return hitStop.active; },
  };
}
