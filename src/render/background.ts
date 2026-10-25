// SG §7.1, §7.3, §14: layered, palette-driven theme backgrounds.
import { PALETTE, type ThemeKey, type ThemeColours } from './palette';
import { withAlpha } from './colour';
import { createCosmeticRng } from './cosmeticRng';
import { easeInOutSine } from './easing';
import type { Layout } from './layout';
import { allowFlashStart } from './fx/flashLimiter';

interface Dot { x: number; y: number; radius: number; phase: number; period: number; twinkle: boolean }
interface Jar { x: number; y: number; width: number; height: number; lid: number; row: number }
interface FloatLight { x: number; y: number; radius: number; speed: number; phase: number; colourIndex: number }
interface Sprinkle { x: number; y: number; speed: number; phase: number; colour: string }

export interface Background {
  setTheme(theme: ThemeKey, elapsedMs: number): void;
  resize(width: number, height: number, layout: Layout): void;
  draw(context: CanvasRenderingContext2D, elapsedMs: number, layout: Layout, stage?: number): void;
  react(kind: 'clear' | 'combo' | 'tier4' | 'big' | 'huge' | 'mega' | 'allClear' | 'gameOver', elapsedMs: number, flavour?: number): void;
  setReducedMotion(enabled: boolean): void;
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
    jars.push({ x: (i + 0.5 + (random() - 0.5) * 0.28) * width, y: row === 0 ? 0.3 : 0.48, width: jarWidth, height: 0.12 + random() * 0.1, lid: 0.018 + random() * 0.012, row });
  }
}
for (let i = 0; i < 18; i += 1) bokeh.push({ x: random(), y: 0.22 + random() * 0.78, radius: 18 + random() * 46, speed: 4 + random() * 6, phase: random() * Math.PI * 2, colourIndex: i % 3 });
for (let i = 0; i < 8; i += 1) sprinkles.push({ x: i % 2 === 0 ? random() * 0.12 : 0.88 + random() * 0.12, y: 0.45 + random() * 0.52, speed: 3 + random() * 3, phase: random() * Math.PI * 2, colour: sprinkleColours[i % sprinkleColours.length]! });

