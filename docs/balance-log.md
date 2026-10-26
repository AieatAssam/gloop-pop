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

## 2026-10-25 · M14 cube levels: measurement and forecast (director prototype)

**Before (the committed M13 table).** 44 levels have a C goal. Their targets: **34 are "Clear 1 sugar cube"**, 8 are 2, one is 4 (Level 43) and one is 5 (Level 60). Chapters 4–6: 29 of 30 C targets are 1. Mean C target per chapter: Ch 2 1.44, Ch 3 3.00, Ch 4 1.00, Ch 5 1.09, Ch 6 1.00.

Why (measured on the raw 12 bot runs of every stored seed, C target = cube count): the frozen bot is one-ply greedy. It only removes a cube when a line through that cube happens to be one piece from full, and the cubes are scattered one per line, so one clear removes about one cube. Hard cubes are worse: the bot's C weight counts removed cubes, so the first hit (crack) is worth nothing to it. With 3 cubes of which 2 hard (Ch 4 normal), the 7th-best run removed 0–1 cubes on every stored seed. Ch 6 two-goal levels had 1 cube on the board, so no target above 1 was possible.

**What was tried (all under /tmp, frozen bot, real reducer):**
- More cubes alone, scattered (Ch 2–3 up to 8–10, Ch 4–6 up to 9): 18 of 44 C levels could reach the floor below.
- Cube lanes (cubes grouped on a few rows/columns): 3 per lane was best. 2 per lane: 29/44; 4 per lane: same as 3; all on one line: all-or-nothing (a single clear wins).
- Lanes + more moves on C levels + 1 hard cube per level: 40/44 on 16 seeds. The failures were the three C+M two-goal levels (92, 109, 118) and Level 112. On all 64 seeds Level 112 passes on 17 seeds and Level 92 on 2, but Levels 109 and 118 pass on none (0–3 seeds even with 5–8 cubes). A 2+ line clear plus 4 cubes is too rare for the bot, so C+M was removed from the rotation (92 → C+F, 109 → C+S, 118 → C+F).
- With the full generator (neighbour rule), Level 40 then failed: Level 39 (W 9, m 2 of 25) forces m ≤ 1 on an 18-move Level 40. Ch 2 hard C levels use 16 moves instead.

**Decision (design §24.5, §24.6 M14):** cube lanes (3 cubes per lane), new cube counts with at most 1 hard cube per level, a C move table, a C target floor (3 in Ch 2–3, 4 in Ch 4–6), and no C+M levels. Bands, the neighbour rule, the frozen bot, seeds strings and every non-C parameter are unchanged.

**After (prototype, all 120 levels):** 0 band failures, 0 neighbour failures, 0 C targets below the floor. Generation 15.0 s. Two runs gave identical tables. C targets: 3 ×4, 4 ×19, 5 ×16, 6 ×3, 7 ×1, 8 ×1; mean per chapter Ch 2 4.00 (3–5), Ch 3 5.60 (3–8), Ch 4 4.50 (4–5), Ch 5 4.45 (4–6), Ch 6 4.73 (4–6). Mean W over C levels 7.41.

| Ch | Tier | W mean (min–max) | m mean | Share mean | Moves mean |
|---|---|---:|---:|---:|---:|
| 1 | intro | 12.00 (12–12) | 4.00 | 0.20 | 20.0 |
| 1 | easy | 10.67 (10–11) | 9.00 | 0.30 | 30.0 |
| 1 | normal | 8.20 (7–10) | 3.40 | 0.13 | 26.0 |
| 1 | hard | 4.75 (4–7) | 0.75 | 0.04 | 18.0 |
| 2 | easy | 11.50 (11–12) | 14.25 | 0.48 | 29.0 |
| 2 | normal | 8.25 (7–10) | 5.75 | 0.21 | 26.0 |
| 2 | hard | 4.75 (4–6) | 0.50 | 0.03 | 15.5 |
| 3 | easy | 11.25 (10–12) | 14.50 | 0.52 | 28.0 |
| 3 | normal | 7.75 (7–9) | 9.75 | 0.39 | 25.0 |
| 3 | hard | 4.50 (4–5) | 1.25 | 0.07 | 16.5 |
| 4 | easy | 10.75 (10–12) | 12.25 | 0.40 | 30.0 |
| 4 | normal | 8.33 (7–10) | 10.42 | 0.41 | 25.3 |
| 4 | hard | 5.50 (4–7) | 0.75 | 0.05 | 16.5 |
| 5 | easy | 10.75 (10–12) | 11.25 | 0.43 | 27.0 |
| 5 | normal | 7.42 (7–8) | 6.33 | 0.26 | 25.3 |
| 5 | hard | 4.75 (4–6) | 1.50 | 0.09 | 17.3 |
| 6 | easy | 10.50 (10–11) | 8.75 | 0.32 | 28.0 |
| 6 | normal | 7.58 (7–10) | 8.75 | 0.38 | 24.0 |
| 6 | hard | 4.25 (4–5) | 2.00 | 0.12 | 17.0 |

