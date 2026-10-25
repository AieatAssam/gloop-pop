// M2.1–M3.4: canvas play loop, durable runs, progression and Home/Stats routing.
// spec-note: Load remains on Classic because design §9.1 specifies that entry; Home is one menu action away.
import { createCanvasSurface } from '../render/canvas';
import { createBackground } from '../render/background';
import { computeLayout, type Layout } from '../render/layout';
import { startRenderLoop } from '../render/loop';
import { PALETTE } from '../render/palette';
import { createBoardView, traySlotRect } from '../render/boardView';
import { drawHud } from '../render/hudView';
import { createDirector } from '../render/director';
import { dispatchImmediately } from '../render/fx/hitStop';
import { createPointerInput, pointerDropPoint } from '../input/pointer';
import { attachKeyboard } from '../input/keyboard';
import { createSession, runToResumeOnBoot } from './session';
import { createGameUi } from '../ui/dom';
import { createTopBar } from '../ui/topBar';
import { S } from '../ui/strings';
import { loadSave, saveNow, setSaveWritesDisabled } from '../platform/saveStore';
import veteranSave from '../meta/fixtures/save-v1-veteran.json';
import { migrate } from '../meta/migrate';
import type { SaveV2 } from '../meta/saveSchema';
import { recordAdventureRunStats, recordRun } from '../meta/stats';
import { grantXp, rewardsForRun, totalXpForLevel, xpToNext } from '../meta/progression';
import { summarizeRun } from '../meta/runSummary';
import { createRouter } from './router';
import { createHomeScreen } from '../ui/screens/home';
import { createStatsScreen } from '../ui/screens/stats';
import { createToasts } from '../ui/toasts';
import { onSaveVisibility } from '../platform/visibility';
import type { Action, GameEvent, ModeId } from '../core/types';
import type { Frame } from '../render/loop';
import { setEquippedCosmetics, THEME_KEYS, type SkinId, type PopEffectId } from '../render/themes';
import { createCollectionScreen } from '../ui/screens/collection';
import { createAchievementsScreen } from '../ui/screens/achievements';
import { grantAchievements } from '../meta/achievements';
import { PIECES } from '../core/pieces';
import { dayKeyFromMs, dayNumber, flavourForDay } from '../core/daily';
import { recordDaily } from '../meta/dailyRecord';
import { streakMilestone, updateStreak } from '../meta/streak';
import { addWeeklyProgress, claimWeeklyReward, WEEKLY_TARGETS } from '../meta/weeklyGoal';
import { ACHIEVEMENTS, COUNTER_ACHIEVEMENTS, achievementProgress } from '../meta/achievements';
import { WEEKLY_POOL, weekIndexFromMs } from '../core/weekly';
import { dailyResult } from '../meta/dailyRecord';
import { createDailyResultScreen } from '../ui/screens/dailyResult';
import { buildDailyShareText } from '../core/shareText';
import { shareText } from '../platform/share';
import { shareImage } from '../platform/share';
import { buildChallengeText, flavourName, parseChallenge } from '../core/shareText';
import { initAudioOnFirstInput, playGameEvents, startMusic, setAudioPaused, setSfxEnabled, setMusicEnabled, setMasterMuted, setEffectsVolume, setMusicVolume, sfx, music, onLand, onImpact, onBurst, onPopFirst, onClimax, audioDebugLine } from '../audio';
import { planMove } from '../audio/movePlan';
import { shouldReduceMotion, devicePrefersReducedMotion, canStartSlowMo } from '../platform/motion';
import { addComboTicks, hapticPattern, vibrate } from '../platform/haptics';
import { detectFirsts } from '../meta/firsts';
import { nearMissMessages } from '../core/nearMiss';
import { tutorialGame } from '../core/tutorial';
import { newGame, fitsAnywhere } from '../core/game';
import { drawGhostHand, tutorialHandPoints } from '../render/ghostHand';
import { createTutorialBubble } from '../ui/tutorialBubble';
import { createSettingsScreen } from '../ui/screens/settings';
import { createHowToPlayScreen } from '../ui/screens/howToPlay';
import { defaultSave } from '../meta/saveSchema';
import { setColourBlindPatterns } from '../render/gloopRenderer';
import { chooseBotMove } from '../core/sim';
import { seededRng } from '../core/rng';
import { createFeelScene, createGoalScene } from './demoScenes';
import { musicState } from '../audio/musicState';
import { createCreditsScreen } from '../ui/screens/credits';
import { drawGoalStrip } from '../render/goalStrip';
import { nextTarget } from '../core/goals';
import { addMissionProgress, claimMission, missionNearMiss, rerollMission, rollDay } from '../meta/missions';
import { MISSIONS } from '../core/missions';
import { newAdventureGame } from '../core/adventure';
import { levelParams } from '../core/levels';
import { assistAvailable, isStaleAttempt, recordLevelResult, unlockAdventure } from '../meta/adventureProgress';
import { armBoosters, returnUnused, type BoosterSelection } from '../meta/boosters';
import { createBoosterBar } from '../ui/boosterBar';
import { adventureResultLabel, recordPendingAdventureResult } from './adventureResult';

