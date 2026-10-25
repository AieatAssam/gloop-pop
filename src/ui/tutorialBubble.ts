// SG §11.10: one short speech bubble and skip control for the scripted tutorial.
import { S } from './strings';

export interface TutorialBubble { element: HTMLElement; setText(text: string): void; place(trayTop: number, targetX: number): void; }
export function createTutorialBubble(onSkip: () => void): TutorialBubble {
  const root = document.createElement('div'); root.className = 'tutorial-layer';
  const bubble = document.createElement('div'); bubble.className = 'tutorial-bubble'; bubble.setAttribute('role', 'status');
  const skip = document.createElement('button'); skip.type = 'button'; skip.className = 'button button--secondary tutorial-skip'; skip.textContent = S.tutorialSkip; skip.setAttribute('aria-label', S.tutorialSkip); skip.addEventListener('click', onSkip);
  root.append(bubble, skip);
  return { element: root, setText(text) { bubble.textContent = text; bubble.hidden = !text; }, place(trayTop, targetX) { bubble.style.top = `${Math.max(72, trayTop - bubble.offsetHeight - 12)}px`; bubble.style.left = `${targetX}px`; } };
}
