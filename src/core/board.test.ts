import { describe, expect, it } from 'vitest';
import { cellIndex, clearCells, colFull, filledCount, fits, fullLines, isEmpty, makeBoard, place, rowFull } from './board';
import { PLACEMENTS, PIECES } from './pieces';

describe('board helpers and catalogue masks', () => {
  it('checks bounds and occupancy', () => {
    const board = makeBoard(); board[0] = 2;
    expect(fits(board, PIECES[0]!, 0, 0)).toBe(false); expect(fits(board, PIECES[0]!, -1, 0)).toBe(false);
    expect(fits(board, PIECES[0]!, 0.5, 0)).toBe(false);
    expect(fits(board, PIECES[0]!, 7, 7)).toBe(true); expect(fits(board, PIECES[10]!, 6, 6)).toBe(false);
  });
  it('matches placement masks to every catalogue cell at every legal position', () => {
    expect(PIECES).toHaveLength(37);
    for (const def of PIECES) for (const mask of PLACEMENTS[def.id] ?? []) {
      const board = makeBoard(); const row = Math.floor(mask.pos / 8); const col = mask.pos % 8;
      for (const [dr, dc] of def.cells) board[cellIndex(row + dr, col + dc)] = 1;
      let lo = 0; let hi = 0;
      for (let index = 0; index < 64; index += 1) if (board[index]) { if (index < 32) lo = (lo | (1 << index)) >>> 0; else hi = (hi | (1 << (index - 32))) >>> 0; }
      expect([mask.lo, mask.hi]).toEqual([lo, hi]);
    }
  });
  it('finds complete rows and columns without duplicating their crossing cell', () => {
    const board = makeBoard(); for (let col = 0; col < 8; col += 1) board[2 * 8 + col] = 1;
    for (let row = 0; row < 8; row += 1) board[row * 8 + 4] = 2;
    const result = fullLines(board); expect(result.rows).toEqual([2]); expect(result.cols).toEqual([4]);
    expect(result.cells).toHaveLength(15); expect(result.cells.filter((index) => index === 20)).toHaveLength(1);
  });
  it('places and clears cells and reports row, column, and fill helpers', () => {
    const board = makeBoard(); const next = place(board, PIECES[0]!, 3, 4, 7)!;
    expect(rowFull(next, 3)).toBe(false); expect(colFull(next, 4)).toBe(false); expect(filledCount(next)).toBe(1); expect(isEmpty(board)).toBe(true);
    expect(clearCells(next, [cellIndex(3, 4)])).toEqual(board);
  });
});
