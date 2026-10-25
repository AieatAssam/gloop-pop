import { buildLevel, cubeFloor, harderThan, inBand, levelParams, type LevelDef, type LevelGoal, type GoalKind } from './levels';
import { newAdventureGame, stepAdventure } from './adventure';
import { chooseLevelMove } from './levelBot';
import { seededRng } from './rng';
import type { GameEvent } from './types';

export { harderThan, inBand } from './levels';
export { cubeFloor, levelParams };

export interface BotRun { won: boolean; movesLeft: number; movesUsed: number; stars: number; progress: number[]; trace: number[][]; linesPerMove: number[] }
export interface Calibration { def: LevelDef; runs: BotRun[]; rawRuns: BotRun[] }

const RUN_COUNT = 12;
const NEVER_MET = 1_000_000_000;

/** Calibrates one deterministic board seed against twelve target-independent bot traces. */
export function calibrate(n: number, seedIndex: number): Calibration {
  const built = buildLevel(n, seedIndex);
  const params = built.params;
  const rawGoals = params.goals.map((goal): LevelGoal => ({
    ...goal,
    target: goal.kind === 'C' ? params.sugar + params.hardCubes : NEVER_MET,
    ...(goal.kind === 'F' && built.flavour !== undefined ? { flavour: built.flavour } : {}),
  }));
  const rawDef: LevelDef = { n, s: seedIndex, goals: rawGoals, moves: params.moves, s2: 1, s3: 2, wins: 0, margin: 0, board: built.board };
  const rawRuns = Array.from({ length: RUN_COUNT }, (_, runIndex) => playRun(rawDef, runIndex));
  const targetSet = findTargets(rawDef, rawRuns, params.k);
  if (!targetSet) throw new Error(`Level ${n}, seed ${seedIndex}: no target vector passed its tier band`);
  const { goals, measure } = targetSet;
  const maxWinningMovesLeft = measure.winningMovesLeft.reduce((max, movesLeft) => Math.max(max, movesLeft), 0);
  const s3 = Math.min(maxWinningMovesLeft, Math.floor(0.4 * params.moves));
  const s2 = Math.max(1, Math.floor(s3 / 2));
  const def: LevelDef = { ...rawDef, goals, wins: measure.wins, margin: measure.margin, s2, s3 };
  const runs = Array.from({ length: RUN_COUNT }, (_, runIndex) => playRun(def, runIndex));
  const replayStarsAgree = runs.every((run, runIndex) => {
    const trace = rawRuns[runIndex]?.trace ?? [];
    const firstWin = trace.findIndex((progress) => goals.every((goal, index) => (progress[index] ?? 0) >= goal.target));
    const movesLeft = firstWin < 0 ? 0 : def.moves - firstWin - 1;
    const expectedStars = firstWin < 0 ? 0 : movesLeft >= s3 ? 3 : movesLeft >= s2 ? 2 : 1;
    return run.stars === expectedStars;
  });
  const replayWins = runs.filter((run) => run.won);
  const replayMargin = lowerMedian(replayWins.map((run) => run.movesLeft));
  if (replayWins.length !== def.wins || replayMargin !== def.margin || !replayStarsAgree) {
    throw new Error(`Level ${n}, seed ${seedIndex}: trace replay differed (wins ${replayWins.length}/${def.wins}, margin ${replayMargin}/${def.margin}, stars agree ${replayStarsAgree})`);
  }
  return { def, runs, rawRuns };
}

export function validate(def: LevelDef): boolean {
  try {
    const params = levelParams(def.n);
    if (def.board.length !== 64 || !/^[0-9]{64}$/.test(def.board) || def.s < 0 || def.s >= 64) return false;
    if (def.moves !== params.moves || def.goals.length !== params.goals.length || !inBand(params.band, def.wins, def.margin, def.moves) || def.s3 < 2 || def.s2 < 1 || def.s2 > def.s3) return false;
    if (def.goals.some((goal, index) => goal.kind !== params.goals[index]?.kind || goal.target < minimum(goal.kind, params.chapter))) return false;
    return def.goals.every((goal) => goal.kind !== 'F' || goal.flavour !== undefined);
  } catch {
    return false;
  }
}

export function generateLevel(n: number, previous?: LevelDef): LevelDef {
  for (let seedIndex = 0; seedIndex < 64; seedIndex += 1) {
    let result: Calibration;
    try { result = calibrate(n, seedIndex); } catch { continue; }
    if (!validate(result.def)) continue;
    const band = levelParams(n).band;
    const previousBand = previous ? levelParams(previous.n).band : undefined;
    if (band === 'hard' && previous && !harderThan(result.def, previous)) continue;
    if (previous && previousBand === 'hard' && !harderThan(previous, result.def)) continue;
    return result.def;
  }
  throw new Error(`Level ${n}: no seed passed in 64 tries`);
}

/** Diagnostic output is used by tools/gen-levels.mjs --diagnose to inspect Level 1. */
export function diagnoseLevelOne(): string[] { return diagnoseLevelRuns(1, 0); }

export function diagnoseLevelRuns(n: number, seedIndex: number): string[] {
  const result = calibrate(n, seedIndex);
  return result.rawRuns.map((run, index) => `run ${index}: progress ${run.progress.join(',')} · moves ${run.movesUsed}/${result.def.moves} · lines ${run.linesPerMove.filter((lines) => lines > 0).join(',') || 'none'} · ${run.won ? 'win' : 'loss'}`);
}

interface Evaluation { wins: number; margin: number; winningMovesLeft: number[] }
interface TargetSet { goals: LevelGoal[]; measure: Evaluation }

