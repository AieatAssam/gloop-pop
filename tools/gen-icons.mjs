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
  const colors = { sky: midnight.skyTop, skyLow: midnight.skyBottom, ink: palette.face.ink, cherry: palette.flavour.cherry, lemon: palette.flavour.lemon, orange: palette.flavour.orange, blueberry: palette.flavour.blueberry, grape: palette.flavour.grape, bubblegum: palette.flavour.bubblegum, apple: palette.flavour.apple, white: palette.face.eyeWhite, blush: palette.face.blush, mouth: palette.face.mouthInside, gold: palette.ui.gold, topperStem: palette.topper.stem, topperLeaf: palette.topper.leaf };
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
  for (const eyeX of [cx - bodyWidth * .15, cx + bodyWidth * .15]) {
    image.fillEllipse(eyeX, eyeY, eyeRadius * 1.12, eyeRadius * 1.35, c.white);
    image.fillCircle(eyeX, eyeY + eyeRadius * .15, eyeRadius * .64, c.ink);
    image.fillCircle(eyeX - eyeRadius * .2, eyeY - eyeRadius * .18, eyeRadius * .2, c.white);
  }
  image.strokeCapsule(cx - bodyWidth * .10, cy + bodyHeight * .15, cx, cy + bodyHeight * .23, width * .025, c.mouth);
  image.strokeCapsule(cx, cy + bodyHeight * .23, cx + bodyWidth * .10, cy + bodyHeight * .15, width * .025, c.mouth);
  image.strokeCapsule(cx - width * .02, y + height * .02, cx + width * .01, y - height * .08, width * .045, c.topperStem);
  image.fillEllipse(cx + width * .09, y - height * .075, width * .11, height * .045, c.topperLeaf, -.35);
  image.fillEllipse(cx + width * .08, y - height * .09, width * .07, height * .018, '#FFFFFF99', -.35);
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
  const boardGloop = (row, col, flavour) => {
    const colors = c[flavour]; const x = bx + col * (cell + gap); const y = by + row * (cell + gap);
    image.fillRoundRect(x + 1, y + 1, cell - 2, cell - 5, 11, colors.outline);
    image.fillGradientRoundRect(x + 3, y + 3, cell - 6, cell - 10, 9, [[0,colors.light],[.45,colors.base],[1,colors.dark]]);
    image.fillEllipse(x + cell * .39, y + cell * .22, cell * .23, cell * .07, '#FFFFFFAA', -.15);
  };
  for (const [r, col] of [[0,0],[0,1],[1,0],[1,1]]) boardGloop(r,col,'cherry');
  for (const [r, col] of [[2,5],[2,6],[3,5],[3,6]]) boardGloop(r,col,'blueberry');
  for (let row = 3; row < 6; row += 1) for (let col = 2; col < 5; col += 1) boardGloop(row,col,'lemon');
  const faceX = bx + 3 * (cell + gap) + cell * 1.5; const faceY = by + 4 * (cell + gap) + cell * .58;
  image.fillEllipse(faceX - 25, faceY, 11, 15, c.white); image.fillEllipse(faceX + 25, faceY, 11, 15, c.white);
  image.fillCircle(faceX - 23, faceY + 2, 6, c.ink); image.fillCircle(faceX + 27, faceY + 2, 6, c.ink);
  image.strokeCapsule(faceX - 12, faceY + 26, faceX, faceY + 34, 6, c.ink); image.strokeCapsule(faceX, faceY + 34, faceX + 12, faceY + 26, 6, c.ink);
  drawLogo(image, 600, 72, c);
  drawGloop(image, 855, 423, 325, 325, c, 'cherry');
  image.fillEllipse(855, 572, 180, 14, '#10082466');
  return image.encodePNG();
}

function drawLogo(image, x, y, c) {
  const glyphs = [
    { type: 'G', color: c.cherry.base }, { type: 'L', color: c.orange.base }, { type: 'O', color: c.lemon.base }, { type: 'O', color: c.apple.base }, { type: 'P', color: c.blueberry.base },
    { type: 'P', color: c.grape.base }, { type: 'O', color: c.bubblegum.base }, { type: 'P', color: c.cherry.light },
  ];
  const width = 47; const height = 68; let cursor = x;
  for (let i = 0; i < glyphs.length; i += 1) {
    if (i === 5) cursor += 17;
    const glyph = glyphs[i];
    const lines = glyph.type === 'G' ? [[0,0,0,1],[0,0,1,0],[1,0,1,.44],[1,.44,.56,.44],[1,.44,1,1],[1,1,0,1]]
      : glyph.type === 'L' ? [[0,0,0,1],[0,1,1,1]]
        : glyph.type === 'O' ? [[0,0,1,0],[1,0,1,1],[1,1,0,1],[0,1,0,0]]
          : [[0,1,0,0],[0,0,.74,0],[.74,0,1,.2],[1,.2,1,.42],[1,.42,.74,.58],[.74,.58,0,.58]];
    for (const [x1,y1,x2,y2] of lines) image.strokeCapsule(cursor + x1 * width, y + y1 * height, cursor + x2 * width, y + y2 * height, 34, c.ink);
    for (const [x1,y1,x2,y2] of lines) image.strokeCapsule(cursor + x1 * width, y + y1 * height, cursor + x2 * width, y + y2 * height, 23, glyph.color);
    cursor += width + 10;
  }
}

function favicon(c) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="j" x2="0" y2="1"><stop stop-color="${c.cherry.light}"/><stop offset=".48" stop-color="${c.cherry.base}"/><stop offset="1" stop-color="${c.cherry.dark}"/></linearGradient><linearGradient id="b" x2="0" y2="1"><stop stop-color="${c.sky}"/><stop offset="1" stop-color="${c.skyLow}"/></linearGradient></defs><rect width="64" height="64" rx="15" fill="url(#b)"/><path d="M31 21c1-7 7-10 12-9-1 6-5 10-12 10" fill="${c.topperLeaf}"/><path d="M30 25c0-8 4-11 7-14" fill="none" stroke="${c.topperStem}" stroke-width="3" stroke-linecap="round"/><rect x="11" y="20" width="42" height="34" rx="13" fill="${c.cherry.outline}"/><rect x="13" y="18" width="38" height="34" rx="12" fill="url(#j)"/><ellipse cx="26" cy="24" rx="9" ry="3" fill="#ffffff99"/><ellipse cx="25" cy="35" rx="2.4" ry="3.3" fill="${c.white}"/><ellipse cx="39" cy="35" rx="2.4" ry="3.3" fill="${c.white}"/><circle cx="25.7" cy="36" r="1.3" fill="${c.ink}"/><circle cx="39.3" cy="36" r="1.3" fill="${c.ink}"/><path d="M28 42q4 5 8 0" fill="none" stroke="${c.mouth}" stroke-width="2.3" stroke-linecap="round"/></svg>`;
}

async function writePNG(path, bytes) { await writeFile(path, bytes); }

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await generateIcons();
