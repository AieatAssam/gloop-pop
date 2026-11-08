"""Generates both Gloop Pop promo HyperFrames projects (index.html + compositions/*.html).
Edit the FILMS table, then: python3 gen.py"""
import json, os

ROOT = os.path.dirname(os.path.abspath(__file__))
C = dict(skyTop="#1B1036", skyBottom="#3A1F5C", ink="#FFF7EC", sub="#CDB8F0", gold="#FFC93C",
         frame="#2A1748", frameLight="#4B2E7A", faceInk="#2B1530", lip="#C76A00",
         cherry="#FF4A5C", orange="#FF9533", lemon="#FFD43B", apple="#5ED44F",
         blueberry="#3DA5FF", grape="#9D6BFF", bubblegum="#FF6FC8")
LOGO_COLS = ["cherry", "orange", "lemon", "apple", "blueberry", "grape", "bubblegum"]

BASE_CSS = f"""
@font-face {{ font-family: 'Baloo 2'; font-weight: 800; src: url('assets/fonts/baloo-2-latin-800-normal.woff2'); }}
@font-face {{ font-family: 'Nunito'; font-weight: 800; src: url('assets/fonts/nunito-latin-800-normal.woff2'); }}
#root {{ position: absolute; inset: 0; overflow: hidden; background: linear-gradient(180deg, {C['skyTop']} 0%, {C['skyBottom']} 100%); }}
.copy {{ position: absolute; left: 150px; top: 0; bottom: 0; width: 640px; display: flex; flex-direction: column; justify-content: center; gap: 28px; }}
.h {{ font: 800 92px/0.98 'Baloo 2'; color: {C['ink']}; letter-spacing: -0.01em; }}
.s {{ font: 800 44px/1.15 'Nunito'; color: {C['sub']}; }}
.w {{ display: inline-block; transform-origin: 50% 90%; }}
.gold {{ color: {C['gold']}; }}
.win {{ position: absolute; left: 860px; top: 50px; width: 980px; height: 980px; border-radius: 48px; overflow: hidden;
        background: {C['frame']}; box-shadow: 0 0 0 10px {C['frameLight']}, 0 24px 0 0 rgba(10,4,24,0.45); }}
.win video {{ position: absolute; left: 0; top: 0; }}
"""

def words(text, cls="w"):
    out = []
    for part in text.split(" "):
        gold = part.startswith("*")
        part = part.lstrip("*")
        out.append(f'<span class="{cls}{" gold" if gold else ""}">{part}</span>')
    return " ".join(out)

def scene(sid, dur, body, script, extra_css=""):
    return f"""<template>
  <style>{BASE_CSS}{extra_css}</style>
  <div id="root" data-composition-id="{sid}" data-width="1920" data-height="1080">
{body}
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
{script}
    window.__timelines["{sid}"] = tl;
  </script>
</template>
"""

def jelly(sel, at, stagger=0.06):
    # jelly-sweet landing: squashed and small -> overshoot -> rest (springy, never on opacity alone)
    return (f'    tl.fromTo("{sel}", {{ opacity: 0, scaleX: 1.25, scaleY: 0.5, y: 18 }}, '
            f'{{ opacity: 1, scaleX: 1, scaleY: 1, y: 0, duration: 0.55, ease: "elastic.out(1, 0.55)", stagger: {stagger} }}, {at});\n')

def window_clip(sid, src, start, dur, media_start, rate=1.0, z=1):
    rate_attr = "" if rate == 1.0 else f'data-playback-rate="{rate}" '
    return (f'<video id="{sid}" class="clip" src="assets/footage/{src}" muted playsinline '
            f'data-start="{start}" data-duration="{dur}" data-media-start="{media_start}" {rate_attr}data-track-index="{z}"></video>')

def win(*videos):
    return '    <div class="win" data-layout-allow-overflow>' + "".join(videos) + '</div>'

def cam(vid, at, x, y, s, w=1920, h=1080, move=0.0, ease="power2.inOut"):
    """Place footage so source point (x, y) sits at the window centre at scale s."""
    tx, ty = 490 - x * s, 490 - y * s
    if move == 0:
        return f'    tl.set("#{vid}", {{ width: {w}, height: {h}, transformOrigin: "0 0", x: {tx:.1f}, y: {ty:.1f}, scale: {s} }}, {at});\n'
    return f'    tl.to("#{vid}", {{ x: {tx:.1f}, y: {ty:.1f}, scale: {s}, duration: {move}, ease: "{ease}" }}, {at});\n'

def copy_block(lines):
    """lines: list of (id, cls, text). Returns markup."""
    inner = "\n".join(f'      <div id="{i}" class="{c}">{words(t)}</div>' for i, c, t in lines)
    return f'    <div class="copy">\n{inner}\n    </div>'

