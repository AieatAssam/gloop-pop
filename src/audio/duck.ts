import { getAudioGraph } from './engine';

export interface DuckPoint { at: number; gain: number; cutoff: number }
const ATTACK = 0.04;
const HOLD = 0.54;
const RELEASE = 0.9;
const DUCK_GAIN = 10 ** (-8 / 20);

export function duckSchedule(start: number, previousEnd = Number.NEGATIVE_INFINITY): DuckPoint[] {
  const continuing = previousEnd + RELEASE > start;
  const holdEnd = Math.max(start + HOLD, previousEnd);
  return [
    { at: start, gain: continuing ? DUCK_GAIN : 1, cutoff: continuing ? 1800 : 20000 },
    { at: start + ATTACK, gain: DUCK_GAIN, cutoff: 1800 },
    { at: holdEnd, gain: DUCK_GAIN, cutoff: 1800 },
    { at: holdEnd + RELEASE, gain: 1, cutoff: 20000 },
  ];
}

let duckEnd = Number.NEGATIVE_INFINITY;
export function applyDuck(start: number): number {
  const graph = getAudioGraph();
  const schedule = duckSchedule(start, duckEnd);
  duckEnd = Math.max(start + HOLD, duckEnd);
  if (!graph) return duckEnd;
  const gain = graph.duckGain.gain;
  const filter = graph.duckFilter.frequency;
  gain.cancelScheduledValues(start);
  filter.cancelScheduledValues(start);
  const continuing = schedule[0]?.gain === DUCK_GAIN;
  gain.setValueAtTime(continuing ? DUCK_GAIN : 1, start);
  filter.setValueAtTime(continuing ? 1800 : 20000, start);
  gain.linearRampToValueAtTime(DUCK_GAIN, start + ATTACK);
  filter.linearRampToValueAtTime(1800, start + ATTACK);
  gain.setValueAtTime(DUCK_GAIN, schedule[2]?.at ?? start + HOLD);
  filter.setValueAtTime(1800, schedule[2]?.at ?? start + HOLD);
  gain.linearRampToValueAtTime(1, schedule[3]?.at ?? start + HOLD + RELEASE);
  filter.linearRampToValueAtTime(20000, schedule[3]?.at ?? start + HOLD + RELEASE);
  return duckEnd;
}

export function resetDuck(): void { duckEnd = Number.NEGATIVE_INFINITY; }