export function createBackground(themeId: ThemeKey = 'midnight'): Background {
  let selectedId = themeId;
  let selected = PALETTE.theme[selectedId];
  let themeChangedAt = -1000;
  const cache = document.createElement('canvas');
  const silhouetteCache = document.createElement('canvas');
  let cacheContext = cache.getContext('2d');
  let previousSilhouette: HTMLCanvasElement | undefined;
  let cacheWidth = 0;
  let cacheHeight = 0;
  let cachedBoard: Layout['board'] | undefined;
  let cachedStage = 1;
  let moonStage = 1;
  let moonFrom = 0.26;
  let moonTarget = 0.26;
  let moonStarted = 0;
  const sprites = new Map<string, HTMLCanvasElement>();
  let transitionCanvas: HTMLCanvasElement | undefined;
  let reactionAt = -1; let reactionKind: 'clear' | 'combo' | 'tier4' | 'big' | 'huge' | 'mega' | 'allClear' | 'gameOver' = 'clear'; let reactionColour: string = selected.horizon;
  let reducedMotion = false;
  let showAllClearFlash = false;
  let lastClearAt = -1;

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
    setTheme(theme, elapsedMs) {
      if (theme === selectedId) return;
      if (cacheWidth > 0 && cacheHeight > 0) {
        transitionCanvas = document.createElement('canvas'); transitionCanvas.width = cacheWidth; transitionCanvas.height = cacheHeight;
        const transitionContext = transitionCanvas.getContext('2d');
        if (transitionContext) transitionContext.drawImage(cache, 0, 0);
      }
      if (silhouetteCache.width > 0 && silhouetteCache.height > 0) {
        previousSilhouette = document.createElement('canvas'); previousSilhouette.width = silhouetteCache.width; previousSilhouette.height = silhouetteCache.height;
        previousSilhouette.getContext('2d')?.drawImage(silhouetteCache, 0, 0);
      }
      selectedId = theme;
      selected = PALETTE.theme[theme];
      themeChangedAt = elapsedMs;
      sprites.clear();
      for (const colour of [selected.bokehA, selected.bokehB, selected.bokehC]) sprites.set(colour, makeSprite(colour, 64));
      for (const colour of sprinkleColours) sprites.set(`sprinkle:${colour}`, makeSprinkleSprite(colour));
      cacheWidth = 0;
    },
    resize(width, height, layout) {
      cacheWidth = Math.max(1, Math.ceil(width));
      cacheHeight = Math.max(1, Math.ceil(height));
      cache.width = cacheWidth;
      cache.height = cacheHeight;
      cacheContext = cache.getContext('2d');
      silhouetteCache.width = cacheWidth; silhouetteCache.height = cacheHeight;
      cachedBoard = { ...layout.board };
      if (!cacheContext) return;
      drawStatic(cacheContext, cacheWidth, cacheHeight, cachedBoard, selected, cachedStage);
      const silhouetteContext = silhouetteCache.getContext('2d');
      if (silhouetteContext) drawThemeSilhouette(silhouetteContext, cacheWidth, cacheHeight, selected, selectedId);
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
      const fade = Math.min(1, Math.max(0, (elapsedMs - themeChangedAt) / 400));
      if (transitionCanvas && fade < 1) { context.save(); context.globalAlpha = 1 - fade; context.drawImage(transitionCanvas, 0, 0, layout.width, layout.height); context.restore(); }
      if (cacheWidth > 0) { context.save(); context.globalAlpha = fade; context.drawImage(cache, 0, 0, layout.width, layout.height); context.restore(); }
      const reactionAge = elapsedMs - reactionAt; const allClearFlash = !reducedMotion && showAllClearFlash && reactionKind === 'allClear' && reactionAge >= 0 && reactionAge < 300;
      context.save(); context.globalAlpha = fade; drawStars(context, layout.width, layout.height, elapsedMs, selected, allClearFlash); context.restore();
      const progress = Math.min(1, Math.max(0, (elapsedMs - moonStarted) / 2400));
      const moonY = moonFrom + (moonTarget - moonFrom) * easeInOutSine(progress);
      if (fade < 1 && previousSilhouette) { context.save(); context.globalAlpha = 1 - fade; context.drawImage(previousSilhouette, 0, 0, layout.width, layout.height); context.restore(); }
      context.save(); context.globalAlpha = fade; context.drawImage(silhouetteCache, 0, 0, layout.width, layout.height);
      drawMoon(context, layout, elapsedMs, nextStage, moonY, selected, selectedId, !reducedMotion && reactionKind === 'allClear' && reactionAge < 800 ? 2 : 1);
      drawThemeAir(context, layout.width, layout.height, elapsedMs, selected, selectedId);
      context.restore();
      if (fade >= 1) { transitionCanvas = undefined; previousSilhouette = undefined; }
      const clearBoost = lastClearAt >= 0 && elapsedMs - lastClearAt >= 0 && elapsedMs - lastClearAt < 300 ? 0.08 : 0;
      const pulse = !reducedMotion && reactionKind === 'combo' && reactionAge >= 0 && reactionAge < 500 ? 1 + 0.25 * Math.sin(Math.PI * reactionAge / 500) : 1;
      const speed = reactionKind === 'tier4' && reactionAge >= 0 && reactionAge < 500 ? 3 : 1;
      drawBokeh(context, layout.width, layout.height, reducedMotion ? 0 : elapsedMs, sprites, selected, clearBoost, pulse, speed);
      drawSprinkles(context, layout.width, layout.height, elapsedMs, sprites);
      const age = elapsedMs - reactionAt; const duration = reducedMotion ? 200 : reactionKind === 'allClear' ? 800 : reactionKind === 'combo' ? 1200 : reactionKind === 'gameOver' ? 400 : 500;
      if (reactionAt >= 0 && age < duration && ['big', 'huge', 'mega', 'gameOver', 'combo', 'tier4'].includes(reactionKind)) {
        context.save(); const fadeAmount = Math.max(0, 1 - age / duration); const alpha = Math.min(0.25, (reducedMotion ? 0.08 : reactionKind === 'big' ? 0.18 : reactionKind === 'huge' ? 0.26 : reactionKind === 'mega' ? 0.36 : reactionKind === 'gameOver' ? 0.35 : 0.25) * fadeAmount);
        if (reactionKind === 'combo' || reactionKind === 'tier4') { const glow = context.createRadialGradient(layout.width * 0.5, layout.height * 0.62, 0, layout.width * 0.5, layout.height * 0.62, layout.width * 0.9); glow.addColorStop(0, withAlpha(reactionColour, alpha)); glow.addColorStop(1, withAlpha(reactionColour, 0)); context.fillStyle = glow; context.fillRect(0, layout.height * 0.36, layout.width, layout.height * 0.5); }
        else { context.globalAlpha = alpha; context.fillStyle = reactionKind === 'gameOver' ? PALETTE.ui.scrim : reactionColour; context.fillRect(0, 0, layout.width, layout.height); } context.restore();
      }
      if (!reducedMotion && selectedId === 'midnight' && ['big', 'huge', 'mega'].includes(reactionKind) && age >= 0 && age < 400) drawJarRimFlicker(context, layout.width, layout.height, age, selected);
    },
    react(kind, elapsedMs, flavour = 0) { reactionKind = kind; reactionAt = elapsedMs; showAllClearFlash = kind === 'allClear' && allowFlashStart(elapsedMs); if (kind !== 'gameOver') lastClearAt = elapsedMs; if (flavour > 0) reactionColour = PALETTE.flavour[(['cherry','orange','lemon','apple','blueberry','grape','bubblegum'] as const)[flavour - 1]!].glow; },
    setReducedMotion(enabled) { reducedMotion = enabled; },
  };
}

