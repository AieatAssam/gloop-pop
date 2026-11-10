// SG §8.3 / §8.4: the outline-only ghost for an invalid drop spot (pointer drags and keyboard), shared with the landing ghost outline so both read as one family.
import { PALETTE } from './palette';

/** Board size in cells (the 8 x 8 grid). */
const BOARD = 8;
/** SG §8.3: the invalid-spot outline is drawn at `fx.ghostOutline` alpha 0.5, with no fill. */
export const OUTLINE_GHOST_ALPHA = 0.5;

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
 * Decides what the board draws for the held piece's preview.
 * - valid spot: 'filled' (the landing ghost fill and outline, SG §8.4)
 * - invalid spot with at least one cell on the board: 'outline' (outline only, SG §8.3); `out` holds the on-board cells
 * - no spot, or the piece is entirely off the board: 'none'
 */
export function previewPlan(valid: boolean, spot: { row: number; col: number } | undefined, shape: readonly ShapeCell[], out: number[]): GhostPlan {
  if (valid) return 'filled';
  if (!spot) { out.length = 0; return 'none'; }
  return clipShapeToBoard(shape, spot.row, spot.col, out) > 0 ? 'outline' : 'none';
}

/** Line weight and inset of one ghost cell outline (the same values for the landing ghost and the invalid outline). */
export function ghostOutlineMetrics(cell: number): { lineWidth: number; inset: number } {
  const lineWidth = Math.max(1.5, cell * 0.05);
  return { lineWidth, inset: 2 - cell * 0.04 - lineWidth / 2 };
}

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
  const { lineWidth, inset } = ghostOutlineMetrics(cell);
  ctx.save(); ctx.globalAlpha = OUTLINE_GHOST_ALPHA * Math.min(1, strength); ctx.strokeStyle = PALETTE.fx.ghostOutline; ctx.lineWidth = lineWidth;
  for (const index of cells) strokeGhostCell(ctx, gx + (index % BOARD) * cell, gy + Math.floor(index / BOARD) * cell, cell, inset);
  ctx.restore();
}
