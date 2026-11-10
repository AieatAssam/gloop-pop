// SG §11.10: one short speech bubble and skip control for the scripted tutorial.
import { S } from './strings';

export interface TutorialBubble { element: HTMLElement; setText(text: string): void; place(trayTop: number, targetX: number, boardTop?: number, boardBottom?: number): void; }
export function createTutorialBubble(onSkip: () => void): TutorialBubble {
  const root = document.createElement('div'); root.className = 'tutorial-layer';
  const bubble = document.createElement('div'); bubble.className = 'tutorial-bubble'; bubble.setAttribute('role', 'status');
  const skip = document.createElement('button'); skip.type = 'button'; skip.className = 'button button--secondary tutorial-skip'; skip.textContent = S.tutorialSkip; skip.setAttribute('aria-label', S.tutorialSkip); skip.addEventListener('click', onSkip);
  root.append(bubble, skip);
  return { element: root, setText(text) { bubble.textContent = text; bubble.hidden = !text; }, place(trayTop, targetX, boardTop = 0, boardBottom = 0) {
    // spec-note: The bubble sits above the tray when the gap under the board is free. On short phones (360x640, 320x568) that gap is too small, and the bubble hid the bottom board row, where the tutorial piece goes. In that case it moves up over the score band, which holds no drop target. It never goes above the top bar.
    const height = bubble.offsetHeight; const below = trayTop - height - 12;
    const top = boardBottom <= 0 || below >= boardBottom + 4 ? Math.max(72, below) : Math.max(56, boardTop - height - 6);
    bubble.style.top = `${top}px`; bubble.style.left = `${targetX}px`;
  } };
}
