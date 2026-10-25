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
| Adventure | Level 2 | Goals met (win), out of moves or stuck (loss) | No (boosters and assist instead) | Stars per level | own table (§24.7) |

Details in §9 (Classic, Zen, Expert), §10 (Daily) and §24 (Adventure, plus in-run targets and daily missions for every mode).

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
- Coins are only spent in the Collection and, since pass 3, on Adventure boosters (§24.10). There is no other sink and no way to buy coins.
- Pass 3 adds: in-run targets +5 each and the mini goal +15 (§24.2), daily missions 30/50/80 plus a 50 set bonus (§24.3), Adventure rewards (§24.7).

### 14.3 Level rewards (free, automatic)
| Level | Reward |
|---|---|
| 2 | Pop effect: Hearts; Mode: Adventure, plus 1 of each booster (§24.4) |
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

## 15. Achievements (49; #41 "Rivals" is defined in §23.5, #42–#49 in §24.11)

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
- Achievements screen: grid of 49 badges (§24.11), locked ones show the description and progress when counter-based ("23 / 50").

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
Settings: "Sound effects", "Effects volume", "Music", "Music volume" (slider value "{n}%"), "Vibration", "Reduce motion" (options "Match device", "On", "Off"), "Colour-blind patterns", "Show tutorial again", "Credits", "Reset all progress"; reset confirm: "Delete all progress? Your level, coins, unlocks, stats and streak will be gone. This can't be undone." buttons "Delete everything", "Cancel"; after reset the app reloads into the tutorial.
Credits (SG §11.13; entry points: "Credits" in Settings and in the Home footer after "How to play"):
- Title "Credits"; button "Back"
- Intro: "Gloop Pop uses free sounds and music made by these people. Thank you!"
- Group headings: "Music", "Sound effects", "Code and art"
- One line per credit, built as "{title} by {author} · {licence} · {site}", where {site} is the link text. The lines are generated from `src/audio/credits.ts` and read exactly:
  - Music: "Lofi Hip Hop Loop by omfgdude · CC0 · OpenGameArt"
  - Sound effects: "mouth pops - wet - room.flac by cbenci · CC0 · Freesound"; "Pops - Mouth by JelloApocalypse · CC0 · Freesound"; "Slime Squish by qubodup · CC0 · Freesound"; "Squish impact by Bertsz · CC0 · Freesound"; "Interface Sounds by Kenney · CC0 · Kenney"; "Impact Sounds by Kenney · CC0 · Kenney"; "Casino Audio by Kenney · CC0 · Kenney"; "Music Jingles by Kenney · CC0 · Kenney"
  - Code and art: "Code, art and synth sounds: made for Gloop Pop." (no link)
- Link label (aria): "Open {title} on {site}"
- Note at the end: "CC0 means anyone may use it for free. We credit them anyway."
Collection: tabs "Themes", "Skins", "Pop effects"; item buttons per §14.4.
Stats: see §18.

Pass 3 (§24). Every string below goes in `src/ui/strings.ts` word for word. `{n}`-style values use en-US number format. Flavour names are the §3.2 names in lower case inside sentences ("grape cells") and capitalised at the start of a chip.
- **In-run goal strip (Classic, Expert):** target pill "Next target {t}"; on crossing "{t} ✓ +{c} coins" ({c} = 5 per target passed by that move); mini pill short labels "Big Pop {p}/1", "Combo {p}/4", "2 lines at once {p}/1", "Row + column {p}/1", "{Flavour} cells {p}/12", "Lines {p}/12", "Gloop cells {p}/15", "12-cell gloop {p}/1"; when done the label without numbers plus " ✓" ("Big Pop ✓", "Combo ✓", "2 lines at once ✓", "Row + column ✓", "{Flavour} cells ✓", "Lines ✓", "Gloop cells ✓", "12-cell gloop ✓"); for 1,200 ms after finishing "Done · +15 coins". Mini texts (toast "Mini goal: {text}", aria, game over): "Make a Big Pop", "Reach combo 4", "Clear 2 lines in one move", "Clear a row and a column at once", "Clear or pop 12 {flavour} cells", "Clear 12 lines", "Pop 15 gloop cells", "Grow a gloop to 12 cells". Aria: "Next target {t}. {d} to go." and "Mini goal: {mini text}. {p} of {t}."
- **Game-over rewards row:** "Targets: {k} · +{c} coins", "Mini goal · +15 coins", "1 mission ready to claim", "{k} missions ready to claim".
- **Near-miss (§24.12):** "{d} points short of the {t} target.", "{k} more to finish \"{mission}\".", "You needed {k} more {unit}." with units "line", "lines", "point", "points", "{flavour} cell", "{flavour} cells", "Big Pop", "Big Pops", "2+ line clear", "2+ line clears", "sugar cube", "sugar cubes"; "Nothing fit with {m} moves left."; "Won with {m} moves left."; "Win with {s} moves left for {k} stars."; "Stars count moves left without your {b} extra moves."
- **Home:** mode card "Adventure", "Levels with goals. Win up to 3 stars."; status "Next: Level {n} · ★ {s} / 360"; all won "All 120 levels won · ★ {s} / 360"; locked "Reach Level 2" (existing pattern).
- **Missions card:** title "Daily missions"; reward "{c} coins · {x} XP"; progress "{p} / {t}"; buttons "Claim" and, once claimed, "Done"; change button aria "Change this mission"; caption "1 free change per day" / "Free change used. Next one tomorrow."; set line "Finish all 3: +50 coins, +50 XP"; set done "All 3 done. New missions tomorrow."; mission texts exactly as the §24.3 table.
- **Toasts:** "Mission done: {text}", "Mission reward: +{c} coins, +{x} XP", "All 3 missions done! +50 coins, +50 XP", "Adventure gift: 1 of each booster", "Chapter {c} done! +200 coins, +100 XP", "All stars in Chapter {c}! +300 coins", "Bought: {booster}". The unlock uses the existing "Unlocked: {item}" with {item} = "Adventure".
- **Adventure map:** title "Adventure"; stars chip "★ {s}"; chapter headings "Chapter 1 · First goals", "Chapter 2 · Sugar cubes", "Chapter 3 · Big Pops", "Chapter 4 · Hard cubes", "Chapter 5 · Two goals", "Chapter 6 · Everything"; chapter stars "{s} / 60 ★"; chapter reward lines "All 20 levels: 200 coins, 100 XP" and "All 60 stars: 300 coins" (with ✓ when paid); node label "Hard"; under a paused level "Continue"; footer button "Play level {n}"; when every level is won the footer shows the text "You won every level. Replay any level to get more stars."; node aria "Level {n}, {s} stars" / "Level {n}, hard, {s} stars" / "Level {n}, locked" / "Level {n}, next".
- **Level start card:** title "Level {n}"; chip "Hard level"; caption "Chapter {c}"; label "Moves"; star line "2 stars: win with {s2} moves left · 3 stars: win with {s3} moves left"; goal texts per §24.5 ("Clear {t} lines", "Score {t} points", "Clear or pop {t} {flavour} cells", "Make {t} Big Pops (8+ cells)" / "Make a Big Pop (8+ cells)", "Clear 2+ lines in one move {t} times" / "Clear 2+ lines in one move", "Clear all {t} sugar cubes"); tips on the first level of each new thing: L6 "New: flavour goals. Cells you clear or pop both count.", L21 "New: sugar cubes. Clear a line through a cube to remove it.", L41 "New: Big Pop goals. Pop a gloop of 8 or more cells.", L46 "New: clear 2 or more lines with one piece.", L51 "Grape joins in: 6 flavours from now on.", L61 "New: hard cubes. They need 2 line clears.", L81 "New: two goals. Finish both to win.", L91 "Bubblegum joins in: 7 flavours from now on."; streak "Win streak {k}: +{m} moves" / "Win streak {k}: +2 moves and a free Shuffle"; streak caption (shown until the first streak bonus is used) "Win new levels in a row for a bonus. A loss resets it."; assist toggle "Extra help: +5 moves" and caption "Extra moves don't count for stars."; booster names "+3 Moves", "Shuffle", "Pop"; booster descriptions "Start with 3 more moves.", "Get 3 new pieces once.", "Pop your biggest gloop once."; count "×{n}"; buy "{p} coins"; short "Need {d} more coins"; cap "Max 5"; free "Free from win streak"; captions "You can win every level without boosters." and "Shuffle and Pop come back if you don't use them."; buttons "Play", "Back to map".
- **Adventure play:** top bar pill "Level {n}"; HUD label "moves left"; goal chip "{p} / {t}" with aria "{goal text}: {p} of {t}"; booster aria "Use Shuffle" / "Use Pop", used "Used"; pause "Give up" (existing) with confirm "Give up this level? It counts as a loss." buttons "Give up", "Cancel".
- **Level win panel:** title "Level {n} complete"; streak "Win streak {k}"; buttons "Next level", "Replay", "Map".
- **Level lose panel:** titles "Out of moves", "No room left" (existing), "Level {n} ended" (gave up); "Win streak reset"; buttons "Try again", "Try again with 5 extra moves", "Map".
- **Stats:** "Adventure runs", "Adventure levels won", "{w} / 120", "Adventure stars", "{s} / 360", "Best win streak", "Missions done", "Targets reached"; achievements fraction "{n} / 49".
- **Achievements:** names and descriptions exactly as §24.11. Units for near-miss rule 7: "levels", "levels with 3 stars", "stars", "wins in a row", "missions".

