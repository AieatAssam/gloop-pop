import { afterEach, describe, expect, it, vi } from 'vitest';
import { pickFormat } from './loader';

describe('audio format selection', () => {
  it('selects Opus only for a definitive probably response', () => {
    expect(pickFormat(() => 'probably')).toBe('ogg');
    expect(pickFormat(() => 'maybe')).toBe('mp3');
    expect(pickFormat(() => '')).toBe('mp3');
  });

  it('fetches the MP3 sprite once when the Ogg decode fails', async () => {
    vi.resetModules();
    vi.stubGlobal('document', { createElement: () => ({ canPlayType: () => 'probably' }) });
    const fetchMock = vi.fn((url: string) => { void url; return Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) } as Response); });
    vi.stubGlobal('fetch', fetchMock);
    const decoded = { sampleRate: 48_000, getChannelData: () => new Float32Array(20_000) };
    const context = {
      decodeAudioData: vi.fn().mockRejectedValueOnce(new Error('Ogg decode failed')).mockResolvedValue(decoded),
      createBuffer: (_channels: number, length: number) => ({ copyToChannel: vi.fn(), length }),
    } as unknown as BaseAudioContext;
    const { loadSprite, loadMusic, audioLoadDebug } = await import('./loader');
    const { AUDIO_MANIFEST } = await import('./manifest');
    await loadSprite(context);
    await loadMusic(context);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([AUDIO_MANIFEST.files.sfx.ogg, AUDIO_MANIFEST.files.sfx.mp3, AUDIO_MANIFEST.files.music.mp3]);
    expect(audioLoadDebug().format).toBe('mp3');
  });
});

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });
