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

## 2026-10-25 · M12.7 economy and human balance check

The M12.4 validation table and seed indices above are the machine balance result. `npm run levels -- --verify` is the reproducible check; the director's Chapter 1–2 phone play remains **lead to verify** and should record whether each hard level feels short and fair before making any parameter change.

Economy calculation from design §24.10 and §24.7:

| Activity in one day | Formula | Coins |
|---|---:|---:|
| 5 Classic runs with target/mini average | 5 × (55 + 30) | 425 |
| Claim all 3 missions | design §24.3 set | 210 |
| Win 5 new Adventure levels at 2 stars | 5 × 50 | 250 |
| **Total** | **425 + 210 + 250** | **885** |

The 5-stock booster cap costs 5 × (150 + 100 + 200) = **2,250 coins**, or **2.54 days** at 885 coins/day. The full 10,000-coin shop takes **11.30 days** at that mixed activity rate. The separate design estimate of 120–150 runs at 55 coins/run implies 6,600–8,250 coins, short of the stated 10,000-coin shop total; 10,000 ÷ 55 is about **182 Classic runs**. No balance values were changed.

Chapter 1–2 human result: **lead to verify**. Record hard-level shortness/fairness here after phone play; do not hand-edit generated level data. Any clearly unfair level must be corrected by a level parameter change and regeneration.

## 2026-10-25 · M12 director review fixes

The 120 generated levels remain unchanged. `timeout 900 npm run levels -- --verify` validated all levels with the same per-chapter results above.

Production bundle after review fixes: `timeout 300 npm run check` reports **113.54 KB gzipped** total (the 115 KB target remains unchanged). The Adventure map, level card, result panel and level data now ship together in `adventureBundle` (7.81 KB gzipped); `levelBot` is absent from `dist/`. Using the same gzip method as `tools/check-size.mjs`, the entry chunk is **102.30 KB gzipped**, compared with **82.64 KB** at `fadb7c3`, a **19.66 KB increase**. The per-file gzip sizes are: entry 102.30 KB, `adventureBundle` 7.71 KB, `shareCard` 2.37 KB and `sw.js` 1.16 KB. The review asked that this growth be measured; no further entry split was requested, and total size is under target.

The director's phone play for Chapters 1–2 remains pending. No human balance claim is added here; record whether the hard levels feel short and fair after that play.

## 2026-10-25 · M13 difficulty measurement (director, before the fix)

Measured with read-only scripts on the committed M12 table: each stored level was re-run with `calibrate(n, s)` (12 frozen-bot runs on the real reducer, final targets). **W** = wins of 12. **m** = lower median of moves left over winning runs (design §24.6). Share = m ÷ move limit.

**Bug found while measuring:** every C goal in the table has target **1** (44 levels), although §24.5 said "Clear all {t} sugar cubes" with t = the cube count. `calibrateGoals` copies the placeholder target from `levelParams` instead of the cube count. So "Sugar cubes" levels are won by removing one cube, and the UI says "Clear all 1 sugar cubes". With the true count, the bot clears every cube in **0 of 12** runs on all 64 seeds of Levels 25, 40 and 60, and in at most 3 of 12 on most normal C levels. The fix is in design §24.5 (C becomes a calibrated count goal).

| Ch | Tier | Levels | W mean (min–max) | m mean (moves) | Share mean | Move limit |
|---|---|---:|---:|---:|---:|---:|
| 1 | intro | 3 | 12.00 (12–12) | 4.5 | 0.23 | 20 |
| 1 | easy | 3 | 10.67 (10–12) | 6.8 | 0.23 | 30 |
| 1 | normal | 10 | 8.90 (7–11) | 4.5 | 0.17 | 26 |
| 1 | hard | 4 | 5.75 (4–11) | 1.6 | 0.09 | 18 |
| 2 | easy | 4 | 11.50 (10–12) | 11.8 | 0.42 | 28 |
| 2 | normal | 12 | 9.00 (7–12) | 8.2 | 0.33 | 25 |
| 2 | hard | 4 | 8.50 (7–9) | 3.8 | 0.27 | 14 |
| 3 | easy | 4 | 11.00 (10–12) | 15.5 | 0.55 | 28 |
| 3 | normal | 12 | 9.83 (7–12) | 13.4 | 0.56 | 24 |
| 3 | hard | 4 | 6.50 (4–12) | 8.1 | 0.51 | 16 |
| 4 | easy | 4 | 11.25 (10–12) | 17.4 | 0.64 | 27 |
| 4 | normal | 12 | 9.08 (7–12) | 11.3 | 0.47 | 24 |
| 4 | hard | 4 | 6.25 (4–10) | 4.5 | 0.28 | 16 |
| 5 | easy | 4 | 11.00 (10–12) | 11.8 | 0.45 | 26 |
| 5 | normal | 12 | 8.58 (7–12) | 10.9 | 0.47 | 23 |
| 5 | hard | 4 | 5.75 (5–7) | 3.4 | 0.22 | 15 |
| 6 | easy | 4 | 10.50 (10–12) | 7.3 | 0.28 | 26 |
| 6 | normal | 12 | 8.08 (7–11) | 9.9 | 0.45 | 22 |
| 6 | hard | 4 | 6.25 (4–9) | 5.8 | 0.41 | 14 |

