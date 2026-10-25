import { describe, expect, it } from 'vitest';
import { defaultSave } from './saveSchema';
import { streakMilestone, updateStreak } from './streak';

describe('streak', () => {
  it('increments consecutive days, awards capped freezes and spends a freeze for a gap', () => {
    const first = defaultSave(); first.streak.current = 6; first.streak.lastDay = '2026-10-30';
    const seventh = updateStreak(first, '2026-10-31').save;
    expect(seventh.streak.current).toBe(7); expect(seventh.streak.freezes).toBe(1);
    const recovered = updateStreak(seventh, '2026-11-02');
    expect(recovered.freezeUsed).toBe(1); expect(recovered.save.streak.current).toBe(8);
  });
  it('recognizes celebration days', () => { expect([3,7,14,30,50,100].every(streakMilestone)).toBe(true); });
  it('ends an uncovered gap without spending a freeze', () => {
    const save = defaultSave(); save.streak.current = 4; save.streak.lastDay = '2026-10-25';
    const result = updateStreak(save, '2026-10-28');
    expect(result.endedAt).toBe(4); expect(result.freezeUsed).toBe(0); expect(result.save.streak.current).toBe(1);
  });
});
