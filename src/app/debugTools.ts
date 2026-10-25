import veteranSave from '../meta/fixtures/save-v1-veteran.json';
import { migrate } from '../meta/migrate';
import { chooseBotMove } from '../core/sim';
import { seededRng } from '../core/rng';
import { createFeelScene, createGoalScene, debugSaveWritesDisabled, debugTutorialState, markTutorialSkipped } from './demoScenes';
import { clearDebugAudioTrace, enableDebugAudioTrace } from '../audio/engine';
import { PALETTE } from '../render/palette';
import type { Layout } from '../render/layout';
import type { GameState } from '../core/types';
import type { SaveV2 } from '../meta/saveSchema';
import { newAdventureGame } from '../core/adventure';
import type { LevelDef } from '../core/levels';
import { levelParams } from '../core/levels';

export { chooseBotMove, createFeelScene, createGoalScene, debugSaveWritesDisabled, debugTutorialState, markTutorialSkipped };
export const startAudioTrace = enableDebugAudioTrace;
export const clearAudioTrace = clearDebugAudioTrace;

export function debugNeedsAdventureLevels(query: URLSearchParams): boolean {
  const demo = query.get('demo') ?? '';
  const requestedLevel = Number(query.get('level'));
  return ['level-card', 'adventure-play', 'adventure-win', 'adventure-lose', 'adventure-map', 'adventure-map-end'].includes(demo)
    || Number.isInteger(requestedLevel) && requestedLevel >= 1 && requestedLevel <= 120;
}

export function veteranSaveState() { return migrate(veteranSave); }
export function createAutoplayRng() { return seededRng('gloop-pop/debug-autoplay'); }
export function createBotRng(seed: string) { return seededRng(seed); }
export function adventureDebugLine(level: number, seed: number, wins: number, progress: number, target: number): string {
  return `adv L${level} s${seed} K${levelParams(level).k} wins ${wins}/12 · goals ${progress}/${target}`;
}

export function debugMissionSave(save: SaveV2, query: URLSearchParams, today: string): SaveV2 {
  const demo = query.get('demo');
  if (demo !== 'missions' && demo !== 'missions-done') return save;
  const done = demo === 'missions-done';
  save.missions.day = today;
  save.missions.slots = done
    ? [{ id: 'lines15', pos: 0, progress: 15, claimed: true, issued: today }, { id: 'lines40', pos: 0, progress: 40, claimed: true, issued: today }, { id: 'lines80', pos: 0, progress: 80, claimed: true, issued: today }]
    : [{ id: 'lines15', pos: 0, progress: 15, claimed: false, issued: today }, { id: 'lines40', pos: 0, progress: 32, claimed: false, issued: today }, { id: 'lines80', pos: 0, progress: 80, claimed: true, issued: today }];
  save.missions.rerollDay = null; save.missions.shownToday = save.missions.slots.map((slot) => slot.id); save.missions.setPaid = done;
  return save;
}

