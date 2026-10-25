// SG §9.13.i: tick-quantized count-up and damped score punch.
// spec-note: The score spring uses its closed-form underdamped response so the punch is frame-rate independent while honoring the specified 7 Hz / ζ 0.35 values.
import { easeOutCubic } from '../easing';

export function scoreAt(from: number, to: number, ageMs: number, durationMs: number, reduced: boolean): number {
  const duration = reduced ? 150 : durationMs;
  if (ageMs >= duration) return to;
  const tickAge = reduced ? ageMs : Math.floor(Math.max(0, ageMs) / 40) * 40;
  return from + (to - from) * easeOutCubic(tickAge / duration);
}

export function scorePunchSize(points: number): number { return points < 500 ? 1.1 : points < 2000 ? 1.14 : points < 10000 ? 1.18 : 1.24; }

export function scorePunchScale(ageMs: number, durationMs: number, points: number, reduced: boolean): number {
  if (reduced || ageMs < durationMs) return 1;
  const t = (ageMs - durationMs) / 1000;
  const omega = 2 * Math.PI * 7;
  const zeta = 0.35;
  const decay = Math.exp(-zeta * omega * t);
  const damped = omega * Math.sqrt(1 - zeta * zeta);
  return 1 + (scorePunchSize(points) - 1) * decay * Math.cos(damped * t);
}
