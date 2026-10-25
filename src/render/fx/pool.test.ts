import { describe, expect, it } from 'vitest';
import { createParticlePool, PARTICLE_CAP, type Particle } from './pool';

const particle = (x: number): Particle => ({ x, y: 0, vx: 1, vy: 0, ax: 0, ay: 0, rot: 0, vrot: 0, size: 1, size1: 0, life: 1, age: 0, colour: 'white', kind: 'sparkles', bounce: 0, burst: false });

describe('particle pool', () => {
  it('enforces the 420 particle cap and drops new requests', () => {
    const pool = createParticlePool();
    for (let i = 0; i < PARTICLE_CAP; i += 1) expect(pool.add(particle(i))).toBe(true);
    expect(pool.add(particle(PARTICLE_CAP))).toBe(false);
    expect(pool.items).toHaveLength(PARTICLE_CAP);
  });
  it('integrates motion and removes expired particles', () => {
    const pool = createParticlePool(); pool.add(particle(0)); pool.update(0.5);
    expect(pool.items[0]?.x).toBe(0.5); pool.update(0.5); expect(pool.items).toHaveLength(0);
  });
});
