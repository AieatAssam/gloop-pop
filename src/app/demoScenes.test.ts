import { afterEach, describe, expect, it } from 'vitest';
import { step } from '../core/game';
import { newGame } from '../core/game';
import { planMove } from '../audio/movePlan';
import { grantAchievements } from '../meta/achievements';
import { createFeelScene, createGoalScene } from './demoScenes';
import { debugSaveWritesDisabled, debugTutorialState, markTutorialSkipped, seedMegaPlainSave } from './demoScenes';
import { defaultSave } from '../meta/saveSchema';
import { remove, read } from '../platform/storage';
import { SAVE_KEY, saveNow, setSaveWritesDisabled } from '../platform/saveStore';

describe('game-feel capture scenes', () => {
  afterEach(() => { setSaveWritesDisabled(false); remove(SAVE_KEY); });
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
  it('plans a Mega Pop without an All Clear or new progression unlocks in mega-plain', () => {
    const query = new URLSearchParams('debug=1&demo=feel&scene=mega-plain');
    const state = createFeelScene(newGame('classic', 'feel/mega-plain').state, 'mega-plain');
    const result = step(state, { type: 'place', slot: 0, row: 2, col: 3 });
    const plan = planMove(result.events);
    const baseSave = defaultSave();
    const save = seedMegaPlainSave(baseSave, query);
    const achievements = grantAchievements(save, { mode: state.mode, score: result.state.score, events: result.events });

    expect(plan.stinger).toBe('mega');
    expect(plan.pops.some((pop) => pop.tier === 'mega' && pop.size >= 24)).toBe(true);
    expect(result.events.some((event) => event.type === 'allClear')).toBe(false);
    expect(result.state.board.some((cell) => cell > 0)).toBe(true);
    expect(achievements.unlocked).toHaveLength(0);
    expect(achievements.save.profile.level).toBe(50);
    expect(save.firsts.megaPop).toBe(true);
    expect(baseSave.achievements).toEqual({});
    expect(seedMegaPlainSave(baseSave, new URLSearchParams('debug=1&demo=feel&scene=mega'))).toBe(baseSave);
  });
  it('builds target, held-crossing and completed-mini goal scenes deterministically', () => {
    const base = newGame('classic', 'demo-goals').state;
    const target = createGoalScene(base, 'target'); const hit = createGoalScene(base, 'target-hit'); const done = createGoalScene(base, 'mini-done');
    expect(target.score).toBe(4880); expect(hit.goals?.targetsHit).toBe(1); expect(hit.score).toBeGreaterThan(5000);
    expect(done.goals?.mini).toMatchObject({ id: 'bigpop', progress: 1, done: true });
  });
  it('marks a fresh debug tutorial skipped through the normal save changes only', () => {
    const save = defaultSave(); save.ui.seenTips = ['tutorialStep4Pending', 'tutorialTipPending'];
    const changed = debugTutorialState(save, new URLSearchParams('debug=1'));
    expect(changed.tutorialDone).toBe(true); expect(changed.ui.seenTips).toEqual(['tutorialTipPending']);
    expect(changed.profile).toEqual(save.profile); expect(changed.achievements).toEqual(save.achievements); expect(changed.stats).toEqual(save.stats);
    expect(save.tutorialDone).toBe(false); expect(save.ui.seenTips).toEqual(['tutorialStep4Pending', 'tutorialTipPending']);
    expect(markTutorialSkipped(save)).toEqual(changed);
  });
  it('keeps demo URL saves out of storage, including the debug tutorial shortcut', () => {
    const query = new URLSearchParams('debug=1&demo=adventure-map&frontier=41');
    remove(SAVE_KEY);
    setSaveWritesDisabled(debugSaveWritesDisabled(query, false));
    saveNow(defaultSave());
    expect(read(SAVE_KEY)).toBeNull();
    expect(debugSaveWritesDisabled(new URLSearchParams('debug=1'), false)).toBe(false);
    expect(debugSaveWritesDisabled(new URLSearchParams('demo=adventure-map'), false)).toBe(false);
  });
  it('leaves explicit tutorial runs and saves with an in-progress run unchanged', () => {
    const save = defaultSave();
    expect(debugTutorialState(save, new URLSearchParams('debug=1&tutorial=1'))).toBe(save);
    save.inProgress = newGame('classic', 'debug-saved-run').state;
    expect(debugTutorialState(save, new URLSearchParams('debug=1'))).toBe(save);
  });
});
