import { describe, expect, it } from 'vitest';
import { CREDITS } from './credits';
import { AUDIO_MANIFEST } from './manifest';

describe('generated audio manifest', () => {
  it('keeps the 28 ordered sprite segments inside both encoded sprites', () => {
    const segments = Object.values(AUDIO_MANIFEST.segments).sort((a, b) => a.start - b.start);
    expect(segments).toHaveLength(28);
    let end = AUDIO_MANIFEST.markerAt + 0.1;
    for (const segment of segments) {
      expect(segment.start).toBeGreaterThanOrEqual(end - 1e-9);
      expect(segment.start + segment.dur).toBeLessThanOrEqual(AUDIO_MANIFEST.durations.sfx.ogg - 0.05);
      expect(segment.start + segment.dur).toBeLessThanOrEqual(AUDIO_MANIFEST.durations.sfx.mp3 - 0.05);
      end = segment.start + segment.dur + 0.05;
      for (const source of segment.sources) expect(CREDITS.some((credit) => credit.id === source)).toBe(true);
    }
    expect(AUDIO_MANIFEST.markerAt).toBe(0.1);
  });

  it('keeps the loop length at 256 beats and cites known credits', () => {
    expect(AUDIO_MANIFEST.music.loopEnd - AUDIO_MANIFEST.music.loopStart).toBeCloseTo(256 * 60 / 120.04, 3);
    expect(AUDIO_MANIFEST.music.loopEnd).toBeLessThanOrEqual(AUDIO_MANIFEST.durations.music.ogg);
    expect(AUDIO_MANIFEST.music.loopEnd).toBeLessThanOrEqual(AUDIO_MANIFEST.durations.music.mp3);
    expect(AUDIO_MANIFEST.music.sources.every((source) => CREDITS.some((credit) => credit.id === source))).toBe(true);
    expect(Object.keys(AUDIO_MANIFEST.sourceSha256).length).toBeGreaterThan(20);
    const used = new Set([...Object.values(AUDIO_MANIFEST.segments).flatMap((segment) => segment.sources), ...AUDIO_MANIFEST.music.sources]);
    for (const credit of CREDITS) {
      if (credit.id !== 'original') expect(used.has(credit.id)).toBe(true);
    }
  });
});
