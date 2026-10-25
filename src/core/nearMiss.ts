import { cellIndex } from './board';
import { PIECES } from './pieces';
import type { GameState } from './types';

export type ShapeKey = 'dot' | 'bar2' | 'bar3' | 'bar4' | 'bar5' | 'squareSmall' | 'squareBig' | 'rectangle' | 'cornerSmall' | 'cornerL' | 'tee' | 'zigzag' | 'cornerBig';
export interface NearMissFacts {
  pieceOneCellShort: { slot: number; shape: ShapeKey; row: number; col: number } | null;
  lineOneFromFull: { kind: 'row' | 'column'; index: number } | null;
}
const shapeByFamily: Record<string, ShapeKey> = {
  Dot: 'dot', I2: 'bar2', I3: 'bar3', I4: 'bar4', I5: 'bar5', O2: 'squareSmall', O3: 'squareBig',
  R23: 'rectangle', L3: 'cornerSmall', L4: 'cornerL', T4: 'tee', S4: 'zigzag', L5: 'cornerBig',
};

export function nearMissFacts(state: GameState): NearMissFacts {
  let pieceOneCellShort: NearMissFacts['pieceOneCellShort'] = null;
  for (let slot = 0; slot < state.tray.length && pieceOneCellShort === null; slot += 1) {
    const piece = state.tray[slot]; if (!piece) continue;
    const def = PIECES[piece.defId]; if (!def) continue;
    for (let row = 0; row <= 8 - def.h && pieceOneCellShort === null; row += 1) for (let col = 0; col <= 8 - def.w; col += 1) {
      let overlaps = 0;
      for (const [dr, dc] of def.cells) if ((state.board[cellIndex(row + dr, col + dc)] ?? 0) !== 0) overlaps += 1;
      if (overlaps === 1) { pieceOneCellShort = { slot, shape: shapeByFamily[def.family] ?? 'dot', row, col }; break; }
    }
  }
  let lineOneFromFull: NearMissFacts['lineOneFromFull'] = null;
  for (let row = 0; row < 8 && lineOneFromFull === null; row += 1) {
    let empty = 0; for (let col = 0; col < 8; col += 1) if ((state.board[cellIndex(row, col)] ?? 0) === 0) empty += 1;
    if (empty === 1) lineOneFromFull = { kind: 'row', index: row };
  }
  for (let col = 0; col < 8 && lineOneFromFull === null; col += 1) {
    let empty = 0; for (let row = 0; row < 8; row += 1) if ((state.board[cellIndex(row, col)] ?? 0) === 0) empty += 1;
    if (empty === 1) lineOneFromFull = { kind: 'column', index: col };
  }
  return { pieceOneCellShort, lineOneFromFull };
}

