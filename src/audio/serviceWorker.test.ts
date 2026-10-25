import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AUDIO_MANIFEST } from './manifest';
import { precacheFilter, renderServiceWorker } from '../../vite.config';

describe('service worker audio cache wiring', () => {
  it('excludes audio from the generated precache and retains only current audio paths', () => {
    const paths = Object.values(AUDIO_MANIFEST.files).flatMap((formats) => Object.values(formats));
    const template = readFileSync(new URL('../sw/sw.template.js', import.meta.url), 'utf8');
    const generated = renderServiceWorker(template, 'test-version', ['/gloop-pop/index.html', ...paths].filter(precacheFilter), paths);
    const precache = generated.match(/const PRECACHE = (.*);/)?.[1] ?? '';
    const audioFiles = generated.match(/const AUDIO_FILES = (.*);/)?.[1] ?? '';
    expect(precache).not.toContain('/audio/');
    expect(JSON.parse(audioFiles)).toEqual(paths);
    expect(generated).toContain("name !== AUDIO_CACHE");
    expect(generated).toContain("const AUDIO_CACHE = 'gloop-pop-audio'");
  });
});
