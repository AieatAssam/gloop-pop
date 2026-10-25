import type { GameState } from '../core/types';

export type FeelScene = 'combo' | 'mega';

/** Debug capture states only. Rows/columns are deliberately isolated for repeatable engine drops. */
export function createFeelScene(state: GameState, scene: FeelScene): GameState {
  const next = structuredClone(state);
  next.mode = 'classic'; next.board = new Array<number>(64).fill(0); next.status = 'playing'; next.moves = 0;
  next.combo = scene === 'combo' ? 3 : 11; next.bestCombo = next.combo; next.fuse = scene === 'combo' ? 3 : 2;
  if (scene === 'combo') {
    for (const row of [7, 5, 3]) for (let col = 0; col < 7; col += 1) next.board[row * 8 + col] = 2;
    next.tray = [{ defId: 0, flavour: 2 }, { defId: 0, flavour: 2 }, { defId: 0, flavour: 2 }];
  } else {
    // spec-note: The engine's documented Mega threshold is 24 cells; use 26 connected cells before placement, while keeping only the two target rows completeable.
    for (const col of [0, 1]) next.board[col] = 4;
    for (const col of [0, 1, 2, 4]) next.board[1 * 8 + col] = 4;
    for (const col of [0, 1, 2, 4, 5, 6, 7]) next.board[2 * 8 + col] = 4;
    for (const col of [0, 1, 2, 4, 5, 6, 7]) next.board[3 * 8 + col] = 4;
    for (const col of [3, 5, 6, 7]) next.board[4 * 8 + col] = 4;
    for (const col of [6, 7]) next.board[5 * 8 + col] = 4;
    next.tray = [{ defId: 2, flavour: 4 }, { defId: 0, flavour: 6 }, { defId: 0, flavour: 7 }];
  }
  return next;
}