export function debugAdventureSave(save: SaveV2, query: URLSearchParams, levels: readonly LevelDef[], level: number): SaveV2 {
  const demo = query.get('demo');
  if (demo === 'level-card' && levels[level - 1]) {
    // spec-note: The capture tuple stays shuffle,moves,pop and the values show the specified booster states.
    const [shuffle, moves, pop] = (query.get('boosters') ?? '0,0,0').split(',').map((value) => Math.max(0, Math.min(5, Number(value) || 0)));
    save.owned.modes = Array.from(new Set([...save.owned.modes, 'adventure'])); save.adventure.frontier = level;
    save.adventure.winStreak = Math.max(0, Number(query.get('streak')) || 0); save.profile.coins = Math.max(0, Number(query.get('coins')) || 0);
    save.adventure.boosters = { moves: moves ?? 0, shuffle: shuffle ?? 0, pop: pop ?? 0 };
    save.adventure.levels[String(level)] = { stars: 0, wins: 0, losses: 0, lossRun: Math.max(0, Number(query.get('losses')) || 0), bestScore: 0 };
  }
  if (demo === 'adventure-lose' && levels[level - 1]) {
    save.owned.modes = Array.from(new Set([...save.owned.modes, 'adventure'])); save.adventure.frontier = level;
    const losses = Math.max(0, Number(query.get('losses')) || 0);
    save.adventure.levels[String(level)] = { stars: 0, wins: 0, losses, lossRun: losses, bestScore: 0 };
  }
  if (demo === 'adventure-map' || demo === 'adventure-map-end') {
    save.owned.modes = Array.from(new Set([...save.owned.modes, 'adventure']));
    const frontier = Math.max(1, Math.min(120, Math.round(Number(query.get('frontier')) || 23)));
    save.adventure.frontier = demo === 'adventure-map-end' ? 121 : frontier; save.adventure.levels = {};
    for (let current = 1; current < save.adventure.frontier; current += 1) save.adventure.levels[String(current)] = { stars: (((current - 1) % 3) + 1) as 1 | 2 | 3, wins: 1, losses: 0, lossRun: 0, bestScore: 0 };
    if (demo === 'adventure-map') {
      const def = levels[frontier - 1]; if (def) save.adventure.inProgress = newAdventureGame(def, { bonusMoves: 0, boosters: { shuffle: 0, pop: 0 }, freeShuffle: false }).state;
      // spec-note: Demo chapters fully before the requested frontier have already paid their all-level reward.
      save.adventure.chaptersDone = Array.from({ length: Math.floor((frontier - 1) / 20) }, (_, index) => index + 1);
    } else {
      save.adventure.levels = Object.fromEntries(Array.from({ length: 120 }, (_, index) => [String(index + 1), { stars: 3 as const, wins: 1, losses: 0, lossRun: 0, bestScore: 0 }]));
      save.adventure.chaptersDone = [1, 2, 3, 4, 5, 6]; save.adventure.chaptersAllStars = [1, 2, 3, 4, 5, 6];
    }
  }
  return save;
}

export function debugAdventureState(state: GameState, query: URLSearchParams): GameState | undefined {
  if (!state.adventure) return undefined;
  const demo = query.get('demo');
  if (demo === 'adventure-play') {
    state.adventure.movesLeft = 3;
    const armed = new Set((query.get('armed') ?? '').split(','));
    state.adventure.boosters.shuffle = armed.has('shuffle') ? 'armed' : 'none'; state.adventure.boosters.pop = armed.has('pop') ? 'armed' : 'none';
  } else if (demo === 'adventure-win') {
    const stars = Number(query.get('stars') ?? 3); const value = Math.max(1, Math.min(3, stars)) as 1 | 2 | 3;
    state.adventure.goals.forEach((goal) => { goal.progress = goal.target; }); state.adventure.movesLeft = 6; state.adventure.result = { won: true, reason: 'goals', movesLeft: 6, stars: value }; state.status = 'over';
  } else if (demo === 'adventure-lose') {
    const reason = query.get('reason') === 'stuck' ? 'stuck' : 'moves';
    state.adventure.movesLeft = reason === 'moves' ? 0 : 3; state.adventure.result = { won: false, reason, movesLeft: state.adventure.movesLeft, stars: 0 }; state.status = 'over';
  } else return undefined;
  return state;
}

