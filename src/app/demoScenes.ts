import type { GameState } from '../core/types';
import { step } from '../core/game';
import type { SaveV2 } from '../meta/saveSchema';
import { ACHIEVEMENTS } from '../meta/achievements';

export type FeelScene = 'combo' | 'mega' | 'mega-plain';
export type GoalScene = 'target' | 'target-hit' | 'mini-done';

/** Shared save changes for the player's Skip action and the debug tutorial shortcut. */
export function markTutorialSkipped(save: SaveV2): SaveV2 {
  const next = structuredClone(save);
  next.tutorialDone = true;
  next.ui.seenTips = next.ui.seenTips.filter((tip) => tip !== 'tutorialStep4Pending');
  return next;
}

export function debugSaveWritesDisabled(query: URLSearchParams, veteranDemo: boolean): boolean {
  return veteranDemo || (query.get('debug') === '1' && (query.has('demo') || query.has('level')));
}

/** Apply the normal tutorial skip save changes to a debug-only in-memory save. */
export function debugTutorialState(save: SaveV2, query: URLSearchParams): SaveV2 {
  if (query.get('debug') !== '1' || query.get('tutorial') === '1' || save.inProgress !== null || save.tutorialDone) return save;
  return markTutorialSkipped(save);
}

/** Seed only the Mega Plain capture save so its move has no new progression rewards. */
export function seedMegaPlainSave(save: SaveV2, query: URLSearchParams): SaveV2 {
  if (query.get('debug') !== '1' || query.get('demo') !== 'feel' || query.get('scene') !== 'mega-plain') return save;
  // spec-note: Seed every achievement and discovery plus level 50 only for this demo URL; debug demo saves are memory-only.
  const next = structuredClone(save);
  for (const achievement of ACHIEVEMENTS) next.achievements[achievement.id] = 1;
  next.firsts = { line: true, double: true, bigPop: true, hugePop: true, megaPop: true, allClear: true, combo5: true, combo10: true };
  next.profile.level = 50;
  return next;
}

/** Deterministic M12 capture scenes built from the current in-memory run. */
export function createGoalScene(state: GameState, scene: GoalScene): GameState {
  const next = structuredClone(state); next.mode = 'classic'; next.status = 'playing'; next.score = 4880; next.moves = 0; next.board = new Array<number>(64).fill(0);
  next.goals = { floor: 0, best: 0, targetsHit: 0, mini: { id: 'bigpop', target: 1, progress: 0, done: false } };
  for (let col = 0; col < 7; col += 1) next.board[7 * 8 + col] = 2;
  next.tray = [{ defId: 0, flavour: 2 }, { defId: 1, flavour: 3 }, { defId: 2, flavour: 4 }];
  if (scene === 'target-hit') {
    const hit = step(next, { type: 'place', slot: 0, row: 7, col: 7 });
    return hit.state;
  }
  if (scene === 'mini-done' && next.goals) next.goals.mini = { ...next.goals.mini, id: 'bigpop', progress: 1, done: true };
  return next;
}

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
    if (scene === 'mega-plain') {
      // spec-note: Keep the documented Mega capture drop unchanged while one isolated cell prevents an All Clear.
      next.board[63] = 1;
    }
  }
  return next;
}
