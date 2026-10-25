import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const ROOT = resolve(import.meta.dirname, '..');
const RATE = 48_000;
const CC0 = 'CC0 1.0 Universal';
const CC0_URL = 'https://creativecommons.org/publicdomain/zero/1.0/';
const rawSources = [
  ['freesound/fs325583.mp3', 'mouth pops - wet - room.flac', 'cbenci', 'https://freesound.org/people/cbenci/sounds/325583/', 'Freesound HQ preview MP3 copied from the supplied local audio source.'],
  ['freesound/fs802606.mp3', 'Pops - Mouth', 'JelloApocalypse', 'https://freesound.org/people/JelloApocalypse/sounds/802606/', 'Freesound HQ preview MP3 copied from the supplied local audio source.'],
  ['freesound/fs442772.mp3', 'Slime Squish', 'qubodup', 'https://freesound.org/people/qubodup/sounds/442772/', 'Freesound HQ preview MP3 copied from the supplied local audio source.'],
  ['freesound/fs500912.mp3', 'Squish impact', 'Bertsz', 'https://freesound.org/people/Bertsz/sounds/500912/', 'Freesound HQ preview MP3 copied from the supplied local audio source.'],
  ...[0, 1, 2, 3, 4].map((i) => [`kenney/impact-sounds/impactSoft_medium_00${i}.ogg`, `Impact Sounds: impactSoft_medium_00${i}.ogg`, 'Kenney', 'https://kenney.nl/assets/impact-sounds', 'Copied from the supplied local Kenney pack.']),
  ['kenney/impact-sounds/impactSoft_heavy_000.ogg', 'Impact Sounds: impactSoft_heavy_000.ogg', 'Kenney', 'https://kenney.nl/assets/impact-sounds', 'Copied from the supplied local Kenney pack.'],
  ...['glass_002', 'click_003', 'confirmation_002', 'confirmation_003', 'confirmation_004'].map((name) => [`kenney/interface-sounds/${name}.ogg`, `Interface Sounds: ${name}.ogg`, 'Kenney', 'https://kenney.nl/assets/interface-sounds', 'Copied from the supplied local Kenney pack.']),
  ...['card-place-1', 'card-place-2', 'card-place-4', 'chips-collide-1', 'chips-collide-2', 'chips-collide-3', 'chips-collide-4'].map((name) => [`kenney/casino-audio/${name}.ogg`, `Casino Audio: ${name}.ogg`, 'Kenney', 'https://kenney.nl/assets/casino-audio', 'Copied from the supplied local Kenney pack.']),
  ['kenney/music-jingles/jingles_STEEL10.ogg', 'Music Jingles: jingles_STEEL10.ogg', 'Kenney', 'https://kenney.nl/assets/music-jingles', 'Copied from the supplied local Kenney pack.'],
  ['kenney/music-jingles/jingles_PIZZI10.ogg', 'Music Jingles: jingles_PIZZI10.ogg', 'Kenney', 'https://kenney.nl/assets/music-jingles', 'Copied from the supplied local Kenney pack.'],
  ['oga/lofi-hip-hop-loop.ogg', 'Lofi Hip Hop Loop (as downloaded: LofiLoop_2.ogg)', 'omfgdude', 'https://opengameart.org/content/lofi-hip-hop-loop', 'Copied from the supplied local OpenGameArt source.'],
];
const segments = [];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: ROOT, encoding: options.encoding ?? 'utf8', input: options.input, maxBuffer: 64 * 1024 * 1024, timeout: 120_000 });
  if (result.error) throw new Error(`${command} failed: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${command} failed (${result.status}): ${result.stderr ?? ''}`);
  return result;
}

function ffmpeg(args, options) {
  const output = args.at(-1);
  if (!output) throw new Error('ffmpeg command is missing an output path');
  return run('ffmpeg', ['-nostdin', '-v', 'error', ...args.slice(0, -1), '-map_metadata', '-1', '-fflags', '+bitexact', '-flags:a', '+bitexact', output], options);
}

