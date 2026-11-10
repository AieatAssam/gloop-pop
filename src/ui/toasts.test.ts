// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createToasts } from './toasts';

describe('toasts', () => {
  afterEach(() => vi.useRealTimers());

  it('removes the visible toast and discards queued toasts when cleared', () => {
    vi.useFakeTimers();
    const root = document.createElement('div');
    const toast = createToasts(root);

    toast.show('Stage 2: bigger pieces');
    toast.show('Stage 3: grape joins in');
    expect(root.textContent).toBe('Stage 2: bigger pieces');

    toast.clear();
    expect(root.childElementCount).toBe(0);
    vi.advanceTimersByTime(4000);
    expect(root.childElementCount).toBe(0);
  });

  it('continues with queued toasts after the active toast expires', () => {
    vi.useFakeTimers();
    const root = document.createElement('div');
    const toast = createToasts(root);

    toast.show('First');
    toast.show('Second');
    vi.advanceTimersByTime(3160);
    expect(root.textContent).toBe('Second');
  });
});

describe('toasts while a panel is open', () => {
  afterEach(() => vi.useRealTimers());

  it('holds new toasts until the panel closes', () => {
    vi.useFakeTimers();
    const root = document.createElement('div');
    let blocked = true;
    const toast = createToasts(root, () => blocked);

    toast.show('Unlocked: Hearts');
    expect(root.childElementCount).toBe(0);
    vi.advanceTimersByTime(1000);
    expect(root.childElementCount).toBe(0);

    blocked = false;
    vi.advanceTimersByTime(250);
    expect(root.textContent).toBe('Unlocked: Hearts');
  });

  it('removes a visible toast when a panel opens and shows it again after', () => {
    vi.useFakeTimers();
    const root = document.createElement('div');
    let blocked = false;
    const toast = createToasts(root, () => blocked);

    toast.show('Achievement');
    expect(root.textContent).toBe('Achievement');
    blocked = true;
    vi.advanceTimersByTime(250);
    expect(root.childElementCount).toBe(0);

    blocked = false;
    vi.advanceTimersByTime(250);
    expect(root.textContent).toBe('Achievement');
  });
});
