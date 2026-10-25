import { describe, expect, it } from 'vitest';
import { placementTravelProgress } from './boardView';

describe('SG §9.13.e reduced placement', () => {
  it('places directly at the target when motion is reduced', () => {
    expect(placementTravelProgress(0, true)).toBe(1);
    expect(placementTravelProgress(20, false)).toBeCloseTo(1 / 3);
  });
});
