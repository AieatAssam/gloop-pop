// SG §11.13: credits are rendered from the checked source metadata.
import { CREDITS, creditAriaLabel, creditLine, type CreditGroup } from '../../audio/credits';
import { S } from '../strings';

const GROUPS: readonly CreditGroup[] = ['Music', 'Sound effects', 'Code and art'];

export function createCreditsScreen(back: () => void): HTMLElement {
  const root = document.createElement('main'); root.className = 'screen-wrap';
  const panel = document.createElement('section'); panel.className = 'panel full-screen-panel credits-panel';
  const header = document.createElement('header'); header.className = 'screen-header';
  const backButton = document.createElement('button'); backButton.type = 'button'; backButton.className = 'button button--secondary screen-back'; backButton.textContent = S.back; backButton.addEventListener('click', back);
  const title = document.createElement('h1'); title.textContent = S.credits; header.append(backButton, title);
  const content = document.createElement('div'); content.className = 'credits-content';
  const intro = document.createElement('p'); intro.className = 'credits-intro'; intro.textContent = S.creditsIntro; content.append(intro);
  for (const group of GROUPS) {
    const entries = CREDITS.filter((credit) => credit.group === group);
    if (!entries.length) continue;
    const section = document.createElement('section'); section.className = 'credits-group';
    const heading = document.createElement('h2'); heading.textContent = group; section.append(heading);
    for (const credit of entries) {
      const line = document.createElement('p'); line.className = 'credits-line';
      if (credit.url) {
        const prefix = creditLine(credit).slice(0, -credit.site.length);
        line.append(document.createTextNode(prefix));
        const link = document.createElement('a'); link.href = credit.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.setAttribute('aria-label', creditAriaLabel(credit)); link.textContent = credit.site; line.append(link);
      } else line.textContent = creditLine(credit);
      section.append(line);
    }
    content.append(section);
  }
  const note = document.createElement('p'); note.className = 'credits-note'; note.textContent = S.creditsNote; content.append(note);
  panel.append(header, content); root.append(panel); return root;
}