def logo(sid):
    spans, k = [], 0
    for ch in "Gloop Pop":
        if ch == " ":
            spans.append('<span class="gap"></span>')
        else:
            spans.append(f'<span class="L" style="color:{C[LOGO_COLS[k % 7]]}">{ch}</span>'); k += 1
    return "".join(spans)

END_CSS = f"""
.end {{ position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 36px; }}
.logo {{ font: 800 230px/1 'Baloo 2'; transform: rotate(-2deg); -webkit-text-stroke: 9px {C['faceInk']}; paint-order: stroke fill;
         text-shadow: 0 12px 0 {C['lip']}; white-space: nowrap; }}
.logo .L {{ display: inline-block; transform-origin: 50% 100%; }}
.logo .gap {{ display: inline-block; width: 0.3em; }}
.cta {{ font: 800 60px/1 'Nunito'; color: {C['ink']}; background: linear-gradient(180deg, #FFD25C, #FF9F1C); color: #3A1A00;
        padding: 26px 56px; border-radius: 999px; box-shadow: 0 10px 0 {C['lip']}; }}
.facts {{ font: 800 40px/1 'Nunito'; color: {C['sub']}; }}
"""

def end_scene(sid, dur):
    body = f"""    <div class="end">
      <div id="{sid}-logo" class="logo">{logo(sid)}</div>
      <div id="{sid}-cta" class="cta">Free on Google Play</div>
      <div id="{sid}-facts" class="facts">No ads. No account. Plays offline.</div>
    </div>"""
    script = (f'    tl.fromTo("#{sid}-logo .L", {{ opacity: 0, y: -260, scaleY: 1.3, scaleX: 0.8 }}, '
              f'{{ opacity: 1, y: 0, scaleY: 1, scaleX: 1, duration: 0.7, ease: "bounce.out", stagger: 0.07 }}, 0.15);\n'
              + jelly(f"#{sid}-cta", 1.5) + jelly(f"#{sid}-facts", 1.9))
    return scene(sid, dur, body, script, END_CSS)

