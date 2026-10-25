# AGENTS.md: instructions for coding agents

Gloop Pop is a static, front-end-only browser game (Vite + TypeScript strict + Canvas2D, deployed to GitHub Pages at `/gloop-pop/`). Nobody is available to answer questions: decide, document the decision in a `// spec-note:` comment, and report it in your final message.

## Read first, in this order
1. `docs/milestones.md`: find your task (e.g. M2.3) and its "done when" criteria.
2. `docs/design.md`: rules, numbers, modes, and **all player-facing text** (§16).
3. `docs/art/style-guide.md`: the look, juice, sound and layout. Visual tasks cite SG sections.
4. `docs/architecture.md`: where code goes, data flow, save schema, tests.
5. `docs/research/virality.md`: background only (why the design is the way it is).

## Do not edit the design docs
Do not edit `docs/design.md` or `docs/art/style-guide.md` except to fix typos. If you think a rule or number should change, implement the spec as written and propose the change in your final message. You may update `docs/architecture.md` only to record a file you added, and you may create `docs/balance-log.md` and `docs/qa-checklist.md` when your task says so.

## Architecture rules
- `src/core/` is pure and deterministic: no DOM, no `Date`, no `Math.random`, no timers, no imports from other `src/` folders except `src/core`. All randomness comes from the seeded `sfc32` RNG in `src/core/rng.ts`.
- `src/meta/` is pure logic on the save object (no DOM). Persistence goes through `src/platform/storage.ts`.
- The core takes actions and returns `{ state, events }`. Render, audio, UI and meta react to events. Never block input for an animation.
- Rendering is Canvas2D. Cache static things (background, board layer, gloop bodies) to offscreen canvases. No `shadowBlur`/`filter` in the per-frame path. Pool particles and tweens. DPR capped at 2.
- No new runtime dependencies. Only `@fontsource/baloo-2` and `@fontsource/nunito` are allowed at runtime.
- No `any`, no default exports. Tests are colocated (`foo.test.ts`).

## The palette rule
Hex colours come **only** from `src/render/palette.ts`, which is generated from `docs/art/palette.json` by `node tools/gen-palette.mjs`. Never write a hex value anywhere else in `src/`, CSS or `index.html` (lint and `tools/check-no-hex.mjs` enforce this). CSS uses `var(--…)` set from `PALETTE` at boot. If you need a colour that isn't there, use the closest existing role and propose a new one in your final message.

## Text rules
- Every player-facing string lives in `src/ui/strings.ts` and must match `docs/design.md` §15–16 word for word.
- Plain, concrete words. One short line per instruction. No hype words ("epic", "insane", "awesome", "legendary", "ultimate"), no poetic or cryptic phrasing, no text walls.
- Numbers use `Intl.NumberFormat('en-US')`.

## Shell rules
- **Never run commands in the background** (no `&`, no `run_in_background`, no watchers, no `npm run dev`/`vite` servers, no `vitest` watch mode). Every command runs in the foreground and is wrapped in `timeout`, e.g. `timeout 300 npm run check`.
- Do not open browsers or run Playwright unless your task explicitly says so.
- Do not commit or push unless your task says so.

## Before you finish
Run:

```
timeout 300 npm run check
```

It must pass (palette up to date, typecheck, lint, no-hex check, tests, build, bundle size < 150 KB gz). Then write a short final message: what you did, which "done when" items you verified and how, any `spec-note` decisions, and any proposed spec changes.
