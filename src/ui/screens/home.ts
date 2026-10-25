// SG §11.7 and §10: home cards and lettered candy logo, with design §16.4 labels.
import type { ModeId } from '../../core/types';
import type { SaveV1 } from '../../meta/saveSchema';
import { createMiniGloop } from '../../render/miniGloop';
import { dayKeyFromMs, dayNumber, flavourForDay } from '../../core/daily';
import type { Flavour } from '../../core/types';
import { S } from '../strings';
import { iconMarkup } from '../icons';
import { WEEKLY_POOL, weekIndexFromMs } from '../../core/weekly';
import { syncWeek, WEEKLY_TARGETS } from '../../meta/weeklyGoal';

export interface HomeActions { play(mode: ModeId): void; dailyResult?(): void; stats(): void; collection(): void; achievements(): void; settings(): void; howToPlay(): void; debugXp(): void }
export function createHomeScreen(save: SaveV1, actions: HomeActions, debug = false, challenge?: { score: number; flavour: Flavour }): HTMLElement {
  const root = document.createElement('main'); root.className = 'screen-wrap'; const panel = document.createElement('section'); panel.className = 'panel home-panel';
  const header = document.createElement('header'); header.className = 'home-header'; const logo = createLogo(); header.append(logo, chip(S.level(save.profile.level)), chip(S.coins(save.profile.coins))); panel.append(header);
  if (challenge) { const rival = button(S.rivalCard(['🍒','🍊','🍋','🍏','🫐','🍇','🍬'][challenge.flavour - 1] ?? '🍒', new Intl.NumberFormat('en-US').format(challenge.score)), 'button button--secondary rival-card', () => actions.play('classic')); panel.append(rival); }
  panel.append(button(S.play, 'button button--primary home-play', () => actions.play('classic')));
  const grid = document.createElement('div'); grid.className = 'mode-grid';
  grid.append(modeCard(S.classic, S.classicDescription, 1, false, () => actions.play('classic')));
  const dayKey = dayKeyFromMs(Date.now()); const dailyFlavour = flavourForDay(dayKey);
  const dailyRecord = save.daily.records[dayKey];
  const dailyStatus = dailyRecord ? S.dailyDone(dayNumber(dayKey), new Intl.NumberFormat('en-US').format(dailyRecord.score), countdown(Date.now())) : S.dailyDescription;
  grid.append(modeCard(S.daily(dayNumber(dayKey)), dailyStatus, dailyFlavour, false, () => { if (dailyRecord) actions.dailyResult?.(); else actions.play('daily'); }, dailyRecord ? undefined : S.fodToday(S.flavourName(dailyFlavour))));
  grid.append(modeCard(S.zen, save.owned.modes.includes('zen') ? S.zenDescription : S.reachLevel(3), 5, !save.owned.modes.includes('zen'), () => { if (save.owned.modes.includes('zen')) actions.play('zen'); }));
  grid.append(modeCard(S.expert, save.owned.modes.includes('expert') ? S.expertDescription : S.reachLevel(8), 6, !save.owned.modes.includes('expert'), () => { if (save.owned.modes.includes('expert')) actions.play('expert'); })); panel.append(grid);
  const weekIndex = weekIndexFromMs(Date.now()); const weeklySave = syncWeek(save, weekIndex); const goal = WEEKLY_POOL[((weekIndex % WEEKLY_POOL.length) + WEEKLY_POOL.length) % WEEKLY_POOL.length]!; const target = WEEKLY_TARGETS[goal];
  const weekly = document.createElement('section'); weekly.className = 'weekly-card'; const weeklyTitle = document.createElement('strong'); weeklyTitle.textContent = S.weeklyTitle(goal); const progress = document.createElement('span'); progress.textContent = `${new Intl.NumberFormat('en-US').format(weeklySave.weekly.progress)} / ${new Intl.NumberFormat('en-US').format(target)}`; const resets = document.createElement('small'); const remaining = weekMs(Date.now()); resets.textContent = remaining < 86_400_000 ? S.weeklyResetHours(Math.max(1, Math.ceil(remaining / 3_600_000))) : S.weeklyReset(Math.ceil(remaining / 86_400_000)); const reward = document.createElement('small'); reward.textContent = S.weeklyReward; weekly.append(weeklyTitle, progress, resets, reward); panel.append(weekly);
  const streak = document.createElement('p'); streak.className = 'home-streak'; streak.textContent = save.streak.current ? S.streakStatus(save.streak.current, save.streak.freezes) : S.streakStart; panel.append(streak);
  const strip = document.createElement('div'); strip.className = 'streak-strip'; const today = Date.now(); const weekday = new Date(today).getUTCDay(); const monday = Math.floor(today / 86_400_000) - ((weekday + 6) % 7);
  // Design §11: ✓ played, ❄️ frozen, empty circle for not yet, a dot for today; each day labelled with its initial.
  for (let i = 0; i < 7; i += 1) { const date = new Date((monday + i) * 86_400_000).toISOString().slice(0, 10); const day = document.createElement('span'); day.className = 'streak-day-wrap'; const mark = document.createElement('span'); mark.className = 'streak-day'; const played = !!save.daily.records[date]; mark.textContent = played ? '✓' : save.streak.frozenDays.includes(date) ? '❄️' : ''; if (played) mark.classList.add('is-played'); if (date === dayKey) mark.classList.add('is-today'); const initial = document.createElement('small'); initial.textContent = S.weekdayInitials[i] ?? ''; day.append(mark, initial); strip.append(day); } panel.append(strip);
  const footer = document.createElement('nav'); footer.className = 'home-links'; footer.append(button(S.collection, 'text-button', () => actions.collection()), button(S.achievements, 'text-button', () => actions.achievements()), button(S.stats, 'text-button', () => actions.stats())); const extra = document.createElement('div'); extra.className = 'home-links'; extra.append(button(S.settings, 'text-button', () => actions.settings()), button(S.howToPlay, 'text-button', () => actions.howToPlay())); panel.append(footer, extra);
  if (debug) panel.append(button(S.debugXp, 'button button--secondary', () => actions.debugXp())); root.append(panel); return root;
}
function createLogo(): HTMLElement {
  const logo = document.createElement('h1'); logo.className = 'gloop-logo'; const colours = ['cherry', 'orange', 'lemon', 'apple', 'blueberry', 'grape', 'bubblegum']; let index = 0;
  for (const character of S.logo) { const letter = document.createElement('span'); letter.textContent = character; if (character !== ' ') { letter.className = `logo-${colours[index % colours.length] ?? 'cherry'}`; index += 1; } logo.append(letter); }
  return logo;
}
function modeCard(title: string, description: string, flavour: Flavour, locked: boolean, action: () => void, extra?: string): HTMLElement {
  const card = document.createElement('button'); card.type = 'button'; card.className = `mode-card${locked ? ' is-locked' : ''}`; card.disabled = locked; const art = document.createElement('canvas'); art.width = 112; art.height = 112;
  const ctx = art.getContext('2d'); if (ctx) { const mini = createMiniGloop(flavour, title === S.zen ? 'sleep' : 'idle', title === S.expert); ctx.globalAlpha = locked ? 0.4 : 1; ctx.drawImage(mini, 0, 0); } card.append(art);
  const text = document.createElement('span'); text.className = 'mode-card-copy'; const heading = document.createElement('strong'); heading.textContent = title; const body = document.createElement('small'); body.textContent = description; text.append(heading, body); if (extra) { const note = document.createElement('small'); note.className = 'mode-card-note'; note.textContent = extra; text.append(note); } card.append(text); if (locked) { const lock = document.createElement('span'); lock.className = 'mode-lock'; lock.innerHTML = iconMarkup('lock'); card.append(lock); } card.addEventListener('click', action); return card;
}
function chip(label: string): HTMLElement { const value = document.createElement('span'); value.className = 'home-chip'; value.textContent = label; return value; }
function button(label: string, classes: string, action: () => void): HTMLButtonElement { const value = document.createElement('button'); value.type = 'button'; value.className = classes; value.textContent = label; value.addEventListener('click', action); return value; }
function countdown(ms: number): string { const seconds = Math.floor(((Math.floor(ms / 86_400_000) + 1) * 86_400_000 - ms) / 1000); return `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor(seconds / 60) % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
function weekMs(ms: number): number { return 604_800_000 - ((((Math.floor(ms / 86_400_000) + 3) % 7 + 7) % 7) * 86_400_000 + (ms % 86_400_000)); }
