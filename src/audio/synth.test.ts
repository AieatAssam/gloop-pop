import { describe, expect, it } from 'vitest';
import { safeTime } from './synth';
import { freq, rungMidi } from './ladder';

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

describe('SG §13.12 synth band rule', () => {
  it('keeps every synth recipe at least half in 400 Hz–4 kHz in a 48 kHz offline render', () => {
    type Partial = { frequency: number; amplitude: number };
    const pentatonic = rungMidi.map((midi) => freq(midi));
    const recipes: Record<string, Partial[]> = {
      pickUp: [{ frequency: 659, amplitude: 1 }, { frequency: 880, amplitude: 1 }],
      snapTick: [{ frequency: 1568, amplitude: 1 }],
      placeFallback: [{ frequency: 470, amplitude: 1 }, { frequency: 900, amplitude: 0.6 }],
      returnToTray: [440, 400, 370, 294, 880, 800, 740, 588].map((frequency) => ({ frequency, amplitude: frequency > 500 ? 0.4 : 1 })),
      dealFallback: [{ frequency: 1320, amplitude: 1 }],
      ladderBodyAndHarmonics: pentatonic.flatMap((frequency) => [{ frequency, amplitude: 1 }, { frequency: frequency * 4, amplitude: 0.25 }]),
      gloopPopFallback: [{ frequency: 494, amplitude: 1 }, { frequency: 608, amplitude: 1 }],
      comboLost: [{ frequency: 440, amplitude: 1 }, { frequency: 330, amplitude: 1 }],
      stuck: [392, 330, 262, 784, 660, 524].map((frequency) => ({ frequency, amplitude: 1 })),
      toggle: [{ frequency: 880, amplitude: 1 }, { frequency: 1319, amplitude: 1 }],
      coinPing: [{ frequency: 1568, amplitude: 1 }, { frequency: 2093, amplitude: 1 }],
      fallbackAllClear: [523, 659, 784, 1047, 1319, 1568].map((frequency) => ({ frequency, amplitude: 1 })),
    };
    for (const [name, partials] of Object.entries(recipes)) {
      const rendered = new Float32Array(48_000);
      for (let sample = 0; sample < rendered.length; sample += 1) {
        const time = sample / 48_000;
        rendered[sample] = partials.reduce((sum, partial) => sum + partial.amplitude * Math.sin(2 * Math.PI * partial.frequency * time), 0);
      }
      const energy = partials.reduce((sum, partial) => sum + partial.amplitude ** 2, 0);
      const inBand = partials.filter((partial) => partial.frequency >= 400 && partial.frequency <= 4000).reduce((sum, partial) => sum + partial.amplitude ** 2, 0);
      expect(rendered.some((sample) => sample !== 0), name).toBe(true);
      expect(inBand / energy, name).toBeGreaterThanOrEqual(0.5);
    }
  });
});
