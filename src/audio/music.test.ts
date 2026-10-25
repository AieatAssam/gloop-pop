import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AudioGraph } from './engine';

const fixtures = vi.hoisted(() => ({
  graph: null as AudioGraph | null,
  enabled: true,
  load: vi.fn<() => Promise<AudioBuffer>>(),
  sources: [] as { loopStart: number; loopEnd: number; playbackRate: { value: number; setValueAtTime: ReturnType<typeof vi.fn>; cancelScheduledValues: ReturnType<typeof vi.fn>; linearRampToValueAtTime: ReturnType<typeof vi.fn> }; start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> }[],
  context: null as { currentTime: number } | null,
  bedGainRamp: vi.fn(),
}));
vi.mock('./engine', () => ({ getAudioGraph: () => fixtures.graph, isMusicEnabled: () => fixtures.enabled }));
vi.mock('./loader', () => ({ loadMusic: () => fixtures.load(), getSegmentBuffer: () => null }));

function parameter(value = 0): AudioParam {
  return { value, cancelScheduledValues: vi.fn(), setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), setTargetAtTime: vi.fn() } as unknown as AudioParam;
}
function makeGraph(): AudioGraph {
  const context = {
    currentTime: 0,
    createBufferSource: () => {
      const created = { loopStart: 0, loopEnd: 0, playbackRate: { value: 1, setValueAtTime: vi.fn(), cancelScheduledValues: vi.fn(), linearRampToValueAtTime: vi.fn() }, start: vi.fn(), stop: vi.fn(), connect: vi.fn(), addEventListener: vi.fn(), onended: null as (() => void) | null };
      fixtures.sources.push(created); return created;
    },
    createGain: () => ({ gain: parameter(0), connect: vi.fn() }),
    createOscillator: () => ({ frequency: parameter(), type: 'sine', connect: vi.fn(), start: vi.fn(), stop: vi.fn() }),
  };
  fixtures.context = context;
  const bedGainParam = parameter();
  Object.defineProperty(bedGainParam, 'linearRampToValueAtTime', { value: fixtures.bedGainRamp });
  const node = { connect: vi.fn() };
  return { context, musicBus: { ...node, gain: parameter(0.71) }, musicFilter: { ...node, type: 'lowpass', frequency: parameter(3000) }, bedGain: { ...node, gain: bedGainParam }, layerGain: { ...node, gain: parameter() }, duckGain: { ...node, gain: parameter() }, musicStateGain: { ...node, gain: parameter(1) } } as unknown as AudioGraph;
}
const playState = { tier: 0 as const, danger: false, idle: false, paused: false, menu: false, gameOver: false, dangerExitAt: Number.NEGATIVE_INFINITY };
async function importMusic(): Promise<typeof import('./music').music> {
  const { music } = await import('./music'); return music;
}

beforeEach(() => {
  vi.useFakeTimers(); fixtures.graph = makeGraph(); fixtures.enabled = true;
  fixtures.load = vi.fn(() => Promise.resolve({} as AudioBuffer)); fixtures.sources = []; fixtures.bedGainRamp.mockClear();
});
afterEach(() => { vi.useRealTimers(); vi.resetModules(); });

