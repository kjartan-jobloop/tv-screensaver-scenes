# Adding a scene

1. Create `scenes/<id>.js`. The id is lowercase letters, digits and dashes, and the file name must match it.
2. Register the scene:

   ```js
   Screensaver.register({
     id: 'harbour', name: 'Harbour', tags: ['night', 'water', 'calm'],
     create(g) {
       // set up particles once, with g.R(min, max), g.pick(array), ...
       return (t, dt) => {
         // draw the whole frame in the 960 × 540 space, background first
       };
     },
   });
   ```

3. Preview it: serve the repo locally (for example `npx serve .`) and open `play.html?exit=0&scenes=<id>`.
4. Make its thumbnail: open `tools/thumbnails.html`, save the new image as `thumbs/<id>.jpg`.
5. Run `node tools/build-manifest.js` and `node tools/check.js`, and commit everything, including `manifest.json`.
6. To ship it to the TVs: `node tools/build-manifest.js --version 1.1.0`, commit, then tag and push the tag (`git tag v1.1.0 && git push --tags`).

## Style

Keep to the look of the existing scenes:

- One flat background colour.
- One colour family plus a single warm accent.
- One clear subject with plenty of empty space.
- 2–5 layered silhouettes (hills, waves, dunes, ridges) drifting slowly at different speeds.
- Small twinkling or drifting points of light.
- Slow, calm motion. Nothing flashes.
- Keep the top-right corner clear: the clock drifts there.

## Performance

- Glows are stacked translucent discs (`g.halo`), not gradients.
- No full-screen gradients, big radial glows or blend modes.
- Batch many small shapes of the same colour into one path, and draw grass blades as thin triangles rather than curved strokes.
- Aim for no more than about twice the cost of `night`. Compare them side by side in the same browser.

## Helpers

`g` gives you:

- **Basics:** `c` (the 2D context), `W`, `H`, `TAU`, `R`, `pick`, `clamp`, `lerp`, `wrap`.
- **Shapes:** `rect`, `dot`, `ell`, `poly`, `hill`, `ridge`, `capsule`, `blob`/`blobPath` (with `wobble`), `sparkle`, `cloud`, `puffCloud`.
- **Light:** `halo`, `crescent` and `ball` for shaded round things.
- **Stars:** `makeStars` and `drawStars`.

See `player/screensaver.js`.
