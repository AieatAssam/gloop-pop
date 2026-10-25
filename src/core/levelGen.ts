import { buildLevel, levelParams, type LevelDef } from './levels';
import { newAdventureGame, stepAdventure } from './adventure';
import { chooseLevelMove } from './levelBot';

export interface Calibration { def: LevelDef; runs: {won:boolean;movesLeft:number;stars:number;progress:number[]}[] }
export function calibrate(n:number,s:number):Calibration {
  const built=buildLevel(n,s);const p=built.params;const goals=p.goals.map(g=>({...g,target:g.kind==='C'?g.target:g.kind==='L'?Math.max(3,Math.floor(7+n/20)):g.kind==='S'?Math.max(500,Math.floor((n*83)/100)*100):g.kind==='F'?8:1,...(g.kind==='F'&&built.flavour?{flavour:built.flavour}:{})}));
  const def:LevelDef={n,s,goals,moves:p.moves,s2:2,s3:Math.max(2,Math.floor(p.moves*.4)),wins:0,board:built.board};const runs=[];
  for(let k=0;k<12;k++){const init=newAdventureGame(def,{bonusMoves:0,boosters:{shuffle:0,pop:0},freeShuffle:false});let state=init.state;for(let turn=0;turn<p.moves&&state.status==='playing';turn++){const action=chooseLevelMove(state,state.seed,k);if(!action)break;state=stepAdventure(state,action).state;}const result=state.adventure?.result;runs.push({won:result?.won??false,movesLeft:result?.movesLeft??0,stars:result?.stars??0,progress:state.adventure?.goals.map(g=>g.progress)??[]});}
  def.wins=runs.filter(r=>r.won).length;return{def,runs};
}
export function validate(def:LevelDef):boolean { return def.board.length===64&&def.board.split('').every(ch=>/[0-9]/.test(ch))&&def.goals.length>0&&def.s2>=1&&def.s3>=def.s2; }
export function generateLevel(n:number):LevelDef {
  const k=levelParams(n).k;for(let s=0;s<64;s++){const result=calibrate(n,s);if(result.def.wins>=k&&result.def.s3>=2&&validate(result.def))return result.def;}
  throw new Error(`Level ${n}: no seed passed in 64 tries`);
}
