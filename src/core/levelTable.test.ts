import { describe, expect, it, vi } from 'vitest';

describe('compact Adventure level table', () => {
  it('does no board work at import and builds each requested board only once', async () => {
    const levels = await import('./levels');
    const buildSpy = vi.spyOn(levels, 'buildLevel');
    const table = await import('./levelTable');
    expect(buildSpy).not.toHaveBeenCalled();
    const first = table.levelDef(25);
    expect(buildSpy).not.toHaveBeenCalled();
    expect(first.board).toHaveLength(64);
    expect(buildSpy).toHaveBeenCalledTimes(1);
    expect(first.board).toHaveLength(64);
    expect(buildSpy).toHaveBeenCalledTimes(1);
  });
});
