import { describe, expect, it } from 'vitest';
import { silhouetteContours } from './silhouette';

describe('silhouettePath', () => {
  it('traces a closed outer contour and preserves a hole', () => {
    expect(silhouetteContours([0], 40)).toHaveLength(1);
    const ring = silhouetteContours([0, 1, 2, 8, 10, 16, 17, 18], 40);
    expect(ring).toHaveLength(2);
    expect(ring.every((contour) => contour[0]?.[0] === contour[contour.length - 1]?.[0] && contour[0]?.[1] === contour[contour.length - 1]?.[1])).toBe(true);
  });
  it('closes every contour with a fractional cell size (game-over highlight at 14.4 px)', () => {
    const cells = [0, 1, 9, 10, 11, 12, 13, 21, 22];
    const contours = silhouetteContours(cells, 72 / 5);
    expect(contours).toHaveLength(1);
    const contour = contours[0]!;
    expect(contour[0]).toEqual(contour[contour.length - 1]);
    for (let i = 1; i < contour.length; i += 1) expect(contour[i]![0] === contour[i - 1]![0] || contour[i]![1] === contour[i - 1]![1]).toBe(true);
  });
  it('does not join column 7 to column 0 of the next row', () => {
    expect(silhouetteContours([7, 8], 10)).toHaveLength(2);
  });
  it('merges collinear edges into one segment per side', () => {
    expect(silhouetteContours([0, 1, 2, 3], 10)[0]).toHaveLength(5);
  });
});
