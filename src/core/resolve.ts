import { clearCells } from './board';
import { components } from './gloops';
import { applyLineClear } from './applyLineClear';
import type { Flavour } from './types';

export interface Resolution {
  board: Uint8Array; rows: number[]; cols: number[]; cells: number[]; poppedCells: number[];
  popped: { flavour: Flavour; size: number; cells: number[]; bfs: number[] }[]; allClear: boolean;
  removedCubes: number[]; crackedCubes: number[];
}

/** Implements design §3.5: find lines, pop only partly intersected gloops, then remove once. */
export function resolveBoard(board: ArrayLike<number>): Resolution {
  const { rows, cols, cells, board: lineBoard, removed, cracked } = applyLineClear(board);
  if (cells.length === 0) return { board: Uint8Array.from(board), rows, cols, cells, poppedCells: [], popped: [], allClear: false, removedCubes: [], crackedCubes: [] };
  const lineSet = new Uint8Array(64); for (const index of cells) lineSet[index] = 1;
  const popped: Resolution['popped'] = []; const poppedCells: number[] = [];
  for (const gloop of components(board)) {
    let inLine = false; let outsideLine = false;
    for (const index of gloop.cells) if (lineSet[index]) inLine = true; else outsideLine = true;
    if (inLine && outsideLine) {
      const extras = gloop.cells.filter((index) => !lineSet[index]);
      poppedCells.push(...extras);
      popped.push({ flavour: gloop.flavour, size: gloop.cells.length, cells: [...gloop.cells], bfs: [...gloop.bfs] });
    }
  }
  const nextBoard = clearCells(lineBoard, poppedCells);
  return { board: nextBoard, rows, cols, cells, poppedCells, popped, allClear: nextBoard.every((cell) => cell === 0), removedCubes: removed, crackedCubes: cracked };
}
