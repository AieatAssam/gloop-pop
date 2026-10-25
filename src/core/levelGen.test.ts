import { describe, expect, it } from 'vitest';
import { candidateTargets, evaluateTraces, orderedTargetVectors } from './levelGen';

describe('Adventure level calibration helpers', () => {
  it('measures a first win at the move it occurs and treats an unmet trace as a loss', () => {
    const result = evaluateTraces([
      [[0], [0], [0], [0], [5]],
      [[0], [0], [0], [0], [4]],
      [[0], [0], [0], [0], [0]],
    ], [5], 14);
    expect(result).toEqual({ wins: 1, margin: 9, winningMovesLeft: [9] });
    expect(evaluateTraces([[[0], [0]]], [1], 14)).toEqual({ wins: 0, margin: 0, winningMovesLeft: [] });
  });

  it('uses the lower median for W = 1, 4, 7 and 12', () => {
    const cases = [
      { left: [8], median: 8 },
      { left: [1, 3, 7, 9], median: 3 },
      { left: [0, 1, 2, 4, 5, 6, 8], median: 4 },
      { left: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], median: 5 },
    ];
    for (const { left, median } of cases) {
      const traces = left.map((movesLeft) => Array.from({ length: 14 - movesLeft }, (_, index) => index === 13 - movesLeft ? [1] : [0]));
      expect(evaluateTraces(traces, [1], 14).margin).toBe(median);
    }
  });

  it('orders C targets outside X targets and limits X candidates to runs reaching C', () => {
    const vectors = orderedTargetVectors(
      [{ kind: 'C', target: 0 }, { kind: 'F', flavour: 2, target: 0 }],
      [[5, 20], [5, 15], [4, 25], [3, 20], [4, 8]], 83,
    );
    expect(vectors).toEqual([
      [5, 20], [5, 15],
      [4, 25], [4, 20], [4, 15], [4, 8],
    ]);
  });

  it('rounds, applies minimums and intro caps before removing duplicates', () => {
    expect(candidateTargets({ kind: 'L', target: 0 }, [9, 4, 4, 3, 2], 1)).toEqual([4, 3]);
    expect(candidateTargets({ kind: 'S', target: 0 }, [2550, 2500, 1490, 499], 2)).toEqual([1500, 1400]);
    expect(candidateTargets({ kind: 'F', flavour: 1, target: 0 }, [28, 24, 20, 19, 8, 7], 83)).toEqual([25, 20, 19, 8]);
    expect(candidateTargets({ kind: 'C', target: 0 }, [8, 5, 4, 3, 1], 83)).toEqual([8, 5, 4]);
    expect(candidateTargets({ kind: 'C', target: 0 }, [5, 4, 3, 2], 25)).toEqual([5, 4, 3]);
  });
});
