import { cyrb128 } from './hash';
import { nextInt, sfc32, weightedPick } from './rng';
import { fullLines, fits, place } from './board';
import { FAMILY_IDS, PIECES } from './pieces';
import { weightsForStage } from './stages';
import type { Flavour, Piece, RngState } from './types';

const DAY_MS = 86_400_000;
const DAILY_EPOCH = 1_792_886_400_000; // 2026-10-25T00:00:00Z

export function dayKeyFromMs(ms: number): string {
  const z = Math.floor(ms / DAY_MS) + 719_468;
  const era = Math.floor(z / 146_097);
  const doe = z - era * 146_097;
  const yoe = Math.floor((doe - Math.floor(doe / 1_460) + Math.floor(doe / 36_524) - Math.floor(doe / 146_096)) / 365);
  let year = yoe + era * 400;
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const day = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const month = mp + (mp < 10 ? 3 : -9);
  year += month <= 2 ? 1 : 0;
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function dayNumber(dayKey: string): number {
  const [year, month, day] = dayKey.split('-').map(Number);
  const parsed = daysFromCivil(year ?? 0, month ?? 1, day ?? 1) * DAY_MS;
  return Math.max(1, Math.floor((parsed - DAILY_EPOCH) / DAY_MS) + 1);
}

function daysFromCivil(year: number, month: number, day: number): number {
  const adjustedYear = year - (month <= 2 ? 1 : 0);
  const era = Math.floor(adjustedYear / 400);
  const yoe = adjustedYear - era * 400;
  const shiftedMonth = month + (month > 2 ? -3 : 9);
  const doy = Math.floor((153 * shiftedMonth + 2) / 5) + day - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146_097 + doe - 719_468;
}

export function msToNextUtcMidnight(ms: number): number {
  return (Math.floor(ms / DAY_MS) + 1) * DAY_MS - ms;
}

export function seedStringForDay(dayKey: string): string {
  return `gloop-pop/daily/v1/${dayKey}`;
}

export function rngForStream(dayKey: string, stream: 'board' | 'trays' | 'fod'): RngState {
  const [a, b, c, d] = cyrb128(`${seedStringForDay(dayKey)}/${stream}`);
  const state = { a, b, c, d };
  for (let i = 0; i < 12; i += 1) sfc32(state);
  return state;
}

export function flavourForDay(dayKey: string): Flavour {
  return (nextInt(rngForStream(dayKey, 'fod'), 6) + 1) as Flavour;
}

export interface DailyDeal { board: number[]; trays: Piece[][]; flavourOfDay: Flavour; }
const DAILY_START_DEFS = [1, 2, 3, 4, 13, 14, 15, 16, 9];

/** Creates the fixed board and 30 F3-only trays from independent daily streams. */
export function createDailyDeal(dayKey: string): DailyDeal {
  const boardRng = rngForStream(dayKey, 'board'); const trayRng = rngForStream(dayKey, 'trays');
  const board = new Uint8Array(64); let placed = 0; let attempts = 0;
  while (placed < 4 && attempts < 20_000) {
    attempts += 1;
    const def = PIECES[DAILY_START_DEFS[nextInt(boardRng, DAILY_START_DEFS.length)] ?? 1]!;
    const flavour = (nextInt(boardRng, 6) + 1) as Flavour;
    const row = nextInt(boardRng, 9 - def.h); const col = nextInt(boardRng, 9 - def.w);
    if (!fits(board, def, row, col)) continue;
    const candidate = place(board, def, row, col, flavour)!;
    if (fullLines(candidate).cells.length > 0) continue;
    board.set(candidate); placed += 1;
  }
  const trays: Piece[][] = [];
  const dailyWeights = weightsForStage(3, true);
  for (let trayIndex = 0; trayIndex < 30; trayIndex += 1) {
    const tray: Piece[] = [];
    for (let slot = 0; slot < 3; slot += 1) {
      let piece = drawDailyPiece(trayRng, dailyWeights);
      for (let redraw = 0; redraw < 10 && violatesDailyF3([...tray, piece]); redraw += 1) piece = drawDailyPiece(trayRng, dailyWeights);
      tray.push(piece);
    }
    trays.push(tray);
  }
  return { board: [...board], trays, flavourOfDay: flavourForDay(dayKey) };
}

function drawDailyPiece(rng: RngState, weights: ReturnType<typeof weightsForStage>): Piece {
  const family = FAMILY_IDS[weightedPick(rng, FAMILY_IDS.map((id) => weights[id]))] ?? 'Dot';
  const defs = PIECES.filter((piece) => piece.family === family);
  return { defId: defs[nextInt(rng, defs.length)]?.id ?? 0, flavour: (nextInt(rng, 6) + 1) as Flavour };
}
function violatesDailyF3(tray: readonly Piece[]): boolean {
  return tray.filter((piece) => PIECES[piece.defId]?.family === 'O3').length > 1;
}
