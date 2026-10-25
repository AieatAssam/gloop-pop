import { describe, expect, it } from 'vitest';
import { newGame } from '../core/game';
import { issue } from '../core/missions';
import type { GameEvent, GameState } from '../core/types';
import { defaultSave } from './saveSchema';
import { addMissionProgress, available, claimMission, missionNearMiss, rerollMission, rollDay } from './missions';

function withMission(save: ReturnType<typeof defaultSave>, id: string, progress = 0) {
 const slot = save.missions.slots.findIndex((value) => value.id === id); if (slot >= 0) save.missions.slots[slot] = { id, pos: 0, progress, claimed: false, issued: '2026-10-25' };
 else save.missions.slots[0] = { id, pos: 0, progress, claimed: false, issued: '2026-10-25' };
 return save;
}
function state(mode: GameState['mode'] = 'classic'): GameState { const value = newGame(mode, 'missions-test').state; value.score=50_000; value.bestCombo=10; return value; }

describe('mission meta rules', () => {
 it('skips Adventure missions while locked and only offers advstars6 when six stars remain', () => {
  const save = defaultSave(); expect(available('advwin1',save)).toBe(false); for(const slot of ['A','B','C'] as const) expect(issue(slot,0,(mission)=>available(mission.id,save),[]).mission.needs).not.toBe('adventure'); save.owned.modes.push('adventure'); expect(available('advwin1',save)).toBe(true); save.adventure.frontier=120; for(let n=1;n<120;n+=1) save.adventure.levels[String(n)]={stars:3,wins:1,losses:0,lossRun:0,bestScore:0}; expect(available('advstars6',save)).toBe(false);
 });
 it('rolls only claimed slots, keeps unfinished and done unclaimed work, including across missed days', () => {
  let save=rollDay(defaultSave(),'2026-10-25'); save.missions.slots=[{id:'lines15',pos:0,progress:3,claimed:false,issued:'2026-10-25'},{id:'lines40',pos:0,progress:40,claimed:true,issued:'2026-10-25'},{id:'lines80',pos:0,progress:80,claimed:false,issued:'2026-10-25'}]; save=rollDay(save,'2026-10-30'); expect(save.missions.slots[0]?.progress).toBe(3); expect(save.missions.slots[2]?.progress).toBe(80); expect(save.missions.slots[1]?.id).not.toBe('lines40'); expect(save.missions.slots[1]?.progress).toBe(0); expect(claimMission(save,2).coins).toBe(80);
 });
 it('allows one change per UTC day and permits another after the next roll', () => {
  const save=rollDay(defaultSave(),'2026-10-25'); const id=save.missions.slots[0]!.id; const changed=rerollMission(save,0,'2026-10-25'); expect(changed.missions.slots[0]?.id).not.toBe(id); expect(changed.missions.shownToday).toContain(id); expect(changed.missions.shownToday).toContain(changed.missions.slots[0]?.id); expect(rerollMission(changed,1,'2026-10-25')).toBe(changed); const tomorrow=rollDay(changed,'2026-10-26'); expect(rerollMission(tomorrow,0,'2026-10-26')).not.toBe(tomorrow);
 });
 it('counts placement, lines, pops, flavour cells and non-Zen score, while excluding Zen score', () => {
  const clear: GameEvent={type:'cleared',rows:[0,1,2],cols:[0],cells:Array.from({length:32},(_,i)=>i),flavoursByCell:Array.from({length:32},(_,i)=>i<8?1:i<16?5:4)};
  const pop: GameEvent={type:'popped',gloops:[{flavour:1,size:10,cells:Array.from({length:10},(_,i)=>32+i),bfs:[]},{flavour:5,size:15,cells:Array.from({length:15},(_,i)=>42+i),bfs:[]}]};
  const events: GameEvent[]=[{type:'placed',slot:0,piece:{defId:0,flavour:1},cells:[0],mergedInto:[]},clear,pop,{type:'scored',points:500,parts:{place:0,lineBase:0,pop:0,bigPopBonus:0,allClear:0},combo:1,mult:1},{type:'comboUp',combo:10,tier:3},{type:'allClear'},{type:'gameOver',reason:'stuck'},{type:'levelWon',level:1,movesLeft:2,stars:3}];
  const expected: Record<string,number>={lines15:4,pieces40:1,gloop25:25,bigpop1:1,combo3:3,double1:1,score3k:3000,runs2:1,advwin1:1,cherry20:18,lines40:4,blueberry40:23,combo6:6,bigpop3:2,score10k:10000,triple1:1,cross3:1,advwin3:1,adv3star:1,orange40:0,lines80:4,hugepop1:1,combo10:10,score20k:20000,allclear1:1,multi10:1,lemon70:0,advstars6:3,score50k:500};
  for(const [id,amount] of Object.entries(expected)){const save=withMission(rollDay(defaultSave(),'2026-10-25'),id);const result=addMissionProgress(save,state(),events);expect(result.save.missions.slots.find((slot)=>slot.id===id)?.progress).toBe(amount);}
  for(const id of ['score3k','score10k','score20k','score50k']) {const zen=addMissionProgress(withMission(rollDay(defaultSave(),'2026-10-25'),id),state('zen'),events);expect(zen.save.missions.slots.find((slot)=>slot.id===id)?.progress).toBe(0);}
 });
 it('emits the done notification only on the transition to complete', () => {
  const save=withMission(rollDay(defaultSave(),'2026-10-25'),'lines15',14); const events:GameEvent[]=[{type:'cleared',rows:[0],cols:[],cells:Array.from({length:8},(_,index)=>index),flavoursByCell:Array(8).fill(1)}];
  const first=addMissionProgress(save,state(),events); expect(first.done.map((mission)=>mission.id)).toEqual(['lines15']); expect(addMissionProgress(first.save,state(),events).done).toEqual([]);
 });
 it('claims once, pays the 30/50/80 reward and the set bonus on the third claim', () => {
  const save=rollDay(defaultSave(),'2026-10-25'); save.missions.slots=[{id:'lines15',pos:0,progress:15,claimed:false,issued:'2026-10-25'},{id:'lines40',pos:0,progress:40,claimed:false,issued:'2026-10-25'},{id:'lines80',pos:0,progress:80,claimed:false,issued:'2026-10-25'}];
  const first=claimMission(save,0); expect(first.coins).toBe(30); expect(claimMission(first.save,0).coins).toBe(0); const second=claimMission(first.save,1); const third=claimMission(second.save,2); expect(third.setBonus).toBe(true); expect(third.coins).toBe(130); expect(third.xp).toBe(110); expect(third.save.missions.finished).toBe(3); expect(third.save.achievements.missions10).toBeUndefined(); expect(third.save.missions.setPaid).toBe(true); expect(rollDay(third.save,'2026-10-26').missions.setPaid).toBe(false);
 });
 it('unlocks mission achievements at 10 and 100 claims', () => {
  for(const [count,id] of [[10,'missions10'],[100,'missions100']] as const) { const save=rollDay(defaultSave(),'2026-10-25'); save.missions.finished=count-1; save.missions.slots=[{id:'lines15',pos:0,progress:15,claimed:false,issued:'2026-10-25'},{id:'lines40',pos:0,progress:0,claimed:false,issued:'2026-10-25'},{id:'lines80',pos:0,progress:0,claimed:false,issued:'2026-10-25'}]; expect(claimMission(save,0).save.achievements[id]).toBe(1); }
 });
 it('returns the nearest mission at 80 percent without expiring unfinished work', () => {
  const save=withMission(rollDay(defaultSave(),'2026-10-25'),'lines15',13); expect(missionNearMiss(save)).toMatchObject({remaining:2,id:'lines15'});
 });
});
