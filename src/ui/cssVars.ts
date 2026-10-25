import { PALETTE } from '../render/palette';

type ColourMap = Record<string, unknown>;

// spec-note: Until save/equipped-theme state exists, boot uses the Midnight theme.
export function setCssVars(themeId = 'midnight'): void {
  const root = document.documentElement;
  const theme = PALETTE.theme[themeId as keyof typeof PALETTE.theme];
  const values: Record<string, string> = {};
  addVariables(values, 'ui', PALETTE.ui);
  addVariables(values, 'fx', PALETTE.fx);
  addVariables(values, 'light', PALETTE.light);
  addVariables(values, 'theme', theme);
  values['--bg'] = theme.skyTop;
  for (const [name, value] of Object.entries(values)) root.style.setProperty(name, value);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.skyTop);
}

function addVariables(output: Record<string, string>, prefix: string, colours: ColourMap): void {
  for (const [key, value] of Object.entries(colours)) {
    if (typeof value === 'string') output[`--${prefix}-${kebabCase(key)}`] = value;
  }
}

function kebabCase(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}
