import { describe, expect, it } from 'vitest';
import { burstCallbackStart, comboEscalation, comboTier, createDirector, lineCueSchedule, waveStep } from './director';

describe('M10.1 effect reset', () => {
  it('clears active visual effects and shake immediately on restart', () => {
    const director = createDirector(); director.receive([{ type: 'stuck', unfit: [] }], 0);
    expect(director.shakeOffset().x).not.toBe(0);
    director.reset();
    expect(director.shakeOffset()).toEqual({ x: 0, y: 0, roll: 0 });
  });
});

describe('SG §9.13.g pop wave', () => {
  it('fits large gloops inside the 330 ms wave window and keeps small steps at 38 ms', () => {
    expect(waveStep(27)).toBe(330 / 27);
    expect((27 - 1) * waveStep(27)).toBeLessThanOrEqual(330);
    expect(waveStep(3)).toBe(38);
  });
});

describe('SG §9.13.f impact schedule', () => {
  it('keeps B cue times independent of hitstop duration', () => {
    const cue = lineCueSchedule(0, 0, 0);
    expect(cue.impactAt).toBe(60); expect(cue.flashAt).toBe(60); expect(cue.sweepAt).toBe(60); expect(cue.burstAt).toBe(90);
    expect(lineCueSchedule(0, 0, 7).squashAt).toBe(256);
  });
  it('arms a reduced-motion-free line freeze at F through director.receive', () => {
    const director = createDirector(); const scheduled: number[] = [];
    director.receive([
      { type: 'placed', slot: 0, piece: { defId: 1, flavour: 1 }, cells: [0], mergedInto: [] },
      { type: 'cleared', rows: [0], cols: [], cells: [0, 1, 2, 3, 4, 5, 6, 7], flavoursByCell: [1, 1, 1, 1, 1, 1, 1, 1] },
    ], 0, false, undefined, undefined, 0, (at, duration) => { scheduled.push(at, duration); });
    expect(scheduled).toEqual([60, 50]);
  });
  it('requests no hitstop in reduced motion', () => {
    const director = createDirector(); const scheduled: number[] = [];
    director.receive([{ type: 'cleared', rows: [0], cols: [], cells: [0, 1, 2, 3, 4, 5, 6, 7], flavoursByCell: [1, 1, 1, 1, 1, 1, 1, 1] }], 0, true, undefined, undefined, 0, (_at, duration) => scheduled.push(duration));
    expect(scheduled).toEqual([0]);
  });
});

describe('SG §13.10 reduced-motion audio callbacks', () => {
  it('fires burst callbacks at their visual burst frame in either motion mode', () => {
    const normalPopAt = 90; const reducedPopAt = 150;
    expect(burstCallbackStart(0, normalPopAt, false) + 70).toBe(normalPopAt);
    expect(burstCallbackStart(0, reducedPopAt, true) + 70).toBe(reducedPopAt);
  });
});

describe('SG §9.13.h combo escalation', () => {
  it('maps combo lengths to tier values and scales the specified effects', () => {
    expect([comboTier(2), comboTier(3), comboTier(5), comboTier(8), comboTier(12)]).toEqual([0, 1, 2, 3, 4]);
    expect(comboEscalation(2).trauma).toBe(0.1); expect(comboEscalation(2).kick).toBe(1.2); expect(comboEscalation(2).particles).toBe(1.75); expect(comboEscalation(2).sweepStep).toBeCloseTo(28 / 1.2);
    expect(comboEscalation(4).sweepStep).toBe(20);
  });
});
