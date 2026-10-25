import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { CREDITS } from './credits';
import { AUDIO_MANIFEST } from './manifest';

interface SourceManifest { sourceSha256: Record<string, string>; ffmpegVersion: string; segments: Record<string, string[]>; music: string[] }
const sourceManifest = JSON.parse(readFileSync(new URL('../../assets-src/audio/manifest.sources.json', import.meta.url), 'utf8')) as SourceManifest;

describe('generated audio manifest', () => {
  it('keeps the 28 ordered sprite segments inside both encoded sprites', () => {
    const entries = Object.entries(AUDIO_MANIFEST.segments).sort(([, a], [, b]) => a.start - b.start);
    const segments = entries.map(([, segment]) => segment);
    expect(segments).toHaveLength(28);
    let end = AUDIO_MANIFEST.markerAt + 0.1;
    for (const segment of segments) {
      expect(segment.start).toBeGreaterThanOrEqual(end - 1e-9);
      expect(segment.start + segment.dur).toBeLessThanOrEqual(AUDIO_MANIFEST.durations.sfx.ogg - 0.05);
      expect(segment.start + segment.dur).toBeLessThanOrEqual(AUDIO_MANIFEST.durations.sfx.mp3 - 0.05);
      end = segment.start + segment.dur + 0.05;
      const id = entries.find(([, value]) => value === segment)?.[0] ?? '';
      expect(sourceManifest.segments[id]).toBeDefined();
      for (const source of sourceManifest.segments[id] ?? []) expect(CREDITS.some((credit) => credit.id === source)).toBe(true);
    }
    expect(AUDIO_MANIFEST.markerAt).toBe(0.1);
  });

  it('keeps the baked loop length at 2,818,804 samples and cites known credits', () => {
    expect((AUDIO_MANIFEST.music.loopEnd - AUDIO_MANIFEST.music.loopStart) * 22050).toBeCloseTo(2_818_804, 0);
    // spec-note: the milestone's stated decimal is a 90 ns arithmetic typo; 0.25 + 2,818,804 / 22,050 rounds to 128.086916100.
    expect(AUDIO_MANIFEST.music.loopEnd).toBeCloseTo(128.086916100, 9);
    expect(AUDIO_MANIFEST.music.loopEnd).toBeLessThanOrEqual(AUDIO_MANIFEST.durations.music.ogg);
    expect(AUDIO_MANIFEST.music.loopEnd).toBeLessThanOrEqual(AUDIO_MANIFEST.durations.music.mp3);
    expect(sourceManifest.music.every((source) => CREDITS.some((credit) => credit.id === source))).toBe(true);
    expect(Object.keys(sourceManifest.sourceSha256).length).toBeGreaterThan(20);
    expect(AUDIO_MANIFEST).not.toHaveProperty('sourceSha256');
    expect(AUDIO_MANIFEST).not.toHaveProperty('ffmpegVersion');
    const used = new Set([...Object.values(sourceManifest.segments).flat(), ...sourceManifest.music]);
    for (const credit of CREDITS) {
      if (credit.id !== 'original') expect(used.has(credit.id)).toBe(true);
    }
  });

  it('pins every source file hash in the offline source manifest', () => {
    for (const [path, expected] of Object.entries(sourceManifest.sourceSha256)) {
      const bytes = readFileSync(new URL(`../../assets-src/audio/${path}`, import.meta.url));
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(expected);
    }
  });
});
