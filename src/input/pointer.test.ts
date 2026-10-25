import { describe, expect, it } from 'vitest';
import { computeLayout } from '../render/layout';
import { fingerBoardOrigin, pointerDropPoint, pointerReleaseCell } from './pointer';

describe('SG §9.13.c snap coordinates', () => {
  it('derives the target origin only from the finger and fixed touch offset', () => {
    const first = fingerBoardOrigin(210, 420, 'touch', 3, 2, 44);
    const second = fingerBoardOrigin(210, 420, 'touch', 3, 2, 44);
    expect(first).toEqual(second);
    expect(first).toEqual({ x: 144, y: 283.6 });
  });

  it('centres mouse pieces and preserves the single-object touch drag origin', () => {
    expect(fingerBoardOrigin(100, 100, 'mouse', 2, 3, 40)).toEqual({ x: 60, y: 40 });
    const drag = { x: 1, y: 2 }; const same = drag; same.x = 3; expect(drag.x).toBe(3);
  });

  it('keeps snapped board cells tied to the finger for lagged and transformed visuals', () => {
    const positions = [[210, 420], [248, 374], [102, 510]] as const;
    for (const [x, y] of positions) {
      const origin = fingerBoardOrigin(x, y, 'touch', 2, 2, 44);
      const target = { row: Math.round((origin.y - 20) / 44), col: Math.round((origin.x - 18) / 44) };
      for (let variant = 0; variant < 3; variant += 1) {
        const sameFinger = fingerBoardOrigin(x, y, 'touch', 2, 2, 44);
        expect({ row: Math.round((sameFinger.y - 20) / 44), col: Math.round((sameFinger.x - 18) / 44) }).toEqual(target);
      }
    }
  });

  it('maps debug drop points back to the requested anchor through pointer release math', () => {
    const layout = computeLayout(390, 844, {}, true); const rect = { left: 17, top: 23, width: 390, height: 844 };
    for (const [row, col] of [[0, 0], [2, 5], [6, 3]] as const) {
      const point = pointerDropPoint(row, col, 3, 2, layout, rect);
      const localX = (point.x - rect.left) * layout.width / rect.width; const localY = (point.y - rect.top) * layout.height / rect.height;
      const target = pointerReleaseCell(localX, localY, 'mouse', 3, 2, layout);
      expect({ row: target.row, col: target.col }).toEqual({ row, col });
    }
  });
});
