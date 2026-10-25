# Gloop Pop: Game Design Document

Version 1.0, 25 Oct 2026. Owner of this file: lead designer. Coding agents must not edit it except to fix typos (see AGENTS.md).

Source of truth for *why*: `docs/research/virality.md` (cited below as "research §n" and "R1–R22").
Source of truth for *how it looks and sounds*: `docs/art/style-guide.md` (cited as "SG §n").

---

## 1. Name and pitch

- **Name:** Gloop Pop
- **Repo slug / URL path:** `gloop-pop` (GitHub Pages: `https://<owner>.github.io/gloop-pop/`)
- **Name check:** a web search on 25 Oct 2026 found no game called "Gloop Pop" (nearest hits: "Gloop Drop", an iOS catcher game, and "Glopop", a small itch.io game). Neither is famous and neither is a block puzzle. The name is two short rhyming words a child can say, and it says what the twist does.
- **The characters:** the pieces are jelly sweets with faces called **gloops**. Each colour is a sweet flavour.

**One-sentence pitch (R1):** Drag jelly blocks onto the board to fill rows, and when same-colour jellies touch they join into one big gloop that pops all at once.

**Two-sentence version:** Gloop Pop is the Block Blast puzzle you already know (place three pieces, fill a row or column, it clears) starring squishy jelly sweets with faces. Jellies of the same flavour stick together into bigger and bigger gloops, and clearing a line through any part of a gloop pops the whole thing, so you can build a giant cherry gloop and blow up half the board with one piece.

---

## 2. The cloned loop and the twist

### 2.1 Cloned loop: Block Blast / 1010!
- 8×8 board, a tray of 3 pieces, no timer, no rotation.
- Drag a piece onto empty cells. Any full row or full column clears.
- When all 3 tray pieces are placed, 3 new ones are dealt.
- The run ends when none of the remaining tray pieces fits anywhere.
- Consecutive clears build a combo.

This loop is proven at the largest scale in casual games: about 210M installs in 2024 and 40M daily players (research §1, Block Blast). Its depth comes from a shared visual object with no vocabulary: "space has shape", and the visible tray gives a planning horizon without a tutorial.

### 2.2 The twist: gloops (same-flavour merge and whole-gloop pop)
1. Every piece has one of up to 7 flavours (colours).
2. Orthogonally touching cells of the same flavour are drawn as **one jelly body with one face**. That connected group is a **gloop**. A gloop grows as you place more same-flavour pieces against it, and its face gets bigger (SG §6.4).
3. When a move clears lines, **every gloop that has at least one cell in a cleared line pops completely**, including its cells outside the line.
4. Popped cells outside the cleared lines score pop points (§5). Big gloops get a named bonus: Big Pop (8+ cells), Huge Pop (15+), Mega Pop (24+).
5. There is no gravity and no cascade. Popping removes cells; it never fills lines. One move resolves in one step, so it is always predictable.

**Why this twist deepens the loop:** Block Blast's only question is "where does this shape fit?". Gloop Pop adds a second question the player can see: "where does this *colour* fit?". The best spot for the shape is often the wrong spot for the colour. Building a big gloop is a gamble: it clogs the board until you cut a line through it, and then it clears far more space than a normal clear. That is the low floor, high ceiling of R7: beginners get surprise pops for free; experts farm one flavour for a Mega Pop.

**Why it doesn't complicate the first minute:** the rules a new player needs are unchanged (fill a row, it clears). Merging is purely visual until it pays off, and the payoff (more stuff disappears, bigger numbers) is self-explanatory. The tutorial shows it once, by doing (§12, step 3). While dragging, the preview outlines every gloop that would pop (SG §8.4), so the rule is visible before the player commits.

### 2.3 Why this loop (tied to the research)
| Research finding | How the Block Blast loop + gloops uses it |
|---|---|
| Familiar frame explains rules for free (§2.6, R8) | "Fill a row to clear it" is known to hundreds of millions of players from Tetris and Block Blast. Jelly sweets that stick together is physical intuition: sticky things stick. |
| Low floor, high ceiling (§2.5, R7) | First move is obvious; mastery is planning 3 pieces ahead for both shape and colour. Uncapped score. |
| Reward beat every 5–20 s (§2.4, R6) | A clear happens every 2–4 moves (≈6–12 s). Pops of 8+ cells happen every 1–3 minutes; Mega Pops and All Clears are rare highlights. |
| Clip-worthy chain moments (§2.9, R11) | A Mega Pop ripples across the board cell by cell from the cleared line (SG §9.4). It reads with the sound off and fits a 9:16 crop because the game is portrait. |
| Characterful pieces (§2.14, R13) | Gloops have faces that react, look at your finger, worry when the board fills and cheer when they pop. A gloop's face grows with its size, like Suika's fruit ladder. |
| No timer, so streamers can talk (Suika, §1) | No timer in Classic or Daily. |
| Deterministic, fair daily (Wordle, §1, R9) | Grid logic is integer-only and seeded, so the daily is identical on every device. Physics games can't promise that. |
| Juice turned 2048 into the hit (§1) | The art and juice spec (SG §9) is half the product. |
| Session 3–8 minutes (R16) | Block-puzzle runs end on board lock; the difficulty curve (§8) is tuned so median Classic runs last 4–7 minutes. |

