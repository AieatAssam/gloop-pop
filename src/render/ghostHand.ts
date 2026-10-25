// SG §11.10: tutorial ghost hand and translucent piece travel on a repeating curve.
import type { Rect } from './layout';
import { PALETTE } from './palette';
import { drawPiece } from './gloopRenderer';

export function drawGhostHand(ctx: CanvasRenderingContext2D, elapsed: number, from: { x: number; y: number }, to: { x: number; y: number }, cell: number, cells: readonly (readonly [number, number])[]): void {
  const age = (elapsed - 600) % 2520;
  if (elapsed < 600 || age >= 2020) return;
  const alpha = age < 400 ? age / 400 : age >= 1720 ? 1 - (age - 1720) / 300 : 1;
  const travel = Math.min(1, Math.max(0, (age - 520) / 900)); const eased = travel * travel * (3 - 2 * travel);
  const control = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 - cell * 1.5 };
  const inverse = 1 - eased; const x = inverse * inverse * from.x + 2 * inverse * eased * control.x + eased * eased * to.x;
  const y = inverse * inverse * from.y + 2 * inverse * eased * control.y + eased * eased * to.y;
  if (age >= 520 && age < 1420) drawPiece(ctx, 4, cells, cell * 0.8, x - cell * 0.4, y - cell * 0.4, elapsed, 'idle', 0.5);
  ctx.save(); ctx.globalAlpha = Math.max(0, alpha) * 0.9; ctx.translate(x, y); ctx.scale(age >= 400 && age < 520 ? 0.9 : 1, age >= 400 && age < 520 ? 0.9 : 1);
  ctx.fillStyle = PALETTE.ui.ghostHand; ctx.strokeStyle = PALETTE.face.ink; ctx.lineWidth = Math.max(2, cell * 0.045); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-cell * 0.18, cell * 0.08); ctx.lineTo(-cell * 0.18, -cell * 0.14); ctx.quadraticCurveTo(-cell * 0.18, -cell * 0.25, -cell * 0.08, -cell * 0.25); ctx.lineTo(-cell * 0.04, -cell * 0.02); ctx.lineTo(-cell * 0.03, -cell * 0.47); ctx.quadraticCurveTo(-cell * 0.02, -cell * 0.58, cell * 0.07, -cell * 0.56); ctx.quadraticCurveTo(cell * 0.15, -cell * 0.55, cell * 0.14, -cell * 0.45); ctx.lineTo(cell * 0.14, -cell * 0.22); ctx.lineTo(cell * 0.22, -cell * 0.36); ctx.quadraticCurveTo(cell * 0.29, -cell * 0.42, cell * 0.34, -cell * 0.34); ctx.lineTo(cell * 0.29, -cell * 0.12); ctx.quadraticCurveTo(cell * 0.26, cell * 0.16, cell * 0.12, cell * 0.25); ctx.quadraticCurveTo(-cell * 0.04, cell * 0.3, -cell * 0.18, cell * 0.08); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (age >= 1420 && age < 1720) { ctx.globalAlpha *= 0.5; ctx.strokeStyle = PALETTE.ui.ghostHandShadow; ctx.lineWidth = Math.max(2, cell * 0.06); ctx.beginPath(); ctx.arc(0, 0, cell * (0.18 + 0.05 * Math.sin(age / 40)), 0, Math.PI * 2); ctx.stroke(); }
  ctx.restore();
}

export function tutorialHandPoints(board: Rect, tray: Rect, cell: number, row: number, col: number, pieceWidth: number): { from: { x: number; y: number }; to: { x: number; y: number } } {
  const inset = (board.width - cell * 8) / 2;
  return { from: { x: tray.x + tray.width / 2, y: tray.y + tray.height / 2 }, to: { x: board.x + inset + (col + pieceWidth / 2) * cell, y: board.y + inset + (row + 0.5) * cell } };
}
