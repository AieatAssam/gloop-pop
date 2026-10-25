# What makes small games go viral: research notes (v2)

Version 2, 25 Oct 2026, 01:55–02:20 BST. This version replaces the 01:05 first pass. Every case study below draws on at least one source I fetched and read in full (marked **[read]**). Search-summary-only sources are marked [search]. Analyses written by third parties are labelled as analysis, and first-hand accounts from developers as developer.

## Sources read in full (24)

1. Slate interview with Josh Wardle (Wordle) [read, developer]: https://slate.com/culture/2022/01/wordle-game-creator-wardle-twitter-scores-strategy-stats.html
2. TechCrunch interview with Josh Wardle [read via search extract, developer]: https://techcrunch.com/2022/01/12/josh-wardle-interview-wordle/
3. The Verge, Flappy Bird revenue interview with Dong Nguyen [read via search extract, developer]: https://www.theverge.com/2014/2/5/5383708/flappy-bird-revenue-50-k-per-day-dong-nguyen-interview
4. Scientific American, "Flow in Flappy Bird" [search extract, analysis]: https://www.scientificamerican.com/article/be-one-with-flappy-bird-the-science-of-flow-in-game-design/
5. Asher Vollmer and Greg Wohlwend, "The Rip-offs & Making Our Original Game" (the Threes email postmortem, 45,000 words) [read, developer]: http://asherv.com/threes/threemails/
6. Hacker News thread with Gabriele Cirulli (2048) [read, developer]: https://news.ycombinator.com/item?id=7373927
7. CNBC on 2048's spread [read, press]: https://www.cnbc.com/2014/03/26/19-year-old-makes-viral-game-hit-in-a-weekend.html
8. 20 Minutes, Guillaume Grandjean on Suika Game [read, academic analysis]: https://www.20minutes.fr/high-tech/by-the-web/4061933-20231112-secret-derriere-succes-soudain-suika-game
9. Automaton, Aladdin X on Suika's success [search extract, developer]: https://automaton-media.com/en/news/20231005-22096/
10. Game Design Lab, Vampire Survivors retention systems [read, analysis]: https://teemo.dev/game-design/vampire-survivors/systems/retention-and-engagement-systems/
11. The Conversation, Vampire Survivors and gambling psychology [search extract, academic]: https://theconversation.com/vampire-survivors-how-developers-used-gambling-psychology-to-create-a-bafta-winning-game-203613
12. LocalThunk, "The Balatro Timeline" [read, developer]: https://localthunk.com/blog/balatro-timeline-3aarh
13. Rogueliker interview with LocalThunk [read, developer]: https://rogueliker.com/balatro-interview/
14. Game Developer, "LocalThunk knew Balatro needed to draw players in with poker" [read, developer]: https://www.gamedeveloper.com/business/localthunk-knew-balatro-needed-to-draw-players-in-with-poker
15. Funconomy, "Block Blast: Success Formula" [read, analysis]: https://www.funconomy.com/post/block-blast-success-formula
16. Dashpop, "Block Blast: that fits. But should it go there?" [read, analysis]: https://dashpop.com/learn/deep-dives/block-blast
17. Deconstructor of Fun, Royal Match deconstruction [read, analysis]: https://www.deconstructoroffun.com/blog/2021/3/21/royal-match-the-new-king-from-turkey
18. Android Central, "How did Among Us get so popular?" [read, press]: https://www.androidcentral.com/how-did-among-us-get-so-popular
19. Nintendo interview with Forest Willard (Among Us) [search extract, developer]: https://www.nintendo.com/us/whatsnew/among-us-dev-recounts-how-the-game-took-flight/
20. WIRED UK, "How addictive simplicity made Agar.io a global hit" [read, developer quotes]: https://www.wired.com/story/agario-miniclip-game-viral-success-pewdiepie-youtube/
21. GamesBeat, Miniclip's Jamie Cason on .io games (Casual Connect talk) [read, developer]: https://gamesbeat.com/the-surprising-momentum-behind-io-games-like-agar-io/
22. Wikipedia, Slither.io (development and reception, citing WSJ and Pocket Gamer) [read]: https://en.wikipedia.org/wiki/Slither.io
23. Game Developer, "The recipe behind Cookie Clicker" [read, analysis]: https://www.gamedeveloper.com/design/the-recipe-behind-cookie-clicker
24. How It Spread, Grow a Garden case file [read, analysis]: https://howitspread.com/cases/grow-a-garden
25. Duolingo, "The habit-building research behind your Duolingo streak" [read, developer data]: https://blog.duolingo.com/how-duolingo-streak-builds-habit/
26. PocketGamer.biz / Supersonic, "The key to successful hypercasual prototypes" [read, publisher data]: https://www.pocketgamer.biz/the-key-to-successful-hypercasual-prototypes/
27. GameDiscoverCo, "Video games & TikTok" (Jenny Windom Q&A) [read, analysis]: https://newsletter.gamediscover.co/p/video-games-and-tiktok-how-to-get
28. GameDiscoverCo, "Everything you want to know about shortform video & games" (Apr 2026, Jestr data) [read, analysis]: https://newsletter.gamediscover.co/p/everything-you-want-to-know-about
29. Jan Willem Nijman (Vlambeer), "The Art of Screenshake", INDIGO 2013, via two talk summaries [read summaries, developer talk]: https://www.youtube.com/watch?v=AJdEqssNZ-U, https://artificials.ch/juice-up-your-game/
30. Martin Jonasson and Petri Purho, "Juice it or lose it", GDC Europe 2012 [search summary, developer talk]: https://www.youtube.com/watch?v=Fy0aCDmgnxg
31. Near-miss research: Clark et al. 2013 [search]: https://doi.org/10.1002/bdm.1774; online-slot replication 2024 [search]: https://doi.org/10.1037/adb0000999; a review finding mixed evidence [search]: https://ncbi.nlm.nih.gov/pmc/articles/PMC7214505/

