import { cellIndex, fits, makeBoard, place } from './board';
import { advanceCombo } from './combo';
import { createDailyDeal, dayNumber, seedStringForDay } from './daily';
import { dealTray } from './generator';
import { components } from './gloops';
import { modeConfig } from './modes';
import { PLACEMENTS, PIECES } from './pieces';
import { resolveBoard } from './resolve';
import { scoreMove } from './scoring';
import { createRng, sfc32 } from './rng';
import type { Action, GameEvent, GameState, ModeId, Piece, Preview, RngState } from './types';

export function newGame(cfg: ModeId | ReturnType<typeof modeConfig>, seed: string, opts: { tutorialStep?: number } = {}): { state: GameState; events: GameEvent[] } {
  void opts.tutorialStep;
  const config = typeof cfg === 'string' ? modeConfig(cfg) : cfg;
  const rng = createRng(seed); for (let i = 0; i < 12; i += 1) sfc32(rng);
  const state: GameState = {
    v: 1, mode: config.id, seed, rng, board: [...makeBoard()], tray: [null, null, null], traysDealt: 0,
    score: 0, combo: 0, fuse: 0, bestCombo: 0, stage: config.stageForScore(0), linesCleared: 0,
    rescue: { charge: 0, ready: false, used: false }, status: 'playing', moves: 0,
    stats: { placements: 0, pops: 0, biggestPop: 0, allClears: 0, bigPops: 0, hugePops: 0, megaPops: 0, multiClears: 0, solverTimeMs: 0, f2Fallbacks: 0 },
  };
  if (config.id === 'daily') {
    const dayKey = seed.startsWith('gloop-pop/daily/v1/') ? seed.slice('gloop-pop/daily/v1/'.length) : seed;
    const dailyDeal = createDailyDeal(dayKey);
    state.seed = seed.startsWith('gloop-pop/daily/v1/') ? seed : seedStringForDay(dayKey);
    state.daily = { dayNumber: dayNumber(dayKey), dayKey, flavourOfDay: dailyDeal.flavourOfDay, trays: dailyDeal.trays, trayLines: [], traySpecial: [] };
    state.board = dailyDeal.board;
    state.tray = dailyDeal.trays[0]?.map((piece) => ({ ...piece })) ?? [null, null, null]; state.traysDealt = 1;
    return { state, events: [{ type: 'dealt', tray: state.tray.filter((piece): piece is Piece => piece !== null) }] };
  }
  const dealt = dealTray(state.board, rng, state.stage, { mode: config.id === 'tutorial' ? 'classic' : config.id, forceSolvable: config.id === 'zen' });
  state.rng = rng; state.tray = dealt.tray; state.traysDealt = 1; state.stats.f2Fallbacks += dealt.debug.fallbackUsed ? 1 : 0;
  return { state, events: [{ type: 'dealt', tray: dealt.tray }] };
}

