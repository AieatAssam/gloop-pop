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

### 9.13.f Line clear (B clock; F = L + 16 = t 76 is the peak frame)
1. **Hitstop length** (S4 shape: floor + linear + cap; inside S5's 50/100/150 ladder):
   - n = unique cells removed by the move (cleared ∪ popped, ≤ 64).
   - **T = min(cap, floor + 2·n)** ms:

| Biggest event of the move | floor | cap | Examples |
|---|---|---|---|
| Lines only, or pops under 8 cells | 34 | 100 | 1 line, n 8 → **50** (S5 small, about 3 frames); 2 lines, n 16 → 66; 3 lines → 82; 4 lines → 98 |
| Big Pop (≥ 8) | 50 | 120 | 1 line + 8-cell pop, n 16 → 82 |
| Huge Pop (≥ 15) | 60 | 130 | 1 line + 15, n 23 → 106 |
| Mega Pop (≥ 24), All Clear | 70 | **150** | 1 line + 24, n 32 → 134; 1 line + 28 + extra lines → capped at 150 |

   - No hitstop for a placement that removes nothing (frequent events stay light, S1, S18).
   - First-time moments add no extra freeze. They use their event's T.
   - Combo scaling: §9.13.h.
   - Reduced motion: no hitstop (design §23.4, kept).
2. **Anticipation swell** (S13), from release t 0 to F (76 ms), `easeOutQuad`:
   - Cleared-line cells scale uniformly 1 → 1.12, with the popping face.
   - Gloops that will pop swell as one body to 1.06.
   - The swell peaks at F, the same frame the landed piece is at full squash. Both sides are at the point of contact (S3).
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
7. **Impact frame** = the first burst frame of the move. On it, fire together:
   - trauma (§9.13.g),
   - camera kick 0.05c straight down (spring as §9.13.e),
   - the line haptic (§9.13.k),
   - the lineClear sound, via a director `onImpact` callback, not at input time (S18: keep haptic, audio and visual in sync).
   
   The score count-up starts here too (§9.13.i).
8. **Typical 1-line timeline:** release 0 → land 60 → peak and freeze 76 → freeze ends 126 → first burst 156 → full row done by about 156 + 7·28 + 90 = 442 ms. Input stays live throughout.

### 9.13.g Gloop pops, trauma shake, slow-mo, one label at a time
1. **Hitstop:** the bigger tiers in §9.13.f.1.
2. **Wave through the gloop** (replaces §9.4.4's fixed 38 ms per step):
   - D = the gloop's largest BFS distance from its entry cells.
   - **Step = min(38, 330 / D) ms** (B). The last cell starts its burst ≤ 330 ms after the first, so a 28-cell Mega is done in **≤ 450 ms** including the 120 ms burst. Today it takes about 1.8 s. Small gloops keep 38 ms.
   - Each popped cell gets its own anticipation: from `burstAt − 70`, it swells 1 → 1.12 over 40 ms, squashes 30 ms (0.85 along the direction from its BFS parent, 1/0.85 across), then bursts as in §9.13.f.5.
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
     - Fonts as §9.7. A label shrinks so that its cached sprite width ≤ 0.92 × grid width (8c).
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
   - (8, lines, 0) = 50, (16, lines, 0) = 66, (32, lines, 0) = 98, (40, lines, 0) = 100
   - (16, big, 0) = 82, (23, huge, 0) = 106, (32, mega, 0) = 134, (44, mega, 0) = 150
   - (32, mega, 4) = 80, (8, lines, 4) = 50
   - n = 0 → 0
   - never > 150 for any n ≤ 64 and any tier
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
Under the board (portrait) or in the left panel (desktop). Text "Combo 4 ×2.5" left-aligned, then 3 fuse pips (circles 10 px, gap 6 px): filled `fx.comboTier1`→tier colour, empty `ui.track`. When fuse = 1, the last pip blinks (alpha 1 ↔ 0.3, 400 ms period). Hidden (fades 200 ms) when C = 0.

### 11.6 Rescue ring (Classic)
40 px circle button. Ring of 10 ticks around a lifebuoy icon (drawn as a ring with 4 stripes in `flavour.cherry.base` and `ui.textPrimary`). Ticks fill `ui.success` one per line cleared. When full: the button pulses (scale 1 ↔ 1.08, 1200 ms) and shows a small "Ready" label. Used: ring grey, label "Used". Tapping it at any time shows the tooltip text from design §16.4 (the rescue is only usable from the rescue panel).

### 11.7 Cards (Home)
Radius 18 px, `ui.panelSolid`, 2 px border `ui.panelBorder`, padding 16 px. Mode cards have a 56 px illustration on the left: a gloop of the mode's signature flavour (Classic cherry, Daily = Flavour of the Day, Zen blueberry with sleep face, Expert grape with crown), drawn with the canvas gloop renderer into a small canvas. Locked cards: illustration greyed (draw at alpha 0.4), lock icon, text "Reach Level 8".

### 11.8 Toasts
Top-centre, below the top bar. Pill, height 40, padding 0 18 px, `ui.panelSolid`, border 2 px in the toast's accent (coin/xp/gold/streak/freeze colour), icon left. Enter: drop from −20 px + fade, 180 ms `easeOutBack`; stay 2400 ms; exit 160 ms. Queue, max 1 visible, 600 ms between. **Placement rule:** a toast must never cover a panel or screen title. While a modal panel (game over, rescue, pause) or a full screen (Home, Collection, Daily result …) is open, toasts sit at the bottom centre instead (16 px above the bottom safe area), and a toast that is already showing moves there when a panel opens.

### 11.9 Progress bars and toggles
- XP bar: height 12 px, radius 6, track `ui.track`, fill gradient `ui.xpTop` → `ui.xpBottom`, 2 px gloss line at alpha 0.4 on top. Fills with 600 ms `easeOutCubic`; level-up: fills to the end, flashes white 120 ms, resets and continues.
- Weekly/achievement bars: same with `ui.gold` fill.
- Toggles: 52×30 pill, off `ui.toggleOff`, on `ui.toggleOn`, knob 24 px `ui.toggleKnob` with shadow; knob slides 160 ms `easeOutBack`.

### 11.10 Tutorial bubble and ghost hand
- **Bubble:** rounded rect radius 16, fill `ui.bubble`, text `ui.bubbleText` Nunito 800 18 px, max width 300 px, a tail pointing down to the tray piece. Enters with scale 0.8 → 1, 200 ms `easeOutBack`.
- **Ghost hand:** a cartoon hand (rounded palm + index finger, drawn with paths) filled `ui.ghostHand` alpha 0.9, outline `face.ink` 2 px, shadow `ui.ghostHandShadow`. Animation loop: fade in 400 ms on the tray piece; press (scale 0.9) 120 ms; drag along a quadratic curve (control point 1.5c above the midpoint) to the target over 900 ms `easeInOutSine`, carrying a translucent copy of the piece (alpha 0.5); hold 300 ms with a press pulse ring; fade 300 ms; wait 500 ms; repeat. Disappears instantly on pointerdown on a piece.

### 11.11 Achievement badges
80 px rounded squares (radius 20). Unlocked: fill gradient of a flavour chosen per achievement category (lines = blueberry, pops = cherry, combo = orange, score = lemon, daily/streak = grape, misc = apple, collection = bubblegum), with a white icon and a small gloop face peeking from the bottom edge. Locked: `ui.disabled`, lock icon, progress text below.

### 11.12 Top bar (play screen)
Left: menu button. Centre: daily pill (height 36, radius 18, `ui.panelSolid`, text Nunito 800 15 px; dot `ui.danger` 8 px when not played). Right: mute button, then pause button. On desktop the top bar spans the full width with 24 px side padding.

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

## 13. Sound direction (WebAudio, all synthesized)

### 13.1 Mix and bus
- Graph: voices → `sfxBus` (gain 0.9) / `musicBus` (gain 0.32) → `master` (gain 0.8) → `DynamicsCompressor` (threshold −14 dB, knee 12, ratio 4, attack 3 ms, release 120 ms) → destination.
- AudioContext is created on the first `pointerdown`/`keydown` (R21). Before that, nothing plays and nothing errors. Sound and music are on by default.
- Voice limit: 24 simultaneous SFX voices; the oldest is stopped first. Each SFX call schedules at `ctx.currentTime + 0.005`.
- Pitch ladder (C major pentatonic, Hz): `[523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51, 1567.98, 1760.00, 2093.00]` (C5 … C7). `noteFor(C) = ladder[min(C − 1, 10)]`.
- ADSR notation below: A attack, D decay to sustain S (fraction of peak), R release; times in ms. "Peak" is the voice gain.

### 13.2 SFX recipes
| SFX | Recipe |
|---|---|
| pickUp | sine 620 → 880 Hz exponential over 70 ms; A 3, D 80, S 0; peak 0.16 |
| place ("plop") | sine 240 → 110 Hz over 90 ms, peak 0.42, A 2 D 110 S 0; plus noise burst through lowpass 900 Hz, 30 ms, peak 0.12. Pitch ×(0.96–1.04) random per call (cosmetic RNG). Bigger pieces: base pitch × (1 − 0.03 × (cells − 1)) |
| returnToTray | triangle 330 → 220 Hz over 120 ms, peak 0.12, A 5 D 120 S 0 |
| invalidHover | none (silent by design; the face shows it) |
| deal | 3 ticks 60 ms apart: sine 1320 Hz, 25 ms, peak 0.07 |
| lineClear | per cleared line i (0-based), 45 ms apart: triangle at `noteFor(C) × 2^(i·2/12)`, A 4 D 260 S 0, peak 0.3; plus a sine an octave up at peak 0.08; plus highpass-filtered noise (4 kHz) "fizz" 150 ms peak 0.1 |
| combo harmony (tier ≥ 1) | add a sine at the fifth (×1.5) of the lineClear note, peak 0.12 |
| sparkle layer (tier ≥ 2) | 4 sine pings at ×4 the note, 30 ms apart, 40 ms each, peak 0.05 |
| gloopPop | per popped cell in ripple order, rate-limited to one voice per 25 ms (skip extras but keep pitch progression): sine starting at 380 Hz × 1.045^k (k = pop index, capped at k = 30), pitch bend up ×1.6 over 50 ms, A 2 D 70 S 0, peak 0.2, ±10 cents random detune. Wet "bloop": run through a bandpass (Q 4) following the pitch |
| bigPop stinger (s ≥ 8) | after the last pop: two-note rise `noteFor(C)` → ×1.5, square wave through lowpass 2.2 kHz, 90 ms each, peak 0.18 |
| hugePop / megaPop | three-note (×1, ×1.25, ×1.5) / five-note (×1, 1.25, 1.5, 2, 2.5) arpeggio, 70 ms apart, square + lowpass 2.6 kHz, peak 0.2; plus a sub thump sine 90 → 40 Hz over 220 ms peak 0.35 |
| allClear | C-E-G-C-E-G (523, 659, 784, 1047, 1319, 1568 Hz), 60 ms apart, triangle + sine octave, peak 0.24; preceded by a 400 ms noise swell (bandpass 2 kHz sweeping to 8 kHz, gain 0 → 0.12) |
| comboLost | sine 440 → 330 Hz over 160 ms, peak 0.08 (quiet on purpose) |
| stageUp | sine chime 784 + 1175 Hz, 400 ms decay, peak 0.14 |
| newBest | fanfare: 784, 988, 1175, 1568 Hz, 90 ms apart, square through lowpass 3 kHz, last note held 400 ms; peak 0.2 |
| stuck | triangle 392 → 330 → 262 Hz (three notes, 180 ms each), peak 0.18, plus lowpass sweep on the music bus (§9.8) |
| rescue | reverse swell (noise 300 ms rising) then pop + major third chime |
| uiTap | sine 1200 Hz, 25 ms, peak 0.08 |
| toggleOn / toggleOff | sine 880 → 1320 / 1320 → 880, 60 ms, peak 0.08 |
| coinTick | sine 1568 Hz + 2093 Hz, 40 ms, peak 0.06; for counting up, max 12 ticks spaced 50 ms |
| levelUp | arpeggio C5-E5-G5-C6 80 ms apart triangle, then a 600 ms sine shimmer at C7 with 6 Hz vibrato, peak 0.2 |
| achievement | two bell tones 1319 + 1976 Hz with 900 ms exponential decay (sine + sine ×2.76 inharmonic partial at 0.3), peak 0.14 |

### 13.3 Music (generative, `src/audio/music.ts`)
- Lo-fi candy-shop loop, 84 BPM, 4/4, 4-bar progression: **Cmaj7 – Am7 – Fmaj7 – G6**, one chord per bar.
- **Keys ("candy Rhodes"):** each chord voiced in C4–C5 range; each note: sine + triangle at 2× frequency (gain 0.25), with a 5 Hz tremolo (depth 0.15); A 15, D 900, S 0.35, R 600. Chords play on beat 1 and the "and" of 2.
- **Bass:** sine at chord root (C2–G2), on beats 1 and 3, A 5 D 300 S 0.4 R 100, peak 0.35.
- **Kick:** sine 120 → 45 Hz over 120 ms, beats 1 and 3, peak 0.4. **Hat:** noise through highpass 7 kHz, 30 ms, on every 8th, peak 0.04 (off-beats 0.06).
- **Melody (from combo tier 4 only):** arpeggio of the current chord tones in 16ths, an octave above the keys, triangle, peak 0.06.
- **Master music filter:** lowpass on the music bus, 1200 Hz normally; tier 3+ opens it to 5000 Hz over 600 ms; it closes back 3 s after the combo ends. Paused: 400 Hz and gain ×0.5. Game over: 600 Hz.
- Scheduler: a 25 ms `setInterval` lookahead loop scheduling notes up to 120 ms ahead on the AudioContext clock (standard WebAudio pattern). Stops when the tab is hidden.
- Each loop of 4 bars, randomly (cosmetic RNG) swap the voicing inversion so 4 bars don't repeat exactly for ~8 cycles.

### 13.4 Settings
"Sound effects" toggles `sfxBus`; "Music" toggles `musicBus`; the top-bar mute button toggles `master` (and is shown crossed when master is muted). M key = mute. The mute state persists.

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
