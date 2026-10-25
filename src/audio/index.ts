/**
 * Audio API (SG §13, design R21):
 * - Call initAudioOnFirstInput() from the first pointer or keyboard input. It lazily creates WebAudio.
 * - Call sfx.<name>(params) for named synthesized cues; invalidHover is intentionally silent.
 * - music.start()/stop()/setTier()/setPaused()/setGameOver() control the sampled bed and adaptive layers (SG §13.7).
 * - setMasterMuted(), setSfxEnabled(), and setMusicEnabled() are independent settings hooks.
 * - playForEvents(events, ctx) translates reducer events into audio cues. `ctx` carries the current
 *   combo tier and optional run facts when the core event list does not include that information.
 */
import { activeVoiceCount, getAudioGraph, isMasterMuted, isMusicEnabled, isSfxEnabled, scheduleAt, setMasterMuted as setMute, setMusicEnabled as setMusic, setSfxEnabled as setSfx, toggleMasterMuted } from './engine';
import { music, type MusicTier } from './music';
import { resetPopSequence, sfx } from './sfx';
import type { GameEvent } from '../core/types';
import { PIECES } from '../core/pieces';
import type { MovePlan } from './movePlan';
import { audioLoadDebug } from './loader';
import { applyDuck } from './duck';

export { initAudioOnFirstInput, getAudioGraph } from './engine';
export { noteFor, PENTATONIC, resetPopSequence, sfx } from './sfx';
export { music } from './music';
export type { MusicTier } from './music';
export { setSfxEnabled as setSfxEnabledRaw, setMusicEnabled as setMusicEnabledRaw, isMasterMuted, isSfxEnabled, isMusicEnabled } from './engine';
export { setEffectsVolume, setMusicVolume } from './engine';
export type SfxApi = typeof sfx;
export type AudioEvent =
  | { type: 'placed'; piece: { cells: readonly unknown[] }; cells: readonly number[] }
  | { type: 'cleared'; rows: readonly number[]; cols: readonly number[] }
  | { type: 'popped'; gloops: readonly { size: number; cells: readonly number[]; bfs?: readonly number[] }[] }
  | { type: 'comboUp'; combo: number; tier: number }
  | { type: 'comboLost'; combo: number }
  | { type: 'allClear' } | { type: 'stageUp'; stage: number }
  | { type: 'dealt'; tray: readonly unknown[] } | { type: 'rescueReady' } | { type: 'rescueOffered' }
  | { type: 'rescued'; poppedCells: readonly number[] } | { type: 'zenShake'; poppedCells: readonly number[] }
  | { type: 'stuck'; unfit: readonly number[] } | { type: 'gameOver'; reason: 'stuck' | 'traysDone' | 'endRun' }
  | { type: 'bigGloop'; size: number } | { type: 'scored'; points: number; combo: number; mult: number };
export interface AudioEventContext { combo?: number; tier?: MusicTier; newBest?: boolean; levelUp?: boolean; achievement?: boolean }

export function setMasterMuted(muted: boolean): void {
  setMute(muted);
  try { localStorage.setItem('gloop-pop:muted', muted ? '1' : '0'); } catch { /* Storage can be unavailable. */ }
}
export function setSfxEnabled(enabled: boolean): void { setSfx(enabled); }
export function setMusicEnabled(enabled: boolean): void {
  setMusic(enabled);
  if (enabled) music.start();
  else music.stop();
}
export function toggleMute(): boolean {
  const value = toggleMasterMuted();
  try { localStorage.setItem('gloop-pop:muted', value ? '1' : '0'); } catch { /* Storage can be unavailable. */ }
  return value;
}

// Restore the top-bar master mute preference without creating an AudioContext.
try { setMute(localStorage.getItem('gloop-pop:muted') === '1'); } catch { /* Storage can be unavailable. */ }

export function playForEvents(events: readonly AudioEvent[], _ctx: AudioEventContext = {}): void {
  for (const event of events) {
    switch (event.type) {
      case 'placed': case 'cleared': case 'popped': case 'comboUp': case 'comboLost': case 'allClear': case 'stageUp': case 'bigGloop': case 'scored': break;
      case 'rescueReady': sfx.rescueReady(); break;
      case 'dealt': sfx.deal(); break;
      case 'rescued': sfx.rescue(); break;
      case 'rescueOffered': break;
      case 'stuck': sfx.stuck(); break;
      case 'gameOver': music.setGameOver(true); break;
      case 'zenShake': sfx.zenShake(); break;
    }
  }
  if (_ctx.levelUp) sfx.levelUp();
  if (_ctx.achievement) sfx.achievement();
}

