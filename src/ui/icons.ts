// SG §11.2: compact line icons for the play top bar.
export type IconName = 'menu' | 'pause' | 'play' | 'close' | 'sound' | 'lock' | 'moves' | 'shuffle' | 'pop' | 'flame' | 'coin';
export function iconMarkup(name: IconName): string {
  const paths: Record<IconName, string> = {
    menu: '<path d="M5 7h14M5 12h14M5 17h14"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    play: '<path d="m8 5 11 7-11 7z"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="3"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    sound: '<path d="M4 10v4h3l5 4V6l-5 4H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
    moves: '<path d="M5 13l2-5 3-2 3 2 1 5-2 3H7zM14 18l2-4 2-2 3 2-1 4-3 2z"/><path d="M6 11h3M8 8v3M17 17h3"/>',
    shuffle: '<path d="M3 7h3c5 0 7 10 12 10h3M17 14l4 3-4 3M3 17h3c2 0 3-2 4-4M14 7h4l3 3M17 4l4 3-4 3"/>',
    pop: '<path d="M12 3l1.5 5.5L19 6l-2.5 5.5L22 13l-5.5 1.5L19 20l-5.5-2.5L12 23l-1.5-5.5L5 20l2.5-5.5L2 13l5.5-1.5L5 6l5.5 2.5z"/><path d="M8 19c0-2 1.7-3 4-3s4 1 4 3M9 13h.01M15 13h.01"/>',
    flame: '<path d="M13 2c1 5-4 6-2 10 1-2 3-3 4-5 4 4 6 8 4 12-1.2 2.6-3.6 4-7 4s-6-1.7-7-4.5C3.5 12.9 8 8 13 2z"/><path d="M12 14c2 2 3 3.2 2 5a2.3 2.3 0 0 1-4 0c-.7-1.5.2-3 2-5z"/>',
    coin: '<circle cx="12" cy="12" r="9" fill="var(--ui-coin)"/><circle cx="12" cy="12" r="6" fill="none" stroke="var(--ui-coin-shade)" stroke-width="2"/>',
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g>${paths[name]}</g></svg>`;
}
