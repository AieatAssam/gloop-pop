import { describe, expect, it } from 'vitest';
import { easeInOutSine, easeOutBack } from './easing';

describe('easing', () => {
  it('has stable endpoints and midpoint', () => {
    expect(easeInOutSine(0)).toBe(0);
    expect(easeInOutSine(0.5)).toBeCloseTo(0.5);
    expect(easeInOutSine(1)).toBeCloseTo(1);
    expect(easeOutBack(0)).toBeCloseTo(0);
    expect(easeOutBack(1)).toBeCloseTo(1);
  });

  it('clamps input time', () => {
    expect(easeInOutSine(-1)).toBe(0);
    expect(easeInOutSine(2)).toBeCloseTo(1);
  });
});
