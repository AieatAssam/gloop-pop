// SG §20.1: cached-style rounded sugar cubes and frost-capped hard cubes.
import { PALETTE } from './palette';
import { roundRectPath } from './silhouette';

export function drawCube(ctx: CanvasRenderingContext2D, value: 8 | 9, cell: number, x: number, y: number): void {
  const size=cell*.84;const ox=x+(cell-size)/2;const oy=y+(cell-size)/2;const r=cell*.18;
  const gradient=ctx.createLinearGradient(0,oy,0,oy+size);gradient.addColorStop(0,PALETTE.fx.sugar);gradient.addColorStop(1,PALETTE.ui.textSecondary);
  ctx.fillStyle=gradient;ctx.fill(roundRectPath(ox,oy,size,size,r));ctx.strokeStyle=value===9?PALETTE.ui.focusRing:PALETTE.ui.textDim;ctx.lineWidth=cell*(value===9?.07:.05);ctx.stroke(roundRectPath(ox,oy,size,size,r));
  ctx.fillStyle=PALETTE.light.specular;const glints:readonly (readonly [number,number,number])[]=[[.23,.2,.08],[.72,.4,.06],[.48,.76,.05]];for(const [dx,dy,radius] of glints){ctx.globalAlpha=.8;ctx.beginPath();ctx.moveTo(ox+dx*size,oy+dy*size-radius*cell);ctx.lineTo(ox+(dx+radius)*size,oy+dy*size);ctx.lineTo(ox+dx*size,oy+(dy+radius)*size);ctx.lineTo(ox+(dx-radius)*size,oy+dy*size);ctx.closePath();ctx.fill();}ctx.globalAlpha=1;
  if(value===9){ctx.fillStyle=PALETTE.ui.freeze;ctx.globalAlpha=.6;ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(ox+size,oy);ctx.lineTo(ox+size,oy+size*.34);for(let i=3;i>=0;i--)ctx.lineTo(ox+size*i/3,oy+size*(.34+(i%2)*.04));ctx.closePath();ctx.fill();ctx.globalAlpha=1;}
  ctx.strokeStyle=PALETTE.face.ink;ctx.globalAlpha=.55;ctx.lineWidth=Math.max(1,cell*.025);for(const ex of [.4,.6]){ctx.beginPath();ctx.arc(ox+size*ex,oy+size*.58,cell*.045,Math.PI,Math.PI*2);ctx.stroke();}ctx.beginPath();ctx.moveTo(ox+size*.45,oy+size*.69);ctx.lineTo(ox+size*.55,oy+size*.69);ctx.stroke();ctx.globalAlpha=1;
}
