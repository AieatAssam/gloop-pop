// SG §11.1–11.3: DOM overlays use palette CSS variables and exact design strings.
import { S } from './strings';

export interface GameUi { root: HTMLElement; showPause(onResume: () => void, onRestart: () => void, onHome: () => void, restartLabel: string): void; showRestartConfirm(onStart: () => void, onCancel: () => void): void; showGameOver(onRestart: () => void, onHome: () => void, score: number, best: number | null, fallback: string, rewards: { xp: number; coins: number; progress: number; progressMax: number; level?: number }): void; showRescue(onUse: () => void, onDecline: () => void): void; hide(): void }
export function createGameUi(root: HTMLElement): GameUi {
  const overlay = document.createElement('div'); overlay.className = 'gloop-overlay'; root.append(overlay);
  return {
    root,
    showPause(onResume, onRestart, onHome, restartLabel) { renderPanel(overlay, S.pause, [[S.resume, 'button button--primary', onResume], [restartLabel, 'button button--secondary', onRestart], [S.home, 'button button--secondary', onHome]]); },
    showRestartConfirm(onStart, onCancel) { renderPanel(overlay, S.restartConfirm, [[S.startOver, 'button button--primary', onStart], [S.cancel, 'button button--secondary', onCancel]]); },
    showGameOver(onRestart, onHome, score, best, fallback, rewards) {
      const rewardText = S.rewardRow(rewards.xp, rewards.coins);
      renderPanel(overlay, S.noRoom, [[S.playAgain, 'button button--primary', onRestart], [S.home, 'button button--secondary', onHome]], new Intl.NumberFormat('en-US').format(score), best === null ? undefined : best > 0 && score > best ? S.newBest : S.best(new Intl.NumberFormat('en-US').format(best)), S.gameOverNote(fallback, rewards.level));
      const panel = overlay.querySelector('.gloop-modal'); if (!panel) return;
      const reward = document.createElement('div'); reward.className = 'gloop-rewards'; const label = document.createElement('p'); label.textContent = rewardText; const track = document.createElement('div'); track.className = 'xp-track'; const fill = document.createElement('span'); fill.style.width = '0%'; track.append(fill); reward.append(label, track); panel.insertBefore(reward, panel.querySelector('.gloop-result-note')); requestAnimationFrame(() => { fill.style.width = `${rewards.progressMax ? Math.min(100, rewards.progress / rewards.progressMax * 100) : 100}%`; });
    },
    showRescue(onUse, onDecline) { renderPanel(overlay, S.rescueReady, [[S.rescueUse, 'button button--primary', onUse], [S.rescueDecline, 'button button--secondary', onDecline]]); },
    hide() { overlay.replaceChildren(); overlay.classList.remove('is-visible'); },
  };
}
function renderPanel(target: HTMLElement, title: string, buttons: [string, string, () => void][], score?: string, detail?: string, note?: string): void {
  const panel = document.createElement('section'); panel.className = 'panel gloop-modal'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true');
  const heading = document.createElement('h1'); heading.textContent = title; panel.append(heading);
  if (score) { const value = document.createElement('p'); value.className = 'gloop-result-score'; value.textContent = score; panel.append(value); }
  if (detail) { const value = document.createElement('p'); value.className = 'gloop-result-best'; value.textContent = detail; panel.append(value); }
  if (note) { const value = document.createElement('p'); value.className = 'gloop-result-note'; value.textContent = note; panel.append(value); }
  for (const [label, cls, action] of buttons) { const button = document.createElement('button'); button.type = 'button'; button.className = cls; button.textContent = label; button.addEventListener('click', action); panel.append(button); }
  target.replaceChildren(panel); target.classList.add('is-visible'); panel.querySelector('button')?.focus();
}
