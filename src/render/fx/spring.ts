// SG §9.13 shared math: stable implicit Euler spring, mutating preallocated state.
export interface SpringState { x: number; v: number; }

export function spring(state: SpringState, target: number, frequency: number, damping: number, dtSeconds: number): SpringState {
  const dt = Math.max(0, dtSeconds); const omega = 2 * Math.PI * frequency;
  const a = 1 + 2 * dt * damping * omega; const b = dt * omega * omega; const d = 1 / (a + dt * b);
  const oldX = state.x;
  state.x = (a * oldX + dt * state.v + dt * b * target) * d;
  state.v = (state.v + b * (target - oldX)) * d;
  return state;
}

export function reciprocalScale(sx: number): { sx: number; sy: number } {
  const safe = Math.abs(sx) < 1e-9 ? (sx < 0 ? -1e-9 : 1e-9) : sx;
  return { sx: safe, sy: 1 / safe };
}

export function shearDeterminant(): number { return 1; }
