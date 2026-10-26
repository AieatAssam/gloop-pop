import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
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

  it('reports total, player, entry and debug gzip sizes and enforces the player ceiling', () => {
    const root = mkdtempSync(join(tmpdir(), 'gloop-js-size-')); temporary.push(root);
    const dist = join(root, 'dist'); const assets = join(dist, 'assets'); const audio = join(root, 'audio');
    mkdirSync(assets, { recursive: true }); mkdirSync(audio);
    writeFileSync(join(assets, 'index-entry.js'), 'player');
    writeFileSync(join(assets, 'debug-tools.js'), 'debug');
    for (const name of ['sfx.12345678.ogg', 'sfx.12345678.mp3', 'music.12345678.ogg', 'music.12345678.mp3']) writeFileSync(join(audio, name), new Uint8Array(1));
    const lines = []; const output = { log: (line) => lines.push(line), error() {} };
    expect(checkSize(dist, audio, output)).toBe(0);
    expect(lines.slice(0, 4)).toHaveLength(4);
    expect(lines[0]).toContain('soft target 125 KB');
    expect(lines[1]).toContain('Player JS:');
    expect(lines[2]).toContain('Entry chunk:');
    expect(lines[3]).toContain('Debug chunk:');
  });

  it('fails when total JavaScript exceeds the 150 KB hard limit', () => {
    const root = mkdtempSync(join(tmpdir(), 'gloop-js-limit-')); temporary.push(root);
    const dist = join(root, 'dist'); const audio = join(root, 'audio'); mkdirSync(dist); mkdirSync(audio);
    writeFileSync(join(dist, 'index-entry.js'), randomBytes(150 * 1024 + 1));
    for (const name of ['sfx.12345678.ogg', 'sfx.12345678.mp3', 'music.12345678.ogg', 'music.12345678.mp3']) writeFileSync(join(audio, name), new Uint8Array(1));
    expect(checkSize(dist, audio, { log() {}, error() {} })).toBe(1);
  });

  it('fails when the debug chunk exceeds 8 KB', () => {
    const root = mkdtempSync(join(tmpdir(), 'gloop-debug-size-')); temporary.push(root);
    const dist = join(root, 'dist'); const assets = join(dist, 'assets'); const audio = join(root, 'audio');
    mkdirSync(assets, { recursive: true }); mkdirSync(audio);
    writeFileSync(join(assets, 'index-entry.js'), 'player');
    writeFileSync(join(assets, 'debug-tools.js'), randomBytes(9 * 1024));
    for (const name of ['sfx.12345678.ogg', 'sfx.12345678.mp3', 'music.12345678.ogg', 'music.12345678.mp3']) writeFileSync(join(audio, name), new Uint8Array(1));
    expect(checkSize(dist, audio, { log() {}, error() {} })).toBe(1);
  });
});
