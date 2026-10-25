import { afterEach, describe, expect, it, vi } from 'vitest';
import { onClimax, onImpact, playGameEvents, sfx } from './index';
import { planMove } from './movePlan';
import type { GameEvent } from '../core/types';

const clearEvents: GameEvent[] = [
  { type: 'placed', slot: 0, piece: { defId: 0, flavour: 1 }, cells: [7], mergedInto: [] },
  { type: 'cleared', rows: [0], cols: [], cells: [0, 1, 2, 3, 4, 5, 6, 7], flavoursByCell: Array(8).fill(1) },
  { type: 'scored', points: 100, parts: { place: 1, lineBase: 100, pop: 0, bigPopBonus: 0, allClear: 0 }, combo: 4, mult: 1 },
  { type: 'comboUp', combo: 4, tier: 1 },
];

afterEach(() => vi.restoreAllMocks());

describe('SG §13.3 and §13.4 move audio plan', () => {
  it('holds lineClear until impact and plays it once with the post-move combo', () => {
    const line = vi.spyOn(sfx, 'lineClear').mockImplementation(() => undefined);
    const plan = planMove(clearEvents);
    playGameEvents(clearEvents);
    expect(line).not.toHaveBeenCalled();
    onImpact(plan);
    expect(line).toHaveBeenCalledTimes(1);
    expect(line).toHaveBeenCalledWith({ combo: 4, lines: 1, tier: 1 });
  });

  it('routes tier-two combo harmony and sparkle from the planned line clear', () => {
    const harmony = vi.spyOn(sfx, 'comboHarmony').mockImplementation(() => undefined);
    const sparkle = vi.spyOn(sfx, 'sparkle').mockImplementation(() => undefined);
    const events = clearEvents.map((event): GameEvent => event.type === 'cleared' ? { ...event, rows: [0, 1] } : event.type === 'scored' ? { ...event, combo: 5 } : event.type === 'comboUp' ? { ...event, combo: 5, tier: 2 } : event);
    onImpact(planMove(events));
    expect(harmony).toHaveBeenCalledTimes(1);
    expect(sparkle).toHaveBeenCalledTimes(1);
  });

  it('does not play newBest at input and gives All Clear stinger priority', () => {
    const best = vi.spyOn(sfx, 'newBest').mockImplementation(() => undefined);
    const allClear = vi.spyOn(sfx, 'allClearStinger').mockImplementation(() => undefined);
    const events: GameEvent[] = [...clearEvents, { type: 'allClear' }];
    const plan = planMove(events, { newBest: true });
    playGameEvents(events, { newBest: true });
    expect(best).not.toHaveBeenCalled();
    expect(plan.stinger).toBe('allClear');
    onClimax(plan, 'allClear');
    expect(allClear).toHaveBeenCalledTimes(1);
    expect(best).not.toHaveBeenCalled();
  });

  it('routes rescue, level-up and achievement events to their v2 cues', async () => {
    const { playForEvents } = await import('./index');
    const ready = vi.spyOn(sfx, 'rescueReady').mockImplementation(() => undefined);
    const rescued = vi.spyOn(sfx, 'rescue').mockImplementation(() => undefined);
    const level = vi.spyOn(sfx, 'levelUp').mockImplementation(() => undefined);
    const achievement = vi.spyOn(sfx, 'achievement').mockImplementation(() => undefined);
    playForEvents([{ type: 'rescueReady' }, { type: 'rescued', poppedCells: [] }], { levelUp: true, achievement: true });
    expect(ready).toHaveBeenCalledTimes(1); expect(rescued).toHaveBeenCalledTimes(1);
    expect(level).toHaveBeenCalledTimes(1); expect(achievement).toHaveBeenCalledTimes(1);
  });

  it('keeps a Mega Pop burst plan within the voice cap and separates scheduled bursts', () => {
    const cells = Array.from({ length: 28 }, (_, index) => index);
    const plan = planMove([{ type: 'popped', gloops: [{ flavour: 1, size: 28, cells, bfs: cells }] }]);
    expect(plan.popOrder).toHaveLength(14);
    expect(plan.popOrder.every((burst, index) => index === 0 || burst.index - plan.popOrder[index - 1]!.index >= 2)).toBe(true);
    expect(plan.stinger).toBe('mega');
  });
});
