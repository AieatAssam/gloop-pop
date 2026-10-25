import type { GameEvent, GameState } from '../core/types';
import { dayNumber } from '../core/daily';
import { issue, missionAt, type MissionDef, type MissionSlot } from '../core/missions';
import { grantXp } from './progression';
import { grantAchievements } from './achievements';
import type { AchievementDef } from './achievements';
import type { SaveV2 } from './saveSchema';

const SLOTS: readonly MissionSlot[] = ['A', 'B', 'C'];
const rewards: Readonly<Record<MissionSlot, { coins: number; xp: number }>> = { A: { coins: 30, xp: 20 }, B: { coins: 50, xp: 40 }, C: { coins: 80, xp: 60 } };
export function available(id: string, save: SaveV2): boolean {
 const mission = missionAtId(id); if (!mission) return false;
 if (mission.needs === 'adventure' && !save.owned.modes.includes('adventure')) return false;
 if (mission.needs === 'advstars6') {
  if (!save.owned.modes.includes('adventure')) return false;
  // spec-note: Count unearned stars across won levels and the currently unlocked frontier level.
  const unlockedLevels = Math.min(120, save.adventure.frontier); let unearned = unlockedLevels * 3;
  for (let level = 1; level <= unlockedLevels; level += 1) unearned -= save.adventure.levels[String(level)]?.stars ?? 0;
  if (unearned < 6) return false;
 }
 return true;
}
function missionAtId(id: string): MissionDef | undefined {
 for (const slot of SLOTS) for (let pos = 0; pos < 29; pos += 1) { const mission = missionAt(slot, pos); if (mission.id === id) return mission; }
 return undefined;
}
export function rollDay(save: SaveV2, dayKey: string): SaveV2 {
 if (save.missions.day === dayKey) return save;
 const next = structuredClone(save); const dayPos = dayNumber(dayKey) - 1; const oldSlots = next.missions.slots; next.missions.shownToday = [];
 const slots = SLOTS.map((slot, index) => {
  const old = oldSlots[index];
  if (old && !old.claimed) return old;
  const issued = issue(slot, dayPos, (mission) => available(mission.id, next), next.missions.shownToday);
  next.missions.shownToday.push(issued.mission.id);
  return { id: issued.mission.id, pos: issued.pos, progress: 0, claimed: false, issued: dayKey };
 });
 next.missions.slots = slots; next.missions.day = dayKey; next.missions.rerollDay = null;
 if (slots.every((slot, index) => oldSlots[index]?.claimed)) next.missions.setPaid = false;
 return next;
}

export interface MissionProgressResult { save: SaveV2; done: MissionDef[] }
export function addMissionProgress(save: SaveV2, state: GameState, events: readonly GameEvent[]): MissionProgressResult {
 if (state.mode === 'tutorial' || !save.missions.slots.length) return { save, done: [] };
 const next = structuredClone(save); const done: MissionDef[] = [];
 const lines = events.reduce((sum, event) => sum + (event.type === 'cleared' ? event.rows.length + event.cols.length : 0), 0);
 const bigPops = events.reduce((sum, event) => sum + (event.type === 'popped' ? event.gloops.filter((gloop) => gloop.size >= 8).length : 0), 0);
 const hugePops = events.reduce((sum, event) => sum + (event.type === 'popped' ? event.gloops.filter((gloop) => gloop.size >= 15).length : 0), 0);
 const clearedCells = new Set<number>(); for (const event of events) if (event.type === 'cleared') event.cells.forEach((cell) => clearedCells.add(cell));
 const popped = events.reduce((sum, event) => sum + (event.type === 'popped' ? event.gloops.reduce((total, gloop) => total + gloop.cells.filter((cell) => !clearedCells.has(cell)).length, 0) : 0), 0);
 for (let index = 0; index < next.missions.slots.length; index += 1) {
  const slot = next.missions.slots[index]!; if (slot.claimed) continue; const mission = missionAtId(slot.id); if (!mission) continue;
  let amount = 0; const zenScore = state.mode === 'zen' && (mission.kind === 'score' || mission.kind === 'totalScore');
  if (!zenScore) switch (mission.kind) {
   case 'lines': amount = lines; break;
   case 'pieces': amount = events.filter((event) => event.type === 'placed').length; break;
   case 'popped': amount = popped; break;
   case 'bigPops': amount = bigPops; break;
   case 'hugePops': amount = hugePops; break;
   case 'combo': amount = Math.max(0, state.bestCombo); break;
   case 'multi': amount = events.filter((event) => event.type === 'cleared' && event.rows.length + event.cols.length >= 2).length; break;
   case 'score': amount = state.score; break;
   case 'runs': amount = events.some((event) => event.type === 'gameOver' || event.type === 'levelWon' || event.type === 'levelLost') ? 1 : 0; break;
   case 'adventureWins': amount = mission.id === 'adv3star' ? events.filter((event) => event.type === 'levelWon' && event.stars === 3).length : events.filter((event) => event.type === 'levelWon').length; break;
   case 'flavour': {
    for (const event of events) if (event.type === 'cleared') for (let cellIndex = 0; cellIndex < event.cells.length; cellIndex += 1) if (event.flavoursByCell[cellIndex] === mission.flavour) amount += 1;
    for (const event of events) if (event.type === 'popped') for (const gloop of event.gloops) if (gloop.flavour === mission.flavour) amount += gloop.cells.filter((cell) => !clearedCells.has(cell)).length;
    break;
   }
   case 'triple': amount = events.filter((event) => event.type === 'cleared' && event.rows.length + event.cols.length >= 3).length; break;
   case 'cross': amount = events.filter((event) => event.type === 'cleared' && event.rows.length > 0 && event.cols.length > 0).length; break;
   case 'allClear': amount = events.filter((event) => event.type === 'allClear').length; break;
   case 'advStars': amount = events.reduce((sum, event) => { if (event.type !== 'levelWon') return sum; const earned = next.adventure.levels[String(event.level)]?.stars ?? 0; return sum + Math.max(0, event.stars - earned); }, 0); break;
   case 'totalScore': amount = events.reduce((sum, event) => sum + (event.type === 'scored' ? event.points : 0), 0); break;
  }
  // spec-note: Run-scoped score and combo goals retain the best value reached in any run since issue.
  const progress = Math.min(mission.target, Math.max(slot.progress, (mission.kind === 'score' || mission.kind === 'combo') ? amount : slot.progress + amount));
  if (progress > slot.progress) { slot.progress = progress; if (progress >= mission.target) done.push(mission); }
 }
 return { save: next, done };
}

