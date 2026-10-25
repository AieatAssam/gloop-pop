export interface ComboState { combo: number; fuse: number; bestCombo: number; }
export type ComboEvent = { type: 'comboUp'; combo: number; tier: number } | { type: 'comboLost'; combo: number };
export function advanceCombo(state: ComboState, lines: number): { state: ComboState; events: ComboEvent[] } {
  if (lines > 0) {
    const combo = state.combo + 1;
    return { state: { combo, fuse: 3, bestCombo: Math.max(state.bestCombo, combo) }, events: [{ type: 'comboUp', combo, tier: combo >= 12 ? 4 : combo >= 8 ? 3 : combo >= 5 ? 2 : combo >= 3 ? 1 : 0 }] };
  }
  if (state.combo === 0) return { state, events: [] };
  const fuse = state.fuse - 1;
  if (fuse <= 0) return { state: { ...state, combo: 0, fuse: 0 }, events: [{ type: 'comboLost', combo: state.combo }] };
  return { state: { ...state, fuse }, events: [] };
}
