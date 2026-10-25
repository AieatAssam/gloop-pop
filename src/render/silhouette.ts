// SG §4 and §5.1: a single even-odd contour for connected cells, including holes.
export function silhouettePath(cells: readonly number[], cellSize: number): Path2D {
  const path = new Path2D();
  for (const points of silhouetteContours(cells, cellSize)) {
    const count = points.length - 1; if (count < 4) continue;
    const area = signedArea(points); const entries: [number, number][] = []; const exits: [number, number][] = [];
    for (let i = 0; i < count; i += 1) {
      const previous = points[(i + count - 1) % count]!; const current = points[i]!; const next = points[(i + 1) % count]!;
      const before = [previous[0] - current[0], previous[1] - current[1]]; const after = [next[0] - current[0], next[1] - current[1]];
      const cross = before[0]! * after[1]! - before[1]! * after[0]!; const convex = cross < 0 || cross === 0 && area < 0; const radius = convex ? cellSize * 0.28 : cellSize * 0.14;
      const beforeLength = Math.hypot(before[0]!, before[1]!); const afterLength = Math.hypot(after[0]!, after[1]!); const r = Math.min(radius, beforeLength / 2, afterLength / 2);
      entries.push([current[0] + before[0]! / beforeLength * r, current[1] + before[1]! / beforeLength * r]);
      exits.push([current[0] + after[0]! / afterLength * r, current[1] + after[1]! / afterLength * r]);
    }
    path.moveTo(exits[0]![0], exits[0]![1]);
    for (let i = 1; i <= count; i += 1) { const index = i % count; const current = points[index]!; path.lineTo(entries[index]![0], entries[index]![1]); path.quadraticCurveTo(current[0], current[1], exits[index]![0], exits[index]![1]); }
    path.closePath();
  }
  return path;
}

function signedArea(points: readonly (readonly [number, number])[]): number { let area = 0; for (let i = 0; i < points.length - 1; i += 1) { const a = points[i]!; const b = points[i + 1]!; area += a[0] * b[1] - b[0] * a[1]; } return area / 2; }

export function silhouetteContours(cells: readonly number[], cellSize: number): [number, number][][] {
  const set = new Set(cells);
  // Trace on the integer grid and scale at the end: chaining edges by exact equality breaks with fractional
  // cell sizes (3 × 14.4 !== 2 × 14.4 + 14.4), which used to produce slanted, torn shapes at small sizes.
  const edges: [number, number, number, number][] = [];
  for (const index of cells) {
    const row = Math.floor(index / 8); const col = index % 8;
    const x = col; const y = row;
    if (!set.has(index - 8)) edges.push([x, y, x + 1, y]);
    if (col === 7 || !set.has(index + 1)) edges.push([x + 1, y, x + 1, y + 1]);
    if (!set.has(index + 8)) edges.push([x + 1, y + 1, x, y + 1]);
    if (col === 0 || !set.has(index - 1)) edges.push([x, y + 1, x, y]);
  }
  const contours: [number, number][][] = [];
  while (edges.length) {
    const edge = edges.pop()!;
    const contour: [number, number][] = [[edge[0], edge[1]], [edge[2], edge[3]]];
    let x = edge[2]; let y = edge[3]; let dx = edge[2] - edge[0]; let dy = edge[3] - edge[1];
    while (!(x === edge[0] && y === edge[1])) {
      // At a pinch vertex two edges leave the same point; prefer the right turn so holes and outer loops stay separate.
      const candidates = edges.map((item, i) => [item, i] as const).filter(([item]) => item[0] === x && item[1] === y);
      if (!candidates.length) break;
      const pick = candidates.length === 1 ? candidates[0]! : candidates.find(([item]) => (item[2] - item[0]) === -dy && (item[3] - item[1]) === dx) ?? candidates[0]!;
      const current = edges.splice(pick[1], 1)[0]!;
      dx = current[2] - current[0]; dy = current[3] - current[1]; x = current[2]; y = current[3]; contour.push([x, y]);
    }
    contours.push(mergeCollinear(contour).map(([px, py]) => [px * cellSize, py * cellSize] as [number, number]));
  }
  return contours;
}

function mergeCollinear(points: [number, number][]): [number, number][] {
  const ring = points.slice(0, -1); if (ring.length < 4) return points;
  const kept = ring.filter((point, i) => { const a = ring[(i + ring.length - 1) % ring.length]!; const b = ring[(i + 1) % ring.length]!; return (point[0] - a[0]) * (b[1] - point[1]) - (point[1] - a[1]) * (b[0] - point[0]) !== 0; });
  return kept.length >= 4 ? [...kept, kept[0]!] : points;
}

export function roundRectPath(x: number, y: number, width: number, height: number, radius: number): Path2D {
  const p = new Path2D(); p.roundRect(x, y, width, height, radius); return p;
}
