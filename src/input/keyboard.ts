// SG §8.3: keyboard selection, arrow-stepped ghost, Space/Enter place and Esc cancel.
import { canPlace } from '../core/game';
import { PIECES } from '../core/pieces';
import type { GameState } from '../core/types';
import type { BoardView, DragView } from '../render/boardView';
import type { Layout } from '../render/layout';

export function attachKeyboard(view: BoardView, layout: () => Layout, state: () => GameState, place: (slot: number, row: number, col: number) => void, cancel: () => void, pause: () => void): { drag: () => DragView | undefined } {
  let slot = -1; let row = 0; let col = 0; let x = 0; let y = 0;
  const onKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') { cancel(); slot = -1; pause(); return; }
    if (event.key === '1' || event.key === '2' || event.key === '3') { slot = Number(event.key) - 1; findCenter(); event.preventDefault(); return; }
    if (slot < 0) return;
    if (event.key === 'ArrowLeft') col -= 1; else if (event.key === 'ArrowRight') col += 1; else if (event.key === 'ArrowUp') row -= 1; else if (event.key === 'ArrowDown') row += 1;
    else if (event.key === ' ' || event.key === 'Enter') { if (canPlace(state(), slot, row, col)) place(slot, row, col); slot = -1; event.preventDefault(); return; }
    else return;
    const piece = state().tray[slot]; const def = piece && PIECES[piece.defId]; row = Math.max(0, Math.min(8 - (def?.h ?? 1), row)); col = Math.max(0, Math.min(8 - (def?.w ?? 1), col)); updateXY(); event.preventDefault();
  };
  window.addEventListener('keydown', onKey);
  return { drag: () => slot < 0 ? undefined : { slot, x, y, pointerType: 'keyboard', selected: true, row, col } };
  function findCenter(): void { const piece = state().tray[slot]; if (!piece) { slot = -1; return; } const def = PIECES[piece.defId]!; let found: [number, number] | undefined;
    for (let distance = 0; distance < 8 && !found; distance += 1) for (let r = 0; r <= 8 - def.h && !found; r += 1) for (let c = 0; c <= 8 - def.w; c += 1) if (Math.abs(r + def.h / 2 - 4) + Math.abs(c + def.w / 2 - 4) <= distance && canPlace(state(), slot, r, c)) { found = [r, c]; break; }
    row = found?.[0] ?? 0; col = found?.[1] ?? 0; updateXY(); }
  function updateXY(): void { const l = layout(); const c = l.cellSize; x = l.board.x + (l.board.width - c * 8) / 2 + col * c; y = l.board.y + (l.board.height - c * 8) / 2 + row * c; }
}
