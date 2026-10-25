// SG §9.11: one setting and device preference gate for visual effects.
export type ReducedMotionSetting = 'system' | 'on' | 'off';
export function shouldReduceMotion(setting: ReducedMotionSetting, devicePreference: boolean): boolean { return setting === 'on' || (setting === 'system' && devicePreference); }
// spec-note: fractional reduced-motion particle counts use nearest-integer rounding, retaining one particle for any positive request.
export function reducedParticleCount(count: number, reduced: boolean): number { return reduced && count > 0 ? Math.max(1, Math.round(count * 0.3)) : count; }
export function canStartSlowMo(lastAtMs: number, nowMs: number, reduced: boolean): boolean { return !reduced && nowMs - lastAtMs >= 3000; }
export function devicePrefersReducedMotion(): boolean { return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches; }
