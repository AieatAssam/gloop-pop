import { describe, expect, it } from 'vitest';
import { makeBoard } from './board';
import { canPlaceAll } from './solver';

describe('tray solver', () => {
  it('finds an empty-board solution and rejects a tray with too little room', () => {
    expect(canPlaceAll(makeBoard(), [0, 9, 13])).toBe('yes');
    const board = new Uint8Array(64).fill(1); board[0] = 0;
    expect(canPlaceAll(board, [10])).toBe('no');
  });
  it('reports when the placement-test budget is exhausted', () => {
    expect(canPlaceAll(makeBoard(), [10, 10, 10], 1)).toBe('budget');
  });
});
