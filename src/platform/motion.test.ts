import { describe, expect, it } from 'vitest';
import { canStartSlowMo, reducedParticleCount, shouldReduceMotion } from './motion';
describe('motion gates', () => {
  it('respects the setting and device preference', () => { expect(shouldReduceMotion('on', false)).toBe(true); expect(shouldReduceMotion('system', true)).toBe(true); expect(shouldReduceMotion('off', true)).toBe(false); });
  it('scales particles and rate limits slow motion to once per three seconds', () => { expect(reducedParticleCount(5, true)).toBe(2); expect(canStartSlowMo(0, 2999, false)).toBe(false); expect(canStartSlowMo(0, 3000, false)).toBe(true); expect(canStartSlowMo(0, 5000, true)).toBe(false); });
});
