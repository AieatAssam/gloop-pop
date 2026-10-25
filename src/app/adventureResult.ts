import type { GameEvent, GameState, ModeId } from '../core/types';
import { S } from '../ui/strings';

export function adventureResultLabel(state: GameState): string | null {
  const adventure = state.adventure;
  if (!adventure?.result) return null;
  if (adventure.result.won) return S.levelComplete(adventure.level);
  if (adventure.result.reason === 'moves') return S.outOfMoves;
  if (adventure.result.reason === 'stuck') return S.noRoom;
  return S.levelEnded(adventure.level);
}

export function recordPendingAdventureResult(state: GameState, recorded: boolean, finish: () => void): void {
  if (state.adventure?.result && !recorded) finish();
}


export function qualifiesForRescueSave(mode: ModeId, events: readonly GameEvent[]): boolean {
  if (mode === 'adventure') return false;
  let rescueAt = -1; let placed = 0;
  for (const [index, event] of events.entries()) {
    if (event.type === 'rescued') { rescueAt = index; placed = 0; }
    else if (rescueAt >= 0 && event.type === 'placed') placed += 1;
    else if (rescueAt >= 0 && event.type === 'cleared' && placed > 0 && placed <= 3) return true;
  }
  return false;
}
