// SG §8.2–8.4: touch, mouse drag and click-click with forgiving placement snap.
import { canPlace } from '../core/game';
import { PIECES } from '../core/pieces';
import type { GameState } from '../core/types';
import type { BoardView, DragView } from '../render/boardView';
import type { Layout } from '../render/layout';

export interface PointerInput { drag: DragView | undefined; pointerMove(x: number, y: number, pointerType: string): void; pointerDown(x: number, y: number, pointerType: string): void; pointerUp(x: number, y: number, pointerType: string): void; cancel(): void }
export function createPointerInput(view: BoardView, getLayout: () => Layout, getState: () => GameState, place: (slot: number, row: number, col: number) => void): PointerInput {
  let drag: DragView | undefined; let clickSelected = -1;
  return {
    get drag() { return drag; },
    pointerMove(x, y, type) { if (drag) drag = { ...drag, x, y, pointerType: type }; else if (clickSelected >= 0) drag = { slot: clickSelected, x, y, pointerType: type, selected: true }; },
    pointerDown(x, y, type) {
      const state = getState(); const slot = view.slotAt(x, y, getLayout(), state);
      if (slot >= 0) { drag = { slot, x, y, pointerType: type, selected: false }; clickSelected = -1; return; }
      if (drag?.selected) { this.pointerUp(x, y, type); return; }
      const cell = view.cellAt(x, y, getLayout());
      if (clickSelected >= 0 && cell) tryPlace(clickSelected, cell.row, cell.col);
    },
    pointerUp(x, y, type) {
      if (!drag) return; const slot = drag.slot; const selected = drag.selected; drag = undefined;
      const layout = getLayout(); const state = getState(); const piece = state.tray[slot]; if (!piece) return;
      const def = PIECES[piece.defId]!; const c = layout.cellSize; const gx = layout.board.x + (layout.board.width - c * 8) / 2; const gy = layout.board.y + (layout.board.height - c * 8) / 2;
      const px = type === 'touch' ? x - def.w * c / 2 : x - def.w * c / 2;
      const py = type === 'touch' ? y - def.h * c - c * 1.1 : y - def.h * c / 2;
      const col = Math.round((px - gx) / c); const row = Math.round((py - gy) / c);
      let best: { row: number; col: number; d: number } | undefined;
      for (let dr = -1; dr <= 1; dr += 1) for (let dc = -1; dc <= 1; dc += 1) {
        const rr = row + dr; const cc = col + dc; const d = Math.hypot((px - (gx + cc * c)) / c, (py - (gy + rr * c)) / c);
        if (d <= 0.6 && canPlace(state, slot, rr, cc) && (!best || d < best.d)) best = { row: rr, col: cc, d };
      }
      if (best) { tryPlace(slot, best.row, best.col); clickSelected = -1; }
      else if (selected && view.cellAt(x, y, layout)) { const cell = view.cellAt(x, y, layout)!; tryPlace(slot, cell.row, cell.col); }
      else clickSelected = selected ? slot : -1;
    },
    cancel() { drag = undefined; clickSelected = -1; },
  };
  function tryPlace(slot: number, row: number, col: number): void { if (canPlace(getState(), slot, row, col)) place(slot, row, col); }
}
