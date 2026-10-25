// The v1 sound recipes remain the fallback until the sprite's matching segment is decoded.
import { sfx as fallbackSfx } from './fallback';
import { playSegment } from './loader';

export { PENTATONIC, lastPopVoiceTime, noteFor, popVoiceDue, resetPopSequence } from './fallback';

export const sfx = {
  ...fallbackSfx,
  place(params: { cells?: number } = {}): void {
    const cells = Math.max(1, params.cells ?? 1);
    const rate = 2 ** (-0.6 * (cells - 1) / 12);
    if (playSegment('place1', { group: 'place', variants: 5, priority: 'place', rate, rateVariation: 0.04, gain: 10 ** (-8 / 20), gainDbVariation: 1.5 })) return;
    fallbackSfx.place(params);
  },
};
