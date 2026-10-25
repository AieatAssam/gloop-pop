// SG §7.1, §7.3, §14 (Midnight row): layered night sweet shop with cached static art.
import { PALETTE, type ThemeKey, type ThemeColours } from './palette';
import { withAlpha } from './colour';
import { createCosmeticRng } from './cosmeticRng';
import { easeInOutSine } from './easing';
import type { Layout } from './layout';

interface Dot { x: number; y: number; radius: number; phase: number; period: number; twinkle: boolean }
interface Jar { x: number; y: number; width: number; height: number; lid: number }
interface FloatLight { x: number; y: number; radius: number; speed: number; phase: number; colourIndex: number }
interface Sprinkle { x: number; y: number; speed: number; phase: number; colour: string }

export interface Background {
  resize(width: number, height: number, layout: Layout): void;
  draw(context: CanvasRenderingContext2D, elapsedMs: number, layout: Layout, stage?: number): void;
}

const stars: Dot[] = [];
const jars: Jar[] = [];
const bokeh: FloatLight[] = [];
const sprinkles: Sprinkle[] = [];
const random = createCosmeticRng(0x47504f50);
const sprinkleColours = [PALETTE.flavour.cherry.base, PALETTE.flavour.lemon.base, PALETTE.flavour.blueberry.base, PALETTE.flavour.apple.base];

for (let i = 0; i < 110; i += 1) stars.push({ x: random(), y: random() * 0.55, radius: 0.6 + random(), phase: random() * Math.PI * 2, period: 1500 + random() * 2500, twinkle: random() < 0.2 });
for (let row = 0; row < 2; row += 1) {
  const count = 7 + Math.floor(random() * 3);
  const width = 1 / count;
  for (let i = 0; i < count; i += 1) {
    const jarWidth = 0.09 + random() * 0.07;
    jars.push({ x: (i + 0.5 + (random() - 0.5) * 0.28) * width, y: row === 0 ? 0.3 : 0.48, width: jarWidth, height: 0.12 + random() * 0.1, lid: 0.018 + random() * 0.012 });
  }
}
for (let i = 0; i < 18; i += 1) bokeh.push({ x: random(), y: 0.22 + random() * 0.78, radius: 18 + random() * 46, speed: 4 + random() * 6, phase: random() * Math.PI * 2, colourIndex: i % 3 });
for (let i = 0; i < 8; i += 1) sprinkles.push({ x: i % 2 === 0 ? random() * 0.12 : 0.88 + random() * 0.12, y: 0.45 + random() * 0.52, speed: 3 + random() * 3, phase: random() * Math.PI * 2, colour: sprinkleColours[i % sprinkleColours.length]! });

export function createBackground(themeId: ThemeKey = 'midnight'): Background {
  const selected = PALETTE.theme[themeId];
  const cache = document.createElement('canvas');
  let cacheContext = cache.getContext('2d');
  let cacheWidth = 0;
  let cacheHeight = 0;
  let cachedBoard: Layout['board'] | undefined;
  let cachedStage = 1;
  let moonStage = 1;
  let moonFrom = 0.26;
  let moonTarget = 0.26;
  let moonStarted = 0;
  const sprites = new Map<string, HTMLCanvasElement>();

  const makeSprite = (colour: string, radius: number): HTMLCanvasElement => {
    const size = Math.ceil(radius * 2);
    const sprite = document.createElement('canvas');
    sprite.width = size;
    sprite.height = size;
    const ctx = sprite.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
      gradient.addColorStop(0, withAlpha(colour, 0.18));
      gradient.addColorStop(1, withAlpha(colour, 0));
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
    }
    return sprite;
  };
  for (const colour of [selected.bokehA, selected.bokehB, selected.bokehC]) sprites.set(colour, makeSprite(colour, 64));
  for (const colour of sprinkleColours) sprites.set(`sprinkle:${colour}`, makeSprinkleSprite(colour));

  return {
    resize(width, height, layout) {
      cacheWidth = Math.max(1, Math.ceil(width));
      cacheHeight = Math.max(1, Math.ceil(height));
      cache.width = cacheWidth;
      cache.height = cacheHeight;
      cacheContext = cache.getContext('2d');
      cachedBoard = { ...layout.board };
      if (!cacheContext) return;
      drawStatic(cacheContext, cacheWidth, cacheHeight, cachedBoard, selected, cachedStage);
    },
    draw(context, elapsedMs, layout, stage = 1) {
      const nextStage = Math.max(1, Math.min(6, Math.floor(stage)));
      if (nextStage !== moonStage) {
        moonFrom = moonPosition(elapsedMs, moonStarted, moonFrom, moonTarget);
        moonStage = nextStage;
        moonTarget = stageY(nextStage);
        moonStarted = elapsedMs;
      }
      if (nextStage !== cachedStage) {
        cachedStage = nextStage;
        this.resize(layout.width, layout.height, layout);
      } else if (!cacheContext || cacheWidth !== Math.ceil(layout.width) || cacheHeight !== Math.ceil(layout.height) || !sameRect(cachedBoard, layout.board)) {
        this.resize(layout.width, layout.height, layout);
      }
      context.drawImage(cache, 0, 0, layout.width, layout.height);
      drawStars(context, layout.width, layout.height, elapsedMs, selected);
      const progress = Math.min(1, Math.max(0, (elapsedMs - moonStarted) / 2400));
      const moonY = moonFrom + (moonTarget - moonFrom) * easeInOutSine(progress);
      drawMoon(context, layout.width, layout.height, elapsedMs, nextStage, moonY, selected);
      drawBokeh(context, layout.width, layout.height, elapsedMs, sprites, selected);
      drawSprinkles(context, layout.width, layout.height, elapsedMs, sprites);
    },
  };
}

