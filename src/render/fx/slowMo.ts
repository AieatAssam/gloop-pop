// SG §9.13.a: slow motion is an R-clock controller; it never pauses R.
import { easeInOutSine, easeOutQuad } from '../easing';

export interface SlowMoController {
  request(scale: number, inMs: number, holdMs: number, outMs: number): void;
  step(realNow: number): number;
  reset(): void;
  readonly scale: number;
}

export function createSlowMo(): SlowMoController {
  let value = 1;
  let startValue = 1;
  let target = 1;
  let startAt = 0;
  let inMs = 0;
  let holdMs = 0;
  let outMs = 0;
  let active = false;
  let lastNow = 0;
  return {
    request(scale, rampIn, hold, rampOut) {
      startValue = value; target = Math.max(0.35, Math.min(1, scale)); startAt = lastNow;
      inMs = Math.max(0, rampIn); holdMs = Math.max(0, hold); outMs = Math.max(0, rampOut); active = true;
    },
    step(now) {
      lastNow = now;
      if (!active) return value;
      const age = Math.max(0, now - startAt);
      if (age < inMs) value = startValue + (target - startValue) * easeOutQuad(age / Math.max(1, inMs));
      else if (age < inMs + holdMs) value = target;
      else if (age < inMs + holdMs + outMs) value = target + (1 - target) * easeInOutSine((age - inMs - holdMs) / Math.max(1, outMs));
      else { value = 1; active = false; }
      return value;
    },
    reset() { value = 1; active = false; },
    get scale() { return value; },
  };
}
