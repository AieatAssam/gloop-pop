import { describe, expect, it } from 'vitest';
import { buildChallengeText, buildDailyShareText, parseChallenge } from './shareText';

describe('share text', () => {
  it('matches the daily layout and challenge example exactly', () => {
    const result = { dayKey: '', score: 8450, trays: [1,1,0,2,1,0,4,1,1,6,1,0,1,1,2,7,0,1,2,1,1,1,2,0,1,1,1,1], bestCombo: 7, lines: 0, biggestPop: 18, allClears: 0 };
    expect(buildDailyShareText(12, 6, result, 5, 'owner.github.io/gloop-pop')).toBe('Gloop Pop Daily #12 🍇\nScore 8,450 · Best combo 7\n🟩🟩⬜🟨🟩⬜🟧🟩🟩🟥\n🟩⬜🟩🟩🟨🟪⬜🟩🟨🟩\n🟩🟩🟨⬜🟩🟩🟩🟩⬛⬛\n🔥 5-day streak\nowner.github.io/gloop-pop');
    expect(buildChallengeText({ score: 8450, biggestPop: 18, bestCombo: 7, flavour: 1 }, 'classic', 'owner.github.io/gloop-pop/?beat=8450&f=cherry')).toBe('I scored 8,450 in Gloop Pop 🍒\nBiggest pop: 18 cells · Best combo 7\nCan you beat it?\nowner.github.io/gloop-pop/?beat=8450&f=cherry');
  });
  it('rejects invalid target values and maps unknown flavours to cherry', () => {
    expect(parseChallenge('?beat=100&f=unknown')).toEqual({ score: 100, flavour: 1 }); expect(parseChallenge('?beat=10000001&f=cherry')).toBeNull();
  });
});
