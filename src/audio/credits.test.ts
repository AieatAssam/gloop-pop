import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CREDITS, creditAriaLabel, creditLine } from './credits';

const markdown = readFileSync(new URL('../../CREDITS.md', import.meta.url), 'utf8');

describe('audio credits', () => {
  it('matches the player-facing credit lines from design §16.4', () => {
    expect(CREDITS.map(creditLine)).toEqual([
      'Lofi Hip Hop Loop by omfgdude · CC0 · OpenGameArt',
      'mouth pops - wet - room.flac by cbenci · CC0 · Freesound',
      'Pops - Mouth by JelloApocalypse · CC0 · Freesound',
      'Slime Squish by qubodup · CC0 · Freesound',
      'Squish impact by Bertsz · CC0 · Freesound',
      'Interface Sounds by Kenney · CC0 · Kenney',
      'Impact Sounds by Kenney · CC0 · Kenney',
      'Casino Audio by Kenney · CC0 · Kenney',
      'Music Jingles by Kenney · CC0 · Kenney',
      'Code, art and synth sounds: made for Gloop Pop.',
    ]);
    expect(creditAriaLabel(CREDITS[0]!)).toBe('Open Lofi Hip Hop Loop on OpenGameArt');
  });

  it('keeps every credit title, author, URL and licence text in CREDITS.md', () => {
    for (const credit of CREDITS) {
      expect(markdown).toContain(credit.title);
      expect(markdown).toContain(credit.author);
      if (credit.url) expect(markdown).toContain(credit.url);
      if (credit.licence) expect(markdown).toContain(credit.licence);
    }
    expect(markdown).not.toContain('Draft');
    expect(markdown).toContain('"Changes" lines match');
  });
});
