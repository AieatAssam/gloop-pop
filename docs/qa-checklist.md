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
