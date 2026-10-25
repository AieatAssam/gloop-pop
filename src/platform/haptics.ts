// SG §9.13.k: short, priority-aware vibration patterns; unsupported browsers no-op.
export type HapticEvent = 'pick' | 'snap' | 'place' | 'goal' | 'booster' | 'line1' | 'line2' | 'line3' | 'line4' | 'big' | 'huge' | 'mega' | 'allClear' | 'stuck';
export type HapticPattern = readonly number[];
export function comboHapticPattern(lines: number, tier: number): HapticPattern {
  const base = lines >= 4 ? [20, 50, 16, 50, 12, 50, 8] : lines === 3 ? [20, 50, 14, 50, 10] : lines === 2 ? [18, 50, 12] : [16];
  const extra = tier >= 3 ? 2 : tier >= 2 ? 1 : 0;
  for (let i = 0; i < extra; i += 1) base.push(50, 8);
  return base;
}
export function addComboTicks(pattern: HapticPattern, tier: number): HapticPattern {
  const result = [...pattern]; const extra = tier >= 3 ? 2 : tier >= 2 ? 1 : 0;
  let total = result.reduce((sum, value) => sum + value, 0);
  for (let i = 0; i < extra && total + 58 <= 400; i += 1) { result.push(50, 8); total += 58; }
  return result;
}
export function hapticPattern(event: HapticEvent): HapticPattern { switch (event) {
  case 'pick': return [10]; case 'snap': return [5]; case 'place': return [12]; case 'goal': return [10]; case 'booster': return [8]; case 'line1': return [16];
  case 'line2': return [18, 50, 12]; case 'line3': return [20, 50, 14, 50, 10]; case 'line4': return [20, 50, 16, 50, 12, 50, 8];
  case 'big': return [14, 50, 10]; case 'huge': return [18, 50, 14, 50, 10]; case 'mega': return [20, 50, 16, 50, 12];
  case 'allClear': return [20, 50, 20, 50, 20, 50, 20]; case 'stuck': return [12, 88, 12, 88, 12];
} }
export function hapticPriority(event: HapticEvent): number { return ({ snap: 0, pick: 1, place: 2, booster: 3, stuck: 3, goal: 4, line1: 4, line2: 4, line3: 4, line4: 4, big: 5, huge: 6, allClear: 7, mega: 8 } satisfies Record<HapticEvent, number>)[event]; }
export function validHapticPattern(pattern: HapticPattern): boolean { let total = 0; for (let i = 0; i < pattern.length; i += 1) { const duration = pattern[i]!; total += duration; if (i % 2 === 0 ? duration > 20 : duration < 50) return false; } return total <= 400; }
export function canFireHaptic(now: number, lastAt: number, lastPriority: number, priority: number): boolean { return now - lastAt >= 60 || priority > lastPriority; }
export function canFireSnap(now: number, lastHaptic: number, lastSnap: number): boolean { return now - lastHaptic >= 120 && now - lastSnap >= 120; }
let lastHapticAt = -Infinity; let lastSnapAt = -Infinity; let lastPriority = -1;
export function vibrate(event: HapticEvent, enabled: boolean, patternOverride?: HapticPattern): void {
  if (!enabled || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  const now = typeof performance === 'undefined' ? 0 : performance.now(); const priority = hapticPriority(event);
  if (event === 'snap' && !canFireSnap(now, lastHapticAt, lastSnapAt)) return;
  if (event !== 'snap' && !canFireHaptic(now, lastHapticAt, lastPriority, priority)) return;
  const pattern = patternOverride ?? hapticPattern(event); if (!validHapticPattern(pattern)) return;
  navigator.vibrate([...pattern]); lastHapticAt = now; lastPriority = priority; if (event === 'snap') lastSnapAt = now;
}
export function resetHaptics(): void { lastHapticAt = -Infinity; lastSnapAt = -Infinity; lastPriority = -1; }
