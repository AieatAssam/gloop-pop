# Gloop Pop: Art, Juice and Sound Style Guide

Version 1.0, 25 Oct 2026. Coding agents implement this; they do not change it (see AGENTS.md). Section numbers (SG §n) are referenced from `docs/design.md` and `docs/milestones.md`.

Units: `c` = board cell pitch in CSS px (44 px on a 390 px wide phone, 68 px on 1280×800 desktop). `f` = face box size (§6.1). `t` = topper size (§6.3). All times in milliseconds. Colours are palette keys from `docs/art/palette.json` (`flavour.cherry.base`, `ui.panel` …). Never write a hex value in code: import `PALETTE` from `src/render/palette.ts`.

---

## 1. Direction: "Gummy Glow"

**Glossy jelly sweets, lit from inside, on a velvet night-time sweet-shop counter.** The gloops are the only saturated, glowing things on screen. Everything around them is deep plum and indigo, soft and slightly out of focus, like a shop window at night.

Pillars:
1. **Gloops are the light source.** Pieces are bright, translucent-looking and glossy; the world is dark, desaturated and calm (R12). Contrast between a gloop and the empty cell behind it is at least 4:1 in luminance.
2. **Everything is soft.** No sharp corners anywhere except sparkle particles and star toppers. Corner radius on bodies is 0.28c.
3. **Everything is alive.** Every gloop has a face, blinks, looks at your finger, and reacts (R13). Nothing on the board is ever perfectly still for more than 6 s.
4. **Every action answers back** within 1 frame with motion and within 1 frame with sound (R14).

## 2. Mood references (for the feel, not to copy)
- **Haribo gold bears held against a window:** translucency, the warm bright core and darker edges.
- **Suika Game:** friendly flat faces with blush on simple round shapes; size ladder you read at a glance.
- **Royal Match:** saturated, glossy pieces with a strong specular highlight, much brighter than the board.
- **Kirby's Dream Land / Kirby's Epic Yarn:** simple expressions that read at 32 px: dot eyes, small mouths, big emotions.
- **Kiki's Delivery Service bakery at night:** warm window light, jars on shelves, quiet indigo outside.
- **Tilt-shift macro photos of sweets:** blurred bokeh lights in the background, crisp subject.

## 3. Palette
Full values in `docs/art/palette.json`. Roles:

| Group | Use |
|---|---|
| `flavour.*.base` | main body colour |
| `flavour.*.light` | top-of-body gradient, inner glow, specular tint |
| `flavour.*.dark` | bottom-of-body gradient, toppers, patterns |
| `flavour.*.outline` | 0.05c outline around the gloop silhouette |
| `flavour.*.glow` | particles, flashes and number outlines for that flavour |
| `face.*` | eyes, mouths, blush, tears |
| `topper.*`, `accessory.*` | toppers and skins |
| `light.*` | specular white, drop shadow, flash, sweep |
| `theme.<id>.*` | background, board frame, cells; one set per theme |
| `ui.*` | DOM UI: text, panels, buttons, bars |
| `fx.*` | number pops, combo tiers, ghost, particles |
| `share.*` | share-card tray squares |

Contrast rules: `ui.textPrimary` on `ui.panelSolid` ≥ 7:1. `ui.textOnPrimary` on the primary button ≥ 7:1. Never put `ui.textDim` text smaller than 14 px.

Alpha: when a role needs a different alpha than its hex, multiply with `ctx.globalAlpha`. Do not invent new colours by mixing in code, except two allowed helpers in `src/render/colour.ts`: `withAlpha(hex, a)` and `mix(hexA, hexB, t)` (used only for theme transitions and pattern ink).

## 4. Shape language
- **Bodies:** rounded rectilinear jelly. Convex corner radius 0.28c, concave (inner) corner radius 0.14c. Neighbouring gloops of different flavours have a 0.12c gap between them; cells of the same gloop have no gap.
- **Faces:** circles and arcs only. Eyes are vertical ovals. Mouths are arcs or rounded "D" shapes.
- **UI:** pill buttons (radius = half height), panels radius 24 px, cards radius 18 px, chips radius 999 px. Thick 4 px "lip" under buttons so they look like pressable candy.
- **Particles:** the only sharp shapes: 4-point sugar sparkles, 5-point stars, confetti rectangles.
- **Line weight:** outlines 0.05c on gloops; 2 px on panels; 3 px icon strokes with round caps and joins.

---

## 5. Gloop body rendering

### 5.1 Silhouette geometry (exact algorithm)
For each gloop (connected same-flavour cells):
1. Trace the boundary on the grid: collect unit edges between a gloop cell and a non-gloop cell (or the board edge). Chain them into closed loops (outer loop plus hole loops; gloops can surround empty cells). Merge collinear edges.
2. Offset each loop inward by `g = 0.06c` (move every edge `g` towards the inside of the gloop). Convex vertices move diagonally inward; concave vertices move diagonally outward.
3. Build a path through the offset vertices using `arcTo` with radius `0.28c` at convex vertices and `0.14c` at concave vertices (clamp the radius to half the shorter adjacent edge).
4. Fill with `'evenodd'` so holes stay empty.

The same path builder is used for: the drop shadow, the body, the outline, the pop-preview outline (§8.4), tray pieces and the dragged piece.

### 5.2 Layers, in draw order (static look)
1. **Contact shadow:** the path filled with `light.shadow`, offset (0, +0.07c), blurred with `shadowBlur = 0.16c` (only allowed when drawing into a cache, §5.3).
2. **Body base:** the path filled with a vertical linear gradient over the gloop's bounding box: 0.0 `flavour.light`, 0.38 `flavour.base`, 1.0 `flavour.dark`.
3. **Inner glow (the "lit from inside" look):** clip to the path; radial gradient centred on the gloop's face centre, radius = 0.9 × max(bbox w, h) / 2: 0.0 `flavour.light` at alpha 0.55, 1.0 `flavour.light` at alpha 0.
4. **Bottom inner shade:** clip to the path; draw the path stroked with width 0.18c in `flavour.dark` at alpha 0.5, offset (0, −0.06c), so the bottom edge reads as thick and the gloop reads as a volume.
5. **Rim light:** clip to the path; stroke the path with width 0.06c in `theme.rim` at alpha 0.35, offset (+0.03c, −0.04c), only the part below the bbox centre line (clip with an extra rect). This is environment light bouncing off the counter.
6. **Outline:** stroke the path, width 0.05c, `flavour.outline`, `lineJoin = 'round'`.
7. **Speculars:** for every cell of the gloop that has no gloop cell above it (top-surface cells): a white ellipse at cell-local (0.32c, 0.26c), radii (0.15c, 0.085c), rotated −20°, `light.specularSoft`; and a dot at (0.56c, 0.2c), radius 0.045c, `light.specular` alpha 0.9. Bottom cells get nothing. This makes big gloops look like one jelly with a shiny top, not a stack of tiles.
8. **Colour-blind pattern** (only when the setting is on, §5.4).
9. **Topper** (§6.3) and **face** (§6.2) are drawn live every frame, not cached.

### 5.3 Caching (R22)
- Each gloop's layers 1–8 are rendered into an offscreen canvas sized to its bbox + 0.3c padding at the current DPR. Cache key: `flavour | theme | cbPatterns | dpr | c | sorted cell list`. Rebuild only when the gloop changes.
- The whole static board (frame, sockets, all idle gloop bodies) is composited into one **board layer** canvas that is redrawn only when the board changes or the theme/size changes.
- Animating gloops (squash, ripple, pop) are skipped in the board layer and drawn per frame from their gloop cache with transforms.
- Tray pieces use the same renderer at tray scale; cache per tray slot.

### 5.4 Colour-blind patterns
When "Colour-blind patterns" is on, each body gets a pattern clipped to its path, drawn in `mix(flavour.dark, face.ink, 0.25)` at alpha 0.45, in a cell-aligned repeat so merged gloops tile seamlessly:

| Flavour | Pattern (per cell, cell-local coords) |
|---|---|
| cherry | 4 dots, radius 0.06c, at (0.3,0.3)(0.7,0.3)(0.3,0.7)(0.7,0.7)·c |
| orange | 2 horizontal stripes, height 0.08c, at y 0.33c and 0.66c |
| lemon | none (plain, the brightest flavour) |
| apple | 2 diagonal stripes (45°), width 0.08c |
| blueberry | 1 ring, radius 0.18c, width 0.05c, centred |
| grape | zigzag across the cell at y 0.5c, amplitude 0.12c, 3 peaks, width 0.06c |
| bubblegum | small plus signs, arm 0.09c, width 0.05c, at (0.3,0.3) and (0.7,0.7)·c |

Toppers (§6.3) and eye styles (§6.2) are always on, so flavours are distinguishable by shape even without the setting (R12).

---

## 6. Faces and personality

