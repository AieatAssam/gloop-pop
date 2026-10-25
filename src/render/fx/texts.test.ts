import { describe, expect, it } from 'vitest';
import { chooseStackLabel, stackTop } from './texts';

describe('SG §9.13.g label stack', () => {
  it('uses one first-time label in place of the event label', () => {
    expect(chooseStackLabel('Mega Pop', 'First Mega Pop!')).toBe('First Mega Pop!');
    expect(chooseStackLabel('Double', '')).toBe('Double');
  });
  it('clamps the stack inside the board and centres it if the range is empty', () => {
    expect(stackTop(20, 100, 0, 544, 68)).toBe(136);
    expect(stackTop(530, 100, 0, 544, 68)).toBe(376);
    expect(stackTop(20, 500, 0, 544, 68)).toBe(22);
  });
});
