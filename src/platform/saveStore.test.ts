import { afterEach, describe, expect, it, vi } from 'vitest';
import { read, remove, write } from './storage';
import { loadSave, SAVE_KEY, saveNow, setSaveWritesDisabled } from './saveStore';
import { defaultSave } from '../meta/saveSchema';

afterEach(() => { setSaveWritesDisabled(false); vi.useRealTimers(); remove(SAVE_KEY); remove(`${SAVE_KEY}:corrupt:12345`); remove(`${SAVE_KEY}:corrupt:12346`); remove(`${SAVE_KEY}:corrupt:12347`); });

describe('save store', () => {
  it('backs up corrupt JSON and replaces it with a fresh save', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date(12345)); write(SAVE_KEY, '{bad json');
    const save = loadSave(); expect(save.v).toBe(2); expect(read(`${SAVE_KEY}:corrupt:12345`)).toBe('{bad json'); expect(JSON.parse(read(SAVE_KEY) ?? 'null')).toMatchObject({ v: 2 });
  });
  it('backs up and replaces saves from an unknown future version', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date(12346)); const future = JSON.stringify({ v: 3 }); write(SAVE_KEY, future);
    expect(loadSave().v).toBe(2); expect(read(`${SAVE_KEY}:corrupt:12346`)).toBe(future);
  });
  it('does not write while an in-memory debug save is active', () => {
    setSaveWritesDisabled(true); saveNow(defaultSave(99)); expect(read(SAVE_KEY)).toBeNull();
  });
  it('keeps corrupt saves read-only while a debug demo is active', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date(12347)); write(SAVE_KEY, '{bad json'); setSaveWritesDisabled(true);
    expect(loadSave().v).toBe(2); expect(read(`${SAVE_KEY}:corrupt:12347`)).toBeNull(); expect(read(SAVE_KEY)).toBe('{bad json');
  });
});
