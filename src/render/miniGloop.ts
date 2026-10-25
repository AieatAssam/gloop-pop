// SG §11.7: mode card illustrations use the same glossy gloop body and face renderer.
import { drawGloop } from './gloopRenderer';
import type { Flavour } from '../core/types';
import { PALETTE } from './palette';

export function createMiniGloop(flavour: Flavour, expression: 'idle' | 'sleep' = 'idle', crown = false): HTMLCanvasElement {
  const canvas = document.createElement('canvas'); canvas.width = 112; canvas.height = 112;
  const ctx = canvas.getContext('2d'); if (!ctx) return canvas;
  drawGloop(ctx, { flavour, cells: [0], bfs: [0], largestSquare: { row: 0, col: 0, size: 1 } }, 72, 20, 24, 0, expression);
  if (crown) { ctx.save(); ctx.translate(56, 27); ctx.fillStyle = PALETTE.accessory.crown; ctx.strokeStyle = PALETTE.accessory.crownShade; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-17, 5); ctx.lineTo(-14, -8); ctx.lineTo(-5, 0); ctx.lineTo(0, -14); ctx.lineTo(6, 0); ctx.lineTo(15, -8); ctx.lineTo(18, 5); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
  return canvas;
}
