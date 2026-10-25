// M7.2 and SG §11.14: settings controls mirror design §16.4 and persist through app callbacks.
import type { SaveV2 } from '../../meta/saveSchema';
import { S } from '../strings';

export interface SettingsActions {
  change(key: 'sfx' | 'music' | 'haptics' | 'cbPatterns', value: boolean): void;
  volume(key: 'sfxVolume' | 'musicVolume', value: number, commit: boolean): void;
  reduce(value: 'system' | 'on' | 'off'): void;
  replay(): void;
  credits(): void;
  reset(): void;
  back(): void;
}
export function createSettingsScreen(save: SaveV2, actions: SettingsActions): HTMLElement {
  const root = document.createElement('main'); root.className = 'screen-wrap'; const panel = document.createElement('section'); panel.className = 'panel full-screen-panel';
  panel.append(header(S.settings, () => actions.back())); const list = document.createElement('div'); list.className = 'settings-list';
  const sfxToggle = toggleRow(S.settingSfx, save.settings.sfx, (value) => actions.change('sfx', value));
  const musicToggle = toggleRow(S.settingMusic, save.settings.music, (value) => actions.change('music', value));
  list.append(sfxToggle, volumeRow(S.settingSfxVolume, save.settings.sfxVolume, !save.settings.sfx, 'sfxVolume', (key, value, commit) => actions.volume(key, value, commit)), musicToggle,
    volumeRow(S.settingMusicVolume, save.settings.musicVolume, !save.settings.music, 'musicVolume', (key, value, commit) => actions.volume(key, value, commit)),
    toggleRow(S.settingVibration, save.settings.haptics, (value) => actions.change('haptics', value)),
    selectRow(S.settingReduceMotion, [[S.settingMatchDevice, 'system'], [S.settingOn, 'on'], [S.settingOff, 'off']], save.settings.reducedMotion, (value) => actions.reduce(value as 'system' | 'on' | 'off')),
    toggleRow(S.settingPatterns, save.settings.cbPatterns, (value) => actions.change('cbPatterns', value)));
  // Keep the native slider enabled state in sync immediately when its toggle changes.
  sfxToggle.querySelector<HTMLButtonElement>('.settings-toggle')?.addEventListener('click', (event) => syncDisabled(event.currentTarget as HTMLButtonElement, 'sfxVolume'));
  musicToggle.querySelector<HTMLButtonElement>('.settings-toggle')?.addEventListener('click', (event) => syncDisabled(event.currentTarget as HTMLButtonElement, 'musicVolume'));
  const buttons = document.createElement('div'); buttons.className = 'settings-actions'; buttons.append(button(S.showTutorial, 'button button--secondary', () => actions.replay()), button(S.credits, 'button button--secondary', () => actions.credits()), button(S.resetProgress, 'button button--secondary', () => confirmReset(panel, () => actions.reset())));
  panel.append(list, buttons); root.append(panel); return root;
  function syncDisabled(control: HTMLButtonElement, key: 'sfxVolume' | 'musicVolume'): void { const slider = panel.querySelector<HTMLInputElement>(`input[data-volume="${key}"]`); if (slider) slider.disabled = control.getAttribute('aria-checked') !== 'true'; }
}
function header(title: string, back: () => void): HTMLElement { const row = document.createElement('header'); row.className = 'screen-header'; const control = document.createElement('button'); control.type = 'button'; control.className = 'button button--secondary screen-back'; control.textContent = S.back; control.addEventListener('click', back); const heading = document.createElement('h1'); heading.textContent = title; row.append(control, heading); return row; }
function toggleRow(label: string, checked: boolean, change: (value: boolean) => void): HTMLElement { const row = document.createElement('label'); row.className = 'settings-row'; const text = document.createElement('span'); text.textContent = label; const control = document.createElement('button'); control.type = 'button'; control.className = 'settings-toggle'; control.setAttribute('role', 'switch'); control.setAttribute('aria-checked', String(checked)); control.setAttribute('aria-label', label); control.addEventListener('click', () => { const next = control.getAttribute('aria-checked') !== 'true'; control.setAttribute('aria-checked', String(next)); change(next); }); row.append(text, control); return row; }
function volumeRow(label: string, value: number, disabled: boolean, key: 'sfxVolume' | 'musicVolume', change: SettingsActions['volume']): HTMLElement {
  const row = document.createElement('div'); row.className = 'settings-row volume-row'; const text = document.createElement('label'); text.textContent = label;
  const slider = document.createElement('input'); slider.type = 'range'; slider.min = '0'; slider.max = '100'; slider.step = '10'; slider.value = String(Math.round(value * 100)); slider.disabled = disabled; slider.dataset.volume = key; slider.setAttribute('aria-label', label); slider.setAttribute('aria-valuetext', S.volumeValue(Number(slider.value)));
  slider.style.setProperty('--volume-fill', `${slider.value}%`);
  const output = document.createElement('output'); output.className = 'volume-value'; output.textContent = S.volumeValue(Number(slider.value)); let lastApplied = -Infinity; let timer = 0;
  slider.addEventListener('input', () => { const percent = Number(slider.value); slider.style.setProperty('--volume-fill', `${percent}%`); output.textContent = S.volumeValue(percent); slider.setAttribute('aria-valuetext', S.volumeValue(percent)); const now = performance.now(); if (now - lastApplied >= 50) { lastApplied = now; change(key, percent / 100, false); } else { window.clearTimeout(timer); timer = window.setTimeout(() => { lastApplied = performance.now(); change(key, Number(slider.value) / 100, false); }, 50 - (now - lastApplied)); } });
  slider.addEventListener('change', () => { window.clearTimeout(timer); const percent = Number(slider.value); change(key, percent / 100, true); }); row.append(text, slider, output); return row;
}
function selectRow(label: string, options: readonly [string, string][], value: string, change: (value: string) => void): HTMLElement { const row = document.createElement('label'); row.className = 'settings-row'; const text = document.createElement('span'); text.textContent = label; const select = document.createElement('select'); select.setAttribute('aria-label', label); for (const [name, id] of options) { const option = document.createElement('option'); option.value = id; option.textContent = name; select.append(option); } select.value = value; select.addEventListener('change', () => change(select.value)); row.append(text, select); return row; }
function confirmReset(panel: HTMLElement, reset: () => void): void { const copy = document.createElement('p'); copy.className = 'rescue-copy'; copy.textContent = S.resetConfirm; const confirm = button(S.deleteEverything, 'button button--danger', reset); const cancel = button(S.cancel, 'button button--secondary', () => { copy.remove(); confirm.remove(); cancel.remove(); }); panel.append(copy, confirm, cancel); }
function button(label: string, className: string, action: () => void): HTMLButtonElement { const value = document.createElement('button'); value.type = 'button'; value.className = className; value.textContent = label; value.addEventListener('click', action); return value; }