(m is the plain median here, as `--verify` would print it; the lower median differs by at most 0.5.) Hard levels that are **not** at least 2 wins below both neighbours: 8 of 24 — Level 5 (11 vs 8/12), 35 (9 vs 8/12), 40 (9 vs 9/11), 60 (12 vs 8/12), 65 (10 vs 7/12), 100 (7 vs 8/10), 105 (9 vs 8/12), 115 (7 vs 7/10). Several hard levels also have a large margin (Level 50: m 11 of 16; Level 60: m 15 of 16), so they are not "short and tense" even when W is low.

## 2026-10-25 · M13 forecast for the new generator (director prototype)

A /tmp prototype of the M13 §24.6 algorithm (traces from the frozen bot and the real reducer, C as a count goal, the tier bands, the neighbour rule, the goal swaps at Levels 47/50, 115/119 and 118/120) generated all 120 levels with no failures. Replaying all 120 levels on the real reducer gave the same W and m for every level (0 mismatches). No parameter other than the goal rotation changed.

| Ch | Tier | W mean (min–max) | m mean (moves) | Share mean |
|---|---|---:|---:|---:|
| 1 | intro | 12.00 (12–12) | 4.0 | 0.20 |
| 1 | easy | 10.67 (10–11) | 9.0 | 0.30 |
| 1 | normal | 8.20 (7–10) | 3.4 | 0.13 |
| 1 | hard | 4.75 (4–7) | 0.8 | 0.04 |
| 2 | easy | 11.75 (11–12) | 10.3 | 0.37 |
| 2 | normal | 8.08 (7–10) | 6.2 | 0.25 |
| 2 | hard | 6.00 (5–7) | 1.0 | 0.07 |
| 3 | easy | 11.25 (10–12) | 14.5 | 0.52 |
| 3 | normal | 8.00 (7–10) | 9.5 | 0.40 |
| 3 | hard | 5.00 (4–7) | 2.0 | 0.13 |
| 4 | easy | 11.50 (10–12) | 18.3 | 0.68 |
| 4 | normal | 8.00 (7–10) | 10.1 | 0.42 |
| 4 | hard | 4.50 (4–5) | 2.0 | 0.13 |
| 5 | easy | 10.75 (10–12) | 12.3 | 0.47 |
| 5 | normal | 7.50 (7–8) | 8.4 | 0.37 |
| 5 | hard | 5.00 (4–6) | 1.5 | 0.10 |
| 6 | easy | 10.50 (10–11) | 8.8 | 0.34 |
| 6 | normal | 8.08 (7–10) | 10.9 | 0.50 |
| 6 | hard | 4.25 (4–5) | 1.3 | 0.09 |

Expected table as `level:seedIndex:targets` (two-goal levels list C first, then X). If the implementation of design §24.6 is exact, `npm run levels -- --write` must produce these values; a difference means the code and the spec disagree, and the spec wins:

1:16:3 2:0:700 3:8:3 4:0:2300 5:10:4 6:1:8 7:0:6500 8:2:5 9:0:9 10:1:3600 11:2:16 12:0:5 13:0:2700 14:0:20 15:0:4 16:0:2200 17:0:11 18:2:5 19:0:2100 20:14:25 21:0:1 22:0:5 23:0:2000 24:0:2 25:0:2 26:1:13 27:0:1 28:0:2100 29:0:5 30:0:1 31:1:2200 32:0:2 33:0:11 34:0:5 35:0:11 36:0:1 37:0:3700 38:0:1 39:0:5 40:16:2 41:2:5 42:0:5 43:0:4 44:2:4 45:0:2300 46:0:1 47:16:1 48:0:3 49:0:2 50:0:20 51:1:6 52:0:2 53:0:4300 54:0:2 55:1:3 56:0:12 57:26:1 58:0:2 59:0:4 60:1:5 61:0:1 62:3:5 63:0:2 64:0:1 65:10:17 66:3:1 67:3:1 68:0:3000 69:1:1 70:3:4 71:10:1 72:0:8 73:23:1 74:2:1 75:0:2500 76:0:4 77:0:1 78:0:4 79:9:1 80:3:1 81:9:1/5 82:0:2700 83:5:1/13 84:0:4 85:5:1 86:25:1 87:2:1/4000 88:2:8 89:2:1/4 90:1:4 91:1:2400 92:16:1/1 93:0:3 94:0:1/5 95:4:1/17 96:1:12 97:0:1/3200 98:12:1 99:0:2/2 100:0:1/4 101:30:1/2000 102:0:4 103:0:1/10 104:2:1 105:4:1/3 106:1:12 107:0:1/6 108:0:2000 109:61:1/1 110:5:1 111:0:5 112:2:1/20 113:0:1 114:5:1/2100 115:2:2500 116:9:1/3 117:0:9 118:12:1/1 119:51:1 120:9:1/5

