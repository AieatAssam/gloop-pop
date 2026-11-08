interface CapacitorRuntime {
  getPlatform?(): string;
  isNativePlatform?(): boolean;
}
interface NativeWindow extends Window { Capacitor?: CapacitorRuntime }

export function isNativeRuntime(): boolean {
  if (typeof window === 'undefined') return false;
  return (window as NativeWindow).Capacitor?.isNativePlatform?.() === true;
}

export function isAndroidRuntime(): boolean {
  if (typeof window === 'undefined') return false;
  const capacitor = (window as NativeWindow).Capacitor;
  return capacitor?.getPlatform?.() === 'android' && capacitor.isNativePlatform?.() === true;
}

export type AndroidPlayBackAction = 'pause' | 'resume' | 'closeConfirmation';
export function androidPlayBackAction(paused: boolean, confirmationOpen: boolean): AndroidPlayBackAction {
  if (!paused) return 'pause';
  return confirmationOpen ? 'closeConfirmation' : 'resume';
}

/** Connects Android system back to app navigation; only loads the native plugin inside Android. */
export function listenForAndroidBack(onBack: () => boolean): () => void {
  if (!isAndroidRuntime()) return () => undefined;
  let disposed = false;
  let removeListener: (() => Promise<void>) | undefined;
  void import('@capacitor/app').then(({ App }) => App.addListener('backButton', () => {
    if (onBack()) void App.exitApp();
  })).then((registered) => {
    removeListener = () => registered.remove();
    if (disposed) void removeListener();
  });
  return () => { disposed = true; if (removeListener) void removeListener(); };
}

/** Web keeps its current host; native builds share the configured public site URL. */
export function shareSiteUrl(): string {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
  if (!isNativeRuntime()) return `${location.host}${basePath}`;
  const env = import.meta.env as ImportMetaEnv & { VITE_SITE_URL?: string };
  const publicUrl = env.VITE_SITE_URL;
  if (publicUrl) {
    const canonical = new URL(publicUrl);
    return `${canonical.host}${canonical.pathname.replace(/\/$/, '')}`;
  }
  // spec-note: Native links use the configured deployment URL when available; origin is the only safe fallback if packaging omitted it.
  return `${location.host}${basePath}`;
}

// Native-only plugin contract for the Android GloopShare plugin (share sheet and external browser).
export interface GloopSharePlugin {
  shareImage(options: { base64: string; filename: string; text?: string }): Promise<void>;
  shareText(options: { text: string }): Promise<void>;
  openUrl(options: { url: string }): Promise<void>;
}

let sharePlugin: Promise<GloopSharePlugin> | undefined;
// Loaded lazily so the web bundle never pulls the Capacitor core into the first paint.
function gloopShare(): Promise<GloopSharePlugin> {
  sharePlugin ??= import('@capacitor/core').then(({ registerPlugin }) => registerPlugin<GloopSharePlugin>('GloopShare'));
  return sharePlugin;
}

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  // Chunked so large PNGs never overflow the argument limit of String.fromCharCode.
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

export async function nativeShareImage(blob: Blob, filename: string, text?: string): Promise<void> {
  const base64 = await blobToBase64(blob);
  await (await gloopShare()).shareImage({ base64, filename, ...(text ? { text } : {}) });
}

export async function nativeShareText(text: string): Promise<void> {
  await (await gloopShare()).shareText({ text });
}

/** Opens http and https links in the system browser; any other scheme is refused. */
export async function nativeOpenUrl(url: string): Promise<void> {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new Error('Only http and https links can open natively.');
  await (await gloopShare()).openUrl({ url: parsed.href });
}
