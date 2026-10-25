// Arch §6 and SG §9.13.a: R, W and B clocks share one reused frame record.
import { createHitStop, type HitStopController } from './fx/hitStop';
import { createSlowMo, type SlowMoController } from './fx/slowMo';

export interface Frame { realDt: number; worldDt: number; boardDt: number; realNow: number; worldNow: number; boardNow: number; }
export type FrameCallback = (frame: Readonly<Frame>) => void;

export interface RenderLoop {
  stop(): void;
  requestSlowMo(scale: number, inMs: number, holdMs: number, outMs: number): void;
  scheduleHitStop(boardTime: number, durationMs: number): void;
  endNow(): void;
  resetEffects(): void;
  readonly timeScale: number;
  readonly hitStopScale: number;
}

export function advanceClocks(frame: Frame, realDt: number, slowScale: number, hitScale: number): void {
  frame.realDt = realDt; frame.worldDt = realDt * slowScale; frame.boardDt = frame.worldDt * hitScale;
  frame.realNow += frame.realDt; frame.worldNow += frame.worldDt; frame.boardNow += frame.boardDt;
}

export function startRenderLoop(draw: FrameCallback, frameEnded?: (frameMs: number) => void): RenderLoop {
  let active = true;
  let previous = 0;
  let realNow = 0;
  let worldNow = 0;
  let boardNow = 0;
  let request = 0;
  const hitStop: HitStopController = createHitStop();
  const slowMo: SlowMoController = createSlowMo();
  // Debug-only slowmo scales R for capture; ordinary slow motion scales W and B only.
  const debugQuery = typeof location === 'undefined' ? undefined : new URLSearchParams(location.search);
  const debugSlow = debugQuery?.get('debug') === '1' ? Math.min(1, Math.max(0.05, Number(debugQuery.get('slowmo') ?? '1') || 1)) : 1;
  const frameState: Frame = { realDt: 0, worldDt: 0, boardDt: 0, realNow: 0, worldNow: 0, boardNow: 0 };
  const frame = (now: number): void => {
    if (!active) return;
    const start = performance.now();
    const raw = previous === 0 ? 0 : Math.min(50, Math.max(0, now - previous)) * debugSlow;
    previous = now;
    const nextRealNow = realNow + raw;
    const slowScale = slowMo.step(nextRealNow);
    const h = hitStop.step(nextRealNow, boardNow);
    frameState.realNow = realNow; frameState.worldNow = worldNow; frameState.boardNow = boardNow;
    advanceClocks(frameState, raw, slowScale, h);
    realNow = frameState.realNow; worldNow = frameState.worldNow; boardNow = frameState.boardNow;
    draw(frameState);
    frameEnded?.(performance.now() - start);
    request = requestAnimationFrame(frame);
  };
  request = requestAnimationFrame(frame);
  return {
    stop() { active = false; cancelAnimationFrame(request); },
    requestSlowMo(scale, inMs, holdMs, outMs) { slowMo.request(scale, inMs, holdMs, outMs); },
    scheduleHitStop(at, duration) { hitStop.schedule(at, duration); },
    endNow() { hitStop.endNow(); },
    resetEffects() { hitStop.reset(); slowMo.reset(); },
    get timeScale() { return slowMo.scale; },
    get hitStopScale() { return hitStop.scale; },
  };
}
