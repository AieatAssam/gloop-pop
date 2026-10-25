// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { LEVELS } from '../core/levelTable';
import { newAdventureGame } from '../core/adventure';
import { computeLayout } from '../render/layout';
import { createBoosterBar } from './boosterBar';

describe('Adventure booster bar', () => {
  it('shows only armed boosters and dispatches at once when pressed', () => {
    const use = vi.fn(); const bar = createBoosterBar(use);
    const state = newAdventureGame(LEVELS[23]!, { bonusMoves: 0, boosters: { shuffle: 1, pop: 0 }, freeShuffle: false }).state;
    bar.update(state, computeLayout(412, 915, {}, true));
    expect(bar.element.querySelectorAll('button')).toHaveLength(1);
    bar.element.querySelector('button')?.click(); expect(use).toHaveBeenCalledWith('shuffle');
    state.adventure!.boosters.shuffle = 'used'; bar.update(state, computeLayout(412, 915, {}, true));
    expect(bar.element.querySelector('button')?.disabled).toBe(true);
    expect(bar.element.querySelector('button')?.getAttribute('aria-label')).toBe('Used');
  });
});
