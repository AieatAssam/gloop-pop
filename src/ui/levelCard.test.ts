// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { LEVELS } from '../core/levels.data';
import { createLevelCard } from './levelCard';
import { S } from './strings';
import { defaultSave } from '../meta/saveSchema';

describe('Adventure level start card', () => {
  it('renders a goal description for every kind and the specified intro tips', () => {
    for (const kind of ['L', 'S', 'F', 'B', 'M', 'C']) {
      const def = LEVELS.find((level) => level.goals.some((goal) => goal.kind === kind))!; const goal = def.goals.find((item) => item.kind === kind)!; const text = createLevelCard(def, { play: vi.fn(), back: vi.fn() }).textContent ?? '';
      expect(text).toContain(S.adventureGoalText(goal.kind, goal.target, goal.flavour ? S.flavourName(goal.flavour).toLowerCase() : undefined));
    }
    expect(S.adventureGoalText('B', 1)).toBe('Make a Big Pop (8+ cells)'); expect(S.adventureGoalText('M', 1)).toBe('Clear 2+ lines in one move');
    expect(createLevelCard(LEVELS[20]!, { play: vi.fn(), back: vi.fn() }).textContent).toContain('New: sugar cubes. Clear a line through a cube to remove it.');
    expect(createLevelCard(LEVELS[4]!, { play: vi.fn(), back: vi.fn() }).textContent).toContain('Hard level');
    expect(createLevelCard(LEVELS[45]!, { play: vi.fn(), back: vi.fn() }).textContent).toContain('New: clear 2 or more lines with one piece.');
    for (const [level, tip] of [[6,'New: flavour goals. Cells you clear or pop both count.'],[41,'New: Big Pop goals. Pop a gloop of 8 or more cells.'],[51,'Grape joins in: 6 flavours from now on.'],[61,'New: hard cubes. They need 2 line clears.'],[81,'New: two goals. Finish both to win.'],[91,'Bubblegum joins in: 7 flavours from now on.']] as const) expect(createLevelCard(LEVELS[level - 1]!, { play: vi.fn(), back: vi.fn() }).textContent).toContain(tip);
    expect(createLevelCard(LEVELS[4]!, { play: vi.fn(), back: vi.fn() }).textContent).not.toContain('New:');
  });
  it('plays on Enter or Space and returns to the map on Escape', () => {
    const play = vi.fn(); const back = vi.fn(); const card = createLevelCard(LEVELS[20]!, { play, back });
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); expect(play).toHaveBeenCalledTimes(1);
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); expect(back).toHaveBeenCalledTimes(1);
  });
  it('shows shortage and cap labels, buys with one tap, selects the item and reports its updated save', () => {
    const save = defaultSave(); save.profile.coins = 160; save.adventure.boosters.shuffle = 5;
    const card = createLevelCard(LEVELS[23]!, { play: vi.fn(), back: vi.fn() }, { save });
    expect(card.textContent).toContain(S.boosterNeed(40)); expect(card.textContent).toContain(S.boosterCap);
    save.profile.coins = 150;
    let updated = save; const play = vi.fn();
    const purchasedCard = createLevelCard(LEVELS[23]!, { play, back: vi.fn(), bought: (_name, next) => { updated = next; } }, { save });
    const moves = [...purchasedCard.querySelectorAll<HTMLButtonElement>('.adventure-booster-tile')].find((tile) => tile.textContent?.includes(S.boosterMoves));
    moves?.click(); expect(updated.profile.coins).toBe(0); expect(updated.adventure.boosters.moves).toBe(1);
    moves?.click(); expect(updated.profile.coins).toBe(0); moves?.click();
    purchasedCard.querySelector<HTMLButtonElement>('.button--primary')?.click(); expect(play).toHaveBeenCalledWith(expect.objectContaining({ moves: true }), false);
  });
  it('shows the assist toggle only after three losses and updates displayed moves', () => {
    const save = defaultSave(); const card = createLevelCard(LEVELS[24]!, { play: vi.fn(), back: vi.fn() }, { save, lossRun: 3 });
    const assist = card.querySelector<HTMLInputElement>('.adventure-assist-row input'); expect(assist).not.toBeNull();
    assist!.checked = true; assist!.dispatchEvent(new Event('change', { bubbles: true })); expect(card.querySelector('.adventure-moves-row strong')?.textContent).toBe('14 +5');
    const clean = createLevelCard(LEVELS[24]!, { play: vi.fn(), back: vi.fn() }, { save, lossRun: 2 });
    expect(clean.querySelector('.adventure-assist-row')).toBeNull();
  });
});
