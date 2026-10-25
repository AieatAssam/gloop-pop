// SG §11.1–11.3: DOM overlays use palette CSS variables and exact design strings.
import { S } from './strings';

export interface GameUi { root: HTMLElement; showPause(onResume: () => void, onRestart: () => void): void; showRestartConfirm(onStart: () => void, onCancel: () => void): void; showGameOver(onRestart: () => void, score: number, best: number, fallback: string): void; showRescue(onUse: () => void, onDecline: () => void): void; hide(): void }
export function createGameUi(root: HTMLElement): GameUi {
  const overlay = document.createElement('div'); overlay.className = 'gloop-overlay'; root.append(overlay);
  return {
    root,
    showPause(onResume, onRestart) { renderPanel(overlay, S.pause, [[S.resume, 'button button--primary', onResume], [S.restart, 'button button--secondary', onRestart]]); },
    showRestartConfirm(onStart, onCancel) { renderPanel(overlay, S.restartConfirm, [[S.startOver, 'button button--primary', onStart], [S.cancel, 'button button--secondary', onCancel]]); },
    showGameOver(onRestart, score, best, fallback) { renderPanel(overlay, S.noRoom, [[S.playAgain, 'button button--primary', onRestart]], new Intl.NumberFormat('en-US').format(score), score >= best && score > 0 ? S.newBest : S.best(new Intl.NumberFormat('en-US').format(best)), fallback); },
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
