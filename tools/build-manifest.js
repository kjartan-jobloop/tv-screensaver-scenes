#!/usr/bin/env node
/*
 * Builds manifest.json from player/ and scenes/.
 *
 *   node tools/build-manifest.js                 update manifest.json
 *   node tools/build-manifest.js --version 1.1.0 update it and set the release version
 *   node tools/build-manifest.js --check         fail if manifest.json is out of date (used in CI)
 *
 * Each scene's id, name and tags are read from its own Screensaver.register(...) call.
 * The file name must be <id>.js. Existing scenes keep their place in the list and their
 * "added" date; new scenes are appended.
 */
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
const root = path.join(__dirname, '..');
const args = process.argv.slice(2);
const check = args.includes('--check');
const vi = args.indexOf('--version');
const manifestPath = path.join(root, 'manifest.json');
const old = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : { scenes: [] };
const problems = [], warnings = [];

function fileEntry(rel) {
  const buf = fs.readFileSync(path.join(root, rel));
  if (buf.includes(13)) problems.push(`${rel} has CRLF line endings; hashes must be computed on LF files`);
  if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) problems.push(`${rel} starts with a BOM; save it as UTF-8 without BOM`);
  return { file: rel, bytes: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex') };
}

function readScene(file) {
  let def = null;
  const sandbox = { Screensaver: { register: d => { def = d; } } };
  vm.createContext(sandbox);
  try { vm.runInContext(fs.readFileSync(path.join(root, 'scenes', file), 'utf8'), sandbox, { filename: file }); }
  catch (e) { problems.push(`scenes/${file}: ${e.message}`); return null; }
  if (!def) { problems.push(`scenes/${file} doesn't call Screensaver.register`); return null; }
  if (`${def.id}.js` !== file) problems.push(`scenes/${file} registers id "${def.id}"; rename the file to ${def.id}.js`);
  if (!/^[a-z][a-z0-9-]*$/.test(def.id)) problems.push(`scene id "${def.id}" must be lowercase letters, digits and dashes`);
  return def;
}

const files = fs.readdirSync(path.join(root, 'scenes')).filter(f => f.endsWith('.js'));
const found = new Map();
for (const f of files) { const def = readScene(f); if (def) found.set(def.id, def); }
const today = new Date().toISOString().slice(0, 10);
const orderedIds = [...old.scenes.map(s => s.id).filter(id => found.has(id)), ...[...found.keys()].filter(id => !old.scenes.some(s => s.id === id)).sort()];

const scenes = orderedIds.map(id => {
  const def = found.get(id), prev = old.scenes.find(s => s.id === id) || {};
  const thumb = `thumbs/${id}.jpg`;
  if (!fs.existsSync(path.join(root, thumb))) (check ? problems : warnings).push(`missing thumbnail ${thumb} (render it with tools/thumbnails.html)`);
  return Object.assign({ id, name: def.name || id, tags: def.tags || [] }, fileEntry(`scenes/${id}.js`), { thumb, added: prev.added || today });
});

// The player's API (Screensaver.register / mount and the `g` helpers scenes rely on). Launchers
// refuse a manifest whose playerAPI they don't support; bump it only for a breaking change.
const PLAYER_API = 1;

const manifest = {
  schema: 1,
  playerAPI: PLAYER_API,
  version: vi >= 0 ? args[vi + 1] : old.version || '1.0.0',
  player: fileEntry('player/screensaver.js'),
  loader: fileEntry('player/loader.js'),
  scenes,
};
const text = JSON.stringify(manifest, null, 2) + '\n';

if (warnings.length) console.warn('Warnings:\n  ' + warnings.join('\n  '));
if (problems.length) { console.error('Problems:\n  ' + problems.join('\n  ')); process.exit(1); }
if (check) {
  const current = fs.existsSync(manifestPath) ? fs.readFileSync(manifestPath, 'utf8') : '';
  if (current !== text) { console.error('manifest.json is out of date. Run: node tools/build-manifest.js'); process.exit(1); }
  console.log(`manifest.json is up to date (${scenes.length} scenes, version ${manifest.version}).`);
} else {
  fs.writeFileSync(manifestPath, text);
  console.log(`Wrote manifest.json: ${scenes.length} scenes, version ${manifest.version}.`);
}
