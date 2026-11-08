// Adult check (parental gate) shown before a link leaves the Android app, for Google Play's Families policy.
import { S } from './strings';

export interface AdultQuestion { a: number; b: number }

/** Two factors from 6 to 9, so the product is a two-digit number young children rarely know by heart. */
export function makeAdultQuestion(random: () => number): AdultQuestion {
  const pick = (): number => 6 + Math.min(3, Math.floor(random() * 4));
  return { a: pick(), b: pick() };
}

export function isAdultAnswer(question: AdultQuestion, input: string): boolean {
  return input.trim() !== '' && Number(input.trim()) === question.a * question.b;
}

/** Shows the check over `host`; `onPass` runs only after a correct answer. */
export function showAdultCheck(host: HTMLElement, onPass: () => void, random: () => number = Math.random): void {
  const overlay = document.createElement('div'); overlay.className = 'gloop-overlay is-visible';
  const panel = document.createElement('form'); panel.className = 'panel gloop-modal'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true');
  const heading = document.createElement('h1'); heading.textContent = S.adultCheckTitle;
  const prompt = document.createElement('p'); prompt.className = 'rescue-copy'; prompt.id = 'adult-check-question';
  const input = document.createElement('input'); input.type = 'text'; input.inputMode = 'numeric'; input.autocomplete = 'off'; input.maxLength = 3; input.className = 'adult-check-input'; input.setAttribute('aria-label', S.adultCheckAnswer); input.setAttribute('aria-describedby', prompt.id);
  const open = document.createElement('button'); open.type = 'submit'; open.className = 'button button--primary'; open.textContent = S.adultCheckOpen;
  const cancel = document.createElement('button'); cancel.type = 'button'; cancel.className = 'button button--secondary'; cancel.textContent = S.cancel;
  let question = makeAdultQuestion(random);
  const ask = (): void => { prompt.textContent = S.adultCheckQuestion(question.a, question.b); input.value = ''; input.focus(); };
  const close = (): void => overlay.remove();
  panel.addEventListener('submit', (event) => {
    event.preventDefault();
    if (isAdultAnswer(question, input.value)) { close(); onPass(); return; }
    question = makeAdultQuestion(random); ask(); prompt.textContent = `${S.adultCheckWrong} ${prompt.textContent}`;
  });
  cancel.addEventListener('click', close);
  panel.append(heading, prompt, input, open, cancel); overlay.append(panel); host.append(overlay); ask();
}
