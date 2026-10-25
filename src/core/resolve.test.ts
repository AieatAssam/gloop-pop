import { describe, expect, it } from 'vitest';
import { makeBoard } from './board';
import { resolveBoard } from './resolve';

describe('placement resolution', () => {
  it('pops a gloop that intersects a cleared row and has cells outside it', () => {
    const board = makeBoard(); for (let col = 0; col < 8; col += 1) board[6 * 8 + col] = col === 0 ? 1 : 2;
    board[5 * 8] = 1; board[4 * 8] = 1;
    const result = resolveBoard(board);
    expect(result.rows).toEqual([6]); expect(result.poppedCells).toEqual([32, 40]); expect(result.board[32]).toBe(0);
  });
  it('does not call a gloop wholly inside the clear line a pop', () => {
    const board = makeBoard(); for (let col = 0; col < 8; col += 1) board[6 * 8 + col] = 4;
    const result = resolveBoard(board); expect(result.popped).toHaveLength(0); expect(result.poppedCells).toHaveLength(0);
  });
  it('counts each of two separate popped gloops once and does not cascade', () => {
    const board = makeBoard();
    for (let col = 0; col < 8; col += 1) board[6 * 8 + col] = col === 0 ? 3 : col === 1 ? 4 : 2;
    board[5 * 8] = 3; board[5 * 8 + 1] = 4;
    board[0] = 7;
    const result = resolveBoard(board);
    expect(result.popped).toHaveLength(2); expect(result.poppedCells).toEqual([40, 41]);
    expect(result.board.some((cell) => cell !== 0)).toBe(true);
  });
  it('detects an All Clear after line removal', () => {
    const board = makeBoard(); for (let col = 0; col < 8; col += 1) board[7 * 8 + col] = 1;
    const result = resolveBoard(board); expect(result.allClear).toBe(true); expect(result.board.every((cell) => cell === 0)).toBe(true);
  });
});
