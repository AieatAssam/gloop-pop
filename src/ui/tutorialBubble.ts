// SG §11.10: one short speech bubble for the scripted tutorial (Skip lives in the top bar).

export interface TutorialBubble { element: HTMLElement; setText(text: string): void; place(trayTop: number, targetX: number, boardTop?: number, boardBottom?: number): void; }
// spec-note: The bubble no longer has its own Skip button. It was hidden by CSS on every size, but it stayed in the DOM, so there were two Skip controls. The one Skip is the top-bar button (topBar.ts).
export function createTutorialBubble(): TutorialBubble {
  const root = document.createElement('div'); root.className = 'tutorial-layer';
  const bubble = document.createElement('div'); bubble.className = 'tutorial-bubble'; bubble.setAttribute('role', 'status');
  root.append(bubble);
  return { element: root, setText(text) { bubble.textContent = text; bubble.hidden = !text; }, place(trayTop, targetX, boardTop = 0, boardBottom = 0) {
    // spec-note: The bubble sits above the tray when the gap under the board is free. On short phones (360x640, 320x568) that gap is too small, and the bubble hid the bottom board row, where the tutorial piece goes. In that case it moves up over the score band, which holds no drop target. It never goes above the top bar.
    const height = bubble.offsetHeight; const below = trayTop - height - 12;
    const top = boardBottom <= 0 || below >= boardBottom + 4 ? Math.max(72, below) : Math.max(56, boardTop - height - 6);
    bubble.style.top = `${top}px`; bubble.style.left = `${targetX}px`;
  } };
}
