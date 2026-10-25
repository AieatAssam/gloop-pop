// SG §7.2, §8.4, §5.3: mould tray, sockets, gloop bodies and live placement previews.
import { components } from '../core/gloops';
import { PIECES } from '../core/pieces';
import { canPlace, previewPlacement } from '../core/game';
import type { GameEvent, GameState, Piece, Preview } from '../core/types';
import { PALETTE } from './palette';
import { withAlpha } from './colour';
import { drawGloop, drawPiece } from './gloopRenderer';
import { roundRectPath } from './silhouette';
import { S } from '../ui/strings';
import type { Layout, Rect } from './layout';
import { easeOutBack, easeInBack, easeOutElastic } from './easing';
import { nearMissFacts, type NearMissFacts } from '../core/nearMiss';

export interface SlotView { rect: Rect; piece: Piece | null; cell: number }
export interface BoardView {
  draw(context: CanvasRenderingContext2D, layout: Layout, state: GameState, elapsed: number, drag?: DragView, demo?: string, gameOverAt?: number): SlotView[];
  receive(events: readonly GameEvent[], time: number, state: GameState): void;
  cellAt(x: number, y: number, layout: Layout): { row: number; col: number } | null;
  slotAt(x: number, y: number, layout: Layout, state: GameState): number;
}
export interface DragView { slot: number; x: number; y: number; pointerType: string; selected: boolean; row?: number; col?: number }

