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
