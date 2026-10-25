// SG §9.7: cached canvas text sprites for the short-lived score labels.
import { PALETTE } from '../palette';
export interface TextSprite { canvas: HTMLCanvasElement; x: number; y: number; at: number; duration: number; rise: number; wobble: boolean; fit: number; fadeAt: number }
export function chooseStackLabel(eventLabel: string, firstTimeLabel: string): string { return firstTimeLabel || eventLabel; }
export function labelFit(spriteWidth: number, cell: number, fontScale: number, maxWidth: number): number { return Math.min(1, maxWidth / Math.max(1, spriteWidth * cell / 68 * fontScale * 1.2)); }
export function stackTop(centerY: number, height: number, gridTop: number, gridBottom: number, cell: number): number {
  const min = gridTop + 2 * cell; const max = gridBottom - cell - height;
  if (max < min) return (gridTop + gridBottom - height) / 2;
  return Math.max(min, Math.min(max, centerY - height / 2));
}
export function createTextSprites() {
  const cache = new Map<string, HTMLCanvasElement>(); const active: TextSprite[] = [];
  const sprite = (text: string, size: number, colour: string): HTMLCanvasElement => {
    const key = `${text}|${size}|${colour}`; const found = cache.get(key); if (found) return found;
    const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); if (!ctx) return canvas;
    ctx.font = `800 ${size}px "Baloo 2", sans-serif`; const width = Math.ceil(ctx.measureText(text).width + size * 0.6); canvas.width = width; canvas.height = Math.ceil(size * 1.7);
    const draw = canvas.getContext('2d')!; draw.font = `800 ${size}px "Baloo 2", sans-serif`; draw.textAlign = 'center'; draw.textBaseline = 'middle'; draw.lineJoin = 'round'; draw.lineWidth = size * 0.12; draw.shadowColor = PALETTE.light.shadow; draw.shadowOffsetY = 3; draw.shadowBlur = 3; draw.strokeStyle = PALETTE.fx.numberOutline; draw.strokeText(text, width / 2, canvas.height / 2); draw.shadowColor = 'transparent'; draw.shadowOffsetY = 0; draw.shadowBlur = 0; draw.fillStyle = colour; draw.fillText(text, width / 2, canvas.height / 2); cache.set(key, canvas); if (cache.size > 64) cache.delete(cache.keys().next().value!); return canvas;
  };
  return { beginStack(at: number): void { for (const item of active) item.fadeAt = at; }, add(text: string, size: number, colour: string, x: number, y: number, at: number, duration = 750, wobble = false, cell = 68, fontScale = 1, maxWidth = Infinity): void { const canvas = sprite(text, size, colour); if (active.length < 6) active.push({ canvas, x, y, at, duration, rise: 0.6 * cell, wobble, fit: labelFit(canvas.width, cell, fontScale, maxWidth), fadeAt: -1 }); else { const item = active[0]!; item.canvas = canvas; item.x = x; item.y = y; item.at = at; item.duration = duration; item.rise = 0.6 * cell; item.wobble = wobble; item.fit = labelFit(canvas.width, cell, fontScale, maxWidth); item.fadeAt = -1; } }, draw(ctx: CanvasRenderingContext2D, time: number, scale = 1, originX = 0, originY = 0, fontScale = 1): void { for (let i = active.length - 1; i >= 0; i -= 1) { const item = active[i]!; const age = time - item.at; if (age >= item.duration || item.fadeAt >= 0 && time - item.fadeAt >= 120) { active[i] = active[active.length - 1]!; active.pop(); continue; } if (age < 0) continue; const t = age / item.duration; const popScale = t < 0.16 ? 1.2 * t / 0.16 : t < 0.27 ? 1.2 - (t - 0.16) / 0.11 * 0.2 : 1; const fade = item.fadeAt < 0 ? 1 : Math.max(0, 1 - (time - item.fadeAt) / 120); ctx.save(); ctx.globalAlpha = Math.min(1, (item.duration - age) / 250, fade); ctx.translate(originX + item.x * scale, originY + item.y * scale - item.rise * (1 - (1 - t) ** 3)); ctx.rotate(item.wobble ? Math.sin(age / 400 * Math.PI * 4) * Math.PI / 45 : 0); ctx.scale(popScale * fontScale * item.fit, popScale * fontScale * item.fit); ctx.drawImage(item.canvas, -item.canvas.width / 2, -item.canvas.height / 2); ctx.restore(); } }, clear(): void { active.length = 0; } };
}
