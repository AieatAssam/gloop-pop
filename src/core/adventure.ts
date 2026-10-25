import { dealTray } from './generator';
import { levelParams, type LevelDef } from './levels';
import { seededRng } from './rng';
import { components } from './gloops';
import { step as classicStep, fitsAnywhere } from './game';
import { weightsForStage } from './stages';
import type { Action, GameEvent, GameState, Flavour } from './types';

type AdventureOptions = { bonusMoves: number; boosters: { shuffle: number; pop: number }; freeShuffle: boolean };

export function newAdventureGame(def: LevelDef, options: AdventureOptions): { state: GameState; events: GameEvent[] } {
  const params = levelParams(def.n);
  const seed = `gloop-pop/adventure/v1/${def.n}/${def.s}`;
  const rng = seededRng(`${seed}/trays`);
  const board = Array.from(def.board, Number);
  const dealt = dealTray(board, rng, params.stage, dealOptions(params.stage, params.flavours, params.f2));
  const state: GameState = {
    v: 1, mode: 'adventure', seed, rng, board, tray: dealt.tray, traysDealt: 1,
    score: 0, combo: 0, fuse: 0, bestCombo: 0, stage: params.stage, linesCleared: 0,
    rescue: { charge: 0, ready: false, used: false }, status: 'playing', moves: 0,
    stats: { placements: 0, pops: 0, biggestPop: 0, allClears: 0, bigPops: 0, hugePops: 0, megaPops: 0, multiClears: 0, solverTimeMs: 0, f2Fallbacks: 0 },
    adventure: {
      level: def.n, moveLimit: def.moves, bonusMoves: options.bonusMoves,
      movesLeft: def.moves + options.bonusMoves,
      goals: def.goals.map((goal) => ({ ...goal, progress: 0 })), s2: def.s2, s3: def.s3,
      stage: params.stage, flavours: params.flavours, f2: params.f2,
      boosters: { shuffle: options.boosters.shuffle > 0 || options.freeShuffle ? 'armed' : 'none', pop: options.boosters.pop > 0 ? 'armed' : 'none', freeShuffle: options.freeShuffle },
      result: null,
    },
  };
  return { state, events: [{ type: 'dealt', tray: dealt.tray }] };
}

/** Adventure placement, booster, and result rules from design §24.4–24.5. */
export function stepAdventure(state: GameState, action: Action): { state: GameState; events: GameEvent[] } {
  const adventure = state.adventure;
  if (!adventure || adventure.result || state.status !== 'playing') return { state, events: [] };

  if (action.type === 'endRun') return lose(cloneState(state), 'gaveUp');
  if (action.type === 'booster') return useBooster(state, action.id);
  if (action.type !== 'place') return { state, events: [] };

  const classicState: GameState = { ...state, mode: 'classic', adventure: undefined, tray: state.tray.map((piece) => piece ? { ...piece } : null) };
  const reservedSlot = classicState.tray.every((piece, slot) => piece === null || slot === action.slot)
    ? classicState.tray.findIndex((piece, slot) => piece === null && slot !== action.slot)
    : -1;
  // Keep classicStep from making a Classic deal when the last Adventure tray piece is used.
  if (reservedSlot >= 0) classicState.tray[reservedSlot] = { defId: 0, flavour: 1 };
  const placed = classicStep(classicState, action);
  if (placed.state.moves === state.moves) return { state, events: [] };
  const next = cloneState(state);
  Object.assign(next, placed.state, { mode: 'adventure' });
  if (reservedSlot >= 0) next.tray[reservedSlot] = null;
  next.adventure = { ...adventure, goals: adventure.goals.map((goal) => ({ ...goal })), boosters: { ...adventure.boosters }, movesLeft: adventure.movesLeft - 1, result: null };
  next.rescue = { charge: 0, ready: false, used: false };
  const events = placed.events.filter((event) => event.type !== 'stageUp' && event.type !== 'rescueOffered' && event.type !== 'rescueReady');
  advanceGoals(next, events);

  // The order is intentional: a goal win takes priority over exhausted moves, dealing, and stuck.
  if (next.adventure.goals.every((goal) => goal.progress >= goal.target)) return win(next, events);
  if (next.adventure.movesLeft === 0) return lose(next, 'moves', events);
  if (next.tray.every((piece) => piece === null)) {
    const dealt = dealTray(next.board, next.rng, adventure.stage, dealOptions(adventure.stage, adventure.flavours, adventure.f2));
    next.tray = dealt.tray;
    next.traysDealt += 1;
    events.push({ type: 'dealt', tray: dealt.tray });
  }
  if (next.tray.filter((piece) => piece !== null).every((piece) => !fitsAnywhere(next.board, piece.defId))) return lose(next, 'stuck', events);
  return { state: next, events };
}

