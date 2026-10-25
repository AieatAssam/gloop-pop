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
