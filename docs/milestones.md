# Gloop Pop: Milestones and Tasks

Version 1.0, 25 Oct 2026. Do tasks in order. Each task is one coding-agent run (about 200–800 lines changed). Every task ends with `npm run check` passing (typecheck + lint + tests + build + size). "Look at the game" means `npm run build && npm run preview` on a phone-sized (390×844) and a desktop (1280×800) window, done by a human reviewer; agents don't need to run a browser.

References: design = `docs/design.md`, SG = `docs/art/style-guide.md`, arch = `docs/architecture.md`.

Rules for every task:
- Implement exactly what the referenced sections say. If a spec is ambiguous, pick the simplest reading, note it in a code comment `// spec-note: …`, and mention it in your final message.
- Add or update unit tests for every pure function you touch.
- No hex colours outside `src/render/palette.ts`; no player-facing strings outside `src/ui/strings.ts`.
- Visual tasks must cite the SG sections they implement in a comment at the top of each render file.

**Playable, good-looking game by the end of M2.** Meta in M3, daily/social in M4, full juice in M5, audio in M6, onboarding and info screens in M7, web platform in M8, polish and balance in M9.

---

## M0 Foundation

### M0.1 Project scaffold
- **Goal:** Vite + TS strict + Vitest + ESLint project that builds an empty canvas page under `/gloop-pop/`.
- **Files:** `package.json` (scripts exactly as arch §10), `tsconfig.json` (arch §2), `vite.config.ts` (base, target), `eslint.config.js` (typescript-eslint type-checked for `src/`, rules from arch §12.1–12.3, 12.5), `index.html` (canvas `#game`, div `#ui`, meta tags from arch §11.3 with `%VITE_SITE_URL%`), `.env` (`VITE_SITE_URL`), `.gitignore` (node_modules, dist, .sim, coverage), `src/main.ts` (logs nothing, draws nothing yet), `tools/check-size.mjs`, `tools/check-no-hex.mjs`, `src/core/smoke.test.ts`.
- **Done when:** `npm install && npm run check` passes; `dist/index.html` references assets under `/gloop-pop/`; check-size prints the gz total; check-no-hex fails on a test fixture containing `'#ff0000'` in a temp file (covered by a Vitest test that calls its exported function) and passes on the repo; `src/render/palette.ts` exists and `gen-palette --check` passes inside `check`.

### M0.2 Palette, CSS variables and fonts
- **Goal:** colours and fonts flow from the single sources.
- **Files:** `src/render/colour.ts` (`withAlpha`, `mix`, `hexToRgba`), `src/ui/cssVars.ts` (sets `--ui-*`, `--fx-*`, `--theme-*` for the equipped theme, `--bg`), `src/ui/styles.css` (base reset, font stacks per SG §10, button/panel classes from SG §11.1, §11.3 using variables only), `src/main.ts` (imports `@fontsource/baloo-2/latin-700.css`, `latin-800.css`, `@fontsource/nunito/latin-700.css`, `latin-800.css`; calls cssVars), `src/ui/strings.ts` (skeleton with the `S` object and a few HUD strings from design §16.4), `src/render/colour.test.ts`, `src/ui/strings.test.ts` (banned words, SG §18.15).
- **Done when:** check passes; CSS has zero hex values; the page background shows `theme.midnight.skyTop` via `--bg`; strings test fails if "epic" is added (verified by the test itself using a sample).

### M0.3 GitHub Pages workflow
- **Goal:** pushes to main deploy automatically.
- **Files:** `.github/workflows/deploy.yml` (arch §10).
- **Done when:** workflow YAML runs `npm ci`, `npm run check`, uploads `dist`, deploys with `actions/deploy-pages@v4`; permissions set; reviewer reads it.

---

## M1 Core rules (pure, fully tested)

### M1.1 RNG, hashing and dates
- **Goal:** deterministic randomness and UTC day maths.
- **Files:** `src/core/hash.ts`, `src/core/rng.ts`, `src/core/daily.ts` (only `dayKeyFromMs`, `dayNumber`, `msToNextUtcMidnight`, `seedStringForDay`, streams per design §10.1–10.2), `src/core/weekly.ts` (`weekIndexFromMs`, `goalForWeek` returning pool index per design §12), tests per arch §9.1 (RNG, Hash/daily date parts, weekly).
- **Done when:** golden values pinned; `dayNumber` of 2026-10-25 = 1, 2026-11-24 = 31; week index of Sun 2026-10-25 23:59 UTC = 0, Mon 2026-10-26 00:00 UTC = 1, Sun 2026-11-01 23:59 UTC = 1, Mon 2026-11-02 = 2.

### M1.2 Board, pieces and gloops
- **Goal:** board helpers, the 37-piece catalogue and gloop components.
- **Files:** `src/core/types.ts` (arch §4.1), `src/core/board.ts`, `src/core/pieces.ts` (design §7.1 table, shape names from design §13.4.3, placement masks arch §4.2), `src/core/gloops.ts` (components, largest square with tie-break SG §6.1), tests.
- **Done when:** every catalogue entry's cells match design §7.1; masks agree with the cell lists for all positions; gloop tests include a ring-shaped gloop around a hole and two same-flavour groups separated diagonally (must be 2 gloops: 4-neighbour only).

### M1.3 Resolve, scoring and combo
- **Goal:** design §3.5, §5, §6 exactly.
- **Files:** `src/core/resolve.ts`, `src/core/scoring.ts`, tests (`resolve.test.ts`, `scoring.test.ts`, `combo.test.ts`).
- **Done when:** the two worked examples in design §5 are tests and pass; a gloop entirely inside a cleared line gives no pop points and no big-pop bonus; cells of two different gloops in P are counted once each; All Clear detection; mult cap ×10; daily FoD cells score 40.

### M1.4 Stages, solver and generator
- **Goal:** fair tray dealing.
- **Files:** `src/core/stages.ts` (design §7.2 tables, flavour sets, F2 p), `src/core/solver.ts`, `src/core/generator.ts` (design §7.3–7.4), tests.
- **Done when:** tests from arch §9.1 (Generator, Solver) pass; a micro-benchmark test asserts 200 deals on random half-filled boards take < 2 s total in Node; generator never returns a tray violating F1 or F3.

### M1.5 Game reducer and modes
- **Goal:** complete runnable game logic for Classic, Expert, Zen, Daily and the tutorial script.
- **Files:** `src/core/modes.ts`, `src/core/game.ts` (`newGame`, `step`, `canPlace`, `previewPlacement`, `fitsAnywhere`), `src/core/daily.ts` (add daily start board, 30 trays, flavour of day: design §7.5, §10.2–10.3), `src/core/tutorial.ts` (boards and trays for design §16.2 steps 1–3, returned as GameState builders), `src/core/nearMiss.ts`, tests (`game.test.ts`, `nearMiss.test.ts`, daily golden snapshot).
- **Done when:** event order matches arch §4.4; rescue charges at 10 lines, offered once, F4 tray; Zen shake pops 2 largest gloops and deals; daily ends after tray 30 with `reason: 'traysDone'`; daily trays identical for a given dayKey regardless of moves; state survives `JSON.parse(JSON.stringify(state))` and continues identically; tutorial step boards match design §16.2 cell lists.

### M1.6 Greedy bot and simulation
- **Goal:** headless balancing tool.
- **Files:** `src/core/sim.ts`, `tools/sim.mjs`, `src/core/sim.test.ts`.
- **Done when:** `npm run sim -- --runs 50` prints the stats in arch §9.3; the sim test (20 games) passes; the reviewer records the first numbers in the final message (no tuning yet).

---

## M2 Playable and good-looking

### M2.1 Canvas, layout and loop
- **Goal:** responsive canvas with correct DPR and the layout object.
- **Files:** `src/render/canvas.ts` (DPR cap 2, adaptive drop, arch §6), `src/render/layout.ts` (SG §15.3) + `layout.test.ts` (SG §15.1/15.2 numbers), `src/render/loop.ts` (rAF, dt clamp, timeScale), `src/render/easing.ts` (SG §9.0) + test, `src/app/app.ts` (boot → play skeleton), `src/main.ts`.
- **Done when:** layout tests pass for 390×844, 1280×800, 360×640, 768×1024, 844×390; on resize the canvas stays crisp (reviewer); `?debug=1` overlay shows fps and dpr.

### M2.2 Background (Midnight theme)
- **Goal:** the deep, layered night sweet shop.
- **Implements:** SG §7.1, §7.3 (moon positions), §14 (midnight row).
- **Files:** `src/render/background.ts` (cache + animated layers, theme-parameterised from `PALETTE.theme[id]`, silhouette style "jars"), `src/core`-free seeded positions via the cosmetic RNG with a fixed seed.
- **Done when:** reviewer sees sky gradient, horizon glow, twinkling stars, moon, two shelves of jars with rim light, drifting bokeh, counter band and sprinkles; background costs < 1 ms/frame in the debug overlay on desktop; nothing jumps on resize.

