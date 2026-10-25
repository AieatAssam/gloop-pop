import { describe, expect, it } from 'vitest';
import { fits, makeBoard } from './board';
import { dealTray } from './generator';
import { createRng, seededRng } from './rng';
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
  it('F1 holds for every stage and mode, from empty to nearly full boards', () => {
    const modes = [['classic', 1], ['classic', 2], ['classic', 3], ['classic', 4], ['classic', 5], ['classic', 6], ['expert', 5], ['expert', 6], ['zen', 2]] as const;
    for (const [mode, stage] of modes) for (let sample = 0; sample < 120; sample += 1) {
      const fill = createRng(`f1-${mode}-${stage}-${sample}`); const density = (sample % 12) / 12;
      const board = makeBoard(); for (let index = 0; index < 64; index += 1) if (nextUnit(fill) < density) board[index] = 1 + (index % 7);
      if (board.every((cell) => cell !== 0)) board[sample % 64] = 0;
      const { tray } = dealTray(board, seededRng(`deal-${mode}-${sample}`), stage, { mode });
      expect(tray).toHaveLength(3);
      expect(tray.some((piece) => fitsSomewhere(board, piece.defId))).toBe(true);
      expect(tray.filter((piece) => PIECES[piece.defId]?.family === 'O3').length).toBeLessThanOrEqual(1);
      if (mode === 'zen') expect(canPlaceAll(board, tray)).not.toBe('no');
    }
  });
  it('rescue trays (F4) are always fully placeable', () => {
    for (let sample = 0; sample < 150; sample += 1) {
      const fill = createRng(`f4-${sample}`); const board = makeBoard();
      for (let index = 0; index < 64; index += 1) if (nextUnit(fill) < 0.6) board[index] = 1 + (index % 5);
      const { tray } = dealTray(board, seededRng(`f4-deal-${sample}`), 6, { mode: 'classic', forceSolvable: true });
      expect(canPlaceAll(board, tray)).not.toBe('no');
    }
  });
  it('falls back to the largest piece that makes the tray pass when random trays keep failing', () => {
    // Only the bottom-right cell is empty: just a Dot fits, so all 30 random attempts fail F1.
    const board = makeBoard(); board.fill(1); board[63] = 0; board[62] = 2; board[55] = 2;
    const results = Array.from({ length: 40 }, (_, sample) => dealTray(board, seededRng(`fallback-${sample}`), 6)).filter((result) => result.debug.fallbackUsed);
    expect(results.length).toBeGreaterThan(5);
    // Slot 2 becomes the largest piece that fits (a Dot here); slots 0 and 1 keep their random pieces.
    for (const result of results) { expect(result.tray[2]?.defId).toBe(0); expect(result.tray.filter((piece) => piece.defId === 0)).toHaveLength(1); }
  });
  it('pins deal snapshots per stage and mode on a light and a crowded board (design §7.2–§7.4)', () => {
    const light = makeBoard(); for (const index of [0, 1, 2, 8, 9, 17, 27, 28, 35, 36, 44, 52, 53, 54, 60, 61]) light[index] = 1 + (index % 7);
    const crowded = makeBoard(); for (let index = 0; index < 64; index += 1) if (index % 3 !== 0 && index !== 20 && index !== 21) crowded[index] = 1 + (index % 7);
    const cases = [['classic', 1], ['classic', 2], ['classic', 3], ['classic', 4], ['classic', 5], ['classic', 6], ['expert', 5], ['expert', 6], ['zen', 2]] as const;
    const snapshot = [['light', light], ['crowded', crowded]] as const;
    expect(snapshot.flatMap(([name, board]) => cases.map(([mode, stage]) => {
      const rng = seededRng(`snapshot-${mode}-${stage}`); const { tray, debug } = dealTray(board, rng, stage, { mode });
      return `${name} ${mode} S${stage}: ${tray.map((piece) => `${piece.defId}/${piece.flavour}`).join(' ')} a${debug.attempts}${debug.fallbackUsed ? ' fb' : ''} rng ${rng.a}`;
    }))).toEqual([
      "light classic S1: 1/2 9/2 27/2 a1 rng 3973472396",
      "light classic S2: 15/2 5/2 2/5 a1 rng 1397747568",
      "light classic S3: 5/5 1/3 3/6 a1 rng 759583430",
      "light classic S4: 11/1 5/4 11/1 a1 rng 2442594689",
      "light classic S5: 24/5 15/7 33/7 a1 rng 3741768430",
      "light classic S6: 32/3 10/2 9/6 a1 rng 1601953883",
      "light expert S5: 19/2 30/3 35/7 a1 rng 1407647052",
      "light expert S6: 14/3 34/6 10/5 a1 rng 2999571023",
      "light zen S2: 3/4 4/5 14/4 a1 rng 1014027046",
      "crowded classic S1: 3/4 0/2 1/5 a19 rng 222644054",
      "crowded classic S2: 9/5 13/1 0/5 a15 rng 2092907937",
      "crowded classic S3: 16/2 12/4 1/5 a8 rng 1669597180",
      "crowded classic S4: 28/4 10/6 13/5 a6 rng 1754021835",
      "crowded classic S5: 29/1 2/4 11/6 a4 rng 2321003277",
      "crowded classic S6: 31/4 30/6 13/6 a3 rng 1810642731",
      "crowded expert S5: 7/5 0/3 0/7 a30 fb rng 1324334508",
      "crowded expert S6: 8/3 13/1 0/3 a30 fb rng 777785365",
      "crowded zen S2: 20/1 13/4 0/5 a25 rng 3802928060",
    ]);
  });
});

function nextUnit(rng: ReturnType<typeof createRng>): number { rng.a = (rng.a + 0x9e3779b9) >>> 0; let t = rng.a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
function fitsSomewhere(board: ArrayLike<number>, defId: number): boolean {
  const def = PIECES[defId]; if (!def) return false;
  for (let row = 0; row <= 8 - def.h; row += 1) for (let col = 0; col <= 8 - def.w; col += 1) if (fits(board, def, row, col)) return true;
  return false;
}
