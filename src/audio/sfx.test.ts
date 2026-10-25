import { describe, expect, it } from 'vitest';
import { noteFor, popVoiceDue } from './sfx';

describe('audio SFX helpers', () => {
  it('maps combo to the capped C major pentatonic ladder', () => {
    expect(noteFor(1)).toBe(523.25);
    expect(noteFor(2)).toBe(587.33);
    expect(noteFor(11)).toBe(2093);
    expect(noteFor(19)).toBe(2093);
  });

  it('rate limits gloop pop voices to one per 25 ms', () => {
    expect(popVoiceDue(2, 2.024)).toBe(false);
    expect(popVoiceDue(2, 2.025)).toBe(true);
  });
});
