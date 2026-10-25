import { dealTray } from './generator';
import { levelParams, buildLevel, type LevelDef } from './levels';
import { seededRng } from './rng';
import { components } from './gloops';
import { step as classicStep, fitsAnywhere } from './game';
import type { Action, GameEvent, GameState } from './types';

export function newAdventureGame(def: LevelDef, options: { bonusMoves: number; boosters: { shuffle: number; pop: number }; freeShuffle: boolean }): { state: GameState; events: GameEvent[] } {
  const built = buildLevel(def.n, def.s); const p=levelParams(def.n); const rng=seededRng(`gloop-pop/adventure/v1/${def.n}/${def.s}/trays`);
  const dealt=dealTray(built.board.split('').map(Number),rng,p.stage,{weights:undefined,flavours:Array.from({length:p.flavours},(_,i)=>(i+1) as 1|2|3|4|5|6|7),f2:p.f2});
  const state:GameState={v:1,mode:'adventure',seed:`gloop-pop/adventure/v1/${def.n}/${def.s}`,rng,board:built.board.split('').map(Number),tray:dealt.tray,traysDealt:1,score:0,combo:0,fuse:0,bestCombo:0,stage:p.stage,linesCleared:0,rescue:{charge:0,ready:false,used:false},status:'playing',moves:0,stats:{placements:0,pops:0,biggestPop:0,allClears:0,bigPops:0,hugePops:0,megaPops:0,multiClears:0,solverTimeMs:0,f2Fallbacks:0},adventure:{level:def.n,moveLimit:def.moves,bonusMoves:options.bonusMoves,movesLeft:def.moves+options.bonusMoves,goals:def.goals.map(g=>({...g,progress:0})),s2:def.s2,s3:def.s3,stage:p.stage,flavours:p.flavours,f2:p.f2,boosters:{shuffle:'none',pop:'none',freeShuffle:options.freeShuffle},result:null}};
  return {state,events:[{type:'dealt',tray:dealt.tray}]};
}

export function stepAdventure(state:GameState,action:Action):{state:GameState;events:GameEvent[]} {
  const a=state.adventure; if(!a||a.result)return {state,events:[]};
  if(action.type==='endRun'){const next=copyState(state);const reason='gaveUp' as const;next.adventure!.result={won:false,reason,movesLeft:a.movesLeft,stars:0};next.status='over';return{state:next,events:[{type:'levelLost',level:a.level,reason}]};}
  if(action.type==='booster'){
    const next=copyState(state); if(action.id==='shuffle'&&a.boosters.shuffle==='armed'){const deal=dealTray(next.board,next.rng,a.stage,{f2:a.f2,flavours:flavours(a.flavours)});next.tray=deal.tray;next.adventure!.boosters.shuffle='used';return{state:next,events:[{type:'dealt',tray:deal.tray},{type:'boosterUsed',id:'shuffle'}]};}
    if(action.id==='pop'&&a.boosters.pop==='armed'){const g=components(state.board).sort((x,y)=>y.cells.length-x.cells.length||(x.cells[0]??64)-(y.cells[0]??64))[0];if(g){const board=[...state.board];for(const i of g.cells)board[i]=0;next.board=board;next.adventure!.boosters.pop='used';return{state:next,events:[{type:'boosterUsed',id:'pop',poppedCells:g.cells}]};}}
    return {state,events:[]};
  }
  if(action.type!=='place')return{state,events:[]};
  const classic={...state,mode:'classic' as const,adventure:undefined};const result=classicStep(classic,action);const next={...result.state,mode:'adventure' as const,adventure:{...a,goals:a.goals.map(g=>({...g})),boosters:{...a.boosters},movesLeft:a.movesLeft-1},rescue:{charge:0,ready:false,used:false}};const events=[...result.events.filter(e=>e.type!=='stageUp'&&e.type!=='rescueOffered'&&e.type!=='rescueReady')];
  const cleared=events.find((e):e is Extract<GameEvent,{type:'cleared'}>=>e.type==='cleared');const popped=events.find((e):e is Extract<GameEvent,{type:'popped'}>=>e.type==='popped');
  for(let i=0;i<next.adventure.goals.length;i++){const g=next.adventure.goals[i]!;let value=g.progress;if(g.kind==='L')value+=(cleared?.rows.length??0)+(cleared?.cols.length??0);if(g.kind==='S')value=next.score;if(g.kind==='F')value+=(cleared?.flavoursByCell.filter(x=>x===g.flavour).length??0)+(popped?.gloops.filter(x=>x.flavour===g.flavour).reduce((sum,x)=>sum+x.size,0)??0);if(g.kind==='B')value+=popped?.gloops.filter(x=>x.size>=8).length??0;if(g.kind==='M'&&(cleared?.rows.length??0)+(cleared?.cols.length??0)>=2)value+=1;if(g.kind==='C')value+=events.find(e=>e.type==='cubes')?.removed.length??0;g.progress=Math.min(g.target,value);events.push({type:'goalProgress',index:i,progress:g.progress,target:g.target});}
  const won=next.adventure.goals.every(g=>g.progress>=g.target); if(won){const effective=Math.max(0,next.adventure.movesLeft-a.bonusMoves);const stars=effective>=a.s3?3:effective>=a.s2?2:1;next.adventure.result={won:true,reason:'goals',movesLeft:next.adventure.movesLeft,stars};next.status='over';events.push({type:'levelWon',level:a.level,movesLeft:next.adventure.movesLeft,stars});}
  else if(next.adventure.movesLeft===0){next.status='over';next.adventure.result={won:false,reason:'moves',movesLeft:0,stars:0};events.push({type:'levelLost',level:a.level,reason:'moves'});}
  else if(next.tray.every(x=>x===null)){const deal=dealTray(next.board,next.rng,a.stage,{f2:a.f2,flavours:flavours(a.flavours)});next.tray=deal.tray;next.traysDealt++;events.push({type:'dealt',tray:deal.tray});}
  if(!won&&next.adventure.movesLeft>0&&next.tray.filter(Boolean).every(p=>p&&!fitsAnywhere(next.board,p.defId))){next.status='over';next.adventure.result={won:false,reason:'stuck',movesLeft:next.adventure.movesLeft,stars:0};events.push({type:'levelLost',level:a.level,reason:'stuck'});}
  return{state:next,events};
}
function copyState(state:GameState):GameState{return{...state,board:[...state.board],tray:[...state.tray],rng:{...state.rng},adventure:state.adventure?{...state.adventure,goals:state.adventure.goals.map(g=>({...g})),boosters:{...state.adventure.boosters}}:undefined};}
function flavours(n:number):(1|2|3|4|5|6|7)[]{return Array.from({length:n},(_,i)=>(i+1) as 1|2|3|4|5|6|7);}
