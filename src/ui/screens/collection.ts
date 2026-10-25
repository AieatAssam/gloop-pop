// SG §11.1, §11.3 and §14: collection cards use live palette and gloop previews.
import { CATALOGUE, buyItem, equipItem, isOwned, requirement, type ItemKind } from '../../meta/catalogue';
import type { SaveV1 } from '../../meta/saveSchema';
import { PALETTE, type ThemeKey } from '../../render/palette';
import { createMiniGloop } from '../../render/miniGloop';
import { getEquippedPopEffect, getEquippedSkin, getEquippedTheme, setEquippedCosmetics, type PopEffectId, type SkinId } from '../../render/themes';
import { S } from '../strings';

const KINDS: readonly ItemKind[] = ['theme','skin','pop'];
const SKIN_MAP: Record<string, SkinId> = { plain:'plain', googly:'googlyEyes', freckles:'freckles', catears:'catEars', glasses:'glasses', mustache:'mustache', bowtie:'bowtie', crown:'crown' };
export function createCollectionScreen(save: SaveV1, onBack: () => void, onSave: (save: SaveV1) => void): HTMLElement {
 let kind: ItemKind = 'theme';
 const root = document.createElement('main'); root.className = 'screen-wrap';
 const panel = document.createElement('section'); panel.className = 'panel full-screen-panel collection-panel';
 const header = document.createElement('header'); header.className='screen-header'; const back=button(S.back,'button button--secondary screen-back',onBack); const title=document.createElement('h1'); title.textContent=S.collectionTitle; header.append(back,title);
 const tabs=document.createElement('nav'); tabs.className='collection-tabs'; const grid=document.createElement('div'); grid.className='collection-grid';
 for (const tabKind of KINDS) { const tab=button(tabLabel(tabKind),'button button--secondary',()=>{kind=tabKind; render();}); tab.dataset.kind=tabKind; tabs.append(tab); }
 panel.append(header,tabs,grid); root.append(panel); render(); return root;
 function render(): void {
  grid.replaceChildren(); tabs.querySelectorAll('button').forEach((tab)=>tab.classList.toggle('is-selected',tab.dataset.kind===kind));
  for (const item of CATALOGUE.filter((entry)=>entry.kind===kind)) {
   const card=document.createElement('article'); card.className='collection-card'; const preview=previewCanvas(item.kind,item.id); const copy=document.createElement('div'); copy.className='collection-copy'; const name=document.createElement('strong'); name.textContent=S.catalogueName(item.id); copy.append(name);
   const owned=isOwned(save,item); const equipped=save.equipped[kind==='theme'?'theme':kind==='skin'?'skin':'pop']===item.id; const locked=requirement(item,save); const lockText=locked?.kind==='level'?S.reachLevel(locked.level):locked?.kind==='achievement'?S.achievementRequirement(S.achievementName(locked.achievement)):null;
   const freeClaim = item.price === 0 && (item.level !== undefined || item.achievement !== undefined);
   const actionLabel=equipped?S.inUse:owned?S.use:lockText??(freeClaim?S.claim:save.profile.coins<item.price?S.needCoins(item.price-save.profile.coins):S.itemPrice(item.price));
   const action=button(actionLabel,'button button--secondary collection-action',()=>{
    if (owned) { save=equipItem(save,item.kind,item.id); onSave(save); syncCosmetics(save); render(); return; }
    if (locked || save.profile.coins<item.price) return;
    const result=buyItem(save,item.kind,item.id); if(result.ok){save=result.save; onSave(save); syncCosmetics(save); render();}
   }); action.disabled=equipped||locked!==null||(!owned&&save.profile.coins<item.price); card.append(preview,copy,action); grid.append(card);
  }
 }
}
function tabLabel(kind: ItemKind): string { return kind==='theme'?S.collectionThemes:kind==='skin'?S.collectionSkins:S.collectionPops; }
function button(label:string, className:string, action:()=>void):HTMLButtonElement { const el=document.createElement('button'); el.type='button';el.className=className;el.textContent=label;el.addEventListener('click',action);return el; }
function syncCosmetics(save:SaveV1):void { setEquippedCosmetics({theme:save.equipped.theme as ThemeKey,skin:SKIN_MAP[save.equipped.skin]??'plain',popEffect:save.equipped.pop as PopEffectId}); }
function previewCanvas(kind:ItemKind,id:string):HTMLCanvasElement {
 const canvas=document.createElement('canvas');canvas.width=160;canvas.height=112;canvas.className=`collection-preview${kind==='pop'?' collection-preview-pop':''}`;const ctx=canvas.getContext('2d');if(!ctx)return canvas;
 if(kind==='theme') { const theme=PALETTE.theme[id as ThemeKey]??PALETTE.theme.midnight; const sky=ctx.createLinearGradient(0,0,0,112);sky.addColorStop(0,theme.skyTop);sky.addColorStop(1,theme.skyBottom);ctx.fillStyle=sky;ctx.fillRect(0,0,160,112);ctx.fillStyle=theme.silhouette;ctx.fillRect(0,46,160,9);ctx.fillRect(0,73,160,8);ctx.fillStyle=theme.counter;ctx.fillRect(0,91,160,21);for(let i=0;i<6;i++){ctx.fillStyle=theme.frame;ctx.beginPath();ctx.roundRect(8+i*26,26+(i%2)*27,18,21,5);ctx.fill();ctx.strokeStyle=theme.rim;ctx.lineWidth=2;ctx.stroke();}ctx.fillStyle=PALETTE.ui.panelSolid;ctx.beginPath();ctx.roundRect(48,67,64,35,8);ctx.fill();ctx.fillStyle=PALETTE.ui.panelBorder;for(let r=0;r<2;r++)for(let c=0;c<4;c++){ctx.beginPath();ctx.arc(57+c*15,76+r*14,4,0,Math.PI*2);ctx.fill();} }
 else { const original={theme:getEquippedTheme(),skin:getEquippedSkin(),popEffect:getEquippedPopEffect()}; if(kind==='skin') setEquippedCosmetics({...original,skin:SKIN_MAP[id]??'plain'});const art=createMiniGloop(1,'idle',false);ctx.fillStyle=PALETTE.theme.midnight.skyTop;ctx.fillRect(0,0,160,112);ctx.drawImage(art,24,0,112,112);setEquippedCosmetics(original);if(kind==='pop'){const colors=[PALETTE.flavour.lemon.base,PALETTE.flavour.cherry.base,PALETTE.flavour.bubblegum.base,PALETTE.flavour.blueberry.base];for(let i=0;i<18;i++){const angle=i*Math.PI*2/18;const radius=19+(i%3)*5;ctx.fillStyle=colors[i%colors.length]!;ctx.globalAlpha=.8;ctx.beginPath();if(id==='hearts'){const x=80+Math.cos(angle)*radius,y=54+Math.sin(angle)*radius;ctx.arc(x,y,3,0,Math.PI*2);}else ctx.arc(80+Math.cos(angle)*radius,54+Math.sin(angle)*radius,2+(i%3),0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;} }
 return canvas;
}
