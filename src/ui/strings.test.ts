import { describe, expect, it } from 'vitest';
import { ACHIEVEMENT_COPY, S } from './strings';
import { MISSIONS } from '../core/missions';

const bannedWordsSample = ['epic', 'insane', 'awesome', 'legendary', 'ultimate'];

describe('player-facing strings', () => {
  it('does not include banned hype words', () => {
    const allStrings = [S.score, S.best('1'), S.combo(1, '1.0'), S.comboLost, S.pop, S.bigPop, S.hugePop, S.megaPop, S.allClear, S.double, S.triple, S.quad, S.newBest].join(' ').toLowerCase();
    for (const word of bannedWordsSample) expect(allStrings).not.toContain(word);
  });
  it('keeps weekly goal copy in the UI string table with the design wording', () => {
    expect(['lines', 'pops', 'score', 'combo6', 'bigpops', 'dailies', 'allclear', 'multi'].map((id) => S.weeklyTitle(id))).toEqual([
      'This week: Clear 150 lines', 'This week: Pop 300 popped cells', 'This week: Score 60,000 points in total',
      'This week: Reach combo 6 in 5 different runs', 'This week: Make 10 Big Pops (8+ cells)',
      'This week: Finish 4 daily challenges', 'This week: Empty the board 2 times',
      'This week: Clear 2+ lines with one piece 25 times',
    ]);
    expect(S.poppedCells).toBe('Popped cells');
    expect(S.weeklyReset(1)).toBe('Resets in 1 day');
    expect(S.weeklyResetHours(1)).toBe('Resets in 1 hour');
    expect(S.daily(1200)).toBe('Daily #1,200');
  });
  it('matches the eleven How to Play rules, controls, and scoring line from design §16.5', () => {
    expect([S.howToRule1, S.howToRule2, S.howToRule3, S.howToRule4, S.howToRule5, S.howToRule6, S.howToRule7, S.howToRule8, S.howToRule9, S.howToRule10, S.howToRule11]).toEqual([
      "Drag pieces onto the board. Pieces can't be rotated.",
      'Fill a whole row or column to clear it. Clearing several at once scores much more.',
      'Same colours join into one gloop. Clear a line through any part of a gloop and the whole gloop pops for bonus points. Gloops of 8+ cells give a Big Pop bonus.',
      'Keep your combo going. Clear a line at least once every 3 pieces. Each clear in a row raises your multiplier.',
      'You get 3 pieces at a time. Place all 3 to get new ones. New pieces always include at least one that fits.',
      'The game ends when none of your pieces fit. In Classic you have one rescue per run: clear 10 lines to charge it.',
      'Daily challenge: the same board and pieces for everyone, every day. Your first try counts. Share your result with friends.',
      'Targets: in Classic and Expert, reach the next target score for +5 coins. Each run also has one mini goal.',
      'Daily missions: three small goals a day. They count in every mode. Rewards wait until you claim them.',
      'Adventure: levels with a goal and a move limit. Win to open the next level. More moves left means more stars.',
      'Sugar cubes: clear a line through a cube to remove it. Hard cubes need 2 clears. Cubes never join gloops.',
    ]);
    expect(S.howToControls).toBe('Drag with the mouse, or press 1, 2, 3 to pick a piece, arrow keys to move it, Space to place. Esc pauses. M mutes.');
    expect(S.howToScoring).toBe('Each cell placed: 1 · 1 line: 100 · 2 lines: 300 · 3 lines: 600 · 4 lines: 1,000 · Each popped cell: 20 · Big Pop: +200 · Huge Pop: +600 · Mega Pop: +1,500 · Empty board: +2,000 · Combo multiplies everything except placing.');
    const achievementText = Object.values(ACHIEVEMENT_COPY).map((entry) => `${entry.name} ${entry.description}`).join(' ').toLowerCase();
    expect(achievementText).not.toContain('extra cell');
  });
  it('matches every mission string from design §24.3 exactly', () => {
    const text: Record<string,string> = {lines15:'Clear 15 lines',pieces40:'Place 40 pieces',gloop25:'Pop 25 gloop cells',bigpop1:'Make a Big Pop (8+ cells)',combo3:'Reach combo 3',double1:'Clear 2 lines in one move',score3k:'Score 3,000 in one run',runs2:'Finish 2 runs',advwin1:'Win an Adventure level',cherry20:'Clear or pop 20 cherry cells',lines40:'Clear 40 lines',blueberry40:'Clear or pop 40 blueberry cells',combo6:'Reach combo 6',bigpop3:'Make 3 Big Pops',score10k:'Score 10,000 in one run',triple1:'Clear 3 lines in one move',cross3:'Clear a row and a column at once 3 times',advwin3:'Win 3 Adventure levels',adv3star:'Win an Adventure level with 3 stars',orange40:'Clear or pop 40 orange cells',lines80:'Clear 80 lines',hugepop1:'Make a Huge Pop (15+ cells)',combo10:'Reach combo 10',score20k:'Score 20,000 in one run',allclear1:'Empty the board once',multi10:'Clear 2+ lines in one move 10 times',lemon70:'Clear or pop 70 lemon cells',advstars6:'Earn 6 new Adventure stars',score50k:'Score 50,000 in total'};
    for (const mission of MISSIONS) expect(S.missionText(mission.id)).toBe(text[mission.id]);
  });
  it('matches the Settings and Credits copy from design §16.4', () => {
    expect([S.settingSfx, S.settingSfxVolume, S.settingMusic, S.settingMusicVolume, S.settingVibration, S.settingReduceMotion, S.settingPatterns, S.showTutorial, S.credits, S.resetProgress]).toEqual([
      'Sound effects', 'Effects volume', 'Music', 'Music volume', 'Vibration', 'Reduce motion', 'Colour-blind patterns', 'Show tutorial again', 'Credits', 'Reset all progress',
    ]);
    expect(S.volumeValue(70)).toBe('70%');
    expect(S.creditsIntro).toBe('Gloop Pop uses free sounds and music made by these people. Thank you!');
    expect(S.creditsNote).toBe('CC0 means anyone may use it for free. We credit them anyway.');
  });
  it('uses the exact short and full mini-goal labels from design §24.2', () => {
    expect(['bigpop','combo4','double','cross','flavour12','lines12','pop15','grow12'].map((id) => S.miniShort(id, 0, 4))).toEqual(['Big Pop 0/1','Combo 0/4','2 lines at once 0/1','Row + column 0/1','Apple cells 0/12','Lines 0/12','Gloop cells 0/15','12-cell gloop 0/1']);
    expect(S.miniText('flavour12', 4)).toBe('Clear or pop 12 apple cells');
    expect(S.targetCrossed(5000, 5)).toBe('5,000 ✓ +5 coins');
  });
});
