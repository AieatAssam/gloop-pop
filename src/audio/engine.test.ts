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

  it('keeps pad/twinkle layers open and steals the oldest pop after six live voices', async () => {
    const started = { oscillator: 0 };
    vi.stubGlobal('AudioContext', vi.fn(function () { return fakeAudioContext(started); }));
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => undefined)));
    const engine = await import('./engine');
    const graph = engine.initAudioOnFirstInput()!;
    expect(graph.layerGain.gain.value).toBe(1);
    const sources = Array.from({ length: 7 }, () => ({ stop: vi.fn(), addEventListener: vi.fn() } as unknown as AudioScheduledSourceNode));
    const oldestStop = vi.spyOn(sources[0]!, 'stop');
    for (const source of sources) engine.claimVoice(source, 'pop');
    expect(oldestStop).toHaveBeenCalledTimes(1);
    expect(sources.slice(1).every((source) => (source as unknown as { stop: ReturnType<typeof vi.fn> }).stop.mock.calls.length === 0)).toBe(true);
  });

  it('fades the previous place voice over 10 ms before a new place', async () => {
    const started = { oscillator: 0 };
    vi.stubGlobal('AudioContext', vi.fn(function () { return fakeAudioContext(started); }));
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => undefined)));
    const engine = await import('./engine'); engine.initAudioOnFirstInput();
    const source = () => ({ stop: vi.fn(), addEventListener: vi.fn() } as unknown as AudioScheduledSourceNode);
    const parameter = { value: 1, cancelScheduledValues: vi.fn(), setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() } as unknown as AudioParam;
    const ramp = vi.spyOn(parameter, 'linearRampToValueAtTime');
    const gain = { gain: parameter } as GainNode;
    engine.claimVoice(source(), 'place', gain);
    engine.claimVoice(source(), 'place', { gain: { ...parameter } } as GainNode);
    expect(ramp).toHaveBeenCalledWith(0, 0.015);
  });
});