### 16.5 How to play page (exact text)
1. **Drag pieces onto the board.** Pieces can't be rotated.
2. **Fill a whole row or column to clear it.** Clearing several at once scores much more.
3. **Same colours join into one gloop.** Clear a line through any part of a gloop and the whole gloop pops for bonus points. Gloops of 8+ cells give a Big Pop bonus.
4. **Keep your combo going.** Clear a line at least once every 3 pieces. Each clear in a row raises your multiplier.
5. **You get 3 pieces at a time.** Place all 3 to get new ones. New pieces always include at least one that fits.
6. **The game ends when none of your pieces fit.** In Classic you have one rescue per run: clear 10 lines to charge it.
7. **Daily challenge:** the same board and pieces for everyone, every day. Your first try counts. Share your result with friends.
8. **Targets:** in Classic and Expert, reach the next target score for +5 coins. Each run also has one mini goal.
9. **Daily missions:** three small goals a day. They count in every mode. Rewards wait until you claim them.
10. **Adventure:** levels with a goal and a move limit. Win to open the next level. More moves left means more stars.
11. **Sugar cubes:** clear a line through a cube to remove it. Hard cubes need 2 clears. Cubes never join gloops.
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
Home ──► Play · Mode cards (Classic, Adventure, Daily, Zen, Expert) · Missions card (Claim, Change) · Weekly card
     ├─► Adventure map (scrolling levels 1–120)                          [◀ Back]
     │      └─► Level start card (goals, moves, stars, streak, assist, boosters: buy/select) · Play · Back to map
     │             └─► Play (Adventure HUD: moves, goal chips, booster bar)
     │                    ├─ Pause overlay: Resume · Give up · Home · Settings
     │                    ├─ Level win panel: Next level (→ start card) · Replay · Map
     │                    └─ Level lose panel: Try again · Try again with 5 extra moves (after 3 losses) · Map
     ├─► Collection (tabs Themes / Skins / Pop effects; each item: buy / use)  [◀ Back]
     ├─► Achievements (grid of 49; tap badge for details)                   [◀ Back]
     ├─► Stats (numbers + last-20 bar chart)                                [◀ Back]
     ├─► Settings (toggles, Show tutorial again, Reset all progress)        [◀ Back]
     └─► How to play                                                        [◀ Back]