function drawStatic(ctx: CanvasRenderingContext2D, width: number, height: number, board: Layout['board'], colours: ThemeColours, stage: number): void {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, colours.skyTop);
  sky.addColorStop(1, colours.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
  const horizon = ctx.createRadialGradient(width / 2, height * 0.62, 0, width / 2, height * 0.62, width * 0.9);
  horizon.addColorStop(0, withAlpha(colours.horizon, 0.18 + Math.max(0, stage - 1) * 0.03));
  horizon.addColorStop(1, withAlpha(colours.horizon, 0));
  ctx.fillStyle = horizon;
  ctx.fillRect(0, 0, width, height);

  const starCount = height / width >= 1.25 ? 60 : 110;
  for (let i = 0; i < starCount; i += 1) {
    const star = stars[i]!;
    if (star.twinkle) continue;
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = colours.star;
    ctx.beginPath(); ctx.arc(star.x * width, star.y * height, star.radius, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  const scale = Math.min(width, height);
  for (const jar of jars) drawJar(ctx, jar.x * width, jar.y * height, jar.width * width, jar.height * scale, jar.lid * scale, colours, jar.y > 0.4 ? 0.85 : 1);
  const shelfY1 = height * 0.30;
  const shelfY2 = height * 0.48;
  for (const y of [shelfY1, shelfY2]) {
    ctx.fillStyle = colours.silhouette;
    ctx.fill(roundedRect(ctx, 0, y, width, Math.max(8, height * 0.018), height * 0.009));
    ctx.strokeStyle = withAlpha(colours.silhouetteRim, 0.95);
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, y + 1); ctx.lineTo(width, y + 1); ctx.stroke();
  }

  const counterY = board.y + board.height / 2;
  const radius = Math.min(30, height * 0.04);
  ctx.fillStyle = colours.counter;
  ctx.beginPath();
  ctx.moveTo(0, counterY + radius);
  ctx.quadraticCurveTo(0, counterY, radius, counterY);
  ctx.lineTo(width - radius, counterY);
  ctx.quadraticCurveTo(width, counterY, width, counterY + radius);
  ctx.lineTo(width, height); ctx.lineTo(0, height); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = withAlpha(colours.silhouetteRim, 0.5);
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(radius, counterY + 1); ctx.lineTo(width - radius, counterY + 1); ctx.stroke();
  // The board reflection sits behind the future board and reads as a soft counter sheen.
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.translate(0, board.y * 2 + board.height + board.height * 0.3);
  ctx.scale(1, -1);
  const frame = ctx.createLinearGradient(0, board.y, 0, board.y + board.height);
  frame.addColorStop(0, colours.frameLight); frame.addColorStop(0.25, colours.frame); frame.addColorStop(1, colours.frameDark);
  ctx.fillStyle = frame;
  ctx.fill(roundedRect(ctx, board.x, board.y, board.width, board.height, board.width * 0.06));
  ctx.restore();
}

function drawJar(ctx: CanvasRenderingContext2D, cx: number, bottom: number, width: number, height: number, lid: number, colours: ThemeColours, alpha: number): void {
  const x = cx - width / 2;
  const y = bottom - height;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = colours.silhouette;
  ctx.fill(roundedRect(ctx, x, y + lid, width, height - lid, width * 0.18));
  ctx.fill(roundedRect(ctx, cx - width * 0.32, y, width * 0.64, lid * 1.35, lid * 0.25));
  ctx.fillRect(cx - width * 0.38, y + lid, width * 0.76, lid * 0.45);
  ctx.strokeStyle = colours.silhouetteRim;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x + width * 0.12, y + lid + 2); ctx.lineTo(x + width * 0.88, y + lid + 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + width * 0.08, bottom - 2); ctx.quadraticCurveTo(cx, bottom + 2, x + width * 0.92, bottom - 2); ctx.stroke();
  ctx.restore();
}