export function claimMission(save: SaveV2, slotIndex: number): { save: SaveV2; coins: number; xp: number; setBonus: boolean; levels: number[]; unlocked: AchievementDef[] } {
 const slot = save.missions.slots[slotIndex]; if (!slot || slot.claimed || slot.progress < (missionAtId(slot.id)?.target ?? Infinity)) return { save, coins: 0, xp: 0, setBonus: false, levels: [], unlocked: [] };
 const def = missionAtId(slot.id)!; const reward = rewards[def.slot]; const next = structuredClone(save); next.missions.slots[slotIndex]!.claimed = true; next.missions.finished += 1; next.stats.missionsDone += 1;
 const achievements = grantAchievements(next);
 let result = grantXp(achievements.save, reward.xp); result.save.profile.coins += reward.coins; result.save.profile.coinsEarned += reward.coins;
 let setBonus = false;
 if (result.save.missions.slots.length === 3 && result.save.missions.slots.every((item) => item.claimed) && !result.save.missions.setPaid) {
  result.save.missions.setPaid = true; result.save.profile.coins += 50; result.save.profile.coinsEarned += 50; const priorLevels = result.levels; const bonus = grantXp(result.save, 50); result = { ...bonus, coins: reward.coins + 50, levels: [...priorLevels, ...bonus.levels] }; setBonus = true;
 }
 return { save: result.save, coins: reward.coins + (setBonus ? 50 : 0), xp: reward.xp + (setBonus ? 50 : 0), setBonus, levels: result.levels, unlocked: achievements.unlocked };
}


export function rerollMission(save: SaveV2, slotIndex: number, dayKey: string): SaveV2 {
 const slot = save.missions.slots[slotIndex]; if (!slot || slot.claimed || slot.progress >= (missionAtId(slot.id)?.target ?? Infinity) || save.missions.rerollDay === dayKey) return save;
 const next = structuredClone(save); next.missions.shownToday.push(slot.id); const def = missionAtId(slot.id)!; const issued = issue(def.slot, slot.pos + 1, (mission) => available(mission.id, next), next.missions.shownToday);
 next.missions.slots[slotIndex] = { id: issued.mission.id, pos: issued.pos, progress: 0, claimed: false, issued: dayKey }; next.missions.shownToday.push(issued.mission.id); next.missions.rerollDay = dayKey; return next;
}

export function missionNearMiss(save: SaveV2): { remaining: number; target: number; id: string } | null {
 const candidates = save.missions.slots.flatMap((slot) => { const def = missionAtId(slot.id); if (!def || slot.claimed || slot.progress >= def.target || slot.progress < def.target * 0.8) return []; return [{ remaining: def.target - slot.progress, target: def.target, id: def.id }]; }).sort((a,b) => a.remaining-b.remaining);
 return candidates[0] ?? null;
}
