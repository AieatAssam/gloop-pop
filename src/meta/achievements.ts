import type { GameEvent, ModeId } from '../core/types';
import type { SaveV2 } from './saveSchema';

export type AchievementCategory = 'lines' | 'pops' | 'combo' | 'score' | 'daily' | 'streak' | 'misc' | 'collection';
export interface AchievementDef { id: string; coins: 25 | 50 | 100; category: AchievementCategory; }
// spec-note: Rivals is defined and can be evaluated from this fact; M4.6 will supply it from challenge sessions.
export interface AchievementFacts { mode?: ModeId; events?: readonly GameEvent[]; score?: number; rescueUsed?: boolean; rescuedLine?: boolean; closeCall?: boolean; friendBeaten?: boolean; weeklyClaimed?: boolean; }
const rows: readonly [string, AchievementCategory, 25 | 50 | 100][] = [
 ['first_clear','lines',25],['double','lines',25],['triple','lines',50],['quad','lines',100],['crossroads','lines',25],['first_pop','pops',25],['big_pop','pops',25],['huge_pop','pops',50],['mega_pop','pops',100],['big_pop_pro','pops',50],['long_gloop','pops',25],['one_flavour','lines',50],['spotless','lines',50],['clean_freak','lines',100],['combo5','combo',25],['combo10','combo',50],['combo20','combo',100],['score5k','score',25],['score20k','score',50],['score50k','score',100],['score100k','score',100],['expert25k','score',100],['close_call','lines',50],['no_help','score',50],['saved','misc',25],['lines100','lines',25],['lines1000','lines',50],['lines5000','lines',100],['pops500','pops',25],['pops5000','pops',100],['runs10','misc',25],['runs100','misc',50],['daily1','daily',25],['daily30','daily',100],['streak7','streak',50],['streak30','streak',100],['weekly1','misc',50],['level10','misc',25],['level50','misc',100],['collector','collection',100],['rivals','misc',50],
];
// Lifetime counters: the only achievements whose progress means something on the Achievements screen (design §15: "progress when counter-based").
export const COUNTER_ACHIEVEMENTS: ReadonlySet<string> = new Set(['big_pop_pro', 'clean_freak', 'lines100', 'lines1000', 'lines5000', 'pops500', 'pops5000', 'runs10', 'runs100', 'daily30', 'streak7', 'streak30', 'level10', 'level50', 'collector']);
export const ACHIEVEMENTS: readonly AchievementDef[] = rows.map(([id, category, coins]) => ({ id, category, coins }));

export function achievementProgress(id: string, save: SaveV2, facts: AchievementFacts = {}): { current: number; target: number; met: boolean } {
 const events = facts.events ?? []; const clears = events.filter((e) => e.type === 'cleared');
 const pops = events.filter((e) => e.type === 'popped').flatMap((e) => e.gloops.map((g) => g.size));
 const combos = events.filter((e) => e.type === 'comboUp').map((e) => e.combo);
 const lines = clears.reduce((n, e) => n + (e.type === 'cleared' ? e.rows.length + e.cols.length : 0), 0);
 let current = 0; let target = 1; let met = false;
 const set = (value: number, goal: number): void => { current = value; target = goal; met = value >= goal; };
 switch (id) {
  case 'first_clear': set(lines,1); break; case 'double': set(maxLines(clears),2); break; case 'triple': set(maxLines(clears),3); break; case 'quad': set(maxLines(clears),4); break;
  case 'crossroads': set(clears.some((e) => e.type === 'cleared' && e.rows.length > 0 && e.cols.length > 0) ? 1 : 0,1); break;
  case 'first_pop': set(pops.length,1); break; case 'big_pop': set(Math.max(0,...pops),8); break; case 'huge_pop': set(Math.max(0,...pops),15); break; case 'mega_pop': set(Math.max(0,...pops),24); break;
  case 'big_pop_pro': set(save.achievements.bigPopCount ?? 0,50); break; case 'long_gloop': set(events.reduce((v,e) => e.type === 'bigGloop' ? Math.max(v,e.size) : v,0),12); break;
  case 'one_flavour': set(clears.some((e) => e.type === 'cleared' && singleFlavour(e.flavoursByCell)) ? 1 : 0,1); break; case 'spotless': set(events.some((e) => e.type === 'allClear') ? 1 : 0,1); break; case 'clean_freak': set(save.stats.allClears,10); break;
  case 'combo5': set(Math.max(0,...combos),5); break; case 'combo10': set(Math.max(0,...combos),10); break; case 'combo20': set(Math.max(0,...combos),20); break;
  case 'score5k': set(facts.mode === 'classic' ? facts.score ?? 0 : 0,5000); break; case 'score20k': set(facts.mode === 'classic' ? facts.score ?? 0 : 0,20000); break; case 'score50k': set(facts.mode === 'classic' ? facts.score ?? 0 : 0,50000); break; case 'score100k': set(facts.mode === 'classic' ? facts.score ?? 0 : 0,100000); break; case 'expert25k': set(facts.mode === 'expert' ? facts.score ?? 0 : 0,25000); break;
  case 'close_call': set(facts.closeCall ? 1 : 0,1); break; case 'no_help': set(facts.mode === 'classic' && !facts.rescueUsed ? facts.score ?? 0 : 0,20000); break; case 'saved': set(facts.rescuedLine ? 1 : 0,1); break;
  case 'lines100': set(save.stats.linesCleared,100); break; case 'lines1000': set(save.stats.linesCleared,1000); break; case 'lines5000': set(save.stats.linesCleared,5000); break; case 'pops500': set(save.stats.extraCellsPopped,500); break; case 'pops5000': set(save.stats.extraCellsPopped,5000); break;
  case 'runs10': set(save.ui.runsFinished,10); break; case 'runs100': set(save.ui.runsFinished,100); break; case 'daily1': set(save.stats.dailiesFinished,1); break; case 'daily30': set(save.stats.dailiesFinished,30); break; case 'streak7': set(save.streak.best,7); break; case 'streak30': set(save.streak.best,30); break; case 'weekly1': set(facts.weeklyClaimed ? 1 : 0,1); break; case 'level10': set(save.profile.level,10); break; case 'level50': set(save.profile.level,50); break;
  case 'collector': set(save.owned.themes.length + save.owned.skins.length + save.owned.pops.length,21); break; case 'rivals': set(facts.friendBeaten ? 1 : 0,1); break;
  default: return { current:0,target:1,met:false };
 }
 return { current:Math.min(current,target), target, met };
}
export function grantAchievements(save: SaveV2, facts: AchievementFacts = {}): { save: SaveV2; unlocked: AchievementDef[] } {
 const next = structuredClone(save); const unlocked: AchievementDef[] = [];
 for (const def of ACHIEVEMENTS) if (!next.achievements[def.id] && achievementProgress(def.id,next,facts).met) { next.achievements[def.id]=1; next.profile.coins+=def.coins; next.profile.coinsEarned+=def.coins; unlocked.push(def); }
 return { save:next, unlocked };
}
function maxLines(events: readonly GameEvent[]): number { return events.reduce((max,e) => e.type === 'cleared' ? Math.max(max,e.rows.length+e.cols.length) : max,0); }
function singleFlavour(values: number[]): boolean { return values.length > 0 && values.every((value) => value === values[0]); }
