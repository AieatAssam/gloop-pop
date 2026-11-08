// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BoardView } from '../render/boardView';
import type { Layout } from '../render/layout';
import type { GameState } from '../core/types';
import { attachKeyboard } from './keyboard';

const adventure = (): GameState => ({ mode: 'adventure', tray: [] }) as unknown as GameState;

// Each test attaches a fresh window listener; remove it afterwards so earlier tests cannot see later key events.
let handler: EventListener | undefined;
function setup(): { onBooster: ReturnType<typeof vi.fn> } {
  const onBooster = vi.fn();
  const add = vi.spyOn(window, 'addEventListener');
  attachKeyboard({} as BoardView, () => ({} as Layout), adventure, vi.fn(), vi.fn(), vi.fn(), undefined, onBooster);
  handler = add.mock.calls.find(([type]) => type === 'keydown')?.[1] as EventListener;
  add.mockRestore();
  return { onBooster };
}

afterEach(() => {
  if (handler) window.removeEventListener('keydown', handler);
  handler = undefined; document.body.innerHTML = '';
});

describe('keyboard shortcuts', () => {
  it('leaves a digit typed into a text input alone', () => {
    const { onBooster } = setup();
    const input = document.createElement('input'); input.type = 'text'; document.body.append(input);
    input.focus();
    const event = new KeyboardEvent('keydown', { key: '4', bubbles: true, cancelable: true });
    input.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(onBooster).not.toHaveBeenCalled();
  });

  it('leaves keys alone inside an open dialog', () => {
    const { onBooster } = setup();
    const dialog = document.createElement('form'); dialog.setAttribute('role', 'dialog');
    const button = document.createElement('button'); dialog.append(button); document.body.append(dialog);
    button.focus();
    const event = new KeyboardEvent('keydown', { key: '5', bubbles: true, cancelable: true });
    button.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(onBooster).not.toHaveBeenCalled();
  });

  it('still fires boosters when focus is on the page', () => {
    const { onBooster } = setup();
    const event = new KeyboardEvent('keydown', { key: '4', bubbles: true, cancelable: true });
    document.body.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(onBooster).toHaveBeenCalledWith('shuffle');
  });
});