function findTargets(def: LevelDef, runs: readonly BotRun[], minimumWins: number): TargetSet | undefined {
  for (const targetVector of orderedTargetVectors(def.goals, runs.map((run) => run.progress), def.n)) {
    const goals = def.goals.map((goal, index) => ({ ...goal, target: targetVector[index] ?? goal.target }));
    const measure = evaluate(runs, goals, def.moves);
    if (accepts(measure, def, minimumWins)) return { goals, measure };
  }
  return undefined;
}

export function orderedTargetVectors(goals: readonly LevelGoal[], runProgress: readonly number[][], n: number): number[][] {
  const cubeIndex = goals.findIndex((goal) => goal.kind === 'C');
  if (cubeIndex < 0) {
    const goal = goals[0];
    return goal ? candidateTargets(goal, runProgress.map((progress) => progress[0] ?? 0), n).map((target) => [target]) : [];
  }
  if (goals.length === 1) {
    const goal = goals[0]!;
    return candidateTargets(goal, runProgress.map((progress) => progress[0] ?? 0), n).map((target) => [target]);
  }
  const otherIndex = cubeIndex === 0 ? 1 : 0;
  const cubeGoal = goals[cubeIndex]; const other = goals[otherIndex];
  if (!cubeGoal || !other) return [];
  const vectors: number[][] = [];
  for (const cubeTarget of candidateTargets(cubeGoal, runProgress.map((progress) => progress[cubeIndex] ?? 0), n)) {
    const eligible = runProgress.filter((progress) => (progress[cubeIndex] ?? 0) >= cubeTarget);
    for (const otherTarget of candidateTargets(other, eligible.map((progress) => progress[otherIndex] ?? 0), n)) {
      vectors.push(goals.map((_, index) => index === cubeIndex ? cubeTarget : otherTarget));
    }
  }
  return vectors;
}

export function candidateTargets(goal: LevelGoal, progress: readonly number[], n: number): number[] {
  const cap = n === 1 && goal.kind === 'L' ? 4 : n === 2 && goal.kind === 'S' ? 1500 : n === 3 && goal.kind === 'L' ? 6 : Number.POSITIVE_INFINITY;
  const chapter = levelParams(n).chapter;
  return [...new Set(progress.map((value) => Math.min(cap, roundDown(value, goal.kind))).filter((value) => value >= minimum(goal.kind, chapter)))].sort((a, b) => b - a);
}

function evaluate(runs: readonly BotRun[], goals: readonly LevelGoal[], moves: number): Evaluation {
  return evaluateTraces(runs.map((run) => run.trace), goals.map((goal) => goal.target), moves);
}

export function evaluateTraces(traces: readonly (readonly (readonly number[])[])[], targets: readonly number[], moves: number): Evaluation {
  const winningMovesLeft: number[] = [];
  for (const trace of traces) {
    const firstWin = trace.findIndex((progress) => targets.every((target, index) => (progress[index] ?? 0) >= target));
    if (firstWin >= 0) winningMovesLeft.push(moves - firstWin - 1);
  }
  return { wins: winningMovesLeft.length, margin: lowerMedian(winningMovesLeft), winningMovesLeft };
}

function accepts(measure: Evaluation, def: LevelDef, minimumWins: number): boolean {
  return measure.wins >= minimumWins && inBand(levelParams(def.n).band, measure.wins, measure.margin, def.moves)
    && Math.min(Math.max(...measure.winningMovesLeft), Math.floor(0.4 * def.moves)) >= 2;
}

function playRun(def: LevelDef, runIndex: number): BotRun {
  const initial = newAdventureGame(def, { bonusMoves: 0, boosters: { shuffle: 0, pop: 0 }, freeShuffle: false });
  let state = initial.state;
  const botRng = seededRng(`${state.seed}/bot/${runIndex}`);
  let movesUsed = 0;
  const linesPerMove: number[] = [];
  const trace: number[][] = [];
  while (state.status === 'playing' && movesUsed < def.moves) {
    const action = chooseLevelMove(state, botRng);
    if (!action) break;
    const result = stepAdventure(state, action);
    if (result.state.moves === state.moves) break;
    const cleared = result.events.find((event): event is Extract<GameEvent, { type: 'cleared' }> => event.type === 'cleared');
    linesPerMove.push((cleared?.rows.length ?? 0) + (cleared?.cols.length ?? 0));
    state = result.state;
    movesUsed += 1;
    trace.push(state.adventure?.goals.map((goal) => goal.progress) ?? []);
  }
  const adventure = state.adventure!;
  return {
    won: adventure.result?.won ?? false,
    movesLeft: adventure.result?.movesLeft ?? adventure.movesLeft,
    movesUsed,
    stars: adventure.result?.stars ?? 0,
    progress: adventure.goals.map((goal) => goal.progress),
    trace,
    linesPerMove,
  };
}

function lowerMedian(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return [...values].sort((a, b) => a - b)[Math.floor((values.length - 1) / 2)] ?? 0;
}

function minimum(kind: GoalKind, chapter: number): number { return kind === 'C' ? cubeFloor(chapter) : kind === 'L' ? 3 : kind === 'S' ? 500 : kind === 'F' ? 8 : 1; }
function roundDown(value: number, kind: GoalKind): number {
  if (kind === 'F') return value >= 20 ? Math.floor(value / 5) * 5 : Math.floor(value);
  if (kind === 'S') return Math.floor(value / 100) * 100;
  return Math.floor(value);
}
