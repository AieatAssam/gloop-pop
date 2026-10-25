import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { defineConfig, type Plugin, type ResolvedConfig } from 'vite';

function serviceWorkerPlugin(): Plugin {
  let config: ResolvedConfig;
  return {
    name: 'gloop-pop-service-worker',
    apply: 'build',
    configResolved(resolved) { config = resolved; },
    async closeBundle() {
      const outputDirectory = join(config.root, config.build.outDir);
      const templatePath = join(config.root, 'src/sw/sw.template.js');
      const files = await listFiles(outputDirectory, outputDirectory);
      const base = config.base.endsWith('/') ? config.base : `${config.base}/`;
      const precache = files
        .filter((file) => file !== 'sw.js')
        .map((file) => `${base}${file.split(sep).join('/')}`);
      const version = createHash('sha256').update(precache.join('\n')).digest('hex').slice(0, 12);
      const template = await readFile(templatePath, 'utf8');
      const serviceWorker = template.replace('__VERSION__', version).replace('__PRECACHE__', JSON.stringify(precache));
      await writeFile(join(outputDirectory, 'sw.js'), serviceWorker);
    },
  };
}

async function listFiles(root: string, directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(root, path) : [relative(root, path)];
  }));
  return files.flat().sort();
}

export default defineConfig({
  base: '/gloop-pop/',
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
    sourcemap: false,
  },
  plugins: [serviceWorkerPlugin()],
});
