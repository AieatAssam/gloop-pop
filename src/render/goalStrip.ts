// SG §20.4 and §20.7–20.9: Adventure goal chips and Classic target and mini progress.
import type { GameState } from '../core/types';
import type { Layout, Rect } from './layout';
import { PALETTE } from './palette';
import { S } from '../ui/strings';
import { easeOutBack } from './easing';
import { ladderValue, nextTarget } from '../core/goals';
import { drawCube } from './cubes';

const textSprites = new Map<string, HTMLCanvasElement>();
export function drawGoalStrip(ctx: CanvasRenderingContext2D, layout: Layout, state: GameState, shownScore: number, elapsed: number, crossing?: { target: number; coins: number; at: number; worldAt: number; hold: boolean }, miniDoneAt = -1, miniDoneWorldAt = -1, worldNow = elapsed, reducedMotion = false): void {
  if (state.adventure) { drawAdventureGoals(ctx, layout, state, elapsed); return; }
  if (!state.goals) return;
  const desktop = !layout.portrait; const gap = 8;
  const pillHeight = desktop ? 32 : 28;
  const width = desktop ? layout.goalStrip.width : Math.min((layout.width - 40) / 2, 240);
  const total = width * 2 + gap; const left = desktop ? layout.goalStrip.x : (layout.width - total) / 2;
  const top = desktop ? layout.goalStrip.y : layout.goalStrip.y + 2;
  const target = nextTarget(shownScore, state.goals.floor, state.goals.best);
  const targetIndex = ladderIndex(target); const firstVisibleIndex = ladderIndexAtFloor(state.goals.floor); const previous = targetIndex === firstVisibleIndex ? 0 : ladderValue(targetIndex - 1);
  const fraction = Math.max(0, Math.min(1, (shownScore - previous) / Math.max(1, target - previous)));
  const crossingVisible = Boolean(crossing && crossing.target > 0 && crossing.coins > 0 && (crossing.at >= 0 && elapsed - crossing.at < 1200 || crossing.hold));
  const crossingAge = crossing?.at === undefined ? -1 : elapsed - crossing.at;
  const crossingFxAge = crossing?.worldAt === undefined ? -1 : worldNow - crossing.worldAt;
  pill(ctx, { x: left, y: top, width, height: pillHeight }, crossingVisible && crossing ? S.targetCrossed(crossing.target, crossing.coins) : S.nextTarget(target), crossingVisible ? 1 : fraction, PALETTE.ui.gold, false, crossingAge, crossingFxAge, reducedMotion);
  const mini = state.goals.mini; const label = mini.done ? S.miniDone(mini.id, mini.flavour) : S.miniShort(mini.id, mini.progress, mini.flavour);
  const miniRewardShowing = mini.done && miniDoneAt >= 0 && elapsed - miniDoneAt < 1200;
  pill(ctx, { x: desktop ? left : left + width + gap, y: desktop ? top + pillHeight + 10 : top, width, height: pillHeight }, miniRewardShowing ? S.miniDoneReward : label, mini.done ? 1 : mini.progress / mini.target, mini.done ? PALETTE.ui.success : PALETTE.ui.gold, true, miniDoneAt < 0 ? -1 : elapsed - miniDoneAt, miniDoneWorldAt < 0 ? -1 : worldNow - miniDoneWorldAt, reducedMotion);
}

function drawAdventureGoals(ctx: CanvasRenderingContext2D, layout: Layout, state: GameState, elapsed: number): void {
  const goals = state.adventure?.goals; if (!goals?.length) return;
  const gap = 8; const height = 28; const width = Math.min((layout.width - 40 - gap * (goals.length - 1)) / goals.length, 240); const total = width * goals.length + gap * (goals.length - 1); const left = (layout.width - total) / 2; const y = layout.goalStrip.y + 2;
  goals.forEach((goal, index) => {
    const x = left + index * (width + gap); const ratio = Math.min(1, goal.progress / Math.max(1, goal.target));
    ctx.save(); ctx.fillStyle = PALETTE.ui.panelSolid; ctx.beginPath(); ctx.roundRect(x, y, width, height, 14); ctx.fill(); ctx.globalAlpha = 0.4; ctx.fillStyle = ratio >= 1 ? PALETTE.ui.success : PALETTE.ui.gold; ctx.beginPath(); ctx.roundRect(x, y, width * ratio, height, 14); ctx.fill(); ctx.globalAlpha = 1;
    drawAdventureGoalIcon(ctx, x + 15, y + height / 2, goal.kind, goal.flavour ?? 1);
    ctx.font = '800 14px Nunito,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = PALETTE.ui.textPrimary; ctx.fillText(goal.progress >= goal.target ? '✓' : S.goalProgress(goal.progress, goal.target), x + width / 2 + 8, y + height / 2); ctx.restore();
  });
  void elapsed;
}

function drawAdventureGoalIcon(ctx: CanvasRenderingContext2D, x: number, y: number, kind: string, flavour: number): void {
  ctx.save(); ctx.translate(x, y); ctx.lineWidth = 2; ctx.lineCap = 'round';
  if (kind === 'F') { const keys = ['cherry','orange','lemon','apple','blueberry','grape','bubblegum'] as const; ctx.fillStyle = PALETTE.flavour[keys[Math.max(0, Math.min(6, flavour - 1))] ?? 'cherry'].base; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = PALETTE.light.specular; ctx.beginPath(); ctx.ellipse(-2, -3, 2.5, 1.3, -0.4, 0, Math.PI * 2); ctx.fill(); }
  else { ctx.strokeStyle = kind === 'S' ? PALETTE.ui.gold : PALETTE.ui.textPrimary; ctx.fillStyle = PALETTE.ui.gold; ctx.beginPath();
    if (kind === 'L') { ctx.moveTo(-6, -3); ctx.lineTo(6, -3); ctx.moveTo(-6, 3); ctx.lineTo(6, 3); ctx.stroke(); }
    else if (kind === 'S') { for (let i = 0; i < 10; i += 1) { const angle = -Math.PI / 2 + i * Math.PI / 5; const radius = i % 2 ? 3 : 7; const px = Math.cos(angle) * radius; const py = Math.sin(angle) * radius; if (!i) ctx.moveTo(px, py); else ctx.lineTo(px, py); } ctx.closePath(); ctx.fill(); }
    else if (kind === 'B') { ctx.arc(-3, -2, 3, 0, Math.PI * 2); ctx.arc(3, -2, 3, 0, Math.PI * 2); ctx.arc(0, 3, 3, 0, Math.PI * 2); ctx.fill(); }
    else if (kind === 'M') { ctx.moveTo(-6, -4); ctx.lineTo(6, 4); ctx.moveTo(6, -4); ctx.lineTo(-6, 4); ctx.stroke(); }
    else if (kind === 'C') { drawCube(ctx, 8, 18, -9, -9); }
    else { ctx.roundRect(-5, -5, 10, 10, 2); ctx.stroke(); }
  }
  ctx.restore();
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
function ladderIndex(target: number): number { let i = 0; while (ladderValue(i) < target) i += 1; return i; }
function ladderIndexAtFloor(floor: number): number { let i = 0; while (ladderValue(i) < floor) i += 1; return i; }
