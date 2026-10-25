# M9.4 final QA checklist

Reviewed on 25 Oct 2026. Automated checks are run with `npm run check`; source and asset checks below were reviewed without opening a browser, as required by the task instructions.

## Design requirements §21, rows R1–R22

| Requirement | Status | Evidence |
|---|---|---|
| R1 One-sentence pitch | [x] | `docs/design.md` §1 contains the approved one-sentence pitch. |
| R2 Under 5 s to first input | [x] | `src/main.ts` boots the app directly; `src/app/app.ts` starts the live board without a title gate. |
| R3 Teach by doing | [x] | `src/core/tutorial.ts`, `src/ui/tutorialBubble.ts`, and `src/ui/strings.ts`; tutorial boards and reducer scores are covered by `src/core/game.test.ts`. |
| R4 Under 1 s game over → play | [x] | `src/app/app.ts` waits 450 ms before the game-over panel; `src/input/keyboard.ts` handles immediate restart input. |
| R5 Honest near-miss | [x] | `src/core/nearMiss.ts` derives messages from the final board; `src/core/nearMiss.test.ts` covers computed cases. Ghost rendering is in `src/render/boardView.ts`. |
| R6 Reward beat every 5–20 s | [x] | Clears, combo, pop, firsts and toast feedback are event-driven in `src/render/director.ts`, `src/meta/firsts.ts` and `src/ui/toasts.ts`. |
| R7 Low floor, high ceiling | [x] | Line and pop scoring are covered by `src/core/scoring.test.ts`; combo cap is covered by `src/core/combo.test.ts`. |
| R8 Familiar frame | [x] | Row/column placement and clear behavior are implemented in `src/core/board.ts` and `src/core/resolve.ts`; see `src/core/resolve.test.ts`. |
| R9 Daily, streak, freeze | [x] | `src/core/daily.test.ts`, `src/meta/streak.test.ts` and `src/meta/dailyRecord.test.ts` cover shared UTC seeds and streak records. |
| R10 Spoiler-free share | [x] | `src/core/shareText.test.ts` pins the design example; `src/platform/share.ts` implements share and copy fallback. |
| R11 Clip-worthy | [x] | `src/render/director.ts` draws clears, pops and score events; `src/render/fx/hitStop.test.ts` covers hit-stop timing. |
| R12 Thumbnail-readable | [x] | Flavour bodies and toppers use `src/render/gloopRenderer.ts`; regenerated `public/og.png` includes all seven flavours. The 64 px OG preview was visually inspected. Mid-game screenshot inspection needs a browser and is left to the human reviewer. |
| R13 Characterful pieces | [x] | Expressions and face placement are covered by `src/render/face.test.ts`; showcase drawing is in `src/render/boardView.ts`. |
| R14 Juice everywhere | [x] | Placement squash, clears, pops and particles are implemented in `src/render/boardView.ts` and `src/render/director.ts`; motion utilities have colocated tests. |
| R15 Layered progression | [x] | Progression, catalogue and achievements have colocated tests under `src/meta/`. |
| R16 Short sessions | [x] | Classic and Daily 300-run results are in `docs/balance-log.md`; one-tap restart is wired in `src/app/app.ts`. |
| R17 Long tail | [x] | Levels, Stars, Expert, cosmetics and achievements are implemented in `src/meta/`; progression and achievement tests pass in `npm run check`. |
| R18 Fair, player-favourable | [x] | Generator F1–F4 and rescue cases are covered by `src/core/generator.test.ts` and `src/core/game.test.ts`; near-miss messages derive from real state. |
| R19 No-install web | [x] | Vite builds a static app; `vite.config.ts` generates a precache list and `src/sw/sw.template.js` provides offline navigation fallback. An offline browser load was not exercised. |
| R20 Return reasons | [x] | Daily, streak and weekly logic are covered by `src/core/daily.test.ts`, `src/meta/streak.test.ts` and `src/meta/weeklyGoal.test.ts`. |
| R21 Sound respectful | [x] | `src/audio/engine.ts` starts audio on user input; mute controls and settings are wired in `src/app/app.ts`; SFX and synth tests pass. |
| R22 Performance | [x] | DPR and rendering paths are in `src/render/canvas.ts` and `src/render/boardView.ts`; `npm run check` includes the bundle-size gate. A frame-time overlay review needs a browser. |

