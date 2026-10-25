import { CURRENT_VERSION, defaultSave, type SaveV1 } from './saveSchema';
import type { GameState } from '../core/types';
import { PIECES } from '../core/pieces';

const themeIds = new Set(['midnight', 'sunset', 'aquarium', 'observatory', 'kitchen', 'snowglobe', 'dawn']);
const skinIds = new Set(['plain', 'googly', 'freckles', 'catears', 'glasses', 'mustache', 'bowtie', 'crown']);
const popIds = new Set(['sparkles', 'hearts', 'stars', 'bubbles', 'fireworks', 'confetti']);
const modeIds = new Set(['classic', 'expert', 'zen', 'daily', 'tutorial']);

export function migrate(raw: unknown): SaveV1 {
  if (!isRecord(raw)) return defaultSave();
  const version = number(raw.v, 0);
  if (version > CURRENT_VERSION) return defaultSave();
  if (version === 0) {
    const base = defaultSave(); base.best.classic = integer(raw.best); base.profile.coins = integer(raw.coins); return sanitize(base);
  }
  return sanitize(raw as unknown as SaveV1);
}

export function sanitize(input: SaveV1): SaveV1 {
  const base = defaultSave(integer(input.createdAt));
  const source = input;
  base.tutorialDone = source.tutorialDone === true;
  if (source.settings) {
    base.settings = { ...base.settings, sfx: source.settings.sfx !== false, music: source.settings.music !== false, muted: source.settings.muted === true,
      haptics: source.settings.haptics !== false, reducedMotion: ['system', 'on', 'off'].includes(source.settings.reducedMotion) ? source.settings.reducedMotion : 'system', cbPatterns: source.settings.cbPatterns === true };
  }
  if (source.profile) base.profile = { xp: integer(source.profile.xp), level: Math.max(1, Math.min(50, integer(source.profile.level, 1))), stars: integer(source.profile.stars), coins: integer(source.profile.coins), coinsEarned: integer(source.profile.coinsEarned) };
  if (source.owned) base.owned = { themes: cleanIds(source.owned.themes, themeIds, ['midnight']), skins: cleanIds(source.owned.skins, skinIds, ['plain']), pops: cleanIds(source.owned.pops, popIds, ['sparkles']), modes: cleanIds(source.owned.modes, modeIds, ['classic', 'daily']) as SaveV1['owned']['modes'] };
  if (source.equipped) base.equipped = { theme: base.owned.themes.includes(source.equipped.theme) ? source.equipped.theme : 'midnight', skin: base.owned.skins.includes(source.equipped.skin) ? source.equipped.skin : 'plain', pop: base.owned.pops.includes(source.equipped.pop) ? source.equipped.pop : 'sparkles' };
  if (source.best) base.best = { classic: integer(source.best.classic), expert: integer(source.best.expert) };
  if (source.stats) base.stats = { runs: cleanCountMap(source.stats.runs), bestClassic: integer(source.stats.bestClassic), bestExpert: integer(source.stats.bestExpert), linesCleared: integer(source.stats.linesCleared), extraCellsPopped: integer(source.stats.extraCellsPopped), biggestPop: integer(source.stats.biggestPop), bestCombo: integer(source.stats.bestCombo), allClears: integer(source.stats.allClears), piecesPlaced: integer(source.stats.piecesPlaced), timePlayedMs: integer(source.stats.timePlayedMs), dailiesFinished: integer(source.stats.dailiesFinished), bestDaily: integer(source.stats.bestDaily) };
  if (source.recentClassic) base.recentClassic = source.recentClassic.filter(Number.isFinite).map(integer).slice(-20);
  if (source.achievements) base.achievements = cleanCountMap(source.achievements);
  if (source.daily) base.daily = { records: isRecord(source.daily.records) ? source.daily.records : {}, finished: integer(source.daily.finished), best: integer(source.daily.best) };
  if (source.streak) base.streak = { current: integer(source.streak.current), best: integer(source.streak.best), lastDay: typeof source.streak.lastDay === 'string' ? source.streak.lastDay : null, freezes: integer(source.streak.freezes), frozenDays: Array.isArray(source.streak.frozenDays) ? source.streak.frozenDays.filter((v): v is string => typeof v === 'string').slice(-60) : [] };
  if (source.weekly) base.weekly = { weekIndex: integer(source.weekly.weekIndex), progress: integer(source.weekly.progress), claimed: source.weekly.claimed === true, runsWithCombo6: integer(source.weekly.runsWithCombo6) };
  base.inProgress = validGame(source.inProgress) ? source.inProgress : null;
  base.dailyInProgress = validGame(source.dailyInProgress) && source.dailyInProgress.mode === 'daily' ? source.dailyInProgress : null;
  if (source.ui) base.ui = { runsFinished: integer(source.ui.runsFinished), seenTips: Array.isArray(source.ui.seenTips) ? source.ui.seenTips.filter((v): v is string => typeof v === 'string') : [] };
  base.best.classic = Math.max(base.best.classic, base.stats.bestClassic); base.best.expert = Math.max(base.best.expert, base.stats.bestExpert);
  return base;
}

function validGame(value: unknown): value is GameState {
  if (!isRecord(value) || value.v !== 1 || !modeIds.has(String(value.mode)) || !Array.isArray(value.board) || value.board.length !== 64 || !Array.isArray(value.tray) || value.tray.length !== 3) return false;
  return value.board.every((cell) => Number.isInteger(cell) && cell >= 0 && cell <= 7) && value.tray.every((piece) => piece === null || (isRecord(piece) && Number.isInteger(piece.defId) && Number(piece.defId) >= 0 && Number(piece.defId) < PIECES.length && Number.isInteger(piece.flavour) && Number(piece.flavour) >= 1 && Number(piece.flavour) <= 7));
}
function cleanIds(values: unknown, allowed: Set<string>, defaults: string[]): string[] { return [...new Set([...defaults, ...(Array.isArray(values) ? values.filter((value): value is string => typeof value === 'string' && allowed.has(value)) : [])])]; }
function cleanCountMap(value: unknown): Record<string, number> { if (!isRecord(value)) return {}; return Object.fromEntries(Object.entries(value).filter(([, v]) => Number.isFinite(v)).map(([key, v]) => [key, integer(v)])); }
function integer(value: unknown, fallback = 0): number { return Number.isFinite(value) ? Math.max(0, Math.floor(Number(value))) : fallback; }
function number(value: unknown, fallback: number): number { return Number.isFinite(value) ? Number(value) : fallback; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
