import { seededRng, nextInt } from './rng';
import { fitsAnywhere, previewPlacement, canPlace } from './game';
import type { GameState, Action } from './types';

/** Frozen design §24.6 validation bot; ranks safe placements by immediate line/pop and goal progress. */
export function chooseLevelMove(state: GameState, seed: string, k: number): Action | null {
  const candidates: {action:Action;value:number}[]=[];
  for(let slot=0;slot<3;slot++)for(let row=0;row<8;row++)for(let col=0;col<8;col++)if(canPlace(state,slot,row,col)){
    const preview=previewPlacement(state,slot,row,col);if(!preview)continue;
    const lines=preview.rows.length+preview.cols.length;const pops=preview.popping.reduce((sum,g)=>sum+g.length,0);
    candidates.push({action:{type:'place',slot:slot as 0|1|2,row,col},value:lines*160+pops*25});
  }
  candidates.sort((a,b)=>b.value-a.value);if(!candidates.length)return null;
  const rng=seededRng(`${seed}/bot/${k}`);return candidates[nextInt(rng,Math.min(3,candidates.length))]?.action??candidates[0]!.action;
}
export function levelBotHasFit(state:GameState):boolean{return state.tray.some(p=>p&&fitsAnywhere(state.board,p.defId));}
