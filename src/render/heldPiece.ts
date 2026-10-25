// SG §9.13.b–c: pure transform state for the lifted jelly; snap math stays on P_f.
import { easeOutBack, easeOutCubic } from './easing';
import { reciprocalScale, spring, type SpringState } from './fx/spring';

export interface HeldPieceState {
  x: SpringState; y: SpringState; tilt: SpringState; stretch: SpringState; shear: SpringState; grab: SpringState;
  fingerX: number; fingerY: number; velocityX: number; velocityY: number;
  elapsedMs: number; pickupMs: number; reducedMotion: boolean;
}

export interface HeldPieceTransform {
  x: number; y: number; tilt: number; stretch: number; shear: number;
  stretchAngle: number;
  pickupScale: number; lift: number; grabSx: number; grabSy: number;
}

export function createHeldPiece(x: number, y: number, reducedMotion = false): HeldPieceState {
  return { x: { x, v: 0 }, y: { x: y, v: 0 }, tilt: { x: 0, v: 0 }, stretch: { x: 1, v: 0 }, shear: { x: 0, v: 0 }, grab: { x: 1.12, v: 0 }, fingerX: x, fingerY: y, velocityX: 0, velocityY: 0, elapsedMs: 0, pickupMs: 0, reducedMotion };
}

export function resetHeldPiece(state: HeldPieceState, x: number, y: number): void {
  state.x.x = x; state.x.v = 0; state.y.x = y; state.y.v = 0; state.tilt.x = 0; state.tilt.v = 0;
  state.stretch.x = 1; state.stretch.v = 0; state.shear.x = 0; state.shear.v = 0; state.grab.x = 1.12; state.grab.v = 0;
  state.fingerX = x; state.fingerY = y; state.velocityX = 0; state.velocityY = 0; state.elapsedMs = 0; state.pickupMs = 0;
}

export function updateHeldPiece(state: HeldPieceState, fingerX: number, fingerY: number, dtMs: number, cellSize: number, reducedMotion = state.reducedMotion, followX = fingerX, followY = fingerY, frequency = 7, damping = 0.75, trayRatio = 0.6): HeldPieceTransform {
  const dt = Math.max(0, dtMs) / 1000; const previousVx = state.velocityX;
  if (dt > 0) {
    const instantX = (fingerX - state.fingerX) / dt / cellSize; const instantY = (fingerY - state.fingerY) / dt / cellSize;
    const smoothing = 1 - Math.exp(-dt / 0.05);
    state.velocityX += (instantX - state.velocityX) * smoothing; state.velocityY += (instantY - state.velocityY) * smoothing;
  }
  state.fingerX = fingerX; state.fingerY = fingerY; state.elapsedMs += dtMs;
  if (reducedMotion) {
    state.x.x = fingerX; state.y.x = fingerY; state.x.v = 0; state.y.v = 0;
    state.tilt.x = 0; state.tilt.v = 0; state.stretch.x = 1; state.stretch.v = 0; state.shear.x = 0; state.shear.v = 0; state.grab.x = 1; state.grab.v = 0;
    return { x: fingerX, y: fingerY, tilt: 0, stretch: 1, stretchAngle: 0, shear: 0, pickupScale: trayRatio + (1 - trayRatio) * Math.min(1, state.elapsedMs / 100), lift: 0, grabSx: 1, grabSy: 1 };
  }
  const age = state.elapsedMs - state.pickupMs; const pickupT = Math.min(1, Math.max(0, age / 140));
  const lift = easeOutCubic(Math.min(1, age / 120));
  spring(state.x, followX, frequency, damping, dt); spring(state.y, followY, frequency, damping, dt);
  if (age >= 140) {
    const maxLag = 0.5 * cellSize; const dx = state.x.x - fingerX; const dy = state.y.x - fingerY; const distance = Math.hypot(dx, dy);
    if (distance > maxLag) { state.x.x = fingerX + dx * maxLag / distance; state.y.x = fingerY + dy * maxLag / distance; }
  }
  const targetTilt = Math.max(-5, Math.min(5, 0.5 * state.velocityX)) * Math.PI / 180;
  spring(state.tilt, targetTilt, 5, 0.6, dt);
  const speed = Math.hypot(state.x.v, state.y.v) / cellSize;
  const targetStretch = 1 + Math.min(0.1, 0.01 * speed);
  spring(state.stretch, targetStretch, 6, 0.5, dt); spring(state.shear, 0, 4, 0.3, dt);
  state.shear.v += 0.3 * (state.velocityX - previousVx); state.shear.x = Math.max(-0.15, Math.min(0.15, state.shear.x));
  spring(state.grab, 1, 8, 0.4, dt); const grabScale = reciprocalScale(state.grab.x);
  return { x: state.x.x, y: state.y.x, tilt: state.tilt.x, stretch: state.stretch.x, stretchAngle: Math.atan2(state.y.v, state.x.v), shear: state.shear.x, pickupScale: trayRatio + (1 - trayRatio) * easeOutBack(pickupT), lift, grabSx: grabScale.sx, grabSy: grabScale.sy };
}
