# Audio research: satisfying SFX and music for Gloop Pop

Pass 2 of the feel work (pass 1: `research/game-feel.md`). Every claim below cites a source that was opened and read in full on 2026-10-25. Numbers are quoted as the source gives them. Where no first-hand source exists, the doc says so instead of guessing.

## Sources

| # | Source | Type |
|---|---|---|
| A1 | Guy Whitmore, "Peggle 2: Storytelling Through Adaptive Music", GANG blog, 2014 https://www.audiogang.org/peggle-2-storytelling-through-adaptive-music/ | Composer, first-hand |
| A2 | Guy Whitmore, "Peggle2: Sonic Joy!", GANG blog, 2014 https://www.audiogang.org/peggle2-sonic-joy/ | Composer, first-hand |
| A3 | Polygon, "Making the secret symphony of Peggle 2", 2013 https://www.polygon.com/features/2013/12/11/5174562/making-peggle-2/ | Interview with Whitmore and Shumate |
| A4 | PC Gamer, "The Making of Peggle" p.2, 2010 https://www.pcgamer.com/the-making-of-peggle/2/ | Interview with Sidhu and Kapalka |
| A5 | GameDesign.gg, "Juice" glossary https://gamedesign.gg/glossary/juice/ | Secondary |
| A6 | PJ Belcher, "Why Candy Crush Saga is so Engaging - An Audio Breakdown", Game Developer, 2013 https://www.gamedeveloper.com/audio/why-candy-crush-saga-is-so-engaging-an-audio-breakdown | Sound designer analysis |
| A7 | Game Design Lab, "Audio Design: Balatro systems" https://teemo.dev/game-design/balatro/systems/audio-design/ | Analysis of shipped files and source notes |
| A8 | balatro-src reverse-engineering, `functions/common_events.lua` https://github.com/balatro-src/balatro-src-reverse-engineering/blob/3a42f613/functions/common_events.lua | Decompiled code (secondary) |
| A9 | GameBusiness.jp, CEDEC 2019 report on Tetris Effect sound (Noboru Muto, Enhance), 2019 https://www.gamebusiness.jp/article/2019/09/20/16219.html | Talk report, first-hand speaker |
| A10 | Splice, "Hydelic on creating music for Tetris Effect", 2019 https://splice.com/blog/hydelic-q-and-a/ | Composer interview |
| A11 | Cotorano Audio, "Randomise Sound Effect Pitch and Volume in Unity, Godot, Unreal", 2026 https://bgm.cotorano.com/blog/sound-effect-variations-randomize-pitch-volume-unity-godot-unreal/ | Practitioner blog |
| A12 | Tonalux, "Layering Techniques for Impact Sounds", 2025 https://tonalux.org/blog/layering-impact-sounds | Practitioner article |
| A13 | Stephen Schappler, "Listening for Loudness in Video Games", 2013 https://www.stephenschappler.com/2013/07/26/listening-for-loudness-in-video-games/ | Quotes Sony ASWG-R001 |
| A14 | Jie Yang (Digimonk), "Loudness and frequency response on popular smart phones", Audiokinetic blog, 2019 (read via web.archive.org) https://www.audiokinetic.com/en/blog/loudness-and-frequency-response-on-popular-smart-phones/ | Measurements |
| A15 | Oliver Smith, "Small Speakers, Big Impact" https://www.oliversmithsound.com/blog/how-to-make-your-mobile-game-sound-better | Sound designer guide |
| A16 | Zachary Quarles, "Game Audio Theory: Ducking", Game Developer, 2009 https://www.gamedeveloper.com/audio/game-audio-theory-ducking | Practitioner, shipped title |
| A17 | Winifred Phillips, "Pure vertical layering for game music composers", Game Developer, 2021 https://www.gamedeveloper.com/game-platforms/pure-vertical-layering-for-game-music-composers-from-spyder-to-sackboy-gdc-2021- | Composer, GDC talk |
| A18 | Polygon, "We asked 13 video game composers how they keep scores interesting", 2024 https://www.polygon.com/24216350/composers-on-repetitive-video-game-music/ | Composer interviews |
| A19 | Boom Box Post, "Creating an Evil Slime Monster!", 2021 https://www.boomboxpost.com/blog/2021/4/9/8uhf7hbr9nym6797q3v18gm8ei0dzv | Sound editor walkthrough |
| A20 | Chrome for Developers, "Autoplay policy in Chrome" https://developer.chrome.com/blog/autoplay | Browser vendor |
| A21 | MDN, "Web Audio API best practices" https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices | Reference |
| A22 | Chris Wilson, "A tale of two clocks", web.dev https://web.dev/articles/audio-scheduling | Reference |
| A23 | caniuse, Ogg Vorbis https://caniuse.com/ogg-vorbis ; Opus https://caniuse.com/opus ; MP3 https://caniuse.com/mp3 | Compatibility data |
| A24 | MDN, "AudioSession: type" https://developer.mozilla.org/en-US/docs/Web/API/AudioSession/type | Reference |
| A25 | MDN, "AudioContext: outputLatency" https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/outputLatency | Reference |
| A26 | howler.js README https://raw.githubusercontent.com/goldfire/howler.js/master/README.md | Library docs |
| A27 | The Sounds Resource, "Block Blast! Sound Effects" listing https://sounds.spriters-resource.com/mobile/blockblastblockjuggle/asset/470047/ | File listing only (assets not used) |

