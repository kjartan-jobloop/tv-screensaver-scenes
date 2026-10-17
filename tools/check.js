#!/usr/bin/env node
/*
 * Headless smoke test: loads the player and every scene listed in manifest.json,
 * runs each scene for 60 simulated seconds against a stub canvas, then runs the
 * full rotation. Fails on exceptions or on NaN/Infinity passed to any draw call.
 *
 *   node tools/check.js
 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');

const problems = [];
let current = '';
const ctx = new Proxy({}, {
  get(o, k) {
    if (k in o) return o[k];
    return (...args) => {
      if (args.some(a => typeof a === 'number' && !Number.isFinite(a))) problems.push(`${current}: ${String(k)}(${args.join(', ')})`);
      if (k === 'createLinearGradient' || k === 'createRadialGradient' || k === 'createPattern') {
        return { addColorStop(stop, col) { if (!(stop >= 0 && stop <= 1)) problems.push(`${current}: gradient stop ${stop}`); if (typeof col !== 'string' || /NaN|undefined/.test(col)) problems.push(`${current}: bad colour ${col}`); } };
      }
    };
  },
  set(o, k, v) {
    if (typeof v === 'string' && /NaN|undefined/.test(v)) problems.push(`${current}: ${String(k)} = ${v}`);
    o[k] = v; return true;
  },
});
const canvas = () => ({ getContext: () => ctx, width: 1920, height: 1080, clientWidth: 1920, clientHeight: 1080 });

let now = 0, queue = [];
const sandbox = {
  window: {}, devicePixelRatio: 1, console,
  performance: { now: () => now },
  requestAnimationFrame: f => queue.push(f),
  addEventListener() {}, document: { addEventListener() {} },
};
sandbox.window = sandbox;
vm.createContext(sandbox);

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const files = [manifest.player.file, ...manifest.scenes.map(s => s.file)];
for (const f of files) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), sandbox, { filename: f });

const S = sandbox.Screensaver;
const run = (seconds) => { for (let i = 0; i < seconds * 30; i++) { now += 1000 / 30; const q = queue; queue = []; q.forEach(f => f(now)); } };

for (const s of S.scenes) {
  current = s.id;
  const ctl = S.mount(canvas(), { scenes: [s.id], interval: 1e9 });
  try { run(60); } catch (e) { problems.push(`${s.id}: ${e.stack.split('\n').slice(0, 2).join(' ')}`); }
  ctl.destroy(); queue = [];
}
current = 'rotation';
const ctl = S.mount(canvas(), { interval: 2, fade: 1, shuffle: true });
try { run(S.scenes.length * 4); } catch (e) { problems.push(`rotation: ${e.message}`); }
ctl.destroy();

const ids = S.scenes.map(s => s.id), dup = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dup.length) problems.push(`duplicate scene ids: ${dup.join(', ')}`);

console.log(`${S.scenes.length} scenes: ${ids.join(', ')}`);
if (problems.length) { console.log(`FAILED (${problems.length})`); [...new Set(problems)].slice(0, 20).forEach(p => console.log('  ' + p)); process.exit(1); }
console.log('OK: every scene ran 60 s, plus a shuffled rotation, with no errors.');
