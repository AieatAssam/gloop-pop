// Design §18: lifetime totals and a last-20 Classic score chart, with the best bar highlighted.
import type { SaveV1 } from '../../meta/saveSchema';
import { S } from '../strings';
import { PALETTE } from '../../render/palette';

export function createStatsScreen(save: SaveV1, onBack: () => void): HTMLElement {
  const root = document.createElement('main'); root.className = 'screen-wrap'; const panel = document.createElement('section'); panel.className = 'panel full-screen-panel';
  const header = document.createElement('header'); header.className = 'screen-header'; const back = button(S.back, onBack); back.classList.add('screen-back'); const heading = document.createElement('h1'); heading.textContent = S.statsTitle; header.append(back, heading); panel.append(header, statList(save));
  const chartLabel = document.createElement('h2'); chartLabel.className = 'stats-chart-label'; chartLabel.textContent = S.statsChart; panel.append(chartLabel); const chart = document.createElement('canvas'); chart.className = 'stats-chart'; chart.width = 640; chart.height = 180; chart.setAttribute('aria-label', S.statsChart); panel.append(chart); drawChart(chart, save);
  root.append(panel); return root;
}
function statList(save: SaveV1): HTMLElement {
  const list = document.createElement('dl'); list.className = 'stats-list'; const values = save.recentClassic; const average = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  const achievements = Object.keys(save.achievements).length;
  const rows: [string, number | string][] = [[S.runsPlayed, Object.values(save.stats.runs).reduce((sum, value) => sum + value, 0)], [S.runsClassic, save.stats.runs.classic ?? 0], [S.runsExpert, save.stats.runs.expert ?? 0], [S.runsZen, save.stats.runs.zen ?? 0], [S.runsDaily, save.stats.runs.daily ?? 0], [S.bestClassic, save.stats.bestClassic], [S.bestExpert, save.stats.bestExpert], [S.averageClassic, average], [S.linesCleared, save.stats.linesCleared], [S.poppedCells, save.stats.extraCellsPopped], [S.biggestPop, save.stats.biggestPop], [S.bestCombo, save.stats.bestCombo], [S.allClears, save.stats.allClears], [S.piecesPlaced, save.stats.piecesPlaced], [S.timePlayed, formatTime(save.stats.timePlayedMs)], [S.dailiesFinished, save.stats.dailiesFinished], [S.bestDaily, save.stats.bestDaily], [S.currentStreak, save.streak.current], [S.bestStreak, save.streak.best], [S.achievementsLabel, S.achievementsFraction(achievements)]];
  for (const [name, value] of rows) { const term = document.createElement('dt'); term.textContent = name; const desc = document.createElement('dd'); desc.textContent = typeof value === 'number' ? new Intl.NumberFormat('en-US').format(value) : value; list.append(term, desc); } return list;
}
function drawChart(canvas: HTMLCanvasElement, save: SaveV1): void {
  // Always 20 slots so one run draws one bar, not a full-width block; empty slots show as low tracks.
  const ctx = canvas.getContext('2d'); if (!ctx) return; const values = save.recentClassic.slice(-20); const max = Math.max(1, ...values); const slots = 20; const gap = 8; const width = (canvas.width - gap * (slots - 1)) / slots; const floor = canvas.height - 4;
  ctx.clearRect(0, 0, canvas.width, canvas.height); const best = Math.max(0, ...values);
  for (let index = 0; index < slots; index += 1) { const x = index * (width + gap); const score = values[index]; ctx.fillStyle = PALETTE.ui.track; ctx.beginPath(); ctx.roundRect(x, floor - 10, width, 10, 5); ctx.fill(); if (score === undefined) continue; const height = Math.max(10, score / max * (canvas.height - 16)); ctx.fillStyle = score === best ? PALETTE.ui.gold : PALETTE.ui.xpBottom; ctx.beginPath(); ctx.roundRect(x, floor - height, width, height, Math.min(8, width / 2)); ctx.fill(); }
}
function button(label: string, action: () => void): HTMLButtonElement { const value = document.createElement('button'); value.type = 'button'; value.className = 'button button--secondary'; value.textContent = label; value.addEventListener('click', action); return value; }
function formatTime(ms: number): string { return S.statsTime(Math.floor(ms / 3_600_000), Math.floor(ms % 3_600_000 / 60_000)); }