function sha256(data) { return createHash('sha256').update(data).digest('hex'); }
function sourcePath(path) { return join(ROOT, 'assets-src/audio', path); }
function ffSeconds(seconds) { return seconds.toFixed(6); }

async function decodeToFloat(inputs, filters, duration, directory, name, rate = RATE, start = 0) {
  const output = join(directory, `${name}.f32`);
  const args = [];
  for (let index = 0; index < inputs.length; index += 1) {
    if (index === 0 && start > 0) args.push('-ss', ffSeconds(start));
    args.push('-i', inputs[index]);
  }
  if (duration !== undefined) args.push('-t', ffSeconds(duration));
  args.push('-vn', '-ac', '1', '-ar', String(rate), '-af', filters, '-f', 'f32le', '-acodec', 'pcm_f32le', output);
  ffmpeg(args);
  const bytes = await readFile(output);
  return new Float32Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
}

function fftBandPercent(samples) {
  let n = 1;
  while (n < samples.length) n <<= 1;
  const real = new Float64Array(n);
  const imag = new Float64Array(n);
  let peak = 0;
  for (let i = 0; i < samples.length; i += 1) {
    real[i] = samples[i] ?? 0;
    peak = Math.max(peak, Math.abs(real[i]));
  }
  for (let i = 1, j = 0; i < n; i += 1) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [real[i], real[j]] = [real[j] ?? 0, real[i] ?? 0]; [imag[i], imag[j]] = [imag[j] ?? 0, imag[i] ?? 0]; }
  }
  for (let size = 2; size <= n; size <<= 1) {
    const angle = -2 * Math.PI / size;
    const stepR = Math.cos(angle), stepI = Math.sin(angle);
    for (let start = 0; start < n; start += size) {
      let wr = 1, wi = 0;
      for (let offset = 0; offset < size / 2; offset += 1) {
        const even = start + offset, odd = even + size / 2;
        const tr = wr * (real[odd] ?? 0) - wi * (imag[odd] ?? 0);
        const ti = wr * (imag[odd] ?? 0) + wi * (real[odd] ?? 0);
        real[odd] = (real[even] ?? 0) - tr; imag[odd] = (imag[even] ?? 0) - ti;
        real[even] = (real[even] ?? 0) + tr; imag[even] = (imag[even] ?? 0) + ti;
        [wr, wi] = [wr * stepR - wi * stepI, wr * stepI + wi * stepR];
      }
    }
  }
  let total = 0, inBand = 0, low = 0;
  for (let bin = 1; bin <= n / 2; bin += 1) {
    const power = (real[bin] ?? 0) ** 2 + (imag[bin] ?? 0) ** 2;
    const frequency = bin * RATE / n;
    total += power;
    if (frequency >= 400 && frequency <= 4000) inBand += power;
    if (frequency < 200) low += power;
  }
  return { peak, inBand: total ? inBand / total * 100 : 0, low: total ? low / total * 100 : 0 };
}

function normalize(samples) {
  let peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  if (peak === 0) return samples;
  const gain = 10 ** (-1 / 20) / peak;
  return Float32Array.from(samples, (sample) => sample * gain);
}

function floatBytes(samples) { return Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength); }

