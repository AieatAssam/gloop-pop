// SG §4, §5.1–5.3, §7.2: cached glossy jelly bodies with live faces and toppers.
import { FLAVOUR_KEYS, PALETTE } from './palette';
import { withAlpha } from './colour';
import { mix } from './colour';
import { silhouettePath } from './silhouette';
import { faceBoxFor } from './face';
import type { Gloop } from '../core/types';
import { getEquippedSkin } from './themes';

const bodySprites = new Map<string, HTMLCanvasElement>();
let colourBlindPatterns = false;
export function setColourBlindPatterns(enabled: boolean): void { if (colourBlindPatterns !== enabled) { colourBlindPatterns = enabled; bodySprites.clear(); } }

export function drawGloop(context: CanvasRenderingContext2D, gloop: Gloop, cell: number, ox: number, oy: number, elapsed: number, expression = 'idle', alpha = 1): void {
  const rows = gloop.cells.map((i) => Math.floor(i / 8)); const cols = gloop.cells.map((i) => i % 8);
  const minRow = Math.min(...rows); const minCol = Math.min(...cols); const maxRow = Math.max(...rows); const maxCol = Math.max(...cols); const padding = cell * 0.25;
  const key = `${gloop.flavour}|${cell}|${colourBlindPatterns ? 1 : 0}|${gloop.cells.slice().sort((a, b) => a - b).join(',')}`;
  let sprite = bodySprites.get(key);
  if (!sprite) { sprite = createBodySprite(gloop, cell, minRow, minCol, maxRow, maxCol, padding); if (bodySprites.size >= 96) bodySprites.delete(bodySprites.keys().next().value!); bodySprites.set(key, sprite); }
  context.save(); context.translate(ox, oy); context.globalAlpha *= alpha;
  context.drawImage(sprite, minCol * cell - padding, minRow * cell - padding, sprite.width / 2, sprite.height / 2);
  drawFace(context, gloop, cell, elapsed, expression);
  drawTopper(context, gloop, cell, elapsed);
  drawAccessory(context, gloop, cell, elapsed);
  context.restore();
}

