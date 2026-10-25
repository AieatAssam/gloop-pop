// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { defaultSave } from '../../meta/saveSchema';
import { LEVELS } from '../../core/levels.data';
import { newAdventureGame } from '../../core/adventure';
import { createAdventureMap } from './adventureMap';

describe('Adventure map screen', () => {
  it('renders all nodes and chapter cards with states, aria labels, paused progress and footer action', () => {
    const save = defaultSave(); save.adventure.frontier = 23; save.adventure.chaptersDone = [1];
    for (let level = 1; level <= 22; level += 1) save.adventure.levels[String(level)] = { stars: (level % 3) as 0 | 1 | 2, wins: 1, losses: 0, lossRun: 0, bestScore: 0 };
    save.adventure.inProgress = newAdventureGame(LEVELS[22]!, { bonusMoves: 0, boosters: { shuffle: 0, pop: 0 }, freeShuffle: false }).state;
    const openLevel = vi.fn(); const screen = createAdventureMap(save, { back: vi.fn(), openLevel });
    expect(screen.querySelectorAll('.adventure-node')).toHaveLength(120);
    expect(screen.querySelectorAll('.adventure-chapter-card')).toHaveLength(6);
    expect(screen.querySelector('[aria-label="Level 1, 1 stars"]')).toBeTruthy();
    expect(screen.querySelector('[aria-label="Level 23, next"]')).toBeTruthy();
    expect(screen.querySelector('[aria-label="Level 24, locked"]')).toBeTruthy();
    expect(screen.textContent).toContain('Continue');
    expect(screen.textContent).toContain('All 20 levels: 200 coins, 100 XP ✓');
    screen.querySelector<HTMLButtonElement>('.adventure-footer')!.click();
    expect(openLevel).toHaveBeenCalledWith(23);
  });

  it('shows the completed state after all 360 stars', () => {
    const save = defaultSave(); save.adventure.frontier = 121;
    save.adventure.levels = Object.fromEntries(Array.from({ length: 120 }, (_, index) => [String(index + 1), { stars: 3 as const, wins: 1, losses: 0, lossRun: 0, bestScore: 0 }]));
    const screen = createAdventureMap(save, { back: vi.fn(), openLevel: vi.fn() });
    expect(screen.textContent).toContain('You won every level. Replay any level to get more stars.');
    expect(screen.querySelector('.adventure-footer')).toBeNull();
  });
});
