// SG §20.2: all Adventure map positions are computed here; CSS supplies appearance only.
import { levelParams } from '../../core/levels';
export interface MapGeometryInput { w: number; h: number; safeTop: number; safeBottom: number }
export interface MapBox { x: number; y: number; w: number; h: number }
export interface MapNode { level: number; cx: number; cy: number; r: number; box: MapBox }
export interface MapCard { chapter: number; x: number; y: number; w: number; h: number }
export interface MapGeometry {
  desktop: boolean; pitch: number; slot: number; contentHeight: number; colW: number;
  viewportTop: number; viewportHeight: number; barHeight: number;
  nodes: MapNode[]; cards: MapCard[]; scrollTopFor(level: number): number;
}

const OFFSETS = [0, 0.18, 0.28, 0.18, 0, -0.18, -0.28, -0.18] as const;
const CARD = 112; const GU = 32; const GO = 12; const CAP = 36;

export function mapGeometry({ w, h, safeTop, safeBottom }: MapGeometryInput): MapGeometry {
  const desktop = w >= 800; const colW = Math.min(w, 600); const pitch = desktop ? 124 : 116;
  const hardRadius = desktop ? 40 : 36; const normalRadius = desktop ? 36 : 32;
  const boxW = desktop ? 88 : 80; const headerHeight = desktop ? 72 : 64; const barHeight = desktop ? 84 : 88;
  const slot = CARD + GU + GO + 2 * hardRadius + CAP - pitch;
  const up = (level: number): number => 24 + hardRadius + CAP + (level - 1) * pitch + Math.floor((level - 1) / 20) * slot;
  const contentHeight = up(120) + hardRadius + GU + CARD + 16;
  const nodes = Array.from({ length: 120 }, (_, index): MapNode => {
    const level = index + 1; const r = levelParams(level).band === 'hard' ? hardRadius : normalRadius;
    const cx = colW / 2 + OFFSETS[index % 8]! * colW; const cy = contentHeight - up(level);
    return { level, cx, cy, r, box: { x: cx - boxW / 2, y: cy - r, w: boxW, h: 2 * r + CAP } };
  });
  const cards = Array.from({ length: 6 }, (_, index): MapCard => {
    const chapter = index + 1; const node = nodes[chapter * 20 - 1]!;
    const width = Math.min(colW - 32, 520);
    // spec-note: The chapter slot formula leaves 16 px before the easy-radius next node; anchor the first five cards to its explicit 12 px GO gap. Chapter 6 has no next node, so it uses the specified RH/GU position above level 120.
    const next = nodes[chapter * 20];
    const y = next ? next.box.y + next.box.h + GO : node.cy - hardRadius - GU - CARD;
    return { chapter, x: (colW - width) / 2, y, w: width, h: CARD };
  });
  const viewportTop = safeTop + headerHeight;
  const viewportHeight = h - safeTop - safeBottom - headerHeight - barHeight;
  const scrollTopFor = (level: number): number => {
    const target = nodes[Math.max(1, Math.min(120, Math.round(level))) - 1]!;
    return Math.max(0, Math.min(contentHeight - viewportHeight, Math.round(target.cy - 0.6 * viewportHeight)));
  };
  return { desktop, pitch, slot, contentHeight, colW, viewportTop, viewportHeight, barHeight, nodes, cards, scrollTopFor };
}
