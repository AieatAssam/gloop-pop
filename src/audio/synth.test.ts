import { describe, expect, it } from 'vitest';
import { safeTime } from './synth';

describe('safeTime', () => {
  const context = { currentTime: 2 } as BaseAudioContext;
  it('never schedules in the past (the All Clear swell used to ask for now - 0.4 s)', () => {
    expect(safeTime(context, 1.6)).toBe(2);
    expect(safeTime(context, -0.374683)).toBe(2);
  });
  it('keeps future times and replaces non-finite ones with now', () => {
    expect(safeTime(context, 2.5)).toBe(2.5);
    expect(safeTime(context, Number.NaN)).toBe(2);
  });
});
