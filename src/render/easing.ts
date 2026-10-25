// SG §9.0: shared easing curves for rendering and animation timing.
export function easeOutBack(t: number): number {
  const x = clamp01(t) - 1;
  return 1 + 2.70158 * x * x * x + 1.70158 * x * x;
}

export function easeInBack(t: number): number { const x = clamp01(t); return 2.70158 * x * x * x - 1.70158 * x * x; }

export function easeOutQuad(t: number): number { const x = clamp01(t); return 1 - (1 - x) * (1 - x); }
export function easeOutCubic(t: number): number { const x = clamp01(t); return 1 - (1 - x) ** 3; }
export function easeOutElastic(t: number): number { const x = clamp01(t); return x === 0 || x === 1 ? x : 2 ** (-10 * x) * Math.sin((x - 0.08) * 2 * Math.PI / 0.32) + 1; }

export function easeInOutSine(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return -(Math.cos(Math.PI * clamp01(t)) - 1) / 2;
}

function clamp01(value: number): number { return Math.min(1, Math.max(0, value)); }
