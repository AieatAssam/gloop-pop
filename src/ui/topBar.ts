// SG §11.2 and §11.12: restrained top controls that keep the board clear.
import { S } from './strings';
import { iconMarkup } from './icons';

export interface TopBar { element: HTMLElement; pauseButton: HTMLButtonElement; dailyPill: HTMLElement }
export function createTopBar(onMenu: () => void, onPause: () => void): TopBar {
  const root = document.createElement('div'); root.className = 'gloop-topbar';
  const menu = button(iconMarkup('menu'), S.home, onMenu); menu.classList.add('gloop-icon-button');
  const pause = button(iconMarkup('pause'), S.pause, onPause); pause.classList.add('gloop-icon-button');
  const dailyPill = document.createElement('span'); dailyPill.className = 'daily-topbar-pill'; dailyPill.textContent = S.dailyLabel;
  root.append(menu, dailyPill, pause);
  return { element: root, pauseButton: pause, dailyPill };
}
function button(html: string, label: string, action: () => void): HTMLButtonElement { const b = document.createElement('button'); b.type = 'button'; b.className = 'gloop-icon-button'; b.setAttribute('aria-label', label); b.innerHTML = html; b.addEventListener('click', action); return b; }