function createBodySprite(gloop: Gloop, cell: number, minRow: number, minCol: number, maxRow: number, maxCol: number, padding: number): HTMLCanvasElement {
  const dpr = 2; const sprite = document.createElement('canvas'); sprite.width = Math.ceil(((maxCol - minCol + 1) * cell + padding * 2) * dpr); sprite.height = Math.ceil(((maxRow - minRow + 1) * cell + padding * 2) * dpr);
  const ctx = sprite.getContext('2d'); if (!ctx) return sprite; ctx.scale(dpr, dpr); ctx.translate(padding - minCol * cell, padding - minRow * cell);
  const key = FLAVOUR_KEYS[gloop.flavour - 1]!; const colour = PALETTE.flavour[key]; const path = silhouettePath(gloop.cells, cell);
  const left = minCol * cell; const top = minRow * cell; const right = (maxCol + 1) * cell; const bottom = (maxRow + 1) * cell;
  ctx.save(); ctx.translate(0, cell * 0.07); ctx.fillStyle = PALETTE.light.shadow; ctx.shadowColor = PALETTE.light.shadow; ctx.shadowBlur = cell * 0.16; ctx.fill(path, 'evenodd'); ctx.restore();
  const base = ctx.createLinearGradient(0, top, 0, bottom); base.addColorStop(0, colour.light); base.addColorStop(0.38, colour.base); base.addColorStop(1, colour.dark); ctx.fillStyle = base; ctx.fill(path, 'evenodd');
  ctx.save(); ctx.clip(path, 'evenodd'); const glow = ctx.createRadialGradient((left + right) / 2, (top + bottom) / 2, 0, (left + right) / 2, (top + bottom) / 2, Math.max(right - left, bottom - top) * 0.45); glow.addColorStop(0, withAlpha(colour.light, 0.55)); glow.addColorStop(1, withAlpha(colour.light, 0)); ctx.fillStyle = glow; ctx.fillRect(left, top, right - left, bottom - top);
  ctx.lineWidth = cell * 0.18; ctx.strokeStyle = withAlpha(colour.dark, 0.5); ctx.lineCap = 'round'; ctx.stroke(path); ctx.save(); ctx.beginPath(); ctx.rect(left, (top + bottom) / 2, right - left, bottom - top); ctx.clip(); ctx.translate(cell * 0.03, -cell * 0.04); ctx.lineWidth = cell * 0.06; ctx.strokeStyle = withAlpha(PALETTE.theme.midnight.rim, 0.35); ctx.stroke(path); ctx.restore(); ctx.restore();
  ctx.lineWidth = cell * 0.05; ctx.lineJoin = 'round'; ctx.strokeStyle = colour.outline; ctx.stroke(path);
  if (colourBlindPatterns) drawColourPattern(ctx, gloop, cell, minRow, minCol, path, mix(colour.dark, PALETTE.face.ink, 0.25));
  for (const index of gloop.cells) { const row = Math.floor(index / 8); const col = index % 8; if (gloop.cells.includes(index - 8)) continue; ctx.save(); ctx.translate(col * cell, row * cell); ctx.rotate(-0.35); ctx.fillStyle = PALETTE.light.specularSoft; ctx.beginPath(); ctx.ellipse(cell * 0.32, cell * 0.26, cell * 0.15, cell * 0.085, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = withAlpha(PALETTE.light.specular, 0.9); ctx.beginPath(); ctx.arc(cell * 0.56, cell * 0.2, cell * 0.045, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
  return sprite;
}

function drawColourPattern(ctx: CanvasRenderingContext2D, gloop: Gloop, cell: number, minRow: number, minCol: number, path: Path2D, colour: string): void {
  ctx.save(); ctx.clip(path, 'evenodd'); ctx.strokeStyle = withAlpha(colour, 0.45); ctx.fillStyle = withAlpha(colour, 0.45); ctx.lineWidth = cell * 0.05;
  for (const index of gloop.cells) {
    const row = Math.floor(index / 8); const col = index % 8; const x = col * cell; const y = row * cell;
    if (gloop.flavour === 1) for (const dx of [0.3, 0.7]) for (const dy of [0.3, 0.7]) { ctx.beginPath(); ctx.arc(x + dx * cell, y + dy * cell, cell * 0.06, 0, Math.PI * 2); ctx.fill(); }
    else if (gloop.flavour === 2) for (const dy of [0.33, 0.66]) ctx.fillRect(x, y + (dy - 0.04) * cell, cell, cell * 0.08);
    else if (gloop.flavour === 4) for (const offset of [-0.25, 0.25]) { ctx.beginPath(); ctx.moveTo(x + cell * (0.15 + offset), y + cell * 0.85); ctx.lineTo(x + cell * (0.85 + offset), y + cell * 0.15); ctx.stroke(); }
    else if (gloop.flavour === 5) { ctx.beginPath(); ctx.arc(x + cell * 0.5, y + cell * 0.5, cell * 0.18, 0, Math.PI * 2); ctx.stroke(); }
    else if (gloop.flavour === 6) { ctx.beginPath(); ctx.moveTo(x, y + cell * 0.5); for (let step = 1; step <= 6; step += 1) ctx.lineTo(x + cell * step / 6, y + cell * (0.5 + (step % 2 ? -0.12 : 0.12))); ctx.stroke(); }
    else if (gloop.flavour === 7) for (const [dx, dy] of [[0.3, 0.3], [0.7, 0.7]] as const) { ctx.beginPath(); ctx.moveTo(x + cell * (dx - 0.09), y + cell * dy); ctx.lineTo(x + cell * (dx + 0.09), y + cell * dy); ctx.moveTo(x + cell * dx, y + cell * (dy - 0.09)); ctx.lineTo(x + cell * dx, y + cell * (dy + 0.09)); ctx.stroke(); }
  }
  void minRow; void minCol; ctx.restore();
}

export function drawPiece(context: CanvasRenderingContext2D, flavour: number, cells: readonly (readonly [number, number])[], cell: number, x: number, y: number, elapsed: number, expression = 'idle', alpha = 1): void {
  const gloop: Gloop = { flavour: flavour as Gloop['flavour'], cells: cells.map(([r, c]) => r * 8 + c), bfs: [], largestSquare: { row: 0, col: 0, size: 1 } };
  drawGloop(context, gloop, cell, x, y, elapsed, expression, alpha);
}

function drawFace(ctx: CanvasRenderingContext2D, gloop: Gloop, cell: number, elapsed: number, expression: string): void {
  const box = faceBoxFor(gloop, cell); const size = box.size; const x = box.x; const y = box.y;
  const f = size; ctx.save(); ctx.translate(x, y);
  const ink = PALETTE.face.ink; const blueberry = gloop.flavour === 5; const bubble = gloop.flavour === 7; const blinkPhase = (elapsed + (gloop.cells[0] ?? 0) * 83) % 4300; const blink = expression === 'idle' && blinkPhase > 4140 && blinkPhase < 4250;
  const skin = getEquippedSkin();
  const eyeHeight = expression === 'sad' ? 0.058 : blink || expression === 'popping' || expression === 'sleep' ? 0.012 : expression === 'dizzy' ? 0.085 : gloop.flavour === 6 ? 0.12 : 0.095;
  const eyes = expression === 'excited' ? 1.15 : expression === 'worried' ? 1.04 : 1;
  for (const side of [-1, 1]) {
    const ex = side * f * (gloop.flavour === 2 ? 0.23 : 0.2); const ey = -f * 0.06; const er = bubble ? 0.1 : gloop.flavour === 3 ? 0.06 : 0.075;
    if (skin === 'googlyEyes') {
      const wobbleX = Math.sin(elapsed / 145 + side * 0.8) * f * 0.025; const wobbleY = Math.cos(elapsed / 170 + side) * f * 0.018;
      ctx.fillStyle = PALETTE.accessory.googlyWhite; ctx.beginPath(); ctx.arc(ex, ey, f * 0.12, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = PALETTE.accessory.googlyRim; ctx.lineWidth = f * 0.02; ctx.stroke();
      ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(ex + wobbleX, ey + wobbleY, f * 0.055, 0, Math.PI * 2); ctx.fill(); continue;
    }
    if (expression === 'starEyes') { star(ctx, ex, ey, f * 0.11, PALETTE.face.starEye); continue; }
    if (expression === 'dizzy') { ctx.strokeStyle = ink; ctx.lineWidth = f * 0.025; ctx.beginPath(); ctx.arc(ex, ey, f * 0.07, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(ex, ey, f * 0.045, 0, Math.PI * 1.6); ctx.stroke(); continue; }
    if (expression === 'happy' || expression === 'popping' || expression === 'sleep') { ctx.strokeStyle = ink; ctx.lineWidth = f * (expression === 'popping' ? 0.045 : 0.035); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(ex - f * 0.07, ey + f * 0.02); ctx.quadraticCurveTo(ex, ey - f * 0.08, ex + f * 0.07, ey + f * 0.02); ctx.stroke(); continue; }
    ctx.fillStyle = blueberry ? colourFor(gloop.flavour).light : ink;
    ctx.beginPath(); ctx.ellipse(ex, ey, f * er * eyes, f * eyeHeight * eyes, 0, 0, Math.PI * 2); ctx.fill();
    if (gloop.flavour === 5) { ctx.fillStyle = ink; ctx.beginPath(); ctx.moveTo(ex - f * 0.09, ey - f * 0.02); ctx.lineTo(ex + f * 0.09, ey - f * 0.02); ctx.lineTo(ex + f * 0.075, ey + f * 0.025); ctx.quadraticCurveTo(ex, ey - f * 0.01, ex - f * 0.075, ey + f * 0.025); ctx.fill(); }
    else { ctx.fillStyle = PALETTE.face.catchlight; ctx.beginPath(); ctx.arc(ex - f * 0.025, ey - f * 0.035, f * 0.028, 0, Math.PI * 2); ctx.fill(); if (gloop.flavour === 6) { ctx.beginPath(); ctx.arc(ex + f * 0.025, ey + f * 0.035, f * 0.018, 0, Math.PI * 2); ctx.fill(); } }
    if (expression === 'worried' || gloop.flavour === 2) { ctx.strokeStyle = ink; ctx.lineWidth = f * 0.025; ctx.beginPath(); ctx.moveTo(ex - f * 0.07, ey - f * 0.12); ctx.lineTo(ex + f * 0.04, ey - f * (expression === 'worried' ? 0.16 : 0.12)); ctx.stroke(); }
    if (gloop.flavour === 4) { ctx.strokeStyle = ink; ctx.lineWidth = f * 0.018; for (const lash of [-1, 1]) { ctx.beginPath(); ctx.moveTo(ex + lash * f * 0.05, ey - f * 0.07); ctx.lineTo(ex + lash * f * 0.08, ey - f * 0.11); ctx.stroke(); } }
  }
  ctx.strokeStyle = ink; ctx.lineWidth = f * 0.035; ctx.lineCap = 'round'; ctx.beginPath();
  if (expression === 'worried' || expression === 'excited') ctx.arc(0, f * 0.14, f * 0.045, Math.PI, 0);
  else if (expression === 'sad') ctx.arc(0, f * 0.22, f * 0.09, Math.PI + 0.3, Math.PI * 2 - 0.3);
  else if (expression === 'grin') ctx.arc(0, f * 0.05, f * 0.13, 0.25, Math.PI - 0.25);
  else if (expression === 'popping') { ctx.fillStyle = PALETTE.face.mouthInside; ctx.beginPath(); ctx.ellipse(0, f * 0.13, f * 0.1, f * 0.12, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = PALETTE.face.tongue; ctx.beginPath(); ctx.ellipse(0, f * 0.21, f * 0.055, f * 0.025, 0, Math.PI, Math.PI * 2); ctx.fill(); }
  else if (expression === 'sleep') { ctx.beginPath(); ctx.arc(0, f * 0.1, f * 0.04, Math.PI, Math.PI * 2); }
  else ctx.arc(0, f * 0.08, f * (gloop.flavour === 3 ? 0.12 : 0.09), 0.32, Math.PI - 0.32);
  ctx.stroke();
  ctx.fillStyle = PALETTE.face.blush; for (const side of [-1, 1]) { ctx.beginPath(); ctx.ellipse(side * f * 0.31, f * 0.1, f * 0.08, f * 0.05, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}

function drawAccessory(ctx: CanvasRenderingContext2D, gloop: Gloop, cell: number, elapsed: number): void {
  const skin = getEquippedSkin(); if (skin === 'plain' || skin === 'googlyEyes') return;
  const box = faceBoxFor(gloop, cell); const f = box.size; ctx.save(); ctx.translate(box.x, box.y);
  if (skin === 'freckles') {
    ctx.fillStyle = colourFor(gloop.flavour).dark;
    for (const side of [-1, 1]) for (let i = 0; i < 3; i += 1) { ctx.beginPath(); ctx.arc(side * f * (0.31 + (i % 2) * 0.035), f * (0.09 + Math.floor(i / 2) * 0.05), f * 0.014, 0, Math.PI * 2); ctx.fill(); }
  } else if (skin === 'catEars') {
    const twitch = Math.sin(elapsed / 414 + (gloop.cells[0] ?? 0)) * 0.06;
    for (const side of [-1, 1]) { ctx.save(); ctx.translate(side * f * 0.32, -f * 0.42); ctx.rotate(side * twitch); ctx.fillStyle = colourFor(gloop.flavour).light; ctx.beginPath(); ctx.moveTo(-f * 0.11, f * 0.04); ctx.lineTo(0, -f * 0.24); ctx.lineTo(f * 0.11, f * 0.04); ctx.closePath(); ctx.fill(); ctx.fillStyle = PALETTE.accessory.catEarInner; ctx.beginPath(); ctx.moveTo(-f * 0.055, 0); ctx.lineTo(0, -f * 0.14); ctx.lineTo(f * 0.055, 0); ctx.closePath(); ctx.fill(); ctx.restore(); }
  } else if (skin === 'glasses') {
    ctx.strokeStyle = PALETTE.accessory.glassesFrame; ctx.lineWidth = f * 0.03; ctx.fillStyle = PALETTE.accessory.glassesLens;
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.arc(side * f * 0.2, -f * 0.06, f * 0.13, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-f * 0.07, -f * 0.06); ctx.quadraticCurveTo(0, -f * 0.11, f * 0.07, -f * 0.06); ctx.stroke();
  } else if (skin === 'mustache') {
    ctx.fillStyle = PALETTE.accessory.mustache; ctx.beginPath(); ctx.moveTo(0, f * 0.02); ctx.bezierCurveTo(-f * 0.1, -f * 0.01, -f * 0.16, f * 0.02, -f * 0.18, f * 0.09); ctx.bezierCurveTo(-f * 0.1, f * 0.15, -f * 0.04, f * 0.11, 0, f * 0.07); ctx.bezierCurveTo(f * 0.04, f * 0.11, f * 0.1, f * 0.15, f * 0.18, f * 0.09); ctx.bezierCurveTo(f * 0.16, f * 0.02, f * 0.1, -f * 0.01, 0, f * 0.02); ctx.fill();
  } else if (skin === 'bowtie') {
    ctx.fillStyle = PALETTE.accessory.bowtie; ctx.beginPath(); ctx.moveTo(-f * 0.04, f * 0.3); ctx.lineTo(-f * 0.17, f * 0.23); ctx.lineTo(-f * 0.17, f * 0.37); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(f * 0.04, f * 0.3); ctx.lineTo(f * 0.17, f * 0.23); ctx.lineTo(f * 0.17, f * 0.37); ctx.closePath(); ctx.fill(); ctx.fillStyle = PALETTE.accessory.bowtieKnot; ctx.beginPath(); ctx.arc(0, f * 0.3, f * 0.04, 0, Math.PI * 2); ctx.fill();
  } else if (skin === 'crown') {
    ctx.save(); ctx.translate(-f * 0.22, -f * 0.42); ctx.rotate(-0.21); ctx.fillStyle = PALETTE.accessory.crown; ctx.beginPath(); ctx.moveTo(-f * 0.14, f * 0.04); ctx.lineTo(-f * 0.13, -f * 0.12); ctx.lineTo(-f * 0.04, -f * 0.04); ctx.lineTo(0, -f * 0.16); ctx.lineTo(f * 0.04, -f * 0.04); ctx.lineTo(f * 0.13, -f * 0.12); ctx.lineTo(f * 0.14, f * 0.04); ctx.closePath(); ctx.fill(); ctx.fillStyle = PALETTE.accessory.crownShade; ctx.fillRect(-f * 0.14, f * 0.025, f * 0.28, f * 0.035); ctx.fillStyle = PALETTE.accessory.crownGem; ctx.beginPath(); ctx.arc(0, -f * 0.03, f * 0.025, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  ctx.restore();
}

function drawTopper(ctx: CanvasRenderingContext2D, gloop: Gloop, cell: number, elapsed: number): void {
  const s = gloop.largestSquare; const center = s.col + Math.floor(s.size / 2); const row = Math.min(...gloop.cells.filter((i) => i % 8 === center).map((i) => Math.floor(i / 8)));
  if (!Number.isFinite(row)) return;
  const x = (center + 0.5) * cell; const y = row * cell; const t = 0.34 * cell * (1 + 0.15 * (s.size - 1));
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(elapsed / 414 + (gloop.cells[0] ?? 0)) * 0.07); ctx.lineWidth = Math.max(1.5, t * 0.09); ctx.lineCap = 'round'; ctx.strokeStyle = PALETTE.topper.stem; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(t * 0.08, -t * 0.42, t * 0.12, -t * 0.75); ctx.stroke();
  ctx.fillStyle = gloop.flavour === 7 ? PALETTE.topper.bubble : gloop.flavour === 5 ? PALETTE.flavour.blueberry.dark : PALETTE.topper.leaf;
  if (gloop.flavour === 5) { star(ctx, 0, -t * 0.45, t * 0.24, PALETTE.flavour.blueberry.dark); }
  else if (gloop.flavour === 3) { ctx.fillStyle = PALETTE.flavour.lemon.dark; ctx.beginPath(); ctx.moveTo(-t * 0.16, -t * 0.35); ctx.quadraticCurveTo(0, -t * 0.95, t * 0.16, -t * 0.35); ctx.quadraticCurveTo(0, -t * 0.22, -t * 0.16, -t * 0.35); ctx.fill(); ctx.fillStyle = PALETTE.flavour.lemon.light; ctx.beginPath(); ctx.arc(-t * 0.04, -t * 0.53, t * 0.04, 0, Math.PI * 2); ctx.fill(); }
  else if (gloop.flavour === 4) { ctx.beginPath(); for (const side of [-1, 1]) { ctx.save(); ctx.translate(side * t * 0.2, -t * 0.48); ctx.rotate(side * 0.7); ctx.ellipse(0, 0, t * 0.25, t * 0.1, 0, 0, Math.PI * 2); ctx.restore(); } ctx.fill(); }
  else if (gloop.flavour === 6) { ctx.strokeStyle = PALETTE.topper.leaf; ctx.lineWidth = t * 0.08; ctx.beginPath(); ctx.arc(0, -t * 0.45, t * 0.21, Math.PI * 0.15, Math.PI * 1.85); ctx.arc(0, -t * 0.45, t * 0.1, Math.PI * 0.2, Math.PI * 1.8); ctx.stroke(); ctx.beginPath(); ctx.ellipse(t * 0.28, -t * 0.52, t * 0.18, t * 0.08, -0.4, 0, Math.PI * 2); ctx.fill(); }
  else if (gloop.flavour === 1) { ctx.beginPath(); ctx.ellipse(t * 0.24, -t * 0.54, t * 0.3, t * 0.13, -0.45, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = PALETTE.topper.leafDark; ctx.lineWidth = t * 0.03; ctx.beginPath(); ctx.moveTo(t * 0.03, -t * 0.5); ctx.lineTo(t * 0.42, -t * 0.58); ctx.stroke(); }
  else { ctx.beginPath(); ctx.ellipse(t * 0.24, -t * 0.54, t * 0.3, t * 0.13, -0.45, 0, Math.PI * 2); ctx.fill(); }
  if (gloop.flavour === 7) { ctx.fillStyle = PALETTE.topper.bubbleShine; ctx.beginPath(); ctx.ellipse(t * 0.17, -t * 0.58, t * 0.07, t * 0.035, -0.5, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}
function colourFor(flavour: number) { return PALETTE.flavour[FLAVOUR_KEYS[flavour - 1]!]; }
function star(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, colour: string): void { ctx.fillStyle = colour; ctx.beginPath(); for (let i = 0; i < 10; i += 1) { const a = -Math.PI / 2 + i * Math.PI / 5; const r = i % 2 ? radius * 0.45 : radius; if (!i) ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); else ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); ctx.fill(); }