### M2.3 Board and gloop bodies
- **Goal:** the jelly look. This is the most important visual task.
- **Implements:** SG §4, §5.1–5.3, §7.2.
- **Files:** `src/render/silhouette.ts` + `silhouette.test.ts`, `src/render/gloopRenderer.ts`, `src/render/boardView.ts` (frame, well, sockets, board layer cache; draws gloops from a board array).
- **Done when:** reviewer sees a mould-tray board with recessed sockets and glossy translucent gloops: merged same-flavour cells form one body with rounded concave corners, specular highlights only on top surfaces, outline, rim light; different flavours have a visible gap; no per-frame shadowBlur (code read); a debug key `?demo=board` fills the board with a fixed showcase pattern (all 7 flavours, an L gloop, a 3×3, a ring with a hole).

### M2.4 Faces, toppers and idle life
- **Goal:** every gloop is a character.
- **Implements:** SG §6.1–6.5 (expressions: idle, blink, look-at, excited, worried, happy, grin, popping, sad, dizzy, sleep, starEyes all implemented as drawable parameter sets), §6.3 toppers.
- **Files:** `src/render/face.ts`, `boardView.ts` (faces layer), `face.test.ts` (face box placement uses gloops.ts largest square).
- **Done when:** `?demo=faces` shows a grid with every expression for every flavour; on the showcase board, faces sit in the largest square, scale with k, blink at random intervals and look at the pointer; each flavour has its distinct eye style and topper; at 64 px screenshot width flavours are still distinguishable (reviewer).

### M2.5 Tray, drag and previews
- **Goal:** placing pieces feels precise and forgiving, and previews teach the twist.
- **Implements:** SG §8.2–8.4, §6.5 (excited/worried on drag), design §3.4.
- **Files:** `src/render/trayView.ts`, `src/input/pointer.ts`, `src/input/keyboard.ts`, `src/app/session.ts` (holds GameState, dispatches actions), `boardView.ts` (ghost, line glow, pop preview with "+n" label, merge preview).
- **Done when:** a Classic game is playable with touch, mouse (drag and click-click) and keyboard (1/2/3, arrows, Space, Esc); the touch offset keeps the piece above the finger; the forgiving snap works within 0.6c; invalid drops return along an arc; pieces that fit nowhere are dimmed with worried faces.

### M2.6 HUD, basic animation, pause, game over, restart
- **Goal:** a complete basic loop: play → lose → play again in under a second.
- **Implements:** SG §11.1–11.5, §11.12, §15 positions; design §13.2–13.3 (panel and buttons; near-miss lines can be the fallback line only for now), §3.6, §17 (pause overlay); minimal juice: placement squash (SG §9.2.2) and cell pop scale (SG §9.4.3) without particles.
- **Files:** `src/render/hudView.ts`, `src/ui/dom.ts`, `src/ui/icons.ts`, `src/ui/topBar.ts`, `src/ui/pauseOverlay.ts`, `src/ui/gameOverPanel.ts`, `src/ui/rescuePanel.ts`, `src/render/director.ts` (first version: squash + pop), `src/ui/strings.ts` (all HUD/pause/game-over/rescue strings from design §16.4 and §13).
- **Done when:** reviewer can play full Classic runs on phone and desktop; score counts up; best score persists in memory for the session; rescue offer appears after 10 lines when stuck; Space/Enter/R restart instantly; pause via button/Esc and on tab hide. **The game should already look like the style guide, not like a prototype.**

---

## M3 Meta progression and save

### M3.1 Save system
- **Implements:** arch §8.
- **Files:** `src/platform/storage.ts`, `src/meta/saveSchema.ts`, `src/meta/migrate.ts` + `migrate.test.ts` + fixtures, `src/app/session.ts` (autosave in-progress run, resume on boot), `src/platform/visibility.ts`.
- **Done when:** all migrate tests pass; reloading mid-run resumes the exact board, tray, score and combo; best score persists across reloads; corrupt save is backed up and replaced.

### M3.2 Run summary, XP, levels, coins
- **Implements:** design §14.1–14.3, §13.3 rewards row.
- **Files:** `src/meta/runSummary.ts`, `src/meta/progression.ts` + tests, `src/meta/catalogue.ts` (all items from design §14.3–14.4 with unlock rules), `src/ui/gameOverPanel.ts` (XP bar fill, coins, inline "Level 7!"), `src/ui/toasts.ts` (SG §11.8).
- **Done when:** progression tests pass (table, totals, stars, mode multipliers); game-over shows XP and coins with animated bar; level rewards are granted and toasted ("Unlocked: Hearts").

### M3.3 Stats and screen router
- **Implements:** design §17 (router, back behaviour), §18.
- **Files:** `src/meta/stats.ts` + test, `src/app/router.ts` (screen stack, history.pushState, Esc/back), `src/ui/screens/stats.ts` (numbers + last-20 bar chart on a small canvas, colours from palette).
- **Done when:** stats update after each run; browser back closes the screen instead of leaving; chart shows best bar highlighted.

### M3.4 Home screen and modes
- **Implements:** design §4, §9, §16.4 Home strings, §17; SG §11.7 cards, §10 logo.
- **Files:** `src/ui/screens/home.ts`, `src/render/miniGloop.ts`, `src/app/app.ts` (menu ↔ play), `src/core/modes.ts` wiring for Zen/Expert in session, `src/ui/pauseOverlay.ts` (Give up / End run variants).
- **Done when:** Home shows logo, level chip, coins, Play, the four mode cards with locked states, placeholder weekly card (filled in M4.5), footer buttons; Zen and Expert are playable when unlocked (reviewer can unlock with `?debug=1` panel button "Give 5,000 XP"); best scores separate per mode.

### M3.5 Collection screen
- **Implements:** design §14.4 strings and prices; SG §11 styling.
- **Files:** `src/ui/screens/collection.ts`, `src/meta/catalogue.ts` (buy/equip pure functions + tests).
- **Done when:** buying deducts coins, can't overspend, locked items show the right requirement text, equipping persists; item previews are drawn live (theme preview = small background + board thumbnail; skin = cherry gloop with accessory; pop effect = looping particle burst).

### M3.6 Themes
- **Implements:** SG §14 (all 7 themes, silhouette styles and air layers), §7.
- **Files:** `src/render/background.ts` (silhouette styles: jars, rooftops, kelp, dome, kitchen, pines, hills; air layers: stars, bubbles, shooting star, flour, snow, clouds), `src/render/themes.ts`.
- **Done when:** `?demo=themes` cycles all 7 with 400 ms crossfades; each theme is visibly different and still keeps gloops as the brightest objects (reviewer); background budget < 1 ms/frame.

### M3.7 Skins and pop effects
- **Implements:** SG §6.6 (all 8 skins, googly physics), §9.3 (6 particle kinds; the full particle system is built here if not already).
- **Files:** `src/render/face.ts` (accessories), `src/render/fx/particles.ts`, `src/render/fx/pool.ts`, `director.ts` (emit per cleared/popped cell, SG §9.3 counts).
- **Done when:** `?demo=faces&skin=<id>` shows each skin; googly eyes wobble on placement; each pop effect is visible on clears; particle cap 420 enforced (test on pool).

### M3.8 Achievements
- **Implements:** design §15, SG §11.11.
- **Files:** `src/meta/achievements.ts` + test (all 40), `src/ui/screens/achievements.ts`, toasts integration, coins awarded, Crowns unlock.
- **Done when:** every achievement has a test that triggers it; the screen shows 40 badges with progress for counters; toasts queue correctly.

---

## M4 Daily, streak, weekly, sharing

### M4.1 Daily mode
- **Implements:** design §10.1–10.5, §16.3 daily pill.
- **Files:** `src/app/session.ts` (daily in-progress slot, one counted attempt, practice), `src/meta/dailyRecord.ts` + test, `src/ui/topBar.ts` (pill states), Home daily card (status, countdown), pause "Give up" confirm, flavour-of-the-day display.
- **Done when:** the daily starts from the seeded board; quitting and reloading resumes the counted attempt; after finishing, a second play is "Practice (not counted)" and doesn't change the record; at UTC midnight (fake clock in tests) the next daily becomes available; HUD shows "Tray 7 / 30" under the score in daily.

### M4.2 Daily result and share text
- **Implements:** design §10.6, §16.4 Daily result strings.
- **Files:** `src/core/shareText.ts` + test (exact example), `src/platform/share.ts`, `src/ui/screens/dailyResult.ts` (big score, stats, emoji grid rendered as coloured rounded squares in DOM using share.* colours, legend, buttons, countdown).
- **Done when:** share text matches the spec byte for byte for the test fixture; Share uses Web Share or clipboard with toast; Classic "Share score" text works (design §13.3).

### M4.3 Share image card
- **Implements:** SG §12, design §10.7.
- **Files:** `src/render/shareCard.ts` (lazy-loaded), `src/platform/share.ts` (files share / download).
- **Done when:** "Share image" produces a 1080×1350 PNG matching SG §12 layout in the equipped theme (reviewer); falls back to download named `gloop-pop-daily-<N>.png`.

### M4.4 Streak and freezes
- **Implements:** design §11.
- **Files:** `src/meta/streak.ts` + test, Home streak strip (7 days), toasts for freeze used / streak ended, game-over daily panel streak line.
- **Done when:** streak tests pass for all cases in arch §9.1; the strip shows ✓/❄️/today correctly with a fake clock.

