// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { createRouter } from './router';

describe('screen router Adventure entry', () => {
  it('pushes Adventure and returns to Home with browser back', () => {
    const router = createRouter('home'); const listener = vi.fn(); router.subscribe(listener); router.open('adventure');
    expect(router.current).toBe('adventure'); expect(listener).toHaveBeenLastCalledWith('adventure');
    window.dispatchEvent(new PopStateEvent('popstate', { state: { gloopScreen: 'home' } }));
    expect(router.current).toBe('home'); expect(listener).toHaveBeenLastCalledWith('home');
  });
});
