import { makeBoard } from './board';
import { nextInt, seededRng } from './rng';
import { PIECES } from './pieces';
import { place } from './board';
import type { Flavour } from './types';

export interface LevelGoal { kind: 'L' | 'S' | 'F' | 'B' | 'M' | 'C'; flavour?: Flavour; target: number }
export interface LevelDef { n: number; s: number; goals: LevelGoal[]; moves: number; s2: number; s3: number; wins: number; board: string; }
export interface LevelParams { n: number; chapter: number; position: number; band: 'intro' | 'easy' | 'normal' | 'hard'; k: number; moves: number; stage: number; flavours: number; f2: number; startPieces: number; sugar: number; hardCubes: number; goals: LevelGoal[] }
const goals = [
  'L S L S L F S L F S F L S F L S F L S F',
  'C L S C C F C S L C S C F L F C S C L C',
  'B L C B S M F B C M L B S C B F M C B C',
  'C L B C F C M S C B C F M C S L C B M C',
  'C+L S C+F B C M C+S F C+B L S C+M B C+L C+F F C+S M C+B C+L',
  'C+S B C+F M C+L F C+B S C+M C L C+F B C+S M C+L F C+B S C+M',
].map((row) => row.split(' '));
const moves = [[30,26,18],[28,25,17],[28,24,16],[27,24,16],[26,23,15],[26,22,14]];
const starts = [[0,2,3],[1,2,3],[2,3,4],[2,3,4],[2,4,5],[3,4,5]];
const cubes = [[0,0],[3,0],[4,0],[2,1],[3,1],[3,2]];
const stageRow = [1,2,3,3,4,4];
export function levelParams(n: number): LevelParams {
  if (!Number.isInteger(n) || n < 1 || n > 120) throw new RangeError('level must be 1..120');
  const chapter = Math.ceil(n / 20); const position = (n - 1) % 20 + 1;
  const band = n <= 3 ? 'intro' : [1,6,11,16].includes(position) ? 'easy' : [5,10,15,20].includes(position) ? 'hard' : 'normal';
  const bi = band === 'hard' ? 2 : band === 'normal' ? 1 : 0;
  const raw = goals[chapter - 1]?.[position - 1] ?? 'L';
  const goalList = raw.split('+').map((kind): LevelGoal => ({ kind: kind as LevelGoal['kind'], target: kind === 'C' ? 1 : 0 }));
  const flavours = chapter < 3 ? 5 : chapter === 3 && position < 11 ? 5 : chapter < 5 || (chapter === 5 && position < 11) ? 6 : 7;
  const intro = n <= 3; const stage = intro ? 1 : chapter === 1 ? (band === 'hard' ? 2 : 1) : stageRow[chapter - 1] ?? 1;
  if (goalList.some((goal) => goal.kind === 'F')) goalList[goalList.findIndex((goal) => goal.kind === 'F')] = { kind: 'F', flavour: ((n * 7) % flavours + 1) as Flavour, target: 0 };
  const c = goalList.some((goal) => goal.kind === 'C') ? (cubes[chapter - 1]?.[bi] ?? 0) : 0;
  return { n, chapter, position, band, k: intro ? 12 : band === 'easy' ? 10 : band === 'hard' ? 4 : 7, moves: intro ? 20 : moves[chapter - 1]?.[bi] ?? 20, stage, flavours,
    f2: intro || chapter < 3 || band === 'easy' ? 1 : chapter < 5 ? 0.5 : 0, startPieces: intro ? 0 : starts[chapter - 1]?.[bi] ?? 0,
    sugar: c, hardCubes: c ? (chapter >= 4 ? cubes[chapter - 1]?.[bi] ?? 0 : 0) : 0, goals: goalList };
}
export function buildLevel(n: number, s: number): { board: string; flavour?: Flavour; rng: ReturnType<typeof seededRng>; params: LevelParams } {
  const params = levelParams(n); const seed = `gloop-pop/adventure/v1/${n}/${s}`; const rng = seededRng(`${seed}/board`); const board = makeBoard();
  const startIds = [1,2,4,5,8,9,10,11];
  for (let p = 0; p < params.startPieces; p += 1) { const def = PIECES[startIds[nextInt(rng,startIds.length)] ?? 0]!; let tries=0; while (tries++ < 20_000) { const row=nextInt(rng,9-def.h); const col=nextInt(rng,9-def.w); const next=place(board,def,row,col,1+nextInt(rng,params.flavours)); if(next){ let full=false; for(let r=0;r<8;r+=1)if(next.slice(r*8,r*8+8).every(Boolean))full=true; for(let c=0;c<8;c+=1)if(Array.from({length:8},(_,r)=>next[r*8+c]).every(Boolean))full=true; if(!full){board.set(next);break;} } } }
  for(const [value,count] of [[9,params.hardCubes],[8,params.sugar]] as const) for(let i=0;i<count;i+=1){const empty=Array.from(board.keys()).filter((index)=>board[index]===0); if(empty.length)board[empty[nextInt(rng,empty.length)]??0]=value;}
  const fGoal = params.goals.find((goal)=>goal.kind==='F'); const goalRng=seededRng(`${seed}/goal`); const flavour=fGoal ? (1+nextInt(goalRng,params.flavours)) as Flavour : undefined;
  return { board: Array.from(board).join(''), ...(flavour ? {flavour} : {}), rng: seededRng(`${seed}/trays`), params };
}
