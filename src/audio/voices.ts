import type { VoicePriority } from './engine';

export type CosmeticRandom = () => number;
export interface VoiceEntry { priority: VoicePriority; order: number }
const PRIORITY: Record<VoicePriority, number> = { ui: 0, deal: 0, coin: 0, pop: 1, place: 2, ladder: 3, stinger: 4 };

export function stealCandidate(voices: readonly VoiceEntry[]): number {
  let candidate = -1;
  for (let index = 0; index < voices.length; index += 1) {
    const voice = voices[index];
    if (!voice || voice.priority === 'stinger') continue;
    const best = voices[candidate];
    if (!best || PRIORITY[voice.priority] < PRIORITY[best.priority] ||
      (PRIORITY[voice.priority] === PRIORITY[best.priority] && voice.order < best.order)) candidate = index;
  }
  return candidate;
}

export function pickVariant(count: number, last: number, random: CosmeticRandom): number {
  if (count <= 1) return 0;
  const draw = Math.min(0.999999999999, Math.max(0, random()));
  if (last < 0 || last >= count) return Math.floor(draw * count);
  const index = Math.floor(draw * (count - 1));
  return index >= last ? index + 1 : index;
}

export class VoiceRandom {
  private readonly lastByGroup = new Map<string, number>();
  constructor(private readonly random: CosmeticRandom) {}

  next(): number { return Math.min(0.999999999999, Math.max(0, this.random())); }

  variant(group: string, count: number): number {
    const last = this.lastByGroup.get(group) ?? -1;
    const picked = pickVariant(count, last, () => this.next());
    this.lastByGroup.set(group, picked);
    return picked;
  }
}

export interface RateLimiter { lastAt: number; interval: number }
export function voiceDue(limiter: RateLimiter, now: number): boolean {
  if (!Number.isFinite(now) || now - limiter.lastAt + 1e-9 < limiter.interval) return false;
  limiter.lastAt = now;
  return true;
}

export function popVoiceStealIndex(voices: readonly VoiceEntry[]): number {
  let oldest = -1;
  for (let index = 0; index < voices.length; index += 1) {
    const voice = voices[index];
    if (voice?.priority === 'pop' && (oldest < 0 || voice.order < (voices[oldest]?.order ?? Infinity))) oldest = index;
  }
  return oldest;
}

export function coinTicksForCount(count: number): number {
  return Number.isFinite(count) ? Math.min(12, Math.max(0, Math.floor(count))) : 0;
}

export function canStartVoice(priority: VoicePriority, active: number, cap = 24): boolean {
  return priority === 'stinger' || active < cap;
}