describe('sampled music transport', () => {
  it('uses the manifest loop bounds and rests after three full loops', async () => {
    const music = await importMusic(); music.start(); await Promise.resolve(); await Promise.resolve();
    expect(fixtures.sources[0]?.loopStart).toBe(0.25);
    expect(fixtures.sources[0]?.loopEnd).toBeGreaterThan(fixtures.sources[0]?.loopStart ?? 0);
    const length = (fixtures.sources[0]?.loopEnd ?? 0) - (fixtures.sources[0]?.loopStart ?? 0);
    expect(length).toBeCloseTo(256 * 60 / 120.04, 3);
    fixtures.context!.currentTime = 3 * length - 3.9; music.update(playState);
    expect(fixtures.sources[0]?.stop).toHaveBeenCalled();
    const fadeCalls = fixtures.bedGainRamp.mock.calls;
    expect(fadeCalls[fadeCalls.length - 1]?.[0]).toBe(0);
    expect(fadeCalls[fadeCalls.length - 1]?.[1]).toBeCloseTo((fixtures.sources[0]?.start.mock.calls[0]?.[0] as number) + 3 * length, 5);
    fixtures.context!.currentTime = 3 * length + 60.1; music.update(playState);
    expect(fixtures.sources).toHaveLength(2);
  });
  it('does not request music while disabled', async () => {
    fixtures.enabled = false; const music = await importMusic(); music.start();
    expect(fixtures.load).not.toHaveBeenCalled();
  });
  it('stops in menus and resumes from a bar boundary', async () => {
    const music = await importMusic(); music.start(); await Promise.resolve(); await Promise.resolve();
    fixtures.context!.currentTime = 9.2;
    music.update({ ...playState, menu: true });
    expect(fixtures.sources[0]?.stop).toHaveBeenCalled();
    music.update(playState);
    const resumed = fixtures.sources[fixtures.sources.length - 1];
    const resumedStart = resumed?.start.mock.calls[resumed.start.mock.calls.length - 1];
    const bars = ((resumedStart?.[1] as number) - 0.25) / (4 * 60 / 120.04);
    expect(bars).toBeCloseTo(Math.round(bars), 5);
  });
  it('starts a deferred music load when music is enabled from a menu', async () => {
    const music = await importMusic();
    music.update({ ...playState, menu: true });
    expect(fixtures.load).not.toHaveBeenCalled();
    music.start();
    expect(fixtures.load).not.toHaveBeenCalled();
    music.update(playState);
    await Promise.resolve(); await Promise.resolve();
    expect(fixtures.load).toHaveBeenCalledTimes(1);
    expect(fixtures.sources).toHaveLength(1);
  });
  it('applies the danger bus offset without replacing the tier low-pass cutoff', async () => {
    const music = await importMusic(); music.start(); await Promise.resolve(); await Promise.resolve();
    const duckFilterState = vi.spyOn(fixtures.graph!.musicStateGain.gain, 'linearRampToValueAtTime');
    const tierFilter = vi.spyOn(fixtures.graph!.musicFilter.frequency, 'setTargetAtTime');
    music.update({ ...playState, danger: true }); vi.runOnlyPendingTimers();
    expect(duckFilterState).toHaveBeenCalledWith(10 ** (-2 / 20), 0.6);
    expect(tierFilter).toHaveBeenCalledWith(1600, 0, expect.closeTo(0.2, 6));
  });
  it('ramps game over to half speed and restarts at normal speed', async () => {
    const music = await importMusic(); music.start(); await Promise.resolve(); await Promise.resolve();
    fixtures.context!.currentTime = 4;
    music.update({ ...playState, gameOver: true });
    expect(fixtures.sources[0]?.playbackRate.linearRampToValueAtTime).toHaveBeenCalledWith(0.5, 4.45);
    music.update(playState);
    const restarted = fixtures.sources[fixtures.sources.length - 1];
    expect(restarted?.playbackRate.setValueAtTime).toHaveBeenCalledWith(1, 4.02);
    const rampCalls = fixtures.bedGainRamp.mock.calls;
    expect(rampCalls[rampCalls.length - 1]?.[0]).toBe(1);
    expect(rampCalls[rampCalls.length - 1]?.[1]).toBeCloseTo(4.32, 5);
    music.update({ ...playState, gameOver: true });
    fixtures.context!.currentTime = 8;
    music.update({ ...playState, gameOver: true });
    const fadeCalls = fixtures.bedGainRamp.mock.calls;
    expect(fadeCalls[fadeCalls.length - 1]?.[0]).toBe(0);
    expect(fadeCalls[fadeCalls.length - 1]?.[1]).toBe(11);
  });
});
