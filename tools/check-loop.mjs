import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const RATE = 22_050;
const LOOP_START = Number((await readFile(resolve(ROOT, 'src/audio/manifest.ts'), 'utf8')).match(/loopStart: ([\d.]+)/)?.[1]);
const LOOP_END = Number((await readFile(resolve(ROOT, 'src/audio/manifest.ts'), 'utf8')).match(/loopEnd: ([\d.]+)/)?.[1]);

function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'buffer', timeout: 120_000, maxBuffer: 64 * 1024 * 1024 });
  if (result.error) throw new Error(`${command} failed: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${command} failed (${result.status}): ${result.stderr.toString()}`);
  return result.stdout;
}
function rmsDb(samples, start, end) {
  let power = 0;
  for (let i = start; i < end; i += 1) power += (samples[i] ?? 0) ** 2;
  const rms = Math.sqrt(power / Math.max(1, end - start));
  return 20 * Math.log10(Math.max(rms, 1e-12));
}
function quantile(values, q) { const sorted = [...values].sort((a, b) => a - b); return sorted[Math.ceil(sorted.length * q) - 1] ?? 0; }

const file = process.argv[2];
if (!file || !Number.isFinite(LOOP_START) || !Number.isFinite(LOOP_END)) throw new Error('Usage: node tools/check-loop.mjs <music-file>');
const raw = run('ffmpeg', ['-nostdin', '-v', 'error', '-i', resolve(file), '-vn', '-ac', '1', '-ar', String(RATE), '-f', 'f32le', '-acodec', 'pcm_f32le', 'pipe:1']);
const samples = new Float32Array(raw.buffer, raw.byteOffset, Math.floor(raw.byteLength / 4));
const start = Math.round(LOOP_START * RATE); const end = start + Math.round((LOOP_END - LOOP_START) * RATE);
if (start <= 0 || end >= samples.length || end <= start) throw new Error(`Manifest loop bounds ${LOOP_START}–${LOOP_END} do not fit decoded audio (${samples.length} samples)`);
const window = Math.round(0.05 * RATE); const windowSamples = Math.round(0.01 * RATE);
const beforeDb = rmsDb(samples, end - window, end); const afterDb = rmsDb(samples, start, start + window);
let minimum10MsDb = Infinity;
for (let index = end - Math.round(0.5 * RATE); index + windowSamples <= end; index += windowSamples) minimum10MsDb = Math.min(minimum10MsDb, rmsDb(samples, index, index + windowSamples));
const jump = Math.abs((samples[end - 1] ?? 0) - (samples[start] ?? 0));
const steps = [];
for (let index = start + 1; index < end; index += 1) steps.push(Math.abs((samples[index] ?? 0) - (samples[index - 1] ?? 0)));
const p90 = quantile(steps, 0.9);
console.log(`${file}: RMS 50 ms before loopEnd ${beforeDb.toFixed(1)} dBFS; after loopStart ${afterDb.toFixed(1)} dBFS; min 10 ms RMS in last 500 ms ${minimum10MsDb.toFixed(1)} dBFS; jump ${jump.toFixed(4)}; loop step p90 ${p90.toFixed(4)}`);
