// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultSave } from '../../meta/saveSchema';
import { createAdventureMap } from './adventureMap';
import { mapGeometry } from './mapGeometry';
import { newAdventureGame } from '../../core/adventure';
import { LEVELS } from '../../core/levels.data';

beforeEach(() => { vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null); });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('Adventure map DOM positions (SG §20.2)', () => {
  it('uses geometry for every node and card and keeps the play action in the footer bar', () => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callback(0); return 1; });
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 412 }); Object.defineProperty(window, 'innerHeight', { configurable: true, value: 915 });
    const save = defaultSave(); save.adventure.frontier = 23;
    for (let level = 1; level < 23; level += 1) save.adventure.levels[String(level)] = { stars: 2, wins: 1, losses: 0, lossRun: 0, bestScore: 0 };
    save.adventure.chaptersDone = [1]; save.adventure.chaptersAllStars = [1];
    const open = vi.fn(); const root = createAdventureMap(save, { back: vi.fn(), openLevel: open }); const geo = mapGeometry({ w: 412, h: 915, safeTop: 0, safeBottom: 0 });
    const nodes = root.querySelectorAll<HTMLElement>('.adventure-node-wrap'); expect(nodes).toHaveLength(120);
    for (const nodeGeo of geo.nodes) {
      const wrap = nodes[nodeGeo.level - 1]!;
      expect(wrap.style.left).toBe(`${nodeGeo.cx - nodeGeo.box.w / 2}px`); expect(wrap.style.top).toBe(`${nodeGeo.box.y}px`);
    }
    const cards = root.querySelectorAll<HTMLElement>('.adventure-chapter-card'); expect(cards).toHaveLength(6);
    geo.cards.forEach((cardGeo, index) => { expect(cards[index]?.style.left).toBe(`${cardGeo.x}px`); expect(cards[index]?.style.top).toBe(`${cardGeo.y}px`); expect(cards[index]?.style.width).toBe(`${cardGeo.w}px`); });
    const footer = root.querySelector<HTMLElement>('.adventure-footer-bar')!; const button = footer.querySelector('button')!;
    expect(button.textContent).toBe('Play level 23'); button.click(); expect(open).toHaveBeenCalledWith(23);
    expect(root.querySelector('.adventure-node')?.getAttribute('aria-label')).toBe('Level 1, 2 stars');
    expect(root.querySelector('.adventure-chapter-card')?.textContent).toContain('All 20 levels: 200 coins, 100 XP ✓');
    expect(root.querySelector('.adventure-chapter-card')?.textContent).toContain('All 60 stars: 300 coins ✓');
  });
  it('uses the 1280 px geometry and opens the paused level from the footer', () => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callback(0); return 1; });
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280 }); Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
    const save = defaultSave(); save.adventure.frontier = 23;
    save.adventure.inProgress = newAdventureGame(LEVELS[6]!, { bonusMoves: 0, boosters: { shuffle: 0, pop: 0 }, freeShuffle: false }).state;
    const open = vi.fn(); const root = createAdventureMap(save, { back: vi.fn(), openLevel: open }); const geo = mapGeometry({ w: 1280, h: 800, safeTop: 0, safeBottom: 0 });
    for (const nodeGeo of geo.nodes) {
      const wrap = root.querySelectorAll<HTMLElement>('.adventure-node-wrap')[nodeGeo.level - 1]!;
      expect(wrap.style.left).toBe(`${nodeGeo.cx - nodeGeo.box.w / 2}px`); expect(wrap.style.top).toBe(`${nodeGeo.box.y}px`);
    }
    expect(root.querySelector('.adventure-node-caption')?.textContent).toBe('Continue');
    const footer = root.querySelector<HTMLButtonElement>('.adventure-footer');
    expect(footer?.textContent).toBe('Play level 7'); footer?.click(); expect(open).toHaveBeenCalledWith(7);
  });
  it('puts the all-won line in the same footer bar without a button', () => {
    const save = defaultSave(); save.adventure.frontier = 121;
    const root = createAdventureMap(save, { back: vi.fn(), openLevel: vi.fn() });
    expect(root.querySelector('.adventure-footer-bar')?.textContent).toContain('You won every level. Replay any level to get more stars.');
    expect(root.querySelector('.adventure-footer-bar button')).toBeNull();
  });
});
