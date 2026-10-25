import { describe, expect, it } from 'vitest';
import { canFireSnap, hapticPattern } from './haptics';
describe('haptic patterns', () => { it('matches the SG §9.13.k pickup and snap patterns', () => { expect(hapticPattern('pick')).toBe(10); expect(hapticPattern('snap')).toBe(5); }); it('keeps the snap rate limit clear of other haptics', () => { expect(canFireSnap(120, 0, 0)).toBe(true); expect(canFireSnap(119, 0, 0)).toBe(false); expect(canFireSnap(121, 121, 0)).toBe(false); }); });
