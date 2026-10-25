// SG §11.1–11.3: DOM overlays use palette CSS variables and exact design strings.
import { S } from './strings';
import type { RunSummary } from '../meta/runSummary';
import { drawGloop } from '../render/gloopRenderer';
import { largestSquare } from '../core/gloops';

export interface GameUi { root: HTMLElement; showPause(onResume: () => void, onRestart: () => void, onHome: () => void, restartLabel: string): void; showRestartConfirm(onStart: () => void, onCancel: () => void): void; showDailyGiveUpConfirm(onConfirm: () => void, onCancel: () => void): void; showGameOver(onRestart: () => void, onHome: () => void, score: number, best: number | null, fallback: string, rewards: { xp: number; coins: number; progress: number; progressMax: number; level?: number }, summary?: RunSummary, onChallenge?: () => void, onImage?: () => void, noteOverride?: string, title?: string, onDailyShare?: () => void): void; showRescue(onUse: () => void, onDecline: () => void): void; hide(): void }
export function createGameUi(root: HTMLElement): GameUi {
  const overlay = document.createElement('div'); overlay.className = 'gloop-overlay'; root.append(overlay);
  return {
    root,
    showPause(onResume, onRestart, onHome, restartLabel) { renderPanel(overlay, S.pause, [[S.resume, 'button button--primary', onResume], [restartLabel, 'button button--secondary', onRestart], [S.home, 'button button--secondary', onHome]]); },
    showRestartConfirm(onStart, onCancel) { renderPanel(overlay, S.restartConfirm, [[S.startOver, 'button button--primary', onStart], [S.cancel, 'button button--secondary', onCancel]]); },
    showDailyGiveUpConfirm(onConfirm, onCancel) { renderPanel(overlay, S.dailyGiveUpConfirm, [[S.giveUp, 'button button--primary', onConfirm], [S.cancel, 'button button--secondary', onCancel]]); },
    showGameOver(onRestart, onHome, score, best, fallback, rewards, summary, onChallenge, onImage, noteOverride, title, onDailyShare) {
      const rewardText = S.rewardRow(rewards.xp, rewards.coins);
      const daily = title?.startsWith('Daily #') === true || title === S.allTraysPlaced;
      const buttons: [string, string, () => void][] = daily ? [[S.practice, 'button button--primary', onRestart], ...(onDailyShare ? [[S.share, 'button button--secondary', onDailyShare] as [string, string, () => void]] : []), [S.home, 'button button--secondary', onHome]] : [[S.playAgain, 'button button--primary', onRestart], ...(onChallenge ? [[S.challengeFriend, 'button button--secondary', onChallenge] as [string, string, () => void]] : []), ...(onImage ? [[S.shareImage, 'button button--secondary', onImage] as [string, string, () => void]] : []), [S.home, 'button button--secondary', onHome]];
      const bestText = best === null || best <= 0 ? undefined : score > best ? S.newBest : S.best(new Intl.NumberFormat('en-US').format(best));
      renderPanel(overlay, title ?? S.noRoom, buttons, new Intl.NumberFormat('en-US').format(score), bestText, noteOverride ?? S.gameOverNote(fallback, rewards.level), true);
      const panel = overlay.querySelector('.gloop-modal'); if (!panel) return;
      if (summary) { const highlights = document.createElement('div'); highlights.className = 'run-highlights'; const figure = document.createElement('div'); figure.className = 'run-highlight-gloop'; const art = document.createElement('canvas'); art.width = 96; art.height = 96; const context = art.getContext('2d'); if (context && summary.biggestGloop) { const cells = summary.biggestGloop.cells; const rows = cells.map((cell) => Math.floor(cell / 8)); const cols = cells.map((cell) => cell % 8); const minRow = Math.min(...rows); const maxRow = Math.max(...rows); const minCol = Math.min(...cols); const maxCol = Math.max(...cols); const cellSize = 72 / Math.max(maxRow - minRow + 1, maxCol - minCol + 1); const ox = (96 - (maxCol - minCol + 1) * cellSize) / 2 - minCol * cellSize; const oy = (96 - (maxRow - minRow + 1) * cellSize) / 2 - minRow * cellSize; drawGloop(context, { flavour: summary.biggestGloop.flavour as 1 | 2 | 3 | 4 | 5 | 6 | 7, cells, bfs: [...cells], largestSquare: largestSquare(cells) }, cellSize, ox, oy, 0, 'grin'); } const label = document.createElement('small'); label.textContent = summary.biggestPop >= 8 ? S.biggestPopStat(summary.biggestPop) : S.biggestGloopStat(summary.biggestGloop?.cells.length ?? 0); figure.append(art, label); const chips = document.createElement('div'); chips.className = 'run-highlight-stats'; if (summary.bestCombo >= 2) { const combo = document.createElement('span'); combo.textContent = S.bestComboStat(summary.bestCombo); chips.append(combo); } const lines = document.createElement('span'); lines.textContent = S.linesStat(summary.lines); chips.append(lines); highlights.append(figure, chips); panel.insertBefore(highlights, panel.querySelector('.gloop-result-note')); }
      const reward = document.createElement('div'); reward.className = 'gloop-rewards'; const label = document.createElement('p'); label.textContent = rewardText; const track = document.createElement('div'); track.className = 'xp-track'; const fill = document.createElement('span'); fill.style.width = '0%'; track.append(fill); reward.append(label, track); panel.insertBefore(reward, panel.querySelector('.gloop-result-note')); requestAnimationFrame(() => { fill.style.width = `${rewards.progressMax ? Math.min(100, rewards.progress / rewards.progressMax * 100) : 100}%`; });
    },
    showRescue(onUse, onDecline) { renderPanel(overlay, S.rescueTitle, [[S.rescueUse, 'button button--primary', onUse], [S.rescueDecline, 'button button--secondary', onDecline]]); const copy = document.createElement('p'); copy.className = 'rescue-copy'; copy.textContent = S.rescueBody; overlay.querySelector('.gloop-modal')?.insertBefore(copy, overlay.querySelector('.gloop-modal button')); },
    hide() { overlay.replaceChildren(); overlay.classList.remove('is-visible'); },
  };
}
function renderPanel(target: HTMLElement, title: string, buttons: [string, string, () => void][], score?: string, detail?: string, note?: string, gameOver = false): void {
  const panel = document.createElement('section'); panel.className = gameOver ? 'panel gloop-modal gloop-modal--game-over' : 'panel gloop-modal'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true');
  const heading = document.createElement('h1'); heading.textContent = title; panel.append(heading);
  if (score) { const value = document.createElement('p'); value.className = 'gloop-result-score'; value.textContent = score; panel.append(value); }
  if (detail) { const value = document.createElement('p'); value.className = 'gloop-result-best'; value.textContent = detail; panel.append(value); }
  if (note) { const value = document.createElement('p'); value.className = 'gloop-result-note'; value.textContent = note; panel.append(value); }
  for (const [label, cls, action] of buttons) { const button = document.createElement('button'); button.type = 'button'; button.className = cls; button.textContent = label; button.addEventListener('click', action); panel.append(button); }
  target.replaceChildren(panel); target.classList.add('is-visible'); panel.querySelector('button')?.focus();
}
