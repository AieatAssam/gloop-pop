// SG §11.7 and §10: home cards and lettered candy logo, with design §16.4 labels.
import type { ModeId } from '../../core/types';
import type { SaveV1 } from '../../meta/saveSchema';
import { createMiniGloop } from '../../render/miniGloop';
import { dayKeyFromMs, dayNumber, flavourForDay } from '../../core/daily';
import type { Flavour } from '../../core/types';
import { S } from '../strings';

export interface HomeActions { play(mode: ModeId): void; stats(): void; collection(): void; achievements(): void; settings(): void; howToPlay(): void; debugXp(): void }
export function createHomeScreen(save: SaveV1, actions: HomeActions, debug = false): HTMLElement {
  const root = document.createElement('main'); root.className = 'screen-wrap'; const panel = document.createElement('section'); panel.className = 'panel home-panel';
  const header = document.createElement('header'); header.className = 'home-header'; const logo = createLogo(); header.append(logo, chip(S.level(save.profile.level)), chip(S.coins(save.profile.coins))); panel.append(header);
  panel.append(button(S.play, 'button button--primary home-play', () => actions.play('classic')));
  const grid = document.createElement('div'); grid.className = 'mode-grid';
  grid.append(modeCard(S.classic, S.classicDescription, 1, false, () => actions.play('classic')));
  const dayKey = dayKeyFromMs(Date.now()); const dailyFlavour = flavourForDay(dayKey);
  grid.append(modeCard(S.daily(dayNumber(dayKey)), S.dailyDescription, dailyFlavour, false, () => actions.play('daily')));
  grid.append(modeCard(S.zen, save.owned.modes.includes('zen') ? S.zenDescription : S.reachLevel(3), 5, !save.owned.modes.includes('zen'), () => { if (save.owned.modes.includes('zen')) actions.play('zen'); }));
  grid.append(modeCard(S.expert, save.owned.modes.includes('expert') ? S.expertDescription : S.reachLevel(8), 6, !save.owned.modes.includes('expert'), () => { if (save.owned.modes.includes('expert')) actions.play('expert'); })); panel.append(grid);
  const weekly = document.createElement('section'); weekly.className = 'weekly-card'; const weeklyTitle = document.createElement('strong'); weeklyTitle.textContent = S.weekly; const progress = document.createElement('span'); progress.textContent = S.weeklyProgress; const resets = document.createElement('small'); resets.textContent = S.weeklyResets; const reward = document.createElement('small'); reward.textContent = S.weeklyReward; weekly.append(weeklyTitle, progress, resets, reward); panel.append(weekly);
  const streak = document.createElement('p'); streak.className = 'home-streak'; streak.textContent = save.streak.current ? S.streakStatus(save.streak.current, save.streak.freezes) : S.streakStart; panel.append(streak);
  const footer = document.createElement('nav'); footer.className = 'home-links'; footer.append(button(S.collection, 'text-button', () => actions.collection()), button(S.achievements, 'text-button', () => actions.achievements()), button(S.stats, 'text-button', () => actions.stats())); const extra = document.createElement('div'); extra.className = 'home-links'; extra.append(button(S.settings, 'text-button', () => actions.settings()), button(S.howToPlay, 'text-button', () => actions.howToPlay())); panel.append(footer, extra);
  if (debug) panel.append(button(S.debugXp, 'button button--secondary', () => actions.debugXp())); root.append(panel); return root;
}
function createLogo(): HTMLElement {
  const logo = document.createElement('h1'); logo.className = 'gloop-logo'; const colours = ['cherry', 'orange', 'lemon', 'apple', 'blueberry', 'grape', 'bubblegum']; let index = 0;
  for (const character of S.logo) { const letter = document.createElement('span'); letter.textContent = character; if (character !== ' ') { letter.className = `logo-${colours[index % colours.length] ?? 'cherry'}`; index += 1; } logo.append(letter); }
  return logo;
}
function modeCard(title: string, description: string, flavour: Flavour, locked: boolean, action: () => void): HTMLElement {
  const card = document.createElement('button'); card.type = 'button'; card.className = `mode-card${locked ? ' is-locked' : ''}`; card.disabled = locked; const art = document.createElement('canvas'); art.width = 112; art.height = 112;
  const ctx = art.getContext('2d'); if (ctx) { const mini = createMiniGloop(flavour, title === S.zen ? 'sleep' : 'idle', title === S.expert); ctx.globalAlpha = locked ? 0.4 : 1; ctx.drawImage(mini, 0, 0); } card.append(art);
  const text = document.createElement('span'); text.className = 'mode-card-copy'; const heading = document.createElement('strong'); heading.textContent = title; const body = document.createElement('small'); body.textContent = description; text.append(heading, body); card.append(text); if (locked) { const lock = document.createElement('span'); lock.className = 'mode-lock'; lock.textContent = S.lock; card.append(lock); } card.addEventListener('click', action); return card;
}
function chip(label: string): HTMLElement { const value = document.createElement('span'); value.className = 'home-chip'; value.textContent = label; return value; }
function button(label: string, classes: string, action: () => void): HTMLButtonElement { const value = document.createElement('button'); value.type = 'button'; value.className = classes; value.textContent = label; value.addEventListener('click', action); return value; }