Every C level after M14 (cubes = sugar + hard on the start board; targets C first):

| Level | Goals | Cubes | Moves | Targets | W | m |
|---:|---|---|---:|---|---:|---:|
| 21 | C | 5 + 0 | 30 | 3 | 11 | 16 |
| 24 | C | 7 + 0 | 28 | 3 | 8 | 15 |
| 25 | C | 8 + 0 | 16 | 5 | 4 | 0 |
| 27 | C | 7 + 0 | 28 | 4 | 9 | 15 |
| 30 | C | 8 + 0 | 16 | 5 | 5 | 1 |
| 32 | C | 7 + 0 | 28 | 4 | 10 | 6 |
| 36 | C | 5 + 0 | 30 | 3 | 12 | 29 |
| 38 | C | 7 + 0 | 28 | 5 | 7 | 6 |
| 40 | C | 8 + 0 | 16 | 4 | 4 | 0 |
| 43 | C | 8 + 0 | 27 | 3 | 8 | 14 |
| 49 | C | 8 + 0 | 27 | 7 | 7 | 8 |
| 54 | C | 8 + 0 | 27 | 4 | 8 | 13 |
| 58 | C | 8 + 0 | 27 | 6 | 8 | 5 |
| 60 | C | 10 + 0 | 18 | 8 | 5 | 2 |
| 61 | C | 6 + 1 | 31 | 4 | 11 | 13 |
| 64 | C | 7 + 1 | 28 | 4 | 10 | 9 |
| 66 | C | 6 + 1 | 31 | 5 | 10 | 18 |
| 69 | C | 7 + 1 | 28 | 4 | 8 | 9 |
| 71 | C | 6 + 1 | 31 | 4 | 10 | 10 |
| 74 | C | 7 + 1 | 28 | 5 | 8 | 11 |
| 77 | C | 7 + 1 | 28 | 5 | 8 | 11 |
| 80 | C | 8 + 1 | 18 | 5 | 4 | 1 |
| 81 | C+L | 6 + 1 | 30 | 4 / 6 | 10 | 6 |
| 83 | C+F | 6 + 1 | 27 | 4 / 13 | 7 | 1 |
| 85 | C | 9 + 1 | 18 | 6 | 6 | 3 |
| 87 | C+S | 6 + 1 | 27 | 5 / 3500 | 7 | 3 |
| 89 | C+B | 6 + 1 | 27 | 4 / 4 | 7 | 8 |
| 92 | C+F | 6 + 1 | 27 | 4 / 20 | 8 | 4 |
| 94 | C+L | 6 + 1 | 27 | 4 / 7 | 8 | 2 |
| 95 | C+F | 6 + 1 | 18 | 5 / 20 | 4 | 1 |
| 97 | C+S | 6 + 1 | 27 | 4 / 3700 | 7 | 8 |
| 99 | C+B | 6 + 1 | 27 | 5 / 3 | 8 | 5 |
| 100 | C+L | 6 + 1 | 18 | 4 / 6 | 4 | 1 |
| 101 | C+S | 7 + 0 | 30 | 5 / 4200 | 10 | 6 |
| 103 | C+F | 7 + 0 | 26 | 5 / 14 | 7 | 1 |
| 105 | C+L | 7 + 0 | 18 | 4 / 5 | 4 | 2 |
| 107 | C+B | 7 + 0 | 26 | 4 / 2 | 7 | 16 |
| 109 | C+S | 7 + 0 | 26 | 5 / 2500 | 7 | 4 |
| 110 | C | 9 + 1 | 18 | 4 | 5 | 2 |
| 112 | C+F | 7 + 0 | 26 | 5 / 19 | 7 | 4 |
| 114 | C+S | 7 + 0 | 26 | 5 / 2900 | 7 | 4 |
| 116 | C+L | 7 + 0 | 30 | 6 / 5 | 10 | 10 |
| 118 | C+F | 7 + 0 | 26 | 5 / 17 | 7 | 3 |
| 120 | C+B | 7 + 0 | 18 | 4 / 2 | 4 | 2 |

