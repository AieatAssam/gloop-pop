import { pathToFileURL } from 'node:url';

const options = new Map();
for (let index = 0; index < process.argv.length; index += 1) {
  const key = process.argv[index];
  if (key?.startsWith('--')) options.set(key.slice(2), process.argv[index + 1]);
}
const runs = Number(options.get('runs') ?? 300);
const mode = options.get('mode') ?? 'classic';
const seed = options.get('seed') ?? '1';
const coreUrl = pathToFileURL(new URL('../.sim/sim.js', import.meta.url).pathname).href;
const { canPlaceAll, runSimulation, solverProbeCases } = await import(coreUrl);
const stats = runSimulation(runs, mode, seed);
const fmt = (values) => `median ${values.median.toFixed(1)} / mean ${values.mean.toFixed(1)} / p10 ${values.p10.toFixed(1)} / p90 ${values.p90.toFixed(1)}`;
// The CLI times representative solver workloads; gameplay core has no wall-clock dependency.
let maxSolverTimeMs = 0;
for (const sample of solverProbeCases()) {
  const start = globalThis.performance.now();
  canPlaceAll(sample.board, sample.pieces, 200_000);
  maxSolverTimeMs = Math.max(maxSolverTimeMs, globalThis.performance.now() - start);
}
console.log(`Gloop Pop simulation (${mode}, ${stats.runs} runs, seed ${seed})`);
console.log(`placements: ${fmt(stats.placements)}`);
console.log(`score: ${fmt(stats.scores)}`);
console.log(`stage reached: ${fmt(stats.stages)}`);
console.log(`F2 fallback trays: ${stats.f2FallbackPercent.toFixed(1)}%`);
console.log(`max solver time: ${maxSolverTimeMs.toFixed(2)} ms`);
console.log(`runs reaching safety cap: ${stats.truncatedRuns}`);
