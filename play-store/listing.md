# Google Play store listing: Gloop Pop

Copy-paste source for Play Console → Grow → Store presence → Main store listing. Limits are Play's. Wording follows `docs/design.md` §1 and AGENTS.md text rules (plain words, no hype). Do not name other games in the listing.

## App name (max 30)

```
Gloop Pop
```

## Short description (max 80)

```
Drag jelly blocks to fill rows. Same colours join up and pop all at once.
```

## Full description (max 4000)

```
Drag jelly blocks onto the board to fill rows, and when same-colour jellies touch they join into one big gloop that pops all at once.

HOW TO PLAY
• Drag a piece from the tray onto the 8×8 board.
• Fill a row or a column to clear it.
• Jellies of the same flavour stick together into one gloop with one face.
• Clear a line through any part of a gloop and the whole gloop pops.
• Build a giant gloop, then pop it for a Big Pop, Huge Pop or Mega Pop.
• No timer and no rotation. Plan with the three pieces you can see.

MODES
• Classic: endless. How long can you last?
• Daily: the same board for everyone today.
• Adventure: 120 levels with goals. Win up to 3 stars.
• Zen: no game over. Relax and pop.
• Expert: bigger pieces, all 7 flavours, no rescue.

MORE TO DO
• Daily missions and a weekly goal.
• Achievements, levels and themes to unlock.
• Combos with rising sound and haptics.

PLAYS OFFLINE
• No account, no ads, no in-app purchases.
• Your progress is saved on your device.
```

## Categorisation

- App or game: **Game**
- Category: **Puzzle**
- Tags (pick up to 5 in Console, closest labels): Block puzzle, Merge, Offline, Casual, Stylized / Cute
- Contains ads: **No**
- In-app purchases: **No**

## Contact details

- Email: _set in Console (required)_
- Website: https://aieatassam.github.io/gloop-pop/
- Privacy policy: https://aieatassam.github.io/gloop-pop/privacy.html (page source: `public/privacy.html`, published with the web build)

## Graphics (`play-store/graphics/`, `play-store/screenshots/`)

| Asset | File | Play requirement |
|---|---|---|
| App icon | `graphics/icon-512.png` | 512×512 PNG, ≤1 MB |
| Feature graphic | `graphics/feature-graphic-1024x500.jpg` | 1024×500 JPEG/24-bit PNG |
| Phone screenshots (6) | `screenshots/phone/*.png` | 1080×1920, 2–8 required |
| 10-inch tablet screenshots (2) | `screenshots/tablet-10in/*.png` | 2560×1600 landscape |
| Promo video | `video/gloop-pop-promo-one-piece.mp4` (25 s), `video/gloop-pop-promo-meet-the-gloops.mp4` (30 s) | Upload one to YouTube (public or unlisted, ads off), paste its URL in "YouTube video" |

Screenshots were captured from the dev build with debug scenes (`?debug=1&overlay=0&…`) in headless Chrome at 540×960 @2× (phone) and 1280×800 @2× (tablet): `save=veteran&autoplay=1&speed=fast`, `demo=mega`, `save=veteran` home, `demo=adventure-map&frontier=41`, `demo=level-card&level=24&streak=3&coins=120&boosters=1,0,5`, `demo=adventure-win&stars=3`. Re-take after visual changes. 7-inch tablet screenshots are optional; the 10-inch set can be reused.

## App content declarations (Policy → App content)

- **Privacy policy:** URL above.
- **Ads:** No ads.
- **App access:** All functionality available without special access.
- **Content rating (IARC):** Puzzle game; no violence, no user interaction, no sharing of location, no purchases, no gambling. Expected rating: Everyone / PEGI 3 / IARC 3+.
- **Target audience:** All ages (5 and under, 6–8, 9–12, 13–15, 16–17, 18+). This puts the app under the Families policy: no ads, no ad SDKs or advertising ID, no data collected, and links that leave the Android app (Settings → Credits) sit behind an adult check (a multiplication question). Sharing uses the system share sheet only when the player taps Share.
- **Advertising ID:** No. The app requests only `INTERNET` and `VIBRATE`.
- **Data safety:** No data collected, no data shared. The app has no network calls, analytics or accounts. Saves stay on the device; Android Auto Backup may copy them to the user's own Google account backup, which is not "collection" by the developer. Answer "No" to "Does your app collect or share any of the required user data types?".
- **Government app / financial features / health:** No.
- **News app:** No.

## Release notes template (max 500 per language)

```
First release of Gloop Pop on Android.
```