**M14 forecast** (`level:seedIndex:targets`, C first on two-goal levels). If design §24.6 (M14) is implemented exactly, `npm run levels -- --write` must produce these 120 values; a difference means the code and the spec disagree, and the spec wins. 48 entries differ from the M13 table: the 44 C levels' targets or seeds, and Levels 50, 65, 70 and 115, whose seeds move because the neighbour rule now compares them with changed C neighbours.

1:16:3 2:0:700 3:8:3 4:0:2300 5:10:4 6:1:8 7:0:6500 8:2:5 9:0:9 10:1:3600 11:2:16 12:0:5 13:0:2700 14:0:20 15:0:4 16:0:2200 17:0:11 18:2:5 19:0:2100 20:14:25 21:1:3 22:0:5 23:0:2000 24:0:3 25:6:5 26:1:13 27:0:4 28:0:2100 29:0:5 30:1:5 31:1:2200 32:1:4 33:0:11 34:0:5 35:0:11 36:4:3 37:0:3700 38:0:5 39:0:5 40:0:4 41:2:5 42:0:5 43:0:3 44:2:4 45:0:2300 46:0:1 47:16:1 48:0:3 49:1:7 50:1:20 51:1:6 52:0:2 53:0:4300 54:0:4 55:1:3 56:0:12 57:26:1 58:0:6 59:0:4 60:3:8 61:5:4 62:3:5 63:0:2 64:0:4 65:3:20 66:7:5 67:3:1 68:0:3000 69:0:4 70:1:4 71:11:4 72:0:8 73:23:1 74:3:5 75:0:2500 76:0:4 77:0:5 78:0:4 79:9:1 80:0:5 81:1:4/6 82:0:2700 83:2:4/13 84:0:4 85:1:6 86:25:1 87:1:5/3500 88:2:8 89:7:4/4 90:1:4 91:1:2400 92:5:4/20 93:0:3 94:6:4/7 95:5:5/20 96:1:12 97:5:4/3700 98:12:1 99:5:5/3 100:2:4/6 101:2:5/4200 102:0:4 103:0:5/14 104:2:1 105:0:4/5 106:1:12 107:0:4/2 108:0:2000 109:0:5/2500 110:21:4 111:0:5 112:16:5/19 113:0:1 114:5:5/2900 115:0:3000 116:0:6/5 117:0:9 118:2:5/17 119:51:1 120:3:4/2

## 2026-10-25 · M14 levels (M14.1 implementation)

`timeout 900 npm run levels -- --write` run twice produced byte-identical `src/core/levels.data.ts` (SHA-256 `3f8b9c1be9a2e40e3f77c8d25169a59d12d00d7f98d1d963cce517f7ffc8a4b1`). `timeout 900 npm run levels -- --verify` passed in 14.3 s. The generated `level:seedIndex:targets` rows match the M14 forecast above exactly: **120 of 120 match**. The real table has 0 band failures, 0 neighbour failures and 0 C targets below the floor.

| Ch | Tier | W mean (min–max) | m mean | Band failures |
|---|---|---:|---:|---:|
| 1 | intro | 12.00 (12–12) | 4.00 | 0 |
| 1 | easy | 10.67 (10–11) | 9.00 | 0 |
| 1 | normal | 8.20 (7–10) | 3.40 | 0 |
| 1 | hard | 4.75 (4–7) | 0.75 | 0 |
| 2 | easy | 11.50 (11–12) | 14.25 | 0 |
| 2 | normal | 8.25 (7–10) | 5.75 | 0 |
| 2 | hard | 4.75 (4–6) | 0.50 | 0 |
| 3 | easy | 11.25 (10–12) | 14.50 | 0 |
| 3 | normal | 7.75 (7–9) | 9.75 | 0 |
| 3 | hard | 4.50 (4–5) | 1.25 | 0 |
| 4 | easy | 10.75 (10–12) | 12.25 | 0 |
| 4 | normal | 8.33 (7–10) | 10.42 | 0 |
| 4 | hard | 5.50 (4–7) | 0.75 | 0 |
| 5 | easy | 10.75 (10–12) | 11.25 | 0 |
| 5 | normal | 7.42 (7–8) | 6.33 | 0 |
| 5 | hard | 4.75 (4–6) | 1.50 | 0 |
| 6 | easy | 10.50 (10–11) | 8.75 | 0 |
| 6 | normal | 7.58 (7–10) | 8.75 | 0 |
| 6 | hard | 4.25 (4–5) | 2.00 | 0 |

