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
export const PORTRAIT_TRAY_MARGIN = 4;
export const PORTRAIT_TRAY_GAP = 8;
/** SG §8.2 tray slot width: 122 px at the reference width, never scaled by height, and never wider than the column allows. */
export function portraitTraySlotWidth(columnWidth: number): number { return Math.min(122, (columnWidth - PORTRAIT_TRAY_MARGIN * 2 - PORTRAIT_TRAY_GAP * 2) / 3); }

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
  // spec-note: With a goal strip, gap B is at least 6 px so the board never touches the pills (on 320x568 the leftover was 6 px and they touched). Taller phones keep the 1 : 1 : 2 split.
  const gapB = hasGoalStrip ? Math.max(leftover * 0.25, Math.min(6, leftover)) : leftover * 0.25;
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
