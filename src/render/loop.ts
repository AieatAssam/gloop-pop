// Arch §6: clamp simulation time while keeping animation responsive after a tab stall.
export type FrameCallback = (dtMs: number, elapsedMs: number, timeScale: number) => void;

export interface RenderLoop { stop(): void; setTimeScale(value: number): void }

export function startRenderLoop(draw: FrameCallback, frameEnded?: (frameMs: number) => void): RenderLoop {
  let active = true;
  let previous = 0;
  let elapsed = 0;
  let timeScale = 1;
  let request = 0;
  const frame = (now: number): void => {
    if (!active) return;
    const start = performance.now();
    const rawDt = previous === 0 ? 0 : Math.min(50, Math.max(0, now - previous));
    previous = now;
    const dt = rawDt * timeScale;
    elapsed += dt;
    draw(dt, elapsed, timeScale);
    frameEnded?.(performance.now() - start);
    request = requestAnimationFrame(frame);
  };
  request = requestAnimationFrame(frame);
  return {
    stop() { active = false; cancelAnimationFrame(request); },
    setTimeScale(value) { timeScale = Math.max(0, value); },
  };
}
