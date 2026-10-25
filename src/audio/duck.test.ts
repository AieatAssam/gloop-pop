import { describe, expect, it } from 'vitest';
import { duckSchedule } from './duck';

describe('stinger music duck', () => {
  it('attacks to minus eight dB, holds 540 ms, and releases over 900 ms', () => {
    const points = duckSchedule(10);
    expect(points[1]?.at).toBe(10.04);
    expect(points[1]?.gain).toBeCloseTo(10 ** (-8 / 20));
    expect(points[2]?.at).toBe(10.54);
    expect(points[3]?.at).toBe(11.44);
    expect(points[3]?.gain).toBe(1);
  });
  it('extends overlapping holds without deepening the duck', () => {
    const points = duckSchedule(2, 3);
    expect(points[2]?.at).toBe(3);
    expect(points[1]?.gain).toBe(points[2]?.gain);
  });
  it('keeps an overlapping release ducked while restarting the hold', () => {
    const points = duckSchedule(3.5, 3);
    expect(points[0]?.gain).toBeCloseTo(10 ** (-8 / 20));
    expect(points[2]?.at).toBe(4.04);
  });
});