## String audit

- [x] Weekly goal descriptions now live in `src/ui/strings.ts`; all eight IDs are pinned by `src/ui/strings.test.ts`.
- [x] How to Play rules, controls and scoring match design §16.5; `src/ui/strings.test.ts` compares the complete text.
- [x] Achievement names and descriptions are held in `ACHIEVEMENT_COPY`; the changed pop descriptions say “popped cells”.
- [x] Player-facing UI text is sourced from `src/ui/strings.ts`; direct-rendered text is assembled from `S` entries and formatted numbers.
- [x] Hype-word check remains in `src/ui/strings.test.ts`.
- [ ] Design count discrepancy for achievements remains noted: §15 lists 40 rows and §18 says “17 / 40”, while §23.5 adds achievement #41 “Rivals”; code follows §23.5 and shows `/ 41`.

## Style guide §18 and §19

- [x] No flat-square or placeholder gloop pieces; art uses the cached jelly body renderer and face layers.
- [x] No hex literals were added outside `src/render/palette.ts`; `npm run check` runs the no-hex checker.
- [x] No per-frame `shadowBlur` or `filter`; the existing body shadow is drawn into the cached sprite.
- [x] Input remains available during animation; restart appears after 450 ms.
- [x] Shake is applied to the canvas layer; panel DOM is not shaken.
- [x] Canvas art does not use platform emoji; emoji remain in share text and text UI.
- [x] Font use remains Baloo 2 and Nunito.
- [x] No gameplay countdown pressure or fabricated near-miss; the ghost is drawn from computed near-miss facts.
- [x] Audio starts on first user input; particles use the existing bounded pool.
- [x] Banned hype words remain covered by string tests.
- [x] Generated OG image was regenerated and viewed; a mid-game screenshot at 64 px and a no-console-errors browser pass remain for a human reviewer because browser use was explicitly prohibited for this task.

## First launch, persistence, UTC and delivery

- [x] Fresh first-launch path enters the scripted tutorial: `src/main.ts`, `src/app/app.ts`, and `src/core/tutorial.ts`.
- [x] JSON-round-tripped resume is covered for Classic, Expert, Zen and Daily by `src/app/session.test.ts`.
- [x] UTC midnight conversion is covered near the date boundary and across UTC offsets by `src/core/daily.test.ts`.
- [x] Offline fallback and precache behavior are present in the service worker template; a disconnected browser run was not exercised.
- [x] Bundle size is checked by the required `npm run check` command.
- [ ] No-console-errors browser pass not exercised; manual reviewer check remains.

## Audio (M11.6)

Automated audio tests and the production build are checked by `npm run check`. The following listening and loudness checks require the director's phone speaker and headphones; agents cannot listen.

- [ ] needs-ear-check — SG §13.13.1: bed loop seam and pad timing.
- [ ] needs-ear-check — SG §13.13.2: lofi character fits the candy look and remains suitable after three loops.
- [ ] needs-ear-check — SG §13.13.3: place mix reads as jelly landing, not a mouth noise.
- [ ] needs-ear-check — SG §13.13.4: pop1–6 read as gloops; variant and pitch rise feel right.
- [ ] needs-ear-check — SG §13.13.5: tink and synth bar blend; folded register changes sound right.
- [ ] needs-ear-check — SG §13.13.6: retuned Kenney jingle and chimes are in tune with the bed.
- [ ] needs-ear-check — SG §13.13.7: all gains, duck depth, bed bus level and integrated loudness target.
- [ ] needs-ear-check — SG §13.13.8: pad voicing and twinkle density.
- [ ] needs-ear-check — SG §13.13.9: game-over slow-down feels settled rather than sad.
- [ ] needs-ear-check — SG §13.13.10: coin, deal and UI sounds remain clear at low phone volume.

## Goals and Adventure (M12.7)

