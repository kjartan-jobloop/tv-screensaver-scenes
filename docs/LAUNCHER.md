# Using these scenes in a TV launcher

The launcher reads `manifest.json` to list the scenes, lets the user pick which ones to show, then downloads only those, checks each one against its SHA-256 hash, caches them and plays them. No scene code is bundled in the app, so new scenes can be added here without an app update.

## 1. Pick a source URL, and pin it to a release

Serve the files through jsDelivr from a **tagged release**, never from a branch:

```
https://cdn.jsdelivr.net/gh/kjartan-jobloop/tv-screensaver-scenes@v1.1.0/
```

Everything is relative to that base: `manifest.json`, `player/screensaver.js`, `scenes/<id>.js`, `thumbs/<id>.jpg`.

Why pinned: the launcher runs code it downloads. With a pinned tag, a TV only ever runs code you released on purpose, and the hashes in that tag's manifest can't change underneath it. To roll out new scenes, publish a new tag and bump the launcher's release setting (or have the launcher read the newest tag from a small config you control).

GitHub Pages (`https://kjartan-jobloop.github.io/tv-screensaver-scenes/`) also works and always serves the latest `main`. Use it for the preview gallery, not for the TVs.

## 2. Settings screen

1. Download `manifest.json`.
2. Show each entry in `scenes` with its `thumb` image, `name` and `tags`.
3. Let the user tick scenes on or off (default: all on). Store the ticked ids. New scenes that appear in a later release start ticked, unless the user turned on "only the scenes I chose".
4. Optional: filter by tag (for example night scenes only).
5. Keep the other screensaver settings next to this: idle time (with Off), seconds per scene, shuffle, show clock.

## 3. Download, verify, cache

For the player and every ticked scene:

1. Download the file named in the manifest.
2. Compute its SHA-256 and compare with `sha256` in the manifest. **If it doesn't match, discard it** and leave that scene out.
3. Store the file in the app's cache, keyed by `sha256`, so an unchanged scene is never downloaded twice.

Do this in the background (for example when settings change and once a day), never while the screensaver is starting. If the network is down, use what's cached.

## 4. Play

**WebView (simplest).** Bundle a tiny host page in the app, or load the cached files into a WebView:

```html
<canvas id="tv" style="width:100vw;height:100vh;display:block"></canvas>
<script src="player/loader.js"></script>
<script>
  ScreensaverLoader.load(BASE, { scenes: CHOSEN_IDS }).then(() => {
    Screensaver.mount(document.getElementById('tv'), { scenes: CHOSEN_IDS, interval: 12, clock: true });
  });
</script>
```

`ScreensaverLoader` does steps 1 and 2 itself (it refuses files that fail the hash check). Pass `fetch` to read from the app's cache instead of the network. Hash checks need `crypto.subtle`, which WebViews only offer on `https://` pages or `localhost`. If you load from `file://` assets, verify the hashes natively when caching (step 3) and pass `verify: false`.

Exit: the page calls `window.ScreensaverBridge.onExit()` on any key, click or touch (register it with `addJavascriptInterface`). Also catch keys natively, and swallow the key that wakes the screensaver so it doesn't act in the launcher. See `play.html` for a complete example.

When the screensaver closes, call `destroy()` on the object `Screensaver.mount()` returned (or tear down the WebView). Riso scenes keep full-screen print canvases, and `destroy()` frees them.

**Pixel scenes** (tagged `pixel`, from v1.2.0) draw into small in-memory canvases and need nothing from the host.

**Riso scenes** (tagged `riso`, from v1.1.0) make a still "print" of their background in a background Web Worker created from a `blob:` URL. If the host page has a Content Security Policy, allow `worker-src blob:`. Without it, printing falls back to the main thread in small slices, which works but is slower to appear. Until a print is ready the scene shows plain paper, then the print fades in. The player prepares the next scene a few seconds early, so this is normally invisible.

**Native port.** The scenes are plain 2D canvas code and can be ported, but then new scenes need an app update, which defeats the point of this repo. Prefer the WebView.

## Manifest format (schema 1)

```json
{
  "schema": 1,
  "version": "1.0.0",
  "player": { "file": "player/screensaver.js", "bytes": 13601, "sha256": "…" },
  "loader": { "file": "player/loader.js", "bytes": 3148, "sha256": "…" },
  "scenes": [
    {
      "id": "night", "name": "Night sky", "tags": ["night", "calm"],
      "file": "scenes/night.js", "bytes": 2033, "sha256": "…",
      "thumb": "thumbs/night.jpg", "added": "2026-10-17"
    }
  ]
}
```

- `id` never changes for a scene; store ids in settings, not names.
- The order of `scenes` is the suggested playlist order.
- A scene removed from the manifest should be dropped from the user's selection and the cache.
- Ignore fields you don't know; if `schema` is not 1, keep using the cached version and show nothing new.

## Requirements the launcher should meet

- No sound.
- 30 fps cap; pause rendering when the screensaver isn't visible.
- Start after the configured idle time, never during media playback.
- Any input exits, and that input doesn't reach the launcher.
