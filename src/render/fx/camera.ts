// SG §9.13.e and §9.13.g.3–4: deterministic trauma noise and spring camera kick.
import { createCosmeticRng } from '../cosmeticRng';
import { spring } from './spring';

export interface CameraOffset { x: number; y: number; roll: number }
export interface Camera {
  readonly offset: CameraOffset;
  readonly traumaValue: number;
  trauma(value: number, atLeast?: boolean, xOnly?: boolean): void;
  setTrauma(value: number, xOnly?: boolean): void;
  kick(distance: number, x: number, y: number): void;
  update(dtMs: number, time: number, reduced?: boolean): void;
  configure(cellSize: number, desktop: boolean): void;
  reset(): void;
}

export function traumaShake(value: number): number { const t = clamp(value, 0, 1); return t * t; }

export function createCamera(seed = 0xca0e): Camera {
  const random = createCosmeticRng(seed);
  const noise = new Float64Array(256);
  for (let i = 0; i < noise.length; i += 1) noise[i] = random() * 2 - 1;
  const offset: CameraOffset = { x: 0, y: 0, roll: 0 };
  const kickX = { x: 0, v: 0 }; const kickY = { x: 0, v: 0 };
  let tau = 0; let xOnly = false; let cellSize = 44; let desktop = false;
  const sample = (time: number, channel: number): number => {
    const position = time * 0.015 + channel * 83.25;
    const index = Math.floor(position); const t = position - index;
    const blend = (1 - Math.cos(Math.PI * t)) * 0.5;
    return noise[index & 255]! * (1 - blend) + noise[(index + 1) & 255]! * blend;
  };
  return {
    offset,
    get traumaValue() { return tau; },
    configure(size, isDesktop) { cellSize = size; desktop = isDesktop; },
    trauma(value, atLeast = false, horizontalOnly = false) {
      if (atLeast) tau = Math.max(tau, value); else tau = Math.min(1, tau + value);
      xOnly = horizontalOnly;
      const strength = traumaShake(tau) * (desktop ? 0.7 : 1);
      offset.x = (0.35 * cellSize * strength * sample(0, 0)) * (desktop ? 0.7 : 1);
      offset.y = horizontalOnly ? 0 : (0.35 * cellSize * strength * sample(0, 1)) * (desktop ? 0.7 : 1);
      offset.roll = horizontalOnly ? 0 : 1.5 * strength * sample(0, 2) * (desktop ? 0.7 : 1);
    },
    setTrauma(value, horizontalOnly = false) { tau = clamp(value, 0, 1); xOnly = horizontalOnly; },
    kick(distance, x, y) { kickX.x += x * distance; kickY.x += y * distance; },
    update(dtMs, time, reduced = false) {
      const dt = Math.max(0, dtMs) / 1000;
      if (reduced) { tau = 0; kickX.x = 0; kickX.v = 0; kickY.x = 0; kickY.v = 0; offset.x = 0; offset.y = 0; offset.roll = 0; return; }
      tau = Math.max(0, tau - 1.6 * dt);
      spring(kickX, 0, 9, 0.55, dt); spring(kickY, 0, 9, 0.55, dt);
      const magnitude = traumaShake(tau); const scale = desktop ? 0.7 : 1;
      const maxOffset = 0.45 * cellSize;
      offset.x = clamp((kickX.x + 0.35 * cellSize * magnitude * sample(time, 0)) * scale, -maxOffset, maxOffset);
      offset.y = clamp((kickY.x + (xOnly ? 0 : 0.35 * cellSize * magnitude * sample(time, 1))) * scale, -maxOffset, maxOffset);
      offset.roll = xOnly ? 0 : 1.5 * magnitude * sample(time, 2) * scale;
    },
    reset() { tau = 0; xOnly = false; kickX.x = 0; kickX.v = 0; kickY.x = 0; kickY.v = 0; offset.x = 0; offset.y = 0; offset.roll = 0; },
  };
}

export function setCameraScale(camera: Camera, cellSize: number, isDesktop: boolean): void {
  camera.configure(cellSize, isDesktop);
}

function clamp(value: number, min: number, max: number): number { return Math.min(max, Math.max(min, value)); }
