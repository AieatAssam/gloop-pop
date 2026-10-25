// SG §20.3: compact modal card with pictured goals, moves and star thresholds.
import { levelParams, type LevelDef, type LevelGoal } from '../core/levels';
import { createMiniGloop } from '../render/miniGloop';
import { S, formatNumber } from './strings';
import { PALETTE } from '../render/palette';
import { drawCube } from '../render/cubes';
import { drawGloop } from '../render/gloopRenderer';
import { largestSquare } from '../core/gloops';
import { defaultSave } from '../meta/saveSchema';
import { BOOSTERS, buyBooster, type BoosterSelection } from '../meta/boosters';
import type { SaveV2 } from '../meta/saveSchema';
import { iconMarkup } from './icons';

export function createLevelCard(def: LevelDef, actions: { play(selection?: BoosterSelection, assist?: boolean): void; back(): void; bought?(name: string, save: SaveV2): void }, context: { save?: SaveV2; streak?: number; lossRun?: number } = {}): HTMLElement {
  let save = context.save ?? defaultSave(); const streak = context.streak ?? save.adventure.winStreak; const frontier = def.n === save.adventure.frontier;
  const selection: BoosterSelection = {}; let assist = false;
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
  const moves = document.createElement('div'); moves.className = 'adventure-moves-row'; const label = document.createElement('span'); label.textContent = S.moves; const count = document.createElement('strong'); const baseBonus = frontier ? Math.min(2, streak) : 0; count.textContent = moveCount(def.moves, baseBonus); moves.append(label, count);
  const thresholdLine = document.createElement('div'); thresholdLine.className = 'adventure-threshold-line';
  for (const [starCount, text] of [[2, S.starsTwo(def.s2)], [3, S.starsThree(def.s3)]] as const) { const row = document.createElement('div'); row.className = 'adventure-threshold-row'; const stars = document.createElement('span'); stars.className = 'adventure-threshold-stars'; stars.textContent = '★'.repeat(starCount); stars.setAttribute('aria-hidden', 'true'); const copy = document.createElement('small'); copy.textContent = text; row.append(stars, copy); thresholdLine.append(row); }
  body.append(moves, thresholdLine);
  if (frontier && streak > 0) {
    const row = document.createElement('div'); row.className = 'adventure-streak-row'; const pips = document.createElement('span'); pips.className = 'adventure-flame-pips'; pips.setAttribute('aria-hidden', 'true');
    for (let index = 0; index < 3; index += 1) { const pip = document.createElement('span'); pip.className = `adventure-flame-pip${index < Math.min(3, streak) ? ' is-earned' : ''}`; pip.innerHTML = iconMarkup('flame'); pips.append(pip); }
    const text = document.createElement('strong'); text.textContent = streak >= 3 ? S.winStreakShuffle(streak) : S.winStreakBonus(streak); row.append(pips, text);
    if (!save.ui.seenTips.includes('adventureStreakBonus')) { const caption = document.createElement('small'); caption.textContent = S.streakBonusCaption; row.append(caption); } body.append(row);
  }
  if ((context.lossRun ?? 0) >= 3) {
    const row = document.createElement('label'); row.className = 'adventure-assist-row'; const toggle = document.createElement('input'); toggle.type = 'checkbox'; toggle.addEventListener('change', () => { assist = toggle.checked; updateMoves(); });
    const copy = document.createElement('span'); const name = document.createElement('strong'); name.textContent = S.assist; const caption = document.createElement('small'); caption.textContent = S.assistCaption; copy.append(name, caption); row.append(toggle, copy); body.append(row);
  }
  const balance = document.createElement('div'); balance.className = 'adventure-coin-balance'; balance.textContent = S.coinBalance(save.profile.coins); body.append(balance);
  const boosterRow = document.createElement('div'); boosterRow.className = 'adventure-booster-row'; const purchaseTiles: { id: 'moves' | 'shuffle' | 'pop'; price: number; tile: HTMLButtonElement; buy: HTMLSpanElement }[] = [];
  for (const item of [{ id: 'moves', name: S.boosterMoves, description: S.boosterMovesDescription }, { id: 'shuffle', name: S.boosterShuffle, description: S.boosterShuffleDescription }, { id: 'pop', name: S.boosterPop, description: S.boosterPopDescription }] as const) {
    const price = BOOSTERS.find((booster) => booster.id === item.id)!.price;
    const tile = document.createElement('button'); tile.type = 'button'; tile.className = 'adventure-booster-tile'; const count = save.adventure.boosters[item.id];
    const icon = document.createElement('span'); icon.className = `adventure-booster-icon booster-icon-${item.id}`; icon.setAttribute('aria-hidden', 'true'); icon.innerHTML = iconMarkup(item.id);
    const label = document.createElement('strong'); label.textContent = item.name; const quantity = document.createElement('small'); quantity.className = 'adventure-booster-count'; quantity.textContent = S.boosterCount(count); tile.append(icon, label, quantity);
    const free = item.id === 'shuffle' && frontier && streak >= 3;
    if (free) { selection.shuffle = false; tile.classList.add('is-selected', 'is-locked'); const note = document.createElement('small'); note.textContent = S.boosterFree; tile.append(note); }
    else if (count > 0) {
      const select = (): void => { selection[item.id] = !selection[item.id]; tile.classList.toggle('is-selected', Boolean(selection[item.id])); updateMoves(); };
      tile.addEventListener('click', select);
      if (count >= 5) { const note = document.createElement('small'); note.textContent = S.boosterCap; tile.append(note); }
    } else if (count >= 5) { const note = document.createElement('small'); note.textContent = S.boosterCap; tile.append(note); }
    else {
      const buy = document.createElement('span'); buy.className = 'adventure-booster-buy';
      buy.textContent = save.profile.coins >= price ? S.boosterPrice(price) : S.boosterNeed(price - save.profile.coins); tile.disabled = save.profile.coins < price;
      purchaseTiles.push({ id: item.id, price, tile, buy }); tile.append(buy);
      tile.addEventListener('click', () => {
        if (save.adventure.boosters[item.id] > 0) { selection[item.id] = !selection[item.id]; tile.classList.toggle('is-selected', Boolean(selection[item.id])); updateMoves(); return; }
        const previousCoins = save.profile.coins; const bought = buyBooster(save, item.id); if (bought === save) return;
        save = bought; quantity.textContent = S.boosterCount(save.adventure.boosters[item.id]); selection[item.id] = true; tile.classList.add('is-selected'); updateMoves(); animateBalance(balance, previousCoins, save.profile.coins); actions.bought?.(item.name, save);
        for (const entry of purchaseTiles) {
          if (save.adventure.boosters[entry.id] > 0) { entry.tile.disabled = false; entry.buy.remove(); continue; }
          entry.tile.disabled = save.profile.coins < entry.price;
          entry.buy.textContent = save.profile.coins < entry.price ? S.boosterNeed(entry.price - save.profile.coins) : S.boosterPrice(entry.price);
        }
      });
    }
    const description = document.createElement('small'); description.className = 'adventure-booster-description'; description.textContent = item.description; tile.append(description); boosterRow.append(tile);
  }
  body.append(boosterRow); const captions = document.createElement('div'); captions.className = 'adventure-booster-captions'; const freeText = document.createElement('small'); freeText.textContent = S.boosterCaptionWin; const returnText = document.createElement('small'); returnText.textContent = S.boosterCaptionReturn; captions.append(freeText, returnText); body.append(captions);
  const actionsRow = document.createElement('div'); actionsRow.className = 'adventure-card-actions'; const play = makeButton(S.levelPlay, 'button button--primary', () => actions.play(selection, assist)); const back = makeButton(S.backToMap, 'text-button', () => actions.back()); actionsRow.append(play, back);
  panel.append(body, actionsRow); shade.append(panel); requestAnimationFrame(() => play.focus());
  const key = (event: KeyboardEvent): void => { event.stopPropagation(); if (event.key === 'Escape') { event.preventDefault(); actions.back(); } else if ((event.key === 'Enter' || event.key === ' ') && !(event.target instanceof Element && event.target.closest('button'))) { event.preventDefault(); actions.play(); } };
  shade.addEventListener('keydown', key); shade.tabIndex = -1; return shade;
  function updateMoves(): void { count.textContent = moveCount(def.moves, baseBonus + (selection.moves ? 3 : 0) + (assist ? 5 : 0)); }
}
function moveCount(moves: number, bonus: number): string { return bonus ? `${formatNumber(moves)} +${formatNumber(bonus)}` : formatNumber(moves); }
function animateBalance(element: HTMLElement, start: number, end: number): void {
  const began = performance.now(); const tick = (now: number): void => { const t = Math.min(1, (now - began) / 300); element.textContent = S.coinBalance(Math.round(start + (end - start) * t)); if (t < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
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
