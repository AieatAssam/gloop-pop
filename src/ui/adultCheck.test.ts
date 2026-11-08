// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { isAdultAnswer, makeAdultQuestion, showAdultCheck } from './adultCheck';

describe('adult check', () => {
  it('asks two factors from 6 to 9', () => {
    expect(makeAdultQuestion(() => 0)).toEqual({ a: 6, b: 6 });
    expect(makeAdultQuestion(() => 0.999)).toEqual({ a: 9, b: 9 });
  });
  it('accepts only the product', () => {
    const q = { a: 7, b: 8 };
    expect(isAdultAnswer(q, ' 56 ')).toBe(true);
    expect(isAdultAnswer(q, '54')).toBe(false);
    expect(isAdultAnswer(q, '')).toBe(false);
  });
  it('opens the link only after a correct answer, and Cancel never opens it', () => {
    const host = document.createElement('div'); let opened = 0;
    showAdultCheck(host, () => { opened += 1; }, () => 0.3); // 7 × 7
    const form = host.querySelector('form')!; const input = host.querySelector('input')!;
    input.value = '40'; form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(opened).toBe(0);
    input.value = '49'; form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(opened).toBe(1); expect(host.querySelector('form')).toBeNull();
    showAdultCheck(host, () => { opened += 1; }, () => 0.3);
    (host.querySelectorAll('button')[1] as HTMLButtonElement).click();
    expect(opened).toBe(1); expect(host.querySelector('form')).toBeNull();
  });
});