### M4.6 Challenge links and Classic share (design §23.5, §23.7)
- Parse and strip `?beat=&f=` on load (pure function `parseChallenge(search)` with unit tests for valid, invalid, out-of-range, unknown flavour). Home challenge card, chase target in run, "You beat your friend!" banner, game-over near-miss override, share text builder `buildChallengeText(summary, mode, url)` with exact-string unit tests, Classic PNG card variant with the final board and biggest gloop, "Rivals" achievement, run summary `biggestGloop`, game-over highlights row.
- Done when: unit tests pass for parse and text, and the game-over panel shows the highlights row.

### M4.7 Streak celebration (design §23.6)
- Flame tick-up animation on the Daily result panel, milestone gold flame with confetti and hit-stop, freeze-used text, Home strip tick pop. Pure helper `streakMilestone(n)` with tests.

### M4.5 Weekly goal
- **Implements:** design §12.
- **Files:** `src/meta/weeklyGoal.ts` + test, Home weekly card, game-over near-miss line 6 hook, reward toast.
- **Done when:** weekly tests pass; progress persists; new week resets progress and picks the next goal; reward claimed once.

---

## M5 Juice

### M5.1 FX foundations
- **Implements:** SG §9.0, §9.5, §9.9, §9.12.
- **Files:** `src/render/fx/tweens.ts` (pooled tweens), `src/render/fx/shake.ts`, `src/render/loop.ts` (timeScale with slow-mo rules), `src/render/fx/texts.ts` (cached text sprites).
- **Done when:** unit tests for tween timing and shake decay; slow-mo never more than once per 3 s (test); no allocations in steady-state frames (code review: pools only).

### M5.2 Placement, sweep and pop ripple
- **Implements:** SG §9.1, §9.2, §9.4 (complete timeline), §6.5 popping face, §6.4 big-gloop face last.
- **Files:** `src/render/director.ts`, `boardView.ts`, `trayView.ts` (deal drop-in).
- **Done when:** reviewer sees: snap + elastic squash, ripple into merged gloops, dust, sweep along cleared lines from the placed piece, BFS pop ripple through gloops with jelly drops, new-run diagonal wave; input is never blocked (place the next piece mid-animation).

### M5.3 Combo tiers, number pops, background reactions, stage moments
- **Implements:** SG §9.6, §9.7, §9.10, §7.3, design §6 tiers and §8 stage toasts, "New best!" banner (§9.9).
- **Files:** `director.ts`, `hudView.ts` (count-up, combo label, fuse pips), `background.ts` (reaction hooks), `fx/texts.ts`.
- **Done when:** each tier is distinguishable in a screen recording without sound; numbers size by points; the moon rises on stage up; "New best!" triggers slow-mo once per run.

### M5.4 Face reactions and game-over choreography
- **Implements:** SG §6.5 triggers (all rows), §9.8, design §13.2–13.4 (all near-miss messages).
- **Files:** `face.ts`, `boardView.ts`, `director.ts`, `src/core/nearMiss.ts` (complete), `src/ui/gameOverPanel.ts` (2 near-miss lines from the priority list).
- **Done when:** worried faces at 45+ filled cells; happy near clears; star eyes at tier 3; sad shaking unfit pieces and dizzy board on loss; the 1-cell near-miss is highlighted on the board; panel at 450 ms with correct lines (tests for message selection order).

### M5.6 Research v2 juice (design §23.1–23.4)
- `fx.hitStop(ms)` in the FX timeline (dt = 0 while active, input queued), wired for 3+ lines, Huge/Mega, All Clear, first-time moments.
- The PB chase bar under the HUD score (portrait and desktop), with pulse at ≥ 80%, label switching and the pass flash.
- Candy-flame score particles at combo tier ≥ 3 or 2,000+ point moves; reduced-motion fallback.
- First-time discovery banners and coin bonuses (`save.firsts`, pure `detectFirsts(events, firsts)` with tests).

### M5.5 Haptics and reduced motion
- **Implements:** SG §16, §9.11.
- **Files:** `src/platform/haptics.ts`, `src/platform/motion.ts`, guards in director/shake/loop/particles.
- **Done when:** with reduced motion on, no shake/slow-mo/flash, particles ×0.3; haptics follow the table and respect the setting; both covered by small unit tests of the gating functions.

---

## M6 Audio

### M6.1 Audio engine and SFX
- **Implements:** SG §13.1, §13.2 (every row), design R21 behaviour.
- **Files:** `src/audio/engine.ts`, `src/audio/synth.ts`, `src/audio/sfx.ts`, director wiring (cues from events), top-bar mute + M key.
- **Done when:** no AudioContext before first input; each SFX exists as a named function; pitch climbs with combo per the ladder; gloop pops are rate-limited to one voice per 25 ms; voice cap 24; mute persists. A test with a fake AudioContext asserts `noteFor` and rate limiting.

### M6.2 Music
- **Implements:** SG §13.3, §13.4.
- **Files:** `src/audio/music.ts`, settings wiring.
- **Done when:** the loop plays at 84 BPM with keys, bass, kick, hat; filter opens at tier 3, arpeggio at tier 4, ducks on pause and game over; stops when the tab is hidden; music and SFX toggles independent (reviewer listens).

---

## M7 Onboarding, settings, how to play

### M7.1 Tutorial
- **Implements:** design §16.1–16.3, SG §11.10.
- **Files:** `src/render/ghostHand.ts`, `src/ui/tutorialBubble.ts`, `src/app/session.ts` (tutorial flow using `core/tutorial.ts`), strings.
- **Done when:** a fresh save (clear localStorage) shows step 1 on the first frame with the bubble at 300 ms and the hand at 600 ms; each step advances only on success; skip works; tutorial score carries into the first Classic run; `tutorialDone` saved; returning players land directly on their run.

### M7.2 Settings and how-to-play
- **Implements:** design §16.4 Settings strings, §16.5, SG §5.4 (colour-blind patterns), §11.9 toggles.
- **Files:** `src/ui/screens/settings.ts`, `src/ui/screens/howToPlay.ts` (text + small animated canvas demos for rules 2 and 3 using the real renderer), `gloopRenderer.ts` (patterns).
- **Done when:** every toggle works and persists; reduce motion has 3 options; "Show tutorial again" replays it; reset requires the confirm and reloads into the tutorial; colour-blind patterns tile seamlessly across merged gloops.

### M7.3 Moments UX pass
- **Implements:** design §13.1 rescue panel, §11 toasts, §14.3 level-up toasts, §16.3 streak-at-risk pill; SG §11.6 rescue ring.
- **Files:** `rescuePanel.ts`, `toasts.ts`, `topBar.ts`, `hudView.ts`.
- **Done when:** none of these moments blocks play except the rescue panel; toasts never overlap; the rescue ring shows charge/ready/used.

---

## M8 Web platform

### M8.1 Service worker and manifest
- **Implements:** arch §11.1–11.2.
- **Files:** `src/sw/sw.template.js`, `vite.config.ts` plugin, `src/platform/sw.ts`.
- **Done when:** `dist/sw.js` contains the hashed asset list and version; after one online load, the built site works offline in `vite preview` (reviewer: DevTools offline); dev mode doesn't register the SW.

### M8.2 Icons and OG image
- **Implements:** arch §11.3, SG §19.
- **Files:** `tools/raster.mjs`, `tools/gen-icons.mjs`, generated `public/*.png`, `public/favicon.svg`, `public/manifest.webmanifest`, `index.html` meta.
- **Done when:** `node tools/gen-icons.mjs` writes valid PNGs (a test decodes the PNG header and checks sizes); the OG image shows the board, gloops with faces and the title; the 64 px thumbnail test passes by eye.

### M8.3 README
- **Files:** `README.md`: one-line pitch, screenshot placeholder note, how to play (short), dev commands, deploy steps (Pages source = GitHub Actions, set `VITE_SITE_URL`), project structure summary, licence notes for fonts (SIL OFL via @fontsource), credits.
- **Done when:** a new developer can run, test and deploy from the README alone.

---

## M9 Polish and balance

### M9.1 Performance pass
- **Implements:** arch §6, §7.
- **Files:** wherever needed; `?debug=1` overlay additions (frame ms histogram).
- **Done when:** steady-state frame < 6 ms on desktop in the overlay with combo tier 4 + Mega Pop demo (`?demo=mega` scripted scenario); adaptive DPR verified by forcing a slow frame flag; bundle JS gz < 150 KB reported by `npm run size` and recorded in the final message.

### M9.2 Accessibility and desktop polish
- **Implements:** SG §17, §11.1 focus, arch §5.1.
- **Files:** UI files, `index.html`, keyboard.ts.
- **Done when:** every screen is usable by keyboard only (Tab order, Enter, Esc); aria-labels on icon buttons; aria-live announcements; the controls hint shows on desktop for the first 3 runs.

### M9.3 Balancing pass
- **Implements:** design §8 targets and tuning knob order.
- **Files:** `src/core/stages.ts` (numbers only), `docs/balance-log.md` (new: runs, before/after numbers).
- **Done when:** `npm run sim -- --runs 300` shows Classic median placements 90–150 and median score 8,000–20,000; Expert median 40–80 placements; Daily median ≥ 60 placements of 90 with ≥ 20% of bot runs placing all 30 trays; the solver p99 < 8 ms; changes only in the knob order of design §8, logged in `docs/balance-log.md`; if a target can't be met, the log explains why and the final message proposes a design change.