---

## 1. Case studies: what each game did, in the developer's or analyst's own words

### Flappy Bird (2013–14)
- **One input, a three-second fail loop, a lie about difficulty.** "The task is clear, the feedback is immediate and clear; you mess up and die in three seconds… It's hard because it's so precise." The game looks easy, so every death feels like your own fault (Sci Am, 4).
- **A classroom competition.** Nguyen: "People in the same classroom can play and compete easily because it is simple to learn, but you need skill to get a high score." Players compared scores and shared them to Facebook and Twitter (The Verge, 3).
- **Reaction media carried it.** A Reddit "masochistic games" list, then PewDiePie's video with 5.4M views in a week. The clips were people's reactions to dying (Know Your Meme, WIRED).
- **Lesson for us:** the score you're proud of, and the failure you rage at, both have to be showable. A friend's number has to be beatable from a link.

### Threes and 2048 (2014)
- **Threes took 14 months and 570 emails** (developer postmortem, 5). Lessons straight from the thread:
  - "There's a lot to be said for a way to explain this game in a sentence… having that 'special' thing that people can latch onto and parrot is pretty key" (Wohlwend).
  - Faces made the tiles characters. "We'll get a lot of mileage out of the monsters and their expressions… the highest monster on the board has its mouth open." The biggest piece on the board gets a special face.
  - "Every time you upgrade a tile to a new level you haven't seen before it has to be super exciting/pleasing/surprising" (Vollmer). **First-time discoveries deserve their own celebration.**
  - The "squint test": "each tile passes the squint test where you can tell them apart even when you blur your vision."
  - "Play-againness": "every time I hand Merge to someone… they always start the game again immediately after they lose. That's a clear sign… they see how they can change their strategy." A loss must teach you something.
  - Tension through **near-loss recoveries**: "you have these narrow-miss sorts of drama that are really rewarding… when I'm at 4 and I manage a 2/1 merge, man that feels good."
  - Session data: "play sessions are frequent and range from 30 seconds to fifteen minutes."
  - The tutorial failed for a non-gamer until there were more pieces on the board, so **teach on a board that shows the rule, not an empty one**.
- **2048** was the free, no-install **web** clone. Cirulli's addition was **animation** ("a bit hard to play without them", HN, 6). It reached 100M plays in under three weeks, with only about 1% of games won (CNBC, 7). The free web link beat the paid original.

### Wordle (2021–22)
- Wardle **deliberately did the opposite of attention design**: no endless play, no push notifications, no sign-up, no ads. "Bizarrely [this] has had this effect where the game feels really human." There's one puzzle a day, the same for everyone (Slate, 1).
- **Help that changes how it plays:** the keyboard recolours to show what you know. "A very subtle feature, but I think it changes the game a lot." Showing state on screen eases in non-players (Slate, 1). Our equivalent is the line and pop preview.
- **Curated fairness:** an obscure answer word "you would feel cheated". The 13,000 words were filtered down to about 2,500 solutions. A daily puzzle must never feel unfair.
- **Share grid:** a player invented it, and Wardle built it in. It "tells a story" and is spoiler-free. He removed the link: "it feels spammy… They were sharing for themselves." Most sharing happens in family and friend group chats, as "a really low effort way of checking in" (Slate, 1; TechCrunch, 2).
- **Growth:** 90 players on 1 Nov 2021, then 300,000 two months later (NYT).

