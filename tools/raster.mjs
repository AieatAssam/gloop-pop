import { deflateSync } from 'node:zlib';

const SCALE = 4;

export function createRaster(width, height) {
  const pixelWidth = width * SCALE;
  const pixelHeight = height * SCALE;
  const data = new Float32Array(pixelWidth * pixelHeight * 4);
  const raster = { width, height, data, pixelWidth, pixelHeight };
  return {
    fillRect(x, y, w, h, color) { paint(raster, color, (px, py) => px >= x && px < x + w && py >= y && py < y + h, x, y, x + w, y + h); },
    fillRoundRect(x, y, w, h, radius, color) {
      paint(raster, color, (px, py) => {
        const cx = Math.max(x + radius, Math.min(x + w - radius, px));
        const cy = Math.max(y + radius, Math.min(y + h - radius, py));
        return (px - cx) ** 2 + (py - cy) ** 2 <= radius ** 2;
      }, x, y, x + w, y + h);
    },
    fillGradientRoundRect(x, y, w, h, radius, stops) {
      paint(raster, (px, py) => {
        const t = Math.max(0, Math.min(1, (py - y) / h)); let index = 0;
        while (index < stops.length - 2 && t > stops[index + 1][0]) index += 1;
        const [start, from] = stops[index]; const [end, to] = stops[index + 1]; const a = parseColor(from); const b = parseColor(to); const ratio = Math.max(0, Math.min(1, (t - start) / (end - start)));
        return a.map((value, channel) => value + (b[channel] - value) * ratio);
      }, (px, py) => {
        const cx = Math.max(x + radius, Math.min(x + w - radius, px)); const cy = Math.max(y + radius, Math.min(y + h - radius, py));
        return (px - cx) ** 2 + (py - cy) ** 2 <= radius ** 2;
      }, x, y, x + w, y + h);
    },
    fillCircle(x, y, radius, color) { paint(raster, color, (px, py) => (px - x) ** 2 + (py - y) ** 2 <= radius ** 2, x - radius, y - radius, x + radius, y + radius); },
    fillEllipse(x, y, rx, ry, color, rotation = 0) {
      const bounds = Math.max(rx, ry);
      const cos = Math.cos(rotation); const sin = Math.sin(rotation);
      paint(raster, color, (px, py) => { const dx = px - x; const dy = py - y; const a = (dx * cos + dy * sin) / rx; const b = (-dx * sin + dy * cos) / ry; return a * a + b * b <= 1; }, x - bounds, y - bounds, x + bounds, y + bounds);
    },
    strokeCapsule(x1, y1, x2, y2, width, color) {
      const radius = width / 2; const dx = x2 - x1; const dy = y2 - y1; const length2 = dx * dx + dy * dy;
      paint(raster, color, (px, py) => { const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / length2)); return (px - x1 - t * dx) ** 2 + (py - y1 - t * dy) ** 2 <= radius ** 2; }, Math.min(x1, x2) - radius, Math.min(y1, y2) - radius, Math.max(x1, x2) + radius, Math.max(y1, y2) + radius);
    },
    fillPolygon(points, color) {
      const xs = points.map((p) => p[0]); const ys = points.map((p) => p[1]);
      const minX = Math.min(...xs); const maxX = Math.max(...xs); const minY = Math.min(...ys); const maxY = Math.max(...ys);
      paint(raster, color, (px, py) => { let inside = false; for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) { const [xi, yi] = points[i]; const [xj, yj] = points[j]; if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside; } return inside; }, minX, minY, maxX, maxY);
    },
    linearGradient(x, y, w, h, stops) {
      for (let row = 0; row < h * SCALE; row += 1) {
        const t = row / Math.max(1, h * SCALE - 1); let index = 0;
        while (index < stops.length - 2 && t > stops[index + 1][0]) index += 1;
        const [start, from] = stops[index]; const [end, to] = stops[index + 1]; const a = parseColor(from); const b = parseColor(to); const ratio = Math.max(0, Math.min(1, (t - start) / (end - start)));
        const color = a.map((value, channel) => value + (b[channel] - value) * ratio);
        const px0 = Math.max(0, Math.floor(x * SCALE)); const px1 = Math.min(pixelWidth, Math.ceil((x + w) * SCALE)); const py = Math.floor(y * SCALE) + row;
        for (let px = px0; px < px1 && py >= 0 && py < pixelHeight; px += 1) blend(data, (py * pixelWidth + px) * 4, color);
      }
    },
    radialGradient(cx, cy, radius, stops) {
      paint(raster, (px, py) => {
        const t = Math.max(0, Math.min(1, Math.hypot(px - cx, py - cy) / radius)); let index = 0;
        while (index < stops.length - 2 && t > stops[index + 1][0]) index += 1;
        const [start, from] = stops[index]; const [end, to] = stops[index + 1]; const a = parseColor(from); const b = parseColor(to); const ratio = Math.max(0, Math.min(1, (t - start) / (end - start)));
        return a.map((value, channel) => value + (b[channel] - value) * ratio);
      }, (px, py) => (px - cx) ** 2 + (py - cy) ** 2 <= radius ** 2, cx - radius, cy - radius, cx + radius, cy + radius);
    },
    encodePNG() { return encodePNG(width, height, data, pixelWidth); },
  };
}

