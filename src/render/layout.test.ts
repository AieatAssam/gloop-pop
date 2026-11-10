import { describe, expect, it } from 'vitest';
import { MIN_GOAL_BOARD_GAP, TOAST_HEIGHT, computeLayout, portraitTraySlotWidth, toastSpot, type Layout } from './layout';
import { traySlotRect } from './boardView';

describe('responsive layout', () => {
  it.each([[390, 844], [1280, 800], [360, 640], [768, 1024], [844, 390]])('fits %i×%i viewport', (width, height) => {
    const layout = computeLayout(width, height);
    expect(layout.width).toBe(width);
    expect(layout.height).toBe(height);
    expect(layout.board.width).toBe(layout.board.height);
    expect(layout.board.width % 8).toBe(0);
    expect(layout.cellSize).toBe((layout.board.width - (layout.portrait ? 16 : 16 * Math.min(width / 1280, height / 800))) / 8);
    expect(layout.board.x).toBeGreaterThanOrEqual(0);
    expect(layout.board.x + layout.board.width).toBeLessThanOrEqual(width);
  });

  it('uses portrait reference board metrics and splits free vertical space', () => {
    const layout = computeLayout(390, 844);
    expect(layout.portrait).toBe(true);
    expect(layout.board).toEqual({ x: 11, y: 196, width: 368, height: 368 });
    expect(layout.cellSize).toBe(44);
    expect(layout.gaps.a).toBe(26);
    expect(layout.gaps.b).toBe(26);
    expect(layout.gaps.c).toBe(52);
  });

  it('keeps portrait content in a centred column on a sideways phone', () => {
    const layout = computeLayout(844, 390);
    expect(layout.portrait).toBe(true);
    expect(layout.column.x).toBeGreaterThan(0);
    expect(layout.column.x + layout.column.width).toBeLessThan(844);
  });
  it('adds the 30 px goal band without changing layouts that do not use it', () => {
    const withStrip = computeLayout(390, 844, {}, true); const without = computeLayout(390, 844);
    expect(withStrip.goalStrip).toEqual({ x: 0, y: 162.5, width: 390, height: 30 });
    expect(withStrip.board.y).toBe(211);
    expect(without.goalStrip.height).toBe(0);
    expect(computeLayout(412, 915, {}, true).goalStrip.height).toBeCloseTo(32.5, 1);
    expect(computeLayout(1280, 800, {}, true).board).toEqual(computeLayout(1280, 800).board);
  });
  it('keeps the goal band out of the board and tray at short phone and desktop sizes', () => {
    const phone = computeLayout(360, 640, {}, true);
    expect(phone.goalStrip.y + phone.goalStrip.height).toBeLessThanOrEqual(phone.board.y);
    expect(phone.board.y + phone.board.height).toBeLessThanOrEqual(phone.combo.y);
    expect(phone.combo.y + phone.combo.height).toBeLessThanOrEqual(phone.tray.y);
    const desktop = computeLayout(1280, 800, {}, true);
    expect(desktop.goalStrip.x + desktop.goalStrip.width).toBeLessThanOrEqual(desktop.board.x);
    expect(desktop.board.x + desktop.board.width).toBeLessThanOrEqual(desktop.tray.x);
    expect(desktop.goalStrip.y).toBe(desktop.board.y + 400); // under the rescue ring, clear of Stage and Combo
  });
  // spec-note: wide landscape (tablet) viewports keep the SG §15.2 landscape composition; every rect stays on screen.
  it.each([[1280, 800], [1600, 720], [2000, 1200], [2560, 1600], [900, 560]])('keeps every element on screen at %i×%i landscape', (width, height) => {
    const layout = computeLayout(width, height);
    expect(layout.portrait).toBe(false);
    for (const r of [layout.board, layout.score, layout.combo, layout.tray, layout.topBar, layout.bottom]) {
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.x + r.width).toBeLessThanOrEqual(width + 0.5);
      expect(r.y + r.height).toBeLessThanOrEqual(height + 0.5);
    }
    expect(layout.board.x + layout.board.width / 2).toBeCloseTo(width / 2, 0);
  });
  // Round 3: short phones give the board the height the HUD does not need, without overlapping any band.
  const bands = (layout: ReturnType<typeof computeLayout>) => [layout.topBar, layout.score, layout.goalStrip, layout.combo, layout.tray, layout.bottom].filter((r) => r.height > 0);
  it.each([[320, 568, false, 248], [360, 640, false, 304], [360, 760, false, 336], [390, 844, false, 368], [320, 568, true, 224], [360, 640, true, 280]])('gives the board the largest size that fits at %i×%i (daily %s)', (width, height, daily, minBoard) => {
    const layout = computeLayout(width, height, {}, false, daily);
    expect(layout.board.width).toBeGreaterThanOrEqual(minBoard);
    expect(layout.board.width % 8).toBe(0);
    // every band is inside the screen and the stack is ordered top to bottom with no overlap
    expect(layout.topBar.height).toBeGreaterThanOrEqual(52);
    expect(layout.topBar.y + layout.topBar.height).toBeLessThanOrEqual(layout.score.y + 0.01);
    expect(layout.score.y + layout.score.height).toBeLessThanOrEqual(layout.board.y + 0.01);
    expect(layout.board.y + layout.board.height).toBeLessThanOrEqual(layout.combo.y + 0.01);
    expect(layout.combo.y + layout.combo.height).toBeLessThanOrEqual(layout.tray.y + 0.01);
    expect(layout.tray.y + layout.tray.height).toBeLessThanOrEqual(layout.bottom.y + 0.01);
    for (const band of bands(layout)) expect(band.y + band.height).toBeLessThanOrEqual(height + 0.01);
    expect(layout.gaps.a).toBeGreaterThanOrEqual(0);
    expect(layout.gaps.c).toBeGreaterThanOrEqual(0);
    expect(layout.combo.height).toBeGreaterThanOrEqual(40);
  });
  it('keeps the Daily score band tall enough for four rows at short sizes', () => {
    const daily = computeLayout(320, 568, {}, false, true); const classic = computeLayout(320, 568);
    expect(daily.score.height).toBeGreaterThan(classic.score.height);
    expect(daily.score.height).toBeGreaterThanOrEqual(80);
  });
  it('sizes tray slots as large as the column allows (SG §15.3: 112 at 360, 122 at 390, 129 at 412)', () => {
    expect(portraitTraySlotWidth(360)).toBeCloseTo(112, 6);
    expect(portraitTraySlotWidth(390)).toBeCloseTo(122, 6);
    expect(portraitTraySlotWidth(412)).toBeCloseTo(129.33, 1);
  });
  it('keeps a side margin of at least 16 px around the tray on a 600 dp tablet (slots capped at 144 px)', () => {
    const layout = computeLayout(600, 960);
    const first = traySlotRect(0, layout); const last = traySlotRect(2, layout);
    expect(first.x).toBeGreaterThanOrEqual(16);
    expect(last.x + last.width).toBeLessThanOrEqual(600 - 16);
    expect(first.width).toBeLessThanOrEqual(144);
  });
  it('sizes tray slots from the column width, not the height, and keeps them apart', () => {
    for (const [width, height] of [[320, 568], [360, 640], [360, 760], [390, 844]] as const) {
      const layout = computeLayout(width, height);
      const slot = traySlotRect(0, layout); const last = traySlotRect(2, layout);
      expect(slot.width).toBeCloseTo((width - 24) / 3, 6);
      expect(last.x + last.width).toBeLessThanOrEqual(width - 4 + 0.01);
      expect(traySlotRect(1, layout).x).toBeGreaterThanOrEqual(slot.x + slot.width);
      expect(layout.trayCellSize).toBeLessThanOrEqual(26.4);
    }
  });
});

