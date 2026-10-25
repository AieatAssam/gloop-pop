// SG §14: themes change the background silhouette and air layer; cosmetics are render-only.
import type { ThemeKey } from './palette';

export type SkinId = 'plain' | 'googlyEyes' | 'freckles' | 'catEars' | 'glasses' | 'mustache' | 'bowtie' | 'crown';
export type PopEffectId = 'sparkles' | 'hearts' | 'stars' | 'bubbles' | 'confetti' | 'fireworks' | 'goldsparkles' | 'goldstars' | 'goldconfetti';
export const SKIN_IDS: readonly SkinId[] = ['plain', 'googlyEyes', 'freckles', 'catEars', 'glasses', 'mustache', 'bowtie', 'crown'];

export interface EquippedCosmetics { theme: ThemeKey; skin: SkinId; popEffect: PopEffectId }

let equipped: EquippedCosmetics = { theme: 'midnight', skin: 'plain', popEffect: 'sparkles' };

export function getEquippedTheme(): ThemeKey { return equipped.theme; }
export function getEquippedSkin(): SkinId { return equipped.skin; }
export function getEquippedPopEffect(): PopEffectId { return equipped.popEffect; }

// spec-note: Render owns a small cosmetic snapshot; app/save code syncs it through this setter.
/** The app can sync this snapshot from the save without making rendering depend on meta. */
export function setEquippedCosmetics(next: EquippedCosmetics): void { equipped = { ...next }; }

export const THEME_KEYS: readonly ThemeKey[] = ['midnight', 'sunset', 'aquarium', 'observatory', 'kitchen', 'snowglobe', 'dawn'];
