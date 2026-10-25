// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import veteranSave from '../meta/fixtures/save-v1-veteran.json';
import { CATALOGUE, equipItem } from '../meta/catalogue';
import { migrate } from '../meta/migrate';
import { defaultSave } from '../meta/saveSchema';
import { mix, withAlpha } from './colour';
import { PALETTE, type ThemeKey } from './palette';
import { popParticleStyle } from './fx/particles';
import { getEquippedPopEffect, getEquippedSkin, getEquippedTheme, setEquippedCosmetics, type PopEffectId, type SkinId } from './themes';
import { drawGloop, setColourBlindPatterns } from './gloopRenderer';

const skinMap: Record<string, SkinId> = { plain: 'plain', googly: 'googlyEyes', freckles: 'freckles', catears: 'catEars', glasses: 'glasses', mustache: 'mustache', bowtie: 'bowtie', crown: 'crown' };
const gradient = { addColorStop: (): void => undefined };
const context = new Proxy({ createLinearGradient: () => gradient, createRadialGradient: () => gradient }, {
  get(target, key: string) { return key in target ? target[key as keyof typeof target] : () => undefined; },
}) as unknown as CanvasRenderingContext2D;

class TestPath2D {
  moveTo(): void { /* Canvas path stub for this renderer test. */ }
  lineTo(): void { /* Canvas path stub for this renderer test. */ }
  quadraticCurveTo(): void { /* Canvas path stub for this renderer test. */ }
  closePath(): void { /* Canvas path stub for this renderer test. */ }
  roundRect(): void { /* Canvas path stub for this renderer test. */ }
}

beforeAll(() => {
  vi.stubGlobal('Path2D', TestPath2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => context);
});

afterEach(() => {
  setColourBlindPatterns(false);
  setEquippedCosmetics({ theme: 'midnight', skin: 'plain', popEffect: 'sparkles' });
});

describe('equipped cosmetics colour resolution', () => {
  it('equips and resolves every catalogue item in its slot', () => {
    let save = defaultSave();
    save.owned = {
      ...save.owned,
      themes: CATALOGUE.filter((item) => item.kind === 'theme').map((item) => item.id),
      skins: CATALOGUE.filter((item) => item.kind === 'skin').map((item) => item.id),
      pops: CATALOGUE.filter((item) => item.kind === 'pop').map((item) => item.id),
    };

    for (const item of CATALOGUE) {
      save = equipItem(save, item.kind, item.id);
      setEquippedCosmetics({
        theme: save.equipped.theme as ThemeKey,
        skin: skinMap[save.equipped.skin]!,
        popEffect: save.equipped.pop as PopEffectId,
      });

      if (item.kind === 'theme') {
        expect(getEquippedTheme()).toBe(item.id);
        resolveColours(Object.values(PALETTE.theme[getEquippedTheme()]));
      } else if (item.kind === 'skin') {
        expect(getEquippedSkin()).toBe(skinMap[item.id]);
        resolvePaletteColours(PALETTE.accessory);
        resolvePaletteColours(PALETTE.face);
        resolvePaletteColours(PALETTE.topper);
      } else {
        expect(getEquippedPopEffect()).toBe(item.id);
        const style = popParticleStyle(getEquippedPopEffect(), () => 0.5, PALETTE.flavour.cherry.glow);
        expect(style.colour).toMatch(/^#[0-9A-F]{6,8}$/i);
        expect(withAlpha(style.colour, 0.45)).toMatch(/^rgba\(/);
      }

      // Force a fresh cached body for each equipped item so rendering resolves the active palette path.
      setColourBlindPatterns(false);
      setColourBlindPatterns(true);
      drawGloop(context, { flavour: 1, cells: [0], bfs: [0], largestSquare: { row: 0, col: 0, size: 1 } }, 44, 0, 0, 0);
    }

    for (const flavour of Object.values(PALETTE.flavour)) {
      const patterned = mix(flavour.dark, PALETTE.face.ink, 0.25);
      expect(withAlpha(patterned, 0.45)).toMatch(/^rgba\(/);
    }
  });

  it('initialises the veteran debug save and resolves its equipped colours', () => {
    const save = migrate(veteranSave);
    setEquippedCosmetics({
      theme: save.equipped.theme as ThemeKey,
      skin: skinMap[save.equipped.skin]!,
      popEffect: save.equipped.pop as PopEffectId,
    });

    expect(getEquippedTheme()).toBe('aquarium');
    expect(getEquippedSkin()).toBe('freckles');
    expect(getEquippedPopEffect()).toBe('hearts');
    resolveColours(Object.values(PALETTE.theme.aquarium));
    resolvePaletteColours(PALETTE.accessory);
    resolvePaletteColours(PALETTE.face);
    setColourBlindPatterns(true);
    drawGloop(context, { flavour: 1, cells: [0], bfs: [0], largestSquare: { row: 0, col: 0, size: 1 } }, 44, 0, 0, 0);
    for (const flavour of Object.values(PALETTE.flavour)) {
      expect(withAlpha(mix(flavour.dark, PALETTE.face.ink, 0.25), 0.45)).toMatch(/^rgba\(/);
    }
  });
});

function resolvePaletteColours(colours: object): void {
  resolveColours(Object.values(colours));
}

function resolveColours(colours: readonly string[]): void {
  for (const colour of colours) expect(withAlpha(colour, 0.5)).toMatch(/^rgba\(/);
}
