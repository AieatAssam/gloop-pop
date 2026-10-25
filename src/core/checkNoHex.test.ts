import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { findHexViolations } from '../../tools/check-no-hex.mjs';

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe('hex literal check', () => {
  it('finds a colour in a temporary fixture', () => {
    const directory = mkdtempSync(join(tmpdir(), 'gloop-hex-'));
    temporaryDirectories.push(directory);
    const file = join(directory, 'fixture.ts');
    const sample = `${String.fromCharCode(35)}ff0000`;
    writeFileSync(file, `const forbidden = '${sample}';`);
    expect(findHexViolations([file])).toHaveLength(1);
  });

  it('allows files without colour literals', () => {
    const directory = mkdtempSync(join(tmpdir(), 'gloop-hex-'));
    temporaryDirectories.push(directory);
    const file = join(directory, 'fixture.ts');
    writeFileSync(file, 'const safe = true;');
    expect(findHexViolations([file])).toEqual([]);
  });
});
