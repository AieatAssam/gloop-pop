import type { Flavour, Gloop } from './types';
const NEIGHBOUR_OFFSETS = [-8, 1, 8, -1] as const;

export function components(board: ArrayLike<number>): Gloop[] {
  const seen = new Uint8Array(64); const stack = new Int16Array(64); const result: Gloop[] = [];
  for (let start = 0; start < 64; start += 1) {
    const flavour = board[start] ?? 0;
    if (flavour === 0 || seen[start]) continue;
    let head = 0; let tail = 0; stack[tail++] = start; seen[start] = 1; const cells: number[] = [];
    while (head < tail) {
      const index = stack[head++] ?? 0; cells.push(index);
      const row = Math.floor(index / 8); const col = index % 8;
      for (const offset of NEIGHBOUR_OFFSETS) {
        if ((offset === -8 && row === 0) || (offset === 8 && row === 7) || (offset === 1 && col === 7) || (offset === -1 && col === 0)) continue;
        const next = index + offset;
        if (!seen[next] && board[next] === flavour) { seen[next] = 1; stack[tail++] = next; }
      }
    }
    const bfs = [...cells];
    cells.sort((a, b) => a - b);
    result.push({ flavour: flavour as Flavour, cells, bfs, largestSquare: largestSquare(cells) });
  }
  return result;
}

export function largestSquare(cells: readonly number[]): { row: number; col: number; size: number } {
  const occupied = new Uint8Array(64); let sumRow = 0; let sumCol = 0;
  for (const index of cells) { occupied[index] = 1; sumRow += Math.floor(index / 8); sumCol += index % 8; }
  if (cells.length === 0) return { row: 0, col: 0, size: 0 };
  let best = { row: 0, col: 0, size: 0 }; let bestDistance = Number.POSITIVE_INFINITY;
  for (let size = 1; size <= 4; size += 1) for (let row = 0; row <= 8 - size; row += 1) for (let col = 0; col <= 8 - size; col += 1) {
    let full = true;
    for (let dr = 0; dr < size && full; dr += 1) for (let dc = 0; dc < size; dc += 1) if (!occupied[(row + dr) * 8 + col + dc]) { full = false; break; }
    if (!full) continue;
    const centreRow2 = row * 2 + size - 1; const centreCol2 = col * 2 + size - 1;
    const distance = (centreRow2 * cells.length - 2 * sumRow) ** 2 + (centreCol2 * cells.length - 2 * sumCol) ** 2;
    const topLeft = row * 8 + col; const bestTopLeft = best.row * 8 + best.col;
    if (size > best.size || (size === best.size && (distance < bestDistance || (distance === bestDistance && topLeft < bestTopLeft)))) {
      best = { row, col, size }; bestDistance = distance;
    }
  }
  return best;
}
