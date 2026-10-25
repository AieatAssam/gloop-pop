import { describe, expect, it } from 'vitest';
import { chooseStackLabel, labelFit, stackTop } from './texts';
import { S } from '../../ui/strings';

describe('SG §9.13.g label stack', () => {
  it('uses one first-time label in place of the event label', () => {
    expect(chooseStackLabel('Mega Pop', 'First Mega Pop!')).toBe('First Mega Pop!');
    expect(chooseStackLabel('Double', '')).toBe('Double');
  });
  it('clamps the stack inside the board and centres it if the range is empty', () => {
    expect(stackTop(20, 100, 0, 544, 68)).toBe(136);
    expect(stackTop(530, 100, 0, 544, 68)).toBe(376);
    expect(stackTop(20, 500, 0, 544, 68)).toBe(22);
  });
  it('fits long labels including the 1.2 pop overshoot at phone and desktop cell sizes', () => {
    const labels = [...Object.values(S).filter((value): value is string => typeof value === 'string'), S.pointsPop(6242), S.coinBonus(160), S.lineCount(8)];
    for (const cell of [44, 68]) for (const label of labels) {
      const measured = label.length * 72 * 0.62 + 72 * 0.6;
      const fit = labelFit(measured, cell, cell === 68 ? 1.3 : 1, 0.92 * 8 * cell);
      expect(measured * cell / 68 * (cell === 68 ? 1.3 : 1) * fit * 1.2).toBeLessThanOrEqual(0.92 * 8 * cell + 1e-8);
    }
  });
  it('keeps the centre stack below the top-lane text for every board centroid', () => {
    const laneBottom = 0.9 * 68 + 48;
    for (const y of [0, 68, 272, 476, 544]) expect(stackTop(y, 180, 0, 544, 68)).toBeGreaterThan(laneBottom);
  });
});