Weighted low or not used: A11 is a short blog post whose author says they did not run the sample code; A27 is a fan rip, used only for its file count, and none of its audio was downloaded. A search for Suika Game merge-sound design returned only reviews and a ripped-asset listing, so there is no Suika claim below. King, Hungry Studio (Block Blast) and Aladdin X (Suika) have published nothing first-hand on SFX timings that I could find.

## Findings

| Topic | Finding (with numbers) | Source | Applies to Gloop Pop |
|---|---|---|---|
| Pitch ladder | Peggle 2 peg hits play an ascending diatonic scale "26 notes up or 3 and 1/2 octaves", re-keyed to the current music phrase, and the hit counter resets per turn "so that it always ascends". | A1 | Our line clears and pops already climb a C-major pentatonic ladder (`noteFor`). Keep the ladder in the key of the music bed so hits sit inside the harmony. Reset per move, climb with combo. |
| Pitch ladder | Peggle 2 recorded single-note samples for peg hits (e.g. string pizzicato) and treats peg hits as "a melody instrument". | A2 | Use one pitched, recorded or sampled tone and repitch it via `playbackRate` instead of a bare oscillator, so the ladder sounds like an instrument. |
| Pitch ladder | Candy Crush: each extra row cleared in one move plays "the same sound, but a semi-tone higher". | A6 | Multi-line clears within one move step up the ladder per line (we use 2 semitones; keep it in-scale). |
| Pitch ladder | Balatro ships an eleven-step `voice1`–`voice11` ladder, "the only 'melodic' SFX in the game"; players read the size of a cascade "from how far up the ladder it walked". | A7 | Cap the ladder at a fixed top rung (we have 11 notes C5–C7) so the top is reachable and recognisable. |
| Distinct timbres | Balatro separates chips (`chips1-2`) from mult (`multhit1-2`) and money (`coin1-7`) by timbre so currencies are "never mistaken" for each other. | A7, A8 | Give score, coins and combo their own timbres: wet pop for gloops, bright tone for lines, small tick for coins. |
| Variation | Balatro's status-text cue uses `percent = 0.9 + 0.2*math.random()`, i.e. ±10 % pitch per call. | A8 | ±4 % (our current place) is safe; up to ±10 % works for non-pitched foley. Never randomise the pitched ladder rungs beyond a few cents. |
| Variation | Balatro avoids machine-gunning with asset multiplicity: 7 coin variants, 6 glass variants, random index. | A7 | Ship 3–5 variants for the most frequent sounds (place, pop) and avoid repeats. |
| Variation | Tetris Effect plays "10 or more" samples at random for the landing sound via a Wwise random container. | A9 | Frequent cues need several variants. |
| Variation | Three to five variations "make a clear difference" for frequent sounds; pitch change of "a few percent" is enough; rare sounds need none. | A11 | Variants for place/pop/tick; none for All Clear or New best. |
| Variation | Block Blast's ripped SFX folder holds 349 .ogg files. | A27 | Only a sign that the genre leader uses many variants. |
| Sync | Tetris Effect quantises SFX to 16th notes; without it "fast inputs" merge into noise; picture is not quantised, and "people perceive picture and sound as matching" anyway. | A9 | Do not quantise gameplay SFX (we must fire on the M10 impact frame), but quantise stingers and music-layer entries to the beat. |
| Sync | Peggle 2 needed an engine callback so the new peg-hit scale started exactly when the new music phrase started. | A1 | Change the ladder key/layer only at bar boundaries of the music clock. |
| Tempo | Hydelic (Tetris Effect): excitement around 135 BPM in 4/4; calm in 6/4 around 100–120 BPM. Tempo changes at line-count thresholds. | A10 | A calm bed under ~120 BPM for endless sessions. Raise intensity with layers, not tempo. |
| Celebration | Peggle's "Ode to Joy" and Extreme Fever began as placeholders; the team chose to "make Extreme Fever as dramatic as possible". Juice glossary: slow motion, zoom, rainbows and "Ode to Joy" for a mechanically trivial final peg. | A4, A5 | Mega Pop / All Clear deserve one big stinger that rides the M10 slow-mo, with music ducked under it. |
| Layering | Impact = transient (0–10 ms, high, "tells the brain something happened") + body (10–100 ms, mid) + sub (<80 Hz) + tail (100 ms+). Highpass transient at 2–4 kHz, body band ~150 Hz–2 kHz. | A12 | Place = click transient + wet body + small thump; pop = wet bloop + sparkle. |
| Layering | A body delayed 20–30 ms after the transient feels "explosive"; simultaneous feels "punchy". | A12 | Place: simultaneous (punchy). Mega Pop: 20–30 ms offset between crack and bloom. |
| Ducking | Impact sidechain: fast attack, release 50–150 ms, ratio 3:1–6:1, "subtle". Fracture ducked all but VO to −9 dB over 500 ms and returned over 1000 ms. | A12, A16 | Duck the music bus a few dB for big moments only (Mega Pop, All Clear, New best), not on every placement. |
| Ducking | Too-frequent or aggressive ducking "will become distracting". Constant climax exhausts players, who "turn down or mute the audio". | A16 | Rare ducks; leave headroom; most moves stay quiet. |
| Speakers | Phone speakers "roll off from 1kHz"; Android output rises from 220 Hz, iPhone 7P from 400 Hz; "4–5kHz shall be very careful band". | A14 | Sub thumps below 200 Hz are inaudible on most phones. Every cue needs energy in 400 Hz–4 kHz. Keep 4–5 kHz tame. |
| Speakers | Mobile speakers "tend to drop off at around 800Hz"; 4–5 kHz "particularly pronounced"; add saturation for low-end; check in mono and at low volume. | A15 | Mono assets; test mixes through a 400/800 Hz highpass. |
| Loudness | Phone AGC means content louder than −12 LKFS does not sound louder; "−16LKFS is almost the max level to all the phones"; author's target −16 LKFS, peak ≤ −3 dBFS. | A14 | Master target about −16 LUFS integrated for gameplay, true peak ≤ −1 dBTP; normalise every asset before mixing. |
| Loudness | Sony ASWG-R001: portable titles −18 LUFS, true peak max −1 dBTP; measure ≥ 30 min of play. | A13 | Treat −18 to −16 LUFS as the window. |
| Loudness | Balatro's 80 SFX files are Ogg Vorbis 44.1 kHz, loudness-normalised (MP3GAIN) before integration; options are just Master 80 %, Music 100 %, Game 100 %. | A7 | Normalise assets offline; two volume controls (music, effects) plus master mute is enough. |
| Music fatigue | Larkin (Hollow Knight): balance repetition and variation; three layers (main, sub, action) shifting in volume add variation. Vreeland: silence fights fatigue. Roget: allow "moments with no music at all". | A18 | Bed plus layers that come and go with combo; let music rest after long sessions or in menus. |
| Music fatigue | Belcher on Candy Crush: one looping track "if played enough times will become boring"; offer an easy music mute. | A6 | Music toggle stays one tap away; consider resting music after N loops. |
| Adaptive layers | Vertical layering = independent synchronised layers manipulated live; each must work alone and in combination, unlike mix stems. LittleBigPlanet used six layers. | A17 | Intensity layers tied to combo tier (and board danger) on a shared clock. |
| Adaptive layers | Balatro has no intensity layers; state selects one of five arrangements of the same song, crossfaded; game over slows music to 50 % speed and pitches it down. | A7 | A cheap, effective game-over cue: ramp music `playbackRate` down. |
| Adaptive layers | Peggle 2: if the player is idle for more than 30 s the music moves to an "inactive" ambient section. | A1 | Thin the music after 30 s without input. |
| Squish foley | Slime: "goo-type layer" from slime in a cup being pressed, slowed down for size, plus a "low-end drag" for weight; reversing adds weirdness. | A19 | Gloop pops = short wet goo/mouth pop, pitched up for small gloops and down for big ones. |
| Autoplay | Web Audio is covered by autoplay since Chrome 71; a context made before a gesture starts "suspended" and needs `resume()` after a gesture. | A20 | Keep creating/resuming the context on the first pointer/key event (already done). Fetch music only after that. |
| Web Audio | Use `AudioBufferSourceNode` for short sample-like sounds and media elements for long tracks; use AudioParam scheduling methods for timed changes. | A21 | Decode SFX into buffers; music can be a buffer too (small file) so it loops sample-exactly. |
| Scheduling | Lookahead scheduler: 25 ms timer, ~100 ms lookahead; audio thread timing stays exact even when the main thread stalls; output buffers vary "from low single digits of milliseconds to around 50ms". | A22 | Keep the 25 ms / 120 ms scheduler; schedule SFX on the audio clock at the impact frame. |
| Latency | `outputLatency` estimates time from graph to speaker; Baseline since March 2025. | A25 | Optionally subtract `outputLatency` when lining sound up with the impact frame. |
| Formats | Ogg Vorbis: iOS Safari unsupported up to 17.3, partial 17.4–18.3, supported 18.4+. Opus: same pattern. MP3: supported on iOS Safari 4+ and every current browser. | A23 | Ship Opus/Vorbis (`.ogg`) for Chrome/Firefox/Android and MP3 fallback for iOS < 18.4; pick with `canPlayType`. |
| Formats | howler.js recommends `webm` with `mp3` fallback for full coverage; supports sprites `[offset, duration]`; auto-unlocks on `touchend`. | A26 | One sprite file per format keeps request count low; we can do this without the library. |
| iOS session | `navigator.audioSession.type`: "ambient" mixes with other audio; "playback" pauses other playback audio. | A24 | Set "ambient" where supported so the game never stops the player's podcast or music. |

