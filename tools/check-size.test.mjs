import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { checkSize } from './check-size.mjs';

const temporary = [];
afterEach(() => { for (const directory of temporary.splice(0)) rmSync(directory, { recursive: true, force: true }); });

describe('audio size budget checker', () => {
  it('fails when an audio file exceeds its per-file budget', () => {
    const root = mkdtempSync(join(tmpdir(), 'gloop-audio-size-')); temporary.push(root);
    const dist = join(root, 'dist'); const audio = join(root, 'audio');
    mkdirSync(dist); mkdirSync(audio);
    writeFileSync(join(dist, 'main.js'), 'ok');
    writeFileSync(join(audio, 'sfx.12345678.ogg'), new Uint8Array(96 * 1024 + 1));
    for (const name of ['sfx.12345678.mp3', 'music.12345678.ogg', 'music.12345678.mp3']) writeFileSync(join(audio, name), new Uint8Array(1));
    const output = { log() {}, error() {} };
    expect(checkSize(dist, audio, output)).toBe(1);
  });
});
