// M3.1: session state can restore a JSON-safe run and reports each reducer result for persistence.
import { newGame, step } from '../core/game';
import type { Action, GameEvent, GameState, ModeId } from '../core/types';
import { dayKeyFromMs } from '../core/daily';

export interface Session { readonly state: GameState; readonly best: number; dispatch(action: Action): GameEvent[]; replace(state: GameState): void; restart(mode?: ModeId): void; }
export function createSession(options: { state?: GameState | null; best?: number; mode?: ModeId } = {}): Session {
  let mode = options.state?.mode ?? options.mode ?? 'classic';
  let result = options.state ? { state: options.state, events: [] as GameEvent[] } : newGame(mode, seed(mode));
  let state = result.state; const best = options.best ?? 0;
  return {
    get state() { return state; }, get best() { return best; },
    dispatch(action) { const next = step(state, action); state = next.state; return next.events; },
    replace(nextState) { state = nextState; mode = nextState.mode; },
    restart(nextMode = mode) { mode = nextMode; result = newGame(mode, seed(mode, state.moves + state.score)); state = result.state; },
  };
}
function seed(mode: ModeId, salt = 0): string { return mode === 'daily' ? `gloop-pop/daily/v1/${dayKeyFromMs(Date.now())}` : `gloop-pop/${mode}/session-${salt}`; }
