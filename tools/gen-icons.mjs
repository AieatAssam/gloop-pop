import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRaster } from './raster.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const defaultOutput = join(root, '..', 'public');

export async function generateIcons(outputDirectory = defaultOutput) {
  const palette = JSON.parse(await readFile(join(root, '..', 'docs/art/palette.json'), 'utf8'));
  await mkdir(outputDirectory, { recursive: true });
  const midnight = palette.theme.midnight;
  const colors = { sky: midnight.skyTop, skyLow: midnight.skyBottom, ink: palette.face.ink, cherry: palette.flavour.cherry, lemon: palette.flavour.lemon, orange: palette.flavour.orange, blueberry: palette.flavour.blueberry, grape: palette.flavour.grape, bubblegum: palette.flavour.bubblegum, apple: palette.flavour.apple, white: palette.face.eyeWhite, blush: palette.face.blush, mouth: palette.face.mouthInside, gold: palette.ui.gold, topperStem: palette.topper.stem, topperLeaf: palette.topper.leaf, topperLeafDark: palette.topper.leafDark };
  for (const size of [192, 512]) await writePNG(join(outputDirectory, `icon-${size}.png`), renderAppIcon(size, colors, false));
  await writePNG(join(outputDirectory, 'icon-maskable-512.png'), renderAppIcon(512, colors, true));
  await writePNG(join(outputDirectory, 'apple-touch-icon.png'), renderAppIcon(180, colors, false));
  await writePNG(join(outputDirectory, 'og.png'), renderOgImage(colors));
  await writeFile(join(outputDirectory, 'favicon.svg'), favicon(colors));
  await writeFile(join(outputDirectory, 'manifest.webmanifest'), `${JSON.stringify({
    name: 'Gloop Pop', short_name: 'Gloop Pop', start_url: '.', scope: '.', display: 'standalone', orientation: 'portrait',
    background_color: midnight.skyTop, theme_color: midnight.skyTop,
    icons: [
      { src: './icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: './icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: './icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }, null, 2)}\n`);
}

function renderAppIcon(size, c, maskable) {
  const image = createRaster(size, size); const safe = maskable ? size * .2 : size * .08;
  image.linearGradient(0, 0, size, size, [[0,c.sky],[1,c.skyLow]]);
  for (let i = 0; i < 18; i += 1) image.fillCircle((i * 73 + 25) % size, (i * 47 + 12) % size, size * .006 + 1, '#FFFFFF99');
  drawGloop(image, size / 2, size * .56, size - 2 * safe, size - 2 * safe, c, 'cherry');
  return image.encodePNG();
}

function drawGloop(image, cx, cy, width, height, c, flavour = 'lemon') {
  const bodyWidth = width * .72; const bodyHeight = height * .62; const x = cx - bodyWidth / 2; const y = cy - bodyHeight / 2;
  image.fillEllipse(cx, y + bodyHeight * .96, bodyWidth * .54, bodyHeight * .12, '#09051C77');
  image.fillRoundRect(x - width * .025, y + height * .02, bodyWidth + width * .05, bodyHeight + height * .02, width * .17, c[flavour].outline);
  image.fillGradientRoundRect(x, y, bodyWidth, bodyHeight, width * .16, [[0,c[flavour].light],[.38,c[flavour].base],[1,c[flavour].dark]]);
  image.fillEllipse(cx - bodyWidth * .13, y + bodyHeight * .2, bodyWidth * .27, bodyHeight * .075, '#FFFFFF99', -.16);
  image.fillEllipse(cx + bodyWidth * .19, y + bodyHeight * .3, bodyWidth * .1, bodyHeight * .03, '#FFFFFF66', -.16);
  // spec-note: the app icons use a broad highlight plus the palette's three gloop tones to preserve the glossy jelly read at 64 px.
  image.fillEllipse(cx - bodyWidth * .19, cy + bodyHeight * .13, bodyWidth * .09, bodyHeight * .045, c.blush);
  image.fillEllipse(cx + bodyWidth * .19, cy + bodyHeight * .13, bodyWidth * .09, bodyHeight * .045, c.blush);
  const eyeY = cy - bodyHeight * .01; const eyeRadius = bodyWidth * .065;
  // SG §6.2 face: ink oval eyes with a catchlight, the same face the game draws.
  for (const eyeX of [cx - bodyWidth * .15, cx + bodyWidth * .15]) {
    image.fillEllipse(eyeX, eyeY, eyeRadius * .8, eyeRadius * 1.02, c.ink);
    image.fillCircle(eyeX - eyeRadius * .26, eyeY - eyeRadius * .36, eyeRadius * .3, c.white);
  }
  image.strokeCapsule(cx - bodyWidth * .10, cy + bodyHeight * .15, cx, cy + bodyHeight * .23, width * .025, c.mouth);
  image.strokeCapsule(cx, cy + bodyHeight * .23, cx + bodyWidth * .10, cy + bodyHeight * .15, width * .025, c.mouth);
  drawFlavourTopper(image, cx, y, width, height, c, 'cherry');
}

