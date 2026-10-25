import { cyrb128 } from './hash';
import type { RngState } from './types';

export function createRng(seed: string): RngState {
  const [a, b, c, d] = cyrb128(seed);
  return { a, b, c, d };
}

export function sfc32(state: RngState): number {
  const t = (state.a + state.b + state.d) >>> 0;
  state.d = (state.d + 1) >>> 0;
  state.a = (state.b ^ (state.b >>> 9)) >>> 0;
  state.b = (state.c + (state.c << 3)) >>> 0;
  state.c = ((state.c << 21) | (state.c >>> 11)) >>> 0;
  state.c = (state.c + t) >>> 0;
  return t;
}

export function seededRng(seed: string): RngState {
  const state = createRng(seed);
  for (let i = 0; i < 12; i += 1) sfc32(state);
  return state;
}

export function next(state: RngState): number {
  return sfc32(state);
}

export function cloneRng(state: RngState): RngState { return { ...state }; }
export function serialiseRng(state: RngState): RngState { return { a: state.a >>> 0, b: state.b >>> 0, c: state.c >>> 0, d: state.d >>> 0 }; }

export function nextFloat(state: RngState): number {
  return sfc32(state) / 0x100000000;
}

export function nextInt(state: RngState, n: number): number {
  if (!Number.isInteger(n) || n <= 0) throw new RangeError('n must be a positive integer');
  return Math.floor(nextFloat(state) * n);
}

export function weightedPick(state: RngState, weights: readonly number[]): number {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (!(total > 0) || weights.some((weight) => weight < 0)) throw new RangeError('weights must be non-negative with a positive total');
  let target = nextFloat(state) * total;
  for (let i = 0; i < weights.length; i += 1) {
    target -= weights[i] ?? 0;
    if (target < 0) return i;
  }
  return weights.length - 1;
}
