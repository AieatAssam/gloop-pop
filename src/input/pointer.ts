// SG §8.2–8.4: touch, mouse drag and click-click with forgiving placement snap.
import { canPlace } from '../core/game';
import { PIECES } from '../core/pieces';
import type { GameState } from '../core/types';
import type { BoardView, DragView, ReturnView } from '../render/boardView';
import type { Layout } from '../render/layout';
import { createHeldPiece, resetHeldPiece, updateHeldPiece, type HeldPieceState } from '../render/heldPiece';

export interface PointerInput { drag: DragView | undefined; returning: ReturnView | undefined; snapChanged: boolean; placementOrigin: { x: number; y: number } | undefined; pointerMove(x: number, y: number, pointerType: string): void; pointerDown(x: number, y: number, pointerType: string): void; pointerUp(x: number, y: number, pointerType: string): void; advance(realDtMs: number, reduced: boolean): void; cancel(): void }
export interface PointerCanvasRect { left: number; top: number; width: number; height: number }
export function snapVelocityAllowed(speedCellsPerSecond: number): boolean { return Number.isFinite(speedCellsPerSecond) && speedCellsPerSecond <= 8; }
export function fingerBoardOrigin(x: number, y: number, pointerType: string, width: number, height: number, cellSize: number): { x: number; y: number } {
  return { x: x - width * cellSize / 2, y: pointerType === 'touch' ? y - height * cellSize - cellSize * 1.1 : y - height * cellSize / 2 };
}
export function pointerReleaseCell(x: number, y: number, pointerType: string, width: number, height: number, layout: Layout): { row: number; col: number; x: number; y: number } {
  const origin = fingerBoardOrigin(x, y, pointerType, width, height, layout.cellSize);
  const gx = layout.board.x + (layout.board.width - layout.cellSize * 8) / 2; const gy = layout.board.y + (layout.board.height - layout.cellSize * 8) / 2;
  return { row: Math.round((origin.y - gy) / layout.cellSize), col: Math.round((origin.x - gx) / layout.cellSize), x: origin.x, y: origin.y };
}
// spec-note: The debug contract has no pointer type, so its drop point targets the mouse-centred anchor used by browser automation. Touch retains its higher finger offset through pointerReleaseCell.
export function pointerDropPoint(row: number, col: number, width: number, height: number, layout: Layout, rect: PointerCanvasRect): { x: number; y: number } {
  const gx = layout.board.x + (layout.board.width - layout.cellSize * 8) / 2; const gy = layout.board.y + (layout.board.height - layout.cellSize * 8) / 2;
  const localX = gx + col * layout.cellSize + width * layout.cellSize / 2; const localY = gy + row * layout.cellSize + height * layout.cellSize / 2;
  return { x: rect.left + localX * rect.width / layout.width, y: rect.top + localY * rect.height / layout.height };
}
export function createPointerInput(view: BoardView, getLayout: () => Layout, getState: () => GameState, place: (slot: number, row: number, col: number) => void): PointerInput {
  type DragModel = DragView & { held: HeldPieceState };
  const dragBuffer: DragModel = { slot: 0, x: 0, y: 0, pointerType: 'mouse', selected: false, held: createHeldPiece(0, 0) };
  let drag: DragModel | undefined; let clickSelected = -1;
  let returning: (ReturnView & { startX: number; startY: number; targetX: number; targetY: number; elapsed: number; startScale: number; endScale: number; cell: number }) | undefined;
  let snapChanged = false;
  let placementOrigin: { x: number; y: number } | undefined;
  return {
    get placementOrigin() { return placementOrigin; }, set placementOrigin(value) { placementOrigin = value; },
    get drag() { return drag; },
    get returning() { return returning; },
    get snapChanged() { return snapChanged; },
    pointerMove(x, y, type) { if (drag) { drag.x = x; drag.y = y; drag.pointerType = type; } else if (clickSelected >= 0) { drag = dragBuffer; drag.slot = clickSelected; drag.x = x; drag.y = y; drag.pointerType = type; drag.selected = true; initializeHeld(); } },
    pointerDown(x, y, type) {
      const state = getState(); const slot = view.slotAt(x, y, getLayout(), state);
      if (slot >= 0) { drag = dragBuffer; drag.slot = slot; drag.x = x; drag.y = y; drag.pointerType = type; drag.selected = false; initializeHeld(); clickSelected = -1; return; }
      if (drag?.selected) { this.pointerUp(x, y, type); return; }
      const cell = view.cellAt(x, y, getLayout());
      if (clickSelected >= 0 && cell) tryPlace(clickSelected, cell.row, cell.col);
    },
    pointerUp(x, y, type) {
      if (!drag) return; const released = drag; const slot = released.slot; const selected = released.selected; drag = undefined;
      const layout = getLayout(); const state = getState(); const piece = state.tray[slot]; if (!piece) return;
      const def = PIECES[piece.defId]!; const c = layout.cellSize; const gx = layout.board.x + (layout.board.width - c * 8) / 2; const gy = layout.board.y + (layout.board.height - c * 8) / 2;
      const target = pointerReleaseCell(x, y, type, def.w, def.h, layout); const px = target.x; const py = target.y;
      const { row, col } = target;
      const best = nearestSnap(state, slot, px, py, gx, gy, c, row, col); let placed = false;
      if (best) { pointerOrigin(released, def.w, def.h, c); placed = tryPlace(slot, best.row, best.col); clickSelected = -1; }
      else if (selected && view.cellAt(x, y, layout)) { const cell = view.cellAt(x, y, layout)!; placed = tryPlace(slot, cell.row, cell.col); }
      else clickSelected = selected ? slot : -1;
      if (!placed && !selected) startReturn(released, layout, state);
    },
    advance(realDtMs, reduced) {
      snapChanged = false;
      if (returning) { returning.elapsed += realDtMs; const t = Math.min(1, returning.elapsed / 180); const eased = 1 - (1 - t) ** 3; returning.x = returning.startX + (returning.targetX - returning.startX) * eased; returning.y = returning.startY + (returning.targetY - returning.startY) * eased - Math.sin(Math.PI * t) * returning.cell * 0.6; returning.scale = returning.startScale + (returning.endScale - returning.startScale) * eased; returning.alpha = 1; returning.lift = 1 - t; if (t >= 1) returning = undefined; }
      if (!drag?.held) return;
      drag.reducedMotion = reduced;
      const layout = getLayout(); const piece = getState().tray[drag.slot]; if (!piece) return;
      const def = PIECES[piece.defId]!; const target = fingerBoardOrigin(drag.x, drag.y, drag.pointerType, def.w, def.h, layout.cellSize);
      const c = layout.cellSize; const gx = layout.board.x + (layout.board.width - c * 8) / 2; const gy = layout.board.y + (layout.board.height - c * 8) / 2;
      const baseCol = Math.round((target.x - gx) / c); const baseRow = Math.round((target.y - gy) / c);
      const snap = nearestSnap(getState(), drag.slot, target.x, target.y, gx, gy, c, baseRow, baseCol);
      let magnetX = 0; let magnetY = 0;
      if (snap && !reduced) { magnetX = clamp((gx + snap.col * c - target.x) * 0.15, c * -0.12, c * 0.12); magnetY = clamp((gy + snap.row * c - target.y) * 0.15, c * -0.12, c * 0.12); }
      const valid = snap !== undefined;
      if (drag.ghostValid !== valid) { drag.ghostTargetAlpha = valid ? 0.32 : 0; drag.ghostFadeLeft = valid ? 80 : 60; drag.ghostValid = valid; }
      const fadeLeft = drag.ghostFadeLeft ?? 0; const ghostAlpha = drag.ghostAlpha ?? 0;
      if (fadeLeft > 0) { const step = Math.min(fadeLeft, realDtMs); drag.ghostAlpha = ghostAlpha + ((drag.ghostTargetAlpha ?? 0) - ghostAlpha) * step / fadeLeft; drag.ghostFadeLeft = fadeLeft - step; }
      if (snap && (drag.row !== snap.row || drag.col !== snap.col)) {
        const hadTarget = drag.row !== undefined && drag.col !== undefined; drag.ghostScale = reduced ? 1 : hadTarget ? 1.06 : 0.92; drag.ghostRow = snap.row; drag.ghostCol = snap.col;
        if (hadTarget && !reduced && drag.held) { drag.held.x.v += Math.sign(magnetX) * c * 0.02; drag.held.y.v += Math.sign(magnetY) * c * 0.02; }
        snapChanged = hadTarget && snapVelocityAllowed(Math.hypot(drag.held.velocityX, drag.held.velocityY));
      } else if (drag.ghostScale !== undefined) drag.ghostScale = 1 + (drag.ghostScale - 1) * Math.max(0, 1 - realDtMs / 90);
      drag.row = snap?.row; drag.col = snap?.col;
      const followRate = drag.selected ? 12 : 7; const damping = drag.selected ? 0.8 : 0.75;
      const transform = updateHeldPiece(drag.held, target.x, target.y, realDtMs, c, reduced, target.x + magnetX, target.y + magnetY, followRate, damping, layout.trayCellSize / c);
      drag.drawX = transform.x; drag.drawY = transform.y; drag.tilt = transform.tilt; drag.stretch = transform.stretch; drag.stretchAngle = transform.stretchAngle; drag.shear = transform.shear; drag.pickupScale = transform.pickupScale; drag.lift = transform.lift; drag.grabSx = transform.grabSx; drag.grabSy = transform.grabSy;
    },
    cancel() { drag = undefined; returning = undefined; clickSelected = -1; },
  };
  function initializeHeld(): void {
    if (!drag) return; const layout = getLayout(); const piece = getState().tray[drag.slot]; if (!piece) return;
    const def = PIECES[piece.defId]!; const c = layout.cellSize; const originX = drag.x - def.w * c / 2; const originY = drag.pointerType === 'touch' ? drag.y - def.h * c - c * 1.1 : drag.y - def.h * c / 2;
    resetHeldPiece(drag.held, originX, originY);
    drag.row = undefined; drag.col = undefined; drag.ghostRow = undefined; drag.ghostCol = undefined;
    drag.drawX = originX; drag.drawY = originY; drag.pickupScale = 0.6; drag.lift = 0; drag.grabSx = 1.12; drag.grabSy = 1 / 1.12; drag.ghostAlpha = 0; drag.ghostTargetAlpha = 0; drag.ghostFadeLeft = 0; drag.ghostValid = false; drag.ghostScale = 1;
  }
  function pointerOrigin(released: DragModel, width: number, height: number, cell: number): void { const origin = fingerBoardOrigin(released.x, released.y, released.pointerType, width, height, cell); placementOrigin = { x: released.drawX ?? origin.x, y: released.drawY ?? origin.y }; }
  function nearestSnap(state: GameState, slot: number, px: number, py: number, gx: number, gy: number, c: number, row: number, col: number): { row: number; col: number; d: number } | undefined {
    let best: { row: number; col: number; d: number } | undefined;
    for (let dr = -1; dr <= 1; dr += 1) for (let dc = -1; dc <= 1; dc += 1) {
      const rr = row + dr; const cc = col + dc; const d = Math.hypot((px - (gx + cc * c)) / c, (py - (gy + rr * c)) / c);
      if (d <= 0.6 && canPlace(state, slot, rr, cc) && (!best || d < best.d)) best = { row: rr, col: cc, d };
    }
    return best;
  }
  function clamp(value: number, min: number, max: number): number { return Math.min(max, Math.max(min, value)); }
  function tryPlace(slot: number, row: number, col: number): boolean { if (!canPlace(getState(), slot, row, col)) return false; place(slot, row, col); return true; }
  function startReturn(released: DragModel, layout: Layout, state: GameState): void {
    const piece = state.tray[released.slot]; if (!piece) return; const def = PIECES[piece.defId]!; const from = fingerBoardOrigin(released.x, released.y, released.pointerType, def.w, def.h, layout.cellSize);
    const rect = trayRect(released.slot, layout); const cell = Math.min(layout.trayCellSize, rect.width / 5.4, rect.height / 5.4); const targetX = rect.x + (rect.width - def.w * cell) / 2; const targetY = rect.y + (rect.height - def.h * cell) / 2;
    returning = { slot: released.slot, defId: piece.defId, flavour: piece.flavour, x: released.drawX ?? from.x, y: released.drawY ?? from.y, alpha: 1, scale: released.pickupScale ?? 1, lift: released.lift ?? 1, startX: released.drawX ?? from.x, startY: released.drawY ?? from.y, targetX, targetY, elapsed: 0, startScale: released.pickupScale ?? 1, endScale: cell / layout.cellSize, cell: layout.cellSize };
  }
  function trayRect(index: number, layout: Layout): { x: number; y: number; width: number; height: number } {
    if (layout.portrait) { const width = Math.min(122 * layout.height / 844, layout.tray.width / 3 - 4); const gap = 8; const total = width * 3 + gap * 2; return { x: layout.tray.x + (layout.tray.width - total) / 2 + index * (width + gap), y: layout.tray.y + 4, width, height: Math.max(80, layout.tray.height - 8) }; }
    const width = layout.tray.width; const height = layout.tray.height / 3 - 8; return { x: layout.tray.x, y: layout.tray.y + index * (height + 12), width, height };
  }
}
