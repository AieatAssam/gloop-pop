import { describe, expect, it } from 'vitest';
import { clipShapeToBoard, ghostInset, ghostLineWidth, previewPlan } from './dragGhost';

// A 2 x 2 square piece: cells at (0,0) (0,1) (1,0) (1,1).
const SQUARE: readonly (readonly [number, number])[] = [[0, 0], [0, 1], [1, 0], [1, 1]];
// A horizontal bar of three cells.
const BAR: readonly (readonly [number, number])[] = [[0, 0], [0, 1], [0, 2]];

describe('SG §8.4 preview plan', () => {
  it('valid spot: filled ghost (fill and outline), no outline-only pass', () => {
    const out: number[] = [];
    expect(previewPlan(true, 3, 3, SQUARE, out)).toBe('filled');
  });

  it('invalid spot on the board: outline only, every piece cell is listed', () => {
    const out: number[] = [];
    expect(previewPlan(false, 2, 4, SQUARE, out)).toBe('outline');
    expect(out).toEqual([2 * 8 + 4, 2 * 8 + 5, 3 * 8 + 4, 3 * 8 + 5]);
  });

  it('partly off the board: only the on-board cells are drawn (clipped at the top edge)', () => {
    const out: number[] = [];
    expect(previewPlan(false, -1, 0, SQUARE, out)).toBe('outline');
    expect(out).toEqual([0, 1]);
  });

  it('partly off the board: clipped at the right edge', () => {
    const out: number[] = [];
    expect(previewPlan(false, 0, 7, BAR, out)).toBe('outline');
    expect(out).toEqual([7]);
  });

  it('fully off the board: nothing is drawn', () => {
    const out: number[] = [0, 1, 2];
    expect(previewPlan(false, 8, 0, SQUARE, out)).toBe('none');
    expect(out).toEqual([]);
    expect(previewPlan(false, 0, -3, BAR, out)).toBe('none');
  });

  it('no spot at all (pointer never reached a cell): nothing is drawn', () => {
    const out: number[] = [];
    expect(previewPlan(false, undefined, undefined, SQUARE, out)).toBe('none');
  });
});

describe('clipShapeToBoard', () => {
  it('reuses the caller array (cleared on every call)', () => {
    const out: number[] = [];
    clipShapeToBoard(SQUARE, 0, 0, out);
    clipShapeToBoard(BAR, 7, 6, out);
    expect(out).toEqual([7 * 8 + 6, 7 * 8 + 7]);
  });
});

describe('ghost outline metrics', () => {
  it('use the landing ghost line weight (at least 1.5 px, 0.05c) and keep the outline just outside each cell', () => {
    expect(ghostLineWidth(20)).toBeCloseTo(1.5);
    expect(ghostLineWidth(44)).toBeCloseTo(2.2);
    expect(ghostInset(44)).toBeCloseTo(2 - 44 * 0.04 - 2.2 / 2);
  });
});
