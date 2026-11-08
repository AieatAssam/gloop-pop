import { isNativeRuntime, nativeShareImage, nativeShareText } from './native';

export type ShareRoute = 'native' | 'web';
export function chooseShareRoute(native: boolean): ShareRoute { return native ? 'native' : 'web'; }

export async function shareText(text: string, onCopied: () => void): Promise<void> {
  if (chooseShareRoute(isNativeRuntime()) === 'native') { await nativeShareText(text); return; }
  if (navigator.share) { await navigator.share({ text }); return; }
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // spec-note: a blocked clipboard (permissions or insecure context) is silent; no "Copied" toast claims success.
    return;
  }
  onCopied();
}

export async function shareImage(blob: Blob, filename: string): Promise<void> {
  if (chooseShareRoute(isNativeRuntime()) === 'native') { await nativeShareImage(blob, filename); return; }
  const file = new File([blob], filename, { type: 'image/png' });
  if (navigator.share && navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file] }); return; }
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = filename; link.click(); URL.revokeObjectURL(link.href);
}
