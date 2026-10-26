import { afterEach, describe, expect, it, vi } from 'vitest';

function fakeAudioContext(started: { oscillator: number; buffer?: number; oscillatorTimes?: number[] }): AudioContext {
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
      start: vi.fn((at?: number) => { started.oscillator += 1; started.oscillatorTimes?.push(at ?? 0); }), stop: vi.fn(), addEventListener: vi.fn(),
    }),
    createBufferSource: () => ({ connect: vi.fn(), playbackRate: param(), buffer: null, start: vi.fn(() => { if (started.buffer !== undefined) started.buffer += 1; }), stop: vi.fn(), addEventListener: vi.fn() }),
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

  it('trims the unmuted master to 0.674 and sets it to zero when muted', async () => {
    const started = { oscillator: 0 };
    vi.stubGlobal('AudioContext', vi.fn(function () { return fakeAudioContext(started); }));
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => undefined)));
    const engine = await import('./engine');
    const graph = engine.initAudioOnFirstInput()!;
    const masterTarget = vi.spyOn(graph.master.gain, 'setTargetAtTime');
    expect(graph.master.gain.value).toBe(0.674);
    engine.setMasterMuted(true);
    expect(masterTarget).toHaveBeenLastCalledWith(0, 0, 0.01);
    engine.setMasterMuted(false);
    expect(masterTarget).toHaveBeenLastCalledWith(0.674, 0, 0.01);
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

  it('grants the full All Clear and Mega stingers over scheduled voice intervals', async () => {
    vi.doMock('./loader', () => ({
      loadSprite: vi.fn(), getSegmentBuffer: () => ({ duration: 0.12 }), playSegment: vi.fn(() => false),
    }));
    const allClear = { oscillator: 0, buffer: 0, oscillatorTimes: [] as number[] };
    vi.stubGlobal('AudioContext', vi.fn(function () { return fakeAudioContext(allClear); }));
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => undefined)));
    const engine = await import('./engine');
    engine.initAudioOnFirstInput();
    const trace = engine.enableDebugAudioTrace();
    const { sfx } = await import('./sfx');
    sfx.allClearStinger();
    expect(allClear.buffer).toBe(11);
    expect(allClear.oscillator).toBe(35); // 29 bar partials, 3 bloom oscillators, and 3 LFOs.
    expect([0.335, 0.395, 0.455].map((at) => allClear.oscillatorTimes.filter((time) => time === at).length)).toEqual([2, 2, 2]);
    expect(trace.every((entry) => entry.granted)).toBe(true);

    vi.resetModules();
    vi.doMock('./loader', () => ({
      loadSprite: vi.fn(), getSegmentBuffer: () => ({ duration: 0.12 }), playSegment: vi.fn(() => false),
    }));
    const mega = { oscillator: 0, buffer: 0, oscillatorTimes: [] as number[] };
    vi.stubGlobal('AudioContext', vi.fn(function () { return fakeAudioContext(mega); }));
    const megaEngine = await import('./engine');
    megaEngine.initAudioOnFirstInput();
    const megaTrace = megaEngine.enableDebugAudioTrace();
    const { sfx: megaSfx } = await import('./sfx');
    megaSfx.megaStinger({ combo: 12 });
    expect(mega.buffer).toBe(6);
    expect(mega.oscillatorTimes.filter((time) => time === 0.32)).toHaveLength(4);
    expect(megaTrace.every((entry) => entry.granted)).toBe(true);
  });

  it('keeps the cap at 24 overlapping stinger voices and traces the denied call', async () => {
    vi.doMock('./loader', () => ({ loadSprite: vi.fn(), getSegmentBuffer: () => null, playSegment: vi.fn(() => false) }));
    const started = { oscillator: 0, oscillatorTimes: [] as number[] };
    vi.stubGlobal('AudioContext', vi.fn(function () { return fakeAudioContext(started); }));
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => undefined)));
    const engine = await import('./engine');
    engine.initAudioOnFirstInput();
    const trace = engine.enableDebugAudioTrace();
    const { tone } = await import('./synth');
    for (let index = 0; index < 25; index += 1) tone({ frequency: 600, duration: 0.5, peak: 0.2, at: 0.1, priority: 'stinger' });
    expect(started.oscillator).toBe(24);
    expect(trace).toHaveLength(25);
    expect(trace.slice(0, 24).every((entry) => entry.granted)).toBe(true);
    expect(trace[24]?.granted).toBe(false);
  });

  it('steals at the peak moment instead of stopping a short voice outside the peak', async () => {
    const started = { oscillator: 0 };
    vi.stubGlobal('AudioContext', vi.fn(function () { return fakeAudioContext(started); }));
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => undefined)));
    const engine = await import('./engine'); engine.initAudioOnFirstInput();
    const source = () => ({ stop: vi.fn(), addEventListener: vi.fn() } as unknown as AudioScheduledSourceNode);
    const ladder = Array.from({ length: 24 }, source);
    const shortUi = source();
    for (const voice of ladder) engine.claimVoice(voice, 'ladder', undefined, 0.5, 0.8);
    engine.claimVoice(shortUi, 'ui', undefined, 0.3, 0.31);
    const stinger = source();

    expect(engine.claimVoice(stinger, 'stinger', undefined, 0.3, 0.9)).toBe(true);
    expect((shortUi as unknown as { stop: ReturnType<typeof vi.fn> }).stop).not.toHaveBeenCalled();
    const stoppedLadders = ladder.filter((voice) => (voice as unknown as { stop: ReturnType<typeof vi.fn> }).stop.mock.calls.length > 0);
    expect(stoppedLadders).toHaveLength(1);
    const intervals = [...ladder, shortUi, stinger].map((voice) => {
      const stopCalls = (voice as unknown as { stop: ReturnType<typeof vi.fn> }).stop.mock.calls;
      const isStolen = stopCalls.length > 0;
      const original = voice === shortUi ? [0.3, 0.31] : voice === stinger ? [0.3, 0.9] : [0.5, 0.8];
      return isStolen ? [original[0]!, Math.min(original[1]!, Math.max(original[0]!, 0.005))] as const : original;
    });
    const times = intervals.flatMap(([start, stop]) => [start, stop]).filter((time) => time >= 0.3 && time < 0.9);
    expect(Math.max(...times.map((time) => intervals.filter(([start, stop]) => start <= time && time < stop).length))).toBeLessThanOrEqual(24);
  });

  it('does not leave a voice entry when a tremolo oscillator claim is denied', async () => {
    const started = { oscillator: 0 };
    vi.stubGlobal('AudioContext', vi.fn(function () { return fakeAudioContext(started); }));
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => undefined)));
    const engine = await import('./engine'); engine.initAudioOnFirstInput();
    const source = () => ({ stop: vi.fn(), addEventListener: vi.fn() } as unknown as AudioScheduledSourceNode);
    for (let index = 0; index < 24; index += 1) engine.claimVoice(source(), 'stinger', undefined, 0.1, 0.6);
    const before = engine.activeVoiceCount();
    const { tone } = await import('./synth');
    tone({ frequency: 440, duration: 0.4, peak: 0.2, tremolo: { frequency: 8, depth: 0.2 }, at: 0.1, priority: 'ladder' });
    expect(started.oscillator).toBe(0);
    expect(engine.activeVoiceCount()).toBe(before);
  });
});
