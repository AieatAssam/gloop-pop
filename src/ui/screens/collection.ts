// SG §11.1, §11.3, §9.3 and §14: collection cards and pop previews use the live palette.
import { CATALOGUE, buyItem, equipItem, isOwned, requirement, type ItemKind } from '../../meta/catalogue';
import type { SaveV2 } from '../../meta/saveSchema';
import { PALETTE, type ThemeKey } from '../../render/palette';
import { createMiniGloop } from '../../render/miniGloop';
import { drawGloop } from '../../render/gloopRenderer';
import { withAlpha } from '../../render/colour';
import { components } from '../../core/gloops';
import { getEquippedPopEffect, getEquippedSkin, getEquippedTheme, setEquippedCosmetics, type PopEffectId, type SkinId } from '../../render/themes';
import { S } from '../strings';
import { el } from '../dom';

const KINDS: readonly ItemKind[] = ['theme','skin','pop'];
const SKIN_MAP: Record<string, SkinId> = { plain:'plain', googly:'googlyEyes', freckles:'freckles', catears:'catEars', glasses:'glasses', mustache:'mustache', bowtie:'bowtie', crown:'crown' };
export function createCollectionScreen(save: SaveV2, onBack: () => void, onSave: (save: SaveV2) => void): HTMLElement {
 let kind: ItemKind = 'theme';
 const root = document.createElement('main'); root.className = 'screen-wrap';
 const panel = document.createElement('section'); panel.className = 'panel full-screen-panel collection-panel';
 const header = document.createElement('header'); header.className='screen-header'; const back=button(S.back,'button button--secondary screen-back',onBack); const title=document.createElement('h1'); title.textContent=S.collectionTitle; const balance=document.createElement('span'); balance.className='home-chip collection-coins'; header.append(back,title,balance);
 const tabs=document.createElement('nav'); tabs.className='collection-tabs'; const grid=document.createElement('div'); grid.className='collection-grid';
 for (const tabKind of KINDS) { const tab=button(tabLabel(tabKind),'button button--secondary',()=>{kind=tabKind; render();}); tab.dataset.kind=tabKind; tabs.append(tab); }
 panel.append(header,tabs,grid); root.append(panel); render(); return root;
 function render(): void {
  balance.textContent=S.coinBalance(save.profile.coins); grid.replaceChildren(); tabs.querySelectorAll('button').forEach((tab)=>tab.classList.toggle('is-selected',tab.dataset.kind===kind));
  for (const item of CATALOGUE.filter((entry)=>entry.kind===kind)) {
   const card=document.createElement('article'); card.className='collection-card'; const preview=previewCanvas(item.kind,item.id); const copy=document.createElement('div'); copy.className='collection-copy'; const name=document.createElement('strong'); name.textContent=S.catalogueName(item.id); copy.append(name);
   const owned=isOwned(save,item); const equipped=save.equipped[kind==='theme'?'theme':kind==='skin'?'skin':'pop']===item.id; const locked=requirement(item,save); const lockText=locked?.kind==='level'?S.reachLevel(locked.level):locked?.kind==='achievement'?S.achievementRequirement(S.achievementName(locked.achievement)):null;
   const freeClaim = item.price === 0 && (item.level !== undefined || item.achievement !== undefined);
   const actionLabel=equipped?S.inUse:owned?S.use:lockText??(freeClaim?S.claim:save.profile.coins<item.price?S.needCoins(item.price-save.profile.coins):S.itemPrice(item.price));
   const action=button(actionLabel,'button button--secondary collection-action',()=>{
    if (owned) { save=equipItem(save,item.kind,item.id); onSave(save); syncCosmetics(save); render(); return; }
    if (locked || save.profile.coins<item.price) return;
    const result=buyItem(save,item.kind,item.id); if(result.ok){save=result.save; onSave(save); syncCosmetics(save); render();}
   }); action.disabled=equipped||locked!==null||(!owned&&save.profile.coins<item.price); if(equipped){action.classList.add('is-equipped');card.classList.add('is-equipped');} else if(!owned&&!locked&&save.profile.coins>=item.price) action.classList.add('is-buyable'); card.append(preview,copy,action); grid.append(card);
  }
 }
}
function tabLabel(kind: ItemKind): string { return kind==='theme'?S.collectionThemes:kind==='skin'?S.collectionSkins:S.collectionPops; }
function button(label:string, className:string, action:()=>void):HTMLButtonElement { const value=el('button',className,label);value.addEventListener('click',action);return value; }
function syncCosmetics(save:SaveV2):void { setEquippedCosmetics({theme:save.equipped.theme as ThemeKey,skin:SKIN_MAP[save.equipped.skin]??'plain',popEffect:save.equipped.pop as PopEffectId}); }
function previewCanvas(kind:ItemKind,id:string):HTMLCanvasElement {
 const canvas=document.createElement('canvas');canvas.width=160;canvas.height=112;canvas.className=`collection-preview${kind==='pop'?' collection-preview-pop':''}`;const ctx=canvas.getContext('2d');if(!ctx)return canvas;
 if(kind==='theme') drawThemePreview(ctx, PALETTE.theme[id as ThemeKey]??PALETTE.theme.midnight);
 else { const original={theme:getEquippedTheme(),skin:getEquippedSkin(),popEffect:getEquippedPopEffect()}; if(kind==='skin') setEquippedCosmetics({...original,skin:SKIN_MAP[id]??'plain'});const art=createMiniGloop(1,'idle',false);ctx.fillStyle=PALETTE.theme.midnight.skyTop;ctx.fillRect(0,0,160,112);ctx.drawImage(art,24,0,112,112);setEquippedCosmetics(original);if(kind==='pop'){const flavors=[PALETTE.flavour.lemon.base,PALETTE.flavour.cherry.base,PALETTE.flavour.bubblegum.base,PALETTE.flavour.blueberry.base];const gold=[PALETTE.ui.gold,PALETTE.ui.coinShade,PALETTE.ui.coinShine,PALETTE.fx.sugar];const colors=id==='goldsparkles'?Array.from({length:18},(_,i)=>i<11?PALETTE.ui.gold:PALETTE.fx.sugar):id==='goldstars'?Array.from({length:18},(_,i)=>i<13?PALETTE.ui.gold:PALETTE.ui.coinShade):id==='goldconfetti'?Array.from({length:18},(_,i)=>gold[i%gold.length]!):flavors;for(let i=0;i<18;i++){const angle=i*Math.PI*2/18;const radius=19+(i%3)*5;ctx.fillStyle=colors[i%colors.length]!;ctx.globalAlpha=.8;ctx.beginPath();if(id==='hearts'){const x=80+Math.cos(angle)*radius,y=54+Math.sin(angle)*radius;ctx.arc(x,y,3,0,Math.PI*2);}else ctx.arc(80+Math.cos(angle)*radius,54+Math.sin(angle)*radius,2+(i%3),0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;} }
 return canvas;
}

// SG §14: a theme thumbnail is a tiny version of the play scene (sky, stars, moon, mould tray with real gloops, counter), not abstract shapes.
const PREVIEW_BOARD = [0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,5,5,0, 0,0,0,0,0,5,0,0, 0,0,3,0,0,0,0,0, 1,1,3,3,0,0,4,0, 1,1,0,0,0,4,4,4, 0,0,0,0,0,0,0,0];
function drawThemePreview(ctx: CanvasRenderingContext2D, theme: (typeof PALETTE.theme)[ThemeKey]): void {
 const sky=ctx.createLinearGradient(0,0,0,112); sky.addColorStop(0,theme.skyTop); sky.addColorStop(1,theme.skyBottom); ctx.fillStyle=sky; ctx.fillRect(0,0,160,112);
 ctx.fillStyle=theme.star; for(let i=0;i<14;i+=1){ ctx.globalAlpha=0.4+(i%3)*0.2; ctx.beginPath(); ctx.arc((i*47+9)%160,(i*29+5)%46,i%4===0?1.4:0.9,0,Math.PI*2); ctx.fill(); } ctx.globalAlpha=1;
 const halo=ctx.createRadialGradient(132,20,0,132,20,24); halo.addColorStop(0,withAlpha(theme.moon,0.35)); halo.addColorStop(1,withAlpha(theme.moon,0)); ctx.fillStyle=halo; ctx.fillRect(108,0,52,44); ctx.fillStyle=theme.moon; ctx.beginPath(); ctx.arc(132,20,8,0,Math.PI*2); ctx.fill();
 ctx.fillStyle=theme.silhouette; for(let i=0;i<6;i+=1){ const w=14+(i%3)*5; const h=16+(i*7)%12; const x=4+i*27; ctx.beginPath(); ctx.roundRect(x,58-h,w,h,4); ctx.fill(); ctx.fillRect(x+3,56-h,w-6,4); }
 ctx.fillStyle=theme.counter; ctx.fillRect(0,74,160,38);
 const c=9; const pad=3; const size=c*8+pad*2; const bx=80-size/2; const by=30;
 const frame=ctx.createLinearGradient(0,by,0,by+size); frame.addColorStop(0,theme.frameLight); frame.addColorStop(0.25,theme.frame); frame.addColorStop(1,theme.frameDark); ctx.fillStyle=frame; ctx.beginPath(); ctx.roundRect(bx,by,size,size,6); ctx.fill();
 ctx.fillStyle=theme.cell; for(let i=0;i<64;i+=1){ ctx.beginPath(); ctx.roundRect(bx+pad+(i%8)*c+0.6,by+pad+Math.floor(i/8)*c+0.6,c-1.2,c-1.2,2); ctx.fill(); }
 for(const gloop of components(PREVIEW_BOARD)) drawGloop(ctx,gloop,c,bx+pad,by+pad,0,'happy');
}
