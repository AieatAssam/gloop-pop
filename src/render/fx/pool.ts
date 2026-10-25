// SG §9.3: a bounded, allocation-light pool for cosmetic particles.
export const PARTICLE_CAP = 420;
export interface Particle { x: number; y: number; vx: number; vy: number; ax: number; ay: number; rot: number; vrot: number; size: number; size1: number; life: number; age: number; colour: string; kind: string; bounce: number; burst: boolean }

export function createParticlePool(cap = PARTICLE_CAP): { readonly items: Particle[]; add(particle: Particle): boolean; update(dt: number): void; clear(): void } {
  const items: Particle[] = [];
  return {
    items,
    add(particle) { if (items.length >= cap) return false; items.push(particle); return true; },
    update(dt) { for (let i = items.length - 1; i >= 0; i -= 1) { const p = items[i]!; p.age += dt; if (p.age >= p.life) { items.splice(i, 1); continue; } p.vx += p.ax * dt; p.vy += p.ay * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vrot * dt; } },
    clear() { items.length = 0; },
  };
}
