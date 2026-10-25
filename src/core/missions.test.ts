import { describe, expect, it } from 'vitest';
import { deck, issue, missionAt, MISSIONS } from './missions';

describe('daily missions', () => {
 it('contains the 29 spec rows with slot counts 10/10/9 and unique ids', () => {
  expect(MISSIONS).toHaveLength(29); expect(['A','B','C'].map((slot) => MISSIONS.filter((mission) => mission.slot === slot).length)).toEqual([10,10,9]);
  expect(new Set(MISSIONS.map((mission) => mission.id)).size).toBe(29);
 });
 it('pins the daily positions for the first 14 numbered days in each slot', () => {
  const snapshot = { A: Array.from({length:14},(_,day)=>missionAt('A',day).id), B: Array.from({length:14},(_,day)=>missionAt('B',day).id), C: Array.from({length:14},(_,day)=>missionAt('C',day).id) }; expect(snapshot).toMatchInlineSnapshot(`
    {
      "A": [
        "gloop25",
        "runs2",
        "cherry20",
        "combo3",
        "bigpop1",
        "lines15",
        "advwin1",
        "pieces40",
        "double1",
        "score3k",
        "lines15",
        "cherry20",
        "gloop25",
        "combo3",
      ],
      "B": [
        "bigpop3",
        "orange40",
        "lines40",
        "combo6",
        "score10k",
        "adv3star",
        "advwin3",
        "triple1",
        "blueberry40",
        "cross3",
        "cross3",
        "lines40",
        "score10k",
        "bigpop3",
      ],
      "C": [
        "hugepop1",
        "lines80",
        "score20k",
        "lemon70",
        "multi10",
        "advstars6",
        "combo10",
        "score50k",
        "allclear1",
        "combo10",
        "advstars6",
        "score50k",
        "lines80",
        "multi10",
      ],
    }
  `);
 });
 it('shuffles each cycle into a permutation with no repeat inside a cycle', () => {
  for (const slot of ['A','B','C'] as const) { const size = MISSIONS.filter((mission) => mission.slot === slot).length; const first = deck(slot, 0); expect(new Set(first.map((mission) => mission.id)).size).toBe(size); expect(deck(slot, 0).map((mission) => mission.id)).toEqual(first.map((mission) => mission.id)); expect(deck(slot, 1).map((mission) => mission.id)).toHaveLength(size); for (let position=0;position<size;position+=1) expect(missionAt(slot,position).id).toBe(first[position]?.id); }
 });
 it('skips unavailable and already shown ids when issuing', () => {
  const result = issue('A', 0, (mission) => mission.id !== 'advwin1', ['cherry20']); expect(result.mission.id).not.toBe('advwin1'); expect(result.mission.id).not.toBe('cherry20');
 });
});
