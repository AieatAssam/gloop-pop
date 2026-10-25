import { CURRENT_VERSION, defaultSave, type SaveV1, type SaveV2 } from './saveSchema';
import type { GameState } from '../core/types';
import { PIECES } from '../core/pieces';

const themeIds = new Set(['midnight', 'sunset', 'aquarium', 'observatory', 'kitchen', 'snowglobe', 'dawn']);
const skinIds = new Set(['plain', 'googly', 'freckles', 'catears', 'glasses', 'mustache', 'bowtie', 'crown']);
const popIds = new Set(['sparkles', 'hearts', 'stars', 'bubbles', 'fireworks', 'confetti']);
const modeIds = new Set(['classic', 'expert', 'zen', 'daily', 'tutorial', 'adventure']);
const missionIds = new Set(['lines15','pieces40','gloop25','bigpop1','combo3','double1','score3k','runs2','advwin1','cherry20','lines40','blueberry40','combo6','bigpop3','score10k','triple1','cross3','advwin3','adv3star','orange40','lines80','hugepop1','combo10','score20k','allclear1','multi10','lemon70','advstars6','score50k']);

export const migrations: Record<number, (value: Record<string, unknown>) => Record<string, unknown>> = {
  0: (raw) => { const base = defaultSave(); base.best.classic = integer(raw.best); base.profile.coins = integer(raw.coins); return base as unknown as Record<string, unknown>; },
  1: (raw) => migrateV1(raw as unknown as SaveV1) as unknown as Record<string, unknown>,
};

export function migrate(raw: unknown): SaveV2 {
  if (!isRecord(raw)) return defaultSave();
  const version = number(raw.v, 0);
  if (version > CURRENT_VERSION) return defaultSave();
  let value: Record<string, unknown> = raw;
  let current = version;
  while (current < CURRENT_VERSION) { value = migrations[current]?.(value) ?? value; current += 1; }
  return sanitize(value as unknown as SaveV2);
}

function migrateV1(input: SaveV1): SaveV2 {
  const base = defaultSave(input.createdAt);
  Object.assign(base, input, { v: 2 });
  base.stats = { ...base.stats, ...input.stats, adventureWins: 0, adventureLosses: 0, missionsDone: 0, targetsReached: 0, boostersUsed: 0 };
  if (base.profile.level >= 2) { base.owned.modes = [...new Set([...base.owned.modes, 'adventure' as const])]; base.adventure.boosters = { moves: 1, shuffle: 1, pop: 1 }; }
  return base;
}

