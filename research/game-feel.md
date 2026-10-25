# Game feel research: making Gloop Pop feel tactile and physical

Researched 25 Oct 2026 for the "Tactile feel v2" pass (SG §9.13, milestone M10). Every number below comes from the linked source. Where a source is a secondary write-up (a summary of a talk, a decompile, a fan wiki) that is said next to the claim. Nothing here is invented; where no source gave a number, the spec in `docs/art/style-guide.md` §9.13 marks its own value as a tuning choice.

## Sources read in full (23)

| # | Source | Type |
|---|---|---|
| S1 | Capcom Shadaloo C.R.I., "SF Seminar Hour 11: The Basics of Attacking: Damage Part II" https://game.capcom.com/cfn/sfv/column/131545?lang=en | Developer column (Capcom) |
| S2 | SuperCombo Wiki, "Street Fighter 6/Game Data" https://wiki.supercombo.gg/w/Street_Fighter_6/Game_Data | Community wiki |
| S3 | Celia Wagar, "Hitstop/Hitfreeze/Hitlag/Hitpause/Hitshit" https://critpoints.net/2017/05/17/hitstophitfreezehitlaghitpausehitshit/ | Designer essay |
| S4 | SmashWiki, "Hitlag" https://www.ssbwiki.com/Hitlag | Community wiki (formulas) |
| S5 | Celeste Wiki, "Freeze frames" https://celeste.ink/wiki/Freeze_frames | Community wiki (measured) |
| S6 | Maddy Thorson, Celeste game-feel thread https://threadreaderapp.com/thread/1238338574220546049.html | Developer, first-hand |
| S7 | Game Design Lab, "Hollow Knight: Game Feel & Juice" https://teemo.dev/game-design/hollow-knight/systems/game-feel-and-juice/ | Analysis of a community decompile (secondary) |
| S8 | Jan Willem Nijman, "The Art of Screenshake" (INDIGO 2013) https://www.youtube.com/watch?v=AJdEqssNZ-U, 30-trick list as transcribed at https://artificials.ch/juice-up-your-game/ and https://rpgplayground.com/research-making-a-juicy-game/ | Talk (via transcriptions) |
| S9 | Squirrel Eiserloh, "Math for Game Programmers: Juicing Your Cameras With Math", GDC 2016, slides http://www.mathforgameprogrammers.com/gdc2016/GDC2016_Eiserloh_Squirrel_JuicingYourCameras.pdf (read via web.archive.org) | GDC slides, first-hand |
| S10 | Martin Jonasson & Petri Purho, "Juice it or lose it" https://www.youtube.com/watch?v=Fy0aCDmgnxg, write-up https://devblog.heisarzola.com/gdcr-juice-it-or-lose-it/ | Talk + write-up |
| S11 | Steve Swink, *Game Feel*, chapter 1 http://mycours.es/gamedesign2014/files/2014/10/Game-Feel-Steve-Swink-chapter-1.pdf | Book chapter |
| S12 | Swink's response-time thresholds as quoted at https://gamedev.stackexchange.com/questions/203106/ | Book quote (secondary) |
| S13 | Wikipedia, "Twelve basic principles of animation" https://en.wikipedia.org/wiki/Twelve_basic_principles_of_animation | Reference (Thomas & Johnston) |
| S14 | Wikipedia, "Smear frame" https://en.wikipedia.org/wiki/Smear_frame | Reference |
| S15 | Allen Chou, "Game Math: Precise Control over Numeric Springing" https://allenchou.net/2015/04/game-math-precise-control-over-numeric-springing/ | Developer article with code |
| S16 | mixandjam, Balatro-feel study, `CardVisual.cs` https://raw.githubusercontent.com/mixandjam/balatro-feel/main/Assets/Scripts/CardVisual.cs (and SimVX port notes https://simvx.com/docs/examples/ports_balatro_feel.html) | Recreation of Balatro's card feel (not LocalThunk's own code) |
| S17 | Jiesang Song, "Improving the Combat 'Impact' of Action Games", Gamasutra 2005 https://www.gamedeveloper.com/audio/improving-the-combat-impact-of-action-games | Developer article |
| S18 | Android Developers, "Haptics design principles" https://developer.android.com/develop/ui/views/haptics/haptics-principles | Platform guideline |
| S19 | MDN, "Vibration API" https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API and caniuse https://caniuse.com/vibration | Web platform reference |
| S20 | tijnjh/ios-haptics README https://raw.githubusercontent.com/tijnjh/ios-haptics/main/README.md | Library docs (iOS Safari switch haptic) |
| S21 | Dashpop, "Block Blast: that fits. But should it go there?" https://dashpop.com/learn/deep-dives/block-blast | Design analysis |
| S22 | "Building a Grid-Based Block Puzzle Game in Unity" https://unitysourcecode.hashnode.dev/building-a-grid-based-block-puzzle-game-in-unity-the-technical-decisions-that-actually-matter | Developer article |
| S23 | Unreal Engine, "How Tetris Effect became a modern work of art" https://www.unrealengine.com/en-US/developer-interviews/how-tetris-effect-became-a-modern-work-of-art | Developer interview |

