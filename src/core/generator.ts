import { fits } from './board';
import { nextFloat, nextInt, weightedPick } from './rng';
import { f2Probability, flavoursForStage, weightsForStage } from './stages';
import { canPlaceAll } from './solver';
import { FAMILY_IDS, PIECES } from './pieces';
import type { Flavour, Piece, RngState } from './types';

export interface DealOptions { mode?: 'classic' | 'expert' | 'zen' | 'daily'; forceSolvable?: boolean; }
export interface DealDebug { attempts: number; fallbackUsed: boolean; budgetHit: boolean; }
export interface DealResult { tray: Piece[]; debug: DealDebug; }

export function dealTray(board: ArrayLike<number>, rng: RngState, stage: number, options: DealOptions = {}): DealResult {
  const daily = options.mode === 'daily';
  let last: Piece[] = [];
  let budgetHit = false;
  let lastWantsF2 = Boolean(options.forceSolvable);
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    const tray: Piece[] = [];
    for (let slot = 0; slot < 3; slot += 1) tray.push(drawPiece(rng, stage, daily));
    // design §7.3: the F2 draw follows the three piece draws.
    const passesShape = enforceF3(tray, rng, stage, daily);
    last = tray;
    const roll = nextFloat(rng);
    const wantsF2 = options.forceSolvable || (!daily && (options.mode === 'expert' ? roll < 0.5 : options.mode === 'zen' ? true : roll < f2Probability(stage)));
    lastWantsF2 = wantsF2;
    const hasFit = tray.some((piece) => hasPlacement(board, piece.defId));
    if (!passesShape || !hasFit) continue;
    if (wantsF2) {
      const solved = canPlaceAll(board, tray);
      if (solved === 'budget') budgetHit = true;
      if (solved === 'no') continue;
    }
    return { tray, debug: { attempts: attempt, fallbackUsed: false, budgetHit } };
  }
  const fallback = fallbackTray(board, last, stage, daily, lastWantsF2);
  return { tray: fallback, debug: { attempts: 30, fallbackUsed: true, budgetHit } };
}

function drawPiece(rng: RngState, stage: number, daily: boolean): Piece {
  const weights = weightsForStage(stage, daily);
  const family = FAMILY_IDS[weightedPick(rng, FAMILY_IDS.map((id) => weights[id]))] ?? 'Dot';
  const defs = PIECES.filter((piece) => piece.family === family);
  const def = defs[nextInt(rng, defs.length)] ?? PIECES[0]!;
  const flavours = daily ? flavoursForStage(3) : flavoursForStage(stage);
  return { defId: def.id, flavour: flavours[nextInt(rng, flavours.length)] ?? 1 };
}

function enforceF3(tray: Piece[], rng: RngState, stage: number, daily: boolean): boolean {
  const redraws = [0, 0, 0];
  while (true) {
    const offendingSlot = f3OffendingSlot(tray, stage, daily);
    if (offendingSlot === -1) return true;
    if ((redraws[offendingSlot] ?? 10) >= 10) return false;
    tray[offendingSlot] = drawPiece(rng, stage, daily);
    redraws[offendingSlot] = (redraws[offendingSlot] ?? 0) + 1;
  }
}

function respectsF3(tray: readonly Piece[], stage: number, daily: boolean): boolean {
  return f3OffendingSlot(tray, stage, daily) === -1;
}
function f3OffendingSlot(tray: readonly Piece[], stage: number, daily: boolean): number {
  const bigSquareSlots = tray.map((piece, slot) => PIECES[piece.defId]?.family === 'O3' ? slot : -1).filter((slot) => slot >= 0);
  if (bigSquareSlots.length > 1) return bigSquareSlots[bigSquareSlots.length - 1] ?? 0;
  if (!daily && stage <= 2) {
    const largeSlots = tray.map((piece, slot) => (PIECES[piece.defId]?.cells.length ?? 0) >= 5 ? slot : -1).filter((slot) => slot >= 0);
    if (largeSlots.length > 1) return largeSlots[largeSlots.length - 1] ?? 0;
  }
  return -1;
}

function fallbackTray(board: ArrayLike<number>, source: readonly Piece[], stage: number, daily: boolean, requireF2: boolean): Piece[] {
  const tray = source.length === 3 ? source.map((piece) => ({ ...piece })) : [{ defId: 0, flavour: 1 as Flavour }, { defId: 0, flavour: 1 as Flavour }, { defId: 0, flavour: 1 as Flavour }];
  const candidates = [...PIECES].sort((a, b) => b.cells.length - a.cells.length || a.id - b.id);
  for (let slot = 2; slot >= 0; slot -= 1) {
    let replaced = false;
    for (const candidate of candidates) {
      tray[slot] = { defId: candidate.id, flavour: source[slot]?.flavour ?? 1 };
      if (!respectsF3(tray, stage, daily) || !tray.some((piece) => hasPlacement(board, piece.defId))) continue;
      if (requireF2 && canPlaceAll(board, tray) === 'no') continue;
      replaced = true; break;
    }
    if (!replaced) tray[slot] = { defId: 0, flavour: source[slot]?.flavour ?? 1 };
  }
  if (requireF2 && canPlaceAll(board, tray) === 'no') {
    for (let slot = 2; slot >= 0; slot -= 1) {
      tray[slot] = { defId: 0, flavour: source[slot]?.flavour ?? 1 };
      if (canPlaceAll(board, tray) === 'yes') break;
    }
  }
  return tray;
}

function hasPlacement(board: ArrayLike<number>, defId: number): boolean {
  const def = PIECES[defId]; if (!def) return false;
  for (let row = 0; row <= 8 - def.h; row += 1) for (let col = 0; col <= 8 - def.w; col += 1) if (fits(board, def, row, col)) return true;
  return false;
}
