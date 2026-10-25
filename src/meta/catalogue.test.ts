import { describe, expect, it } from 'vitest';
import { CATALOGUE } from './catalogue';

describe('catalogue', () => {
  it('contains every themed item with the specified total shop prices', () => {
    expect(CATALOGUE).toHaveLength(21); expect(CATALOGUE.reduce((sum, item) => sum + item.price, 0)).toBe(10_000);
    expect(CATALOGUE.find((item) => item.id === 'snowglobe')?.level).toBe(20);
    expect(CATALOGUE.find((item) => item.id === 'crown')?.achievement).toBe('mega_pop');
  });
});
