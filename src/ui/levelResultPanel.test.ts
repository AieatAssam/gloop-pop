// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { LEVELS } from '../core/levels.data';
import { newAdventureGame } from '../core/adventure';
import { createLevelResultPanel } from './levelResultPanel';

describe('Adventure result panel', () => {
  it('focuses Next level on wins and presents three stars and rewards', async () => {
    const state = newAdventureGame(LEVELS[0]!, { bonusMoves: 0, boosters: { shuffle: 0, pop: 0 }, freeShuffle: false }).state;
    state.adventure!.result = { won: true, reason: 'goals', movesLeft: 6, stars: 3 }; state.status = 'over';
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => { callback(0); return 0; });
    const panel = createLevelResultPanel(state, { xp: 70, coins: 65, progress: 30, progressMax: 100 }, { next: vi.fn(), replay: vi.fn(), map: vi.fn() }); document.body.append(panel); await Promise.resolve();
    expect(document.activeElement?.textContent).toBe('Next level'); expect(panel.querySelectorAll('.adventure-star-fill')).toHaveLength(3);
    expect(panel.textContent).toContain('+70 XP · +65 coins'); expect(panel.querySelector<HTMLElement>('.adventure-xp-track span')?.style.width).toBe('30%'); raf.mockRestore();
  });
  it('keeps boosters, prices and purchase controls off losses and retries immediately', () => {
    const state = newAdventureGame(LEVELS[0]!, { bonusMoves: 0, boosters: { shuffle: 0, pop: 0 }, freeShuffle: false }).state;
    state.adventure!.result = { won: false, reason: 'moves', movesLeft: 0, stars: 0 }; state.status = 'over'; const retry = vi.fn();
    const panel = createLevelResultPanel(state, { xp: 5, coins: 2 }, { next: vi.fn(), replay: retry, map: vi.fn() }, ['You needed 3 more lines.']);
    expect(panel.textContent).not.toMatch(/booster|price|150 coins|100 coins/i);
    expect([...panel.querySelectorAll('button')].some((button) => /coins|booster|price/i.test(button.textContent ?? ''))).toBe(false);
    expect(panel.textContent).toContain('You needed 3 more lines.');
    panel.querySelector<HTMLButtonElement>('button')!.click(); expect(retry).toHaveBeenCalledTimes(1);
  });
  it('offers the assist retry only after three recorded losses', () => {
    const state = newAdventureGame(LEVELS[0]!, { bonusMoves: 0, boosters: { shuffle: 0, pop: 0 }, freeShuffle: false }).state;
    state.adventure!.result = { won: false, reason: 'moves', movesLeft: 0, stars: 0 }; state.status = 'over';
    const assist = vi.fn(); const panel = createLevelResultPanel(state, { xp: 5, coins: 2 }, { next: vi.fn(), replay: vi.fn(), assistAgain: assist, map: vi.fn() }, [], { winStreak: 0, streakReset: false, assistAvailable: true });
    const button = [...panel.querySelectorAll('button')].find((item) => item.textContent === 'Try again with 5 extra moves');
    expect(button).toBeDefined(); button?.click(); expect(assist).toHaveBeenCalledTimes(1);
  });
});
