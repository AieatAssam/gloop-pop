export async function shareText(text: string, onCopied: () => void): Promise<void> {
  if (navigator.share) { await navigator.share({ text }); return; }
  await navigator.clipboard.writeText(text); onCopied();
}

export async function shareImage(blob: Blob, filename: string): Promise<void> {
  const file = new File([blob], filename, { type: 'image/png' });
  if (navigator.share && navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file] }); return; }
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = filename; link.click(); URL.revokeObjectURL(link.href);
}
