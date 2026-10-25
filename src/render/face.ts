// SG §6.1: the face sits in the largest square already computed for each gloop.
import type { Gloop } from '../core/types';

export interface FaceBox { x: number; y: number; size: number; }
export function faceBoxFor(gloop: Gloop, cellSize: number): FaceBox {
  const square = gloop.largestSquare; const k = Math.min(4, square.size); const size = 0.78 * k * cellSize;
  return { x: (square.col + square.size / 2) * cellSize, y: (square.row + square.size / 2) * cellSize - size * 0.04, size };
}
