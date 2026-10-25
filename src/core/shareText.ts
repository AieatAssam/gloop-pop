import type { Flavour } from './types';
export interface DailyShareResult { score: number; trays: number[]; bestCombo: number }

const EMOJI = ['🍒','🍊','🍋','🍏','🫐','🍇','🍬'] as const;
export function buildDailyShareText(day: number, flavour: Flavour, result: DailyShareResult, streak: number, hostPath: string): string {
  const rows: string[] = [];
  for (let row = 0; row < 3; row += 1) rows.push(Array.from({ length: 10 }, (_, col) => {
    const value = result.trays[row * 10 + col]; return value === undefined ? '⬛' : value === 0 ? '⬜' : value === 1 ? '🟩' : value <= 3 ? '🟨' : value <= 5 ? '🟧' : value === 7 ? '🟪' : '🟥';
  }).join(''));
  return [`Gloop Pop Daily #${day} ${EMOJI[flavour - 1]}`, `Score ${new Intl.NumberFormat('en-US').format(result.score)}${result.bestCombo >= 2 ? ` · Best combo ${new Intl.NumberFormat('en-US').format(result.bestCombo)}` : ''}`, ...rows, ...(streak >= 2 ? [`🔥 ${streak}-day streak`] : []), hostPath].join('\n');
}

export interface ChallengeSummary { score: number; biggestPop: number; bestCombo: number; flavour: Flavour }
export interface Challenge { score: number; flavour: Flavour }
export function parseChallenge(search: string): Challenge | null {
  const params = new URLSearchParams(search); const raw = params.get('beat'); const score = Number(raw); if (!raw || !/^\d+$/.test(raw) || !Number.isSafeInteger(score) || score < 1 || score > 10_000_000) return null;
  // spec-note: Unknown flavour names fall back to cherry, matching the receiving-link rule.
  const valid = ['cherry','orange','lemon','apple','blueberry','grape','bubblegum']; const name = params.get('f'); const flavour = Math.max(1, valid.indexOf(name ?? 'cherry') + 1) as Flavour; return { score, flavour };
}
export function buildChallengeText(summary: ChallengeSummary, mode: 'classic' | 'expert', url: string): string {
  const emoji = EMOJI[summary.flavour - 1]; const lines = [`I scored ${new Intl.NumberFormat('en-US').format(summary.score)} in Gloop Pop${mode === 'expert' ? ' Expert' : ''} ${emoji}`];
  const highlights = [summary.biggestPop >= 8 ? `Biggest pop: ${summary.biggestPop} cells` : '', summary.bestCombo >= 2 ? `Best combo ${summary.bestCombo}` : ''].filter(Boolean);
  if (highlights.length) lines.push(highlights.join(' · ')); lines.push('Can you beat it?', url); return lines.join('\n');
}

export function flavourName(flavour: Flavour): string { return ['cherry','orange','lemon','apple','blueberry','grape','bubblegum'][flavour - 1] ?? 'cherry'; }
