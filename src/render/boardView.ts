// SG §7.2, §8.4, §5.3: mould tray, sockets, gloop bodies and live placement previews.
import { components } from '../core/gloops';
import { PIECES } from '../core/pieces';
import { canPlace, previewPlacement } from '../core/game';
import type { GameState, Piece, Preview } from '../core/types';
import { PALETTE } from './palette';
import { withAlpha } from './colour';
import { drawGloop, drawPiece } from './gloopRenderer';
import { roundRectPath } from './silhouette';
import type { Layout, Rect } from './layout';

export interface SlotView { rect: Rect; piece: Piece | null; cell: number }
export interface BoardView {
  draw(context: CanvasRenderingContext2D, layout: Layout, state: GameState, elapsed: number, drag?: DragView, demo?: string): SlotView[];
  cellAt(x: number, y: number, layout: Layout): { row: number; col: number } | null;
  slotAt(x: number, y: number, layout: Layout, state: GameState): number;
}
export interface DragView { slot: number; x: number; y: number; pointerType: string; selected: boolean; row?: number; col?: number }

export function createBoardView(): BoardView {
  let boardCache: HTMLCanvasElement | undefined; let boardCacheKey = '';
  const slotsFor = (layout: Layout, state: GameState): SlotView[] => {
    const result: SlotView[] = [];
    for (let i = 0; i < 3; i += 1) {
      const rect = slotRect(i, layout); const cell = layout.trayCellSize;
      result.push({ rect, piece: state.tray[i] ?? null, cell });
    }
    return result;
  };
  return {
    draw(ctx, layout, state, elapsed, drag, demo = '') {
      if (demo === 'faces') { drawFaceDemo(ctx, layout, elapsed); return []; }
      const board = layout.board; const c = layout.cellSize; const gx = board.x + (board.width - c * 8) / 2; const gy = board.y + (board.height - c * 8) / 2;
      const key = `${board.width}:${board.height}:${c}`;
      if (!boardCache || boardCacheKey !== key) { boardCache = createBoardLayer(board.width, board.height, c); boardCacheKey = key; }
      ctx.drawImage(boardCache, board.x, board.y, board.width, board.height);
      const groups = demo === 'board' ? showcase() : components(state.board);
      for (const gloop of groups) drawGloop(ctx, gloop, c, gx, gy, elapsed, state.status === 'over' ? 'dizzy' : 'idle');
      const slotViews = slotsFor(layout, state);
      slotViews.forEach((slot, i) => {
        const r = slot.rect; ctx.fillStyle = PALETTE.theme.midnight.frameDark; ctx.globalAlpha = slot.piece ? 0.42 : 0.35; ctx.fill(roundRectPath(r.x, r.y, r.width, r.height, 18)); ctx.globalAlpha = 1;
        if (!slot.piece || drag?.slot === i) return;
        const def = PIECES[slot.piece.defId]!; const pc = Math.min(slot.cell, r.width / 5.4, r.height / 5.4); const fit = hasFit(state, slot.piece); const x = r.x + (r.width - def.w * pc) / 2; const y = r.y + (r.height - def.h * pc) / 2;
        drawPiece(ctx, slot.piece.flavour, def.cells, pc, x, y, elapsed, fit ? 'idle' : 'worried', fit ? 1 : 0.45);
      });
      if (drag) {
        const piece = state.tray[drag.slot]; if (piece) {
          const def = PIECES[piece.defId]!; const pc = c; const px = drag.pointerType === 'touch' ? drag.x - def.w * pc / 2 : drag.x - def.w * pc / 2; const py = drag.pointerType === 'touch' ? drag.y - def.h * pc - c * 1.1 : drag.y - def.h * pc / 2;
          const cell = drag.pointerType === 'keyboard' && drag.row !== undefined && drag.col !== undefined ? { row: drag.row, col: drag.col } : this.cellAt(px, py, layout); const valid = !!cell && canPlace(state, drag.slot, cell.row, cell.col); const preview: Preview | null = valid && cell ? previewPlacement(state, drag.slot, cell.row, cell.col) : null;
          if (preview && cell) drawPreview(ctx, state, piece, preview, cell.row, cell.col, gx, gy, c, elapsed);
          if (drag.pointerType === 'keyboard') { const kx = gx + (drag.col ?? 0) * c; const ky = gy + (drag.row ?? 0) * c; drawPiece(ctx, piece.flavour, def.cells, pc, kx, ky, elapsed, valid ? 'excited' : 'worried', valid ? 0.46 : 0.28); }
          else drawPiece(ctx, piece.flavour, def.cells, pc, px, py, elapsed, valid ? 'excited' : 'worried', valid ? 0.82 : 0.75);
        }
      }
      return slotViews;
    },
    cellAt(x, y, layout) {
      const c = layout.cellSize; const gx = layout.board.x + (layout.board.width - c * 8) / 2; const gy = layout.board.y + (layout.board.height - c * 8) / 2;
      const col = Math.floor((x - gx) / c); const row = Math.floor((y - gy) / c);
      return row >= 0 && row < 8 && col >= 0 && col < 8 ? { row, col } : null;
    },
    slotAt(x, y, layout, state) { return slotsFor(layout, state).findIndex((slot) => x >= slot.rect.x && x <= slot.rect.x + slot.rect.width && y >= slot.rect.y && y <= slot.rect.y + slot.rect.height && !!slot.piece); },
  };
}