export function createBoardView(): BoardView {
  let boardCache: HTMLCanvasElement | undefined; let boardCacheKey = ''; let previousTrayCount = -1; let trayDealAt = -1;
  let previousSeed: string | undefined; let previousBoard: number[] | undefined; let waveGroups: ReturnType<typeof components> = []; let waveAt = -1;
  let placement: { piece: Piece; cells: readonly number[]; row: number; col: number; at: number } | undefined;
  let entryAt = -1;
  let lossNearMiss: NearMissFacts | undefined;
  const happyUntil = new Map<number, number>(); const grinUntil = new Map<number, number>(); let allClearUntil = -1;
  const slotsFor = (layout: Layout, state: GameState): SlotView[] => {
    const result: SlotView[] = [];
    for (let i = 0; i < 3; i += 1) {
      const rect = slotRect(i, layout); const cell = layout.trayCellSize;
      result.push({ rect, piece: state.tray[i] ?? null, cell });
    }
    return result;
  };
  return {
    draw(ctx, layout, state, elapsed, drag, demo = '', gameOverAt = -1) {
      if (demo === 'faces') { drawFaceDemo(ctx, layout, elapsed); return []; }
      const board = layout.board; const c = layout.cellSize; const gx = board.x + (board.width - c * 8) / 2; const gy = board.y + (board.height - c * 8) / 2;
      if (!layout.portrait) drawDesktopPanelBacking(ctx, layout);
      const firstBoardFrame = previousSeed === undefined;
      if (previousSeed !== undefined && previousSeed !== state.seed) { waveGroups = previousBoard ? components(previousBoard) : []; waveAt = elapsed; }
      previousSeed = state.seed; previousBoard = state.board;
      const key = `${board.width}:${board.height}:${c}`;
      if (!boardCache || boardCacheKey !== key) { boardCache = createBoardLayer(board.width, board.height, c); boardCacheKey = key; }
      ctx.drawImage(boardCache, board.x, board.y, board.width, board.height);
      const groups = demo === 'board' ? showcase() : components(state.board); const filled = state.board.reduce((sum, value) => sum + (value > 0 ? 1 : 0), 0);
      if (firstBoardFrame && (state.mode === 'daily' || state.mode === 'tutorial') && state.moves === 0 && filled > 0) entryAt = elapsed;
      for (const gloop of groups) { const anchor = Math.min(...gloop.cells); const expression = state.status === 'over' ? elapsed - gameOverAt >= 300 ? 'dizzy' : 'worried' : state.combo >= 8 ? 'starEyes' : state.status === 'stuck' || filled >= 45 ? 'worried' : allClearUntil > elapsed ? 'happy' : happyUntil.get(anchor) !== undefined && happyUntil.get(anchor)! > elapsed ? 'happy' : grinUntil.get(anchor) !== undefined && grinUntil.get(anchor)! > elapsed ? 'grin' : 'idle'; if (entryAt >= 0) { const minRow = Math.min(...gloop.cells.map((cell) => Math.floor(cell / 8))); const minCol = Math.min(...gloop.cells.map((cell) => cell % 8)); const t = Math.min(1, Math.max(0, (elapsed - entryAt - (minRow + minCol) * 15) / 250)); const scale = easeOutBack(t); const centreX = gx + (minCol + 1) * c; const centreY = gy + (minRow + 1) * c; ctx.save(); ctx.translate(centreX, centreY); ctx.scale(scale, scale); drawGloop(ctx, gloop, c, gx - centreX, gy - centreY, elapsed, expression); ctx.restore(); } else drawGloop(ctx, gloop, c, gx, gy, elapsed, expression); }
      if (placement) { const age = elapsed - placement.at - 70; if (age >= 350) placement = undefined; else if (age >= 0) drawPlacement(ctx, placement, gx, gy, c, elapsed, age); }
      if (entryAt >= 0 && elapsed - entryAt > 490) entryAt = -1;
      if (waveAt >= 0) { for (let i = waveGroups.length - 1; i >= 0; i -= 1) { const old = waveGroups[i]!; const minRow = Math.min(...old.cells.map((cell) => Math.floor(cell / 8))); const minCol = Math.min(...old.cells.map((cell) => cell % 8)); const age = elapsed - waveAt - (minRow + minCol) * 12; if (age >= 250) { if (i === 0) { waveGroups = []; waveAt = -1; } continue; } if (age < 0) continue; const t = age / 250; const scale = Math.max(0, 1 - easeInBack(t)); const centreX = gx + (minCol + 1) * c; const centreY = gy + (minRow + 1) * c; ctx.save(); ctx.translate(centreX, centreY); ctx.scale(scale, scale); drawGloop(ctx, old, c, gx - centreX, gy - centreY, elapsed, 'popping'); ctx.restore(); } }
      if (state.status === 'over' && lossNearMiss?.pieceOneCellShort && gameOverAt >= 0) { const age = elapsed - gameOverAt - 200; if (age >= 0 && age < 700) { const fact = lossNearMiss.pieceOneCellShort; const piece = state.tray[fact.slot]; const def = piece ? PIECES[piece.defId]! : undefined; const pulse = 0.5 + 0.5 * Math.sin(age / 350 * Math.PI * 2); if (def) { ctx.save(); ctx.fillStyle = PALETTE.face.eyeWhite; ctx.strokeStyle = PALETTE.face.eyeWhite; ctx.lineWidth = Math.max(2, c * 0.045); for (const [dr, dc] of def.cells) { const x = gx + (fact.col + dc) * c; const y = gy + (fact.row + dr) * c; ctx.globalAlpha = 0.12; ctx.fill(roundRectPath(x + 3, y + 3, c - 6, c - 6, c * 0.2)); ctx.globalAlpha = 0.65 + pulse * 0.25; ctx.stroke(roundRectPath(x + 3, y + 3, c - 6, c - 6, c * 0.2)); } ctx.restore(); } for (const [dr, dc] of def?.cells ?? []) { const blockedRow = fact.row + dr; const blockedCol = fact.col + dc; const blocked = (state.board[blockedRow * 8 + blockedCol] ?? 0) > 0; if (blocked) { ctx.save(); ctx.globalAlpha = pulse; ctx.strokeStyle = PALETTE.fx.popPreview; ctx.lineWidth = c * 0.07; ctx.beginPath(); ctx.arc(gx + (blockedCol + 0.5) * c, gy + (blockedRow + 0.5) * c, c * (0.28 + 0.08 * pulse), 0, Math.PI * 2); ctx.stroke(); ctx.restore(); } } } }
      const slotViews = slotsFor(layout, state);
      if (previousTrayCount !== state.traysDealt) { previousTrayCount = state.traysDealt; trayDealAt = elapsed; }
      slotViews.forEach((slot, i) => {
        const r = slot.rect;
        // SG §8.2 tray wells: keep the specified translucent frameDark fill and add a soft interior lift for legibility.
        ctx.fillStyle = PALETTE.theme.midnight.frameDark; ctx.globalAlpha = slot.piece ? 0.42 : 0.35; ctx.fill(roundRectPath(r.x, r.y, r.width, r.height, 18));
        const slotLight = ctx.createLinearGradient(0, r.y, 0, r.y + r.height); slotLight.addColorStop(0, withAlpha(PALETTE.theme.midnight.frameLight, 0.24)); slotLight.addColorStop(0.42, withAlpha(PALETTE.theme.midnight.frame, 0.08)); slotLight.addColorStop(1, withAlpha(PALETTE.theme.midnight.frameDark, 0));
        ctx.globalAlpha = 0.72; ctx.fillStyle = slotLight; ctx.fill(roundRectPath(r.x + 2, r.y + 2, r.width - 4, r.height - 4, 16)); ctx.globalAlpha = 1;
        if (!slot.piece || drag?.slot === i) return;
        const def = PIECES[slot.piece.defId]!; const pc = Math.min(slot.cell, r.width / 5.4, r.height / 5.4); const fit = hasFit(state, slot.piece); const x = r.x + (r.width - def.w * pc) / 2; const y = r.y + (r.height - def.h * pc) / 2;
        const stuckShake = !fit && state.status === 'over' && gameOverAt >= 0 && elapsed - gameOverAt < 300 ? Math.sin((elapsed - gameOverAt) / 300 * Math.PI * 6) * 6 : 0;
        const dealAge = elapsed - trayDealAt - i * 60; const dealProgress = trayDealAt < 0 ? 1 : Math.min(1, Math.max(0, dealAge / 240)); const dealScale = trayDealAt < 0 ? 1 : 0.6 + 0.4 * easeOutBack(dealProgress); const dealY = dealAge < 240 ? -0.6 * pc * (1 - dealProgress) : 0;
        ctx.save(); ctx.translate(x + def.w * pc / 2, y + def.h * pc / 2 + dealY); ctx.scale(dealScale, dealScale); drawPiece(ctx, slot.piece.flavour, def.cells, pc, -def.w * pc / 2 + stuckShake, -def.h * pc / 2, elapsed, !fit && state.status === 'over' ? 'sad' : fit ? 'idle' : 'worried', fit ? 1 : 0.75, !fit); ctx.restore();
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
    receive(events, time, state) { const groups = components(state.board); if (state.status === 'over') lossNearMiss = nearMissFacts(state); else lossNearMiss = undefined; for (const event of events) {
      if (event.type === 'allClear') allClearUntil = time + 700;
      if (event.type === 'placed') placement = { piece: event.piece, cells: event.cells, row: Math.min(...event.cells.map((index) => Math.floor(index / 8))), col: Math.min(...event.cells.map((index) => index % 8)), at: time };
      if (event.type === 'cleared') for (const group of groups) if (group.cells.some((cell) => event.cells.some((clearCell) => Math.abs(cell % 8 - clearCell % 8) + Math.abs(Math.floor(cell / 8) - Math.floor(clearCell / 8)) <= 2))) happyUntil.set(Math.min(...group.cells), time + 700);
      if (event.type === 'placed' && event.mergedInto.length > 0) for (const group of groups) if (event.cells.some((cell) => group.cells.includes(cell))) grinUntil.set(Math.min(...group.cells), time + 800);
    } },
    cellAt(x, y, layout) {
      const c = layout.cellSize; const gx = layout.board.x + (layout.board.width - c * 8) / 2; const gy = layout.board.y + (layout.board.height - c * 8) / 2;
      const col = Math.floor((x - gx) / c); const row = Math.floor((y - gy) / c);
      return row >= 0 && row < 8 && col >= 0 && col < 8 ? { row, col } : null;
    },
    slotAt(x, y, layout, state) { return slotsFor(layout, state).findIndex((slot) => x >= slot.rect.x && x <= slot.rect.x + slot.rect.width && y >= slot.rect.y && y <= slot.rect.y + slot.rect.height && !!slot.piece); },
  };
}

// SG §9.2: the placed cells squash together as one jelly body, with the lower edge held in place.
function drawPlacement(ctx: CanvasRenderingContext2D, placement: { piece: Piece; cells: readonly number[]; row: number; col: number; at: number }, gx: number, gy: number, cell: number, elapsed: number, age: number): void {
  const def = PIECES[placement.piece.defId]!;
  const squash = Math.min(1, age / 55); const elastic = age < 55 ? 0 : easeOutElastic((age - 55) / 225);
  const scaleX = age < 55 ? 1 + 0.14 * squash : 1.14 - 0.14 * elastic; const scaleY = age < 55 ? 1 - 0.16 * squash : 0.84 + 0.16 * elastic;
  for (const index of placement.cells) { const x = gx + (index % 8) * cell; const y = gy + Math.floor(index / 8) * cell; ctx.fillStyle = PALETTE.theme.midnight.cell; ctx.beginPath(); ctx.roundRect(x + 1, y + 1, cell - 2, cell - 2, cell * 0.18); ctx.fill(); }
  const centreX = gx + (placement.col + def.w / 2) * cell; const bottomY = gy + (placement.row + def.h) * cell;
  ctx.save(); ctx.translate(centreX, bottomY); ctx.scale(scaleX, scaleY); drawPiece(ctx, placement.piece.flavour, def.cells, cell, -def.w * cell / 2, -def.h * cell, elapsed); ctx.restore();
}

// SG §11.3: desktop HUD and tray each sit on an opaque panel backing.
function drawDesktopPanelBacking(ctx: CanvasRenderingContext2D, layout: Layout): void {
  const panel = (x: number, y: number, width: number, height: number): void => {
    ctx.save(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = PALETTE.ui.panelSolid; ctx.strokeStyle = PALETTE.ui.panelBorder; ctx.lineWidth = 2;
    ctx.fill(roundRectPath(x, y, width, height, 24)); ctx.stroke(roundRectPath(x, y, width, height, 24));
    ctx.strokeStyle = withAlpha(PALETTE.ui.panelHighlight, 0.65); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 26, y + 1); ctx.lineTo(x + width - 26, y + 1); ctx.stroke(); ctx.restore();
  };
  panel(layout.score.x, layout.score.y + 12, 240, 520);
  panel(layout.tray.x, layout.tray.y, layout.tray.width, layout.tray.height);
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
    if (count) { const label = S.extraPopCount(count); ctx.font = `800 ${Math.max(14, c * 0.36)}px "Baloo 2", sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = PALETTE.fx.numberOutline; ctx.fillStyle = PALETTE.ui.textPrimary; ctx.strokeText(label, totalX / count, totalY / count); ctx.fillText(label, totalX / count, totalY / count); }
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
