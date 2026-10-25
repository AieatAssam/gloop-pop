import { describe, expect, it } from 'vitest';
import { pickFormat } from './loader';

describe('audio format selection', () => {
  it('selects Opus only for a definitive probably response', () => {
    expect(pickFormat(() => 'probably')).toBe('ogg');
    expect(pickFormat(() => 'maybe')).toBe('mp3');
    expect(pickFormat(() => '')).toBe('mp3');
  });
});
