import type { Board, PieceDef } from './types';

export const BOARD_SIZE = 8;
export const BOARD_CELLS = 64;
export function cellIndex(row: number, col: number): number { return row * BOARD_SIZE + col; }
export function makeBoard(values?: ArrayLike<number>): Board {
  const board = new Uint8Array(BOARD_CELLS);
  if (values) for (let i = 0; i < BOARD_CELLS; i += 1) board[i] = values[i] ?? 0;
  return board;
}
export function rowFull(board: ArrayLike<number>, row: number): boolean {
  for (let col = 0; col < BOARD_SIZE; col += 1) if ((board[cellIndex(row, col)] ?? 0) === 0) return false;
  return true;
}
export function colFull(board: ArrayLike<number>, col: number): boolean {
  for (let row = 0; row < BOARD_SIZE; row += 1) if ((board[cellIndex(row, col)] ?? 0) === 0) return false;
  return true;
}
export function fullLines(board: ArrayLike<number>): { rows: number[]; cols: number[]; cells: number[] } {
  const rows: number[] = []; const cols: number[] = []; const marked = new Uint8Array(BOARD_CELLS);
  for (let row = 0; row < BOARD_SIZE; row += 1) if (rowFull(board, row)) rows.push(row);
  for (let col = 0; col < BOARD_SIZE; col += 1) if (colFull(board, col)) cols.push(col);
  for (const row of rows) for (let col = 0; col < BOARD_SIZE; col += 1) marked[cellIndex(row, col)] = 1;
  for (const col of cols) for (let row = 0; row < BOARD_SIZE; row += 1) marked[cellIndex(row, col)] = 1;
  const cells: number[] = []; for (let i = 0; i < BOARD_CELLS; i += 1) if (marked[i]) cells.push(i);
  return { rows, cols, cells };
}
export function fits(board: ArrayLike<number>, def: PieceDef, row: number, col: number): boolean {
  if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0 || row + def.h > BOARD_SIZE || col + def.w > BOARD_SIZE) return false;
  return def.cells.every(([dr, dc]) => (board[cellIndex(row + dr, col + dc)] ?? 0) === 0);
}
export function place(board: ArrayLike<number>, def: PieceDef, row: number, col: number, flavour: number): Board | null {
  if (!fits(board, def, row, col)) return null;
  const nextBoard = makeBoard(board);
  for (const [dr, dc] of def.cells) nextBoard[cellIndex(row + dr, col + dc)] = flavour;
  return nextBoard;
}
export function clearCells(board: ArrayLike<number>, cells: readonly number[]): Board {
  const nextBoard = makeBoard(board); for (const index of cells) nextBoard[index] = 0; return nextBoard;
}
export function filledCount(board: ArrayLike<number>): number {
  let count = 0; for (let i = 0; i < BOARD_CELLS; i += 1) if ((board[i] ?? 0) !== 0) count += 1; return count;
}
export function isEmpty(board: ArrayLike<number>): boolean { return filledCount(board) === 0; }
