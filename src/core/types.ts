export type Flavour = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type Cell = 0 | Flavour;
export type Board = Uint8Array;
export type FamilyId = 'Dot' | 'I2' | 'I3' | 'I4' | 'I5' | 'O2' | 'O3' | 'R23' | 'L3' | 'L4' | 'T4' | 'S4' | 'L5';
export interface PieceDef { id: number; family: FamilyId; cells: readonly (readonly [number, number])[]; w: number; h: number; }
export interface Piece { defId: number; flavour: Flavour; }
export type ModeId = 'classic' | 'expert' | 'zen' | 'daily' | 'tutorial';
export interface RngState { a: number; b: number; c: number; d: number; }
export interface RunStats {
  placements: number; pops: number; biggestPop: number; allClears: number; bigPops: number;
  hugePops: number; megaPops: number; multiClears: number; solverTimeMs: number;
  f2Fallbacks: number;
}
export interface GameState {
  v: 1; mode: ModeId; seed: string; rng: RngState; board: number[]; tray: (Piece | null)[];
  traysDealt: number; score: number; combo: number; fuse: number; bestCombo: number; stage: number;
  linesCleared: number; rescue: { charge: number; ready: boolean; used: boolean };
  daily?: { dayNumber: number; dayKey: string; flavourOfDay: Flavour; trays: Piece[][]; trayLines: number[]; traySpecial: boolean[] };
  status: 'playing' | 'stuck' | 'rescueOffer' | 'over'; moves: number; stats: RunStats;
}
export interface ScoreParts { place: number; lineBase: number; pop: number; bigPopBonus: number; allClear: number; }
export interface Gloop { flavour: Flavour; cells: number[]; bfs: number[]; largestSquare: { row: number; col: number; size: number }; }
export interface Preview { rows: number[]; cols: number[]; popping: number[][]; mergeTargets: number[][]; }
export type Action = { type: 'place'; slot: 0 | 1 | 2; row: number; col: number } | { type: 'useRescue' } | { type: 'declineRescue' } | { type: 'endRun' };
export type GameEvent =
  | { type: 'placed'; slot: number; piece: Piece; cells: number[]; mergedInto: number[] }
  | { type: 'cleared'; rows: number[]; cols: number[]; cells: number[]; flavoursByCell: number[] }
  | { type: 'popped'; gloops: { flavour: Flavour; size: number; cells: number[]; bfs: number[] }[] }
  | { type: 'scored'; points: number; parts: ScoreParts; combo: number; mult: number }
  | { type: 'comboUp'; combo: number; tier: number } | { type: 'comboLost'; combo: number }
  | { type: 'allClear' } | { type: 'stageUp'; stage: number; newFlavour?: Flavour }
  | { type: 'dealt'; tray: Piece[] } | { type: 'rescueReady' } | { type: 'rescueOffered' } | { type: 'rescued'; poppedCells: number[] }
  | { type: 'zenShake'; poppedCells: number[] } | { type: 'stuck'; unfit: number[] }
  | { type: 'gameOver'; reason: 'stuck' | 'traysDone' | 'endRun' } | { type: 'bigGloop'; size: number };
