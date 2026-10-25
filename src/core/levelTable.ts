import { LEVEL_TABLE } from './levels.data';
import { buildLevel, levelParams, type LevelDef } from './levels';

let rows: string[] | undefined;
const cache = new Map<number, LevelDef>();

export function levelDef(n: number): LevelDef {
  const tableRows = getRows();
  if (!Number.isInteger(n) || n < 1 || n > tableRows.length) throw new RangeError('level must be 1..120');
  const cached = cache.get(n);
  if (cached) return cached;
  const row = tableRows[n - 1];
  if (!row) throw new RangeError('missing level row');
  const [seedText, targetText, s2Text, s3Text, winsText, marginText] = row.split(',');
  const seed = Number(seedText);
  const targets = (targetText ?? '').split('/').map(Number);
  const params = levelParams(n);
  // spec-note: M14 uses the deterministic F flavour from levelParams(n), as specified in architecture §7.
  const goals = params.goals.map((goal, index) => ({ ...goal, target: targets[index] ?? goal.target }));
  let built: ReturnType<typeof buildLevel> | undefined;
  const def = {
    n,
    s: seed,
    goals,
    moves: params.moves,
    s2: Number(s2Text),
    s3: Number(s3Text),
    wins: Number(winsText),
    margin: Number(marginText),
    get board(): string {
      built ??= buildLevel(n, seed);
      return built.board;
    },
  } satisfies LevelDef;
  cache.set(n, def);
  return def;
}

let allLevels: readonly LevelDef[] | undefined;
export const LEVELS: readonly LevelDef[] = new Proxy([] as LevelDef[], {
  get(_target, property) {
    allLevels ??= Array.from({ length: getRows().length }, (_, index) => levelDef(index + 1));
    return Reflect.get(allLevels, property, allLevels) as unknown;
  },
  has(_target, property) {
    allLevels ??= Array.from({ length: getRows().length }, (_, index) => levelDef(index + 1));
    return property in allLevels;
  },
});

function getRows(): string[] {
  rows ??= LEVEL_TABLE.split(';');
  return rows;
}
