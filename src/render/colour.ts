export function withAlpha(colour: string, alpha: number): string {
  const { r, g, b } = parseHex(colour);
  return `rgba(${r}, ${g}, ${b}, ${clamp(alpha)})`;
}

export function mix(a: string, b: string, amount: number): string {
  const first = parseHex(a);
  const second = parseHex(b);
  const t = clamp(amount);
  const channel = (x: number, y: number): number => Math.round(x + (y - x) * t);
  return `rgb(${channel(first.r, second.r)}, ${channel(first.g, second.g)}, ${channel(first.b, second.b)})`;
}

export function hexToRgba(colour: string, alpha = 1): string {
  const parsed = parseHex(colour);
  const embeddedAlpha = parsed.a === undefined ? 1 : parsed.a / 255;
  return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${clamp(alpha) * embeddedAlpha})`;
}

function parseHex(colour: string): { r: number; g: number; b: number; a?: number } {
  const value = colour.startsWith('#') ? colour.slice(1) : colour;
  if (value.length !== 6 && value.length !== 8) throw new Error('Colour must be RGB or RGBA hex.');
  const bytes = value.match(/.{2}/g)?.map((part) => Number.parseInt(part, 16));
  if (!bytes || bytes.some((byte) => Number.isNaN(byte))) throw new Error('Colour must be RGB or RGBA hex.');
  return { r: bytes[0]!, g: bytes[1]!, b: bytes[2]!, ...(bytes[3] === undefined ? {} : { a: bytes[3] }) };
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}
