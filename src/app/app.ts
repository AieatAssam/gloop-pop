// M2.1–M3.4: canvas play loop, durable runs, progression and Home/Stats routing.
// spec-note: Load remains on Classic because design §9.1 specifies that entry; Home is one menu action away.
import { createCanvasSurface } from '../render/canvas';
import { createBackground } from '../render/background';
import { computeLayout, type Layout } from '../render/layout';
import { startRenderLoop } from '../render/loop';
import { PALETTE } from '../render/palette';
import { createBoardView } from '../render/boardView';
import { drawHud } from '../render/hudView';
import { createDirector } from '../render/director';
import { createPointerInput } from '../input/pointer';
import { attachKeyboard } from '../input/keyboard';
import { createSession, runToResumeOnBoot } from './session';
import { createGameUi } from '../ui/dom';
import { createTopBar } from '../ui/topBar';
import { S } from '../ui/strings';
import { loadSave, saveNow } from '../platform/saveStore';
import type { SaveV1 } from '../meta/saveSchema';
import { recordRun } from '../meta/stats';
import { grantXp, rewardsForRun, totalXpForLevel, xpToNext } from '../meta/progression';
import { summarizeRun } from '../meta/runSummary';
import { createRouter } from './router';
import { createHomeScreen } from '../ui/screens/home';
import { createStatsScreen } from '../ui/screens/stats';
import { createToasts } from '../ui/toasts';
import { onSaveVisibility } from '../platform/visibility';
import type { Action, GameEvent, ModeId } from '../core/types';
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
import { initAudioOnFirstInput, playGameEvents, startMusic, setAudioPaused, setSfxEnabled, setMusicEnabled, setMasterMuted } from '../audio';
import { shouldReduceMotion, devicePrefersReducedMotion, canStartSlowMo } from '../platform/motion';
import { vibrate } from '../platform/haptics';
import { detectFirsts } from '../meta/firsts';
import { nearMissMessages } from '../core/nearMiss';
import { tutorialGame } from '../core/tutorial';
import { newGame } from '../core/game';
import { drawGhostHand, tutorialHandPoints } from '../render/ghostHand';
import { createTutorialBubble } from '../ui/tutorialBubble';
import { createSettingsScreen } from '../ui/screens/settings';
import { createHowToPlayScreen } from '../ui/screens/howToPlay';
import { defaultSave } from '../meta/saveSchema';
import { setColourBlindPatterns } from '../render/gloopRenderer';
import { chooseBotMove } from '../core/sim';
import { seededRng } from '../core/rng';

