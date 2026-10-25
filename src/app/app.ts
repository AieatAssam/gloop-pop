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
import { createSession } from './session';
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
import { addWeeklyProgress, claimWeeklyReward, weeklyGoalNearMiss } from '../meta/weeklyGoal';
import { weekIndexFromMs } from '../core/weekly';
import { dailyResult } from '../meta/dailyRecord';
import { createDailyResultScreen } from '../ui/screens/dailyResult';
import { buildDailyShareText } from '../core/shareText';
import { shareText } from '../platform/share';
import { shareImage } from '../platform/share';
import { buildChallengeText, flavourName, parseChallenge } from '../core/shareText';

export function bootApp(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('#game'); const uiRoot = document.querySelector<HTMLElement>('#ui');
  if (!canvas || !uiRoot) throw new Error('Missing game surface.');
  let save = loadSave(); const savedRun = save.inProgress ?? save.dailyInProgress;
  const skinMap: Record<string, SkinId> = { plain:'plain', googly:'googlyEyes', googlyEyes:'googlyEyes', freckles:'freckles', catears:'catEars', catEars:'catEars', glasses:'glasses', mustache:'mustache', bowtie:'bowtie', crown:'crown' };
  const syncCosmetics = (): void => setEquippedCosmetics({ theme: save.equipped.theme as keyof typeof PALETTE.theme, skin: skinMap[save.equipped.skin] ?? 'plain', popEffect: save.equipped.pop as PopEffectId });
  syncCosmetics();
  let session = createSession({ state: savedRun, best: bestFor(save, savedRun?.mode ?? 'classic'), mode: 'classic' });
  let runBest = session.best; let runStartedAt = performance.now(); let pauseStartedAt = 0; let runReward = { xp: 0, coins: 0, progress: 0, progressMax: xpToNext(save.profile.level), level: undefined as number | undefined };
  const router = createRouter('play'); const surface = createCanvasSurface(canvas); const background = createBackground(save.equipped.theme as keyof typeof PALETTE.theme); const view = createBoardView(); const director = createDirector();
  let backgroundTheme = save.equipped.theme; const ui = createGameUi(uiRoot); const toast = createToasts(uiRoot); const homeHost = document.createElement('div'); uiRoot.append(homeHost);
  let paused = false; let shownScore = 0; let shownStatus = ''; let runRecorded = false; let comboLostAt = -1; let layout: Layout = computeLayout(window.innerWidth, window.innerHeight); let renderElapsed = 0; let saveTimer = 0; let runEvents: GameEvent[] = []; let closeCall = false;
  const query = new URLSearchParams(window.location.search); const demoBoard = query.get('demo') === 'board'; const demoFaces = query.get('demo') === 'faces'; const demoBg = query.get('demo') === 'bg'; const demoThemes = query.get('demo') === 'themes'; const debug = query.get('debug') === '1';
  let activeChallenge = parseChallenge(window.location.search); let challengeBeaten = false;
  if (activeChallenge) { const clean = new URL(window.location.href); clean.searchParams.delete('beat'); clean.searchParams.delete('f'); history.replaceState(history.state, '', clean); }
  const requestedSkin = query.get('skin'); if (demoFaces && requestedSkin && skinMap[requestedSkin]) setEquippedCosmetics({ theme: save.equipped.theme as keyof typeof PALETTE.theme, skin: skinMap[requestedSkin], popEffect: save.equipped.pop as PopEffectId });
  const topBar = createTopBar(() => goHome(), () => showPause()); uiRoot.append(topBar.element);
  const pointer = createPointerInput(view, () => layout, () => session.state, (slot, row, col) => apply({ type: 'place', slot: slot as 0 | 1 | 2, row, col }));
  const keyboard = attachKeyboard(view, () => layout, () => session.state, (slot, row, col) => apply({ type: 'place', slot: slot as 0 | 1 | 2, row, col }), () => pointer.cancel(), () => { if (router.current === 'play') showPause(); else router.back(); });
  const resize = (): void => {
    surface.resize(window.innerWidth, window.innerHeight);
    const rootStyle = getComputedStyle(document.documentElement); const safeTop = Number.parseFloat(rootStyle.getPropertyValue('--safe-area-top')) || 0; const safeBottom = Number.parseFloat(rootStyle.getPropertyValue('--safe-area-bottom')) || 0;
    layout = computeLayout(surface.width, surface.height, { top: safeTop, bottom: safeBottom }); background.resize(surface.width, surface.height, layout);
    topBar.element.style.left = `${layout.column.x}px`; topBar.element.style.width = `${layout.column.width}px`; topBar.element.style.top = `${layout.topBar.y}px`; topBar.element.style.height = `${layout.topBar.height}px`;
  };
  resize(); window.addEventListener('resize', resize, { passive: true });
  canvas.addEventListener('pointerdown', (event) => { if (router.current !== 'play' || paused || session.state.status !== 'playing') return; canvas.setPointerCapture(event.pointerId); pointer.pointerDown(event.offsetX, event.offsetY, event.pointerType); });
  canvas.addEventListener('pointermove', (event) => { if (router.current === 'play' && session.state.status === 'playing') pointer.pointerMove(event.offsetX, event.offsetY, event.pointerType); });
  canvas.addEventListener('pointerup', (event) => { if (router.current !== 'play' || paused || session.state.status !== 'playing') return; pointer.pointerUp(event.offsetX, event.offsetY, event.pointerType); });
  canvas.addEventListener('pointercancel', () => pointer.cancel());
  document.addEventListener('visibilitychange', () => { if (document.hidden && router.current === 'play' && !paused && session.state.status === 'playing') showPause(); });
  window.addEventListener('keydown', (event) => { if (session.state.status === 'over' && router.current === 'play' && [' ', 'Enter', 'r', 'R'].includes(event.key)) { event.preventDefault(); restart(); } });
  onSaveVisibility(() => { window.clearTimeout(saveTimer); persist(true); });
  router.subscribe((screen) => renderScreen(screen)); renderScreen('play'); persist(true);
  const renderLoop = startRenderLoop((dtMs, elapsedMs) => {
    renderElapsed = elapsedMs;
    if (demoThemes) background.setTheme(THEME_KEYS[Math.floor(elapsedMs / 2400) % THEME_KEYS.length]!, elapsedMs);
    else if (backgroundTheme !== save.equipped.theme) { backgroundTheme = save.equipped.theme; background.setTheme(backgroundTheme as keyof typeof PALETTE.theme, elapsedMs); }
    const ctx = surface.context; ctx.setTransform(surface.dpr, 0, 0, surface.dpr, 0, 0); background.draw(ctx, elapsedMs, layout, session.state.stage);
    const today = dayKeyFromMs(Date.now()); const pill = save.daily.records[today] ? S.dailyPillDone : save.streak.current >= 2 && new Date().getUTCHours() >= 18 ? S.dailyKeepStreak(save.streak.current) : S.daily(dayNumber(today)); if (topBar.dailyPill.textContent !== pill) topBar.dailyPill.textContent = pill;
    const isPlay = router.current === 'play'; topBar.element.style.display = isPlay ? 'flex' : 'none';
    if (isPlay && !demoBg) {
      view.draw(ctx, layout, session.state, elapsedMs, paused ? undefined : pointer.drag ?? keyboard.drag(), demoBoard ? 'board' : demoFaces ? 'faces' : ''); director.draw(ctx, layout, elapsedMs);
      if (paused) { ctx.fillStyle = PALETTE.ui.scrim; ctx.fillRect(0, 0, layout.width, layout.height); }
      shownScore = drawHud(ctx, layout, session.state, session.best, elapsedMs, shownScore, comboLostAt, activeChallenge?.score);
      if (debug) drawDebug(ctx, layout, surface.dpr, dtMs);
    }
    updateOverlay();
    }, (elapsed) => surface.reportFrame(elapsed));

  function apply(action: Action): void {
    const filledBeforeResolve = action.type === 'place' ? session.state.board.filter((cell) => cell > 0).length + (PIECES[session.state.tray[action.slot]?.defId ?? -1]?.cells.length ?? 0) : 0;
    const scoreBefore = session.state.score; const events = session.dispatch(action); if (action.type === 'place' && filledBeforeResolve >= 52 && events.some((event) => event.type === 'cleared')) closeCall = true; runEvents.push(...events);
    if (activeChallenge && scoreBefore <= activeChallenge.score && session.state.score > activeChallenge.score) { challengeBeaten = true; toast.show(S.youBeatFriend); }
    const claimedBefore = save.weekly.claimed; save = addWeeklyProgress(save, session.state, events, weekIndexFromMs(Date.now())); save = claimWeeklyReward(save);
    if (!claimedBefore && save.weekly.claimed) toast.show(S.weeklyDone);
    for (const event of events) if (event.type === 'popped') save.achievements.bigPopCount = (save.achievements.bigPopCount ?? 0) + event.gloops.filter((gloop) => gloop.size >= 8).length;
    checkLiveAchievements(); director.receive(events, renderElapsed);
    for (const event of events) if (event.type === 'comboLost' && event.combo >= 2) comboLostAt = renderElapsed;
    paused = false; ui.hide(); persist(false);
    if (session.state.status === 'over') finishRun();
  }
  function start(mode: ModeId): void {
    const savedForMode = mode === 'daily' ? save.dailyInProgress : save.inProgress?.mode === mode ? save.inProgress : null;
    const resume = session.state.mode === mode && session.state.status === 'playing';
    if (!resume) { runBest = bestFor(save, mode); session = createSession({ state: savedForMode, best: runBest, mode }); runStartedAt = performance.now(); runRecorded = false; runEvents = []; closeCall = false; shownScore = 0; shownStatus = ''; comboLostAt = -1; }
    else if (pauseStartedAt > 0) { runStartedAt += performance.now() - pauseStartedAt; pauseStartedAt = 0; }
    paused = false; ui.hide(); router.open('play'); persist(false);
  }
  function restart(): void { if (challengeBeaten) { activeChallenge = null; challengeBeaten = false; } runBest = bestFor(save, session.state.mode); session = createSession({ best: runBest, mode: session.state.mode }); runStartedAt = performance.now(); runEvents = []; closeCall = false; pauseStartedAt = 0; shownScore = 0; shownStatus = ''; runRecorded = false; comboLostAt = -1; director.receive([], renderElapsed); paused = false; ui.hide(); pointer.cancel(); persist(false); }
  function showPause(): void {
    if (router.current !== 'play' || session.state.status !== 'playing') return;
    paused = true; if (pauseStartedAt === 0) pauseStartedAt = performance.now(); persist(true); const mode = session.state.mode; const label = mode === 'daily' ? S.giveUp : mode === 'zen' ? S.endRun : S.restart;
    ui.showPause(() => { if (pauseStartedAt > 0) runStartedAt += performance.now() - pauseStartedAt; pauseStartedAt = 0; paused = false; ui.hide(); }, () => {
      if (mode === 'daily') ui.showDailyGiveUpConfirm(() => { if (pauseStartedAt > 0) runStartedAt += performance.now() - pauseStartedAt; pauseStartedAt = 0; apply({ type: 'endRun' }); }, () => showPause());
      else if (mode === 'zen') { if (pauseStartedAt > 0) runStartedAt += performance.now() - pauseStartedAt; pauseStartedAt = 0; apply({ type: 'endRun' }); }
      else if (session.state.score > 0) ui.showRestartConfirm(() => restart(), () => showPause()); else restart();
    }, () => { paused = true; if (pauseStartedAt === 0) pauseStartedAt = performance.now(); ui.hide(); router.open('home'); persist(true); }, label);
  }
  function goHome(): void {
    if (router.current !== 'play') return;
    if (session.state.status === 'playing') { paused = true; if (pauseStartedAt === 0) pauseStartedAt = performance.now(); persist(true); }
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
      save = recordDaily(save, completed, todayKey, runEvents); const streakUpdate = updateStreak(save, todayKey); save = streakUpdate.save; save.daily.records[todayKey]!.freezeUsed = streakUpdate.freezeUsed;
      if (streakUpdate.freezeUsed > 0) toast.show(S.freezeSaved(save.streak.current)); else if (streakUpdate.endedAt > 0) toast.show(S.streakEnded(streakUpdate.endedAt));
      if (streakMilestone(save.streak.current) && save.settings.reducedMotion !== 'on') { renderLoop.setTimeScale(0); window.setTimeout(() => renderLoop.setTimeScale(1), 70); }
      save.profile.xp += 100; save.profile.coins += 30; save.profile.coinsEarned += 30;
    }
    save.inProgress = null; if (completed.mode === 'daily') save.dailyInProgress = null;
    const achievementResult = grantAchievements(save, { mode: completed.mode, score: completed.score, rescueUsed: completed.rescue.used, closeCall, rescuedLine: rescueClearWithinThree(runEvents), events: runEvents, friendBeaten: challengeBeaten }); save = achievementResult.save;
    const lastLevel = reward.levels[reward.levels.length - 1]; runReward = { xp: reward.xp, coins: reward.coins, progress: Math.max(0, save.profile.xp - totalXpForLevel(save.profile.level)), progressMax: xpToNext(save.profile.level), level: lastLevel };
    saveNow(save); if (lastLevel) toast.show(S.levelUp(lastLevel)); for (const item of reward.unlocked) toast.show(S.unlocked(item)); for (const achievement of achievementResult.unlocked) toast.show(S.achievementUnlock(S.achievementName(achievement.id), achievement.coins));
  }
  function updateOverlay(): void {
    const status = session.state.status; if (status === shownStatus) return; shownStatus = status;
    if (status === 'over') {
      finishRun();
      paused = false; const summary = summarizeRun(session.state, runEvents); const challengeMode = session.state.mode === 'classic' || session.state.mode === 'expert';
      const challengeText = (): void => { const flavor = summary.biggestGloop?.flavour ?? 1; const url = `${location.host}${import.meta.env.BASE_URL.replace(/\/$/, '')}/?beat=${session.state.score}&f=${flavourName(flavor as 1 | 2 | 3 | 4 | 5 | 6 | 7)}`; const text = buildChallengeText({ score: session.state.score, biggestPop: session.state.stats.biggestPop, bestCombo: session.state.bestCombo, flavour: flavor as 1 | 2 | 3 | 4 | 5 | 6 | 7 }, session.state.mode === 'expert' ? 'expert' : 'classic', url); void shareText(text, () => toast.show(S.copied)); };
      const weeklyNearMiss = weeklyGoalNearMiss(save); const note = activeChallenge && challengeMode ? session.state.score > activeChallenge.score ? S.beatFriendBy(session.state.score - activeChallenge.score) : S.shortOfFriend(activeChallenge.score - session.state.score) : weeklyNearMiss !== null ? S.weeklyShort(weeklyNearMiss) : undefined;
      const classicImage = (): void => { void import('../render/shareCard').then(({ renderShareCard }) => { const canvasCard = renderShareCard({ title: S.classic, date: '', score: session.state.score, combo: session.state.bestCombo, biggestPop: session.state.stats.biggestPop, lines: session.state.linesCleared, streak: 0, theme: save.equipped.theme as keyof typeof PALETTE.theme, board: session.state.board, biggestGloop: summary.biggestGloop ?? undefined }); canvasCard.toBlob((blob) => { if (blob) void shareImage(blob, `gloop-pop-classic-${session.state.score}.png`); }); }); };
      ui.showGameOver(() => restart(), () => { ui.hide(); router.open('home'); }, session.state.score, session.state.mode === 'zen' ? null : runBest, S.gameOverFallback(session.state.stats.biggestPop, session.state.linesCleared), runReward, summary, challengeMode ? challengeText : undefined, challengeMode ? classicImage : undefined, note);
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
  function renderScreen(screen: 'home' | 'stats' | 'play' | 'collection' | 'achievements' | 'dailyResult'): void {
    homeHost.replaceChildren(); ui.hide();
    if (screen === 'home') { homeHost.append(createHomeScreen(save, { play: start, dailyResult: () => router.open('dailyResult'), stats: () => router.open('stats'), collection: () => router.open('collection'), achievements: () => router.open('achievements'), settings: () => undefined, howToPlay: () => undefined, debugXp: () => { const result = grantXp(save, 5000); save = result.save; saveNow(save); for (const level of result.levels) toast.show(S.levelUp(level)); for (const item of result.unlocked) toast.show(S.unlocked(item)); renderScreen('home'); } }, debug, activeChallenge ?? undefined)); }
    else if (screen === 'stats') { paused = false; homeHost.append(createStatsScreen(save, () => router.back())); }
    else if (screen === 'collection') { paused = false; homeHost.append(createCollectionScreen(save, () => router.back(), (next) => { save = next; syncCosmetics(); backgroundTheme = ''; saveNow(save); })); }
    else if (screen === 'achievements') { paused = false; homeHost.append(createAchievementsScreen(save, () => router.back())); }
    else if (screen === 'dailyResult') {
      paused = false; const key = dayKeyFromMs(Date.now()); const result = dailyResult(save, key);
      if (!result) { router.open('home'); return; }
      const remaining = Math.floor(((Math.floor(Date.now() / 86_400_000) + 1) * 86_400_000 - Date.now()) / 1000); const clock = `${String(Math.floor(remaining / 3600)).padStart(2, '0')}:${String(Math.floor(remaining / 60) % 60).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
      homeHost.append(createDailyResultScreen(result, dayNumber(key), save.streak.current, result.freezeUsed, () => { const text = buildDailyShareText(dayNumber(key), flavourForDay(key), result, save.streak.current, `${location.host}${import.meta.env.BASE_URL.replace(/\/$/, '')}`); void shareText(text, () => toast.show(S.copied)); }, () => {
        void import('../render/shareCard').then(({ renderShareCard }) => { const canvas = renderShareCard({ title: S.dailyResult(dayNumber(key)), date: new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(Date.now()), score: result.score, combo: result.bestCombo, biggestPop: result.biggestPop, lines: result.lines, streak: save.streak.current, theme: save.equipped.theme as keyof typeof PALETTE.theme, daily: result }); canvas.toBlob((blob) => { if (blob) void shareImage(blob, `gloop-pop-daily-${dayNumber(key)}.png`); }); });
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
function drawDebug(context: CanvasRenderingContext2D, layout: Layout, dpr: number, dt: number): void {
  context.save(); context.fillStyle = PALETTE.light.shadowDeep; context.fillRect(8, 8, 170, 52); context.fillStyle = PALETTE.ui.textPrimary; context.font = '700 12px Nunito, sans-serif'; context.fillText(`frame ${dt.toFixed(1)} ms`, 16, 28); context.fillText(`dpr ${dpr.toFixed(2)} · ${layout.width}×${layout.height}`, 16, 47); context.restore();
}
