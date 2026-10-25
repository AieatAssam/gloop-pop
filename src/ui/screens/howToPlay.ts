// SG §5.4 and §11.3: exact rules plus miniature demos using the game gloop renderer.
import { drawGloop, drawJellyCell, drawPiece } from '../../render/gloopRenderer';
import { PALETTE } from '../../render/palette';
import { S } from '../strings';
import { components } from '../../core/gloops';

export function createHowToPlayScreen(back: () => void): HTMLElement {
  const root = document.createElement('main'); root.className = 'screen-wrap'; const panel = document.createElement('section'); panel.className = 'panel full-screen-panel how-to-panel';
  const header = document.createElement('header'); header.className = 'screen-header'; const backButton = document.createElement('button'); backButton.type = 'button'; backButton.className = 'button button--secondary screen-back'; backButton.textContent = S.back; backButton.addEventListener('click', back); const title = document.createElement('h1'); title.textContent = S.howToPlay; header.append(backButton, title);
  const list = document.createElement('ol'); list.className = 'how-to-list'; for (const text of [S.howToRule1, S.howToRule2, S.howToRule3, S.howToRule4, S.howToRule5, S.howToRule6, S.howToRule7, S.howToRule8]) { const item = document.createElement('li'); item.textContent = text; list.append(item); }
  const demos = document.createElement('div'); demos.className = 'how-to-demo'; const rowDemo = canvas(); const popDemo = canvas(); demos.append(rowDemo, popDemo);
  const controls = document.createElement('p'); controls.className = 'how-to-controls desktop-only'; controls.textContent = S.howToControls; const scoring = document.createElement('p'); scoring.className = 'how-to-scoring'; scoring.textContent = S.howToScoring;
  panel.append(header, list, demos, controls, scoring); root.append(panel); animateDemos(root, rowDemo, popDemo); return root;
}
function canvas(): HTMLCanvasElement { const value = document.createElement('canvas'); value.width = 600; value.height = 360; return value; }

// Two looping mini-boards drawn with the game's own gloop renderer: (1) fill a row and it clears; (2) clear a row through a gloop and the whole gloop pops.
const C = 60; const GX = 60; const GY = 96; const LOOP = 2800;
interface Demo { board: number[]; piece: { cells: number[]; flavour: number }; popping: number[] }
const ROW_DEMO: Demo = { board: [0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 1,1,3,3,5,5,0,0], piece: { cells: [30, 31], flavour: 4 }, popping: [] };
const POP_DEMO: Demo = { board: [0,4,4,0,0,0,0,0, 0,4,4,4,0,0,0,0, 0,4,4,0,0,0,0,0, 1,4,4,3,5,2,0,0], piece: { cells: [30, 31], flavour: 1 }, popping: [1, 2, 9, 10, 11, 17, 18] };
function animateDemos(root: HTMLElement, row: HTMLCanvasElement, pop: HTMLCanvasElement): void {
  const draw = (time: number): void => {
    if (!root.isConnected) return;
    const a = row.getContext('2d'); if (a) drawDemo(a, ROW_DEMO, time);
    const b = pop.getContext('2d'); if (b) drawDemo(b, POP_DEMO, time + 400);
    requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
}
function drawDemo(ctx: CanvasRenderingContext2D, demo: Demo, time: number): void {
  const t = time % LOOP; ctx.clearRect(0, 0, 600, 360);
  const frame = ctx.createLinearGradient(0, GY - 12, 0, GY + C * 4 + 12); frame.addColorStop(0, PALETTE.theme.midnight.frameLight); frame.addColorStop(0.25, PALETTE.theme.midnight.frame); frame.addColorStop(1, PALETTE.theme.midnight.frameDark);
  ctx.fillStyle = frame; ctx.beginPath(); ctx.roundRect(GX - 12, GY - 12, C * 8 + 24, C * 4 + 24, 26); ctx.fill();
  ctx.fillStyle = PALETTE.theme.midnight.cell; for (let i = 0; i < 32; i += 1) { ctx.beginPath(); ctx.roundRect(GX + (i % 8) * C + 4, GY + Math.floor(i / 8) * C + 4, C - 8, C - 8, 13); ctx.fill(); }
  const placed = t >= 800; const clearAt = 1000; const lineCells = [24, 25, 26, 27, 28, 29, 30, 31]; const removed = new Set([...lineCells, ...demo.popping]);
  const board = demo.board.slice(); if (placed) for (const cell of demo.piece.cells) board[cell] = demo.piece.flavour;
  // Cells that are not being removed draw as normal gloops; removed cells swell and pop one by one, rippling out from the placed piece.
  const keep = board.map((value, i) => (t >= clearAt && removed.has(i) ? 0 : value));
  for (const gloop of components(keep)) drawGloop(ctx, gloop, C, GX, GY, time, t >= clearAt && t < 1800 ? 'happy' : 'idle');
  if (t >= clearAt && t < 1900) for (const cell of removed) {
    const order = lineCells.includes(cell) ? Math.abs((cell % 8) - 6) : 3 + (3 - Math.floor(cell / 8)); const age = t - clearAt - order * 45; const value = board[cell] ?? 0; if (!value) continue;
    const scale = age < 0 ? 1 : age < 70 ? 1 + 0.22 * (age / 70) : Math.max(0, 1.22 * (1 - (age - 70) / 140)); if (scale <= 0) continue;
    const x = GX + (cell % 8) * C + C / 2; const y = GY + Math.floor(cell / 8) * C + C / 2;
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); drawJellyCell(ctx, value, C, -C / 2, -C / 2, time, 'popping'); if (age < 160) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.7 * (1 - Math.max(0, age) / 160); ctx.fillStyle = PALETTE.light.flash; ctx.beginPath(); ctx.roundRect(-C * 0.44, -C * 0.44, C * 0.88, C * 0.88, C * 0.28); ctx.fill(); } ctx.restore();
  }
  if (!placed) {
    // The piece glides in from above the board, like a drag, and the target line glows.
    const p = Math.min(1, t / 800); const eased = 1 - (1 - p) ** 3; const startY = -C * 1.4; const targetY = Math.floor(demo.piece.cells[0]! / 8) * C;
    ctx.save(); ctx.globalAlpha = 0.18 + 0.14 * Math.sin(time / 120); ctx.fillStyle = PALETTE.fx.lineGlow; ctx.fillRect(GX, GY + 3 * C, C * 8, C); ctx.restore();
    if (demo.popping.length) { ctx.save(); ctx.globalAlpha = 0.5 + 0.5 * Math.sin(time / 90); ctx.strokeStyle = PALETTE.fx.popPreview; ctx.lineWidth = 5; for (const cell of demo.popping) { ctx.beginPath(); ctx.roundRect(GX + (cell % 8) * C + 3, GY + Math.floor(cell / 8) * C + 3, C - 6, C - 6, 14); ctx.stroke(); } ctx.restore(); }
    const cells = demo.piece.cells.map((cell) => [0, (cell % 8) - (demo.piece.cells[0]! % 8)] as const);
    drawPiece(ctx, demo.piece.flavour, cells, C, GX + (demo.piece.cells[0]! % 8) * C, GY + startY + (targetY - startY) * eased, time, 'excited');
  }
}