### 6.1 Face box
- Find the largest k×k square fully inside the gloop (dynamic programming over the 8×8 grid), k capped at 4. Ties: the square whose centre is closest to the gloop's centroid; then the lowest top-left index.
- Face box size `f = 0.78 × k × c`. Face centre = square centre, raised by 0.04f.
- When a gloop changes and its face box moves, the face slides to the new spot over 220 ms `easeOutCubic` and scales over the same time (it doesn't jump).

### 6.2 Default features (all relative to the face centre, in units of f)
- **Eyes:** two vertical ellipses `face.ink` at (±0.2, −0.06), radii (0.075, 0.095). Catchlight: circle radius 0.028 `face.catchlight` at (−0.025, −0.035) from each eye centre.
- **Mouth (idle smile):** arc centred (0, 0.08), radius 0.09, from 25° to 155°, stroke `face.ink` width 0.035, round caps.
- **Blush:** ellipses `face.blush` at (±0.31, 0.1), radii (0.08, 0.05).
- **Per-flavour eye style** (so faces differ by shape as well as colour):

| Flavour | Eye style |
|---|---|
| cherry | default ovals |
| orange | default ovals, spacing ±0.23, eyebrows: short arcs above each eye, width 0.025 |
| lemon | smaller eyes (0.06, 0.08), mouth is a wide grin arc radius 0.12 (cheeky) |
| apple | default ovals with 2 tiny lash strokes on the outer top of each eye |
| blueberry | half-lidded: top 35% of each eye covered by a body-coloured lid with an ink line (calm, sleepy) |
| grape | tall ovals (0.07, 0.12), two catchlights (dreamy) |
| bubblegum | big round eyes radius 0.1 with a white star catchlight (sparkly) |

### 6.3 Toppers (flavour identity shapes, R12)
Each gloop has one topper, drawn at the top silhouette edge directly above the face centre (find the topmost gloop cell in the face's centre column; anchor = top of its body, minus 0.02c). Size `t = 0.34c × (1 + 0.15 × (k − 1))`. Toppers sway: rotation `4° × sin(2π·time/2600 + phase)`, phase from the gloop id.

| Flavour | Topper |
|---|---|
| cherry | stem: quadratic curve from (0,0) to (0.12t, −0.75t), width 0.09t, `topper.stem`; leaf: ellipse (0.28t, 0.12t) rotated −30° at (0.3t, −0.62t), `topper.leaf`, midrib `topper.leafDark` 0.03t |
| orange | stem nub circle r 0.07t `topper.stem` at (0, −0.06t) + leaf ellipse (0.3t, 0.13t) rotated −15° at (0.2t, −0.16t) |
| lemon | rounded teardrop nub, width 0.3t, height 0.32t, `flavour.lemon.dark`, with a 0.04t `flavour.lemon.light` highlight |
| apple | stem 0.4t + two leaves in a V (ellipses (0.24t, 0.1t) rotated ±40°) |
| blueberry | 5-point crown star, r_out 0.24t, r_in 0.11t, `flavour.blueberry.dark`, points rounded with lineJoin round |
| grape | curly tendril: spiral stroke 1.5 turns, max radius 0.25t, width 0.07t, `topper.leaf`, plus a small leaf (0.18t, 0.08t) |
| bubblegum | bubble: circle r 0.26t, fill `topper.bubble`, outline `flavour.bubblegum.dark` 0.04t, shine arc `topper.bubbleShine`; breathes: scale 0.9–1.1, period 2400 ms |

### 6.4 Size ladder
Bigger gloops have bigger faces (k from §6.1), bigger toppers, and slower, deeper reactions: wobble duration ×(1 + 0.15(k−1)), blink duration ×(1 + 0.1(k−1)). A 4×4 face covering half the board is the "boss gloop" of Mega Pop clips.

### 6.5 Expressions
Implemented as a parameter set per expression (eye shape, mouth shape, brows, extras). Transitions crossfade over 90 ms.

| Expression | Eyes | Mouth | Extras | When (priority, highest first) |
|---|---|---|---|---|
| dizzy | spirals, 1.5 turns, ink 0.03 | small wavy line | — | game over, all board gloops, until restart |
| sad | ovals squashed to 60% height, outer corners droop | inverted arc | tear drop `face.tear` from one eye every 1400 ms | tray pieces that do not fit when stuck |
| popping | squeezed shut "> <" (two chevrons) | wide open "D", fill `face.mouthInside`, tongue | — | the 120 ms before a cell is removed |
| happy | "^ ^" arcs, width 0.04 | big open smile "D" | blush alpha ×1.5 | 700 ms after a clear within 2 cells of the gloop; all gloops after All Clear |
| starEyes | 5-point stars `face.starEye` r 0.1 | open smile | — | while combo tier ≥ 3 (§9.6) |
| excited | ovals ×1.15 | small open "o" | — | the dragged piece; and gloops whose cells will clear or pop under the current ghost (§8.4) |
| worried | ovals, brows tilted up inward | small "o", radius 0.04 | sweat drop at (0.3, −0.25) | board ≥ 70% full (45+ cells), all board gloops; dragged piece over an invalid spot |
| grin | default | wide arc radius 0.13, teeth line | — | 800 ms after this gloop grew by a merge |
| sleep | closed arcs "‿ ‿" | tiny "o" | "z" letters `face.zzz` rising every 900 ms | idle > 20 s with no input (whole board); Pause screen preview |
| idle | default with blinking and look-at | idle smile | — | otherwise |

- **Blink:** eyes scale to 10% height over 60 ms, hold 40 ms, back over 80 ms. Interval random 2500–6000 ms per gloop (cosmetic RNG). Double blink 15% of the time.
- **Look-at:** pupils (whole eyes) shift towards the pointer while dragging, or towards the most recent placement otherwise; max offset 0.05f, smoothed with `lerp(current, target, 1 − 0.001^dt_s)`.
- **Breathing:** idle gloops scale Y by `1 + 0.012 × sin(2π·time/3000 + phase)` around their bottom edge (drawn from cache with transform; only for gloops with k ≤ 2 to save fill rate, bigger gloops breathe through their face only).

### 6.6 Skins (accessories on every gloop's face)
Drawn after the face, scaled by f. Toppers are always drawn too; accessories never cover the topper.

| Skin | Drawing |
|---|---|
| plain | nothing |
| googlyEyes | eyes replaced by white circles r 0.12 with `accessory.googlyRim` 0.02 outline and an ink pupil r 0.055 that moves with a damped spring (k = 120, damping 8) driven by the gloop's own acceleration: placements, wobble, shake and drag. The meme skin. |
| freckles | 3 dots per cheek, r 0.014, `flavour.dark`, around the blush |
| catEars | two rounded triangles on the face box top corners at (±0.32, −0.46), height 0.24, body colour with `accessory.catEarInner` inner triangle; ears twitch (rotate 8° for 120 ms) on blink |
| glasses | two circles r 0.13 around the eyes, stroke `accessory.glassesFrame` 0.03, lens fill `accessory.glassesLens`, bridge arc between |
| mustache | two mirrored curled lobes under the nose point (0, 0.03), width 0.36, height 0.09, `accessory.mustache`; mouth is drawn below it |
| bowtie | at (0, 0.36): two triangles with rounded tips, width 0.32, `accessory.bowtie`, knot circle r 0.04 `accessory.bowtieKnot` |
| crown | at (−0.22, −0.42) rotated −12°: 3-point crown width 0.28 height 0.16 `accessory.crown`, shade band `accessory.crownShade`, gem `accessory.crownGem` |

---

## 7. Backgrounds with depth

### 7.1 Layers (back to front)
1. **Sky:** vertical gradient `theme.skyTop` → `theme.skyBottom`; plus an elliptical horizon glow (`theme.horizon` at alpha 0.18, centre at 62% height, radii 0.9W × 0.25H).
2. **Stars:** 60 dots (portrait) / 110 (desktop), radius 0.6–1.6 px, `theme.star`, positions from a fixed seed so they never jump. 20% twinkle: alpha `0.5 + 0.5 sin(…)` with periods 1.5–4 s. Top 55% of the screen only.
3. **Moon:** circle radius 0.07W (portrait) / 46 px (desktop), `theme.moon`, with a soft halo (radial gradient, radius ×3, alpha 0.25 → 0). Position by stage (§7.3).
4. **Shelf silhouettes:** two rows of sweet jars on shelves behind the board, `theme.silhouette`, top edges rimmed 1.5 px with `theme.silhouetteRim`. Jars: 7–9 per row, rounded rects with lids (widths 0.09–0.16W, heights 0.12–0.22W), generated from a fixed seed. Row 1 at 30% screen height, row 2 at 48%, row 2 slightly lighter (mix with sky 15%) for depth.
5. **Bokeh:** 12 (portrait) / 18 (desktop) soft circles, radius 18–64 px, colours cycling `theme.bokehA/B/C`, alpha 0.08–0.18, drifting upward 4–10 px/s with a slow sine sway (amplitude 12 px). Pre-rendered as one radial-gradient sprite per colour; drawn with `drawImage` scaled.
6. **Counter:** a band behind the bottom half of the board and the tray: `theme.counter` rounded top edge at the board's vertical centre, with a 2 px highlight line `theme.silhouetteRim` at alpha 0.5 and a faint blurred reflection of the board frame (board frame drawn flipped, alpha 0.08, 0.3c below the frame).
7. **Foreground sprinkles:** 8 out-of-focus rounded sprinkles (capsules 3×10 px, blurred via a pre-rendered sprite), alpha 0.25, flavour base colours, drifting slowly near the screen edges, in front of the counter but never over the board.

Layers 1, 2 (static part), 4 and 6 are cached into one background canvas at resize and theme change. Twinkle, moon halo, bokeh and sprinkles are drawn per frame.

### 7.2 Board (a candy mould tray)
- **Frame:** rounded rect, radius 0.55c, padding 0.18c around the grid. Fill: vertical gradient `theme.frameLight` → `theme.frame` (0 → 0.25) → `theme.frameDark` (1.0). 2 px inner highlight on the top edge (`light.specular` alpha 0.12). Drop shadow `light.shadowDeep`, offset (0, 0.15c), blur 0.5c (cached).
- **Well:** inset rect of the grid area, radius 0.35c, fill `theme.well`.
- **Sockets (empty cells):** each cell a rounded rect inset 0.06c, radius 0.22c, fill `theme.cell`; inner shadow: 0.05c line of `theme.cellShade` along the top inside edge, 0.04c line of `theme.cellLight` along the bottom inside edge. Sockets look pressed into the tray. Gloops sit in them.
- No grid lines. The sockets are the grid.

### 7.3 Stage progression (visible progress inside a run)
The moon rises one step per stage: x stays at 78% W; y = 26%, 21%, 16%, 12%, 9%, 7% of screen height for stages 1–6. Each step animates over 2400 ms `easeInOutSine`. At stage 6 the moon's halo gains a slow 6 s pulse. Stage changes also brighten `theme.horizon` alpha by +0.03 per stage (0.18 → 0.33).

### 7.4 Background reactions
See §9.10.

---

## 8. Board, tray and drag

### 8.1 Board coordinates
Board grid top-left = `(bx, by)`; cell (r, c) occupies `[bx + c·c, by + r·c]` with size c (§15 gives values).

### 8.2 Tray
- 3 slots in a row (portrait) or a column (desktop). Each slot is a rounded rect `theme.frameDark` at alpha 0.35, radius 18 px, no border.
- Tray scale: tray cell `ct = min(0.6c, slotW / 5.4, slotH / 5.4)`.
- Pieces are centred in their slot, drawn with the full gloop renderer at `ct` (faces included, k = 1 face per piece cell group: a tray piece is always one gloop).
- Empty slot (piece used): nothing but the slot shape.
- Pieces that currently fit nowhere are drawn at alpha 0.45 with the worried face (honest warning before the player commits to anything else).

### 8.3 Drag
- **Pick up:** on pointerdown inside a slot (the whole slot is the hit area), the piece scales from `ct` to `c` over 110 ms `easeOutBack` and moves to the pointer. (superseded by §9.13.b)
- **Touch offset:** the piece is drawn with its bottom edge `1.1c` above the touch point and horizontally centred on it, so the finger never covers it. Mouse: the piece is centred on the cursor.
- **Follow:** the piece follows the pointer with no lag (position set every pointermove), plus a tilt: rotation = clamp(velocityX × 0.0006, −6°, 6°), smoothed over 80 ms. (superseded by §9.13.c)
- **Snap target:** compute the board cell under the piece's top-left cell centre; if the placement is valid there, that is the target. Otherwise check the 8 neighbour offsets and pick the valid one with the smallest distance in px, but only if it is within 0.6c. This forgiving snap matters for feel.
- **Drop:** valid → piece animates to the target (§9.2). Invalid or released outside the board → returns to its slot along an arc over 180 ms `easeOutCubic`, scaling back to `ct`, with the "return" sound. (superseded in part by §9.13.b and §9.13.e)
- **Keyboard (desktop):** keys 1/2/3 select a piece (it lifts above its slot); a ghost appears at the first valid position closest to the board centre; arrows move the ghost exactly one cell (clamped so the piece stays inside the board); at an invalid position the ghost is drawn as an outline only (`fx.ghostOutline` at alpha 0.5, no fill) and the held piece looks worried; Space/Enter places if valid, otherwise plays nothing and wiggles the ghost 4 px; Esc cancels.
- **Click-click (desktop):** clicking a piece selects it (like keys); the ghost follows the mouse over the board; a click places.

### 8.4 Ghost and previews (where the twist teaches itself)
While the snap target is valid:
1. **Ghost:** the target cells get the piece silhouette filled with `flavour.base` at alpha 0.32 and outlined with `fx.ghostOutline` 0.04c.
2. **Line preview:** every row/column that would clear: its cells (existing gloops and ghost cells) brighten with an additive `fx.lineGlow` overlay at alpha 0.28, pulsing 0.18–0.34 over 600 ms.
3. **Pop preview:** every gloop that would pop (per design §3.5) gets a 0.07c `fx.popPreview` outline drawn 0.04c outside its silhouette, pulsing alpha 0.5–1.0 over 500 ms, and switches to the **excited** face. A small label "+{n}" in 16 px Baloo 2 appears at the gloop's face showing its extra popped cells count. This is how players discover the twist without reading.
4. **Merge preview:** if the piece would join an existing same-flavour gloop (no clear), both get a 0.04c outline in `flavour.light` (alpha 0.7) and the existing gloop looks at the piece.
While the target is invalid: no ghost for pointer drags (keyboard: outline-only ghost, §8.3); the held piece draws at alpha 0.75 with the worried face.

---

## 9. Juice and VFX (exact)

### 9.0 Easings (src/render/easing.ts)
- `easeOutQuad(t) = 1 − (1 − t)²`
- `easeOutCubic(t) = 1 − (1 − t)³`
- `easeInOutSine(t) = −(cos(πt) − 1) / 2`
- `easeOutBack(t) = 1 + 2.70158(t − 1)³ + 1.70158(t − 1)²`
- `easeInBack(t) = 2.70158t³ − 1.70158t²`
- `easeOutElastic(t)`: amplitude 1, period 0.32: `t === 0 || t === 1 ? t : 2^(−10t) · sin((t − 0.08) · 2π / 0.32) + 1`

### 9.1 Spawn / deal
- New tray: pieces drop into slots one by one, 60 ms apart: from y −0.6c above the slot, scale 0.6 → 1 over 240 ms `easeOutBack`, with a soft "deal" tick each.
- New run: existing board gloops pop out in a 250 ms diagonal wave (each cell scales 1 → 0 with `easeInBack`, delay (r + c) × 12 ms). The new board is live immediately; the wave is cosmetic (R4).
- Scripted/new cells (tutorial, daily start board): scale 0 → 1 over 250 ms `easeOutBack`, delay (r + c) × 15 ms.

### 9.2 Placement
(superseded by §9.13.e where they conflict)
1. **Snap:** 70 ms move from the drop point to the target, `easeOutQuad`.
2. **Squash:** on landing, the placed piece's cells: scaleX 1.14, scaleY 0.84 (anchored at the bottom edge), then back to 1 with `easeOutElastic` over 280 ms.
3. **Ripple into the gloop it joined:** cells of the merged gloop at BFS distance d from the placed cells do a smaller squash (scaleY 1 − 0.08 × 0.75^d), delay 22 ms × d, 240 ms elastic. Big jelly feels like jelly.
4. **Dust:** 6 `fx.sugar` specks (radius 1.5–3 px) burst sideways from the piece's bottom edge, speed 40–90 px/s, life 280 ms, fade.
5. **Neighbours:** non-gloop neighbour gloops within 1 cell flinch: face blink + 0.03 squash, 120 ms.
6. Sound "place" (§13.2) and haptic 8 ms (§16).

### 9.3 Particles and pop effects
- One pooled particle system (`src/render/fx/particles.ts`), max 420 live particles. Spawn requests over the cap are dropped (oldest first is not needed).
- Particle fields: x, y, vx, vy, ax, ay, rot, vrot, size, size1, life, age, colour, kind. Integrated per frame with dt in seconds.
- Per **cleared** cell: 5 particles; per **popped** cell: 3 particles + 1 "jelly drop" (a small blob of the flavour colour, radius 0.12c, falls with gravity 1400 px/s², bounces once off the board bottom edge at 40% speed, then fades over 200 ms).
- Default emission: speed 120–320 px/s in a random direction (biased 30% upward), gravity 900 px/s², life 450–700 ms, size 0.08c–0.14c shrinking to 0, colour = cell flavour `glow` (60%) or `fx.sugar` (40%).
- **Pop effect skins** change the particle `kind` only (counts and timings stay):

| Effect | Shape | Notes |
|---|---|---|
| sparkles (default) | 4-point star (two crossed thin diamonds) | rotate 0–360°, spin ±4 rad/s |
| hearts | heart path (two arcs + point), `fx.heart` 50% / flavour 50% | float: gravity −120 instead of +900, sway |
| stars | 5-point star, `fx.star` | spin, gravity 600 |
| bubbles | ring, stroke 0.02c, `fx.bubble` | float up (gravity −200), pop into 3 dots at end of life |
| confetti | rect 0.08c × 0.16c, colours `fx.confettiA–E` | flutter: scaleX = cos(age × 14), gravity 500, drag 1.5 |
| fireworks | line streaks 0.2c long along velocity, `fx.firework` + flavour | speed ×1.5, then each spawns 2 sparkles at 70% life |
| goldsparkles (M13) | as sparkles | colour `ui.gold` 60% / `fx.sugar` 40% (replaces the flavour glow) |
| goldstars (M13) | as stars | colour `ui.gold` 70% / `ui.coinShade` 30% |
| goldconfetti (M13) | as confetti | colours `ui.gold`, `ui.coinShade`, `ui.coinShine`, `fx.sugar` (uniform pick of 4) |

The three Gold effects (design §14.4) are colour variants only: the same `kind`, counts, sizes, gravity, motion and timings as their base effect, the same pool and cap, and only existing palette roles, so they cost nothing extra per frame. Their Collection preview (the 160 × 112 canvas) draws the same ring of 18 dots as the other pop effects, in the effect's own colours instead of the four flavour colours.

### 9.4 Clear sweep and pop ripple (the signature moment)
Timeline from the frame of placement (t = 0), after the 70 ms snap:
1. (superseded by §9.13.f) **t 0–80:** cells in cleared lines flash: additive white (`light.flash`) overlay alpha 0.85 → 0 over 160 ms. Their faces switch to **popping**.
2. **Sweep:** for each cleared line, a light bar (`light.sweep`, width 0.5c, soft edges via gradient) travels along the line starting at the placed piece's nearest cell, outward in both directions, at 1600 px/s (≈ 36 cells/s on phone → a full row in ~220 ms).
3. (superseded by §9.13.f) **Cell pop:** when the sweep reaches a cell: scale 1 → 1.22 over 60 ms `easeOutQuad`, then 1.22 → 0 over 120 ms `easeInBack`, then emit its particles (§9.3).
4. (superseded by §9.13.g) **Gloop pop ripple:** extra popped cells (set P) pop in BFS order from the cleared cells through the gloop: delay = (time the sweep popped the nearest cleared cell of that gloop) + 38 ms × BFS distance. Same cell pop animation. Each popped cell triggers a pop sound with rising pitch (§13.2). For gloops with s ≥ 15, the face is the **last** cell to pop and grows to 1.3× while yelling (popping face) first.
5. (superseded by §9.13.g.7) **Pop text:** at the centroid of all removed cells, when the last cell has popped (or at 260 ms, whichever is first): §9.7.
6. Gameplay is never blocked: the core state is already resolved at t = 0; the player can pick up the next piece during the animation. Cells being animated are drawn from the animation list, not the board layer.

### 9.5 Screen shake
(superseded by §9.13.g.3 trauma shake and §9.13.e camera kick)
Shake offsets the whole game canvas (not DOM UI). Offset = amplitude × (1 − t/d)² × direction, new random direction (cosmetic RNG) every 33 ms, interpolated.

| Event | Amplitude (px, phone) | Duration |
|---|---|---|
| 1 line | 2 | 120 |
| 2 lines | 4 | 160 |
| 3 lines | 6 | 200 |
| 4+ lines | 9 | 260 |
| Big Pop | +2 on top of lines | — |
| Huge Pop | +4 | +80 |
| Mega Pop | 12 | 420 |
| All Clear | 12 | 420 |
| Stuck (game over) | 3, horizontal only | 200 |

Desktop amplitudes ×1.4. Reduced motion: no shake.

### 9.6 Combo escalation tiers
| Tier (C) | Pop text colour | Extra visuals | Audio (§13) |
|---|---|---|---|
| 0 (1–2) | `fx.numberFill` | — | base |
| 1 (3–4) | `fx.comboTier1` | +50% particles; "Combo 3" label under the score number | +1 harmony note |
| 2 (5–7) | `fx.comboTier2` | bokeh pulse (§9.10); pop text wobbles (rotate ±4°, 2 cycles over 400 ms); combo meter glows | + sparkle layer |
| 3 (8–11) | `fx.comboTier3` | screen-edge vignette glow in the flavour colour of the last clear (inner gradient 0.12W wide, alpha 0.35, fades over 900 ms after each clear); all board gloops starEyes | music filter opens |
| 4 (12+) | `fx.comboTier4` + rainbow stroke (cycle flavour bases, 120 ms each) | rainbow edge glow, confetti rain from the top (24 confetti per clear, regardless of pop effect), background bokeh speed ×3 | music arpeggio layer |

### 9.7 Number pops and big texts
- **Points pop:** "+1,364" at the clear centroid. Starts at scale 0, → 1.2 at 120 ms (`easeOutBack`), → 1.0 at 200 ms; rises 48 px over 750 ms `easeOutCubic`; fades out over the last 250 ms. Font Baloo 2 800, fill by tier (§9.6), 0.12em outline `fx.numberOutline` (stroke under fill), 3 px drop shadow `light.shadow`.
- Size by points: < 500 → 28 px; < 2,000 → 36 px; < 10,000 → 48 px; ≥ 10,000 → 64 px. Desktop ×1.3.
- **Event label** above the number, 0.7× its size, delay 60 ms: "Double!", "Triple!", "Quad!", "{n} lines!", "Pop!", "Big Pop!", "Huge Pop!", "Mega Pop!", "All clear!" (highest one only). Mega Pop and All Clear use 72 px with a flavour-coloured outline and stay 1200 ms.
- (superseded by §9.13.i) **Score counter (HUD):** counts up to the new value over `min(600, 150 + points/10)` ms `easeOutCubic`; during counting the number scales 1.08 and returns. A sugar sparkle bursts from the score on each count end if points ≥ 1,000.
- **Combo label:** "Combo 4 ×2.5" pops (scale 1.25 → 1 over 160 ms) each time C rises.

### 9.8 Stuck / game-over choreography (R4, R5)
- t 0: stuck detected. Music low-pass sweeps to 600 Hz over 400 ms. Non-fitting tray pieces shake horizontally (±6 px, 3 cycles over 300 ms) and go **sad**. Board gloops go **worried**, then **dizzy** at 300 ms. Shake: stuck row in §9.5.
- t 200: the near-miss target is highlighted if it is a "1 more cell" case: the blocking cell gets a pulsing `fx.popPreview` ring (2 pulses) and the piece's best almost-fit is drawn as a ghost at alpha 0.25. This shows the near-miss on the board itself.
- t 450: game-over panel slides up from 40 px below, opacity 0 → 1, 220 ms `easeOutBack`. "Play again" is focused and active immediately.
- Restart (button, Space, Enter, R, from t 0): same frame: new run state, tray deal animation, board clear wave (§9.1). Music filter reopens over 300 ms.

### 9.9 Slow-mo
(superseded by §9.13.a slow-mo controller, §9.13.g.6 and §9.13.j)
- Visual time scale 0.35 for 450 ms (real time), then back to 1.0 over 200 ms `easeInOutSine`.
- Triggers: Mega Pop, All Clear, the first time the score passes the best score in a run (with a gold "New best!" banner: 40 px, slides in from the top of the board, stays 1400 ms).
- Only animations slow down; input and core logic run normally. Audio is not slowed but gets a 300 ms low-pass dip to 1800 Hz (a "whoomp").
- Never more than one slow-mo per 3 s. Reduced motion: no slow-mo.

### 9.10 Background reactions
- Every clear: bokeh alpha +0.08 for 300 ms.
- Combo tier ≥ 2 clears: bokeh pulse: scale 1.0 → 1.25 → 1.0 over 500 ms; the horizon glow takes the last cleared flavour's `glow` colour at alpha 0.25, fading over 1200 ms.
- Big/Huge/Mega Pop: the sky gets a flash of the gloop's `glow` colour (full-screen overlay behind the board, alpha 0.18 / 0.26 / 0.36, fade 500 ms). Shelf jar rims flicker brighter for 400 ms.
- All Clear: every star twinkles at once (alpha 1 for 300 ms), the moon halo doubles for 800 ms.
- Game over: the background desaturates 40% (overlay `ui.scrim` at alpha 0.35) over 400 ms.

### 9.11 Reduced motion
(extended by §9.13.l)
When reduced motion is on (setting "On", or "Match device" and `prefers-reduced-motion: reduce`): no shake, no slow-mo, no flashes (replace with a 200 ms opacity fade), particles ×0.3, no bokeh drift, no tilt on drag, ripples become simultaneous fades (150 ms), score counts up in 150 ms. Faces still blink and change expression.

### 9.12 Frame budget for effects
All effect draws must fit in 4 ms per frame on a mid-range phone at the busiest moment (Mega Pop + combo 12). Use sprite caches for particles of each kind and colour (built lazily, max 64 sprites).

## 9.13 Tactile feel v2 (supersedes conflicting lines in §8.3, §9.2, §9.4, §9.5, §9.9, §16 and design §23.4)

Sources: `research/game-feel.md` tags S1–S23. Every number either cites a source or is marked *(tuning)*. Units: **c** = board cell size in CSS px (phone 44, desktop 68, §15). "ms" is real milliseconds unless a clock is named. Where this section and an older line disagree, this section wins. Where it says nothing, the older line still holds.

**Shared math (used throughout)**
- **New easing** (add to `easing.ts`; §9.0 curves stay): `easeInQuad(t) = t²`.
- **Spring** (S15, implicit Euler; one helper `src/render/fx/spring.ts`, mutates a preallocated `{x, v}`). Given frequency f (Hz), damping ratio ζ, target x*, step dt (s): ω = 2πf; `a = 1 + 2·dt·ζ·ω`; `b = dt·ω²`; `d = 1 / (a + dt·b)`; `x' = (a·x + dt·v + dt·b·x*)·d`; `v' = (v + b·(x* − x))·d`. Below, "spring f/ζ" means this helper. To get ζ from "reduce oscillation to p in t seconds": ζ = ln(p) / (−ω·t) (S15).
- **Volume rule** (S13): every squash or stretch writes `sy = 1 / sx`. Uniform swells (anticipation) are the only exception.
- **Exponential smoothing** at any frame rate (S9): `x += (target − x)·(1 − e^(−dt/τ))`.

### 9.13.a Clocks
There are three clocks. `src/render/loop.ts` advances all three each frame and hands them to the draw callback in one reused frame object `{ realDt, worldDt, boardDt, realNow, worldNow, boardNow }`. Every timestamp stored by a system is in the clock that system runs on.

| Clock | Rate | Runs |
|---|---|---|
| **R** real | raw frame dt, clamped to 50 ms (debug `slowmo` still multiplies it, for captures only) | input, pointer and keyboard, the held piece (pickup, drag springs, tilt), the ghost and previews, tray deal and return-to-tray, HUD (score count-up and punch, combo label, PB bar, candy flame), tutorial hand, DOM toasts and panels, the hitstop and slow-mo controllers, haptic scheduling, the flash limiter (§9.13.m), the freeze jitter |
| **W** world | R × s, where s is the slow-mo scale, 0.35 ≤ s ≤ 1 | particles (already in flight and new), number pops and labels (§9.13.g stack), top-lane banners, vignette, background (bokeh, sky flashes, moon), camera trauma decay and noise, camera kick spring, idle life and expressions of board gloops, new-run wave, daily/tutorial entry wave, game-over tray shake and near-miss pulse |
| **B** board-effects | W × h, where h is the hitstop scale, 0.0001 ≤ h ≤ 1 | director cues: placement travel, land squash and settle, neighbour jiggle, line-cell swell, flash start, sweep bars, cell squash and burst, gloop pop wave. `boardView`'s placement layer. |

**Hitstop freezes only B.** Particles already emitted, the background, HUD, drag and tray, and input keep moving (S4: hitlag "only affects the object that deals the damage", particles uninterrupted).

**Hitstop controller** (`src/render/fx/hitStop.ts`, R clock):
- `schedule(boardTimeF, T)`: arm a freeze that starts when `boardNow` reaches F (the peak frame, §9.13.f).
- On start: h snaps to the hold value **0.0001** within one frame (S7: snap in about 10 ms; never exact 0, S7). It holds for `round(0.6·T)` ms, then ramps h from 0.0001 to 1 over the remaining `T − round(0.6·T)` ms with `easeInOutSine` (fast-in, soft-out, S7). T is the total, ramp included.
- `T ≤ 150` ms always (S5 top tier, S12). If a freeze is already running, a new one sets `end = max(end, now + T)` but never past `firstStart + 150`. Freezes never add up.
- `endNow()`: h = 1 on this frame, with no ramp. Any freeze that is armed but not started is cancelled.
- No `window.setTimeout` anywhere in the hitstop or slow-mo paths. Both controllers are stepped by the loop.

**Slow-mo controller** (R clock): owns s. A request is `(scale, inMs, holdMs, outMs)`: ramp in with `easeOutQuad`, hold, ramp out with `easeInOutSine`. A newer request replaces the running one, starting from the current s.

**Input is never queued or delayed** (S3, S12):
- Delete `queuedActions` and `queuedRestart` from `app.ts`. `apply(action)` runs at once, always.
- A `place` action calls `hitStop.endNow()` and asks slow-mo to ramp s to 1 over 60 ms *(tuning)*. The new placement's own effects then play at full speed. Effects already running from the earlier placement are not cancelled; they finish on B at normal speed.
- Pickup, drag and hover do not touch either clock. The held piece runs on R.
- Restart (button, Space, Enter, R) on the same frame: h = 1, s = 1, trauma = 0, kick = 0, all cues, sweeps and stacks cleared.

**Existing call sites:**
- The global `hitStop.advance()` zeroing of all dt is removed.
- `triggerSlowMo`'s `setTimeout` chain becomes a slow-mo request.
- The streak-milestone `setTimeScale(0)` plus `setTimeout(…, 70)` becomes `hitStop` with T = 70 and the normal ramp.
- `director.receive` gets `boardNow` for cues and `worldNow` for texts. `hudView` gets `realNow`.
- §9.4.6 still holds: core state resolves at t = 0.

**Freeze jitter** (S4: the victim vibrates): while h < 1, the frozen cells (swelling line cells, swelling to-be-popped gloops, the landed piece) are offset by smoothed noise ±0.03c on x and y. The noise runs at 30 Hz on R, and the amplitude is multiplied by (1 − h). *(tuning)*

### 9.13.b Pickup (R clock)
On pointerdown in a slot (frame 0):
1. **Scale:** the piece scales from `ct/c` to 1 (board scale) over 140 ms with `easeOutBack`. The overshoot is about 10% of the gap (S16: OutBack 150 ms).
2. **Position:** the drawn position P_d starts at the piece's tray centre and is pulled to the finger by the drag spring (§9.13.c). That pull is the pickup flight. The 0.5c lag clamp is off for the first 140 ms.
3. **Lift L:** goes 0 → 1 over 120 ms with `easeOutCubic` *(tuning)*. Visual y offset is −0.08c·L. It is visual only: the snap still uses P_f (S21).
4. **Drop shadow:**
   - Two soft shadow sprites per piece def, built once into an offscreen cache (`shadowBlur` is allowed there): blur 0.05c and 0.16c, colour `light.shadowDeep`.
   - Each frame: crossfade the two by L. Offset (0.03c·L, 0.05c + 0.12c·L). Scale 1 + 0.06·L. Alpha 0.45 − 0.15·L. The shadow grows, softens and drops away as the piece lifts (S16: shadow pushed further on press). *(values tuning)*
5. **Grab squash:** on frame 0, sx = 1.12 and sy = 1/1.12, anchored at the anchor A (below). Then sx returns to 1 with spring 8 Hz / ζ 0.4. *(tuning)*
6. **Haptic:** `pick` (§9.13.k) on frame 0. Sound: pickUp (§13.2), unchanged.

**Anchor A:** the piece's bottom-centre for touch (the piece hangs 1.1c above the finger, §8.3). The piece centre for mouse and keyboard.

**Return to tray (invalid drop):** keep §8.3 (180 ms arc, `easeOutCubic`, scale back to ct). L goes 1 → 0 over the same 180 ms. On arrival: sx = 1.08, sy = 1/1.08, spring back 8 Hz / ζ 0.4. *(tuning)*

### 9.13.c Drag (R clock)
**Finger-derived position P_f:** touch puts the piece's bottom edge 1.1c above the finger, centred on it. Mouse centres it on the cursor. This offset never changes (S21, S22).

**The snap target always uses P_f exactly**, as `pointer.ts` does now. Nothing below may feed into it.

1. **Follow:** P_d follows P_f (plus the magnet offset, §9.13.d) with spring **7 Hz / ζ 0.75**, per axis.
   - Steady-state lag ≈ 2ζ/ω = 34 ms. This matches the S16 follow speed of 30/s.
   - Overshoot on a hard stop ≈ 3%.
   - |P_d − P_f| is clamped to ≤ 0.5c *(tuning)*.
   - Keyboard and click-click held pieces move cell to cell with spring 12 Hz / ζ 0.8 *(tuning)*. Their target cell is exact.
2. **Velocity v:** the finite difference of P_f, smoothed with τ = 50 ms *(tuning)*, in c/s. v_d is the spring's own velocity, used for the stretch.
3. **Tilt θ** (leans into the motion, S16): target `θ* = clamp(0.5° · v_x, −5°, +5°)`, with v_x in c/s, so 10 c/s gives the full 5°. Smoothed with spring 5 Hz / ζ 0.6. The pivot is A. Positive v_x gives clockwise rotation (top leans right). This replaces §8.3's ±6° clamp. *(gains tuning)*
4. **Stretch along motion** (S10, S11):
   - Target `s* = 1 + clamp(0.01 · |v_d|, 0, 0.10)`, so 10 c/s gives 1.10. Spring 6 Hz / ζ 0.5.
   - Applied as rotate(φ)·scale(s, 1/s)·rotate(−φ) about A, where φ = atan2(v_d). It holds φ when |v_d| < 0.5 c/s.
5. **Jelly follow-through (per-cell lag):**
   - Cells farther from A lag when the finger speeds up and overshoot when it stops (S13). Lag that grows with height is a shear, so it is drawn as one shear about A: `x' = x + k·(y − A_y)`. The body stays one silhouette, and the determinant stays 1.
   - k sits on spring 4 Hz / ζ 0.3. Its target is 0. Each frame, k's spring velocity gets the kick `+0.3 · Δv_x` (Δv_x is the frame change of smoothed v_x in c/s), and |k| ≤ 0.15.
   - Result: starting a drag to the right, the top lags left. Stopping, the top swings right, then wobbles about 3 times and settles in about 0.3 s. *(tuning)*
6. **Transform order** (about A): translate(P_d + lift) · rotate(θ) · shear(k) · stretch · grabSquash · scale(pickup scale).
7. **Reduced motion:** P_d = P_f exactly. No tilt, no stretch, no shear, no grab squash. Pickup scale is linear over 100 ms with no overshoot. The shadow uses a fixed L = 1.

### 9.13.d Snap preview (R clock)
- **Ghost appears** (target becomes valid): alpha 0 → 0.32 and scale 0.92 → 1 about the ghost's centre, over 80 ms `easeOutQuad`. Line and pop previews (§8.4) fade in with the same alpha ramp.
- **Ghost disappears** (target invalid or drag ends): alpha → 0 over 60 ms, linear, drawn at the last target. No scale.
- **Target change** (valid → a different valid cell): the ghost jumps to the new cell at once. It does not slide, because the target must stay honest (S21). Then:
  - **Magnet tick:** ghost scale 1.06 → 1 over 90 ms `easeOutQuad`. The held piece gets a velocity kick of 0.02c toward the new ghost (added to the drag spring's velocity). *(tuning)*
- **Magnet pull** (visual only): while a target is valid, the drag spring's target is P_f + clamp(0.15 · (ghostPos − P_f), 0.12c). The snap still reads P_f. *(tuning)*
- **Magnet haptic** (optional, touch only): `snap` 5 ms. It fires only when the target changes to a valid cell, at most once per 120 ms, never within 120 ms of any other haptic, and never while |v| > 8 c/s. A rare, subtle tick for a frequent event (S18).
- **Reduced motion:** the ghost appears and disappears with alpha only (80 / 60 ms), no magnet tick or pull. The haptic follows the Vibration setting, not reduced motion.

### 9.13.e Placement (B clock unless noted; t = 0 at release, the core is already resolved)
1. **Travel** from P_d to the target over **60 ms** (S12: under 100 ms reads as instant). It replaces §9.2.1's 70 ms `easeOutQuad`.
   - **Anticipation**, 0–20 ms (S13): the piece moves 0.05c opposite to the travel direction (straight up if the travel distance is under 0.3c), with sy 1 → 1.06, sx = 1/sy.
   - **Slam**, 20–60 ms: the piece moves to the target with `easeInQuad`.
   - The shadow's L goes → 0 over the same 60 ms. *(split and sizes tuning)*
2. **Smear** (S14): only if the travel distance is ≥ 0.3c. On the last 2 frames of travel, draw the piece stretched along the travel direction, s = 1 + min(0.3, 0.15 · distance/c), perpendicular 1/s, plus one afterimage at the previous frame's position at alpha 0.3. The smear is never drawn on the land frame.
3. **During travel**, the target cells show the ghost (alpha 0.32). Any gloop that the piece merges into is drawn with the placed cells masked out, so the piece never appears at the target before it lands.
4. **Land frame L** (t = 60): squash **sx 1.16, sy 1/1.16** (S13). The squashed body is:
   - the piece, if it joined nothing, or
   - **the merged gloop as one body** (anchored at the piece's bottom-centre, amplitude × max(0.4, √(pieceCells / gloopCells))).
   
   Never draw the piece over its own gloop. That removes the seams seen in `before-place-sheet.png` at +134 to +439 ms.
5. **Per-column stagger:**
   - The squashed body is rendered once into a pooled offscreen canvas at L.
   - It is drawn as one vertical strip per column. Each strip gets its own sy, anchored at the body's bottom edge. The whole body uses one sx = 1 / mean(sy).
   - Strips start in order of their distance from the column under the finger at release: 8 ms per column step, at most 24 ms. *(tuning)*
   - Each strip holds its peak for one frame. It then returns to 1 with spring **6 Hz / ζ 0.22**, which brings the oscillation down to 10% in 280 ms by S15's formula, matching the old 280 ms elastic.
6. **Settle:** the strips' springs settle in about 300 ms. The §9.2.3 ripple into the merged gloop stays as is (22 ms × d, scaleY 1 − 0.08·0.75^d), timed from L.
7. **Neighbour jiggle** (S10):
   - **Touching:** every other gloop with a cell 4-adjacent to a placed cell gets an impulse that pushes it 0.04c away from the contact, plus a squash amplitude of 0.05. Both use spring 8 Hz / ζ 0.3, starting 20 ms after L.
   - **All others** on the board: squash amplitude 0.015, delay 20 ms + 12 ms per Manhattan step from the piece, capped at 6 steps.
   - One transform per gloop, never per cell.
   - The face blink from §9.2.5 is kept. *(sizes tuning)*
8. **Camera kick** (S17, S8): on L, the camera offset jumps to **0.04c** along the travel direction (straight down if travel < 0.3c), then springs back to 0 with spring **9 Hz / ζ 0.55** on W. *(tuning; S17 gives about 2 frames)*
   - Camera = kick + trauma shake (§9.13.g). It moves the board, tray, board effects and particles. It does not move the HUD, DOM or background, the same as today.
   - The combined camera offset is clamped to ≤ 0.45c.
9. **Dust** (§9.2.4), the `place` sound, and the `place` haptic all fire on L, not on release. The sound is 60 ms after the finger lifts, which is still under the 100 ms instant threshold (S12).
10. **Bug fix (lingering placed cells):** the placement layer draws only placed cells that are **not** in `cleared.cells ∪ popped cells`.
    - Placed cells that the same move removes are drawn only by their pop cues. They land with the squash, then swell, freeze and burst with their line.
    - The `theme.cell` backing patch is also not drawn at removed indices.
    - The layer's lifetime is L + 24 + 300 ms at most. It never outlives its cells.

### 9.13.f Line clear (B clock; F = L = t 60 is the peak frame)

*Revised 25 Oct after the M10 review (`after-line-sheet.png`, `after-pop-sheet.png`): the first version put the impact at F + T + 30 (156 ms for 1 line, 256 ms at the 150 ms cap), past S12's 200 ms "sluggish" line for the biggest events. Now the contact, the freeze and the impact are the same frame F = L, and the caps are lower. Release → impact is 60 ms for every event, and release → first burst is ≤ 210 ms.*
1. **Hitstop length** (S4 shape: floor + linear + cap; inside S5's 50/100/150 ladder):
   - n = unique cells removed by the move (cleared ∪ popped, ≤ 64).
   - **T = min(cap, floor + 2·n)** ms:

| Biggest event of the move | floor | cap | Examples |
|---|---|---|---|
| Lines only, or pops under 8 cells | 34 | 80 | 1 line, n 8 → **50** (S5 small, about 3 frames); 2 lines, n 16 → 66; 3 lines → 80; 4 lines → 80 |
| Big Pop (≥ 8) | 50 | 100 | 1 line + 8-cell pop, n 16 → 82 |
| Huge Pop (≥ 15) | 60 | 110 | 1 line + 15, n 23 → 106 |
| Mega Pop (≥ 24), All Clear | 70 | **120** | 1 line + 24, n 32 → 120 (capped) |

   - T is **real** time and lives only in the hitstop controller. Cue times on B never add T: B simply stops, so anything scheduled at F + x on B happens at real F + T + x. (Adding T to B timestamps counts the freeze twice.)
   - The 150 ms ceiling of §9.13.a/m still holds for overlapping freezes.

   - No hitstop for a placement that removes nothing (frequent events stay light, S1, S18).
   - First-time moments add no extra freeze. They use their event's T.
   - Combo scaling: §9.13.h.
   - Reduced motion: no hitstop (design §23.4, kept).
2. **Anticipation swell** (S13), from release t 0 to F (60 ms), `easeOutQuad`:
   - Cleared-line cells scale uniformly 1 → 1.12, with the popping face.
   - Gloops that will pop swell as one body to 1.06.
   - The swell peaks at F = L, the same frame the landed piece is at full squash. Both sides are at the point of contact (S3). The freeze holds both at their peak.
3. **Freeze on the peak** (S17): `hitStop.schedule(F, T)`. During the freeze:
   - The frozen cells jitter (§9.13.a).
   - **White flash** over the cleared-line cells: additive `light.flash`, alpha 0.85 → 0, linear over **50 ms** on R, starting at F (S7: 52 ms). This replaces §9.4.1's 160 ms.
   - Flash alpha by line count *(tuning, photosensitivity §9.13.m)*: 0.85 for 1–2 lines, 0.6 for 3, 0.45 for 4 or more.
4. **Sweep:** starts at F on B. It does not move while h is held, then accelerates out as h ramps up, so the burst eases in for free.
   - Speed: **1 cell per 28 ms** of B time. This is about §9.4.2's 1600 px/s at c = 44, but no longer tied to resolution.
   - Origin and direction: as §9.4.2.
   - The bar is a cached sprite: no gradient is created per frame.
5. **Per-cell burst** when the sweep reaches a cell:
   - **Squash, 30 ms** (`easeOutQuad`): on top of the 1.12 swell, scale 0.85 along the sweep axis and 1/0.85 across it.
   - **Burst, 90 ms:** uniform scale → 0 with `easeInBack`. Particles emit on the first burst frame.
   - Per cell: 120 ms in total, down from 180. *(tuning)*
6. **Directional particles:** still 5 per cleared cell (§9.3).
   - 3 of the 5 take the inherited direction: the unit vector of 0.6·(sweep direction) + 0.4·(away from the placed piece's centroid), ±35° random, speed × 1.15.
   - The other 2 keep §9.3's random direction.
   - Gravity, life and colours stay as §9.3. *(mix tuning)*
7. **Impact frame** = F (the freeze's first frame, t 60). On it, fire together:
   - trauma (§9.13.g),
   - camera kick 0.05c straight down (spring as §9.13.e),
   - the line haptic (§9.13.k),
   - the lineClear sound, via a director `onImpact` callback, not at input time (S18: keep haptic, audio and visual in sync).
   
   The score count-up and the centre label stack (§9.13.g.7) start here too (§9.13.i). Trauma runs on W, so the frozen board shakes during the freeze (S4: the victim vibrates).
8. **Typical 1-line timeline:** release 0 → land, peak, freeze and impact (flash, sound, haptic, shake, score) 60 → freeze ends 110 → first cell squashes 110–140 and bursts 140–230 → full row done by about 60 + 50 + 7·28 + 120 = 426 ms. Mega Pop at the 120 ms cap: impact 60 → freeze ends 180 → first burst 210. Input stays live throughout.

### 9.13.g Gloop pops, trauma shake, slow-mo, one label at a time
1. **Hitstop:** the bigger tiers in §9.13.f.1.
2. **Wave through the gloop** (replaces §9.4.4's fixed 38 ms per step):
   - D = the gloop's largest BFS distance from its entry cells.
   - **Step = min(38, 330 / D) ms** (B). The last cell starts its burst ≤ 330 ms after the first, so a 28-cell Mega is done in **≤ 450 ms** including the 120 ms burst. Today it takes about 1.8 s. Small gloops keep 38 ms.
   - Each popped cell gets its own anticipation: from `burstAt − 70`, it swells 1 → 1.12 over 40 ms, squashes 30 ms (0.85 along the direction from its BFS parent, 1/0.85 across), then bursts as in §9.13.f.5. The entry cells (depth 0) start their squash at F, like the sweep origin, so their `burstAt` = F + 30 on B; depth d adds d × step.
   - The bulge is visible as it travels ahead of the bursts.
   - Particles inherit the parent → cell direction (same 3-of-5 rule).
   - §9.4.4 kept: Huge and Mega faces pop last and grow to 1.3×.
3. **Trauma shake** (S9) replaces §9.5's table and `fx/shake.ts`'s random 33 ms lerp.
   - State: trauma τ ∈ [0, 1], decaying **linearly at 1.6 per s** on W *(tuning: τ 1 lasts 625 ms)*.
   - **Shake = τ²** (S9).
   - Offset x and y = 0.35c · τ² · nₓ,ᵧ(t), and roll = 1.5° · τ² · n_r(t). The roll pivots on the board centre.
   - n is 1D smoothed value noise, not per-frame random (S9): a 256-entry table filled once from the cosmetic RNG, cosine-interpolated, 15 Hz on W, with a different table offset for each channel. It slows with slow-mo, as S9 recommends.
   - **Phone at τ = 1:** 0.35c = 15.4 px and 1.5° (S9's 2D advice; roll kept ≤ 2°).
   - **Desktop multiplier: 0.7** on offset and roll. c is already 68 there, so 0.35·68·0.7 = 16.7 px, close to the old 12 × 1.4.
   - **Additions**, applied on impact frames (`τ = min(1, τ + add)`; "≥" means `τ = max(τ, value)`):

| Event (impact frame) | τ change | Peak shake (phone) |
|---|---|---|
| 1 / 2 / 3 / 4+ lines (first burst) | +0.35 / +0.45 / +0.55 / +0.65 | ≈ 1.9 / 3.1 / 4.7 / 6.5 px (matches the old 2/4/6/9) |
| Big Pop (gloop's first burst) | +0.15 | |
| Huge Pop: first burst / face burst | +0.20 / ≥ 0.70 | ≈ 7.5 px at the face |
| Mega Pop: first burst / face burst | +0.30 / ≥ 0.90 | ≈ 12.5 px, 1.2° at the face |
| All Clear (last burst of the move) | ≥ 0.90 | ≈ 12.5 px |
| Stuck (game over, t 0) | +0.45, x channel only (y and roll 0) | ≈ 3.1 px horizontal |
| Placement only | 0 (kick only) | |

   - (S9 example additions: +0.2 / +0.5. Ours are larger because τ² keeps small events small.) The combo bonus is in §9.13.h.
4. **Camera kick on pops:** straight down. Big 0.06c and Huge 0.08c on the gloop's first burst. Mega and All Clear 0.12c on the face (or last) burst. Spring as §9.13.e. *(tuning)*
5. **Impact flash for Mega and All Clear** (S17 impact frames, S8):
   - One frame of the board area, drawn in the gloop's flavour `glow` (All Clear: `light.flash`) at alpha **0.25**. It fades to 0 over 80 ms on R, on the face/last burst frame.
   - Never pure full-white (S5 restraint, §9.13.m).
   - The §9.10 sky flashes are capped at alpha 0.25.
6. **Time dilation** (S7, S17): Mega Pop and All Clear keep **0.35×** but are now timed to the climax.
   - It starts on the Mega face burst (All Clear: the last burst).
   - Ramp in over 40 ms (`easeOutQuad`), hold **300 ms** (R), ramp out over 200 ms (`easeInOutSine`). The old hold was 450 ms.
   - The fast wave reads as a burst, and only the final pop plays slowly.
   - "New best!" uses the same 0.35×, 40/300/200, starting on that move's impact frame.
   - One slow-mo per 3 s is kept. A place action ramps s to 1 over 60 ms (§9.13.a). Reduced motion: none.
7. **One big label at a time** (fixes the pile-up of "First Mega Pop!", "+160 coins", "Mega Pop!", "+6,242" and the duplicated "Double!" in `before-pop-sheet.png` and `before-line-sheet.png`). There are two lanes on W.
   - **Top lane** ("New best!", "You beat {friend}!", streak banners): centred on the board, baseline at grid top + 0.9c. One item at a time. A newer item makes the older one fade over 120 ms.
   - **Centre stack:** one stack per move, top to bottom:
     - **label:** the event label (§9.7), **or** the first-time text if this move is a first-time moment (design §23.3). Never both. First-time moments no longer use `director.banner`.
     - **points:** "+6,242".
     - **coins line:** "+{n} coins", only for first-time bonuses.
   - **Stack sizes:**
     - Item heights are 1.0 × their font size. Gaps are 0.08c.
     - Fonts as §9.7, in board units (× c/68, then the desktop font scale). A label shrinks so that its **largest drawn width**, i.e. sprite width × c/68 × font scale × the 1.2 pop overshoot, ≤ 0.92 × grid width (8c). The fit scale is computed once per item at `add()`.
     - Mega Pop, All Clear and first-time labels are 72 px before fitting. Other first-time labels are 48 px.
   - **Stack position:**
     - x = centroid x, clamped so the widest item keeps 0.2c from the grid's side edges.
     - Top y = (centroid y − H/2), clamped to [grid top + 2.0c, grid bottom − 1.0c − H]. If that range is empty, centre the stack on the grid. Clearing the bottom by 1.0c keeps it off the toast that sits on the board's bottom edge.
   - **Stack motion:**
     - It appears on the move's impact frame. Points pop in as §9.7, and the label follows 60 ms later.
     - The whole stack rises 0.6c *(tuning)* over its life: 900 ms, or 1200 ms for Mega, All Clear and first-time.
     - A new stack makes the old one fade over 120 ms at once. Two stacks are never drawn at full alpha together.

### 9.13.h Combo escalation (tier as §9.6)
| Tier | Hitstop × (S1: multi-hit sequences get *shorter* freezes) | Trauma bonus (lines add) | Particle count × | Kick × | Haptic extra |
|---|---|---|---|---|---|
| 0 (C 1–2) | 1.0 | +0 | 1.0 | 1.0 | none |
| 1 (3–4) | 0.9 | +0.05 | 1.5 (§9.6) | 1.1 | none |
| 2 (5–7) | 0.8 | +0.10 | 1.75 | 1.2 | +1 tick |
| 3 (8–11) | 0.7 | +0.15 | 2.0 | 1.3 | +2 ticks |
| 4 (12+) | 0.6 | +0.20 | 2.0 | 1.4 | +2 ticks |

- **Hitstop:** T' = max(min(T, 50), round(T × m)). It never drops below the 50 ms rung (S5). The 150 ms cap still holds.
- **Sweep step:** 28 ms / (1 + 0.1·tier), at least 20 ms *(tuning)*. The rhythm speeds up instead of getting heavier.
- **Particle budget** (S22): when more than 300 particles are live, new emissions are scaled by (420 − live)/120. The 420 cap is unchanged.
- **Haptic tick:** each tick appends a 50 ms gap and an 8 ms pulse to the line pattern.
- Trauma is capped at 1. The camera clamp (0.45c) holds.
- §9.6 visuals and audio are unchanged.

### 9.13.i Score count-up with punch (R clock, HUD)
- **Start:** the move's impact frame, or L for a placement that clears nothing. Until then the HUD shows the old score. Duration D = min(600, 150 + points/10) ms, `easeOutCubic` (§9.7, kept).
- **Tick rhythm:**
  - The shown number updates on ticks every **40 ms** (25 Hz), plus a final tick exactly at D with the exact value.
  - Each tick adds +0.03 to the score's scale, with spring 12 Hz / ζ 0.5. This replaces the flat 1.08. *(tuning)*
- **Punch on land (at D):**
  - The scale jumps to the punch size in 1 frame, then springs to 1 with spring **7 Hz / ζ 0.35**. That gives one visible undershoot of about 6%.
  - Punch size by points: < 500 → 1.10; < 2,000 → 1.14; < 10,000 → 1.18; ≥ 10,000 → 1.24. *(tuning)*
  - The pivot is the number's centre.
- **Colour pulse:** at D, the number is drawn a second time on top in the move's §9.6 tier colour (`fx.numberFill` … `fx.comboTier4`). That copy's alpha goes 1 → 0 over 300 ms `easeOutQuad`. No colour mixing, no allocation.
- The §9.7 sugar sparkle (≥ 1,000) fires at D.
- **Reduced motion:** 150 ms count with no ticks or punch. The colour pulse stays (it does not move).

### 9.13.j Game over settle (replaces nothing in §9.8 except where noted)
- On `stuck` (t 0), the slow-mo controller gets s → **0.4** over 60 ms (`easeOutQuad`), holds 240 ms (R), then goes back to 1 over 150 ms (`easeInOutSine`). Total 450 ms, ending exactly when the §9.8 panel slides up at t 450 ms (R, unchanged). *(tuning; S17: slow before the climax)*
- During the settle, the stuck tray shake, worried → dizzy faces, trauma and near-miss pulse play slowed on W.
- The game-over settle ignores the 3 s slow-mo limit and replaces any slow-mo that is running.
- Haptic `stuck` at t 0.
- **Restart stays instant:** see the restart rule in §9.13.a. "Play again" is focused and live from t 0.
- **Reduced motion:** no settle. The panel still comes at 450 ms.

### 9.13.k Haptics (`navigator.vibrate`, replaces §16)
**Rules:**
- **Every pulse ≤ 20 ms; every gap ≥ 50 ms.** S18: a good tick is 10–20 ms, and the motor rings 20–50 ms after it. Big events use several short pulses, never long ones.
- Fire on the **visual impact frame** (S18 sync):
  - pick: frame 0
  - place: L
  - lines: the move's impact frame
  - pops: the gloop's first burst and face burst
  - stuck: t 0
  
  This is done through director callbacks, not in `apply()`.
- **Rate limit:**
  - A new call less than **60 ms** after the previous call's start is dropped, unless its priority is higher. A higher-priority call replaces the running pattern (`vibrate` cancels the current one).
  - Priority: mega > allClear > huge > big > lines > stuck > place > pick > snap.
  - Snap ticks follow their own 120 ms rule (§9.13.d).
  - Total pattern length ≤ 400 ms.

| Event | Pattern (ms) |
|---|---|
| pick | 10 |
| snap (optional) | 5 |
| place | 12 |
| 1 line | 16 |
| 2 lines | [18, 50, 12] |
| 3 lines | [20, 50, 14, 50, 10] |
| 4+ lines | [20, 50, 16, 50, 12, 50, 8] |
| Big Pop (first burst) | [14, 50, 10] |
| Huge Pop: first burst / face | [18, 50, 14, 50, 10] / 20 |
| Mega Pop: first burst / face | [20, 50, 16, 50, 12] / [20, 50, 20, 50, 20] |
| All Clear (last burst) | [20, 50, 20, 50, 20, 50, 20] |
| stuck | [12, 88, 12, 88, 12] (on the 3 tray-shake cycles, §9.8) |
| combo tier extra | + [50, 8] per tick (§9.13.h) |
| UI buttons | none |

*(Pattern sizes are tuning within S18's 10–20 ms pulse limit.)*

- **Settings:** the "Vibration" setting gates everything, as today (S18: make haptics optional). Reduced motion does not turn haptics off.
- **iOS gap:** iOS Safari and current Firefox have no Vibration API (S19), so all of this is a silent no-op there. The iOS 17.4+ `<input type="checkbox" switch>` haptic (S20) only works for direct taps on DOM controls, not for canvas drag and release. **Not implemented; a documented gap.**

### 9.13.l Reduced motion (extends §9.11; everything not listed is off)
| Item | Reduced motion |
|---|---|
| Clocks | h is always 1 (no hitstop), s is always 1 (no slow-mo, no game-over settle) |
| Pickup | linear 100 ms scale, no overshoot, no grab squash, static shadow (L = 1), no lift offset |
| Drag | P_d = P_f, no tilt, stretch, shear or magnet pull |
| Ghost | alpha fades only (80 / 60 ms) |
| Placement | no travel: the piece appears at the target on release with a 150 ms alpha fade-in of a `light.flash` highlight (§9.11). No smear, squash, jiggle or kick. Dust ×0.3. |
| Line clear | no swell, freeze, jitter, sweep or burst scaling: cells fade 1 → 0 over 150 ms together (§9.11). Flash replaced by that fade. Particles ×0.3, random directions. |
| Gloop pops | simultaneous 150 ms fade. No wave, shake, kick, impact flash or slow-mo. |
| Labels | the centre stack and top lane appear with a 150 ms alpha fade, no pop scale, no rise |
| Score | 150 ms count, no tick or punch, colour pulse kept |
| Haptics | unchanged (Vibration setting only) |

### 9.13.m Performance and safety
- **Allocation-free per frame:**
  - The particle pool preallocates 420 `Particle` objects and removes by swap. No `push` of new literals, no `splice`.
  - Cues, sweeps, placement layers and stacks come from fixed pools: 128 cues, 16 sweeps, 3 placement layers, 2 stacks, 2 top-lane items.
  - `pointerMove` mutates one drag object (no `{ ...drag }`).
  - `shakeOffset()` returns one shared vector.
  - Body `Path2D`s are cached per c.
  - No `createLinearGradient` per frame: sweep bars and vignettes are cached sprites.
  - `director.receive` may allocate (once per move, not per frame).
- **Budget:** §9.12, all effects ≤ 4 ms per frame at Mega Pop + combo 12. Shadow sprites: 2 per piece def, built lazily. Squash canvases: 3 pooled.
- **No `shadowBlur` or `filter` per frame** (§18).
- **Hitstop safety:**
  - T ≤ 150 ms total.
  - One freeze can never extend past firstStart + 150.
  - h ≥ 0.0001.
  - Input ends it.
  - Slow-mo s ≥ 0.35. The slow-mo controller always ends at 1 even if the tab is hidden: it uses R dt clamped to 50 ms.
- **Photosensitivity** *(tuning, in line with WCAG 2.3.1's "three flashes in one second")*:
  - At most **3 flash starts per rolling 1,000 ms** (R) across line flashes, impact flashes and sky flashes. Later requests are skipped; the cells still burst.
  - No overlay over the full board or screen above alpha **0.25**, and never pure white over the full board.
  - Line flashes are limited to the cleared cells, with alpha by line count as in §9.13.f.3.
- **Camera:** |kick + shake| ≤ 0.45c, roll ≤ 1.5° (× 0.7 on desktop).

### 9.13.n Test checklist (unit tests, colocated)
1. `hitStopMs(n, tier, comboTier)` gives:
   - (8, lines, 0) = 50, (16, lines, 0) = 66, (32, lines, 0) = 80, (40, lines, 0) = 80
   - (16, big, 0) = 82, (23, huge, 0) = 106, (32, mega, 0) = 120, (44, mega, 0) = 120
   - (32, mega, 4) = 72, (8, lines, 4) = 50
   - n = 0 → 0
   - never > 120 for any n ≤ 64 and any tier
   - cue schedule: for a 1-line move with T = 50, the first line cell's burst starts at real t 140 ± 1 frame and its flash and impact callback fire at real t 60 ± 1 frame (simulate the loop with 16.7 ms frames)
2. Hitstop controller:
   - h is 0.0001 (not 0) during the hold, and reaches exactly 1 at T.
   - Two overlapping `schedule` calls never freeze longer than 150 ms from the first start.
   - `endNow()` gives h = 1 on the same step and cancels armed freezes.
3. Clocks: during a freeze, `realDt` and `worldDt` are non-zero and `boardDt ≈ 0`. With s = 0.35, `worldDt = 0.35 · realDt` and `realDt` is unchanged.
4. Input is not delayed: `apply(place)` during an active hitstop changes the session state on the same call (no queue). A restart during a hitstop sets h = s = 1 and τ = 0 the same frame.
5. Snap target: for a given finger position, the chosen (row, col) is identical whether the drawn piece is lagging, tilted or stretched (snap reads P_f only).
6. Spring helper: 2 Hz / ζ 0.367 reduces oscillation to about 10% in 0.5 s (S15's example), and it is stable for dt = 50 ms.
7. Volume: every squash and stretch helper returns sx·sy = 1 within 1e−9 (grab, land, burst squash, drag stretch); shear has determinant 1.
8. Trauma:
   - shake(τ) = τ² (0.3 → 0.09, 0.6 → 0.36, 0.9 → 0.81)
   - linear decay of 1.6/s; additions clamp at 1; the "≥" events set max(τ, v)
   - phone offset at τ = 1 equals 0.35c
   - the stuck event moves x only
   - noise output is continuous (|Δ| per 1 ms ≤ a bound)
9. Wave: for D = 27, step = 330/27 and the last burst starts ≤ 330 ms after the first. For D = 3, step = 38.
10. Haptics:
    - every pulse (even indices) in every pattern is ≤ 20 ms and every gap is ≥ 50 ms
    - total ≤ 400 ms
    - the rate limiter drops a same-priority call within 60 ms and passes a higher-priority one
    - snap is dropped within 120 ms of any haptic
11. Reduced motion: hitstop T = 0, slow-mo requests ignored, trauma additions 0, kick 0, tilt/stretch/shear 0, particle count ×0.3, P_d = P_f.
12. Placement layer: its drawn cell set ∩ (cleared ∪ popped) = ∅.
13. Label stack:
    - at most one stack has alpha > 0.5 at any time
    - the stack rect lies inside [grid top + 2.0c, grid bottom − 1.0c] and does not overlap the top-lane rect for centroids anywhere on the board
    - a first-time moment yields one label, not two
14. Flash limiter: a 4th flash start within 1,000 ms is refused. No full-board overlay alpha > 0.25.
15. Score punch: the shown value changes at most once per 40 ms, equals the exact score at D, and punch size by points matches the table.

---

## 10. Typography
- **Display and numbers:** **Baloo 2**, weight 800 (ExtraBold), self-hosted via the npm package `@fontsource/baloo-2` (import `@fontsource/baloo-2/latin-800.css` and `latin-700.css`). Rounded, chunky, matches the jelly shapes.
- **UI text:** **Nunito**, weights 700 and 800, via `@fontsource/nunito` (`latin-700.css`, `latin-800.css`).
- **Fallback stack:** `"Baloo 2", ui-rounded, "SF Pro Rounded", "Arial Rounded MT Bold", system-ui, sans-serif` and `"Nunito", ui-rounded, system-ui, -apple-system, "Segoe UI", sans-serif`. The game must look acceptable with fallbacks.
- **Canvas text:** before caching any canvas text sprite, `await document.fonts.load('800 32px "Baloo 2"')` (with a 1500 ms timeout); redraw caches on `document.fonts` `loadingdone`.
- Numbers use `font-variant-numeric: tabular-nums` in DOM. On canvas, the HUD score is laid out per digit at a fixed advance of 0.58em so it doesn't jitter while counting.
- Number format: `Intl.NumberFormat('en-US')` everywhere (thousands with commas), for consistency with the share text.

| Role | Font | Size phone / desktop | Colour |
|---|---|---|---|
| HUD score | Baloo 2 800 | 52 / 64 | `ui.textPrimary`, 0.08em outline `face.ink` alpha 0.5 |
| HUD best | Nunito 800 | 15 / 18 | `ui.textSecondary` |
| Combo label | Baloo 2 800 | 20 / 24 | tier colour |
| Screen title | Baloo 2 800 | 34 / 44 | `ui.textPrimary` |
| Panel title | Baloo 2 800 | 30 / 36 | `ui.textPrimary` |
| Button primary | Baloo 2 800 | 22 / 24 | `ui.textOnPrimary` |
| Button secondary | Nunito 800 | 18 / 19 | `ui.textPrimary` |
| Body | Nunito 700 | 16 / 17, line-height 1.4 | `ui.textPrimary` |
| Small / caption | Nunito 700 | 14 / 14 | `ui.textSecondary` |
| Tutorial bubble | Nunito 800 | 18 / 20 | `ui.bubbleText` on `ui.bubble` |
| Logo | Baloo 2 800 | 56 / 72 | each letter a flavour base, `face.ink` 0.1em outline, slight per-letter rotation (−4°…4°) and bounce |

---

## 11. UI components (DOM + CSS; colours from CSS variables set from PALETTE at boot)

### 11.1 Buttons
- **Primary ("candy pill"):** height 56 px (desktop 52), padding 0 28 px, radius 28 px, background linear-gradient(`ui.primaryTop`, `ui.primaryBottom`), `box-shadow: 0 4px 0 ui.primaryLip, 0 8px 18px light.shadow`, a white top gloss (inset 0 2px 0 alpha 0.45). Text Baloo 2 800 22 px `ui.textOnPrimary`.
  - Pressed: translateY(3px), lip shadow 1px, 80 ms. Release: back with 140 ms `easeOutBack` (CSS cubic-bezier(.34,1.56,.64,1)).
  - Hover (desktop): brightness 1.06, scale 1.02.
- **Secondary:** same shape, height 48, gradient `ui.secondaryTop` → `ui.secondaryBottom`, lip `ui.secondaryLip`, text Nunito 800 18 px `ui.textPrimary`.
- **Danger:** secondary shape with danger colours (only for "Delete everything", "Give up").
- **Text button:** no background, Nunito 800 16 px `ui.textSecondary`, underline on hover.
- **Disabled:** `ui.disabled` fill, `ui.disabledText`, no lip.
- Focus (keyboard): 3 px `ui.focusRing` outline, 3 px offset. Minimum touch target 44×44.

### 11.2 Icon buttons (top bar)
44×44 circles, fill `ui.panelSolid` at alpha 0.7, 2 px border `ui.panelBorder`, icon 22 px stroked 3 px `ui.textPrimary`, round caps. Icons drawn as inline SVG paths in `src/ui/icons.ts`: menu (3 rounded lines), pause (2 rounded bars), play, speaker on/off (speaker + 2 arcs / speaker + ×), back chevron, gear, trophy, chart, palette, question mark, share (box + arrow), image, coin, flame, snowflake, lock, check.

### 11.3 Panels and modals
- Panel: radius 24 px, background `ui.panel` (with `backdrop-filter: blur(6px)` where supported), 2 px border `ui.panelBorder`, inner top highlight `ui.panelHighlight` 1 px, shadow `0 12px 32px light.shadowDeep`. Padding 24 px.
- Modals sit over a scrim `ui.scrim`; enter: translateY(40px) → 0 and opacity, 220 ms `easeOutBack`; exit: 140 ms fade. Max width 360 px (phone), 420 px (desktop).
- Full screens (Home, Collection…): the game canvas keeps drawing the background layers only (no board, no tray), and screens are DOM panels over it. Screen enter: slide from right 24 px + fade, 200 ms.

### 11.4 HUD score block
Canvas-drawn (so it can pop and shake with the game). Score centred, best below. On new best during a run, "Best" line turns `ui.gold` and reads "New best!".

### 11.5 Combo meter
Under the board (portrait) or in the left panel (desktop). Text "Combo 4 ×2.5" left-aligned, then 3 fuse pips (circles 10 px, gap 6 px): filled `fx.comboTier1`→tier colour, empty `ui.track`. When fuse = 1, the last pip blinks (alpha 1 ↔ 0.3, 400 ms period). Hidden (fades 200 ms) when C = 0. **M14:** the pips are never drawn without the text: label and pips share one alpha and one visibility test (C ≥ 1). The M13 build drew three unlabeled dots under the board at C = 0 (`phone-cubes.png`, `phone-mini-done.png`) and lit them without the label (`phone-target-hit.png`); three dots with no word are a puzzle.

### 11.6 Rescue ring (Classic)
40 px circle button. Ring of 10 ticks around a lifebuoy icon (drawn as a ring with 4 stripes in `flavour.cherry.base` and `ui.textPrimary`). Ticks fill `ui.success` one per line cleared. When full: the button pulses (scale 1 ↔ 1.08, 1200 ms) and shows a small "Ready" label. Used: ring grey, label "Used". Tapping it at any time shows the tooltip text from design §16.4 (the rescue is only usable from the rescue panel).

### 11.7 Cards (Home)
Radius 18 px, `ui.panelSolid`, 2 px border `ui.panelBorder`, padding 16 px. Mode cards have a 56 px illustration on the left: a gloop of the mode's signature flavour (Classic cherry, Daily = Flavour of the Day, Zen blueberry with sleep face, Expert grape with crown), drawn with the canvas gloop renderer into a small canvas. Locked cards: illustration greyed (draw at alpha 0.4), lock icon, text "Reach Level 8" (Zen "Reach Level 3", Adventure "Reach Level 2"; M14: the locked Adventure card showed its normal description). The unlock text replaces the description; it is never shown next to it.

### 11.8 Toasts
Top-centre, below the top bar. Pill, height 40, padding 0 18 px, `ui.panelSolid`, border 2 px in the toast's accent (coin/xp/gold/streak/freeze colour), icon left. Enter: drop from −20 px + fade, 180 ms `easeOutBack`; stay 2400 ms; exit 160 ms. Queue, max 1 visible, 600 ms between. **Placement rule:** a toast must never cover a panel or screen title. While a modal panel (game over, rescue, pause, **the Adventure win and lose panels and the level start card**, M14) or a full screen (Home, Collection, Daily result …) is open, toasts sit at the bottom centre instead (16 px above the bottom safe area), and a toast that is already showing moves there when a panel opens.

### 11.9 Progress bars and toggles
- XP bar: height 12 px, radius 6, track `ui.track`, fill gradient `ui.xpTop` → `ui.xpBottom`, 2 px gloss line at alpha 0.4 on top. Fills with 600 ms `easeOutCubic`; level-up: fills to the end, flashes white 120 ms, resets and continues.
- Weekly/achievement bars: same with `ui.gold` fill.
- Toggles: 52×30 pill, off `ui.toggleOff`, on `ui.toggleOn`, knob 24 px `ui.toggleKnob` with shadow; knob slides 160 ms `easeOutBack`.

### 11.10 Tutorial bubble and ghost hand
- **Bubble:** rounded rect radius 16, fill `ui.bubble`, text `ui.bubbleText` Nunito 800 18 px, max width 300 px, a tail pointing down to the tray piece. Enters with scale 0.8 → 1, 200 ms `easeOutBack`.
- **Ghost hand:** a cartoon hand (rounded palm + index finger, drawn with paths) filled `ui.ghostHand` alpha 0.9, outline `face.ink` 2 px, shadow `ui.ghostHandShadow`. Animation loop: fade in 400 ms on the tray piece; press (scale 0.9) 120 ms; drag along a quadratic curve (control point 1.5c above the midpoint) to the target over 900 ms `easeInOutSine`, carrying a translucent copy of the piece (alpha 0.5); hold 300 ms with a press pulse ring; fade 300 ms; wait 500 ms; repeat. Disappears instantly on pointerdown on a piece.

### 11.11 Achievement badges
80 px rounded squares (radius 20). Unlocked: fill gradient of a flavour chosen per achievement category (lines = blueberry, pops = cherry, combo = orange, score and goals (Adventure, missions, §20) = lemon, daily/streak = grape, misc = apple, collection = bubblegum), with a white icon and a small gloop face peeking from the bottom edge. Locked: `ui.disabled`, lock icon, progress text below.

### 11.12 Top bar (play screen)
Left: menu button. Centre: daily pill (height 36, radius 18, `ui.panelSolid`, text Nunito 800 15 px; dot `ui.danger` 8 px when not played). Right: mute button, then pause button. On desktop the top bar spans the full width with 24 px side padding.

### 11.13 Credits screen (M11)
- **Entry points:** a secondary button "Credits" in Settings, under "Show tutorial again". A text button "Credits" in the Home footer row, after "How to play".
- **Layout:** a full screen like Settings (§11.3): the screen header with "Back" and the title "Credits", then one scrolling panel (`overflow-y: auto`; the header stays fixed).
  - Intro line: Body style.
  - Groups in this order: "Music", "Sound effects", "Code and art". Group headings use the Button secondary style (Nunito 800 18 px).
  - One line per credit: Body style, `ui.textPrimary`, 12 px between lines. The line is "{title} by {author} · {licence} · " followed by a link whose text is the site name. Long titles wrap; there is no truncation.
  - The CC0 note: Small/caption style, `ui.textSecondary`, at the end.
- **Links:** real `<a href>` to the asset's own page, `target="_blank"`, `rel="noopener noreferrer"`, `aria-label` from the design §16.4 string "Open {title} on {site}". Colour `ui.textPrimary`, underlined, 3 px `ui.focusRing` on focus. Minimum touch target 44 px tall (padding on the link).
- **Data:** the lines are generated from `src/audio/credits.ts`, the same data that `CREDITS.md` is checked against (SG §13.12 item 13), so the screen and the file can't drift. No strings are written by hand in the screen.
- No sound except the normal uiTap on Back. The music keeps the menu rule (§13.7: silent in menus).

### 11.14 Volume sliders (Settings, M11)
- A row under each of the "Sound effects" and "Music" toggles: the label ("Effects volume" / "Music volume", Body style) on the left, then a native `<input type="range" min="0" max="100" step="10">` that is 160 px wide (desktop 200), then the value "{n}%" in Small style with tabular numbers.
- Track: height 8 px, radius 4, `ui.track`, filled part `ui.toggleOn`. Thumb: 24 px circle, `ui.toggleKnob`, with the toggle's shadow. Style it with `accent-color` plus the `::-webkit-slider-*` / `::-moz-range-*` pseudo-elements, using CSS variables only.
- When its toggle is off, the slider is `disabled` (alpha 0.5) and keeps its value.
- `input` applies the gain live (at most every 50 ms). `change` saves, and for Effects plays one `place` preview at the new volume (§13.9).
- Keyboard: arrow keys move by 10. `aria-valuetext` is "{n}%".

---

## 12. Share card (1080 × 1350 PNG)
Drawn by `src/render/shareCard.ts` into an offscreen canvas at scale 1 (no DPR).
- Background: equipped theme sky gradient + 40 stars + a large blurred bokeh trio + counter band from y 1050.
- y 70: logo "Gloop Pop" 110 px (logo style §10), centred.
- y 210: "Daily #12" Baloo 2 800 64 px `ui.textPrimary`; under it at y 270 the date "26 Oct 2026" Nunito 700 32 px `ui.textSecondary`.
- y 330–530: the score: Baloo 2 800 180 px `ui.textPrimary` with 0.08em `face.ink` outline, centred.
- y 590–890: tray grid 10 × 3 squares, each 78 px with 12 px gaps (total 888 × 258), x from 96, radius 18, colours `share.tier*` mapped like the emoji (design §10.6), each with a small top specular. Squares with 🟪 meaning get a tiny white star.
- y 930: stats row, three chips: "Best combo 7", "Biggest pop 18", "Lines 34", Nunito 800 34 px on `ui.panelSolid` chips.
- y 1060–1250: a row of 5 gloops sitting on the counter, drawn with the game's gloop renderer (rounded-square jelly bodies, real faces with the happy expression, toppers, equipped skin) with a soft contact shadow each. The middle one is the hero: Daily = the Flavour of the Day gloop at 1.3× size; Classic = the run's biggest gloop in its true shape (fitted in 300 × 172). The four others are the next flavours in id order, skipping the hero's flavour. Classic also prints "Can you beat it?" (Baloo 2 800 44 px, `ui.gold`) just above the counter, and shows the final board as a real candy mould (c = 34) at y 576–880.
- y 1290: footer: the site address (same as share text) Nunito 700 30 px `ui.textSecondary`, and "🔥 5-day streak" left of it if streak ≥ 2 (drawn flame icon, not emoji, for consistency).

---

## 13. Sound direction v2 (samples + synth)

Sources: `research/audio.md`, tags A1–A27. Every number cites a tag or says *(tuning)*. "Measured" means measured on 25 Oct 2026 with ffmpeg/numpy from the files in `/workspace/night-game/audio-src/` (no listening). **Nobody has listened to any of these choices.** Everything that depends on how a sound actually sounds is listed in §13.13 for a human ear check. This section replaces v1 (all-synth) completely. It also replaces the "Audio" column of §9.6, the music lines of §9.8, and the audio line of §9.9. Timing words (R, W, B, L, F, first burst, face burst, last burst) are from §9.13.

### 13.1 Direction
- **Wet, candy, in key.** Gloops sound like real wet pops and squishes (A19). Line clears are a pitched, bell-like instrument that climbs a scale in the key of the music (A1, A2). Coins, UI and the ladder each get their own timbre so they can't be confused (A7).
- **Samples for texture, synth for pitch.** Recorded CC0 one-shots give the real "wet" and "candy" texture that pure oscillators lack (audit). Synthesis stays where we need exact pitch over two octaves (the ladder body), sweeps that follow the game (swells, toggles), and as a fallback while samples load.
- **Quiet by default.** Most moves make one short sound. Only Mega Pop, All Clear and New best are big, and only they duck the music (A16).
- **Sound fires on the visual impact frame**, never at input, except for direct-manipulation sounds (pickup, snap, return) (A9, §9.13.k).
- **Every cue carries energy in 400 Hz–4 kHz** (A14, A15). Below 200 Hz is an optional extra. Keep 4–5 kHz tame (A14).

### 13.2 Sample set (sprite segments)
One SFX sprite holds 28 segments. Every segment is mono, 48 kHz, and peak-normalised to −1 dBFS after its edits. The gains in §13.4 set the balance. Full edits are in §13.11; sources and licences are in `CREDITS.md`.

| Segment | Source | Used for | Length (measured) | Root pitch |
|---|---|---|---|---|
| `pop1`–`pop6` | Freesound 325583 "mouth pops - wet - room.flac" (cbenci), 6 slices | gloop pop per cell, rescue | 141–215 ms; 97–99 % of energy in 400 Hz–4 kHz | unpitched foley (f0 about 830–950 Hz) |
| `place1`–`place5` | mix: Freesound 802606 "Pops - Mouth" slice (dry "tock"), Kenney Impact Sounds `impactSoft_medium_000`–`004` (weight), Freesound 442772 "Slime Squish" 90 ms window (wet) | place | 140–180 ms; 62–77 % in band | unpitched |
| `goo` | Freesound 500912 "Squish impact" (Bertsz), first 450 ms | Big/Huge/Mega first burst | 450 ms; 51 % in band | unpitched |
| `sub` | Kenney `impactSoft_heavy_000`, saturated | Mega low layer (optional extra) | 350 ms; 99 % under 200 Hz | — |
| `tink` | Kenney Interface Sounds `glass_002`, retuned −4 cents | ladder transient, sparkle, music twinkles | 122 ms; 98 % in band | MIDI 95 (B6) |
| `tap` | Kenney `click_003` | UI tap | 7 ms | — |
| `deal1`–`deal3` | Kenney Casino Audio `card-place-1`, `-2`, `-4` slices | tray deal | 114–183 ms; 62–69 % in band | — |
| `coin1`–`coin4` | Kenney `chips-collide-1`–`4` slices | coin tick (clack layer) | 69–97 ms; 5–10 % in band, so a synth body is added (§13.4) | — |
| `chime` | Kenney `confirmation_003`, −2 semitones (D7+F♯7 → C7+E7) | rescue, rescue ready | 332 ms | fixed |
| `stage` | Kenney `confirmation_002`, −2 semitones (D6+A6 → C6+G6) | stage up | 556 ms | fixed |
| `ach` | Kenney `confirmation_004`, −4 semitones (E6+G♯6 → C6+E6) | achievement | 568 ms | fixed |
| `best` | Kenney Music Jingles `jingles_STEEL10`, +484 cents (D E F♯ G → G A B C, ends on C5) | New best stinger | 687 ms | fixed |
| `level` | Kenney `jingles_PIZZI10`, +496 cents (same motif, pizzicato, ends on C5) | level up | 587 ms | fixed |
| `swell` | Freesound 442772 "Slime Squish", reversed | rescue | 350 ms | — |

Why these (measured): the 325583 slices have 97–99 % of their energy in the phone band and similar f0, so they work as one variant pool (A7, A9, A11). The Kenney confirmation chimes and jingles were retuned so that every pitched sample lands on C-major notes (A1). Pitches were measured by spectral peaks and a harmonic-product pitch track; the jingles were about +4 to +18 cents sharp, which the cents offsets correct. Candidates not used: 221091, 611642, 741368, 202230, 323740, 536765, 589612, 96124 (redundant, or most of their energy is above 4 kHz or below 200 Hz), the UI Audio pack, the other jingles (whole-tone or out-of-key runs), Hit jingles (unpitched).

### 13.3 Pitch ladder
- **Scale and key:** C major pentatonic, 11 rungs, C5–C7 (A7: a fixed, reachable top). The bed (§13.7) measures as C major / A minor, with a two-chord vamp Fmaj7 → Em7 (8 bars each). Every pentatonic note is diatonic to that. Rung r → MIDI `R = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93, 96]`, so Hz `[523.25, 587.33, 659.26, 783.99, 880.00, 1046.50, 1174.66, 1318.51, 1567.98, 1760.00, 2093.00]` (unchanged from v1). `freq(m) = 440 · 2^((m − 69)/12)`.
- **Climb with combo:** the move's first line uses rung `r0 = clamp(C − 1, 0, 10)`, where C is the combo *after* the move (as v1 `noteFor`).
- **Climb with lines in one move:** line i (0-based) uses rung `min(r0 + i, 10)`, 45 ms apart on the audio clock. That is one scale step per extra line, the in-scale version of Candy Crush's "a semitone higher" per row (A6). It replaces v1's +2 semitones, which left the scale (E + 2 = F♯). At most 5 lines are voiced; a 6th line or more adds nothing.
- **Cap:** rung 10 (C7). Above the cap a note repeats C7 (A7).
- **Reset:** the ladder has no state of its own. It follows C, so it drops to rung 0 when the combo resets. Within a move it always ascends (A1).
- **Sampled tone, repitched:** the ladder instrument is one note in two layers (A12): a sampled transient `tink` (a glass "tink" recorded at B6, MIDI 95) and a synth body that carries the exact pitch.
  - Body: the "candy bar" recipe (tuned-bar partials 1 : 4 : 10). Sine at f, peak 0 dB, attack 2 ms, exponential decay to −60 dB in 260 ms. Sine at 4f, −12 dB, decay 90 ms. Sine at 10f, −22 dB, decay 35 ms, only if 10f < 12 kHz. *(recipe tuning)*
  - Tink: `playbackRate = 2^(Δ′/12)`, where `Δ = (m + 24) − 95` (two octaves above the body) and `Δ′ = Δ − 12·round(Δ/12)`, so |Δ′| ≤ 6. The tink follows the rung's pitch class while its rate stays between 0.71 and 1.41, so it never turns chipmunk or slow (A2's "one sampled tone repitched"). For rungs 0–10 the rates are `[1.0595, 1.1892, 1.3348, 0.7937, 0.8909, 1.0595, 1.1892, 1.3348, 0.7937, 0.8909, 1.0595]`.
  - Why not repitch one sample over the whole ladder: no candidate is a clean single note in C5–C7 (measured: the Kenney chimes are dyads or chords, the jingle notes sit in octave 4). Two octaves of `playbackRate` would change the length 4× and the timbre with it.
- **Variation:** the ladder is never detuned beyond ±3 cents (A8). Gain ±1 dB.
- **Gloop pops use their own ladder** (§13.4 gloopPop): a smooth rise, not the scale, because they are fast, unpitched foley.
- **Bug fix (audit):** `comboUp` makes **no sound**. It only sets C and the tier that the move's single `lineClear` uses at F. v1 played a line chord at input and again at F.

### 13.4 Per-event table
Gains are dB relative to the SFX bus (samples are peaked at −1 dBFS; synth "peak" is the envelope peak, so −16 dB = 0.16 linear). "Rate" is `playbackRate`. "±%" is a uniform random rate factor per call, "±dB" a uniform random gain. Variants are picked with no immediate repeat (§13.5). Randomness comes from the cosmetic RNG (arch §5), injectable in tests. Every trigger schedules at `ctx.currentTime + 0.005`. Offsets inside a cue (for example the 45 ms between line notes) are scheduled on the audio clock from that start (A22), never with timers.

| Event | Trigger | Layers | Gain dB | Pitch / rate | Variation | Voices / limit | Sample, synth or both: why |
|---|---|---|---|---|---|---|---|
| pickUp | R frame 0 (pointerdown on a slot) | synth sine E5 → A5 (659 → 880 Hz) exponential, 70 ms, A 3 ms | −16 | fixed | ±2 % | 1; ≥ 60 ms apart | synth: a rising "lift" sweep that must be exact and instant; already in band |
| snap tick (new) | R, when the ghost target changes to a valid cell; same rules as the snap haptic (§9.13.d: ≥ 120 ms apart, not while \|v\| > 8 c/s); all input types | synth sine G6 1568 Hz, 12 ms, A 1 ms | −30 | fixed | none | 1; ≥ 120 ms | synth: tiny and frequent. Gives the snap feel on iOS, which has no haptics (§9.13.k gap) |
| place | L (land frame, B) via `onPlaceLand` | `place1`–`5` (pre-mixed tock + weight + wet) | −8 | `2^(−0.6·(cells − 1)/12)` (9 cells → 0.76, as v1) | ±4 %, ±1.5 dB, 5 variants | 1 (a new place cuts the old with a 10 ms fade); ≥ 40 ms | sample: the most frequent sound needs real wet texture and variants (A9, A11). Pre-mixed offline so it costs one voice |
| returnToTray | R t0 (invalid release) | synth triangle A4 → D4 (440 → 294 Hz) 120 ms, A 5 ms; plus sine one octave up at −8 dB re the triangle | −20 | fixed | none | 1 | synth: a soft "no" glide. The octave layer keeps it audible on phones (A14) |
| invalidHover | — | none (silent; the face shows it) | | | | | |
| deal | R: slot k at `dealt` + k × 60 ms (§9.1) | `deal1`–`3` | −20 | 1 | ±5 %, ±1 dB | 3 per deal | sample: cards being dealt are a direct match, with real texture |
| lineClear (1–5 lines) | F (impact frame) via `onImpact` | per line i at F + 45·i ms: ladder note (§13.3) = body −10 + `tink` −14; plus one "fizz" per move at F: noise bandpass 3 kHz Q 0.7, 120 ms, −24 | see layers | rung `min(r0 + i, 10)` | ±3 cents, ±1 dB | ≤ 5 notes per move | both: sampled tink for "real" attack, synth body for exact in-key pitch (§13.3) |
| combo ladder (`comboUp`, tiers §9.6) | no sound of its own; sets C and tier for the move's lineClear at F | tier ≥ 1: harmony on the last line, body only at rung `min(r_last + 2, 10)` (a pentatonic third/fourth), −20. Tier ≥ 2: sparkle, 4 tinks at rungs r_last … r_last + 3 (capped), 30 ms apart starting F + 45·i_last + 30 ms, −22. Tier 3/4: music only (§13.7) | see layers | in scale | ±1 dB | 1 harmony + 4 tinks | both. Fixes the double play (§13.3). Harmony and sparkle are now actually called (audit) |
| gloopPop (per cell) | each popped cell's **burst frame** (B) via a new director `onBurst` callback (§13.4 note 1) | `pop1`–`6` | −12 | `2^((base + min(0.5·k, 10))/12)`; k = burst order in the move (all gloops, by burst time); base by the move's largest gloop: < 8 → +2, Big 0, Huge −2, Mega −4 semitones (A19: bigger is lower) | ±3 %, ±1.5 dB, 6 variants | ≥ 25 ms apart; skipped bursts still advance k; ≤ 6 live pop voices (oldest stolen) | sample: real wet pops (A19); the rise is a rate ramp |
| bigPop (≥ 8) | gloop's first burst (`onPopFirst('big')`); rise at its last burst (`onBurst`, last = true) | first burst: `goo` −12. Last burst: 2 ladder notes, rungs s, s + 2 with s = min(r0, 8), 90 ms apart, body −14 + tink −18 | see layers | goo rate 1; notes in scale | goo ±3 % | 1 goo | both: goo gives weight; the in-scale rise replaces v1's square wave |
| hugePop (≥ 15) | first burst: `goo`; face burst (`onClimax('huge')`): arpeggio | `goo` −9; arpeggio rungs s, s + 2, s + 4 with s = min(r0, 6), 70 ms apart, body −12 + tink −16 | see layers | goo rate 0.944 (−1 st) | goo ±3 % | 1 goo, 3 notes | both. No slow-mo for Huge, so no duck |
| megaPop (≥ 24) | first burst: `goo` + `sub`; face burst (`onClimax('mega')`, the slow-mo start): **stinger** (§13.6) | `goo` **−10** (M14; was −6), scheduled 25 ms after the first pop voice (A12: a 20–30 ms "crack then bloom" offset reads as explosive); `sub` **−14** (M14; was −10; optional, inaudible on most phones, A14). In a move whose largest gloop is Mega, every gloopPop cell voice is **−14** instead of −12 (M14) | see layers | goo 0.891 (−2 st) | goo ±3 % | stinger is never stolen | both |
| allClear | last burst of the move (`onClimax('allClear')`): **stinger** (§13.6); a swell rides from F to the climax | swell: noise from the shared buffer, bandpass 1.5 → 5 kHz (linear sweep over 800 ms), gain 0 → −22 dB, cut with a 30 ms release on the climax (max 800 ms) | see layers | — | none (rare, A11) | stinger never stolen | both: synth swell has to follow a climax time that is only known on B |
| comboLost | L of the move that lost it | synth sine A4 → E4 (440 → 330 Hz) 160 ms | −24 | fixed | none | 1 | synth. It must be quieter than place (design §6) |
| stageUp | F of the move (L if it clears nothing) | `stage` (C6 + G6) | −12 | 1 | none | 1 | sample: chime in key |
| newBest | F of the move that first passes the best (L if it clears nothing): the same frame as the banner and slow-mo (§9.13.g.6) | `best` **stinger** (§13.6) | −6 | 1 | none (A11) | 1; one stinger per move | sample: a real instrument motif that rises to C. v1 played it at input; fixed |
| stuck | R t0 of `stuck`, with the tray shake (§9.8) | synth triangle G4, E4, C4 (392, 330, 262 Hz), 180 ms each; plus sines an octave up at −10 dB re the triangle | −16 | fixed | none | 1 | synth: falling in key, quiet. Octave layer for phones (A14). Music game-over ramp starts here (§13.7) |
| gameOver | — (panel) | no SFX; music settles (§13.7) | | | | | |
| rescueReady | F of the move that fills the ring | `chime` | −18 | 1 | none | 1 | sample |
| rescueOffered | — | none (the panel's buttons tap) | | | | | v1 played the rescue cue here; removed |
| rescued | R t0 (rescue action) | `swell` −12 at t0; at t0 + 350 ms: a `pop` variant −10 and `chime` −10. Cells popped by the rescue use the gloopPop path if the director animates them; otherwise 3 pops 40 ms apart from t0 + 350 ms | see layers | 1 | pop variant | 3 | sample: reversed squish as the "suck back" (A19) |
| zenShake | the popped cells' bursts (gloopPop path); if not animated, 3 pops 40 ms apart at R t0 | `pop` | −12 | as gloopPop | as gloopPop | as gloopPop | sample |
| uiTap | DOM `click` on any `<button>` except the mute button and toggles | `tap` | −18 | 1 | ±3 % | ≥ 50 ms apart | sample: crisp 7 ms click, in band |
| toggle on / off | the toggle's `click` | synth sine A5 → E6 (880 → 1319 Hz) / E6 → A5, 60 ms; plus `tap` −18 | −22 | fixed | none | 1 | both. Turning "Sound effects" on plays toggleOn after the bus opens. Turning it off is silent |
| coinTick | each coin increment shown (toast or count-up) | `coin1`–`4` −20 (clack) + synth sines G6 + C7 (1568 + 2093 Hz), 40 ms, −26 each (body in band) | see layers | clack ±4 % | 4 variants, ±1 dB | ≤ 12 ticks per count, 50 ms apart | both: the clack measures 90 %+ above 4 kHz, so the in-key synth ping carries it on phones (A14) |
| levelUp | when the level-up toast shows | `level` | −8 | 1 | none | 1 | sample |
| achievement | when the achievement toast shows (the toast queue keeps it ≥ 600 ms from levelUp) | `ach` (C6 + E6 bell) | −10 | 1 | none | 1 | sample |

Notes:
1. **New director callbacks** (§9.13): `onBurst(order, gloopTier, isLastOfGloop)`, called on the B frame each popped (non-line) cell starts its burst. Pop sounds are not pre-scheduled at F, because slow-mo (New best starts at F) and `endNow()` change B's speed after F. Frame quantisation (≤ 17 ms) is fine: picture and sound read as one event without exact sync (A9).
2. **Not slowed:** SFX ignore hitstop and slow-mo (v1 §9.9 rule kept). Only their trigger frames move.
3. **Latency:** no `outputLatency` compensation *(tuning)*. The display adds one or two frames of delay too, which roughly matches typical output buffers (A22, A25). The `?debug=1` overlay shows `outputLatency` so this can be checked.
4. **Fallback:** if a segment is not decoded yet (first seconds, offline, decode error), the event plays its v1 synth recipe at the same gain (v1 recipes kept in `src/audio/fallback.ts`). The first tap is never silent.
5. **Move plan:** at release, `planMove(events, ctx)` (pure, `src/audio/movePlan.ts`) decides everything the move will play: place cells, lines and rungs, tier layers, pop base, which stinger (§13.6), comboLost, stageUp, rescueReady, newBest. The frame callbacks only execute the plan. Nothing in `playForEvents` plays at input except pickUp, snap, returnToTray, deal, stuck, rescued and UI sounds.

### 13.5 Layering, variation and voices
- **Layers** (A12): transient 0–10 ms (tink, tap, the tock of `place`), body 10–100 ms (synth bar, wet pop, squish), tail 100 ms+ (goo, bar decay, stinger bloom). Sub < 80 Hz only as an optional extra (`sub`, the weight layer inside `place` at −20 dB).
- **Simultaneous vs offset:** place layers are simultaneous (punchy). Mega's goo is 25 ms after the first pop voice (explosive) (A12).
- **Mobile-speaker rule** (A14, A15): every cue, summed, must have ≥ 50 % of its energy in 400 Hz–4 kHz, measured on the mixed cue. The build script prints this for every segment (§13.11). The test fixtures check the synth recipes. Pure low or pure high layers (`sub`, coin clack) always come with an in-band layer. 4–5 kHz is tamed with a −4 dB high shelf at 5 kHz on bright sources.
- **Variant pick, no immediate repeat:** `pickVariant(n, last, u)`, with u ∈ [0, 1). n = 1 → 0. Otherwise `i = floor(u·(n − 1))`, and if `i ≥ last` then `i + 1`. Uniform over the n − 1 others (A7, A9, A11).
- **Random ranges:** foley ±3 to ±5 % rate (A8 allows up to ±10 % for non-pitched sounds), ±1 to ±1.5 dB. Pitched (ladder, chimes, stingers): ±3 cents at most, or none (A8).
- **Voice cap:** 24 SFX voices (v1). A 25th voice steals the oldest voice in the lowest class: ui/deal/coin < pop < place < ladder < stinger. Stinger voices are never stolen. Music voices are separate (§13.8).
- **No allocation per call** beyond the source and gain nodes: one 1 s white-noise buffer is made at init and played with random offsets (v1 made a new buffer per noise call).

### 13.6 Big moments: stingers and ducking
- **One stinger per move.** Priority: All Clear > Mega Pop > New best. The lower ones in the same move are dropped; their banners still show. A stinger within 3 s of the last one is dropped too (same rule as slow-mo, §9.13.g.6).
- **Stinger timing rides the slow-mo:** it starts on the same frame as the slow-mo request (Mega: face burst; All Clear: last burst; New best: F). Its musical length is ≈ 40 + 300 + 200 = 540 ms (the slow-mo ramp in, hold and ramp out), plus a tail.
  - **Mega Pop stinger:** a run of 6 ladder notes, rungs `s … s + 5` with `s = min(r0, 5)`, 45 ms apart (body **−13** + tink **−17**; M14, was −10/−14). The last note is held: body **−13** (was −10), decay 600 ms with a 5 Hz, ±15 % tremolo. At +270 ms a bloom: body notes at the top rung and the rung 2 below, **−19** each (was −16), 600 ms decay. Total about 870 ms.
  - **M14 Mega loudness.** Lead's capture of the master output, `?debug=1&demo=feel&scene=mega`, 5 s from onset: **−13.2 LUFS-I, peak −1.2 dBFS**, against a line clear −18.6, a combo move −18.0 and the bed −22.5. A Mega 4.8 dB over a combo is too loud (it is the moment people play with sound on, and the limiter was clearly working: −6 dB threshold, peak −1.2). Target: **−16 LUFS-I ± 1, peak ≤ −3 dBFS**, still ≥ 1.5 dB above a combo move so it stays the top moment. Every Mega-only layer drops 3–4 dB (goo −4, sub −4, stinger −3, Mega pop cells −2), so the sum drops about 3–3.5 dB before the limiter. The duck stays −8 dB: the bed under a Mega is already about −30 LUFS, and a deeper duck would read as the music cutting out. All Clear and New best are unchanged (not measured as too loud).
  - **Final Mega gain table** (dB relative to SFX bus; Mega moves only):

    | Layer (Mega moves only) | Gain |
    |---|---|
    | goo / sub | −10 / −14 |
    | pop cells | −14 |
    | stinger bodies / tinks | −13 / −17 |
    | held note | −13 |
    | bloom | −19 |
    | line clear body / tink | −12 / −16 |
    | fizz | −26 |
    | combo harmony | −22 |
    | sparkle | −24 |

    The line and combo adjustments apply only when the move plan's largest pop is Mega, including their synth fallbacks. Normal line clears, Big/Huge moves, All Clear and New best remain at their existing gains. Target remains **−16 LUFS-I ± 1, peak ≤ −3 dBFS, and at least 1.5 dB above a combo move**.
  - **All Clear stinger:** the full ladder, rungs 0 → 10, 30 ms apart (body −10 + tink −14), then at +330 ms a C-major bloom, rungs 5, 7, 8 (C6, E6, G6), body −14 each, 900 ms decay, 5 Hz tremolo ±15 %.
  - **New best:** the `best` sample (687 ms).
- **Ducking** (A12, A16), only for the stinger that plays (never on ordinary moves, lines, Big or Huge):
  - The music `duck` gain goes to **−8 dB** with a linear **40 ms attack** from the stinger start (A12: fast attack; A16 ducked −9 dB). It **holds until start + 540 ms**, then returns to 0 dB with a linear **900 ms release** (A16: about 1000 ms back).
  - In the same envelope the bed low-pass dips to 1,800 Hz (v1 §9.9 "whoomp", kept) and returns with the release.
  - A new duck while one is running extends the hold (`end = max(end, new end)`). It never goes deeper than −8 dB.
- **Reduced motion:** slow-mo is skipped, but the stinger and the duck still fire on the same frame (§13.10).

### 13.7 Music: one sampled bed + synth layers
**Bed: "Lofi Hip Hop Loop" by omfgdude (OpenGameArt, CC0).**

Why this one:
- Measured key C major (r 0.87), with a two-chord vamp Fmaj7 → Em7, 8 bars each (chroma per 4 s). Our ladder is C pentatonic, so every SFX note sits inside the harmony with no retuning (A1).
- It has no lead melody. The SFX ladder can be the melody (A2), and nothing else fights it in the 400 Hz–4 kHz band (A14).
- −20.4 LUFS with LRA 3.8: soft and steady, so it sits under the SFX (A16).
- It is already mono, 22.05 kHz, so encoding loses nothing and the file is small.

Rejected:
- "Cozy Puzzle In-Game 1" (MintoDog): G major bossa at 118 BPM with a clean 64-bar loop, but its sax and flute lead fights the ladder, and it is mastered at −12 LUFS. Kept as the fallback bed if the listening check (§13.13) fails.
- The v1 generative synth loop: thin, and its 4 chords never change (audit). It is removed; synth survives only as layers.

**Bed processing** (exact recipe in §13.11):
- Source `LofiLoop_2.ogg` as downloaded: Vorbis mono 22,050 Hz, 2,819,906 samples (127.887 s).
- Tempo (measured by onset grid fit): about 120.04 BPM, 4/4, felt half-time. The bpm is metadata only: the runtime uses it for bar-snapped layer changes, which are safe if it is off (below).
- **M14 loop fix (replaces the M11 silence pad).** M11 padded the 2,819,906-sample file with **1,554 samples (70.5 ms) of digital silence** to reach 256 beats at 120.04 BPM (127.957 s). That pad is the "dropout" heard at every loop: the 50 ms before `loopEnd` measure RMS 0.00012 (−78 dBFS, digital zero) against 0.149 (−17 dBFS) after `loopStart`. On top of it the source itself fades over its last ~0.45 s (−23 → −36 dB in 20 ms blocks), so even without the pad the seam dips 20 dB. Re-measuring the grid (onset comb fits 120.02–120.11 BPM with a phase that wanders ±0.15 s across the track; waveform cross-correlation of bars ≤ 0.55) shows the track is played loosely, so "exactly 256 beats" is not a fact we can build on.
  - **New recipe:** no pad. Let x be the high-passed, gain-trimmed source (L = 2,819,906 samples at 22,050 Hz) and F = **1,102 samples (50.0 ms)**. Bake an equal-power crossfade of the tail into the head: for k = 0 … F − 1, `y[L − F + k] = x[L − F + k] · cos(π/2 · (k + 0.5)/F) + x[k] · sin(π/2 · (k + 0.5)/F)`. The loop is `y[F … L)`: **P = L − F = 2,818,804 samples = 127.836916 s**. After `y[L − 1]` (≈ x[F − 1]) the loop jumps to `y[F] = x[F]`, the sample that follows it in the source, so the seam is the source's own continuity.
  - Effect: the downbeat after the seam lands 50 ms earlier than the source's file length (≈ 120 ms earlier than a strict 120.04 grid), once per 2 min 8 s. That is inside the track's own timing looseness and far less audible than 70 ms of silence. Measured on the prototype (float, before encoding): 50 ms before `loopEnd` −18.3 dB, 50 ms after `loopStart` −17.1 dB (gap 1.2 dB; M11: 223 dB); 100 ms before `loopEnd` −21.2 dB; step at the jump 0.0226 = the 90th percentile of all sample steps in the loop (a normal step); peak unchanged −2.0 dBFS. Rejected: a 20 ms fade (gap still 9.7 dB, the source fade stays), 100–450 ms (the downbeat moves 0.1–0.45 s), and patching the last beat from an earlier bar (bars correlate ≤ 0.19, so the patch would not match).
- High-pass 40 Hz. 58 % of the bed's energy is under 200 Hz (measured); the sub rumble is inaudible on phones and only pumps the limiter (A14).
- Static gain −0.59 dB, so true peak is −2.0 dBTP and integrated loudness is −21.2 LUFS. There is no dynamic loudnorm: the bed's mix stays as made.
- **Seamless loop whatever the decoder's delay:** the file is `[last 250 ms of the loop] + [loop] + [first 250 ms of the loop]`. The manifest gives `loopStart = 0.250`, `loopEnd = 0.250 + P/22,050` (M14: **128.086916 s**, was 128.207370 with the pad). The audio around both points is identical, so a decoder that adds or trims a few ms at the file start (MP3 encoder delay, Opus pre-skip) shifts both points together and the seam stays seamless.
- Mono. Encodings in §13.9.

**Music clock:** `pos = ((ctx.currentTime − bedStart) · rate) mod L`. `bar = 4 × 60 / 120.04 = 1.99933 s`. The downbeat is at pos 0 *(tuning; the measured grid phase is uncertain by about ±50 ms)*. Changes "at the next bar" happen at the next `pos ≡ 0 (mod bar)`.

**Safe if the tempo estimate is off:** every layer is non-rhythmic (held pads, randomly timed twinkles). Only the *moment a layer starts or stops* is snapped to the bar, and every change is a 0.6–2 s ramp. A grid that is off by 50 ms or 0.1 BPM therefore can't produce a flam or a clash (A9 quantises entries; A17 needs every layer to work alone).

**Layers and states** (vertical layering, A17). The bed always plays (unless resting). The other layers come and go:

| State | Bed low-pass (Q 0.7) | Pad | Twinkles | Music bus offset |
|---|---|---|---|---|
| tier 0 (C 0–2) | 3,000 Hz | off | off | 0 dB |
| tier 1 (C 3–4) | 4,500 Hz | off | off | 0 |
| tier 2 (C 5–7) | 7,000 Hz | on | off | 0 |
| tier 3 (C 8–11) | open (filter bypassed at 11,000 Hz) | on | off | 0 |
| tier 4 (C 12+) | open | on | on | 0 |
| danger (overrides tiers) | min(tier value, 1,600 Hz) | off | off | −2 dB |
| idle ≥ 30 s without input (A1) | 900 Hz | off | off | −4 dB |
| paused | 400 Hz | off | off | −6 dB |
| game over | 600 Hz, rate → 0.5 | off | off | −6 dB, then rest |
| menus (not the play screen) | — | — | — | silent: fade out 600 ms; on return, resume from the last bar line with a 1 s fade-in |

- **Pad:** E4, A4 and E5 (329.63, 440, 659.26 Hz). These are the tones that are safe over both Fmaj7 and Em7 (E is in both; A is the 3rd of F and the 11th of Em). Each voice is a sine plus a triangle at 2f (−12 dB), with a 0.2 Hz amplitude LFO of 20 % depth, −24 dB each re the music bus. It fades in or out over 1 bar.
- **Twinkles:** `tink` at pitch classes D, E, G or A only (no C, which is a ♭6 over Em7). Same fold rule as the ladder. −22 dB ± 3 dB. Onsets are random, 0.30–0.70 s apart (cosmetic RNG). They go to the music bus after the duck and are not low-passed.
- **Transitions:**
  - Tier rises take effect at the next bar line. The filter moves with `setTargetAtTime`, τ 0.2 s (≈ 600 ms).
  - After a combo loss, the state drops to tier 0 at the first bar line ≥ 3 s later (v1 rule).
  - Danger enters at the next bar line and leaves one bar after its exit condition holds.
  - Idle restores over 600 ms on any input (no bar wait).
- **Danger** (pure `musicState()` in `src/audio/musicState.ts`):
  - On: filled cells ≥ 40, or at most 1 of the remaining tray pieces fits anywhere.
  - Off: filled ≤ 34 and ≥ 2 pieces fit. Zen never enters danger.
- **Game over** (A7):
  - On `stuck` (R t0), the bed's `playbackRate` ramps linearly 1 → 0.5 over 450 ms, which also drops it an octave, ending as the panel slides up (§9.8). The low-pass goes to 600 Hz over 400 ms (§9.8). Layers fade out over 300 ms.
  - 4 s after the panel shows, the bed fades to silence over 3 s and stops.
  - Play again, restart or a rescue: a new bed source at `loopStart`, rate 1, 300 ms fade-in, filter to tier 0 over 300 ms (§9.8 "reopens over 300 ms"). Restart stays instant; audio never blocks input.
- **Pause:** see the table, 200 ms ramps; resume over 300 ms.
- **Hidden tab:** `ctx.suspend()` on `visibilitychange` hidden, `resume()` on visible (this stops SFX too and saves battery).
- **Rest against fatigue** (A6, A18):
  - After the bed has played 3 full loops (6 min 24 s) without a pause, menu or rest, it fades out over 4 s, ending exactly at the end of the 3rd loop.
  - It then stays silent for 60 s; SFX continue. Then it restarts at `loopStart` with a 4 s fade-in. *(tuning)*
  - A pause, menu visit or game over resets the loop count.
- **The ladder key never changes**, since the bed never modulates. A1's phrase-synced key change is not needed.
- **Start:** the bed is fetched only after the first interaction on the play screen, and only if "Music" is on (§13.9). Once decoded, it starts at `loopStart` with a 2 s fade-in. Until then there is no music (A18: silence is fine).

### 13.8 Mix and buses
```
sample/synth SFX voices → voice gain → sfxBus ───────────────────────┐
bed source → bedFilter (low-pass) → bedGain ──┐                      │
pad + twinkle voices → layerGain ─────────────┴→ duck → musicBus ────┴→ master → limiter → destination
```
- `sfxBus` = 1.0 × effectsVolume², or 0 when "Sound effects" is off.
- `musicBus` = 0.71 (−3 dB) × musicVolume², or 0 when "Music" is off. With the bed file at −21.2 LUFS this puts the bed at about −24 LUFS, under the SFX *(tuning)*.
- `master` = 1.0, or 0 when muted (top-bar button, M key).
- **Limiter** (replaces v1's −14 dB / 4:1 glue compressor, which pumped on the bed): `DynamicsCompressorNode`, threshold −6 dB, knee 0, ratio 20, attack 2 ms, release 150 ms. It is a safety net; levels are set offline.
- **Loudness target:** −18 LUFS integrated ± 2 over ≥ 5 min of gameplay, true peak ≤ −1 dBTP (A13: −18 portable; A14: phones gain nothing above about −16). Measure it by recording the tab's output during a 5-minute session and running `ffmpeg -af ebur128=peak=true` on the recording. **Not measured yet** (§13.13).
- Revision 2026-10-25: the bed's about −24 LUFS is the mono-file figure; it reads about −21 LUFS in a stereo tab capture. The master gain is trimmed to 0.674 to cancel DynamicsCompressorNode automatic makeup gain (+3.42 dB).
- **Asset normalisation (offline):**
  - One-shots: sample peak −1 dBFS after edits. Short sounds are under the 400 ms EBU gating block, so peak is the reliable measure. The §13.4 gains set the loudness balance.
  - Bed: static gain to `min(−18 LUFS, −2 dBTP)`, which gives −21.2 LUFS (above).
- **Voice cap:** 24 SFX voices (§13.5). Music voices: 1 bed (2 for 300 ms during a restart crossfade), 6 pad oscillators, ≤ 3 twinkles.
- **Volume curve:** sliders 0–100 % in steps of 10. Gain = v², so 50 % ≈ −12 dB.

### 13.9 Loading, formats, service worker, settings
- **Files** (`public/audio/`, content-hashed names written by the pipeline; prototype sizes measured on 25 Oct):

| File | Codec | Budget | Prototype |
|---|---|---|---|
| `sfx.<hash8>.ogg` | Opus 48 kbps, mono, 48 kHz | ≤ 96 KB | 66 KB |
| `sfx.<hash8>.mp3` | MP3 96 kbps CBR, mono, 44.1 kHz | ≤ 144 KB | 100 KB |
| `music.<hash8>.ogg` | Opus 40 kbps, mono, 48 kHz | ≤ 760 KB | 706 KB |
| `music.<hash8>.mp3` | MP3 48 kbps CBR, mono, 22.05 kHz (the source is 22.05 kHz, so nothing is lost) | ≤ 820 KB | 753 KB |

  Per device, one format only: ≤ 856 KB (Opus) or ≤ 964 KB (MP3). Both are under the 1.5 MB cap. `tools/check-size.mjs` enforces the per-file budgets and the per-device total during `npm run check`.
- **Format choice** (A23):
  - `pickFormat(canPlayType)`: `'ogg'` only if `canPlayType('audio/ogg; codecs="opus"') === 'probably'`, else `'mp3'`.
  - "maybe" counts as no, because Safari 17.4–18.3 has only partial Ogg support (A23).
  - If decoding the `.ogg` fails, fetch the `.mp3` once and use that for the session.
- **Manifest:** `src/audio/manifest.ts`, generated (§13.11), typed and committed:
  - `files: { sfx: { ogg, mp3 }, music: { ogg, mp3 } }`, with paths relative to `import.meta.env.BASE_URL`
  - `markerAt: 0.100`
  - `segments: Record<SegmentId, { start, dur, rootMidi?, sources: CreditId[] }>`
  - `music: { loopStart, loopEnd, bpm: 120.04, beatsPerBar: 4, downbeat: 0, sources }`
  - `durations` of each encoded file (from ffprobe, for the tests)
- **Sprite sync marker:** the sprite has a 2-sample click (+0.9, −0.9) at exactly 0.100 s and silence everywhere else before 0.200 s.
  - After decoding, `findSpriteOffset(data, rate)` takes the position of the largest |sample| in [0, 0.3 s] and subtracts 0.100. That gives δ, the decoder's added or trimmed delay.
  - Every segment is copied into its own `AudioBuffer` from `start + δ`, and the big buffer is dropped. This works on every decoder and both formats without trusting gapless metadata.
- **Order and timing:**
  1. No `AudioContext`, no fetch and no decode before the first `pointerdown`/`keydown` (R21, A20).
  2. Boot sets `navigator.audioSession.type = 'ambient'` where supported (A24), before any context exists. Declare a small local interface for the type; no `any`.
  3. First gesture: create the context, resume it, then fetch and decode the SFX sprite at once. Synth fallbacks cover the gap (§13.4 note 4).
  4. Music: fetch on the first interaction *on the play screen*, after the SFX sprite is decoded or 2 s after the gesture, whichever is first. Use `{ priority: 'low' }` where supported. Never fetch it while "Music" is off; fetch when it is turned on.
- **Service worker:**
  - The Vite plugin's precache list excludes every path under `audio/`, via an exported pure `precacheFilter(file)`.
  - It injects `AUDIO_FILES` (all four current audio paths) into the template.
  - `sw.template.js`: GET requests under `${base}audio/` are cache-first in a separate cache named `gloop-pop-audio`. The name is not versioned, and the files are content-hashed, so audio survives code deploys.
  - Only the format the page actually fetched gets cached. One device never downloads both.
  - On `activate`: the old-version cleanup skips `gloop-pop-audio`, and in that cache, entries whose path is not in `AUDIO_FILES` are deleted.
  - Offline on a first visit: no audio files, so SFX use the synth fallback and there is no music.
- **Settings** (all existing hooks keep working):
  - "Sound effects" toggle → `sfxBus`.
  - "Music" toggle → `musicBus`; off also skips the music fetch.
  - Top-bar mute and the M key → `master`, persisted as today.
  - **New:** "Effects volume" and "Music volume" sliders (0–100 %, default 100 %), saved as `settings.sfxVolume` and `settings.musicVolume`, numbers 0–1. A missing value loads as 1.
  - Why: the sampled bed is more present than the v1 synth bed. Balatro ships separate volumes (A7). Players who find audio tiring mute it (A16), so a middle step keeps them listening.
  - UI in §11.14. Effects volume plays a `place` preview on release (`change`). Music volume applies live.

### 13.10 Reduced motion
Reduced motion does **not** change audio: the same sounds, gains and ladder. The director callbacks fire as they do in reduced mode:
- L and F = release.
- `onBurst` fires at the 150 ms fade start, in burst order.
- `onClimax` fires at release + 150 ms, even though no slow-mo runs.

Stingers and ducks therefore still land on their moment. Hitstop and slow-mo never delay or stretch any sound. Haptics and audio both stay independent of reduced motion (§9.13.k).

### 13.11 Offline asset pipeline (`tools/build-audio.mjs`)
- **What it is:** a Node 20 script with no dependencies. It runs `ffmpeg`/`ffprobe` (≥ 6, with libopus and libmp3lame) through `child_process.spawnSync`. It is run by hand (`npm run audio`) and is **not** part of `npm run check`. Every ffmpeg call uses `-nostdin -v error -map_metadata -1 -fflags +bitexact -flags:a +bitexact`. The script records `ffmpeg -version`'s first line in the manifest.
- **Inputs:** `assets-src/audio/`, holding exact copies of only the files used, plus `assets-src/audio/SOURCES.md`. For each file, SOURCES.md lists: path, SHA-256, title, author as named on the page, page URL, licence name and URL, the date the licence was verified (2026-10-25), and how the file was obtained. Freesound files are the HQ preview MP3s downloaded from each sound's page; the originals need a login.

  ```
  assets-src/audio/freesound/fs325583.mp3, fs802606.mp3, fs442772.mp3, fs500912.mp3
  assets-src/audio/kenney/impact-sounds/impactSoft_medium_000.ogg … _004.ogg, impactSoft_heavy_000.ogg, License.txt
  assets-src/audio/kenney/interface-sounds/glass_002.ogg, click_003.ogg, confirmation_002.ogg, confirmation_003.ogg, confirmation_004.ogg, License.txt
  assets-src/audio/kenney/casino-audio/card-place-1.ogg, card-place-2.ogg, card-place-4.ogg, chips-collide-1.ogg … -4.ogg, License.txt
  assets-src/audio/kenney/music-jingles/jingles_STEEL10.ogg, jingles_PIZZI10.ogg, License.txt
  assets-src/audio/oga/lofi-hip-hop-loop.ogg   (as downloaded: LofiLoop_2.ogg)
  ```
- **Common steps per segment:**
  1. Decode, downmix to mono (average of channels: `-ac 1`) and resample to 48 kHz float.
  2. Apply the listed edits.
  3. Peak-normalise to −1 dBFS.
  4. Print the duration, peak, and % of energy in 400 Hz–4 kHz and under 200 Hz. Fail if a cue marked "in band" is under 50 % (§13.5).
- **Pitch shift** = `asetrate=48000·2^(cents/1200),aresample=48000` (changes speed with pitch, like `playbackRate`).

| Segment | Edits (ffmpeg filters, in order) |
|---|---|
| `pop1`–`pop6` | fs325583.mp3, windows (start s, length s): (0.254, 0.141), (1.825, 0.189), (7.713, 0.209), (14.851, 0.147), (16.472, 0.178), (23.428, 0.215); `highpass=f=200`, `afade=t=in:d=0.002`, `afade=t=out` over the last 30 ms |
| `place1`–`place5` | sum (`amix=normalize=0:duration=longest`) of: (a) fs802606.mp3 at 1.715 / 2.595 / 5.169 / 6.933 / 7.586 s, 140 ms: `highpass=f=150`, fade in 2 ms, fade out from 80 ms over 60 ms; (b) `impactSoft_medium_000`…`004` whole: `highpass=f=60`, `volume=6dB`, `asoftclip=type=tanh`, `volume=-20dB`; (c) fs442772.mp3 from 0 / 30 / 60 / 90 / 120 ms, 90 ms: `highpass=f=300`, `lowpass=f=3500`, fade in 3 ms, fade out from 30 ms over 60 ms, `volume=-6dB` |
| `goo` | fs500912.mp3 0–0.450 s: `lowpass=f=4000`, `highpass=f=120`, fade out from 0.25 s over 0.2 s |
| `sub` | impactSoft_heavy_000.ogg 0–0.350 s: `volume=6dB`, `asoftclip=type=tanh`, fade out from 0.2 s over 0.15 s |
| `tink` | glass_002.ogg whole: pitch −4 cents; fade out from 80 ms over 40 ms |
| `tap` | click_003.ogg whole: no edit |
| `deal1`–`deal3` | card-place-1 (0.095, 0.162), card-place-2 (0.141, 0.114), card-place-4 (0.250, 0.173): `highpass=f=250`, `highshelf=f=5000:g=-4`, fade out over the last 40 ms |
| `coin1`–`coin4` | chips-collide-1 (0.079, 0.083), -2 (0.027, 0.097), -3 (0.119, 0.077), -4 (0.043, 0.069): `highshelf=f=5000:g=-4`, fade out over the last 30 ms |
| `chime` | confirmation_003.ogg whole: pitch −200 cents |
| `stage` | confirmation_002.ogg whole: pitch −200 cents |
| `ach` | confirmation_004.ogg whole: pitch −400 cents |
| `best` | jingles_STEEL10.ogg whole: pitch +484 cents |
| `level` | jingles_PIZZI10.ogg from 0.015 s: pitch +496 cents |
| `swell` | fs442772.mp3 0–0.350 s: `lowpass=f=4000`, `highpass=f=200`, `areverse`, `afade=t=in:d=0.25:curve=exp` |

- **Sprite layout:** 0.100 s silence; the marker (2 samples, +0.9 and −0.9, at sample 4,800); silence to 0.200 s; then the segments in table order, each followed by 50 ms of silence. The sprite is about 8.2 s. Encode `sfx.ogg` with `-c:a libopus -b:a 48k -application audio`. Encode `sfx.mp3` with `-ar 44100 -c:a libmp3lame -b:a 96k`.
- **Music:**
  1. Decode lofi-hip-hop-loop.ogg at its native 22,050 Hz, mono.
  2. `highpass=f=40`.
  3. `volume=-0.59dB`. L = the decoded length (assert L = 2,819,906; fail the build otherwise, since the loop points depend on it). No padding (M14).
  4. Bake the 50 ms equal-power crossfade of §13.7 (F = 1,102) and keep the loop `y[F … L)`, P = 2,818,804 samples.
  5. Prepend the last 250 ms and append the first 250 ms of the loop (as before). The manifest's `loopEnd` is `0.25 + P / 22050`, printed with 9 decimals.
  6. Encode `music.ogg` with `-ar 48000 -c:a libopus -b:a 40k -application audio`. Encode `music.mp3` with `-ar 22050 -c:a libmp3lame -b:a 48k`.
- **Outputs:**
  - The 4 files in `public/audio/`, named with the first 8 hex digits of each file's SHA-256. Older files in that folder are deleted.
  - `src/audio/manifest.ts`, with segment times measured from the rendered sprite, `durations` from ffprobe on each encoded file, and SHA-256 of every source.
  - A report on stdout.
- **Credits link:** each segment lists its `sources` (credit ids from `src/audio/credits.ts`). `CREDITS.md` "Changes" quotes the table above. A test keeps them in sync (§13.12).

### 13.12 Test checklist (unit tests, colocated)
1. **Ladder:**
   - `rungMidi` equals `[72, 74, 76, 79, 81, 84, 86, 88, 91, 93, 96]`; `freq` matches the Hz list ± 0.01.
   - `rungFor(C, i) = min(clamp(C − 1, 0, 10) + i, 10)`; C 0 or 1 gives rung 0.
   - `rate(t, root) = 2^((t − root)/12)`; the fold keeps |Δ′| ≤ 6; tink rates match §13.3 ± 1e−4.
   - Lines voiced ≤ 5.
2. **Variants:** over 10,000 draws `pickVariant` never returns `last` (n ≥ 2), each other index gets 1/(n−1) ± 5 %, and n = 1 gives 0.
3. **Rate limits:**
   - pop voices start ≥ 25 ms apart, and skipped bursts still advance k
   - place ≥ 40 ms; snap ≥ 120 ms, and none while |v| > 8 c/s; uiTap ≥ 50 ms
   - coin ≤ 12 ticks per count
   - ≤ 6 live pop voices
4. **Voice cap:** the 25th voice steals the oldest voice in the lowest class; a stinger is never stolen.
5. **Manifest:**
   - Every segment has `start ≥ markerAt + 0.1` and `start + dur ≤ durations.sfx[fmt] − 0.05` for both formats.
   - Segments don't overlap.
   - `0 < loopStart < loopEnd ≤ durations.music[fmt]`, and `loopEnd − loopStart = 256 × 60 / 120.04 ± 0.001` s.
6. **Gesture rule:** importing `src/audio` and calling every sfx, music and loader function before `initAudioOnFirstInput()` constructs no `AudioContext`, calls no `fetch` and throws nothing (spy on the global constructor and `fetch`).
7. **Formats:** `pickFormat` returns `'ogg'` for 'probably' and `'mp3'` for 'maybe' and ''. An ogg decode failure triggers exactly one mp3 fetch.
8. **Sprite marker:** `findSpriteOffset` on a synthetic buffer with the click at 0.1 + δ returns δ to within 1 sample, for δ ∈ {−0.05, 0, +0.04} s.
9. **comboUp fix:**
   - `planMove([placed, cleared, comboUp, scored])` plus `playForEvents` at input play no lineClear (spy).
   - The impact handler plays exactly one lineClear, with the post-move C and tier.
   - A 2-line tier-2 move plays notes at rungs r0 and r0 + 1, one harmony note and 4 sparkle tinks.
10. **Stingers:**
    - newBest is not played at input; it is played at F (or L).
    - With All Clear + Mega + New best in one move, only the All Clear stinger plays.
    - A stinger < 3 s after the last one is dropped.
11. **Ducking:**
    - Only allClear, megaPop and newBest stingers schedule a duck; place, line, pop, Big and Huge never do.
    - The duck schedule reaches −8 dB at t0 + 40 ms, holds to t0 + 540, and is back at 0 dB at t0 + 1,440 ms.
    - Overlapping ducks extend, never deepen.
12. **Service worker:** `precacheFilter` drops every `audio/…` path; the built `sw.js` PRECACHE has no `/audio/` entry; `AUDIO_FILES` lists all 4 files; the template's cleanup keeps `gloop-pop-audio` (string test on the template).
13. **Credits:**
    - Every manifest segment's `sources` and `music.sources` are ids in `credits.ts`.
    - Every credit except `original` is used at least once.
    - `CREDITS.md` contains each credit's title, author, URL and licence name verbatim.
    - The Credits screen lines come from `credits.ts` (render the screen in jsdom and compare).
14. **Music state:** `musicState()` gives the §13.7 table for tiers 0–4, danger (with hysteresis 40/34 cells and the fit count), idle at 30,000 ms, paused and game over. Zen never gives danger. Tier changes are scheduled at the next bar line (`nextBar(pos)`). On `stuck`, the bed rate is scheduled 1 → 0.5 over 450 ms.
15. **Rest:** after 3 loops the bed fades out at the loop end, is silent for 60 s, and restarts at `loopStart`. A pause resets the count.
16. **Reduced motion:** the same audio calls (names, gains, order) with reduced motion on and off for a Mega Pop move. The stinger fires in both.
17. **Size:** `check-size.mjs` fails when any audio file exceeds its budget or the per-device total exceeds 1.5 MB.
18. **Synth band rule:** for every synth recipe, a 48 kHz offline render (pure TS oscillator maths, no WebAudio) has ≥ 50 % of its energy in 400 Hz–4 kHz.

### 13.13 Unverified by ear (listening checklist for the director, on a phone speaker and on headphones)
All of these come from measurement only:
1. The bed's loop seam (M14: no pad, 50 ms baked crossfade; the downbeat comes ~50 ms early once per loop). Fallback: a longer crossfade (100 ms), or switch to "Cozy Puzzle In-Game 1" (clean 64-bar loop at 118 BPM, G major; keeps the ladder, since C pentatonic is inside G major).
2. Whether the bed's "lofi" character suits the candy look, and how it sounds after 3 loops.
3. Whether the `place` mix (tock + weight + squish) reads as "jelly lands" and not as a mouth noise. Fallback: drop layer (a) and raise (c) by 3 dB.
4. Whether the `pop1`–`6` mouth pops read as gloops and not as a person, and whether ±3 % and the +0.5 st/pop rise feel right.
5. The `tink` + synth bar blend as a "candy instrument", and the folded tink register jumps (rungs 3 and 8 fold down).
6. Whether the retuned Kenney jingle (`best`, `level`) and chimes are in tune with the bed (cents offsets come from pitch tracking).
7. All §13.4 gains, the −8 dB duck depth, the bed bus at −3 dB, and the −18 LUFS integrated target (not measured).
8. The pad (E/A) over the Fmaj7–Em7 vamp, and the twinkle density.
9. The 0.5× game-over slow-down: it may sound sad rather than "settling". Fallback: 0.75×.
10. Coin clack + ping, deal cards, UI tap at −18/−20 dB on a phone at low volume (A15).

---

## 14. Themes
Each theme is only a palette set (`theme.<id>` in palette.json) plus a **silhouette style** and a **particle of the air** (the "stars" layer). No other code differences.

| id | Name | Silhouettes (layer 4) | Air layer (layer 2) | Moon |
|---|---|---|---|---|
| midnight | Midnight Candy Shop | sweet jars with lids on 2 shelves | stars | moon |
| sunset | Strawberry Sunset | rooftops and a café awning with scalloped edge | few stars, warm | low sun disc, no halo pulse |
| aquarium | Mint Aquarium | kelp strands (sine-swaying capsules) and rocks | rising bubbles (rings) instead of stars | light shaft from the top (gradient trapezoid) |
| observatory | Starlight Observatory | telescope dome and hills | 2× stars + slow shooting star every 9 s | big planet with ring |
| kitchen | Cinnamon Kitchen | shelves with mixing bowls and rolling pins | floating flour dust (slow, large, faint) | hanging lamp (glow from the top) |
| snowglobe | Snow Globe | pine trees and a tiny house with lit window | falling snow (60 flakes, sway) | full moon |
| dawn | Golden Dawn | hills with candy-cane fence | fading stars + 3 drifting clouds | rising sun with rays (rotating 2°/s) |

Theme switching: 400 ms crossfade of the background canvas; board and gloop caches rebuilt.

---

## 15. Layout

### 15.1 Portrait (reference 390 × 844 CSS px, no safe-area insets)
(Pass 3: Classic, Expert and Adventure add a 30 px goal strip under the score band. Those numbers, and the Pixel 7 table, are in §20.8. This table stays exact for Daily and Zen.)
Bands from the top (H = viewport height, safe insets added to the top and bottom bands):

| Band | y from → to | Contents |
|---|---|---|
| Top bar | 0 → 60 | icon buttons 44 px at y 8: menu x 12; daily pill centred; mute x 290; pause x 334 |
| gap A | 60 → 86 | (26 px of leftover space, see 15.3) |
| Score | 86 → 170 | score baseline y 136 (52 px), best baseline y 160 (15 px) |
| gap B | 170 → 196 | |
| Board | 196 → 564 | frame x 11 → 379 (368 px); grid x 19 → 371, y 204 → 556; c = 44 |
| Combo strip | 564 → 608 | combo label + pips left at x 20, rescue ring right (centre x 356, y 586, 40 px) |
| gap C | 608 → 660 | |
| Tray | 660 → 828 | 3 slots, each 122 × 160, x 4/134/264 (gaps 8), centre y 744; ct = min(26.4, 122/5.4) = 22.6 |
| Bottom | 828 → 844 | 16 px + safe-area-inset-bottom |

Tutorial bubble: bottom edge 12 px above the tray top, centred on the target slot. Toasts: y 64 (overlapping gap A and score; toasts are short-lived).

### 15.2 Desktop / landscape (reference 1280 × 800)
| Element | Position |
|---|---|
| Top bar | y 0 → 72, buttons 44 px at y 14; menu x 24; daily pill centred; mute x 1156, pause x 1212 |
| Board | frame 560 × 560 at x 360 → 920, y 120 → 680; grid inset 8 px → 544 px; c = 68 |
| Left panel | x 72 → 312: "Score" label y 170 (18 px), score y 230 (64 px), best y 268 (18 px), combo label + pips y 360, stage text "Stage 3" y 400 (16 px `ui.textDim`), rescue ring centre (192, 500), 56 px |
| Right panel (tray) | x 968 → 1208: 3 slots 240 × 168 at y 128, 316, 504 (centres 212, 400, 588); ct = min(40.8, 240/5.4, 168/5.4) = 31.1 |
| Controls hint | y 760, centred, Nunito 700 14 px `ui.textDim`: "Drag pieces, or press 1 2 3, arrows and Space" (hidden after 3 runs) |

### 15.3 Responsive algorithm (`src/render/layout.ts`, pure function, unit-tested)
- `portrait = H / W ≥ 1.25`.
- **Portrait:** non-board bands at reference total 372 px (top 60, score 84, combo 44, tray 168, bottom 16). Scale them by `k = clamp(H / 844, 0.78, 1.15)`. `board = min(W − 22, 560, H − 372k − safeTop − safeBottom)`, rounded down to a multiple of 8 for the grid; `c = (board − 16) / 8`. Leftover vertical space is split 25% gap A, 25% gap B, 50% gap C. Widths > 600: centre a 600 px wide column.
- **Landscape:** `u = min(W / 1280, H / 800)`, clamp 0.6–1.4; scale every 15.2 value by u around the centre. If `W < 900` and landscape (phone sideways), use the portrait layout inside a centred column of width `H × 0.62`.
- Canvas covers the whole viewport; DOM HUD buttons are positioned from the same layout object (CSS variables set on resize).
- Resize/orientation change: recompute layout, rebuild caches, no state change.

---

## 16. Haptics (`navigator.vibrate`, skipped silently where unsupported; setting "Vibration")
(superseded by §9.13.k)
| Event | Pattern (ms) |
|---|---|
| pick up | 5 |
| place | 8 |
| 1 line | 14 |
| 2+ lines | 22 |
| Big/Huge Pop | [18, 30, 18] |
| Mega Pop / All Clear | [30, 40, 30, 40, 50] |
| stuck | 40 |
| UI button | none |

## 17. Accessibility
- Mute button always visible on the play screen (R21). M key mutes.
- Colour-blind patterns (§5.4) + per-flavour toppers and eye styles (always on).
- Reduced motion (§9.11).
- All DOM buttons are real `<button>` elements with text or `aria-label`. Canvas has `role="img"` and an `aria-live="polite"` hidden region announcing "Cleared 2 lines, 452 points" and "Game over, score 8,450".
- Text contrast per §3. Minimum text size 14 px.

## 18. Never do
1. Never draw plain flat squares for pieces, or any piece without the §5.2 layers and a face. No "programmer art" placeholders after M2.
2. Never use pure black `#000` or pure white backgrounds; never use grey boards.
3. Never write hex colours outside `src/render/palette.ts`. No CSS hex either.
4. Never use `ctx.shadowBlur` or `ctx.filter` in the per-frame path (caches only).
5. Never block input for an animation. Never make the player wait more than 450 ms after a loss to restart.
6. Never shake the DOM UI or the text panels; shake only the canvas game layer.
7. Never use stock emoji in the canvas art (emoji are only for the share text).
8. Never use more than 2 font families. Never use thin or light font weights.
9. Never put text over the board during play except pop numbers, event labels, the tutorial bubble and the "New best!" banner.
10. Never use sharp-cornered UI rectangles or hairline 1 px borders on panels.
11. Never fake a near-miss, never animate a fake "almost" spin, never show a countdown to pressure a purchase (there are none).
12. Never auto-play sound before the first user input.
13. Never use red/green alone to signal valid/invalid placement (we use the ghost and faces).
14. Never let particles exceed the cap or allocate objects per frame in the render loop.
15. Never use hype words in UI text ("epic", "insane", "awesome", "legendary", "ultimate"). The only exclamations allowed are the ones in design §16.4.

## 19. 64 px thumbnail test (R12)
Render the app's OG image and a mid-game screenshot scaled to 64 px wide: each flavour must still be identifiable by colour and topper silhouette, the board must read as a grid of sockets, and at least one face must be visible. Done in M9.4 by eye.

---

## 20. Goals and Adventure UI (pass 3)

Added 25 Oct 2026 for design §24. Everything here reuses the existing look: candy-pill buttons (§11.1), panels and modals (§11.3), cards (§11.7), toasts (§11.8), bars (§11.9), the gloop renderer for every gloop picture (§5, `miniGloop.ts`), and only existing palette roles. Reference sizes: **Pixel 7 = 412 × 915 CSS px** (portrait, no safe-area insets in Chrome) and **desktop = 1280 × 800**. Where this section conflicts with §15, this section wins.

**Binding rule for this whole section:** nothing here blocks or delays input during play. Goal-strip and HUD motion runs on the R clock, particles on W (§9.13.a). Hitstop freezes only B, as before. Panels only open between attempts. The map and the start card are menus, not play.

### 20.1 Sugar cubes on the board (Adventure only)
- **Sugar cube (cell value 8):** a rounded square 0.84c wide, centred in the cell, radius **0.18c**, so it looks firmer than a jelly (gloop bodies use 0.28c, §4). Vertical gradient `fx.sugar` (top) → `ui.textSecondary` (bottom). Outline 0.05c `ui.textDim`. Three 4-point sugar glints (`light.specular`, alpha 0.8, sizes 0.08c / 0.06c / 0.05c) at fixed spots (upper left, centre right, lower middle). A small sleepy face (pillar 3: everything is alive): face box f = 0.4c, centred 0.06c below the middle, two closed-eye arcs and a tiny flat mouth in `face.ink` at alpha 0.55. Cubes don't blink or look at the finger. Once every 6–9 s (cosmetic RNG), a cube does a 160 ms 2% squash so it isn't perfectly still (pillar 3).
- **Hard cube (value 9):** the sugar cube plus a frost cap: the top 38% of the body is overlaid with `ui.freeze` at alpha 0.6, with a wavy lower edge (3 arcs). The outline is 0.07c `ui.focusRing`.
- **Never** a gloop: no merging, no shared body, no topper, and a 0.12c gap to every neighbour, like two different flavours (§4).
- **Cached** like gloop bodies (§5.3): 2 sprites per theme per c (`render/cubes.ts`), redrawn into the board layer cache. Nothing per frame except the idle squash.
- **Crack (9 → 8), B clock at the line-clear peak F (§9.13.f):** the frost cap breaks into 8 shard particles (`ui.freeze`, triangles 0.10–0.16c, outward 0.6–1.2c over 380 ms, gravity 2c/s², fade), and the cube swaps to the plain sprite on the same frame. Sound: `place` sample at rate 1.4, −14 dB.
- **Removed (8 → 0), at the cell's burst frame like a line cell:** the cube squashes 1 → 1.15 × 0.85 over 60 ms, then bursts into 10 sugar sparkles (`fx.sugar`, the existing sparkle sprite) and a soft puff ring (`fx.sugar` alpha 0.4, radius 0.3c → 0.7c, 220 ms). Sound: a `pop` variant at rate 1.2, −12 dB, on the gloopPop path (§13.4) so the voice limits apply.
- **Colour-blind patterns:** cubes are already told apart by shape and face. The hard cube's frost cap is a shape too, so no pattern is needed.
- **Preview (§8.4):** a line that would clear outlines its cubes with the line glow. A hard cube in it shows a 1 px `ui.focusRing` crack line as a hint.

### 20.2 Adventure map screen
A full screen like Home (§11.3: the canvas keeps drawing the theme background, and the screen is DOM over it). Vertical scroll, **level 1 at the bottom**, the path climbing upward.

**Header (fixed, height 64):** Back icon button (44) at x 12, y 10. Title "Adventure" (Screen title style), centred. Right: stars chip "★ 54" (chip §4, `ui.panelSolid`, a 16 px `ui.gold` star) and the coins chip, 8 px apart, right edge at W − 12. **Coins chip (M14, here and on Home):** a 16 px coin icon (`icons.ts` `coin`: a filled circle in `ui.coin` with a 2 px inner ring in `ui.coinShade`, no hex in the SVG, colours from CSS variables) 6 px before the number, `aria-label` "{n} coins". The M13 headers showed a bare "0" or "120" next to the stars, with nothing saying it was coins.

**Scroll area:** from the header's bottom edge to the footer bar's top edge (below). `overflow-y: auto`, `overscroll-behavior: contain`. Content column width = min(W, 600), centred. The scroll viewport **ends at the footer bar**, so no node or chapter card can ever scroll under the bar or the header (M13; the M12 layout let the "Play level N" button cover the bottom of a chapter card on phones).

**Map geometry (M13, binding).** One pure function, `mapGeometry({ w, h, safeTop, safeBottom })` in `src/ui/screens/mapGeometry.ts`, returns every position below. The DOM, the SVG path and the scroll target all use it; CSS sets sizes and looks only, never offsets. "Desktop" means viewport width ≥ 800, as before.

| Constant | Phone | Desktop |
|---|---|---|
| Header height `HH` | 64 | 72 |
| Footer bar height `FB` (16 + button + 16) | 88 (button 56) | 84 (button 52) |
| Node diameter (hard) | 64 (72) | 72 (80) |
| `RH` = hard node radius | 36 | 40 |
| `CAP` = caption block under a node (3 + 16 stars/lock/Continue line, 3 + 14 "Hard" line) | 36 | 36 |
| Node box width (circle and captions) | 80 | 88 |
| Pitch `P = 2·RH + CAP + 8` | 116 | 124 |
| Chapter card height `CARD` (fixed) | 112 | 112 |
| Gap under a card `GU` (clears the 30 px mini gloop of the node below) / over a card `GO` | 32 / 12 | 32 / 12 |
| Chapter slot `SLOT = CARD + GU + GO + 2·RH + CAP − P` | 148 | 148 |
| Content padding: bottom `PB` / top `PT` | 24 / 16 | 24 / 16 |

- **Node centres** (content coordinates, y down, content height `HC`): `up(n) = PB + RH + CAP + (n − 1)·P + floor((n − 1) / 20)·SLOT` is the distance from the content bottom, and `cy(n) = HC − up(n)`. `cx(n) = colW / 2 + OFFSETS[(n − 1) mod 8] × colW`. A node's **box** is from `cy − r` to `cy + r + CAP` (r = its own radius), box width as in the table, centred on `cx`.
- **Chapter card c** (c = 1…6) sits above level 20c, the top end of its chapter: bottom edge `cy(20c) − RH − GU − 4px`, top edge 112 above that, width `min(colW − 32, 520)`, centred. With the slot above, there are always 12 px between a card's top edge and the box bottom of level 20c + 1. Level 20c + 1 is an easy level, so its node uses the normal radius; the 4 px offset accounts for that smaller node while preserving the 12 px gap.
- **Content height** `HC = up(120) + RH + GU + CARD + PT` (phone 14,836 px, desktop 15,796 px).
- **The frontier's mini gloop** (40 px, peeking 30 px over the node) is decoration: `pointer-events: none`, drawn above the path. It may overlap the caption of the node above it, never a card or a bar (GU covers it).
- **Footer bar (fixed, new in M13):** `position: absolute; bottom: 0`, height `FB + safe-area-inset-bottom`, the column width (full width on phone; x 340 → 940 on desktop, like the header), background `ui.panel`, shadow `0 −4px 12px light.shadow` (the header's shadow, mirrored). The button sits 16 px below the bar's top edge. The bar never hides: when every level is won it holds the design §16.4 text line instead of the button, so the scroll geometry never changes.
- **Scroll viewport:** top = `safeTop + HH`, height `V = h − safeTop − safeBottom − HH − FB`. The `.adventure-scroll` element's bottom inset is exactly `FB + safe-area-inset-bottom`.
- **Chapter card text:** fixed height 112, `box-sizing: border-box`; every line is one line (`white-space: nowrap; overflow: hidden; text-overflow: ellipsis`), so a narrow phone can't make the card taller than its slot.

**Nodes:** `<button>` circles, 64 px (hard levels 72 px; desktop 72 / 80), centred on (`cx`, `cy`) above. `OFFSETS = [0, 0.18, 0.28, 0.18, 0, −0.18, −0.28, −0.18]`. Level 1 is at the bottom. A chapter card sits above levels 20, 40, 60, 80 and 100, and above level 120 too, where it says the chapter is the last.
- **Node states:**
  - *Won:* gradient `ui.secondaryTop` → `ui.secondaryBottom`, 4 px lip `ui.secondaryLip`, the number in Baloo 2 800 24 px `ui.textPrimary`. Under the node, three 16 px stars 4 px apart: earned = `ui.gold` with a `ui.coinShade` 1 px inner edge; not earned = `ui.track` with a 2 px `ui.panelBorder` outline.
  - *Next (the frontier):* the primary candy gradient (§11.1) with lip `ui.primaryLip`, the number in `ui.textOnPrimary`. A 40 px mini gloop of the chapter flavour (ch1 cherry, ch2 lemon, ch3 apple, ch4 blueberry, ch5 grape, ch6 bubblegum; expression `idle`) peeks over the node's top edge. The node pulses at scale 1 ↔ 1.06, 1,200 ms, `easeInOutSine` (CSS, off in reduced motion).
  - *Locked:* `ui.disabled` fill, number `ui.disabledText`, no lip, a 16 px lock icon in place of the stars. Disabled.
  - *Hard:* any of the above plus a 4 px ring `ui.danger` 3 px outside the node, and the label "Hard" (Small/caption style, `ui.danger`) under the stars.
  - *Paused attempt:* the label "Continue" (Small, `ui.textPrimary`) in place of the stars.
- **Path:** one inline `<svg>` behind the nodes and the cards (cards are opaque and sit above it), a Catmull-Rom curve through the node centres from `mapGeometry`, `viewBox = 0 0 colW HC`. Stroke 10 px, `stroke-linecap: round`, `stroke-dasharray: 0 18` so it is drawn as sugar dots: `ui.panelBorder` alpha 0.9 for the part beyond the frontier, `ui.gold` alpha 0.8 up to the frontier node.
- **Chapter card** (a card, §11.7, size and place above): heading "Chapter 2 · Sugar cubes" (Button-secondary style), "34 / 60 ★" (Small, `ui.gold` star). Two reward lines (Small, `ui.textSecondary`): "All 20 levels: 200 coins, 100 XP" and "All 60 stars: 300 coins", each with a check icon in `ui.success` once paid. A 56 px mini gloop of the chapter flavour sits on the left (§11.7 card illustration).
- **Footer button:** primary "Play level 23", width min(W − 32, 360), centred in the footer bar. It opens that level's start card (the frontier, or the paused level if there is one). When it opens a paused level the label is "Continue level 23" (M14), matching the node's "Continue" label.
- **On open:** `scrollTop = clamp(round(cy(target) − 0.6 × V), 0, HC − V)`, where target = the paused level, else the frontier (at most 120). Instant, never animated, so it can't feel slow. The target node's box and its mini gloop are always fully inside the viewport. A newly unlocked node (after a win) plays a one-time unlock: lock icon scales to 0 (160 ms), the node flips to "next" with `easeOutBack` 300 ms, and 6 sugar sparkles. Reduced motion: no flip, just the new state.
- **Performance:** about 140 DOM elements and one SVG path, built once per open. Only the frontier node animates (CSS transform). There is exactly one canvas, the frontier's mini gloop. No JS runs per frame on the map.

| | Pixel 7 (412 × 915) | Small phone (360 × 740) | Desktop (1280 × 800) |
|---|---|---|---|
| Header | y 0 → 64, full width | y 0 → 64, full width | y 0 → 72, column 600 centred (x 340 → 940); Back at column x + 12 |
| Scroll viewport | y 64 → 827 (V = 763) | y 64 → 652 (V = 588) | y 72 → 716 (V = 644) |
| Column | 412 wide; node centres x 91 … 321 (offsets ±74, ±115) | 360 wide; node centres x 79 … 281 (offsets ±65, ±101) | 600 wide; node centres x 472 … 808 (offsets ±108, ±168) |
| Node / pitch | 64 px (hard 72) / 116 px | 64 px (hard 72) / 116 px | 72 px (hard 80) / 124 px |
| Chapter card | 380 × 112 at x 16 | 328 × 112 at x 16 | 520 × 112 at x 380 |
| Footer bar | y 827 → 915, full width | y 652 → 740, full width | y 716 → 800, x 340 → 940 |
| Footer button | 360 × 56 at x 26, y 843 | 328 × 56 at x 16, y 668 | 360 × 52 at x 460, y 732 |
| Visible levels | about 6 | about 5 | about 5 |

With a bottom safe-area inset (e.g. 34 px on iOS), the bar grows by the inset, V shrinks by it, and nothing else moves.

### 20.3 Level start card (modal)
A modal panel (§11.3, max width 360 phone / 420 desktop, padding 24) over the map, or over the board when coming from "Next level". Enter and exit as §11.3. Contents from top to bottom, 12 px gaps:
1. **Title row:** "Level 23" (Panel title). Hard levels: a "Hard level" chip under it (chip, 2 px `ui.danger` border, text `ui.textPrimary` Small). Caption "Chapter 2" (Small, `ui.textSecondary`). A close × icon button (44) in the top-right corner works the same as "Back to map".
2. **Goals:** one row per goal, 48 px tall: a 40 px icon on the left, then the goal text (Body). Icons: L = two horizontal rounded bars; S = a 5-point star burst in `ui.gold`; F = a 40 px mini gloop of that flavour; B = a 3-cell L-shaped mini gloop in cherry with the `happy` face; M = two crossing bars; C = the cube sprite (§20.1), with a hard cube when the level has any.
3. **Tip** (only on the first level of a new thing, design §16.4): a speech bubble (§11.10 bubble style, no tail, max width 100%).
4. **Moves row:** label "Moves" (Body, `ui.textSecondary`) on the left and the number (Baloo 2 800 32 px) on the right. With a bonus: "24 +2" where "+2" is Baloo 2 800 20 px `ui.success`.
5. **Star line:** the design §16.4 string (Small) with two drawn 14 px gold stars before "2 stars" and three before "3 stars".
6. **Win streak row** (frontier level and streak ≥ 1): three flame pips (16 px flame icon, earned `ui.streak`, not yet `ui.track`), then "Win streak 2: +2 moves" (Body). The caption sits under it while it applies.
7. **Assist row** (lossRun ≥ 3): a toggle (§11.9) with "Extra help: +5 moves" and the caption. **M14:** it is the Settings switch (`.settings-toggle`, `role="switch"`, `aria-checked`), not a native checkbox; the M13 card showed an unstyled grey square (`phone-level-card_level_25_losses_3.png`). The whole row toggles it.
8. **Booster row:** 3 tiles side by side, each 96 × 112 (desktop 112 × 120), radius 18, `ui.panelSolid`, 2 px `ui.panelBorder`. Each tile has a 44 px icon at the top, the name (Small 800), and the count "×2" (Small, `ui.textSecondary`) in the top-right corner. Selected: 3 px `ui.gold` border, a 20 px check badge (`ui.success`) at the top-left, and the tile lifts 2 px. Tile with count 0: a secondary mini button (height 36, Nunito 800 14) "150 coins" across its bottom. When short of coins it is disabled and reads "Need 40 more coins" (wrapping to 2 lines is fine). At the cap: "Max 5" as plain text. A free Shuffle from the streak: the Shuffle tile is selected and locked, with "Free from win streak". Under the tiles, the two captions (Small, `ui.textSecondary`). Icons (in `icons.ts`, 3 px strokes): +3 Moves = a footprint pair with "+3"; Shuffle = two curved arrows in a circle; Pop = a starburst over a gloop outline.
9. **Buttons:** primary "Play", full width, focused on open (Enter or Space = Play). Text button "Back to map" (Esc = back).
- **Pixel 7:** the card is 360 wide at x 26, centred vertically. A typical 2-goal card with a streak and boosters is about 600 px tall and fits in 915. If the content is taller than the viewport minus 48 px, the card body scrolls and the Play button stays pinned at the bottom of the card.
- **Desktop:** 420 wide, centred on the board.
- **Buying:** the tap gives immediate feedback (coin chip counts down 300 ms, `coinTick` ×3, toast "Bought: Shuffle", count +1, tile selects itself). No confirm dialog. No price ever animates or flashes for attention.

### 20.4 Adventure play HUD and booster bar
Same board, tray, drag and juice as Classic. Only the HUD bands change.
- **Top bar:** the centre pill shows "Level 23" (§11.12 pill style, not a button). Menu, mute and pause as usual.
- **Score band:** the big number is **moves left** (HUD score style, Baloo 2 800 52 / 64 px). Under it, "moves left" in the HUD best style. It counts down on R at the placement's input time with a 1 → 0.92 → 1 squash (120 ms). At 3 moves or fewer it turns `ui.danger` and does one 1 → 1.08 → 1 pulse (200 ms) per move. It never blinks continuously and never plays a warning sound (honest, no panic). The run's score is shown only on S levels, as that goal's chip.
- **Goal strip (§20.7 band):** one chip per goal, 28 px tall, centred, 8 px apart, each max (W − 40) / 2 wide: the 20 px goal icon (C = the sugar-cube sprite from §20.1 drawn at 18 px with `drawCube`, the same picture as on the board and the start card; M14: it was a hollow square that read as an empty checkbox), then "12 / 30" (Nunito 800 14, tabular). The fill inside the chip is `ui.gold` alpha 0.35 from the left, proportional to progress, easing over 300 ms on R. Each progress change ticks the number on the move's F frame (or L if nothing cleared). Done: fill `ui.success` alpha 0.4, a check icon replaces the number, one 1 → 1.15 → 1 pop (260 ms `easeOutBack`), 6 sugar sparkles (W), and the `chime` sample at −14 dB.
- **Booster bar:** in the combo strip, where the rescue ring sits in Classic (Adventure has no rescue). Up to 2 circular buttons, 44 px (desktop 56), for Shuffle and Pop. They show only when armed for this attempt. Pixel 7 centres: x 326 and 378, y 644. Desktop: (152, 540) and (232, 540) in the left panel. Armed: `ui.panelSolid` fill, a 2 px `ui.gold` border and the white icon. Pressed: 80 ms squash. After use: `ui.disabled`, a check, aria "Used". Pop with no gloop on the board: disabled.
  - **Shuffle:** at R t0 the current tray pieces drop 0.4c and fade (120 ms), then the new tray deals with the normal deal animation (§9.1) and `deal` ticks. Any drag in progress is cancelled first; that is the only input it touches, and only when the player taps the button.
  - **Pop:** the biggest gloop pops with the rescue choreography (§13.4 "rescued" sound, burst path). There are no points and no combo text.
  - Keys 4 and 5 trigger them on desktop (shown in the button's `title`).
- **Pause overlay:** "Give up" replaces "Restart" (danger style, §11.1), with the confirm.

### 20.5 Level win and lose panels
Modal panels (§11.3) like the game-over panel (§13.3 layout). Buttons work from the first frame the panel is visible.
- **Timing:** win panel at **600 ms** after the winning release (the clear and pops play underneath; slow-mo and the stingers keep running on W/B). Lose panel at **450 ms**, the same as the stuck choreography (§9.8). On a loss, Space, Enter and R restart the same level from **0 ms** (design §13.2, R4). On a win, Enter or Space opens the next level's start card from 0 ms.
- **Win panel:**
  - Title "Level 23 complete" (Panel title).
  - **Stars row:** three stars, the centre one 76 px and raised 10 px, the side ones 64 px, 12 px apart. Empty stars (`ui.track` fill, 3 px `ui.panelBorder` outline) are visible from the first frame. Earned stars fill in at 150, 400 and 650 ms after the panel enters (R clock): scale 0 → 1.25 → 1 (`easeOutBack`, 320 ms), a white flash disc (alpha 0.6 → 0, 140 ms), and 8 gold sparkles each. Each star plays `coinTick` pitched up the ladder (rungs 4, 6 and 8, §13.3). A 3-star win also drops 40 confetti pieces (the §23.6 confetti) and plays the `best` sample at −10 dB, once. If the star count went up on a replay, the new stars get a 2 px `ui.gold` ring that lingers.
  - Lines: "Won with 6 moves left." and the hint line (Body, `ui.textSecondary`). The bonus caption (Small) only when bonus moves were used.
  - Rewards row: "+70 XP" with the XP bar filling (§11.9), "+65 coins". Win streak: three flame pips that fill to the new value, plus "Win streak 3" (the flame pops 1 → 1.2 → 1, 300 ms).
  - Buttons: "Next level" (primary, full width, focused). Under it, "Replay" (secondary). "Map" is a text button at the bottom. On level 120, "Map" is the primary.
- **Lose panel:**
  - Title "Out of moves" / "No room left" / "Level 23 ended".
  - **Goal chips repeated** at 1.3× size, showing the final "26 / 30", so the miss is visible at a glance.
  - Up to 2 near-miss lines (Body).
  - Rewards row: "+5 XP · +2 coins" (Small).
  - "Win streak reset" (Small, `ui.textDim`, no sound, no shake) only if the streak was ≥ 1.
  - Buttons: "Try again" (primary, full width, focused). After 3 losses in a row, "Try again with 5 extra moves" (secondary) under it. "Map" (text button).
  - **Never on this panel:** boosters, prices, coin buttons, timers or anything to buy (design §24.10, §18 rule 11).
- **Pixel 7:** panel 360 wide, bottom-anchored like the game-over panel (bottom edge 24 px above the bottom), so the board's last move stays visible above it. **Desktop:** 420 wide, centred over the board.

### 20.6 Missions card (Home) and mission toasts
- **Position:** between the mode grid and the Weekly card, full panel width.
- **Card:** §11.7 card. Header row: "Daily missions" (Button-secondary style) on the left; on the right, three 10 px pips for the set (filled `ui.gold` per claimed mission).
- **Rows:** 3 rows, each 68 px tall, with 1 px `ui.panelBorder` dividers at alpha 0.5.
  - Left: a 28 px difficulty badge: 1, 2 or 3 small stars in `ui.gold` (A, B or C).
  - Middle: the mission text (Body, may wrap to 2 lines), and under it an 8 px bar (§11.9 weekly-bar style, `ui.gold`) with "12 / 30" (Small, tabular) right-aligned on the same line.
  - Right column (96 px): the reward "30 coins · 20 XP" (Small, `ui.textSecondary`), and:
    - unfinished: the change icon button (36 px circle, two-arrow icon, aria "Change this mission"), only while the free change is unused today;
    - done and unclaimed: a primary mini button "Claim" (height 40, Baloo 2 800 18) that pulses 1 ↔ 1.04 every 1,400 ms (CSS, off in reduced motion);
    - claimed: a check icon and "Done" (Small, `ui.success`); the row's text dims to `ui.textSecondary`.
  - Footer line (Small, `ui.textSecondary`): the free-change caption, then the set line ("Finish all 3: +50 coins, +50 XP" or "All 3 done. New missions tomorrow.").
- **Claim:** at click, the button becomes the check at once (input is never held). 6 coin icons (16 px, `ui.coin`) fly from the button to the Home coins chip along a quadratic arc, 500 ms `easeInOutSine`, 40 ms apart (CSS transforms on pooled elements). The coin chip counts up over 600 ms with `coinTick`s, and the XP goes through the level-up toast path. Reduced motion: no flight; the chip updates at once with one `coinTick`.
- **Change:** the row's content crossfades 160 ms to the new mission.
- **In play:** "Mission done: Clear 15 lines" is a normal toast (§11.8, accent `ui.gold`, a 20 px star badge icon). Never a panel, never a pause.
- **Pixel 7:** about 290 px tall (header 40 + 3 × 68 + footer 44). Home already scrolls (`overflow-y: auto` on the Home panel), so with the Adventure card and the missions card it is taller than 915. The Play button and the mode grid stay in the first screen.
- **Desktop:** same card inside the Home panel (max width 560 there).

### 20.7 In-run goal strip (Classic and Expert targets and mini goal; Adventure goals)
- **New layout band "goal strip"**, **30 px** at the reference size, between the score band and gap B. It is present in Classic, Expert and Adventure. In Daily, Zen and the tutorial steps it has height 0, and those modes keep the §15.1 numbers exactly.
- **Classic/Expert content:** two pills, 28 px tall, radius 14, 8 px apart, centred. Each is at most (W − 40) / 2 wide (Pixel 7: 186), with 12 px side padding. Background `ui.panelSolid` alpha 0.7, border 2 px `ui.panelBorder`. Text Nunito 800 14 `ui.textPrimary`, tabular numbers. The pills use the short labels from design §24.2. The longest, "Blueberry cells 12/12", is about 150 px at 14 px, which fits 186 with the padding. If a fallback font makes a label too wide, drop to 13 px, never ellipsis.
  - **Target pill (left):** a 14 px flag icon, then "Next target 10,000". The fill is `ui.gold` alpha 0.35 from the left, `(score − prev)/(next − prev)`, easing with the score count-up (§9.13.i, R clock), drawn under the text.
  - **Mini pill (right):** short label, e.g. "Big Pop 0/1", with a 14 px target-ring icon. When done, the fill is `ui.success` alpha 0.4 and the text is "Big Pop ✓". The full mini text appears once as a toast ("Mini goal: Make a Big Pop") when the run's first piece is placed, never before, so it can't cover the first frame.
  - **Guard (M14):** the crossing text is drawn only for a real crossing (target > 0 and coins > 0). `phone-mini-done.png` showed "-1 ✓ +0 coins" because the debug hold applied a crossing to the mini-done scene; the debug hold applies to `target-hit` only.
  - **Crossing a target:** triggered when the **counting-up HUD score** passes the target (R clock), so the pill never runs ahead of the number. The border turns `ui.gold`, the pill pops 1 → 1.15 → 1 (`easeOutBack` 260 ms, R), 6 sugar sparkles burst from the pill (W particles, normal pool), and one `coinTick` plays at −6 dB. The text reads "10,000 ✓ +5 coins" (short so it fits the pill even at 150,000) for **1,200 ms**, then crossfades (160 ms) to the next target, with the fill restarting from 0. If one move passes several targets, the pill shows only the highest one with the summed coins ("20,000 ✓ +10 coins").
  - **Mini goal done:** the same pop on the mini pill, then "Done · +15 coins" for 1,200 ms, then the done text. Sound: `chime` −14 dB.
  - None of this uses hitstop or slow-mo, covers the board, or waits for anything. A placement during the 1,200 ms simply updates the pills again.
- **Adventure content:** the goal chips (§20.4) in the same band.
- **Desktop left panel, new order (x 72 → 312):** "Score" label y 170; score y 230; best y 268; PB bar at y 280 (6 px); **target pill 240 × 32 at y 300; mini pill 240 × 32 at y 342**; combo label and pips y 410; stage text y 450; rescue ring centre (192, 540), 56 px. Adventure: moves number y 230, "moves left" y 268, goal chips (240 × 32) at y 300 and 342, combo y 410, booster buttons at y 540.

### 20.8 Layout numbers with the goal strip (amends §15.1 and §15.3)
**§15.3 algorithm change:** the non-board reference total is 402 px (top 60, score 84, **goal 30**, combo 44, tray 168, bottom 16) when the strip is present, else 372 as before. Everything else is unchanged: `k = clamp(H / 844, 0.78, 1.15)`, the board rounding rule, and the leftover split of 25% gap A, 25% gap B and 50% gap C.

**390 × 844 with the strip** (Classic, Expert, Adventure; layout tests ±1 px):

| Band | y from → to |
|---|---|
| Top bar | 0 → 60 |
| gap A | 60 → 78 |
| Score | 78 → 162 (score baseline 128, best baseline 152) |
| Goal strip | 162 → 192 (pills y 163 → 191) |
| gap B | 192 → 211 |
| Board | 211 → 579 (frame x 11 → 379; grid x 19 → 371, y 219 → 571; c = 44) |
| Combo strip | 579 → 623 (rescue ring / booster bar centre y 601) |
| gap C | 623 → 660 |
| Tray | 660 → 828 (unchanged) |
| Bottom | 828 → 844 |

**Pixel 7, 412 × 915 with the strip** (k = 1.084; board = 384, so c = 46):

| Band | y from → to | Contents |
|---|---|---|
| Top bar | 0 → 65 | icon buttons 44 px at y 10: menu x 12, centre pill, mute x 312, pause x 356 |
| gap A | 65 → 89 | toasts at y 69 |
| Score | 89 → 180 | score (or moves) baseline y 143, 52 px; best (or "moves left") baseline y 169, 15 px |
| Goal strip | 180 → 212 | two pills 186 × 28 at x 16 and x 210, y 182 → 210 |
| gap B | 212 → 236 | |
| Board | 236 → 620 | frame x 14 → 398; grid x 22 → 390, y 244 → 612; c = 46 |
| Combo strip | 620 → 668 | combo label + pips at x 22; rescue ring centre (378, 644) 40 px; Adventure booster buttons centres (326, 644) and (378, 644), 44 px |
| gap C | 668 → 716 | |
| Tray | 716 → 898 | 3 slots 129 × 173 at x 4 / 141 / 278, centre y 807; ct = min(28.6, 129 / 5.4) = 23.9 |
| Bottom | 898 → 915 | |

**Pixel 7 without the strip** (Daily, Zen): the §15.3 algorithm gives board 384 and leftover 127.6 px: gap A 31.9, gap B 31.9, gap C 63.8.

**Desktop 1280 × 800:** §15.2 plus the left-panel order in §20.7. The board doesn't move.

### 20.9 Motion, clocks and sound summary
| Element | Clock | Motion | Sound (existing cues only, §13.4) | Reduced motion |
|---|---|---|---|---|
| Target crossed | R (pill), W (sparkles) | pop 260 ms, text 1,200 ms | `coinTick` −6 dB | no pop or sparkles; text swap only |
| Mini goal done | R, W | as above | `chime` −14 dB | text swap only |
| Adventure goal done | R, W | chip pop, sparkles | `chime` −14 dB | check only |
| Moves countdown | R | squash 120 ms, danger pulse 200 ms | none | colour only |
| Cube crack / removal | B (with the line clear) | §20.1 | `place` 1.4× / `pop` 1.2× | particles off; sprite swap |
| Shuffle / Pop booster | R t0 | §20.4 | `deal` ticks / rescue cue | instant swap; pops without burst motion |
| Win stars | R | 3 fills, 250 ms apart | `coinTick` on rungs 4/6/8; 3 stars: `best` −10 dB | stars appear filled at once, sounds kept |
| Lose panel | R | slide up at 450 ms | none (the §13.4 `stuck` cue already played) | fade |
| Mission claim | R (DOM) | coin flight 500 ms | `coinTick`s | no flight |
| Map unlock | R (CSS) | flip 300 ms | `uiTap` | state change only |
| Mission toast | R | §11.8 | none | §11.8 |

- Haptics (§9.13.k): target crossed and goal done = `[10]`; win = the existing All Clear pattern; booster use = `[8]`. Off with the Vibration setting.
- Music (§13.7): the map and the start card are menus (silent bed). The Adventure HUD uses the play rules; "danger" is driven by the same board-fill input as Classic, never by moves left.

### 20.10 Never do (adds to §18)
16. Never show a price, a booster or a "buy" button on a lose panel, during play, or next to a countdown.
17. Never animate a target, mission or star to suggest it is closer than it is. Bars show real progress only.
18. Never cover the board with goal banners. Goal feedback lives in the goal strip, toasts and panels.
19. Never use more than the existing palette roles for pass 3 UI. Needed roles that are missing are proposed to the lead (design AGENTS rule), not invented.
