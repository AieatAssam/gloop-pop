import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { defaultSave } from '../meta/saveSchema';
import { LEVELS } from '../core/levelTable';
import { debugAdventureSave, debugAdventureState, debugNeedsAdventureLevels } from './debugTools';
import { newAdventureGame } from '../core/adventure';

describe('debug Adventure demo boot state', () => {
  it('loads level definitions and seeds the expected map frontier before rendering', () => {
    const mapQuery = new URLSearchParams('debug=1&demo=adventure-map');
    expect(debugNeedsAdventureLevels(mapQuery)).toBe(true);
    const mapSave = debugAdventureSave(defaultSave(), mapQuery, LEVELS, 0);
    expect(mapSave.adventure.frontier).toBe(23);
    expect(Object.values(mapSave.adventure.levels).reduce((sum, level) => sum + level.stars, 0)).toBe(43);
    expect(mapSave.adventure.inProgress?.adventure?.level).toBe(23);

    const frontierQuery = new URLSearchParams('debug=1&demo=adventure-map&frontier=41');
    expect(debugNeedsAdventureLevels(frontierQuery)).toBe(true);
    const frontierSave = debugAdventureSave(defaultSave(), frontierQuery, LEVELS, 0);
    expect(frontierSave.adventure.frontier).toBe(41);
    expect(frontierSave.adventure.inProgress?.adventure?.level).toBe(41);
  });

  it('keeps adventure demo state and every seeded debug scene on the debug path', () => {
    for (const demo of ['adventure-map-end', 'level-card', 'adventure-play', 'adventure-win', 'adventure-lose']) {
      expect(debugNeedsAdventureLevels(new URLSearchParams(`debug=1&demo=${demo}`))).toBe(true);
    }
    expect(debugNeedsAdventureLevels(new URLSearchParams('debug=1&demo=missions'))).toBe(false);
    expect(debugNeedsAdventureLevels(new URLSearchParams('save=veteran'))).toBe(false);
  });
  it('keeps the Level 87 lose fixture goals from the Level 87 definition', () => {
    const state = newAdventureGame(LEVELS[86]!, { bonusMoves: 0, boosters: { shuffle: 0, pop: 0 }, freeShuffle: false }).state;
    const fixture = debugAdventureState(state, new URLSearchParams('debug=1&demo=adventure-lose'))!;
    expect(fixture.adventure?.goals).toEqual(LEVELS[86]!.goals.map((goal) => ({ ...goal, progress: 0 })));
  });
});

describe('debug bundle boundary', () => {
  it('keeps debug-only dependencies out of app.ts and imports the tools only for debug URLs', () => {
    const app = readFileSync(new URL('./app.ts', import.meta.url), 'utf8');
    expect(app).not.toContain('save-v1-veteran.json');
    expect(app).not.toContain('./demoScenes');
    expect(app).not.toContain('../core/sim');
    expect(app).toContain("const dbg = debug ? await import('./debugTools') : null");
  });
});