export function step(state: GameState, action: Action): { state: GameState; events: GameEvent[] } {
  if (action.type === 'endRun') {
    if ((state.mode !== 'zen' && state.mode !== 'daily') || state.status !== 'playing') return { state, events: [] };
    return { state: { ...state, status: 'over' }, events: [{ type: 'gameOver', reason: 'endRun' }] };
  }
  if (action.type === 'declineRescue') {
    if (state.status !== 'rescueOffer') return { state, events: [] };
    return { state: { ...state, status: 'over' }, events: [{ type: 'gameOver', reason: 'stuck' }] };
  }
  if (action.type === 'useRescue') return useRescue(state);
  if (state.status !== 'playing' || !canPlace(state, action.slot, action.row, action.col)) return { state, events: [] };

  const piece = state.tray[action.slot]; if (!piece) return { state, events: [] };
  const def = PIECES[piece.defId]; if (!def) return { state, events: [] };
  const placedBoard = place(state.board, def, action.row, action.col, piece.flavour); if (!placedBoard) return { state, events: [] };
  const cells = def.cells.map(([dr, dc]) => cellIndex(action.row + dr, action.col + dc));
  const mergedInto = components(state.board).filter((group) => group.flavour === piece.flavour && group.cells.some((index) => cells.some((cell) => areNeighbours(index, cell)))).flatMap((group) => group.cells);
  const events: GameEvent[] = [{ type: 'placed', slot: action.slot, piece, cells, mergedInto: [...new Set(mergedInto)] }];
  const next: GameState = { ...state, rng: { ...state.rng }, rescue: { ...state.rescue }, board: [...placedBoard], tray: [...state.tray], moves: state.moves + 1, stats: { ...state.stats, placements: state.stats.placements + 1 } };
  next.tray[action.slot] = null;
  for (const group of components(placedBoard)) if (group.cells.length >= 12 && group.cells.some((index) => cells.includes(index))) events.push({ type: 'bigGloop', size: group.cells.length });

  const resolved = resolveBoard(placedBoard);
  // design §16.2: tutorial steps 1–3 empty their scripted boards on purpose; they never award All Clear.
  if (state.mode === 'tutorial') resolved.allClear = false;
  if (resolved.cells.length > 0) events.push({ type: 'cleared', rows: resolved.rows, cols: resolved.cols, cells: resolved.cells, flavoursByCell: resolved.cells.map((index) => placedBoard[index] ?? 0) });
  if (resolved.popped.length > 0) events.push({ type: 'popped', gloops: resolved.popped });
  const comboResult = advanceCombo(next, resolved.rows.length + resolved.cols.length);
  const scored = scoreMove({
    placedCells: def.cells.length, lines: resolved.rows.length + resolved.cols.length,
    popped: resolved.popped.map((gloop) => ({ flavour: gloop.flavour, size: gloop.size, extraCells: gloop.cells.filter((index) => !resolved.cells.includes(index)) })),
    combo: comboResult.state.combo, allClear: resolved.allClear, flavourOfDay: next.daily?.flavourOfDay,
  });
  next.board = [...resolved.board]; next.combo = comboResult.state.combo; next.fuse = comboResult.state.fuse; next.bestCombo = comboResult.state.bestCombo;
  next.score += scored.points; next.linesCleared += resolved.rows.length + resolved.cols.length;
  next.stats.pops += resolved.poppedCells.length; next.stats.biggestPop = Math.max(next.stats.biggestPop, ...resolved.popped.map((gloop) => gloop.size), 0);
  next.stats.allClears += resolved.allClear ? 1 : 0; next.stats.multiClears += (resolved.rows.length + resolved.cols.length) >= 2 ? 1 : 0;
  next.stats.bigPops += resolved.popped.filter((gloop) => gloop.size >= 8).length;
  next.stats.hugePops += resolved.popped.filter((gloop) => gloop.size >= 15).length;
  next.stats.megaPops += resolved.popped.filter((gloop) => gloop.size >= 24).length;
  events.push({ type: 'scored', points: scored.points, parts: scored.parts, combo: next.combo, mult: scored.mult });
  events.push(...comboResult.events);
  if (resolved.allClear) events.push({ type: 'allClear' });

  const config = modeConfig(next.mode); const oldStage = next.stage; next.stage = Math.max(oldStage, config.stageForScore(next.score));
  if (next.stage > oldStage) events.push({ type: 'stageUp', stage: next.stage, ...(next.stage === 3 ? { newFlavour: 6 as const } : next.stage === 5 ? { newFlavour: 7 as const } : {}) });
  if (config.rescue) {
    next.rescue.charge = Math.min(10, next.rescue.charge + resolved.rows.length + resolved.cols.length);
    next.rescue.ready = next.rescue.charge >= 10 && !next.rescue.used;
    if (!state.rescue.ready && next.rescue.ready) events.push({ type: 'rescueReady' });
  }
  if (next.tray.every((item) => item === null)) {
    if (next.mode === 'daily' && next.traysDealt >= 30) {
      next.status = 'over'; events.push({ type: 'gameOver', reason: 'traysDone' });
      return { state: next, events };
    }
    if (next.mode === 'daily' && next.daily) {
      next.tray = next.daily.trays[next.traysDealt]?.map((item) => ({ ...item })) ?? [null, null, null]; next.traysDealt += 1;
    } else {
      const deal = dealTray(next.board, next.rng, next.stage, { mode: next.mode === 'tutorial' ? 'classic' : next.mode });
      next.tray = deal.tray; next.traysDealt += 1; next.stats.f2Fallbacks += deal.debug.fallbackUsed ? 1 : 0;
    }
    events.push({ type: 'dealt', tray: next.tray.filter((item): item is Piece => item !== null) });
  }
  const unfit = next.tray.map((item) => item && !fitsAnywhere(next.board, item.defId) ? item.defId : -1).filter((id) => id >= 0);
  if (unfit.length > 0 && unfit.length === next.tray.filter((item) => item !== null).length) {
    events.push({ type: 'stuck', unfit });
    if (next.mode === 'zen') {
      const largest = components(next.board).sort((a, b) => b.cells.length - a.cells.length || (a.cells[0] ?? 64) - (b.cells[0] ?? 64)).slice(0, 2);
      const poppedCells = largest.flatMap((gloop) => gloop.cells); const board = makeBoard(next.board); for (const cell of poppedCells) board[cell] = 0;
      next.board = [...board]; next.combo = 0; next.fuse = 0;
      const deal = dealTray(next.board, next.rng, next.stage, { mode: 'zen', forceSolvable: true }); next.tray = deal.tray; next.stats.f2Fallbacks += deal.debug.fallbackUsed ? 1 : 0;
      events.push({ type: 'zenShake', poppedCells }, { type: 'dealt', tray: deal.tray });
    } else if (next.mode === 'classic' && next.rescue.ready && !next.rescue.used) {
      next.status = 'rescueOffer'; events.push({ type: 'rescueOffered' });
    } else {
      next.status = 'over'; events.push({ type: 'gameOver', reason: 'stuck' });
    }
  }
  return { state: next, events };
}

