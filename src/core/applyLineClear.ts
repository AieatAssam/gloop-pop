import { fullLines, makeBoard } from './board';
import type { Board } from './types';

/** Shared design §24.5 cube rule for resolver and solver. */
export function applyLineClear(board: ArrayLike<number>): { board: Board; rows: number[]; cols: number[]; cells: number[]; removed: number[]; cracked: number[] } {
  const { rows, cols, cells } = fullLines(board);
  const next = makeBoard(board); const removed: number[] = []; const cracked: number[] = [];
  for (const index of cells) {
    const value = board[index] ?? 0;
    if (value === 9) { next[index] = 8; cracked.push(index); }
    else { next[index] = 0; if (value === 8) removed.push(index); }
  }
  return { board: next, rows, cols, cells, removed, cracked };
}
