import { nextInt, sfc32 } from './rng';
import { cyrb128 } from './hash';
import type { Flavour } from './types';

export type MissionSlot = 'A' | 'B' | 'C';
export type MissionKind = 'lines' | 'pieces' | 'popped' | 'bigPops' | 'combo' | 'multi' | 'score' | 'runs' | 'adventureWins' | 'flavour' | 'triple' | 'cross' | 'hugePops' | 'allClear' | 'advStars' | 'totalScore';
export interface MissionDef { id: string; slot: MissionSlot; target: number; kind: MissionKind; flavour?: Flavour; needs?: 'adventure' | 'advstars6'; }
export const MISSIONS: readonly MissionDef[] = [
 {id:'lines15',slot:'A',target:15,kind:'lines'}, {id:'pieces40',slot:'A',target:40,kind:'pieces'}, {id:'gloop25',slot:'A',target:25,kind:'popped'}, {id:'bigpop1',slot:'A',target:1,kind:'bigPops'}, {id:'combo3',slot:'A',target:3,kind:'combo'}, {id:'double1',slot:'A',target:1,kind:'multi'}, {id:'score3k',slot:'A',target:3000,kind:'score'}, {id:'runs2',slot:'A',target:2,kind:'runs'}, {id:'advwin1',slot:'A',target:1,kind:'adventureWins',needs:'adventure'}, {id:'cherry20',slot:'A',target:20,kind:'flavour',flavour:1},
 {id:'lines40',slot:'B',target:40,kind:'lines'}, {id:'blueberry40',slot:'B',target:40,kind:'flavour',flavour:5}, {id:'combo6',slot:'B',target:6,kind:'combo'}, {id:'bigpop3',slot:'B',target:3,kind:'bigPops'}, {id:'score10k',slot:'B',target:10000,kind:'score'}, {id:'triple1',slot:'B',target:1,kind:'triple'}, {id:'cross3',slot:'B',target:3,kind:'cross'}, {id:'advwin3',slot:'B',target:3,kind:'adventureWins',needs:'adventure'}, {id:'adv3star',slot:'B',target:1,kind:'adventureWins',needs:'adventure'}, {id:'orange40',slot:'B',target:40,kind:'flavour',flavour:2},
 {id:'lines80',slot:'C',target:80,kind:'lines'}, {id:'hugepop1',slot:'C',target:1,kind:'hugePops'}, {id:'combo10',slot:'C',target:10,kind:'combo'}, {id:'score20k',slot:'C',target:20000,kind:'score'}, {id:'allclear1',slot:'C',target:1,kind:'allClear'}, {id:'multi10',slot:'C',target:10,kind:'multi'}, {id:'lemon70',slot:'C',target:70,kind:'flavour',flavour:3}, {id:'advstars6',slot:'C',target:6,kind:'advStars',needs:'advstars6'}, {id:'score50k',slot:'C',target:50000,kind:'totalScore'},
];
const POOLS: Readonly<Record<MissionSlot, readonly MissionDef[]>> = { A: MISSIONS.filter(m=>m.slot==='A'), B: MISSIONS.filter(m=>m.slot==='B'), C: MISSIONS.filter(m=>m.slot==='C') };
export function deck(slot: MissionSlot, cycle: number): MissionDef[] {
 const result = [...POOLS[slot]]; const [a,b,c,d] = cyrb128(`gloop-pop/missions/v1/${slot}/${cycle}`); const rng = {a,b,c,d}; for(let i=0;i<12;i+=1)sfc32(rng);
 for(let i=result.length-1;i>0;i-=1){const j=nextInt(rng,i+1); [result[i],result[j]]=[result[j]!,result[i]!];} return result;
}
export function missionAt(slot: MissionSlot, walk: number): MissionDef {
 const pool = POOLS[slot]; const size=pool.length; const safe=Math.max(0,Math.floor(walk)); return deck(slot,Math.floor(safe/size))[safe%size]!;
}
export function issue(slot: MissionSlot, walk: number, available: (mission: MissionDef)=>boolean, shownToday: readonly string[]): { mission: MissionDef; pos: number } {
 const size=POOLS[slot].length; for(let offset=0;offset<2*size;offset+=1){const pos=walk+offset; const mission=missionAt(slot,pos); if(available(mission)&&!shownToday.includes(mission.id))return {mission,pos};}
 return {mission:POOLS[slot][0]!,pos:walk};
}
export function missionPool(slot: MissionSlot): readonly MissionDef[] { return POOLS[slot]; }