Automated checks are run with `npm run check` and `npm run levels -- --verify`. Items requiring the browser, device input or human play remain **lead to verify**; agents do not open browsers or play chapters.

- [x] Booster prices are 150 / 100 / 200 coins; stock caps at 5; unaffordable purchase leaves the save unchanged; start selection consumes +3 Moves and adds its bonus; unused Shuffle and Pop return to stock; free Shuffle does not use stock. Evidence: `src/meta/boosters.test.ts`.
- [x] Frontier win streak grants 0 / +1 / +2 / +2 moves and a free Shuffle at 3+, frontier loss resets it, replays do not change it, best streak stays, loss run offers assist at 3 and resets on win. Evidence: `src/meta/adventureProgress.test.ts`.
- [x] Achievements #42–#49 have synthetic trigger coverage and grants do not repeat. Evidence: `src/meta/achievements.test.ts`.
- [x] Lose panels contain no price, booster, coin button or buy action; assist appears only after three losses. Evidence: `src/ui/levelResultPanel.test.ts` (lead to verify visually).
- [x] Debug fixtures accept streak, assist losses, coin and booster inventory, armed Shuffle / Pop, and loss count parameters; the Adventure debug overlay reports level, seed, K, wins and goal progress.
- [x] New visible labels and announcements use `src/ui/strings.ts`; icons and debug-only measurements are the only new literal UI text outside it. `check-no-hex` passes.
- [ ] lead to verify — each M12.6 debug demo renders as specified: `?debug=1&demo=level-card&level=24&streak=3&coins=120&boosters=1,0,5`; `?debug=1&demo=level-card&level=25&losses=3`; `?debug=1&demo=adventure-play&level=24&armed=shuffle,pop`; `?debug=1&demo=adventure-lose&losses=3`.
- [ ] lead to verify — no input delay during target crossings, goal done, Shuffle / Pop effects or panels; drag during each effect and confirm input remains available. Shuffle cancels a drag only on its tap.
- [ ] lead to verify — Space, Enter and R restart a loss; the map scrolls to the frontier; Android/browser back from the start card, HUD, win panel and lose panel returns to the previous screen.
- [ ] lead to verify — reduced motion across all SG §20.9 rows: target, mini goal, Adventure goal, moves countdown, cube crack/removal, Shuffle/Pop, win stars, lose panel, mission claim, map unlock, mission toast.
- [ ] lead to verify — ethics: no lose-panel prices, nothing expires, no random rewards, and all 120 levels remain winnable without boosters (automated level validation also checked by `npm run levels -- --verify`).
- [ ] lead to verify — play Chapters 1–2 on a phone and record whether hard levels feel short and fair in `docs/balance-log.md`. Entry URLs: `/gloop-pop/?debug=1&demo=level-card&level=1` (play through Level 20, then Chapter 2) and `/gloop-pop/?debug=1&demo=level-card&level=21` (start Chapter 2 directly). Expected: hard levels have 14–18 moves, are beatable, and the following level is easy; record any clearly unfair level by number before adjusting parameters and regenerating.
- [ ] lead to verify — screenshot each URL below at 412 × 915 and 1280 × 800; confirm gloop and cube art is rounded, glossy and non-placeholder, the start card fits/scrolls with Play pinned, and the lose panel has no offers.

Screenshot URLs and expected states (each at **412 × 915** and **1280 × 800**, all **lead to verify**):

