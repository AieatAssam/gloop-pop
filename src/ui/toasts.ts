// SG §11.8: one visible toast, with the style-guide enter, stay, and exit timing.
export type ToastAccent = 'coin' | 'xp' | 'gold' | 'streak' | 'freeze';
/** Modal panels that hide toasts: the `.gloop-overlay` panels (pause, game over, rescue, adult check) and the Adventure level card and result panel (`.adventure-modal-shade`, also used by the result shade). */
export const TOAST_BLOCKER_SELECTOR = '.gloop-overlay.is-visible, .adventure-modal-shade';
export interface Toasts { show(message: string, accent?: ToastAccent): void; clear(): void; }
const HOLD_CHECK_MS = 200;
/**
 * spec-note: While a modal panel is open (`isBlocked`), no toast is shown, because a toast over the
 * panel covered its buttons (Hearts over the game-over actions at 360x640). A toast already on screen
 * when the panel opens is removed and goes back to the front of the queue. Queued toasts show after the panel closes.
 */
export function createToasts(root: HTMLElement, isBlocked: () => boolean = () => false): Toasts {
  const queue: { message: string; accent: ToastAccent }[] = []; let active: HTMLDivElement | undefined; let timers: number[] = []; let generation = 0; let watch = 0; let resting = false;
  return {
    show(message, accent = 'gold') { queue.push({ message, accent }); if (!active) next(); },
    clear() {
      generation += 1; queue.length = 0;
      for (const timer of timers) window.clearTimeout(timer);
      timers = []; resting = false; active?.remove(); active = undefined; stopWatch();
    },
  };
  function next(): void {
    if (active || resting) return;
    if (isBlocked()) { ensureWatch(); return; }
    const item = queue.shift(); if (!item) { active = undefined; stopWatch(); return; } const currentGeneration = generation;
    const toast = document.createElement('div'); toast.className = 'gloop-toast'; toast.dataset.accent = item.accent; toast.textContent = item.message; root.append(toast); active = toast;
    ensureWatch();
    later(() => {
      if (currentGeneration !== generation) return;
      toast.classList.add('is-exiting');
      later(() => {
        if (currentGeneration !== generation) return;
        toast.remove(); active = undefined; resting = true;
        later(() => { resting = false; if (currentGeneration === generation) next(); }, 600);
      }, 160);
    }, 2400);
  }
  /** Runs while something is queued or shown. It removes a toast when a panel opens and resumes the queue when the panel closes. */
  function hold(): void {
    if (active) {
      const message = active.textContent ?? ''; const accent = (active.dataset.accent ?? 'gold') as ToastAccent;
      active.remove(); active = undefined; generation += 1;
      for (const timer of timers) window.clearTimeout(timer);
      timers = []; queue.unshift({ message, accent });
    }
    resting = false;
  }
  function ensureWatch(): void {
    if (watch) return;
    watch = window.setInterval(() => {
      if (isBlocked()) hold();
      else if (!active && !resting && queue.length > 0) next();
      if (!active && queue.length === 0) stopWatch();
    }, HOLD_CHECK_MS);
  }
  function stopWatch(): void {
    if (watch) { window.clearInterval(watch); watch = 0; }
  }
  function later(callback: () => void, delay: number): void {
    let timer = 0;
    timer = window.setTimeout(() => { timers = timers.filter((scheduled) => scheduled !== timer); callback(); }, delay);
    timers.push(timer);
  }
}
