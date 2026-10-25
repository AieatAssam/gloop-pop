import { describe, expect, it } from 'vitest';
import { hexToRgba, mix, withAlpha } from './colour';

const hex = String.fromCharCode(35);

describe('colour helpers', () => {
  it('adds alpha to RGB colours', () => expect(withAlpha(`${hex}ff0000`, 0.5)).toBe('rgba(255, 0, 0, 0.5)'));
  it('mixes RGB channels into a composable hex colour', () => {
    const mixed = mix(`${hex}000000`, `${hex}ffffff`, 0.5);
    expect(mixed).toMatch(/^#[0-9A-F]{6}$/i);
    expect(withAlpha(mixed, 0.45)).toBe('rgba(128, 128, 128, 0.45)');
  });
  it('uses embedded alpha and clamps requested alpha', () => expect(hexToRgba(`${hex}ff000080`, 2)).toBe('rgba(255, 0, 0, 0.5019607843137255)'));
});
