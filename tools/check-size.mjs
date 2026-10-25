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

const audioDirectory = resolve('public/audio');
if (statSync(audioDirectory, { throwIfNoEntry: false })?.isDirectory()) {
  const audioFiles = readdirSync(audioDirectory).filter((name) => /^(sfx|music)\.[a-f0-9]{8}\.(ogg|mp3)$/.test(name));
  const budgets = { 'sfx.ogg': 96 * 1024, 'sfx.mp3': 144 * 1024, 'music.ogg': 760 * 1024, 'music.mp3': 820 * 1024 };
  const byKind = new Map(audioFiles.map((name) => [name.split('.')[0] + '.' + name.split('.').at(-1), readFileSync(join(audioDirectory, name)).byteLength]));
  for (const [kind, budget] of Object.entries(budgets)) {
    const size = byKind.get(kind);
    if (size === undefined) {
      console.error(`Missing audio format: ${kind}`);
      process.exitCode = 1;
    } else if (size > budget) {
      console.error(`${kind} audio exceeds ${(budget / 1024).toFixed(0)} KB budget.`);
      process.exitCode = 1;
    }
  }
  const oggTotal = (byKind.get('sfx.ogg') ?? 0) + (byKind.get('music.ogg') ?? 0);
  const mp3Total = (byKind.get('sfx.mp3') ?? 0) + (byKind.get('music.mp3') ?? 0);
  console.log(`Audio per device: Opus ${(oggTotal / 1024).toFixed(1)} KB; MP3 ${(mp3Total / 1024).toFixed(1)} KB`);
  if (oggTotal > 856 * 1024 || mp3Total > 964 * 1024 || oggTotal > 1.5 * 1024 * 1024 || mp3Total > 1.5 * 1024 * 1024) {
    console.error('Per-device audio exceeds its format or 1.5 MB budget.');
    process.exitCode = 1;
  }
}
