import { place } from './board';
import { fitsAnywhere, newGame, step } from './game';
import { PIECES } from './pieces';
import { resolveBoard } from './resolve';
import { scoreMove } from './scoring';
import { canPlaceAll } from './solver';
import { nextInt, seededRng } from './rng';
import type { GameState, ModeId, Piece, RngState } from './types';

export interface SimGameResult { placements: number; score: number; stage: number; f2Fallbacks: number; trays: number; truncated: boolean; }
export interface SimSummary {
  runs: number; placements: Distribution; scores: Distribution; stages: Distribution;
  under25Percent: number; f2FallbackPercent: number; truncatedRuns: number;
}
export interface Distribution { median: number; mean: number; p10: number; p90: number; }

export interface BotMove { slot: 0 | 1 | 2; row: number; col: number; value: number; }

/**
 * Architecture §9.3: every legal (piece, position) move of the current tray, ranked best first.
 * value = movePoints + 40 × lines; ties keep the lower slot, then the lower board index.
 * `safe` = every other piece still in the tray fits somewhere afterwards.
 */
export function rankMoves(state: GameState): (BotMove & { safe: boolean })[] {
  const moves: (BotMove & { safe: boolean })[] = [];
  for (let slot = 0; slot < 3; slot += 1) {
    const piece = state.tray[slot]; if (!piece) continue;
    const def = PIECES[piece.defId]; if (!def) continue;
    const remaining = state.tray.filter((item, index): item is Piece => index !== slot && item !== null);
    for (let row = 0; row <= 8 - def.h; row += 1) for (let col = 0; col <= 8 - def.w; col += 1) {
      const placed = place(state.board, def, row, col, piece.flavour); if (!placed) continue;
      const resolved = resolveBoard(placed); const lineCount = resolved.rows.length + resolved.cols.length;
      const { points } = scoreMove({ placedCells: def.cells.length, lines: lineCount,
        popped: resolved.popped.map((gloop) => ({ flavour: gloop.flavour, size: gloop.size, extraCells: gloop.cells.filter((index) => !resolved.cells.includes(index)) })),
        combo: state.combo + (lineCount > 0 ? 1 : 0), allClear: resolved.allClear });
      const safe = remaining.every((item) => fitsAnywhere(resolved.board, item.defId));
      moves.push({ slot: slot as 0 | 1 | 2, row, col, value: points + 40 * lineCount, safe });
    }
  }
  // Array.prototype.sort is stable, so equal values keep slot/index order.
  return moves.sort((a, b) => b.value - a.value);
}

/** The single best move (top of the ranking, preferring safe moves). Deterministic, no RNG. */
export function chooseGreedyMove(state: GameState): BotMove | null {
  const ranked = rankMoves(state); const best = ranked.find((move) => move.safe) ?? ranked[0];
  return best ? { slot: best.slot, row: best.row, col: best.col, value: best.value } : null;
}

// spec-note: architecture §9.3 bot = "decent human". It places one piece at a time (no whole-tray search, no lookahead
// past the current tray), never makes a move that leaves another tray piece with nowhere to go when it can avoid it,
// and plays one of its 3 best-ranked moves at random (seeded) instead of always the best. Always taking the best move
// made it near-perfect: it survived 2,000+ placements on every piece mix we tried (balance pass, 2026-10-25).
export const BOT_TOP_MOVES = 3;
export function chooseBotMove(state: GameState, botRng: RngState): BotMove | null {
  const ranked = rankMoves(state); if (ranked.length === 0) return null;
  const safe = ranked.filter((move) => move.safe); const pool = (safe.length > 0 ? safe : ranked).slice(0, BOT_TOP_MOVES);
  const pick = pool[nextInt(botRng, pool.length)]!;
  return { slot: pick.slot, row: pick.row, col: pick.col, value: pick.value };
}

export const SIM_PLACEMENT_CAP = 10_000;
export function runSimGame(seed: string, mode: ModeId = 'classic', cap = SIM_PLACEMENT_CAP): SimGameResult {
  let state = newGame(mode, seed).state; const botRng = seededRng(`${seed}/bot`);
  while (state.status !== 'over' && state.stats.placements < cap) {
    if (state.status === 'rescueOffer') { state = step(state, { type: 'useRescue' }).state; continue; }
    const move = chooseBotMove(state, botRng);
    if (!move) break;
    state = step(state, { type: 'place', slot: move.slot, row: move.row, col: move.col }).state;
  }
  return { placements: state.stats.placements, score: state.score, stage: state.stage, f2Fallbacks: state.stats.f2Fallbacks, trays: state.traysDealt, truncated: state.status !== 'over' };
}

export function runSimulation(runs = 300, mode: ModeId = 'classic', seed = '1', cap = SIM_PLACEMENT_CAP): SimSummary {
  const results = Array.from({ length: runs }, (_, index) => runSimGame(`${seed}/${index}`, mode, cap));
  const trays = results.reduce((sum, result) => sum + result.trays, 0);
  const fallbackCount = results.reduce((sum, result) => sum + result.f2Fallbacks, 0);
  const truncatedRuns = results.filter((result) => result.truncated).length;
  return {
    runs, placements: distribution(results.map((result) => result.placements)), scores: distribution(results.map((result) => result.score)),
    stages: distribution(results.map((result) => result.stage)),
    under25Percent: 100 * results.filter((result) => result.placements < 25).length / Math.max(1, runs), f2FallbackPercent: trays === 0 ? 0 : 100 * fallbackCount / trays, truncatedRuns,
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

function distribution(values: readonly number[]): Distribution {
  const sorted = [...values].sort((a, b) => a - b); const quantile = (p: number): number => sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))] ?? 0;
  const middle = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0 ? ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2 : sorted[middle] ?? 0;
  return { median, mean: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0, p10: quantile(0.1), p90: quantile(0.9) };
}
