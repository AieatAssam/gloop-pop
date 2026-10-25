import { describe, expect, it } from 'vitest';
import { foldRate, freq, rate, rungFor, rungMidi, rungRate, voicedLineCount } from './ladder';

describe('pitch ladder', () => {
  it('uses the eleven C major pentatonic rungs', () => {
    expect(rungMidi).toEqual([72, 74, 76, 79, 81, 84, 86, 88, 91, 93, 96]);
    const expectedHz = [523.25, 587.33, 659.26, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760, 2093];
    rungMidi.forEach((midi, index) => expect(freq(midi)).toBeCloseTo(expectedHz[index] ?? 0, 2));
  });
  it('climbs by combo and line and caps at C7', () => {
    expect([0, 1, 2, 3, 4].map((line) => rungFor(1, line))).toEqual([0, 1, 2, 3, 4]);
    expect(rungFor(0)).toBe(0);
    for (let combo = 0; combo <= 14; combo += 1) for (let line = 0; line <= 6; line += 1) expect(rungFor(combo, line)).toBe(Math.min(Math.max(0, Math.min(10, combo - 1)) + line, 10));
    expect(rungFor(11, 4)).toBe(10);
  });
  it('computes semitone rates and folds the tink within six semitones', () => {
    expect(rate(72, 69)).toBeCloseTo(2 ** 0.25);
    expect(Math.abs(12 * Math.log2(foldRate(120, 95)))).toBeLessThanOrEqual(6);
    const rates = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rungRate);
    const expected = [1.0595, 1.1892, 1.3348, 0.7937, 0.8909, 1.0595, 1.1892, 1.3348, 0.7937, 0.8909, 1.0595];
    rates.forEach((value, index) => expect(value).toBeCloseTo(expected[index] ?? 0, 4));
    expect([0, 1, 5, 11].map(voicedLineCount)).toEqual([0, 1, 5, 5]);
  });
});