export function debugGameScene(state: GameState, query: URLSearchParams): GameState | undefined {
  const demo = query.get('demo');
  if (demo === 'cubes' || demo === 'mega') {
    const next = structuredClone(state); next.mode = 'classic'; next.board = new Array<number>(64).fill(0);
    if (demo === 'cubes') {
      next.board[48] = 8; next.board[49] = 9; next.board[50] = 8; next.board[51] = 9; next.board[52] = 8; next.board[53] = 9; next.board[54] = 8; next.board[9] = 8; next.board[14] = 8;
      next.tray = [{ defId: 0, flavour: 1 }, null, null]; next.combo = 0; next.bestCombo = 0; next.fuse = 0;
    } else {
      // spec-note: The QA scene retains its 28-cell apple group and two-cell gap for Mega Pop captures.
      for (let row = 1; row <= 4; row += 1) for (let col = 0; col < 8; col += 1) if (!((row === 2 && col === 0) || (row === 3 && (col === 3 || col === 4)) || (row === 4 && col === 7))) next.board[row * 8 + col] = 4;
      next.tray = [{ defId: 1, flavour: 4 }, null, null]; next.combo = 11; next.bestCombo = 11; next.fuse = 2;
    }
    next.status = 'playing'; next.moves = 0; return next;
  }
  if (demo !== 'feel') return undefined;
  const scene = query.get('scene') ?? 'place';
  if (scene === 'combo' || scene === 'mega') return createFeelScene(state, scene);
  const next = structuredClone(state); next.mode = 'classic'; next.board = new Array<number>(64).fill(0);
  if (scene === 'line') {
    for (const row of [6, 7]) for (let col = 0; col < 6; col += 1) next.board[row * 8 + col] = 2 + ((row + col) % 2) * 3;
    next.board[18] = 6; next.board[19] = 6; next.board[26] = 7; next.tray = [{ defId: 9, flavour: 1 }, { defId: 3, flavour: 6 }, { defId: 13, flavour: 7 }];
  } else if (scene === 'pop') {
    for (let row = 1; row <= 4; row += 1) for (let col = 0; col < 8; col += 1) if (!((row === 2 && col === 0) || (row === 3 && (col === 3 || col === 4)) || (row === 4 && col === 7))) next.board[row * 8 + col] = 4;
    next.board[48] = 2; next.board[49] = 2; next.board[56] = 5; next.tray = [{ defId: 1, flavour: 4 }, { defId: 3, flavour: 6 }, { defId: 13, flavour: 7 }]; next.combo = 4; next.bestCombo = 4;
  } else { next.board[56] = 3; next.board[57] = 3; next.board[54] = 5; next.tray = [{ defId: 9, flavour: 1 }, { defId: 3, flavour: 6 }, { defId: 13, flavour: 7 }]; }
  next.status = 'playing'; next.moves = 0; return next;
}

export function drawDebug(context: CanvasRenderingContext2D, layout: Layout, dpr: number, dt: number, surface: { reportFrame(elapsed: number): void }, effectMs: number, audioLine: string, adventureLine = ''): void {
  const buckets = debugFrameBuckets; const bin = Math.min(buckets.length - 1, Math.floor(dt / 2));
  if (debugFrameCount === 120) { buckets[debugFrameCursor] = Math.max(0, buckets[debugFrameCursor]! - 1); debugFrameSum -= debugFrameLast[debugFrameCursor]!; } else debugFrameCount += 1;
  debugFrameLast[debugFrameCursor] = dt; buckets[bin] = buckets[bin]! + 1; debugFrameSum += dt; debugFrameCursor = (debugFrameCursor + 1) % 120;
  let accumulated = 0; let p95 = 16; for (let index = 0; index < buckets.length; index += 1) { accumulated += buckets[index]!; if (accumulated >= debugFrameCount * 0.95) { p95 = index * 2 + 1; break; } }
  const average = debugFrameSum / Math.max(1, debugFrameCount);
  // spec-note: `slow=1` feeds synthetic slow frames into the same sampler for repeatable adaptive-DPR QA.
  const forced = new URLSearchParams(window.location.search).get('slow') === '1'; if (forced) for (let index = 0; index < 120; index += 1) surface.reportFrame(25);
  context.save(); context.fillStyle = PALETTE.light.shadowDeep; context.fillRect(8, 8, 520, adventureLine ? 174 : 146); context.fillStyle = PALETTE.ui.textPrimary; context.font = '700 12px Nunito, sans-serif';
  context.fillText(`frame ${dt.toFixed(1)} ms · avg ${average.toFixed(1)} · p95 ${p95.toFixed(1)}`, 16, 28); context.fillText(`dpr ${dpr.toFixed(2)} · ${layout.width}×${layout.height}`, 16, 47); context.fillText(`effects ${effectMs.toFixed(2)} ms`, 16, 66); context.fillText(`120f ${debugFrameCount} · ${forced ? 'slow test' : 'live'}`, 16, 85); context.fillText(audioLine, 16, 104, 504); if (adventureLine) context.fillText(adventureLine, 16, 123, 504);
  let peak = 1; for (let index = 0; index < buckets.length; index += 1) peak = Math.max(peak, buckets[index]!); context.fillStyle = PALETTE.ui.gold; for (let index = 0; index < buckets.length; index += 1) { const height = 18 * buckets[index]! / peak; context.fillRect(16 + index * 26, (adventureLine ? 170 : 150) - height, 18, height); } context.restore();
}

const debugFrameBuckets = new Uint16Array(8); const debugFrameLast = new Float32Array(120); let debugFrameCursor = 0; let debugFrameCount = 0; let debugFrameSum = 0;
