import type { GameState } from '../core/types';
import type { Layout } from '../render/layout';
import { S } from './strings';
import { iconMarkup } from './icons';

/** SG §20.4: only armed in-level Adventure boosters are shown. */
export function createBoosterBar(onUse: (id: 'shuffle' | 'pop') => void): { element: HTMLElement; update(state: GameState, layout: Layout): void } {
  const element = document.createElement('div'); element.className = 'adventure-booster-bar';
  const buttons = new Map<'shuffle' | 'pop', HTMLButtonElement>();
  for (const id of ['shuffle', 'pop'] as const) {
    const button = document.createElement('button'); button.type = 'button'; button.className = `adventure-booster-button booster-icon-${id}`;
    button.title = id === 'shuffle' ? `${S.useShuffle} (4)` : `${S.usePop} (5)`; button.setAttribute('aria-label', id === 'shuffle' ? S.useShuffle : S.usePop);
    const icon = document.createElement('span'); icon.setAttribute('aria-hidden', 'true'); icon.innerHTML = iconMarkup(id); button.append(icon);
    button.addEventListener('click', () => onUse(id)); buttons.set(id, button);
  }
  return { element, update(state, layout) {
    const adventure = state.adventure; element.replaceChildren(); if (!adventure || state.mode !== 'adventure') return;
    const visible = (['shuffle', 'pop'] as const).filter((id) => adventure.boosters[id] !== 'none');
    for (const id of visible) {
      const button = buttons.get(id)!; const used = adventure.boosters[id] === 'used'; const disabled = used || (id === 'pop' && !state.board.some((cell) => cell >= 1 && cell <= 7));
      button.disabled = disabled; button.setAttribute('aria-label', used ? S.boosterUsed : id === 'shuffle' ? S.useShuffle : S.usePop);
      const icon = button.firstElementChild; if (icon) icon.innerHTML = used ? '<span class="booster-used-check">✓</span>' : iconMarkup(id);
      if (disabled) button.setAttribute('aria-disabled', 'true'); else button.removeAttribute('aria-disabled');
      element.append(button);
    }
    element.style.left = `${layout.portrait ? layout.combo.x + layout.combo.width / 2 : layout.combo.x + (layout.width >= 900 ? 152 : 152)}px`;
    element.style.top = `${layout.portrait ? layout.combo.y + layout.combo.height / 2 : layout.combo.y + layout.combo.height / 2}px`;
    element.style.transform = 'translate(-50%, -50%)'; element.hidden = visible.length === 0;
  } };
}
