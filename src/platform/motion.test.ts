import { describe, expect, it } from 'vitest';
import { canStartSlowMo, motionEffectScales, reducedParticleCount, shouldReduceMotion } from './motion';
describe('motion gates', () => {
  it('respects the setting and device preference', () => { expect(shouldReduceMotion('on', false)).toBe(true); expect(shouldReduceMotion('system', true)).toBe(true); expect(shouldReduceMotion('off', true)).toBe(false); });
  it('scales particles and rate limits slow motion to once per three seconds', () => { expect(reducedParticleCount(5, true)).toBe(2); expect(canStartSlowMo(0, 2999, false)).toBe(false); expect(canStartSlowMo(0, 3000, false)).toBe(true); expect(canStartSlowMo(0, 5000, true)).toBe(false); });
  it('zeroes motion effects and keeps particles at thirty percent', () => { expect(motionEffectScales(true)).toEqual({ hitstop: 0, slowMo: 0, trauma: 0, kick: 0, tilt: 0, stretch: 0, shear: 0, particles: 0.3 }); });
});
