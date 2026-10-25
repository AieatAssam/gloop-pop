// SG §12: a one-shot 4:5 card. Every gloop on it (board, hero and the counter row) is drawn with the game's
// own body, face and topper renderer, so the card looks like the game and not like generic blobs.
import type { DailyResult } from '../meta/dailyRecord';
import { FLAVOUR_KEYS, PALETTE, type ThemeKey } from './palette';
import { S, formatNumber } from '../ui/strings';
import { withAlpha } from './colour';
import { drawGloop } from './gloopRenderer';
import { components, largestSquare } from '../core/gloops';
import type { Flavour, Gloop } from '../core/types';

export interface ShareCardData { title: string; date: string; score: number; combo: number; biggestPop: number; lines: number; streak: number; theme: ThemeKey; daily?: DailyResult; board?: readonly number[]; biggestGloop?: { cells: number[]; flavour: number }; heroFlavour?: number }
const W = 1080; const H = 1350; const COUNTER_Y = 1060;
const fmt = formatNumber;

export function renderShareCard(data: ShareCardData): HTMLCanvasElement {
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H; const ctx = canvas.getContext('2d'); if (!ctx) return canvas;
  const theme = PALETTE.theme[data.theme];
  drawSky(ctx, theme);
  drawLogo(ctx, 540, 160, 112);
  ctx.textAlign = 'center'; ctx.fillStyle = PALETTE.ui.textPrimary; ctx.font = '800 64px "Baloo 2", sans-serif'; ctx.fillText(data.title, 540, 250);
  if (data.date) { ctx.fillStyle = PALETTE.ui.textSecondary; ctx.font = '700 32px Nunito, sans-serif'; ctx.fillText(data.date, 540, 298); }
  ctx.font = '800 180px "Baloo 2", sans-serif'; ctx.lineJoin = 'round'; ctx.strokeStyle = PALETTE.face.ink; ctx.lineWidth = 16; ctx.strokeText(fmt(data.score), 540, 500); ctx.fillStyle = PALETTE.ui.textPrimary; ctx.fillText(fmt(data.score), 540, 500);
  if (data.daily) drawTrayGrid(ctx, data.daily.trays); else drawBoard(ctx, data.board ?? [], theme);
  const chips = [S.dailyCombo(data.combo), ...(data.biggestPop > 0 ? [S.dailyBiggest(data.biggestPop)] : []), S.linesStat(data.lines)];
  const chipW = 288; const gap = 12; const startX = 540 - (chips.length * chipW + (chips.length - 1) * gap) / 2;
  chips.forEach((label, i) => { const x = startX + i * (chipW + gap); rounded(ctx, x, 898, chipW, 68, 34, withAlpha(PALETTE.ui.panelSolid, 0.92)); ctx.strokeStyle = PALETTE.ui.panelBorder; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(x, 898, chipW, 68, 34); ctx.stroke(); ctx.fillStyle = PALETTE.ui.textPrimary; ctx.font = '800 32px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(label, x + chipW / 2, 943); });
  if (!data.daily) { ctx.font = '800 44px "Baloo 2", sans-serif'; ctx.fillStyle = PALETTE.ui.gold; ctx.strokeStyle = PALETTE.face.ink; ctx.lineWidth = 8; ctx.strokeText(S.canBeatIt, 540, 1022); ctx.fillText(S.canBeatIt, 540, 1022); }
  drawCounter(ctx, theme, data);
  const site = `${location.host}${import.meta.env.BASE_URL.replace(/\/$/, '')}`;
  ctx.font = '700 30px Nunito, sans-serif'; ctx.fillStyle = PALETTE.ui.textSecondary;
  if (data.streak >= 2) {
    const streak = S.streakCard(data.streak); ctx.font = '800 30px Nunito, sans-serif'; const streakW = ctx.measureText(streak).width; ctx.font = '700 30px Nunito, sans-serif'; const siteW = ctx.measureText(site).width;
    const total = 44 + streakW + 48 + siteW; let x = 540 - total / 2;
    drawFlame(ctx, x + 16, 1300); x += 44; ctx.textAlign = 'left'; ctx.fillStyle = PALETTE.ui.textPrimary; ctx.font = '800 30px Nunito, sans-serif'; ctx.fillText(streak, x, 1312); x += streakW + 48;
    ctx.fillStyle = PALETTE.ui.textSecondary; ctx.font = '700 30px Nunito, sans-serif'; ctx.fillText(site, x, 1312);
  } else { ctx.textAlign = 'center'; ctx.fillText(site, 540, 1312); }
  return canvas;
}

function drawSky(ctx: CanvasRenderingContext2D, theme: (typeof PALETTE.theme)[ThemeKey]): void {
  const sky = ctx.createLinearGradient(0, 0, 0, COUNTER_Y); sky.addColorStop(0, theme.skyTop); sky.addColorStop(1, theme.skyBottom); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  const horizon = ctx.createRadialGradient(540, 820, 0, 540, 820, 620); horizon.addColorStop(0, withAlpha(theme.horizon, 0.16)); horizon.addColorStop(1, withAlpha(theme.horizon, 0)); ctx.fillStyle = horizon; ctx.fillRect(0, 300, W, 760);
  for (let i = 0; i < 40; i += 1) { const x = ((i * 197 + 83) % 1040) + 20; const y = ((i * 313 + 47) % 760) + 20; ctx.globalAlpha = 0.3 + (i % 4) * 0.12; ctx.fillStyle = theme.star; ctx.beginPath(); ctx.arc(x, y, i % 7 === 0 ? 3.5 : 2, 0, Math.PI * 2); ctx.fill(); }
  ctx.globalAlpha = 1;
  for (const [x, y, colour] of [[170, 300, theme.bokehA], [900, 240, theme.bokehB], [930, 720, theme.bokehC]] as const) { const glow = ctx.createRadialGradient(x, y, 0, x, y, 190); glow.addColorStop(0, withAlpha(colour, 0.22)); glow.addColorStop(1, withAlpha(colour, 0)); ctx.fillStyle = glow; ctx.fillRect(x - 190, y - 190, 380, 380); }
}

// SG §10 logo: each letter a flavour base, face.ink outline 0.1em, slight per-letter rotation.
function drawLogo(ctx: CanvasRenderingContext2D, cx: number, baseline: number, size: number): void {
  const text = S.logo; ctx.save(); ctx.font = `800 ${size}px "Baloo 2", sans-serif`; ctx.textAlign = 'left'; ctx.lineJoin = 'round';
  const widths = [...text].map((ch) => ctx.measureText(ch).width); const total = widths.reduce((a, b) => a + b, 0); let x = cx - total / 2; let colourIndex = 0;
  [...text].forEach((ch, i) => {
    const w = widths[i]!; if (ch.trim()) {
      const colour = PALETTE.flavour[FLAVOUR_KEYS[colourIndex % FLAVOUR_KEYS.length]!]; colourIndex += 1; const tilt = [-0.06, 0.04, -0.03, 0.06, -0.05, 0.03, -0.04, 0.05][i % 8]!;
      ctx.save(); ctx.translate(x + w / 2, baseline - (i % 2 ? 6 : 0)); ctx.rotate(tilt);
      ctx.strokeStyle = PALETTE.face.ink; ctx.lineWidth = size * 0.16; ctx.strokeText(ch, -w / 2, 0);
      const fill = ctx.createLinearGradient(0, -size * 0.7, 0, 0); fill.addColorStop(0, colour.light); fill.addColorStop(0.5, colour.base); fill.addColorStop(1, colour.dark); ctx.fillStyle = fill; ctx.fillText(ch, -w / 2, 0);
      ctx.restore();
    }
    x += w;
  });
  ctx.restore();
}

function drawTrayGrid(ctx: CanvasRenderingContext2D, trays: readonly number[]): void {
  for (let i = 0; i < 30; i += 1) {
    const x = 96 + (i % 10) * 90; const y = 584 + Math.floor(i / 10) * 90; const tier = trays[i];
    const color = tier === undefined ? PALETTE.share.tierUnreached : tier === 0 ? PALETTE.share.tierNone : tier === 1 ? PALETTE.share.tier1 : tier <= 3 ? PALETTE.share.tier2 : tier <= 5 ? PALETTE.share.tier3 : tier === 7 ? PALETTE.share.tierSpecial : PALETTE.share.tier4;
    rounded(ctx, x, y, 78, 78, 18, color);
    ctx.globalAlpha = 0.5; rounded(ctx, x + 10, y + 8, 58, 9, 4.5, PALETTE.light.specular); ctx.globalAlpha = 1;
    if (tier === 7) { ctx.fillStyle = PALETTE.ui.textPrimary; ctx.font = '800 30px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('★', x + 39, y + 52); }
  }
}

// A Classic board is no spoiler (design §23.5): draw it as the real candy mould with real gloops.
function drawBoard(ctx: CanvasRenderingContext2D, board: readonly number[], theme: (typeof PALETTE.theme)[ThemeKey]): void {
  const c = 34; const pad = 8; const size = c * 8 + pad * 2; const bx = 540 - size / 2; const by = 576; const gx = bx + pad; const gy = by + pad;
  const frame = ctx.createLinearGradient(0, by, 0, by + size); frame.addColorStop(0, theme.frameLight); frame.addColorStop(0.25, theme.frame); frame.addColorStop(1, theme.frameDark);
  ctx.save(); ctx.fillStyle = withAlpha(PALETTE.light.shadowDeep, 0.6); ctx.beginPath(); ctx.roundRect(bx, by + 8, size, size, 22); ctx.fill(); ctx.restore();
  rounded(ctx, bx, by, size, size, 22, frame); rounded(ctx, gx - 2, gy - 2, c * 8 + 4, c * 8 + 4, 13, theme.well);
  for (let i = 0; i < 64; i += 1) rounded(ctx, gx + (i % 8) * c + 2, gy + Math.floor(i / 8) * c + 2, c - 4, c - 4, 8, theme.cell);
  for (const gloop of components(board)) drawGloop(ctx, gloop, c, gx, gy, 0, 'grin');
}

// The counter row (SG §12): five gloops sitting on the counter. The middle one is the hero: the Flavour of the
// Day at 1.3× on Daily, and the run's biggest gloop in its real shape on Classic.
function drawCounter(ctx: CanvasRenderingContext2D, theme: (typeof PALETTE.theme)[ThemeKey], data: ShareCardData): void {
  ctx.fillStyle = theme.counter; ctx.fillRect(0, COUNTER_Y, W, H - COUNTER_Y);
  ctx.globalAlpha = 0.5; ctx.fillStyle = theme.silhouetteRim; ctx.fillRect(0, COUNTER_Y, W, 3); ctx.globalAlpha = 1;
  const floor = 1252; const hero = data.heroFlavour ?? data.biggestGloop?.flavour ?? 1;
  const others = ([1, 2, 3, 4, 5, 6, 7] as const).filter((f) => f !== hero).slice(0, 4);
  const sides = [others[0]!, others[1]!, others[2]!, others[3]!];
  const xs = [110, 270, 810, 970]; const sizes = [118, 128, 128, 118];
  sides.forEach((flavour, i) => { const s = sizes[i]!; drawShadow(ctx, xs[i]!, floor, s * 0.48); drawGloop(ctx, single(flavour), s, xs[i]! - s / 2, floor - s, 0, 'happy'); });
  const big = data.daily ? undefined : data.biggestGloop;
  if (big && big.cells.length > 1) {
    const rows = big.cells.map((cell) => Math.floor(cell / 8)); const cols = big.cells.map((cell) => cell % 8);
    const minRow = Math.min(...rows); const maxRow = Math.max(...rows); const minCol = Math.min(...cols); const maxCol = Math.max(...cols);
    const spanW = maxCol - minCol + 1; const spanH = maxRow - minRow + 1; const cell = Math.min(300 / spanW, 172 / spanH, 92);
    const ox = 540 - spanW * cell / 2 - minCol * cell; const oy = floor - spanH * cell - minRow * cell;
    drawShadow(ctx, 540, floor, spanW * cell * 0.46);
    drawGloop(ctx, { flavour: big.flavour as Flavour, cells: big.cells, bfs: [...big.cells], largestSquare: largestSquare(big.cells) }, cell, ox, oy, 0, 'happy');
  } else { const s = 168; drawShadow(ctx, 540, floor, s * 0.5); drawGloop(ctx, single(hero), s, 540 - s / 2, floor - s, 0, 'happy'); }
}

function single(flavour: number): Gloop { return { flavour: flavour as Flavour, cells: [0], bfs: [0], largestSquare: { row: 0, col: 0, size: 1 } }; }
function drawShadow(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number): void { ctx.save(); ctx.fillStyle = PALETTE.light.shadowDeep; ctx.globalAlpha = 0.45; ctx.beginPath(); ctx.ellipse(x, y + 4, rx, rx * 0.12, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string | CanvasGradient): void { ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); }
function drawFlame(ctx: CanvasRenderingContext2D, x: number, y: number): void { const grad = ctx.createLinearGradient(x, y - 24, x, y + 22); grad.addColorStop(0, PALETTE.ui.gold); grad.addColorStop(1, PALETTE.flavour.orange.base); ctx.fillStyle = grad; ctx.beginPath(); ctx.moveTo(x, y + 22); ctx.bezierCurveTo(x - 22, y + 6, x - 8, y - 3, x - 6, y - 20); ctx.bezierCurveTo(x + 3, y - 10, x + 12, y - 4, x + 8, y + 5); ctx.bezierCurveTo(x + 20, y - 1, x + 19, y + 14, x, y + 22); ctx.fill(); }