export function bootApp(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('#game'); const uiRoot = document.querySelector<HTMLElement>('#ui');
  if (!canvas || !uiRoot) throw new Error('Missing game surface.');
  let save = loadSave(); const savedRun = runToResumeOnBoot(save.inProgress);
  const skinMap: Record<string, SkinId> = { plain:'plain', googly:'googlyEyes', googlyEyes:'googlyEyes', freckles:'freckles', catears:'catEars', catEars:'catEars', glasses:'glasses', mustache:'mustache', bowtie:'bowtie', crown:'crown' };
  const syncCosmetics = (): void => setEquippedCosmetics({ theme: save.equipped.theme as keyof typeof PALETTE.theme, skin: skinMap[save.equipped.skin] ?? 'plain', popEffect: save.equipped.pop as PopEffectId });
  syncCosmetics();
  setMasterMuted(save.settings.muted); setSfxEnabled(save.settings.sfx); setMusicEnabled(save.settings.music);
  const beginTutorial = !savedRun && !save.tutorialDone;
  let session = createSession({ state: savedRun ?? (beginTutorial ? tutorialGame(1) : null), best: bestFor(save, savedRun?.mode ?? 'classic'), mode: 'classic' });
  canvas.setAttribute('aria-label', `${S.logo}. ${S.howToControls}`);
  let runBest = session.best; let runStartedAt = performance.now(); let pauseStartedAt = 0; let runReward = { xp: 0, coins: 0, progress: 0, progressMax: xpToNext(save.profile.level), currentLevel: save.profile.level, level: undefined as number | undefined };
  const router = createRouter('play'); const surface = createCanvasSurface(canvas); const background = createBackground(save.equipped.theme as keyof typeof PALETTE.theme); const view = createBoardView(); const director = createDirector();
  setColourBlindPatterns(save.settings.cbPatterns);
  let backgroundTheme = save.equipped.theme; const ui = createGameUi(uiRoot); const toast = createToasts(uiRoot); const homeHost = document.createElement('div'); uiRoot.append(homeHost);
  let paused = false; let shownScore = 0; let shownStatus = ''; let runRecorded = false; let countedDailyThisRun = false; let comboLostAt = -1; let layout: Layout = computeLayout(window.innerWidth, window.innerHeight); let renderElapsed = 0; let gameOverAt = -1; let saveTimer = 0; let runEvents: GameEvent[] = []; let closeCall = false;
  let tutorialActive = beginTutorial || savedRun?.mode === 'tutorial' || (!save.tutorialDone && save.ui.seenTips.includes('tutorialStep4Pending')); let tutorialStep = tutorialActive ? (session.state.mode === 'tutorial' ? Math.min(3, session.state.traysDealt) : 4) : 0; let tutorialTouched = false; let tutorialBubbleText = ''; let tutorialBubbleUntil = -1; let tutorialTipForGameOver = false;
  let candyFlameUntil = -1; let candyFlameFlavour = 1; let discoveryCoins = 0;
  let scoreAnimFrom = 0; let scoreAnimStart = 0; let scoreAnimDuration = 600;
  let newBestAt = -1;
  let flameBreakAt = -1;
  let comboPulseAt = -1; let scoreSparkleAt = -1;
  const queuedActions: Action[] = [];
  let lastSlowMoAt = -10000; let newBestShown = false;
  const query = new URLSearchParams(window.location.search); const demoBoard = query.get('demo') === 'board'; const demoFaces = query.get('demo') === 'faces'; const demoBg = query.get('demo') === 'bg'; const demoThemes = query.get('demo') === 'themes'; const demoMega = query.get('demo') === 'mega'; const debug = query.get('debug') === '1'; const autoplay = debug && (query.get('autoplay') === '1' || demoMega); const autoplayInterval = query.get('speed') === 'fast' ? 150 : 450; let autoplayAt = 0; let rescueOfferAt = -1; const botRng = seededRng('gloop-pop/debug-autoplay');
  if (debug && demoMega) {
    // spec-note: The QA scenario builds a 28-cell apple gloop around one two-cell gap; its line clear resolves as a Mega Pop at combo tier 4.
    const state = structuredClone(session.state); state.mode = 'classic'; state.board = new Array<number>(64).fill(0);
    for (let row = 1; row <= 4; row += 1) for (let col = 0; col < 8; col += 1) {
      if ((row === 2 && col === 0) || (row === 3 && (col === 3 || col === 4)) || (row === 4 && col === 7)) continue;
      state.board[row * 8 + col] = 4;
    }
    state.tray = [{ defId: 1, flavour: 4 }, null, null]; state.combo = 11; state.bestCombo = 11; state.fuse = 2; state.status = 'playing'; state.moves = 0; session = createSession({ state, best: session.best }); runBest = session.best; runEvents = []; gameOverAt = -1; shownStatus = '';
  }
  let activeChallenge = parseChallenge(window.location.search); let challengeBeaten = false;
  if (activeChallenge) { const clean = new URL(window.location.href); clean.searchParams.delete('beat'); clean.searchParams.delete('f'); history.replaceState(history.state, '', clean); }
  const requestedSkin = query.get('skin'); if (demoFaces && requestedSkin && skinMap[requestedSkin]) setEquippedCosmetics({ theme: save.equipped.theme as keyof typeof PALETTE.theme, skin: skinMap[requestedSkin], popEffect: save.equipped.pop as PopEffectId });
  const topBar = createTopBar(() => goHome(), () => showPause(), () => { initAudioOnFirstInput(); save.settings.muted = !save.settings.muted; setMasterMuted(save.settings.muted); topBar.muteButton.setAttribute('aria-label', save.settings.muted ? S.unmute : S.mute); persist(true); }, () => start('daily'), skipTutorial); uiRoot.append(topBar.element);
  const live = document.createElement('div'); live.className = 'sr-only'; live.setAttribute('aria-live', 'polite'); live.setAttribute('aria-atomic', 'true'); uiRoot.append(live);
  const controlsHint = document.createElement('div'); controlsHint.className = 'controls-hint'; controlsHint.textContent = S.controlsHint; controlsHint.hidden = save.ui.runsFinished >= 3; uiRoot.append(controlsHint);
  const tutorialBubble = createTutorialBubble(skipTutorial); if (tutorialActive) uiRoot.append(tutorialBubble.element);
  let audioStarted = false;
  const enableAudio = (): void => { initAudioOnFirstInput(); if (!audioStarted && router.current === 'play') { startMusic(); audioStarted = true; } };
  window.addEventListener('pointerdown', enableAudio, { once: true });
  const pointer = createPointerInput(view, () => layout, () => session.state, (slot, row, col) => apply({ type: 'place', slot: slot as 0 | 1 | 2, row, col }));
  const keyboard = attachKeyboard(view, () => layout, () => session.state, (slot, row, col) => apply({ type: 'place', slot: slot as 0 | 1 | 2, row, col }), () => pointer.cancel(), () => { if (router.current === 'play') showPause(); else router.back(); });
  const resize = (): void => {
    surface.resize(window.innerWidth, window.innerHeight);
    const rootStyle = getComputedStyle(document.documentElement); const safeTop = Number.parseFloat(rootStyle.getPropertyValue('--safe-area-top')) || 0; const safeBottom = Number.parseFloat(rootStyle.getPropertyValue('--safe-area-bottom')) || 0;
    layout = computeLayout(surface.width, surface.height, { top: safeTop, bottom: safeBottom }); background.resize(surface.width, surface.height, layout);
    topBar.element.style.left = `${layout.column.x}px`; topBar.element.style.width = `${layout.column.width}px`; topBar.element.style.top = `${layout.topBar.y}px`; topBar.element.style.height = `${layout.topBar.height}px`;
  };
  resize(); window.addEventListener('resize', resize, { passive: true });
  canvas.addEventListener('pointerdown', (event) => { enableAudio(); if (router.current !== 'play' || paused || session.state.status !== 'playing') return; const hadDrag = pointer.drag !== undefined; canvas.setPointerCapture(event.pointerId); pointer.pointerDown(event.offsetX, event.offsetY, event.pointerType); if (!hadDrag && pointer.drag) { vibrate('pick', save.settings.haptics); if (tutorialActive) { tutorialTouched = true; tutorialBubbleText = ''; tutorialBubble.setText(''); } } });
  canvas.addEventListener('pointermove', (event) => { if (router.current === 'play' && session.state.status === 'playing') pointer.pointerMove(event.offsetX, event.offsetY, event.pointerType); });
  canvas.addEventListener('pointerup', (event) => { if (router.current !== 'play' || paused || session.state.status !== 'playing') return; pointer.pointerUp(event.offsetX, event.offsetY, event.pointerType); });
  canvas.addEventListener('pointercancel', () => pointer.cancel());
  document.addEventListener('visibilitychange', () => { if (document.hidden && router.current === 'play' && !paused && session.state.status === 'playing') showPause(); });
  let queuedRestart = false;
  window.addEventListener('keydown', (event) => { enableAudio(); if (['1', '2', '3'].includes(event.key)) vibrate('pick', save.settings.haptics); if (event.key.toLowerCase() === 'm') { save.settings.muted = !save.settings.muted; setMasterMuted(save.settings.muted); topBar.muteButton.setAttribute('aria-label', save.settings.muted ? S.unmute : S.mute); persist(true); } if (session.state.status === 'over' && router.current === 'play' && [' ', 'Enter', 'r', 'R'].includes(event.key)) { event.preventDefault(); if (renderLoop.isHitStopped()) queuedRestart = true; else restart(); } });
  onSaveVisibility(() => { window.clearTimeout(saveTimer); persist(true); });
  router.subscribe((screen) => { if (screen !== 'play') toast.clear(); renderScreen(screen); }); renderScreen('play'); persist(true);
  const renderLoop = startRenderLoop((dtMs, elapsedMs) => {
    renderElapsed = elapsedMs;
    uiRoot.style.setProperty('--toast-play-top', `${layout.board.y + layout.board.height}px`); uiRoot.style.setProperty('--toast-play-left', `${layout.board.x + layout.board.width / 2}px`);
    if (!renderLoop.isHitStopped() && queuedActions.length) { const nextAction = queuedActions.shift(); if (nextAction) apply(nextAction); }
    if (!renderLoop.isHitStopped() && queuedRestart) { queuedRestart = false; restart(); }
    const reducedForFrame = shouldReduceMotion(save.settings.reducedMotion, devicePrefersReducedMotion()); background.setReducedMotion(reducedForFrame);
    if (demoThemes) background.setTheme(THEME_KEYS[Math.floor(elapsedMs / 2400) % THEME_KEYS.length]!, elapsedMs);
    else if (backgroundTheme !== save.equipped.theme) { backgroundTheme = save.equipped.theme; background.setTheme(backgroundTheme as keyof typeof PALETTE.theme, elapsedMs); }
    const ctx = surface.context; ctx.setTransform(surface.dpr, 0, 0, surface.dpr, 0, 0); ctx.save(); background.draw(ctx, elapsedMs, layout, session.state.stage); ctx.restore(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    const today = dayKeyFromMs(Date.now()); const pill = save.daily.records[today] ? S.dailyPillDone : save.streak.current >= 2 && new Date().getUTCHours() >= 18 ? S.dailyKeepStreak(dayNumber(today), save.streak.current) : S.daily(dayNumber(today)); if (topBar.dailyPill.textContent !== pill) topBar.dailyPill.textContent = pill;
    // Design §23.9: the Daily is offered after the tutorial and the first Classic run, never before.
    const isPlay = router.current === 'play'; const hideHint = !isPlay || save.ui.runsFinished >= 3; if (controlsHint.hidden !== hideHint) controlsHint.hidden = hideHint; topBar.element.style.display = isPlay ? 'flex' : 'none'; topBar.element.classList.toggle('is-tutorial', tutorialActive); topBar.dailyPill.hidden = tutorialActive || save.ui.runsFinished < 1; topBar.muteButton.hidden = tutorialActive; topBar.pauseButton.hidden = tutorialActive; topBar.tutorialSkip.style.display = tutorialActive ? 'block' : 'none';
    topBar.dailyPill.classList.toggle('is-at-risk', save.streak.current >= 2 && !save.daily.records[today] && new Date().getUTCHours() >= 18);
    if (isPlay && !demoBg) {
      const reduced = reducedForFrame;
      const shake = director.shakeOffset(); const shakeScale = layout.portrait ? 1 : 1.4; ctx.save(); ctx.translate(shake.x * shakeScale, shake.y * shakeScale);
      view.draw(ctx, layout, session.state, elapsedMs, paused ? undefined : pointer.drag ?? keyboard.drag(), demoBoard ? 'board' : demoFaces ? 'faces' : '', gameOverAt); director.draw(ctx, layout, elapsedMs, reduced); ctx.restore();
      if (paused) { ctx.fillStyle = PALETTE.ui.scrim; ctx.fillRect(0, 0, layout.width, layout.height); }
      shownScore = drawHud(ctx, layout, session.state, session.best, elapsedMs, shownScore, comboLostAt, activeChallenge?.score, candyFlameUntil, candyFlameFlavour, reduced, scoreAnimFrom, scoreAnimStart, scoreAnimDuration, newBestAt, flameBreakAt, comboPulseAt, scoreSparkleAt);
      if (tutorialActive && tutorialStep < 4 && !tutorialTouched) { const target = tutorialStep === 1 ? { row: 6, col: 6, width: 2 } : tutorialStep === 2 ? { row: 6, col: 3, width: 1 } : { row: 4, col: 6, width: 2 }; const cells = tutorialStep === 2 ? [[0, 0], [1, 0]] as const : [[0, 0], [0, 1]] as const; const hand = tutorialHandPoints(layout.board, layout.tray, layout.cellSize, target.row, target.col, target.width); drawGhostHand(ctx, elapsedMs, hand.from, hand.to, layout.cellSize, cells); }
      if (debug && query.get('overlay') !== '0') drawDebug(ctx, layout, surface.dpr, dtMs, surface);
    }
    updateTutorial(elapsedMs);
    updateOverlay();
    }, (elapsed) => { surface.reportFrame(elapsed); if (autoplay && router.current === 'play' && !paused && session.state.status === 'rescueOffer') { if (rescueOfferAt < 0) rescueOfferAt = renderElapsed; if (renderElapsed - rescueOfferAt >= 600) { rescueOfferAt = -1; apply({ type: 'useRescue' }); } } else if (session.state.status !== 'rescueOffer') rescueOfferAt = -1; if (autoplay && router.current === 'play' && !paused && session.state.status === 'playing' && renderElapsed >= autoplayAt) { autoplayAt = renderElapsed + autoplayInterval; enableAudio(); const move = demoMega && session.state.moves === 0 ? { slot: 0 as const, row: 3, col: 3 } : chooseBotMove(session.state, botRng); if (move) apply({ type: 'place', slot: move.slot, row: move.row, col: move.col }); } });

  function apply(action: Action): void {
    if (renderLoop.isHitStopped()) { queuedActions.push(action); return; }
    const filledBeforeResolve = action.type === 'place' ? session.state.board.filter((cell) => cell > 0).length + (PIECES[session.state.tray[action.slot]?.defId ?? -1]?.cells.length ?? 0) : 0;
    const scoreBefore = session.state.score; const events = session.dispatch(action); if (events.some((event) => event.type === 'cleared' || event.type === 'popped' || event.type === 'allClear' || event.type === 'gameOver')) live.textContent = `${S.score} ${new Intl.NumberFormat('en-US').format(session.state.score)}${session.state.status === 'over' ? ` · ${S.noRoom}` : ''}`; if (action.type === 'place' && tutorialActive && events.some((event) => event.type === 'placed')) advanceTutorial(); if (session.state.score > scoreBefore) { scoreAnimFrom = shownScore; scoreAnimStart = renderElapsed; scoreAnimDuration = Math.min(600, 150 + (session.state.score - scoreBefore) / 10); if (session.state.score - scoreBefore >= 1000) scoreSparkleAt = scoreAnimStart + scoreAnimDuration; } if (action.type === 'place' && filledBeforeResolve >= 52 && events.some((event) => event.type === 'cleared')) closeCall = true; runEvents.push(...events);
    const reduced = shouldReduceMotion(save.settings.reducedMotion, devicePrefersReducedMotion());
    if (events.length) { const passedBest = runBest > 0 && scoreBefore <= runBest && session.state.score > runBest; playGameEvents(events, { combo: session.state.combo, newBest: passedBest }); director.receive(events, renderElapsed, reduced, session.state, layout); view.receive(events, renderElapsed, session.state); if (action.type === 'place') { const lineCount = events.reduce((sum, event) => sum + (event.type === 'cleared' ? event.rows.length + event.cols.length : 0), 0); const peak = events.reduce((size, event) => event.type === 'popped' ? Math.max(size, ...event.gloops.map((gloop) => gloop.size)) : size, 0); const stuck = events.some((event) => event.type === 'stuck'); const mega = events.some((event) => event.type === 'allClear') || peak >= 24; vibrate(stuck ? 'stuck' : mega ? 'mega' : peak >= 8 ? 'big' : lineCount >= 2 ? 'line2' : lineCount === 1 ? 'line1' : 'place', save.settings.haptics); }
      const scored = events.find((event) => event.type === 'scored'); if (scored?.type === 'scored' && scored.points >= 2000) candyFlameUntil = renderElapsed + 1500;
      if (!newBestShown && runBest > 0 && scoreBefore <= runBest && session.state.score > runBest) { newBestShown = true; newBestAt = renderElapsed; director.banner(S.newBest, renderElapsed, 0, 0, 40); triggerSlowMo(reduced); }
      const clearedForFlame = events.find((event) => event.type === 'cleared'); if (clearedForFlame?.type === 'cleared' && clearedForFlame.flavoursByCell.length) candyFlameFlavour = clearedForFlame.flavoursByCell[clearedForFlame.flavoursByCell.length - 1] ?? candyFlameFlavour;
      const poppedGroup = events.find((event) => event.type === 'popped')?.type === 'popped' ? events.find((event) => event.type === 'popped') : undefined;
      if (poppedGroup?.type === 'popped' && poppedGroup.gloops.length) candyFlameFlavour = poppedGroup.gloops[poppedGroup.gloops.length - 1]!.flavour;
      if (events.some((event) => event.type === 'cleared')) background.react(events.some((event) => event.type === 'allClear') ? 'allClear' : poppedGroup?.type === 'popped' && poppedGroup.gloops.some((gloop) => gloop.size >= 24) ? 'mega' : poppedGroup?.type === 'popped' && poppedGroup.gloops.some((gloop) => gloop.size >= 15) ? 'huge' : poppedGroup?.type === 'popped' && poppedGroup.gloops.some((gloop) => gloop.size >= 8) ? 'big' : session.state.combo >= 12 ? 'tier4' : session.state.combo >= 5 ? 'combo' : 'clear', renderElapsed, candyFlameFlavour);
      for (const event of events) if (event.type === 'stageUp') toast.show([S.stage2, S.stage3, S.stage4, S.stage5, S.stage6][event.stage - 2] ?? S.stage6);
      if (events.some((event) => event.type === 'gameOver')) background.react('gameOver', renderElapsed);
      const discoveries = detectFirsts(events, save.firsts);
      for (const discovery of discoveries) { save.firsts[discovery.key] = true; save.profile.coins += discovery.coins; save.profile.coinsEarned += discovery.coins; discoveryCoins += discovery.coins; }
      // spec-note: simultaneous firsts share the strongest moment's banner; all earned coin bonuses are still paid.
      const bannerOrder = ['allClear', 'megaPop', 'hugePop', 'bigPop', 'double', 'combo10', 'combo5', 'line']; const banner = bannerOrder.map((key) => discoveries.find((item) => item.key === key)).find((item) => item !== undefined);
      if (banner) { const text = banner.key === 'line' ? S.firstLine : banner.key === 'double' ? S.firstDouble : banner.key === 'bigPop' ? S.firstBigPop : banner.key === 'hugePop' ? S.firstHugePop : banner.key === 'megaPop' ? S.firstMegaPop : banner.key === 'allClear' ? S.firstAllClear : banner.key === 'combo5' ? S.firstCombo5 : S.firstCombo10; const placement = events.find((event) => event.type === 'placed'); const bannerFlavour = placement?.type === 'placed' ? placement.piece.flavour : 0; director.banner(text, renderElapsed, discoveries.reduce((sum, item) => sum + item.coins, 0), bannerFlavour); if (!reduced) renderLoop.hitStop(70); }
      if (!reduced && (events.some((event) => event.type === 'allClear') || events.some((event) => event.type === 'popped' && event.gloops.some((gloop) => gloop.size >= 15)) || events.filter((event) => event.type === 'cleared').reduce((sum, event) => sum + event.rows.length + event.cols.length, 0) >= 3)) renderLoop.hitStop(events.some((event) => event.type === 'allClear') || events.some((event) => event.type === 'popped' && event.gloops.some((gloop) => gloop.size >= 15)) ? 70 : 50);
      if (events.some((event) => event.type === 'allClear') || events.some((event) => event.type === 'popped' && event.gloops.some((gloop) => gloop.size >= 24))) triggerSlowMo(reduced, true);
    }
    if (activeChallenge && scoreBefore <= activeChallenge.score && session.state.score > activeChallenge.score) { challengeBeaten = true; toast.show(S.youBeatFriend); director.banner(S.youBeatFriend, renderElapsed, 0, 0, 40); }
    const claimedBefore = save.weekly.claimed; save = addWeeklyProgress(save, session.state, events, weekIndexFromMs(Date.now())); save = claimWeeklyReward(save);
    if (!claimedBefore && save.weekly.claimed) toast.show(S.weeklyDone);
    for (const event of events) if (event.type === 'popped') save.achievements.bigPopCount = (save.achievements.bigPopCount ?? 0) + event.gloops.filter((gloop) => gloop.size >= 8).length;
    checkLiveAchievements();
    for (const event of events) { if (event.type === 'comboLost' && event.combo >= 2) { comboLostAt = renderElapsed; flameBreakAt = renderElapsed; } if (event.type === 'comboUp') comboPulseAt = renderElapsed; }
    paused = false; setAudioPaused(false); ui.hide(); persist(false);
    if (session.state.status === 'over') { if (gameOverAt < 0) gameOverAt = renderElapsed; finishRun(); }
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
    if (!resume) { runBest = bestFor(save, mode); session = createSession({ state: savedForMode, best: runBest, mode }); runStartedAt = performance.now(); runRecorded = false; countedDailyThisRun = false; runEvents = []; closeCall = false; shownScore = 0; scoreAnimFrom = 0; scoreAnimStart = renderElapsed; scoreAnimDuration = 600; newBestAt = -1; flameBreakAt = -1; comboPulseAt = -1; scoreSparkleAt = -1; shownStatus = ''; comboLostAt = -1; gameOverAt = -1; newBestShown = false; discoveryCoins = 0; }
    else if (pauseStartedAt > 0) { runStartedAt += performance.now() - pauseStartedAt; pauseStartedAt = 0; }
    paused = false; setAudioPaused(false); if (audioStarted) startMusic(); ui.hide(); router.open('play'); persist(false);
  }
  function restart(): void { if (challengeBeaten) { activeChallenge = null; challengeBeaten = false; } runBest = bestFor(save, session.state.mode); session = createSession({ best: runBest, mode: session.state.mode }); runStartedAt = performance.now(); runEvents = []; closeCall = false; pauseStartedAt = 0; shownScore = 0; scoreAnimFrom = 0; scoreAnimStart = renderElapsed; scoreAnimDuration = 600; newBestAt = -1; flameBreakAt = -1; comboPulseAt = -1; scoreSparkleAt = -1; shownStatus = ''; runRecorded = false; comboLostAt = -1; gameOverAt = -1; newBestShown = false; discoveryCoins = 0; director.receive([], renderElapsed); paused = false; ui.hide(); pointer.cancel(); persist(false); }
  function showPause(): void {
    if (router.current !== 'play' || session.state.status !== 'playing') return;
    paused = true; setAudioPaused(true); if (pauseStartedAt === 0) pauseStartedAt = performance.now(); persist(true); const mode = session.state.mode; const label = mode === 'daily' ? S.giveUp : mode === 'zen' ? S.endRun : S.restart;
    ui.showPause(() => { if (pauseStartedAt > 0) runStartedAt += performance.now() - pauseStartedAt; pauseStartedAt = 0; paused = false; setAudioPaused(false); ui.hide(); }, () => {
      if (mode === 'daily') ui.showDailyGiveUpConfirm(() => { if (pauseStartedAt > 0) runStartedAt += performance.now() - pauseStartedAt; pauseStartedAt = 0; apply({ type: 'endRun' }); }, () => showPause());
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
    const result = grantAchievements(projected, { mode: session.state.mode, score: session.state.score, rescueUsed: session.state.rescue.used, closeCall, rescuedLine: rescueClearWithinThree(runEvents), events: runEvents, friendBeaten: challengeBeaten });
    if (!result.unlocked.length) return;
    save.achievements = result.save.achievements; save.profile.coins = result.save.profile.coins; save.profile.coinsEarned = result.save.profile.coinsEarned; saveNow(save);
    for (const achievement of result.unlocked) toast.show(S.achievementUnlock(S.achievementName(achievement.id), achievement.coins));
  }
  function finishRun(): void {
    if (runRecorded) return; runRecorded = true;
    const completed = session.state; const todayKey = completed.daily?.dayKey ?? dayKeyFromMs(Date.now());
    const practiceDaily = completed.mode === 'daily' && Boolean(save.daily.records[todayKey]); const dailyBefore = structuredClone(save.daily); const dailiesBefore = save.stats.dailiesFinished;
    save = recordRun(save, completed); if (practiceDaily) { save.daily = dailyBefore; save.stats.dailiesFinished = dailiesBefore; }
    save.stats.timePlayedMs += Math.max(0, Math.floor(performance.now() - runStartedAt)); const reward = rewardsForRun(save, summarizeRun(completed, runEvents), false); save = reward.save;
    if (completed.mode === 'daily' && completed.moves > 0 && !save.daily.records[todayKey]) {
      countedDailyThisRun = true;
      save = recordDaily(save, completed, todayKey, runEvents); const streakUpdate = updateStreak(save, todayKey); save = streakUpdate.save; save.daily.records[todayKey]!.freezeUsed = streakUpdate.freezeUsed;
      if (streakUpdate.freezeUsed > 0) toast.show(S.freezeSaved(save.streak.current)); else if (streakUpdate.endedAt > 0) toast.show(S.streakEnded(streakUpdate.endedAt));
      if (streakMilestone(save.streak.current) && save.settings.reducedMotion !== 'on') { renderLoop.setTimeScale(0); window.setTimeout(() => renderLoop.setTimeScale(1), 70); }
      save.profile.xp += 100; save.profile.coins += 30; save.profile.coinsEarned += 30;
    }
    save.inProgress = null; if (completed.mode === 'daily') save.dailyInProgress = null; controlsHint.hidden = save.ui.runsFinished >= 3;
    if (save.ui.seenTips.includes('tutorialTipPending')) { save.ui.seenTips = save.ui.seenTips.filter((tip) => tip !== 'tutorialTipPending'); tutorialTipForGameOver = true; }
    const achievementResult = grantAchievements(save, { mode: completed.mode, score: completed.score, rescueUsed: completed.rescue.used, closeCall, rescuedLine: rescueClearWithinThree(runEvents), events: runEvents, friendBeaten: challengeBeaten }); save = achievementResult.save;
    const lastLevel = reward.levels[reward.levels.length - 1]; runReward = { xp: reward.xp, coins: reward.coins, progress: Math.max(0, save.profile.xp - totalXpForLevel(save.profile.level)), progressMax: xpToNext(save.profile.level), currentLevel: save.profile.level, level: lastLevel };
    runReward.coins += discoveryCoins;
    saveNow(save); if (lastLevel) toast.show(S.levelUp(lastLevel)); for (const item of reward.unlocked) toast.show(S.unlocked(item)); for (const achievement of achievementResult.unlocked) toast.show(S.achievementUnlock(S.achievementName(achievement.id), achievement.coins));
  }
  function updateOverlay(): void {
    const status = session.state.status; if (status === 'over' && gameOverAt >= 0 && renderElapsed - gameOverAt < 450) return; if (status === shownStatus) return; shownStatus = status;
    if (status === 'over') {
      finishRun();
      // spec-note: A counted Daily goes straight to the existing full result screen, whose Practice, Share, and Home actions satisfy the Daily game-over actions in design §13.3.
      if (countedDailyThisRun) { router.open('dailyResult'); return; }
      paused = false; const summary = summarizeRun(session.state, runEvents); const challengeMode = session.state.mode === 'classic' || session.state.mode === 'expert';
      const challengeText = (): void => { const flavor = summary.biggestGloop?.flavour ?? 1; const url = `${location.host}${import.meta.env.BASE_URL.replace(/\/$/, '')}/?beat=${session.state.score}&f=${flavourName(flavor as 1 | 2 | 3 | 4 | 5 | 6 | 7)}`; const text = buildChallengeText({ score: session.state.score, biggestPop: session.state.stats.biggestPop, bestCombo: session.state.bestCombo, flavour: flavor as 1 | 2 | 3 | 4 | 5 | 6 | 7 }, session.state.mode === 'expert' ? 'expert' : 'classic', url); void shareText(text, () => toast.show(S.copied)); };
      const weeklyId = WEEKLY_POOL[((save.weekly.weekIndex % WEEKLY_POOL.length) + WEEKLY_POOL.length) % WEEKLY_POOL.length]!; const weeklyTarget = WEEKLY_TARGETS[weeklyId];
      const nearAchievement = ACHIEVEMENTS.filter((def) => !save.achievements[def.id] && COUNTER_ACHIEVEMENTS.has(def.id)).map((def) => { const progress = achievementProgress(def.id, save); return { remaining: Math.max(0, progress.target - progress.current), target: progress.target, name: S.achievementName(def.id), unit: S.achievementUnit(def.id) }; }).filter((entry) => entry.remaining <= entry.target * 0.2).sort((a, b) => a.remaining - b.remaining)[0];
      const near = nearMissMessages(session.state, runBest, session.state.stats.biggestPop, session.state.linesCleared, { xpRemaining: save.profile.level < 50 ? totalXpForLevel(save.profile.level + 1) - save.profile.xp : undefined, level: save.profile.level + 1, levelCost: save.profile.level < 50 ? xpToNext(save.profile.level) : undefined, weeklyRemaining: Math.max(0, weeklyTarget - save.weekly.progress), weeklyTarget, achievement: nearAchievement });
      const noteLines = near.map((item) => item.kind === 'newBest' ? S.nearNewBest(item.amount) : item.kind === 'bestShort' ? S.nearBestShort(item.amount) : item.kind === 'piece' ? S.nearPiece(S.shapeName(item.shape ?? 'dot')) : item.kind === 'line' ? S.nearLine(item.lineKind ?? 'row', (item.index ?? 0) + 1) : item.kind === 'xp' ? S.nearXp(item.amount, item.level ?? 1) : item.kind === 'weekly' ? S.nearWeekly(item.amount) : item.kind === 'achievement' ? S.nearAchievement(item.amount, item.unit ?? 'more', item.name ?? '') : S.nearFallback(session.state.stats.biggestPop, session.state.linesCleared));
      const challengeNote = activeChallenge && challengeMode ? session.state.score > activeChallenge.score ? S.beatFriendBy(session.state.score - activeChallenge.score) : S.shortOfFriend(activeChallenge.score - session.state.score) : noteLines.join('\n'); const note = tutorialTipForGameOver ? `${challengeNote}${challengeNote ? '\n' : ''}${S.tutorialTip}` : challengeNote; tutorialTipForGameOver = false;
      const classicImage = (): void => { void import('../render/shareCard').then(({ renderShareCard }) => { const canvasCard = renderShareCard({ title: S.classic, date: '', score: session.state.score, combo: session.state.bestCombo, biggestPop: session.state.stats.biggestPop, lines: session.state.linesCleared, streak: 0, theme: save.equipped.theme as keyof typeof PALETTE.theme, board: session.state.board, biggestGloop: summary.biggestGloop ?? undefined }); canvasCard.toBlob((blob) => { if (blob) void shareImage(blob, `gloop-pop-classic-${session.state.score}.png`); }); }); };
      setAudioPaused(false);
      const endedBy = runEvents.find((event) => event.type === 'gameOver'); const gameOverTitle = session.state.mode === 'daily' ? endedBy?.type === 'gameOver' && endedBy.reason === 'traysDone' ? S.allTraysPlaced : S.dailyRunDone(session.state.daily?.dayNumber ?? 1) : S.noRoom;
      ui.showGameOver(() => restart(), () => { ui.hide(); router.open('home'); }, session.state.score, session.state.mode === 'zen' ? null : runBest, S.gameOverFallback(session.state.stats.biggestPop, session.state.linesCleared), runReward, summary, challengeMode ? challengeText : undefined, challengeMode ? classicImage : undefined, note, gameOverTitle, session.state.mode === 'daily' ? () => router.open('dailyResult') : undefined);
    } else if (status === 'rescueOffer') ui.showRescue(() => apply({ type: 'useRescue' }), () => apply({ type: 'declineRescue' }));
    else if (!paused) ui.hide();
  }
  function persist(immediate: boolean): void {
    if (router.current === 'play' && session.state.status !== 'over') {
      if (session.state.mode === 'daily') save.dailyInProgress = session.state; else save.inProgress = session.state;
    }
    const writeLater = (): void => saveNow(save);
    window.clearTimeout(saveTimer); if (immediate) writeLater(); else saveTimer = window.setTimeout(writeLater, 300);
  }
  function triggerSlowMo(reduced: boolean, afterHitStop = false): void {
    const now = performance.now(); if (!canStartSlowMo(lastSlowMoAt, now, reduced)) return; lastSlowMoAt = now;
    const startSlow = (): void => { renderLoop.setTimeScale(0.35); window.setTimeout(() => renderLoop.rampTimeScale(1, 200), 450); };
    if (afterHitStop) window.setTimeout(startSlow, 70); else startSlow();
  }
  function renderScreen(screen: 'home' | 'stats' | 'play' | 'collection' | 'achievements' | 'dailyResult' | 'settings' | 'howToPlay'): void {
    homeHost.replaceChildren(); ui.hide();
    if (screen === 'home') { homeHost.append(createHomeScreen(save, { play: start, dailyResult: () => router.open('dailyResult'), stats: () => router.open('stats'), collection: () => router.open('collection'), achievements: () => router.open('achievements'), settings: () => router.open('settings'), howToPlay: () => router.open('howToPlay'), debugXp: () => { const result = grantXp(save, 5000); save = result.save; saveNow(save); for (const level of result.levels) toast.show(S.levelUp(level)); for (const item of result.unlocked) toast.show(S.unlocked(item)); renderScreen('home'); } }, debug, activeChallenge ?? undefined)); }
    else if (screen === 'stats') { paused = false; homeHost.append(createStatsScreen(save, () => router.back())); }
    else if (screen === 'collection') { paused = false; homeHost.append(createCollectionScreen(save, () => router.back(), (next) => { save = next; syncCosmetics(); backgroundTheme = ''; saveNow(save); })); }
    else if (screen === 'achievements') { paused = false; homeHost.append(createAchievementsScreen(save, () => router.back())); }
    else if (screen === 'settings') { paused = false; homeHost.append(createSettingsScreen(save, { change: (key, value) => { save.settings[key] = value; if (key === 'sfx') setSfxEnabled(value); else if (key === 'music') setMusicEnabled(value); else if (key === 'cbPatterns') setColourBlindPatterns(value); saveNow(save); }, reduce: (value) => { save.settings.reducedMotion = value; saveNow(save); }, replay: () => { save.tutorialDone = false; save.ui.seenTips = save.ui.seenTips.filter((tip) => tip !== 'tutorialStep4Pending' && tip !== 'tutorialTipPending'); runBest = bestFor(save, 'classic'); session = createSession({ state: tutorialGame(1), best: runBest }); runEvents = []; runRecorded = false; countedDailyThisRun = false; runStartedAt = performance.now(); gameOverAt = -1; shownStatus = ''; shownScore = 0; tutorialActive = true; tutorialStep = 1; tutorialTouched = false; tutorialBubbleText = ''; tutorialBubbleUntil = -1; save.inProgress = session.state; if (!tutorialBubble.element.isConnected) uiRoot?.append(tutorialBubble.element); saveNow(save); router.open('play'); }, reset: () => { save = defaultSave(Date.now()); saveNow(save); window.location.reload(); }, back: () => router.back() })); }
    else if (screen === 'howToPlay') { paused = false; homeHost.append(createHowToPlayScreen(() => router.back())); }
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

function rescueClearWithinThree(events: readonly GameEvent[]): boolean {
  let rescueAt = -1; let placed = 0;
  for (const [index, event] of events.entries()) { if (event.type === 'rescued') { rescueAt = index; placed = 0; } else if (rescueAt >= 0 && event.type === 'placed') placed += 1; else if (rescueAt >= 0 && event.type === 'cleared' && placed > 0 && placed <= 3) return true; }
  return false;
}
function bestFor(save: SaveV1, mode: ModeId): number { return mode === 'expert' ? save.best.expert : mode === 'daily' ? save.daily.best : mode === 'zen' ? 0 : save.best.classic; }
const debugFrameBuckets = new Uint16Array(8); let debugFrameCursor = 0; let debugFrameCount = 0; let debugFrameSum = 0;
function drawDebug(context: CanvasRenderingContext2D, layout: Layout, dpr: number, dt: number, surface: ReturnType<typeof createCanvasSurface>): void {
  const buckets = debugFrameBuckets; const bin = Math.min(buckets.length - 1, Math.floor(dt / 2)); if (debugFrameCount === 120) { buckets[debugFrameCursor] = Math.max(0, buckets[debugFrameCursor]! - 1); debugFrameSum -= debugFrameLast[debugFrameCursor]!; } else debugFrameCount += 1;
  debugFrameLast[debugFrameCursor] = dt; buckets[bin] = buckets[bin]! + 1; debugFrameSum += dt; debugFrameCursor = (debugFrameCursor + 1) % 120;
  let accumulated = 0; let p95 = 16; for (let i = 0; i < buckets.length; i += 1) { accumulated += buckets[i]!; if (accumulated >= debugFrameCount * 0.95) { p95 = i * 2 + 1; break; } } const average = debugFrameSum / Math.max(1, debugFrameCount);
  // spec-note: `slow=1` feeds synthetic slow frames into the same sampler for repeatable adaptive-DPR QA.
  const forced = new URLSearchParams(window.location.search).get('slow') === '1'; if (forced) for (let i = 0; i < 120; i += 1) surface.reportFrame(25);
  context.save(); context.fillStyle = PALETTE.light.shadowDeep; context.fillRect(8, 8, 230, 94); context.fillStyle = PALETTE.ui.textPrimary; context.font = '700 12px Nunito, sans-serif'; context.fillText(`frame ${dt.toFixed(1)} ms · avg ${average.toFixed(1)} · p95 ${p95.toFixed(1)}`, 16, 28); context.fillText(`dpr ${dpr.toFixed(2)} · ${layout.width}×${layout.height}`, 16, 47); context.fillText(`120f history ${debugFrameCount} · ${forced ? 'slow test' : 'live'}`, 16, 66); let peak = 1; for (let i = 0; i < buckets.length; i += 1) peak = Math.max(peak, buckets[i]!); context.fillStyle = PALETTE.ui.gold; for (let i = 0; i < buckets.length; i += 1) { const height = 18 * buckets[i]! / peak; context.fillRect(16 + i * 26, 94 - height, 18, height); } context.restore();
}
const debugFrameLast = new Float32Array(120);
