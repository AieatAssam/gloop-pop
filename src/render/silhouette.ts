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
  const edges: [number, number, number, number][] = [];
  for (const index of cells) {
    const row = Math.floor(index / 8); const col = index % 8;
    // Trace the merged cell union first; the caller's body outline provides the inset.
    const x = col * cellSize; const y = row * cellSize; const s = cellSize;
    if (!set.has(index - 8)) edges.push([x, y, x + s, y]);
    if (!set.has(index + 1)) edges.push([x + s, y, x + s, y + s]);
    if (!set.has(index + 8)) edges.push([x + s, y + s, x, y + s]);
    if (!set.has(index - 1)) edges.push([x, y + s, x, y]);
  }
  const contours: [number, number][][] = [];
  while (edges.length) {
    const edge = edges.pop()!;
    const contour: [number, number][] = [[edge[0], edge[1]], [edge[2], edge[3]]];
    let x = edge[2]; let y = edge[3];
    while (true) {
      const next = edges.findIndex((item) => item[0] === x && item[1] === y);
      if (next < 0) break;
      const current = edges.splice(next, 1)[0]!;
      x = current[2]; y = current[3]; contour.push([x, y]);
      if (x === edge[0] && y === edge[1]) break;
    }
    contours.push(contour);
  }
  return contours;
}

export function roundRectPath(x: number, y: number, width: number, height: number, radius: number): Path2D {
  const p = new Path2D(); p.roundRect(x, y, width, height, radius); return p;
}