### 2.4 Rejected alternatives
1. **Suika Game (merge-drop physics).** Huge streamer appeal, but its fun comes from floating-point physics. Physics results differ across browsers and frame rates, so a worldwide same-seed daily (R9) would not be fair. Physics also costs more CPU on mid-range phones (R22) and the market is flooded with Suika clones.
2. **2048 / Threes.** A web hit, but it is free everywhere already, each move has little juice potential (one tile slides), a skilled run takes 20+ minutes (breaks R16), and there's no natural big chain moment for clips (R11).
3. **Flappy Bird (one-tap dexterity).** Perfect R2/R4 behaviour, but runs last 5–60 seconds (breaks R16), the only progression is the score (weak R15), and frustration rather than satisfaction is the main emotion. A daily seed adds little because the obstacles matter less than reflexes.
4. Also not chosen: Wordle-likes (needs word lists and localisation, and only one play per day isn't "highly addictive"), Slither.io-likes (need a server), and anything in the owner's existing genres (Vampire Survivors-likes, Hole.io-likes, garden/idle/mutation, memory puzzles). Gloop Pop has none of those mechanics.

---

## 3. Full rules

### 3.1 Board and coordinates
- Board: 8 columns × 8 rows. Cell `(r, c)`, `r` = row 0 (top) to 7 (bottom), `c` = column 0 (left) to 7 (right). Index `i = r * 8 + c`.
- A cell holds `0` (empty) or a flavour id `1..7`.

### 3.2 Flavours
| id | key | Name on screen | Emoji (share text) | Topper (SG §6.3) |
|---|---|---|---|---|
| 1 | cherry | Cherry | 🍒 | stem with leaf |
| 2 | orange | Orange | 🍊 | small leaf |
| 3 | lemon | Lemon | 🍋 | pointed nub |
| 4 | apple | Apple | 🍏 | sprout with two leaves |
| 5 | blueberry | Blueberry | 🫐 | five-point crown |
| 6 | grape | Grape | 🍇 | curly tendril |
| 7 | bubblegum | Bubblegum | 🍬 | bubble |

### 3.3 Pieces
- A piece is a fixed polyomino in a fixed orientation plus one flavour. The player cannot rotate pieces.
- Piece families (each orientation is a separate catalogue entry; see §7.1 for the full list):

| Family | Cells | Orientations |
|---|---|---|
| Dot | 1 | 1 |
| I2 | 2 | 2 (horizontal, vertical) |
| I3 | 3 | 2 |
| I4 | 4 | 2 |
| I5 | 5 | 2 |
| O2 (2×2 square) | 4 | 1 |
| O3 (3×3 square) | 9 | 1 |
| R23 (2×3 rectangle) | 6 | 2 |
| L3 (small corner) | 3 | 4 |
| L4 (tetromino L and J) | 4 | 8 |
| T4 | 4 | 4 |
| S4 (S and Z) | 4 | 4 |
| L5 (big 3×3 corner) | 5 | 4 |

Total: 13 families, 37 orientations.

### 3.4 A turn
1. The tray has 3 slots. Each holds a piece or is empty.
2. The player drags any tray piece onto the board. It may be dropped where every one of its cells lands on an empty board cell inside the board. Otherwise it returns to its slot (no penalty).
3. After placement, resolve (§3.5).
4. If all 3 slots are now empty, deal a new tray (§7).
5. Check for game over (§3.6).

### 3.5 Resolution of one placement (order matters, all integer, deterministic)
1. Write the piece's flavour into its cells.
2. Find full rows and full columns. `L` = set of cleared lines, `n = |L|`. `C` = set of cells in those lines.
3. If `n = 0`: no clear. Go to step 7.
4. Compute gloops on the board **as it is now** (after placement, before removal): connected components of equal non-zero flavour, 4-neighbour.
5. Popped gloops = gloops with at least one cell in `C` **and** at least one cell outside `C`. `P` = cells of popped gloops not in `C` (the extra popped cells).
6. Remove all cells in `C ∪ P`.
7. Update score and combo (§5, §6). If the board is now empty, award All Clear.

### 3.6 Game over
- After step 5 of §3.4, if no piece in the tray fits anywhere on the board, the player is **stuck**.
- Classic and Zen: if a rescue is available, offer it (§3.7). Zen never ends (§9.3).
- Otherwise the run ends: game-over screen (§13).
- Daily ends when stuck **or** when all 30 trays are placed.

### 3.7 Rescue (once per run, earned by play: R18)
- Classic only. Not in Daily or Expert. In Zen, a free automatic version is used (§9.3).
- **Charge:** the rescue charges as you clear lines: it is ready after **10 lines cleared** in the current run. The HUD shows a ring with 10 ticks (SG §11.6).
- **Offer:** when stuck and the rescue is ready and unused, show the rescue panel (§13.1). Two buttons: "Use rescue" and "No thanks".
- **Effect:** (1) pop the single largest gloop on the board (ties: the one containing the lowest cell index). This scores nothing and does not change the combo. (2) Replace the tray with 3 new pieces that are guaranteed to all fit in some order (§7.4, rule F4). The run continues.
- A run can use at most one rescue. After use the ring shows "Used".

---

## 4. Modes overview
| Mode | Unlock | Ends when | Rescue | Best score saved | Rewards |
|---|---|---|---|---|---|
| Classic | Start | Stuck | Yes, once | Yes | ×1 |
| Daily | Start | Stuck, or 30 trays done | No | Per day | ×1 + daily bonus |
| Zen | Level 3 | Player taps "End run" | Automatic shake | No | ×0.5 |
| Expert | Level 8 | Stuck | No | Yes, separate | ×1.5 |

Details in §9 (Classic, Zen, Expert) and §10 (Daily).

---

## 5. Scoring (exact)

Per placement:

```
placePoints = number of cells in the placed piece           (1 per cell, never multiplied)

lineBase    = 100 × n × (n + 1) / 2                         (n = lines cleared this move)
              n: 1 → 100, 2 → 300, 3 → 600, 4 → 1000, 5 → 1500, 6 → 2100 ...
popPoints   = 20 × |P|                                      (extra popped cells)
              Daily only: cells of the Flavour of the Day score 40 each instead of 20.
bigPopBonus = sum over popped gloops g with total size s (cells on board at step 4, including cells in C):
              s ≥ 24 → 1500 (Mega Pop)
              s ≥ 15 → 600  (Huge Pop)
              s ≥ 8  → 200  (Big Pop)
              else   → 0
allClear    = 2000 if the board is empty after removal, else 0

comboMult   = min(10, 1 + 0.5 × (C − 1))                    (C = combo count after this move, ≥ 1 when n ≥ 1)

movePoints  = placePoints + round((lineBase + popPoints + bigPopBonus + allClear) × comboMult)
```

- If `n = 0`, `movePoints = placePoints`.
- `round` is round-half-up on non-negative numbers (`Math.floor(x + 0.5)`).
- Score is an integer, unbounded (stored as a JS number; safe up to 2^53).

**Worked example (put in a unit test):** combo is 2 before the move. The player places an L4 (4 cells) that completes 1 row and 1 column (n = 2). A 12-cell cherry gloop touches the row and has 9 cells outside C. Combo becomes 3, mult = 2.0.
`4 + round((300 + 180 + 200 + 0) × 2.0) = 4 + 1360 = 1364`.

**Second example:** combo 0 before. Place a Dot completing 1 row, no gloops outside C, board not empty. Combo becomes 1, mult 1.0. `1 + 100 = 101`.

---

## 6. Combo system

- `C` = combo count, starts at 0. `fuse` = 3 when a combo is active.
- A move that clears ≥ 1 line: `C = C + 1`, `fuse = 3`.
- A move that clears nothing while `C ≥ 1`: `fuse = fuse − 1`. If `fuse` becomes 0: `C = 0` ("Combo lost").
- In words shown to the player (How to Play): **"Clear a line at least once every 3 pieces to keep your combo."**
- HUD: "Combo 4" plus 3 fuse pips (filled = moves left). Hidden when `C = 0`. When `fuse = 1` the last pip blinks (SG §11.5).
- Multiplier: `1 + 0.5 × (C − 1)`, cap ×10 at C = 19. The HUD shows "Combo 4 ×2.5" so the multiplier is never hidden.
- Feedback tiers (visual + audio detail in SG §9.6 and §13):

| Tier | C | Name shown in the pop text | Effect summary |
|---|---|---|---|
| 0 | 1–2 | — | standard clear |
| 1 | 3–4 | "Combo 3" | orange text, extra sparkles |
| 2 | 5–7 | "Combo 5" | background bokeh pulse, bigger wobbling text |
| 3 | 8–11 | "Combo 8" | screen-edge glow, music filter opens, gloops get star eyes |
| 4 | 12+ | "Combo 12" | rainbow edge, confetti rain, music arpeggio layer |

- When a combo of 5+ is lost, show "Combo lost" in grey under the board for 900 ms (honest feedback, no sting sound louder than the place sound).

---

## 7. Piece generation and fairness

### 7.1 Catalogue (ids are stable; tests rely on them)
Cells are listed as `(row, col)` offsets from the piece's top-left bounding box corner.

| id | family | cells |
|---|---|---|
| 0 | Dot | (0,0) |
| 1 | I2h | (0,0)(0,1) |
| 2 | I2v | (0,0)(1,0) |
| 3 | I3h | (0,0)(0,1)(0,2) |
| 4 | I3v | (0,0)(1,0)(2,0) |
| 5 | I4h | (0,0)…(0,3) |
| 6 | I4v | (0,0)…(3,0) |
| 7 | I5h | (0,0)…(0,4) |
| 8 | I5v | (0,0)…(4,0) |
| 9 | O2 | (0,0)(0,1)(1,0)(1,1) |
| 10 | O3 | all of 3×3 |
| 11 | R23h | 2 rows × 3 cols |
| 12 | R23v | 3 rows × 2 cols |
| 13 | L3a | (0,0)(1,0)(1,1) |
| 14 | L3b | (0,0)(0,1)(1,0) |
| 15 | L3c | (0,0)(0,1)(1,1) |
| 16 | L3d | (0,1)(1,0)(1,1) |
| 17 | L4a | (0,0)(1,0)(2,0)(2,1) |
| 18 | L4b | (0,0)(0,1)(0,2)(1,0) |
| 19 | L4c | (0,0)(0,1)(1,1)(2,1) |
| 20 | L4d | (0,2)(1,0)(1,1)(1,2) |
| 21 | J4a | (0,1)(1,1)(2,0)(2,1) |
| 22 | J4b | (0,0)(1,0)(1,1)(1,2) |
| 23 | J4c | (0,0)(0,1)(1,0)(2,0) |
| 24 | J4d | (0,0)(0,1)(0,2)(1,2) |
| 25 | T4a | (0,0)(0,1)(0,2)(1,1) |
| 26 | T4b | (0,1)(1,0)(1,1)(2,1) |
| 27 | T4c | (0,1)(1,0)(1,1)(1,2) |
| 28 | T4d | (0,0)(1,0)(1,1)(2,0) |
| 29 | S4h | (0,1)(0,2)(1,0)(1,1) |
| 30 | S4v | (0,0)(1,0)(1,1)(2,1) |
| 31 | Z4h | (0,0)(0,1)(1,1)(1,2) |
| 32 | Z4v | (0,1)(1,0)(1,1)(2,0) |
| 33 | L5a | (0,0)(1,0)(2,0)(2,1)(2,2) |
| 34 | L5b | (0,0)(0,1)(0,2)(1,0)(2,0) |
| 35 | L5c | (0,0)(0,1)(0,2)(1,2)(2,2) |
| 36 | L5d | (0,2)(1,2)(2,0)(2,1)(2,2) |

### 7.2 Stages and weights (Classic)
Stage is set by the current run score and never goes down within a run.

| Stage | Score from | Flavours in play |
|---|---|---|
| 1 | 0 | 5: cherry, orange, lemon, apple, blueberry |
| 2 | 1,500 | 5 |
| 3 | 4,000 | 6: + grape |
| 4 | 7,000 | 6 |
| 5 | 11,000 | 7: + bubblegum |
| 6 | 18,000 | 7 |

Family weights per stage (a family's weight is split equally across its orientations):

| Family | S1 | S2 | S3 | S4 | S5 | S6 | D (Daily) |
|---|---|---|---|---|---|---|---|
| Dot | 6 | 4 | 3 | 2 | 1 | 1 | 3 |
| I2 | 10 | 8 | 6 | 3 | 2 | 1 | 6 |
| I3 | 10 | 9 | 8 | 5 | 3 | 2 | 8 |
| I4 | 6 | 7 | 7 | 6 | 5 | 4 | 7 |
| I5 | 3 | 4 | 5 | 6 | 6 | 7 | 5 |
| O2 | 10 | 9 | 8 | 5 | 3 | 2 | 8 |
| O3 | 2 | 3 | 4 | 5 | 6 | 7 | 4 |
| R23 | 3 | 4 | 5 | 6 | 6 | 7 | 5 |
| L3 | 12 | 10 | 9 | 5 | 3 | 2 | 9 |
| L4 | 8 | 9 | 9 | 11 | 12 | 12 | 9 |
| T4 | 6 | 7 | 8 | 11 | 12 | 12 | 8 |
| S4 | 3 | 5 | 6 | 13 | 18 | 20 | 6 |
| L5 | 3 | 4 | 5 | 7 | 8 | 9 | 5 |

Flavour of each piece: uniform among the flavours in play.

Why S4–S6 look like this (balance pass, 25 Oct 2026): each piece is one flavour, so a placed piece is already a gloop, and a line through any part of it pops the rest. Line clears remove whole pieces, so the board rarely fills. Big pieces barely add difficulty: a big piece is a big gloop and is gone after the next line through it. What ends runs is awkward 4-cell shapes (L4, T4, S/Z) with few small fixers (Dot, I2, L3, O2) to fill the gaps they leave. Column D (Daily) is unchanged.

### 7.3 RNG consumption order (determinism)
All randomness in a run comes from one `sfc32` stream (architecture §4) seeded at run start. For each tray deal the generator consumes, in order: for each attempt (max 30): 3 × (1 family pick, 1 orientation pick, 1 flavour pick), plus 3 values for each F3 redraw (§7.4), then 1 value for the F2 coin flip. The coin flip is drawn even when `p` is 0 or 1. The fallback (§7.4) uses no randomness. Cosmetic randomness (particles, blink timing, shake direction) uses a separate non-seeded RNG and never touches the run stream.

### 7.4 Fairness rules (Classic, Zen, Expert)
- **F1 (always):** at least one piece in a new tray fits the board at deal time.
- **F2 (solvable tray, probabilistic):** with probability `p` the tray must be fully placeable: there is an order and positions for all 3 pieces (simulating clears and pops between them) such that all 3 fit. `p` by stage: S1 1.0, S2 1.0, S3 0.5, S4–S6 0 (F1 only). Expert: 0.9 always. Zen: 1.0 always.
- **F3 (shape caps):** at most one O3 per tray. In S1–S2, at most one piece of 5+ cells per tray.
- **F4 (rescue tray):** after a rescue, the tray must satisfy F2 with `p = 1`.
- **Procedure:** draw a candidate tray (respecting F3 by redrawing the offending slot, max 10 redraws per slot). Test the required condition (F1, or F2 if the coin flip says so). Accept the first candidate that passes, up to 30 attempts. If all 30 fail: take the last candidate and replace pieces from slot 2 down to slot 0, one at a time. In each slot, try every piece from the largest (by cell count, ties by lower id) down to the Dot, and stop as soon as the tray passes. If no piece makes it pass, leave a Dot in that slot and move to the next slot. If even three Dots cannot satisfy F2, require only F1 and repeat (a Dot always fits, because a full board would already have cleared).
- **The generator never searches for pieces that do *not* fit.** It only ever helps. This is stated in How to Play: "New pieces always include at least one that fits."
- **Solver budget:** the F2 check is a depth-first search over orders × positions with early exit, capped at 200,000 placement tests; if the cap is hit, treat the tray as passing F1-only and record it in debug stats. Target: < 4 ms per deal on a mid-range phone.
- **Solver timing is measured on fixed probes, not on game deals.** The core has no clock, so `npm run sim` times `canPlaceAll` in Node on 12 fixed probe boards with 3 pieces each (`solverProbeCases` in `src/core/sim.ts`) and prints the slowest as "max solver time". The game itself never times the solver.

### 7.5 Daily generation
- Daily uses weights column **D** and 6 flavours (cherry to grape) for all 30 trays, with F3 only (no board-dependent checks), so every player gets exactly the same pieces in the same order no matter how they play.
- Starting board: 4 pieces drawn from {I2h, I2v, I3h, I3v, L3a–d, O2} with random flavours, each dropped at a random position where it fits, rejecting any position that would make a full line. 8–16 filled cells. Uses its own sub-stream (architecture §4.3).

---

## 8. Difficulty curve and pacing

- **0–60 s (Stage 1):** small friendly pieces, 5 flavours (merges happen by accident), every tray fully placeable. Nearly every placement is safe. The player sees their first clear within 3 moves and usually their first pop within 2 minutes.
- **1–3 min (Stage 2–3):** longer bars and big corners appear. At 4,000 points grape joins in: toast "Stage 3: grape joins in". Half of Stage 3 trays are guaranteed solvable. Merges get rarer, so big gloops become a deliberate plan.
- **3–6 min (Stage 4–5):** from 7,000 points L, T and S/Z shapes are common and small fixer pieces are rare. No tray is guaranteed solvable any more (F1 only). At 11,000 bubblegum arrives. Most runs end here.
- **6+ min (Stage 6, from 18,000):** expert territory. The score ceiling is unbounded, but even very strong play ends (see the balance result below).
- Stage toasts (exact strings in §16.4) appear for 1.6 s above the board. Each stage also changes the background: the moon rises one step per stage (SG §7.3).
- **Session target:** Classic median 4–7 min, 90th percentile ≤ 12 min; Daily median 3–5 min (90 placements max). Verified by the balancing simulation (milestones M9.3): a greedy bot (architecture §9.3) should reach a median of 90–150 placements in Classic and a median run score of 8,000–20,000.
- **Tuning knobs, in the order to change them:** (1) F2 probability by stage, (2) stage score thresholds, (3) family weights (since 25 Oct 2026 the strong ones are S4/T4/L4 up and Dot/I2/L3/O2 down; O3/I5/L5 mostly add score, not difficulty), (4) flavour count per stage. Never touch the scoring formula to tune run length.
- **Balance pass result (25 Oct 2026),** `npm run sim` with the bot from architecture §9.3, 100 runs per seed:

| Mode | Seed | Median placements | p10 / p90 placements | Under 25 placements | Median score | Runs at the cap |
|---|---|---|---|---|---|---|
| Classic | 1 | 114 | 43 / 203 | 2% | 17,073 | 0 |
| Classic | 2 | 120 | 43 / 184 | 1% | 17,577 | 0 |
| Classic | 3 | 116.5 | 44 / 180 | 1% | 17,244 | 0 |
| Expert | 1 | 68 | 20 / 188 | 16% | 11,216 | 0 |
| Expert | 2 | 110 | 19 / 262 | 12% | 20,006 | 0 |
| Expert | 3 | 77 | 20 / 160 | 12% | 12,104 | 0 |
| Zen | 1 (20 runs) | 10,000 (cap) | 10,000 / 10,000 | 0% | 1,436,585 | 20 of 20 (Zen has no game over) |

  Expert's typical median (seeds 4 and 5: 66.5 and 72.5) is about 60% of Classic's. Before this pass Classic had a median of 9,073 placements and 21 of 50 runs hit the 10,000 cap. A bot that always plays its best move (a very strong player) now reaches a median of 446 placements in Classic (p90 951; all 40 test runs ended before 3,000).

---

## 9. Modes

### 9.1 Classic
Endless. Rules as in §3. Stages §7.2. Rescue once. The app opens into Classic (§12). The current run autosaves after every move and resumes on reload.

### 9.2 Expert (unlocks at Level 8)
- Stage 5 weights from the start, Stage 6 weights from 15,000 points. 7 flavours always. F2 `p = 0.9`, tuned so Expert's bot median is about 60% of Classic's (§8). No rescue.
- Separate best score. XP and coins ×1.5.
- Mode card text: "Expert. Bigger pieces and all 7 flavours from the start. No rescue."

### 9.3 Zen (unlocks at Level 3)
- Stage 2 weights forever, 5 flavours, F2 `p = 1.0`, no game over.
- When stuck: an automatic **shake** happens after a 600 ms pause. The 2 largest gloops pop (no points), the combo resets to 0, and a fresh F4 tray is dealt. Toast: "Shake! Two gloops popped to make room."
- The pause menu has "End run". Ending banks XP and coins at ×0.5. No best score, no score achievements. Line, pop and collection achievements still count.
- Mode card text: "Zen. No game over. Relax and pop."

### 9.4 Daily
See §10.

---

## 10. Daily challenge

### 10.1 Day and number
- The day is the **UTC** date (everyone worldwide plays the same board at the same time, research §1 Wordle).
- `dayKey = "YYYY-MM-DD"` (UTC).
- **Epoch:** 2026-10-25 (launch day) is Daily **#1**. `dayNumber = floor((Date.UTC(y, m−1, d) − Date.UTC(2026, 9, 25)) / 86,400,000) + 1`. If the result is < 1, use 1.
- Next daily countdown: time until the next UTC midnight, shown as `HH:MM:SS`.

### 10.2 Seed
- `seedString = "gloop-pop/daily/v1/" + dayKey`
- `cyrb128(seedString)` → four uint32 → `sfc32` state. Call the generator 12 times and discard (warm-up).
- Sub-streams: board stream = `cyrb128(seedString + "/board")`, tray stream = `cyrb128(seedString + "/trays")`, flavour-of-day stream = `cyrb128(seedString + "/fod")`.
- **Flavour of the Day:** one of the 6 daily flavours. Its popped cells score 40 instead of 20. Shown on the daily card: "Today: Grape pops score double."
- Unit test: a pinned dayKey must always produce the same starting board and first 3 trays (golden snapshot).

### 10.3 Structure
- Starting board per §7.5, 30 trays (90 pieces), no rescue, combo rules as normal.
- Ends when stuck or when tray 30 is fully placed. If tray 30 is completed, the result says "All 30 trays placed!"

### 10.4 Attempts
- **One counted attempt per day.** It starts when the first piece of the day is placed. State saves after every move; reloading resumes the attempt. There is no restart; the pause menu has "Give up" (confirm: "End today's run? It will count as your daily.").
- After the counted attempt: the Daily card shows the result and "Practice (not counted)". Practice runs replay the same seed, give normal per-run XP/coins without the daily bonus, and never change the daily record, streak or share text.
- A run that starts before UTC midnight counts for the day it started.

### 10.5 Daily rewards
- Counted attempt finished: normal run XP/coins **plus 100 XP and 30 coins**, and the streak updates (§11).

### 10.6 Share text (R10)
Built only from the counted attempt. Each tray becomes one emoji:

| Emoji | Meaning |
|---|---|
| ⬛ | tray not reached (run ended early) |
| ⬜ | no lines cleared in this tray |
| 🟩 | 1 line |
| 🟨 | 2–3 lines |
| 🟧 | 4–5 lines |
| 🟥 | 6+ lines |
| 🟪 | this tray had an All Clear or a pop of 15+ cells (overrides the line colour) |

A tray that is partly placed when the run ends counts as reached. Format (10 emoji per line, 3 lines, en-US number format, no hashtags, no "https://"):

```
Gloop Pop Daily #12 🍇
Score 8,450 · Best combo 7
🟩🟩⬜🟨🟩⬜🟧🟩🟩🟥
🟩⬜🟩🟩🟨🟪⬜🟩🟨🟩
🟩🟩🟨⬜🟩🟩🟩🟩⬛⬛
🔥 5-day streak
owner.github.io/gloop-pop
```

- Line 1: game name, day number, Flavour of the Day emoji.
- Line 2: score, best combo in the run (omit " · Best combo N" if it was below 2).
- Lines 3–5: tray grid.
- Line 6: `🔥 N-day streak` only if streak ≥ 2.
- Last line: `location.host + base path` without protocol or trailing slash.
- Share button: `navigator.share({ text })` if available, otherwise copy to clipboard and show toast "Copied! Paste it anywhere."

### 10.7 PNG share card (optional button "Share image")
1080 × 1350 canvas (4:5), drawn by `src/render/shareCard.ts` using the equipped theme. Layout in SG §12. Shared with `navigator.share({ files: [File] })` when `navigator.canShare({ files })` is true, otherwise downloaded as `gloop-pop-daily-12.png`.

---

## 11. Streak and freezes

- **Streak** = consecutive UTC days on which the counted Daily was finished.
- On finishing today's counted Daily: if `lastDay = today − 1` (or freezes covered the gap, below) then `streak += 1`, else `streak = 1`. Set `lastDay = today`. `bestStreak = max(bestStreak, streak)`.
- **Freezes** (R9 "gentle repair, earned through play"): you hold 0–2.
  - +1 freeze each time the streak reaches a multiple of 7 (7, 14, 21, …).
  - +1 freeze for completing the weekly goal.
  - Never sold, never bought with coins.
- **Applying freezes** (checked on app load and before updating the streak): `gap = today − lastDay`. If `gap ≥ 2`, `missed = gap − 1`. If `freezes ≥ missed`: `freezes −= missed`, record those days as frozen (❄️ in the calendar), keep the streak, and set `lastDay = today − 1` so finishing today continues it. Otherwise `streak = 0` (freezes are kept).
- Toasts: "A freeze saved your 12-day streak." / "Your streak ended at 12 days. Play today to start a new one."
- Home screen shows a 7-day strip (Mon–Sun of the current UTC week): ✓ played, ❄️ frozen, empty circle for not yet, dot for today.

---

## 12. Weekly goal (R20)

- Week = ISO week starting Monday 00:00 UTC. `weekIndex = floor((mondayUTC − Date.UTC(2026, 9, 19)) / 604,800,000)` (2026-10-19 is a Monday, so launch day Sun 2026-10-25 is in week 0 and Mon 2026-10-26 starts week 1).
- Goal = `WEEKLY_POOL[weekIndex mod 8]` in this fixed order:

| # | id | On-screen text | Target |
|---|---|---|---|
| 0 | lines | Clear 150 lines | 150 |
| 1 | pops | Pop 300 popped cells | 300 |
| 2 | score | Score 60,000 points in total | 60,000 |
| 3 | combo6 | Reach combo 6 in 5 different runs | 5 |
| 4 | bigpops | Make 10 Big Pops (8+ cells) | 10 |
| 5 | dailies | Finish 4 daily challenges | 4 |
| 6 | allclear | Empty the board 2 times | 2 |
| 7 | multi | Clear 2+ lines with one piece 25 times | 25 |

- Progress counts in Classic, Expert, Daily (counted and practice) and Zen, except the `score` goal, which ignores Zen.
- Reward on completion (claimed automatically, toast "Weekly goal done! +200 coins, +150 XP, +1 freeze"): 200 coins, 150 XP, 1 freeze (if under the cap of 2).
- The Home card shows text, a progress bar "87 / 150" and "Resets in 3 days" (or "Resets in 5 hours" under 24 h).

---

## 13. Game over, rescue and near-miss (R4, R5)

### 13.1 Rescue panel (Classic, when stuck with rescue ready)
- Title: "Out of room!"
- Body: "Use your rescue? It pops your biggest gloop and gives you 3 pieces that fit."
- Buttons: "Use rescue" (primary), "No thanks" (secondary). Keyboard: Enter = use, Esc = no thanks.

### 13.2 Stuck choreography (timings in SG §9.8)
0–450 ms: the pieces that don't fit shake and look sad; board gloops look worried. At 450 ms the game-over panel slides up. Pressing Space, Enter or R at any point from 0 ms restarts immediately (R4: under 1 s, one tap).

### 13.3 Game-over panel
- Title: "No room left" (Daily: "Daily #12 done"; Daily with all trays: "All 30 trays placed!")
- Big score. Under it: "Best 14,210" or, if new, a gold "New best!" badge.
- Up to **2 near-miss lines** (rules below).
- Rewards row: "+142 XP" with the XP bar filling, "+55 coins". Level-ups show "Level 7!" inline.
- Buttons: "Play again" (primary, large, focused; Daily counted: "Practice"), "Home", and on Daily "Share". Classic also shows a small "Share score" text button. Layout: the primary button is full width; the share actions ("Challenge a friend", "Share image"; Daily: "Share") sit side by side under it as smaller secondary buttons; "Home" is a text button at the bottom, the same as on the Daily result screen.
- The panel never blocks: "Play again" is clickable as soon as it appears, and reward animations continue in the background of the next run's first frame (they are just toasts).

### 13.4 Near-miss messages (honest, computed from real state)
Evaluate in this order; show the first two that apply:

1. New best: **"New best! {d} more than before."** (d = score − old best)
2. Within 15% of best (not new): **"Only {d} points short of your best."**
3. A tray piece needed exactly 1 more empty cell (for some placement, exactly 1 of its cells overlaps a filled cell): **"Your {piece} needed just 1 more empty cell."** where `{piece}` is a plain shape name: "dot", "2-bar", "3-bar", "4-bar", "5-bar", "small square", "big square", "rectangle", "small corner", "L", "T", "S", "big corner".
4. A row or column was 1 cell from full: **"Row {r} was 1 cell from clearing."** / "Column {c} …" (1-based numbers, top/left = 1).
5. XP to next level ≤ 25% of the level's cost: **"{x} XP to Level {L}."**
6. Weekly goal ≥ 80% done: **"{k} more to finish your weekly goal."**
7. An achievement counter ≥ 80% done (lowest remaining first): **"{k} more {unit} for \"{name}\"."** e.g. "3 more Big Pops for \"Big Pop Pro\"."
8. Fallback: **"Biggest pop this run: {s} cells."** (or "You cleared {n} lines." if no pop)

---

## 14. Meta progression (R15, R17)

### 14.1 XP and levels
- Run XP: `20 + floor(score / 100)`. Multiplier: Expert ×1.5, Zen ×0.5 (floor after multiplying). Daily counted: +100. Weekly goal: +150.
- XP needed to go from level L to L+1: `xpToNext(L) = 60 + 40 × (L − 1)`. L1→2: 60, L2→3: 100, L10→11: 420, L49→50: 1980.
- Total XP to reach level 50: 49,980. **Level cap 50.**
- **Stars (endless long tail):** after Level 50, every 2,500 XP earns 1 Star. Shown as "Lv 50 ★3". Each Star gives 100 coins.
- Expected pace: run 1 reaches Level 2 (a 4,000-point run gives 60 XP). Levels 3–5 in the first session. Level 8 (Expert) after about 12 runs. Level 50 after about 400 runs.

### 14.2 Coins
- Run coins: `5 + floor(score / 200)`, same multipliers as XP.
- Daily counted: +30. Weekly goal: +200. Each level up: +50. Each Star: +100. Achievements: 25 / 50 / 100 by tier (§15).
- Coins are only spent in the Collection. There is no other sink and no way to buy coins.

### 14.3 Level rewards (free, automatic)
| Level | Reward |
|---|---|
| 2 | Pop effect: Hearts |
| 3 | Mode: Zen |
| 5 | Skin: Googly Eyes |
| 8 | Mode: Expert |
| 12 | Skin: Freckles |
| 20 | Theme: Snow Globe |
| 30 | Pop effect: Fireworks |
| 50 | Theme: Golden Dawn, and Stars begin |

### 14.4 Collection (shop) and prices
Themes change the background, board and lighting (SG §14). Skins add an accessory to every gloop (SG §6.6). Pop effects change clear/pop particles (SG §9.3).

| Kind | id | Name | How to get |
|---|---|---|---|
| Theme | midnight | Midnight Candy Shop | Default |
| Theme | sunset | Strawberry Sunset | 600 coins |
| Theme | aquarium | Mint Aquarium | 1,000 coins |
| Theme | observatory | Starlight Observatory | 1,500 coins |
| Theme | kitchen | Cinnamon Kitchen | 2,000 coins |
| Theme | snowglobe | Snow Globe | Level 20 |
| Theme | dawn | Golden Dawn | Level 50 |
| Skin | plain | Plain | Default |
| Skin | googly | Googly Eyes | Level 5 |
| Skin | freckles | Freckles | Level 12 |
| Skin | catears | Cat Ears | 500 coins |
| Skin | glasses | Round Glasses | 700 coins |
| Skin | mustache | Mustaches | 900 coins |
| Skin | bowtie | Bow Ties | 1,200 coins |
| Skin | crown | Crowns | Achievement "Mega Pop" |
| Pop effect | sparkles | Sugar Sparkles | Default |
| Pop effect | hearts | Hearts | Level 2 |
| Pop effect | stars | Stars | 300 coins |
| Pop effect | bubbles | Bubbles | 500 coins |
| Pop effect | confetti | Confetti | 800 coins |
| Pop effect | fireworks | Fireworks | Level 30 |

Total shop price: 10,000 coins. Typical earn rate ≈ 55 coins per run plus bonuses, so the first purchase (Stars, 300) comes in the first session and the full shop takes ~120–150 runs.

Collection UI strings: price button "600 coins", unaffordable: "Need 220 more coins" (disabled), owned: "Use", equipped: "In use", locked by level: "Reach Level 20", locked by achievement: "Get \"Mega Pop\"".

---

## 15. Achievements (40)

Coins: E = 25, M = 50, H = 100. Conditions use run stats or lifetime totals as noted. "Any mode" includes Zen unless marked.

| # | id | Name | Description (on screen) | Condition | Coins |
|---|---|---|---|---|---|
| 1 | first_clear | First Clear | Clear a line. | lines ≥ 1 in a move | E |
| 2 | double | Double | Clear 2 lines with one piece. | n ≥ 2 | E |
| 3 | triple | Triple | Clear 3 lines with one piece. | n ≥ 3 | M |
| 4 | quad | Four at Once | Clear 4 lines with one piece. | n ≥ 4 | H |
| 5 | crossroads | Crossroads | Clear a row and a column with one piece. | ≥1 row and ≥1 column in one move | E |
| 6 | first_pop | Pop! | Pop a gloop by clearing a line through it. | \|P\| ≥ 1 | E |
| 7 | big_pop | Big Pop | Pop a gloop of 8 or more cells. | popped gloop s ≥ 8 | E |
| 8 | huge_pop | Huge Pop | Pop a gloop of 15 or more cells. | s ≥ 15 | M |
| 9 | mega_pop | Mega Pop | Pop a gloop of 24 or more cells. Unlocks Crowns. | s ≥ 24 | H |
| 10 | big_pop_pro | Big Pop Pro | Make 50 Big Pops in total. | lifetime count of s ≥ 8 pops | M |
| 11 | long_gloop | Long Gloop | Grow a gloop to 12 cells. | any gloop size ≥ 12 after a placement | E |
| 12 | one_flavour | One Flavour | Clear a line where all 8 cells are the same flavour. | a cleared line is single-flavour | M |
| 13 | spotless | Spotless | Empty the whole board. | All Clear | M |
| 14 | clean_freak | Clean Freak | Empty the whole board 10 times. | lifetime All Clears ≥ 10 | H |
| 15 | combo5 | On a Roll | Reach combo 5. | C ≥ 5 | E |
| 16 | combo10 | Ten in a Row | Reach combo 10. | C ≥ 10 | M |
| 17 | combo20 | Twenty in a Row | Reach combo 20. | C ≥ 20 | H |
| 18 | score5k | 5,000 Club | Score 5,000 in one Classic run. | Classic score ≥ 5,000 | E |
| 19 | score20k | 20,000 Club | Score 20,000 in one Classic run. | ≥ 20,000 | M |
| 20 | score50k | 50,000 Club | Score 50,000 in one Classic run. | ≥ 50,000 | H |
| 21 | score100k | 100,000 Club | Score 100,000 in one Classic run. | ≥ 100,000 | H |
| 22 | expert25k | Expert 25,000 | Score 25,000 in one Expert run. | Expert score ≥ 25,000 | H |
| 23 | close_call | Close Call | Clear a line when 52 or more cells are filled. | filled count after placement (before removal) ≥ 52 and n ≥ 1 | M |
| 24 | no_help | No Help Needed | Score 20,000 in Classic without using the rescue. | Classic ≥ 20,000, rescue unused | M |
| 25 | saved | Saved! | Use a rescue, then clear a line with the next 3 pieces. | clear within the rescue tray | E |
| 26 | lines100 | Line Worker | Clear 100 lines in total. | lifetime lines ≥ 100 | E |
| 27 | lines1000 | Line Boss | Clear 1,000 lines in total. | ≥ 1,000 | M |
| 28 | lines5000 | Line Legend | Clear 5,000 lines in total. | ≥ 5,000 | H |
| 29 | pops500 | Popper | Pop 500 popped cells in total. | lifetime \|P\| ≥ 500 | E |
| 30 | pops5000 | Pop Star | Pop 5,000 popped cells in total. | ≥ 5,000 | H |
| 31 | runs10 | Regular | Finish 10 runs. | finished runs (any mode, Zen ended counts) ≥ 10 | E |
| 32 | runs100 | Hundred Runs | Finish 100 runs. | ≥ 100 | M |
| 33 | daily1 | Daily Player | Finish a daily challenge. | counted daily finished | E |
| 34 | daily30 | Daily Regular | Finish 30 daily challenges. | ≥ 30 counted | H |
| 35 | streak7 | One Week | Reach a 7-day streak. | streak ≥ 7 | M |
| 36 | streak30 | One Month | Reach a 30-day streak. | streak ≥ 30 | H |
| 37 | weekly1 | Weekly Winner | Finish a weekly goal. | any weekly claimed | M |
| 38 | level10 | Level 10 | Reach Level 10. | level ≥ 10 | E |
| 39 | level50 | Level 50 | Reach Level 50. | level ≥ 50 | H |
| 40 | collector | Collector | Own every theme, skin and pop effect. | all 21 items owned | H |

- Score achievements (18–24) do not count Zen.
- Toast on unlock: "Achievement: Big Pop · +25 coins" (2.4 s, SG §11.8). Several unlocks queue, 0.6 s apart.
- Achievements screen: grid of 40 badges, locked ones show the description and progress when counter-based ("23 / 50").

---

## 16. Onboarding and on-screen text

### 16.1 Principles (R2, R3)
- No title screen, no popups, no login. The first frame shows a live board with the tutorial already set up.
- One short line per step, shown in a speech bubble above the tray. A ghost hand demonstrates and disappears as soon as the player touches a piece.
- Every step is a near-certain win. The player can't fail the tutorial: invalid drops just return the piece.
- "Skip" text button in the top right corner on all steps.

### 16.2 Script (first launch, `tutorialDone = false`)
Timings are from page load. The ghost hand loop: 400 ms fade in on the tray piece, 900 ms drag along a curve to the target, 300 ms hold with a press pulse, 300 ms fade, 500 ms wait, repeat (SG §11.10).

**Step 1: first clear.**
- Board: row 6 (7th from top) filled in columns 0–5: cherry (6,0)(6,1), lemon (6,2)(6,3), blueberry (6,4)(6,5). Everything else empty.
- Tray: only the middle slot: I2h apple.
- At 300 ms: bubble "Drag this piece into the gap." At 600 ms: ghost hand from tray to cells (6,6)(6,7).
- On placing: row clears (+102 points). Bubble "Full rows clear!" for 1,200 ms.
- **No All Clear in steps 1–3.** Each scripted board empties when the player places the piece, but the tutorial never awards All Clear: no +2,000, no `allClear` event, no "First All Clear!" moment (§23.2). The reducer skips All Clear while the run's mode is `tutorial`. Steps 1–3 score 102 + 452 + 922 = 1,476, so step 4 starts below 1,500 in Stage 1.

**Step 2: row and column at once.**
- New cells appear with a 250 ms pop-in (SG §9.1 spawn): column 3, rows 0–5 filled: orange (0,3)(1,3), blueberry (2,3)(3,3), cherry (4,3)(5,3); row 7 filled except (7,3): lemon (7,0)(7,1)(7,2), apple (7,4)(7,5), orange (7,6)(7,7).
- Tray: middle slot: I2v cherry.
- Bubble: "Fill a row and a column at once for more points." Ghost hand to (6,3)(7,3).
- On placing: both lines clear (+452: 2 + 300 × combo 2 multiplier 1.5). Bubble "Two at once!" 1,200 ms.

**Step 3: the gloop pop.**
- Board: a 10-cell apple gloop: (1,1)(1,2)(2,1)(2,2)(2,3)(3,1)(3,2)(3,3)(4,1)(4,2). Row 4 also has (4,0) cherry, (4,3) lemon, (4,4) blueberry, (4,5) orange; (4,6)(4,7) empty.
- Tray: middle slot: I2h cherry.
- Bubble: "Same colours join into one gloop. Clear this row to pop the whole green gloop!" (one line on desktop; wraps to two on phones, which is allowed). The apple gloop's pop outline preview pulses as soon as the piece hovers over the target.
- On placing: row 4 clears, the apple gloop pops with a ripple, "Big Pop!" text. Points: 2 + round((100 + 8 × 20 + 200) × 2.0) = 922 at combo 3 (multiplier 2.0). Always compute with the real formula; never hard-code tutorial scores.
- Bubble: "Big Pop! Bigger gloops score more." 1,500 ms.

**Step 4: real game.**
- Without clearing the board, deal a normal Stage 1 tray of 3 (F2 guaranteed). Tutorial score (1,476) carries over into this Classic run. From step 4 the run is Classic, so All Clear works as normal.
- Bubble: "You get 3 pieces. Place all 3 to get new ones." Disappears when the second piece is placed.
- When the first full tray is placed: bubble "The game ends when nothing fits. Good luck!" for 2,000 ms. Set `tutorialDone = true`.
- After the run ends for the first time, the game-over panel shows one extra line: "Tip: keep clearing to grow your combo."

**Skip:** sets `tutorialDone = true` and starts a fresh Classic run immediately.

### 16.3 Returning players
- On load the app shows the Classic board instantly (resuming a saved run if there is one; otherwise a new run). No menu first.
- If today's daily is not done, the top bar shows the pill "Daily #12" with a dot. If done: "Daily ✓".
- If a streak is at risk (streak ≥ 2, today not played, UTC time after 18:00): the pill reads "Daily #12 · keep your 🔥5".

### 16.4 String table (all player-facing strings live in `src/ui/strings.ts`)
HUD and play:
- Score label (desktop only): "Score"; best: "Best {n}"; combo: "Combo {C} ×{m}" (m with one decimal, "×2.5"; "×10" at cap)
- Combo lost: "Combo lost"
- Daily HUD (under the score): "Tray {k} / 30" and the Flavour of the Day chip "Grape pops ×2"
- Pop texts: "Pop!" (|P| 1–7), "Big Pop!", "Huge Pop!", "Mega Pop!", "All clear!", "Double!", "Triple!", "Quad!", "{n} lines!" (n ≥ 5)
- Stage toasts: "Stage 2: bigger pieces", "Stage 3: grape joins in", "Stage 4: even bigger pieces", "Stage 5: bubblegum joins in", "Stage 6: expert pieces"
- New best during run (first time passing it): "New best!"
- Rescue ring tooltip/aria: "Rescue: clear {k} more lines to charge" / "Rescue ready" / "Rescue used"
- Rescue ring label (always shown next to the ring, so the ring explains itself): "Rescue {n}/10" while charging ({n} = lines cleared, max 10), then "Rescue ready" / "Rescue used"
- Zen shake: "Shake! Two gloops popped to make room."
Pause: title "Paused"; buttons "Resume", "Restart", "Home", "Settings"; Daily: "Give up" instead of "Restart"; Zen: "End run" instead of "Restart".
Restart confirm (Classic with score > 0): "Start over? This run will end." buttons "Start over", "Cancel".
Home:
- Title logo "Gloop Pop"; level chip "Lv 7"; coins chip "1,240"
- Big button "Play" (resumes or starts Classic)
- Mode cards: "Classic", "Endless. How long can you last?"; "Daily #12", "Same board for everyone today." / done: "Done · 8,450 · Next in 05:12:33"; "Zen", "No game over. Relax and pop." / locked "Reach Level 3"; "Expert", "Bigger pieces, all 7 flavours, no rescue." / locked "Reach Level 8"
- Weekly card: "This week: Clear 150 lines", "87 / 150", "Resets in 3 days", reward line "Reward: 200 coins, 150 XP, 1 freeze"
- Game-over XP bar labels: "Level 7" at the left end and "8" at the right end.
- Streak: "🔥 5-day streak", freezes "❄️ 1 freeze" ; no streak: "Play today's daily to start a streak."
- Row buttons: "Collection", "Achievements", "Stats"; footer: "Settings", "How to play"
Daily result: "Daily #12", score, "Best combo 7", "Biggest pop 18", the emoji grid, legend "⬜ no clear · 🟩 1 line · 🟨 2–3 · 🟧 4–5 · 🟥 6+ · 🟪 all clear or huge pop", buttons "Share", "Share image", "Practice (not counted)", "Home", countdown "Next daily in 05:12:33".
Toasts: "Copied! Paste it anywhere.", "Level {L}! +50 coins", "Unlocked: {item}", "Achievement: {name} · +{c} coins", "Weekly goal done! +200 coins, +150 XP, +1 freeze", "A freeze saved your {n}-day streak.", "Your streak ended at {n} days. Play today to start a new one."
Settings: "Sound effects", "Music", "Vibration", "Reduce motion" (options "Match device", "On", "Off"), "Colour-blind patterns", "Show tutorial again", "Reset all progress"; reset confirm: "Delete all progress? Your level, coins, unlocks, stats and streak will be gone. This can't be undone." buttons "Delete everything", "Cancel"; after reset the app reloads into the tutorial.
Collection: tabs "Themes", "Skins", "Pop effects"; item buttons per §14.4.
Stats: see §18.

### 16.5 How to play page (exact text)
1. **Drag pieces onto the board.** Pieces can't be rotated.
2. **Fill a whole row or column to clear it.** Clearing several at once scores much more.
3. **Same colours join into one gloop.** Clear a line through any part of a gloop and the whole gloop pops for bonus points. Gloops of 8+ cells give a Big Pop bonus.
4. **Keep your combo going.** Clear a line at least once every 3 pieces. Each clear in a row raises your multiplier.
5. **You get 3 pieces at a time.** Place all 3 to get new ones. New pieces always include at least one that fits.
6. **The game ends when none of your pieces fit.** In Classic you have one rescue per run: clear 10 lines to charge it.
7. **Daily challenge:** the same board and pieces for everyone, every day. Your first try counts. Share your result with friends.
Controls (desktop): "Drag with the mouse, or press 1, 2, 3 to pick a piece, arrow keys to move it, Space to place. Esc pauses. M mutes."
Scoring table (shown under the text): "Each cell placed: 1 · 1 line: 100 · 2 lines: 300 · 3 lines: 600 · 4 lines: 1,000 · Each popped cell: 20 · Big Pop: +200 · Huge Pop: +600 · Mega Pop: +1,500 · Empty board: +2,000 · Combo multiplies everything except placing."

---

## 17. Screen map and flow

```
Load ──► Play (Classic; tutorial if first launch)
            │  top bar: [☰ Menu] [Daily pill] [🔊 Mute] [⏸ Pause]
            ├─ Pause overlay: Resume · Restart/Give up/End run · Home · Settings
            ├─ Rescue panel: Use rescue · No thanks
            └─ Game over panel: Play again · Home · Share score
                                   (Daily: Share · Practice · Home)
Home ──► Play · Mode cards (Classic, Daily, Zen, Expert) · Weekly card
     ├─► Collection (tabs Themes / Skins / Pop effects; each item: buy / use)  [◀ Back]
     ├─► Achievements (grid of 40; tap badge for details)                   [◀ Back]
     ├─► Stats (numbers + last-20 bar chart)                                [◀ Back]
     ├─► Settings (toggles, Show tutorial again, Reset all progress)        [◀ Back]
     └─► How to play                                                        [◀ Back]
Daily card ──► Play (Daily) ──► Daily result: Share · Share image · Practice · Home
```

- Every screen has a back button top-left (Esc on desktop). Android back / browser back: handled with `history.pushState` per screen, so back closes the current screen instead of leaving the site.
- Menu (☰) during a run pauses the run and opens Home. "Play" on Home resumes it.
- Level-up and unlock moments are toasts, never blocking modals.
- Leaving the tab (visibilitychange hidden) auto-pauses and saves.

---

## 18. Stats screen
Lifetime: Runs played (per mode), Best score (Classic, Expert), Average score (last 20 Classic), Lines cleared, Popped cells, Biggest pop, Best combo, All clears, Pieces placed, Time played (h m), Dailies finished, Best daily score, Current streak, Best streak, Achievements "17 / 40". Chart: last 20 Classic scores as bars (best bar highlighted), drawn on a small canvas.

---

## 19. Session design: first 30 seconds, first 5 minutes, day 5

**First 30 seconds.** The board is live on the first frame. By second 3 the ghost hand shows the move; the first clear lands by second 5 with a squash, a sweep and a "+102". By second 20 the player has made a double clear and a Big Pop with a ripple. Gloops have looked at their finger and cheered. They have not read anything longer than one line.

**First 5 minutes.** A real run with mercy trays: 8–15 clears, a first combo of 3–5 with rising pitch, probably a Big Pop by accident. Stage 2 and 3 toasts show progress, and the moon rises. The first loss shows an honest near-miss ("Your L needed just 1 more empty cell") and the "Play again" button is ready instantly. At the end of run 1: Level 2 (Hearts pop effect unlocked: a visible reward to try right away). Run 2–3: Level 3 unlocks Zen. The Daily pill invites them to play the shared board.

**Day 5.** They have a 4–5 day streak shown with 🔥 and a 7-day strip, are a day or two from their first freeze (day 7), and are about halfway through a weekly goal. They own 2–3 cosmetics and are saving for a theme (600–1,000 coins is 8–15 runs: one or two sessions). They've unlocked Googly Eyes. They now build gloops on purpose and have probably had their first Huge Pop. The daily share is a habit in a group chat; Expert is 2–5 runs away.

**Pacing within a run.** Reward beats: a clear every 2–4 placements (6–12 s), stage toasts at 1.5k, 5k, 12k, 25k, 45k, a rescue offer at the first lock after 10 lines, pops of 8+ every 1–3 minutes. "Play again" is one tap at all times (R16).

---

## 20. Clip-worthy moments the game is built to produce (R11)
1. **Mega Pop:** a 24+ cell gloop with a huge face pops in a ripple from the cleared line, "Mega Pop!" in 72 px, a 450 ms slow-mo and a flavour-coloured flash.
2. **All Clear:** the last cells pop, the board glows, the gloop faces in the tray cheer, "+2,000 × combo" stamps the centre.
3. **Combo 12+ chain:** rainbow edge glow, confetti rain, music arpeggio, pitch climbing with each clear.
4. **Crossing your best:** first time the score passes the best, 450 ms slow-mo, gold "New best!" banner.
5. **The 1-cell loss:** the stuck piece shakes, sad face, "Your 5-bar needed just 1 more empty cell." (rage-clip material, research §1 Flappy Bird).
6. **The long gloop:** a 1×5 + 1×5 + 1×4 grown into a 14-cell cherry snake with a giant face that watches your finger.
7. **Rescue save:** "Out of room!", rescue pops the biggest gloop, then a combo restarts.
8. **Googly Eyes skin:** eyes wobble with physics on every placement and pop: memeable on its own.
9. **Daily share grid** in group chats: a row of 🟥 and 🟪 tells a story without spoilers.

---

## 21. Requirement traceability (R1–R30)

| Req | How Gloop Pop meets it | Where |
|---|---|---|
| R1 One-sentence pitch | "Drag jelly blocks onto the board to fill rows, and when same-colour jellies touch they join into one big gloop that pops all at once." | §1 |
| R2 < 5 s to first input | No title screen; tutorial board live on first frame; ghost hand at 600 ms; JS < 150 KB gz | §16.2, architecture §7 |
| R3 Teach by doing | 4 scripted steps, one line each, ghost hand that disappears on touch | §16 |
| R4 < 1 s game over → play | Panel at 450 ms; Space/Enter/R restart from 0 ms; new run in the same frame | §13.2 |
| R5 Honest near-miss | 8 computed messages from real board, best, XP and goals; never rigged | §13.4, §7.4 |
| R6 Reward beat every 5–20 s | Clear every 6–12 s; combo tiers; Big/Huge/Mega Pops, All Clears every few minutes | §6, §8, §19 |
| R7 Low floor, high ceiling | Fill-a-row is obvious; colour planning on top; uncapped score with ×10 combo | §2.2, §5 |
| R8 Familiar frame | Tetris/Block Blast line clears; sweets that stick together | §2.3 |
| R9 Daily, streak, freeze | UTC seed, #N from 2026-10-25 (launch day), one counted attempt, freezes from 7-day milestones and weekly goals | §10, §11 |
| R10 Spoiler-free share | Emoji tray grid, day number, short URL, PNG card via Web Share or download | §10.6–10.7 |
| R11 Clip-worthy | Mega Pop ripple, slow-mo on best, flashes, huge numbers, portrait 9:16 | §20, SG §9 |
| R12 Thumbnail-readable | 7 saturated flavours on a calm dark board, each with a distinct topper shape and face; patterns for colour-blind mode; 64 px test | SG §5–6 |
| R13 Characterful pieces | Faces with 10 expressions that react to drag, danger, clears and loss; face size grows with gloop | SG §6 |
| R14 Juice everywhere | Squash and stretch, sweep, ripple, particles, shake tiers, combo pitch ladder, haptics | SG §9, §13 |
| R15 Layered progression | Score, XP/levels, coins every run, 21 cosmetics, 2 unlockable modes, 40 achievements | §14, §15 |
| R16 Short sessions | Classic median 4–7 min verified by sim; Daily ≤ 90 placements; one-tap restart | §8 |
| R17 Long tail | Endless score, level 50 + Stars, Expert mode, 40 achievements, Collector | §9.2, §14, §15 |
| R18 Fair, player-favourable | Generator only helps (F1–F4); rescue earned by clearing 10 lines; no ads, IAP, energy or accounts | §3.7, §7.4 |
| R19 No-install web | Static Vite build on GitHub Pages, service worker offline, OG image | architecture §10–11 |
| R20 Return reasons | Daily, streak with freezes, rotating weekly goal | §10–12 |
| R21 Sound respectful | On by default, starts on first input, mute always visible in the top bar, M key | SG §13, §17 |
| R22 Performance | Cached board layer, DPR cap 2 with adaptive drop to 1.5, pooled particles, no per-frame shadowBlur | architecture §6 |
| R23 PB chase bar | Gold progress bar under the score; pulses at 80%; label "{d} to beat your best" | §23.1 |
| R24 First-time moments | One-time banners and coin bonuses for first Big/Huge/Mega Pop, All Clear, combo 5/10 | §23.2 |
| R25 Signature score effect | Candy-flame score at combo 8+ or 2,000+ point moves | §23.3 |
| R26 Hit-stop | 50–70 ms freeze on 3+ lines, Huge/Mega, All Clear | §23.4 |
| R27 Beat my score | Classic/Expert "Challenge a friend" text and image with a ?beat= link; the friend's score becomes the chase bar | §23.5 |
| R28 Streak celebration | Animated flame tick-up, gold milestone flames with confetti | §23.6 |
| R29 Screenshot results | Biggest gloop drawn with its face, best combo, lines | §23.7 |
| R30 Replay | Deferred (deterministic reducer supports it) | §23.8 |

---

## 22. What is deliberately not in the game
No ads, IAP, energy, loot boxes, accounts, backend, leaderboards, push notifications, timers in Classic/Daily, paid streak repair, fake near-misses, or rigged pieces. No link in share text beyond the bare site address (and the `?beat=` score in a Classic challenge). Replays of runs are a later idea (§23.8). No text walls.

---

## 23. Research v2 additions (R23–R30)

Added on 25 Oct 2026 after the deep research pass (docs/research/virality.md v2). Where this section conflicts with an earlier one, this section wins.

### 23.1 Personal-best chase bar (R23, from Block Blast)
- Classic and Expert, once a best exists for that mode: a thin bar under the HUD score block (portrait: full board width, 6 px tall, radius 3, 6 px under the best line; desktop: inside the left panel under "Best", 240 px wide).
- Fill = `min(1, score / best)`, track `ui.panelSolid` at alpha 0.6, fill `ui.gold` at alpha 0.85. It eases to the new value over the score count-up time.
- At ≥ 80% the fill pulses (scale Y 1 → 1.5 → 1, 900 ms loop) and the label "Best 14,210" becomes "{d} to beat your best" (`{d}` = best − score, en-US format).
- When the score passes the best: the bar flashes white for 120 ms, then turns into a full gold bar with a 6-sparkle burst. The label becomes "New best!" (same moment as §20.4).
- **Challenge target (§23.5):** when a friend's challenge is active, the bar chases the friend's score instead, with the label "{d} to beat your friend's score". When the score passes it: banner "You beat your friend!" (40 px gold, same as the New best banner), then the bar switches to the player's own best if that is higher.
- Zen and Daily: no bar. Daily is a fresh board for everyone, and Zen has no stakes.

### 23.2 First-time discoveries (R24, from Threes)
The first time a player ever makes each of these (lifetime, stored in `save.firsts`), the moment gets a one-time banner, a bonus and a hit-stop (§23.4):

| Moment | Banner text (48 px, flavour colour of the gloop or gold) | Bonus |
|---|---|---|
| First line clear | "Nice!" (tutorial step, no bonus) | none |
| First 2+ line clear | "Double!" | 10 coins |
| First Big Pop (8+) | "First Big Pop!" | 20 coins |
| First Huge Pop (15+) | "First Huge Pop!" | 40 coins |
| First Mega Pop (24+) | "First Mega Pop!" | 80 coins |
| First All Clear | "First All Clear!" | 100 coins |
| First combo 5 | "Combo 5! Keep clearing." | 20 coins |
| First combo 10 | "Combo 10!" | 50 coins |

- The banner replaces the normal Big/Huge/Mega text for that one event and stays 1,600 ms (normal: 900 ms). A small "+20 coins" line sits under it. Coins are added to the run's coin total, so the game-over rewards row includes them.
- Daily counted runs also award these (fair: it's a one-time lifetime bonus, not a score change). Score is never affected.

### 23.3 Candy-flame score (R25, from Balatro)
- The HUD score number catches fire when **combo tier ≥ 3** (combo 8+, SG §9.6) or for 1,500 ms after **a single move worth 2,000+ points**.
- Look: 10–16 small teardrop flames (pooled particles) rise from the top edge of the score glyphs. Each flame is a two-stop gradient from the current tier's flavour colour (base) to `ui.gold` (tip), with additive blending, rising 18–30 px over 450–700 ms, swaying ±4 px, and scaling to 0.2. Spawn rate is 22/s at tier 3 and 34/s at tier 4. The score glyph outline turns the flavour colour.
- The flames die out over 400 ms when the combo breaks. Reduced motion: no flames; the score glyphs get a static flavour-coloured outline instead.
- This is the game's signature clip effect, so it must read at 64 px thumbnail size.

### 23.4 Hit-stop (R26, from Nijman's "sleep")
- On resolving a placement that clears **3+ lines**, makes a **Huge or Mega Pop**, or an **All Clear**: freeze the simulation and all tweens for **50 ms** (3+ lines), **70 ms** (Huge, Mega, All Clear, first-time moments), then play the effects. Shake and flash begin on the first frame after the freeze. Slow-mo (SG §9.9) starts after the hit-stop.
- Input during the freeze is queued, not dropped. Reduced motion: no hit-stop.
- Implementation: one `fx.hitStop(ms)` in the FX timeline that sets the effective dt to 0 while it's active.

### 23.5 "Beat my score" challenge (R27, from Flappy Bird, Block Blast and VS)
- **Classic and Expert game-over panels** get a real "Challenge a friend" button (it replaces the small "Share score" text button from §13.3, and sits as the secondary button beside "Play again").
- **Share text:**
```
I scored 8,450 in Gloop Pop 🍒
Biggest pop: 18 cells · Best combo 7
Can you beat it?
owner.github.io/gloop-pop/?beat=8450&f=cherry
```
  - Line 1 shows the flavour emoji of the player's biggest gloop this run (cherry by default).
  - Line 2 omits any part that is below its threshold: a biggest pop under 8, or a best combo under 2. If both are omitted, the line is dropped.
  - Expert runs say "in Gloop Pop Expert".
  - The URL is the only link: no hashtags and no protocol, matching the Daily rule.
- **Image:** "Share image" makes a Classic version of the PNG card (SG §12 layout). It uses the title "Classic" instead of "Daily #12" and the final board instead of the tray grid (a Classic board is no spoiler). The run's biggest gloop is drawn on top with its face at 1.4× scale, plus the score and "Can you beat it?" in 44 px.
- **Receiving:**
  - On load, if `?beat=N` holds a valid integer with 1 ≤ N ≤ 10,000,000 and `f` is a known flavour (otherwise cherry), store `challenge = {score: N, flavour: f}` in session memory (not saved), then strip the query string with `history.replaceState`.
  - Home shows a card at the top: "{Flavour emoji} A friend scored 8,450. Beat it!" with the primary button "Play Classic".
  - In the run, the PB bar (§23.1) chases N, using the label name "your friend's" ("1,200 to beat your friend's score").
  - Beating it shows the "You beat your friend!" banner, and the game-over panel's first near-miss line becomes "You beat your friend by {d}!" or "{d} short of your friend's score." That replaces near-miss rule 1/2 for the run.
  - The challenge stays active until beaten or until the tab closes.
  - A first-time visitor gets the tutorial first (§16.2). The challenge card appears on Home after that, and the tutorial's final step says "Now beat your friend's 8,450!" instead of the usual last line.
- Achievement #41 "Rivals": "Beat a friend's challenge score." (category misc, 50 coins). All "N / 40" counts use the real total (41).

### 23.6 Streak celebration (R28, from Duolingo)
- After a counted Daily finishes, the Daily result panel shows the streak as a large drawn flame with the number (Baloo 2 800, 64 px). It animates from the old value to the new one: the flame grows 1 → 1.25 → 1 with `easeOutBack` over 500 ms, and the digit rolls up over 300 ms with a `levelUp` sting.
- Text under it: "3-day streak!", or "Streak started!" for day 1, or "A freeze kept your streak alive." when one was used.
- **Milestones at 3, 7, 14, 30, 50, 100 and every 100 after:**
  - The flame turns gold.
  - 40 confetti pieces fall.
  - 70 ms hit-stop.
  - A banner: "7-day streak! +1 freeze" (7, 14, …) or "30-day streak!".
- Home's 7-day strip gets today's tick on return to Home, with a 300 ms pop.

### 23.7 Results screen worth screenshotting (R29, from Vampire Survivors)
The game-over panel (§13.3) adds a "run highlights" row between the score and the near-miss lines:
- **Left:** the run's biggest gloop, redrawn from the board snapshot (true shape, flavour, face with a "proud" expression) and fitted in a 96 × 96 box. Under it: "Biggest pop: 18 cells" (or "Biggest gloop: 6 cells" if nothing popped at 8+).
- **Right:** two stat chips, "Best combo 7" and "Lines 34".
- The row fades in 150 ms after the panel. It must not delay "Play again", which stays clickable at once (R4).
- The run summary records `biggestGloop: {cells: [x,y][], flavour}`, captured at the moment of the pop or, if nothing popped, the largest gloop present at game over.

### 23.8 Replay (R30, optional)
Not built for launch. The deterministic reducer makes it possible later: store the move list for the counted Daily and replay it at 2×. Listed in §22 as a future idea, not a gap in the core loop.

### 23.9 Seconds-to-fun audit (R2, R3, P2)
- Tutorial step 1 already shows a board one piece away from a clear (§16.2). Keep it that way. A tutorial board must always show the rule before asking for the move (the Threes lesson).
- No splash, no cookie banner, no "tap to start". Fonts use `font-display: swap`, and the first frame draws with the fallback font when needed.
- The first counted Daily is always offered after the tutorial and the first Classic run, never before: players first learn the loop, then get the shared puzzle.

### 23.10 Clip moments added to §20
10. **Candy-flame score** at combo 8+ (§23.3).
11. **"You beat your friend!"** banner (§23.5).
12. **First Mega Pop** banner with its hit-stop (§23.2, §23.4).
13. **Milestone streak flame** turning gold (§23.6).