async function cue(id, inputs, trim, filter, sources, directory, options = {}) {
  let samples;
  if (options.mix) {
    const args = [];
    for (const input of inputs) args.push('-i', input);
    const graph = options.mix;
    const output = join(directory, `${id}.f32`);
    ffmpeg([...args, '-filter_complex', graph, '-map', '[out]', '-ac', '1', '-ar', String(RATE), '-f', 'f32le', '-acodec', 'pcm_f32le', output]);
    const bytes = await readFile(output);
    samples = new Float32Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  } else {
    samples = await decodeToFloat(inputs, filter, trim, directory, id, RATE, options.trimStart ?? 0);
  }
  samples = normalize(samples);
  const stats = fftBandPercent(samples);
  const exempt = id === 'sub' || id.startsWith('coin');
  if (!exempt && stats.inBand < 50) throw new Error(`${id}: only ${stats.inBand.toFixed(1)}% in 400 Hz–4 kHz`);
  console.log(`${id.padEnd(7)} ${ (samples.length / RATE).toFixed(3)} s  peak -1.00 dBFS  in-band ${stats.inBand.toFixed(1)}%  under-200 ${stats.low.toFixed(1)}%`);
  segments.push({ id, samples, sources, stats, ...(options.rootMidi ? { rootMidi: options.rootMidi } : {}) });
}

async function probeDuration(path) {
  const result = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', path]);
  return Number(result.stdout.trim());
}

async function encode(input, outputArgs, format, directory, name) {
  const output = join(directory, `${name}.${format}`);
  ffmpeg(['-f', 'f32le', '-ar', String(RATE), '-ac', '1', '-i', 'pipe:0', ...outputArgs, output], { input: input });
  return new Uint8Array(await readFile(output));
}

