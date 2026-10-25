import type { GameEvent } from '../core/types';

export type PopTier = 'lines' | 'big' | 'huge' | 'mega';
export interface PlannedPop { readonly size: number; readonly cells: readonly number[]; readonly tier: PopTier; }
export interface MovePlan {
  readonly placeCells: number;
  readonly lines: number;
  readonly combo: number;
  readonly tier: number;
  readonly pops: readonly PlannedPop[];
  readonly popOrder: readonly { readonly group: number; readonly cell: number; readonly index: number }[];
  readonly largestPop: number;
  readonly stinger: 'allClear' | 'mega' | 'newBest' | undefined;
  readonly comboLost: boolean;
  readonly stageUp: boolean;
  readonly rescueReady: boolean;
  readonly stuck: boolean;
}
export interface MovePlanContext { readonly combo?: number; readonly tier?: number; readonly newBest?: boolean; }

/** Build the complete cue schedule at reducer time; frame handlers only release its cues. */
export function planMove(events: readonly GameEvent[], ctx: MovePlanContext = {}): MovePlan {
  const placed = events.find((event) => event.type === 'placed');
  const cleared = events.find((event) => event.type === 'cleared');
  const popped = events.find((event) => event.type === 'popped');
  const scored = events.find((event) => event.type === 'scored');
  const comboUp = events.find((event) => event.type === 'comboUp');
  const lines = cleared?.type === 'cleared' ? cleared.rows.length + cleared.cols.length : 0;
  const pops = popped?.type === 'popped' ? popped.gloops.map((gloop): PlannedPop => ({
    size: gloop.size,
    cells: [...(gloop.bfs?.length ? gloop.bfs : gloop.cells)],
    tier: gloop.size >= 24 ? 'mega' : gloop.size >= 15 ? 'huge' : gloop.size >= 8 ? 'big' : 'lines',
  })) : [];
  const largestPop = Math.max(0, ...pops.map((pop) => pop.size));
  const allClear = events.some((event) => event.type === 'allClear');
  // SG §13.4: schedule no more than 14 voices from a 28-cell gloop, with one skipped burst between voices.
  const popOrder: { group: number; cell: number; index: number }[] = [];
  let index = 0;
  pops.forEach((pop, group) => pop.cells.forEach((cell) => { if (index % 2 === 0) popOrder.push({ group, cell, index }); index += 1; }));
  return {
    placeCells: placed?.type === 'placed' ? placed.cells.length : 0,
    lines,
    combo: scored?.type === 'scored' ? scored.combo : comboUp?.type === 'comboUp' ? comboUp.combo : ctx.combo ?? 1,
    tier: comboUp?.type === 'comboUp' ? comboUp.tier : ctx.tier ?? 0,
    pops, popOrder, largestPop,
    stinger: allClear ? 'allClear' : largestPop >= 24 ? 'mega' : ctx.newBest ? 'newBest' : undefined,
    comboLost: events.some((event) => event.type === 'comboLost'),
    stageUp: events.some((event) => event.type === 'stageUp'),
    rescueReady: events.some((event) => event.type === 'rescueReady'),
    stuck: events.some((event) => event.type === 'stuck'),
  };
}
