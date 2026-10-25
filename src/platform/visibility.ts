export function onSaveVisibility(save: () => void): () => void {
  const flush = (): void => save();
  const visibility = (): void => { if (document.visibilityState === 'hidden') flush(); };
  document.addEventListener('visibilitychange', visibility); window.addEventListener('pagehide', flush);
  return () => { document.removeEventListener('visibilitychange', visibility); window.removeEventListener('pagehide', flush); };
}
