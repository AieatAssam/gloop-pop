import { afterEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ now: 20, applyDuck: vi.fn(), sfxCalls: [] as { name: string; args: unknown[] }[] }));
vi.mock('./duck', () => ({ applyDuck: state.applyDuck }));
vi.mock('./engine', () => ({
  activeVoiceCount: () => 0,
  getAudioGraph: () => ({ context: { currentTime: state.now, outputLatency: 0 } }),
  scheduleAt: () => state.now + 0.005,
  isMasterMuted: () => false, isMusicEnabled: () => true, isSfxEnabled: () => true,
  setMasterMuted() {}, setMusicEnabled() {}, setSfxEnabled() {}, toggleMasterMuted: () => false,
}));
vi.mock('./music', () => ({ music: { setTier() {}, setGameOver() {}, setPaused() {}, start() {}, stop() {}, debugState: () => 'tier 0' } }));
vi.mock('./sfx', () => {
  const sfx = new Proxy({}, { get: (_target, key) => (...args: unknown[]) => { state.sfxCalls.push({ name: String(key), args }); } });
  return { sfx, resetPopSequence() {} };
});

import { onBurst, onClimax, onImpact, onPopFirst, stingerCooldownReady } from './index';
import { planMove } from './movePlan';

afterEach(() => { state.applyDuck.mockClear(); state.sfxCalls.length = 0; vi.resetModules(); });

describe('stinger routing', () => {
  it('ducks only the three stinger types and drops another within three seconds', () => {
    const ordinary = planMove([{ type: 'cleared', rows: [0], cols: [], cells: [], flavoursByCell: [] }]);
    onImpact(ordinary);
    expect(state.applyDuck).not.toHaveBeenCalled();
    const allClear = planMove([{ type: 'allClear' }]);
    onClimax(allClear, 'allClear');
    expect(state.applyDuck).toHaveBeenCalledTimes(1);
    state.now += 2.999; onClimax(allClear, 'allClear');
    expect(state.applyDuck).toHaveBeenCalledTimes(1);
    state.now += 0.001;
    const mega = planMove([{ type: 'popped', gloops: [{ flavour: 1, size: 24, cells: Array.from({ length: 24 }, (_, index) => index), bfs: Array.from({ length: 24 }, (_, index) => index) }] }]);
    onClimax(mega, 'mega');
    expect(state.applyDuck).toHaveBeenCalledTimes(2);
    state.now += 3;
    const best = planMove([], { newBest: true });
    onImpact(best);
    expect(state.applyDuck).toHaveBeenCalledTimes(3);
    state.now += 3;
    const huge = planMove([{ type: 'popped', gloops: [{ flavour: 1, size: 15, cells: Array.from({ length: 15 }, (_, index) => index), bfs: Array.from({ length: 15 }, (_, index) => index) }] }]);
    onClimax(huge, 'huge');
    expect(state.applyDuck).toHaveBeenCalledTimes(3);
    expect(stingerCooldownReady(22.999, 20)).toBe(false);
    expect(stingerCooldownReady(23, 20)).toBe(true);
  });

  it('plays Big Pop rise only for a Big gloop burst', () => {
    const plan = planMove([{ type: 'popped', gloops: [{ flavour: 1, size: 8, cells: [0], bfs: [0] }] }]);
    onBurst(plan, 0, 'small', true);
    expect(state.sfxCalls.map((call) => call.name)).not.toContain('bigPop');
    onBurst(plan, 1, 'big', true);
    expect(state.sfxCalls.map((call) => call.name)).toContain('bigPop');
  });

  it('makes the same Mega Pop audio calls in reduced and full motion', () => {
    const cells = Array.from({ length: 24 }, (_, index) => index);
    const plan = planMove([{ type: 'popped', gloops: [{ flavour: 1, size: 24, cells, bfs: cells }] }]);
    const recordings: string[][] = [];
    for (const reducedMotion of [false, true]) {
      state.sfxCalls.length = 0; state.now += 3.01;
      // The director holds the visual burst to 150 ms with reduced motion, versus 70 ms normally.
      // Audio receives the same event callbacks at those respective visual burst frames.
      state.now += reducedMotion ? 0.15 : 0.07;
      onBurst(plan, 0, 'mega', false); onPopFirst(plan, 'mega');
      state.now += reducedMotion ? 0.33 : 0.25;
      onBurst(plan, 2, 'mega', true); onClimax(plan, 'mega');
      recordings.push(state.sfxCalls.map(({ name, args }) => `${name}:${JSON.stringify(args)}`));
    }
    expect(recordings[0]).toEqual(recordings[1]);
    expect(recordings[0]?.map((call) => call.split(':')[0])).toEqual(['gloopPop', 'gooPop', 'gloopPop', 'megaStinger']);
    expect(recordings[0]?.[0]).toContain('"gainDb":-14');
    expect(recordings[0]?.[1]).toContain('"gainDb":-10');
    expect(recordings[0]?.[1]).toContain('"subGainDb":-14');
  });
});
