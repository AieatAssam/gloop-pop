import { describe, expect, it } from 'vitest';
import { cyrb128 } from './hash';
import { createDailyDeal, dayKeyFromMs, dayNumber, flavourForDay, msToNextUtcMidnight, seedStringForDay } from './daily';

describe('daily UTC helpers', () => {
  it('uses the updated launch epoch and clamps earlier dates', () => {
    expect(dayNumber('2026-10-25')).toBe(1); expect(dayNumber('2026-11-24')).toBe(31); expect(dayNumber('2026-10-24')).toBe(1);
  });
  it('extracts UTC date parts near midnight from UTC-14 to UTC+14', () => {
    expect(dayKeyFromMs(1_792_972_799_000)).toBe('2026-10-25');
    expect(dayKeyFromMs(1_792_972_801_000)).toBe('2026-10-26');
    expect(dayNumber(dayKeyFromMs(1_792_886_400_000))).toBe(1);
    expect(dayNumber(dayKeyFromMs(1_792_886_399_000))).toBe(1);
  });
  it('counts to the next midnight and formats the seed namespace', () => {
    expect(msToNextUtcMidnight(1_792_972_799_000)).toBe(1000);
    expect(seedStringForDay('2026-11-01')).toBe('gloop-pop/daily/v1/2026-11-01');
    expect(flavourForDay('2026-11-01')).toBe(flavourForDay('2026-11-01'));
  });
  it('pins the 2026-11-01 board and first three trays', () => {
    const deal = createDailyDeal('2026-11-01');
    expect({ board: deal.board, trays: deal.trays.slice(0, 3), flavour: deal.flavourOfDay }).toEqual({
      board: [3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,0,0,4,4,0,0,0,0],
      trays: [[{ defId: 10, flavour: 5 },{ defId: 26, flavour: 5 },{ defId: 13, flavour: 3 }],[{ defId: 20, flavour: 1 },{ defId: 32, flavour: 6 },{ defId: 16, flavour: 6 }],[{ defId: 6, flavour: 2 },{ defId: 34, flavour: 2 },{ defId: 9, flavour: 6 }]],
      flavour: 2,
    });
    expect(deal.board.filter((cell) => cell !== 0).length).toBeGreaterThanOrEqual(8);
    expect(deal.board.filter((cell) => cell !== 0).length).toBeLessThanOrEqual(16);
    expect(deal.trays).toHaveLength(30);
  });
  it('produces byte-identical deals for 400 days (golden captured before the Classic balance pass)', () => {
    const lines: string[] = [];
    for (let day = 0; day < 400; day += 1) {
      const key = dayKeyFromMs(1_792_886_400_000 + day * 86_400_000);
      lines.push(`${key} ${JSON.stringify(createDailyDeal(key))}`);
    }
    expect(lines[0]?.slice(0, 112)).toBe('2026-10-25 {"board":[2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,3,0,0,0,0,0,5,5,3,0,0,0,0,0,0,0,3,0,0,0,1,1,0,0,0');
    expect(cyrb128(lines.join('\n'))).toEqual([4097234419, 1309468576, 1419882381, 2336083159]);
  });
});
