// SG §15.3: one responsive layout drives canvas drawing and future DOM HUD placement.
export interface Rect { x: number; y: number; width: number; height: number }

export interface Layout {
  width: number;
  height: number;
  portrait: boolean;
  column: Rect;
  topBar: Rect;
  score: Rect;
  board: Rect;
  combo: Rect;
  tray: Rect;
  bottom: Rect;
  cellSize: number;
  trayCellSize: number;
  gaps: { a: number; b: number; c: number };
}

export interface SafeInsets { top?: number; bottom?: number }

export function computeLayout(width: number, height: number, safe: SafeInsets = {}): Layout {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const safeTop = Math.max(0, safe.top ?? 0);
  const safeBottom = Math.max(0, safe.bottom ?? 0);
  const portrait = h / w >= 1.25;
  if (!portrait && w < 900) {
    // SG §15.3: sideways phones use a portrait composition in a centred column.
    const columnWidth = Math.min(w, h * 0.62);
    const left = (w - columnWidth) / 2;
    const inner = computePortrait(columnWidth, h, safeTop, safeBottom);
    return shiftLayout(inner, left, { x: left, y: 0, width: columnWidth, height: h });
  }
  if (portrait) {
    const columnWidth = w > 600 ? 600 : w;
    const left = (w - columnWidth) / 2;
    const result = computePortrait(columnWidth, h, safeTop, safeBottom);
    return shiftLayout(result, left, { x: left, y: 0, width: columnWidth, height: h });
  }
  return computeLandscape(w, h, safeTop, safeBottom);
}

function computePortrait(w: number, h: number, safeTop: number, safeBottom: number): Layout {
  const k = clamp(h / 844, 0.78, 1.15);
  const topH = 60 * k + safeTop;
  const scoreH = 84 * k;
  const comboH = 44 * k;
  const trayH = 168 * k;
  const bottomH = 16 * k + safeBottom;
  const boardRaw = Math.min(w - 22, 560, h - 372 * k - safeTop - safeBottom);
  const boardSize = Math.max(8, Math.floor(boardRaw / 8) * 8);
  const cellSize = (boardSize - 16) / 8;
  const boardX = (w - boardSize) / 2;
  const used = topH + scoreH + comboH + trayH + bottomH + boardSize;
  const leftover = Math.max(0, h - used);
  const gapA = leftover * 0.25;
  const gapB = leftover * 0.25;
  const gapC = leftover * 0.5;
  const scoreY = topH + gapA;
  const boardY = scoreY + scoreH + gapB;
  const comboY = boardY + boardSize;
  const trayY = comboY + comboH + gapC;
  return {
    width: w, height: h, portrait: true,
    column: { x: 0, y: 0, width: w, height: h },
    topBar: rect(0, 0, w, topH), score: rect(0, scoreY, w, scoreH),
    board: rect(boardX, boardY, boardSize, boardSize), combo: rect(0, comboY, w, comboH),
    tray: rect(0, trayY, w, trayH), bottom: rect(0, h - bottomH, w, bottomH),
    cellSize, trayCellSize: Math.min(26.4, (Math.min(122 * k, w / 3 - 8) / 5.4)),
    gaps: { a: gapA, b: gapB, c: gapC },
  };
}

function computeLandscape(w: number, h: number, safeTop: number, safeBottom: number): Layout {
  const u = clamp(Math.min(w / 1280, h / 800), 0.6, 1.4);
  const size = 560 * u;
  const left = (w - size) / 2;
  const top = (h - size) / 2;
  const board = rect(left, top, size, size);
  return {
    width: w, height: h, portrait: false,
    column: rect(0, 0, w, h), topBar: rect(0, 0, w, 72 * u + safeTop),
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
  return { ...layout, width: column.width + dx * 2, column, topBar: shift(layout.topBar), score: shift(layout.score), board: shift(layout.board), combo: shift(layout.combo), tray: shift(layout.tray), bottom: shift(layout.bottom) };
}

function rect(x: number, y: number, width: number, height: number): Rect { return { x, y, width, height }; }
function clamp(value: number, min: number, max: number): number { return Math.min(max, Math.max(min, value)); }
