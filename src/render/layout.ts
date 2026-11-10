// SG §15.3: one responsive layout drives canvas drawing and future DOM HUD placement.
export interface Rect { x: number; y: number; width: number; height: number }

export interface Layout {
  width: number;
  height: number;
  portrait: boolean;
  column: Rect;
  topBar: Rect;
  score: Rect;
  goalStrip: Rect;
  board: Rect;
  combo: Rect;
  tray: Rect;
  bottom: Rect;
  cellSize: number;
  trayCellSize: number;
  gaps: { a: number; b: number; c: number };
}

export interface SafeInsets { top?: number; bottom?: number }

export function computeLayout(width: number, height: number, safe: SafeInsets = {}, hasGoalStrip = false, daily = false): Layout {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const safeTop = Math.max(0, safe.top ?? 0);
  const safeBottom = Math.max(0, safe.bottom ?? 0);
  const portrait = h / w >= 1.25;
  if (!portrait && w < 900) {
    // SG §15.3: sideways phones use a portrait composition in a centred column.
    const columnWidth = Math.min(w, h * 0.62);
    const left = (w - columnWidth) / 2;
    const inner = computePortrait(columnWidth, h, safeTop, safeBottom, hasGoalStrip, daily);
    return shiftLayout(inner, left, { x: left, y: 0, width: columnWidth, height: h });
  }
  if (portrait) {
    const columnWidth = w > 600 ? 600 : w;
    const left = (w - columnWidth) / 2;
    const result = computePortrait(columnWidth, h, safeTop, safeBottom, hasGoalStrip, daily);
    return shiftLayout(result, left, { x: left, y: 0, width: columnWidth, height: h });
  }
  return computeLandscape(w, h, safeTop, safeBottom, hasGoalStrip);
}

// spec-note: The HUD bands scale with k = clamp(H / 844, 0.7, 1.15). The floor used to be 0.78, which made the bands too tall on 320x568 and 360x640 and left the board 24 px short. The top band never drops below 52 px, so the 44 px icon buttons and the 48 px tutorial Skip button stay inside it, and the combo band never drops below 40 px so the rescue ring clears the tray.
// spec-note: The Daily score band is taller (116 instead of 84 at k = 1) so the score, Best, Tray and Apple pops lines each get their own row. The board gives up the difference only on short phones.
/** SG §15.3: minimum clear space between the goal pills and the board frame. */
export const MIN_GOAL_BOARD_GAP = 6;
export const PORTRAIT_TRAY_MARGIN = 4;
export const PORTRAIT_TRAY_GAP = 8;
/** SG §15.3 tray slot width: three slots fill the column minus 4 px outer margins and 8 px gaps, so slots are as large as the column allows (112 at 360 wide, 122 at the 390 reference, 129 at 412). Never scaled by height. */
// spec-note: The old 122 px cap left 7 px of unused width per slot on 412 px phones. The uncapped formula is the one the layout maths gives, so the cap is removed; the piece scale still caps at 26.4 px per cell.
// spec-note: Capped at 144 px so a 600 dp tablet keeps 76 px side margins. Without the cap the slots ran to within 4 dp of the screen edges (the piece scale is unchanged: 144 / 5.4 is above the 26.4 cap).
export const PORTRAIT_TRAY_SLOT_MAX = 144;
export function portraitTraySlotWidth(columnWidth: number): number { return Math.min(PORTRAIT_TRAY_SLOT_MAX, (columnWidth - PORTRAIT_TRAY_MARGIN * 2 - PORTRAIT_TRAY_GAP * 2) / 3); }

/** SG §11.8: an in-play toast is at least this tall (its min-height in CSS). */
export const TOAST_HEIGHT = 40;
/** The rescue ring reaches 47 px below the top of the combo band (16 px radius, 7 px ticks, 8 % pulse). Gaps under the combo band start below it. */
const RESCUE_RING_BOTTOM = 47;

/** Where an in-play toast sits. It is an overlay: it never changes any rect in the layout. */
export interface ToastSpot {
  /** Which free space the toast uses: the gap under the combo band, the gap above the score band, or the score band (no free space fits). */
  region: 'tray-gap' | 'top-gap' | 'score' | 'landscape';
  /** Centre y of the toast, CSS px. */
  centreY: number;
}

/**
 * spec-note: The in-play toast is an overlay, so it reserves no layout space (round 13 removed the 40 px lane that had cost the board and tray). It sits in the first free strip that is at least TOAST_HEIGHT tall, checked in this order:
 *   1. tray-gap: from below the rescue ring to the top of the first tray slot (gap C plus the 4 px tray margin). Free of every drawn item.
 *   2. top-gap: from the bottom of the top bar to the top of the score band (gap A). Free of every drawn item.
 *   3. score: no strip fits on 320x568, 360x640, 360x760 with a goal strip, and the tablet. The toast then covers the score band's centre for its short life. The top bar is not used: its only wide middle holds the Daily pill, which is a button and must never be covered.
 * Landscape keeps its old placement (24 px below the board top).
 * spec-note: Only Classic draws the rescue ring. In other modes the combo band is free below the ring line, so the first strip starts at the combo band top. That keeps the toast off the Adventure moves counter (score band) at 320x568, 360x760 and 412x915.
 */
