// SG §20.6: three-row Home missions card with gold progress, pips and compact controls.
import type { SaveV2 } from '../meta/saveSchema';
import { missionAt } from '../core/missions';
import { S } from './strings';

export interface MissionsCardActions { claim(slot: number, anchor: HTMLElement): void; change(slot: number): void }
export function createMissionsCard(save: SaveV2, actions: MissionsCardActions): HTMLElement {
 const card = document.createElement('section'); card.className = 'missions-card';
 const header = document.createElement('header'); header.className = 'missions-header'; const title = document.createElement('strong'); title.textContent = S.missionsTitle; const pips = document.createElement('span'); pips.className = 'missions-pips';
 for (let index = 0; index < 3; index += 1) { const pip = document.createElement('i'); pip.className = `missions-pip${save.missions.slots[index]?.claimed ? ' is-claimed' : ''}`; pips.append(pip); } header.append(title, pips); card.append(header);
 for (let index = 0; index < 3; index += 1) {
  const data = save.missions.slots[index]; if (!data) continue; const def = missionAtId(data.id); if (!def) continue;
  const row = document.createElement('div'); row.className = `mission-row${data.claimed ? ' is-claimed' : ''}`;
  const stars = document.createElement('span'); stars.className = 'mission-difficulty'; stars.textContent = '★'.repeat(index + 1); stars.setAttribute('aria-hidden','true');
  const body = document.createElement('div'); body.className = 'mission-copy'; const text = document.createElement('span'); text.className = 'mission-text'; text.textContent = S.missionText(data.id);
  const progressLine = document.createElement('div'); progressLine.className = 'mission-progress-line'; const bar = document.createElement('span'); bar.className = 'mission-progress-track'; const fill = document.createElement('i'); fill.style.width = `${Math.min(100, data.progress / def.target * 100)}%`; bar.append(fill); const count = document.createElement('small'); count.textContent = S.missionProgress(data.progress, def.target); progressLine.append(bar, count); body.append(text, progressLine);
  const side = document.createElement('div'); side.className = 'mission-side'; const reward = document.createElement('small'); reward.textContent = S.missionReward([30,50,80][index] ?? 30,[20,40,60][index] ?? 20); side.append(reward);
  if (data.claimed) { const done = document.createElement('span'); done.className='mission-done'; done.textContent=`✓ ${S.missionDone}`; side.append(done); }
  else if (data.progress >= def.target) { const claim=document.createElement('button'); claim.type='button'; claim.className='button mission-claim'; claim.textContent=S.missionClaim; claim.addEventListener('click',()=>actions.claim(index, claim)); side.append(claim); }
  else if (save.missions.rerollDay !== save.missions.day) { const change=document.createElement('button'); change.type='button'; change.className='mission-change'; change.setAttribute('aria-label',S.missionChangeAria); change.title=S.missionChangeAria; change.textContent='↻'; change.addEventListener('click',()=>actions.change(index)); side.append(change); }
  row.append(stars, body, side); card.append(row);
 }
 const footer=document.createElement('footer'); footer.className='missions-footer'; const changeCaption=document.createElement('small'); changeCaption.textContent=save.missions.rerollDay===save.missions.day?S.missionChangeUsed:S.missionChangeReady; const set=document.createElement('small'); set.textContent=save.missions.setPaid?S.missionSetDone:S.missionSet; footer.append(changeCaption,set); card.append(footer); return card;
}
function missionAtId(id: string) { for(const slot of ['A','B','C'] as const) { for(let pos=0;pos<29;pos+=1) { const mission=missionAt(slot,pos); if(mission.id===id)return mission; } } return undefined; }
