const memory = new Map<string, string>();

export function read(key: string): string | null {
  try { return typeof localStorage === 'undefined' ? memory.get(key) ?? null : localStorage.getItem(key); }
  catch { return memory.get(key) ?? null; }
}
export function write(key: string, value: string): void {
  memory.set(key, value);
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(key, value); } catch { /* in-memory fallback is intentional */ }
}
export function remove(key: string): void {
  memory.delete(key);
  try { if (typeof localStorage !== 'undefined') localStorage.removeItem(key); } catch { /* in-memory fallback is intentional */ }
}
