/** Read resolved CSS safe-area insets; custom properties containing env() stay unevaluated as text. */
export function readSafeAreaInsets(): { top: number; bottom: number } {
  // spec-note: Resolve env() on a probe because reading the custom property returns its unevaluated text.
  const probe = document.createElement('div');
  probe.style.position = 'fixed';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  probe.style.paddingTop = 'env(safe-area-inset-top, 0px)';
  probe.style.paddingBottom = 'env(safe-area-inset-bottom, 0px)';
  document.documentElement.append(probe);
  const style = getComputedStyle(probe);
  const result = { top: Number.parseFloat(style.paddingTop) || 0, bottom: Number.parseFloat(style.paddingBottom) || 0 };
  probe.remove();
  return result;
}
