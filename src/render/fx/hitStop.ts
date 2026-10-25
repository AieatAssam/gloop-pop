// Design §23.4: real-time hit-stop clock; only animation dt is frozen.
export function createHitStopClock() {
  let remainingMs = 0;
  return { start(ms: number): void { remainingMs = Math.max(remainingMs, Math.max(0, ms)); }, advance(realDtMs: number): number { const consumed = Math.min(Math.max(0, realDtMs), remainingMs); remainingMs -= consumed; return remainingMs > 0 || consumed > 0 ? 0 : realDtMs; }, get active(): boolean { return remainingMs > 0; } };
}