export function toastSpot(layout: Layout, rescueRing = true): ToastSpot {
  if (!layout.portrait) return { region: 'landscape', centreY: layout.board.y + 24 };
  const trayGapTop = layout.combo.y + (rescueRing ? RESCUE_RING_BOTTOM : 0);
  const trayGapBottom = layout.tray.y + PORTRAIT_TRAY_MARGIN;
  if (trayGapBottom - trayGapTop >= TOAST_HEIGHT) return { region: 'tray-gap', centreY: (trayGapTop + trayGapBottom) / 2 };
  const topGapTop = layout.topBar.y + layout.topBar.height;
  const topGapBottom = layout.score.y;
  if (topGapBottom - topGapTop >= TOAST_HEIGHT) return { region: 'top-gap', centreY: (topGapTop + topGapBottom) / 2 };
  return { region: 'score', centreY: layout.score.y + layout.score.height / 2 };
}

function computePortrait(w: number, h: number, safeTop: number, safeBottom: number, hasGoalStrip: boolean, daily: boolean): Layout {
  const k = clamp(h / 844, 0.7, 1.15);
  const topH = Math.max(52, 60 * k) + safeTop;
  const scoreH = (daily ? 116 : 84) * k;
  const comboH = Math.max(40, 44 * k);
  const trayH = 168 * k;
  const bottomH = 16 * k + safeBottom;
  const goalH = hasGoalStrip ? 30 * k : 0;
  const fixedH = topH + scoreH + goalH + comboH + trayH + bottomH;
  const boardRaw = Math.min(w - 22, 560, h - fixedH);
  // spec-note: A transient tiny height during a WebView resize used to give a board of 8 px and a negative cell size, which made roundRect throw and froze the render loop. The board never drops below 24 px, so cells stay at least 1 px.
  const boardSize = Math.max(24, Math.floor(boardRaw / 8) * 8);
  const cellSize = (boardSize - 16) / 8;
  const boardX = (w - boardSize) / 2;
  const used = fixedH + boardSize;
  const leftover = Math.max(0, h - used);
  // spec-note: With a goal strip, gap B is 6 px whenever the leftover space allows it. The board is never shrunk to make room (round 12 took a board step on 320x568 and 360x640, which cost 8 to 40 px). On 320x568 with a goal strip the leftover is about 3 px, so gap B is that smaller value.
  const gapB = hasGoalStrip ? Math.max(leftover * 0.25, Math.min(MIN_GOAL_BOARD_GAP, leftover)) : leftover * 0.25;
  const others = leftover - gapB;
  const gapA = others / 3;
  const gapC = others * 2 / 3;
  const scoreY = topH + gapA;
  const goalY = scoreY + scoreH;
  const boardY = goalY + goalH + gapB;
  const comboY = boardY + boardSize;
  const trayY = comboY + comboH + gapC;
  return {
    width: w, height: h, portrait: true,
    column: { x: 0, y: 0, width: w, height: h },
    topBar: rect(0, 0, w, topH), score: rect(0, scoreY, w, scoreH), goalStrip: rect(0, goalY, w, goalH),
    board: rect(boardX, boardY, boardSize, boardSize), combo: rect(0, comboY, w, comboH),
    tray: rect(0, trayY, w, trayH), bottom: rect(0, h - bottomH, w, bottomH),
    cellSize, trayCellSize: Math.min(26.4, portraitTraySlotWidth(w) / 5.4),
    gaps: { a: gapA, b: gapB, c: gapC },
  };
}

function computeLandscape(w: number, h: number, safeTop: number, safeBottom: number, hasGoalStrip: boolean): Layout {
  const u = clamp(Math.min(w / 1280, h / 800), 0.6, 1.4);
  const size = 560 * u;
  const left = (w - size) / 2;
  const top = (h - size) / 2;
  const board = rect(left, top, size, size);
  return {
    width: w, height: h, portrait: false,
    column: rect(0, 0, w, h), topBar: rect(0, 0, w, 72 * u + safeTop), goalStrip: hasGoalStrip ? rect(left - 288 * u, top + 400 * u, 240 * u, 74 * u) : rect(0, 0, 0, 0), // spec-note: chips sit under the rescue ring; at 300u they covered Stage and Combo.
    score: rect(left - 288 * u, top, 240 * u, size), board,
    combo: rect(left - 288 * u, top + 220 * u, 240 * u, 100 * u),
    tray: rect(left + size + 48 * u, top + 8 * u, 240 * u, 552 * u),
    bottom: rect(0, h - (40 * u + safeBottom), w, 40 * u + safeBottom),
    cellSize: (size - 16 * u) / 8,
    trayCellSize: Math.min(40.8 * u, 240 * u / 5.4, 168 * u / 5.4),
    gaps: { a: 0, b: 0, c: 0 },
  };
}

function shiftLayout(layout: Layout, dx: number, column: Rect): Layout {
  const shift = (r: Rect): Rect => ({ ...r, x: r.x + dx });
  return { ...layout, width: column.width + dx * 2, column, topBar: shift(layout.topBar), score: shift(layout.score), goalStrip: shift(layout.goalStrip), board: shift(layout.board), combo: shift(layout.combo), tray: shift(layout.tray), bottom: shift(layout.bottom) };
}

function rect(x: number, y: number, width: number, height: number): Rect { return { x, y, width, height }; }
function clamp(value: number, min: number, max: number): number { return Math.min(max, Math.max(min, value)); }
