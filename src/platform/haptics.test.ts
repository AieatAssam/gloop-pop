import { describe, expect, it } from 'vitest';
import { addComboTicks, canFireHaptic, canFireSnap, comboHapticPattern, hapticPattern, hapticPriority, validHapticPattern, type HapticEvent } from './haptics';

describe('SG §9.13.k haptics', () => {
  it('keeps every event pulse short, gaps long, and patterns under 400 ms', () => {
    const events: HapticEvent[] = ['pick', 'snap', 'place', 'goal', 'line1', 'line2', 'line3', 'line4', 'big', 'huge', 'mega', 'allClear', 'stuck'];
    for (const event of events) expect(validHapticPattern(hapticPattern(event))).toBe(true);
    expect(hapticPattern('allClear')).toEqual([20, 50, 20, 50, 20, 50, 20]);
    expect(validHapticPattern([22])).toBe(false); expect(validHapticPattern([10, 40, 10])).toBe(false);
  });
  it('adds combo ticks and applies the 60 ms priority override', () => {
    expect(comboHapticPattern(1, 0)).toEqual([16]);
    expect(addComboTicks([16], 2)).toEqual([16, 50, 8]);
    expect(addComboTicks([16], 4)).toEqual([16, 50, 8, 50, 8]);
    expect(canFireHaptic(59, 0, 3, 3)).toBe(false); expect(canFireHaptic(59, 0, 3, 4)).toBe(true); expect(canFireHaptic(60, 0, 3, 3)).toBe(true);
    expect(hapticPriority('mega')).toBeGreaterThan(hapticPriority('allClear'));
  });
  it('keeps snap ticks on their independent 120 ms rule', () => {
    expect(canFireSnap(120, 0, 0)).toBe(true); expect(canFireSnap(119, 0, 0)).toBe(false); expect(canFireSnap(121, 121, 0)).toBe(false);
  });
});
