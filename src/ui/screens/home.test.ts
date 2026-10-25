// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { defaultSave } from '../../meta/saveSchema';
import { createHomeScreen } from './home';

describe('Home clarity', () => {
  it('labels the coin chip and explains the locked Adventure level', () => {
    const save = defaultSave(); save.profile.coins = 1240;
    const screen = createHomeScreen(save, { play: vi.fn(), stats: vi.fn(), collection: vi.fn(), achievements: vi.fn(), settings: vi.fn(), howToPlay: vi.fn(), credits: vi.fn(), debugXp: vi.fn() });
    const coins = screen.querySelector<HTMLElement>('.home-header .coin-chip');
    expect(coins?.getAttribute('aria-label')).toBe('1,240 coins'); expect(coins?.querySelector('svg')).not.toBeNull();
    const adventure = [...screen.querySelectorAll<HTMLElement>('.mode-card')].find((card) => card.textContent?.includes('Adventure'));
    expect(adventure?.textContent).toContain('Reach Level 2'); expect(adventure?.textContent).not.toContain('Levels with goals. Win up to 3 stars.');
  });
});