function advanceGoals(state: GameState, events: GameEvent[]): void {
  const adventure = state.adventure;
  if (!adventure) return;
  const cleared = events.find((event): event is Extract<GameEvent, { type: 'cleared' }> => event.type === 'cleared');
  const popped = events.find((event): event is Extract<GameEvent, { type: 'popped' }> => event.type === 'popped');
  const cubes = events.find((event): event is Extract<GameEvent, { type: 'cubes' }> => event.type === 'cubes');
  const lineCount = (cleared?.rows.length ?? 0) + (cleared?.cols.length ?? 0);
  const score = events.find((event): event is Extract<GameEvent, { type: 'scored' }> => event.type === 'scored')?.points ?? 0;
  for (const [index, goal] of adventure.goals.entries()) {
    let delta = 0;
    if (goal.kind === 'L') delta = lineCount;
    if (goal.kind === 'S') delta = score;
    if (goal.kind === 'F' && goal.flavour !== undefined) {
      delta = (cleared?.flavoursByCell.filter((flavour) => flavour === goal.flavour).length ?? 0)
        + (popped?.gloops.filter((gloop) => gloop.flavour === goal.flavour).reduce((total, gloop) => total + gloop.cells.filter((cell) => !cleared?.cells.includes(cell)).length, 0) ?? 0);
    }
    if (goal.kind === 'B') delta = popped?.gloops.filter((gloop) => gloop.size >= 8).length ?? 0;
    if (goal.kind === 'M' && lineCount >= 2) delta = 1;
    if (goal.kind === 'C') delta = cubes?.removed.length ?? 0;
    goal.progress = Math.min(goal.target, goal.progress + delta);
    events.push({ type: 'goalProgress', index, progress: goal.progress, target: goal.target });
  }
}

function win(state: GameState, events: GameEvent[]): { state: GameState; events: GameEvent[] } {
  const adventure = state.adventure!;
  const effectiveMoves = Math.max(0, adventure.movesLeft - adventure.bonusMoves);
  const stars = effectiveMoves >= adventure.s3 ? 3 : effectiveMoves >= adventure.s2 ? 2 : 1;
  adventure.result = { won: true, reason: 'goals', movesLeft: adventure.movesLeft, stars };
  state.status = 'over';
  events.push({ type: 'levelWon', level: adventure.level, movesLeft: adventure.movesLeft, stars });
  return { state, events };
}

function lose(state: GameState, reason: 'moves' | 'stuck' | 'gaveUp', events: GameEvent[] = []): { state: GameState; events: GameEvent[] } {
  const adventure = state.adventure!;
  adventure.result = { won: false, reason, movesLeft: adventure.movesLeft, stars: 0 };
  state.status = 'over';
  events.push({ type: 'levelLost', level: adventure.level, reason });
  return { state, events };
}

function useBooster(state: GameState, id: 'shuffle' | 'pop'): { state: GameState; events: GameEvent[] } {
  const adventure = state.adventure!;
  if (adventure.boosters[id] !== 'armed') return { state, events: [] };
  const next = cloneState(state);
  const nextAdventure = next.adventure!;
  if (id === 'shuffle') {
    const dealt = dealTray(next.board, next.rng, adventure.stage, dealOptions(adventure.stage, adventure.flavours, 1));
    next.tray = dealt.tray;
    nextAdventure.boosters.shuffle = 'used';
    return { state: next, events: [{ type: 'dealt', tray: dealt.tray }, { type: 'boosterUsed', id }] };
  }
  const largest = components(next.board).sort((a, b) => b.cells.length - a.cells.length || (a.cells[0] ?? 64) - (b.cells[0] ?? 64))[0];
  if (!largest) return { state, events: [] };
  for (const cell of largest.cells) next.board[cell] = 0;
  nextAdventure.boosters.pop = 'used';
  return { state: next, events: [{ type: 'rescued', poppedCells: [...largest.cells] }, { type: 'boosterUsed', id, poppedCells: [...largest.cells] }] };
}

function dealOptions(stage: number, flavourCount: number, f2: number) {
  const flavours = Array.from({ length: flavourCount }, (_, index) => (index + 1) as Flavour);
  return { weights: Object.values(weightsForStage(stage)), flavours, f2 };
}

function cloneState(state: GameState): GameState {
  return { ...state, board: [...state.board], tray: state.tray.map((piece) => piece ? { ...piece } : null), rng: { ...state.rng }, rescue: { ...state.rescue }, stats: { ...state.stats }, adventure: state.adventure ? { ...state.adventure, goals: state.adventure.goals.map((goal) => ({ ...goal })), boosters: { ...state.adventure.boosters }, result: state.adventure.result ? { ...state.adventure.result } : null } : undefined };
}
