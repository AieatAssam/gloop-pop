import { flavoursForStage, f2Probability, stageForScore, weightsForStage } from './stages';
import type { FamilyWeights } from './stages';
import type { Flavour, ModeId } from './types';

export interface ModeConfig {
  id: ModeId; rescue: boolean; zenShake: boolean; endless: boolean; maxTrays?: number;
  stageForScore(score: number): number; weightsForStage(stage: number): FamilyWeights;
  flavoursForStage(stage: number): Flavour[]; f2Probability(stage: number): number;
  rewardMult: number; savesBest: boolean;
}
/** Design §9.2: Expert deals a fully placeable tray 90% of the time (balance pass 2026-10-25). */
export const EXPERT_F2 = 0.9;
const create = (id: ModeId, values: Partial<ModeConfig> = {}): ModeConfig => ({
  id, rescue: false, zenShake: false, endless: true, stageForScore, weightsForStage: (stage) => weightsForStage(stage),
  flavoursForStage, f2Probability, rewardMult: 1, savesBest: true, ...values,
});

export const MODES: Readonly<Record<'classic' | 'expert' | 'zen' | 'daily', ModeConfig>> = {
  classic: create('classic', { rescue: true }),
  expert: create('expert', { stageForScore: (score) => score >= 15_000 ? 6 : 5, weightsForStage: (stage) => weightsForStage(stage), flavoursForStage: () => flavoursForStage(5), f2Probability: () => EXPERT_F2, rewardMult: 1.5 }),
  zen: create('zen', { zenShake: true, savesBest: false, stageForScore: () => 2, weightsForStage: () => weightsForStage(2), flavoursForStage: () => flavoursForStage(2), f2Probability: () => 1, rewardMult: 0.5 }),
  daily: create('daily', { rescue: false, maxTrays: 30, savesBest: true, f2Probability: () => 0, weightsForStage: () => weightsForStage(3, true), flavoursForStage: () => flavoursForStage(3) }),
};

export function modeConfig(mode: ModeId): ModeConfig {
  return mode === 'tutorial' || mode === 'adventure' ? MODES.classic : MODES[mode];
}
