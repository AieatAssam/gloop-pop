// SG §9.3: a bounded, allocation-light pool for cosmetic particles.
export const PARTICLE_CAP = 420;
export interface Particle { x: number; y: number; vx: number; vy: number; ax: number; ay: number; rot: number; vrot: number; size: number; size1: number; life: number; age: number; colour: string; kind: string; bounce: number; burst: boolean }

export function createParticlePool(cap = PARTICLE_CAP): { readonly items: Particle[]; add(particle: Particle): boolean; spawn(x: number, y: number, vx: number, vy: number, ax: number, ay: number, rot: number, vrot: number, size: number, size1: number, life: number, colour: string, kind: string, bounce: number, burst: boolean): boolean; update(dt: number): void; clear(): void } {
  const items: Particle[] = []; const free: Particle[] = [];
  for (let i = 0; i < cap; i += 1) free.push({ x: 0, y: 0, vx: 0, vy: 0, ax: 0, ay: 0, rot: 0, vrot: 0, size: 0, size1: 0, life: 0, age: 0, colour: '', kind: '', bounce: 0, burst: false });
  const spawn = (x: number, y: number, vx: number, vy: number, ax: number, ay: number, rot: number, vrot: number, size: number, size1: number, life: number, colour: string, kind: string, bounce: number, burst: boolean): boolean => {
    const particle = free.pop(); if (!particle) return false;
    particle.x = x; particle.y = y; particle.vx = vx; particle.vy = vy; particle.ax = ax; particle.ay = ay; particle.rot = rot; particle.vrot = vrot; particle.size = size; particle.size1 = size1; particle.life = life; particle.age = 0; particle.colour = colour; particle.kind = kind; particle.bounce = bounce; particle.burst = burst; items.push(particle); return true;
  };
  return {
    items,
    add(particle) { return spawn(particle.x, particle.y, particle.vx, particle.vy, particle.ax, particle.ay, particle.rot, particle.vrot, particle.size, particle.size1, particle.life, particle.colour, particle.kind, particle.bounce, particle.burst); },
    spawn,
    update(dt) { for (let i = items.length - 1; i >= 0; i -= 1) { const p = items[i]!; p.age += dt; if (p.age >= p.life) { items[i] = items[items.length - 1]!; items.pop(); free.push(p); continue; } p.vx += p.ax * dt; p.vy += p.ay * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vrot * dt; } },
    clear() { for (const p of items) free.push(p); items.length = 0; },
  };
}