## Audit of the current audio (src/audio, commit d2a65c4)

- Everything is synthesised with oscillators and noise (SG §13). Zero payload, but timbres are pure sine/triangle/square tones. On phone speakers (A14, A15) the 90→40 Hz sub thump (`popArp`), the 240→110 Hz place "plop" and the 120→45 Hz music kick fall below the ~220–400 Hz roll-off and mostly disappear.
- No variants: `place` has ±4 % pitch, `gloopPop` ±10 cents. Everything else repeats identically (A7, A9, A11).
- Timing is already right for board impacts. `app.ts` plays `place` and the board cues (`cleared`, `popped`, `allClear`) from the M10 director callbacks on the impact frame.
- Bug: `comboUp` is not a board event, so it plays immediately on input and calls `sfx.lineClear` a second time. Every combo step therefore plays a line-clear chord before the impact frame and again on it.
- `sfx.comboHarmony` and `sfx.sparkle` exist but nothing calls them. The §13.2 "combo harmony (tier ≥ 1)" and "sparkle (tier ≥ 2)" layers never play.
- `megaPop`/`hugePop` arpeggios start at the same moment as the per-cell pops; nothing ducks the music; there is no stinger tied to the M10 slow-mo.
- Music is an 84 BPM generative loop of sine/triangle voices behind a 1200 Hz lowpass. It adapts (filter, tier-4 melody) but sounds thin, and its 4 chords never change key or section.
- Settings are on/off toggles only (Sound effects, Music, master mute). No volume sliders.
- No `audioSession` handling. On iOS the ring/silent switch rules apply by default.
- The service worker precaches every file in `dist/`. Any audio added to `dist/` in two formats would be downloaded twice; audio must be excluded from precache or only one format precached.
- Bundle: 75.03 KB gzipped JS of a 150 KB budget.

