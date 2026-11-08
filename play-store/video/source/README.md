# Promo video sources

Two HyperFrames films built from real gameplay. Rendered files: `../gloop-pop-promo-one-piece.mp4` (25 s) and `../gloop-pop-promo-meet-the-gloops.mp4` (30 s), 1920×1080, 30 fps, with the game's own music.

Rebuild:

1. Start the dev server (`npx vite --port 5179`) and record footage with `record-footage.mjs` (Chrome DevTools screencast → 30 fps MP4):
   `node record-footage.mjs "http://localhost:5179/gloop-pop/?debug=1&overlay=0&demo=mega" 14 mega.mp4`
   Clips used: `demo=mega` (14 s), `demo=missions` → home (6 s), `demo=adventure-map&frontier=41` → map (6 s), `demo=adventure-win&stars=3` → win (6 s), and `demo=board` at `960 960 2` → board (8 s).
2. `npx hyperframes init <film> --skip-skills`, copy the clips to `<film>/assets/footage/`, `public/audio/music.*.mp3` to `assets/audio/music.mp3`, and the Baloo 2 / Nunito 800 woff2 files from `node_modules/@fontsource` to `assets/fonts/`.
3. `python3 gen.py` (expects `film1-one-piece/` and `film2-meet-the-gloops/` beside it), then `npx hyperframes check`, `npx hyperframes preview` to edit, and `npx hyperframes render -q delivery`.

See `SPEC.md` for the look, timing and shot list.
