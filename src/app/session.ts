// M2.5: thin app session around the deterministic core reducer.
import { newGame, step } from '../core/game';
import type { Action, GameEvent, GameState } from '../core/types';

export interface Session { readonly state: GameState; readonly best: number; dispatch(action: Action): GameEvent[]; restart(): void }
export function createSession(): Session {
  let result = newGame('classic', 'gloop-pop/classic/session'); let state = result.state; let best = 0;
  return {
    get state() { return state; }, get best() { return best; },
    dispatch(action) { const next = step(state, action); state = next.state; best = Math.max(best, state.score); return next.events; },
    restart() { result = newGame('classic', `gloop-pop/classic/session-${state.moves}-${state.score}`); state = result.state; },
  };
}
