import type { GameState, ModeId } from '../core/types';

export const CURRENT_VERSION = 1;
export interface LifetimeStats {
  runs: Record<string, number>; bestClassic: number; bestExpert: number; linesCleared: number;
  extraCellsPopped: number; biggestPop: number; bestCombo: number; allClears: number;
  piecesPlaced: number; timePlayedMs: number; dailiesFinished: number; bestDaily: number;
}
export interface SaveV1 {
  v: 1; createdAt: number; tutorialDone: boolean;
  settings: { sfx: boolean; music: boolean; muted: boolean; haptics: boolean; reducedMotion: 'system' | 'on' | 'off'; cbPatterns: boolean };
  profile: { xp: number; level: number; stars: number; coins: number; coinsEarned: number };
  owned: { themes: string[]; skins: string[]; pops: string[]; modes: ModeId[] };
  equipped: { theme: string; skin: string; pop: string };
  best: { classic: number; expert: number };
  stats: LifetimeStats; recentClassic: number[]; achievements: Record<string, number>;
  daily: { records: Record<string, { score: number; finished: boolean; trays: number[]; bestCombo: number; lines: number; biggestPop: number; allClears: number; freezeUsed: number }>; finished: number; best: number };
  streak: { current: number; best: number; lastDay: string | null; freezes: number; frozenDays: string[] };
  weekly: { weekIndex: number; progress: number; claimed: boolean; runsWithCombo6: number };
  inProgress: GameState | null; dailyInProgress: GameState | null;
  firsts: Record<string, boolean>;
  ui: { runsFinished: number; seenTips: string[] };
}

export function defaultSave(createdAt = 0): SaveV1 {
  return { v: 1, createdAt, tutorialDone: false,
    settings: { sfx: true, music: true, muted: false, haptics: true, reducedMotion: 'system', cbPatterns: false },
    profile: { xp: 0, level: 1, stars: 0, coins: 0, coinsEarned: 0 },
    owned: { themes: ['midnight'], skins: ['plain'], pops: ['sparkles'], modes: ['classic', 'daily'] },
    equipped: { theme: 'midnight', skin: 'plain', pop: 'sparkles' }, best: { classic: 0, expert: 0 },
    stats: { runs: {}, bestClassic: 0, bestExpert: 0, linesCleared: 0, extraCellsPopped: 0, biggestPop: 0, bestCombo: 0, allClears: 0, piecesPlaced: 0, timePlayedMs: 0, dailiesFinished: 0, bestDaily: 0 },
    recentClassic: [], achievements: {}, daily: { records: {}, finished: 0, best: 0 },
    streak: { current: 0, best: 0, lastDay: null, freezes: 0, frozenDays: [] }, weekly: { weekIndex: 0, progress: 0, claimed: false, runsWithCombo6: 0 },
    firsts: {}, inProgress: null, dailyInProgress: null, ui: { runsFinished: 0, seenTips: [] } };
}