## Candidate assets (licences verified on each asset's own page, 2026-10-25)

All candidates are CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/). Nothing CC-BY was needed. Nothing NC/ND or unclear was downloaded for use. Measurements from `/workspace/night-game/audio-src/analysis.tsv` (dur = audible length, centroid = spectral centroid, low = share of energy under 200 Hz).

SFX (Freesound, CC0, preview HQ mp3 downloaded from each sound's page):

| id | Title | Author | Page | dur s | centroid Hz | low % | Note |
|---|---|---|---|---|---|---|---|
| 221091 | cartoon pop or drip | AlaskaRobotics | https://freesound.org/people/AlaskaRobotics/sounds/221091/ | 0.10 | 802 | 3 | short wet pop, ~552 Hz |
| 611642 | waterbloop.mp3 | kstargio | https://freesound.org/people/kstargio/sounds/611642/ | 0.18 | 3906 | 4 | bloop |
| 741368 | Cartoon Pop | Mish7913 | https://freesound.org/people/Mish7913/sounds/741368/ | 0.06 | 2930 | 2 | bright pop |
| 202230 | Pop sound | deraj | https://freesound.org/people/deraj/sounds/202230/ | 0.18 | 1875 | 0 | pop |
| 323740 | mouth pop2.wav | Reitanna | https://freesound.org/people/Reitanna/sounds/323740/ | 0.03 | 1151 | 4 | tiny mouth pop |
| 325583 | mouth pops - wet - room.flac | cbenci | https://freesound.org/people/cbenci/sounds/325583/ | 23.4 | 1290 | 6 | many wet mouth pops to slice into variants |
| 802606 | Pops - Mouth | JelloApocalypse | https://freesound.org/people/JelloApocalypse/sounds/802606/ | 7.9 | 3484 | 24 | series of mouth pops to slice |
| 442772 | Slime Squish | qubodup | https://freesound.org/people/qubodup/sounds/442772/ | 0.37 | 6045 | 1 | squish |
| 536765 | Squish.ogg | egomassive | https://freesound.org/people/egomassive/sounds/536765/ | 0.41 | 6499 | 2 | soft squish |
| 589612 | SFX_SQUELCH_squeeze_short_34.wav | MrFossy | https://freesound.org/people/MrFossy/sounds/589612/ | 0.13 | 2516 | 28 | short squelch |
| 500912 | Squish impact | Bertsz | https://freesound.org/people/Bertsz/sounds/500912/ | 0.76 | 6262 | 9 | squish hit |
| 96124 | Bubbles_Single1.wav | BMacZero | https://freesound.org/people/BMacZero/sounds/96124/ | 0.25 | 1007 | 0 | single bubble |

SFX (Kenney, CC0, packs from https://kenney.nl/assets/interface-sounds, /impact-sounds, /casino-audio, /ui-audio, /digital-audio, /music-jingles; each pack's License.txt says CC0 1.0):

- Interface Sounds: `drop_001–004` (40–90 ms, 750–4300 Hz), `pluck_001–002`, `glass_001–006` (bright glassy ticks ~2 kHz), `confirmation_001–004`, `select_001–008`, `tick_001–004`, `click_001–005`, `maximize_00x`, `bong_001`.
- Impact Sounds: `impactSoft_medium_000–004`, `impactSoft_heavy_000–004`. Warning: 98–100 % of their energy is under 200 Hz, so on phones they need a mid layer or saturation (A14).
- Casino Audio: `chips-stack-1–6`, `chips-collide-1–4`, `chip-lay-1–3` (bright clacks, centroid ~7 kHz), `card-place-1–4`.
- UI Audio: `click1–5`, `rollover1–6`, `switch1–38`.
- Music Jingles: 85 short jingles in PIZZI / SAX / STEEL / NES / HIT families (candidates for New best / Level up / All Clear stingers).

Music (OpenGameArt, CC0, verified on each page):

| Title | Author | Page | Length | Est. key | Loudness | Note |
|---|---|---|---|---|---|---|
| Lofi Hip Hop Loop | omfgdude | https://opengameart.org/content/lofi-hip-hop-loop | 127.9 s | C major (r=0.87) | −20.4 LUFS, LRA 3.8 | "Delicate and soft", tags lofi/chill; same key as our C pentatonic ladder |
| Cozy Puzzle In-Game 1 | MintoDog | https://opengameart.org/content/cozy-puzzle-in-game-1 | 130.2 s (64 bars at 118 BPM) | G major (r=0.89) | −12.1 LUFS | "Music for puzzle game", loopable |
| Cozy Puzzle In-Game 2 | MintoDog | https://opengameart.org/content/cozy-puzzle-in-game-2 | 128.0 s (48 bars at 90 BPM) | D# minor? (r=0.82) | −11.2 LUFS | loopable |
| Cozy Puzzle In-Game 3 | MintoDog | https://opengameart.org/content/cozy-puzzle-in-game-3 | 124.5 s (56 bars at 108 BPM) | G (major/minor unclear) | −11.5 LUFS | loopable |
| Happy Vibes | Ruskerdax | https://opengameart.org/content/happy-vibes | 45.5 s | A major (r=0.91) | −9.7 LUFS | puzzle jam, retro Roland synths |
| Dimly lit | iamoneabe | https://opengameart.org/content/dimly-lit | 128.0 s | — | −14.0 LUFS | lo-fi electro blues |
| Calm Loop | wipics | https://opengameart.org/content/calm-loop | 19.4 s | — | −9.6 LUFS, peak +1.1 dBFS (clips) | too short, clipped |

Key estimates use a Krumhansl key-profile correlation of an averaged chromagram (numpy). BPMs come from the uploaders' filenames, cross-checked against duration ÷ bar length. They are estimates; nobody has listened to these on a phone yet.

## Gaps

- No source gives first-hand Suika, Block Blast or Candy Crush SFX parameters beyond the semitone-per-row ladder (A6).
- No measured iOS/Android touch-to-sound latency for this game; A22 gives the range of OS buffers only.
- All judgements here come from measurement and published guidance. No human listening test on a phone speaker has been done.