export async function bootApp(): Promise<void> {
  const canvas = document.querySelector<HTMLCanvasElement>('#game'); const uiRoot = document.querySelector<HTMLElement>('#ui');
  if (!canvas || !uiRoot) throw new Error('Missing game surface.');
  const gameCanvas = canvas;
  const query = new URLSearchParams(window.location.search); const debug = query.get('debug') === '1'; const veteranDemo = debug && query.get('save') === 'veteran';
  // spec-note: The level bot is development-only, even for debug URLs, so it never ships in the production bundle.
  const chooseAdventureBot = debug && import.meta.env.DEV ? (await import('../core/levelBot')).chooseLevelMove : undefined;
  setSaveWritesDisabled(veteranDemo || (debug && (query.has('demo') || query.has('level'))));
  let save = veteranDemo ? migrate(veteranSave) : loadSave(); save = rollDay(save, dayKeyFromMs(Date.now()));
  if (debug && (query.get('demo') === 'missions' || query.get('demo') === 'missions-done')) {
    const today = dayKeyFromMs(Date.now()); const done = query.get('demo') === 'missions-done';
    save.missions.day = today; save.missions.slots = done
      ? [{id:'lines15',pos:0,progress:15,claimed:true,issued:today},{id:'lines40',pos:0,progress:40,claimed:true,issued:today},{id:'lines80',pos:0,progress:80,claimed:true,issued:today}]
      : [{id:'lines15',pos:0,progress:15,claimed:false,issued:today},{id:'lines40',pos:0,progress:32,claimed:false,issued:today},{id:'lines80',pos:0,progress:80,claimed:true,issued:today}];
    save.missions.rerollDay = null; save.missions.shownToday = save.missions.slots.map((slot) => slot.id); save.missions.setPaid = done;
  }
  const savedRun = runToResumeOnBoot(save.inProgress);
  const skinMap: Record<string, SkinId> = { plain:'plain', googly:'googlyEyes', googlyEyes:'googlyEyes', freckles:'freckles', catears:'catEars', catEars:'catEars', glasses:'glasses', mustache:'mustache', bowtie:'bowtie', crown:'crown' };
  const syncCosmetics = (): void => setEquippedCosmetics({ theme: save.equipped.theme as keyof typeof PALETTE.theme, skin: skinMap[save.equipped.skin] ?? 'plain', popEffect: save.equipped.pop as PopEffectId });
  syncCosmetics();
  setMasterMuted(save.settings.muted); setSfxEnabled(save.settings.sfx); setMusicEnabled(save.settings.music); setEffectsVolume(save.settings.sfxVolume); setMusicVolume(save.settings.musicVolume);
  const adventureDemo = query.get('demo') ?? '';
  const defaultDemoLevel = adventureDemo === 'adventure-win' ? 1 : adventureDemo === 'adventure-lose' || adventureDemo === 'adventure-play' ? 87 : Number.NaN;
  const requestedLevel = Number(query.get('level') ?? defaultDemoLevel);
  const levelScene = ['level-card', 'adventure-play', 'adventure-win', 'adventure-lose'].includes(adventureDemo);
  const levelTable = debug && (levelScene || Number.isInteger(requestedLevel) && requestedLevel >= 1 && requestedLevel <= 120) ? (await import('../ui/adventureBundle')).LEVELS : undefined;
  let loadedAdventureLevels = levelTable;
  const debugLevelDef = levelTable?.[requestedLevel - 1];
  const adventurePlayDemo = adventureDemo === 'adventure-play' || adventureDemo === 'adventure-win' || adventureDemo === 'adventure-lose';
  const debugLevelState = debugLevelDef && (adventurePlayDemo || (!levelScene && query.has('level'))) ? newAdventureGame(debugLevelDef, { bonusMoves: 0, boosters: { shuffle: 0, pop: 0 }, freeShuffle: false }).state : null;
  if (debug && adventureDemo === 'level-card' && debugLevelDef) {
    // spec-note: The capture tuple is shuffle,moves,pop so this fixture shows the specified free Shuffle, short Moves buy, and capped Pop.
    const [shuffle, moves, pop] = (query.get('boosters') ?? '0,0,0').split(',').map((value) => Math.max(0, Math.min(5, Number(value) || 0)));
    save.owned.modes = Array.from(new Set<ModeId>([...save.owned.modes, 'adventure'])); save.adventure.frontier = requestedLevel;
    save.adventure.winStreak = Math.max(0, Number(query.get('streak')) || 0); save.profile.coins = Math.max(0, Number(query.get('coins')) || 0);
    save.adventure.boosters = { moves: moves ?? 0, shuffle: shuffle ?? 0, pop: pop ?? 0 };
    save.adventure.levels[String(requestedLevel)] = { stars: 0, wins: 0, losses: 0, lossRun: Math.max(0, Number(query.get('losses')) || 0), bestScore: 0 };
  }
  if (debug && debugLevelState?.adventure && adventureDemo === 'adventure-play') {
    const armed = new Set((query.get('armed') ?? '').split(','));
    debugLevelState.adventure.boosters.shuffle = armed.has('shuffle') ? 'armed' : 'none'; debugLevelState.adventure.boosters.pop = armed.has('pop') ? 'armed' : 'none';
  }
  if (debug && adventureDemo === 'adventure-lose' && debugLevelDef) {
    save.owned.modes = Array.from(new Set<ModeId>([...save.owned.modes, 'adventure'])); save.adventure.frontier = requestedLevel;
    save.adventure.levels[String(requestedLevel)] = { stars: 0, wins: 0, losses: Math.max(0, Number(query.get('losses')) || 0), lossRun: Math.max(0, Number(query.get('losses')) || 0), bestScore: 0 };
  }
  if (debug && ['adventure-map', 'adventure-map-end'].includes(adventureDemo)) {
    save.owned.modes = Array.from(new Set<ModeId>([...save.owned.modes, 'adventure']));
    save.adventure.frontier = adventureDemo === 'adventure-map-end' ? 121 : 23;
    save.adventure.levels = {};
    for (let level = 1; level <= (adventureDemo === 'adventure-map-end' ? 120 : 22); level += 1) save.adventure.levels[String(level)] = { stars: (((level - 1) % 3) + 1) as 1 | 2 | 3, wins: 1, losses: 0, lossRun: 0, bestScore: 0 };
    if (adventureDemo === 'adventure-map') { save.adventure.inProgress = newAdventureGame(levelTable?.[22] ?? (await import('../ui/adventureBundle')).LEVELS[22]!, { bonusMoves: 0, boosters: { shuffle: 0, pop: 0 }, freeShuffle: false }).state; save.adventure.chaptersDone = [1]; }
    if (adventureDemo === 'adventure-map-end') { save.adventure.levels = Object.fromEntries(Array.from({ length: 120 }, (_, index) => [String(index + 1), { stars: 3 as const, wins: 1, losses: 0, lossRun: 0, bestScore: 0 }])); save.adventure.chaptersDone = [1, 2, 3, 4, 5, 6]; save.adventure.chaptersAllStars = [1, 2, 3, 4, 5, 6]; }
  }
  const beginTutorial = !debug && !debugLevelState && !savedRun && !save.tutorialDone;
  let session = createSession({ state: debugLevelState ?? savedRun ?? (beginTutorial ? tutorialGame(1) : null), best: bestFor(save, debugLevelState?.mode ?? savedRun?.mode ?? 'classic'), mode: 'classic', goals: save.tutorialDone || debug });
  if (debug && session.state.adventure && adventureDemo === 'adventure-play') session.state.adventure.movesLeft = 3;
  if (debug && session.state.adventure && adventureDemo === 'adventure-win') {
    const stars = Number(query.get('stars') ?? 3); const value = Math.max(1, Math.min(3, stars)) as 1 | 2 | 3;
    session.state.adventure.goals.forEach((goal) => { goal.progress = goal.target; }); session.state.adventure.movesLeft = 6; session.state.adventure.result = { won: true, reason: 'goals', movesLeft: 6, stars: value }; session.state.status = 'over';
  }
  if (debug && session.state.adventure && adventureDemo === 'adventure-lose') {
    const reason = query.get('reason') === 'stuck' ? 'stuck' : 'moves'; session.state.adventure.goals = [{ kind: 'F', flavour: 6, target: 30, progress: 26 }];
    session.state.adventure.movesLeft = reason === 'moves' ? 0 : 3; session.state.adventure.result = { won: false, reason, movesLeft: session.state.adventure.movesLeft, stars: 0 }; session.state.status = 'over';
  }
  canvas.setAttribute('aria-label', `${S.logo}. ${S.howToControls}`);
  updateCanvasAria();
  let runBest = session.best; let runStartedAt = performance.now(); let pauseStartedAt = 0; let runReward = { xp: 0, coins: 0, progress: 0, progressMax: xpToNext(save.profile.level), currentLevel: save.profile.level, level: undefined as number | undefined };
  const initialScreen = debug && ['adventure-map', 'adventure-map-end', 'level-card'].includes(adventureDemo) ? 'adventure' : debug && ['missions', 'missions-done'].includes(adventureDemo) ? 'home' : 'play';
  const router = createRouter(initialScreen); const surface = createCanvasSurface(canvas); const background = createBackground(save.equipped.theme as keyof typeof PALETTE.theme); const view = createBoardView(); const director = createDirector();
  setColourBlindPatterns(save.settings.cbPatterns);
  let backgroundTheme = save.equipped.theme; const ui = createGameUi(uiRoot); const toast = createToasts(uiRoot); const homeHost = document.createElement('div'); uiRoot.append(homeHost);
  let paused = false; let shownScore = 0; let shownStatus = ''; let runRecorded = false; let adventureRecorded = false; let adventureReward = { xp: 0, coins: 0, progress: 0, progressMax: 0 }; let adventureChapterRewards = { chapterDone: false, chapterAllStars: false, chapter: 1 }; let adventureStreakReset = false; let countedDailyThisRun = false; let comboLostAt = -1; let layout: Layout = computeLayout(window.innerWidth, window.innerHeight, {}, Boolean(session.state.goals || session.state.adventure)); let renderElapsed = 0; let gameOverAt = -1; let saveTimer = 0; let runEvents: GameEvent[] = []; let closeCall = false;
  let lastAdventureMoves = session.state.adventure?.movesLeft ?? -1; let adventureMovesChangedAt = -1;
  let tutorialActive = !debugLevelState && (beginTutorial || savedRun?.mode === 'tutorial' || (!save.tutorialDone && save.ui.seenTips.includes('tutorialStep4Pending'))); let tutorialStep = tutorialActive ? (session.state.mode === 'tutorial' ? Math.min(3, session.state.traysDealt) : 4) : 0; let tutorialTouched = false; let tutorialBubbleText = ''; let tutorialBubbleUntil = -1; let tutorialTipForGameOver = false;
  let candyFlameUntil = -1; let candyFlameFlavour = 1; let discoveryCoins = 0;
  let scoreAnimFrom = 0; let scoreAnimStart = 0; let scoreAnimDuration = 600; let scoreAnimPoints = 0;
  let newBestAt = -1;
  let flameBreakAt = -1;
  let comboPulseAt = -1; let scoreSparkleAt = -1;
  let effectFrameMs = 0;
  let goalCrossingTarget = -1; let goalCrossingCoins = 0; let goalCrossingAt = -1; let goalCrossingWorldAt = -1; let goalCrossingCuePlayed = false; let miniDoneAt = -1; let miniDoneWorldAt = -1;
  let lastSlowMoAt = -10000; let newBestShown = false;
  const demoBoard = query.get('demo') === 'board'; const demoFaces = query.get('demo') === 'faces'; const demoCubes = query.get('demo') === 'cubes'; const demoBg = query.get('demo') === 'bg'; const demoThemes = query.get('demo') === 'themes'; const demoMega = query.get('demo') === 'mega'; const autoplay = debug && (query.get('autoplay') === '1' || demoMega); const autoplayInterval = query.get('speed') === 'fast' ? 150 : 450; let autoplayAt = 0; let rescueOfferAt = -1; const botRng = seededRng('gloop-pop/debug-autoplay');
  if (debug && demoCubes) {
    const state = structuredClone(session.state); state.mode = 'classic'; state.board = new Array<number>(64).fill(0);
    state.board[48] = 8; state.board[49] = 9; state.board[50] = 8; state.board[51] = 9; state.board[52] = 8; state.board[53] = 9; state.board[54] = 8;
    state.board[9] = 8; state.board[14] = 8;
    state.tray = [{ defId: 0, flavour: 1 }, null, null]; state.combo = 0; state.bestCombo = 0; state.fuse = 0; state.status = 'playing'; state.moves = 0;
    session = createSession({ state, best: session.best }); runBest = session.best; runEvents = []; gameOverAt = -1; shownStatus = '';
  }
  if (debug && demoMega) {
    // spec-note: The QA scenario builds a 28-cell apple gloop around one two-cell gap; its line clear resolves as a Mega Pop at combo tier 4.
    const state = structuredClone(session.state); state.mode = 'classic'; state.board = new Array<number>(64).fill(0);
    for (let row = 1; row <= 4; row += 1) for (let col = 0; col < 8; col += 1) {
      if ((row === 2 && col === 0) || (row === 3 && (col === 3 || col === 4)) || (row === 4 && col === 7)) continue;
      state.board[row * 8 + col] = 4;
    }
    state.tray = [{ defId: 1, flavour: 4 }, null, null]; state.combo = 11; state.bestCombo = 11; state.fuse = 2; state.status = 'playing'; state.moves = 0; session = createSession({ state, best: session.best }); runBest = session.best; runEvents = []; gameOverAt = -1; shownStatus = '';
  }
  if (debug && query.get('demo') === 'feel') {
    // Debug-only capture scenes for game-feel QA (research/game-feel.md): place | line | pop | combo | mega.
    const scene = query.get('scene') ?? 'place'; const state = structuredClone(session.state); state.mode = 'classic'; state.board = new Array<number>(64).fill(0);
    if (scene === 'combo' || scene === 'mega') { Object.assign(state, createFeelScene(session.state, scene)); }
    else if (scene === 'line') { for (const row of [6, 7]) for (let col = 0; col < 6; col += 1) state.board[row * 8 + col] = 2 + ((row + col) % 2) * 3; state.board[2 * 8 + 2] = 6; state.board[2 * 8 + 3] = 6; state.board[3 * 8 + 2] = 7; state.tray = [{ defId: 9, flavour: 1 }, { defId: 3, flavour: 6 }, { defId: 13, flavour: 7 }]; }
    else if (scene === 'pop') { for (let row = 1; row <= 4; row += 1) for (let col = 0; col < 8; col += 1) { if ((row === 2 && col === 0) || (row === 3 && (col === 3 || col === 4)) || (row === 4 && col === 7)) continue; state.board[row * 8 + col] = 4; } state.board[6 * 8 + 0] = 2; state.board[6 * 8 + 1] = 2; state.board[7 * 8 + 0] = 5; state.tray = [{ defId: 1, flavour: 4 }, { defId: 3, flavour: 6 }, { defId: 13, flavour: 7 }]; state.combo = 4; state.bestCombo = 4; }
    else { state.board[7 * 8 + 0] = 3; state.board[7 * 8 + 1] = 3; state.board[6 * 8 + 6] = 5; state.tray = [{ defId: 9, flavour: 1 }, { defId: 3, flavour: 6 }, { defId: 13, flavour: 7 }]; }
    state.status = 'playing'; state.moves = 0; session = createSession({ state, best: session.best }); runBest = session.best; runEvents = []; gameOverAt = -1; shownStatus = '';
  }
  if (debug && ['target', 'target-hit', 'mini-done'].includes(query.get('demo') ?? '')) {
    const scene = query.get('demo') as 'target' | 'target-hit' | 'mini-done'; const state = createGoalScene(session.state, scene);
    session = createSession({ state, best: 9000 }); runBest = 9000; shownScore = state.score; scoreAnimFrom = state.score; scoreAnimStart = 0; runEvents = []; gameOverAt = -1; shownStatus = '';
    if (scene === 'target-hit') { goalCrossingTarget = 5000; goalCrossingCoins = 5; goalCrossingAt = 0; goalCrossingWorldAt = 0; goalCrossingCuePlayed = true; }
    if (scene === 'mini-done') { miniDoneAt = 0; miniDoneWorldAt = 0; }
    updateCanvasAria();
  }
  let activeChallenge = parseChallenge(window.location.search); let challengeBeaten = false;
  if (activeChallenge) { const clean = new URL(window.location.href); clean.searchParams.delete('beat'); clean.searchParams.delete('f'); history.replaceState(history.state, '', clean); }
  const requestedSkin = query.get('skin'); if (demoFaces && requestedSkin && skinMap[requestedSkin]) setEquippedCosmetics({ theme: save.equipped.theme as keyof typeof PALETTE.theme, skin: skinMap[requestedSkin], popEffect: save.equipped.pop as PopEffectId });
  const topBar = createTopBar(() => goHome(), () => showPause(), () => { initAudioOnFirstInput(); save.settings.muted = !save.settings.muted; setMasterMuted(save.settings.muted); topBar.muteButton.setAttribute('aria-label', save.settings.muted ? S.unmute : S.mute); persist(true); }, () => start('daily'), skipTutorial); uiRoot.append(topBar.element);
  const live = document.createElement('div'); live.className = 'sr-only'; live.setAttribute('aria-live', 'polite'); live.setAttribute('aria-atomic', 'true'); uiRoot.append(live);
  const controlsHint = document.createElement('div'); controlsHint.className = 'controls-hint'; controlsHint.textContent = S.controlsHint; controlsHint.hidden = save.ui.runsFinished >= 3; uiRoot.append(controlsHint);
  const tutorialBubble = createTutorialBubble(skipTutorial); if (tutorialActive) uiRoot.append(tutorialBubble.element);
  let audioStarted = false;
  let lastAudioInputAt = performance.now(); let audioComboLostAt: number | undefined; let lastMusicState: ReturnType<typeof musicState> | undefined; let musicGameRef = session.state; let fittingPieces = session.state.tray.filter((piece) => piece !== null && fitsAnywhere(session.state.board, piece.defId)).length;
  const enableAudio = (): void => { initAudioOnFirstInput(); if (!audioStarted && router.current === 'play') { startMusic(); audioStarted = true; } };
  uiRoot.addEventListener('click', (event) => { const button = (event.target as Element | null)?.closest('button'); if (!button || button === topBar.muteButton) return; enableAudio(); if (button.getAttribute('role') === 'switch') { if (button.getAttribute('aria-checked') === 'true') sfx.toggleOn(); return; } sfx.uiTap(); });
  window.addEventListener('pointerdown', () => { lastAudioInputAt = performance.now(); enableAudio(); });
  const pointer = createPointerInput(view, () => layout, () => session.state, (slot, row, col) => apply({ type: 'place', slot: slot as 0 | 1 | 2, row, col }));
  if (debug) {
    type DebugApi = {
      screen(): string;
      state(): { mode: string; score: number; movesLeft?: number; goals?: unknown; status: string; tray: { slot: number; defId: number; cells: number[][] }[]; board: number[]; level?: number };
      trayPoint(slot: number): { x: number; y: number };
      dropPoint(slot: number, row: number, col: number): { x: number; y: number };
      botMove(): { slot: number; row: number; col: number } | null;
    };
    const clientPoint = (x: number, y: number): { x: number; y: number } => { const rect = canvas.getBoundingClientRect(); return { x: rect.left + x * rect.width / layout.width, y: rect.top + y * rect.height / layout.height }; };
    (window as Window & { __gloopDebug?: DebugApi }).__gloopDebug = {
      screen: () => router.current,
      state: () => {
        const state = session.state; const adventure = state.adventure;
        return { mode: state.mode, score: state.score, ...(adventure ? { movesLeft: adventure.movesLeft, goals: adventure.goals.map((goal) => ({ ...goal })), level: adventure.level } : state.goals ? { goals: structuredClone(state.goals) } : {}), status: state.status,
          tray: state.tray.flatMap((piece, slot) => piece ? [{ slot, defId: piece.defId, cells: PIECES[piece.defId]!.cells.map(([row, col]) => [row, col]) }] : []), board: [...state.board] };
      },
      trayPoint: (slot) => { const rect = traySlotRect(slot, layout); return clientPoint(rect.x + rect.width / 2, rect.y + rect.height / 2); },
      dropPoint: (slot, row, col) => {
        const piece = session.state.tray[slot]; if (!piece || slot < 0 || slot > 2) return { x: 0, y: 0 };
        return pointerDropPoint(row, col, PIECES[piece.defId]!.w, PIECES[piece.defId]!.h, layout, canvas.getBoundingClientRect());
      },
      botMove: () => {
        const state = session.state; const rng = seededRng(`${state.seed}/gloop-debug-bot`);
        if (state.mode === 'adventure' && chooseAdventureBot) { const move = chooseAdventureBot(state, rng); return move?.type === 'place' ? { slot: move.slot, row: move.row, col: move.col } : null; }
        const move = chooseBotMove(state, rng); return move ? { slot: move.slot, row: move.row, col: move.col } : null;
      },
    };
  }
  const boosterBar = createBoosterBar((id) => { if (id === 'shuffle') pointer.cancel(); apply({ type: 'booster', id }); }); uiRoot.append(boosterBar.element);
  boosterBar.update(session.state, layout);
  const keyboard = attachKeyboard(view, () => layout, () => session.state, (slot, row, col) => apply({ type: 'place', slot: slot as 0 | 1 | 2, row, col }), () => pointer.cancel(), () => { if (router.current === 'play') showPause(); else router.back(); }, () => sfx.snapTick(), (id) => { if (id === 'shuffle') pointer.cancel(); apply({ type: 'booster', id }); });
  const resize = (): void => {
    surface.resize(window.innerWidth, window.innerHeight);
    const rootStyle = getComputedStyle(document.documentElement); const safeTop = Number.parseFloat(rootStyle.getPropertyValue('--safe-area-top')) || 0; const safeBottom = Number.parseFloat(rootStyle.getPropertyValue('--safe-area-bottom')) || 0;
    layout = computeLayout(surface.width, surface.height, { top: safeTop, bottom: safeBottom }, Boolean(session.state.goals || session.state.adventure)); background.resize(surface.width, surface.height, layout);
    boosterBar.update(session.state, layout);
    topBar.element.style.left = `${layout.column.x}px`; topBar.element.style.width = `${layout.column.width}px`; topBar.element.style.top = `${layout.topBar.y}px`; topBar.element.style.height = `${layout.topBar.height}px`;
  };
  resize(); window.addEventListener('resize', resize, { passive: true });
  canvas.addEventListener('pointerdown', (event) => { lastAudioInputAt = performance.now(); enableAudio(); if (router.current !== 'play' || paused || session.state.status !== 'playing') return; const hadDrag = pointer.drag !== undefined; canvas.setPointerCapture(event.pointerId); pointer.pointerDown(event.offsetX, event.offsetY, event.pointerType); if (!hadDrag && pointer.drag) { sfx.pickUp(); vibrate('pick', save.settings.haptics); if (tutorialActive) { tutorialTouched = true; tutorialBubbleText = ''; tutorialBubble.setText(''); } } });
  canvas.addEventListener('pointermove', (event) => { if (router.current === 'play' && session.state.status === 'playing') pointer.pointerMove(event.offsetX, event.offsetY, event.pointerType); });
  canvas.addEventListener('pointerup', (event) => { if (router.current !== 'play' || paused || session.state.status !== 'playing') return; pointer.pointerUp(event.offsetX, event.offsetY, event.pointerType); if (pointer.returning) sfx.returnToTray(); });
  canvas.addEventListener('pointercancel', () => pointer.cancel());
  document.addEventListener('visibilitychange', () => { if (document.hidden && router.current === 'play' && !paused && session.state.status === 'playing') showPause(); });
  window.addEventListener('keydown', (event) => {
    lastAudioInputAt = performance.now(); enableAudio();
    if (['1', '2', '3'].includes(event.key)) { sfx.pickUp(); vibrate('pick', save.settings.haptics); }
    if (event.key.toLowerCase() === 'm') { save.settings.muted = !save.settings.muted; setMasterMuted(save.settings.muted); topBar.muteButton.setAttribute('aria-label', save.settings.muted ? S.unmute : S.mute); persist(true); }
    if (session.state.status === 'over' && router.current === 'play' && [' ', 'Enter', 'r', 'R'].includes(event.key)) {
      const focusedButton = event.target instanceof Element && Boolean(event.target.closest('.adventure-result-panel button'));
      if (session.state.adventure && [' ', 'Enter'].includes(event.key) && focusedButton) return;
      event.preventDefault();
      if (session.state.adventure) {
        const level = session.state.adventure.level;
        if (event.key === 'r' || event.key === 'R' || !session.state.adventure.result?.won) void toAdventure(level);
        else if (level < 120) void showAdventureCard(level + 1, false); else router.open('adventure');
      } else restart();
    }
  });
  onSaveVisibility(() => { window.clearTimeout(saveTimer); persist(true); });
  router.subscribe((screen) => { if (screen !== 'play') toast.clear(); renderScreen(screen); }); renderScreen(initialScreen); if (debug && adventureDemo === 'level-card') void showAdventureCard(requestedLevel, true); if (debug && adventurePlayDemo) { gameOverAt = session.state.status === 'over' ? renderElapsed : -1; shownStatus = ''; } if (debug && session.state.adventure?.result) finishAdventure(); persist(true);
  let currentFrame: Readonly<Frame> = { realDt: 0, worldDt: 0, boardDt: 0, realNow: 0, worldNow: 0, boardNow: 0 };
  const renderLoop = startRenderLoop((frame) => {
    currentFrame = frame;
    const elapsedMs = frame.realNow; const dtMs = frame.realDt;
    renderElapsed = elapsedMs;
    uiRoot.style.setProperty('--toast-play-top', `${layout.board.y + layout.board.height}px`); uiRoot.style.setProperty('--toast-play-left', `${layout.board.x + layout.board.width / 2}px`);
    const reducedForFrame = shouldReduceMotion(save.settings.reducedMotion, devicePrefersReducedMotion()); background.setReducedMotion(reducedForFrame);
    pointer.advance(frame.realDt, reducedForFrame);
    if (pointer.snapChanged) { sfx.snapTick(); vibrate('snap', save.settings.haptics); }
    if (demoThemes) background.setTheme(THEME_KEYS[Math.floor(frame.worldNow / 2400) % THEME_KEYS.length]!, frame.worldNow);
    else if (backgroundTheme !== save.equipped.theme) { backgroundTheme = save.equipped.theme; background.setTheme(backgroundTheme as keyof typeof PALETTE.theme, frame.worldNow); }
    const ctx = surface.context; ctx.setTransform(surface.dpr, 0, 0, surface.dpr, 0, 0); ctx.save(); background.draw(ctx, frame.worldNow, layout, session.state.stage); ctx.restore(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    const today = dayKeyFromMs(Date.now()); const pill = session.state.adventure ? S.levelText(session.state.adventure.level) : save.daily.records[today] ? S.dailyPillDone : save.streak.current >= 2 && new Date().getUTCHours() >= 18 ? S.dailyKeepStreak(dayNumber(today), save.streak.current) : S.daily(dayNumber(today)); if (topBar.dailyPill.textContent !== pill) topBar.dailyPill.textContent = pill; (topBar.dailyPill as HTMLButtonElement).disabled = Boolean(session.state.adventure);
    // Design §23.9: the Daily is offered after the tutorial and the first Classic run, never before.
    const isPlay = router.current === 'play';
    const activeBoosters = session.state.adventure?.boosters; boosterBar.element.hidden = !isPlay || paused || session.state.status !== 'playing' || !activeBoosters || activeBoosters.shuffle === 'none' && activeBoosters.pop === 'none';
    if (musicGameRef !== session.state) { musicGameRef = session.state; fittingPieces = session.state.tray.filter((piece) => piece !== null && fitsAnywhere(session.state.board, piece.defId)).length; }
    lastMusicState = musicState({ tier: session.state.combo, filledCells: session.state.board.filter((cell) => cell > 0).length, fittingPieces, zen: session.state.mode === 'zen', idleMs: performance.now() - lastAudioInputAt, paused, screen: router.current, gameOver: session.state.status === 'over', now: performance.now() / 1000, position: music.position(), ...(audioComboLostAt === undefined ? {} : { comboLostAt: audioComboLostAt }) }, lastMusicState);
    music.update(lastMusicState);
    const hideHint = !isPlay || save.ui.runsFinished >= 3; if (controlsHint.hidden !== hideHint) controlsHint.hidden = hideHint; topBar.element.style.display = isPlay ? 'flex' : 'none'; topBar.element.classList.toggle('is-tutorial', tutorialActive); topBar.dailyPill.hidden = tutorialActive || save.ui.runsFinished < 1; topBar.muteButton.hidden = tutorialActive; topBar.pauseButton.hidden = tutorialActive; topBar.tutorialSkip.style.display = tutorialActive ? 'block' : 'none';
    topBar.dailyPill.classList.toggle('is-at-risk', save.streak.current >= 2 && !save.daily.records[today] && new Date().getUTCHours() >= 18);
    if (isPlay && !demoBg) {
      const reduced = reducedForFrame;
      const shake = director.shakeOffset(); const shakeScale = 1; const boardCentreX = layout.board.x + layout.board.width / 2; const boardCentreY = layout.board.y + layout.board.height / 2; ctx.save(); ctx.translate(shake.x * shakeScale, shake.y * shakeScale); ctx.translate(boardCentreX, boardCentreY); ctx.rotate(director.cameraRoll() * Math.PI / 180); ctx.translate(-boardCentreX, -boardCentreY);
      view.draw(ctx, layout, session.state, frame.worldNow, paused ? undefined : pointer.drag ?? keyboard.drag(), demoBoard ? 'board' : demoFaces ? 'faces' : '', gameOverAt, frame.boardNow, frame.realNow, pointer.returning, reduced, renderLoop.hitStopScale, frame.boardDt); const effectStart = performance.now(); director.draw(ctx, layout, frame.boardNow, frame.worldNow, frame.worldDt, reduced, frame.realNow, renderLoop.hitStopScale); effectFrameMs = performance.now() - effectStart; ctx.restore();
      if (paused) { ctx.fillStyle = PALETTE.ui.scrim; ctx.fillRect(0, 0, layout.width, layout.height); }
      if (session.state.adventure && session.state.adventure.movesLeft !== lastAdventureMoves) { lastAdventureMoves = session.state.adventure.movesLeft; adventureMovesChangedAt = frame.realNow; }
      shownScore = drawHud(ctx, layout, session.state, session.best, frame.realNow, shownScore, comboLostAt, activeChallenge?.score, candyFlameUntil, candyFlameFlavour, reduced, scoreAnimFrom, scoreAnimStart, scoreAnimDuration, newBestAt, flameBreakAt, comboPulseAt, scoreSparkleAt, scoreAnimPoints, adventureMovesChangedAt);
      if (goalCrossingAt < 0 && goalCrossingTarget >= 0 && shownScore >= goalCrossingTarget) { goalCrossingAt = frame.realNow; goalCrossingWorldAt = frame.worldNow; if (!goalCrossingCuePlayed) { sfx.coinTick({ count: 1, gainDb: -6 }); vibrate('goal', save.settings.haptics); goalCrossingCuePlayed = true; } }
      const holdGoalFeedback = debug && (query.get('hold') === '1' || query.get('hold') !== '0' && ['target-hit', 'mini-done'].includes(query.get('demo') ?? ''));
      drawGoalStrip(ctx, layout, session.state, shownScore, frame.realNow, { target: goalCrossingTarget, coins: goalCrossingCoins, at: goalCrossingAt, worldAt: goalCrossingWorldAt, hold: holdGoalFeedback }, miniDoneAt, miniDoneWorldAt, frame.worldNow, reduced);
      if (tutorialActive && tutorialStep < 4 && !tutorialTouched) { const target = tutorialStep === 1 ? { row: 6, col: 6, width: 2 } : tutorialStep === 2 ? { row: 6, col: 3, width: 1 } : { row: 4, col: 6, width: 2 }; const cells = tutorialStep === 2 ? [[0, 0], [1, 0]] as const : [[0, 0], [0, 1]] as const; const hand = tutorialHandPoints(layout.board, layout.tray, layout.cellSize, target.row, target.col, target.width); drawGhostHand(ctx, elapsedMs, hand.from, hand.to, layout.cellSize, cells); }
      if (debug && query.get('overlay') !== '0') {
        const adventure = session.state.adventure; const levelDef = adventure && loadedAdventureLevels?.[adventure.level - 1];
        const advLine = adventure && levelDef ? `adv L${adventure.level} s${levelDef.s} K${levelParams(adventure.level).k} wins ${levelDef.wins}/12 · goals ${adventure.goals.reduce((sum, goal) => sum + goal.progress, 0)}/${adventure.goals.reduce((sum, goal) => sum + goal.target, 0)}` : '';
        drawDebug(ctx, layout, surface.dpr, dtMs, surface, effectFrameMs, audioDebugLine(), advLine);
      }
    }
    updateTutorial(elapsedMs);
    updateOverlay();
    }, (elapsed) => { surface.reportFrame(elapsed); if (autoplay && router.current === 'play' && !paused && session.state.status === 'rescueOffer') { if (rescueOfferAt < 0) rescueOfferAt = renderElapsed; if (renderElapsed - rescueOfferAt >= 600) { rescueOfferAt = -1; apply({ type: 'useRescue' }); } } else if (session.state.status !== 'rescueOffer') rescueOfferAt = -1; if (autoplay && router.current === 'play' && !paused && session.state.status === 'playing' && renderElapsed >= autoplayAt) { autoplayAt = renderElapsed + autoplayInterval; enableAudio(); const move = demoMega && session.state.moves === 0 ? { slot: 0 as const, row: 3, col: 3 } : chooseBotMove(session.state, botRng); if (move) apply({ type: 'place', slot: move.slot, row: move.row, col: move.col }); } });

  function apply(action: Action): void {
    const hadGoalStrip = Boolean(session.state.goals || session.state.adventure);
    if (action.type === 'booster' && action.id === 'shuffle') pointer.cancel();
    if (action.type === 'place' && !shouldReduceMotion(save.settings.reducedMotion, devicePrefersReducedMotion())) renderLoop.requestSlowMo(renderLoop.timeScale, 0, 0, 60);
    const filledBeforeResolve = action.type === 'place' ? session.state.board.filter((cell) => cell > 0).length + (PIECES[session.state.tray[action.slot]?.defId ?? -1]?.cells.length ?? 0) : 0;
    const scoreBefore = session.state.score; const pendingScoreFrom = shownScore; const events = action.type === 'place' ? dispatchImmediately(() => renderLoop.endNow(), () => session.dispatch(action)) : session.dispatch(action); const scoreDelta = session.state.score - scoreBefore; if (events.some((event) => event.type === 'cleared' || event.type === 'popped' || event.type === 'allClear' || event.type === 'gameOver')) live.textContent = `${S.score} ${new Intl.NumberFormat('en-US').format(session.state.score)}${adventureResultLabel(session.state) ? ` · ${adventureResultLabel(session.state)}` : session.state.status === 'over' ? ` · ${S.noRoom}` : ''}`; if (action.type === 'place' && tutorialActive && events.some((event) => event.type === 'placed')) advanceTutorial(); if (action.type === 'place' && filledBeforeResolve >= 52 && events.some((event) => event.type === 'cleared')) closeCall = true; runEvents.push(...events);
    updateCanvasAria(); const missionProgress = addMissionProgress(save, session.state, events); save = missionProgress.save; for (const mission of missionProgress.done) toast.show(S.missionDoneToast(S.missionText(mission.id)), 'gold');
    if (events.some((event) => event.type === 'boosterUsed')) vibrate('booster', save.settings.haptics);
    boosterBar.update(session.state, layout);
    const crossings = events.filter((event) => event.type === 'targetReached'); if (crossings.length) { const last = crossings[crossings.length - 1]!; if (last.type === 'targetReached') { goalCrossingTarget = last.target; goalCrossingCoins = crossings.length * 5; goalCrossingAt = -1; goalCrossingWorldAt = -1; goalCrossingCuePlayed = false; } }
    if (events.some((event) => event.type === 'miniDone')) { miniDoneAt = renderElapsed; miniDoneWorldAt = currentFrame.worldNow; sfx.chime({ gainDb: -14 }); vibrate('goal', save.settings.haptics); }
    if (hadGoalStrip !== Boolean(session.state.goals || session.state.adventure)) resize();
    // spec-note: Keep the pill short; the full mini-goal text appears as a toast on the run's first move.
    if (action.type === 'place' && session.state.moves === 1 && session.state.goals) toast.show(S.miniToast(S.miniText(session.state.goals.mini.id, session.state.goals.mini.flavour)));
    const reduced = shouldReduceMotion(save.settings.reducedMotion, devicePrefersReducedMotion());
    if (events.length) { const passedBest = runBest > 0 && scoreBefore <= runBest && session.state.score > runBest; const placedForLand = events.find((event) => event.type === 'placed'); const lineCountNow = events.reduce((sum, event) => sum + (event.type === 'cleared' ? event.rows.length + event.cols.length : 0), 0); const popSizeNow = events.reduce((size, event) => event.type === 'popped' ? Math.max(size, ...event.gloops.map((gloop) => gloop.size)) : size, 0); const discoveries = detectFirsts(events, save.firsts); const moment = firstMomentInfo(discoveries); if (scoreDelta > 0 && action.type === 'place') { scoreAnimFrom = pendingScoreFrom; scoreAnimStart = Number.POSITIVE_INFINITY; const scoreEvent = events.find((event) => event.type === 'scored'); scoreAnimPoints = scoreEvent?.type === 'scored' ? scoreEvent.points : scoreDelta; scoreAnimDuration = Math.min(600, 150 + scoreAnimPoints / 10); } const startScoreCountUp = (): void => { if (scoreDelta <= 0) return; scoreAnimFrom = pendingScoreFrom; scoreAnimStart = renderElapsed; const scoreEvent = events.find((event) => event.type === 'scored'); scoreAnimPoints = scoreEvent?.type === 'scored' ? scoreEvent.points : scoreDelta; scoreAnimDuration = Math.min(600, 150 + scoreAnimPoints / 10); if (scoreAnimPoints >= 1000) scoreSparkleAt = scoreAnimStart + scoreAnimDuration; }; const audioPlan = planMove(events, { combo: session.state.combo, newBest: passedBest }); playGameEvents(events.filter((event) => event.type === 'dealt' || event.type === 'stuck' || event.type === 'rescued' || event.type === 'gameOver' || event.type === 'zenShake'), { combo: session.state.combo }); director.receive(events, currentFrame.boardNow, reduced, session.state, layout, currentFrame.worldNow, (at, duration) => renderLoop.scheduleHitStop(at, duration), () => { onLand(audioPlan); if (placedForLand?.type === 'placed') vibrate('place', save.settings.haptics); if (lineCountNow === 0 && popSizeNow === 0) startScoreCountUp(); if (lineCountNow === 0 && popSizeNow === 0 && passedBest) { director.banner(S.newBest, currentFrame.worldNow, 0, 0, 40); triggerSlowMo(reduced); } }, () => { onImpact(audioPlan); if (scoreDelta > 0) startScoreCountUp(); const lineEvent: Parameters<typeof vibrate>[0] = lineCountNow >= 4 ? 'line4' : lineCountNow === 3 ? 'line3' : lineCountNow === 2 ? 'line2' : 'line1'; const tier = session.state.combo >= 12 ? 4 : session.state.combo >= 8 ? 3 : session.state.combo >= 5 ? 2 : session.state.combo >= 3 ? 1 : 0; if (lineCountNow > 0) vibrate(lineEvent, save.settings.haptics, addComboTicks(hapticPattern(lineEvent), tier)); if (passedBest) { director.banner(S.newBest, currentFrame.worldNow, 0, 0, 40); triggerSlowMo(reduced); } }, moment.text, moment.coins, currentFrame.realNow, (popTier) => { onPopFirst(audioPlan, popTier); vibrate(popTier, save.settings.haptics); }, (kind) => { onClimax(audioPlan, kind); if (kind === 'huge') vibrate('huge', save.settings.haptics, [20]); else if (kind === 'mega') { vibrate('mega', save.settings.haptics, [20, 50, 20, 50, 20]); triggerSlowMo(reduced); } else { vibrate('allClear', save.settings.haptics); triggerSlowMo(reduced); } }, pointer.placementOrigin, (order, popTier, last) => onBurst(audioPlan, order, popTier, last)); view.receive(events, currentFrame.boardNow, session.state, currentFrame.worldNow, pointer.placementOrigin, reduced, layout); pointer.placementOrigin = undefined; if (action.type === 'place' && events.some((event) => event.type === 'stuck')) { vibrate('stuck', save.settings.haptics); if (!reduced) renderLoop.requestSlowMo(0.4, 60, 240, 150); }
      const scored = events.find((event) => event.type === 'scored'); if (scored?.type === 'scored' && scored.points >= 2000) candyFlameUntil = renderElapsed + 1500;
      if (!newBestShown && runBest > 0 && scoreBefore <= runBest && session.state.score > runBest) { newBestShown = true; newBestAt = renderElapsed; }
      const clearedForFlame = events.find((event) => event.type === 'cleared'); if (clearedForFlame?.type === 'cleared' && clearedForFlame.flavoursByCell.length) candyFlameFlavour = clearedForFlame.flavoursByCell[clearedForFlame.flavoursByCell.length - 1] ?? candyFlameFlavour;
      const poppedGroup = events.find((event) => event.type === 'popped')?.type === 'popped' ? events.find((event) => event.type === 'popped') : undefined;
      if (poppedGroup?.type === 'popped' && poppedGroup.gloops.length) candyFlameFlavour = poppedGroup.gloops[poppedGroup.gloops.length - 1]!.flavour;
      if (events.some((event) => event.type === 'cleared')) background.react(events.some((event) => event.type === 'allClear') ? 'allClear' : poppedGroup?.type === 'popped' && poppedGroup.gloops.some((gloop) => gloop.size >= 24) ? 'mega' : poppedGroup?.type === 'popped' && poppedGroup.gloops.some((gloop) => gloop.size >= 15) ? 'huge' : poppedGroup?.type === 'popped' && poppedGroup.gloops.some((gloop) => gloop.size >= 8) ? 'big' : session.state.combo >= 12 ? 'tier4' : session.state.combo >= 5 ? 'combo' : 'clear', renderElapsed, candyFlameFlavour);
      for (const event of events) if (event.type === 'stageUp') toast.show([S.stage2, S.stage3, S.stage4, S.stage5, S.stage6][event.stage - 2] ?? S.stage6);
      if (events.some((event) => event.type === 'gameOver')) background.react('gameOver', renderElapsed);
      for (const discovery of discoveries) { save.firsts[discovery.key] = true; save.profile.coins += discovery.coins; save.profile.coinsEarned += discovery.coins; discoveryCoins += discovery.coins; }
      // spec-note: simultaneous firsts share the strongest centre-stack label; all earned coin bonuses stay in its coin row.
    }
    if (activeChallenge && scoreBefore <= activeChallenge.score && session.state.score > activeChallenge.score) { challengeBeaten = true; toast.show(S.youBeatFriend); director.banner(S.youBeatFriend, currentFrame.worldNow, 0, 0, 40); }
    const claimedBefore = save.weekly.claimed; save = addWeeklyProgress(save, session.state, events, weekIndexFromMs(Date.now())); save = claimWeeklyReward(save);
    if (!claimedBefore && save.weekly.claimed) toast.show(S.weeklyDone);
    for (const event of events) if (event.type === 'popped') save.achievements.bigPopCount = (save.achievements.bigPopCount ?? 0) + event.gloops.filter((gloop) => gloop.size >= 8).length;
    checkLiveAchievements();
    for (const event of events) { if (event.type === 'comboLost' && event.combo >= 2) { comboLostAt = renderElapsed; flameBreakAt = renderElapsed; audioComboLostAt = performance.now() / 1000; } if (event.type === 'comboUp') comboPulseAt = renderElapsed; }
    paused = false; setAudioPaused(false); ui.hide(); persist(false);
    if (session.state.status === 'over') { if (gameOverAt < 0) gameOverAt = renderElapsed; if (session.state.adventure) finishAdventure(); else finishRun(); }
  }
  function skipTutorial(): void { if (!tutorialActive) return; tutorialActive = false; tutorialBubble.element.remove(); save.tutorialDone = true; save.ui.seenTips = save.ui.seenTips.filter((tip) => tip !== 'tutorialStep4Pending'); save.inProgress = null; start('classic'); persist(true); }
  function updateTutorial(elapsed: number): void {
    if (!tutorialBubble.element.isConnected) return;
    if (!tutorialActive) { if (tutorialBubbleText === S.tutorialEnd && tutorialBubbleUntil >= 0 && elapsed >= tutorialBubbleUntil) { tutorialBubbleText = ''; tutorialBubble.setText(''); tutorialBubble.element.remove(); } return; }
    if (tutorialBubbleUntil >= 0 && elapsed < tutorialBubbleUntil) return;
    const text = tutorialStep === 1 && elapsed < 300 ? '' : tutorialStep === 1 ? S.tutorialStep1 : tutorialStep === 2 ? S.tutorialStep2 : tutorialStep === 3 ? S.tutorialStep3 : activeChallenge ? S.tutorialChallenge(activeChallenge.score) : S.tutorialStep4;
    if (tutorialStep === 4 && session.state.moves >= 2) { tutorialBubbleText = ''; tutorialBubble.setText(''); if (session.state.moves >= 3) { tutorialActive = false; save.tutorialDone = true; save.ui.seenTips = save.ui.seenTips.filter((tip) => tip !== 'tutorialStep4Pending'); if (!save.ui.seenTips.includes('tutorialTipPending')) save.ui.seenTips.push('tutorialTipPending'); tutorialBubbleText = S.tutorialEnd; tutorialBubble.setText(tutorialBubbleText); tutorialBubbleUntil = elapsed + 2000; persist(true); } return; }
    if (tutorialBubbleText !== text) { tutorialBubbleText = text; tutorialBubble.setText(text); }
    tutorialBubble.place(layout.tray.y, layout.tray.x + layout.tray.width / 2);
  }
  function advanceTutorial(): void {
    const current = session.state;
    if (tutorialStep <= 3) {
      const feedback = tutorialStep === 1 ? S.tutorialClear : tutorialStep === 2 ? S.tutorialTwo : S.tutorialBig;
      if (tutorialStep < 3) { const next = tutorialGame((tutorialStep + 1) as 2 | 3); next.score = current.score; next.stats = { ...current.stats }; next.linesCleared = current.linesCleared; next.bestCombo = current.bestCombo; next.combo = current.combo; next.fuse = current.fuse; session.replace(next); tutorialStep += 1; tutorialBubbleUntil = renderElapsed + 1200; tutorialBubbleText = feedback; tutorialBubble.setText(feedback); }
      else { const next = newGame('classic', 'tutorial/first-run').state; next.score = current.score; next.stats = { ...current.stats }; next.linesCleared = current.linesCleared; next.bestCombo = current.bestCombo; next.combo = current.combo; next.fuse = current.fuse; next.moves = 0; session.replace(next); tutorialStep = 4; tutorialBubbleUntil = -1; if (!save.ui.seenTips.includes('tutorialStep4Pending')) save.ui.seenTips.push('tutorialStep4Pending'); tutorialBubbleText = activeChallenge ? S.tutorialChallenge(activeChallenge.score) : S.tutorialStep4; tutorialBubble.setText(tutorialBubbleText); }
      tutorialTouched = false; persist(true); return;
    }
  }
  function start(mode: ModeId): void {
    const savedForMode = mode === 'daily' ? save.dailyInProgress : save.inProgress?.mode === mode ? save.inProgress : null;
    const resume = session.state.mode === mode && session.state.status === 'playing';
    if (!resume) { runBest = bestFor(save, mode); session = createSession({ state: savedForMode, best: runBest, mode, goals: save.tutorialDone || debug }); updateCanvasAria(); resize(); runStartedAt = performance.now(); runRecorded = false; countedDailyThisRun = false; runEvents = []; closeCall = false; shownScore = 0; scoreAnimFrom = 0; scoreAnimStart = renderElapsed; scoreAnimDuration = 600; newBestAt = -1; flameBreakAt = -1; comboPulseAt = -1; scoreSparkleAt = -1; shownStatus = ''; comboLostAt = -1; gameOverAt = -1; newBestShown = false; discoveryCoins = 0; }
    else if (pauseStartedAt > 0) { runStartedAt += performance.now() - pauseStartedAt; pauseStartedAt = 0; }
    paused = false; setAudioPaused(false); if (audioStarted) startMusic(); ui.hide(); router.open('play'); persist(false);
  }
  async function showAdventureCard(level: number, fromMap: boolean): Promise<void> {
    // spec-note: The start card stays above the map route; Next level uses the same card above the finished board.
    const { LEVELS, createLevelCard } = await import('../ui/adventureBundle'); loadedAdventureLevels = LEVELS; const def = loadedAdventureLevels[level - 1]; if (!def) return;
    history.pushState({ gloopScreen: router.current, adventureCard: true }, '');
    const card = createLevelCard(def, { play: (selection, assist) => void toAdventure(level, selection, assist), back: () => { if (fromMap) history.back(); else router.replace('adventure'); }, bought: (name, nextSave) => { save = nextSave; toast.show(S.boosterBought(name), 'coin'); saveNow(save); sfx.coinTick({ count: 3 }); } }, { save, streak: save.adventure.winStreak, lossRun: save.adventure.levels[String(level)]?.lossRun ?? 0 });
    homeHost.querySelector('.adventure-modal-shade')?.remove(); if (fromMap) homeHost.append(card); else homeHost.replaceChildren(card);
  }
  function toAdventure(level: number, selection: BoosterSelection = {}, assist = false): void {
    recordPendingAdventureResult(session.state, adventureRecorded, finishAdventure);
    const begin = (levels: NonNullable<typeof loadedAdventureLevels>): void => {
    const def = levels[level - 1]; if (!def) return;
    if (isStaleAttempt(save.adventure.inProgress, def)) {
      save = returnUnused(save, save.adventure.inProgress!);
      save.adventure.inProgress = null;
      saveNow(save);
    }
    if (save.adventure.inProgress?.adventure && save.adventure.inProgress.adventure.level !== level) save = returnUnused(save, save.adventure.inProgress);
    const prior = save.adventure.levels[String(level)];
    const resumed = save.adventure.inProgress?.adventure?.level === level ? save.adventure.inProgress : null;
    const armed = resumed ? { save, bonusMoves: 0, armed: { shuffle: 0, pop: 0 }, freeShuffle: false } : armBoosters(save, selection, save.adventure.winStreak, level); save = armed.save;
    if (!resumed && level === save.adventure.frontier && save.adventure.winStreak > 0 && !save.ui.seenTips.includes('adventureStreakBonus')) save.ui.seenTips.push('adventureStreakBonus');
    const assistMoves = !resumed && assist && assistAvailable(save, level) ? 5 : 0;
    const built = resumed ? null : newAdventureGame(def, { bonusMoves: armed.bonusMoves + assistMoves, boosters: armed.armed, freeShuffle: armed.freeShuffle });
    session = createSession({ state: resumed ?? built!.state, best: 0, mode: 'adventure', goals: false });
    save.adventure.inProgress = session.state; save.inProgress = null; adventureRecorded = false; adventureReward = { xp: 0, coins: 0, progress: 0, progressMax: 0 };
    runBest = 0; runStartedAt = performance.now(); runEvents = built ? [...built.events] : []; gameOverAt = -1; shownStatus = ''; shownScore = 0; paused = false; lastAdventureMoves = session.state.adventure?.movesLeft ?? -1; adventureMovesChangedAt = -1; updateCanvasAria(); resize();
    if (prior) save.adventure.levels[String(level)] = prior;
    homeHost.replaceChildren(); router.open('play'); ui.hide(); persist(true);
    };
    if (loadedAdventureLevels) begin(loadedAdventureLevels);
    else void import('../ui/adventureBundle').then(({ LEVELS }) => { loadedAdventureLevels = LEVELS; begin(LEVELS); });
  }
  function finishAdventure(): void {
    if (adventureRecorded || !session.state.adventure?.result) return;
    adventureRecorded = true;
    const outcome = session.state.adventure.result;
    adventureStreakReset = !outcome.won && save.adventure.winStreak > 0 && session.state.adventure.level === save.adventure.frontier;
    save = rollDay(save, dayKeyFromMs(Date.now()));
    save = returnUnused(save, session.state);
    const result = recordLevelResult(save, { level: session.state.adventure.level, won: outcome.won, stars: outcome.stars, score: session.state.score });
    save = result.save; adventureReward = { xp: result.xp, coins: result.coins, progress: Math.max(0, save.profile.xp - totalXpForLevel(save.profile.level)), progressMax: xpToNext(save.profile.level) }; adventureChapterRewards = { chapterDone: result.chapterDone, chapterAllStars: result.chapterAllStars, chapter: Math.ceil(session.state.adventure.level / 20) }; save.adventure.inProgress = null;
    save.ui.runsFinished += 1;
    save = recordAdventureRunStats(save, session.state, runEvents);
    if (result.chapterDone) toast.show(S.chapterDoneToast(adventureChapterRewards.chapter), 'coin');
    if (result.chapterAllStars) toast.show(S.chapterAllStarsToast(adventureChapterRewards.chapter), 'gold');
    save.stats.timePlayedMs += Math.max(0, Math.floor(performance.now() - runStartedAt));
    if (outcome.won && outcome.stars === 3) sfx.levelBest();
    for (const level of result.levels) toast.show(S.levelUp(level));
    for (const item of result.unlocked) { toast.show(S.unlocked(item)); if (item === 'Adventure') toast.show(S.adventureGift); }
    if (result.firstWin && save.profile.level >= 2) { const before = save.owned.modes.includes('adventure'); save = unlockAdventure(save); if (!before) { toast.show(S.unlocked(S.adventure)); toast.show(S.adventureGift); } }
    const adventureAchievements = grantAchievements(save); save = adventureAchievements.save;
    for (const achievement of adventureAchievements.unlocked) { toast.show(S.achievementUnlock(S.achievementName(achievement.id), achievement.coins)); sfx.achievement(); }
    saveNow(save);
  }
  function restart(): void { renderLoop.resetEffects(); director.reset(); if (challengeBeaten) { activeChallenge = null; challengeBeaten = false; } runBest = bestFor(save, session.state.mode); session = createSession({ best: runBest, mode: session.state.mode, goals: save.tutorialDone || debug }); updateCanvasAria(); resize(); runStartedAt = performance.now(); runEvents = []; closeCall = false; pauseStartedAt = 0; shownScore = 0; scoreAnimFrom = 0; scoreAnimStart = renderElapsed; scoreAnimDuration = 600; newBestAt = -1; flameBreakAt = -1; comboPulseAt = -1; scoreSparkleAt = -1; shownStatus = ''; runRecorded = false; comboLostAt = -1; gameOverAt = -1; newBestShown = false; discoveryCoins = 0; paused = false; ui.hide(); pointer.cancel(); persist(false); }
  function showPause(): void {
    if (router.current !== 'play' || session.state.status !== 'playing') return;
    paused = true; setAudioPaused(true); if (pauseStartedAt === 0) pauseStartedAt = performance.now(); persist(true); const mode = session.state.mode; const label = mode === 'daily' || mode === 'adventure' ? S.giveUp : mode === 'zen' ? S.endRun : S.restart;
    ui.showPause(() => { if (pauseStartedAt > 0) runStartedAt += performance.now() - pauseStartedAt; pauseStartedAt = 0; paused = false; setAudioPaused(false); ui.hide(); }, () => {
      if (mode === 'daily') ui.showDailyGiveUpConfirm(() => { if (pauseStartedAt > 0) runStartedAt += performance.now() - pauseStartedAt; pauseStartedAt = 0; apply({ type: 'endRun' }); }, () => showPause());
      else if (mode === 'adventure') ui.showAdventureGiveUpConfirm(() => { if (pauseStartedAt > 0) runStartedAt += performance.now() - pauseStartedAt; pauseStartedAt = 0; apply({ type: 'endRun' }); }, () => showPause());
      else if (mode === 'zen') { if (pauseStartedAt > 0) runStartedAt += performance.now() - pauseStartedAt; pauseStartedAt = 0; apply({ type: 'endRun' }); }
      else if (session.state.score > 0) ui.showRestartConfirm(() => restart(), () => showPause()); else restart();
    }, () => { paused = true; if (pauseStartedAt === 0) pauseStartedAt = performance.now(); ui.hide(); router.open('home'); persist(true); }, label);
  }
  function goHome(): void {
    if (router.current !== 'play') return;
    if (session.state.status === 'playing') { paused = true; setAudioPaused(true); if (pauseStartedAt === 0) pauseStartedAt = performance.now(); persist(true); }
    ui.hide(); router.open('home');
  }
  function checkLiveAchievements(): void {
    const projected = structuredClone(save); projected.stats.linesCleared += session.state.linesCleared; projected.stats.extraCellsPopped += session.state.stats.pops; projected.stats.allClears += session.state.stats.allClears;
    const result = grantAchievements(projected, { mode: session.state.mode, score: session.state.score, rescueUsed: session.state.rescue.used, closeCall, rescuedLine: session.state.mode !== 'adventure' && rescueClearWithinThree(runEvents), events: runEvents, friendBeaten: challengeBeaten });
    if (!result.unlocked.length) return;
    save.achievements = result.save.achievements; save.profile.coins = result.save.profile.coins; save.profile.coinsEarned = result.save.profile.coinsEarned; saveNow(save);
    for (const achievement of result.unlocked) { toast.show(S.achievementUnlock(S.achievementName(achievement.id), achievement.coins)); sfx.achievement(); }
  }
  function finishRun(): void {
    if (runRecorded) return; runRecorded = true;
    const completed = session.state; const todayKey = dayKeyFromMs(Date.now()); const runDayKey = completed.daily?.dayKey ?? todayKey;
    save = rollDay(save, todayKey);
    const practiceDaily = completed.mode === 'daily' && Boolean(save.daily.records[runDayKey]); const dailyBefore = structuredClone(save.daily); const dailiesBefore = save.stats.dailiesFinished;
    save = recordRun(save, completed); save.stats.boostersUsed += runEvents.filter((event) => event.type === 'boosterUsed').length; if (practiceDaily) { save.daily = dailyBefore; save.stats.dailiesFinished = dailiesBefore; }
    save.stats.timePlayedMs += Math.max(0, Math.floor(performance.now() - runStartedAt)); const reward = rewardsForRun(save, summarizeRun(completed, runEvents), false); save = reward.save;
    if (completed.mode === 'daily' && completed.moves > 0 && !save.daily.records[runDayKey]) {
      countedDailyThisRun = true;
      save = recordDaily(save, completed, runDayKey, runEvents); const streakUpdate = updateStreak(save, runDayKey); save = streakUpdate.save; save.daily.records[runDayKey]!.freezeUsed = streakUpdate.freezeUsed;
      if (streakUpdate.freezeUsed > 0) toast.show(S.freezeSaved(save.streak.current)); else if (streakUpdate.endedAt > 0) toast.show(S.streakEnded(streakUpdate.endedAt));
      if (streakMilestone(save.streak.current) && !shouldReduceMotion(save.settings.reducedMotion, devicePrefersReducedMotion())) renderLoop.scheduleHitStop(currentFrame.boardNow, 70);
      save.profile.xp += 100; save.profile.coins += 30; save.profile.coinsEarned += 30;
    }
    save.inProgress = null; if (completed.mode === 'daily') save.dailyInProgress = null; controlsHint.hidden = save.ui.runsFinished >= 3;
    if (save.ui.seenTips.includes('tutorialTipPending')) { save.ui.seenTips = save.ui.seenTips.filter((tip) => tip !== 'tutorialTipPending'); tutorialTipForGameOver = true; }
    const achievementResult = grantAchievements(save, { mode: completed.mode, score: completed.score, rescueUsed: completed.rescue.used, closeCall, rescuedLine: session.state.mode !== 'adventure' && rescueClearWithinThree(runEvents), events: runEvents, friendBeaten: challengeBeaten }); save = achievementResult.save;
    const lastLevel = reward.levels[reward.levels.length - 1]; runReward = { xp: reward.xp, coins: reward.coins, progress: Math.max(0, save.profile.xp - totalXpForLevel(save.profile.level)), progressMax: xpToNext(save.profile.level), currentLevel: save.profile.level, level: lastLevel };
    runReward.coins += discoveryCoins;
    saveNow(save);
    if (lastLevel) { toast.show(S.levelUp(lastLevel)); sfx.levelUp(); }
      for (const item of reward.unlocked) { toast.show(S.unlocked(item)); if (item === 'Adventure') toast.show(S.adventureGift); }
    for (const achievement of achievementResult.unlocked) { toast.show(S.achievementUnlock(S.achievementName(achievement.id), achievement.coins)); sfx.achievement(); }
    if (runReward.coins > 0) sfx.coinTick({ count: Math.min(12, runReward.coins) });
  }
  function updateOverlay(): void {
    const status = session.state.status; const endDelay = session.state.adventure?.result?.won ? 600 : 450; if (status === 'over' && gameOverAt >= 0 && renderElapsed - gameOverAt < endDelay) return; if (status === shownStatus) return; shownStatus = status;
    if (status === 'over') {
      if (session.state.adventure?.result) {
        paused = false; ui.hide();
        const nearLines = nearMissMessages(session.state, 0, session.state.stats.biggestPop, session.state.linesCleared).map((item) => {
          if (item.kind === 'stuck') return S.nothingFit(item.amount);
          if (item.kind === 'adventureNeed') { const flavour = item.unit && /^\d+$/.test(item.unit) ? S.flavourName(Number(item.unit)).toLowerCase() : undefined; const kind = item.unit && flavour ? 'F' : item.unit ?? 'L'; return S.adventureNeed(item.amount, S.adventureUnit(kind, item.amount, flavour)); }
          return '';
        }).filter(Boolean);
        const wrap = document.createElement('div'); wrap.className = 'adventure-modal-shade adventure-result-shade';
        void import('../ui/adventureBundle').then(({ createLevelResultPanel }) => {
        if (session.state.status !== 'over' || !session.state.adventure?.result) return;
        history.pushState({ gloopScreen: 'play', adventureResult: true }, '');
        wrap.append(createLevelResultPanel(session.state, adventureReward, {
          next: () => { const nextLevel = session.state.adventure?.level ?? 120; if (nextLevel < 120) void showAdventureCard(nextLevel + 1, false); else router.open('adventure'); },
          replay: () => { homeHost.replaceChildren(); void toAdventure(session.state.adventure?.level ?? 1); },
          assistAgain: () => { homeHost.replaceChildren(); void toAdventure(session.state.adventure?.level ?? 1, {}, true); },
          map: () => { homeHost.replaceChildren(); router.open('adventure'); },
        }, nearLines, { winStreak: save.adventure.winStreak, streakReset: adventureStreakReset, assistAvailable: assistAvailable(save, session.state.adventure.level) })); homeHost.append(wrap);
        }); return;
      }
      finishRun();
      // spec-note: A counted Daily goes straight to the existing full result screen, whose Practice, Share, and Home actions satisfy the Daily game-over actions in design §13.3.
      if (countedDailyThisRun) { router.open('dailyResult'); return; }
      paused = false; const summary = summarizeRun(session.state, runEvents); const challengeMode = session.state.mode === 'classic' || session.state.mode === 'expert';
      const challengeText = (): void => { const flavor = summary.biggestGloop?.flavour ?? 1; const url = `${location.host}${import.meta.env.BASE_URL.replace(/\/$/, '')}/?beat=${session.state.score}&f=${flavourName(flavor as 1 | 2 | 3 | 4 | 5 | 6 | 7)}`; const text = buildChallengeText({ score: session.state.score, biggestPop: session.state.stats.biggestPop, bestCombo: session.state.bestCombo, flavour: flavor as 1 | 2 | 3 | 4 | 5 | 6 | 7 }, session.state.mode === 'expert' ? 'expert' : 'classic', url); void shareText(text, () => toast.show(S.copied)); };
      const weeklyId = WEEKLY_POOL[((save.weekly.weekIndex % WEEKLY_POOL.length) + WEEKLY_POOL.length) % WEEKLY_POOL.length]!; const weeklyTarget = WEEKLY_TARGETS[weeklyId];
      const nearAchievement = ACHIEVEMENTS.filter((def) => !save.achievements[def.id] && COUNTER_ACHIEVEMENTS.has(def.id)).map((def) => { const progress = achievementProgress(def.id, save); return { remaining: Math.max(0, progress.target - progress.current), target: progress.target, name: S.achievementName(def.id), unit: S.achievementUnit(def.id) }; }).filter((entry) => entry.remaining <= entry.target * 0.2).sort((a, b) => a.remaining - b.remaining)[0];
      const missionNear = (session.state.mode === 'classic' || session.state.mode === 'expert') ? missionNearMiss(save) : null;
      const near = nearMissMessages(session.state, runBest, session.state.stats.biggestPop, session.state.linesCleared, { xpRemaining: save.profile.level < 50 ? totalXpForLevel(save.profile.level + 1) - save.profile.xp : undefined, level: save.profile.level + 1, levelCost: save.profile.level < 50 ? xpToNext(save.profile.level) : undefined, weeklyRemaining: Math.max(0, weeklyTarget - save.weekly.progress), weeklyTarget, achievement: nearAchievement, mission: missionNear ? { remaining: missionNear.remaining, target: missionNear.target, text: S.missionText(missionNear.id) } : undefined });
      const noteLines = near.map((item) => item.kind === 'newBest' ? S.nearNewBest(item.amount) : item.kind === 'bestShort' ? S.nearBestShort(item.amount) : item.kind === 'targetShort' ? S.targetShort(item.amount, item.target ?? 0) : item.kind === 'piece' ? S.nearPiece(S.shapeName(item.shape ?? 'dot')) : item.kind === 'line' ? S.nearLine(item.lineKind ?? 'row', (item.index ?? 0) + 1) : item.kind === 'xp' ? S.nearXp(item.amount, item.level ?? 1) : item.kind === 'weekly' ? S.nearWeekly(item.amount) : item.kind === 'achievement' ? S.nearAchievement(item.amount, item.unit ?? 'more', item.name ?? '') : item.kind === 'mission' ? S.missionNear(item.amount, item.name ?? '') : S.nearFallback(session.state.stats.biggestPop, session.state.linesCleared));
      const challengeNote = activeChallenge && challengeMode ? session.state.score > activeChallenge.score ? S.beatFriendBy(session.state.score - activeChallenge.score) : S.shortOfFriend(activeChallenge.score - session.state.score) : noteLines.join('\n'); const note = tutorialTipForGameOver ? `${challengeNote}${challengeNote ? '\n' : ''}${S.tutorialTip}` : challengeNote; tutorialTipForGameOver = false;
      const classicImage = (): void => { void import('../render/shareCard').then(({ renderShareCard }) => { const canvasCard = renderShareCard({ title: S.classic, date: '', score: session.state.score, combo: session.state.bestCombo, biggestPop: session.state.stats.biggestPop, lines: session.state.linesCleared, streak: 0, theme: save.equipped.theme as keyof typeof PALETTE.theme, board: session.state.board, biggestGloop: summary.biggestGloop ?? undefined }); canvasCard.toBlob((blob) => { if (blob) void shareImage(blob, `gloop-pop-classic-${session.state.score}.png`); }); }); };
      setAudioPaused(false);
      const endedBy = runEvents.find((event) => event.type === 'gameOver'); const gameOverTitle = session.state.mode === 'daily' ? endedBy?.type === 'gameOver' && endedBy.reason === 'traysDone' ? S.allTraysPlaced : S.dailyRunDone(session.state.daily?.dayNumber ?? 1) : S.noRoom;
      const missionsReady = save.missions.slots.filter((slot) => !slot.claimed && slot.progress >= (MISSIONS.find((mission) => mission.id === slot.id)?.target ?? Infinity)).length;
      ui.showGameOver(() => restart(), () => { ui.hide(); router.open('home'); }, session.state.score, session.state.mode === 'zen' ? null : runBest, S.gameOverFallback(session.state.stats.biggestPop, session.state.linesCleared), runReward, summary, challengeMode ? challengeText : undefined, challengeMode ? classicImage : undefined, note, gameOverTitle, session.state.mode === 'daily' ? () => router.open('dailyResult') : undefined, { targetsHit: session.state.goals?.targetsHit ?? 0, miniDone: session.state.goals?.mini.done ?? false, missionsReady });
    } else if (status === 'rescueOffer') ui.showRescue(() => apply({ type: 'useRescue' }), () => apply({ type: 'declineRescue' }));
    else if (!paused) ui.hide();
  }
  function persist(immediate: boolean): void {
    if (router.current === 'play' && session.state.status !== 'over') {
      if (session.state.mode === 'daily') save.dailyInProgress = session.state; else if (session.state.adventure) save.adventure.inProgress = session.state; else save.inProgress = session.state;
    }
    const writeLater = (): void => saveNow(save);
    window.clearTimeout(saveTimer); if (immediate) writeLater(); else saveTimer = window.setTimeout(writeLater, 300);
  }
  function updateCanvasAria(): void {
    const adventure = session.state.adventure;
    if (adventure) { const goals = adventure.goals.map((goal) => S.goalAria(S.adventureGoalText(goal.kind, goal.target, goal.flavour ? S.flavourName(goal.flavour).toLowerCase() : undefined), goal.progress, goal.target)).join('. '); gameCanvas.setAttribute('aria-label', `${S.logo}. ${S.levelText(adventure.level)}. ${new Intl.NumberFormat('en-US').format(adventure.movesLeft)} ${S.movesLeft}. ${goals}`); return; }
    const goals = session.state.goals;
    if (!goals) { gameCanvas.setAttribute('aria-label', `${S.logo}. ${S.howToControls}`); return; }
    const target = nextTarget(session.state.score, goals.floor, goals.best);
    gameCanvas.setAttribute('aria-label', `${S.logo}. ${S.howToControls}. ${S.targetAria(target, Math.max(0, target - session.state.score))} ${S.miniAria(S.miniText(goals.mini.id, goals.mini.flavour), goals.mini.progress, goals.mini.target)}`);
  }
  function triggerSlowMo(reduced: boolean): void {
    const now = performance.now(); if (!canStartSlowMo(lastSlowMoAt, now, reduced)) return; lastSlowMoAt = now;
    if (reduced) return;
    renderLoop.requestSlowMo(0.35, 40, 300, 200);
  }
  function renderScreen(screen: import('./router').ScreenId): void {
    homeHost.replaceChildren(); ui.hide();
    if (screen === 'home') { save = rollDay(save, dayKeyFromMs(Date.now())); saveNow(save); homeHost.append(createHomeScreen(save, { play: start, adventure: () => router.open('adventure'), dailyResult: () => router.open('dailyResult'), stats: () => router.open('stats'), collection: () => router.open('collection'), achievements: () => router.open('achievements'), settings: () => router.open('settings'), howToPlay: () => router.open('howToPlay'), credits: () => router.open('credits'), claimMission: (slot, anchor) => { const start = anchor.getBoundingClientRect(); const target = document.querySelector(".home-header .home-chip:last-child")?.getBoundingClientRect(); const oldCoins = save.profile.coins; const reduced = shouldReduceMotion(save.settings.reducedMotion, devicePrefersReducedMotion()); const result = claimMission(save, slot); if (!result.coins) return; save = result.save; toast.show(S.missionRewardToast(result.coins - (result.setBonus ? 50 : 0), result.xp - (result.setBonus ? 50 : 0)), 'coin'); if (result.setBonus) toast.show(S.missionSetToast, 'gold'); for (const level of result.levels) toast.show(S.levelUp(level)); for (const achievement of result.unlocked) toast.show(S.achievementUnlock(S.achievementName(achievement.id), achievement.coins)); saveNow(save); renderScreen('home'); if (target && !reduced) animateMissionCoins(start, target); sfx.coinTick({ count: reduced ? 1 : 3 }); if (!reduced) animateCoinCount(oldCoins, save.profile.coins); }, changeMission: (slot) => { save = rerollMission(save, slot, dayKeyFromMs(Date.now())); saveNow(save); renderScreen('home'); }, debugXp: () => { const result = grantXp(save, 5000); save = result.save; saveNow(save); for (const level of result.levels) toast.show(S.levelUp(level)); for (const item of result.unlocked) toast.show(S.unlocked(item)); renderScreen('home'); } }, debug, activeChallenge ?? undefined)); }
    else if (screen === 'adventure') { paused = false; void import('../ui/adventureBundle').then(({ LEVELS, createAdventureMap: createMap }) => { if (router.current !== 'adventure') return; loadedAdventureLevels = LEVELS; const attempt = save.adventure.inProgress; if (attempt && attempt.adventure) { const def = LEVELS[attempt.adventure.level - 1]; if (def && isStaleAttempt(attempt, def)) { save = returnUnused(save, attempt); save.adventure.inProgress = null; saveNow(save); } } homeHost.append(createMap(save, { back: () => router.back(), openLevel: (level) => void showAdventureCard(level, true) })); }); }
    else if (screen === 'stats') { paused = false; homeHost.append(createStatsScreen(save, () => router.back())); }
    else if (screen === 'collection') { paused = false; homeHost.append(createCollectionScreen(save, () => router.back(), (next) => { save = next; syncCosmetics(); backgroundTheme = ''; saveNow(save); })); }
    else if (screen === 'achievements') { paused = false; homeHost.append(createAchievementsScreen(save, () => router.back())); }
    else if (screen === 'settings') { paused = false; homeHost.append(createSettingsScreen(save, { change: (key, value) => { save.settings[key] = value; if (key === 'sfx') setSfxEnabled(value); else if (key === 'music') setMusicEnabled(value); else if (key === 'cbPatterns') setColourBlindPatterns(value); saveNow(save); }, volume: (key, value, commit) => { save.settings[key] = value; if (key === 'sfxVolume') setEffectsVolume(value); else setMusicVolume(value); if (commit) { saveNow(save); if (key === 'sfxVolume') sfx.place({ cells: 1 }); } }, reduce: (value) => { save.settings.reducedMotion = value; saveNow(save); }, replay: () => { save.tutorialDone = false; save.ui.seenTips = save.ui.seenTips.filter((tip) => tip !== 'tutorialStep4Pending' && tip !== 'tutorialTipPending'); runBest = bestFor(save, 'classic'); session = createSession({ state: tutorialGame(1), best: runBest }); runEvents = []; runRecorded = false; countedDailyThisRun = false; runStartedAt = performance.now(); gameOverAt = -1; shownStatus = ''; shownScore = 0; tutorialActive = true; tutorialStep = 1; tutorialTouched = false; tutorialBubbleText = ''; tutorialBubbleUntil = -1; save.inProgress = session.state; if (!tutorialBubble.element.isConnected) uiRoot?.append(tutorialBubble.element); saveNow(save); router.open('play'); }, credits: () => router.open('credits'), reset: () => { save = defaultSave(Date.now()); saveNow(save); window.location.reload(); }, back: () => router.back() })); }
    else if (screen === 'howToPlay') { paused = false; homeHost.append(createHowToPlayScreen(() => router.back())); }
    else if (screen === 'credits') { paused = false; homeHost.append(createCreditsScreen(() => router.back())); }
    else if (screen === 'dailyResult') {
      paused = false; const key = dayKeyFromMs(Date.now()); const result = dailyResult(save, key);
      if (!result) { router.open('home'); return; }
      const remaining = Math.floor(((Math.floor(Date.now() / 86_400_000) + 1) * 86_400_000 - Date.now()) / 1000); const clock = `${String(Math.floor(remaining / 3600)).padStart(2, '0')}:${String(Math.floor(remaining / 60) % 60).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
      homeHost.append(createDailyResultScreen(result, dayNumber(key), save.streak.current, result.freezeUsed, () => { const text = buildDailyShareText(dayNumber(key), flavourForDay(key), result, save.streak.current, `${location.host}${import.meta.env.BASE_URL.replace(/\/$/, '')}`); void shareText(text, () => toast.show(S.copied)); }, () => {
        void import('../render/shareCard').then(({ renderShareCard }) => { const canvas = renderShareCard({ title: S.dailyResult(dayNumber(key)), date: new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(Date.now()), score: result.score, combo: result.bestCombo, biggestPop: result.biggestPop, lines: result.lines, streak: save.streak.current, theme: save.equipped.theme as keyof typeof PALETTE.theme, daily: result, heroFlavour: flavourForDay(key) }); canvas.toBlob((blob) => { if (blob) void shareImage(blob, `gloop-pop-daily-${dayNumber(key)}.png`); }); });
      }, () => start('daily'), () => router.open('home')));
      const countdown = document.createElement('p'); countdown.className = 'daily-next'; countdown.textContent = S.nextDaily(clock); homeHost.querySelector('.daily-result-panel')?.append(countdown);
    }
    else if (pauseStartedAt > 0) { runStartedAt += performance.now() - pauseStartedAt; pauseStartedAt = 0; paused = false; }
  }
}

function animateMissionCoins(from: DOMRect, to: DOMRect): void {
  const dx = to.x + to.width / 2 - (from.x + from.width / 2); const dy = to.y + to.height / 2 - (from.y + from.height / 2);
  for (let index = 0; index < 6; index += 1) {
    const coin = document.createElement('span'); coin.className = 'mission-coin-flight'; coin.setAttribute('aria-hidden', 'true');
    coin.style.left = `${from.x + from.width / 2 - 8}px`; coin.style.top = `${from.y + from.height / 2 - 8}px`; document.body.append(coin);
    const animation = coin.animate([
      { transform: 'translate(0, 0) scale(1)' },
      { transform: `translate(${dx / 2}px, ${dy / 2 - 48}px) scale(1.05)` },
      { transform: `translate(${dx}px, ${dy}px) scale(0.8)` },
    ], { duration: 500, delay: index * 40, easing: 'ease-in-out', fill: 'forwards' });
    animation.onfinish = () => coin.remove();
  }
}

function animateCoinCount(oldValue: number, newValue: number): void {
  const chip = document.querySelector<HTMLElement>('.home-header .home-chip:last-child'); if (!chip) return;
  const started = performance.now(); const tick = (now: number): void => {
    const progress = Math.min(1, (now - started) / 600); chip.textContent = S.coins(Math.round(oldValue + (newValue - oldValue) * progress));
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function firstMomentInfo(discoveries: readonly { key: string; coins: number }[]): { text: string; coins: number } {
  const order = ['allClear', 'megaPop', 'hugePop', 'bigPop', 'double', 'combo10', 'combo5', 'line'];
  const key = order.find((candidate) => discoveries.some((item) => item.key === candidate));
  const text = key === 'line' ? S.firstLine : key === 'double' ? S.firstDouble : key === 'bigPop' ? S.firstBigPop : key === 'hugePop' ? S.firstHugePop : key === 'megaPop' ? S.firstMegaPop : key === 'allClear' ? S.firstAllClear : key === 'combo5' ? S.firstCombo5 : key === 'combo10' ? S.firstCombo10 : '';
  return { text, coins: discoveries.reduce((sum, item) => sum + item.coins, 0) };
}

function rescueClearWithinThree(events: readonly GameEvent[]): boolean {
  let rescueAt = -1; let placed = 0;
  for (const [index, event] of events.entries()) { if (event.type === 'rescued') { rescueAt = index; placed = 0; } else if (rescueAt >= 0 && event.type === 'placed') placed += 1; else if (rescueAt >= 0 && event.type === 'cleared' && placed > 0 && placed <= 3) return true; }
  return false;
}
function bestFor(save: SaveV2, mode: ModeId): number { return mode === 'expert' ? save.best.expert : mode === 'daily' ? save.daily.best : mode === 'zen' ? 0 : save.best.classic; }
const debugFrameBuckets = new Uint16Array(8); let debugFrameCursor = 0; let debugFrameCount = 0; let debugFrameSum = 0;
function drawDebug(context: CanvasRenderingContext2D, layout: Layout, dpr: number, dt: number, surface: ReturnType<typeof createCanvasSurface>, effectMs: number, audioLine: string, adventureLine = ''): void {
  const buckets = debugFrameBuckets; const bin = Math.min(buckets.length - 1, Math.floor(dt / 2)); if (debugFrameCount === 120) { buckets[debugFrameCursor] = Math.max(0, buckets[debugFrameCursor]! - 1); debugFrameSum -= debugFrameLast[debugFrameCursor]!; } else debugFrameCount += 1;
  debugFrameLast[debugFrameCursor] = dt; buckets[bin] = buckets[bin]! + 1; debugFrameSum += dt; debugFrameCursor = (debugFrameCursor + 1) % 120;
  let accumulated = 0; let p95 = 16; for (let i = 0; i < buckets.length; i += 1) { accumulated += buckets[i]!; if (accumulated >= debugFrameCount * 0.95) { p95 = i * 2 + 1; break; } } const average = debugFrameSum / Math.max(1, debugFrameCount);
  // spec-note: `slow=1` feeds synthetic slow frames into the same sampler for repeatable adaptive-DPR QA.
  const forced = new URLSearchParams(window.location.search).get('slow') === '1'; if (forced) for (let i = 0; i < 120; i += 1) surface.reportFrame(25);
  context.save(); context.fillStyle = PALETTE.light.shadowDeep; context.fillRect(8, 8, 520, adventureLine ? 174 : 146); context.fillStyle = PALETTE.ui.textPrimary; context.font = '700 12px Nunito, sans-serif'; context.fillText(`frame ${dt.toFixed(1)} ms · avg ${average.toFixed(1)} · p95 ${p95.toFixed(1)}`, 16, 28); context.fillText(`dpr ${dpr.toFixed(2)} · ${layout.width}×${layout.height}`, 16, 47); context.fillText(`effects ${effectMs.toFixed(2)} ms`, 16, 66); context.fillText(`120f ${debugFrameCount} · ${forced ? 'slow test' : 'live'}`, 16, 85); context.fillText(audioLine, 16, 104, 504); if (adventureLine) context.fillText(adventureLine, 16, 123, 504); let peak = 1; for (let i = 0; i < buckets.length; i += 1) peak = Math.max(peak, buckets[i]!); context.fillStyle = PALETTE.ui.gold; for (let i = 0; i < buckets.length; i += 1) { const height = 18 * buckets[i]! / peak; context.fillRect(16 + i * 26, (adventureLine ? 170 : 150) - height, 18, height); } context.restore();
}
const debugFrameLast = new Float32Array(120);