export function canPlace(state: GameState, slot: number, row: number, col: number): boolean {
  if (slot < 0 || slot > 2 || !Number.isInteger(slot)) return false;
  const piece = state.tray[slot]; const def = piece && PIECES[piece.defId];
  return Boolean(state.status === 'playing' && def && fits(state.board, def, row, col));
}

export function previewPlacement(state: GameState, slot: number, row: number, col: number): Preview | null {
  if (!canPlace(state, slot, row, col)) return null;
  const piece = state.tray[slot]!; const def = PIECES[piece.defId]!; const placed = place(state.board, def, row, col, piece.flavour)!;
  const result = resolveBoard(placed);
  const mergeTargets = components(state.board).filter((gloop) => gloop.flavour === piece.flavour && gloop.cells.some((index) => def.cells.some(([dr, dc]) => areNeighbours(index, cellIndex(row + dr, col + dc)))))
    .map((gloop) => gloop.cells);
  return { rows: result.rows, cols: result.cols, popping: result.popped.map((gloop) => gloop.cells), mergeTargets };
}

export function fitsAnywhere(board: ArrayLike<number>, defId: number): boolean {
  return (PLACEMENTS[defId] ?? []).some((placement) => {
    const row = Math.floor(placement.pos / 8); const col = placement.pos % 8; const def = PIECES[defId];
    return Boolean(def && fits(board, def, row, col));
  });
}

function useRescue(state: GameState): { state: GameState; events: GameEvent[] } {
  if (state.status !== 'rescueOffer' || state.mode !== 'classic' || !state.rescue.ready || state.rescue.used) return { state, events: [] };
  const largest = components(state.board).sort((a, b) => b.cells.length - a.cells.length || (a.cells[0] ?? 64) - (b.cells[0] ?? 64))[0];
  const board = makeBoard(state.board); if (largest) for (const cell of largest.cells) board[cell] = 0;
  const rng: RngState = { ...state.rng };
  const deal = dealTray(board, rng, state.stage, { mode: 'classic', forceSolvable: true });
  return { state: { ...state, board: [...board], rng, tray: deal.tray, status: 'playing', stats: { ...state.stats, f2Fallbacks: state.stats.f2Fallbacks + (deal.debug.fallbackUsed ? 1 : 0) }, rescue: { ...state.rescue, used: true, ready: false } }, events: [{ type: 'rescued', poppedCells: largest?.cells ?? [] }, { type: 'dealt', tray: deal.tray }] };
}

function areNeighbours(a: number, b: number): boolean { return Math.abs(Math.floor(a / 8) - Math.floor(b / 8)) + Math.abs(a % 8 - b % 8) === 1; }