C target histogram: **3 ×4, 4 ×19, 5 ×16, 6 ×3, 7 ×1, 8 ×1**. All validation checks use the frozen M13 bot and the real Adventure reducer.

## M14 Mega loudness

The 3b capture used to size the extra Mega-only cuts was taken before 3c and included the 14 stacked achievement chimes. Its master capture measured −13.4 LUFS-I, peak −0.7 dBFS; the loudest 100 ms impact windows were unchanged. Those numbers were superseded by the director's revised Mega gain table in style guide §13.6. The 3b trims were fighting the achievement stack rather than the Mega layers.

## M15 Mega loudness

Director decision, 2026-10-26. Owner brief: "fix volume if you can do so safely". Target: Mega −16 LUFS-I ± 1 (5 s from onset, master capture), true peak ≤ −1 dBFS, no clipping, no limiter pumping, Mega above combo, All Clear Mega at or above Mega. The table is in style guide §13.6.

**Lead captures on the M15.1 build (before):**

| Scene | LUFS-I | True peak |
|---|---:|---:|
| `scene=mega-plain` (run 1 / run 2) | −17.7 / −17.5 | −2.8 / −2.4 dBFS |
| `scene=mega` (All Clear Mega) | −18.4 | −3.2 dBFS |
| `scene=combo` | −20.3 | −4.7 dBFS |
| line clear | −22.2 | −4.0 dBFS |

**What the limiter is doing now.** Master trim 0.674 (−3.43 dB) feeds a DynamicsCompressor at −6 dB threshold, knee 0, ratio 20, attack 2 ms, release 150 ms, with +3.42 dB automatic makeup. Below threshold the chain is unity. The output ceiling for a held signal is −6 + 3.42 = **−2.58 dBFS**. The plain Mega peaks of −2.8 and −2.4 sit on that ceiling, so the loudest Mega transient already reaches the threshold. Any layer that adds to that peak would go straight into gain reduction. A plain gain boost on every Mega layer is not safe.

**Where the peak is.** I rebuilt the trace in an offline model: synth layers with their exact envelopes, samples as decays with the manifest lengths, BS.1770 K-weighting and gating, and the limiter above with 6 ms lookahead. One global offset calibrates it to −17.6. The loudest 100 ms window is 1.2–1.3 s. There the held note (+225 ms) starts on the same frame, pitch and phase as the sixth stinger note (rung `s + 5`), so the two sines add in phase. The pop burst and the goal coin (0.85 s) come second, about 1.5 dB lower. The All Clear peak is its three bloom tones, which all start at +330 ms.

**Decision (Mega-only and All Clear stinger layers; nothing else changes):**

| Layer | Old | New |
|---|---|---|
| Mega stinger bodies / tinks | −11 / −15 | −9 / −13 |
| Mega held note | −11 at +225 ms | −7 at +270 ms |
| Mega bloom ×2 | −17 at +270 ms | −14 at +315 ms |
| All Clear bloom ×3 | −14, all at +330 ms | −7, at +330 / +390 / +450 ms |
| Mega goo, sub, pop cells, line, fizz, combo harmony, sparkle; All Clear bodies / tinks | as M14 | unchanged |

Moving the held note one 45 ms step later removes the in-phase stack. That alone costs 0.9 LU and lowers the peak by 2.3 dB. The freed headroom pays for the +2 dB stinger notes and the +4 dB held note. The bloom gets +3 dB, not +4, so a plain Mega cannot pass an All Clear Mega. The pop-burst layers stay put because they overlap the goal coin and place cluster, where peak rises as fast as loudness.

