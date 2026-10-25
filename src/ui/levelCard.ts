// SG §20.3: compact modal card with pictured goals, moves and star thresholds.
import { levelParams, type LevelDef, type LevelGoal } from '../core/levels';
import { createMiniGloop } from '../render/miniGloop';
import { S } from './strings';
import { PALETTE } from '../render/palette';
import { drawCube } from '../render/cubes';
import { drawGloop } from '../render/gloopRenderer';
import { largestSquare } from '../core/gloops';

export function createLevelCard(def: LevelDef, actions: { play(): void; back(): void }): HTMLElement {
  const params = levelParams(def.n); const shade = document.createElement('div'); shade.className = 'adventure-modal-shade';
  const panel = document.createElement('section'); panel.className = 'panel adventure-level-card'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true');
  const body = document.createElement('div'); body.className = 'adventure-card-body';
  const heading = document.createElement('h2'); heading.textContent = S.levelTitle(def.n); const chapter = document.createElement('small'); chapter.textContent = S.chapterNumber(params.chapter);
  const title = document.createElement('div'); title.className = 'adventure-card-title'; title.append(heading, chapter);
  const close = makeButton('×', 'adventure-card-close', () => actions.back()); close.setAttribute('aria-label', S.backToMap); title.append(close);
  if (params.band === 'hard') { const hard = document.createElement('span'); hard.className = 'adventure-hard-chip'; hard.textContent = S.hardLevel; title.append(hard); }
  const goals = document.createElement('div'); goals.className = 'adventure-card-goals';
  for (const goal of def.goals) goals.append(goalRow(goal, params.hardCubes > 0));
  const tip = S.adventureTip(def.n); if (tip) { const note = document.createElement('p'); note.className = 'adventure-tip'; note.textContent = tip; body.append(title, goals, note); } else body.append(title, goals);
  const moves = document.createElement('div'); moves.className = 'adventure-moves-row'; const label = document.createElement('span'); label.textContent = S.moves; const count = document.createElement('strong'); count.textContent = new Intl.NumberFormat('en-US').format(def.moves); moves.append(label, count);
  const thresholdLine = document.createElement('div'); thresholdLine.className = 'adventure-threshold-line';
  for (const [starCount, text] of [[2, S.starsTwo(def.s2)], [3, S.starsThree(def.s3)]] as const) { const row = document.createElement('div'); row.className = 'adventure-threshold-row'; const stars = document.createElement('span'); stars.className = 'adventure-threshold-stars'; stars.textContent = '★'.repeat(starCount); stars.setAttribute('aria-hidden', 'true'); const copy = document.createElement('small'); copy.textContent = text; row.append(stars, copy); thresholdLine.append(row); }
  body.append(moves, thresholdLine);
  const actionsRow = document.createElement('div'); actionsRow.className = 'adventure-card-actions'; const play = makeButton(S.levelPlay, 'button button--primary', () => actions.play()); const back = makeButton(S.backToMap, 'text-button', () => actions.back()); actionsRow.append(play, back);
  panel.append(body, actionsRow); shade.append(panel); requestAnimationFrame(() => play.focus());
  const key = (event: KeyboardEvent): void => { event.stopPropagation(); if (event.key === 'Escape') { event.preventDefault(); actions.back(); } else if ((event.key === 'Enter' || event.key === ' ') && !(event.target instanceof Element && event.target.closest('button'))) { event.preventDefault(); actions.play(); } };
  shade.addEventListener('keydown', key); shade.tabIndex = -1; return shade;
}
function goalRow(goal: LevelGoal, hasHardCubes: boolean): HTMLElement {
  const row = document.createElement('div'); row.className = 'adventure-goal-row'; const art = document.createElement('canvas'); art.width = 48; art.height = 48; art.setAttribute('aria-hidden', 'true');
  if (goal.kind === 'F' && goal.flavour) { const ctx = art.getContext('2d'); if (ctx) ctx.drawImage(createMiniGloop(goal.flavour, 'idle'), 0, 0, 48, 48); }
  else { const ctx = art.getContext('2d'); if (ctx) {
    if (goal.kind === 'B') { const cells = [0, 8, 16]; drawGloop(ctx, { flavour: 1, cells, bfs: cells, largestSquare: largestSquare(cells) }, 12, 7, 7, 0, 'happy'); }
    else if (goal.kind === 'C') drawCube(ctx, hasHardCubes ? 9 : 8, 40, 4, 4);
    else { ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.strokeStyle = PALETTE.ui.gold; ctx.beginPath(); if (goal.kind === 'L') { ctx.moveTo(9, 16); ctx.lineTo(39, 16); ctx.moveTo(9, 32); ctx.lineTo(39, 32); } else if (goal.kind === 'S') { for (let i = 0; i < 10; i++) { const angle = -Math.PI / 2 + i * Math.PI / 5; const radius = i % 2 ? 9 : 18; const x = 24 + Math.cos(angle) * radius; const y = 24 + Math.sin(angle) * radius; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.closePath(); } else if (goal.kind === 'M') { ctx.moveTo(10, 12); ctx.lineTo(38, 36); ctx.moveTo(38, 12); ctx.lineTo(10, 36); } ctx.stroke(); }
  } }
  const text = document.createElement('span'); text.textContent = S.adventureGoalText(goal.kind, goal.target, goal.flavour ? S.flavourName(goal.flavour).toLowerCase() : undefined);
  row.append(art, text); return row;
}
function makeButton(label: string, cls: string, action: () => void): HTMLButtonElement { const element = document.createElement('button'); element.type = 'button'; element.className = cls; element.textContent = label; element.addEventListener('click', action); return element; }
