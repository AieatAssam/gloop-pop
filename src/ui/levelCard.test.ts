// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { LEVELS } from '../core/levels.data';
import { createLevelCard } from './levelCard';
import { S } from './strings';

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
});
