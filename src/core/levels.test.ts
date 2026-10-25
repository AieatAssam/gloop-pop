import { describe, expect, it } from 'vitest';
import { calibrate, validate } from './levelGen';
import { harderThan, inBand, levelParams } from './levels';
import { LEVELS } from './levels.data';

describe('generated Adventure levels', () => {
  it('rebuilds and revalidates all 120 definitions against twelve reducer runs', () => {
    expect(LEVELS).toHaveLength(120);
    for (const stored of LEVELS) {
      const params = levelParams(stored.n);
      const result = calibrate(stored.n, stored.s);
      expect(result.def).toEqual(stored);
      expect(validate(stored)).toBe(true);
      expect(stored.moves).toBe(params.moves);
      expect(stored.n).toBe(params.n);
      expect(stored.goals.map((goal) => goal.kind)).toEqual(params.goals.map((goal) => goal.kind));
      expect(stored.wins).toBeGreaterThanOrEqual(params.k);
      expect(inBand(params.band, stored.wins, stored.margin, stored.moves), `Level ${stored.n} (${params.band}): W ${stored.wins}, m ${stored.margin}`).toBe(true);
      expect(result.runs.filter((run) => run.won)).toHaveLength(stored.wins);
      expect(result.runs.filter((run) => run.won).map((run) => run.stars)).toEqual(result.runs.filter((run) => run.won).map((run) => run.movesLeft >= stored.s3 ? 3 : run.movesLeft >= stored.s2 ? 2 : 1));
      expect(stored.board).toHaveLength(64);
      expect([...stored.board].filter((cell) => cell === '8')).toHaveLength(params.sugar);
      expect([...stored.board].filter((cell) => cell === '9')).toHaveLength(params.hardCubes);
      expect(stored.goals.some((goal) => goal.kind === 'F')).toBe(stored.goals.some((goal) => goal.flavour !== undefined));
    }
  }, 90_000);

  it('keeps every hard level below both neighbours by wins and margin share', () => {
    for (const hard of LEVELS.filter((level) => levelParams(level.n).band === 'hard')) {
      for (const n of [hard.n - 1, hard.n + 1].filter((value) => value >= 1 && value <= 120)) {
        const neighbour = LEVELS[n - 1]!;
        expect(harderThan(hard, neighbour), `Level ${hard.n} vs ${n}: hard W ${hard.wins}, m ${hard.margin}; neighbour W ${neighbour.wins}, m ${neighbour.margin}`).toBe(true);
      }
    }
  });

  it('keeps calibrated cube counts, excludes hard M goals and validates exact band boundaries', () => {
    for (const level of LEVELS) {
      const params = levelParams(level.n);
      const cubeGoal = level.goals.find((goal) => goal.kind === 'C');
      if (cubeGoal) expect(cubeGoal.target).toBeGreaterThanOrEqual(1);
      if (cubeGoal) expect(cubeGoal.target).toBeLessThanOrEqual([...level.board].filter((cell) => cell === '8' || cell === '9').length);
      if (params.band === 'hard') expect(level.goals.some((goal) => goal.kind === 'M')).toBe(false);
    }
    expect(inBand('hard', 4, 3, 15)).toBe(true);
    expect(inBand('hard', 7, 3, 15)).toBe(true);
    expect(inBand('hard', 3, 3, 15)).toBe(false);
    expect(inBand('hard', 8, 3, 15)).toBe(false);
    expect(inBand('hard', 4, 4, 15)).toBe(false);
    expect(inBand('hard', 4, 2, 14)).toBe(true);
    expect(inBand('hard', 4, 3, 14)).toBe(false);
    expect(inBand('easy', 10, 6, 26)).toBe(true);
    expect(inBand('easy', 10, 5, 26)).toBe(false);
    const hard = { wins: 4, margin: 2, moves: 15 };
    expect(harderThan(hard, { wins: 6, margin: 2, moves: 15 })).toBe(true);
    expect(harderThan(hard, { wins: 5, margin: 2, moves: 15 })).toBe(false);
    expect(harderThan(hard, { wins: 6, margin: 1, moves: 15 })).toBe(false);
  });

  it('keeps the chapter sawtooth and introduces each mechanic at its specified easy level', () => {
    for (let chapter = 1; chapter <= 6; chapter += 1) {
      const chapterLevels = LEVELS.filter((level) => Math.ceil(level.n / 20) === chapter);
      const easy = chapterLevels.filter((level) => levelParams(level.n).band === 'easy' || levelParams(level.n).band === 'intro');
      const normal = chapterLevels.filter((level) => levelParams(level.n).band === 'normal');
      const hard = chapterLevels.filter((level) => levelParams(level.n).band === 'hard');
      expect(mean(hard.map((level) => level.wins))).toBeLessThan(mean(normal.map((level) => level.wins)));
      expect(mean(normal.map((level) => level.wins))).toBeLessThan(mean(easy.map((level) => level.wins)));
      for (const level of chapterLevels) {
        const position = (level.n - 1) % 20 + 1;
        if ([6, 11, 16, 1].includes(position)) expect(['intro', 'easy']).toContain(levelParams(level.n).band);
      }
    }
    expect([
      findFirst((params) => params.goals.some((goal) => goal.kind === 'F')),
      findFirst((params) => params.goals.some((goal) => goal.kind === 'C')),
      findFirst((params) => params.goals.some((goal) => goal.kind === 'B')),
      findFirst((params) => params.goals.some((goal) => goal.kind === 'M')),
      findFirst((params) => params.flavours === 6),
      findFirst((params) => params.hardCubes > 0),
      findFirst((params) => params.goals.length === 2),
      findFirst((params) => params.flavours === 7),
    ]).toEqual([6, 21, 41, 46, 51, 61, 81, 91]);
    for (const n of [6, 21, 41, 46, 51, 61, 81, 91]) expect(['intro', 'easy']).toContain(levelParams(n).band);
    expect(levelParams(47).goals.map((goal) => goal.kind)).toEqual(['M']);
    expect(levelParams(50).goals.map((goal) => goal.kind)).toEqual(['F']);
    expect(levelParams(115).goals.map((goal) => goal.kind)).toEqual(['S']);
    expect(levelParams(118).goals.map((goal) => goal.kind)).toEqual(['C', 'M']);
    expect(levelParams(119).goals.map((goal) => goal.kind)).toEqual(['M']);
    expect(levelParams(120).goals.map((goal) => goal.kind)).toEqual(['C', 'B']);
  });

  it('keeps cubes and stage parameters on the design table', () => {
    expect([21, 24, 25, 26, 61, 64, 65, 81, 83, 85, 101, 103, 105].map((n) => {
      const params = levelParams(n);
      return [n, params.sugar, params.hardCubes];
    })).toEqual([[21, 3, 0], [24, 5, 0], [25, 6, 0], [26, 0, 0], [61, 1, 1], [64, 1, 2], [65, 0, 0], [81, 2, 1], [83, 2, 1], [85, 0, 4], [101, 1, 0], [103, 1, 0], [105, 1, 0]]);
    expect([levelParams(25).moves, levelParams(25).startPieces]).toEqual([14, 1]);
    expect([levelParams(120).sugar, levelParams(120).hardCubes]).toEqual([1, 0]);
  });

  it('applies the intro caps and the 20-move limit', () => {
    expect(LEVELS.slice(0, 3).map((level) => level.moves)).toEqual([20, 20, 20]);
    expect(LEVELS[0]?.goals[0]?.target).toBeLessThanOrEqual(4);
    expect(LEVELS[1]?.goals[0]?.target).toBeLessThanOrEqual(1500);
    expect(LEVELS[2]?.goals[0]?.target).toBeLessThanOrEqual(6);
  });
});

function findFirst(predicate: (params: ReturnType<typeof levelParams>) => boolean): number {
  const selected = LEVELS.find((level) => predicate(levelParams(level.n)));
  return selected?.n ?? -1;
}

function mean(values: number[]): number { return values.reduce((total, value) => total + value, 0) / values.length; }
