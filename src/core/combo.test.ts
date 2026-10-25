import { describe, expect, it } from 'vitest';
import { advanceCombo } from './combo';

describe('combo fuse', () => {
  it('counts three clearless moves down to lost and resets on a clear', () => {
    let state = { combo: 3, fuse: 3, bestCombo: 3 };
    state = advanceCombo(state, 0).state; expect(state).toMatchObject({ combo: 3, fuse: 2 });
    state = advanceCombo(state, 0).state; expect(state.fuse).toBe(1);
    const lost = advanceCombo(state, 0); expect(lost.state).toMatchObject({ combo: 0, fuse: 0 }); expect(lost.events[0]).toEqual({ type: 'comboLost', combo: 3 });
    const reset = advanceCombo({ combo: 5, fuse: 1, bestCombo: 5 }, 1); expect(reset.state).toMatchObject({ combo: 6, fuse: 3, bestCombo: 6 });
  });
});
