import { cellIndex } from './board';
import { PIECES } from './pieces';
import { nextTarget } from './goals';
import type { GameState } from './types';

export type ShapeKey = 'dot' | 'bar2' | 'bar3' | 'bar4' | 'bar5' | 'squareSmall' | 'squareBig' | 'rectangle' | 'cornerSmall' | 'cornerL' | 'tee' | 'zigzag' | 'cornerBig';
export interface NearMissFacts {
  pieceOneCellShort: { slot: number; shape: ShapeKey; row: number; col: number } | null;
  lineOneFromFull: { kind: 'row' | 'column'; index: number } | null;
}
export type NearMissMessage = { kind: 'newBest' | 'bestShort' | 'targetShort' | 'piece' | 'line' | 'xp' | 'weekly' | 'achievement' | 'mission' | 'fallback'; amount: number; target?: number; shape?: ShapeKey; lineKind?: 'row' | 'column'; index?: number; level?: number; name?: string; unit?: string };
export interface NearMissExtras { xpRemaining?: number; level?: number; levelCost?: number; weeklyRemaining?: number; weeklyTarget?: number; achievement?: { remaining: number; target: number; name: string; unit: string }; mission?: { remaining: number; target: number; text: string } }
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

export function nearMissMessages(state: GameState, oldBest: number, fallbackBiggestPop: number, linesCleared: number, extras: NearMissExtras = {}): NearMissMessage[] {
  const facts = nearMissFacts(state); const result: NearMissMessage[] = [];
  if (oldBest > 0 && state.score > oldBest) result.push({ kind: 'newBest', amount: state.score - oldBest });
  else if (oldBest > 0 && oldBest - state.score <= oldBest * 0.15) result.push({ kind: 'bestShort', amount: oldBest - state.score });
  if (result.length < 2 && state.goals && (state.mode === 'classic' || state.mode === 'expert')) {
    const target = nextTarget(state.score, state.goals.floor); const remaining = target - state.score;
    if (remaining > 0 && remaining <= target * 0.1) result.push({ kind: 'targetShort', amount: remaining, target });
  }
  if (result.length < 2 && facts.pieceOneCellShort) result.push({ kind: 'piece', amount: 1, shape: facts.pieceOneCellShort.shape });
  if (result.length < 2 && facts.lineOneFromFull) result.push({ kind: 'line', amount: 1, lineKind: facts.lineOneFromFull.kind, index: facts.lineOneFromFull.index });
  if (result.length < 2 && extras.xpRemaining !== undefined && extras.levelCost !== undefined && extras.xpRemaining <= extras.levelCost * 0.25) result.push({ kind: 'xp', amount: extras.xpRemaining, level: extras.level });
  if (result.length < 2 && extras.weeklyRemaining !== undefined && extras.weeklyTarget !== undefined && extras.weeklyRemaining <= extras.weeklyTarget * 0.2) result.push({ kind: 'weekly', amount: extras.weeklyRemaining });
  if (result.length < 2 && extras.achievement && extras.achievement.remaining <= extras.achievement.target * 0.2) result.push({ kind: 'achievement', amount: extras.achievement.remaining, name: extras.achievement.name, unit: extras.achievement.unit });
  if (result.length < 2 && extras.mission && extras.mission.remaining <= extras.mission.target * 0.2) result.push({ kind: 'mission', amount: extras.mission.remaining, name: extras.mission.text });
  if (result.length < 2) result.push({ kind: 'fallback', amount: fallbackBiggestPop > 0 ? fallbackBiggestPop : linesCleared });
  return result.slice(0, 2);
}

