import { describe, expect, it } from 'vitest';
import { step } from '../core/game';
import { newGame } from '../core/game';
import { createFeelScene, createGoalScene } from './demoScenes';

describe('game-feel capture scenes', () => {
  it('clears each successive combo gap and climbs from combo 3', () => {
    let state = createFeelScene(newGame('classic', 'feel/combo').state, 'combo');
    for (const row of [7, 5, 3]) {
      const result = step(state, { type: 'place', slot: (7 - row) / 2 as 0 | 1 | 2, row, col: 7 });
      expect(result.events.some((event) => event.type === 'cleared' && event.rows.includes(row))).toBe(true);
      state = result.state;
    }
    expect(state.combo).toBe(6);
    expect(state.bestCombo).toBe(6);
  });

  it('clears multiple lines and resolves a Mega Pop from tray slot one', () => {
    const state = createFeelScene(newGame('classic', 'feel/mega').state, 'mega');
    const result = step(state, { type: 'place', slot: 0, row: 2, col: 3 });
    const clear = result.events.find((event) => event.type === 'cleared');
    const pop = result.events.find((event) => event.type === 'popped');
    expect(clear?.type === 'cleared' ? clear.rows.length + clear.cols.length : 0).toBe(2);
    expect(pop?.type === 'popped' && pop.gloops.some((gloop) => gloop.size >= 24)).toBe(true);
  });
  it('builds target, held-crossing and completed-mini goal scenes deterministically', () => {
    const base = newGame('classic', 'demo-goals').state;
    const target = createGoalScene(base, 'target'); const hit = createGoalScene(base, 'target-hit'); const done = createGoalScene(base, 'mini-done');
    expect(target.score).toBe(4880); expect(hit.goals?.targetsHit).toBe(1); expect(hit.score).toBeGreaterThan(5000);
    expect(done.goals?.mini).toMatchObject({ id: 'bigpop', progress: 1, done: true });
  });
});