function renderOgImage(c) {
  const image = createRaster(1200, 630);
  image.linearGradient(0, 0, 1200, 630, [[0,c.sky],[1,c.skyLow]]);
  for (let i = 0; i < 50; i += 1) image.fillCircle((i * 167 + 31) % 1200, (i * 83 + 19) % 630, i % 7 === 0 ? 2.2 : 1.2, '#FFFFFFAA');
  image.fillEllipse(915, 320, 290, 240, '#FFFFFF16'); image.fillEllipse(915, 320, 220, 180, '#FFFFFF13');
  // Socket tray and separate glossy groups, kept large enough to read in a 64 px preview.
  image.fillRoundRect(52, 80, 492, 492, 36, '#160C2D'); image.fillRoundRect(64, 92, 468, 468, 28, '#3C2466');
  const cell = 51; const gap = 6; const bx = 82; const by = 110;
  for (let row = 0; row < 8; row += 1) for (let col = 0; col < 8; col += 1) {
    const x = bx + col * (cell + gap); const y = by + row * (cell + gap);
    image.fillRoundRect(x, y + 3, cell, cell, 10, '#21143E'); image.fillRoundRect(x + 2, y, cell - 4, cell - 5, 9, '#51317D');
  }
  // Each gloop is one merged jelly body with one face (design §2.2), not a set of loose tiles.
  const span = (n) => n * cell + (n - 1) * gap;
  const boardGloop = (row, col, w, h, flavour) => {
    const colors = c[flavour]; const x = bx + col * (cell + gap); const y = by + row * (cell + gap); const bw = span(w); const bh = span(h); const k = Math.min(w, h);
    image.fillRoundRect(x, y + 4, bw, bh, 16, '#0A05187A');
    image.fillRoundRect(x, y, bw, bh, 16, colors.outline);
    image.fillGradientRoundRect(x + 3, y + 3, bw - 6, bh - 7, 14, [[0,colors.light],[.38,colors.base],[1,colors.dark]]);
    for (let i = 0; i < w; i += 1) { const sx = x + i * (cell + gap); image.fillEllipse(sx + cell * .34, y + cell * .24, cell * .17, cell * .07, '#FFFFFFAA', -.3); image.fillCircle(sx + cell * .6, y + cell * .19, cell * .045, '#FFFFFFDD'); }
    const f = .78 * k * cell; const fx = x + bw / 2; const fy = y + bh / 2 - f * .04;
    for (const side of [-1, 1]) { image.fillEllipse(fx + side * f * .2, fy - f * .06, f * .075, f * .095, c.ink); image.fillCircle(fx + side * f * .2 - f * .025, fy - f * .095, f * .028, c.white); image.fillEllipse(fx + side * f * .31, fy + f * .1, f * .08, f * .05, c.blush); }
    image.strokeCapsule(fx - f * .085, fy + f * .1, fx, fy + f * .16, f * .045, c.ink); image.strokeCapsule(fx, fy + f * .16, fx + f * .085, fy + f * .1, f * .045, c.ink);
    drawFlavourTopper(image, fx, y, bw, bh, c, flavour);
  };
  boardGloop(0, 0, 2, 2, 'cherry'); boardGloop(0, 3, 2, 1, 'grape'); boardGloop(0, 7, 1, 2, 'bubblegum'); boardGloop(2, 5, 2, 2, 'blueberry'); boardGloop(3, 2, 3, 3, 'lemon'); boardGloop(6, 5, 3, 1, 'apple'); boardGloop(7, 0, 2, 1, 'orange');
  drawLogo(image, 880, 132, c);
  drawGloop(image, 855, 423, 325, 325, c, 'cherry');
  image.fillEllipse(855, 572, 180, 14, '#10082466');
  return image.encodePNG();
}

