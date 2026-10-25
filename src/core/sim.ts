import { cellIndex, fits, place } from './board';
import { newGame, step } from './game';
import { PIECES } from './pieces';
import { resolveBoard } from './resolve';
import { scoreMove } from './scoring';
import { canPlaceAll } from './solver';
import type { Piece } from './types';
import type { GameState, ModeId } from './types';

export interface SimGameResult { placements: number; score: number; stage: number; f2Fallbacks: number; trays: number; truncated: boolean; }
export interface SimSummary {
  runs: number; placements: Distribution; scores: Distribution; stages: Distribution;
  f2FallbackPercent: number; truncatedRuns: number;
}
export interface Distribution { median: number; mean: number; p10: number; p90: number; }

// spec-note: In this no-gravity board, a “hole” means an empty cell below a filled cell in a column; column heights define bumpiness.
/** Greedy scoring from architecture §9.3. */
export function chooseGreedyMove(state: GameState): { slot: 0 | 1 | 2; row: number; col: number; value: number } | null {
  let best: { slot: 0 | 1 | 2; row: number; col: number; value: number } | null = null;
  for (let slot = 0; slot < 3; slot += 1) {
    const piece = state.tray[slot]; if (!piece) continue;
    const def = PIECES[piece.defId]; if (!def) continue;
    for (let row = 0; row <= 8 - def.h; row += 1) for (let col = 0; col <= 8 - def.w; col += 1) {
      if (!fits(state.board, def, row, col)) continue;
      const placed = place(state.board, def, row, col, piece.flavour); if (!placed) continue;
      const resolved = resolveBoard(placed); const lineCount = resolved.rows.length + resolved.cols.length;
      const scoring = scoreMove({ placedCells: def.cells.length, lines: lineCount,
        popped: resolved.popped.map((gloop) => ({ flavour: gloop.flavour, size: gloop.size, extraCells: gloop.cells.filter((index) => !resolved.cells.includes(index)) })),
        combo: state.combo + (lineCount > 0 ? 1 : 0), allClear: resolved.allClear });
      const points = scoring.points; const popCells = scoring.parts.pop / 20;
      const remaining = state.tray.filter((item, index) => index !== slot && item !== null);
      const noRemainingFit = remaining.length > 0 && !remaining.some((item) => item && fitsSomewhere(resolved.board, item.defId));
      const { holes, bumpiness } = boardShape(resolved.board);
      const value = points + 40 * lineCount + 6 * popCells - 3 * holes - 2 * bumpiness - (noRemainingFit ? 25 : 0);
      if (!best || value > best.value) best = { slot: slot as 0 | 1 | 2, row, col, value };
    }
  }
  return best;
}

export function runSimGame(seed: string, mode: ModeId = 'classic'): SimGameResult {
  let state = newGame(mode, seed).state; let guard = 0;
  while (state.status !== 'over' && guard < 10_000) {
    guard += 1;
    if (state.status === 'rescueOffer') { state = step(state, { type: 'useRescue' }).state; continue; }
    const move = chooseGreedyMove(state);
    if (!move) break;
    state = step(state, { type: 'place', slot: move.slot, row: move.row, col: move.col }).state;
  }
  return { placements: state.stats.placements, score: state.score, stage: state.stage, f2Fallbacks: state.stats.f2Fallbacks, trays: state.traysDealt, truncated: state.status !== 'over' };
}

export function runSimulation(runs = 300, mode: ModeId = 'classic', seed = '1'): SimSummary {
  const results = Array.from({ length: runs }, (_, index) => runSimGame(`${seed}/${index}`, mode));
  const trays = results.reduce((sum, result) => sum + result.trays, 0);
  const fallbackCount = results.reduce((sum, result) => sum + result.f2Fallbacks, 0);
  const truncatedRuns = results.filter((result) => result.truncated).length;
  return {
    runs, placements: distribution(results.map((result) => result.placements)), scores: distribution(results.map((result) => result.score)),
    stages: distribution(results.map((result) => result.stage)), f2FallbackPercent: trays === 0 ? 0 : 100 * fallbackCount / trays, truncatedRuns,
  };
}

/** Deterministic solver workloads measured by the Node CLI, outside the pure core. */
export function solverProbeCases(): { board: number[]; pieces: Piece[] }[] {
  return Array.from({ length: 12 }, (_, sample) => {
    const board = new Array<number>(64);
    for (let index = 0; index < 64; index += 1) board[index] = (index * 17 + sample * 29) % 5 < 2 ? 0 : ((index + sample) % 7) + 1;
    const pieces = [0, 1, 2].map((slot) => {
      const defId = (sample * 7 + slot * 11) % PIECES.length;
      return { defId, flavour: (((sample + slot) % 7) + 1) as Piece['flavour'] };
    });
    return { board, pieces };
  });
}
export { canPlaceAll };

function fitsSomewhere(board: ArrayLike<number>, defId: number): boolean {
  const def = PIECES[defId]; if (!def) return false;
  for (let row = 0; row <= 8 - def.h; row += 1) for (let col = 0; col <= 8 - def.w; col += 1) if (fits(board, def, row, col)) return true;
  return false;
}
function boardShape(board: ArrayLike<number>): { holes: number; bumpiness: number } {
  let holes = 0; const heights: number[] = [];
  for (let col = 0; col < 8; col += 1) {
    let first = 8; for (let row = 0; row < 8; row += 1) if ((board[cellIndex(row, col)] ?? 0) !== 0) { first = row; break; }
    const height = 8 - first; heights.push(height);
    if (first < 8) for (let row = first + 1; row < 8; row += 1) if ((board[cellIndex(row, col)] ?? 0) === 0) holes += 1;
  }
  let bumpiness = 0; for (let col = 0; col < 7; col += 1) bumpiness += Math.abs((heights[col] ?? 0) - (heights[col + 1] ?? 0));
  return { holes, bumpiness };
}
function distribution(values: readonly number[]): Distribution {
  const sorted = [...values].sort((a, b) => a - b); const quantile = (p: number): number => sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))] ?? 0;
  const middle = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0 ? ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2 : sorted[middle] ?? 0;
  return { median, mean: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0, p10: quantile(0.1), p90: quantile(0.9) };
}
