/**
 * Audio API (SG §13, design R21):
 * - Call initAudioOnFirstInput() from the first pointer or keyboard input. It lazily creates WebAudio.
 * - Call sfx.<name>(params) for named synthesized cues; invalidHover is intentionally silent.
 * - music.start()/stop()/setTier()/setPaused()/setGameOver() control the generative 84 BPM loop.
 * - setMasterMuted(), setSfxEnabled(), and setMusicEnabled() are independent settings hooks.
 * - playForEvents(events, ctx) translates reducer events into audio cues. `ctx` carries the current
 *   combo tier and optional run facts when the core event list does not include that information.
 */
import { isMasterMuted, isMusicEnabled, isSfxEnabled, setMasterMuted as setMute, setMusicEnabled as setMusic, setSfxEnabled as setSfx, toggleMasterMuted } from './engine';
import { music, type MusicTier } from './music';
import { resetPopSequence, sfx } from './sfx';

export { initAudioOnFirstInput, getAudioGraph } from './engine';
export { noteFor, PENTATONIC, resetPopSequence, sfx } from './sfx';
export { music } from './music';
export type { MusicTier } from './music';
export { setSfxEnabled as setSfxEnabledRaw, setMusicEnabled as setMusicEnabledRaw, isMasterMuted, isSfxEnabled, isMusicEnabled } from './engine';
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
export function setMusicEnabled(enabled: boolean): void { setMusic(enabled); }
export function toggleMute(): boolean {
  const value = toggleMasterMuted();
  try { localStorage.setItem('gloop-pop:muted', value ? '1' : '0'); } catch { /* Storage can be unavailable. */ }
  return value;
}

// Restore the top-bar master mute preference without creating an AudioContext.
try { setMute(localStorage.getItem('gloop-pop:muted') === '1'); } catch { /* Storage can be unavailable. */ }

export function playForEvents(events: readonly AudioEvent[], ctx: AudioEventContext = {}): void {
  let combo = ctx.combo ?? 1;
  let tier = ctx.tier ?? 0;
  for (const event of events) {
    switch (event.type) {
      case 'placed': sfx.place({ cells: event.piece.cells.length }); break;
      case 'cleared': sfx.lineClear({ combo, lines: event.rows.length + event.cols.length, tier }); break;
      case 'popped': {
        resetPopSequence();
        const ordered = event.gloops.flatMap((gloop) => gloop.bfs?.length ? gloop.bfs : gloop.cells);
        ordered.forEach((_, index) => sfx.gloopPop({ index }));
        const size = Math.max(0, ...event.gloops.map((gloop) => gloop.size));
        if (size >= 24) sfx.megaPop({ combo });
        else if (size >= 15) sfx.hugePop({ combo });
        else if (size >= 8) sfx.bigPop({ combo });
        break;
      }
      case 'comboUp': combo = event.combo; tier = event.tier as MusicTier; music.setTier(tier); sfx.lineClear({ combo, tier }); break;
      case 'comboLost': sfx.comboLost(); music.setTier(0); break;
      case 'allClear': sfx.allClear(); break;
      case 'stageUp': sfx.stageUp(); break;
      case 'dealt': sfx.deal(); break;
      case 'rescued': case 'rescueReady': case 'rescueOffered': sfx.rescue(); break;
      case 'stuck': sfx.stuck(); break;
      case 'gameOver': music.setGameOver(true); break;
      case 'zenShake': sfx.gloopPop(); break;
      case 'bigGloop': break;
      case 'scored': combo = event.combo; break;
    }
  }
  if (ctx.newBest) sfx.newBest();
  if (ctx.levelUp) sfx.levelUp();
  if (ctx.achievement) sfx.achievement();
}

export function setAudioPaused(paused: boolean): void { music.setPaused(paused); }
export function startMusic(): void { music.start(); }
export function stopMusic(): void { music.stop(); }
export function audioSettings(): { muted: boolean; sfx: boolean; music: boolean } {
  return { muted: isMasterMuted(), sfx: isSfxEnabled(), music: isMusicEnabled() };
}
