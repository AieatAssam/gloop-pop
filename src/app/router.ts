export type ScreenId = 'home' | 'stats' | 'play';
export interface ScreenRouter { readonly current: ScreenId; open(screen: ScreenId): void; back(): void; subscribe(listener: (screen: ScreenId) => void): () => void; }
export function createRouter(initial: ScreenId = 'home'): ScreenRouter {
  let current = initial; const listeners = new Set<(screen: ScreenId) => void>();
  history.replaceState({ ...(history.state as object | null), gloopScreen: initial }, '');
  const notify = (): void => listeners.forEach((listener) => listener(current));
  const pop = (event: PopStateEvent): void => { const state: unknown = event.state; const candidate = isRecord(state) ? state.gloopScreen : undefined; current = isScreen(candidate) ? candidate : 'home'; notify(); };
  window.addEventListener('popstate', pop);
  return { get current() { return current; }, open(screen) { if (screen === current) return; history.pushState({ gloopScreen: screen }, ''); current = screen; notify(); }, back() { if (current !== 'home') history.back(); }, subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); } };
}
function isScreen(value: unknown): value is ScreenId { return value === 'home' || value === 'stats' || value === 'play'; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null; }
