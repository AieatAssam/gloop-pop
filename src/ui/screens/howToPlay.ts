// SG §5.4 and §11.3: exact rules plus miniature demos using the game gloop renderer.
import { drawGloop, drawPiece } from '../../render/gloopRenderer';
import { PALETTE } from '../../render/palette';
import { S } from '../strings';
import { largestSquare } from '../../core/gloops';

export function createHowToPlayScreen(back: () => void): HTMLElement {
  const root = document.createElement('main'); root.className = 'screen-wrap'; const panel = document.createElement('section'); panel.className = 'panel full-screen-panel how-to-panel';
  const header = document.createElement('header'); header.className = 'screen-header'; const backButton = document.createElement('button'); backButton.type = 'button'; backButton.className = 'button button--secondary screen-back'; backButton.textContent = S.back; backButton.addEventListener('click', back); const title = document.createElement('h1'); title.textContent = S.howToPlay; header.append(backButton, title);
  const list = document.createElement('ol'); list.className = 'how-to-list'; for (const text of [S.howToRule1, S.howToRule2, S.howToRule3, S.howToRule4, S.howToRule5, S.howToRule6, S.howToRule7]) { const item = document.createElement('li'); item.textContent = text; list.append(item); }
  const demos = document.createElement('div'); demos.className = 'how-to-demo'; const rowDemo = canvas(); const popDemo = canvas(); demos.append(rowDemo, popDemo);
  const controls = document.createElement('p'); controls.className = 'how-to-controls'; controls.textContent = S.howToControls; const scoring = document.createElement('p'); scoring.className = 'how-to-scoring'; scoring.textContent = S.howToScoring;
  panel.append(header, list, demos, controls, scoring); root.append(panel); animateDemos(root, rowDemo, popDemo); return root;
}
function canvas(): HTMLCanvasElement { const value = document.createElement('canvas'); value.width = 300; value.height = 120; return value; }
function animateDemos(root: HTMLElement, row: HTMLCanvasElement, pop: HTMLCanvasElement): void {
  const draw = (time: number): void => {
    if (!root.isConnected) return;
    const rowContext = row.getContext('2d'); if (rowContext) { rowContext.clearRect(0, 0, row.width, row.height); rowContext.fillStyle = PALETTE.theme.midnight.well; rowContext.fillRect(0, 0, row.width, row.height); for (let c = 0; c < 8; c += 1) { const size = 28; const x = 36 + c * 29; const y = 43; if (c < 6) drawPiece(rowContext, c % 2 ? 3 : 1, [[0, 0]], size, x, y, time); else rowContext.strokeStyle = PALETTE.ui.gold; if (c >= 6) { rowContext.lineWidth = 3; rowContext.strokeRect(x + 4, y + 4, size - 8, size - 8); } } }
    const popContext = pop.getContext('2d'); if (popContext) { popContext.clearRect(0, 0, pop.width, pop.height); popContext.fillStyle = PALETTE.theme.midnight.well; popContext.fillRect(0, 0, pop.width, pop.height); const cells = [9, 10, 17, 18, 19, 25, 26, 27, 33, 34]; const gloop = { flavour: 4 as const, cells, bfs: [...cells], largestSquare: largestSquare(cells) }; drawGloop(popContext, gloop, 18, 42, -15, time, 'happy'); const pulse = 0.6 + Math.sin(time / 260) * 0.2; popContext.strokeStyle = PALETTE.fx.popPreview; popContext.globalAlpha = pulse; popContext.lineWidth = 3; popContext.strokeRect(174, 88, 48, 3); popContext.globalAlpha = 1; }
    requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
}
