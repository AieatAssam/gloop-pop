import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('generated app icons', () => {
  it('uses valid PNG headers and declared dimensions for the generated assets', async () => {
    for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['icon-maskable-512.png', 512], ['apple-touch-icon.png', 180], ['og.png', 1200]]) {
      const png = await readFile(new URL(`../public/${name}`, import.meta.url));
      expect([...png.subarray(0, 8)]).toEqual([137,80,78,71,13,10,26,10]);
      expect(png.readUInt32BE(16)).toBe(size);
      expect(png.readUInt32BE(20)).toBe(name === 'og.png' ? 630 : name === 'apple-touch-icon.png' ? 180 : size);
      expect(png.readUInt8(24)).toBe(8);
      expect(png.readUInt8(25)).toBe(6);
    }
    const manifest = JSON.parse(await readFile(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'));
    expect(manifest.icons).toHaveLength(3);
    expect(manifest.icons[2].purpose).toBe('maskable');
  });
});
