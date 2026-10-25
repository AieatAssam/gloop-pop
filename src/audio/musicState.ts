/** SG §13.7: pure adaptive music state; audio scheduling stays in music.ts. */
export type MusicTier = 0 | 1 | 2 | 3 | 4;
export interface MusicInputs {
  tier: number;
  filledCells: number;
  fittingPieces: number;
  zen: boolean;
  idleMs: number;
  paused: boolean;
  screen: string;
  gameOver: boolean;
  now: number;
  position?: number;
  comboLostAt?: number;
}
export interface MusicState {
  tier: MusicTier;
  danger: boolean;
  idle: boolean;
  paused: boolean;
  menu: boolean;
  gameOver: boolean;
  dangerExitAt: number;
}
const BAR = 4 * 60 / 120.04;
const tierFor = (combo: number): MusicTier => combo >= 12 ? 4 : combo >= 8 ? 3 : combo >= 5 ? 2 : combo >= 3 ? 1 : 0;

export function musicState(input: MusicInputs, previous?: MusicState): MusicState {
  const wasDanger = previous?.danger ?? false;
  const dangerOn = !input.zen && (input.filledCells >= 40 || input.fittingPieces <= 1);
  const exitReady = input.filledCells <= 34 && input.fittingPieces >= 2;
  const dangerExitAt = dangerOn ? Number.POSITIVE_INFINITY
    : wasDanger && !exitReady ? Number.POSITIVE_INFINITY
      : wasDanger ? (Number.isFinite(previous?.dangerExitAt) ? previous!.dangerExitAt : input.now + Math.max(0, nextBar(input.position ?? 0) - (input.position ?? 0)) + BAR)
        : Number.NEGATIVE_INFINITY;
  const danger = dangerOn || (wasDanger && input.now < dangerExitAt);
  let tier = tierFor(input.tier);
  if (input.comboLostAt !== undefined && input.now < input.comboLostAt + 3 && tier === 0) tier = previous?.tier ?? 0;
  return {
    tier, danger, idle: input.idleMs >= 30_000, paused: input.paused,
    menu: input.screen !== 'play', gameOver: input.gameOver, dangerExitAt,
  };
}

export function nextBar(position: number, bar = BAR): number {
  if (!Number.isFinite(position) || position < 0 || bar <= 0) return 0;
  const boundary = Math.ceil(position / bar - 1e-9) * bar;
  return boundary === 0 ? 0 : boundary;
}
