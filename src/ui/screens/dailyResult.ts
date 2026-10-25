// SG §11.1–11.3: result card uses rounded DOM cells and palette share tiers.
import type { DailyResult } from '../../meta/dailyRecord';
import { PALETTE } from '../../render/palette';
import { S } from '../strings';
import { streakMilestone } from '../../meta/streak';

export function createDailyResultScreen(result: DailyResult, day: number, streak: number, freezeUsed: number, onShare: () => void, onImage: () => void, onPractice: () => void, onHome: () => void): HTMLElement {
  const root = document.createElement('main'); root.className = 'screen-wrap'; const panel = document.createElement('section'); panel.className = 'panel full-screen-panel daily-result-panel';
  const title = document.createElement('h1'); title.textContent = result.trays.length >= 30 ? S.allTraysPlaced : S.dailyRunDone(day); const score = document.createElement('strong'); score.className = 'daily-result-score'; score.textContent = new Intl.NumberFormat('en-US').format(result.score);
  const stats = document.createElement('p'); stats.textContent = `${S.dailyCombo(result.bestCombo)} · ${S.dailyBiggest(result.biggestPop)}`;
  const streakView = document.createElement('div'); streakView.className = `daily-streak${streakMilestone(streak) ? ' is-milestone' : ''}`; const counter = document.createElement('div'); counter.className = 'daily-streak-counter'; const flame = document.createElement('span'); flame.className = 'daily-streak-flame'; flame.textContent = S.streakFlame; const number = document.createElement('strong'); number.textContent = new Intl.NumberFormat('en-US').format(streak); counter.append(flame, number); const streakText = document.createElement('span'); streakText.textContent = freezeUsed > 0 ? S.freezeKeptStreak : streak === 1 ? S.streakStarted : S.streakDays(streak); streakView.append(counter, streakText);
  if (streakMilestone(streak)) { const banner = document.createElement('strong'); banner.textContent = S.streakMilestone(streak); streakView.append(banner); for (let i = 0; i < 40; i += 1) { const confetti = document.createElement('i'); confetti.className = 'daily-confetti'; confetti.style.left = `${(i * 37) % 100}%`; confetti.style.animationDelay = `${(i % 8) * 30}ms`; streakView.append(confetti); } }
  const grid = document.createElement('div'); grid.className = 'daily-share-grid';
  for (let i = 0; i < 30; i += 1) { const value = result.trays[i]; const square = document.createElement('span'); square.className = 'daily-share-square'; square.style.backgroundColor = shareColour(value); grid.append(square); }
  const legend = document.createElement('small'); legend.textContent = S.dailyLegend;
  const buttons = document.createElement('nav'); buttons.className = 'daily-result-buttons'; buttons.append(button(S.share, onShare, 'button button--primary'), button(S.shareImage, onImage, 'button button--secondary'), button(S.practice, onPractice, 'button button--secondary'), button(S.home, onHome, 'text-button'));
  panel.append(title, score, stats, streakView, grid, legend, buttons); root.append(panel); return root;
}
function shareColour(value: number | undefined): string { return value === undefined ? PALETTE.share.tierUnreached : value === 0 ? PALETTE.share.tierNone : value === 1 ? PALETTE.share.tier1 : value <= 3 ? PALETTE.share.tier2 : value <= 5 ? PALETTE.share.tier3 : value === 7 ? PALETTE.share.tierSpecial : PALETTE.share.tier4; }
function button(label: string, action: () => void, className: string): HTMLButtonElement { const node = document.createElement('button'); node.type = 'button'; node.className = className; node.textContent = label; node.addEventListener('click', action); return node; }
