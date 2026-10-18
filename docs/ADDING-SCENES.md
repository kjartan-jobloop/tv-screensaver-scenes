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
- Never fill shapes whose outline crosses itself many times (for example two wavy edges bent independently). They are very costly to fill and can make the graphics process reset. Bend a centre line and offset the edges from it instead.
- Aim for no more than about twice the cost of `night`. Measure with `tools/bench.html`, in the same browser.

## Riso scenes

Scenes tagged `riso` look like risograph prints: halftone dots of a few inks (`g.riso.INK`) on cream paper, overprinting each other, slightly misregistered, with grainy ink. Printing every dot each frame would be far too slow on a TV, so:

1. **Print the still parts once** with `g.riso.print({ plates: [...] })`. Each plate is one ink: draw its coverage in black, using alpha for how much ink, and knock out with `destination-out`. The print is made at the screen's real pixel size in a background worker, then shown with `print.draw()`. Until it arrives the scene shows plain paper; then it fades in.
2. **Print scrolling layers as strips** on white paper (`{ w: W, h, paper: 'white' }`) and move them with `strip.scroll(offset, y)`. Make the shapes repeat exactly over the strip width, and keep strips only as tall as their content.
3. **Draw small moving parts live**, inside `g.riso.multiply(() => ...)`, with flat ink (`g.riso.INK.blue`), an overprint colour (`g.riso.mix(['federal'], ['pink', 0.5])`) or, for small areas only, a dot-screen tint (`g.riso.ink('teal', 0.45)`). Bright things on dark ink are knocked out first: draw them in `g.riso.PAPER`, then add ink.
4. Set the clock colours with `overlay: { color, label, shadow: false }` in the scene definition, since white text doesn't read on paper.

The player prepares the next scene's prints a few seconds before it appears, and frees a scene's prints once it is off screen.

## Helpers

`g` gives you:

- **Basics:** `c` (the 2D context), `W`, `H`, `TAU`, `R`, `pick`, `clamp`, `lerp`, `wrap`.
- **Shapes:** `rect`, `dot`, `ell`, `poly`, `hill`, `ridge`, `capsule`, `blob`/`blobPath` (with `wobble`), `sparkle`, `cloud`, `puffCloud`.
- **Light:** `halo`, `crescent` and `ball` for shaded round things.
- **Stars:** `makeStars` and `drawStars`.
- **Riso:** `riso.print`, `riso.ink`, `riso.mix`, `riso.multiply`, `riso.INK`, `riso.PAPER` (see above).

See `player/screensaver.js`.
