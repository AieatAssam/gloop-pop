// Design §18: lifetime totals and a last-20 Classic score chart, with the best bar highlighted.
import type { SaveV1 } from '../../meta/saveSchema';
import { S } from '../strings';
import { PALETTE } from '../../render/palette';

export function createStatsScreen(save: SaveV1, onBack: () => void): HTMLElement {
  const root = document.createElement('main'); root.className = 'screen-wrap'; const panel = document.createElement('section'); panel.className = 'panel full-screen-panel';
  const header = document.createElement('header'); header.className = 'screen-header'; const back = button(S.back, onBack); back.classList.add('screen-back'); const heading = document.createElement('h1'); heading.textContent = S.statsTitle; header.append(back, heading); panel.append(header, statList(save));
  const chart = document.createElement('canvas'); chart.className = 'stats-chart'; chart.width = 640; chart.height = 180; chart.setAttribute('aria-label', S.statsChart); panel.append(chart); drawChart(chart, save);
  root.append(panel); return root;
}
function statList(save: SaveV1): HTMLElement {
  const list = document.createElement('dl'); list.className = 'stats-list'; const values = save.recentClassic; const average = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  const achievements = Object.keys(save.achievements).length;
  const rows: [string, number | string][] = [[S.runsPlayed, Object.values(save.stats.runs).reduce((sum, value) => sum + value, 0)], [S.runsClassic, save.stats.runs.classic ?? 0], [S.runsExpert, save.stats.runs.expert ?? 0], [S.runsZen, save.stats.runs.zen ?? 0], [S.runsDaily, save.stats.runs.daily ?? 0], [S.bestClassic, save.stats.bestClassic], [S.bestExpert, save.stats.bestExpert], [S.averageClassic, average], [S.linesCleared, save.stats.linesCleared], [S.extraCellsPopped, save.stats.extraCellsPopped], [S.biggestPop, save.stats.biggestPop], [S.bestCombo, save.stats.bestCombo], [S.allClears, save.stats.allClears], [S.piecesPlaced, save.stats.piecesPlaced], [S.timePlayed, formatTime(save.stats.timePlayedMs)], [S.dailiesFinished, save.stats.dailiesFinished], [S.bestDaily, save.stats.bestDaily], [S.currentStreak, save.streak.current], [S.bestStreak, save.streak.best], [S.achievementsLabel, S.achievementsFraction(achievements)]];
  for (const [name, value] of rows) { const term = document.createElement('dt'); term.textContent = name; const desc = document.createElement('dd'); desc.textContent = typeof value === 'number' ? new Intl.NumberFormat('en-US').format(value) : value; list.append(term, desc); } return list;
}
function drawChart(canvas: HTMLCanvasElement, save: SaveV1): void {
  const ctx = canvas.getContext('2d'); if (!ctx) return; const values = save.recentClassic; const max = Math.max(1, ...values); const gap = 6; const width = Math.max(2, (canvas.width - gap * Math.max(0, values.length - 1)) / Math.max(1, values.length));
  ctx.clearRect(0, 0, canvas.width, canvas.height); values.forEach((score, index) => { const height = score / max * (canvas.height - 12); ctx.fillStyle = score === save.stats.bestClassic ? PALETTE.ui.gold : PALETTE.fx.comboTier4; const x = index * (width + gap); ctx.beginPath(); ctx.roundRect(x, canvas.height - height, width, height, Math.min(6, width / 2)); ctx.fill(); });
}
function button(label: string, action: () => void): HTMLButtonElement { const value = document.createElement('button'); value.type = 'button'; value.className = 'button button--secondary'; value.textContent = label; value.addEventListener('click', action); return value; }
function formatTime(ms: number): string { return S.statsTime(Math.floor(ms / 3_600_000), Math.floor(ms % 3_600_000 / 60_000)); }