export function sanitize(input: SaveV2): SaveV2 {
  const base = defaultSave(integer(input.createdAt));
  const source = input;
  base.tutorialDone = source.tutorialDone === true;
  if (source.settings) {
    base.settings = { ...base.settings, sfx: source.settings.sfx !== false, music: source.settings.music !== false,
      sfxVolume: clampVolume(source.settings.sfxVolume), musicVolume: clampVolume(source.settings.musicVolume), muted: source.settings.muted === true,
      haptics: source.settings.haptics !== false, reducedMotion: ['system', 'on', 'off'].includes(source.settings.reducedMotion) ? source.settings.reducedMotion : 'system', cbPatterns: source.settings.cbPatterns === true };
  }
  if (source.profile) base.profile = { xp: integer(source.profile.xp), level: Math.max(1, Math.min(50, integer(source.profile.level, 1))), stars: Math.min(3, integer(source.profile.stars)), coins: integer(source.profile.coins), coinsEarned: integer(source.profile.coinsEarned) };
  if (source.owned) base.owned = { themes: cleanIds(source.owned.themes, themeIds, ['midnight']), skins: cleanIds(source.owned.skins, skinIds, ['plain']), pops: cleanIds(source.owned.pops, popIds, ['sparkles']), modes: cleanIds(source.owned.modes, modeIds, ['classic', 'daily']) as SaveV2['owned']['modes'] };
  if (source.equipped) base.equipped = { theme: base.owned.themes.includes(source.equipped.theme) ? source.equipped.theme : 'midnight', skin: base.owned.skins.includes(source.equipped.skin) ? source.equipped.skin : 'plain', pop: base.owned.pops.includes(source.equipped.pop) ? source.equipped.pop : 'sparkles' };
  if (source.best) base.best = { classic: integer(source.best.classic), expert: integer(source.best.expert) };
  if (source.stats) base.stats = { runs: cleanCountMap(source.stats.runs), bestClassic: integer(source.stats.bestClassic), bestExpert: integer(source.stats.bestExpert), linesCleared: integer(source.stats.linesCleared), extraCellsPopped: integer(source.stats.extraCellsPopped), biggestPop: integer(source.stats.biggestPop), bestCombo: integer(source.stats.bestCombo), allClears: integer(source.stats.allClears), piecesPlaced: integer(source.stats.piecesPlaced), timePlayedMs: integer(source.stats.timePlayedMs), dailiesFinished: integer(source.stats.dailiesFinished), bestDaily: integer(source.stats.bestDaily), adventureWins: integer(source.stats.adventureWins), adventureLosses: integer(source.stats.adventureLosses), missionsDone: integer(source.stats.missionsDone), targetsReached: integer(source.stats.targetsReached), boostersUsed: integer(source.stats.boostersUsed) };
  if (source.recentClassic) base.recentClassic = source.recentClassic.filter(Number.isFinite).map(integer).slice(-20);
  if (source.achievements) base.achievements = cleanCountMap(source.achievements);
  if (source.daily) base.daily = { records: isRecord(source.daily.records) ? cleanDailyRecords(source.daily.records) : {}, finished: integer(source.daily.finished), best: integer(source.daily.best) };
  if (source.streak) base.streak = { current: integer(source.streak.current), best: integer(source.streak.best), lastDay: typeof source.streak.lastDay === 'string' ? source.streak.lastDay : null, freezes: integer(source.streak.freezes), frozenDays: Array.isArray(source.streak.frozenDays) ? source.streak.frozenDays.filter((v): v is string => typeof v === 'string').slice(-60) : [] };
  if (source.weekly) base.weekly = { weekIndex: integer(source.weekly.weekIndex), progress: integer(source.weekly.progress), claimed: source.weekly.claimed === true, runsWithCombo6: integer(source.weekly.runsWithCombo6) };
  if (source.firsts && isRecord(source.firsts)) base.firsts = Object.fromEntries(Object.entries(source.firsts).filter(([, v]) => v === true));
  base.inProgress = validGame(source.inProgress) ? source.inProgress : null;
  base.dailyInProgress = validGame(source.dailyInProgress) && source.dailyInProgress.mode === 'daily' ? source.dailyInProgress : null;
  if (source.adventure && isRecord(source.adventure)) {
    const levels = isRecord(source.adventure.levels) ? Object.fromEntries(Object.entries(source.adventure.levels).filter(([key, value]) => /^([1-9]|[1-9][0-9]|1[01][0-9]|120)$/.test(key) && isRecord(value)).map(([key, rawLevel]) => { const level = rawLevel as Record<string, unknown>; return [key, { stars: Math.min(3, integer(level.stars)) as 0 | 1 | 2 | 3, wins: integer(level.wins), losses: integer(level.losses), lossRun: integer(level.lossRun), bestScore: integer(level.bestScore) }]; })) : {};
    const high = Math.max(0, ...Object.entries(levels).filter(([, level]) => level.stars > 0).map(([key]) => Number(key))) + 1;
    const savedAttempt = source.adventure.inProgress;
    const attemptLevel = savedAttempt?.adventure?.level;
    base.adventure = { frontier: Math.max(high, Math.min(121, Math.max(1, integer(source.adventure.frontier, 1)))), levels, winStreak: integer(source.adventure.winStreak), bestWinStreak: integer(source.adventure.bestWinStreak), boosters: { moves: clampCount(source.adventure.boosters, 'moves'), shuffle: clampCount(source.adventure.boosters, 'shuffle'), pop: clampCount(source.adventure.boosters, 'pop') }, chaptersDone: cleanChapters(source.adventure.chaptersDone), chaptersAllStars: cleanChapters(source.adventure.chaptersAllStars), inProgress: validGame(savedAttempt) && savedAttempt.mode === 'adventure' && Number.isInteger(attemptLevel) && Number(attemptLevel) >= 1 && Number(attemptLevel) <= 120 ? savedAttempt : null };
  }
  if (source.missions && isRecord(source.missions)) base.missions = { day: typeof source.missions.day === 'string' ? source.missions.day : null, slots: Array.isArray(source.missions.slots) ? sanitizeMissionSlots(source.missions.slots) : [], rerollDay: typeof source.missions.rerollDay === 'string' ? source.missions.rerollDay : null, shownToday: Array.isArray(source.missions.shownToday) ? source.missions.shownToday.filter((id): id is string => typeof id === 'string' && missionIds.has(id)) : [], setPaid: source.missions.setPaid === true, finished: integer(source.missions.finished) };
  if (source.ui) base.ui = { runsFinished: integer(source.ui.runsFinished), seenTips: Array.isArray(source.ui.seenTips) ? source.ui.seenTips.filter((v): v is string => typeof v === 'string') : [] };
  base.best.classic = Math.max(base.best.classic, base.stats.bestClassic); base.best.expert = Math.max(base.best.expert, base.stats.bestExpert);
  base.v = 2; return base;
}