function drawStars(ctx: CanvasRenderingContext2D, width: number, height: number, elapsed: number, colours: ThemeColours): void {
  const count = height / width >= 1.25 ? 60 : 110;
  for (let i = 0; i < count; i += 1) {
    const star = stars[i]!;
    if (!star.twinkle) continue;
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(elapsed / star.period * Math.PI * 2 + star.phase);
    ctx.fillStyle = colours.star;
    ctx.beginPath(); ctx.arc(star.x * width, star.y * height, star.radius, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawMoon(ctx: CanvasRenderingContext2D, width: number, height: number, elapsed: number, stage: number, yFraction: number, colours: ThemeColours): void {
  const x = width * 0.78;
  const radius = width < 600 ? width * 0.07 : 46;
  const pulse = stage >= 6 ? 1 + 0.06 * Math.sin(elapsed / 6000 * Math.PI * 2) : 1;
  const y = height * yFraction;
  const halo = ctx.createRadialGradient(x, y, 0, x, y, radius * 3 * pulse);
  halo.addColorStop(0, withAlpha(colours.moon, 0.25)); halo.addColorStop(1, withAlpha(colours.moon, 0));
  ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(x, y, radius * 3 * pulse, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = colours.moon; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
}

function drawBokeh(ctx: CanvasRenderingContext2D, width: number, height: number, elapsed: number, sprites: Map<string, HTMLCanvasElement>, colours: ThemeColours): void {
  ctx.globalAlpha = 1;
  const count = height / width >= 1.25 ? 12 : 18;
  for (let i = 0; i < count; i += 1) {
    const light = bokeh[i]!;
    const y = ((light.y * height - elapsed / 1000 * light.speed) % (height + light.radius * 2) + height + light.radius * 2) % (height + light.radius * 2) - light.radius;
    const x = light.x * width + Math.sin(elapsed / 2400 + light.phase) * 12;
    const sprite = sprites.get([colours.bokehA, colours.bokehB, colours.bokehC][light.colourIndex]!);
    if (sprite) ctx.drawImage(sprite, x - light.radius, y - light.radius, light.radius * 2, light.radius * 2);
  }
}

function drawSprinkles(ctx: CanvasRenderingContext2D, width: number, height: number, elapsed: number, sprites: Map<string, HTMLCanvasElement>): void {
  for (const sprinkle of sprinkles) {
    const y = height * sprinkle.y + Math.sin(elapsed / 2800 + sprinkle.phase) * 5;
    const x = sprinkle.x * width + Math.sin(elapsed / 3600 + sprinkle.phase) * 8;
    const sprite = sprites.get(`sprinkle:${sprinkle.colour}`);
    if (sprite) ctx.drawImage(sprite, x - 5, y - 5, 10, 20);
  }
}

function makeSprinkleSprite(colour: string): HTMLCanvasElement {
  const sprite = document.createElement('canvas'); sprite.width = 20; sprite.height = 30;
  const ctx = sprite.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(10, 15, 1, 10, 15, 14);
    gradient.addColorStop(0, withAlpha(colour, 0.25)); gradient.addColorStop(1, withAlpha(colour, 0));
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 20, 30);
    ctx.fillStyle = withAlpha(colour, 0.25);
    ctx.fill(roundedRect(ctx, 8.5, 10, 3, 10, 1.5));
  }
  return sprite;
}

function stageY(stage: number): number { return [0.26, 0.21, 0.16, 0.12, 0.09, 0.07][stage - 1]!; }

function moonPosition(elapsed: number, started: number, from: number, target: number): number {
  const progress = Math.min(1, Math.max(0, (elapsed - started) / 2400));
  return from + (target - from) * easeInOutSine(progress);
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): Path2D {
  const path = new Path2D();
  path.roundRect(x, y, width, height, radius);
  return path;
}

function sameRect(a: Layout['board'] | undefined, b: Layout['board']): boolean { return !!a && a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height; }
