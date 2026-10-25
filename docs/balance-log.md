# Balance pass log

M9.3 rerun on 25 Oct 2026 with the existing stage tables and tuning order in `docs/design.md` §8. No values failed their targets, so `src/core/stages.ts` was left unchanged.

Commands used: `npm run sim -- --mode classic --runs 300 --seed 1`, and the same command with `expert` and `daily` modes.

| Mode | Median placements | p10 / p90 placements | Under 25 placements | Median score | Solver p99 | Target result |
|---|---:|---:|---:|---:|---:|---|
| Classic | 119.5 | 43 / 207 | 2.7% | 17,201.5 | < 0.10 ms | Pass: placements 90–150; score 8,000–20,000 |
| Expert | 74 | 20 / 209 | 13.0% | 12,643.5 | < 0.10 ms | Pass: placements 40–80 |
| Daily | 71.5 | 11 / 90 | 21.7% | 9,505.5 | 0.85 ms | Pass: median ≥ 60; 114 / 300 runs (38.0%) placed all 30 trays |

Daily all-tray completion was counted as 90 placements in the same 300 runs with seed 1. The solver p99 uses the 12 deterministic probe boards reported by `tools/sim.mjs`; it is below the 8 ms target in each mode. The listed score and placement results were produced by the architecture §9.3 bot, not `chooseGreedyMove`.

There are no before/after gameplay changes: the existing design §8 values still meet the M9.3 targets, so no balance retuning was made.

## 2026-10-25 · Adventure levels

`npm run levels -- --write` generated 120 levels with the frozen bot and the real Adventure reducer. The means below are taken from `npm run levels -- --verify`; wins are out of 12 runs, moves are the level move limits, and s3 is the 3-star threshold.

| Chapter | Band | Mean wins / 12 | Mean moves | Mean s3 |
|---|---|---:|---:|---:|
| 1 | Easy (including intro) | 10.67 | 30.00 | 9.67 |
| 1 | Normal | 8.90 | 26.00 | 8.50 |
| 1 | Hard | 5.75 | 18.00 | 4.00 |
| 2 | Easy | 11.50 | 28.00 | 10.50 |
| 2 | Normal | 9.00 | 25.00 | 8.17 |
| 2 | Hard | 8.50 | 14.00 | 5.00 |
| 3 | Easy | 11.00 | 28.00 | 10.25 |
| 3 | Normal | 9.83 | 24.00 | 8.58 |
| 3 | Hard | 6.50 | 16.00 | 6.00 |
| 4 | Easy | 11.25 | 27.00 | 9.50 |
| 4 | Normal | 9.08 | 24.00 | 8.58 |
| 4 | Hard | 6.25 | 16.00 | 5.50 |
| 5 | Easy | 11.00 | 26.00 | 9.25 |
| 5 | Normal | 8.58 | 23.00 | 8.75 |
| 5 | Hard | 5.75 | 15.00 | 4.75 |
| 6 | Easy | 10.50 | 26.00 | 10.00 |
| 6 | Normal | 8.08 | 22.00 | 7.83 |
| 6 | Hard | 6.25 | 14.00 | 4.75 |

Seed indices that needed more than one try (`level:seedIndex`): 1:16, 3:8, 11:7, 26:1, 35:4, 41:2, 47:1, 50:13, 51:1, 57:26, 65:7, 66:3, 67:3, 71:10, 73:23, 74:1, 79:9, 81:40, 83:42, 85:2, 86:25, 87:19, 89:2, 90:1, 92:16, 95:4, 96:2, 98:4, 99:1, 101:6, 103:7, 104:2, 106:5, 109:61, 110:5, 112:33, 114:5, 116:9, 118:8, 120:57.

The Level 1, seed 0 diagnostic showed all 12 runs reach 4 lines within 20 moves. The failed scaffolding used a fixed target of 7; calibration applies the §24.6 Level 1 cap of 4. The threshold correction needed no parameter change.
