// SG §11.8: one visible toast, with the style-guide enter, stay, and exit timing.
export type ToastAccent = 'coin' | 'xp' | 'gold' | 'streak' | 'freeze';
export interface Toasts { show(message: string, accent?: ToastAccent): void; clear(): void; }
export function createToasts(root: HTMLElement): Toasts {
  const queue: { message: string; accent: ToastAccent }[] = []; let active: HTMLDivElement | undefined; let timers: number[] = []; let generation = 0;
  return {
    show(message, accent = 'gold') { queue.push({ message, accent }); if (!active) next(); },
    clear() {
      generation += 1; queue.length = 0;
      for (const timer of timers) window.clearTimeout(timer);
      timers = []; active?.remove(); active = undefined;
    },
  };
  function next(): void {
    const item = queue.shift(); if (!item) { active = undefined; return; } const currentGeneration = generation;
    const toast = document.createElement('div'); toast.className = 'gloop-toast'; toast.dataset.accent = item.accent; toast.textContent = item.message; root.append(toast); active = toast;
    later(() => {
      if (currentGeneration !== generation) return;
      toast.classList.add('is-exiting');
      later(() => {
        if (currentGeneration !== generation) return;
        toast.remove(); active = undefined;
        later(() => { if (currentGeneration === generation) next(); }, 600);
      }, 160);
    }, 2400);
  }
  function later(callback: () => void, delay: number): void {
    let timer = 0;
    timer = window.setTimeout(() => { timers = timers.filter((scheduled) => scheduled !== timer); callback(); }, delay);
    timers.push(timer);
  }
}
