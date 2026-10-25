import { migrate } from '../meta/migrate';
import { CURRENT_VERSION, defaultSave } from '../meta/saveSchema';
import type { SaveV2 } from '../meta/saveSchema';
import { read, write } from './storage';

export const SAVE_KEY = 'gloop-pop:save';
export function loadSave(): SaveV2 {
  const raw = read(SAVE_KEY); if (raw === null) return defaultSave(Date.now());
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isFutureSave(parsed)) write(`${SAVE_KEY}:corrupt:${Date.now()}`, raw);
    const save = migrate(parsed); if (isFutureSave(parsed)) saveNow(save); return save;
  }
  catch {
    write(`${SAVE_KEY}:corrupt:${Date.now()}`, raw);
    const fresh = defaultSave(Date.now()); saveNow(fresh); return fresh;
  }
}
export function saveNow(save: SaveV2): void { write(SAVE_KEY, JSON.stringify(save)); }
function isFutureSave(value: unknown): value is { v: number } { return typeof value === 'object' && value !== null && 'v' in value && typeof value.v === 'number' && value.v > CURRENT_VERSION; }
