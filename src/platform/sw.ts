import { isNativeRuntime } from './native';

// M8.1: register after the app's first frame so startup stays responsive.
export function registerServiceWorker(): void {
  if (!shouldRegisterServiceWorker(import.meta.env.PROD, isNativeRuntime(), 'serviceWorker' in navigator)) return;
  void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL });
}

export function shouldRegisterServiceWorker(production: boolean, native: boolean, supported: boolean): boolean {
  return production && !native && supported;
}