Also read but weighted low: sakugabooru "impact frames" wiki (https://www.sakugabooru.com/wiki/show?title=impact_frames, definition only) and a Godot forum checklist that says it is AI-assisted (https://forum.godotengine.org/t/game-feel-checklist-for-godot-4-hit-stop-trauma-shake-coyote-time-and-more/145340); no numbers are taken from the latter.

Not found: no first-hand source from King (Candy Crush), Dream Games (Royal Match), Hungry Studio (Block Blast), Aladdin X (Suika) or LocalThunk publishes animation timings. Claims about those games below are limited to what S16, S21 and S22 say.

## 1. Hitstop / freeze frames

| Finding | Numbers | Source | Applies to Gloop Pop |
|---|---|---|---|
| Hitstop freezes both sides at the point of contact. It sells that a collision happened, gives the eye frames to register it, and implies force. | n/a | S3, S1 | Yes: freeze the *board* at the moment cells start popping. |
| It is "for the visual performance of the game", systematic per game, scaled by strength. Example tiering light/medium/heavy = 8F/12F/16F (133/200/267 ms at 60 fps). Multi-hit moves get *shorter* hitstop so they don't feel too heavy. | 8/12/16 frames | S1 | Tier hitstop by event size. Cascades (combo ripple of many pops) must not each add a freeze. |
| Smash Ultimate: hitlag = floor((damage × 0.65 + 6) × multipliers), capped at 30 frames. A 15% hit = 15 frames; Melee gave 8 for the same hit. Hitlag rises with damage. | min 6F, cap 30F (500 ms) | S4 | Formula shape to copy: a floor plus a linear term in "damage" (= cells removed), with a hard cap. |
| In Smash, hitlag "only affects the object that deals the damage; all other game elements (including … particle effects the attack generated) are uninterrupted." The victim vibrates during the freeze. | n/a | S4, S3 | Freeze only the clearing cells and the placed piece. Keep particles, background, HUD and the drag running. Jiggle the frozen cells (±1–2 px) instead of holding them dead still. |
| Celeste: dash/refill 3 frames (50 ms); bumper/pufferfish 6 frames (100 ms); seeker bounce 9 frames (150 ms). | 50/100/150 ms | S5 | Small = 50 ms, medium = 100 ms, top = 150 ms is a proven ladder for a game built on responsiveness. |
| Hollow Knight nail hit (decompile): 110 ms total = 40 ms ramp down, 30 ms at time scale 0, 40 ms ramp up. Other presets snap in 10 ms and ease out over 100 ms. Player-damage freeze targets 0.0001, not 0, so coroutines keep running. | 40/30/40 ms; 10 ms in, 100 ms out | S7 (secondary) | Ramp the time scale out rather than snapping back to 1. Never use exactly 0 for anything that must restore itself. |
| Nijman's "sleep": pause on a deadly hit for about 20 ms; "you can hardly see that but it puts more meaning in that action". | ~20 ms | S8 (transcription) | Even a 1-line clear can get a 1–2 frame sleep. |
| SF2's cancel window exists because of hitstop; input during hitstop is honoured, not dropped. | ~10 frames | S3 | Input must keep working during hitstop. A pick-up or placement during a freeze must happen at once. |
| Freeze on the "best looking" frame of the action. | n/a | S17 | Freeze when the cleared cells are at their swollen peak (just before they burst), not before the swell starts. |
| Swink: response under 100 ms feels instant (50 ms "instantaneous"), 200 ms feels sluggish, and the delay must be consistent. | 50/100/200 ms | S12 | Total hitstop on the biggest event must stay below ~150 ms, and it must never delay input. |

## 2. Screen shake and camera kick

| Finding | Numbers | Source | Applies |
|---|---|---|---|
| Keep a "trauma" value in [0,1]. Events add to it (+0.2 or +0.5). It decays linearly. Shake = trauma² or trauma³, so trauma 0.30/0.60/0.90 gives 3%/22%/73% shake: "escalations perceptible". | +0.2/+0.5, t² or t³ | S9 | Replace fixed per-event shakes with trauma that stacks across a combo. |
| 2D: translational plus rotational shake ("Awesome"); rotational alone is "kinda lame". | n/a | S9 | Add a small roll (≤1–2°) to the canvas shake. |
| Use smoothed (Perlin) noise, not per-frame random: it feels better, works with pause and slow-mo, has adjustable frequency. | n/a | S9 | Replace the 33 ms random-direction lerp with 1D noise per axis. |
| Asymptotic smoothing `x += (target − x) × k`: 0.01 slow, 0.1 "reasonably fast", 0.5 "incredibly fast" at 60 fps. Multiply k by time scale so it respects slow-mo. | k = 0.01–0.5 | S9 | Use for drag follow and camera return. Make it frame-rate-independent (1 − (1−k)^(dt·60)). |
| Camera kick: shift the camera in the direction of the action for a couple of frames (Soul Calibur 2, Ninja Gaiden). | 2 frames | S17, S8 (#27) | A directional kick: the board nudges *away* from the placement (or down, like a slam) for 2–3 frames, then springs back. |
| Hollow Knight exposes a camera-shake toggle (and Celeste's v1.4 changelog, seen only in search results, adds a 50% shake option). | n/a | S7 | Keep reduced-motion = no shake. |

## 3. Squash, stretch, anticipation, follow-through, smears

| Finding | Numbers | Source | Applies |
|---|---|---|---|
| Squash and stretch gives weight and flexibility; the key rule is the volume does not change: stretch one axis, shrink the other. | n/a | S13 | Every scale squash in Gloop Pop must keep scaleX × scaleY ≈ 1. |
| Anticipation prepares the action (bend knees before a jump). | n/a | S13 | Cells swell (and squash down) before they burst; the piece dips before it lands. |
| Follow-through and overlapping action: loose parts keep moving after the body stops, then settle with damped oscillation. "Drag": parts take a few frames to catch up. | n/a | S13 | Gloop blobs lag behind the dragged piece's centre and wobble after landing. |
| Slow in / slow out; arcs. | n/a | S13 | Returns to tray travel on an arc (already in SG §8.3). |
| Squash-shader on De Blob changed the feel "entirely": from "a ball made of stone" to "a ball of paint", with no physics changes. | n/a | S11 | The cheapest, biggest win for a jelly game: continuous velocity-driven squash on the held piece. |
| Juice it or lose it: things stretch with velocity, get bigger and wobble on every hit, flash white on hit, all blocks jiggle a little whenever anything hits, walls bounce "as gum". | n/a | S10 | Neighbour jiggle on every placement; brief white flash on the placed piece; velocity stretch on the held piece. |
| Smear frames: 1–2 frame elongated in-betweens (or multiples) simulate motion blur on fast moves. | 1–2 frames | S14 | Draw 1–2 frames of stretched/ghosted cells on the snap-to-grid move and on fast flicks. |

## 4. Springs and easing

| Finding | Numbers | Source | Applies |
|---|---|---|---|
| Parameterise springs by frequency (Hz) and decay instead of raw stiffness. ω = 2π·f; ζ = ln(p)/(−ω·t) for "reduce oscillation to p over t". Example: 2 Hz, 90% reduction in 0.5 s → ζ ≈ 0.367. Use the implicit Euler update (code given) for stability. | 2 Hz / ζ 0.367 example | S15 | One shared `spring(x, v, target, ζ, ω, dt)` helper for drag follow, tilt, wobble and settle. |
| Balatro-feel recreation: follow lerp speed 30/s; rotation from movement delta × 20, clamped ±60°; scale 1.15 on hover and 1.25 on select/drag over 0.15 s OutBack; shadow pushed 20 px further away on press; punch rotations 5° with vibrato. | 30/s, 1.15/1.25, 150 ms OutBack | S16 (recreation, not the shipped game) | Pickup: scale overshoot with OutBack in ~150 ms, shadow drops away on lift, tilt driven by velocity with smoothing. |

## 5. Flash and impact frames

| Finding | Numbers | Source | Applies |
|---|---|---|---|
| Hollow Knight hit flash: full white, 52 ms total, together with the 110 ms freeze. | 52 ms | S7 | Clearing cells flash white for ~3 frames at the start of the freeze. |
| Impact frames (anime "shock frames") are special frames shown for a split second to make an impact pronounced. Ninja Gaiden flashes the whole screen white on some kicks. | 1 frame | sakugabooru, S17 | Mega Pop / All Clear: one-frame full-board tinted flash (not pure white, see accessibility). |
| Nijman: muzzle flash = "make the first frame a circle"; hit = make the enemy flat white for a fraction of a second. | 1 frame | S8 | First frame of a pop draws a solid bright disc before particles. |

## 6. Time dilation / slow motion

| Finding | Numbers | Source | Applies |
|---|---|---|---|
| Hollow Knight type-2 preset: 250 ms ramp in, 2 s at 0.15×, 250 ms out: "a cinematic tool, reserved for the moments the game wants watched". | 0.15×, 2.5 s | S7 | Slow-mo only for Mega Pop and All Clear, and much shorter than this. Gloop Pop's existing 0.35× for 450 ms stays. |
| PoP: Warrior Within and God of War slow down before climactic attacks. | n/a | S17 | Brief slow-mo on game over (the last stuck shake) to let the end land. |
| Tetris Effect: a cycle of excitation and relaxation for flow; they tuned visuals so they don't cause nausea or get in the way, and added an option to see less. | n/a | S23 | Escalate with combo, then let it calm; keep a reduced setting. |

## 7. Drag and pickup in touch puzzle games

| Finding | Source | Applies |
|---|---|---|
| Lift the piece above the finger to avoid occlusion, but keep the offset stable; changing it near an edge makes players release over the wrong square. | S21, S22 | Keep the 1.1c offset fixed. Any lag/spring on the drawn piece must not move the *snap target*: the target is computed from the finger, not from the lagging visual. |
| Generous snap radius and a live ghost; invalid placements need immediate visible feedback, never silent failure. A piece that teleports back to the tray reads as a bug. | S22 | Already in SG §8.3–8.4; keep. |
| Batch every line from one placement into one clear event and stagger each line slightly: "far more satisfying than everything firing in the same frame". | S22 | Already staggered by the sweep; keep. |
| Pool particles; cap simultaneous effects and scale intensity down as clear count rises. | S22 | Particle cap stays 420; new effects must be allocation-free. |
| A clear needs "a little theatre, then give the board back": the next decision must feel available quickly. | S21 | Hitstop and slow-mo must be short and never block the next drag. |
| Celeste: everything "fudged a tiny bit in the player's favour" (coyote time, buffering, corner correction). | S6 | Snap forgiveness and instant input during effects are the puzzle-game version of this. |

## 8. Haptics

| Finding | Numbers | Source | Applies |
|---|---|---|---|
| A good key-click haptic lasts 10–20 ms; the motor rings for another 20–50 ms after a 20 ms input. Long one-shots feel "buzzy"; given buzzy or none, choose none. | 10–20 ms | S18 | Cap every pulse at 20 ms. Build big events from several short pulses with gaps, not longer pulses. Current 22–50 ms pulses must go. |
| Scale strength with importance and frequency; frequent events very subtle; "effects that become stronger as the interaction reaches a target". Sync haptics with visuals and audio; out-of-sync feels broken. | n/a | S18 | Per-cell pop ticks are too frequent; tick per *wave*. Fire the haptic on the same frame as the visual impact (end of hitstop swell), not on input. |
| `navigator.vibrate(pattern)` takes on/off ms arrays; it is not supported in Safari or iOS Safari at all, nor current Firefox. | n/a | S19 | Android Chrome only. iOS gets no vibration from this API. |
| iOS Safari (17.4+) gives a native haptic when a user toggles `<input type="checkbox" switch>`; libraries overlay a transparent label to forward a trusted tap. | n/a | S20 | Possible only for direct taps on DOM buttons, not for canvas drag/release. Out of scope for this pass; noted as a gap. |
| Apple and Android both advise making haptics optional. | n/a | S18 | Keep the Vibration setting. |

## 9. What this means for Gloop Pop (summary)

1. **Freeze the board, not the game.** Hitstop on the cells being cleared and the piece that caused it; drag, tray, HUD, background and particles keep moving (S4). Input is never queued behind it (S3, S12).
2. **Scale hitstop with "damage"** = cells removed, Smash-style floor + linear + cap (S4), inside Celeste's 50–150 ms ladder (S5), with Hollow Knight's fast-in, soft-out ramp (S7).
3. **Swell, freeze, burst**: anticipation squash before the burst (S13), freeze on the peak frame (S17), white flash ~50 ms (S7), then staggered bursts with particles that inherit direction.
4. **Trauma shake** with noise and a little rotation, stacking across a combo (S9), plus a 2–3 frame directional kick on placement weight (S17).
5. **Springs everywhere a hand touches**: pickup overshoot and shadow drop (S16), spring-follow and velocity squash/tilt on drag (S10, S11, S15), but the snap target follows the finger exactly (S21).
6. **Landing**: anticipation dip, smear on the snap, volume-preserving squash, per-cell settle, neighbour jiggle (S10, S13, S14).
7. **Haptics** as short ≤20 ms taps, escalating by count, synced to the visual impact (S18); Android only (S19).
8. **Restraint**: one big moment at a time, calm after, reduced-motion path for everything (S23, S5).
