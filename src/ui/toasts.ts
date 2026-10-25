// SG §11.8: one visible toast, with the style-guide enter, stay, and exit timing.
export type ToastAccent = 'coin' | 'xp' | 'gold' | 'streak' | 'freeze';
export interface Toasts { show(message: string, accent?: ToastAccent): void; }
export function createToasts(root: HTMLElement): Toasts {
  const queue: { message: string; accent: ToastAccent }[] = []; let active = false;
  return { show(message, accent = 'gold') { queue.push({ message, accent }); if (!active) next(); } };
  function next(): void {
    const item = queue.shift(); if (!item) { active = false; return; } active = true;
    const toast = document.createElement('div'); toast.className = 'gloop-toast'; toast.dataset.accent = item.accent; toast.textContent = item.message; root.append(toast);
    window.setTimeout(() => { toast.classList.add('is-exiting'); window.setTimeout(() => { toast.remove(); window.setTimeout(next, 600); }, 160); }, 2400);
  }
}