function drawJarRimFlicker(ctx: CanvasRenderingContext2D, width: number, height: number, age: number, colours: ThemeColours): void {
  const scale = Math.min(width, height); const desktop = width >= 900 && height / width < 1.25; const rows = desktop ? [height * 0.57, height * 0.72] : [height * 0.30, height * 0.48];
  ctx.save(); ctx.globalAlpha = (1 - age / 400) * (0.55 + 0.45 * Math.sin(age / 34)); ctx.strokeStyle = colours.silhouetteRim; ctx.lineWidth = 2;
  for (const jar of jars) { if (desktop && jar.x > 0.24 && jar.x < 0.76) continue; const jarWidth = Math.min(desktop ? jar.width * width * 0.72 : jar.width * width, width * (desktop ? 0.11 : 0.16)); const jarHeight = Math.min(jar.height * scale, height * 0.11); const top = rows[jar.row]! - jarHeight; const x = jar.x * width - jarWidth / 2; ctx.beginPath(); ctx.moveTo(x + jarWidth * 0.18, top + 1); ctx.quadraticCurveTo(x + jarWidth / 2, top - 2, x + jarWidth * 0.82, top + 1); ctx.stroke(); }
  ctx.restore();
}

function drawThemeSilhouette(ctx: CanvasRenderingContext2D, width: number, height: number, colours: ThemeColours, theme: ThemeKey): void {
  if (theme === 'midnight') { drawShelves(ctx, width, height, colours); return; }
  ctx.save(); ctx.globalAlpha *= 0.58; ctx.fillStyle = colours.silhouette; ctx.strokeStyle = withAlpha(colours.silhouetteRim, 0.62); ctx.lineWidth = 2;
  if (theme === 'sunset') {
    ctx.fillRect(0, height * 0.37, width, height * 0.13);
    for (let i = 0; i < 7; i += 1) { const x = width * i / 7; ctx.fillRect(x + width * 0.018, height * 0.22 + (i % 2) * height * 0.04, width * 0.11, height * 0.28); ctx.beginPath(); ctx.moveTo(x + width * 0.018, height * 0.29); ctx.lineTo(x + width * 0.073, height * 0.21 + (i % 2) * height * 0.04); ctx.lineTo(x + width * 0.128, height * 0.29); ctx.stroke(); }
  } else if (theme === 'aquarium') {
    for (let i = 0; i < 12; i += 1) { const x = width * i / 11; ctx.lineWidth = width * 0.013; ctx.beginPath(); ctx.moveTo(x, height * 0.59); ctx.bezierCurveTo(x - 12, height * 0.46, x + 15, height * 0.37, x, height * (0.28 + (i % 3) * 0.035)); ctx.stroke(); }
    ctx.fillRect(0, height * 0.57, width, height * 0.06);
  } else if (theme === 'observatory') {
    ctx.beginPath(); ctx.arc(width * 0.5, height * 0.39, Math.min(width, height) * 0.17, Math.PI, 0); ctx.fill(); ctx.fillRect(width * 0.33, height * 0.39, width * 0.34, height * 0.08);
    ctx.beginPath(); ctx.moveTo(0, height * 0.51); ctx.quadraticCurveTo(width * 0.25, height * 0.39, width * 0.5, height * 0.51); ctx.quadraticCurveTo(width * 0.8, height * 0.42, width, height * 0.51); ctx.lineTo(width, height * 0.55); ctx.lineTo(0, height * 0.55); ctx.fill();
  } else if (theme === 'kitchen') {
    ctx.fillRect(0, height * 0.36, width, height * 0.025);
    for (let i = 0; i < 8; i += 1) { const x = width * (0.08 + i * 0.12); ctx.beginPath(); ctx.ellipse(x, height * 0.34, width * 0.035, height * 0.025, 0, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - width * 0.03, height * 0.34); ctx.lineTo(x - width * 0.025, height * 0.29); ctx.lineTo(x + width * 0.025, height * 0.29); ctx.lineTo(x + width * 0.03, height * 0.34); ctx.stroke(); }
  } else if (theme === 'snowglobe') {
    for (let i = 0; i < 9; i += 1) { const x = width * i / 8; const base = height * (0.52 + (i % 2) * 0.04); ctx.beginPath(); ctx.moveTo(x - width * 0.055, base); ctx.lineTo(x, base - height * 0.22); ctx.lineTo(x + width * 0.055, base); ctx.fill(); }
    ctx.fillRect(width * 0.47, height * 0.42, width * 0.08, height * 0.1);
  } else {
    ctx.beginPath(); ctx.moveTo(0, height * 0.52); ctx.quadraticCurveTo(width * 0.22, height * 0.36, width * 0.46, height * 0.51); ctx.quadraticCurveTo(width * 0.72, height * 0.35, width, height * 0.5); ctx.lineTo(width, height * 0.56); ctx.lineTo(0, height * 0.56); ctx.fill();
    for (let i = 0; i < 16; i += 1) { const x = width * i / 16; ctx.strokeRect(x, height * 0.47, 2, height * 0.09); }
  }
  ctx.restore();
}

