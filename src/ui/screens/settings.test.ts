// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { defaultSave } from '../../meta/saveSchema';
import { createSettingsScreen } from './settings';

describe('settings volume sliders', () => {
  it('uses 10 point native controls, disables muted buses, and reports saved values', () => {
    const volume = vi.fn(); const screen = createSettingsScreen(defaultSave(), { change: vi.fn(), volume, reduce: vi.fn(), replay: vi.fn(), credits: vi.fn(), reset: vi.fn(), back: vi.fn() });
    const sliders = [...screen.querySelectorAll<HTMLInputElement>('input[type=range]')];
    expect(sliders).toHaveLength(2);
    expect(sliders.map((input) => [input.min, input.max, input.step, input.value, input.disabled])).toEqual([['0','100','10','100',false], ['0','100','10','100',false]]);
    sliders[0]!.value = '70'; sliders[0]!.dispatchEvent(new Event('input', { bubbles: true })); sliders[0]!.dispatchEvent(new Event('change', { bubbles: true }));
    expect(sliders[0]!.getAttribute('aria-valuetext')).toBe('70%');
    expect(volume).toHaveBeenLastCalledWith('sfxVolume', 0.7, true);
  });
  it('disables a slider when its switch is turned off and exposes Credits', () => {
    const screen = createSettingsScreen(defaultSave(), { change: vi.fn(), volume: vi.fn(), reduce: vi.fn(), replay: vi.fn(), credits: vi.fn(), reset: vi.fn(), back: vi.fn() });
    const sfxSwitch = screen.querySelector<HTMLButtonElement>('[aria-label="Sound effects"]')!;
    sfxSwitch.click();
    expect(screen.querySelector<HTMLInputElement>('[data-volume="sfxVolume"]')!.disabled).toBe(true);
    expect([...screen.querySelectorAll('button')].some((button) => button.textContent === 'Credits')).toBe(true);
  });
});
