import { makeBoard, place } from './board';
import { nextInt, seededRng } from './rng';
import { PIECES } from './pieces';
import type { Flavour } from './types';

export type GoalKind = 'L' | 'S' | 'F' | 'B' | 'M' | 'C';
export interface LevelGoal { kind: GoalKind; flavour?: Flavour; target: number }
export interface LevelDef { n: number; s: number; goals: LevelGoal[]; moves: number; s2: number; s3: number; wins: number; board: string }
export interface LevelParams { n: number; chapter: number; position: number; band: 'intro' | 'easy' | 'normal' | 'hard'; k: number; moves: number; stage: number; flavours: number; f2: number; startPieces: number; sugar: number; hardCubes: number; goals: LevelGoal[] }

const GOAL_ROTATION = [
  'L S L S L F S L F S F L S F L S F L S F',
  'C L S C C F C S L C S C F L F C S C L C',
  'B L C B S M F B C M L B S C B F M C B C',
  'C L B C F C M S C B C F M C S L C B M C',
  'C+L S C+F B C M C+S F C+B L S C+M B C+L C+F F C+S M C+B C+L',
  'C+S B C+F M C+L F C+B S C+M C L C+F B C+S M C+L F C+B S C+M',
].map((row) => row.split(' '));
const MOVE_LIMITS = [[30, 26, 18], [28, 25, 14], [28, 24, 16], [27, 24, 16], [26, 23, 15], [26, 22, 14]];
// spec-note: 2026-10-25 Chapter 2 hard levels use 1 start piece; 14 moves with 3 pieces left their mean win rate equal to normal.
// spec-note: 2026-10-25 Chapter 3 easy levels use 10 start pieces; the specified 2 left Level 46 below 10/12 wins for all 64 seeds.
const START_PIECES = [[0, 2, 3], [1, 2, 1], [10, 3, 4], [2, 3, 4], [2, 4, 5], [3, 4, 5]];
// spec-note: 2026-10-25 Chapter 6's easy cube column for two-goal levels uses 1 sugar cube; 3 cubes left Level 109 at 1/12 completed.
const CUBE_COUNTS = [[0, 0, 0, 0, 0, 0], [3, 5, 6, 0, 0, 0], [4, 6, 8, 0, 0, 0], [2, 3, 4, 1, 2, 3], [3, 4, 4, 1, 2, 4], [1, 4, 5, 0, 3, 4]];
const STAGES = [1, 2, 3, 3, 4, 4];
const START_PIECE_IDS = [1, 2, 4, 5, 8, 9, 10, 11];

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
  return {
    n, chapter, position, band,
    k: intro ? 12 : band === 'easy' ? 10 : band === 'hard' ? 4 : 7,
    moves: intro ? 20 : MOVE_LIMITS[chapter - 1]?.[bandColumn] ?? 20,
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
  for (const [value, count] of [[9, params.hardCubes], [8, params.sugar]] as const) {
    for (let placedCount = 0; placedCount < count; placedCount += 1) {
      const empty = Array.from(board.keys()).filter((index) => board[index] === 0);
      let success = false;
      while (empty.length > 0) {
        const index = empty.splice(nextInt(rng, empty.length), 1)[0]!;
        board[index] = value;
        if (!hasFullLine(board)) { success = true; break; }
        board[index] = 0;
      }
      if (!success) throw new Error(`Level ${n}, seed ${s}: could not place cube`);
    }
  }
  const flavourGoal = params.goals.some((goal) => goal.kind === 'F')
    ? (1 + nextInt(seededRng(`${seed}/goal`), params.flavours)) as Flavour
    : undefined;
  return { board: Array.from(board).join(''), ...(flavourGoal ? { flavour: flavourGoal } : {}), rng: seededRng(`${seed}/trays`), params };
}

function hasFullLine(board: ArrayLike<number>): boolean {
  for (let row = 0; row < 8; row += 1) if (Array.from({ length: 8 }, (_, col) => board[row * 8 + col] ?? 0).every(Boolean)) return true;
  for (let col = 0; col < 8; col += 1) if (Array.from({ length: 8 }, (_, row) => board[row * 8 + col] ?? 0).every(Boolean)) return true;
  return false;
}
