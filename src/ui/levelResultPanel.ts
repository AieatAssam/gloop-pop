// SG §20.5: result panels keep the board visible and give immediate retry or progression.
import type { GameState } from '../core/types';
import { S } from './strings';

export function createLevelResultPanel(state: GameState, reward: { xp: number; coins: number }, actions: { next(): void; replay(): void; map(): void }, nearLines: string[] = []): HTMLElement {
  const adventure = state.adventure; if (!adventure?.result) throw new Error('Adventure result is required');
  const won = adventure.result.won; const panel = document.createElement('section'); panel.className = 'panel adventure-result-panel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true');
  const title = document.createElement('h2'); title.textContent = won ? S.levelComplete(adventure.level) : adventure.result.reason === 'moves' ? S.outOfMoves : adventure.result.reason === 'stuck' ? S.noRoom : S.levelEnded(adventure.level); panel.append(title);
  if (won) {
    const stars = document.createElement('div'); stars.className = 'adventure-result-stars'; stars.setAttribute('aria-label', S.resultStarsAria(adventure.result.stars));
    for (let index = 0; index < 3; index += 1) { const slot = document.createElement('span'); slot.className = `adventure-star-slot${index === 1 ? ' is-centre' : ''}`; slot.textContent = '☆'; if (index < adventure.result.stars) { const fill = document.createElement('span'); fill.className = 'adventure-star-fill'; fill.textContent = '★'; fill.style.animationDelay = `${150 + index * 250}ms`; slot.append(fill); } stars.append(slot); } panel.append(stars);
    if (adventure.result.stars === 3) { const confetti = document.createElement('div'); confetti.className = 'adventure-confetti'; confetti.setAttribute('aria-hidden', 'true'); for (let index = 0; index < 40; index += 1) { const piece = document.createElement('span'); piece.style.left = `${(index * 37) % 100}%`; piece.style.animationDelay = `${(index % 10) * 45}ms`; piece.style.setProperty('--confetti-drift', `${(index % 2 ? 1 : -1) * (12 + index % 18)}px`); confetti.append(piece); } panel.append(confetti); }
    const line = document.createElement('p'); line.textContent = S.wonMoves(adventure.result.movesLeft); panel.append(line);
    if (adventure.result.stars < 3) { const hint = document.createElement('small'); hint.textContent = S.winNextStar(adventure.result.stars === 1 ? adventure.s2 : adventure.s3, adventure.result.stars + 1); panel.append(hint); }
    if (adventure.bonusMoves > 0) { const bonus = document.createElement('small'); bonus.textContent = S.bonusStarsCaption(adventure.bonusMoves); panel.append(bonus); }
  } else {
    for (const goal of adventure.goals) { const chip = document.createElement('p'); chip.className = 'adventure-result-goal'; const goalText = S.adventureGoalText(goal.kind, goal.target, goal.flavour ? S.flavourName(goal.flavour).toLowerCase() : undefined); chip.setAttribute('aria-label', S.goalAria(goalText, goal.progress, goal.target)); chip.textContent = `${S.goalProgress(goal.progress, goal.target)} · ${goalText}`; panel.append(chip); }
    for (const text of nearLines.slice(0, 2)) { const near = document.createElement('p'); near.className = 'adventure-result-near'; near.textContent = text; panel.append(near); }
  }
  const rewards = document.createElement('p'); rewards.className = 'adventure-result-rewards'; rewards.textContent = won ? S.levelReward(reward.xp, reward.coins) : S.levelLossReward; panel.append(rewards);
  if (won) {
    const rewardWrap = document.createElement('div'); rewardWrap.className = 'adventure-xp-track'; const rewardFill = document.createElement('span'); rewardFill.style.width = '0%'; rewardWrap.append(rewardFill); requestAnimationFrame(() => { rewardFill.style.width = `${Math.min(100, reward.xp)}%`; });
    const rewardLabel = panel.querySelector('.adventure-result-rewards'); rewardLabel?.after(rewardWrap);
    panel.append(button(S.nextLevel, 'button button--primary', () => actions.next()), button(S.replayLevel, 'button button--secondary', () => actions.replay()));
  }
  else panel.append(button(S.tryAgain, 'button button--primary', () => actions.replay()));
  panel.append(button(S.map, 'text-button', () => actions.map())); queueMicrotask(() => panel.querySelector('button')?.focus()); return panel;
}
function button(text: string, cls: string, action: () => void): HTMLButtonElement { const element = document.createElement('button'); element.type = 'button'; element.className = cls; element.textContent = text; element.addEventListener('click', action); return element; }
