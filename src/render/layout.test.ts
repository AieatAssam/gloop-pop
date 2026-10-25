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
});
