import { describe, expect, it } from 'vitest';
import { mapGeometry } from './mapGeometry';

const cases = [
  { w: 412, h: 915, safeBottom: 0, pitch: 116, content: 14836, viewport: 763 },
  { w: 360, h: 740, safeBottom: 0, pitch: 116, content: 14836, viewport: 588 },
  { w: 1280, h: 800, safeBottom: 0, pitch: 124, content: 15796, viewport: 644 },
  { w: 390, h: 844, safeBottom: 34, pitch: 116, content: 14836, viewport: 658 },
] as const;
const intersects = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): boolean => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

describe('Adventure map geometry (SG §20.2)', () => {
  for (const input of cases) it(`fits ${input.w} × ${input.h}`, () => {
    const geo = mapGeometry({ w: input.w, h: input.h, safeTop: 0, safeBottom: input.safeBottom });
    expect([geo.pitch, geo.slot, geo.contentHeight, geo.viewportHeight]).toEqual([input.pitch, 148, input.content, input.viewport]);
    expect(geo.nodes).toHaveLength(120); expect(geo.cards).toHaveLength(6);
    for (let i = 0; i < geo.nodes.length; i += 1) {
      const node = geo.nodes[i]!;
      expect(node.box.x).toBeGreaterThanOrEqual(0); expect(node.box.x + node.box.w).toBeLessThanOrEqual(geo.colW);
      expect(node.box.y).toBeGreaterThanOrEqual(0); expect(node.box.y + node.box.h).toBeLessThanOrEqual(geo.contentHeight);
      if (i > 0) expect(intersects(node.box, geo.nodes[i - 1]!.box)).toBe(false);
      for (const card of geo.cards) {
        expect(intersects(node.box, card)).toBe(false);
        expect(intersects({ x: node.cx - 20, y: node.cy - node.r - 30, w: 40, h: 40 }, card)).toBe(false);
      }
      for (const target of [1, 20, 21, 23, 41, 60, 100, 119, 120]) {
        const targetNode = geo.nodes[target - 1]!; const top = geo.scrollTopFor(target);
        expect(top).toBeGreaterThanOrEqual(0); expect(top).toBeLessThanOrEqual(geo.contentHeight - geo.viewportHeight);
        expect(targetNode.box.y).toBeGreaterThanOrEqual(top); expect(targetNode.box.y + targetNode.box.h).toBeLessThanOrEqual(top + geo.viewportHeight);
        const miniY = targetNode.cy - targetNode.r - 30;
        expect(miniY).toBeGreaterThanOrEqual(top); expect(miniY + 40).toBeLessThanOrEqual(top + geo.viewportHeight);
      }
    }
    for (const card of geo.cards) {
      expect(card.x).toBeGreaterThanOrEqual(16); expect(card.x + card.w).toBeLessThanOrEqual(geo.colW - 16);
      const chapterNode = geo.nodes[card.chapter * 20 - 1]!;
      if (card.chapter < 6) {
        const nextNode = geo.nodes[card.chapter * 20]!;
        expect(card.y - (nextNode.box.y + nextNode.box.h)).toBe(12);
        expect(chapterNode.box.y - (card.y + card.h)).toBe(36);
      } else expect(card.y + card.h).toBe(chapterNode.cy - (geo.desktop ? 40 : 36) - 32);
    }
    expect(geo.contentHeight - (geo.nodes[0]!.box.y + geo.nodes[0]!.box.h)).toBeGreaterThanOrEqual(24);
  });
});
