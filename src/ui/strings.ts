// Player-facing strings are copied from design §16.4.
function weeklyTitle(id: string): string {
  switch (id) {
    case 'lines': return 'This week: Clear 150 lines';
    case 'pops': return 'This week: Pop 300 popped cells';
    case 'score': return 'This week: Score 60,000 points in total';
    case 'combo6': return 'This week: Reach combo 6 in 5 different runs';
    case 'bigpops': return 'This week: Make 10 Big Pops (8+ cells)';
    case 'dailies': return 'This week: Finish 4 daily challenges';
    case 'allclear': return 'This week: Empty the board 2 times';
    case 'multi': return 'This week: Clear 2+ lines with one piece 25 times';
    default: return 'This week: Clear 150 lines';
  }
}
const numberFormat = new Intl.NumberFormat('en-US');
const number = (value: number): string => numberFormat.format(value);
// spec-note: The achievement total is 41 per design §23.5 (#41 Rivals), despite §15 and §18 still saying 40.
export const S = {
  score: 'Score',
  best: (n: string): string => `Best ${n}`,
  combo: (count: number, multiplier: string): string => `Combo ${number(count)} ×${multiplier}`,
  comboLost: 'Combo lost',
  pop: 'Pop!',
  bigPop: 'Big Pop!',
  hugePop: 'Huge Pop!',
  megaPop: 'Mega Pop!',
  allClear: 'All clear!',
  double: 'Double!',
  triple: 'Triple!',
  quad: 'Quad!',
  newBest: 'New best!',
  mute: 'Mute', unmute: 'Unmute',
  stage2: 'Stage 2: bigger pieces', stage3: 'Stage 3: grape joins in', stage4: 'Stage 4: even bigger pieces', stage5: 'Stage 5: bubblegum joins in', stage6: 'Stage 6: expert pieces',
  firstLine: 'Nice!', firstDouble: 'Double!', firstBigPop: 'First Big Pop!', firstHugePop: 'First Huge Pop!', firstMegaPop: 'First Mega Pop!', firstAllClear: 'First All Clear!', firstCombo5: 'Combo 5! Keep clearing.', firstCombo10: 'Combo 10!',
  nearNewBest: (d: number): string => `New best! ${new Intl.NumberFormat('en-US').format(d)} more than before.`, nearBestShort: (d: number): string => `Only ${new Intl.NumberFormat('en-US').format(d)} points short of your best.`,
  lineCount: (n: number): string => `${new Intl.NumberFormat('en-US').format(n)} lines!`,
  nearPiece: (piece: string): string => `Your ${piece} needed just 1 more empty cell.`, nearLine: (kind: string, index: number): string => `${kind === 'row' ? 'Row' : 'Column'} ${number(index)} was 1 cell from clearing.`,
  nearXp: (x: number, level: number): string => `${new Intl.NumberFormat('en-US').format(x)} XP to Level ${new Intl.NumberFormat('en-US').format(level)}.`, nearWeekly: (k: number): string => `${new Intl.NumberFormat('en-US').format(k)} more to finish your weekly goal.`, nearAchievement: (k: number, unit: string, name: string): string => `${new Intl.NumberFormat('en-US').format(k)} more ${unit} for "${name}".`,
  pointsPop: (points: number): string => `+${new Intl.NumberFormat('en-US').format(points)}`, coinBonus: (coins: number): string => `+${new Intl.NumberFormat('en-US').format(coins)} coins`,
  shapeName: (shape: string): string => ({ dot: 'dot', bar2: '2-bar', bar3: '3-bar', bar4: '4-bar', bar5: '5-bar', squareSmall: 'small square', squareBig: 'big square', rectangle: 'rectangle', cornerSmall: 'small corner', cornerL: 'L', tee: 'T', zigzag: 'S', cornerBig: 'big corner' }[shape] ?? 'piece'),
  achievementUnit: (id: string): string => ({ big_pop_pro: 'Big Pops', long_gloop: 'cells', lines100: 'lines', lines1000: 'lines', lines5000: 'lines', pops500: 'popped cells', pops5000: 'popped cells', clean_freak: 'empty boards', level10: 'levels', level50: 'levels', collector: 'items', runs10: 'runs', runs100: 'runs', daily1: 'daily challenges', daily30: 'daily challenges', streak7: 'days', streak30: 'days', combo20: 'combo', score5k: 'points', score20k: 'points', score50k: 'points', score100k: 'points', expert25k: 'points' }[id] ?? 'goals'),
  dailyRunDone: (day: number): string => `Daily #${new Intl.NumberFormat('en-US').format(day)} done`, allTraysPlaced: 'All 30 trays placed!',
  nearFallback: (pop: number, lines: number): string => pop > 0 ? `Biggest pop this run: ${new Intl.NumberFormat('en-US').format(pop)} cells.` : `You cleared ${new Intl.NumberFormat('en-US').format(lines)} lines.`,
  targetShort: (distance: number, target: number): string => `${number(distance)} points short of the ${number(target)} target.`,
  pause: 'Paused', resume: 'Resume', restart: 'Restart', home: 'Home', settings: 'Settings',
  rescueUse: 'Use rescue', rescueDecline: 'No thanks', startOver: 'Start over', cancel: 'Cancel',
  rescueTitle: 'Out of room!', rescueBody: 'Use your rescue? It pops your biggest gloop and gives you 3 pieces that fit.',
  restartConfirm: 'Start over? This run will end.', noRoom: 'No room left', playAgain: 'Play again', shareScore: 'Share score',
  dailyGiveUpConfirm: "End today's run? It will count as your daily.",
  rescueReady: 'Rescue ready', rescueUsed: 'Rescue used',
  logo: 'Gloop Pop', level: (n: number): string => `Lv ${new Intl.NumberFormat('en-US').format(n)}`, coins: (n: number): string => new Intl.NumberFormat('en-US').format(n), play: 'Play',
  classic: 'Classic', classicDescription: 'Endless. How long can you last?', daily: (n: number): string => `Daily #${number(n)}`, dailyDescription: 'Same board for everyone today.',
  zen: 'Zen', zenDescription: 'No game over. Relax and pop.', expert: 'Expert', expertDescription: 'Bigger pieces, all 7 flavours, no rescue.',
  reachLevel: (n: number): string => `Reach Level ${number(n)}`, weeklyTitle, weeklyProgress: '87 / 150', weeklyResets: 'Resets in 3 days', weeklyReward: 'Reward: 200 coins, 150 XP, 1 freeze',
  streak: (n: number): string => `🔥 ${number(n)}-day streak`, freeze: (n: number): string => `❄️ ${number(n)} freeze`, streakStart: "Play today's daily to start a streak.",
  collection: 'Collection', achievements: 'Achievements', stats: 'Stats', howToPlay: 'How to play', back: 'Back', statsTitle: 'Stats',
  missionsTitle: 'Daily missions', missionReward: (coins: number, xp: number): string => `${number(coins)} coins · ${number(xp)} XP`, missionProgress: (progress: number, target: number): string => `${number(progress)} / ${number(target)}`, missionClaim: 'Claim', missionDone: 'Done', missionChangeAria: 'Change this mission', missionChangeReady: '1 free change per day', missionChangeUsed: 'Free change used. Next one tomorrow.', missionSet: 'Finish all 3: +50 coins, +50 XP', missionSetDone: 'All 3 done. New missions tomorrow.', missionDoneToast: (text: string): string => `Mission done: ${text}`, missionRewardToast: (coins: number, xp: number): string => `Mission reward: +${number(coins)} coins, +${number(xp)} XP`, missionSetToast: 'All 3 missions done! +50 coins, +50 XP', missionsReady: (count: number): string => `${number(count)} missions ready to claim`, oneMissionReady: '1 mission ready to claim', missionNear: (count: number, text: string): string => `${number(count)} more to finish "${text}".`,
  missionText: (id: string): string => ({ lines15:'Clear 15 lines',pieces40:'Place 40 pieces',gloop25:'Pop 25 gloop cells',bigpop1:'Make a Big Pop (8+ cells)',combo3:'Reach combo 3',double1:'Clear 2 lines in one move',score3k:'Score 3,000 in one run',runs2:'Finish 2 runs',advwin1:'Win an Adventure level',cherry20:'Clear or pop 20 cherry cells',lines40:'Clear 40 lines',blueberry40:'Clear or pop 40 blueberry cells',combo6:'Reach combo 6',bigpop3:'Make 3 Big Pops',score10k:'Score 10,000 in one run',triple1:'Clear 3 lines in one move',cross3:'Clear a row and a column at once 3 times',advwin3:'Win 3 Adventure levels',adv3star:'Win an Adventure level with 3 stars',orange40:'Clear or pop 40 orange cells',lines80:'Clear 80 lines',hugepop1:'Make a Huge Pop (15+ cells)',combo10:'Reach combo 10',score20k:'Score 20,000 in one run',allclear1:'Empty the board once',multi10:'Clear 2+ lines in one move 10 times',lemon70:'Clear or pop 70 lemon cells',advstars6:'Earn 6 new Adventure stars',score50k:'Score 50,000 in total' } as Record<string,string>)[id] ?? '',
  runsPlayed: 'Runs played', bestClassic: 'Best score (Classic)', bestExpert: 'Best score (Expert)', averageClassic: 'Average of last 20 Classic runs', linesCleared: 'Lines cleared',
  runsClassic: 'Classic runs', runsExpert: 'Expert runs', runsZen: 'Zen runs', runsDaily: 'Daily runs',
  poppedCells: 'Popped cells', biggestPop: 'Biggest pop', bestCombo: 'Best combo', allClears: 'All clears', piecesPlaced: 'Pieces placed', timePlayed: 'Time played',
  dailiesFinished: 'Dailies finished', bestDaily: 'Best daily score', currentStreak: 'Current streak', bestStreak: 'Best streak', achievementsLabel: 'Achievements', achievementsFraction: (count: number): string => `${new Intl.NumberFormat('en-US').format(count)} / 49`, statsChart: 'Last 20 Classic scores',
  debugXp: 'Give 5,000 XP',
  weekdayInitials: ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as readonly string[],
  controlsHint: 'Drag pieces, or press 1 2 3, arrows and Space',
  giveUp: 'Give up', endRun: 'End run', levelUp: (level: number): string => `Level ${number(level)}! +50 coins`, unlocked: (item: string): string => `Unlocked: ${item}`,
  rewardRow: (xp: number, coins: number): string => `+${new Intl.NumberFormat('en-US').format(xp)} XP · +${new Intl.NumberFormat('en-US').format(coins)} coins`, lock: '🔒',
  nextTarget: (target: number): string => `Next target ${number(target)}`,
  targetCrossed: (target: number, coins: number): string => `${number(target)} ✓ +${number(coins)} coins`,
  miniShort: (id: string, progress: number, flavour?: number): string => {
    const name = flavour ? S.flavourName(flavour).replace(/^./, (letter) => letter.toUpperCase()) : '';
    return ({ bigpop: `Big Pop ${number(progress)}/1`, combo4: `Combo ${number(progress)}/4`, double: `2 lines at once ${number(progress)}/1`, cross: `Row + column ${number(progress)}/1`, flavour12: `${name} cells ${number(progress)}/12`, lines12: `Lines ${number(progress)}/12`, pop15: `Gloop cells ${number(progress)}/15`, grow12: `12-cell gloop ${number(progress)}/1` } as Record<string, string>)[id] ?? '';
  },
  miniDone: (id: string, flavour?: number): string => `${S.miniShort(id, 0, flavour).replace(/ \d+\/\d+$/, '')} ✓`,
  miniText: (id: string, flavour?: number): string => ({ bigpop: 'Make a Big Pop', combo4: 'Reach combo 4', double: 'Clear 2 lines in one move', cross: 'Clear a row and a column at once', flavour12: `Clear or pop 12 ${flavour ? S.flavourName(flavour).toLowerCase() : 'cherry'} cells`, lines12: 'Clear 12 lines', pop15: 'Pop 15 gloop cells', grow12: 'Grow a gloop to 12 cells' } as Record<string, string>)[id] ?? '',
  miniToast: (text: string): string => `Mini goal: ${text}`,
  miniDoneReward: 'Done · +15 coins',
  targetsReward: (count: number): string => `Targets: ${number(count)} · +${number(count * 5)} coins`, miniReward: 'Mini goal · +15 coins',
  targetAria: (target: number, distance: number): string => `Next target ${number(target)}. ${number(distance)} to go.`,
  miniAria: (text: string, progress: number, target: number): string => `Mini goal: ${text}. ${number(progress)} of ${number(target)}.`,
  levelBarCurrent: (level: number): string => `Level ${new Intl.NumberFormat('en-US').format(level)}`, levelBarNext: (level: number): string => new Intl.NumberFormat('en-US').format(level + 1),
  gameOverNote: (fallback: string, level?: number): string => level ? `${fallback} · Level ${number(level)}!` : fallback,
  streakStatus: (days: number, freezes: number): string => `🔥 ${number(days)}-day streak · ❄️ ${number(freezes)} freeze`,
  rescueCharge: (charge: number): string => `${number(charge)}/10`, rescueLabel: (charge: number): string => `Rescue ${number(charge)}/10`, stageLabel: (stage: number): string => `Stage ${number(stage)}`, extraPopCount: (count: number): string => `+${number(count)}`,
  statsTime: (hours: number, minutes: number): string => hours > 0 ? `${number(hours)} h ${number(minutes)} m` : `${number(minutes)} m`,
  catalogueName: (id: string): string => ({ midnight: 'Midnight Candy Shop', sunset: 'Strawberry Sunset', aquarium: 'Mint Aquarium', observatory: 'Starlight Observatory', kitchen: 'Cinnamon Kitchen', snowglobe: 'Snow Globe', dawn: 'Golden Dawn', plain: 'Plain', googly: 'Googly Eyes', freckles: 'Freckles', catears: 'Cat Ears', glasses: 'Round Glasses', mustache: 'Mustaches', bowtie: 'Bow Ties', crown: 'Crowns', sparkles: 'Sugar Sparkles', hearts: 'Hearts', stars: 'Stars', bubbles: 'Bubbles', confetti: 'Confetti', fireworks: 'Fireworks' }[id] ?? id),
  coinBalance: (n: number): string => `${new Intl.NumberFormat('en-US').format(n)} coins`,
  collectionTitle: 'Collection', collectionThemes: 'Themes', collectionSkins: 'Skins', collectionPops: 'Pop effects',
  use: 'Use', inUse: 'In use', needCoins: (amount: number): string => `Need ${new Intl.NumberFormat('en-US').format(amount)} more coins`,
  itemPrice: (amount: number): string => `${new Intl.NumberFormat('en-US').format(amount)} coins`, achievementRequirement: (name: string): string => `Get "${name}"`,
  claim: 'Claim', dailyDone: (n: number, score: string, time: string): string => `Done · ${score} · Next in ${time}`,
  copied: 'Copied! Paste it anywhere.',
  weeklyDone: 'Weekly goal done! +200 coins, +150 XP, +1 freeze',
  challengeFriend: 'Challenge a friend', youBeatFriend: 'You beat your friend!',
  biggestPopStat: (n: number): string => `Biggest pop: ${new Intl.NumberFormat('en-US').format(n)} cells`, biggestGloopStat: (n: number): string => `Biggest gloop: ${new Intl.NumberFormat('en-US').format(n)} cells`,
  bestComboStat: (n: number): string => `Best combo ${new Intl.NumberFormat('en-US').format(n)}`, linesStat: (n: number): string => `Lines ${new Intl.NumberFormat('en-US').format(n)}`,
  beatFriendBy: (n: number): string => `You beat your friend by ${new Intl.NumberFormat('en-US').format(n)}!`, shortOfFriend: (n: number): string => `${new Intl.NumberFormat('en-US').format(n)} short of your friend's score.`,
  dailyPillDone: 'Daily ✓', dailyKeepStreak: (day: number, days: number): string => `Daily #${new Intl.NumberFormat('en-US').format(day)} · keep your 🔥${new Intl.NumberFormat('en-US').format(days)}`,
  dailyLabel: 'Daily', fodToday: (name: string): string => `Today: ${name} pops score double.`,
  canBeatIt: 'Can you beat it?',
  streakCard: (days: number): string => `${new Intl.NumberFormat('en-US').format(days)}-day streak`,
  streakFlame: '🔥',
  flavourName: (flavour: number): string => ['Cherry','Orange','Lemon','Apple','Blueberry','Grape','Bubblegum'][flavour - 1] ?? 'Cherry',
  streakStarted: 'Streak started!', streakDays: (days: number): string => `${new Intl.NumberFormat('en-US').format(days)}-day streak!`,
  freezeKeptStreak: 'A freeze kept your streak alive.', streakMilestone: (days: number): string => `${new Intl.NumberFormat('en-US').format(days)}-day streak! +1 freeze`,
  freezeSaved: (days: number): string => `A freeze saved your ${new Intl.NumberFormat('en-US').format(days)}-day streak.`, streakEnded: (days: number): string => `Your streak ended at ${new Intl.NumberFormat('en-US').format(days)} days. Play today to start a new one.`,
  toBeatBest: (n: number): string => `${new Intl.NumberFormat('en-US').format(n)} to beat your best`, toBeatFriend: (n: number): string => `${new Intl.NumberFormat('en-US').format(n)} to beat your friend's score`,
  weeklyShort: (n: number): string => `${new Intl.NumberFormat('en-US').format(n)} more to finish your weekly goal.`,
  dailyTray: (tray: number): string => `Tray ${number(tray)} / 30`, fodDouble: (name: string): string => `${name} pops ×2`,
  dailyResult: (n: number): string => `Daily #${number(n)}`, dailyCombo: (n: number): string => `Best combo ${number(n)}`, dailyBiggest: (n: number): string => `Biggest pop ${number(n)}`,
  share: 'Share', shareImage: 'Share image', practice: 'Practice (not counted)', nextDaily: (time: string): string => `Next daily in ${time}`,
  dailyLegend: '⬜ no clear · 🟩 1 line · 🟨 2–3 · 🟧 4–5 · 🟥 6+ · 🟪 all clear or huge pop',
  // On screen the legend uses colour swatches that match the tiles exactly; the emoji version is for the share text.
  dailyLegendItems: ['no clear', '1 line', '2–3', '4–5', '6+', 'all clear or huge pop'] as readonly string[],
  tutorialSkip: 'Skip', tutorialStep1: 'Drag this piece into the gap.', tutorialClear: 'Full rows clear!', tutorialStep2: 'Fill a row and a column at once for more points.', tutorialTwo: 'Two at once!', tutorialStep3: 'Same colours join into one gloop. Clear this row to pop the whole green gloop!', tutorialBig: 'Big Pop! Bigger gloops score more.', tutorialStep4: 'You get 3 pieces. Place all 3 to get new ones.', tutorialEnd: 'The game ends when nothing fits. Good luck!', tutorialTip: 'Tip: keep clearing to grow your combo.',
  tutorialChallenge: (score: number): string => `Now beat your friend's ${new Intl.NumberFormat('en-US').format(score)}!`,
  settingSfxVolume: 'Effects volume', settingMusicVolume: 'Music volume', volumeValue: (n: number): string => `${new Intl.NumberFormat('en-US').format(n)}%`, credits: 'Credits', creditsIntro: 'Gloop Pop uses free sounds and music made by these people. Thank you!', creditsNote: 'CC0 means anyone may use it for free. We credit them anyway.', creditsMusic: 'Music', creditsSoundEffects: 'Sound effects', creditsCodeAndArt: 'Code and art',
  settingSfx: 'Sound effects', settingMusic: 'Music', settingVibration: 'Vibration', settingReduceMotion: 'Reduce motion', settingMatchDevice: 'Match device', settingOn: 'On', settingOff: 'Off', settingPatterns: 'Colour-blind patterns', showTutorial: 'Show tutorial again', resetProgress: 'Reset all progress', resetConfirm: "Delete all progress? Your level, coins, unlocks, stats and streak will be gone. This can't be undone.", deleteEverything: 'Delete everything', howToRule1: 'Drag pieces onto the board. Pieces can\'t be rotated.', howToRule2: 'Fill a whole row or column to clear it. Clearing several at once scores much more.', howToRule3: 'Same colours join into one gloop. Clear a line through any part of a gloop and the whole gloop pops for bonus points. Gloops of 8+ cells give a Big Pop bonus.', howToRule4: 'Keep your combo going. Clear a line at least once every 3 pieces. Each clear in a row raises your multiplier.', howToRule5: 'You get 3 pieces at a time. Place all 3 to get new ones. New pieces always include at least one that fits.', howToRule6: 'The game ends when none of your pieces fit. In Classic you have one rescue per run: clear 10 lines to charge it.', howToRule7: 'Daily challenge: the same board and pieces for everyone, every day. Your first try counts. Share your result with friends.', howToRule8: 'Targets: in Classic and Expert, reach the next target score for +5 coins. Each run also has one mini goal.', howToRule9: 'Daily missions: three small goals a day. They count in every mode. Rewards wait until you claim them.', howToControls: 'Drag with the mouse, or press 1, 2, 3 to pick a piece, arrow keys to move it, Space to place. Esc pauses. M mutes.', howToScoring: 'Each cell placed: 1 · 1 line: 100 · 2 lines: 300 · 3 lines: 600 · 4 lines: 1,000 · Each popped cell: 20 · Big Pop: +200 · Huge Pop: +600 · Mega Pop: +1,500 · Empty board: +2,000 · Combo multiplies everything except placing.',
  weeklyReset: (days: number): string => `Resets in ${number(days)} ${days === 1 ? 'day' : 'days'}`, weeklyResetHours: (hours: number): string => `Resets in ${number(hours)} ${hours === 1 ? 'hour' : 'hours'}`,
  rivalCard: (emoji: string, score: string): string => `${emoji} A friend scored ${score}. Beat it!`,
  achievementTitle: 'Achievements', achievementProgress: (current: number, total: number): string => `${new Intl.NumberFormat('en-US').format(current)} / ${new Intl.NumberFormat('en-US').format(total)}`,
  achievementUnlock: (name: string, coins: number): string => `Achievement: ${name} · +${new Intl.NumberFormat('en-US').format(coins)} coins`,
  achievementName: (id: string): string => ACHIEVEMENT_COPY[id]?.name ?? id,
  gameOverFallback: (biggestPop: number, lines: number): string => biggestPop > 0 ? `Biggest pop this run: ${new Intl.NumberFormat('en-US').format(biggestPop)} cells.` : `You cleared ${new Intl.NumberFormat('en-US').format(lines)} lines.`,
};