**Forecast (model delta applied to the lead's captures; ±0.5 LU model spread):**

| Scene | LUFS-I | True peak | Limiter gain reduction |
|---|---:|---:|---|
| `mega-plain` | −16.5 (−16.2 with no music, −16.8 with the bed) | ≈ −3.6 dBFS | 0 dB (input peak ≈ −7 dBFS) |
| `mega` (All Clear Mega) | −16.2 | ≈ −2.7 dBFS | ≤ 0.3 dB on one transient, no pumping |
| combo / line | −20.3 / −22.2 | unchanged | unchanged |

Mega is now about 3.8 LU above a combo move, and All Clear Mega is about 0.3 LU above plain Mega. −16.0 is not forecast for plain Mega with the limiter idle. To get there I would have to raise the pop-burst layers, which share the coin peak, or let All Clear lead by less than the run-to-run spread. −16.5 is the safe maximum, inside the ± 1 window.

**Required tests (implementation task).** Export one table from `src/audio/sfx.ts`, e.g. `export const MEGA_MIX_DB = { goo: -10, sub: -14, popCell: -14, lineBody: -12, lineTink: -16, fizz: -26, comboHarmony: -22, sparkle: -22, stingerBody: -9, stingerTink: -13, held: -7, heldAtMs: 270, bloom: -14, bloomAtMs: 315, allClearBody: -10, allClearTink: -14, allClearBloom: -7, allClearBloomAtMs: 330, allClearBloomRollMs: 60 } as const;`, and read every listed layer from it in `sfx.ts` and in `index.ts` (`onBurst` −14, `onPopFirst` −10 / −14). In `sfx.test.ts`:
- `expect(MEGA_MIX_DB).toEqual({ …the 19 values above… })`. This is the single source, and any edit fails here.
- `megaStinger({ combo: 1 })`: 6 `playCandyBar` calls with `[MEGA_MIX_DB.stingerBody, MEGA_MIX_DB.stingerTink]` (= `[-9, -13]`) at `0.005 + i * 0.045`. The tone peaks are `[10 ** (-7 / 20), 10 ** (-14 / 20), 10 ** (-14 / 20)]` and the tone `at` values are `[0.275, 0.32, 0.32]`. The held tone frequency equals the sixth bar's rung, and its `at` is 45 ms after that bar (not the same frame).
- `allClearStinger()`: 11 `playCandyBar` calls with `[-10, -14]` at `0.005 + rung * 0.03`. The bloom tone peaks are `Array(3).fill(10 ** (-7 / 20))` at `[0.335, 0.395, 0.455]`, with rungs 5, 7, 8 in that order.
- The existing Mega impact assertions stay: goo −10, sub −14, pop −14, line `[-12, -16]`, fizz `0.063 * 10 ** (-2 / 20)` in the fallback path, combo harmony and sparkle −22. They now read from `MEGA_MIX_DB`. Normal line clears stay `[-10, -14]` and Huge stays goo −9 and pop −12.

**Acceptance re-capture (lead):** two runs each of `?debug=1&overlay=0&demo=feel&scene=mega-plain` and `scene=mega`, plus one `scene=combo`, using `ffmpeg -af ebur128=peak=true` over 5 s from onset. Pass: mega-plain −17 to −15 LUFS-I, every TP ≤ −1 dBFS, All Clear Mega ≥ mega-plain, combo unchanged. If any run's TP reads above −2.0 dBFS, the limiter is doing more than catching single transients. In that case drop the All Clear bloom to −8, then the Mega held note to −8, one step at a time, and re-capture.

### M15 round 2 (All Clear below Mega)

**Lead captures on HEAD (b6cf8ad, M15 table implemented), two runs each:**

| Scene | LUFS-I | True peak | Forecast was |
|---|---:|---:|---:|
| `scene=mega-plain` | −17.0 / −16.9 | −3.9 / −4.0 dBFS | −16.5 / −3.6 |
| `scene=mega` (All Clear Mega) | −17.9 / −18.2 | −3.3 / −3.4 dBFS | −16.2 / −2.7 |
| `scene=combo` | −20.5 | −4.4 dBFS | unchanged |
| line clear | −21.9 | −4.4 dBFS | unchanged |

Plain Mega is in range. All Clear Mega is about 1.1 LU below it. It should be at least 0.3 LU above.

**Why the model missed: the All Clear bloom never plays.** `allClearStinger()` calls `playCandyBar` for rungs 0–10 and then `tone` ×3 in one go at the climax frame. Each oscillator or tink source calls `claimVoice` when it is scheduled, and the voice stays in the list until its `ended` event. So a note scheduled for +450 ms already counts against the 24-voice cap at +0 ms. Stinger voices are never stolen. A bar with a fundamental under 1.2 kHz (rungs 0–6) claims 4 voices: body, ×4 partial, ×10 partial and tink. Bars 0–5 make exactly 24. **Every later claim (bars 6–10, all three bloom tones and their LFOs) returns false and is never started.** `traceAudioCall` runs before the claim, so the lead's M14 trace still listed 11 rungs and 3 bloom tones. What you actually hear is rungs 0–5 over 150 ms. That is also why M15's −14 → −7 bloom change moved the All Clear by only about +0.3 LU (run spread).

Plain Mega starts at rung 5 (combo 11 → `s = 5`): bars 5–6 take 4 voices each, bars 7–10 take 3, so the bars take 20, the held note takes 2 and the first bloom note takes 2. **The second bloom note (top rung − 2) is dropped.** That accounts for about 0.1 LU of the 0.45 LU Mega over-forecast.

**Decision (round 2):**

| Layer | M15 | Round 2 |
|---|---|---|
| Stinger voice accounting | counts from scheduling until `ended` | counts only over its scheduled [start, stop): a claim checks the voices whose [start, stop) overlaps the new voice's [start, stop) |
| All Clear bloom ×3 (rungs 5, 7, 8) | −7, at +330 / +390 / +450 ms | **−10**, timing unchanged |
| All Clear bodies / tinks | −10 / −14 | unchanged (rungs 6–10 now sound) |
| Every Mega row | as M15 | unchanged |

With overlap counting, the most stinger voices the All Clear needs at once is 17 (bar 6 and the first bloom note). Tinks last 85–142 ms after rate folding, and fundamentals last 270 ms. Plain Mega needs at most 14. Each has at least 7 voices of headroom under the cap. The cap stays 24, and stinger voices are still never stolen.

**Rejected: a dB-only fix on the current engine.** Only bars 0–5 sound, so the All Clear would need about +5.4 dB on those bars. Six bars 30 ms apart stack to about 1.8× one bar's amplitude, so that would put the ladder peak above 0 dBFS before the limiter.

**Rejected: the optional +0.5 dB on Mega-only layers.** Plain Mega gains about +0.1 LU when its second bloom note sounds. A further +0.5 dB on the stinger bars, held note and bloom would add about +0.25 LU. That would cut the All Clear's lead to about 0.25 LU, below the 0.3 LU required and inside the run-to-run spread. I'll revisit it after this capture.

**Forecast (energy model recalibrated to these captures; ±0.5 LU):**

| Scene | LUFS-I | True peak | Limiter |
|---|---:|---:|---|
| `mega-plain` | −16.85 | ≈ −3.9 dBFS (pop/coin cluster) | idle |
| `mega` (All Clear Mega) | **−16.35** (+1.7 LU: bars 6–10 ≈ +0.6, bloom ≈ +1.1) | ≈ −3.2 dBFS (ladder stack, now 330 ms long); bloom ≈ −5.5 | idle (compressor input ≈ −6.6 dBFS, under the −6 threshold) |
| combo / line | −20.5 / −21.9 | unchanged | unchanged |

All Clear leads plain Mega by about 0.5 LU. Both sit within −16 ± 1.

**Required tests (implementation task).**
- `MEGA_MIX_DB.allClearBloom` = −10. Update the `toEqual` and the bloom peak assertions to `10 ** (-10 / 20)`.
- Engine test: start from an empty voice list with the `tink` segment decoded. After `allClearStinger()`, every source has started: 11 bodies, 11 ×4, 7 ×10, 11 tinks, and 3 tones with 3 LFOs. After `megaStinger({ combo: 12 })`, both bloom tones have started.
- A cap test with 24 voices that overlap in time still refuses a 25th stinger voice.
- The debug trace marks a call whose claim failed (e.g. `dropped`), so a trace can no longer list a note that never played.

**Acceptance re-capture (lead).** Same method as above. Pass: All Clear Mega ≥ plain Mega + 0.3 LU, both −17 to −15, every TP ≤ −1 dBFS.

**Step-down rule.** Apply one step at a time and re-capture after each:
- If any run's TP reads above −2.0 dBFS, drop the All Clear bloom to −11.
- If the TP is still above −2.0 dBFS, drop the All Clear bodies / tinks to −11 / −15. The ladder stack is the All Clear's peak.
- If a plain Mega TP reads above −2.0 dBFS, drop the Mega held note to −8.
- If All Clear Mega is less than 0.3 LU above plain Mega and its TP is ≤ −2.5 dBFS, raise the All Clear bloom by 1 dB, up to −8.