def index(scenes, total, music_fade_at):
    hosts = "\n".join(
        f'      <div id="{sid}" data-composition-id="{sid}" data-composition-src="compositions/{sid}.html" '
        f'data-start="{st}" data-duration="{d}" data-track-index="1" data-track-kind="graphics" data-width="1920" data-height="1080"></div>'
        for sid, st, d in scenes)
    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: 1920px; height: 1080px; overflow: hidden; background: {C['skyTop']}; }}
      #ground {{ position: absolute; inset: 0; background: linear-gradient(180deg, {C['skyTop']} 0%, {C['skyBottom']} 100%); }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{total}" data-width="1920" data-height="1080">
      <div id="ground"></div>
{hosts}
      <audio id="music" class="clip" src="assets/audio/music.mp3" data-start="0" data-duration="{total}" data-media-start="0.225" data-volume="0.9" data-fade-out="{total - music_fade_at}" data-track-index="5"></audio>
    </div>
    <script>
      const tl = gsap.timeline({{ paused: true }});
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
"""

def write(project, files):
    for name, text in files.items():
        p = os.path.join(ROOT, project, name)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        open(p, "w").write(text)

# ---------------- Film 1: One piece, half the board (25 s) ----------------
# Gameplay footage is 1920x1080 (landscape layout); the board spans x 582-1338, y 162-918, centre (960, 540).
f1 = {}
f1["compositions/hook.html"] = scene("hook", 5,
    win(window_clip("hook-v", "mega.mp4", 0, 5, 0.75, 0.5)) + "\n" +
    copy_block([("hook-a", "h", "One piece."), ("hook-b", "h", "Half the board *pops.")]),
    cam("hook-v", 0, 960, 540, 1.25) + cam("hook-v", 0, 960, 520, 1.42, move=4.9, ease="none") +
    jelly("#hook-a .w", 0.25) + jelly("#hook-b .w", 1.1))
f1["compositions/how.html"] = scene("how", 6,
    win(window_clip("how-v", "mega.mp4", 0, 6, 2.3)) + "\n" +
    copy_block([("how-a", "h", "Same colours stick together."), ("how-b", "s", "Clear a line through a gloop."), ("how-c", "s", "The *whole gloop pops.")]),
    cam("how-v", 0, 960, 540, 1.28) + jelly("#how-a .w", 0.2) + jelly("#how-b .w", 2.0, 0.04) + jelly("#how-c .w", 3.4, 0.04))
f1["compositions/modes.html"] = scene("modes", 8,
    win(window_clip("modes-home", "home.mp4", 0, 2.5, 3.0), window_clip("modes-map", "map.mp4", 2.5, 2.7, 2.5, z=2),
        window_clip("modes-win", "win.mp4", 5.2, 2.8, 2.0, z=3)) + "\n" +
    copy_block([("modes-a", "h", "Five ways to play."), ("modes-b", "s", "Classic, Daily, Adventure, Zen, Expert."),
                ("modes-c", "s", "*120 Adventure levels."), ("modes-d", "s", "Win up to *3 stars.")]),
    cam("modes-home", 0, 960, 470, 1.0) + cam("modes-map", 2.5, 960, 560, 1.12) + cam("modes-win", 5.2, 960, 560, 1.3) +
    jelly("#modes-a .w", 0.15) + jelly("#modes-b .w", 0.8, 0.04) + jelly("#modes-c .w", 2.7, 0.04) + jelly("#modes-d .w", 5.4, 0.04))
f1["compositions/endcard.html"] = end_scene("endcard", 6)
f1["index.html"] = index([("hook", 0, 5), ("how", 5, 6), ("modes", 11, 8), ("endcard", 19, 6)], 25, 23.5)
write("film1-one-piece", f1)

# ---------------- Film 2: Meet the gloops (30 s) ----------------
# board.mp4 is 1920x1920 (960 css px @2x). Gloop centres in source px.
G = [("Cherry", "cherry", 603, 742), ("Orange", "orange", 1155, 645), ("Lemon", "lemon", 855, 855),
     ("Apple", "apple", 1314, 1035), ("Blueberry", "blueberry", 1110, 1110), ("Grape", "grape", 709, 1199),
     ("Bubblegum", "bubblegum", 1215, 1314)]
f2 = {}
f2["compositions/meet.html"] = scene("meet", 3.5,
    win(window_clip("meet-v", "board.mp4", 0, 3.5, 1.0)) + "\n" + copy_block([("meet-a", "h", "Meet the *gloops."), ("meet-b", "s", "Jelly sweets with faces.")]),
    cam("meet-v", 0, 960, 1000, 0.62, 1920, 1920) + cam("meet-v", 0, 960, 1000, 0.7, 1920, 1920, move=3.4, ease="none") +
    jelly("#meet-a .w", 0.2) + jelly("#meet-b .w", 1.2, 0.04))
names = "\n".join(f'      <div id="fl-{k}" class="fl" style="color:{C[k]}">{n}</div>' for n, k, _, _ in G)
fl_script = cam("fl-v", 0, 960, 1000, 0.7, 1920, 1920)
for i, (n, k, x, y) in enumerate(G):
    t = i * 1.5
    fl_script += cam("fl-v", t, x, y, 1.75, 1920, 1920, move=0.5)
    fl_script += (f'    tl.fromTo("#fl-{k}", {{ opacity: 0, scaleX: 1.3, scaleY: 0.45 }}, {{ opacity: 1, scaleX: 1, scaleY: 1, duration: 0.55, ease: "elastic.out(1, 0.5)" }}, {t + 0.35});\n'
                  f'    tl.to("#fl-{k}", {{ opacity: 0, duration: 0.15, ease: "power1.in" }}, {t + 1.45 if i < 6 else 10.4});\n')
f2["compositions/flavours.html"] = scene("flavours", 10.5,
    win(window_clip("fl-v", "board.mp4", 0, 10.5, 1.0)) + f"""
    <div class="copy"><div class="s">Seven flavours.</div><div class="stack">
{names}
    </div></div>""", fl_script,
    ".stack { position: relative; height: 150px; } .fl { position: absolute; left: 0; top: 0; font: 800 128px/1 'Baloo 2'; "
    f"-webkit-text-stroke: 7px {C['faceInk']}; paint-order: stroke fill; transform-origin: 30% 90%; opacity: 0; }}")
f2["compositions/merge.html"] = scene("merge", 7,
    win(window_clip("merge-v", "mega.mp4", 0, 7, 0.75, 0.5)) + "\n" +
    copy_block([("merge-a", "h", "Same flavours stick together."), ("merge-b", "h", "Clear a line. The whole gloop *pops.")]),
    cam("merge-v", 0, 960, 540, 1.25) + cam("merge-v", 0, 960, 520, 1.4, move=6.9, ease="none") +
    jelly("#merge-a .w", 0.2) + jelly("#merge-b .w", 1.6, 0.05))
f2["compositions/play.html"] = scene("play", 5,
    win(window_clip("play-home", "home.mp4", 0, 2.5, 3.0), window_clip("play-map", "map.mp4", 2.5, 2.5, 2.5, z=2)) + "\n" +
    copy_block([("play-a", "h", "Play your way."), ("play-b", "s", "Classic, Daily, Adventure, Zen, Expert."), ("play-c", "s", "*120 levels with goals.")]),
    cam("play-home", 0, 960, 470, 1.0) + cam("play-map", 2.5, 960, 560, 1.12) +
    jelly("#play-a .w", 0.15) + jelly("#play-b .w", 0.7, 0.04) + jelly("#play-c .w", 2.7, 0.04))
f2["compositions/endcard.html"] = end_scene("endcard", 4)
f2["index.html"] = index([("meet", 0, 3.5), ("flavours", 3.5, 10.5), ("merge", 14, 7), ("play", 21, 5), ("endcard", 26, 4)], 30, 28.5)
write("film2-meet-the-gloops", f2)
print("ok")