function createBoardLayer(width: number, height: number, c: number): HTMLCanvasElement {
  const layer = document.createElement('canvas'); layer.width = Math.ceil(width); layer.height = Math.ceil(height); const ctx = layer.getContext('2d');
  if (!ctx) return layer;
  const x = (width - c * 8) / 2; const y = (height - c * 8) / 2;
  const frame = ctx.createLinearGradient(0, 0, 0, height); frame.addColorStop(0, PALETTE.theme.midnight.frameLight); frame.addColorStop(0.25, PALETTE.theme.midnight.frame); frame.addColorStop(1, PALETTE.theme.midnight.frameDark);
  ctx.save(); ctx.fillStyle = PALETTE.light.shadowDeep; ctx.shadowColor = PALETTE.light.shadowDeep; ctx.shadowBlur = c * 0.5; ctx.shadowOffsetY = c * 0.15; ctx.fill(roundRectPath(0, 0, width, height, c * 0.55)); ctx.restore();
  ctx.fillStyle = frame; ctx.fill(roundRectPath(0, 0, width, height, c * 0.55)); ctx.strokeStyle = withAlpha(PALETTE.light.specular, 0.12); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(c * 0.7, 2); ctx.lineTo(width - c * 0.7, 2); ctx.stroke();
  ctx.fillStyle = PALETTE.theme.midnight.well; ctx.fill(roundRectPath(x - 2, y - 2, c * 8 + 4, c * 8 + 4, c * 0.35));
  for (let i = 0; i < 64; i += 1) {
    const cx = x + (i % 8) * c; const cy = y + Math.floor(i / 8) * c;
    ctx.fillStyle = PALETTE.theme.midnight.cell; ctx.fill(roundRectPath(cx + c * 0.06, cy + c * 0.06, c * 0.88, c * 0.88, c * 0.22));
    ctx.strokeStyle = PALETTE.theme.midnight.cellShade; ctx.lineWidth = Math.max(1, c * 0.04); ctx.beginPath(); ctx.moveTo(cx + c * 0.2, cy + c * 0.13); ctx.lineTo(cx + c * 0.8, cy + c * 0.13); ctx.stroke();
    ctx.strokeStyle = PALETTE.theme.midnight.cellLight; ctx.beginPath(); ctx.moveTo(cx + c * 0.2, cy + c * 0.87); ctx.lineTo(cx + c * 0.8, cy + c * 0.87); ctx.stroke();
  }
  return layer;
}

