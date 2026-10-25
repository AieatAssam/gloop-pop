// M3.1: session state can restore a JSON-safe run and reports each reducer result for persistence.
import { newGame, step } from '../core/game';
import type { Action, GameEvent, GameState, ModeId } from '../core/types';
import { dayKeyFromMs } from '../core/daily';

export interface Session { readonly state: GameState; readonly best: number; dispatch(action: Action): GameEvent[]; replace(state: GameState): void; restart(mode?: ModeId): void; }
// spec-note: Daily state resumes only after an explicit Daily entry; general boot restores the regular run slot.
export function runToResumeOnBoot(inProgress: GameState | null): GameState | null {
  return inProgress?.mode === 'daily' ? null : inProgress;
}
export function createSession(options: { state?: GameState | null; best?: number; mode?: ModeId; goals?: boolean } = {}): Session {
  let mode = options.state?.mode ?? options.mode ?? 'classic';
  let result = options.state ? { state: options.state, events: [] as GameEvent[] } : newGame(mode, seed(mode), { best: options.best, goals: options.goals });
  let state = result.state; const best = options.best ?? 0;
  return {
    get state() { return state; }, get best() { return best; },
    dispatch(action) { const next = step(state, action); state = next.state; return next.events; },
    replace(nextState) { state = nextState; mode = nextState.mode; },
    restart(nextMode = mode) { mode = nextMode; result = newGame(mode, seed(mode), { best: options.best, goals: options.goals }); state = result.state; },
  };
}
function seed(mode: ModeId): string {
  if (mode === 'daily') return `gloop-pop/daily/v1/${dayKeyFromMs(Date.now())}`;
  // spec-note: Non-Daily runs use four crypto random words; GameState.seed persists the exact seed for deterministic resume.
  const words = new Uint32Array(4);
  globalThis.crypto.getRandomValues(words);
  return `gloop-pop/${mode}/${Array.from(words, (word) => word.toString(16).padStart(8, '0')).join('')}`;
}
