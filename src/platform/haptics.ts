// SG §16: mobile vibration patterns, silently skipped when unavailable.
export type HapticEvent = 'pick' | 'snap' | 'place' | 'line1' | 'line2' | 'big' | 'mega' | 'stuck';
export function hapticPattern(event: HapticEvent): number | readonly number[] | null { switch (event) { case 'pick': return 10; case 'snap': return 5; case 'place': return 8; case 'line1': return 14; case 'line2': return 22; case 'big': return [18, 30, 18]; case 'mega': return [30, 40, 30, 40, 50]; case 'stuck': return 40; } }
let lastHapticAt = -Infinity; let lastSnapAt = -Infinity;
export function canFireSnap(now: number, lastHaptic: number, lastSnap: number): boolean { return now - lastHaptic >= 120 && now - lastSnap >= 120; }
export function vibrate(event: HapticEvent, enabled: boolean): void {
  if (!enabled || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  const now = typeof performance === 'undefined' ? 0 : performance.now();
  if (event === 'snap' && !canFireSnap(now, lastHapticAt, lastSnapAt)) return;
  const pattern = hapticPattern(event); if (pattern === null) return;
  navigator.vibrate(typeof pattern === 'number' ? pattern : [...pattern]); lastHapticAt = now; if (event === 'snap') lastSnapAt = now;
}
