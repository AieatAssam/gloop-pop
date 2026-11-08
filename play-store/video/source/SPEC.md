# Gloop Pop promo films: spec

GOAL:    a viewer understands the twist (same colours join, one line pops the whole gloop) and installs from Google Play.
OUTPUT:  HyperFrames, 1920 x 1080, 30 fps, MP4 (H.264). For the Play listing's YouTube promo video.
TIME:    film1 25 s (750 f), film2 30 s (900 f). Music: the game's own track, 120 BPM, media-start 0.225 so beats sit on every 0.5 s.
LOOK:    ground = the game's midnight sky gradient (#1B1036 -> #3A1F5C); ink #FFF7EC, secondary #CDB8F0, accent gold #FFC93C on one word per shot.
         Display: Baloo 2 800, 92 px (headline), 170 px (flavour names, 7 px #2B1530 stroke). Body: Nunito 800, 44 px.
         Product UI: real gameplay recorded from the game (Chrome screencast of debug demo scenes), shown in a 980 px rounded window (radius 48, 10 px #4B2E7A rim) at x 860, y 50; copy column x 150, 640 px wide.
         Logo: the game's own lettered logo (Baloo 2 800, per-letter flavour colours, ink stroke, lip shadow #C76A00).
MOTION:  words land like jelly: scaleX 1.25 / scaleY 0.5 -> 1, elastic.out(1, 0.55), 0.55 s, 60 ms stagger. Camera: power2.inOut 0.5 s moves, linear slow push on hero shots. Logo letters drop with bounce.out.
SHOTS:   film1  hook 0-5 (giant gloop pops, 0.5x) / how 5-11 (gloops build and pop) / modes 11-19 (home, map, 3-star win) / end card 19-25
         film2  meet 0-3.5 / flavours 3.5-14 (punch-in on each of 7 gloops with its name) / merge 14-21 (giant gloop pops) / play 21-26 (home, map) / end card 26-30
BANNED:  mocked-up UI, invented numbers, hype words (AGENTS.md text rules), glow/particles added on top of the footage, logo docked in a corner.
QA:      first frame not empty; every line readable at 360 px; window crops show the board, never the page loading.
