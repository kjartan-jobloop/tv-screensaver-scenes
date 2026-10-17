/*
 * Scene loader: fetches the manifest, then only the scenes you ask for, checks each
 * file against its SHA-256 hash from the manifest, and runs it.
 *
 *   const manifest = await ScreensaverLoader.manifest(BASE);
 *   await ScreensaverLoader.load(BASE, { scenes: ['night', 'whale'] });   // or omit scenes for all
 *   Screensaver.mount(canvas, { scenes: ['night', 'whale'] });
 *
 * BASE is where the repo is served from, ending in '/', for example a pinned release:
 *   https://cdn.jsdelivr.net/gh/kjartan-jobloop/tv-screensaver-scenes@v1.0.0/
 *
 * Options:
 *   scenes   ids to load (default: every scene in the manifest)
 *   verify   true (default): refuse any file whose hash doesn't match. Needs crypto.subtle,
 *            which browsers only offer on https:// or localhost pages.
 *   fetch    custom fetch function, e.g. one that reads from the launcher's offline cache
 */
(function () {
  async function sha256(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function getText(f, url) {
    const res = await f(url);
    if (!res.ok) throw new Error(`Couldn't download ${url} (HTTP ${res.status})`);
    return res.text();
  }

  // Run verified source as a classic script, so `Screensaver.register(...)` calls land on the page.
  function run(source, name) {
    const s = document.createElement('script');
    s.textContent = source + `\n//# sourceURL=${name}`;
    document.head.appendChild(s);
    s.remove();
  }

  async function fetchVerified(base, entry, opts) {
    const f = opts.fetch || fetch.bind(window);
    const text = await getText(f, base + entry.file);
    if (opts.verify !== false) {
      if (!window.crypto || !crypto.subtle) throw new Error('Hash check needs crypto.subtle (https or localhost). Pass verify: false only for trusted local files.');
      const got = await sha256(text);
      if (got !== entry.sha256) throw new Error(`${entry.file} failed its hash check; refusing to run it.`);
    }
    return text;
  }

  const api = {
    async manifest(base, opts = {}) {
      const f = opts.fetch || fetch.bind(window);
      const m = JSON.parse(await getText(f, base + 'manifest.json'));
      if (m.schema !== 1) throw new Error(`Unsupported manifest schema ${m.schema}`);
      return m;
    },
    async load(base, opts = {}) {
      const m = opts.manifest || (await api.manifest(base, opts));
      if (!window.Screensaver) run(await fetchVerified(base, m.player, opts), m.player.file);
      const wanted = opts.scenes && opts.scenes.length ? m.scenes.filter(s => opts.scenes.includes(s.id)) : m.scenes;
      const loaded = new Set(window.Screensaver.scenes.map(s => s.id));
      // Download in parallel, run in manifest order so the playlist order is stable.
      const sources = await Promise.all(wanted.filter(s => !loaded.has(s.id)).map(async s => [s, await fetchVerified(base, s, opts)]));
      for (const [s, text] of sources) run(text, s.file);
      return { manifest: m, loaded: wanted.map(s => s.id) };
    },
  };
  window.ScreensaverLoader = api;
})();