let lastStingerAt = -Infinity;
export function stingerCooldownReady(now: number, last: number): boolean { return now - last >= 3; }
function playStinger(kind: 'allClear' | 'mega' | 'newBest', combo: number): void {
  const now = getAudioGraph()?.context.currentTime ?? 0;
  if (!stingerCooldownReady(now, lastStingerAt)) return;
  lastStingerAt = now;
  applyDuck(scheduleAt());
  if (kind === 'allClear') sfx.allClearStinger();
  else if (kind === 'mega') sfx.megaStinger({ combo });
  else sfx.newBest();
}

export function onLand(plan: MovePlan): void {
  if (plan.placeCells > 0) sfx.place({ cells: plan.placeCells });
  if (plan.comboLost) { sfx.comboLost(); music.setTier(0); }
  if (!plan.lines && !plan.pops.length) {
    if (plan.stageUp) sfx.stageUp();
    if (plan.rescueReady) sfx.rescueReady();
    if (plan.stinger === 'newBest') playStinger('newBest', plan.combo);
  }
}
export function onImpact(plan: MovePlan): void {
  music.setTier(plan.tier);
  if (plan.lines > 0) {
    const mega = plan.largestPop >= 24;
    resetPopSequence(); sfx.lineClear({ combo: plan.combo, lines: Math.min(5, plan.lines), tier: plan.tier, mega });
    const lastLine = Math.min(4, plan.lines - 1);
    if (plan.tier >= 1) sfx.comboHarmony({ combo: plan.combo, lineIndex: lastLine, delayMs: lastLine * 45, mega });
    if (plan.tier >= 2) sfx.sparkle({ combo: plan.combo, lineIndex: lastLine, delayMs: lastLine * 45 + 30, mega });
  }
  if (plan.stageUp) sfx.stageUp();
  if (plan.rescueReady) sfx.rescueReady();
  if (plan.stinger === 'newBest') playStinger('newBest', plan.combo);
}
export function onBurst(plan: MovePlan, order: number, gloopTier: string, isLastOfGloop: boolean): void {
  if (order % 2 === 0 && order / 2 < 14) sfx.gloopPop({ index: order, base: plan.largestPop >= 24 ? -4 : plan.largestPop >= 15 ? -2 : plan.largestPop >= 8 ? 0 : 2, gainDb: plan.largestPop >= 24 ? -16 : -12 });
  if (isLastOfGloop && gloopTier === 'big') sfx.bigPop({ combo: plan.combo });
}
export function onPopFirst(plan: MovePlan, tier: 'big' | 'huge' | 'mega'): void {
  sfx.gooPop({ gainDb: tier === 'mega' ? -12 : tier === 'huge' ? -9 : -12, subGainDb: tier === 'mega' ? -16 : undefined, rate: tier === 'mega' ? 0.891 : tier === 'huge' ? 0.944 : 1, delay: tier === 'mega' ? 0.025 : 0, sub: tier === 'mega' });
}
export function onClimax(plan: MovePlan, kind: 'huge' | 'mega' | 'allClear'): void {
  if (kind === 'allClear' && plan.stinger === 'allClear') playStinger('allClear', plan.combo);
  else if (kind === 'mega' && plan.stinger === 'mega') playStinger('mega', plan.combo);
  else if (kind === 'huge') sfx.hugePop({ combo: plan.combo });
}

export function playGameEvents(events: readonly GameEvent[], ctx: AudioEventContext = {}): void {
  const audioEvents: AudioEvent[] = [];
  for (const event of events) {
    if (event.type === 'cubes' || event.type === 'goalProgress' || event.type === 'levelWon' || event.type === 'levelLost' || event.type === 'boosterUsed' || event.type === 'targetReached' || event.type === 'miniDone') continue;
    const audioEvent = event.type === 'placed'
      ? { ...event, piece: { cells: PIECES[event.piece.defId]!.cells } }
      : event;
    audioEvents.push(audioEvent);
  }
  playForEvents(audioEvents, ctx);
}

export function setAudioPaused(paused: boolean): void { music.setPaused(paused); }
export function startMusic(): void { music.setGameOver(false); music.setPaused(false); music.start(); }
export function stopMusic(): void { music.stop(); }
export function audioSettings(): { muted: boolean; sfx: boolean; music: boolean } {
  return { muted: isMasterMuted(), sfx: isSfxEnabled(), music: isMusicEnabled() };
}
export function audioDebugLine(): string {
  const graph = getAudioGraph(); const load = audioLoadDebug();
  const latency = graph?.context.outputLatency ?? 0;
  return `audio ${load.format} · ${load.decoded} decoded/${load.total - load.decoded} fallback · ${(latency * 1000).toFixed(1)} ms latency · ${activeVoiceCount()} voices · music ${music.debugState()}`;
}
