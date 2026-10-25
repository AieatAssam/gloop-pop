import { describe, expect, it } from 'vitest';
import { PALETTE } from '../palette';
import { createParticles, popParticleStyle } from './particles';

describe('Gold pop particle styles (SG §9.3)', () => {
  it('uses the matching base shape and the specified palette weights', () => {
    expect(popParticleStyle('goldsparkles', () => 0.59, 'flavour')).toEqual({ kind: 'sparkles', colour: PALETTE.ui.gold });
    expect(popParticleStyle('goldsparkles', () => 0.6, 'flavour')).toEqual({ kind: 'sparkles', colour: PALETTE.fx.sugar });
    expect(popParticleStyle('goldstars', () => 0.69, 'flavour')).toEqual({ kind: 'stars', colour: PALETTE.ui.gold });
    expect(popParticleStyle('goldstars', () => 0.7, 'flavour')).toEqual({ kind: 'stars', colour: PALETTE.ui.coinShade });
    const roles = [PALETTE.ui.gold, PALETTE.ui.coinShade, PALETTE.ui.coinShine, PALETTE.fx.sugar];
    roles.forEach((colour, index) => expect(popParticleStyle('goldconfetti', () => index / 4, 'flavour')).toEqual({ kind: 'confetti', colour }));
  });
  it('keeps emitted particle counts unchanged', () => {
    const particles = createParticles(12); particles.emit(0, 0, 20, 1, 7, 'goldconfetti'); expect(particles.count).toBe(7);
  });
});