function paint(raster, color, contains, minX, minY, maxX, maxY) {
  const x0 = Math.max(0, Math.floor(minX * SCALE)); const y0 = Math.max(0, Math.floor(minY * SCALE));
  const x1 = Math.min(raster.pixelWidth, Math.ceil(maxX * SCALE)); const y1 = Math.min(raster.pixelHeight, Math.ceil(maxY * SCALE));
  for (let py = y0; py < y1; py += 1) for (let px = x0; px < x1; px += 1) {
    const logicalX = (px + .5) / SCALE; const logicalY = (py + .5) / SCALE;
    if (contains(logicalX, logicalY)) blend(raster.data, (py * raster.pixelWidth + px) * 4, parseColor(typeof color === 'function' ? color(logicalX, logicalY) : color));
  }
}

function parseColor(value) {
  if (Array.isArray(value)) return value;
  const hex = value.replace('#', '');
  return [Number.parseInt(hex.slice(0, 2), 16) / 255, Number.parseInt(hex.slice(2, 4), 16) / 255, Number.parseInt(hex.slice(4, 6), 16) / 255, hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) / 255 : 1];
}

function blend(data, index, source) {
  const alpha = source[3]; const inverse = 1 - alpha;
  data[index] = source[0] * alpha + data[index] * inverse; data[index + 1] = source[1] * alpha + data[index + 1] * inverse; data[index + 2] = source[2] * alpha + data[index + 2] * inverse;
  data[index + 3] = alpha + data[index + 3] * inverse;
}

function encodePNG(width, height, data, pixelWidth) {
  const rows = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (width * 4 + 1); rows[rowStart] = 0;
    for (let x = 0; x < width; x += 1) for (let channel = 0; channel < 4; channel += 1) {
      let sum = 0;
      for (let sy = 0; sy < SCALE; sy += 1) for (let sx = 0; sx < SCALE; sx += 1) sum += data[((y * SCALE + sy) * pixelWidth + x * SCALE + sx) * 4 + channel];
      rows[rowStart + 1 + x * 4 + channel] = Math.round(sum / (SCALE * SCALE) * 255);
    }
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4); header.set([8,6,0,0,0], 8);
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', deflateSync(rows)), chunk('IEND', Buffer.alloc(0))]);
}

function chunk(type, body) {
  const name = Buffer.from(type); const length = Buffer.alloc(4); length.writeUInt32BE(body.length);
  const checksum = Buffer.alloc(4); checksum.writeUInt32BE(crc32(Buffer.concat([name, body])));
  return Buffer.concat([length, name, body, checksum]);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) { crc ^= byte; for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (-(crc & 1) & 0xedb88320); }
  return (crc ^ 0xffffffff) >>> 0;
}
