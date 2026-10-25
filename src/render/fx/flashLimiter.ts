// SG §9.13.m: one real-time limiter shared by board, impact and sky flash starts.
export interface FlashLimiter { allow(nowMs: number): boolean; reset(): void; }
export function createFlashLimiter(): FlashLimiter {
  const starts = new Float64Array(3); let count = 0;
  return {
    allow(nowMs) {
      let kept = 0;
      for (let i = 0; i < count; i += 1) if (nowMs - starts[i]! < 1000) starts[kept++] = starts[i]!;
      count = kept;
      if (count >= 3) return false;
      starts[count++] = nowMs;
      return true;
    },
    reset() { count = 0; },
  };
}
const sharedFlashLimiter = createFlashLimiter();
export function allowFlashStart(nowMs: number): boolean { return sharedFlashLimiter.allow(nowMs); }
