import { clearCells, fullLines, makeBoard } from './board';
import { components } from './gloops';
import { PLACEMENTS, PIECES } from './pieces';
import type { Flavour, Piece, PieceDef } from './types';

export type SolveResult = 'yes' | 'no' | 'budget';
export function canPlaceAll(board: ArrayLike<number>, pieces: readonly (Piece | number)[], budget = 200_000): SolveResult {
  const entries = pieces.map((piece) => ({ def: PIECES[typeof piece === 'number' ? piece : piece.defId], flavour: typeof piece === 'number' ? 1 : piece.flavour })).filter((entry): entry is { def: PieceDef; flavour: Flavour } => entry.def !== undefined);
  if (entries.length === 0) return 'yes';
  let checks = 0; let hitBudget = false;
  const search = (current: Uint8Array, remaining: readonly number[]): boolean => {
    if (remaining.length === 0) return true;
    const equivalent = new Set<string>(); const [lo, hi] = boardMasks(current);
    for (let ri = 0; ri < remaining.length; ri += 1) {
      const id = remaining[ri] ?? -1; const entry = entries[id]; if (!entry) continue;
      const key = `${entry.def.id}:${entry.flavour}`; if (equivalent.has(key)) continue; equivalent.add(key);
      const { def } = entry;
      const masks = PLACEMENTS[def.id] ?? [];
      for (const mask of masks) {
        if (++checks > budget) { hitBudget = true; return false; }
        if ((lo & mask.lo) !== 0 || (hi & mask.hi) !== 0) continue;
        const next = makeBoard(current); const row = Math.floor(mask.pos / 8); const col = mask.pos % 8;
        for (const [dr, dc] of def.cells) next[(row + dr) * 8 + col + dc] = entry.flavour;
        const { cells } = fullLines(next);
        if (cells.length) {
          const lineMask = new Uint8Array(64); for (const cell of cells) lineMask[cell] = 1;
          const remove = [...cells];
          for (const gloop of components(next)) {
            const inside = gloop.cells.some((cell) => lineMask[cell]); const outside = gloop.cells.some((cell) => !lineMask[cell]);
            if (inside && outside) remove.push(...gloop.cells.filter((cell) => !lineMask[cell]));
          }
          next.set(clearCells(next, remove));
        }
        const rest = remaining.filter((_, index) => index !== ri);
        if (search(next, rest)) return true;
        if (hitBudget) return false;
      }
    }
    return false;
  };
  const result = search(Uint8Array.from(board), entries.map((_, index) => index));
  return result ? 'yes' : hitBudget ? 'budget' : 'no';
}

function boardMasks(board: ArrayLike<number>): [number, number] {
  let lo = 0; let hi = 0;
  for (let i = 0; i < 64; i += 1) if ((board[i] ?? 0) !== 0) { if (i < 32) lo = (lo | (1 << i)) >>> 0; else hi = (hi | (1 << (i - 32))) >>> 0; }
  return [lo, hi];
}
