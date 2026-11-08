// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { chooseShareRoute, shareText } from './share';

afterEach(() => { delete (window as Window & { Capacitor?: unknown }).Capacitor; vi.restoreAllMocks(); });

describe('share routing', () => {
  it('chooses the web path unless the runtime is native', () => {
    expect(chooseShareRoute(false)).toBe('web');
    expect(chooseShareRoute(true)).toBe('native');
  });

  it('does not report a copy when the clipboard write is rejected', async () => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockRejectedValue(new Error('blocked')) }, configurable: true });
    const onCopied = vi.fn();
    await expect(shareText('hello', onCopied)).resolves.toBeUndefined();
    expect(onCopied).not.toHaveBeenCalled();
  });
});