export const ACHIEVEMENT_COPY: Readonly<Record<string, { name: string; description: string }>> = {
 first_clear:{name:'First Clear',description:'Clear a line.'}, double:{name:'Double',description:'Clear 2 lines with one piece.'}, triple:{name:'Triple',description:'Clear 3 lines with one piece.'}, quad:{name:'Four at Once',description:'Clear 4 lines with one piece.'}, crossroads:{name:'Crossroads',description:'Clear a row and a column with one piece.'},
 first_pop:{name:'Pop!',description:'Pop a gloop by clearing a line through it.'}, big_pop:{name:'Big Pop',description:'Pop a gloop of 8 or more cells.'}, huge_pop:{name:'Huge Pop',description:'Pop a gloop of 15 or more cells.'}, mega_pop:{name:'Mega Pop',description:'Pop a gloop of 24 or more cells. Unlocks Crowns.'}, big_pop_pro:{name:'Big Pop Pro',description:'Make 50 Big Pops in total.'}, long_gloop:{name:'Long Gloop',description:'Grow a gloop to 12 cells.'},
 one_flavour:{name:'One Flavour',description:'Clear a line where all 8 cells are the same flavour.'}, spotless:{name:'Spotless',description:'Empty the whole board.'}, clean_freak:{name:'Clean Freak',description:'Empty the whole board 10 times.'}, combo5:{name:'On a Roll',description:'Reach combo 5.'}, combo10:{name:'Ten in a Row',description:'Reach combo 10.'}, combo20:{name:'Twenty in a Row',description:'Reach combo 20.'},
 score5k:{name:'5,000 Club',description:'Score 5,000 in one Classic run.'}, score20k:{name:'20,000 Club',description:'Score 20,000 in one Classic run.'}, score50k:{name:'50,000 Club',description:'Score 50,000 in one Classic run.'}, score100k:{name:'100,000 Club',description:'Score 100,000 in one Classic run.'}, expert25k:{name:'Expert 25,000',description:'Score 25,000 in one Expert run.'}, close_call:{name:'Close Call',description:'Clear a line when 52 or more cells are filled.'}, no_help:{name:'No Help Needed',description:'Score 20,000 in Classic without using the rescue.'}, saved:{name:'Saved!',description:'Use a rescue, then clear a line with the next 3 pieces.'},
 lines100:{name:'Line Worker',description:'Clear 100 lines in total.'}, lines1000:{name:'Line Boss',description:'Clear 1,000 lines in total.'}, lines5000:{name:'Line Legend',description:'Clear 5,000 lines in total.'}, pops500:{name:'Popper',description:'Pop 500 popped cells in total.'}, pops5000:{name:'Pop Star',description:'Pop 5,000 popped cells in total.'}, runs10:{name:'Regular',description:'Finish 10 runs.'}, runs100:{name:'Hundred Runs',description:'Finish 100 runs.'},
 daily1:{name:'Daily Player',description:'Finish a daily challenge.'}, daily30:{name:'Daily Regular',description:'Finish 30 daily challenges.'}, streak7:{name:'One Week',description:'Reach a 7-day streak.'}, streak30:{name:'One Month',description:'Reach a 30-day streak.'}, weekly1:{name:'Weekly Winner',description:'Finish a weekly goal.'}, level10:{name:'Level 10',description:'Reach Level 10.'}, level50:{name:'Level 50',description:'Reach Level 50.'}, collector:{name:'Collector',description:'Own every theme, skin and pop effect.'}, rivals:{name:'Rivals',description:"Beat a friend's challenge score."}, adv_first:{name:'First Level',description:'Win an Adventure level.'}, adv_20:{name:'Twenty Levels',description:'Win 20 Adventure levels.'}, adv_all:{name:'Every Level',description:'Win all 120 Adventure levels.'}, three_stars10:{name:'Three Stars',description:'Get 3 stars on 10 Adventure levels.'}, all_stars:{name:'Every Star',description:'Get all 360 Adventure stars.'}, win_streak5:{name:'Five Wins',description:'Win 5 new Adventure levels in a row.'}, missions10:{name:'Ten Missions',description:'Finish 10 daily missions.'}, missions100:{name:'Hundred Missions',description:'Finish 100 daily missions.'},
};
