import { describe, expect, it } from 'vitest';
import { precacheFilter, renderServiceWorker } from './vite.config';
import { readFileSync } from 'node:fs';

describe('audio precache filtering', () => {
  it('excludes audio paths and retains ordinary app assets', () => {
    expect(precacheFilter('audio/sfx.hash.ogg')).toBe(false);
    expect(precacheFilter('./audio/music.hash.mp3')).toBe(false);
    expect(precacheFilter('assets/app.js')).toBe(true);
  });

  it('injects complete values without leaving build placeholders in worker code', () => {
    const template = readFileSync(new URL('./src/sw/sw.template.js', import.meta.url), 'utf8');
    const output = renderServiceWorker(template, 'abc123', ['/gloop-pop/index.html'], ['/gloop-pop/audio/sfx.12345678.ogg']);
    expect(output).toContain('const AUDIO_FILES = ["/gloop-pop/audio/sfx.12345678.ogg"];');
    expect(output).not.toMatch(/__(?:AUDIO_FILES|PRECACHE|VERSION)__/);
  });
});