/** Frozen copy of the portrait board and tray maths at commit 080a176 (before the toast lane). Do not change it: it is the floor the current layout must meet. */
function baselinePortrait(width: number, height: number, hasGoal: boolean, daily: boolean): { board: number; gapB: number; trayCell: number } {
  const w = Math.min(width, 600); const h = height;
  const k = Math.min(1.15, Math.max(0.7, h / 844));
  const fixedH = Math.max(52, 60 * k) + (daily ? 116 : 84) * k + (hasGoal ? 30 * k : 0) + Math.max(40, 44 * k) + 168 * k + 16 * k;
  const board = Math.max(24, Math.floor(Math.min(w - 22, 560, h - fixedH) / 8) * 8);
  const leftover = Math.max(0, h - fixedH - board);
  const gapB = hasGoal ? Math.max(leftover * 0.25, Math.min(6, leftover)) : leftover * 0.25;
  const slotWidth = Math.min(122, (w - 8 - 16) / 3);
  return { board, gapB, trayCell: Math.min(26.4, slotWidth / 5.4) };
}

describe('toast lane removed: board and tray never shrink below 080a176 (SG §15.3)', () => {
  const sizes = [[320, 568], [360, 640], [360, 760], [390, 844], [412, 915], [600, 960]] as const;
  it.each(sizes.flatMap(([w, h]) => [false, true].flatMap((goal) => [false, true].map((daily) => [w, h, goal, daily] as const))))('%i×%i goal %s daily %s', (width, height, goal, daily) => {
    const layout = computeLayout(width, height, {}, goal, daily);
    const base = baselinePortrait(width, height, goal, daily);
    expect(layout.board.width).toBeGreaterThanOrEqual(base.board);
    expect(layout.trayCellSize).toBeGreaterThanOrEqual(base.trayCell - 1e-9);
    expect(layout.gaps.b).toBeGreaterThanOrEqual(Math.min(base.gapB, MIN_GOAL_BOARD_GAP) - 1e-9);
  });
  it('keeps the 144 px tablet slot cap and the uncapped phone slots', () => {
    expect(portraitTraySlotWidth(412)).toBeCloseTo(129.33, 1);
    expect(portraitTraySlotWidth(600)).toBe(144);
  });
});

