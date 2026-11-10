import { describe, expect, it } from 'vitest';
import { drawSteadyText } from './hudView';
import { PALETTE } from './palette';

// A fake 2D context that records where each glyph is drawn. Digits and the comma have fixed widths, as in a fixed-width font.
function recordingContext(): { ctx: CanvasRenderingContext2D; drawn: { glyph: string; x: number }[] } {
  const drawn: { glyph: string; x: number }[] = [];
  const widths: Record<string, number> = { ',': 12 };
  const ctx = {
    font: '800 52px "Baloo 2", sans-serif', textAlign: 'left', fillStyle: PALETTE.ui.textPrimary, strokeStyle: PALETTE.ui.panelSolid, lineWidth: 1, lineJoin: 'miter',
    measureText(text: string) { return { width: widths[text] ?? (text >= '0' && text <= '9' ? 30 : 20) }; },
    fillText(glyph: string, x: number) { drawn.push({ glyph, x }); },
    strokeText(glyph: string, x: number) { drawn.push({ glyph, x }); },
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, drawn };
}

describe('score digit slots (SG §9.13.i)', () => {
  it('keeps every digit in the same slot when only one digit changes', () => {
    const before = recordingContext(); drawSteadyText(before.ctx, '1,230', 180, 100, 'fill');
    const after = recordingContext(); drawSteadyText(after.ctx, '1,239', 180, 100, 'fill');
    expect(after.drawn.slice(0, 4).map((glyph) => glyph.x)).toEqual(before.drawn.slice(0, 4).map((glyph) => glyph.x));
  });

  it('centres the whole number on x for each digit count', () => {
    for (const text of ['7', '42', '999', '1,000', '12,345', '1,234,567']) {
      const { ctx, drawn } = recordingContext(); drawSteadyText(ctx, text, 180, 100, 'fill');
      const first = drawn[0]!; const last = drawn[drawn.length - 1]!;
      // The first glyph's left edge and the last glyph's right edge are symmetrical about x.
      expect((first.x - 15) + (last.x + 15)).toBeCloseTo(360, 6);
    }
  });

  it('draws the comma in its own width so the digits keep their slot', () => {
    const { ctx, drawn } = recordingContext(); drawSteadyText(ctx, '1,000', 180, 100, 'fill');
    expect(drawn.map((glyph) => glyph.glyph)).toEqual(['1', ',', '0', '0', '0']);
    expect(drawn[2]!.x - drawn[0]!.x).toBeCloseTo(15 + 12 + 15, 6);
    expect(drawn[3]!.x - drawn[2]!.x).toBeCloseTo(30, 6);
  });
});
