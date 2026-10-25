import { FAMILY_IDS, PIECES } from './pieces';
import type { FamilyId, Flavour } from './types';

export type FamilyWeights = Record<FamilyId, number>;
const rows: readonly (readonly number[])[] = [
  [6,10,10,6,3,10,2,3,12,8,6,3,3], [4,8,9,7,4,9,3,4,10,9,7,5,4],
  [3,6,8,7,5,8,4,5,9,9,8,6,5], [2,5,7,7,6,7,5,6,8,9,8,7,6],
  [2,4,6,7,7,6,6,7,7,9,8,8,7], [2,4,5,7,8,6,7,7,6,9,8,9,8],
];
export const DAILY_WEIGHTS: readonly number[] = [3,6,8,7,5,8,4,5,9,9,8,6,5];

export function weightsForStage(stage: number, daily = false): FamilyWeights {
  const values = daily ? DAILY_WEIGHTS : rows[Math.max(0, Math.min(5, stage - 1))] ?? rows[0]!;
  return Object.fromEntries(FAMILY_IDS.map((family, index) => [family, values[index] ?? 0])) as FamilyWeights;
}
export function stageForScore(score: number): number {
  return score >= 45_000 ? 6 : score >= 25_000 ? 5 : score >= 12_000 ? 4 : score >= 5_000 ? 3 : score >= 1_500 ? 2 : 1;
}
export function flavoursForStage(stage: number): Flavour[] {
  const count = stage >= 5 ? 7 : stage >= 3 ? 6 : 5;
  return Array.from({ length: count }, (_, index) => (index + 1) as Flavour);
}
export function f2Probability(stage: number): number {
  return [1, 1, 0.9, 0.75, 0.6, 0.5][Math.max(0, Math.min(5, stage - 1))] ?? 0.5;
}
export function familyDefs(family: FamilyId) { return PIECES.filter((piece) => piece.family === family); }
