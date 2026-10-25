import { describe, expect, it } from 'vitest';
import fixture from './fixtures/save-v1.json';
import veteran from './fixtures/save-v1-veteran.json';
import veteranExpected from './fixtures/save-v2-veteran.expected.json';
import { migrate, sanitize } from './migrate';
import { defaultSave, type SaveV2 } from './saveSchema';
import { step } from '../core/game';
import { newGame } from '../core/game';

describe('save migration', () => {
  it('migrates the pre-release v0 shape through v2', () => { const save = migrate({ best: 234, coins: 19 }); expect(save.v).toBe(2); expect(save.best.classic).toBe(234); expect(save.profile.coins).toBe(19); });
  it('loads the level 1 fixture without granting Adventure', () => { const save = migrate(fixture); expect(save.createdAt).toBe(123); expect(save.best.classic).toBe(42); expect(save.stats.runs).toEqual({}); expect(save.owned.modes).not.toContain('adventure'); expect(save.adventure.boosters).toEqual({ moves: 0, shuffle: 0, pop: 0 }); });
  it('migrates the veteran fixture to the exact pinned v2 save', () => {
    const save = migrate(veteran);
    expect(save).toEqual(veteranExpected);
    expect(save.profile).toMatchObject({ level: 23, xp: 11030, coins: 4310 });
    expect(save.owned.modes).toContain('adventure');
    expect(save.adventure.boosters).toEqual({ moves: 1, shuffle: 1, pop: 1 });
    expect(save.streak).toMatchObject({ current: 12, freezes: 1, frozenDays: ['2026-10-20', '2026-10-21', '2026-10-22'] });
    expect(save.weekly.progress).toBe(87); expect(Object.keys(save.daily.records)).toHaveLength(14); expect(save.recentClassic).toHaveLength(20);
    expect(save.firsts).toEqual({ line: true, double: true, bigPop: true, allClear: true, combo5: true });
    expect(save.settings).toMatchObject({ sfxVolume: 0.6, musicVolume: 0.3, cbPatterns: true });
  });
  it('preserves veteran run continuation over five placements', () => {
    const before = (veteran as unknown as { inProgress: NonNullable<SaveV2['inProgress']> }).inProgress;
    const after = migrate(veteran).inProgress!;
    const actions = [
      { type: 'place', slot: 0, row: 0, col: 0 }, { type: 'place', slot: 1, row: 0, col: 4 },
      { type: 'place', slot: 2, row: 3, col: 0 }, { type: 'place', slot: 0, row: 3, col: 4 },
      { type: 'place', slot: 1, row: 6, col: 0 },
    ] as const;
    let oldState = before; let newState = after;
    for (const action of actions) {
      const oldStep = step(oldState, action); const newStep = step(newState, action);
      expect(oldStep.events.some((event) => event.type === 'placed')).toBe(true);
      expect(newStep.events).toEqual(oldStep.events); expect(newStep.state).toEqual(oldStep.state);
      oldState = oldStep.state; newState = newStep.state;
    }
  });
  it('defaults and clamps persisted audio volume settings', () => {
    expect(migrate(fixture).settings).toMatchObject({ sfxVolume: 1, musicVolume: 1 });
    expect(migrate({ ...fixture, settings: { ...fixture.settings, sfxVolume: -1, musicVolume: 3 } }).settings).toMatchObject({ sfxVolume: 0, musicVolume: 1 });
  });
  it('drops an invalid in-progress board and unknown equipped item', () => { const save = migrate({ ...fixture, inProgress: { board: [9], tray: [] }, equipped: { theme: 'unknown', skin: 'bad', pop: 'bad' } }); expect(save.inProgress).toBeNull(); expect(save.equipped.theme).toBe('midnight'); });
  it('starts fresh on an unknown future version', () => { expect(migrate({ v: 200, best: 100 }).best.classic).toBe(0); });
  it('migrates v1 fields and grants the level 2 Adventure gift', () => {
    const v1 = { ...fixture, profile: { xp: 1200, level: 2, stars: 0, coins: 40, coinsEarned: 40 }, v: 1 };
    const save = migrate(v1);
    expect(save.v).toBe(2); expect(save.best).toEqual({ classic: 42, expert: 0 }); expect(save.owned.modes).toContain('adventure');
    expect(save.adventure.boosters).toEqual({ moves: 1, shuffle: 1, pop: 1 }); expect(save.missions.slots).toEqual([]);
  });
  it('is idempotent for both v1 fixtures, defaults, and v0', () => {
    for (const value of [fixture, veteran, defaultSave(), { best: 900, coins: 40 }]) expect(migrate(migrate(value))).toEqual(migrate(value));
  });
  it('defaults v2 fields and sanitizes Adventure and missions', () => {
    const fresh = defaultSave(); expect(sanitize(fresh)).toEqual(fresh);
    const bad = { ...fresh, adventure: { ...fresh.adventure, frontier: 300, boosters: { moves: 9, shuffle: -1, pop: 3 }, levels: { '0': { stars: 5, wins: 0, losses: 0, lossRun: 0, bestScore: 0 }, '121': { stars: 1, wins: 0, losses: 0, lossRun: 0, bestScore: 0 } } }, missions: { ...fresh.missions, slots: [{ id: 'unknown', pos: 0, progress: 4, claimed: false, issued: '' }] } };
    const clean = sanitize(bad as unknown as SaveV2); expect(clean.adventure.frontier).toBe(121); expect(clean.adventure.boosters).toEqual({ moves: 5, shuffle: 0, pop: 3 }); expect(clean.adventure.levels).toEqual({}); expect(clean.missions.slots).toEqual([]);
  });
  it('keeps mission slot positions when sanitizing a dropped middle slot', () => {
    const save = defaultSave();
    const dirty = { ...save, missions: { ...save.missions, slots: [
      { id: 'lines15', pos: 0, progress: 1, claimed: false, issued: '' },
      { id: 'unknown', pos: 1, progress: 0, claimed: false, issued: '' },
      { id: 'lines80', pos: 2, progress: 8, claimed: false, issued: '' },
    ] } } as SaveV2;
    const clean = sanitize(dirty);
    expect(clean.missions.slots).toHaveLength(3);
    expect(clean.missions.slots[0]?.id).toBe('lines15'); expect(clean.missions.slots[1]).toBeUndefined(); expect(clean.missions.slots[2]?.id).toBe('lines80');
  });
  it('applies the v2 clamps and board-mode validation from design §24.14', () => {
    const fresh = defaultSave();
    const savedAttempt = { ...migrate({ ...fixture, profile: { ...fixture.profile, level: 23 } }).inProgress!, mode: 'adventure' as const, adventure: { level: 1 } };
    const dirty = { ...fresh, missions: { ...fresh.missions, slots: [
      { id: 'lines15', pos: 0, progress: -4, claimed: false, issued: 'today' }, { id: 'pieces40', pos: 1, progress: 999, claimed: false, issued: 'today' },
    ] }, inProgress: { ...fresh.inProgress, v: 1, mode: 'classic', board: Array.from({ length: 64 }, (_, index): number => index === 0 ? 8 : 0), tray: [null, null, null] }, adventure: { ...fresh.adventure, frontier: 1, levels: { '9': { stars: 5, wins: 2, losses: 0, lossRun: 0, bestScore: 8 } }, inProgress: { ...savedAttempt, board: Array.from({ length: 64 }, (_, index): number => index === 0 ? 10 : 0), tray: [null, null, null] } } } as unknown as SaveV2;
    const clean = sanitize(dirty); expect(clean.adventure.levels['9']?.stars).toBe(3); expect(clean.adventure.frontier).toBe(10);
    expect(clean.missions.slots.map((slot) => slot.progress)).toEqual([0, 40]); expect(clean.inProgress).toBeNull(); expect(clean.adventure.inProgress).toBeNull();
    expect(sanitize({ ...dirty, inProgress: { ...dirty.inProgress!, mode: 'adventure', board: Array.from({ length: 64 }, (_, index): number => index === 0 ? 8 : 0) } }).inProgress?.board[0]).toBe(8);
  });
  it('retains in-run target and mini progress through save sanitization', () => {
    const run = newGame('classic', 'goal-save', { goals: true, best: 40000 }).state;
    if (run.goals) { run.goals.targetsHit = 3; run.goals.mini.progress = 1; }
    const save = defaultSave(); save.inProgress = run;
    expect(sanitize(save).inProgress?.goals).toEqual(run.goals);
  });
});