function sanitizeMissionSlots(input: unknown[]): SaveV2['missions']['slots'] {
  const slots: SaveV2['missions']['slots'] = [];
  slots.length = 3;
  for (let pos = 0; pos < 3; pos += 1) {
    const rawSlot = input[pos];
    if (!isRecord(rawSlot) || typeof rawSlot.id !== 'string' || !missionIds.has(rawSlot.id)) continue;
    slots[pos] = { id: rawSlot.id, pos, progress: Math.min(missionTarget(rawSlot.id), integer(rawSlot.progress)), claimed: rawSlot.claimed === true, issued: typeof rawSlot.issued === 'string' ? rawSlot.issued : '' };
  }
  let length = slots.length; while (length > 0 && slots[length - 1] === undefined) length -= 1;
  slots.length = length;
  return length === 0 ? [] : slots;
}

function cleanDailyRecords(records: Record<string, unknown>): SaveV1['daily']['records'] {
  return Object.fromEntries(Object.entries(records).filter((entry): entry is [string, Record<string, unknown>] => isRecord(entry[1])).map(([key, value]) => [key, {
    score: integer(value.score), finished: value.finished === true,
    trays: Array.isArray(value.trays) ? value.trays.map((item) => integer(item)).slice(0, 30) : [],
    bestCombo: integer(value.bestCombo), lines: integer(value.lines), biggestPop: integer(value.biggestPop), allClears: integer(value.allClears), freezeUsed: integer(value.freezeUsed),
  }]));
}

function validGame(value: unknown): value is GameState {
  if (!isRecord(value) || value.v !== 1 || !modeIds.has(String(value.mode)) || !Array.isArray(value.board) || value.board.length !== 64 || !Array.isArray(value.tray) || value.tray.length !== 3) return false;
  return value.board.every((cell) => Number.isInteger(cell) && cell >= 0 && (cell <= 7 || (value.mode === 'adventure' && (cell === 8 || cell === 9)))) && value.tray.every((piece) => piece === null || (isRecord(piece) && Number.isInteger(piece.defId) && Number(piece.defId) >= 0 && Number(piece.defId) < PIECES.length && Number.isInteger(piece.flavour) && Number(piece.flavour) >= 1 && Number(piece.flavour) <= 7));
}
function clampCount(source: unknown, key: string): number { return Math.min(5, integer(isRecord(source) ? source[key] : 0)); }
function cleanChapters(source: unknown): number[] { return Array.isArray(source) ? [...new Set(source.filter((n): n is number => Number.isInteger(n) && n >= 1 && n <= 6))] : []; }
function missionTarget(id: string): number { return ({ lines15: 15, pieces40: 40, gloop25: 25, bigpop1: 1, combo3: 3, double1: 1, score3k: 3000, runs2: 2, advwin1: 1, cherry20: 20, lines40: 40, blueberry40: 40, combo6: 6, bigpop3: 3, score10k: 10000, triple1: 1, cross3: 3, advwin3: 3, adv3star: 1, orange40: 40, lines80: 80, hugepop1: 1, combo10: 10, score20k: 20000, allclear1: 1, multi10: 10, lemon70: 70, advstars6: 6, score50k: 50000 } as Record<string, number>)[id] ?? 0; }
function cleanIds(values: unknown, allowed: Set<string>, defaults: string[]): string[] { return [...new Set([...defaults, ...(Array.isArray(values) ? values.filter((value): value is string => typeof value === 'string' && allowed.has(value)) : [])])]; }
function cleanCountMap(value: unknown): Record<string, number> { if (!isRecord(value)) return {}; return Object.fromEntries(Object.entries(value).filter(([, v]) => Number.isFinite(v)).map(([key, v]) => [key, integer(v)])); }
function integer(value: unknown, fallback = 0): number { return Number.isFinite(value) ? Math.max(0, Math.floor(Number(value))) : fallback; }
function clampVolume(value: unknown): number { return Number.isFinite(value) ? Math.max(0, Math.min(1, Number(value))) : 1; }
function number(value: unknown, fallback: number): number { return Number.isFinite(value) ? Number(value) : fallback; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
