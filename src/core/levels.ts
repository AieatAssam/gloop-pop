import { makeBoard, place } from './board';
import { nextInt, seededRng } from './rng';
import { PIECES } from './pieces';
import type { Flavour } from './types';

export type GoalKind = 'L' | 'S' | 'F' | 'B' | 'M' | 'C';
export interface LevelGoal { kind: GoalKind; flavour?: Flavour; target: number }
export interface LevelDef { n: number; s: number; goals: LevelGoal[]; moves: number; s2: number; s3: number; wins: number; margin: number; board: string }
export interface LevelParams { n: number; chapter: number; position: number; band: 'intro' | 'easy' | 'normal' | 'hard'; k: number; moves: number; stage: number; flavours: number; f2: number; startPieces: number; sugar: number; hardCubes: number; goals: LevelGoal[] }

export interface TierBand { wins: readonly [number, number]; margin?: 'easy' | 'hard' }
export const TIER_BANDS: Readonly<Record<LevelParams['band'], TierBand>> = {
  intro: { wins: [12, 12] },
  easy: { wins: [10, 12], margin: 'easy' },
  normal: { wins: [7, 10] },
  hard: { wins: [4, 7], margin: 'hard' },
};

export function inBand(band: LevelParams['band'], wins: number, margin: number, moves: number): boolean {
  const target = TIER_BANDS[band];
  if (wins < target.wins[0] || wins > target.wins[1]) return false;
  if (target.margin === 'easy') return 5 * margin >= moves;
  if (target.margin === 'hard') return 5 * margin <= moves;
  return true;
}

export function harderThan(hard: Pick<LevelDef, 'wins' | 'margin' | 'moves'>, neighbour: Pick<LevelDef, 'wins' | 'margin' | 'moves'>): boolean {
  return hard.wins <= neighbour.wins - 2 && hard.margin * neighbour.moves <= neighbour.margin * hard.moves;
}

const GOAL_ROTATION = [
  'L S L S L F S L F S F L S F L S F L S F',
  'C L S C C F C S L C S C F L F C S C L C',
  'B L C B S M M B C F L B S C B F M C B C',
  'C L B C F C M S C B C F M C S L C B M C',
  'C+L S C+F B C M C+S F C+B L S C+F B C+L C+F F C+S M C+B C+L',
  'C+S B C+F M C+L F C+B S C+S C L C+F B C+S S C+L F C+F M C+B',
].map((row) => row.split(' '));
const MOVE_LIMITS = [[30, 26, 18], [28, 25, 14], [28, 24, 16], [27, 24, 16], [26, 23, 15], [26, 22, 14]];
// spec-note: M14 cube lanes/counts and C move limits follow the measured forecast in docs/balance-log.md.
export const CUBE_COUNTS = [[0, 0, 0, 0, 0, 0], [5, 7, 8, 0, 0, 0], [6, 8, 10, 0, 0, 0], [7, 8, 9, 1, 1, 1], [7, 9, 10, 1, 1, 1], [7, 9, 10, 0, 1, 1]] as const;
export const C_MOVE_LIMITS = [[30, 28, 16], [30, 27, 18], [31, 28, 18], [30, 27, 18], [30, 26, 18]] as const;
// spec-note: 2026-10-25 Chapter 2 hard levels use 1 start piece; 14 moves with 3 pieces left their mean win rate equal to normal.
// spec-note: 2026-10-25 Chapter 3 easy levels use 10 start pieces; the specified 2 left Level 46 below 10/12 wins for all 64 seeds.
const START_PIECES = [[0, 2, 3], [1, 2, 1], [10, 3, 4], [2, 3, 4], [2, 4, 5], [3, 4, 5]];
const STAGES = [1, 2, 3, 3, 4, 4];
const START_PIECE_IDS = [1, 2, 4, 5, 8, 9, 10, 11];

export function cubeFloor(chapter: number): number {
  return chapter >= 4 ? 4 : chapter >= 2 ? 3 : 1;
}

