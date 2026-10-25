// SG §9.2.2 and §9.4.3: small non-blocking squash and pop cues.
import type { GameEvent } from '../core/types';
import type { Layout } from './layout';
import { PALETTE } from './palette';
import { createParticles } from './fx/particles';
import { getEquippedPopEffect } from './themes';

interface Cue { cell: number; at: number; flavour: number; kind: 'place' | 'pop' }
export function createDirector(): { receive(events: readonly GameEvent[], time: number): void; draw(ctx: CanvasRenderingContext2D, layout: Layout, time: number): void } {
  const cues: Cue[] = [];
  const particles = createParticles(); let lastDraw = 0;
  return {
    receive(events, time) { for (const event of events) {
      if (event.type === 'placed') for (const cell of event.cells) cues.push({ cell, at: time, flavour: event.piece.flavour, kind: 'place' });
      if (event.type === 'cleared') for (let i = 0; i < event.cells.length; i += 1) { const cell = event.cells[i]!; const flavour = event.flavoursByCell[i] ?? 1; cues.push({ cell, at: time, flavour, kind: 'pop' }); const c = 68; particles.emit((cell % 8 + 0.5) * c, (Math.floor(cell / 8) + 0.5) * c, c, flavour, 5, getEquippedPopEffect()); }
      if (event.type === 'popped') for (const group of event.gloops) for (const cell of group.cells) { cues.push({ cell, at: time + (group.bfs.indexOf(cell) * 38), flavour: group.flavour, kind: 'pop' }); const c = 68; const x = (cell % 8 + 0.5) * c; const y = (Math.floor(cell / 8) + 0.5) * c; particles.emit(x, y, c, group.flavour, 3, getEquippedPopEffect()); particles.jellyDrop(x, y, c, group.flavour); }
    } },
    draw(ctx, layout, time) {
      const dt = Math.min(0.05, Math.max(0, (time - lastDraw) / 1000)); lastDraw = time; particles.update(dt);
      ctx.save(); ctx.translate(layout.board.x + (layout.board.width - layout.cellSize * 8) / 2, layout.board.y + (layout.board.height - layout.cellSize * 8) / 2); ctx.scale(layout.cellSize / 68, layout.cellSize / 68); particles.draw(ctx); ctx.restore();
      const c = layout.cellSize; const gx = layout.board.x + (layout.board.width - c * 8) / 2; const gy = layout.board.y + (layout.board.height - c * 8) / 2;
      for (let i = cues.length - 1; i >= 0; i -= 1) { const cue = cues[i]!; const age = time - cue.at; const duration = cue.kind === 'place' ? 280 : 180; if (age < 0) continue; if (age >= duration) { cues.splice(i, 1); continue; }
        const t = age / duration; const scale = cue.kind === 'place' ? (t < 0.25 ? 1 + 0.14 * t / 0.25 : 1.14 - 0.14 * (t - 0.25) / 0.75) : t < 1 / 3 ? 1 + 0.22 * t * 3 : 1.22 * (1 - (t - 1 / 3) * 1.5);
        const x = gx + (cue.cell % 8) * c + c / 2; const y = gy + Math.floor(cue.cell / 8) * c + c / 2;
        ctx.save(); ctx.globalAlpha = Math.max(0, 1 - t); ctx.translate(x, y); ctx.scale(scale, cue.kind === 'place' ? 1 - (scale - 1) * 1.1 : scale); ctx.fillStyle = cue.kind === 'place' ? PALETTE.flavour[Object.keys(PALETTE.flavour)[cue.flavour - 1] as keyof typeof PALETTE.flavour].light : PALETTE.light.specular; ctx.beginPath(); ctx.arc(0, 0, c * 0.22, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
    },
  };
}
