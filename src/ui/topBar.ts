// SG §11.2 and §11.12: restrained top controls that keep the board clear.
import { S } from './strings';
import { iconMarkup } from './icons';

export interface TopBar { element: HTMLElement; pauseButton: HTMLButtonElement; muteButton: HTMLButtonElement; dailyPill: HTMLElement }
export function createTopBar(onMenu: () => void, onPause: () => void, onMute: () => void = () => undefined, onDaily: () => void = () => undefined): TopBar {
  const root = document.createElement('div'); root.className = 'gloop-topbar';
  const menu = button(iconMarkup('menu'), S.home, onMenu); menu.classList.add('gloop-icon-button');
  const pause = button(iconMarkup('pause'), S.pause, onPause); pause.classList.add('gloop-icon-button');
  const mute = button(iconMarkup('sound'), S.mute, onMute); mute.classList.add('gloop-icon-button');
  const dailyPill = button(S.dailyLabel, S.dailyLabel, onDaily); dailyPill.classList.remove('gloop-icon-button'); dailyPill.classList.add('daily-topbar-pill');
  const actions = document.createElement('div'); actions.className = 'gloop-topbar-actions'; actions.append(mute, pause);
  root.append(menu, dailyPill, actions);
  return { element: root, pauseButton: pause, muteButton: mute, dailyPill };
}
function button(html: string, label: string, action: () => void): HTMLButtonElement { const b = document.createElement('button'); b.type = 'button'; b.className = 'gloop-icon-button'; b.setAttribute('aria-label', label); b.innerHTML = html; b.addEventListener('click', action); return b; }