function drawThemeAir(ctx: CanvasRenderingContext2D, width: number, height: number, elapsed: number, colours: ThemeColours, theme: ThemeKey): void {
  if (theme === 'midnight') return;
  ctx.save(); ctx.fillStyle = colours.star; ctx.strokeStyle = colours.star;
  if (theme === 'aquarium') {
    for (let i = 0; i < 24; i += 1) { const x = ((i * 83 + 25) % width); const y = height - ((elapsed * 0.025 + i * 47) % height); ctx.globalAlpha = 0.26; ctx.beginPath(); ctx.arc(x, y, 2 + i % 3, 0, Math.PI * 2); ctx.stroke(); }
  } else if (theme === 'snowglobe' || theme === 'kitchen') {
    const count = theme === 'snowglobe' ? 60 : 34;
    for (let i = 0; i < count; i += 1) { const x = (i * 97 + Math.sin(elapsed / 1300 + i) * 12) % width; const y = (i * 61 + elapsed * (theme === 'snowglobe' ? 0.018 : -0.006)) % height; ctx.globalAlpha = theme === 'snowglobe' ? 0.5 : 0.25; ctx.beginPath(); ctx.arc(x, y, theme === 'snowglobe' ? 1.5 + i % 2 : 2 + i % 3, 0, Math.PI * 2); ctx.fill(); }
  } else if (theme === 'dawn') {
    for (let i = 0; i < 3; i += 1) { const x = ((i * 0.36 + elapsed / 80000) % 1) * width; const y = height * (0.3 + i * 0.07); ctx.globalAlpha = 0.18; ctx.beginPath(); ctx.ellipse(x, y, width * 0.055, height * 0.014, 0, 0, Math.PI * 2); ctx.fill(); }
  } else if (theme === 'observatory') {
    const x = (elapsed / 9 % 1) * width; const y = height * (0.13 + (elapsed / 9000 % 1) * 0.2); ctx.globalAlpha = 0.75; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 32, y + 14); ctx.stroke();
  } else {
    for (let i = 0; i < 18; i += 1) { ctx.globalAlpha = 0.45; ctx.beginPath(); ctx.arc(stars[i]!.x * width, stars[i]!.y * height, stars[i]!.radius, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.restore();
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

function drawShelves(ctx: CanvasRenderingContext2D, width: number, height: number, colours: ThemeColours): void {
  const scale = Math.min(width, height);
  const desktop = width >= 900 && height / width < 1.25;
  // spec-note: Desktop shelves move below the HUD and stay out of its left column; portrait keeps the approved shelf composition.
  const rows = desktop ? [height * 0.57, height * 0.72] : [height * 0.30, height * 0.48];
  for (let i = 0; i < jars.length; i += 1) {
    const jar = jars[i]!; const row = jar.row;
    if (desktop && jar.x > 0.24 && jar.x < 0.76) continue;
    const bottom = rows[row]!;
    const jarHeight = Math.min(jar.height * scale, height * 0.11);
    drawJar(ctx, jar.x * width, bottom, desktop ? jar.width * width * 0.72 : jar.width * width, jarHeight, Math.min(jar.lid * scale, jarHeight * 0.13), colours, desktop ? (row ? 0.38 : 0.32) : (row ? 0.85 : 1));
  }
  for (const y of rows) {
    ctx.fillStyle = withAlpha(colours.silhouette, desktop ? 0.46 : 1); ctx.strokeStyle = withAlpha(colours.silhouetteRim, desktop ? 0.46 : 0.95); ctx.lineWidth = 1.5;
    const segments: [number, number][] = desktop ? [[0, width * 0.24], [width * 0.76, width]] : [[0, width]];
    for (const [start, end] of segments) { ctx.fill(roundedRect(ctx, start, y, end - start, Math.max(6, height * (desktop ? 0.009 : 0.018)), height * 0.009)); ctx.beginPath(); ctx.moveTo(start, y + 1); ctx.lineTo(end, y + 1); ctx.stroke(); }
  }
  if (desktop) {
    // Soft foreground haze preserves a quiet reading area behind the left score panel.
    const haze = ctx.createLinearGradient(0, height * 0.2, width * 0.39, height * 0.56);
    haze.addColorStop(0, withAlpha(colours.skyTop, 0.38)); haze.addColorStop(1, withAlpha(colours.skyTop, 0));
    ctx.fillStyle = haze; ctx.fillRect(0, height * 0.18, width * 0.43, height * 0.42);
  }
}

function drawJar(ctx: CanvasRenderingContext2D, cx: number, bottom: number, width: number, height: number, lid: number, colours: ThemeColours, alpha: number): void {
  const x = cx - width / 2;
  const y = bottom - height;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = colours.silhouette;
  ctx.fill(roundedRect(ctx, x, y + lid, width, height - lid, width * 0.18));
  // Candy silhouettes and a paper label make these read as jars rather than dark blobs.
  ctx.save(); ctx.beginPath(); ctx.roundRect(x + width * 0.08, y + lid + height * 0.28, width * 0.84, height * 0.56, width * 0.1); ctx.clip();
  const sweets = [PALETTE.flavour.cherry.base, PALETTE.flavour.lemon.base, PALETTE.flavour.blueberry.base, PALETTE.flavour.apple.base, PALETTE.flavour.orange.base];
  for (let i = 0; i < 7; i += 1) { ctx.globalAlpha = 0.34; ctx.fillStyle = sweets[i % sweets.length]!; ctx.beginPath(); ctx.ellipse(x + width * (0.18 + (i % 3) * 0.3), y + height * (0.4 + Math.floor(i / 3) * 0.16), width * 0.13, height * 0.09, (i % 2) * 0.4, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore(); ctx.globalAlpha = alpha;
  ctx.fillStyle = withAlpha(colours.frameLight, 0.82); ctx.fill(roundedRect(ctx, x + width * 0.08, y + height * 0.48, width * 0.84, height * 0.2, width * 0.025));
  ctx.fillStyle = withAlpha(colours.silhouetteRim, 0.55); ctx.fillRect(x + width * 0.28, y + height * 0.55, width * 0.44, Math.max(1, height * 0.025));
  ctx.fill(roundedRect(ctx, cx - width * 0.32, y, width * 0.64, lid * 1.35, lid * 0.25));
  ctx.fillRect(cx - width * 0.38, y + lid, width * 0.76, lid * 0.45);
  ctx.fillStyle = withAlpha(PALETTE.light.specular, 0.16); ctx.fill(roundedRect(ctx, x + width * 0.12, y + lid + height * 0.08, width * 0.12, height * 0.26, width * 0.06));
  ctx.strokeStyle = withAlpha(PALETTE.light.specular, 0.42); ctx.lineWidth = Math.max(1, width * 0.018); ctx.beginPath(); ctx.moveTo(x + width * 0.13, y + lid + height * 0.1); ctx.quadraticCurveTo(x + width * 0.2, y + lid + height * 0.04, x + width * 0.28, y + lid + height * 0.1); ctx.stroke();
  ctx.strokeStyle = colours.silhouetteRim;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x + width * 0.12, y + lid + 2); ctx.lineTo(x + width * 0.88, y + lid + 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + width * 0.08, bottom - 2); ctx.quadraticCurveTo(cx, bottom + 2, x + width * 0.92, bottom - 2); ctx.stroke();
  ctx.restore();
}

function drawStars(ctx: CanvasRenderingContext2D, width: number, height: number, elapsed: number, colours: ThemeColours, forceTwinkle = false): void {
  const count = height / width >= 1.25 ? 60 : 110;
  for (let i = 0; i < count; i += 1) {
    const star = stars[i]!;
    if (!star.twinkle && !forceTwinkle) continue;
    ctx.globalAlpha = forceTwinkle ? 0.25 * (0.5 + 0.5 * Math.sin(elapsed / star.period * Math.PI * 2 + star.phase)) : 0.5 + 0.5 * Math.sin(elapsed / star.period * Math.PI * 2 + star.phase);
    ctx.fillStyle = colours.star;
    ctx.beginPath(); ctx.arc(star.x * width, star.y * height, star.radius, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawMoon(ctx: CanvasRenderingContext2D, layout: Layout, elapsed: number, stage: number, yFraction: number, colours: ThemeColours, theme: ThemeKey, haloScale = 1): void {
  const { width, height } = layout;
  // spec-note: On portrait screens keep the moon in the far right sky lane and clamp its lower stages below the top-bar buttons.
  const x = layout.portrait ? width * 0.86 : theme === 'sunset' ? width * 0.5 : theme === 'kitchen' ? width * 0.5 : theme === 'dawn' ? width * 0.76 : width * 0.78;
  const radius = width < 600 ? width * 0.07 : 46;
  const pulse = theme === 'midnight' && stage >= 6 ? 1 + 0.06 * Math.sin(elapsed / 6000 * Math.PI * 2) : 1;
  const stagePosition = theme === 'sunset' ? height * 0.42 : theme === 'kitchen' ? height * 0.16 : theme === 'dawn' ? height * 0.3 : height * yFraction;
  const y = layout.portrait ? Math.max(layout.topBar.y + layout.topBar.height + radius, stagePosition) : stagePosition;
  if (theme === 'aquarium') {
    const shaft = ctx.createLinearGradient(width * 0.48, 0, width * 0.58, height * 0.58); shaft.addColorStop(0, withAlpha(colours.moon, 0.18)); shaft.addColorStop(1, withAlpha(colours.moon, 0));
    ctx.fillStyle = shaft; ctx.beginPath(); ctx.moveTo(width * 0.4, 0); ctx.lineTo(width * 0.58, 0); ctx.lineTo(width * 0.72, height * 0.58); ctx.lineTo(width * 0.28, height * 0.58); ctx.closePath(); ctx.fill();
  }
  if (theme === 'kitchen') { ctx.strokeStyle = withAlpha(colours.silhouetteRim, 0.72); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, y - radius); ctx.stroke(); }
  if (theme === 'dawn') {
    ctx.save(); ctx.translate(x, y); ctx.rotate(elapsed / 1000 * Math.PI / 90); ctx.strokeStyle = withAlpha(colours.moon, 0.48); ctx.lineWidth = 3;
    for (let i = 0; i < 12; i += 1) { const a = i * Math.PI / 6; ctx.beginPath(); ctx.moveTo(Math.cos(a) * radius * 1.25, Math.sin(a) * radius * 1.25); ctx.lineTo(Math.cos(a) * radius * 1.65, Math.sin(a) * radius * 1.65); ctx.stroke(); } ctx.restore();
  }
  if (theme !== 'sunset') {
  const halo = ctx.createRadialGradient(x, y, 0, x, y, radius * 3 * pulse * haloScale);
  halo.addColorStop(0, withAlpha(colours.moon, theme === 'kitchen' ? 0.32 : 0.25)); halo.addColorStop(1, withAlpha(colours.moon, 0));
  ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(x, y, radius * 3 * pulse, 0, Math.PI * 2); ctx.fill();
  }
  const moon = ctx.createRadialGradient(x - radius * 0.32, y - radius * 0.36, radius * 0.04, x, y, radius * 1.08);
  moon.addColorStop(0, PALETTE.light.specular); moon.addColorStop(0.42, colours.moon); moon.addColorStop(1, withAlpha(colours.moon, 0.64));
  ctx.fillStyle = moon; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.globalAlpha = 0.12; ctx.fillStyle = colours.skyBottom; ctx.beginPath(); ctx.arc(x + radius * 0.36, y + radius * 0.3, radius * 0.8, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  if (theme === 'observatory') { ctx.save(); ctx.translate(x, y); ctx.rotate(-0.28); ctx.strokeStyle = withAlpha(colours.moon, 0.86); ctx.lineWidth = Math.max(2, radius * 0.07); ctx.beginPath(); ctx.ellipse(0, 0, radius * 1.7, radius * 0.48, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
}

function drawBokeh(ctx: CanvasRenderingContext2D, width: number, height: number, elapsed: number, sprites: Map<string, HTMLCanvasElement>, colours: ThemeColours, alphaBoost = 0, scale = 1, speed = 1): void {
  // The clear boost sets globalAlpha per sprite; save/restore so it never leaks into the board, HUD and gloops drawn after the background.
  ctx.save();
  ctx.globalAlpha = 1;
  const count = height / width >= 1.25 ? 12 : 18;
  for (let i = 0; i < count; i += 1) {
    const light = bokeh[i]!;
    const y = ((light.y * height - elapsed / 1000 * light.speed * speed) % (height + light.radius * 2) + height + light.radius * 2) % (height + light.radius * 2) - light.radius;
    const x = light.x * width + Math.sin(elapsed / 2400 + light.phase) * 12;
    const sprite = sprites.get([colours.bokehA, colours.bokehB, colours.bokehC][light.colourIndex]!);
    if (sprite) { const r = light.radius * scale; ctx.globalAlpha = 1; ctx.drawImage(sprite, x - r, y - r, r * 2, r * 2); if (alphaBoost > 0) { ctx.globalAlpha = 0.1; ctx.drawImage(sprite, x - r, y - r, r * 2, r * 2); } }
  }
  ctx.restore();
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
