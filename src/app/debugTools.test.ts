import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('debug bundle boundary', () => {
  it('keeps debug-only dependencies out of app.ts and imports the tools only for debug URLs', () => {
    const app = readFileSync(new URL('./app.ts', import.meta.url), 'utf8');
    expect(app).not.toContain('save-v1-veteran.json');
    expect(app).not.toContain('./demoScenes');
    expect(app).not.toContain('../core/sim');
    expect(app).toContain("const dbg = debug ? await import('./debugTools') : null");
  });
});