function drawFlavourTopper(image, cx, top, width, height, c, flavour) {
  const stemTop = top - height * .08; const stemBase = top + height * .06;
  if (flavour === 'bubblegum') { image.fillCircle(cx, stemTop - height * .025, width * .075, c.bubblegum.light); image.fillCircle(cx - width * .02, stemTop - height * .045, width * .018, '#FFFFFFCC'); return; }
  if (flavour === 'blueberry') {
    const points = []; for (let i = 0; i < 10; i += 1) { const angle = -Math.PI / 2 + i * Math.PI / 5; const radius = width * (i % 2 ? .035 : .075); points.push([cx + Math.cos(angle) * radius, stemTop + Math.sin(angle) * radius]); }
    image.fillPolygon(points, c.blueberry.dark); image.strokeCapsule(cx, stemTop + width * .04, cx, stemBase, width * .022, c.topperStem); return;
  }
  image.strokeCapsule(cx, stemBase, cx - width * .025, stemTop, width * .035, c.topperStem);
  if (flavour === 'apple') {
    image.fillEllipse(cx - width * .055, stemTop + height * .015, width * .07, height * .035, c.topperLeaf, -.55);
    image.fillEllipse(cx + width * .06, stemTop, width * .065, height * .032, c.topperLeaf, .45);
  } else if (flavour === 'grape') {
    image.strokeCapsule(cx - width * .02, stemTop, cx + width * .07, stemTop - height * .055, width * .02, c.topperLeafDark);
    image.fillCircle(cx + width * .075, stemTop - height * .06, width * .035, c.grape.light);
  } else if (flavour === 'lemon') {
    image.fillEllipse(cx + width * .045, stemTop, width * .11, height * .035, c.topperLeaf, -.4);
    image.strokeCapsule(cx - width * .02, stemTop + height * .005, cx + width * .09, stemTop - height * .01, width * .009, c.topperLeafDark);
  } else if (flavour === 'orange') {
    image.fillEllipse(cx - width * .055, stemTop, width * .075, height * .035, c.topperLeaf, -.6);
    image.fillEllipse(cx + width * .055, stemTop + height * .005, width * .075, height * .035, c.topperLeaf, .55);
  } else {
    image.fillEllipse(cx + width * .075, stemTop - height * .015, width * .11, height * .045, c.topperLeaf, -.35);
    image.strokeCapsule(cx + width * .015, stemTop - height * .015, cx + width * .13, stemTop - height * .02, width * .01, c.topperLeafDark);
  }
}

