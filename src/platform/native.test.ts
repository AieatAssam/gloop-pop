// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { androidPlayBackAction, isAndroidRuntime, isNativeRuntime, listenForAndroidBack, nativeOpenUrl, shareSiteUrl } from './native';
import { shouldRegisterServiceWorker } from './sw';

const androidApp = vi.hoisted(() => ({ addListener: vi.fn(), exitApp: vi.fn() }));
vi.mock('@capacitor/app', () => ({ App: androidApp }));

afterEach(() => { delete (window as Window & { Capacitor?: unknown }).Capacitor; });
function setCapacitor(value: unknown): void { Object.defineProperty(window, 'Capacitor', { value, writable: true, configurable: true }); }

describe('native platform adapters', () => {
  it('keeps service workers on production web and excludes native and unsupported runtimes', () => {
    expect(shouldRegisterServiceWorker(true, false, true)).toBe(true);
    expect(shouldRegisterServiceWorker(true, true, true)).toBe(false);
    expect(shouldRegisterServiceWorker(true, false, false)).toBe(false);
    expect(shouldRegisterServiceWorker(false, false, true)).toBe(false);
  });

  it('recognizes Capacitor native and Android platforms independently', () => {
    setCapacitor({ isNativePlatform: () => true, getPlatform: () => 'android' });
    expect(isNativeRuntime()).toBe(true);
    expect(isAndroidRuntime()).toBe(true);
    setCapacitor({ isNativePlatform: () => true, getPlatform: () => 'ios' });
    expect(isAndroidRuntime()).toBe(false);
  });

  it('closes a confirmation, resumes an open pause menu, or opens pause when needed', () => {
    expect(androidPlayBackAction(false, false)).toBe('pause');
    expect(androidPlayBackAction(true, true)).toBe('closeConfirmation');
    expect(androidPlayBackAction(true, false)).toBe('resume');
  });

  it('shares the configured public host in native and the current host on web', () => {
    expect(shareSiteUrl()).toBe(location.host);
    setCapacitor({ isNativePlatform: () => true, getPlatform: () => 'android' });
    vi.stubEnv('VITE_SITE_URL', 'https://aieatassam.github.io/gloop-pop/');
    expect(shareSiteUrl()).toBe('aieatassam.github.io/gloop-pop');
  });

  it('registers Android back, exits when requested, and removes the listener when disposed', async () => {
    const onBack = vi.fn(() => true); const remove = vi.fn(); const addListener = vi.fn().mockResolvedValue({ remove });
    androidApp.addListener = addListener; androidApp.exitApp = vi.fn();
    setCapacitor({ isNativePlatform: () => true, getPlatform: () => 'android' });
    const dispose = listenForAndroidBack(onBack);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(addListener).toHaveBeenCalledWith('backButton', expect.any(Function));
    const backListener = addListener.mock.calls[0]?.[1] as (() => void) | undefined;
    backListener?.();
    expect(androidApp.exitApp).toHaveBeenCalledOnce();
    dispose();
    expect(remove).toHaveBeenCalledOnce();
  });

  it('does not load the Android listener in a browser', async () => {
    androidApp.addListener = vi.fn();
    setCapacitor({ isNativePlatform: () => false, getPlatform: () => 'web' });
    listenForAndroidBack(vi.fn());
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(androidApp.addListener).not.toHaveBeenCalled();
  });

  it('refuses non-web schemes before any native call is made', async () => {
    await expect(nativeOpenUrl('javascript:alert(1)')).rejects.toThrow('Only http and https');
    await expect(nativeOpenUrl('intent://example.com')).rejects.toThrow('Only http and https');
  });
});
