import { describe, expect, it } from 'vitest';
import { fingerBoardOrigin } from './pointer';

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
});
