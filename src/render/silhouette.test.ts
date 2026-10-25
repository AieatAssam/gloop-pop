import { describe, expect, it } from 'vitest';
import { silhouetteContours } from './silhouette';

describe('silhouettePath', () => {
  it('traces a closed outer contour and preserves a hole', () => {
    expect(silhouetteContours([0], 40)).toHaveLength(1);
    const ring = silhouetteContours([0, 1, 2, 8, 10, 16, 17, 18], 40);
    expect(ring).toHaveLength(2);
    expect(ring.every((contour) => contour[0]?.[0] === contour[contour.length - 1]?.[0] && contour[0]?.[1] === contour[contour.length - 1]?.[1])).toBe(true);
  });
});