| Exact debug URL | Expected state |
|---|---|
| `/gloop-pop/?debug=1&demo=target` | Classic target and mini-goal pills show ordinary progress. |
| `/gloop-pop/?debug=1&demo=target-hit` | Target pill shows the just-crossed target and coin reward. |
| `/gloop-pop/?debug=1&demo=mini-done` | Mini-goal pill shows completed state and reward. |
| `/gloop-pop/?debug=1&demo=missions` | Home card has mixed mission progress and one claimed row. |
| `/gloop-pop/?debug=1&demo=missions-done` | All mission rows and set reward are complete. |
| `/gloop-pop/?debug=1&demo=cubes` | Showcase board shows sugar and cracked hard cubes. |
| `/gloop-pop/?debug=1&demo=adventure-map` | Map around frontier 23, completed Chapter 1 and a paused Chapter 2 level. |
| `/gloop-pop/?debug=1&demo=adventure-map-end` | All 120 nodes and all chapter rewards are complete. |
| `/gloop-pop/?debug=1&demo=level-card&level=21` | Chapter 2 Level 21 card shows the cube goal and its tip. |
| `/gloop-pop/?debug=1&demo=level-card&level=24&streak=3&coins=120&boosters=1,0,5` | Free Shuffle is selected; +3 Moves shows a shortfall; Pop shows Max 5. The debug tuple is Shuffle, +3 Moves, Pop. |
| `/gloop-pop/?debug=1&demo=level-card&level=25&losses=3` | Assist toggle and its star caption appear. |
| `/gloop-pop/?debug=1&demo=adventure-play&level=87` | Adventure HUD shows Level 87, moves, goals and debug line. |
| `/gloop-pop/?debug=1&demo=adventure-win&stars=1` | Level win panel shows one earned star. |
| `/gloop-pop/?debug=1&demo=adventure-win&stars=2` | Level win panel shows two earned stars. |
| `/gloop-pop/?debug=1&demo=adventure-win&stars=3` | Level win panel shows three earned stars and confetti. |
| `/gloop-pop/?debug=1&demo=adventure-lose` | Lose panel shows unmet-goal facts and no offers. |
| `/gloop-pop/?debug=1&demo=adventure-lose&losses=3` | Lose panel shows the 5-extra-moves retry and no offers to buy. |


### M12 review fixes (automated)

- [x] Quick Adventure results record before restart/navigation; regression in `src/app/adventureResult.test.ts`.
- [x] Combo 4 counts the highest combo across moves without combo events; regression in `src/core/goals.test.ts`.
- [x] Replays receive no frontier streak moves or free Shuffle; `src/meta/boosters.test.ts`.
- [x] Adventure win events contain no Classic `stuck` or `gameOver`; `src/core/adventure.test.ts`.
- [x] Result aria text uses the same title as the panel; `src/app/adventureResult.test.ts`.
- [x] Adventure lose lines follow §24.12 priority; `src/core/nearMiss.test.ts`.
- [x] Targets reached and per-level best score are recorded; `src/meta/stats.test.ts` and `src/meta/adventureProgress.test.ts`.
- [x] Map chapter slots, node/path positions and scroll target share `yFor`; `src/ui/screens/adventureMap.test.ts`.
- [x] Mission Claim sizing and result toast lane rules are pinned in `src/ui/styles.test.ts`.
- [x] Singular/plural Adventure strings and extra-move copy match §16.4/§24.12; `src/ui/strings.test.ts`.
- [x] Mission sanitize preserves A/B/C positions when a middle entry is invalid; `src/meta/migrate.test.ts`.
- [x] Production build keeps Adventure UI and level data in one lazy chunk, excludes `levelBot`, and stays within the 115 KB target.

Pixel 7 layout and chapter 1–2 human play checks remain listed above for the lead reviewer.

## M13 map layout and Gold pop effects

- [ ] `/gloop-pop/?debug=1&demo=adventure-map` at 412 × 915, 360 × 740 and 1280 × 800: frontier 23; Chapter 1 card sits between Levels 20 and 21; footer bar covers nothing.
- [ ] `/gloop-pop/?debug=1&demo=adventure-map&frontier=41` at 412 × 915 and 360 × 740: Chapter 2 card sits just under the frontier without overlap.
- [ ] `/gloop-pop/?debug=1&demo=adventure-map-end` at 360 × 740: footer bar holds the all-won line.
- [ ] `/gloop-pop/?debug=1&demo=level-card&level=25` at 412 × 915 and 360 × 740; `/gloop-pop/?debug=1&demo=level-card&level=50` at 412 × 915: level card goals and hard-level layouts.
- [ ] `/gloop-pop/?debug=1&save=veteran` at 412 × 915, then Collection → Pop effects: all three Gold rows and prices.
