import { describe, expect, it } from 'vitest';
import { createDragOwner } from './dragOwner';

describe('createDragOwner', () => {
  it('lets any pointer act when no drag is held', () => {
    const owner = createDragOwner();
    owner.claim(3);
    expect(owner.allows(7, false)).toBe(true);
  });

  it('only lets the claiming pointer act on a held drag', () => {
    const owner = createDragOwner();
    owner.claim(3);
    expect(owner.allows(3, true)).toBe(true);
    expect(owner.allows(7, true)).toBe(false);
  });

  it('ignores a release from another pointer', () => {
    const owner = createDragOwner();
    owner.claim(3);
    expect(owner.release(7)).toBe(false);
    expect(owner.pointerId).toBe(3);
  });

  it('releases on the owner pointer or unconditionally', () => {
    const owner = createDragOwner();
    owner.claim(3);
    expect(owner.release(3)).toBe(true);
    expect(owner.pointerId).toBeUndefined();
    expect(owner.allows(7, true)).toBe(true);
    expect(owner.release()).toBe(false);
    owner.claim(4);
    expect(owner.release()).toBe(true);
    expect(owner.pointerId).toBeUndefined();
  });

  it('never keeps a stale claim after a new pointer takes over', () => {
    const owner = createDragOwner();
    owner.claim(1);
    owner.release(1);
    owner.claim(2);
    expect(owner.allows(2, true)).toBe(true);
    expect(owner.allows(1, true)).toBe(false);
  });
});
