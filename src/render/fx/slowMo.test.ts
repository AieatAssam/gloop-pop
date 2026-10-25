import { describe, expect, it } from 'vitest';
import { createSlowMo } from './slowMo';

describe('M10.1 slow motion controller', () => {
  it('ramps in, holds, and ramps out on real time', () => {
    const slow = createSlowMo(); slow.request(0.35, 100, 200, 100);
    expect(slow.step(0)).toBe(1);
    expect(slow.step(50)).toBeCloseTo(0.5125);
    expect(slow.step(100)).toBe(0.35);
    expect(slow.step(300)).toBe(0.35);
    expect(slow.step(400)).toBe(1);
  });

  it('replaces an active request from its current scale and reset is immediate', () => {
    const slow = createSlowMo(); slow.request(0.35, 100, 100, 100); slow.step(100);
    slow.request(0.6, 100, 0, 100); expect(slow.step(100)).toBe(0.35);
    slow.step(200); expect(slow.scale).toBe(0.6);
    slow.reset(); expect(slow.step(201)).toBe(1);
  });

  it('returns the game-over settle to full speed at 450 ms', () => {
    const slow = createSlowMo(); slow.request(0.4, 60, 240, 150);
    expect(slow.step(60)).toBe(0.4); expect(slow.step(300)).toBe(0.4); expect(slow.step(449)).toBeLessThan(1);
    expect(slow.step(450)).toBe(1);
  });
});
