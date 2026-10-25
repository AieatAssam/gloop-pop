import { describe, expect, it } from 'vitest';
import { placementCellsForFrame, placementLayerLifetimeMs, visiblePlacementCells } from './placementLayer';

describe('SG §9.13.e placement layer', () => {
  it('never draws cells removed by the same move', () => {
    const visible = visiblePlacementCells([1, 2, 9, 10], [2, 10, 18]);
    expect(visible).toEqual([1, 9]);
    expect(visible.filter((cell) => [2, 10, 18].includes(cell))).toEqual([]);
  });
  it('expires no later than L + 324 ms', () => { expect(placementLayerLifetimeMs()).toBe(324); });
  it('uses the merged body cell set after landing and removes same-move clears', () => {
    expect(placementCellsForFrame([17, 18], [9, 17, 18, 25], [17, 25], true)).toEqual([9, 18]);
    expect(placementCellsForFrame([17, 18], [9, 17, 18, 25], [17, 25], false)).toEqual([18]);
  });
});