describe('goal strip clearance (SG §15.3, §20.8)', () => {
  it('keeps at least 6 px between the goal pills and the board at every short and tall phone size', () => {
    for (const [width, height] of [[320, 568], [360, 640], [360, 760], [390, 844], [412, 915]] as const) {
      const layout = computeLayout(width, height, {}, true, false);
      const gap = layout.board.y - (layout.goalStrip.y + layout.goalStrip.height);
      expect(gap).toBeGreaterThanOrEqual(Math.min(MIN_GOAL_BOARD_GAP, layout.gaps.b) - 0.01);
      expect(layout.board.width % 8).toBe(0);
    }
  });
});

describe('in-play toast spot (SG §11.8, §15.3)', () => {
  const sizes = [[320, 568], [360, 640], [360, 760], [390, 844], [412, 915], [600, 960]] as const;
  const overlaps = (a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }): boolean =>
    a.width > 0 && a.height > 0 && b.width > 0 && b.height > 0 && a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
  it.each(sizes.flatMap(([w, h]) => [false, true].flatMap((goal) => [false, true].map((daily) => [w, h, goal, daily] as const))))('%i×%i goal %s daily %s: a toast never covers the board, a tray slot or the rescue ring', (width, height, goal, daily) => {
    const layout = computeLayout(width, height, {}, goal, daily);
    const spot = toastSpot(layout);
    const toast = { x: layout.column.x, y: spot.centreY - TOAST_HEIGHT / 2, width: layout.column.width, height: TOAST_HEIGHT };
    expect(overlaps(toast, layout.board)).toBe(false);
    for (let i = 0; i < 3; i++) expect(overlaps(toast, traySlotRect(i, layout))).toBe(false);
    if (spot.region !== 'score') {
      // The rescue ring sits at the right of the combo band; a free-strip toast clears it vertically.
      expect(overlaps({ ...toast, x: layout.board.x + layout.board.width - 40, width: 40 }, { x: layout.board.x + layout.board.width - 38, y: layout.combo.y, width: 32, height: 47 })).toBe(false);
    }
  });
  it('uses a free strip (never the score band) when one is tall enough, and reports the score band otherwise', () => {
    expect(toastSpot(computeLayout(412, 915, {}, true, false)).region).toBe('tray-gap');
    expect(toastSpot(computeLayout(390, 844, {}, false, false)).region).toBe('tray-gap');
    expect(toastSpot(computeLayout(320, 568, {}, true, false)).region).toBe('score');
    expect(toastSpot(computeLayout(600, 960, {}, false, false)).region).toBe('score');
  });
  it('never moves a layout rect: the spot is a pure read', () => {
    const before = computeLayout(360, 760, {}, true, false);
    toastSpot(before);
    expect(computeLayout(360, 760, {}, true, false)).toEqual(before);
  });
});

describe('in-play toast spot without the rescue ring (Adventure moves counter)', () => {
  // The moves counter is centred in the score band: its number sits at 59% of the band height and its label 28 px lower.
  const movesCounter = (layout: Layout) => {
    const centre = layout.score.y + layout.score.height * 0.59;
    return { x: layout.column.x + layout.column.width / 2 - 60, y: centre - 44, width: 120, height: 80 };
  };
  const overlaps = (a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }): boolean =>
    a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
  it.each([[320, 568], [360, 640], [360, 760], [412, 915]] as const)('%i×%i: the toast clears the moves counter and the board and tray', (width, height) => {
    const layout = computeLayout(width, height, {}, true, false);
    const spot = toastSpot(layout, false);
    expect(spot.region).not.toBe('score');
    const toast = { x: layout.column.x, y: spot.centreY - TOAST_HEIGHT / 2, width: layout.column.width, height: TOAST_HEIGHT };
    expect(overlaps(toast, movesCounter(layout))).toBe(false);
    expect(overlaps(toast, layout.board)).toBe(false);
    for (let i = 0; i < 3; i++) expect(overlaps(toast, traySlotRect(i, layout))).toBe(false);
  });
});