### M9.4 Final QA and string audit
- **Files:** fixes anywhere; `docs/qa-checklist.md` (new) ticked.
- **Checklist must cover:** design §21 table row by row (R1–R22) with evidence; all strings match design §16.4–16.5 and §15 exactly; SG §18 never-do list; SG §19 thumbnail test; first-launch flow on a fresh profile; resume after reload in every mode; UTC midnight rollover with a fake clock; offline load; bundle size; no console errors.
- **Done when:** checklist complete with notes; `npm run check` passes; any deviations are listed in the final message as proposals.

---

## M10 Tactile feel v2

Spec: SG §9.13 (read §9.13.a first). Research: `research/game-feel.md`. Before-captures: `/workspace/night-game/shots/feel/before-*-sheet.png`. Do the chunks in order. Each chunk ships alone: `npm run check` passes and the game plays correctly after every chunk. After-captures (`?debug=1&demo=feel&slowmo=0.1`) are taken by the director, not by the coding agent.

### M10.1 Clocks, board-only hitstop, input never waits
- **Implements:** SG §9.13.a, §9.13.f.1 and §9.13.f.3 (hitstop formula and when it fires; keep today's cell visuals), §9.13.h hitstop column, §9.13.j restart rule, §9.13.n items 1–4.
- **Files:**
  - `src/render/loop.ts`: R/W/B clocks; one reused frame object.
  - `src/render/fx/hitStop.ts`: controller, `hitStopMs()`, tests.
  - `src/render/fx/slowMo.ts` (new): controller, tests.
  - `src/app/app.ts`:
    - delete `queuedActions` and `queuedRestart`
    - `place` calls `endNow()` and the 60 ms slow-mo release
    - `triggerSlowMo` and the streak `setTimeScale(0)` go through the controllers; no `setTimeout`
    - pass `boardNow`/`worldNow`/`realNow` to director, boardView and hudView
  - `src/render/director.ts`: cues on B; particles, texts and shake on W; `hitStop.schedule(F, T)` at F = release + 60 ms.
  - `src/render/boardView.ts`: placement on B, tray and drag on R.
  - `docs/architecture.md` §6: record the three clocks and the new files.
- **Done when:**
  - The tests in §9.13.n items 1–4 pass.
  - `grep -n "queuedActions\|queuedRestart\|setTimeScale(0)" src` finds nothing.
  - During a 4-line clear, particles from the previous move keep moving and the held piece follows the finger (code review: those systems read `realDt`/`worldDt`).
  - Reduced motion gives T = 0.

### M10.2 Springs, pickup, drag and snap preview
- **Implements:** SG §9.13.b, §9.13.c, §9.13.d; the pick and snap rows of §9.13.k; the pickup, drag and ghost rows of §9.13.l; §9.13.n items 5–7.
- **Files:**
  - `src/render/fx/spring.ts` (new) and `spring.test.ts`.
  - `src/render/heldPiece.ts` (new): P_d, tilt, stretch, shear, lift and shadow state; pure maths, no DOM, tested.
  - `src/input/pointer.ts`: mutate one drag object; expose P_f and smoothed velocity; snap unchanged.
  - `src/render/boardView.ts`: draw the held piece with the §9.13.c transform order; cached shadow sprites; ghost fade, scale and magnet tick.
  - `src/platform/haptics.ts`: `pick`, `snap` and the snap rate rule.
- **Done when:**
  - Unit tests show the snap (row, col) is identical with and without lag, tilt and stretch for a set of finger positions.
  - Spring S15 example test passes.
  - sx·sy = 1 for the grab squash and the stretch; the shear determinant is 1.
  - Tilt is clamped to ±5°.
  - Reduced motion gives P_d = P_f.
  - No allocation in `pointerMove` (code review).

### M10.3 Placement, camera kick, trauma shake, lingering-cell fix
- **Implements:** SG §9.13.e (all items), §9.13.g.3 (trauma) and §9.13.g.4 (kick); the place and stuck rows of §9.13.k (fired on L and t 0); the placement row of §9.13.l; §9.13.n items 8 and 12.
- **Files:**
  - `src/render/easing.ts`: add `easeInQuad` and its test.
  - `src/render/fx/camera.ts` (new; replaces `fx/shake.ts` and its users): trauma, smoothed noise, roll, kick spring, clamp; tests.
  - `src/render/director.ts`: travel, anticipation, smear, land frame callback.
  - `src/render/boardView.ts`:
    - placement layer: one squashed body (piece, or the merged gloop) drawn as per-column strips from a pooled offscreen canvas
    - mask the placed cells during travel
    - skip removed cells
    - neighbour jiggle
  - `src/app/app.ts`: apply the camera transform (offset plus roll about the board centre; desktop × 0.7).
- **Done when:**
  - The trauma tests pass: shake = τ², linear decay 1.6/s, the clamp, the x-only stuck event.
  - The placement-layer test passes: its drawn cells ∩ removed cells = ∅.
  - `before-line-sheet.png`'s lingering red block cannot happen: the layer's lifetime ≤ L + 324 ms and removed cells are skipped.
  - `place` sound and haptic are fired from the land callback, not `apply()`.
  - The merged-gloop squash draws no piece-over-gloop seam (code review: one body per squash).

### M10.4 Line clear and gloop pop burst, labels decluttered, audio on impact
- **Implements:** SG §9.13.f.2 and §9.13.f.4–8, §9.13.g.1, g.2 and g.5–7; the line, pop and All Clear rows of §9.13.k; the line, pop and label rows of §9.13.l; §9.13.n items 9 and 13.
- **Files:**
  - `src/render/director.ts`: swell, flash at F on R, cached sweep sprite, 28 ms per cell, squash then burst, wave step `min(38, 330/D)`, per-cell anticipation, `onImpact` callbacks, impact flash, Mega/All Clear slow-mo at the climax.
  - `src/render/fx/particles.ts` and `src/render/fx/pool.ts`: a preallocated 420-object pool with swap-remove; directional emission (3 of 5 inherited, ±35°).
  - `src/render/fx/texts.ts`: centre stack and top lane, fitting, clamping.
  - `src/app/app.ts`:
    - first-time moments go into the stack instead of `director.banner`
    - lineClear, gloopPop and stinger sounds start from `onImpact`
    - the score count-up start moves to the impact frame
  - `src/audio/index.ts`: accept an impact-time trigger; ripple spacing follows the new wave step.
- **Done when:**
  - Wave tests pass (D = 27 → last burst ≤ 330 ms after the first; D = 3 → 38 ms).
  - Label-stack tests pass: one stack; inside the clamp; no overlap with the top lane; a first-time moment gives one label.
  - The particle pool test shows no new `Particle` objects after warm-up.
  - A 28-cell Mega Pop finishes removing cells ≤ 450 ms after its first burst on B (test on the cue schedule).
  - Hitstop now starts at the swell peak.

### M10.5 Combo escalation, score punch, game-over settle
- **Implements:** SG §9.13.h (whole table), §9.13.i, §9.13.j; the score row of §9.13.l; §9.13.n item 15.
- **Files:**
  - `src/render/director.ts`: tier multipliers for hitstop, trauma, kick, particles and sweep step; particle budget scaling.
  - `src/render/hudView.ts`: tick rhythm, tick and punch springs, colour pulse.
  - `src/app/app.ts`: game-over settle through the slow-mo controller, exempt from the 3 s rule.
  - `src/platform/haptics.ts`: combo tick extras.
- **Done when:**
  - Tests pass for:
    - `hitStopMs` with combo tiers (never under 50, never over 150)
    - the trauma bonus per tier
    - the score display: updates ≤ once per 40 ms, exact at D, punch size by points
    - the settle: s reaches 1 at 450 ms
  - The game-over panel still appears at 450 ms.
  - Restart during the settle is the same frame (test: s = h = 1, τ = 0 after `restart()`).

### M10.6 Haptics v2, reduced-motion audit, photosensitivity, performance
- **Implements:** SG §9.13.k (whole table, rate limiter, priorities), §9.13.l (audit of every row), §9.13.m; §9.13.n items 10, 11 and 14.
- **Files:**
  - `src/platform/haptics.ts` (patterns, priority, 60 ms limiter; tests).
  - `src/platform/motion.ts` (reduced-motion gates for every new effect; tests).
  - `src/render/fx/flashLimiter.ts` (new, R clock; tests).
  - `src/render/background.ts`: cap the sky flash at alpha 0.25.
  - Any per-frame allocation found in director, boardView or hudView.
  - `docs/architecture.md`: record the new files.
- **Done when:**
  - Haptic tests: every pulse ≤ 20 ms, every gap ≥ 50 ms, total ≤ 400 ms, the limiter and priority rules.
  - The reduced-motion test zeroes hitstop, slow-mo, trauma, kick, tilt, stretch and shear, and gives particles ×0.3.
  - Flash limiter tests: a 4th flash in 1 s is refused; no full-board overlay above alpha 0.25.
  - The `?debug=1` overlay shows effect ms ≤ 4 at Mega Pop + combo 12 on desktop.
  - A code-review list confirms no `new`, object literal or array literal, `splice`, `createLinearGradient`, `shadowBlur` or `filter` in the per-frame paths of `director.draw`, `boardView.draw`, `particles.update`, `camera.update`.
  - The final message notes the iOS haptics gap (S19, S20).

---

## M11 Audio v2 (samples + synth)

Spec: SG §13 (read §13.1–§13.3 first), SG §11.13–§11.14, design §16.4 (Settings and Credits strings). Research: `research/audio.md` (tags A1–A27). Assets: only the files in SG §13.11. They are all CC0 and listed in `CREDITS.md`. Copy them from `/workspace/night-game/audio-src/` and don't download anything. Do the chunks in order. Each chunk ships alone: `npm run check` passes and the game plays correctly after every chunk. The game must never be silent where v1 made a sound: until a sample exists, the v1 synth recipe plays (SG §13.4 note 4). Agents can't listen. The director does the SG §13.13 ear check after M11.4 and again after M11.6.

### M11.1 Asset pipeline, sprite, manifest, credits data
- **Implements:** SG §13.2, §13.11 (whole), §13.9 file table and manifest shape; §13.12 items 5, 8 and 13 (the parts that need no engine).
- **Files:**
  - `assets-src/audio/**`: copies of exactly the source files listed in SG §13.11 (with each Kenney pack's `License.txt`). `assets-src/audio/SOURCES.md`: one entry per file with path, SHA-256, title, author, page URL, licence and licence URL, "verified 2026-10-25", and how it was obtained.
  - `tools/build-audio.mjs` (new; Node 20, no dependencies, runs ffmpeg/ffprobe through `spawnSync`, every command wrapped in a timeout). `package.json` script `"audio": "node tools/build-audio.mjs"`; **not** part of `check`.
  - Generated and committed: `public/audio/sfx.<hash8>.ogg|mp3`, `public/audio/music.<hash8>.ogg|mp3`, `src/audio/manifest.ts`.
  - `src/audio/credits.ts` (new): `CREDITS` (id, group, title, author, site, url, licence, licenceUrl). Ids: `oga-lofi`, `fs-325583`, `fs-802606`, `fs-442772`, `fs-500912`, `kenney-interface`, `kenney-impact`, `kenney-casino`, `kenney-jingles`, `original`.
  - `src/audio/sprite.ts` (new): `findSpriteOffset(data, sampleRate)`, pure.
  - Tests: `manifest.test.ts`, `sprite.test.ts`, `credits.test.ts` (reads `CREDITS.md` with `node:fs`).
  - `CREDITS.md`: remove the "Draft" note and correct anything that changed.
  - `docs/architecture.md`: record the new folders and files.
- **Done when:**
  - `npm run audio` rebuilds byte-identical outputs on a second run (same hashes).
  - It prints every segment's in-band % (all cues except `sub` and `coin*` ≥ 50 %).
  - The 4 files are within the SG §13.9 budgets.
  - The manifest, sprite-marker and credits tests pass.
  - `src/` imports nothing from `assets-src/`.
  - No player-facing behaviour changes yet.

### M11.2 Sample engine: graph, loader, formats, voices, ladder, ducking, service worker
- **Implements:** SG §13.3 (math), §13.5, §13.6 duck schedule, §13.8, §13.9 (loading, formats, service worker, the audioSession line); §13.12 items 1–4, 6, 7, 11, 12 and 17.
- **Files:**
  - `src/audio/engine.ts`:
    - buses per SG §13.8, with the limiter replacing the old compressor
    - `audioSession` set before the context exists
    - `suspend`/`resume` on visibility
    - one shared noise buffer
  - `src/audio/loader.ts` (new):
    - `pickFormat`
    - fetch and decode the sprite after the gesture
    - marker offset and slicing into per-segment buffers
    - the ogg → mp3 retry
    - lazy music fetch
  - `src/audio/voices.ts` (new): voice pool with priority stealing, `pickVariant`, rate limiters. It uses the cosmetic RNG (arch §5), injectable.
  - `src/audio/ladder.ts` (new): `rungMidi`, `rungFor`, `freq`, `rate`, `foldRate`, the candy-bar synth body.
  - `src/audio/duck.ts` (new): pure schedule plus apply.
  - `src/audio/fallback.ts` (new): the v1 recipes, moved out of `sfx.ts` unchanged.
  - `vite.config.ts`: exported `precacheFilter`, `AUDIO_FILES` injection.
  - `src/sw/sw.template.js`: `gloop-pop-audio` cache-first for `audio/`, plus the cleanup rule.
  - `tools/check-size.mjs`: audio budgets and the per-device total.
  - `docs/architecture.md` §11.1: record the audio cache.
- **Done when:**
  - The listed tests pass.
  - With a fake `AudioContext`, no context or fetch happens before `initAudioOnFirstInput()`, and the first `sfx.place()` after the gesture (sprite not decoded yet) plays the synth fallback.
  - `npm run build` produces a `sw.js` whose PRECACHE has no `/audio/` path.
  - Sounds are still the v1 mapping (the per-event mapping is M11.3).

### M11.3 Per-event mapping, impact-frame sync, comboUp fix
- **Implements:** SG §13.4 (every row and note), §13.3 (ladder use and the comboUp fix), §13.6 (stingers), §13.10; §13.12 items 9, 10, 16 and 18.
- **Files:**
  - `src/audio/movePlan.ts` (new, pure): `planMove(events, ctx)`.
  - `src/audio/sfx.ts`: rewritten per SG §13.4, using the plan.
  - `src/audio/index.ts`: `playForEvents` plays only the input-time sounds; new handlers `onLand`, `onImpact`, `onBurst`, `onPopFirst`, `onClimax`.
  - `src/render/director.ts`:
    - new `onBurst(order, gloopTier, isLastOfGloop)`
    - `onClimax` and `onBurst` also fire in reduced motion (SG §13.10)
  - `src/app/app.ts`:
    - route the director callbacks to the audio handlers
    - newBest moves from input to F (or L)
    - stuck at t0
    - the snap tick from the pointer's target-change hook (same gate as the snap haptic)
    - deal ticks per slot
    - uiTap/toggle sounds for DOM buttons through one delegated listener
- **Done when:**
  - The tests pass. They include: a `cleared` + `comboUp` move gives one lineClear, at F only; newBest is never at input; one stinger per move by priority; reduced motion gives the same calls.
  - `grep -n "case 'comboUp'.*sfx\." src/audio` finds nothing.
  - `sfx.comboHarmony` and `sfx.sparkle` are reachable from the plan, so the audit's dead code is gone.
  - A 28-cell Mega Pop voices ≤ 14 pop sounds, each ≥ 25 ms apart (test on a simulated burst schedule).

### M11.4 Music bed and adaptive layers
- **Implements:** SG §13.7 (whole), §13.6 (duck and low-pass dip on the music chain); §13.12 items 14 and 15.
- **Files:**
  - `src/audio/music.ts`: rewritten. The generative v1 loop is deleted.
    - bed source with `loopStart`/`loopEnd`, the music clock and `nextBar`
    - pad and twinkle layers
    - game-over rate ramp
    - rest rule, idle, pause, menus, restart
  - `src/audio/musicState.ts` (new, pure): states, danger with hysteresis, tier changes at bar lines.
  - `src/app/app.ts`:
    - feed `musicState` its inputs: tier, danger, idle time, paused, screen, game over
    - start the lazy fetch on the first play-screen interaction
- **Done when:**
  - The tests pass.
  - The bed loops with no gap in a long-running test, using a fake clock and `loopStart`/`loopEnd` checks.
  - Music is never fetched while "Music" is off (test).
  - In menus the music is silent; returning to play resumes from a bar line.
  - Game over halves the bed rate over 450 ms. Restart brings rate 1 back within 300 ms, and input is never blocked.
  - The director listens to the bed on a phone (SG §13.13 items 1, 2, 8 and 9).

### M11.5 Credits screen, settings sliders, README
- **Implements:** SG §11.13, §11.14, §13.9 settings; design §16.4 (Settings and Credits strings, word for word).
- **Files:**
  - `src/ui/screens/credits.ts` (new): built from `CREDITS` data.
  - `src/ui/screens/settings.ts`: the two sliders, and a "Credits" button under "Show tutorial again".
  - `src/ui/screens/home.ts`: "Credits" text button in the footer after "How to play".
  - `src/ui/strings.ts`: the new strings.
  - `src/meta/saveSchema.ts` and load migration: `settings.sfxVolume` and `settings.musicVolume`, default 1, clamped to 0–1.
  - Router entry `credits`.
  - CSS for the slider (CSS variables only, no hex).
  - `README.md` (see below).
- **README text:** add this section after "Build it yourself":

  ```md
  ## Credits

  Sound effects and music use free CC0 assets by Kenney, cbenci, JelloApocalypse, qubodup, Bertsz and omfgdude, from Kenney.nl, Freesound and OpenGameArt. The full list, with links, licences and the exact edits we made, is in [CREDITS.md](CREDITS.md). The game also shows it under Settings → Credits.
  ```

  Also replace the README sentence "Sound and music come from WebAudio synthesis, so the repo has no audio files." with: "Sound effects mix CC0 samples with WebAudio synthesis, and the music is a CC0 loop with synthesised layers. The audio files are about 0.8–1 MB, are loaded after your first tap, and are cached for offline play."
- **Done when:**
  - The Credits screen lists exactly the `CREDITS` entries (jsdom test), in the design §16.4 wording.
  - Every link has `target="_blank"` and `rel="noopener noreferrer"` (test).
  - Sliders change the bus gains as v² (test with a fake graph), persist through reload, and are disabled when their toggle is off.
  - The mute button, the M key and both toggles still work (existing tests pass).
  - The string audit finds no player-facing text outside `strings.ts`.

### M11.6 Tests, mix check, polish
- **Implements:** SG §13.12 (every item not yet covered), §13.8 loudness target, §13.13.
- **Files:**
  - Any test still missing.
  - A `?debug=1` overlay line: the audio format in use, decoded or fallback per segment, `outputLatency`, live voices, the music state.
  - `docs/qa-checklist.md`: an "Audio" section with the SG §13.13 items as checkboxes.
- **Done when:**
  - All 18 items of SG §13.12 have passing tests.
  - The debug overlay shows the audio line.
  - The total payload measured in `dist/audio` is reported in the final message (per format).
  - The final message lists every SG §13.13 item as "needs ear check" for the director.
  - The director's ear check (phone speaker and headphones) passes, or its fixes are written back into SG §13 as a dated revision note.

---

## M12 Goals and Adventure

Spec: design §24 (read §24.1 and §24.15 first), design §16.4 "Pass 3" strings, SG §20. Research: `research/retention.md` (tags RT1–RT29 in design §24). Do the chunks in order. Each chunk ships alone: `npm run check` passes, and the game plays correctly after every chunk. Classic, Expert, Zen and Daily must play exactly as before, except for the goal strip added in M12.2. The pinned 400-day Daily hash, the Classic golden game and the sim tests must pass **unchanged** in every chunk.

**Binding for every chunk:** nothing blocks or delays input during play (design §24.15, SG §20). Hitstop freezes only the B clock. No `setTimeout` in play paths. Strings come only from `strings.ts`, colours only from existing palette roles (SG §20.10 rule 19). No new runtime dependencies.

**Debug demos:** every `?debug=1&demo=…` scene below runs on an **in-memory save copy that is never written** to storage (`saveNow` is a no-op while a demo is active; add a test). Scenes are built in `src/app/demoScenes.ts` as pure functions of the current save, so they are unit-testable. The director takes the screenshots, not the coding agent.

**Bundle budget:** JS is 86 KB gz today. The pass 3 target is **≤ 115 KB gz total**. The hard limit stays 150 KB (`check-size.mjs`). The Adventure map, start card, level panels and `levels.data.ts` go in **one lazy chunk** (dynamic `import()` from the Home Adventure card and the router), so the entry chunk grows by ≤ 10 KB. `levelGen.ts` and `levelBot.ts` are used by the tool and the tests only and must not appear in `dist/`. Every chunk's final message reports the gzipped total and per-file sizes from `npm run size`.

### M12.1 Save schema v2 and migration
- **Implements:** design §24.14 (whole), arch §8 (migration pipeline).
- **Files:**
  - `src/meta/saveSchema.ts`: `SaveV2`, `CURRENT_VERSION = 2`, `defaultSave()` with the v2 defaults. Keep a `SaveV1` type for the migration input.
  - `src/meta/migrate.ts`: `migrations: Record<number, (s) => s>` with `0 → 1` (today's v0 code moved) and `1 → 2`. `sanitize()` covers every new field per §24.14, and `validGame` accepts board values 8–9 only for `mode === 'adventure'`.
  - `src/core/types.ts`: `ModeId` gains `'adventure'`; `Cell` gains `8 | 9`; the optional `GameState.goals` and `GameState.adventure` types; the new actions and events (§24.14). Types only: the reducer ignores them until M12.2/M12.4.
  - Every `SaveV1` import site switches to `SaveV2` (type rename only).
  - `src/meta/fixtures/save-v1-veteran.json` (new): level 23, xp in the middle of the level, 4,310 coins, 5 owned themes/skins/pops with non-default equipped items, Zen and Expert unlocked, 17 achievements including `bigPopCount`, a 12-day streak with 1 freeze and 3 frozen days, weekly progress 87/150, 14 daily records, `recentClassic` of 20 scores, firsts, settings with volumes 0.6/0.3 and `cbPatterns: true`, a Classic `inProgress` at move 37, and a `dailyInProgress`.
  - `src/meta/fixtures/save-v2-veteran.expected.json` (new): the exact expected output.
  - `docs/architecture.md` §8: the SaveV2 interface and the migration list.
- **Tests** (`migrate.test.ts`, `saveStore.test.ts`):
  1. `save-v1.json` → v2: every v1 field deep-equal, and the new fields equal the defaults.
  2. `save-v1-veteran.json` → deep-equals `save-v2-veteran.expected.json`.
  3. Veteran (level 23): `owned.modes` contains `'adventure'` and boosters are `{1, 1, 1}`. The level-1 fixture: no `'adventure'`, boosters `{0, 0, 0}`.
  4. The veteran's Classic `inProgress`: run the same 5 `place` actions with `step` on the v1 state and the migrated state. The events and states are identical.
  5. Idempotent: `migrate(migrate(x))` deep-equals `migrate(x)` for both fixtures, `defaultSave()` and the v0 sample.
  6. v0 `{ best: 900, coins: 40 }` → v2 with `best.classic` 900, coins 40, `v` 2.
  7. `{ v: 3 }` → `defaultSave()`, and `saveStore` writes the `gloop-pop:save:corrupt:<ts>` backup.
  8. Sanitize: stars 5 → 3; frontier 300 → 121; frontier 1 with level 9 won → 10; boosters 9 → 5 and −1 → 0; level key "0" and "121" dropped; unknown mission id → slot removed; mission progress −4 → 0 and 999 → target; Classic `inProgress` with a cell 8 → null; Adventure `inProgress` with a cell 10 → null.
  9. `defaultSave()` has `v: 2` and comes through `sanitize` unchanged.
- **Done when:** the tests pass; loading the veteran fixture in the app (debug `?debug=1&save=veteran` loads it in memory, never written) shows the same Home, Collection, Stats and streak as before; the resumed Classic run continues; no player-facing change.

### M12.2 In-run targets and the mini goal (Classic, Expert)
- **Implements:** design §24.2, §24.12 rule 2b, §16.4 pass 3 "In-run goal strip" and "Game-over rewards row"; SG §20.7, §20.8 (layout band), §20.9 rows 1–2.
- **Files:**
  - `src/core/goals.ts` (new, pure): `LADDER`, `ladderValue(i)` (continues +50,000 forever), `nextTarget(score, floor)`, `targetsPassed(oldScore, newScore)`, `MINI` table, `pickMini(seed)` (hash `cyrb128(seed + '/mini')`, never the tray stream), `miniProgress(mini, events, state)`.
  - `src/core/game.ts`: `newGame(cfg, seed, { best })` creates `state.goals` for Classic and Expert, and only when the caller passes `goals: true` (the app passes `save.tutorialDone`). `step` updates the mini goal and emits `targetReached` (ascending) and `miniDone`, after `scored`. No other change to events or RNG.
  - `src/render/goalStrip.ts` (new): the canvas pills (SG §20.7) on the R clock, with cached text sprites. The crossing trigger reads the HUD's counting-up score.
  - `src/render/layout.ts`: the goal-strip band and the `hasGoalStrip` input.
  - `src/meta/progression.ts`: run coins += 5 × `targetsHit` + 15 if the mini is done; XP += 10 if the mini is done.
  - `src/core/nearMiss.ts`: rule 2b. `src/ui/gameOverPanel.ts`: the two new reward lines.
  - `src/app/app.ts`: pass `best` and `goals`; the "Mini goal: {text}" toast on the first placement; feed the strip.
  - `src/ui/strings.ts`: the strip strings. `src/ui/screens/howToPlay.ts`: rule 8 (design §16.5), with the rule count in `strings.test.ts` updated.
  - `src/app/demoScenes.ts`: the scenes below.
- **Tests:**
  - `goals.test.ts`: the first 14 ladder values exactly (1,000 … 100,000, 150,000, 200,000); `nextTarget(0, 0) = 1,000`, `nextTarget(4,999, 0) = 5,000`, `nextTarget(0, 10,000) = 10,000` (best 40,000); `targetsPassed(4,900, 10,100)` = [5,000, 7,500, 10,000]; `pickMini` golden ids and flavours for 8 pinned seeds; each of the 8 mini kinds reaches done from a synthetic event list and fires once.
  - `game.test.ts`: with goals on, a scripted move from 4,880 to 7,600 emits `targetReached` 5,000 then 7,500 and `targetsHit = 2`; the Classic golden game gives the same score, board and trays with goals on and off; Daily, Zen and tutorial states have no `goals`; resume (JSON round trip and sanitize) keeps the mini progress.
  - `progression.test.ts`: coins and XP with 0, 3 and 12 targets, with and without the mini.
  - `nearMiss.test.ts`: rule 2b text, its order (after 2, before 3), and the 10% edge (exactly 10% applies, 10.01% doesn't).
  - `layout.test.ts`: 390 × 844 with the strip matches SG §20.8 (±1 px); without it, the old §15.1 numbers are unchanged; 412 × 915 matches the Pixel 7 table (±1 px); 360 × 640 and 1280 × 800 have no overlapping rects.
- **Debug:** `?debug=1&demo=target` (Classic, score 4,880, best 9,000; slot 0 holds a Dot that completes a row and passes 5,000; mini "Big Pop 0/1"), `?debug=1&demo=target-hit` (the same after the move, with the crossing text held), `?debug=1&demo=mini-done` (the mini pill in its "Done · +15 coins" state, held). `&hold=1` (default in the two held scenes) freezes the 1,200 ms text so it can be captured.
- **Done when:** the tests pass; in Classic the pills update without any input delay (code review: no awaits, no queues, R clock); Daily and Zen show no strip and keep their exact layout; the game-over panel shows the target and mini lines.

### M12.3 Daily missions
- **Implements:** design §24.3 (whole), §24.12 rule 6b, §24.11 #48–#49, §16.4 "Missions card" and the mission toasts; SG §20.6.
- **Files:**
  - `src/core/missions.ts` (new, pure): `MISSIONS` (29 rows: id, slot, target, counting kind, needs), `deck(slot, cycle)`, `missionAt(slot, w)`, `issue(slot, w, available, shownToday)`.
  - `src/meta/missions.ts` (new): `rollDay(save, dayKey)`, `addMissionProgress(save, state, events)` (the §24.3 counting rules; Zen excluded for score kinds), `claimMission(save, slot)` (through `grantXp`), the set bonus, `rerollMission(save, slot, dayKey)`, `missionNearMiss(save)`, `available(id, save)`.
  - `src/ui/missionsCard.ts` (new) and `src/ui/screens/home.ts` (card placement; Adventure entries are not added yet).
  - `src/meta/achievements.ts`: #48 and #49 (counters), category `goals`.
  - `src/app/app.ts`: `rollDay` on load, on opening Home and at run end; live progress per move; the "Mission done" toast; the game-over line "{k} missions ready to claim".
  - `src/core/nearMiss.ts`: rule 6b. `src/ui/strings.ts`: the missions strings. `howToPlay.ts`: rule 9 (design §16.5).
- **Tests:**
  - `core/missions.test.ts`: 29 missions, slot counts 10/10/9, unique ids; every text equals the §24.3 table (via `strings.test.ts`); `deck` is a permutation per cycle with no repeat within a cycle; golden: the missions of days 1–14 for each slot are pinned.
  - `meta/missions.test.ts`:
    1. Adventure missions are skipped while Adventure is locked; `advstars6` is skipped with fewer than 6 unearned stars.
    2. Day roll: a claimed slot is replaced; an unfinished one is kept with its progress; a done-unclaimed one is kept; after 5 missed days nothing is lost and the claim still pays.
    3. Change: once per UTC day; it skips `shownToday`; a second change the same day is refused; the next day it works again.
    4. Table-driven: every mission id advances by the right amount from a synthetic event list. This includes flavour cells from both cleared lines and pops, cubes not counted, Zen excluded for the 4 score missions, and Adventure counted.
    5. Claim pays once, and the set bonus pays once, when the third slot is claimed.
    6. The "Mission done" toast fires once per mission.
    7. #48 at 10 claims, #49 at 100.
    8. Rule 6b text and order.
- **Debug:** `?debug=1&demo=missions` (Home: slot A done and unclaimed, slot B at 32/40, slot C claimed, free change unused), `?debug=1&demo=missions-done` (all three claimed, set line done).
- **Done when:** the tests pass; claiming is instant (the button turns into the check on click; the coin flight is cosmetic); mission progress from a Classic, a Daily and a Zen run shows on Home; nothing expires.

### M12.4 Adventure engine: sugar cubes, adventure mode, 120 validated levels
- **Implements:** design §24.4, §24.5, §24.6 (whole), the reducer half of §24.8–§24.10 (bonus moves, `booster` action, result and stars); SG §20.1 (cube rendering, so the debug board can be checked).
- **Files:**
  - `src/core/gloops.ts`: components only for values 1–7. `src/core/resolve.ts` and `src/core/solver.ts`: the cube rule through one shared helper (`applyLineClear`); the `cubes` event.
  - `src/core/generator.ts`: `DealOptions` gains `weights?`, `flavours?` and `f2?` (used only by Adventure). The RNG consumption order (§7.3) stays the same for every existing mode.
  - `src/core/levels.ts` (new, pure): the §24.6 tables (bands, K, moves, chapters, rotation, start pieces, cubes), `levelParams(n)` and `buildLevel(n, s)`.
  - `src/core/levelBot.ts` (new, frozen): the §24.6 bot.
  - `src/core/levelGen.ts` (new, pure): `calibrate(n, s)`, `validate(def)`, `generateLevel(n)`.
  - `src/core/levels.data.ts` (generated, committed, header `// GENERATED by tools/gen-levels.mjs — do not edit`).
  - `src/core/adventure.ts` (new): `newAdventureGame(def, { bonusMoves, boosters, freeShuffle })` and the Adventure branch of `step` (§24.4 order; no rescue, no stage-up; `booster` and `endRun` actions; `result` with stars).
  - `src/core/game.ts`: dispatches Adventure states to `adventure.ts`.
  - `tools/gen-levels.mjs` (new; like `tools/sim.mjs`). `package.json`: `"levels": "vite build --ssr src/core/levelGen.ts --outDir .sim --emptyOutDir && node tools/gen-levels.mjs"` with flags `--write` (regenerate the table) and `--verify` (re-validate and print the per-chapter wins table and the time taken). **Not** part of `check`.
  - `src/render/cubes.ts` (new) and the board-layer hook in `boardView.ts`.
  - `docs/architecture.md`: record the new files (§3), the cube rule (§4.6) and the tool (§9.3).
  - `docs/balance-log.md`: a new dated section, "Adventure levels", with the `--verify` table (per chapter and band: mean wins of 12, mean moves, mean s3) and the seed indices that needed more than 1 try.
- **Tests:**
  - `resolve.test.ts` and `gloops.test.ts`: a cube counts as filled; cubes are never in a gloop (a line of 7 cherry + 1 cube pops no cube); 9 → 8 and 8 → 0 on a clear; a cube in a crossing row and column is hit once; no All Clear while a cube is left; `cubes` event lists.
  - `solver.test.ts`: `canPlaceAll` agrees with stepping `resolveBoard` on 200 seeded random boards with cubes.
  - `generator.test.ts`: the existing golden deal snapshots are unchanged; Adventure options use the given weights, flavours and F2.
  - `levels.test.ts` (the §24.6 re-validation, vitest timeout 90,000 ms):
    1. There are 120 levels, and the bands, K, moves, rotation, chapters and cube counts match `levelParams`.
    2. For every level, `buildLevel(n, s)` equals the stored board and goal flavour.
    3. For every level, 12 bot runs on the real reducer give exactly the stored targets, `wins` (≥ K), `s2` and `s3`, and the bot's win/star results agree with a real step-by-step replay.
    4. Sawtooth: per chapter, the mean wins of hard < normal < easy; every level after a hard one is easy-band.
    5. Staircase: the first levels with F, C, B, M, 6 flavours, hard cubes, two goals and 7 flavours are 6, 21, 41, 46, 51, 61, 81 and 91, and all are easy-band.
    6. Intro caps hold.
  - `adventure.test.ts`:
    1. A win on the move that meets the goals, even when that move leaves nothing that fits.
    2. "Out of moves" at 0; "No room left" when stuck with moves left; give up → `gaveUp`.
    3. Bonus moves add to the limit and are subtracted for stars (a table of movesLeft × bonus → stars).
    4. Shuffle: a new F2-forced tray, no move cost, once per level, refused when not armed.
    5. Pop: the largest gloop, no points, combo unchanged, cubes untouched, no goal progress, disabled with no gloop.
    6. Resuming mid-level (JSON round trip and sanitize) gives the same next deal.
    7. No `stageUp` or `rescueOffered` events in Adventure.
  - `levelBot.test.ts`: a golden 12-run result for level 1.
- **Debug:** `?debug=1&demo=cubes` (Classic board drawing only: 6 sugar cubes, 3 hard cubes, slot 0 holds a Dot that clears a row through a hard cube and a sugar cube), `?debug=1&level=21` (starts level 21 directly in a bare Adventure state; the M12.5 HUD isn't there yet, so the normal HUD shows the score).
- **Done when:** `npm run levels -- --write` produces the table and a second run is byte-identical; `npm run levels -- --verify` passes and prints its time; `levels.test.ts` takes under 30 s in the container (report the number); the existing Daily hash, Classic golden game and sim tests pass unchanged; `dist/` contains no `levelBot` or `levelGen` code (grep the build for `levelBot`).

### M12.5 Adventure UI: map, start card, HUD, win and lose panels, rewards
- **Implements:** design §24.4 (unlock and gift, entry, leaving, continue), §24.5 (stars display), §24.7 (rewards and chapter rewards), §24.12 Adventure lines, §24.13 (Home card, runs, weekly), §16.4 pass 3 "Home", "Adventure map", "Level start card" (without the streak, assist and booster rows), "Adventure play", "Level win panel", "Level lose panel"; SG §20.2, §20.3 (items 1–5 and 9), §20.4 (top bar, moves, chips, pause), §20.5, §20.9.
- **Files:**
  - `src/ui/screens/adventureMap.ts` (new), `src/ui/levelCard.ts` (new), `src/ui/levelResultPanel.ts` (new): all in the lazy chunk.
  - `src/app/router.ts`: `ScreenId` gains `'adventure'`; back from the start card returns to the map.
  - `src/render/hudView.ts`: the Adventure score band (moves). `src/render/goalStrip.ts`: the Adventure goal chips.
  - `src/meta/adventureProgress.ts` (new): `recordLevelResult(save, result)` (stars best-of, wins, losses, lossRun, frontier, first-win and new-star rewards, replay and loss rewards, chapter rewards once), `unlockAdventure(save)` (gift).
  - `src/meta/progression.ts`: the Level 2 unlock row. `src/meta/stats.ts`: the Adventure counters. `src/meta/weeklyGoal.ts`: Adventure counted.
  - `src/ui/screens/home.ts`: the Adventure mode card (lazy import on tap).
  - `src/ui/screens/stats.ts`: the §24.13 rows.
  - `src/app/app.ts`: `toAdventure(level)`, `adventure.inProgress` save and resume, panel timing (win 600 ms, loss 450 ms, Space/Enter/R from 0 ms).
  - `src/core/nearMiss.ts`: the Adventure lines. `src/ui/strings.ts`. `howToPlay.ts`: rules 10 and 11 (design §16.5).
- **Tests:**
  - `adventureProgress.test.ts`: the reward table (first win at 1/2/3 stars = 50/60/70 XP and 35/50/65 coins; replay without a new star 10 XP / 5 coins; replay 1 → 3 stars pays 2 new stars; loss 5 XP / 2 coins); the frontier moves only on a first win; the chapter rewards pay once each; the unlock gift is capped at 5.
  - jsdom `adventureMap.test.ts`: 120 nodes and 6 chapter headers from a fixture save; won/next/locked/hard/paused states and aria labels match §16.4; the footer button opens the frontier (or the paused level).
  - `levelCard.test.ts`: the goal text for every goal kind and the singular forms; the hard chip; the tips on levels 6, 21, 41, 46, 51, 61, 81 and 91 only; Enter = Play, Esc = back.
  - `levelResultPanel.test.ts`: the "Next level" focus; the lose panel has no element with a price, coin button or booster (query by role/text); "Try again" restarts within the same frame (the fake clock shows 0 ms between click and the new state).
  - `nearMiss.test.ts`: every Adventure unit in singular and plural; "Nothing fit with {m} moves left." only for stuck losses.
  - `strings.test.ts`: every pass 3 string from §16.4 exists, and there are no hype words.
  - `router` test: `'adventure'` push and back.
  - Build test (`check-size` output): a separate chunk contains `levels.data`, and the entry chunk grows ≤ 10 KB gz versus M12.4.
- **Debug:** `?debug=1&demo=adventure-map` (frontier 23, mixed stars on 1–22, a paused attempt on 23, chapter 1 rewards paid), `?debug=1&demo=adventure-map-end` (all 360 stars), `?debug=1&demo=level-card&level=21` (with the tip), `?debug=1&demo=adventure-play&level=87` (two-goal HUD mid-level, 3 moves left in danger colour), `?debug=1&demo=adventure-win&stars=3` (also `stars=1` and `stars=2`; the stars animation replays on every load), `?debug=1&demo=adventure-lose` (out of moves at 26/30 grape cells), `?debug=1&demo=adventure-lose&reason=stuck`.
- **Done when:** the tests pass; a real first session can unlock Adventure at Level 2, win level 1, see stars and rewards, and reach level 2 from "Next level" in two taps; leaving mid-level and coming back shows "Continue"; Space/Enter/R on a loss restarts at once; the game-over and Daily flows are unchanged.

### M12.6 Win streak, assist, boosters, achievements
- **Implements:** design §24.8, §24.9, §24.10 (whole), §24.11 #42–#47, §16.4 pass 3 start-card rows (streak, assist, boosters) and "Bought" toast; SG §20.3 items 6–8, §20.4 booster bar, Shuffle and Pop, §20.9 booster rows.
- **Files:**
  - `src/meta/boosters.ts` (new): `BOOSTERS` (id, price, cap), `buyBooster(save, id)`, `armBoosters(save, selection, streak)` → `{ save, bonusMoves, armed, freeShuffle }`, and `returnUnused(save, state)`.
  - `src/meta/adventureProgress.ts`: `winStreak` / `bestWinStreak` (frontier only; replays never change it; a frontier loss or give-up resets it; a discarded pause doesn't), `lossRun` and the assist flag.
  - `src/ui/levelCard.ts`: the streak, assist and booster rows, and buying.
  - `src/ui/boosterBar.ts` (new): DOM buttons positioned from the layout; keys 4 and 5 in `src/input/keyboard.ts`.
  - `src/ui/levelResultPanel.ts`: "Try again with 5 extra moves"; the streak line on win and lose.
  - `src/meta/achievements.ts`: #42–#47 (#43–#47 are counters), category `goals`; totals "/ 49" everywhere (`strings.ts`, the Achievements screen).
  - `src/ui/screens/stats.ts`: "Best win streak", "Missions done", "Targets reached".
- **Tests:**
  - `boosters.test.ts`: prices 150/100/200; buying with too few coins is refused with the save unchanged; the cap of 5; `+3 Moves` is used up at start and adds 3 `bonusMoves`; an unused Shuffle or Pop comes back after a win, a loss, a give-up and a discard; a used one doesn't; the free Shuffle at streak ≥ 3 doesn't touch stock, and a level still allows only one Shuffle; coins never go negative.
  - `adventureProgress.test.ts`: the streak table (0/1/2/3+ → 0/+1/+2/+2 and a free Shuffle); a replay win or loss leaves the streak alone; a frontier loss resets it; `bestWinStreak` is kept; `lossRun` reaches 3 → assist offered, resets on a win; assist moves are excluded from stars.
  - `achievements.test.ts`: each of #42–#47 fires from a synthetic save and never twice; counter progress "7 / 20" etc.
  - jsdom: the start card shows "Need 40 more coins" when short and "Max 5" at the cap; the lose panel still has no booster or price (the M12.5 test, extended); the booster bar renders only armed boosters and a press fires the action at once.
- **Debug:** `?debug=1&demo=level-card&level=24&streak=3&coins=120&boosters=1,0,5` (free Shuffle, one tile to buy that is short of coins, one at the cap), `?debug=1&demo=level-card&level=25&losses=3` (assist toggle), `?debug=1&demo=adventure-play&level=24&armed=shuffle,pop`, `?debug=1&demo=adventure-lose&losses=3` (assist button).
- **Done when:** the tests pass; every level stays winnable without boosters (M12.4's `levels.test.ts` still passes untouched); buying is one tap with instant feedback; the booster bar never interrupts a drag unless it is tapped.

### M12.7 QA, balance check, polish
- **Implements:** design §24.15 (session and ethics checks), SG §20.10, everything left over from §24 and SG §20.
- **Files:**
  - `docs/qa-checklist.md`: a "Goals and Adventure" section with checkboxes. Items: each debug demo above renders as specified; no input delay during target crossings, goal done, boosters and panels (drag during the effects); Space/Enter/R restart on a loss; the map scrolls to the frontier; Android back from the start card, the HUD and the panels; reduced motion for every SG §20.9 row; the ethics list (no price on any lose panel, nothing expires, no random rewards, levels winnable without boosters).
  - `docs/balance-log.md`: the M12.4 table plus a short economy check: coins per day for a "5 Classic runs + 3 missions + 5 levels" day (computed from the formulas), and how many days the booster cap and the shop take.
  - Any missing tests. A `?debug=1` overlay line: `adv L{n} s{seed} K{k} wins {w}/12 · goals {p}/{t}` while in Adventure.
- **Done when:**
  - `npm run check` passes.
  - `npm run levels -- --verify` passes.
  - The JS total is ≤ 115 KB gz (report the per-file sizes).
  - The string audit finds no player-facing text outside `strings.ts`, and `check-no-hex` is clean.
  - The final message lists the screenshot set for the director: `demo=target`, `target-hit`, `mini-done`, `missions`, `missions-done`, `cubes`, `adventure-map`, `adventure-map-end`, `level-card&level=21`, `level-card&level=24&streak=3…`, `adventure-play&level=87`, `adventure-win&stars=1|2|3`, `adventure-lose`, `adventure-lose&losses=3`, each at 412 × 915 and 1280 × 800.
  - The director plays chapters 1–2 on a phone and records in `docs/balance-log.md` whether the hard levels feel short and fair (RT16). Any level that a human finds clearly unfair is fixed by a parameter change and regeneration, never by hand.
