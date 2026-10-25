import { buildLevel, levelParams, type LevelDef, type LevelGoal, type GoalKind } from './levels';
import { newAdventureGame, stepAdventure } from './adventure';
import { chooseLevelMove } from './levelBot';
import { seededRng } from './rng';
import type { GameEvent } from './types';

export interface BotRun { won: boolean; movesLeft: number; movesUsed: number; stars: number; progress: number[]; linesPerMove: number[] }
export interface Calibration { def: LevelDef; runs: BotRun[]; rawRuns: BotRun[] }

const RUN_COUNT = 12;
const NEVER_MET = 1_000_000_000;

/** Calibrates one deterministic board seed against twelve target-independent bot runs. */
export function calibrate(n: number, seedIndex: number): Calibration {
  const built = buildLevel(n, seedIndex);
  const params = built.params;
  const rawGoals = params.goals.map((goal): LevelGoal => ({
    ...goal,
    target: goal.kind === 'C' ? params.sugar + params.hardCubes : NEVER_MET,
    ...(goal.kind === 'F' && built.flavour !== undefined ? { flavour: built.flavour } : {}),
  }));
  const rawDef: LevelDef = { n, s: seedIndex, goals: rawGoals, moves: params.moves, s2: 1, s3: 2, wins: 0, board: built.board };
  const runs = Array.from({ length: RUN_COUNT }, (_, runIndex) => playRun(rawDef, runIndex));
  const goals = calibrateGoals(params.goals, runs, params.k, n);
  const def: LevelDef = { ...rawDef, goals };
  const measuredRuns = Array.from({ length: RUN_COUNT }, (_, runIndex) => playRun(def, runIndex));
  def.wins = measuredRuns.filter((run) => run.won).length;
  const maxWinningMovesLeft = measuredRuns.filter((run) => run.won).reduce((max, run) => Math.max(max, run.movesLeft), 0);
  def.s3 = Math.min(maxWinningMovesLeft, Math.floor(0.4 * params.moves));
  def.s2 = Math.max(1, Math.floor(def.s3 / 2));
  const finalRuns = measuredRuns.map((run) => ({ ...run, stars: run.won ? run.movesLeft >= def.s3 ? 3 : run.movesLeft >= def.s2 ? 2 : 1 : 0 }));
  return { def, runs: finalRuns, rawRuns: runs };
}

export function validate(def: LevelDef): boolean {
  try {
    const params = levelParams(def.n);
    if (def.board.length !== 64 || !/^[0-9]{64}$/.test(def.board) || def.s < 0 || def.s >= 64) return false;
    if (def.moves !== params.moves || def.goals.length !== params.goals.length || def.wins < params.k || def.s3 < 2 || def.s2 < 1 || def.s2 > def.s3) return false;
    if (def.goals.some((goal, index) => goal.kind !== params.goals[index]?.kind || goal.target < minimum(goal.kind))) return false;
    return def.goals.every((goal) => goal.kind !== 'F' || goal.flavour !== undefined);
  } catch {
    return false;
  }
}

export function generateLevel(n: number): LevelDef {
  for (let seedIndex = 0; seedIndex < 64; seedIndex += 1) {
    let result: Calibration;
    try { result = calibrate(n, seedIndex); } catch { continue; }
    if (result.def.wins >= levelParams(n).k && result.def.goals.every((goal) => goal.target >= minimum(goal.kind)) && result.def.s3 >= 2 && validate(result.def)) return result.def;
  }
  throw new Error(`Level ${n}: no seed passed in 64 tries`);
}

/** Diagnostic output is used by tools/gen-levels.mjs --diagnose to inspect Level 1. */
export function diagnoseLevelOne(): string[] {
  return diagnoseLevelRuns(1, 0);
}

export function diagnoseLevelRuns(n: number, seedIndex: number): string[] {
  const result = calibrate(n, seedIndex);
  return result.rawRuns.map((run, index) => `run ${index}: progress ${run.progress.join(',')} · moves ${run.movesUsed}/${result.def.moves} · lines ${run.linesPerMove.filter((lines) => lines > 0).join(',') || 'none'} · ${run.won ? 'win' : 'loss'}`);
}

function calibrateGoals(goals: readonly LevelGoal[], runs: readonly BotRun[], k: number, n: number): LevelGoal[] {
  return goals.map((goal, goalIndex) => {
    if (goal.kind === 'C') return { ...goal };
    let source = runs;
    if (goals.some((item) => item.kind === 'C')) {
      const cubeGoalIndex = goals.findIndex((item) => item.kind === 'C');
      const cubeTarget = goals[cubeGoalIndex]?.target ?? 0;
      source = runs.filter((run) => run.progress[cubeGoalIndex] === cubeTarget);
      if (source.length < k) return { ...goal, target: 0 };
    }
    const ordered = source.map((run) => run.progress[goalIndex] ?? 0).sort((a, b) => b - a);
    const calibrated = ordered[k - 1] ?? 0;
    let target = roundDown(calibrated, goal.kind);
    if (n === 1 && goal.kind === 'L') target = Math.min(target, 4);
    if (n === 2 && goal.kind === 'S') target = Math.min(target, 1500);
    if (n === 3 && goal.kind === 'L') target = Math.min(target, 6);
    return { ...goal, target };
  });
}

function playRun(def: LevelDef, runIndex: number): BotRun {
  const initial = newAdventureGame(def, { bonusMoves: 0, boosters: { shuffle: 0, pop: 0 }, freeShuffle: false });
  let state = initial.state;
  const botRng = seededRng(`${state.seed}/bot/${runIndex}`);
  let movesUsed = 0;
  const linesPerMove: number[] = [];
  while (state.status === 'playing' && movesUsed < def.moves) {
    const action = chooseLevelMove(state, botRng);
    if (!action) break;
    const result = stepAdventure(state, action);
    if (result.state.moves === state.moves) break;
    const cleared = result.events.find((event): event is Extract<GameEvent, { type: 'cleared' }> => event.type === 'cleared');
    linesPerMove.push((cleared?.rows.length ?? 0) + (cleared?.cols.length ?? 0));
    state = result.state;
    movesUsed += 1;
  }
  const adventure = state.adventure!;
  return {
    won: adventure.result?.won ?? false,
    movesLeft: adventure.result?.movesLeft ?? adventure.movesLeft,
    movesUsed,
    stars: adventure.result?.stars ?? 0,
    progress: adventure.goals.map((goal) => goal.progress),
    linesPerMove,
  };
}

function minimum(kind: GoalKind): number { return kind === 'L' ? 3 : kind === 'S' ? 500 : kind === 'F' ? 8 : 1; }
function roundDown(value: number, kind: GoalKind): number {
  if (kind === 'F') return value >= 20 ? Math.floor(value / 5) * 5 : Math.floor(value);
  if (kind === 'S') return Math.floor(value / 100) * 100;
  return Math.floor(value);
}
