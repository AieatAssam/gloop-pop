// SG §8.3 / §8.4: the outline-only ghost for an invalid drop spot (pointer drags and keyboard), shared with the landing ghost outline so both read as one family.
import { PALETTE } from './palette';

/** Board size in cells (the 8 x 8 grid). */
const BOARD = 8;
// spec-note: SG 8.3 says alpha 0.5, but fx.ghostOutline already has 70% alpha and read as a faint edge under the 75% held piece, so the outline uses the palette alpha at full strength (see SG 8.4).
export const OUTLINE_GHOST_ALPHA = 1;

export type ShapeCell = readonly [number, number];
export type GhostPlan = 'filled' | 'outline' | 'none';

/**
 * Writes the flat board indices (row * 8 + col) of the piece cells that land on the board into `out`
 * (cleared first, so the caller can reuse one array every frame). Cells off the board are skipped.
 * Returns how many cells were written.
 */
export function clipShapeToBoard(shape: readonly ShapeCell[], row: number, col: number, out: number[]): number {
  out.length = 0;
  for (const [dr, dc] of shape) {
    const r = row + dr; const c = col + dc;
    if (r >= 0 && r < BOARD && c >= 0 && c < BOARD) out.push(r * BOARD + c);
  }
  return out.length;
}

/**
 * Decides what the board draws for the held piece's preview. `row`/`col` is the spot (undefined when there is none).
 * - valid spot: 'filled' (the landing ghost fill and outline, SG §8.4)
 * - invalid spot with at least one cell on the board: 'outline' (outline only, SG §8.3); `out` holds the on-board cells
 * - no spot, or the piece is entirely off the board: 'none'
 */
export function previewPlan(valid: boolean, row: number | undefined, col: number | undefined, shape: readonly ShapeCell[], out: number[]): GhostPlan {
  if (valid) return 'filled';
  if (row === undefined || col === undefined) { out.length = 0; return 'none'; }
  return clipShapeToBoard(shape, row, col, out) > 0 ? 'outline' : 'none';
}

/** Line weight of one ghost cell outline (the same for the landing ghost and the invalid outline). */
export function ghostLineWidth(cell: number): number { return Math.max(1.5, cell * 0.05); }
/** Inset of one ghost cell outline: the outline sits 0.04c outside the cell. */
export function ghostInset(cell: number): number { return 2 - cell * 0.04 - ghostLineWidth(cell) / 2; }

/** Strokes one rounded ghost cell at its top-left (x, y). The caller sets strokeStyle, lineWidth and alpha. Uses the context's own path, so no Path2D is allocated per frame. */
export function strokeGhostCell(ctx: CanvasRenderingContext2D, x: number, y: number, cell: number, inset: number): void {
  ctx.beginPath(); ctx.roundRect(x + inset, y + inset, cell - 2 * inset, cell - 2 * inset, cell * 0.2); ctx.stroke();
}

/**
 * Draws the invalid-spot ghost: an outline only, no fill, in `fx.ghostOutline`.
 * `cells` holds flat board indices from clipShapeToBoard. `strength` (0..1) scales the alpha, so a drag can cross-fade it with the landing ghost.
 * Static: no pulse and no flashing, so reduced motion needs no change.
 */
export function drawOutlineGhost(ctx: CanvasRenderingContext2D, cells: readonly number[], gx: number, gy: number, cell: number, strength: number): void {
  if (cells.length === 0 || strength <= 0.001) return;
  const inset = ghostInset(cell);
  ctx.save(); ctx.globalAlpha = OUTLINE_GHOST_ALPHA * Math.min(1, strength); ctx.strokeStyle = PALETTE.fx.ghostOutline; ctx.lineWidth = ghostLineWidth(cell);
  for (const index of cells) strokeGhostCell(ctx, gx + (index % BOARD) * cell, gy + Math.floor(index / BOARD) * cell, cell, inset);
  ctx.restore();
}
