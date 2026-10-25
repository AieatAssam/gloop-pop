// SG §11.2: compact line icons for the play top bar.
export type IconName = 'menu' | 'pause' | 'play' | 'close';
export function iconMarkup(name: IconName): string {
  const paths: Record<IconName, string> = {
    menu: '<path d="M5 7h14M5 12h14M5 17h14"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    play: '<path d="m8 5 11 7-11 7z"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g>${paths[name]}</g></svg>`;
}