export function levelParams(n: number): LevelParams {
  if (!Number.isInteger(n) || n < 1 || n > 120) throw new RangeError('level must be 1..120');
  const chapter = Math.ceil(n / 20);
  const position = (n - 1) % 20 + 1;
  const intro = n <= 3;
  const band = intro ? 'intro' : [1, 6, 11, 16].includes(position) ? 'easy' : [5, 10, 15, 20].includes(position) ? 'hard' : 'normal';
  const bandColumn = band === 'easy' || band === 'intro' ? 0 : band === 'normal' ? 1 : 2;
  const rawGoals = GOAL_ROTATION[chapter - 1]?.[position - 1] ?? 'L';
  const flavourCount = chapter < 3 ? 5 : chapter === 3 && position <= 10 ? 5 : chapter < 5 || (chapter === 5 && position <= 10) ? 6 : 7;
  const goals = rawGoals.split('+').map((kind): LevelGoal => ({ kind: kind as GoalKind, target: kind === 'C' ? 1 : 0 }));
  const flavourIndex = goals.findIndex((goal) => goal.kind === 'F');
  if (flavourIndex >= 0) goals[flavourIndex] = { kind: 'F', flavour: ((n * 7) % flavourCount + 1) as Flavour, target: 0 };
  const hasCubeGoal = goals.some((goal) => goal.kind === 'C');
  const cubeColumn = goals.length === 2 ? 0 : bandColumn;
  const cubeTable = CUBE_COUNTS[chapter - 1] ?? [0, 0, 0, 0, 0, 0];
  const cubeCount = hasCubeGoal ? cubeTable[cubeColumn] ?? 0 : 0;
  const hardCubes = hasCubeGoal ? cubeTable[cubeColumn + 3] ?? 0 : 0;
  const sugar = cubeCount - hardCubes;
  const moves = hasCubeGoal
    ? C_MOVE_LIMITS[chapter - 2]?.[bandColumn] ?? MOVE_LIMITS[chapter - 1]?.[bandColumn] ?? 20
    : intro ? 20 : MOVE_LIMITS[chapter - 1]?.[bandColumn] ?? 20;
  return {
    n, chapter, position, band,
    k: intro ? 12 : band === 'easy' ? 10 : band === 'hard' ? 4 : 7,
    moves,
    stage: intro ? 1 : chapter === 1 ? band === 'hard' ? 2 : 1 : STAGES[chapter - 1] ?? 1,
    flavours: flavourCount, f2: intro || chapter < 3 || band === 'easy' ? 1 : chapter < 5 ? 0.5 : 0,
    startPieces: intro ? 0 : START_PIECES[chapter - 1]?.[bandColumn] ?? 0,
    sugar, hardCubes, goals,
  };
}

export function buildLevel(n: number, s: number): { board: string; flavour?: Flavour; rng: ReturnType<typeof seededRng>; params: LevelParams } {
  if (!Number.isInteger(s) || s < 0) throw new RangeError('seed index must be a non-negative integer');
  const params = levelParams(n);
  const seed = `gloop-pop/adventure/v1/${n}/${s}`;
  const rng = seededRng(`${seed}/board`);
  const board = makeBoard();
  for (let count = 0; count < params.startPieces; count += 1) {
    const def = PIECES[START_PIECE_IDS[nextInt(rng, START_PIECE_IDS.length)] ?? 0]!;
    let success = false;
    for (let attempt = 0; attempt < 20_000; attempt += 1) {
      const row = nextInt(rng, 9 - def.h);
      const col = nextInt(rng, 9 - def.w);
      const flavour = 1 + nextInt(rng, params.flavours);
      const placed = place(board, def, row, col, flavour);
      if (placed && !hasFullLine(placed)) { board.set(placed); success = true; break; }
    }
    if (!success) throw new Error(`Level ${n}, seed ${s}: could not place start piece`);
  }
  if (placeCubesInLanes(board, params.sugar, params.hardCubes, rng) === undefined) {
    throw new Error(`Level ${n}, seed ${s}: could not place cubes in lanes`);
  }
  const flavourGoal = params.goals.some((goal) => goal.kind === 'F')
    ? (1 + nextInt(seededRng(`${seed}/goal`), params.flavours)) as Flavour
    : undefined;
  return { board: Array.from(board).join(''), ...(flavourGoal ? { flavour: flavourGoal } : {}), rng: seededRng(`${seed}/trays`), params };
}

/** Places hard cubes first, then sugar cubes, balanced over randomly selected eligible lines. */
export function placeCubesInLanes(board: Uint8Array, sugar: number, hardCubes: number, rng: ReturnType<typeof seededRng>): number[] | undefined {
  const total = sugar + hardCubes;
  if (total === 0) return [];
  const laneCount = Math.ceil(total / 3);
  const perLane = Math.ceil(total / laneCount);
  const eligible = Array.from({ length: 16 }, (_, line) => line).filter((line) => laneCells(board, line).filter((index) => board[index] === 0).length >= perLane + 2);
  if (eligible.length < laneCount) return undefined;
  const lanes: number[] = [];
  for (let index = 0; index < laneCount; index += 1) lanes.push(eligible.splice(nextInt(rng, eligible.length), 1)[0]!);
  const values = [...Array.from({ length: hardCubes }, () => 9), ...Array.from({ length: sugar }, () => 8)];
  for (let index = 0; index < values.length; index += 1) {
    const line = lanes[index % laneCount];
    if (line === undefined) return undefined;
    const cells = laneCells(board, line).filter((cell) => board[cell] === 0);
    let placed = false;
    while (cells.length > 0) {
      const cell = cells.splice(nextInt(rng, cells.length), 1)[0]!;
      board[cell] = values[index] ?? 8;
      if (!hasFullLine(board)) { placed = true; break; }
      board[cell] = 0;
    }
    if (!placed) return undefined;
  }
  return lanes;
}

function laneCells(board: ArrayLike<number>, line: number): number[] {
  return Array.from({ length: 8 }, (_, offset) => line < 8 ? line * 8 + offset : offset * 8 + line - 8);
}

function hasFullLine(board: ArrayLike<number>): boolean {
  for (let row = 0; row < 8; row += 1) if (Array.from({ length: 8 }, (_, col) => board[row * 8 + col] ?? 0).every(Boolean)) return true;
  for (let col = 0; col < 8; col += 1) if (Array.from({ length: 8 }, (_, row) => board[row * 8 + col] ?? 0).every(Boolean)) return true;
  return false;
}
