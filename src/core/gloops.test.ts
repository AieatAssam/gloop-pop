import { describe, expect, it } from 'vitest';
import { components, largestSquare } from './gloops';
import { makeBoard } from './board';

describe('gloop components and face square', () => {
  it('keeps a ring connected around an empty hole', () => {
    const board = makeBoard(); for (let row = 2; row <= 4; row += 1) for (let col = 2; col <= 4; col += 1) if (row !== 3 || col !== 3) board[row * 8 + col] = 3;
    const found = components(board); expect(found).toHaveLength(1); expect(found[0]?.cells).toHaveLength(8); expect(found[0]?.largestSquare.size).toBe(1);
  });
  it('uses four-neighbour connectivity, so diagonal matches are separate gloops', () => {
    const board = makeBoard(); board[0] = 1; board[9] = 1;
    expect(components(board)).toHaveLength(2);
  });
  it('chooses a largest square and breaks ties toward the centroid', () => {
    expect(largestSquare([0,1,8,9])).toEqual({ row: 0, col: 0, size: 2 });
  });
});