function slotRect(index: number, layout: Layout): Rect {
  if (layout.portrait) { const width = Math.min(122 * layout.height / 844, layout.tray.width / 3 - 4); const gap = 8; const total = width * 3 + gap * 2; const x = layout.tray.x + (layout.tray.width - total) / 2 + index * (width + gap); return { x, y: layout.tray.y + 4, width, height: Math.max(80, layout.tray.height - 8) }; }
  const width = layout.tray.width; const height = layout.tray.height / 3 - 8; return { x: layout.tray.x, y: layout.tray.y + index * (height + 12), width, height };
}
function hasFit(state: GameState, piece: Piece): boolean { return Array.from({ length: 64 }, (_, i) => canPlace(state, state.tray.indexOf(piece), Math.floor(i / 8), i % 8)).some(Boolean); }
function drawPreview(ctx: CanvasRenderingContext2D, _state: GameState, piece: Piece, preview: Preview, row: number, col: number, gx: number, gy: number, c: number, elapsed: number): void {
  const def = PIECES[piece.defId]!; const alpha = 0.32;
  ctx.save(); ctx.globalAlpha = alpha; for (const [dr, dc] of def.cells) { ctx.fillStyle = PALETTE.flavour[Object.keys(PALETTE.flavour)[piece.flavour - 1] as keyof typeof PALETTE.flavour].base; ctx.fill(roundRectPath(gx + (col + dc) * c + 2, gy + (row + dr) * c + 2, c - 4, c - 4, c * 0.2)); } ctx.restore();
  ctx.save(); ctx.globalAlpha = 0.24 + 0.1 * Math.sin(elapsed / 95); ctx.fillStyle = PALETTE.fx.lineGlow;
  for (const r of preview.rows) ctx.fillRect(gx, gy + r * c, c * 8, c); for (const co of preview.cols) ctx.fillRect(gx + co * c, gy, c, c * 8); ctx.restore();
  ctx.save(); ctx.globalAlpha = 0.5 + 0.5 * Math.sin(elapsed / 80); ctx.strokeStyle = PALETTE.fx.popPreview; ctx.lineWidth = c * 0.07;
  const cleared = new Set<number>(); for (const r of preview.rows) for (let column = 0; column < 8; column += 1) cleared.add(r * 8 + column); for (const column of preview.cols) for (let rowIndex = 0; rowIndex < 8; rowIndex += 1) cleared.add(rowIndex * 8 + column);
  for (const group of preview.popping) {
    let count = 0; let totalX = 0; let totalY = 0;
    for (const index of group) { const x = gx + (index % 8) * c; const y = gy + Math.floor(index / 8) * c; ctx.stroke(roundRectPath(x + 2, y + 2, c - 4, c - 4, c * 0.2)); if (!cleared.has(index)) { count += 1; totalX += x + c / 2; totalY += y + c / 2; } }
    if (count) { ctx.font = `800 ${Math.max(14, c * 0.36)}px "Baloo 2", sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = PALETTE.fx.numberOutline; ctx.fillStyle = PALETTE.ui.textPrimary; ctx.strokeText(`+${new Intl.NumberFormat('en-US').format(count)}`, totalX / count, totalY / count); ctx.fillText(`+${new Intl.NumberFormat('en-US').format(count)}`, totalX / count, totalY / count); }
  }
  if (preview.rows.length === 0 && preview.cols.length === 0) {
    ctx.globalAlpha = 0.7; ctx.strokeStyle = PALETTE.flavour[Object.keys(PALETTE.flavour)[piece.flavour - 1] as keyof typeof PALETTE.flavour].light; ctx.lineWidth = c * 0.04;
    for (const group of preview.mergeTargets) for (const index of group) { const x = gx + (index % 8) * c; const y = gy + Math.floor(index / 8) * c; ctx.stroke(roundRectPath(x + 2, y + 2, c - 4, c - 4, c * 0.2)); }
  }
  ctx.restore();
}
function showcase() {
  const specs: [number, number[]][] = [[1, [0, 8, 16]], [2, [5, 6, 13]], [3, [18, 19, 26, 27]], [4, [31, 39, 47]], [5, [36, 37, 38, 44, 45, 46, 52, 53, 54]], [6, [40, 41, 42, 48, 50, 56, 57, 58]], [7, [61, 62, 63]]];
  return specs.map(([flavour, cells]) => ({ flavour: flavour as 1 | 2 | 3 | 4 | 5 | 6 | 7, cells, bfs: cells, largestSquare: { row: Math.floor(cells[0]! / 8), col: cells[0]! % 8, size: cells.length >= 9 ? 3 : cells.length >= 4 ? 2 : 1 } }));
}
function drawFaceDemo(ctx: CanvasRenderingContext2D, layout: Layout, elapsed: number): void {
  const expressions = ['idle', 'happy', 'grin', 'excited', 'worried', 'sad', 'popping', 'dizzy', 'sleep', 'starEyes']; const cell = Math.min(34, layout.width / 9); const colW = layout.width / 7; const rowH = (layout.height - 84) / expressions.length;
  for (let flavour = 1; flavour <= 7; flavour += 1) for (let row = 0; row < expressions.length; row += 1) {
    const gloop = { flavour: flavour as 1 | 2 | 3 | 4 | 5 | 6 | 7, cells: [0], bfs: [0], largestSquare: { row: 0, col: 0, size: 1 } };
    const x = colW * (flavour - 0.5) - cell / 2; const y = 58 + rowH * row + (rowH - cell) / 2;
    drawGloop(ctx, gloop, cell, x, y, elapsed, expressions[row]);
  }
}
