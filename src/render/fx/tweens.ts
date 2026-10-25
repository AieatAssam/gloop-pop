// SG §9.0, §9.2: fixed-capacity tween pool for allocation-free updates.
import { easeOutBack, easeInOutSine, easeInBack, easeOutQuad, easeOutCubic, easeOutElastic } from '../easing';

export type TweenEase = 'linear' | 'outBack' | 'inOutSine' | 'inBack' | 'outQuad' | 'outCubic' | 'outElastic';
export interface Tween { active: boolean; from: number; to: number; duration: number; elapsed: number; value: number; ease: TweenEase }
export function createTweenPool(capacity = 64) {
  const items: Tween[] = Array.from({ length: capacity }, () => ({ active: false, from: 0, to: 0, duration: 1, elapsed: 0, value: 0, ease: 'linear' }));
  return {
    start(from: number, to: number, duration: number, ease: TweenEase = 'linear'): Tween | undefined {
      const tween = items.find((item) => !item.active); if (!tween) return undefined;
      Object.assign(tween, { active: true, from, to, duration: Math.max(1, duration), elapsed: 0, value: from, ease }); return tween;
    },
    update(dtMs: number): void { for (const item of items) if (item.active) { item.elapsed = Math.min(item.duration, item.elapsed + dtMs); const t = item.elapsed / item.duration; const eased = item.ease === 'outBack' ? easeOutBack(t) : item.ease === 'inOutSine' ? easeInOutSine(t) : item.ease === 'inBack' ? easeInBack(t) : item.ease === 'outQuad' ? easeOutQuad(t) : item.ease === 'outCubic' ? easeOutCubic(t) : item.ease === 'outElastic' ? easeOutElastic(t) : t; item.value = item.from + (item.to - item.from) * eased; if (item.elapsed >= item.duration) item.active = false; } },
    get items(): readonly Tween[] { return items; },
  };
}
