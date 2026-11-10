// SG §11.4–11.6, §15 and §20.4: score, combo pips, rescue charge and Adventure moves.
import type { GameState } from '../core/types';
import type { Layout } from './layout';
import { PALETTE } from './palette';
import { S } from '../ui/strings';
import { scoreAt, scorePunchScale } from './fx/scorePunch';

const numberFormat = new Intl.NumberFormat('en-US');
const flameSprites = new Map<number, HTMLCanvasElement>();

export function drawHud(ctx: CanvasRenderingContext2D, layout: Layout, state: GameState, best: number, elapsed: number, scoreShown: number, comboLostAt = -1, challengeScore?: number, candyFlameUntil = -1, flameFlavour = 1, reducedMotion = false, scoreFrom = scoreShown, scoreStartedAt = elapsed, scoreDuration = 600, newBestAt = -1, flameBreakAt = -1, comboPulseAt = -1, scoreSparkleAt = -1, scorePoints = state.score - scoreFrom, adventureMovesChangedAt = -1): number {
  if (state.adventure) {
    const moves = state.adventure.movesLeft; const text = numberFormat.format(moves); const x = layout.portrait ? layout.width / 2 : landscapeTextX(layout); const y = layout.portrait ? layout.score.y + layout.score.height * 0.59 : layout.score.y + 116; const age = elapsed - adventureMovesChangedAt;
    const squash = reducedMotion || age < 0 || age >= 120 ? 1 : age < 60 ? 1 - 0.08 * age / 60 : 0.92 + 0.08 * (age - 60) / 60;
    const dangerPulse = !reducedMotion && moves <= 3 && age >= 0 && age < 200 ? 1 + 0.08 * Math.sin(Math.PI * age / 200) : squash;
    ctx.save(); ctx.textAlign = layout.portrait ? 'center' : 'left'; ctx.font = layout.portrait ? '800 52px "Baloo 2",sans-serif' : '800 54px "Baloo 2",sans-serif'; ctx.fillStyle = moves <= 3 ? PALETTE.ui.danger : PALETTE.ui.textPrimary; ctx.translate(x, y); ctx.scale(dangerPulse, dangerPulse); ctx.fillText(text, 0, 0); ctx.restore();
    ctx.save(); ctx.textAlign = layout.portrait ? 'center' : 'left'; ctx.font = '700 15px Nunito,sans-serif'; ctx.fillStyle = PALETTE.ui.textSecondary; // spec-note: On 320x568 the score band is 58.8 px, so the label at y + 28 sat under the goal strip and its glyphs were cut. The label now stays 6 px above the band bottom; taller bands keep the old position.
    const labelY = layout.portrait ? Math.min(y + 28, layout.score.y + layout.score.height - 6) : y + 28;
    ctx.fillText(S.movesLeft, x, labelY); ctx.restore(); return state.score;
  }
  const duration = reducedMotion ? 150 : Math.min(600, Math.max(150, scoreDuration)); const age = elapsed - scoreStartedAt; const progress = Math.min(1, Math.max(0, age / duration));
  const score = scoreAt(scoreFrom, state.score, age, duration, reducedMotion);
  const tickAge = elapsed % 40; const tickPulse = !reducedMotion && progress < 1 ? 0.03 * Math.exp(-12 * Math.max(0, tickAge) / 1000) * Math.cos(2 * Math.PI * 12 * Math.max(0, tickAge) / 1000) : 0;
  const scoreScale = reducedMotion ? 1 : scorePunchScale(age, duration, scorePoints, false) + tickPulse;
  const pulseAlpha = !reducedMotion && age >= duration ? Math.max(0, 1 - (age - duration) / 300) : 0;
  const tier = state.combo >= 12 ? 4 : state.combo >= 8 ? 3 : 0; const flaming = tier >= 3 || elapsed < candyFlameUntil || (flameBreakAt >= 0 && elapsed - flameBreakAt < 400);
  ctx.save(); ctx.textAlign = 'center'; ctx.fillStyle = PALETTE.ui.textPrimary;
  if (layout.portrait) {
    // spec-note: Daily gets one row per line (score, Best, Tray, Apple pops) inside the taller score band. Before, Best, Tray and Apple pops shared baselines 8 to 11 px apart, so 14 px text collided.
    const daily = state.mode === 'daily'; const bandY = layout.score.y; const bandH = layout.score.height;
    ctx.font = '800 52px "Baloo 2", sans-serif'; drawScore(ctx, numberFormat.format(Math.round(score)), layout.width / 2, bandY + bandH * (daily ? 0.5 : 0.59), elapsed, flaming, flameFlavour, reducedMotion, tier, flameBreakAt, candyFlameUntil, scoreScale, pulseAlpha);
    if (daily) {
      ctx.font = '800 14px Nunito, sans-serif'; ctx.fillStyle = PALETTE.ui.textSecondary; ctx.fillText(S.dailyTray(Math.min(30, state.traysDealt)), layout.width / 2, bandY + bandH * 0.83);
      if (state.daily) { ctx.font = '800 14px Nunito, sans-serif'; ctx.fillStyle = PALETTE.ui.gold; ctx.fillText(S.fodDouble(S.flavourName(state.daily.flavourOfDay)), layout.width / 2, bandY + bandH * 0.98); }
    }
    if (state.mode !== 'zen' && best > 0) { const isNewBest = state.score > best; ctx.font = '700 15px Nunito, sans-serif'; ctx.fillStyle = isNewBest ? PALETTE.ui.gold : PALETTE.ui.textSecondary; ctx.fillText(isNewBest ? S.newBest : S.best(numberFormat.format(best)), layout.width / 2, bandY + bandH * (daily ? 0.67 : 0.88)); }
  } else {
    // spec-note: landscape panel text is inset 10% of the panel width (it sat on the panel edge); Stage sits below the chase bar label instead of on it.
    const sx = landscapeTextX(layout);
    ctx.textAlign = 'left'; ctx.font = '700 18px Nunito, sans-serif'; ctx.fillStyle = PALETTE.ui.textSecondary; ctx.fillText(S.score, sx, layout.score.y + 60);
    ctx.font = '800 54px "Baloo 2", sans-serif'; ctx.fillStyle = PALETTE.ui.textPrimary; drawScore(ctx, numberFormat.format(Math.round(score)), sx, layout.score.y + 116, elapsed, flaming, flameFlavour, reducedMotion, tier, flameBreakAt, candyFlameUntil, scoreScale, pulseAlpha);
    if (state.mode === 'daily') { ctx.font = '700 14px Nunito, sans-serif'; ctx.fillStyle = PALETTE.ui.textSecondary; ctx.fillText(S.dailyTray(Math.min(30, state.traysDealt)), sx, layout.score.y + 178); if (state.daily) { ctx.font = '800 14px Nunito, sans-serif'; ctx.fillStyle = PALETTE.ui.gold; ctx.fillText(S.fodDouble(S.flavourName(state.daily.flavourOfDay)), sx, layout.score.y + 206); } }
    if (state.mode !== 'zen' && best > 0) { const isNewBest = state.score > best; ctx.font = '700 16px Nunito, sans-serif'; ctx.fillStyle = isNewBest ? PALETTE.ui.gold : PALETTE.ui.textSecondary; ctx.fillText(isNewBest ? S.newBest : S.best(numberFormat.format(best)), sx, layout.score.y + (state.mode === 'daily' ? 150 : 148)); }
    if (state.mode === 'classic' || state.mode === 'expert') { ctx.font = '700 16px Nunito, sans-serif'; ctx.fillStyle = PALETTE.ui.textDim; ctx.fillText(S.stageLabel(state.stage), sx, layout.score.y + 228); }
  }
  if (scoreSparkleAt >= 0 && elapsed >= scoreSparkleAt && elapsed - scoreSparkleAt < 300) { const sparkleX = layout.portrait ? layout.width / 2 : landscapeTextX(layout); const sparkleY = layout.portrait ? layout.score.y + layout.score.height * 0.55 : layout.score.y + 116; const count = reducedMotion ? 2 : 6; ctx.save(); ctx.fillStyle = PALETTE.fx.sugar; ctx.globalAlpha = Math.max(0, 1 - (elapsed - scoreSparkleAt) / 300); for (let i = 0; i < count; i += 1) drawSparkle(ctx, sparkleX + Math.sin(i * 1.7 + elapsed / 70) * (16 + i * 4), sparkleY - 12 + Math.cos(i * 2.1 + elapsed / 80) * 10, 2.5); ctx.restore(); }
  const comboY = layout.portrait ? layout.combo.y + 19 : layout.combo.y + 34; ctx.textAlign = 'left'; ctx.font = '800 16px Nunito, sans-serif'; ctx.fillStyle = PALETTE.ui.textPrimary;
  const lostAge = elapsed - comboLostAt; const meterAlpha = 1;
  if (meterAlpha > 0) {
    ctx.globalAlpha = meterAlpha; const multiplier = state.combo >= 20 ? '10' : (1 + Math.max(0, state.combo - 1) * 0.5).toFixed(1);
    const showCombo = state.combo > 0;
    const baseX = layout.portrait ? layout.board.x + 8 : landscapeTextX(layout);
    if (showCombo) { const age = elapsed - comboPulseAt; const scale = age >= 0 && age < 160 ? 1 + 0.25 * (1 - age / 160) : 1; ctx.save(); ctx.translate(baseX, comboY); ctx.scale(scale, scale); ctx.fillText(S.combo(state.combo, multiplier), 0, 0); ctx.restore(); }
    else if (state.combo === 0 && comboLostAt >= 0 && lostAge < 200) { ctx.globalAlpha = Math.max(0, 1 - lostAge / 200); ctx.fillStyle = PALETTE.fx.comboLost; ctx.fillText(S.comboLost, baseX, comboY); ctx.globalAlpha = meterAlpha; }
    else if (state.combo >= 2) { ctx.fillStyle = PALETTE.ui.textPrimary; ctx.fillText(S.combo(state.combo, multiplier), baseX, comboY); }
    const pipY = comboY + 18;
    comboTextRight = showCombo ? baseX + ctx.measureText(S.combo(state.combo, multiplier)).width : 0;
    if (showCombo) for (let i = 0; i < 3; i += 1) { ctx.globalAlpha = meterAlpha * (i === 2 && state.fuse === 1 ? 0.65 + 0.35 * Math.sin(elapsed / 400 * Math.PI * 2) : 1); ctx.fillStyle = i < state.fuse ? PALETTE.fx.comboTier1 : PALETTE.ui.track; ctx.beginPath(); ctx.arc(baseX + 6 + i * 16, pipY, 5, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
  if ((state.mode === 'classic' || state.mode === 'expert') && (best > 0 || challengeScore !== undefined)) drawChaseBar(ctx, layout, score, best, challengeScore, elapsed, newBestAt);
  if (state.mode === 'classic') drawRescue(ctx, layout, state, elapsed);
  ctx.restore(); return score;
}

function drawScore(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, time: number, flaming: boolean, flavour: number, reduced: boolean, tier: number, flameBreakAt: number, flameUntil: number, scale: number, pulseAlpha: number): void {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.translate(-x, -y);
  if (flaming) { const key = (['cherry','orange','lemon','apple','blueberry','grape','bubblegum'] as const)[flavour - 1]!; const colour = PALETTE.flavour[key].base; ctx.save(); ctx.lineJoin = 'round'; ctx.lineWidth = 2.5; ctx.strokeStyle = colour; drawSteadyText(ctx, text, x, y, 'stroke');
    if (!reduced) { ctx.globalCompositeOperation = 'lighter'; const count = tier >= 4 ? 16 : 12; const rate = tier >= 4 ? 34 : 22; const breakFade = flameUntil > time || flameBreakAt < 0 || time - flameBreakAt >= 400 ? 1 : Math.max(0, 1 - (time - flameBreakAt) / 400); for (let i = 0; i < count; i += 1) { const phase = (time * rate / 1000 + i * 1.618) % count; const progress = phase / count; const rise = 18 + progress * 12; const sway = Math.sin(time / 100 + i * 2.1) * 4; const fx = x + (i / (count - 1) - 0.5) * Math.min(120, text.length * 25) + sway; const fy = y - 8 - rise; const size = (1 + 4 * (1 - progress)) * (0.2 + 0.8 * (1 - progress)); const flame = flameSprite(flavour); if (flame) { ctx.globalAlpha = breakFade; ctx.drawImage(flame, fx - size, fy - size * 2, size * 2, size * 3); } } ctx.globalAlpha = 1; }
    ctx.restore();
  }
  ctx.fillStyle = PALETTE.ui.textPrimary; drawSteadyText(ctx, text, x, y, 'fill');
  if (pulseAlpha > 0) { const colour = tier >= 4 ? PALETTE.fx.comboTier4 : tier >= 3 ? PALETTE.fx.comboTier3 : tier >= 2 ? PALETTE.fx.comboTier2 : tier >= 1 ? PALETTE.fx.comboTier1 : PALETTE.fx.numberFill; ctx.globalAlpha = pulseAlpha; ctx.fillStyle = colour; drawSteadyText(ctx, text, x, y, 'fill'); }
  ctx.restore();
}

// spec-note: Score digits sit in fixed-width slots (the widest digit of the current font), so a count-up never shifts the digits next to a changing one. The whole number is still centred on x, so it moves only when the digit count grows.
const advanceCache = new Map<string, number>();
const glyphWidthCache = new Map<string, number>();
interface GlyphSprite { canvas: HTMLCanvasElement; width: number; height: number; baseline: number }
const glyphSpriteCache = new Map<string, GlyphSprite | null>();
const GLYPH_SPRITE_LIMIT = 256;

function glyphWidth(ctx: CanvasRenderingContext2D, glyph: string): number {
  const key = `${ctx.font}|${glyph}`; let width = glyphWidthCache.get(key);
  if (width === undefined) { width = ctx.measureText(glyph).width; glyphWidthCache.set(key, width); }
  return width;
}

// SG §9.13.i: a scaled count-up changes the text transform every frame. Drawing glyphs straight with fillText re-rasterises them at each new scale, so each glyph is cached once as a 2x sprite and placed with drawImage instead.
function glyphSprite(ctx: CanvasRenderingContext2D, glyph: string, mode: 'fill' | 'stroke'): GlyphSprite | null {
  const paint = mode === 'fill' ? ctx.fillStyle : ctx.strokeStyle;
  // The sprite places the baseline for alphabetic text only; other baselines fall back to fillText.
  if (typeof paint !== 'string' || typeof document === 'undefined' || ctx.textBaseline !== 'alphabetic') return null;
  const size = /(\d+(?:\.\d+)?)px/.exec(ctx.font); if (!size) return null;
  const key = `${ctx.font}|${mode}|${paint}|${mode === 'stroke' ? `${ctx.lineWidth}|${ctx.lineJoin}` : ''}|${glyph}`;
  const cached = glyphSpriteCache.get(key); if (cached !== undefined) return cached;
  const fontSize = Number(size[1]); const stroke = mode === 'stroke' ? ctx.lineWidth : 0;
  const pad = Math.ceil(fontSize * 0.15 + stroke); const width = Math.ceil(glyphWidth(ctx, glyph) + pad * 2); const height = Math.ceil(fontSize * 1.4 + pad * 2); const baseline = pad + fontSize * 1.05;
  const canvas = document.createElement('canvas'); canvas.width = width * 2; canvas.height = height * 2;
  const sprite = canvas.getContext('2d');
  let result: GlyphSprite | null = null;
  if (sprite) {
    sprite.scale(2, 2); sprite.font = ctx.font; sprite.textAlign = 'center'; sprite.textBaseline = 'alphabetic';
    if (mode === 'fill') { sprite.fillStyle = paint; sprite.fillText(glyph, width / 2, baseline); }
    else { sprite.strokeStyle = paint; sprite.lineWidth = ctx.lineWidth; sprite.lineJoin = ctx.lineJoin; sprite.strokeText(glyph, width / 2, baseline); }
    result = { canvas, width, height, baseline };
  }
  if (glyphSpriteCache.size >= GLYPH_SPRITE_LIMIT) glyphSpriteCache.clear();
  glyphSpriteCache.set(key, result);
  return result;
}

function digitSlot(ctx: CanvasRenderingContext2D): number {
  let slot = advanceCache.get(ctx.font);
  if (slot === undefined) { slot = 0; for (const digit of '0123456789') slot = Math.max(slot, glyphWidth(ctx, digit)); advanceCache.set(ctx.font, slot); }
  return slot;
}

export function drawSteadyText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, mode: 'fill' | 'stroke'): void {
  const slot = digitSlot(ctx);
  const glyphs = [...text]; const widths = glyphs.map((glyph) => glyph >= '0' && glyph <= '9' ? slot : glyphWidth(ctx, glyph));
  const total = widths.reduce((sum, width) => sum + width, 0);
  const align = ctx.textAlign; ctx.textAlign = 'center';
  let cursor = x - total / 2;
  glyphs.forEach((glyph, index) => {
    const width = widths[index]!; const centre = cursor + width / 2; const sprite = glyphSprite(ctx, glyph, mode);
    if (sprite) ctx.drawImage(sprite.canvas, centre - sprite.width / 2, y - sprite.baseline, sprite.width, sprite.height);
    else if (mode === 'fill') ctx.fillText(glyph, centre, y); else ctx.strokeText(glyph, centre, y);
    cursor += width;
  });
  ctx.textAlign = align;
}

function drawChaseBar(ctx: CanvasRenderingContext2D, layout: Layout, score: number, best: number, challengeScore: number | undefined, elapsed: number, passedAt: number): void {
  const chasingFriend = challengeScore !== undefined && score <= challengeScore; const target = chasingFriend ? challengeScore : best; if (target <= 0) return;
  const ratio = Math.min(1, score / target); const x = layout.portrait ? layout.board.x : landscapeTextX(layout); const width = layout.portrait ? layout.board.width : layout.score.width * 0.8; const y = layout.portrait ? layout.goalStrip.height > 0 ? layout.score.y + layout.score.height - 6 : layout.score.y + layout.score.height + 24 : layout.score.y + 178; const height = 6;
  ctx.save(); ctx.globalAlpha = .6; ctx.fillStyle = PALETTE.ui.panelSolid; ctx.beginPath(); ctx.roundRect(x, y, width, height, 3); ctx.fill(); ctx.globalAlpha = .85; ctx.fillStyle = passedAt >= 0 && elapsed - passedAt < 120 ? PALETTE.light.flash : PALETTE.ui.gold; ctx.beginPath(); ctx.roundRect(x, y, width * ratio, height * (ratio >= .8 ? 1 + .5 * Math.max(0, Math.sin(elapsed / 450 * Math.PI * 2)) : 1), 3); ctx.fill(); if (passedAt >= 0 && elapsed - passedAt < 450) { ctx.fillStyle = PALETTE.ui.gold; for (let i = 0; i < 6; i += 1) { const sx = x + width * ratio + Math.sin(elapsed / 50 + i) * 5; const sy = y + 3 + Math.cos(elapsed / 45 + i * 2) * 7; drawSparkle(ctx, sx, sy, 3); } } ctx.globalAlpha = 1; if (!(layout.portrait && layout.goalStrip.height > 0)) { ctx.textAlign = 'left'; ctx.font = '800 14px Nunito, sans-serif'; ctx.fillStyle = PALETTE.ui.gold; const label = ratio >= 1 ? S.newBest : chasingFriend ? S.toBeatFriend(Math.max(0, target - score)) : ratio >= .8 ? S.toBeatBest(Math.max(0, target - score)) : layout.portrait ? S.best(numberFormat.format(target)) : ''; if (label) ctx.fillText(label, x, y + 18); } ctx.restore();
}

function drawSparkle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number): void { ctx.beginPath(); ctx.moveTo(x, y - radius); ctx.lineTo(x + radius * 0.28, y - radius * 0.28); ctx.lineTo(x + radius, y); ctx.lineTo(x + radius * 0.28, y + radius * 0.28); ctx.lineTo(x, y + radius); ctx.lineTo(x - radius * 0.28, y + radius * 0.28); ctx.lineTo(x - radius, y); ctx.lineTo(x - radius * 0.28, y - radius * 0.28); ctx.closePath(); ctx.fill(); }

// Right edge of the combo text drawn this frame (portrait), so the rescue label can avoid it on narrow phones.
let comboTextRight = 0;
function drawRescue(ctx: CanvasRenderingContext2D, layout: Layout, state: GameState, elapsed: number): void {
  // SG §11.6: a lifebuoy inside a ring of 10 ticks, plus a plain label so new players know what the ring is.
  const x = layout.portrait ? layout.board.x + layout.board.width - 22 : layout.score.x + 120; const y = layout.portrait ? layout.combo.y + 22 : layout.score.y + 330; const radius = layout.portrait ? 16 : 24;
  const used = state.rescue.used; const ready = state.rescue.ready && !used; const pulse = ready ? 1 + 0.08 * (0.5 + 0.5 * Math.sin(elapsed / 1200 * Math.PI * 2)) : 1;
  ctx.save(); ctx.translate(x, y); ctx.scale(pulse, pulse);
  const ringR = radius * 0.72; ctx.lineWidth = radius * 0.42;
  for (let i = 0; i < 4; i += 1) { ctx.strokeStyle = used ? PALETTE.ui.disabled : i % 2 ? PALETTE.ui.textPrimary : PALETTE.flavour.cherry.base; ctx.beginPath(); ctx.arc(0, 0, ringR, -Math.PI / 2 + i * Math.PI / 2 - Math.PI / 4, -Math.PI / 2 + (i + 1) * Math.PI / 2 - Math.PI / 4); ctx.stroke(); }
  for (let i = 0; i < 10; i += 1) { const a = -Math.PI / 2 + (i / 10) * Math.PI * 2; ctx.strokeStyle = used ? PALETTE.ui.disabled : i < state.rescue.charge ? PALETTE.ui.success : PALETTE.ui.track; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(Math.cos(a) * (radius + 3), Math.sin(a) * (radius + 3)); ctx.lineTo(Math.cos(a) * (radius + 7), Math.sin(a) * (radius + 7)); ctx.stroke(); }
  ctx.restore();
  const label = used ? S.rescueUsed : ready ? S.rescueReady : S.rescueLabel(state.rescue.charge);
  ctx.font = '800 14px Nunito, sans-serif'; ctx.fillStyle = used ? PALETTE.ui.disabledText : ready ? PALETTE.ui.gold : PALETTE.ui.textSecondary;
  if (layout.portrait) {
    // spec-note: On 320 and 360 wide phones the combo text and the rescue label share one row and collided. The label moves down a line when it would overlap the combo text (SG §11.6).
    const labelRight = x - radius - 14; const labelLeft = labelRight - ctx.measureText(label).width; const sameRow = labelLeft < comboTextRight + 12;
    ctx.textAlign = 'right'; ctx.fillText(label, labelRight, sameRow ? y + 13 : y + 5);
  } else { ctx.textAlign = 'center'; ctx.fillText(label, x, y + radius + 30); }
}

function flameSprite(flavour: number): HTMLCanvasElement | undefined { let sprite = flameSprites.get(flavour); if (sprite || typeof document === 'undefined') return sprite; sprite = document.createElement('canvas'); sprite.width = 32; sprite.height = 48; const context = sprite.getContext('2d'); if (!context) return undefined; const key = (['cherry','orange','lemon','apple','blueberry','grape','bubblegum'] as const)[flavour - 1]!; const gradient = context.createLinearGradient(0, 0, 0, 48); gradient.addColorStop(0, PALETTE.flavour[key].base); gradient.addColorStop(1, PALETTE.ui.gold); context.fillStyle = gradient; context.beginPath(); context.moveTo(16, 48); context.bezierCurveTo(0, 32, 8, 16, 16, 0); context.bezierCurveTo(24, 16, 32, 32, 16, 48); context.fill(); flameSprites.set(flavour, sprite); return sprite; }

function landscapeTextX(layout: Layout): number { return layout.score.x + layout.score.width * 0.1; }
