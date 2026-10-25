import { afterEach, describe, expect, it, vi } from 'vitest';

function fakeAudioContext(started: { oscillator: number }): AudioContext {
  const param = (): AudioParam => ({
    value: 0,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
  } as unknown as AudioParam);
  const node = () => ({ connect: vi.fn(), gain: param() });
  const context = {
    state: 'running', currentTime: 0, sampleRate: 48_000, destination: {},
    resume: vi.fn(() => Promise.resolve()), suspend: vi.fn(() => Promise.resolve()),
    createGain: node,
    createBiquadFilter: () => ({ connect: vi.fn(), frequency: param(), Q: param(), type: 'lowpass' }),
    createDynamicsCompressor: () => ({ connect: vi.fn(), threshold: param(), knee: param(), ratio: param(), attack: param(), release: param() }),
    createBuffer: (_channels: number, length: number) => ({ getChannelData: () => new Float32Array(length) }),
    createOscillator: () => ({
      connect: vi.fn(), frequency: param(), type: 'sine',
      start: vi.fn(() => { started.oscillator += 1; }), stop: vi.fn(), addEventListener: vi.fn(),
    }),
    createBufferSource: () => ({ connect: vi.fn(), playbackRate: param(), start: vi.fn(), stop: vi.fn(), addEventListener: vi.fn() }),
    decodeAudioData: vi.fn(() => Promise.reject(new Error('not used'))),
  };
  return context as unknown as AudioContext;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('first input audio initialization', () => {
  it('does not create a context or fetch before the gesture, then uses synth place while decoding', async () => {
    const started = { oscillator: 0 };
    const fetchMock = vi.fn(() => new Promise<Response>(() => undefined));
    const contextFactory = vi.fn(function () { return fakeAudioContext(started); });
    vi.stubGlobal('AudioContext', contextFactory);
    vi.stubGlobal('fetch', fetchMock);
    const { initAudioOnFirstInput } = await import('./engine');
    const { sfx } = await import('./sfx');

    expect(contextFactory).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    initAudioOnFirstInput();
    expect(contextFactory).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    sfx.place();
    expect(started.oscillator).toBeGreaterThan(0);
  });

  it('sets independent bus gains to the square of each saved volume', async () => {
    const started = { oscillator: 0 };
    vi.stubGlobal('AudioContext', vi.fn(function () { return fakeAudioContext(started); }));
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => undefined)));
    const engine = await import('./engine');
    const graph = engine.initAudioOnFirstInput()!;
    const sfxTarget = vi.spyOn(graph.sfxBus.gain, 'setTargetAtTime');
    const musicTarget = vi.spyOn(graph.musicBus.gain, 'setTargetAtTime');
    engine.setEffectsVolume(0.5); engine.setMusicVolume(0.5);
    expect(sfxTarget.mock.lastCall?.[0]).toBe(0.25);
    expect(musicTarget.mock.lastCall?.[0]).toBeCloseTo(0.1775);
  });
});
