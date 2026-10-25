// SG §20.7–20.9: two candy pills hold target and mini progress above the board.
import type { GameState } from '../core/types';
import type { Layout, Rect } from './layout';
import { PALETTE } from './palette';
import { S } from '../ui/strings';
import { easeOutBack } from './easing';

const textSprites = new Map<string, HTMLCanvasElement>();
export function drawGoalStrip(ctx: CanvasRenderingContext2D, layout: Layout, state: GameState, shownScore: number, elapsed: number, crossing?: { target: number; coins: number; at: number; worldAt: number; hold: boolean }, miniDoneAt = -1, miniDoneWorldAt = -1, worldNow = elapsed, reducedMotion = false): void {
  if (!state.goals) return;
  const desktop = !layout.portrait; const gap = 8;
  const pillHeight = desktop ? 32 : 28;
  const width = desktop ? layout.goalStrip.width : Math.min((layout.width - 40) / 2, 240);
  const total = width * 2 + gap; const left = desktop ? layout.goalStrip.x : (layout.width - total) / 2;
  const top = desktop ? layout.goalStrip.y : layout.goalStrip.y + 2;
  const target = nextVisible(state, shownScore);
  const targetIndex = ladderIndex(target); const firstVisibleIndex = ladderIndexAtFloor(state.goals.floor); const previous = targetIndex === firstVisibleIndex ? 0 : ladderValue(targetIndex - 1);
  const fraction = Math.max(0, Math.min(1, (shownScore - previous) / Math.max(1, target - previous)));
  const crossingVisible = crossing && crossing.at >= 0 && elapsed - crossing.at < 1200 || crossing?.hold === true;
  const crossingAge = crossing?.at === undefined ? -1 : elapsed - crossing.at;
  const crossingFxAge = crossing?.worldAt === undefined ? -1 : worldNow - crossing.worldAt;
  pill(ctx, { x: left, y: top, width, height: pillHeight }, crossingVisible && crossing ? S.targetCrossed(crossing.target, crossing.coins) : S.nextTarget(target), crossingVisible ? 1 : fraction, PALETTE.ui.gold, false, crossingAge, crossingFxAge, reducedMotion);
  const mini = state.goals.mini; const label = mini.done ? S.miniDone(mini.id, mini.flavour) : S.miniShort(mini.id, mini.progress, mini.flavour);
  const miniRewardShowing = mini.done && miniDoneAt >= 0 && elapsed - miniDoneAt < 1200;
  pill(ctx, { x: desktop ? left : left + width + gap, y: desktop ? top + pillHeight + 10 : top, width, height: pillHeight }, miniRewardShowing ? S.miniDoneReward : label, mini.done ? 1 : mini.progress / mini.target, mini.done ? PALETTE.ui.success : PALETTE.ui.gold, true, miniDoneAt < 0 ? -1 : elapsed - miniDoneAt, miniDoneWorldAt < 0 ? -1 : worldNow - miniDoneWorldAt, reducedMotion);
}
function pill(ctx: CanvasRenderingContext2D, rect: Rect, text: string, ratio: number, accent: string, mini: boolean, pulseAge: number, fxAge: number, reducedMotion: boolean): void {
  ctx.save();
  if (!reducedMotion && pulseAge >= 0 && pulseAge < 260) { const phase = pulseAge / 130; const scale = phase < 1 ? 1 + 0.15 * easeOutBack(phase) : 1 + 0.15 * (1 - easeOutBack(phase - 1)); ctx.translate(rect.x + rect.width / 2, rect.y + rect.height / 2); ctx.scale(scale, scale); ctx.translate(-rect.x - rect.width / 2, -rect.y - rect.height / 2); }
  ctx.save(); ctx.beginPath(); ctx.roundRect(rect.x, rect.y, rect.width, rect.height, rect.height / 2); ctx.fillStyle = PALETTE.ui.panelSolid; ctx.globalAlpha = 0.82; ctx.fill(); ctx.globalAlpha = 1;
  ctx.save(); ctx.clip(); if (ratio > 0) { ctx.globalAlpha = mini ? 0.4 : 0.35; ctx.fillStyle = accent; ctx.fillRect(rect.x, rect.y, rect.width * Math.min(1, Math.max(0, ratio)), rect.height); ctx.globalAlpha = 1; } ctx.restore();
  ctx.lineWidth = 2; ctx.strokeStyle = ratio >= 1 ? accent : PALETTE.ui.panelBorder; ctx.stroke(); ctx.fillStyle = PALETTE.ui.textPrimary; ctx.font = `800 ${rect.height < 30 ? 13 : 14}px Nunito, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const iconX = rect.x + 16; ctx.fillStyle = accent;
  if (mini) { ctx.beginPath(); ctx.arc(iconX, rect.y + rect.height / 2, 5, 0, Math.PI * 2); ctx.strokeStyle = accent; ctx.lineWidth = 1.5; ctx.stroke(); ctx.beginPath(); ctx.arc(iconX, rect.y + rect.height / 2, 2, 0, Math.PI * 2); ctx.fill(); }
  else { ctx.beginPath(); ctx.moveTo(iconX - 5, rect.y + rect.height / 2 + 6); ctx.lineTo(iconX - 5, rect.y + rect.height / 2 - 6); ctx.lineTo(iconX + 5, rect.y + rect.height / 2 - 3); ctx.lineTo(iconX + 1, rect.y + rect.height / 2); ctx.lineTo(iconX + 5, rect.y + rect.height / 2 + 3); ctx.closePath(); ctx.fill(); }
  const sprite = textSprite(ctx, text, ctx.font); if (sprite) ctx.drawImage(sprite, rect.x + rect.width / 2 + 6 - sprite.width / 2, rect.y + rect.height / 2 + 0.5 - sprite.height / 2);
  ctx.restore();
  if (!reducedMotion && fxAge >= 0 && fxAge < 450) drawSugarSparkles(ctx, rect, fxAge);
  ctx.restore();
}
function drawSugarSparkles(ctx: CanvasRenderingContext2D, rect: Rect, age: number): void {
  const alpha = Math.max(0, 1 - age / 450); ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = PALETTE.fx.sugar;
  for (let i = 0; i < 6; i += 1) { const phase = i * Math.PI / 3 + age / 80; const x = rect.x + rect.width / 2 + Math.cos(phase) * (rect.width * 0.44 + 4); const y = rect.y + rect.height / 2 + Math.sin(phase) * (rect.height * 0.8 + 3); const size = 2 + (i % 2); ctx.beginPath(); ctx.moveTo(x, y - size); ctx.lineTo(x + size * 0.35, y - size * 0.35); ctx.lineTo(x + size, y); ctx.lineTo(x + size * 0.35, y + size * 0.35); ctx.lineTo(x, y + size); ctx.lineTo(x - size * 0.35, y + size * 0.35); ctx.lineTo(x - size, y); ctx.lineTo(x - size * 0.35, y - size * 0.35); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
function textSprite(ctx: CanvasRenderingContext2D, text: string, font: string): HTMLCanvasElement | undefined {
  const key = `${font}|${text}`; const cached = textSprites.get(key); if (cached) return cached;
  if (textSprites.size >= 128) textSprites.clear();
  const measure = ctx.measureText(text); const sprite = ctx.canvas.ownerDocument.createElement('canvas');
  sprite.width = Math.max(1, Math.ceil(measure.width + 4)); sprite.height = Math.max(1, Math.ceil(measure.actualBoundingBoxAscent + measure.actualBoundingBoxDescent + 4));
  const label = sprite.getContext('2d'); if (!label) return undefined;
  label.font = font; label.fillStyle = PALETTE.ui.textPrimary; label.textAlign = 'center'; label.textBaseline = 'middle'; label.fillText(text, sprite.width / 2, sprite.height / 2);
  textSprites.set(key, sprite); return sprite;
}
function nextVisible(state: GameState, score: number): number { let index = 0; while (ladderValue(index) <= score || ladderValue(index) < (state.goals?.floor ?? 0)) index += 1; return ladderValue(index); }
function ladderIndex(target: number): number { let i = 0; while (ladderValue(i) < target) i += 1; return i; }
function ladderIndexAtFloor(floor: number): number { let i = 0; while (ladderValue(i) < floor) i += 1; return i; }
function ladderValue(index: number): number { const base = [1000,2500,5000,7500,10000,15000,20000,30000,40000,50000,75000,100000]; return base[index] ?? 100000 + 50000 * (index - 11); }
