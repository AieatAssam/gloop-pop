import { describe, expect, it } from 'vitest';
import type { GameEvent } from '../core/types';
import { achievementProgress, ACHIEVEMENTS, grantAchievements } from './achievements';
import { CATALOGUE } from './catalogue';
import { defaultSave } from './saveSchema';

const events: GameEvent[] = [
 {type:'cleared',rows:[0,1,2,3],cols:[0,1,2,3],cells:Array.from({length:64},(_,i)=>i),flavoursByCell:Array(64).fill(1)},
 {type:'popped',gloops:[{flavour:1,size:25,cells:Array(25).fill(0),bfs:[]}]},{type:'comboUp',combo:20,tier:4},{type:'allClear'},{type:'bigGloop',size:12},
];
describe('achievements',()=>{
 it('defines the 40 original achievements and Rivals as number 41',()=>{expect(ACHIEVEMENTS).toHaveLength(41);expect(ACHIEVEMENTS[ACHIEVEMENTS.length - 1]?.id).toBe('rivals');});
 it('has a trigger fixture for every achievement',()=>{
  const save=defaultSave();save.stats.linesCleared=5000;save.stats.extraCellsPopped=5000;save.achievements.bigPopCount=50;save.stats.allClears=10;save.stats.dailiesFinished=30;save.streak.best=30;save.ui.runsFinished=100;save.profile.level=50;save.owned.themes=CATALOGUE.filter(x=>x.kind==='theme').map(x=>x.id);save.owned.skins=CATALOGUE.filter(x=>x.kind==='skin').map(x=>x.id);save.owned.pops=CATALOGUE.filter(x=>x.kind==='pop').map(x=>x.id);
  for(const def of ACHIEVEMENTS) expect(achievementProgress(def.id,save,{mode:def.id==='expert25k'?'expert':'classic',score:100000,events,rescueUsed:false,rescuedLine:true,friendBeaten:true,weeklyClaimed:true,closeCall:true}).met,def.id).toBe(true);
 });
 it('awards each newly met achievement once and adds its coins',()=>{
  const save=defaultSave();const facts={mode:'classic' as const,score:100000,events,rescueUsed:false,rescuedLine:true,friendBeaten:true,weeklyClaimed:true,closeCall:true};
  const first=grantAchievements(save,facts);expect(first.unlocked.length).toBeGreaterThan(0);expect(first.save.profile.coins).toBe(first.unlocked.reduce((n,a)=>n+a.coins,0));
  const again=grantAchievements(first.save,facts);expect(again.unlocked).toHaveLength(0);
 });
});
