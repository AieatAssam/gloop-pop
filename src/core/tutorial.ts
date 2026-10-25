import { cellIndex, makeBoard } from './board';
import { newGame } from './game';
import type { GameState, Piece } from './types';

export function tutorialGame(step: 1 | 2 | 3, seed = 'tutorial'): GameState {
  const { state } = newGame('tutorial', seed);
  state.board = [...makeBoard()]; state.mode = 'tutorial'; state.tray = [null, null, null]; state.traysDealt = step;
  if (step === 1) {
    set(state, 6, 0, 1); set(state, 6, 1, 1); set(state, 6, 2, 3); set(state, 6, 3, 3); set(state, 6, 4, 5); set(state, 6, 5, 5);
    state.tray[1] = { defId: 1, flavour: 4 };
  } else if (step === 2) {
    set(state, 0, 3, 2); set(state, 1, 3, 2); set(state, 2, 3, 5); set(state, 3, 3, 5); set(state, 4, 3, 1); set(state, 5, 3, 1);
    set(state, 7, 0, 3); set(state, 7, 1, 3); set(state, 7, 2, 3); set(state, 7, 4, 4); set(state, 7, 5, 4); set(state, 7, 6, 2); set(state, 7, 7, 2);
    state.tray[1] = { defId: 2, flavour: 1 }; state.score = 2102; state.combo = 1; state.fuse = 3; state.bestCombo = 1; state.linesCleared = 1; state.stage = 2;
  } else {
    for (const [row, col] of [[1,1],[1,2],[2,1],[2,2],[2,3],[3,1],[3,2],[3,3],[4,1],[4,2]]) set(state, row ?? 0, col ?? 0, 4);
    set(state, 4, 0, 1); set(state, 4, 3, 3); set(state, 4, 4, 5); set(state, 4, 5, 2);
    state.tray[1] = { defId: 1, flavour: 1 }; state.score = 5554; state.combo = 2; state.fuse = 3; state.bestCombo = 2; state.linesCleared = 3; state.stage = 3;
  }
  // spec-note: Tutorial step score captions omit All Clear, but each scripted board empties; apply design §5's 2,000-point award and carry it forward.
  return state;
}

export function tutorialTray(state: GameState): Piece[] {
  return state.tray.filter((piece): piece is Piece => piece !== null);
}
function set(state: GameState, row: number, col: number, flavour: number): void { state.board[cellIndex(row, col)] = flavour; }
