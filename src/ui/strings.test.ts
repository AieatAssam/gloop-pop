import { describe, expect, it } from 'vitest';
import { S } from './strings';

const bannedWordsSample = ['epic', 'insane', 'awesome', 'legendary', 'ultimate'];

describe('player-facing strings', () => {
  it('does not include banned hype words', () => {
    const allStrings = [S.score, S.best('1'), S.combo(1, '1.0'), S.comboLost, S.pop, S.bigPop, S.hugePop, S.megaPop, S.allClear, S.double, S.triple, S.quad, S.newBest].join(' ').toLowerCase();
    for (const word of bannedWordsSample) expect(allStrings).not.toContain(word);
  });
});
