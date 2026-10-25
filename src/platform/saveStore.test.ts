import { afterEach, describe, expect, it, vi } from 'vitest';
import { read, remove, write } from './storage';
import { loadSave, SAVE_KEY } from './saveStore';

afterEach(() => { vi.useRealTimers(); remove(SAVE_KEY); remove(`${SAVE_KEY}:corrupt:12345`); remove(`${SAVE_KEY}:corrupt:12346`); });

describe('save store', () => {
  it('backs up corrupt JSON and replaces it with a fresh save', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date(12345)); write(SAVE_KEY, '{bad json');
    const save = loadSave(); expect(save.v).toBe(2); expect(read(`${SAVE_KEY}:corrupt:12345`)).toBe('{bad json'); expect(JSON.parse(read(SAVE_KEY) ?? 'null')).toMatchObject({ v: 2 });
  });
  it('backs up and replaces saves from an unknown future version', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date(12346)); const future = JSON.stringify({ v: 3 }); write(SAVE_KEY, future);
    expect(loadSave().v).toBe(2); expect(read(`${SAVE_KEY}:corrupt:12346`)).toBe(future);
  });
});
