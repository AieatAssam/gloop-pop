// Records a page with Chrome DevTools screencast to a 30 fps MP4.
// usage: node record.mjs <url> <seconds> <out.mp4> [width] [height]
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

const [url, secs, out, W = '1920', H = '1080', DSF = '1'] = process.argv.slice(2);
const port = 9300 + Math.floor(Math.random() * 500);
const dir = resolve(out + '.frames'); rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}/../prof-${port}`, `--window-size=${W},${H}`,
  '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required', '--force-device-scale-factor=1', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ver; for (let i = 0; i < 50 && !ver; i++) { await sleep(200); try { ver = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); } catch { /* not up */ } }
const page = ver.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const frames = [];
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  if (m.method === 'Page.screencastFrame') {
    const f = join(dir, `${String(frames.length).padStart(5, '0')}.jpg`);
    writeFileSync(f, Buffer.from(m.params.data, 'base64')); frames.push({ f, t: m.params.metadata.timestamp });
    send('Page.screencastFrameAck', { sessionId: m.params.sessionId });
  }
});
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: +W, height: +H, deviceScaleFactor: +DSF, mobile: false });
await send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: +W * +DSF, maxHeight: +H * +DSF, everyNthFrame: 1 });
await send('Page.navigate', { url });
await sleep(+secs * 1000);
await send('Page.stopScreencast');
ws.close(); chrome.kill();
// constant-rate 30 fps via concat durations
const lines = []; for (let i = 0; i < frames.length; i++) { const d = i + 1 < frames.length ? frames[i + 1].t - frames[i].t : 1 / 30; lines.push(`file '${frames[i].f}'`, `duration ${d.toFixed(4)}`); }
lines.push(`file '${frames.at(-1).f}'`);
writeFileSync(join(dir, 'list.txt'), lines.join('\n'));
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', join(dir, 'list.txt'), '-vf', `fps=30,scale=${+W * +DSF}:${+H * +DSF}:flags=lanczos,format=yuv420p`, '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', out]);
console.log(`${out}: ${frames.length} frames over ${(frames.at(-1).t - frames[0].t).toFixed(1)} s`);
process.exit(0);
