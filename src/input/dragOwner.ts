// Tracks which pointer owns a held tray piece. Every path that ends a touch releases the claim, so a stale id can never block later pointers.
export interface DragOwner {
  /** The pointer that picked the piece up, or undefined when no pointer owns it. */
  readonly pointerId: number | undefined;
  claim(pointerId: number): void;
  /** Releases the claim when it belongs to `pointerId`, or unconditionally when no id is given. Returns true when a claim was released. */
  release(pointerId?: number): boolean;
  /** True when `pointerId` may act on the drag. With no drag held, every pointer may act. */
  allows(pointerId: number, dragHeld: boolean): boolean;
}

export function createDragOwner(): DragOwner {
  let owner: number | undefined;
  return {
    get pointerId() { return owner; },
    claim(pointerId) { owner = pointerId; },
    release(pointerId) {
      if (owner === undefined) return false;
      if (pointerId !== undefined && pointerId !== owner) return false;
      owner = undefined; return true;
    },
    allows(pointerId, dragHeld) { return !dragHeld || owner === undefined || owner === pointerId; },
  };
}
