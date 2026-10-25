import { describe, expect, it } from 'vitest';
import fixture from './fixtures/save-v1.json';
import { migrate, sanitize } from './migrate';
import { defaultSave, type SaveV2 } from './saveSchema';

describe('save migration', () => {
  it('migrates the pre-release v0 shape through v2', () => { const save = migrate({ best: 234, coins: 19 }); expect(save.v).toBe(2); expect(save.best.classic).toBe(234); expect(save.profile.coins).toBe(19); });
  it('loads and sanitizes the v1 fixture', () => { const save = migrate(fixture); expect(save.createdAt).toBe(123); expect(save.best.classic).toBe(42); expect(save.stats.runs).toEqual({}); });
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
  it('defaults v2 fields and sanitizes Adventure and missions', () => {
    const fresh = defaultSave(); expect(sanitize(fresh)).toEqual(fresh);
    const bad = { ...fresh, adventure: { ...fresh.adventure, frontier: 300, boosters: { moves: 9, shuffle: -1, pop: 3 }, levels: { '0': { stars: 5, wins: 0, losses: 0, lossRun: 0, bestScore: 0 }, '121': { stars: 1, wins: 0, losses: 0, lossRun: 0, bestScore: 0 } } }, missions: { ...fresh.missions, slots: [{ id: 'unknown', pos: 0, progress: 4, claimed: false, issued: '' }] } };
    const clean = sanitize(bad as unknown as SaveV2); expect(clean.adventure.frontier).toBe(121); expect(clean.adventure.boosters).toEqual({ moves: 5, shuffle: 0, pop: 3 }); expect(clean.adventure.levels).toEqual({}); expect(clean.missions.slots).toEqual([]);
  });
});
