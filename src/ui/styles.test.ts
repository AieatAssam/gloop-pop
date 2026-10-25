import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const styles = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');

describe('M12 layout styles', () => {
  it('keeps the Claim button inside the mission side column', () => {
    expect(styles).toMatch(/\.mission-side \.mission-claim \{[^}]*min-height: 40px;[^}]*padding: 0 12px;[^}]*font: 800 18px\/1 "Baloo 2", sans-serif;/);
  });
  it('reserves the toast lane above the Adventure result panel', () => {
    expect(styles).toContain('.adventure-result-shade { padding-top: calc(var(--safe-area-top) + 96px); }');
    expect(styles).toContain('.adventure-result-shade .adventure-result-panel { max-height: 100%; }');
  });
});

describe('M13 Adventure map styles', () => {
  it('reserves a fixed footer, fixes chapter card height and truncates each copy line', () => {
    expect(styles).toContain('inset: calc(var(--safe-area-top) + 64px) 0 calc(var(--safe-area-bottom) + 88px)');
    expect(styles).toContain('height: calc(88px + var(--safe-area-bottom))');
    expect(styles).toContain('height: calc(84px + var(--safe-area-bottom)) !important');
    expect(styles).toContain('box-sizing: border-box; display: flex; align-items: center; gap: 12px;');
    expect(styles).toMatch(/\.adventure-chapter-card \{[^}]*height: 112px;/);
    expect(styles).toMatch(/\.adventure-footer \{[^}]*height: 52px; min-height: 52px;/);
    expect(styles).toContain('white-space: nowrap; text-overflow: ellipsis;');
    expect(styles).not.toContain('var(--node-y) + 164px');
    expect(styles).not.toContain('padding: 0 0 104px');
  });
});

describe('M14.4 clarity styles', () => {
  it('moves toasts to the bottom over Adventure result and start cards', () => {
    expect(styles).toMatch(/#ui:has\([^)]*adventure-result-shade[^)]*\) \.gloop-toast/);
    expect(styles).toMatch(/#ui:has\([^)]*adventure-modal-shade[^)]*\) \.gloop-toast/);
  });
});
