import { describe, expect, it } from 'vitest';
import { faceBoxFor } from './face';
import type { Gloop } from '../core/types';

describe('face box', () => {
  it('uses the largest square and caps its scale at four cells', () => {
    const gloop: Gloop = { flavour: 1, cells: [0], bfs: [0], largestSquare: { row: 2, col: 3, size: 6 } };
    const box = faceBoxFor(gloop, 40);
    expect(box.x).toBe(240); expect(box.y).toBeCloseTo(195.008); expect(box.size).toBeCloseTo(124.8);
  });
});
