// SG §9.5: deterministic envelope and direction cadence for canvas-only shake.
export interface Shake { active: boolean; amplitude: number; duration: number; elapsed: number; x: number; y: number }
export function createShake() {
  const state: Shake = { active: false, amplitude: 0, duration: 1, elapsed: 0, x: 0, y: 0 };
  let seed = 0x51a7e;
  let directionX = 0; let directionY = 0; let targetX = 0; let targetY = 0; let horizontalOnly = false;
  const next = (): number => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0x100000000; };
  return { state,
    trigger(amplitude: number, duration: number, horizontal = false): void { state.active = true; state.amplitude = amplitude; state.duration = duration; state.elapsed = 0; horizontalOnly = horizontal; directionX = horizontal ? 1 : next() * 2 - 1; directionY = horizontal ? 0 : next() * 2 - 1; targetX = directionX; targetY = directionY; state.x = directionX * amplitude; state.y = directionY * amplitude; },
    update(dtMs: number, reduced = false): void { if (!state.active || reduced) { state.active = false; state.x = 0; state.y = 0; return; } const prior = state.elapsed; state.elapsed += dtMs; if (state.elapsed >= state.duration) { state.active = false; state.x = 0; state.y = 0; return; } if (Math.floor(state.elapsed / 33) !== Math.floor(prior / 33)) { directionX = targetX; directionY = targetY; targetX = horizontalOnly ? 1 : next() * 2 - 1; targetY = horizontalOnly ? 0 : next() * 2 - 1; } const blend = (state.elapsed % 33) / 33; const fade = (1 - state.elapsed / state.duration) ** 2; state.x = (directionX + (targetX - directionX) * blend) * state.amplitude * fade; state.y = (directionY + (targetY - directionY) * blend) * state.amplitude * fade; },
  };
}