// Rounded "Gloop Pop" lettering built from capsule strokes (SG §10 logo: each letter a flavour, ink outline).
function drawLogo(image, centreX, base, c) {
  const colours = [c.cherry.base, c.orange.base, c.lemon.base, c.apple.base, c.blueberry.base, c.grape.base, c.bubblegum.base, c.cherry.light];
  const r = 22; const capH = 80; const gap = 16;
  const arc = (cx, cy, radius, a0, a1) => { const segs = []; const steps = Math.max(6, Math.ceil(Math.abs(a1 - a0) / 0.16)); for (let i = 0; i < steps; i += 1) { const t0 = a0 + (a1 - a0) * i / steps; const t1 = a0 + (a1 - a0) * (i + 1) / steps; segs.push([cx + Math.cos(t0) * radius, cy + Math.sin(t0) * radius, cx + Math.cos(t1) * radius, cy + Math.sin(t1) * radius]); } return segs; };
  const glyph = { G: (x) => { const R = 34; const cx = x + R; const cy = base - capH / 2 + 4; return { w: R * 2, segs: [...arc(cx, cy, R, -Math.PI * 0.28, Math.PI * 2 - 0.02 - Math.PI * 0.0), [cx + R, cy, cx + R * 0.3, cy]] }; },
    l: (x) => ({ w: 0, segs: [[x, base - capH, x, base]] }),
    o: (x) => ({ w: r * 2, segs: arc(x + r, base - r, r, 0, Math.PI * 2) }),
    p: (x) => ({ w: r * 2, segs: [[x, base - r * 2, x, base + 26], ...arc(x + r, base - r, r, 0, Math.PI * 2)] }),
    P: (x) => ({ w: 40, segs: [[x, base - capH, x, base], [x, base - capH, x + 18, base - capH], [x, base - 36, x + 18, base - 36], ...arc(x + 18, base - 58, 22, -Math.PI / 2, Math.PI / 2)] }) };
  const word = ['G', 'l', 'o', 'o', 'p', ' ', 'P', 'o', 'p'];
  const measure = word.reduce((sum, ch) => sum + (ch === ' ' ? 26 : glyph[ch](0).w + gap), -gap);
  let x = centreX - measure / 2; let colour = 0; const drawn = [];
  for (const ch of word) { if (ch === ' ') { x += 26; continue; } const g = glyph[ch](x); drawn.push([g.segs, colours[colour % colours.length]]); colour += 1; x += g.w + gap; }
  for (const [segs] of drawn) for (const [x1, y1, x2, y2] of segs) image.strokeCapsule(x1, y1 + 4, x2, y2 + 4, 34, c.ink);
  for (const [segs] of drawn) for (const [x1, y1, x2, y2] of segs) image.strokeCapsule(x1, y1, x2, y2, 32, c.ink);
  for (const [segs, col] of drawn) for (const [x1, y1, x2, y2] of segs) image.strokeCapsule(x1, y1, x2, y2, 20, col);
}

function favicon(c) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="j" x2="0" y2="1"><stop stop-color="${c.cherry.light}"/><stop offset=".48" stop-color="${c.cherry.base}"/><stop offset="1" stop-color="${c.cherry.dark}"/></linearGradient><linearGradient id="b" x2="0" y2="1"><stop stop-color="${c.sky}"/><stop offset="1" stop-color="${c.skyLow}"/></linearGradient></defs><rect width="64" height="64" rx="15" fill="url(#b)"/><path d="M31 21c1-7 7-10 12-9-1 6-5 10-12 10" fill="${c.topperLeaf}"/><path d="M30 25c0-8 4-11 7-14" fill="none" stroke="${c.topperStem}" stroke-width="3" stroke-linecap="round"/><rect x="11" y="20" width="42" height="34" rx="13" fill="${c.cherry.outline}"/><rect x="13" y="18" width="38" height="34" rx="12" fill="url(#j)"/><ellipse cx="26" cy="24" rx="9" ry="3" fill="#ffffff99"/><ellipse cx="25" cy="35" rx="2.4" ry="3.3" fill="${c.white}"/><ellipse cx="39" cy="35" rx="2.4" ry="3.3" fill="${c.white}"/><circle cx="25.7" cy="36" r="1.3" fill="${c.ink}"/><circle cx="39.3" cy="36" r="1.3" fill="${c.ink}"/><path d="M28 42q4 5 8 0" fill="none" stroke="${c.mouth}" stroke-width="2.3" stroke-linecap="round"/></svg>`;
}

async function writePNG(path, bytes) { await writeFile(path, bytes); }

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await generateIcons();
