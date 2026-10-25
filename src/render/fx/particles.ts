// SG §9.3: pooled pop particles with six equipped effect shapes.
import { createParticlePool, type Particle } from './pool';
import { createCosmeticRng } from '../cosmeticRng';
import { FLAVOUR_KEYS, PALETTE } from '../palette';
import type { PopEffectId } from '../themes';

export function createParticles(seed = 0x504f5058) {
  const pool = createParticlePool(); const random = createCosmeticRng(seed);
  return {
    emit(x: number, y: number, cell: number, flavour: number, count: number, effect: PopEffectId): void {
      const flavourColours = PALETTE.flavour[FLAVOUR_KEYS[flavour - 1]!];
      for (let i = 0; i < count; i += 1) {
        const angle = random() * Math.PI * 2; const speed = (120 + random() * 200) * (effect === 'fireworks' ? 1.5 : 1);
        const kind = effect;
        const colour = effect === 'hearts' && random() < 0.5 ? PALETTE.fx.heart : effect === 'stars' ? PALETTE.fx.star : effect === 'bubbles' ? PALETTE.fx.bubble : effect === 'confetti' ? [PALETTE.fx.confettiA, PALETTE.fx.confettiB, PALETTE.fx.confettiC, PALETTE.fx.confettiD, PALETTE.fx.confettiE][Math.floor(random() * 5)]! : random() < 0.6 ? flavourColours.glow : PALETTE.fx.sugar;
        const p: Particle = { x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - (random() < 0.3 ? speed * 0.3 : 0), ax: 0, ay: effect === 'hearts' ? -120 : effect === 'stars' ? 600 : effect === 'bubbles' ? -200 : effect === 'confetti' ? 500 : 900, rot: random() * Math.PI * 2, vrot: (random() - 0.5) * 8, size: cell * (effect === 'confetti' ? 0.08 : 0.08 + random() * 0.06), size1: 0, life: 0.45 + random() * 0.25, age: 0, colour, kind, bounce: 0, burst: false };
        pool.add(p);
      }
    },
    jellyDrop(x: number, y: number, cell: number, flavour: number): void {
      const colour = PALETTE.flavour[FLAVOUR_KEYS[flavour - 1]!].base;
      pool.add({ x, y, vx: (random() - 0.5) * 80, vy: -80 - random() * 80, ax: 0, ay: 1400, rot: 0, vrot: (random() - 0.5) * 3, size: cell * 0.12, size1: 0, life: 0.8, age: 0, colour, kind: 'jelly', bounce: 0, burst: false });
    },
    dust(x: number, y: number, count: number): void { for (let i = 0; i < count; i += 1) { const angle = random() < 0.5 ? Math.PI + (random() - 0.5) * Math.PI / 3 : (random() - 0.5) * Math.PI / 3; const speed = 40 + random() * 50; pool.add({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, ax: 0, ay: 0, rot: random() * Math.PI * 2, vrot: (random() - 0.5) * 8, size: 1.5 + random() * 1.5, size1: 0, life: 0.28, age: 0, colour: PALETTE.fx.sugar, kind: 'sparkles', bounce: 0, burst: false }); } },
    update(dt: number): void {
      for (const p of pool.items) {
        const threshold = p.kind === 'fireworks' ? 0.7 : p.kind === 'bubbles' ? 1 : 2;
        if (!p.burst && p.age < p.life * threshold && p.age + dt >= p.life * threshold) {
          p.burst = true; const dots = p.kind === 'fireworks' ? 2 : 3;
          for (let i = 0; i < dots; i += 1) pool.add({ x: p.x, y: p.y, vx: (random() - 0.5) * 180, vy: (random() - 0.5) * 180, ax: 0, ay: 300, rot: random() * Math.PI, vrot: 4, size: p.size * 0.55, size1: 0, life: 0.3, age: 0, colour: p.kind === 'fireworks' ? PALETTE.fx.sugar : p.colour, kind: 'sparkles', bounce: 0, burst: true });
        }
      }
      pool.update(dt);
      for (const p of pool.items) if (p.kind === 'jelly' && p.y >= 8 * 68) { if (p.bounce === 0) { p.y = 8 * 68; p.vy *= -0.4; p.age = Math.max(p.age, p.life - 0.2); p.bounce = 1; } else p.age = p.life; }
    },
    draw(ctx: CanvasRenderingContext2D): void { for (const p of pool.items) drawParticle(ctx, p); },
    get count(): number { return pool.items.length; },
    clear(): void { pool.clear(); },
  };
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
  const t = p.age / p.life; ctx.save(); ctx.globalAlpha = 1 - t; ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.colour; ctx.strokeStyle = p.colour;
  if (p.kind === 'hearts') { ctx.translate(Math.sin(p.age * 8) * p.size * 0.4, 0); ctx.scale(p.size, p.size); ctx.beginPath(); ctx.moveTo(0, 0.36); ctx.bezierCurveTo(-0.7, -0.1, -0.35, -0.65, 0, -0.3); ctx.bezierCurveTo(0.35, -0.65, 0.7, -0.1, 0, 0.36); ctx.fill(); }
  else if (p.kind === 'jelly') { ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size * 0.72, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = PALETTE.light.specularSoft; ctx.beginPath(); ctx.ellipse(-p.size * 0.25, -p.size * 0.24, p.size * 0.28, p.size * 0.12, -0.4, 0, Math.PI * 2); ctx.fill(); }
  else if (p.kind === 'stars') { ctx.scale(p.size, p.size); ctx.beginPath(); for (let i = 0; i < 10; i += 1) { const a = -Math.PI / 2 + i * Math.PI / 5; const r = i % 2 ? 0.42 : 1; if (!i) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); }
  else if (p.kind === 'bubbles') { ctx.lineWidth = Math.max(1, p.size * 0.15); ctx.beginPath(); ctx.arc(0, 0, p.size * (1 - t * 0.3), 0, Math.PI * 2); ctx.stroke(); }
  else if (p.kind === 'confetti') { ctx.scale(Math.cos(p.age * 14), 1); ctx.fillRect(-p.size * 0.5, -p.size, p.size, p.size * 2); }
  else if (p.kind === 'fireworks') { ctx.lineWidth = Math.max(1, p.size * 0.3); ctx.beginPath(); ctx.moveTo(-p.vx * 0.0015, -p.vy * 0.0015); ctx.lineTo(p.vx * 0.0015, p.vy * 0.0015); ctx.stroke(); }
  else { ctx.scale(p.size, p.size); ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(0.22, -0.22); ctx.lineTo(1, 0); ctx.lineTo(0.22, 0.22); ctx.lineTo(0, 1); ctx.lineTo(-0.22, 0.22); ctx.lineTo(-1, 0); ctx.lineTo(-0.22, -0.22); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
