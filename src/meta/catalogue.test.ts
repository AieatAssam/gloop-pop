import { describe, expect, it } from 'vitest';
import { CATALOGUE } from './catalogue';

describe('catalogue', () => {
  it('contains every themed item with the specified total shop prices', () => {
    expect(CATALOGUE).toHaveLength(24); expect(CATALOGUE.reduce((sum, item) => sum + item.price, 0)).toBe(16_000);
    expect(CATALOGUE.filter((item) => item.id.startsWith('gold'))).toEqual([
      { kind: 'pop', id: 'goldsparkles', price: 1500 }, { kind: 'pop', id: 'goldstars', price: 2000 }, { kind: 'pop', id: 'goldconfetti', price: 2500 },
    ]);
    expect(CATALOGUE.find((item) => item.id === 'snowglobe')?.level).toBe(20);
    expect(CATALOGUE.find((item) => item.id === 'crown')?.achievement).toBe('mega_pop');
  });
});

import { buyItem, equipItem, requirement } from './catalogue';
import { defaultSave } from './saveSchema';

describe('collection purchases and equipment', () => {
  it('deducts coins once, refuses overspending, and equips owned items', () => {
    const save = defaultSave(); save.profile.coins = 600;
    const bought = buyItem(save, 'theme', 'sunset'); expect(bought.ok).toBe(true); expect(bought.save.profile.coins).toBe(0);
    expect(buyItem(bought.save, 'theme', 'sunset').ok).toBe(false);
    expect(buyItem(save, 'theme', 'aquarium').ok).toBe(false);
    expect(equipItem(bought.save, 'theme', 'sunset').equipped.theme).toBe('sunset');
    expect(equipItem(save, 'theme', 'sunset')).toBe(save);
  });
  it('reports level and achievement requirements', () => {
    const save = defaultSave();
    expect(requirement(CATALOGUE.find((item) => item.id === 'snowglobe')!, save)).toEqual({ kind: 'level', level: 20 });
    expect(requirement(CATALOGUE.find((item) => item.id === 'crown')!, save)).toEqual({ kind: 'achievement', achievement: 'mega_pop' });
    save.profile.level = 20; expect(requirement(CATALOGUE.find((item) => item.id === 'snowglobe')!, save)).toBeNull();
  });
  it('refuses an unaffordable Gold effect without changing the save', () => {
    const save = defaultSave(); save.profile.coins = 1499;
    expect(buyItem(save, 'pop', 'goldsparkles')).toEqual({ save, ok: false });
  });
});
