import { describe, expect, it } from 'vitest';
import { tutorialHandPoints } from './ghostHand';

describe('tutorial ghost hand targets', () => {
  it('starts at the tray and centers over the requested board cells', () => {
    const points = tutorialHandPoints({ x: 360, y: 120, width: 560, height: 560 }, { x: 968, y: 128, width: 240, height: 552 }, 68, 6, 6, 2);
    expect(points.from).toEqual({ x: 1088, y: 404 });
    expect(points.to).toEqual({ x: 844, y: 570 });
  });
});
