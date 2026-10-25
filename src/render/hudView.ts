// SG §11.4–11.6 and §15: score, combo pips and rescue charge.
import type { GameState } from '../core/types';
import type { Layout } from './layout';
import { PALETTE } from './palette';
import { S } from '../ui/strings';

export function drawHud(ctx: CanvasRenderingContext2D, layout: Layout, state: GameState, best: number, elapsed: number, scoreShown: number, comboLostAt = -1, challengeScore?: number, candyFlameUntil = -1, flameFlavour = 1, reducedMotion = false, scoreFrom = scoreShown, scoreStartedAt = elapsed, scoreDuration = 600, newBestAt = -1, flameBreakAt = -1, comboPulseAt = -1, scoreSparkleAt = -1): number {
  const duration = reducedMotion ? 150 : Math.min(600, Math.max(150, scoreDuration)); const progress = Math.min(1, Math.max(0, (elapsed - scoreStartedAt) / duration)); const eased = 1 - (1 - progress) ** 3;
  const score = scoreFrom + (state.score - scoreFrom) * eased;
  const tier = state.combo >= 12 ? 4 : state.combo >= 8 ? 3 : 0; const flaming = tier >= 3 || elapsed < candyFlameUntil || (flameBreakAt >= 0 && elapsed - flameBreakAt < 400);
  ctx.save(); ctx.textAlign = 'center'; ctx.fillStyle = PALETTE.ui.textPrimary;
  if (layout.portrait) {
    ctx.font = '700 42px "Baloo 2", sans-serif'; drawScore(ctx, new Intl.NumberFormat('en-US').format(Math.round(score)), layout.width / 2, layout.score.y + layout.score.height * 0.55, elapsed, flaming, flameFlavour, reducedMotion, tier, flameBreakAt, candyFlameUntil);
    if (state.mode === 'daily') { ctx.font = '800 13px Nunito, sans-serif'; ctx.fillStyle = PALETTE.ui.textSecondary; ctx.fillText(S.dailyTray(Math.min(30, state.traysDealt)), layout.width / 2, layout.score.y + layout.score.height * 0.98); if (state.daily) { ctx.font = '800 11px Nunito, sans-serif'; ctx.fillText(S.fodDouble(S.flavourName(state.daily.flavourOfDay)), layout.width / 2, layout.score.y + layout.score.height + 10); } }
    if (state.mode !== 'zen' && best > 0) { const isNewBest = state.score > best; ctx.font = '700 15px Nunito, sans-serif'; ctx.fillStyle = isNewBest ? PALETTE.ui.gold : PALETTE.ui.textSecondary; ctx.fillText(isNewBest ? S.newBest : S.best(new Intl.NumberFormat('en-US').format(best)), layout.width / 2, layout.score.y + layout.score.height * 0.82); }
  } else {
    ctx.textAlign = 'left'; ctx.font = '700 18px Nunito, sans-serif'; ctx.fillStyle = PALETTE.ui.textSecondary; ctx.fillText(S.score, layout.score.x, layout.score.y + 60);
    ctx.font = '800 54px "Baloo 2", sans-serif'; ctx.fillStyle = PALETTE.ui.textPrimary; drawScore(ctx, new Intl.NumberFormat('en-US').format(Math.round(score)), layout.score.x, layout.score.y + 116, elapsed, flaming, flameFlavour, reducedMotion, tier, flameBreakAt, candyFlameUntil);
    if (state.mode === 'daily') { ctx.font = '700 14px Nunito, sans-serif'; ctx.fillStyle = PALETTE.ui.textSecondary; ctx.fillText(S.dailyTray(Math.min(30, state.traysDealt)), layout.score.x, layout.score.y + 178); if (state.daily) { ctx.font = '700 12px Nunito, sans-serif'; ctx.fillText(S.fodDouble(S.flavourName(state.daily.flavourOfDay)), layout.score.x, layout.score.y + 206); } }
    if (state.mode !== 'zen' && best > 0) { const isNewBest = state.score > best; ctx.font = '700 16px Nunito, sans-serif'; ctx.fillStyle = isNewBest ? PALETTE.ui.gold : PALETTE.ui.textSecondary; ctx.fillText(isNewBest ? S.newBest : S.best(new Intl.NumberFormat('en-US').format(best)), layout.score.x, layout.score.y + (state.mode === 'daily' ? 150 : 148)); }
    if (state.mode === 'daily') { ctx.font = '700 16px Nunito, sans-serif'; ctx.fillStyle = PALETTE.ui.textDim; ctx.fillText(`Stage ${state.stage}`, layout.score.x, layout.score.y + 280); }
  }
  if (scoreSparkleAt >= 0 && elapsed >= scoreSparkleAt && elapsed - scoreSparkleAt < 300) { const sparkleX = layout.portrait ? layout.width / 2 : layout.score.x; const sparkleY = layout.portrait ? layout.score.y + layout.score.height * 0.55 : layout.score.y + 116; const count = reducedMotion ? 2 : 6; ctx.save(); ctx.fillStyle = PALETTE.fx.sugar; ctx.globalAlpha = Math.max(0, 1 - (elapsed - scoreSparkleAt) / 300); for (let i = 0; i < count; i += 1) drawSparkle(ctx, sparkleX + Math.sin(i * 1.7 + elapsed / 70) * (16 + i * 4), sparkleY - 12 + Math.cos(i * 2.1 + elapsed / 80) * 10, 2.5); ctx.restore(); }
  const comboY = layout.portrait ? layout.combo.y + 19 : layout.combo.y + 34; ctx.textAlign = 'left'; ctx.font = '800 16px Nunito, sans-serif'; ctx.fillStyle = PALETTE.ui.textPrimary;
  const lostAge = elapsed - comboLostAt; const meterAlpha = state.combo > 0 ? 1 : comboLostAt >= 0 && lostAge < 200 ? Math.max(0, 1 - lostAge / 200) : 0;
  if (meterAlpha > 0) {
    ctx.globalAlpha = meterAlpha; const multiplier = state.combo >= 20 ? '10' : (1 + Math.max(0, state.combo - 1) * 0.5).toFixed(1);
    if (state.combo > 1) { const baseX = layout.portrait ? layout.board.x + 8 : layout.score.x; const age = elapsed - comboPulseAt; const scale = age >= 0 && age < 160 ? 1 + 0.25 * (1 - age / 160) : 1; ctx.save(); ctx.translate(baseX, comboY); ctx.scale(scale, scale); ctx.fillText(S.combo(state.combo, multiplier), 0, 0); ctx.restore(); }
    else { ctx.fillStyle = PALETTE.fx.comboLost; ctx.fillText(S.comboLost, layout.portrait ? layout.board.x + 8 : layout.score.x, comboY); }
    const baseX = layout.portrait ? layout.board.x + 8 : layout.score.x; const pipY = comboY + 18;
    for (let i = 0; i < 3; i += 1) { ctx.globalAlpha = meterAlpha * (i === 2 && state.fuse === 1 ? 0.65 + 0.35 * Math.sin(elapsed / 400 * Math.PI * 2) : 1); ctx.fillStyle = i < state.fuse ? PALETTE.fx.comboTier1 : PALETTE.ui.track; ctx.beginPath(); ctx.arc(baseX + 6 + i * 16, pipY, 5, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
  if ((state.mode === 'classic' || state.mode === 'expert') && (best > 0 || challengeScore !== undefined)) drawChaseBar(ctx, layout, score, best, challengeScore, elapsed, newBestAt);
  if (state.mode === 'classic') drawRescue(ctx, layout, state);
  ctx.restore(); return score;
}

function drawScore(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, time: number, flaming: boolean, flavour: number, reduced: boolean, tier: number, flameBreakAt: number, flameUntil: number): void {
  if (flaming) { const key = (['cherry','orange','lemon','apple','blueberry','grape','bubblegum'] as const)[flavour - 1]!; const colour = PALETTE.flavour[key].base; ctx.save(); ctx.lineJoin = 'round'; ctx.lineWidth = 2.5; ctx.strokeStyle = colour; ctx.strokeText(text, x, y);
    if (!reduced) { ctx.globalCompositeOperation = 'lighter'; const count = tier >= 4 ? 16 : 12; const rate = tier >= 4 ? 34 : 22; const breakFade = flameUntil > time || flameBreakAt < 0 || time - flameBreakAt >= 400 ? 1 : Math.max(0, 1 - (time - flameBreakAt) / 400); for (let i = 0; i < count; i += 1) { const phase = (time * rate / 1000 + i * 1.618) % count; const progress = phase / count; const rise = 18 + progress * 12; const sway = Math.sin(time / 100 + i * 2.1) * 4; const fx = x + (i / (count - 1) - 0.5) * Math.min(120, text.length * 25) + sway; const fy = y - 8 - rise; const size = (1 + 4 * (1 - progress)) * (0.2 + 0.8 * (1 - progress)); const grad = ctx.createLinearGradient(fx, fy - size * 2, fx, fy + size); grad.addColorStop(0, colour); grad.addColorStop(1, PALETTE.ui.gold); ctx.fillStyle = grad; ctx.globalAlpha = breakFade; ctx.beginPath(); ctx.moveTo(fx, fy + size); ctx.bezierCurveTo(fx - size, fy, fx - size * 0.5, fy - size * 2, fx, fy - size); ctx.bezierCurveTo(fx + size * 0.5, fy - size * 2, fx + size, fy, fx, fy + size); ctx.fill(); } ctx.globalAlpha = 1; }
    ctx.restore();
  }
  ctx.fillStyle = PALETTE.ui.textPrimary; ctx.fillText(text, x, y);
}

function drawChaseBar(ctx: CanvasRenderingContext2D, layout: Layout, score: number, best: number, challengeScore: number | undefined, elapsed: number, passedAt: number): void {
  const chasingFriend = challengeScore !== undefined && score <= challengeScore; const target = chasingFriend ? challengeScore : best; if (target <= 0) return;
  const ratio = Math.min(1, score / target); const x = layout.portrait ? layout.board.x : layout.score.x; const width = layout.portrait ? layout.board.width : 240; const y = layout.portrait ? layout.score.y + layout.score.height + 24 : layout.score.y + 178; const height = 6;
  ctx.save(); ctx.globalAlpha = .6; ctx.fillStyle = PALETTE.ui.panelSolid; ctx.beginPath(); ctx.roundRect(x, y, width, height, 3); ctx.fill(); ctx.globalAlpha = .85; ctx.fillStyle = passedAt >= 0 && elapsed - passedAt < 120 ? PALETTE.light.flash : PALETTE.ui.gold; ctx.beginPath(); ctx.roundRect(x, y, width * ratio, height * (ratio >= .8 ? 1 + .5 * Math.max(0, Math.sin(elapsed / 450 * Math.PI * 2)) : 1), 3); ctx.fill(); if (passedAt >= 0 && elapsed - passedAt < 450) { ctx.fillStyle = PALETTE.ui.gold; for (let i = 0; i < 6; i += 1) { const sx = x + width * ratio + Math.sin(elapsed / 50 + i) * 5; const sy = y + 3 + Math.cos(elapsed / 45 + i * 2) * 7; drawSparkle(ctx, sx, sy, 3); } } ctx.globalAlpha = 1; ctx.textAlign = 'left'; ctx.font = '700 12px Nunito, sans-serif'; ctx.fillStyle = PALETTE.ui.gold; const label = ratio >= 1 ? S.newBest : chasingFriend ? S.toBeatFriend(Math.max(0, target - score)) : ratio >= .8 ? S.toBeatBest(Math.max(0, target - score)) : S.best(new Intl.NumberFormat('en-US').format(target)); ctx.fillText(label, x, y + 18); ctx.restore();
}

function drawSparkle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number): void { ctx.beginPath(); ctx.moveTo(x, y - radius); ctx.lineTo(x + radius * 0.28, y - radius * 0.28); ctx.lineTo(x + radius, y); ctx.lineTo(x + radius * 0.28, y + radius * 0.28); ctx.lineTo(x, y + radius); ctx.lineTo(x - radius * 0.28, y + radius * 0.28); ctx.lineTo(x - radius, y); ctx.lineTo(x - radius * 0.28, y - radius * 0.28); ctx.closePath(); ctx.fill(); }

function drawRescue(ctx: CanvasRenderingContext2D, layout: Layout, state: GameState): void {
  const x = layout.portrait ? layout.board.x + layout.board.width - 22 : layout.score.x + 120; const y = layout.portrait ? layout.combo.y + 22 : layout.score.y + 330; const radius = layout.portrait ? 18 : 26;
  ctx.lineWidth = 3; ctx.strokeStyle = state.rescue.used ? PALETTE.ui.disabledText : PALETTE.ui.textPrimary; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 10; i += 1) { const a = -Math.PI / 2 + (i / 10) * Math.PI * 2; ctx.strokeStyle = i < state.rescue.charge ? PALETTE.ui.success : PALETTE.ui.track; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * (radius + 3), y + Math.sin(a) * (radius + 3)); ctx.lineTo(x + Math.cos(a) * (radius + 7), y + Math.sin(a) * (radius + 7)); ctx.stroke(); }
  ctx.font = '700 10px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = PALETTE.ui.textPrimary; ctx.fillText(state.rescue.used ? S.rescueUsed : state.rescue.ready ? S.rescueReady : S.rescueCharge(state.rescue.charge), x, y + 4);
}
