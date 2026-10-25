import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const HEX_LITERAL = /#[0-9a-fA-F]{3,8}\b/;

export function findHexViolations(files, read = readFileSync) {
  const violations = [];
  for (const file of files) {
    const rel = relative(root, file).replaceAll('\\', '/');
    if (rel === 'src/render/palette.ts') continue;
    const lines = read(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => {
      if (HEX_LITERAL.test(line)) violations.push(`${rel}:${index + 1}: ${line.trim()}`);
    });
  }
  return violations;
}

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return ['.ts', '.css'].includes(extname(path)) ? [path] : [];
  });
}

const files = [...sourceFiles(join(root, 'src')), join(root, 'index.html')];
const violations = findHexViolations(files);
if (violations.length > 0) {
  console.error(`Hex colour literals found outside src/render/palette.ts:\n${violations.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log('No hex colour literals found outside src/render/palette.ts.');
}