Daily card ──► Play (Daily) ──► Daily result: Share · Share image · Practice · Home
```

- Every screen has a back button top-left (Esc on desktop). Android back / browser back: handled with `history.pushState` per screen, so back closes the current screen instead of leaving the site.
- Menu (☰) during a run pauses the run and opens Home. "Play" on Home resumes it.
- Level-up and unlock moments are toasts, never blocking modals.
- Pass 3: the level start card and the level win/lose panels are modals over the map or the board (SG §20). They open only between attempts, never during play. Android/browser back closes the start card back to the map, and from the Adventure HUD it opens the pause overlay.
- Leaving the tab (visibilitychange hidden) auto-pauses and saves.

---

## 18. Stats screen
Lifetime: Runs played (per mode), Best score (Classic, Expert), Average score (last 20 Classic), Lines cleared, Popped cells, Biggest pop, Best combo, All clears, Pieces placed, Time played (h m), Dailies finished, Best daily score, Current streak, Best streak, Achievements "17 / 49"; pass 3 rows in §24.13. Chart: last 20 Classic scores as bars (best bar highlighted), drawn on a small canvas.

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
| R15 Layered progression | Score, XP/levels, coins every run, 21 cosmetics, 3 unlockable modes, 49 achievements, run targets, missions, 360 Adventure stars | §14, §15, §24 |
| R16 Short sessions | Classic median 4–7 min verified by sim; Daily ≤ 90 placements; one-tap restart | §8 |
| R17 Long tail | Endless score, level 50 + Stars, Expert mode, 49 achievements, Collector, 120 Adventure levels × 3 stars, target ladder without end | §9.2, §14, §15, §24 |
| R18 Fair, player-favourable | Generator only helps (F1–F4); rescue earned by clearing 10 lines; no ads, IAP, energy or accounts | §3.7, §7.4 |
| R19 No-install web | Static Vite build on GitHub Pages, service worker offline, OG image | architecture §10–11 |
| R20 Return reasons | Daily, streak with freezes, rotating weekly goal, 3 daily missions that carry over | §10–12, §24.3 |
| R21 Sound respectful | On by default, starts on first input, mute always visible in the top bar, M key | SG §13, §17 |
| R22 Performance | Cached board layer, DPR cap 2 with adaptive drop to 1.5, pooled particles, no per-frame shadowBlur | architecture §6 |
| R23 PB chase bar | Gold progress bar under the score; pulses at 80%; label "{d} to beat your best" | §23.1 |
| R24 First-time moments | One-time banners and coin bonuses for first Big/Huge/Mega Pop, All Clear, combo 5/10 | §23.2 |
| R25 Signature score effect | Candy-flame score at combo 8+ or 2,000+ point moves | §23.3 |
| R26 Hit-stop | 50–70 ms freeze on 3+ lines, Huge/Mega, All Clear (superseded by SG §9.13.f) | §23.4 |
| R27 Beat my score | Classic/Expert "Challenge a friend" text and image with a ?beat= link; the friend's score becomes the chase bar | §23.5 |
| R28 Streak celebration | Animated flame tick-up, gold milestone flames with confetti | §23.6 |
| R29 Screenshot results | Biggest gloop drawn with its face, best combo, lines | §23.7 |
| R30 Replay | Deferred (deterministic reducer supports it) | §23.8 |
| Pass 3 (RT1–RT29) | Goals that keep you playing: Classic/Expert targets and mini goals, daily missions, 120 validated Adventure levels with stars, assist and a small win streak, boosters as a coin sink. R15, R17 and R20 above gain these layers. | §24, traceability §24.16 |

---

## 22. What is deliberately not in the game
No ads, IAP, energy, loot boxes, accounts, backend, leaderboards, push notifications, timers in Classic/Daily, paid streak repair, fake near-misses, or rigged pieces. No link in share text beyond the bare site address (and the `?beat=` score in a Classic challenge). Replays of runs are a later idea (§23.8). No text walls.

Pass 3 (§24.1 cut list) adds: no chests, spin wheels or random rewards; no lives, energy or waits between Adventure attempts; no star gates; no boosters or extra moves offered at a loss; no paid anything (boosters cost earned coins only and are never needed); no mission streak and no expiring rewards; no "x% of players" numbers; no levels that were not validated by the bot.

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
(superseded by SG §9.13.a and §9.13.f: board-only freeze, scaled by cells removed, input never queued)
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

---

## 24. Goals and Adventure (pass 3)

Added on 25 Oct 2026 after the retention research (`research/retention.md`). In this section, **RT n** means tag R n in `research/retention.md`. Bare R-tags elsewhere in this file keep their old meaning (`docs/research/virality.md`). Where this section conflicts with an earlier one, this section wins.

### 24.1 What this pass adds, and why
The owner asked: "Is there real progression that keeps you playing endlessly? Goals to beat or targets to keep you playing more and more?" The research says the core loop already has a variable reward (when combos and big pops happen depends on the deal and the player, RT1, RT2). What is missing is **goals**. "Always, always a reason for the player to be playing" (RT2), close goals that pull you forward (goal gradient RT6), and goals people come back to finish (RT8, resumption).

| # | Feature | Mechanism | Evidence | Where |
|---|---|---|---|---|
| 1 | In-run targets in Classic and Expert: "Next target 5,000" plus one small mini goal per run | goal gradient; every run pays toward something | RT6, RT7, RT2, RT23 | §24.2 |
| 2 | Daily missions: 3 small goals, 1 free change a day, count in every mode, rewards wait until claimed, unfinished missions never expire | frequent small goals; resumption; no FOMO | RT2, RT8, RT10, RT25, RT12 | §24.3 |
| 3 | Adventure: 120 levels with goals and move limits, 1–3 stars, a map, a sawtooth difficulty curve, a complexity staircase, an assist after 3 losses | goals instead of survival; mastery; hard levels short | RT16, RT17, RT18, RT19, RT27 | §24.4–24.8 |
| 4 | Adventure win streak: at most +2 moves and 1 free Shuffle, reset only by a real loss, never sold | the honest version of Royal Match's streak | RT14, RT15 (counter-examples), RT9 | §24.9 |
| 5 | Coin sink: 3 Adventure boosters bought with earned coins only, max 5 of each; every level is validated **without** them | every run banks progress; no degrade-and-sell | RT23, RT4, RT15 | §24.10 |
| 6 | All of it feeds XP, coins, achievements (+8), stats, near-miss lines and the weekly goal | multiple activities | RT2 | §24.11–24.13 |

**Cut, with reasons:**
- **Chests, spin wheels or random rewards of any kind.** The core loop is already variable, and random rewards drift toward loot boxes (RT1, RT12, RT13).
- **Lives, energy, timers between attempts.** Playing by appointment is a named dark pattern (RT12). A loss costs only the attempt.
- **Star gates on chapters.** Grinding is a named dark pattern (RT12), and gates make difficulty spikes worse (RT16: level 65 churn). Winning a level opens the next one. Stars are for mastery.
- **Offering boosters or moves on the lose panel.** That is exactly where extra moves are sold (RT14, RT15). Boosters can only be picked on the level start card.
- **A streak tied to missions.** RT ranked table: "No streak tied to missions". The Daily streak (§11) stays the only day streak.
- **Higher cosmetic tiers.** Every new tier needs new art for 21 items, and boosters already give coins a renewable use (RT23). Revisit once the shop is commonly finished.
- **Levels after 120 generated at runtime.** They could not be validated before shipping (§24.6). More chapters can be added later with the same tool, and Classic stays endless.
- **Hand-authored level templates.** The seeded generator plus bot calibration (§24.6) gives exact, testable difficulty with no hand data to keep in sync. The first level of every new idea is an easy-band level with a one-line tip instead (RT27: introduce, then develop).
- **More blocker types than sugar cubes and hard cubes.** Two are enough for a staircase across 120 levels (RT17), and each one touches resolve, solver and rendering.
- **"You beat 87% of players" or any social number.** Unverifiable (RT18). We have no backend anyway.

### 24.2 In-run targets and the mini goal (Classic and Expert)
Not in Daily (it already has trays and a share grid), Zen (no stakes), the tutorial steps or Adventure (it has its own goals). Shown only when `tutorialDone` was true at run start.

**Target ladder (fixed, the same for everyone):**
`LADDER = 1,000 · 2,500 · 5,000 · 7,500 · 10,000 · 15,000 · 20,000 · 30,000 · 40,000 · 50,000 · 75,000 · 100,000`, then every +50,000 forever (150,000, 200,000, …). Expert uses the same ladder.

**Derived from your own best:** at run start, `floor = floor(best / 4)` where `best` is that mode's best score (0 if none). The goal strip shows the **next target**: the smallest ladder value that is greater than the score and at least `floor`. So a player whose best is 40,000 first sees "Next target 10,000", and a new player sees "Next target 1,000". The personal-best bar (§23.1) still chases the best itself, so the two never show the same number. If the next visible target equals the best exactly, show the ladder value after it.

**Rewards:** +5 coins for **every** ladder value the score passes in the run, including values below `floor` that were never shown. They bank at run end with the run's coins. No XP. A 20,000 run passes 7 targets: +35 coins.

**Progress fill** inside the target pill: `(score − prev) / (next − prev)`, where `prev` is the ladder value before `next`, or 0 when `next` is the first visible target of the run. RT7 says a head start only works with a stated reason, so nothing is pre-filled for show.

**Crossing:** core emits `targetReached { target, index }` for each ladder value passed by a move, in ascending order. The HUD shows it when the counting-up score reaches the target (SG §20.7). It is not a banner over the board, it has no hitstop or slow-mo, and it never blocks input.

**Mini goal:** one per run, chosen from the run seed with its own hash, so the tray stream is not touched: `h = cyrb128(seed + "/mini")`, `id = MINI[h[0] mod 8]`, flavour for `flavour12` = `1 + (h[1] mod 5)` (cherry to blueberry, which are always in play).

| # | id | Text (toast, aria, game over) | Pill label | Target | Counts |
|---|---|---|---|---|---|
| 0 | bigpop | Make a Big Pop | Big Pop {p}/1 | 1 | a popped gloop with size ≥ 8 |
| 1 | combo4 | Reach combo 4 | Combo {p}/4 | 4 | the highest combo this run |
| 2 | double | Clear 2 lines in one move | 2 lines at once {p}/1 | 1 | a move with n ≥ 2 |
| 3 | cross | Clear a row and a column at once | Row + column {p}/1 | 1 | a move with ≥ 1 row and ≥ 1 column |
| 4 | flavour12 | Clear or pop 12 {flavour} cells | {Flavour} cells {p}/12 | 12 | cells of that flavour removed by clears or pops |
| 5 | lines12 | Clear 12 lines | Lines {p}/12 | 12 | lines cleared this run |
| 6 | pop15 | Pop 15 gloop cells | Gloop cells {p}/15 | 15 | popped cells \|P\| (§3.5) this run |
| 7 | grow12 | Grow a gloop to 12 cells | 12-cell gloop {p}/1 | 1 | a `bigGloop` event (size ≥ 12) |

- The pill uses the short label (it must fit 186 px, SG §20.7). When done it shows the label without numbers plus " ✓" ("Big Pop ✓"). The full text is shown once as a toast when the run's first piece is placed, "Mini goal: {text}" (standard toast, never blocks), and it is the pill's aria label.

- Reward: **+15 coins and +10 XP** when done (flat, any mode multiplier ignored), banked at run end. Core emits `miniDone { id }` once.
- Progress is part of `GameState.goals` (§24.14), so it resumes after a reload.

**Game-over panel additions** (rewards row, under XP and coins): "Targets: 4 · +20 coins" (hidden if 0), "Mini goal · +15 coins" (only if done), and "1 mission ready to claim" / "{k} missions ready to claim" (if any mission is done and unclaimed). The coin total already includes the target and mini coins.

### 24.3 Daily missions (every mode)
**Model:** Guild Wars 2's Wizard's Vault (RT25): goals drawn from a reshuffled deck, nothing to miss. Three slots: A (easy), B (medium) and C (hard). Progress counts in Classic, Expert, Zen, Daily (counted and practice) and Adventure, but not in tutorial steps 1–3. **Score missions ignore Zen** (as the weekly goal does). Progress only counts events that happen after the mission was issued.

**Rewards** (claimed by tapping "Claim" on Home; they wait forever):

| Slot | Coins | XP |
|---|---|---|
| A easy | 30 | 20 |
| B medium | 50 | 40 |
| C hard | 80 | 60 |
| All 3 current missions claimed (set bonus, once per set) | 50 | 50 |

Most a player can earn per day: 210 coins and 170 XP (about 4 Classic runs' worth of coins).

**Pool (29 missions):**

| Slot | id | Text | Target | Counts | Needs |
|---|---|---|---|---|---|
| A | lines15 | Clear 15 lines | 15 | lines cleared | — |
| A | pieces40 | Place 40 pieces | 40 | `placed` events | — |
| A | gloop25 | Pop 25 gloop cells | 25 | popped cells \|P\| | — |
| A | bigpop1 | Make a Big Pop (8+ cells) | 1 | popped gloops with size ≥ 8 | — |
| A | combo3 | Reach combo 3 | 3 | highest combo in one run since issue | — |
| A | double1 | Clear 2 lines in one move | 1 | moves with n ≥ 2 | — |
| A | score3k | Score 3,000 in one run | 3,000 | best single-run score since issue (not Zen) | — |
| A | runs2 | Finish 2 runs | 2 | finished runs: game over, Zen "End run", Adventure win or loss | — |
| A | advwin1 | Win an Adventure level | 1 | Adventure wins (replays count) | Adventure unlocked |
| A | cherry20 | Clear or pop 20 cherry cells | 20 | cherry cells removed by clears or pops | — |
| B | lines40 | Clear 40 lines | 40 | lines cleared | — |
| B | blueberry40 | Clear or pop 40 blueberry cells | 40 | blueberry cells removed | — |
| B | combo6 | Reach combo 6 | 6 | highest combo in one run | — |
| B | bigpop3 | Make 3 Big Pops | 3 | popped gloops with size ≥ 8 | — |
| B | score10k | Score 10,000 in one run | 10,000 | best single-run score (not Zen) | — |
| B | triple1 | Clear 3 lines in one move | 1 | moves with n ≥ 3 | — |
| B | cross3 | Clear a row and a column at once 3 times | 3 | moves with ≥ 1 row and ≥ 1 column | — |
| B | advwin3 | Win 3 Adventure levels | 3 | Adventure wins | Adventure unlocked |
| B | adv3star | Win an Adventure level with 3 stars | 1 | Adventure wins with 3 stars (replays count) | Adventure unlocked |
| B | orange40 | Clear or pop 40 orange cells | 40 | orange cells removed | — |
| C | lines80 | Clear 80 lines | 80 | lines cleared | — |
| C | hugepop1 | Make a Huge Pop (15+ cells) | 1 | popped gloops with size ≥ 15 | — |
| C | combo10 | Reach combo 10 | 10 | highest combo in one run | — |
| C | score20k | Score 20,000 in one run | 20,000 | best single-run score (not Zen) | — |
| C | allclear1 | Empty the board once | 1 | `allClear` events | — |
| C | multi10 | Clear 2+ lines in one move 10 times | 10 | moves with n ≥ 2 | — |
| C | lemon70 | Clear or pop 70 lemon cells | 70 | lemon cells removed | — |
| C | advstars6 | Earn 6 new Adventure stars | 6 | stars earned for the first time on a level | Adventure unlocked and at least 6 unearned stars on levels up to the frontier |
| C | score50k | Score 50,000 in total | 50,000 | sum of `scored.points` (not Zen) | — |

"Cells removed" for flavour missions = cells of that flavour in the move's cleared lines (`cleared.flavoursByCell`) plus that flavour's popped cells outside the lines. Sugar cubes are not flavours and never count.

**Deck (deterministic, the same for everyone):**
- `deck(slot, cycle)` = the slot's pool in table order, shuffled by Fisher–Yates (for i from n−1 down to 1, j = `nextInt(rng, i + 1)`, swap) with `sfc32` seeded from `cyrb128("gloop-pop/missions/v1/" + slot + "/" + cycle)` and 12 warm-up draws. n = 10, 10, 9.
- A **walk position** `w` maps to `deck(slot, floor(w / n))[w mod n]`. The position for UTC day d (`dayNumber`, §10.1) is `w = d − 1`.
- To **issue** a mission for a slot, start at the day's `w` and step `w + 1` until the mission is available to this player (column "Needs") and not in `shownToday` for that slot. Give up after 2n steps and use the slot's first mission (lines15 / lines40 / lines80, always available).

**Day roll** (on app load, on opening Home, and at every run end; compares the UTC `dayKey` with `missions.day`):
- A slot whose mission is **claimed** (or empty) gets the new day's mission, with progress 0.
- A slot whose mission is **unfinished** keeps it, with its progress. Missing days never costs anything (RT25: no "forever behind").
- A slot whose mission is **done but unclaimed** keeps it. It stays claimable.
- `shownToday` is reset, the free change is available again, and `setPaid` is reset when all three slots got new missions.

**Free change (reroll):** once per UTC day, on any unfinished slot. It replaces the mission with the next issuable one after its walk position (skipping `shownToday`), with progress 0. It is never sold, and there is no second change.

**Set bonus:** when all three current slots are claimed and `setPaid` is false, pay 50 coins and 50 XP and set `setPaid`. The card then reads "All 3 done. New missions tomorrow."

**Live feedback:** when a mission becomes done during play, show the toast "Mission done: {text}" (standard queue, SG §11.8). Missions never pause or interrupt a run.

### 24.4 Adventure: mode rules
- **Unlock:** Level 2 (the end of the first run for most players; level reward table §14.3 gains this row). Toast "Unlocked: Adventure", then "Adventure gift: 1 of each booster" (each booster count +1, capped at 5).
- **Entry:** the Home mode card "Adventure" opens the map (§17). Load still opens Classic (§9.1).
- **A level** has 1 or 2 goals, a move limit, a fixed starting board (it may hold sugar cubes), a piece mix and a flavour count. All of these come from the committed level table (§24.6). Every attempt of a level uses the level's validated seed, so the start board and the first tray are the same on every attempt and for every player. Later trays depend on your moves, deterministically.
- **Pieces:** dealt by `dealTray` (§7.4) on the level's tray stream, with the level's stage weights, flavour list and F2 probability. F1 always holds. There is no rescue, no Zen shake and no stage-up.
- **Moves:** each placement costs 1 move. Boosters (§24.10) cost none.
- **Scoring and combo:** exactly §5 and §6. First-time discoveries (§23.2) still fire, since they are lifetime one-offs.
- **After every placement, in this order:** (1) update goal progress; (2) if every goal is met, **the level is won**, even if the same move also leaves nothing that fits; (3) else if moves left = 0, **lost: "Out of moves"**; (4) else deal if the tray is empty; (5) else if nothing in the tray fits, **lost: "No room left"**.
- **Give up:** pause menu "Give up" (confirm "Give up this level? It counts as a loss.") ends the attempt as a loss.
- **Leaving:** Menu/Home or closing the tab keeps the attempt in `adventure.inProgress`. The map shows "Continue" on that level. Starting a different level discards the paused attempt with no loss recorded. This is allowed on purpose: the only thing a loss changes is the small win streak (§24.9), so there is nothing worth guarding.
- **A loss costs nothing but the attempt** and resets the win streak. No lives, no energy, no wait, no coins.
- **Unlocking levels:** winning level n (any star count) unlocks level n + 1. `frontier` = the lowest level never won (121 when all are won).
- **Replays** of won levels are always allowed and can raise the star count.

### 24.5 Goals, sugar cubes and stars
**Goal kinds** (progress is monotonic: it never goes down during an attempt):

| Code | Goal text (start card, §16) | Chip | Progress counts | Bot weight W (§24.6) | Target rounding, minimum |
|---|---|---|---|---|---|
| L | Clear {t} lines | lines icon "{p} / {t}" | lines cleared | 120 per line | whole number, min 3 |
| S | Score {t} points | star-burst icon | the attempt's score | 0 (points already rank moves) | down to a multiple of 100, min 500 |
| F | Clear or pop {t} {flavour} cells | mini gloop of the flavour | cells of the goal flavour removed by clears or pops | 30 per cell | down to a multiple of 5 if ≥ 20, else whole, min 8 |
| B | Make {t} Big Pops (8+ cells) | big-gloop icon | popped gloops with size ≥ 8 | 300 per Big Pop | whole, min 1 |
| M | Clear 2+ lines in one move {t} times | double-line icon | moves with n ≥ 2 | 300 per such move | whole, min 1 |
| C | Clear all {t} sugar cubes | cube icon | cubes fully removed | 250 per cube hit | fixed: the number of cubes on the start board |

Singular forms: "Make a Big Pop (8+ cells)" and "Clear 2+ lines in one move" when t = 1.

**Sugar cubes** (blockers; they fit the engine cheaply because a cube is just a non-flavour cell value):
- Cell value **8 = sugar cube**, **9 = hard cube**. `Cell = 0 | Flavour | 8 | 9`. Only Adventure boards ever contain them. Pieces never do.
- A cube is a **filled** cell: pieces can't go there, and it counts toward a full row or column.
- A cube is **never part of a gloop**. `components()` only groups values 1–7. A popped gloop never removes a cube.
- When a cleared line contains a cube (§3.5 step 6): a value 8 cell becomes 0 (**removed**), and a value 9 cell becomes 8 (**cracked**, it stays). A cube in two cleared lines at once is hit once.
- All Clear needs the board fully empty, so a cube left on the board means no All Clear.
- Scoring is unchanged: cube cells in a line are ordinary line cells. No extra points.
- Events: after `cleared`, core emits `cubes { removed: number[], cracked: number[] }` when either list is non-empty.
- `solver.ts` and `resolve.ts` must apply the same rule (one shared helper). Classic, Expert, Zen and Daily never see values 8–9, so their deals, scores and the pinned 400-day Daily hash don't change.

**Stars:** a won level gives 1–3 stars from the moves left when it was won:
```
effMovesLeft = movesLeft − bonusMoves        (bonusMoves = streak + assist + "+3 Moves" booster; floor at 0)
stars = 3 if effMovesLeft ≥ s3;  2 if effMovesLeft ≥ s2;  else 1
```
`s2` and `s3` are stored per level (§24.6). Extra moves help you win but never buy stars. Stars on a level only go up (best kept). There are 360 Adventure stars in total. On screen they are always drawn on the map, cards and panels, so they are never confused with the Level-50 Stars (§14.1), which only appear as "Lv 50 ★3".

### 24.6 Level table: parameters, generation, calibration, validation
**Count:** 120 levels in 6 chapters of 20. The table `src/core/levels.data.ts` is generated by `npm run levels` (`tools/gen-levels.mjs`) and committed. The game never generates levels at runtime.

**Position and band.** For level n: chapter `c = ceil(n / 20)`, position `p = n − 20(c − 1)`.
- **intro:** n = 1, 2, 3
- **hard:** p = 5, 10, 15, 20
- **easy:** p = 1, 6, 11, 16 (and the intro levels)
- **normal:** all other positions

This is the **sawtooth** (RT16, RT27). Every 5th level is hard and short, and the level after it is easy. Each chapter's easy levels are easier than the previous chapter's hard ones.

**Wins required (K of 12 bot runs):** intro 12, easy 10, normal 7, hard 4.

**Move limits** (intro levels: 20). Hard levels are short (RT16: "if a level is really hard, it should also be really short"):

| Chapter | easy | normal | hard |
|---|---|---|---|
| 1 | 30 | 26 | 18 |
| 2 | 28 | 25 | 17 |
| 3 | 28 | 24 | 16 |
| 4 | 27 | 24 | 16 |
| 5 | 26 | 23 | 15 |
| 6 | 26 | 22 | 14 |

**Chapters and the complexity staircase** (RT17: one new thing at a time, first in an easy level, with a one-line tip on the start card):

| Ch | Levels | Map name | New thing (level) | Stage weights (§7.2): easy/normal · hard | Flavours | F2 p: easy · normal · hard |
|---|---|---|---|---|---|---|
| 1 | 1–20 | Chapter 1 · First goals | line and score goals (1); flavour goals (6) | S1 · S2 | 5 | 1 · 1 · 1 |
| 2 | 21–40 | Chapter 2 · Sugar cubes | sugar cubes (21) | S2 · S3 | 5 | 1 · 1 · 1 |
| 3 | 41–60 | Chapter 3 · Big Pops | Big Pop goals (41); 2+ line goals (46); grape (51) | S3 · S4 | 5 (41–50), 6 (51–60) | 1 · 0.5 · 0.5 |
| 4 | 61–80 | Chapter 4 · Hard cubes | hard cubes (61) | S3 · S4 | 6 | 1 · 0.5 · 0.5 |
| 5 | 81–100 | Chapter 5 · Two goals | two goals (81); bubblegum (91) | S4 · S5 | 6 (81–90), 7 (91–100) | 1 · 0.5 · 0 |
| 6 | 101–120 | Chapter 6 · Everything | — | S4 · S5 | 7 | 1 · 0.5 · 0 |

Intro levels use S1 weights and F2 p = 1.

**Goal rotation by position p = 1…20** ("C+X" = two goals: clear all cubes and goal X):

| Ch | p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 | p11 | p12 | p13 | p14 | p15 | p16 | p17 | p18 | p19 | p20 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | L | S | L | S | L | F | S | L | F | S | F | L | S | F | L | S | F | L | S | F |
| 2 | C | L | S | C | C | F | C | S | L | C | S | C | F | L | F | C | S | C | L | C |
| 3 | B | L | C | B | S | M | F | B | C | M | L | B | S | C | B | F | M | C | B | C |
| 4 | C | L | B | C | F | C | M | S | C | B | C | F | M | C | S | L | C | B | M | C |
| 5 | C+L | S | C+F | B | C | M | C+S | F | C+B | L | S | C+M | B | C+L | C+F | F | C+S | M | C+B | C+L |
| 6 | C+S | B | C+F | M | C+L | F | C+B | S | C+M | C | L | C+F | B | C+S | M | C+L | F | C+B | S | C+M |

**Start board pieces** (dropped like the Daily start board, §7.5: pieces from {I2h, I2v, I3h, I3v, L3a–d, O2} in the level's flavours, rejecting positions that make a full line; intro levels: 0):

| Chapter | easy | normal | hard |
|---|---|---|---|
| 1 | 0 | 2 | 3 |
| 2 | 1 | 2 | 3 |
| 3 | 2 | 3 | 4 |
| 4 | 2 | 3 | 4 |
| 5 | 2 | 4 | 5 |
| 6 | 3 | 4 | 5 |

**Cubes on C levels** (sugar, hard). Two-goal levels always use the chapter's **easy** column, because their second goal carries the difficulty:

| Chapter | easy | normal | hard |
|---|---|---|---|
| 2 | 3, 0 | 5, 0 | 6, 0 |
| 3 | 4, 0 | 6, 0 | 8, 0 |
| 4 | 2, 1 | 3, 2 | 4, 3 |
| 5 | 3, 1 | 4, 2 | 4, 4 |
| 6 | 3, 2 | 4, 3 | 5, 4 |

**Seeds and streams.** For level n and candidate seed index s (0, 1, 2, …): `seed = "gloop-pop/adventure/v1/" + n + "/" + s`. Sub-streams use `cyrb128(seed + "/board" | "/trays" | "/goal")` with 12 warm-up draws (like §10.2). Building a level:
1. Board stream: drop the start pieces (rejecting full lines; at most 20,000 tries, else reject this seed). Then place hard cubes, then sugar cubes, each on a uniformly picked empty cell (`nextInt` over the list of empty cells in index order), rejecting a cell that would complete a row or column.
2. Goal stream: the F goal's flavour = `1 + nextInt(flavourCount)`.
3. Tray stream: the attempt's `rng` for `dealTray`.

**The level bot** (`src/core/levelBot.ts`, frozen: any change means regenerating the table). It is the architecture §9.3 "decent human" with one change: each move's value is `movePoints + 40 × lines + Σ W × goalDelta` (W from §24.5). It plays one of the top 3 safe moves, picked by `seededRng(seed + "/bot/" + k)`. It is a copy, not an import of `rankMoves`, so Classic balance changes can never shift Adventure levels.

**Calibration and validation** (per level, in `src/core/levelGen.ts`, pure):
1. Build the level for s = 0.
2. Play 12 bot runs (k = 0…11) on the real Adventure reducer with the targets set to "never met", up to the move limit (no bonus moves, no boosters). Record each goal's progress after every move and the move where the run got stuck, if it did.
3. **Calibrate** each count goal (L, S, F, B, M): the target is the **K-th highest** final progress among the 12 runs, rounded **down** per §24.5. Two-goal levels calibrate X only among runs that removed all cubes by the limit, and need at least K such runs. C targets are fixed.
4. A run **wins** when every goal's progress reaches its target at some move j ≤ limit. Its `movesLeft = limit − j`. Because the bot's choices don't depend on targets, this equals a real play-through, and step 7 checks that.
5. **Stars:** `s3 = min(max movesLeft over winning runs, floor(0.4 × limit))`, `s2 = max(1, floor(s3 / 2))`.
   **Intro caps** apply between steps 3 and 4: level 1's L target is at most 4, level 2's S target at most 1,500, level 3's L target at most 6. A calibrated value above its cap becomes the cap, so wins and stars are computed with the capped target.
6. **Accept the seed** when all of these hold: wins ≥ K; each calibrated target ≥ its minimum (§24.5); s3 ≥ 2 (at least one bot run reaches 3 stars). Otherwise try s + 1.
7. **Store** `{ n, s, goals: [{kind, flavour?, target}], moves, s2, s3, wins, board }` (board as a 64-character string of digits 0–9). Also re-run the 12 bots on the real reducer *with* the targets and check that the win count equals `wins` and every star result agrees.
8. If 64 seeds fail, the tool stops with "Level {n}: no seed passed in 64 tries" and does not write the table. The fix is a parameter change in `src/core/levels.ts` (tables above, then this section), never a hand edit of `levels.data.ts`.

**Re-validation in tests** (`levels.test.ts`, part of `npm run check`): for all 120 levels, (a) rebuilding from `s` gives exactly the stored board and goal flavour; (b) the 12 bot runs on the real reducer give exactly the stored targets, `wins`, `s2` and `s3`; (c) the sawtooth holds: in every chapter, mean wins of hard < normal < easy levels, and every level right after a hard one is easy-band; (d) the staircase holds: the first level using each new thing is the one in the chapter table, and it is easy-band. Budget: at the measured 3,700 bot moves per second (25 Oct 2026, `npm run sim`), 120 × 12 runs × ≤ 30 moves ≈ 43,000 moves ≈ 12 s. The test's timeout is 90 s, and the agent reports the measured time. If it ever passes 30 s, check this section before cutting runs.

**Hard levels stay short and fair:** a hard level wins 4–12 of 12 bot runs, has 14–18 moves and is followed by an easy level. "Crazy hard levels never pay off" (RT16).

### 24.7 Adventure rewards
| Event | XP | Coins |
|---|---|---|
| First win of a level | 40 | 20 |
| Each star earned for the first time on a level (also on the first win) | 10 | 15 |
| A win that earns no new star (replay) | 10 | 5 |
| A loss (any reason) | 5 | 2 |
| Chapter done (all 20 levels won), once per chapter | 100 | 200 |
| All 60 stars in a chapter, once per chapter | 0 | 300 |

No mode multipliers. A first win with 3 stars pays 70 XP and 65 coins. All 120 levels at 3 stars pay 8,400 XP and 7,800 coins, plus chapters 600 XP and 3,000 coins. Toasts: "Chapter {c} done! +200 coins, +100 XP" and "All stars in Chapter {c}! +300 coins". Level-ups from these go through the normal XP path (§14.1).

### 24.8 Assist after 3 losses (RT27)
- Each level keeps `lossRun` = losses in a row on that level since its last win.
- When `lossRun ≥ 3`, the lose panel shows a second button, "Try again with 5 extra moves". The start card also shows the toggle "Extra help: +5 moves" (off by default). It is free and unlimited, and it has no other effect.
- The 5 moves count as `bonusMoves`, so they never raise stars (§24.5). The caption "Extra moves don't count for stars." says so.

### 24.9 Adventure win streak (RT14, RT15: the honest version)
- `winStreak` counts wins on the **frontier** level, that is, new levels. A loss on the frontier level (out of moves, no room, or give up) resets it to 0. Replays of won levels never change it, win or lose. A discarded paused attempt doesn't change it either.
- **Bonus at the start of a frontier level:**

| Streak at level start | Bonus |
|---|---|
| 0 | none |
| 1 | +1 move |
| 2 | +2 moves |
| 3 or more | +2 moves and a free Shuffle |

- The bonus is applied automatically and shown on the start card ("Win streak 2: +2 moves"). Its moves are `bonusMoves` (no stars). The free Shuffle doesn't use your stock, and a level still allows only one Shuffle.
- It can't be bought, protected or restored. `bestWinStreak` is kept for stats and the "Five Wins" achievement.
- Why it is small: Royal Match's streaks are tuned to sell moves and "greatly increase the chances of player burnout" (RT15). Ours is worth at most 2 moves.

### 24.10 Boosters (the coin sink)
Bought with earned coins only, on the level start card. Never offered on the lose panel or during play, never for money, and **no level ever needs one** (validated without, §24.6).

| id | Name | Effect | Price | Max held | Used |
|---|---|---|---|---|---|
| moves | +3 Moves | Start the level with 3 more moves (they are `bonusMoves`: no stars). | 150 coins | 5 | used up when the level starts |
| shuffle | Shuffle | Once per level: replace the whole tray with 3 new pieces dealt by `dealTray` with F2 forced (all 3 fit in some order). | 100 coins | 5 | used up only when tapped; comes back at level end if unused |
| pop | Pop | Once per level: pop the biggest gloop on the board, the same rule as the rescue (§3.7): no points, combo unchanged, no effect on cubes, **doesn't count for goals**. Disabled when the board has no gloop. | 200 coins | 5 | used up only when tapped; comes back if unused |

- On the start card each booster is a tile with its count. Tapping an owned tile selects it for this attempt. When the count is 0, the tile has a buy button ("150 coins"; "Need 40 more coins" when short; "Max 5" at the cap). One tap buys one. There is no confirm, because it is cheap and the coins are earned.
- In play, Shuffle and Pop are buttons in the booster bar (SG §20.4), also on keys 4 and 5. They resolve instantly (`booster` action), cost no move, and never block input. The events are `boosterUsed { id }`, plus `dealt` for Shuffle or `poppedCells` for Pop.
- Economy check: a day of 5 Classic runs (about 55 coins each, plus about 30 from targets and minis), all 3 missions (210) and 5 new Adventure levels at 2 stars (50 each) earns about 900 coins. One booster costs 100–200 coins, so boosters are a real choice against the shop but never a wall. The cap of 5 stops hoarding; a full stock is 2,250 coins.
- §14.2 is amended: coins are spent in the Collection **and** on Adventure boosters. Nothing else, and there is still no way to buy coins.

### 24.11 Achievements (+8, total 49)
| # | id | Name | Description | Condition | Coins |
|---|---|---|---|---|---|
| 42 | adv_first | First Level | Win an Adventure level. | any Adventure win | E |
| 43 | adv_20 | Twenty Levels | Win 20 Adventure levels. | frontier ≥ 21 | M |
| 44 | adv_all | Every Level | Win all 120 Adventure levels. | frontier = 121 | H |
| 45 | three_stars10 | Three Stars | Get 3 stars on 10 Adventure levels. | count of levels with 3 stars ≥ 10 | M |
| 46 | all_stars | Every Star | Get all 360 Adventure stars. | total stars = 360 | H |
| 47 | win_streak5 | Five Wins | Win 5 new Adventure levels in a row. | bestWinStreak ≥ 5 | M |
| 48 | missions10 | Ten Missions | Finish 10 daily missions. | missions claimed ≥ 10 | E |
| 49 | missions100 | Hundred Missions | Finish 100 daily missions. | ≥ 100 | H |

- All except #42 are counter-based (progress shown "7 / 20"). Badge category: **goals** (lemon gradient, SG §11.11, shared with score).
- Every "N / 41" total becomes "N / 49" (§15, §17, §18).

### 24.12 Near-miss lines (still only true facts, §13.4)
Classic and Expert get two new rules, inserted into the §13.4 order:
- **2b** (after rule 2): when `0 < next − score ≤ 10% of next` for the next ladder target (§24.2): **"{d} points short of the {t} target."**
- **6b** (after rule 6): when a daily mission is unfinished and ≥ 80% done (the lowest remaining first): **"{k} more to finish \"{mission}\"."**

Adventure lose panel (show the first two that apply, in this order):
1. For each unmet goal, in goal order: **"You needed {k} more {unit}."** Units: "line"/"lines", "point"/"points", "{flavour} cell"/"{flavour} cells", "Big Pop"/"Big Pops", "2+ line clear"/"2+ line clears", "sugar cube"/"sugar cubes". Singular when k = 1.
2. When the loss was "No room left" with moves left: **"Nothing fit with {m} moves left."**
3. §13.4 rule 3 (piece 1 cell short) and rule 4 (line 1 from full).

Adventure win panel: **"Won with {m} moves left."** Then, if stars < 3, **"Win with {s} moves left for {k} stars."** (the next star tier and its threshold). If bonus moves were used: **"Stars count moves left without your {b} extra moves."**

### 24.13 Stats, weekly goal, Home
- **Stats (§18)** add: "Adventure levels won" "{w} / 120", "Adventure stars" "{s} / 360", "Best win streak", "Missions done", "Targets reached", and "Adventure runs" in the per-mode runs list.
- **Weekly goal (§12)** counts Adventure moves like any mode (and its `score` goal counts Adventure scores, since only Zen is excluded).
- **Home:** the mode grid becomes Classic, Adventure, Daily, Zen, Expert. The Missions card sits between the mode grid and the Weekly card (SG §20.6).
- **Recorded runs:** an Adventure attempt counts as a finished run (achievements "Regular", "Hundred Runs") when it is won or lost. It does not count toward `recentClassic` or the Classic/Expert best.

### 24.14 Save schema v2 and migration
`CURRENT_VERSION = 2`. Every v1 field keeps its name, type and value. New fields:

```ts
interface SaveV2 extends Omit<SaveV1, 'v' | 'stats'> {
  v: 2;
  stats: LifetimeStats & { adventureWins: number; adventureLosses: number; missionsDone: number; targetsReached: number; boostersUsed: number };
  adventure: {
    frontier: number;                                    // 1..121, lowest level never won
    levels: Record<string, { stars: 0 | 1 | 2 | 3; wins: number; losses: number; lossRun: number; bestScore: number }>; // key = level number; only played levels
    winStreak: number; bestWinStreak: number;
    boosters: { moves: number; shuffle: number; pop: number };   // 0..5 each
    chaptersDone: number[]; chaptersAllStars: number[];        // chapters already rewarded (1..6)
    inProgress: GameState | null;                              // paused attempt, mode 'adventure'
  };
  missions: {
    day: string | null;                                        // dayKey of the last day roll
    slots: { id: string; pos: number; progress: number; claimed: boolean; issued: string }[]; // 0 or 3 entries, slot order A, B, C
    rerollDay: string | null; shownToday: string[]; setPaid: boolean; finished: number;
  };
}
```

`GameState` stays `v: 1` and gains optional fields, so v1 runs resume unchanged:
- `mode` adds `'adventure'`.
- `goals?: { floor: number; targetsHit: number; mini: { id: string; flavour?: Flavour; target: number; progress: number; done: boolean } }` (Classic and Expert, created by `newGame(cfg, seed, { best })`).
- `adventure?: { level: number; moveLimit: number; bonusMoves: number; movesLeft: number; goals: { kind: 'L' | 'S' | 'F' | 'B' | 'M' | 'C'; flavour?: Flavour; target: number; progress: number }[]; s2: number; s3: number; stage: number; flavours: number; f2: number; boosters: { shuffle: 'none' | 'armed' | 'used'; pop: 'none' | 'armed' | 'used'; freeShuffle: boolean }; result: null | { won: boolean; reason: 'goals' | 'moves' | 'stuck' | 'gaveUp'; movesLeft: number; stars: 0 | 1 | 2 | 3 } }`.

New actions: `{ type: 'booster'; id: 'shuffle' | 'pop' }`. `endRun` is also allowed in Adventure (give up). New events: `cubes`, `goalProgress { index, progress, target }`, `levelWon { level, movesLeft, stars }`, `levelLost { level, reason }`, `boosterUsed { id, poppedCells? }`, `targetReached { target, index }`, `miniDone { id }`.

**Migration `1 → 2`** (`migrations[1]` in `src/meta/migrate.ts`; v0 still goes through 0 → 1 first):
1. Copy every v1 field as it is, including `inProgress` and `dailyInProgress` (they resume with no change).
2. `stats` gets the 5 new counters at 0.
3. `adventure` = `{ frontier: 1, levels: {}, winStreak: 0, bestWinStreak: 0, boosters: {0, 0, 0}, chaptersDone: [], chaptersAllStars: [], inProgress: null }`.
4. If `profile.level ≥ 2`: add `'adventure'` to `owned.modes` and set every booster count to 1 (the unlock gift, so existing players get what new players get).
5. `missions` = `{ day: null, slots: [], rerollDay: null, shownToday: [], setPaid: false, finished: 0 }`. The first day roll issues 3 missions.
6. `v = 2`.

**Sanitize (v2):** clamp stars to 0–3 and boosters to 0–5. Keep `frontier` within 1–121 and at least (highest level with stars ≥ 1) + 1. Drop level keys outside 1–120 and chapters outside 1–6. Drop mission slots with unknown ids (the next day roll refills them), and clamp progress to 0…target. Accept board values 8–9 only when `mode === 'adventure'`, and drop any other `inProgress` that has them. Drop an `adventure.inProgress` whose level doesn't match a table entry. A save with `v > 2` is backed up and replaced by a fresh one (arch §8).

### 24.15 Session design with pass 3 (§19 additions)
- **First session:** the tutorial and the first Classic run ("Next target 1,000" and a mini goal like "Make a Big Pop" are visible from run 2; run 1 is the tutorial run). Level 2 unlocks Adventure with a gift of 1 of each booster. Home shows 3 missions, and the first easy one is usually done by the end of the next run.
- **One more go:** every Classic run ends with a target that was close ("320 points short of the 10,000 target") or a mission at 80%+. Every Adventure loss shows exactly what was missing ("You needed 4 more grape cells"), and "Try again" is one tap or one key.
- **Day 5:** around level 15–25 of Adventure with a win streak bonus they can see, 10–15 missions done, saving between a theme and a booster or two. Unfinished missions from a missed day are still there with their progress.
- **Ethics, binding (RT11):** no loot boxes or random rewards; nothing for money; nothing expires (missions roll over, rewards wait); no rigged deals or near-misses (Adventure deals use the same fair generator, and every near-miss line is a fact); no fake social proof; boosters never needed; no booster offers at a loss; no lives or energy.
- **Input (binding):** nothing in this pass blocks or delays input during play. Goal strip pulses, mission toasts and booster effects run on the R and W clocks (SG §9.13.a). Hitstop still freezes only the B clock and never delays input. A level win or loss is decided in the core at t = 0. The panel shows at 600 ms (win) or 450 ms (loss, same as §13.2). On a loss, Space, Enter and R restart from 0 ms (R4).

### 24.16 Traceability for pass 3
| RT | Used for |
|---|---|
| RT1, RT2 | goals, not random payouts; several activities (Classic targets, missions, Adventure) |
| RT4, RT12, RT13 | cut list: no degrade-and-sell, no lives, no loot boxes, no grinding gates |
| RT6, RT7 | "Next" target pill, real progress bars only |
| RT8, RT25 | missions carry over and wait to be claimed; Wizard's Vault deck |
| RT9, RT10 | forgiving streaks; the win streak is small and loss-light |
| RT14, RT15 | win streak and boosters as honest counter-examples; no extra moves at a loss |
| RT16, RT17, RT27 | sawtooth, hard-but-short, complexity staircase, assist after 3 losses |
| RT18, RT19 | Adventure levels with goals alongside endless Classic; no fake "x% of players" |
| RT23 | every attempt banks something (loss: 5 XP, 2 coins; targets +5 coins) |
