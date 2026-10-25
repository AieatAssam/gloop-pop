// SG §11.4–11.6 and §15: score, combo pips and rescue charge.
import type { GameState } from '../core/types';
import type { Layout } from './layout';
import { PALETTE } from './palette';
import { S } from '../ui/strings';

export function drawHud(ctx: CanvasRenderingContext2D, layout: Layout, state: GameState, best: number, elapsed: number, scoreShown: number, comboLostAt = -1): number {
  const score = scoreShown + (state.score - scoreShown) * 0.16;
  ctx.save(); ctx.textAlign = 'center'; ctx.fillStyle = PALETTE.ui.textPrimary;
  if (layout.portrait) {
    ctx.font = '700 42px "Baloo 2", sans-serif'; ctx.fillText(new Intl.NumberFormat('en-US').format(Math.round(score)), layout.width / 2, layout.score.y + layout.score.height * 0.55);
    if (state.mode !== 'zen') { const isNewBest = best > 0 && state.score > best; ctx.font = '700 15px Nunito, sans-serif'; ctx.fillStyle = isNewBest ? PALETTE.ui.gold : PALETTE.ui.textSecondary; ctx.fillText(isNewBest ? S.newBest : S.best(new Intl.NumberFormat('en-US').format(best)), layout.width / 2, layout.score.y + layout.score.height * 0.82); }
  } else {
    ctx.textAlign = 'left'; ctx.font = '700 18px Nunito, sans-serif'; ctx.fillStyle = PALETTE.ui.textSecondary; ctx.fillText(S.score, layout.score.x, layout.score.y + 60);
    ctx.font = '800 54px "Baloo 2", sans-serif'; ctx.fillStyle = PALETTE.ui.textPrimary; ctx.fillText(new Intl.NumberFormat('en-US').format(Math.round(score)), layout.score.x, layout.score.y + 116);
    if (state.mode !== 'zen') { const isNewBest = best > 0 && state.score > best; ctx.font = '700 18px Nunito, sans-serif'; ctx.fillStyle = isNewBest ? PALETTE.ui.gold : PALETTE.ui.textSecondary; ctx.fillText(isNewBest ? S.newBest : S.best(new Intl.NumberFormat('en-US').format(best)), layout.score.x, layout.score.y + 148); }
  }
  const comboY = layout.portrait ? layout.combo.y + 19 : layout.combo.y + 34; ctx.textAlign = 'left'; ctx.font = '800 16px Nunito, sans-serif'; ctx.fillStyle = PALETTE.ui.textPrimary;
  const lostAge = elapsed - comboLostAt; const meterAlpha = state.combo > 0 ? 1 : comboLostAt >= 0 && lostAge < 200 ? Math.max(0, 1 - lostAge / 200) : 0;
  if (meterAlpha > 0) {
    ctx.globalAlpha = meterAlpha; const multiplier = state.combo >= 20 ? '10' : (1 + Math.max(0, state.combo - 1) * 0.5).toFixed(1);
    if (state.combo > 0) ctx.fillText(S.combo(state.combo, multiplier), layout.portrait ? layout.board.x + 8 : layout.score.x, comboY);
    else { ctx.fillStyle = PALETTE.fx.comboLost; ctx.fillText(S.comboLost, layout.portrait ? layout.board.x + 8 : layout.score.x, comboY); }
    const baseX = layout.portrait ? layout.board.x + 8 : layout.score.x; const pipY = comboY + 18;
    for (let i = 0; i < 3; i += 1) { ctx.globalAlpha = meterAlpha * (i === 2 && state.fuse === 1 ? 0.65 + 0.35 * Math.sin(elapsed / 400 * Math.PI * 2) : 1); ctx.fillStyle = i < state.fuse ? PALETTE.fx.comboTier1 : PALETTE.ui.track; ctx.beginPath(); ctx.arc(baseX + 6 + i * 16, pipY, 5, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
  if (state.mode === 'classic') drawRescue(ctx, layout, state);
  ctx.restore(); return score;
}

function drawRescue(ctx: CanvasRenderingContext2D, layout: Layout, state: GameState): void {
  const x = layout.portrait ? layout.board.x + layout.board.width - 22 : layout.score.x + 120; const y = layout.portrait ? layout.combo.y + 22 : layout.score.y + 330; const radius = layout.portrait ? 18 : 26;
  ctx.lineWidth = 3; ctx.strokeStyle = state.rescue.used ? PALETTE.ui.disabledText : PALETTE.ui.textPrimary; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 10; i += 1) { const a = -Math.PI / 2 + (i / 10) * Math.PI * 2; ctx.strokeStyle = i < state.rescue.charge ? PALETTE.ui.success : PALETTE.ui.track; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * (radius + 3), y + Math.sin(a) * (radius + 3)); ctx.lineTo(x + Math.cos(a) * (radius + 7), y + Math.sin(a) * (radius + 7)); ctx.stroke(); }
  ctx.font = '700 10px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = PALETTE.ui.textPrimary; ctx.fillText(state.rescue.used ? S.rescueUsed : state.rescue.ready ? S.rescueReady : S.rescueCharge(state.rescue.charge), x, y + 4);
}
