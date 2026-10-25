import { place } from './board';
import { advanceCombo } from './combo';
import { fitsAnywhere, canPlace } from './game';
import { PIECES } from './pieces';
import { resolveBoard } from './resolve';
import { scoreMove } from './scoring';
import { nextInt } from './rng';
import type { Action, GameState, RngState } from './types';

const GOAL_WEIGHTS = { L: 120, S: 0, F: 30, B: 300, M: 300, C: 250 } as const;
type GoalKind = keyof typeof GOAL_WEIGHTS;
interface Candidate { action: Action; value: number; safe: boolean }

/** Frozen design §24.6 bot. Its objective delta is computed without target caps. */
export function chooseLevelMove(state: GameState, rng: RngState): Action | null {
  const candidates: Candidate[] = [];
  for (let slot = 0; slot < state.tray.length; slot += 1) {
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        if (!canPlace(state, slot, row, col)) continue;
        const action: Action = { type: 'place', slot: slot as 0 | 1 | 2, row, col };
        const { value, safe } = scoreCandidate(state, action);
        candidates.push({ action, value, safe });
      }
    }
  }
  if (candidates.length === 0) return null;
  const safe = candidates.filter((candidate) => candidate.safe);
  const ranked = (safe.length > 0 ? safe : candidates).sort((a, b) => b.value - a.value);
  const choice = nextInt(rng, Math.min(3, ranked.length));
  return ranked[choice]?.action ?? ranked[0]!.action;
}

export function levelBotHasFit(state: GameState): boolean {
  return state.tray.some((piece) => piece !== null && fitsAnywhere(state.board, piece.defId));
}

function scoreCandidate(state: GameState, action: Extract<Action, { type: 'place' }>): { value: number; safe: boolean } {
  const piece = state.tray[action.slot];
  const def = piece && PIECES[piece.defId];
  const adventure = state.adventure;
  if (!piece || !def || !adventure) return { value: Number.NEGATIVE_INFINITY, safe: false };
  const placed = place(state.board, def, action.row, action.col, piece.flavour);
  if (!placed) return { value: Number.NEGATIVE_INFINITY, safe: false };
  const resolution = resolveBoard(placed);
  const lines = resolution.rows.length + resolution.cols.length;
  const combo = advanceCombo(state, lines).state.combo;
  const popped = resolution.popped.map((gloop) => ({
    flavour: gloop.flavour,
    size: gloop.size,
    extraCells: gloop.cells.filter((cell) => !resolution.cells.includes(cell)),
  }));
  const points = scoreMove({ placedCells: def.cells.length, lines, popped, combo, allClear: resolution.allClear }).points;
  const lineCellsByFlavour = resolution.cells.map((cell) => placed[cell] ?? 0);
  let value = points + 40 * lines;
  for (const goal of adventure.goals) {
    const delta = goalDelta(goal.kind, goal.flavour, points, lines, lineCellsByFlavour, resolution.popped, resolution.cells, resolution.removedCubes.length);
    value += GOAL_WEIGHTS[goal.kind] * delta;
  }
  const safe = state.tray.every((remaining, slot) => slot === action.slot || remaining === null || fitsAnywhere(resolution.board, remaining.defId));
  return { value, safe };
}

function goalDelta(kind: GoalKind, flavour: number | undefined, points: number, lines: number, clearedFlavours: number[], popped: ReturnType<typeof resolveBoard>['popped'], clearedCells: number[], cubesRemoved: number): number {
  if (kind === 'L') return lines;
  if (kind === 'S') return points;
  if (kind === 'F') return flavour === undefined ? 0 : clearedFlavours.filter((cellFlavour) => cellFlavour === flavour).length
    + popped.filter((gloop) => gloop.flavour === flavour).reduce((sum, gloop) => sum + gloop.cells.filter((cell) => !clearedCells.includes(cell)).length, 0);
  if (kind === 'B') return popped.filter((gloop) => gloop.size >= 8).length;
  if (kind === 'M') return lines >= 2 ? 1 : 0;
  return cubesRemoved;
}