async function main() {
  const directory = await import('node:fs/promises').then(({ mkdtemp }) => mkdtemp(join(tmpdir(), 'gloop-audio-')));
  try {
    const ffmpegVersion = run('ffmpeg', ['-version']).stdout.split('\n')[0] ?? '';
    const inputHashes = {};
    const sourceRows = [];
    for (const [path, title, author, page, obtained] of rawSources) {
      const digest = sha256(await readFile(sourcePath(path)));
      inputHashes[path] = digest;
      sourceRows.push(`- \`${path}\` — SHA-256 \`${digest}\`; ${title}; ${author}; page ${page}; licence ${CC0} (${CC0_URL}); verified 2026-10-25; ${obtained}`);
    }
    for (const pack of ['impact-sounds', 'interface-sounds', 'casino-audio', 'music-jingles']) {
      const path = `kenney/${pack}/License.txt`;
      const digest = sha256(await readFile(sourcePath(path)));
      inputHashes[path] = digest;
      const page = `https://kenney.nl/assets/${pack}`;
      sourceRows.push(`- \`${path}\` — SHA-256 \`${digest}\`; ${pack} licence file; Kenney; pack page ${page}; licence ${CC0} (${CC0_URL}); verified 2026-10-25; copied from the supplied local Kenney pack.`);
    }
    await writeFile(join(ROOT, 'assets-src/audio/SOURCES.md'), `# Audio source files\n\nExact source copies used by the offline audio builder. No files were downloaded for this build.\n\n${sourceRows.join('\n')}\n`);

    const f = (path) => sourcePath(path);
    const popCuts = [[0.254, .141], [1.825, .189], [7.713, .209], [14.851, .147], [16.472, .178], [23.428, .215]];
    for (let i = 0; i < popCuts.length; i += 1) {
      const [start, dur] = popCuts[i] ?? [0, 0];
      const id = `pop${i + 1}`;
      const samples = normalize(await decodeToFloat([f('freesound/fs325583.mp3')], `highpass=f=200,afade=t=in:d=0.002,afade=t=out:st=${ffSeconds(dur - .03)}:d=0.03`, dur, directory, id, RATE, start));
      const stats = fftBandPercent(samples);
      if (stats.inBand < 50) throw new Error(`${id}: only ${stats.inBand.toFixed(1)}% in 400 Hz–4 kHz`);
      console.log(`${id.padEnd(7)} ${(samples.length / RATE).toFixed(3)} s  peak -1.00 dBFS  in-band ${stats.inBand.toFixed(1)}%  under-200 ${stats.low.toFixed(1)}%`);
      segments.push({ id, samples, sources: ['fs-325583'], stats });
    }

    const placeStarts = [1.715, 2.595, 5.169, 6.933, 7.586];
    const wetStarts = [0, .03, .06, .09, .12];
    for (let i = 0; i < 5; i += 1) {
      const id = `place${i + 1}`;
      const out = join(directory, `${id}.f32`);
      const start = placeStarts[i] ?? 0;
      const wet = wetStarts[i] ?? 0;
      const kenney = f(`kenney/impact-sounds/impactSoft_medium_00${i}.ogg`);
      const graph = `[0:a]atrim=start=${start}:duration=0.14,asetpts=PTS-STARTPTS,highpass=f=150,afade=t=in:d=0.002,afade=t=out:st=0.08:d=0.06[a];[1:a]highpass=f=60,volume=6dB,asoftclip=type=tanh,volume=-20dB[b];[2:a]atrim=start=${wet}:duration=0.09,asetpts=PTS-STARTPTS,highpass=f=300,lowpass=f=3500,afade=t=in:d=0.003,afade=t=out:st=0.03:d=0.06,volume=-6dB[c];[a][b][c]amix=inputs=3:normalize=0:duration=longest[out]`;
      const args = ['-i', f('freesound/fs802606.mp3'), '-i', kenney, '-i', f('freesound/fs442772.mp3'), '-filter_complex', graph, '-map', '[out]', '-ac', '1', '-ar', String(RATE), '-f', 'f32le', '-acodec', 'pcm_f32le', out];
      ffmpeg(args);
      const bytes = await readFile(out);
      const samples = normalize(new Float32Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)));
      const stats = fftBandPercent(samples);
      if (stats.inBand < 50) throw new Error(`${id}: only ${stats.inBand.toFixed(1)}% in band`);
      console.log(`${id.padEnd(7)} ${(samples.length / RATE).toFixed(3)} s  peak -1.00 dBFS  in-band ${stats.inBand.toFixed(1)}%  under-200 ${stats.low.toFixed(1)}%`);
      segments.push({ id, samples, sources: ['fs-802606', 'kenney-impact', 'fs-442772'], stats });
    }
    await cue('goo', [f('freesound/fs500912.mp3')], .45, 'lowpass=f=4000,highpass=f=120,afade=t=out:st=0.25:d=0.2', ['fs-500912'], directory);
    await cue('sub', [f('kenney/impact-sounds/impactSoft_heavy_000.ogg')], .35, 'volume=6dB,asoftclip=type=tanh,afade=t=out:st=0.2:d=0.15', ['kenney-impact'], directory);
    await cue('tink', [f('kenney/interface-sounds/glass_002.ogg')], undefined, 'asetrate=48000*2^(-4/1200),aresample=48000,afade=t=out:st=0.08:d=0.04', ['kenney-interface'], directory, { rootMidi: 95 });
    await cue('tap', [f('kenney/interface-sounds/click_003.ogg')], undefined, 'anull', ['kenney-interface'], directory);
    for (const [i, name] of ['card-place-1', 'card-place-2', 'card-place-4'].entries()) {
      const starts = [.095, .141, .25], lengths = [.162, .114, .173];
      const dur = lengths[i] ?? .1;
      await cue(`deal${i + 1}`, [f(`kenney/casino-audio/${name}.ogg`)], dur, `highpass=f=250,highshelf=f=5000:g=-4,afade=t=out:st=${ffSeconds(dur - .04)}:d=0.04`, ['kenney-casino'], directory, { trimStart: starts[i] });
    }
    for (const [i, start] of [.079, .027, .119, .043].entries()) {
      const names = ['chips-collide-1', 'chips-collide-2', 'chips-collide-3', 'chips-collide-4'];
      const lengths = [.083, .097, .077, .069];
      const dur = lengths[i] ?? .08;
      await cue(`coin${i + 1}`, [f(`kenney/casino-audio/${names[i]}.ogg`)], dur, `highshelf=f=5000:g=-4,afade=t=out:st=${ffSeconds(dur - .03)}:d=0.03`, ['kenney-casino'], directory, { trimStart: start });
    }
    await cue('chime', [f('kenney/interface-sounds/confirmation_003.ogg')], undefined, 'asetrate=48000*2^(-200/1200),aresample=48000', ['kenney-interface'], directory);
    await cue('stage', [f('kenney/interface-sounds/confirmation_002.ogg')], undefined, 'asetrate=48000*2^(-200/1200),aresample=48000', ['kenney-interface'], directory);
    await cue('ach', [f('kenney/interface-sounds/confirmation_004.ogg')], undefined, 'asetrate=48000*2^(-400/1200),aresample=48000', ['kenney-interface'], directory);
    await cue('best', [f('kenney/music-jingles/jingles_STEEL10.ogg')], undefined, 'asetrate=48000*2^(484/1200),aresample=48000', ['kenney-jingles'], directory);
    await cue('level', [f('kenney/music-jingles/jingles_PIZZI10.ogg')], undefined, 'atrim=start=0.015,asetpts=PTS-STARTPTS,asetrate=48000*2^(496/1200),aresample=48000', ['kenney-jingles'], directory);
    await cue('swell', [f('freesound/fs442772.mp3')], .35, 'lowpass=f=4000,highpass=f=200,areverse,afade=t=in:d=0.25:curve=exp', ['fs-442772'], directory);

    const sorted = segments.slice();
    const markerAt = .1;
    const sprite = new Float32Array(Math.round(RATE * .2) + sorted.reduce((total, segment) => total + segment.samples.length + Math.round(RATE * .05), 0));
    sprite[4800] = .9; sprite[4801] = -.9;
    let cursor = 9600;
    const manifestSegments = {};
    for (const segment of sorted) {
      const start = cursor / RATE;
      sprite.set(segment.samples, cursor);
      cursor += segment.samples.length + Math.round(RATE * .05);
      manifestSegments[segment.id] = { start, dur: segment.samples.length / RATE, sources: segment.sources, ...(segment.rootMidi ? { rootMidi: segment.rootMidi } : {}) };
    }
    const outDir = join(ROOT, 'public/audio');
    await mkdir(outDir, { recursive: true });
    for (const entry of await readdir(outDir)) await rm(join(outDir, entry), { recursive: true, force: true });
    const sfxOgg = await encode(floatBytes(sprite), ['-ar', String(RATE), '-c:a', 'libopus', '-b:a', '48k', '-application', 'audio'], 'ogg', directory, 'sfx');
    const sfxMp3 = await encode(floatBytes(sprite), ['-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '96k'], 'mp3', directory, 'sfx');

    const musicPath = f('oga/lofi-hip-hop-loop.ogg');
    const musicRaw = await decodeToFloat([musicPath], 'highpass=f=40', undefined, directory, 'music-source', 22050);
    const targetLength = 2_821_460;
    const padded = new Float32Array(targetLength);
    padded.set(musicRaw.subarray(0, targetLength));
    const gain = 10 ** (-0.59 / 20);
    for (let i = 0; i < padded.length; i += 1) padded[i] = (padded[i] ?? 0) * gain;
    const edge = Math.round(22050 * .25);
    const musicLoop = new Float32Array(padded.length + edge * 2);
    musicLoop.set(padded.subarray(padded.length - edge), 0);
    musicLoop.set(padded, edge);
    musicLoop.set(padded.subarray(0, edge), edge + padded.length);
    const musicInputPath = join(directory, 'music-loop.f32');
    await writeFile(musicInputPath, floatBytes(musicLoop));
    const musicOggPath = join(directory, 'music.ogg');
    const musicMp3Path = join(directory, 'music.mp3');
    ffmpeg(['-f', 'f32le', '-ar', '22050', '-ac', '1', '-i', musicInputPath, '-ar', '48000', '-c:a', 'libopus', '-b:a', '40k', '-application', 'audio', musicOggPath]);
    ffmpeg(['-f', 'f32le', '-ar', '22050', '-ac', '1', '-i', musicInputPath, '-ar', '22050', '-c:a', 'libmp3lame', '-b:a', '48k', musicMp3Path]);
    const musicOgg = new Uint8Array(await readFile(musicOggPath));
    const musicMp3 = new Uint8Array(await readFile(musicMp3Path));
    const outputs = { sfx: { ogg: sfxOgg, mp3: sfxMp3 }, music: { ogg: musicOgg, mp3: musicMp3 } };
    const fileMap = {};
    for (const [kind, formats] of Object.entries(outputs)) {
      fileMap[kind] = {};
      for (const [format, bytes] of Object.entries(formats)) {
        const hash = sha256(bytes).slice(0, 8);
        const name = `${kind}.${hash}.${format}`;
        await writeFile(join(outDir, name), bytes);
        fileMap[kind][format] = name;
      }
    }
    const durations = {};
    for (const kind of ['sfx', 'music']) {
      durations[kind] = {};
      for (const format of ['ogg', 'mp3']) durations[kind][format] = await probeDuration(join(outDir, fileMap[kind][format]));
    }
    const manifest = [
      "// Generated by tools/build-audio.mjs (SG §13.11). Do not edit by hand.",
      "import type { CreditId } from './credits';",
      '',
      `export type SegmentId = ${sorted.map(({ id }) => `'${id}'`).join(' | ')};`,
      'export interface AudioManifest {',
      '  files: { sfx: { ogg: string; mp3: string }; music: { ogg: string; mp3: string } };',
      '  markerAt: number;',
      '  segments: Record<SegmentId, { start: number; dur: number; rootMidi?: number; sources: CreditId[] }>;',
      '  music: { loopStart: number; loopEnd: number; bpm: number; beatsPerBar: number; downbeat: number; sources: CreditId[] };',
      '  durations: { sfx: { ogg: number; mp3: number }; music: { ogg: number; mp3: number } };',
      '  sourceSha256: Record<string, string>;',
      '  ffmpegVersion: string;',
      '}',
      '',
      'export const AUDIO_MANIFEST: AudioManifest = {',
      `  files: { sfx: { ogg: import.meta.env.BASE_URL + 'audio/${fileMap.sfx.ogg}', mp3: import.meta.env.BASE_URL + 'audio/${fileMap.sfx.mp3}' }, music: { ogg: import.meta.env.BASE_URL + 'audio/${fileMap.music.ogg}', mp3: import.meta.env.BASE_URL + 'audio/${fileMap.music.mp3}' } },`,
      `  markerAt: ${markerAt.toFixed(3)},`,
      `  segments: ${JSON.stringify(manifestSegments, null, 2).replaceAll('\n', '\n  ')},`,
      `  music: { loopStart: 0.25, loopEnd: ${(.25 + targetLength / 22050).toFixed(9)}, bpm: 120.04, beatsPerBar: 4, downbeat: 0, sources: ['oga-lofi'] },`,
      `  durations: ${JSON.stringify(durations)},`,
      `  sourceSha256: ${JSON.stringify(inputHashes, null, 2).replaceAll('\n', '\n  ')},`,
      `  ffmpegVersion: ${JSON.stringify(ffmpegVersion)},`,
      '};',
      '',
    ].join('\n');
    await writeFile(join(ROOT, 'src/audio/manifest.ts'), manifest);
    for (const [kind, formats] of Object.entries(outputs)) {
      for (const [format, bytes] of Object.entries(formats)) {
        const name = `${kind}.${sha256(bytes).slice(0, 8)}.${format}`;
        console.log(`${name}: ${bytes.byteLength} bytes`);
      }
    }
    console.log(`ffmpeg: ${ffmpegVersion}`);
    void inputHashes;
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

await main();