52 of 120 levels change seed or targets. All 44 C levels now read "Clear {t} sugar cubes" with a calibrated t (1 or more) instead of "Clear all 1 sugar cubes". Saved stars stay as they are (design §24.6, "Changing the table").

## 2026-10-25 · M13 levels (M13.1 implementation)

`timeout 900 npm run levels -- --write` run twice produced byte-identical `src/core/levels.data.ts` (SHA-256 `c484a93f97a5911f064de87b20612137dd9cd86a1a20daf4421884364f46ba4e`). `timeout 900 npm run levels -- --verify` passed in 15,609 ms. All 120 levels passed their bands and the neighbour rule (0 failures). The real table below matches the M13 forecast above exactly: 120 of 120 `level:seedIndex:targets` entries match, with no parameter changes.

| Ch | Tier | W mean (min–max) | m mean (moves) |
|---|---|---:|---:|
| 1 | intro | 12.00 (12–12) | 4.00 |
| 1 | easy | 10.67 (10–11) | 9.00 |
| 1 | normal | 8.20 (7–10) | 3.40 |
| 1 | hard | 4.75 (4–7) | 0.75 |
| 2 | easy | 11.75 (11–12) | 10.25 |
| 2 | normal | 8.08 (7–10) | 6.17 |
| 2 | hard | 6.00 (5–7) | 1.00 |
| 3 | easy | 11.25 (10–12) | 14.50 |
| 3 | normal | 8.00 (7–10) | 9.50 |
| 3 | hard | 5.00 (4–7) | 2.00 |
| 4 | easy | 11.50 (10–12) | 18.25 |
| 4 | normal | 8.00 (7–10) | 10.08 |
| 4 | hard | 4.50 (4–5) | 2.00 |
| 5 | easy | 10.75 (10–12) | 12.25 |
| 5 | normal | 7.50 (7–8) | 8.42 |
| 5 | hard | 5.00 (4–6) | 1.50 |
| 6 | easy | 10.50 (10–11) | 8.75 |
| 6 | normal | 8.08 (7–10) | 10.92 |
| 6 | hard | 4.25 (4–5) | 1.25 |

Actual `--verify` table (`level:seedIndex:targets`, C first on two-goal levels):

1:16:3 2:0:700 3:8:3 4:0:2300 5:10:4 6:1:8 7:0:6500 8:2:5 9:0:9 10:1:3600 11:2:16 12:0:5 13:0:2700 14:0:20 15:0:4 16:0:2200 17:0:11 18:2:5 19:0:2100 20:14:25 21:0:1 22:0:5 23:0:2000 24:0:2 25:0:2 26:1:13 27:0:1 28:0:2100 29:0:5 30:0:1 31:1:2200 32:0:2 33:0:11 34:0:5 35:0:11 36:0:1 37:0:3700 38:0:1 39:0:5 40:16:2 41:2:5 42:0:5 43:0:4 44:2:4 45:0:2300 46:0:1 47:16:1 48:0:3 49:0:2 50:0:20 51:1:6 52:0:2 53:0:4300 54:0:2 55:1:3 56:0:12 57:26:1 58:0:2 59:0:4 60:1:5 61:0:1 62:3:5 63:0:2 64:0:1 65:10:17 66:3:1 67:3:1 68:0:3000 69:1:1 70:3:4 71:10:1 72:0:8 73:23:1 74:2:1 75:0:2500 76:0:4 77:0:1 78:0:4 79:9:1 80:3:1 81:9:1/5 82:0:2700 83:5:1/13 84:0:4 85:5:1 86:25:1 87:2:1/4000 88:2:8 89:2:1/4 90:1:4 91:1:2400 92:16:1/1 93:0:3 94:0:1/5 95:4:1/17 96:1:12 97:0:1/3200 98:12:1 99:0:2/2 100:0:1/4 101:30:1/2000 102:0:4 103:0:1/10 104:2:1 105:4:1/3 106:1:12 107:0:1/6 108:0:2000 109:61:1/1 110:5:1 111:0:5 112:2:1/20 113:0:1 114:5:1/2100 115:2:2500 116:9:1/3 117:0:9 118:12:1/1 119:51:1 120:9:1/5

## 2026-10-25 · M13 coin sink decision

At about 885 coins a day (M12.7 above), the original 21-item shop (10,000 coins) is done in about 11.3 days; after that, coins only buy boosters, which a player needs rarely. Decision: add 3 Gold pop effects (1,500 + 2,000 + 2,500 = 6,000 coins) that recolour existing particles with existing palette roles (design §14.4, SG §9.3). The whole shop becomes 16,000 coins, about **18.1 days** at 885 coins a day. Rejected: a rotating "pick of the week" (a time limit is FOMO even if items return), coin-bought streak freezes (§11 keeps freezes earned, and a player who plays every day never uses one, so they would not sink coins), and a full cosmetic tier (new art for 21 items).
