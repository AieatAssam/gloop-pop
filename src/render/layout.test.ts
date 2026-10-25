import { describe, expect, it } from 'vitest';
import { computeLayout } from './layout';

describe('responsive layout', () => {
  it.each([[390, 844], [1280, 800], [360, 640], [768, 1024], [844, 390]])('fits %i×%i viewport', (width, height) => {
    const layout = computeLayout(width, height);
    expect(layout.width).toBe(width);
    expect(layout.height).toBe(height);
    expect(layout.board.width).toBe(layout.board.height);
    expect(layout.board.width % 8).toBe(0);
    expect(layout.cellSize).toBe((layout.board.width - (layout.portrait ? 16 : 16 * Math.min(width / 1280, height / 800))) / 8);
    expect(layout.board.x).toBeGreaterThanOrEqual(0);
    expect(layout.board.x + layout.board.width).toBeLessThanOrEqual(width);
  });

  it('uses portrait reference board metrics and splits free vertical space', () => {
    const layout = computeLayout(390, 844);
    expect(layout.portrait).toBe(true);
    expect(layout.board).toEqual({ x: 11, y: 196, width: 368, height: 368 });
    expect(layout.cellSize).toBe(44);
    expect(layout.gaps.a).toBe(26);
    expect(layout.gaps.b).toBe(26);
    expect(layout.gaps.c).toBe(52);
  });

  it('keeps portrait content in a centred column on a sideways phone', () => {
    const layout = computeLayout(844, 390);
    expect(layout.portrait).toBe(true);
    expect(layout.column.x).toBeGreaterThan(0);
    expect(layout.column.x + layout.column.width).toBeLessThan(844);
  });
  it('adds the 30 px goal band without changing layouts that do not use it', () => {
    const withStrip = computeLayout(390, 844, {}, true); const without = computeLayout(390, 844);
    expect(withStrip.goalStrip).toEqual({ x: 0, y: 162.5, width: 390, height: 30 });
    expect(withStrip.board.y).toBe(211);
    expect(without.goalStrip.height).toBe(0);
    expect(computeLayout(412, 915, {}, true).goalStrip.height).toBeCloseTo(32.5, 1);
    expect(computeLayout(1280, 800, {}, true).board).toEqual(computeLayout(1280, 800).board);
  });
  it('keeps the goal band out of the board and tray at short phone and desktop sizes', () => {
    const phone = computeLayout(360, 640, {}, true);
    expect(phone.goalStrip.y + phone.goalStrip.height).toBeLessThanOrEqual(phone.board.y);
    expect(phone.board.y + phone.board.height).toBeLessThanOrEqual(phone.combo.y);
    expect(phone.combo.y + phone.combo.height).toBeLessThanOrEqual(phone.tray.y);
    const desktop = computeLayout(1280, 800, {}, true);
    expect(desktop.goalStrip.x + desktop.goalStrip.width).toBeLessThanOrEqual(desktop.board.x);
    expect(desktop.board.x + desktop.board.width).toBeLessThanOrEqual(desktop.tray.x);
    expect(desktop.goalStrip.y).toBe(300);
  });
});
