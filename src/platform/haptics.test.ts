import { describe, expect, it } from 'vitest';
import { hapticPattern } from './haptics';
describe('haptic patterns', () => { it('matches the SG event table', () => { expect(hapticPattern('pick')).toBe(5); expect(hapticPattern('place')).toBe(8); expect(hapticPattern('line1')).toBe(14); expect(hapticPattern('line2')).toBe(22); expect(hapticPattern('big')).toEqual([18, 30, 18]); expect(hapticPattern('mega')).toEqual([30, 40, 30, 40, 50]); expect(hapticPattern('stuck')).toBe(40); }); });
