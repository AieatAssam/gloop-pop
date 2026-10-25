// SG §9.13.e.10: cells removed by their own move are rendered only by their pop cues.
export function visiblePlacementCells(placed: readonly number[], removed: readonly number[]): number[] {
  const removedSet = new Set(removed);
  return placed.filter((cell) => !removedSet.has(cell));
}

export function placementLayerLifetimeMs(): number { return 324; }
