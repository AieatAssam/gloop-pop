import { describe, expect, it } from 'vitest';
import { hexToRgba, mix, withAlpha } from './colour';

const hex = String.fromCharCode(35);

describe('colour helpers', () => {
  it('adds alpha to RGB colours', () => expect(withAlpha(`${hex}ff0000`, 0.5)).toBe('rgba(255, 0, 0, 0.5)'));
  it('mixes RGB channels', () => expect(mix(`${hex}000000`, `${hex}ffffff`, 0.5)).toBe('rgb(128, 128, 128)'));
  it('uses embedded alpha and clamps requested alpha', () => expect(hexToRgba(`${hex}ff000080`, 2)).toBe('rgba(255, 0, 0, 0.5019607843137255)'));
});
