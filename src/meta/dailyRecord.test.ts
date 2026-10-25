import { describe, expect, it } from 'vitest';
import { defaultSave } from './saveSchema';
import { dailyResult, recordDaily } from './dailyRecord';
import { newGame } from '../core/game';

describe('daily record', () => {
  it('records a counted result once and returns a copy', () => {
    const state = newGame('daily', '2026-10-25').state;
    const first = recordDaily(defaultSave(), state, '2026-10-25', []);
    const second = recordDaily(first, state, '2026-10-25', []);
    expect(dailyResult(second, '2026-10-25')?.score).toBe(0);
    expect(second.daily.finished).toBe(1);
  });
});
