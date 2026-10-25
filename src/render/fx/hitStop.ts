// SG §9.13.a: board-effects hitstop runs on R and never pauses input or W.
import { easeInOutSine } from '../easing';

export type HitStopTier = 'lines' | 'big' | 'huge' | 'mega';

export function dispatchImmediately<T>(endNow: () => void, dispatch: () => T): T {
  endNow();
  return dispatch();
}

export function hitStopMs(cells: number, tier: HitStopTier, comboTier: number): number {
  if (cells <= 0) return 0;
  const floor = tier === 'lines' ? 34 : tier === 'big' ? 50 : tier === 'huge' ? 60 : 70;
  const cap = tier === 'lines' ? 80 : tier === 'big' ? 100 : tier === 'huge' ? 110 : 120;
  const base = Math.min(cap, floor + cells * 2);
  const multiplier = [1, 0.9, 0.8, 0.7, 0.6][Math.max(0, Math.min(4, Math.floor(comboTier)))] ?? 1;
  return Math.min(120, Math.max(Math.min(base, 50), Math.round(base * multiplier)));
}

export interface HitStopController {
  schedule(boardTime: number, durationMs: number): void;
  step(realNow: number, boardNow: number): number;
  endNow(): void;
  reset(): void;
  readonly scale: number;
  readonly active: boolean;
}

export function createHitStop(): HitStopController {
  let armedAt = -1;
  let firstStart = -1;
  let endAt = -1;
  let duration = 0;
  let scale = 1;
  return {
    schedule(boardTime, durationMs) {
      const requested = Math.max(0, Math.min(150, durationMs));
      if (requested === 0) return;
      armedAt = boardTime;
      duration = requested;
    },
    step(realNow, boardNow) {
      if (armedAt >= 0 && boardNow >= armedAt) {
        armedAt = -1;
        if (firstStart < 0 || realNow >= endAt) firstStart = realNow;
        endAt = Math.min(firstStart + 150, Math.max(endAt, realNow + duration));
      }
      if (firstStart < 0) { scale = 1; return scale; }
      const total = endAt - firstStart;
      const held = Math.round(total * 0.6);
      const age = realNow - firstStart;
      if (age < held) scale = 0.0001;
      else if (age < total) scale = 0.0001 + (1 - 0.0001) * easeInOutSine((age - held) / Math.max(1, total - held));
      else { scale = 1; firstStart = -1; endAt = -1; }
      return scale;
    },
    endNow() { armedAt = -1; firstStart = -1; endAt = -1; scale = 1; },
    reset() { this.endNow(); },
    get scale() { return scale; },
    get active() { return firstStart >= 0 || armedAt >= 0; },
  };
}
