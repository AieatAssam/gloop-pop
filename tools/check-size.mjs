import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

// spec-note: The M14 lead decision keeps total gzipped JavaScript as the metric and sets its soft target to 110 KB.

export function checkSize(dist = resolve('dist'), audioDirectory = resolve('public/audio'), log = console) {
  if (!statSync(dist, { throwIfNoEntry: false })?.isDirectory()) {
    log.error('dist/ is missing; run the build first.');
    return 1;
  }

  function jsFiles(directory) {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return jsFiles(path);
      return extname(path) === '.js' ? [path] : [];
    });
  }

  const files = jsFiles(dist);
  const bytes = new Map(files.map((path) => [path, gzipSync(readFileSync(path), { level: 9 }).byteLength]));
  const total = [...bytes.values()].reduce((sum, size) => sum + size, 0);
  const debugFiles = files.filter((path) => /(?:^|[/\\])debug-[^/\\]+\.js$/.test(path));
  const debug = debugFiles.reduce((sum, path) => sum + (bytes.get(path) ?? 0), 0);
  const player = total - debug;
  const entry = files.filter((path) => /(?:^|[/\\])index-[^/\\]+\.js$/.test(path)).reduce((sum, path) => sum + (bytes.get(path) ?? 0), 0);
  log.log(`Gzipped JavaScript total: ${(total / 1024).toFixed(2)} KB (soft target 110 KB)`);
  log.log(`Player JS: ${(player / 1024).toFixed(2)} KB`);
  log.log(`Entry chunk: ${(entry / 1024).toFixed(2)} KB`);
  log.log(`Debug chunk: ${(debug / 1024).toFixed(2)} KB`);
  if (player > 112 * 1024 || total > 150 * 1024 || debug > 8 * 1024) {
    log.error('JavaScript bundle exceeds an M14 budget.');
    return 1;
  }

let failed = false;
if (statSync(audioDirectory, { throwIfNoEntry: false })?.isDirectory()) {
  const audioFiles = readdirSync(audioDirectory).filter((name) => /^(sfx|music)\.[a-f0-9]{8}\.(ogg|mp3)$/.test(name));
  const budgets = { 'sfx.ogg': 96 * 1024, 'sfx.mp3': 144 * 1024, 'music.ogg': 760 * 1024, 'music.mp3': 820 * 1024 };
  const byKind = new Map(audioFiles.map((name) => [name.split('.')[0] + '.' + name.split('.').at(-1), readFileSync(join(audioDirectory, name)).byteLength]));
  for (const [kind, budget] of Object.entries(budgets)) {
    const size = byKind.get(kind);
    if (size === undefined) {
      log.error(`Missing audio format: ${kind}`);
      failed = true;
    } else if (size > budget) {
      log.error(`${kind} audio exceeds ${(budget / 1024).toFixed(0)} KB budget.`);
      failed = true;
    }
  }
  const oggTotal = (byKind.get('sfx.ogg') ?? 0) + (byKind.get('music.ogg') ?? 0);
  const mp3Total = (byKind.get('sfx.mp3') ?? 0) + (byKind.get('music.mp3') ?? 0);
  log.log(`Audio per device: Opus ${(oggTotal / 1024).toFixed(1)} KB; MP3 ${(mp3Total / 1024).toFixed(1)} KB`);
  if (oggTotal > 856 * 1024 || mp3Total > 964 * 1024 || oggTotal > 1.5 * 1024 * 1024 || mp3Total > 1.5 * 1024 * 1024) {
    log.error('Per-device audio exceeds its format or 1.5 MB budget.');
    failed = true;
  }
}
return failed ? 1 : 0;
}

if (process.argv[1] && import.meta.url === new URL(`file://${resolve(process.argv[1])}`).href) process.exitCode = checkSize();