### Suika Game (2021, viral 2023)
- Aladdin X credits "cute and friendly art", "simple rules" and "an atmosphere that encourages you to try to do better next time even if you fail" (Automaton, 9).
- Grandjean (20 Minutes, 8): it combines **planning** ("puzzle-réflexion à la Tetris ou 2048") with **dexterity** ("un jeu de pétanque"). Its "physique de glissade" makes **chaos, then frustration and excitement, then entertaining content**. There's **no timer**, so streamers can think and chat. It launched on Switch and in the browser, which suits streaming.
- Streamers and VTubers carried it, along with TikTok near-miss clips (#スイカゲーム had 70.9M views).

### Vampire Survivors (2021–22)
- **Every run pays out.** "Every run banks gold… most runs trip at least one unlock condition even in failure… failure and success both leave the account in a measurably different state" (Game Design Lab, 10).
- **The reward cadence** is a flash, chime or chest jingle "every ten to twenty seconds".
- **Near-misses work when the cause is attributable.** "A death close to the 30-minute mark… carries a specific, attributable cause… which is what turns a near-miss into a plan for the next attempt."
- **Achievements are concrete tasks that unlock things,** not abstract points. The results screen is "built to be screenshotted and compared outside the game". It has no login streak and nothing time-limited: "the retention pressure [is] entirely intrinsic".
- **A capped session** (30 minutes) keeps "one more" cheap.

### Balatro (2024)
- **Familiar frame as onboarding.** "The poker theme was slapped on top… mainly as an onboarding tool." Playing cards let people "interface with mechanics" in "a simple and familiar approach to strategy games that are usually very information dense" (Rogueliker, 13; Game Developer, 14).
- **A friend's suggestion became the signature moment:** "there should be a flaming effect on your score if you get a really good hand. I hated the idea at first… I knew I was wrong." **The score itself catching fire** is the clip (Timeline, 12).
- **The spread:** the score-attack concept came from watching Northernlion play Luck Be a Landlord. Dan Gheesling's stream, then Northernlion's, took it from 2,440 to 28,661 wishlists in a month. A demo with unlimited play beat a demo capped at 50 rounds. "The game had inertia by itself" through word of mouth (Timeline, 12).

### Block Blast (2024)
- About 210M installs in 2024 and 40M daily players. It has no LiveOps and no IAP, only ads (Funconomy, 15).
- **Personal best as the goal.** "Once a player sets their 1st high score, a progress bar appears in future games, tracking how close they are to beating it… you're often pushing past 50%+ of the progress bar, creating a natural tension." **A visible progress-to-best bar during the run** (Funconomy, 15).
- **Combo streak:** "you must clear at least one line every three moves", with a pulsing indicator. It changes behaviour: players protect the streak over long-term planning.
- **Engineered early luck:** perfect pieces early on "trains them to believe it's possible", and later trays get harder. When only one move saves you and you find it, floating "Likes" reward it (Funconomy, 15). *We keep the honest version: generous early trays stated openly, no rigging later.*
- **Dark background, saturated blocks, exaggerated clear animations** (Funconomy, 15). "Space has shape", and the satisfying clear can be the wrong move. Keep the board legible after the celebration (Dashpop, 16).
- **UGC formats on TikTok:** best-score tutorials, "Clear ALL" moments, and "Can you beat my record?" (Funconomy, 15).

### Royal Match and Candy Crush
- **Speed and fairness win** (DoF, 17): one of the fastest switchers, with no loading between retries and no goal banner, to cut time per attempt. Pieces are "bright, saturated… distinct in both colour and shape", bigger than rivals', with strong contrast against the board. It's generous with power-ups, it shuffles instead of forcing a bad move, and its "smart" propellers retarget to help the player.
- **The "almost there" loss:** "a majority of almost wins that only needed one or two more moves". Toon Blast lets you **see the board** before deciding.
- **Bonus levels as a treat:** easy, generous reward levels break up the hard ones.

### Among Us (2018, viral 2020)
- Streamers revived it two years after launch (Sodapoppin, xQc, Korean streamer dobby). The clips are **social moments**. Low cost and low system requirements meant anyone could join (Android Central, 18).
- Willard: an early version where "the ship was always in crisis… was too stressful and didn't leave much time for detective work" (Nintendo, 19). **Pressure needs breathing room.**

### Agar.io and Slither.io (2015–16)
- Valadares: "You don't need to read the instructions to start playing. The initial version didn't even have them" (WIRED, 20).
- Cason (Miniclip): ".io games tend to be super accessible. Wherever you are, you can find the time… something cultural, with a punky feel that fit with internet memes" (GamesBeat, 21). Slither.io had "a Zen-like atmosphere… I love the visual effects". Reviewers praised "the dark environment with neon worms" (Wikipedia, 22).
- Slither's skins were unlocked by sharing early on, and its creator refused to sell power-ups so paying players got no advantage (Wikipedia, 22).

### Cookie Clicker (2013)
- "I have yet to find a person that does not know what to do from the very moment they land on the website." There's no account (it saves in cookies), the number always goes up, "the initial 5 minutes of play showers the player in feel-good moments", and later rewards get scarcer and feel more earned. A prestige system and very hard achievements give it a long tail (Game Developer, 23).

### Grow a Garden (2025)
- Peaked at 22.3M concurrent players. Simple blocky crops with faces made it easy for fans to turn the game into skits and props: "eyes and mouths let inventory play characters" (How It Spread, 24).

### Habit and onboarding data
- **Duolingo** (25): learners on a 7-day streak are 3.6× more likely to finish a course. Streak-extend animations on milestone days raised 7-day retention for new learners by 1.7%. Letting people equip up to 2 streak freezes raised daily actives by 0.38%, because "offering people a little slack… can be more motivating than having a rigid set of rules".
- **Supersonic** (26): about 15 minutes of day-0 play is the sweet spot for hypercasual, with a 98% per-level completion benchmark. Fix any step that loses more than 2% of players.

### Short-form video (2021 and 2026)
- Clips work when they show **one hook in 15–60 s, vertical, with captions** (27). In 2026, short-form is a key discovery method for 36% of Steam players. **Puzzle games do surprisingly well because "viewers [can] 'figure out' the puzzle alongside the creator"**. Instagram weights shares more than likes, and TikTok's audience is the youngest and most mainstream (28).

### Juice talks
- Nijman (29): "Just fill your game with love and tiny details." Relevant tricks include impact effects ("don't let things simply disappear, show how they disappear"), **sleep** (a 20 ms hit-stop on big hits), screen shake, more bass, permanence, and a game-over screen with meaning.
- Jonasson and Purho (30): tweening, squash and stretch, particles, sound, and characters that react to the player. Juice supports the design and doesn't replace it.

### Near-miss evidence (31)
Near-misses raise the motivation to continue, especially when the player believes skill matters, but the effect on persistence is mixed in controlled studies. For us: **show real near-misses that tell the player what to do differently (the Vampire Survivors "attributable cause"), and never fabricate them.**

---

## 2. Cross-cutting principles (with the cases behind each)

| # | Principle | Evidence |
|---|---|---|
| P1 | **A one-sentence "special thing" people can parrot** | Threes emails; Wordle; Agar |
| P2 | **No instructions needed; teach on a board that shows the rule** | Agar ("initial version didn't even have them"); Cookie Clicker; Threes tutorial failure |
| P3 | **Seconds to fun, zero friction**: no login, no popup, no loading between retries | Royal Match; Wordle; Supersonic |
| P4 | **Instant, cheap retry, and losses that teach** ("play-againness") | Threes; Flappy; VS attributable deaths |
| P5 | **Honest near-misses shown with the cause** | VS; Royal Match; near-miss literature |
| P6 | **Reward beat every 10–20 s, with rarer peaks** | VS; Block Blast combo; Cookie Clicker's first 5 minutes |
| P7 | **First-time discovery moments are extra special** | Threes ("a new level you haven't seen before… super exciting") |
| P8 | **A personal-best chase visible during the run** | Block Blast progress bar |
| P9 | **A familiar frame explains the rules** | Balatro poker; Suika fruit; Block Blast/Tetris |
| P10 | **Characters with faces; the biggest one gets a special face** | Threes; Suika; Grow a Garden |
| P11 | **Squint-test readability** in colour and shape, big pieces, dark board, saturated pieces | Royal Match; Block Blast; Threes; Slither |
| P12 | **A signature over-the-top effect on the score** | Balatro flaming score; Block Blast rainbow combos |
| P13 | **Hit-stop and juice everywhere** | Nijman; Jonasson and Purho; 2048 |
| P14 | **Spoiler-free shareable result with a day number, no spammy link** | Wordle |
| P15 | **A screenshot-worthy results screen and "beat my score"** | VS results; Flappy classroom; Block Blast "Can you beat my record?" |
| P16 | **Puzzle clips where viewers solve along** | GameDiscoverCo 2026 |
| P17 | **Daily shared puzzle plus a streak with slack (2 freezes) and milestone celebrations** | Wordle; Duolingo |
| P18 | **Every run banks progress; achievements unlock concrete things** | VS; Cookie Clicker |
| P19 | **Player-favourable fairness**: no pay-to-win, generous help, a shuffle instead of a forced loss | Royal Match; Slither; Wordle's curated words |
| P20 | **Breathing room**: no timer, so you can talk while you play | Suika; Among Us |
| P21 | **Web, free, no install** | 2048; Agar; Slither; Wordle; VS on itch.io |
| P22 | **Short sessions from 30 s to 15 min, about 15 minutes of content on day 0** | Threes; Supersonic; VS's 30-minute cap |

## 3. Design requirements checklist (derived)

R1–R22 are unchanged from v1. R23–R30 are new in v2. Each is traced in docs/design.md §21 and §23.

- [ ] **R1 One-sentence pitch** a child can repeat, with one "special thing" (P1).
- [ ] **R2 Under 5 s from load to first input**: no title gate, live board on first frame (P3).
- [ ] **R3 Teach by doing**: one line per step, on a board that already shows the rule (P2).
- [ ] **R4 Under 1 s from game over to play again**, with one tap and no loading between retries (P3, P4).
- [ ] **R5 Honest near-miss with its cause**, saying what would have saved you (P5).
- [ ] **R6 A reward beat every 5–20 s**, with rarer peaks every few minutes (P6).
- [ ] **R7 Low floor, high ceiling** (P9).
- [ ] **R8 Familiar frame** (P9).
- [ ] **R9 Daily challenge** with one seed, a number and one counted attempt, plus a streak with up to 2 freezes (P17).
- [ ] **R10 Spoiler-free share text** with the day number and a bare host link (P14).
- [ ] **R11 Clip-worthy moments** that read with the sound off in 9:16 (P12, P16).
- [ ] **R12 Squint-test readable** colour and shape, on a dark board with saturated pieces (P11).
- [ ] **R13 Characterful pieces**, with the biggest gloop getting a special "boss" face (P10).
- [ ] **R14 Juice everywhere**, including hit-stop (P13).
- [ ] **R15 Layered progression; every run banks progress** (P18).
- [ ] **R16 Short sessions** of 3–8 min (P22).
- [ ] **R17 Long tail** (P18).
- [ ] **R18 Fair and player-favourable** (P19).
- [ ] **R19 No-install web** (P21).
- [ ] **R20 Return reasons** (P17).
- [ ] **R21 Respectful sound**.
- [ ] **R22 Performance**: 60 fps on mid phones.
- [ ] **R23 Personal-best chase bar** visible during every Classic run once a best exists (P8).
- [ ] **R24 First-time discovery celebrations**: the first Big Pop, Huge Pop, Mega Pop and All Clear each get a one-time "First Big Pop!" banner and a bonus (P7).
- [ ] **R25 Signature score effect**: the HUD score visibly catches fire (candy-flame) at combo tier 3+ and on a 2,000+ point move (P12).
- [ ] **R26 Hit-stop**: a 40–70 ms freeze frame on 3+ line clears, Huge/Mega Pops and All Clear (P13).
- [ ] **R27 Classic "beat my score" share**: a text and image card for any run, plus a challenge link (`?beat=<score>&from=<flavour>`) that shows the friend's target as a chase bar on the next run (P15).
- [ ] **R28 Streak celebration**: an animated flame counter tick-up after each counted daily, with bigger milestone animations at 3, 7, 14, 30, 50 and 100 days (P17, Duolingo +1.7% D7).
- [ ] **R29 Results screen built to be screenshotted**: the game-over panel shows the run's biggest gloop drawn with its face and size, the best combo and lines, at a size that reads in a screenshot (P15).
- [ ] **R30 Solve-along clip support**: Daily practice runs (and the Daily after the counted attempt) can show a "replay" of the counted run at 2× speed, so players can screen-record their run. Optional if time runs out (P16).
