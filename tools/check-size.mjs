import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const dist = resolve('dist');
if (!statSync(dist, { throwIfNoEntry: false })?.isDirectory()) {
  console.error('dist/ is missing; run the build first.');
  process.exit(1);
}

function jsFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return jsFiles(path);
    return extname(path) === '.js' ? [path] : [];
  });
}

const files = jsFiles(dist);
const total = files.reduce((sum, path) => sum + gzipSync(readFileSync(path)).byteLength, 0);
console.log(`Gzipped JavaScript total: ${(total / 1024).toFixed(2)} KB (${files.length} files)`);
if (total >= 150 * 1024) {
  console.error('Bundle exceeds the 150 KB gzipped limit.');
  process.exitCode = 1;
}
