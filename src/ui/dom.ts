// SG §11.1–11.3: DOM overlays use palette CSS variables and exact design strings.
import { S, formatNumber } from './strings';
import type { RunSummary } from '../meta/runSummary';
import { drawGloop } from '../render/gloopRenderer';
import { largestSquare } from '../core/gloops';

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

export interface GameUi { root: HTMLElement; showPause(onResume: () => void, onRestart: () => void, onHome: () => void, restartLabel: string): void; showRestartConfirm(onStart: () => void, onCancel: () => void): void; showDailyGiveUpConfirm(onConfirm: () => void, onCancel: () => void): void; showAdventureGiveUpConfirm(onConfirm: () => void, onCancel: () => void): void; showGameOver(onRestart: () => void, onHome: () => void, score: number, best: number | null, fallback: string, rewards: { xp: number; coins: number; progress: number; progressMax: number; currentLevel: number; level?: number }, summary?: RunSummary, onChallenge?: () => void, onImage?: () => void, noteOverride?: string, title?: string, onDailyShare?: () => void, goalRewards?: { targetsHit: number; miniDone: boolean; missionsReady?: number }): void; showRescue(onUse: () => void, onDecline: () => void): void; hide(): void }
export function createGameUi(root: HTMLElement): GameUi {
  const overlay = document.createElement('div'); overlay.className = 'gloop-overlay'; root.append(overlay);
  return {
    root,
    showPause(onResume, onRestart, onHome, restartLabel) { renderPanel(overlay, S.pause, [[S.resume, 'button button--primary', onResume], [restartLabel, 'button button--secondary', onRestart], [S.home, 'button button--secondary', onHome]]); },
    showRestartConfirm(onStart, onCancel) { renderPanel(overlay, S.restartConfirm, [[S.startOver, 'button button--primary', onStart], [S.cancel, 'button button--secondary', onCancel]]); },
    showDailyGiveUpConfirm(onConfirm, onCancel) { renderPanel(overlay, S.dailyGiveUpConfirm, [[S.giveUp, 'button button--primary', onConfirm], [S.cancel, 'button button--secondary', onCancel]]); },
    showAdventureGiveUpConfirm(onConfirm, onCancel) { renderPanel(overlay, S.adventureGiveUpConfirm, [[S.giveUp, 'button button--primary', onConfirm], [S.cancel, 'button button--secondary', onCancel]]); },
    showGameOver(onRestart, onHome, score, best, fallback, rewards, summary, onChallenge, onImage, noteOverride, title, onDailyShare, goalRewards) {
      const rewardText = S.rewardRow(rewards.xp, rewards.coins);
      const daily = title?.startsWith('Daily #') === true || title === S.allTraysPlaced;
      // Hierarchy: one big "Play again", the share actions side by side as smaller secondary buttons, and Home as a text button (same as the Daily result screen).
      const secondary = 'button button--secondary button--compact';
      const buttons: [string, string, () => void][] = daily ? [[S.practice, 'button button--primary', onRestart], ...(onDailyShare ? [[S.share, secondary, onDailyShare] as [string, string, () => void]] : []), [S.home, 'text-button', onHome]] : [[S.playAgain, 'button button--primary', onRestart], ...(onChallenge ? [[S.challengeFriend, secondary, onChallenge] as [string, string, () => void]] : []), ...(onImage ? [[S.shareImage, secondary, onImage] as [string, string, () => void]] : []), [S.home, 'text-button', onHome]];
      // A first-ever finished run is a new best too (old best 0), so it gets the gold badge instead of nothing.
      const bestText = best === null || score <= 0 && best <= 0 ? undefined : score > best ? S.newBest : S.best(formatNumber(best));
      renderPanel(overlay, title ?? S.noRoom, buttons, formatNumber(score), bestText, noteOverride ?? S.gameOverNote(fallback, rewards.level), true);
      const panel = overlay.querySelector('.gloop-modal'); if (!panel) return;
      if (summary) { const highlights = document.createElement('div'); highlights.className = 'run-highlights'; const figure = document.createElement('div'); figure.className = 'run-highlight-gloop'; const art = document.createElement('canvas'); art.width = 96; art.height = 96; const context = art.getContext('2d'); if (context && summary.biggestGloop) { const cells = summary.biggestGloop.cells; const rows = cells.map((cell) => Math.floor(cell / 8)); const cols = cells.map((cell) => cell % 8); const minRow = Math.min(...rows); const maxRow = Math.max(...rows); const minCol = Math.min(...cols); const maxCol = Math.max(...cols); const cellSize = 72 / Math.max(maxRow - minRow + 1, maxCol - minCol + 1); const ox = (96 - (maxCol - minCol + 1) * cellSize) / 2 - minCol * cellSize; const oy = (96 - (maxRow - minRow + 1) * cellSize) / 2 - minRow * cellSize; drawGloop(context, { flavour: summary.biggestGloop.flavour as 1 | 2 | 3 | 4 | 5 | 6 | 7, cells, bfs: [...cells], largestSquare: largestSquare(cells) }, cellSize, ox, oy, 0, 'grin'); } const label = document.createElement('small'); label.textContent = summary.biggestPop >= 8 ? S.biggestPopStat(summary.biggestPop) : S.biggestGloopStat(summary.biggestGloop?.cells.length ?? 0); figure.append(art, label); const chips = document.createElement('div'); chips.className = 'run-highlight-stats'; if (summary.bestCombo >= 2) { const combo = document.createElement('span'); combo.textContent = S.bestComboStat(summary.bestCombo); chips.append(combo); } if (summary.lines > 0) { const lines = document.createElement('span'); lines.textContent = S.linesStat(summary.lines); chips.append(lines); } highlights.append(figure, chips); panel.insertBefore(highlights, panel.querySelector('.gloop-result-note')); }
      const reward = document.createElement('div'); reward.className = 'gloop-rewards'; const label = document.createElement('p'); label.textContent = rewardText; const levels = document.createElement('div'); levels.className = 'xp-levels'; const current = document.createElement('span'); current.textContent = S.levelBarCurrent(rewards.currentLevel); const next = document.createElement('span'); next.textContent = S.levelBarNext(rewards.currentLevel); levels.append(current, next); const track = document.createElement('div'); track.className = 'xp-track'; const fill = document.createElement('span'); fill.style.width = '0%'; track.append(fill); reward.append(label, levels, track);
      if (goalRewards?.targetsHit) { const targets = document.createElement('p'); targets.textContent = S.targetsReward(goalRewards.targetsHit); reward.append(targets); }
      if (goalRewards?.miniDone) { const mini = document.createElement('p'); mini.textContent = S.miniReward; reward.append(mini); }
      if (goalRewards?.missionsReady) { const missions = document.createElement('p'); missions.textContent = goalRewards.missionsReady === 1 ? S.oneMissionReady : S.missionsReady(goalRewards.missionsReady); reward.append(missions); }
      panel.insertBefore(reward, panel.querySelector('.gloop-result-note')); requestAnimationFrame(() => { fill.style.width = `${rewards.progressMax ? Math.min(100, rewards.progress / rewards.progressMax * 100) : 100}%`; });
    },
    showRescue(onUse, onDecline) { renderPanel(overlay, S.rescueTitle, [[S.rescueUse, 'button button--primary', onUse], [S.rescueDecline, 'button button--secondary', onDecline]]); const copy = document.createElement('p'); copy.className = 'rescue-copy'; copy.textContent = S.rescueBody; overlay.querySelector('.gloop-modal')?.insertBefore(copy, overlay.querySelector('.gloop-modal button')); },
    hide() { overlay.replaceChildren(); overlay.classList.remove('is-visible'); },
  };
}
function renderPanel(target: HTMLElement, title: string, buttons: [string, string, () => void][], score?: string, detail?: string, note?: string, gameOver = false): void {
  const panel = document.createElement('section'); panel.className = gameOver ? 'panel gloop-modal gloop-modal--game-over' : 'panel gloop-modal'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true');
  const heading = document.createElement('h1'); heading.textContent = title; panel.append(heading);
  if (score) { const value = document.createElement('p'); value.className = 'gloop-result-score'; value.textContent = score; panel.append(value); }
  if (detail) { const value = document.createElement('p'); value.className = detail === S.newBest ? 'gloop-result-best is-new' : 'gloop-result-best'; value.textContent = detail; panel.append(value); }
  if (note) { const value = document.createElement('p'); value.className = 'gloop-result-note'; value.textContent = note; panel.append(value); }
  let row: HTMLDivElement | undefined;
  for (const [label, cls, action] of buttons) {
    const button = document.createElement('button'); button.type = 'button'; button.className = cls; button.textContent = label; button.addEventListener('click', action);
    if (cls.includes('button--compact')) { if (!row) { row = document.createElement('div'); row.className = 'gloop-button-row'; panel.append(row); } row.append(button); } else panel.append(button);
  }
  target.replaceChildren(panel); target.classList.add('is-visible'); panel.querySelector('button')?.focus();
}
