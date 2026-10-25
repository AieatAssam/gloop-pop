import { describe, expect, it } from 'vitest';
import fixture from './fixtures/save-v1.json';
import { migrate } from './migrate';

describe('save migration', () => {
  it('migrates the pre-release v0 shape', () => { const save = migrate({ best: 234, coins: 19 }); expect(save.best.classic).toBe(234); expect(save.profile.coins).toBe(19); });
  it('loads and sanitizes the v1 fixture', () => { const save = migrate(fixture); expect(save.createdAt).toBe(123); expect(save.best.classic).toBe(42); expect(save.stats.runs).toEqual({}); });
  it('defaults and clamps persisted audio volume settings', () => {
    expect(migrate(fixture).settings).toMatchObject({ sfxVolume: 1, musicVolume: 1 });
    expect(migrate({ ...fixture, settings: { ...fixture.settings, sfxVolume: -1, musicVolume: 3 } }).settings).toMatchObject({ sfxVolume: 0, musicVolume: 1 });
  });
  it('drops an invalid in-progress board and unknown equipped item', () => { const save = migrate({ ...fixture, inProgress: { board: [9], tray: [] }, equipped: { theme: 'unknown', skin: 'bad', pop: 'bad' } }); expect(save.inProgress).toBeNull(); expect(save.equipped.theme).toBe('midnight'); });
  it('starts fresh on an unknown future version', () => { expect(migrate({ v: 200, best: 100 }).best.classic).toBe(0); });
});
