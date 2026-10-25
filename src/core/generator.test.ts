import { describe, expect, it } from 'vitest';
import { fits, makeBoard } from './board';
import { dealTray } from './generator';
import { createRng } from './rng';
import { canPlaceAll } from './solver';
import { PIECES } from './pieces';

describe('fair tray generator', () => {
  it('always returns at least one fitting piece and respects F3 on random half-full boards', () => {
    for (let sample = 0; sample < 500; sample += 1) {
      const board = makeBoard(); const rng = createRng(`board-${sample}`);
      for (let index = 0; index < 64; index += 1) if ((rng.a >>> (index % 31)) & 1) board[index] = 1;
      const result = dealTray(board, createRng(`deal-${sample}`), 1);
      expect(result.tray.some((piece) => {
        const def = PIECES[piece.defId]; if (!def) return false;
        for (let row = 0; row <= 8 - def.h; row += 1) for (let col = 0; col <= 8 - def.w; col += 1) if (fits(board, def, row, col)) return true;
        return false;
      })).toBe(true);
      expect(result.tray.filter((piece) => PIECES[piece.defId]?.family === 'O3').length).toBeLessThanOrEqual(1);
      expect(result.tray.filter((piece) => (PIECES[piece.defId]?.cells.length ?? 0) >= 5).length).toBeLessThanOrEqual(1);
      expect(canPlaceAll(board, result.tray)).not.toBe('no');
    }
  });
  it('is deterministic and stage 1 trays are fully solvable', () => {
    const board = makeBoard(); const left = dealTray(board, createRng('same'), 1); const right = dealTray(board, createRng('same'), 1);
    expect(left).toEqual(right);
    expect(left).toEqual({ tray: [{ defId: 3, flavour: 3 }, { defId: 2, flavour: 3 }, { defId: 9, flavour: 3 }], debug: { attempts: 1, fallbackUsed: false, budgetHit: false } });
    expect(canPlaceAll(board, left.tray)).toBe('yes');
  });
  it('deals 200 half-filled boards in under two seconds', () => {
    const start = globalThis.performance.now();
    for (let sample = 0; sample < 200; sample += 1) {
      const board = makeBoard(); for (let index = 0; index < 64; index += 1) if ((index * 17 + sample * 29) % 4 < 2) board[index] = 1;
      dealTray(board, createRng(`bench-${sample}`), 3);
    }
    expect(globalThis.performance.now() - start).toBeLessThan(2000);
  });
});
