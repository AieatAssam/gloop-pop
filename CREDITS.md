# Credits

The "Changes" lines match `docs/art/style-guide.md` §13.11 and are implemented by `tools/build-audio.mjs`. `src/audio/credits.ts` holds the matching data for the in-game Credits screen.

Every asset below is released under **CC0 1.0 Universal (Public Domain Dedication)**, https://creativecommons.org/publicdomain/zero/1.0/. CC0 needs no attribution. We credit the authors anyway. Each licence was checked on the asset's own page on 25 Oct 2026. Copies of the source files and their licence facts are in `assets-src/audio/`.

Processed sound effects are mono and resampled to 48 kHz for editing. The music loop remains mono at its native 22.05 kHz. The files are encoded as Ogg Opus and MP3. Every sound-effect segment is peak-normalised to −1 dBFS after the edits listed. "Pitch ±N cents" means the speed and pitch were changed together (resampling).

## Music

### Lofi Hip Hop Loop
- **Author:** omfgdude
- **Source:** https://opengameart.org/content/lofi-hip-hop-loop (file `LofiLoop_2.ogg`)
- **Licence:** CC0 1.0, https://creativecommons.org/publicdomain/zero/1.0/ (no attribution required; credited anyway)
- **Changes:**
  - High-pass filter at 40 Hz.
  - Padded at the end with 1,554 samples of silence (70.5 ms), so the loop is 127.957 s.
  - Gain −0.59 dB.
  - The last 250 ms is copied to the start and the first 250 ms to the end, for seamless looping.
  - Encoded as Opus 40 kbps (48 kHz) and as MP3 48 kbps (22.05 kHz), mono.

## Sound effects

### mouth pops - wet - room.flac
- **Author:** cbenci
- **Source:** https://freesound.org/people/cbenci/sounds/325583/ (the HQ preview MP3 from that page)
- **Licence:** CC0 1.0, https://creativecommons.org/publicdomain/zero/1.0/ (no attribution required; credited anyway)
- **Changes:**
  - Six pops cut out (start s, length s): (0.254, 0.141), (1.825, 0.189), (7.713, 0.209), (14.851, 0.147), (16.472, 0.178), (23.428, 0.215).
  - High-pass 200 Hz, 2 ms fade-in, 30 ms fade-out.
  - Used as the gloop pop sounds (`pop1`–`pop6`). In the game they are played back faster or slower.

### Pops - Mouth
- **Author:** JelloApocalypse
- **Source:** https://freesound.org/people/JelloApocalypse/sounds/802606/ (the HQ preview MP3 from that page)
- **Licence:** CC0 1.0, https://creativecommons.org/publicdomain/zero/1.0/ (no attribution required; credited anyway)
- **Changes:**
  - Five 140 ms pieces cut out, starting at 1.715, 2.595, 5.169, 6.933 and 7.586 s.
  - High-pass 150 Hz, 2 ms fade-in, fade-out from 80 ms over 60 ms.
  - Each piece is mixed with a Kenney "impactSoft_medium" sound and a piece of "Slime Squish" (below) into the place sounds `place1`–`place5`.

### Slime Squish
- **Author:** qubodup
- **Source:** https://freesound.org/people/qubodup/sounds/442772/ (the HQ preview MP3 from that page)
- **Licence:** CC0 1.0, https://creativecommons.org/publicdomain/zero/1.0/ (no attribution required; credited anyway)
- **Changes:**
  - For `place1`–`place5`: 90 ms pieces starting at 0, 30, 60, 90 and 120 ms. High-pass 300 Hz, low-pass 3.5 kHz, 3 ms fade-in, fade-out from 30 ms over 60 ms, gain −6 dB, then mixed as above.
  - For `swell`: the first 350 ms. Low-pass 4 kHz, high-pass 200 Hz, reversed, 250 ms exponential fade-in.

### Squish impact
- **Author:** Bertsz
- **Source:** https://freesound.org/people/Bertsz/sounds/500912/ (the HQ preview MP3 from that page)
- **Licence:** CC0 1.0, https://creativecommons.org/publicdomain/zero/1.0/ (no attribution required; credited anyway)
- **Changes:**
  - Cut to the first 450 ms.
  - Low-pass 4 kHz, high-pass 120 Hz, fade-out from 250 ms over 200 ms.
  - Used as `goo`.

### Interface Sounds (1.0)
- **Author:** Kenney (www.kenney.nl)
- **Source:** https://kenney.nl/assets/interface-sounds
- **Licence:** CC0 1.0, https://creativecommons.org/publicdomain/zero/1.0/ (no attribution required; credited anyway)
- **Files used and changes:**
  - `glass_002.ogg` → `tink`: pitch −4 cents, fade-out from 80 ms over 40 ms. In the game it is played back faster or slower to make notes.
  - `click_003.ogg` → `tap`: no change.
  - `confirmation_002.ogg` → `stage`: pitch −200 cents.
  - `confirmation_003.ogg` → `chime`: pitch −200 cents.
  - `confirmation_004.ogg` → `ach`: pitch −400 cents.

### Impact Sounds (1.0)
- **Author:** Kenney (www.kenney.nl)
- **Source:** https://kenney.nl/assets/impact-sounds
- **Licence:** CC0 1.0, https://creativecommons.org/publicdomain/zero/1.0/ (no attribution required; credited anyway)
- **Files used and changes:**
  - `impactSoft_medium_000.ogg`–`impactSoft_medium_004.ogg`: high-pass 60 Hz, +6 dB, tanh soft clipping, −20 dB, then mixed into `place1`–`place5` (one file each).
  - `impactSoft_heavy_000.ogg` → `sub`: first 350 ms, +6 dB, tanh soft clipping, fade-out from 200 ms over 150 ms.

### Casino Audio (1.1)
- **Author:** Kenney (www.kenney.nl)
- **Source:** https://kenney.nl/assets/casino-audio
- **Licence:** CC0 1.0, https://creativecommons.org/publicdomain/zero/1.0/ (no attribution required; credited anyway)
- **Files used and changes:**
  - `card-place-1.ogg`, `card-place-2.ogg`, `card-place-4.ogg` → `deal1`–`deal3`:
    - cut to (start s, length s) (0.095, 0.162), (0.141, 0.114), (0.250, 0.173)
    - high-pass 250 Hz, high shelf −4 dB at 5 kHz, 40 ms fade-out
  - `chips-collide-1.ogg`–`chips-collide-4.ogg` → `coin1`–`coin4`:
    - cut to (0.079, 0.083), (0.027, 0.097), (0.119, 0.077), (0.043, 0.069)
    - high shelf −4 dB at 5 kHz, 30 ms fade-out

### Music Jingles
- **Author:** Kenney (www.kenney.nl)
- **Source:** https://kenney.nl/assets/music-jingles
- **Licence:** CC0 1.0, https://creativecommons.org/publicdomain/zero/1.0/ (no attribution required; credited anyway)
- **Files used and changes:**
  - `Steel jingles/jingles_STEEL10.ogg` → `best`: pitch +484 cents.
  - `Pizzicato jingles/jingles_PIZZI10.ogg` → `level`: the first 15 ms removed, pitch +496 cents.

## Code, art and synthesised sound
Code, art and synth sounds were made for Gloop Pop. The game's graphics and all synthesised sounds and music layers (the ladder instrument body, sweeps, pads and fallbacks) are original. Fonts: Baloo 2 and Nunito, via Fontsource ([SIL Open Font License 1.1](https://openfontlicense.org/)).
