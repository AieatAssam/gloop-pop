// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { CREDITS, creditLine } from '../../audio/credits';
import { createCreditsScreen } from './credits';

describe('Credits screen', () => {
  it('renders exactly the credit entries in their specified groups', () => {
    const screen = createCreditsScreen(vi.fn());
    const lines = [...screen.querySelectorAll('.credits-line')];
    expect(lines).toHaveLength(CREDITS.length);
    expect(lines.map((line) => line.textContent)).toEqual(CREDITS.map(creditLine));
    expect([...screen.querySelectorAll('.credits-group h2')].map((heading) => heading.textContent)).toEqual(['Music', 'Sound effects', 'Code and art']);
  });
  it('opens each linked credit safely in a new tab with its design aria label', () => {
    const screen = createCreditsScreen(vi.fn());
    const links = [...screen.querySelectorAll<HTMLAnchorElement>('.credits-line a')];
    const linkedCredits = CREDITS.filter((credit) => credit.url);
    expect(links).toHaveLength(linkedCredits.length);
    for (const [index, link] of links.entries()) {
      const credit = linkedCredits[index]!;
      expect(link.href).toBe(credit.url);
      expect(link.target).toBe('_blank');
      expect(link.rel).toBe('noopener noreferrer');
      expect(link.getAttribute('aria-label')).toBe(`Open ${credit.title} on ${credit.site}`);
    }
  });
});
