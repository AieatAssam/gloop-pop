import type { PieceDef } from './types';

const def = (id: number, family: PieceDef['family'], cells: readonly (readonly [number, number])[]): PieceDef => ({
  id, family, cells, w: Math.max(...cells.map((cell) => cell[1])) + 1, h: Math.max(...cells.map((cell) => cell[0])) + 1,
});
export const PIECES: readonly PieceDef[] = [
  def(0,'Dot',[[0,0]]), def(1,'I2',[[0,0],[0,1]]), def(2,'I2',[[0,0],[1,0]]),
  def(3,'I3',[[0,0],[0,1],[0,2]]), def(4,'I3',[[0,0],[1,0],[2,0]]),
  def(5,'I4',[[0,0],[0,1],[0,2],[0,3]]), def(6,'I4',[[0,0],[1,0],[2,0],[3,0]]),
  def(7,'I5',[[0,0],[0,1],[0,2],[0,3],[0,4]]), def(8,'I5',[[0,0],[1,0],[2,0],[3,0],[4,0]]),
  def(9,'O2',[[0,0],[0,1],[1,0],[1,1]]),
  def(10,'O3',[[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]]),
  def(11,'R23',[[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]]), def(12,'R23',[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]]),
  def(13,'L3',[[0,0],[1,0],[1,1]]), def(14,'L3',[[0,0],[0,1],[1,0]]), def(15,'L3',[[0,0],[0,1],[1,1]]), def(16,'L3',[[0,1],[1,0],[1,1]]),
  def(17,'L4',[[0,0],[1,0],[2,0],[2,1]]), def(18,'L4',[[0,0],[0,1],[0,2],[1,0]]), def(19,'L4',[[0,0],[0,1],[1,1],[2,1]]), def(20,'L4',[[0,2],[1,0],[1,1],[1,2]]),
  def(21,'L4',[[0,1],[1,1],[2,0],[2,1]]), def(22,'L4',[[0,0],[1,0],[1,1],[1,2]]), def(23,'L4',[[0,0],[0,1],[1,0],[2,0]]), def(24,'L4',[[0,0],[0,1],[0,2],[1,2]]),
  def(25,'T4',[[0,0],[0,1],[0,2],[1,1]]), def(26,'T4',[[0,1],[1,0],[1,1],[2,1]]), def(27,'T4',[[0,1],[1,0],[1,1],[1,2]]), def(28,'T4',[[0,0],[1,0],[1,1],[2,0]]),
  def(29,'S4',[[0,1],[0,2],[1,0],[1,1]]), def(30,'S4',[[0,0],[1,0],[1,1],[2,1]]), def(31,'S4',[[0,0],[0,1],[1,1],[1,2]]), def(32,'S4',[[0,1],[1,0],[1,1],[2,0]]),
  def(33,'L5',[[0,0],[1,0],[2,0],[2,1],[2,2]]), def(34,'L5',[[0,0],[0,1],[0,2],[1,0],[2,0]]), def(35,'L5',[[0,0],[0,1],[0,2],[1,2],[2,2]]), def(36,'L5',[[0,2],[1,2],[2,0],[2,1],[2,2]]),
];

export interface PlacementMask { pos: number; lo: number; hi: number; }
export const PLACEMENTS: readonly (readonly PlacementMask[])[] = PIECES.map((piece) => {
  const placements: PlacementMask[] = [];
  for (let row = 0; row <= 8 - piece.h; row += 1) for (let col = 0; col <= 8 - piece.w; col += 1) {
    let lo = 0; let hi = 0;
    for (const [dr, dc] of piece.cells) {
      const index = (row + dr) * 8 + col + dc;
      if (index < 32) lo = (lo | (1 << index)) >>> 0; else hi = (hi | (1 << (index - 32))) >>> 0;
    }
    placements.push({ pos: row * 8 + col, lo, hi });
  }
  return placements;
});

export const FAMILY_IDS: readonly PieceDef['family'][] = ['Dot','I2','I3','I4','I5','O2','O3','R23','L3','L4','T4','S4','L5'];
export const PIECE_BY_ID: readonly PieceDef[] = PIECES;
