/*
 * Screensaver player: scene registry, rotation, crossfade and clock overlay.
 *
 *   Screensaver.register({ id, name, tags, create(g) { ...; return (t, dt) => draw } })
 *   const ctl = Screensaver.mount(canvas, options)   // ctl.next(), ctl.prev(), ctl.pause(bool), ctl.destroy()
 *
 * Every scene draws in a fixed 960x540 logical space. The player scales it to
 * cover the canvas, so scene code never deals with screen sizes.
 */
(function () {
  const W = 960, H = 540, TAU = Math.PI * 2;
  const registry = [];

  function register(def) {
    if (!def.id || !def.create) throw new Error('scene needs id and create()');
    registry.push(Object.assign({ name: def.id, tags: [] }, def));
  }

  // Drawing helpers handed to every scene as `g`.
  function helpers(c) {
    const R = (a, b) => a + Math.random() * (b - a);
    const g = {
      c, W, H, TAU, R,
      pick: a => a[Math.floor(Math.random() * a.length)],
      clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
      rect(x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); },
      dot(x, y, r, col) { c.fillStyle = col; c.beginPath(); c.arc(x, y, Math.max(0, r), 0, TAU); c.fill(); },
      ell(x, y, rx, ry, rot, col) { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), rot, 0, TAU); c.fill(); },
      poly(pts, col) {
        c.fillStyle = col; c.beginPath(); c.moveTo(pts[0], pts[1]);
        for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
        c.closePath(); c.fill();
      },
      // Filled wavy ground from x=0..W down to the bottom edge. Animate `o` to scroll it.
      hill(y0, amp, f, o, col) {
        c.fillStyle = col; c.beginPath(); c.moveTo(0, H);
        for (let x = 0; x <= W; x += 8) c.lineTo(x, y0 + amp * Math.sin(x * f + o) + amp * 0.5 * Math.sin(x * f * 2.3 + o * 1.7));
        c.lineTo(W, H); c.closePath(); c.fill();
      },
      cloud(x, y, s, col) {
        c.fillStyle = col; c.beginPath();
        c.ellipse(x, y, 60 * s, 20 * s, 0, 0, TAU);
        c.ellipse(x + 35 * s, y - 14 * s, 40 * s, 20 * s, 0, 0, TAU);
        c.ellipse(x - 30 * s, y - 6 * s, 30 * s, 14 * s, 0, 0, TAU);
        c.fill();
      },
      makeStars(n, ymax) { return [...Array(n)].map(() => ({ x: R(0, W), y: R(0, ymax), r: R(0.6, 2), p: R(0, TAU) })); },
      drawStars(stars, t, rgb) {
        for (const s of stars) g.dot(s.x, s.y, s.r, `rgba(${rgb || '255,250,230'},${0.35 + 0.65 * Math.abs(Math.sin(t * 1.5 + s.p))})`);
      },
      // Wrap a value into [-pad, size+pad).
      wrap(v, size, pad) { const span = size + 2 * pad; return ((((v + pad) % span) + span) % span) - pad; },
      lerp: (a, b, k) => a + (b - a) * k,

      // ---- Soft light ------------------------------------------------------
      // Gradients: stops is [[0, '#abc'], [1, '#def']].
      lin(x0, y0, x1, y1, stops) { const gr = c.createLinearGradient(x0, y0, x1, y1); for (const [k, col] of stops) gr.addColorStop(k, col); return gr; },
      rad(x, y, r0, r1, stops) { const gr = c.createRadialGradient(x, y, r0, x, y, r1); for (const [k, col] of stops) gr.addColorStop(k, col); return gr; },
      // Full-screen vertical sky.
      sky(stops, y0 = 0, y1 = H) { c.fillStyle = g.lin(0, y0, 0, y1, stops); c.fillRect(0, 0, W, H); },
      // Soft round glow that fades to nothing. rgb is '255,200,120'.
      glow(x, y, r, rgb, a) {
        c.fillStyle = g.rad(x, y, 0, r, [[0, `rgba(${rgb},${a})`], [0.4, `rgba(${rgb},${a * 0.45})`], [1, `rgba(${rgb},0)`]]);
        c.fillRect(x - r, y - r, r * 2, r * 2);
      },
      // Darken everything outside a circle shifted by (dx, dy): use inside a clip to shade
      // the side of a shape that faces away from the light.
      crescent(x, y, r, dx, dy, col) {
        c.fillStyle = col; c.beginPath();
        c.rect(x - r * 3, y - r * 3, r * 6, r * 6);
        c.arc(x + dx, y + dy, r, 0, TAU);
        c.fill('evenodd');
      },
      // A lit sphere: base colour, a shadow crescent away from the light and a soft highlight.
      // light is the angle the light comes from (0 = from the right, PI = from the left).
      ball(x, y, r, base, shade, light, highlight) {
        c.save();
        c.beginPath(); c.arc(x, y, Math.max(0.1, r), 0, TAU); c.fillStyle = base; c.fill(); c.clip();
        g.crescent(x, y, r, Math.cos(light) * r * 0.45, Math.sin(light) * r * 0.45, shade);
        if (highlight) g.dot(x + Math.cos(light) * r * 0.45, y + Math.sin(light) * r * 0.45, r * 0.32, highlight);
        c.restore();
      },

      // Cheap glow for the flat style: three stacked translucent discs, no gradients.
      halo(x, y, r, rgb, a) {
        g.dot(x, y, r, `rgba(${rgb},${a * 0.35})`);
        g.dot(x, y, r * 0.66, `rgba(${rgb},${a * 0.45})`);
        g.dot(x, y, r * 0.4, `rgba(${rgb},${a * 0.6})`);
      },

      // ---- Hand-cut shapes -------------------------------------------------
      // A wobbly outline: returns radius multipliers for an irregular, hand-cut circle.
      wobble(amount = 0.08) {
        const h = [2, 3, 5].map(k => ({ k, a: R(0.3, 1) * amount, p: R(0, TAU) }));
        return a => 1 + h.reduce((s, q) => s + q.a * Math.sin(q.k * a + q.p), 0);
      },
      blobPath(x, y, rx, ry, shape, rot = 0) {
        c.beginPath();
        for (let i = 0; i <= 36; i++) {
          const a = (i / 36) * TAU, m = shape(a + rot);
          const px = x + Math.cos(a) * rx * m, py = y + Math.sin(a) * ry * m;
          i ? c.lineTo(px, py) : c.moveTo(px, py);
        }
        c.closePath();
      },
      blob(x, y, rx, ry, shape, col, rot) { g.blobPath(x, y, rx, ry, shape, rot); c.fillStyle = col; c.fill(); },
      // A jagged, slightly irregular skyline from x=0..W: returns flat [x,y,...] points for poly().
      ridge(y0, amp, step, jitter, closeY = H) {
        const pts = [0, closeY];
        for (let x = -step; x <= W + step; x += step * R(0.6, 1.4)) pts.push(x, y0 - R(0, amp) + R(-jitter, jitter));
        pts.push(W + step, closeY);
        return pts;
      },
      // Stadium shape: a long cloud strip or a rounded bar.
      capsule(x, y, w, h, col) {
        const r = h / 2; c.fillStyle = col; c.beginPath();
        c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.arc(x + w - r, y + r, r, -Math.PI / 2, Math.PI / 2);
        c.lineTo(x + r, y + h); c.arc(x + r, y + r, r, Math.PI / 2, Math.PI * 1.5); c.closePath(); c.fill();
      },
      // Four-point twinkle for bright stars.
      sparkle(x, y, r, col) {
        c.fillStyle = col; c.beginPath();
        c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r);
        c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fill();
      },
      // Flat "storybook" cloud: puffy top, flat bottom, lighter cap and darker base.
      puffCloud(x, y, w, col, top, under) {
        const h = w * 0.32;
        const puff = (yy, cc) => {
          c.fillStyle = cc; c.beginPath();
          c.arc(x + w * 0.28, yy - h * 0.05, h * 0.55, Math.PI, 0);
          c.arc(x + w * 0.55, yy - h * 0.25, h * 0.75, Math.PI, 0);
          c.arc(x + w * 0.8, yy, h * 0.45, Math.PI, 0);
          c.lineTo(x + w, yy + h * 0.3); c.lineTo(x, yy + h * 0.3); c.closePath(); c.fill();
        };
        if (under) puff(y + h * 0.12, under);
        puff(y, col);
        if (top) { c.save(); c.globalAlpha *= 0.6; puff(y - h * 0.08, top); c.restore(); puff(y + h * 0.04, col); }
      },
    };
    return g;
  }

  // A small tile of random grey noise, repeated over the frame. Made once per player.
  function makeGrain(c) {
    try {
      const size = 192;
      const tile = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(size, size) : document.createElement('canvas');
      tile.width = tile.height = size;
      const x = tile.getContext('2d'), img = x.createImageData(size, size);
      for (let i = 0; i < size * size; i++) {
        const v = 128 + (Math.random() - 0.5) * 70;
        img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255;
      }
      x.putImageData(img, 0, 0);
      return c.createPattern(tile, 'repeat');
    } catch (e) { return null; }
  }

  // ---- Risograph printing ---------------------------------------------------
  // Scenes in the riso style "print" their still background once, at the screen's real pixel
  // size: paper texture, then one halftone plate per ink (each at its own screen angle and a
  // slight misregistration), multiplied onto the paper like real ink. Moving parts are drawn
  // live with flat ink or dot-screen tints.
  const INK = {
    blue: '#0078bf', federal: '#3d5588', medium: '#3255a4', pink: '#ff48b0', yellow: '#ffe800',
    teal: '#00838a', orange: '#ff6c2f', burgundy: '#914e72', green: '#00a95c', red: '#ff665e',
    aqua: '#5ec8e5', purple: '#765ba7', mint: '#82d8d5', sunflower: '#ffb511', fog: '#d6d8d1',
  };
  const PAPER = '#f2ebdb';
  function makeCanvas(w, h) {
    const cv = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h) : document.createElement('canvas');
    cv.width = w; cv.height = h; return cv;
  }
  // Stable integer hash -> [0, 1). Texture comes from fixed keys, so it never crawls.
  function hash(x, y, s) {
    let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function seedOf(str) { let h = 2166136261; for (const ch of String(str)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; }
  const rgbOf = hex => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };

  // One shared 256x256 tile of stable noise for paper tooth, ink grain and rough edges.
  let noiseTile = null;
  function noise() {
    if (!noiseTile) { noiseTile = new Uint8Array(65536); for (let i = 0; i < 65536; i++) noiseTile[i] = Math.floor(hash(i & 255, i >> 8, 9001) * 256); }
    return noiseTile;
  }

  // The per-pixel print loop. It runs in a Web Worker when the device allows (so animation
  // never stutters while a print is made), otherwise in time-limited slices on the main thread.
  // It is self-contained so the worker can be built from its source with .toString().
  function printRows(j, y0, y1) {
    const BW = j.BW, BH = j.BH, plates = j.plates, d = j.d, N = j.N, white = j.white;
    const p0 = j.paper[0], p1 = j.paper[1], p2 = j.paper[2];
    for (let y = y0; y < y1; y++) {
      const ny = (y & 255) << 8;
      for (let x = 0; x < BW; x++) {
        const o = (y * BW + x) * 4;
        let r = p0, gg = p1, b = p2;
        if (!white) {
          const n = N[ny | (x & 255)];                                     // paper tooth
          r += (n - 128) * 0.028; gg += (n - 128) * 0.028; b += (n - 128) * 0.032;
          if (n < 1) { r -= 18; gg -= 18; b -= 16; }                        // fibres
        }
        for (let q = 0; q < plates.length; q++) {
          const P = plates[q], sx = x - P.dx, sy = y - P.dy;
          if (sx < 0 || sy < 0 || sx >= BW || sy >= BH) continue;
          const cov0 = P.a[(sy >> 1) * P.cw + (sx >> 1)]; if (!cov0) continue;
          // Position inside this plate's rotated dot screen (the offset keeps it positive).
          const u = (sx * P.cos + sy * P.sin) * P.ip + 4096, v = (sy * P.cos - sx * P.sin) * P.ip + 4096;
          const cu = u | 0, cv = v | 0, fu = u - cu - 0.5, fv = v - cv - 0.5;
          // Grainy ink: each dot gets a little more or less ink than its neighbours.
          const cq = Math.min(255, (cov0 * P.gLUT[N[((cu & 255) << 8) | (cv & 255)]]) >> 8);
          let a = 0.5 + (P.r2[cq] - (fu * fu + fv * fv)) * P.k2[cq];
          if (a <= 0) continue; if (a > 1) a = 1;
          if (N[(((y + P.off) & 255) << 8) | ((x + P.off) & 255)] < 13) a *= 0.55;   // rough ink
          r *= 1 - a * P.k[0]; gg *= 1 - a * P.k[1]; b *= 1 - a * P.k[2];
        }
        d[o] = r; d[o + 1] = gg; d[o + 2] = b; d[o + 3] = 255;
      }
    }
  }
  let printWorker = null, workerTried = false, jobSeq = 0;
  const workerJobs = new Map();
  function getWorker(onBroken) {
    if (workerTried) return printWorker;
    workerTried = true;
    try {
      if (typeof Worker === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined' || !URL.createObjectURL) return null;
      const src = printRows.toString() +
        '\nonmessage = e => { const j = e.data; j.d = new Uint8ClampedArray(j.BW * j.BH * 4); printRows(j, 0, j.BH); postMessage({ id: j.id, d: j.d }, [j.d.buffer]); };';
      printWorker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
      printWorker.onmessage = e => { const cb = workerJobs.get(e.data.id); workerJobs.delete(e.data.id); if (cb) cb(e.data.d); };
      printWorker.onerror = () => { printWorker = null; workerJobs.clear(); onBroken(); };   // e.g. blocked by a CSP
    } catch (e) { printWorker = null; }
    return printWorker;
  }

  function risoKit(c, g, view) {
    const bakes = [], tints = new Map();
    const pitch = () => Math.max(3.5, 2.3 * view.scale);
    const inkHex = name => INK[name] || name;
    const restartWorkerJobs = () => { for (const b of bakes) if (b.job && b.job.worker) b.start(); };

    function print(spec) {
      const h = { owner: g._owner, canvas: null, ready: false, job: null, scale: 0, gen: 0, readyAt: 0 };
      // spec.w / spec.h: logical size of the print (default the whole screen). A strip wider than
      // the screen can be scrolled with h.scroll(). paper: 'white' prints on plain white with no
      // texture, for layers that are multiplied over another print.
      const LW = spec.w || W, LH = spec.h || H, white = spec.paper === 'white';
      const paperHex = white ? '#ffffff' : spec.paper || PAPER;
      h.start = () => {
        const s = view.scale, BW = Math.ceil(LW * s), BH = Math.ceil(LH * s), seed = seedOf(spec.seed || h.owner || 'print');
        h.scale = s; h.ready = false; const gen = ++h.gen;
        const plates = spec.plates.map((pl, k) => {
          // Coverage is drawn at half resolution (the dots themselves are full resolution).
          const CW = Math.ceil(BW / 2), CH = Math.ceil(BH / 2), cv = makeCanvas(CW, CH), x = cv.getContext('2d');
          x.setTransform(s / 2, 0, 0, s / 2, 0, 0); x.fillStyle = '#000'; x.strokeStyle = '#000';
          pl.draw(helpers(x));                        // draw coverage: alpha = how much ink
          const src = x.getImageData(0, 0, CW, CH).data, a = new Uint8Array(CW * CH);
          for (let i = 0; i < a.length; i++) a[i] = src[i * 4 + 3];
          cv.width = cv.height = 0;
          const th = ((pl.angle || 0) * Math.PI) / 180, ink = rgbOf(inkHex(pl.ink)), p = pitch() * (pl.pitch || 1);
          const grain = pl.grain === undefined ? 0.2 : pl.grain;
          // Lookup tables by coverage (0-255): squared dot radius in screen cells, and the
          // anti-aliasing slope, so the per-pixel loop needs no square roots.
          const r2 = new Float32Array(256), k2 = new Float32Array(256), gLUT = new Uint16Array(256);
          for (let i = 0; i < 256; i++) {
            const cv = i / 255, rr = 0.3136 * cv + (cv > 0.85 ? (cv - 0.85) * 2 : 0);
            r2[i] = rr; k2[i] = p / (2 * Math.sqrt(rr) + 1e-3);
            gLUT[i] = Math.min(65535, Math.round(256 * (1 - grain * 0.5 + grain * (i / 255))));
          }
          return {
            a, cw: CW, cos: Math.cos(th), sin: Math.sin(th), ip: 1 / p, r2, k2, gLUT, off: (seed + k * 97) & 255,
            dx: Math.round((pl.shift ? pl.shift[0] : 0) * s), dy: Math.round((pl.shift ? pl.shift[1] : 0) * s),
            k: ink.map(v => 1 - v / 255),
          };
        });
        h.canvas = makeCanvas(BW, BH);
        const hx = h.canvas.getContext('2d');
        const job = { BW, BH, plates, paper: rgbOf(paperHex), white, N: noise() };
        const finish = data => {
          if (gen !== h.gen) return;                  // freed or restarted meanwhile
          const img = hx.createImageData(BW, BH); img.data.set(data); hx.putImageData(img, 0, 0);
          h.ready = true; h.job = null; h.readyAt = performance.now();
        };
        const w = getWorker(restartWorkerJobs);
        if (w) {
          const id = ++jobSeq; workerJobs.set(id, finish); h.job = { worker: true };
          w.postMessage(Object.assign({ id }, job), plates.map(p => p.a.buffer));
        } else {
          job.d = new Uint8ClampedArray(BW * BH * 4); job.y = 0; job.finish = finish; h.job = job;
        }
      };
      h.step = budget => {
        const j = h.job; if (!j || j.worker) return;
        const t0 = performance.now();
        while (j.y < j.BH) { const y1 = Math.min(j.BH, j.y + 8); printRows(j, j.y, y1); j.y = y1; if (performance.now() - t0 > budget) break; }
        if (j.y >= j.BH) j.finish(j.d);
      };
      h.free = () => { h.gen++; if (h.canvas) h.canvas.width = h.canvas.height = 0; h.canvas = null; h.job = null; h.ready = false; h.scale = 0; };
      // Draw at logical (x, y), pixel-aligned so the dots are never resampled.
      // multiply: true for layers printed on 'white' paper. Until a print is ready, a paper print
      // shows plain paper; when it arrives it fades in over 0.6 s.
      h.draw = (x = 0, y = 0, multiply = white) => {
        if (h.scale !== view.scale || (!h.ready && !h.job)) h.start();
        if (!h.ready && h.job && !h.job.worker) h.step(Infinity);
        if (!h.ready) { if (!white) { c.fillStyle = paperHex; c.fillRect(x, y, LW, LH); } return; }
        const k = Math.min(1, (performance.now() - h.readyAt) / 600);
        const px = Math.round(view.offX + x * view.scale), py = Math.round(view.offY + y * view.scale);
        c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
        if (k < 1 && !white) { c.fillStyle = paperHex; c.fillRect(px, py, h.canvas.width, h.canvas.height); }
        if (k < 1) c.globalAlpha *= k;
        if (multiply) c.globalCompositeOperation = 'multiply';
        c.drawImage(h.canvas, px, py);
        c.restore();
      };
      // Draw a wide strip scrolled left by `offset` logical px, wrapping round.
      h.scroll = (offset, y = 0, multiply = white) => {
        const x0 = -(((offset % LW) + LW) % LW);
        h.draw(x0, y, multiply);
        if (x0 + LW < W) h.draw(x0 + LW, y, multiply);
      };
      bakes.push(h); h.start();
      return h;
    }
    // Flat ink, or a dot-screen tint for coverage below 1. Draw it inside multiply().
    function ink(name, cov = 1) {
      const hex = inkHex(name);
      if (cov >= 0.97) return hex;
      const s = view.scale, p = Math.round(pitch()), key = `${hex}|${cov.toFixed(2)}|${p}|${s}`;
      if (!tints.has(key)) {
        let fill = hex;
        try {
          const t = makeCanvas(p, p), x = t.getContext('2d');
          x.fillStyle = hex; x.beginPath(); x.arc(p / 2, p / 2, Math.max(0.6, 0.56 * Math.sqrt(cov) * p), 0, TAU); x.fill();
          const pat = c.createPattern(t, 'repeat');
          if (pat && pat.setTransform && typeof DOMMatrix !== 'undefined') pat.setTransform(new DOMMatrix([1 / s, 0, 0, 1 / s, 0, 0]));
          if (pat) fill = pat;
        } catch (e) { /* no offscreen canvas: fall back to flat ink */ }
        tints.set(key, fill);
      }
      return tints.get(key);
    }
    // Flat colour that matches an overprint of inks at given coverages, e.g. mix(['federal', .8], ['pink', .5]).
    // Cheaper than dot-screen tints for large moving shapes; draw it inside multiply().
    function mix(...layers) {
      let r = 1, gg = 1, b = 1;
      for (const [name, cov = 1] of layers) { const [ir, ig, ib] = rgbOf(inkHex(name)); r *= 1 - cov * (1 - ir / 255); gg *= 1 - cov * (1 - ig / 255); b *= 1 - cov * (1 - ib / 255); }
      return `rgb(${Math.round(r * 255)},${Math.round(gg * 255)},${Math.round(b * 255)})`;
    }
    return {
      INK, PAPER, print, ink, mix, hash, seedOf,
      multiply(fn) { c.save(); c.globalCompositeOperation = 'multiply'; fn(); c.restore(); },
      // Advance unfinished prints for up to `budget` ms (called by the player every frame).
      work(budget) { const h = bakes.find(b => b.job); if (h) h.step(budget); },
      prepare(owner) { for (const b of bakes) if (b.owner === owner && !b.ready && !b.job) b.start(); },
      release(keep) { for (const b of bakes) if (!keep.includes(b.owner) && b.canvas) b.free(); },
    };
  }

  // ---- Pixel art --------------------------------------------------------------
  // Scenes tagged `pixel` draw real pixels into a small buffer (for example 320x180) with a fixed
  // palette and integer coordinates, then show it scaled up with no smoothing. The still picture
  // is baked once into one buffer; each frame copies it into another and adds the moving parts.
  // Pixels are stored as packed 0xAABBGGRR, the byte order ImageData uses on little-endian devices.
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
  const packCache = new Map();
  function pack(col) {
    if (typeof col === 'number') return col;
    let v = packCache.get(col);
    if (v === undefined) { const [r, gg, b] = rgbOf(col); v = ((255 << 24) | (b << 16) | (gg << 8) | r) >>> 0; packCache.set(col, v); }
    return v;
  }
  function mixPacked(a, b, k) {
    const m = (s) => { const x = (a >>> s) & 255; return Math.round(x + (((b >>> s) & 255) - x) * k); };
    return ((255 << 24) | (m(16) << 16) | (m(8) << 8) | m(0)) >>> 0;
  }
  // True where an ordered (4x4 Bayer) dither of coverage k puts the second colour.
  const dith = (x, y, k) => k > BAYER[((y & 3) << 2) | (x & 3)];

  function pixelKit(c) {
    function buffer(w, h) {
      // willReadFrequently keeps the small canvas in memory: putImageData on a GPU-backed
      // offscreen canvas every frame stalls badly (about 4x slower in Chrome).
      const cv = makeCanvas(w, h), x = cv.getContext('2d', { willReadFrequently: true });
      const img = x.createImageData(w, h), px = new Uint32Array(img.data.buffer);
      const put = (X, Y, v, k) => { if (k >= 1 || dith(X, Y, k)) px[Y * w + X] = v; };
      const b = {
        w, h, px,
        clear(col) { px.fill(pack(col)); },
        copy(o) { px.set(o.px); },
        get: (X, Y) => px[Y * w + X],
        set(X, Y, col) { X = Math.round(X); Y = Math.round(Y); if (X >= 0 && Y >= 0 && X < w && Y < h) px[Y * w + X] = pack(col); },
        // k < 1 dithers the colour over what is there, so k = 0.5 is a checkerboard.
        rect(X, Y, rw, rh, col, k = 1) {
          const v = pack(col), x0 = Math.max(0, Math.round(X)), y0 = Math.max(0, Math.round(Y));
          const x1 = Math.min(w, Math.round(X + rw)), y1 = Math.min(h, Math.round(Y + rh));
          for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) put(xx, yy, v, k);
        },
        // Banded vertical gradient: stops [[0, '#abc'], [1, '#def']], dithered only within `soft`
        // (0..1) of each band edge, the way pixel artists draw skies.
        vgrad(stops, y0 = 0, y1 = h, soft = 1, x0 = 0, x1 = w) {
          const s = stops.map(([k, col]) => [k, pack(col)]);
          for (let yy = Math.max(0, y0); yy < Math.min(h, y1); yy++) {
            const f = (yy - y0) / Math.max(1, y1 - y0 - 1);
            let i = 0; while (i < s.length - 2 && f > s[i + 1][0]) i++;
            const [ka, ca] = s[i], [kb, cb] = s[Math.min(i + 1, s.length - 1)];
            let k = kb > ka ? (f - ka) / (kb - ka) : 0;
            k = Math.max(0, Math.min(1, (k - 0.5) / Math.max(0.01, soft) + 0.5));
            for (let xx = Math.max(0, x0); xx < Math.min(w, x1); xx++) px[yy * w + xx] = dith(xx, yy, k) ? cb : ca;
          }
        },
        // Per-pixel painter for baking: fn(x, y, current) returns a colour, or nothing to keep the pixel.
        paint(x0, y0, x1, y1, fn) {
          for (let yy = Math.max(0, y0 | 0); yy < Math.min(h, y1); yy++) for (let xx = Math.max(0, x0 | 0); xx < Math.min(w, x1); xx++) {
            const v = fn(xx, yy, px[yy * w + xx]); if (v !== undefined && v !== null) px[yy * w + xx] = pack(v);
          }
        },
        span(Y, xa, xb, col, k = 1) {
          Y = Math.round(Y); if (Y < 0 || Y >= h) return;
          const v = pack(col); for (let xx = Math.max(0, Math.round(xa)); xx < Math.min(w, Math.round(xb)); xx++) put(xx, Y, v, k);
        },
        // Filled polygon from flat [x, y, ...] points (even-odd scanline fill, no anti-aliasing).
        poly(pts, col, k = 1) {
          let ya = Infinity, yb = -Infinity; const n = pts.length / 2;
          for (let i = 1; i < pts.length; i += 2) { ya = Math.min(ya, pts[i]); yb = Math.max(yb, pts[i]); }
          const xs = [];
          for (let yy = Math.max(0, Math.floor(ya)); yy <= Math.min(h - 1, Math.ceil(yb)); yy++) {
            const sy = yy + 0.5; xs.length = 0;
            for (let i = 0, j = n - 1; i < n; j = i++) {
              const xi = pts[i * 2], yi = pts[i * 2 + 1], xj = pts[j * 2], yj = pts[j * 2 + 1];
              if ((yi > sy) !== (yj > sy)) xs.push(xi + ((sy - yi) / (yj - yi)) * (xj - xi));
            }
            xs.sort((p, q) => p - q);
            for (let i = 0; i + 1 < xs.length; i += 2) b.span(yy, xs[i], xs[i + 1], col, k);
          }
        },
        disc(cx, cy, r, col, k = 1, ry = r) {
          for (let yy = Math.ceil(cy - ry - 1); yy <= cy + ry; yy++) {
            const dy = (yy + 0.5 - cy) / ry; if (dy * dy > 1) continue;
            const hw = r * Math.sqrt(1 - dy * dy); b.span(yy, cx - hw, cx + hw, col, k);
          }
        },
        line(x0, y0, x1, y1, col) {
          x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
          const v = pack(col), dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
          let e = dx + dy;
          for (let i = 0; i < 2000; i++) {
            if (x0 >= 0 && y0 >= 0 && x0 < w && y0 < h) px[y0 * w + x0] = v;
            if (x0 === x1 && y0 === y1) break;
            const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; }
          }
        },
        // Hand-drawn sprite: rows of characters, pal maps a character to a colour; others are see-through.
        sprite(rows, pal, X, Y, flip = false) {
          X = Math.round(X); Y = Math.round(Y);
          for (let r = 0; r < rows.length; r++) {
            const row = rows[r], yy = Y + r; if (yy < 0 || yy >= h) continue;
            for (let i = 0; i < row.length; i++) {
              const col = pal[row[i]]; if (col === undefined) continue;
              const xx = X + (flip ? row.length - 1 - i : i); if (xx >= 0 && xx < w) px[yy * w + xx] = pack(col);
            }
          }
        },
        // Pool of light: tints towards col by up to a, falling off over an ellipse, in `steps`
        // dithered levels rather than a smooth gradient.
        light(cx, cy, rx, ry, col, a = 0.5, steps = 4, x0 = 0, x1 = w, y1 = h) {
          const v = pack(col);
          for (let yy = Math.max(0, Math.floor(cy - ry)); yy < Math.min(y1, cy + ry); yy++) for (let xx = Math.max(x0, Math.floor(cx - rx)); xx < Math.min(x1, cx + rx); xx++) {
            const dx = (xx + 0.5 - cx) / rx, dy = (yy + 0.5 - cy) / ry, d = dx * dx + dy * dy; if (d >= 1) continue;
            const m = a * (1 - Math.sqrt(d)) ** 2, q = Math.floor(m * steps + BAYER[((yy & 3) << 2) | (xx & 3)]) / steps;
            if (q > 0) px[yy * w + xx] = mixPacked(px[yy * w + xx], v, Math.min(1, q));
          }
        },
        // Copy a horizontal band from another buffer, shifted by dx and wrapping round.
        band(o, sy, dy, rows, dx = 0) {
          for (let r = 0; r < rows; r++) {
            const ys = sy + r, yd = dy + r; if (ys < 0 || ys >= o.h || yd < 0 || yd >= h) continue;
            const s0 = ys * o.w, d0 = yd * w, n = Math.min(w, o.w);
            for (let xx = 0; xx < n; xx++) px[d0 + xx] = o.px[s0 + ((((xx + dx) % o.w) + o.w) % o.w)];
          }
        },
        // Scale the buffer up to cover (x, y, dw, dh) in the 960x540 space, keeping pixels crisp.
        show(X = 0, Y = 0, dw = W, dh = H) {
          x.putImageData(img, 0, 0);
          c.save(); c.imageSmoothingEnabled = false; c.drawImage(cv, X, Y, dw, dh); c.restore();
        },
      };
      return b;
    }
    // Seeded random numbers, so a scene looks the same every time it is shown.
    function rng(seed) {
      let s = seedOf(seed) || 1;
      const r = () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
      r.range = (a, b) => a + r() * (b - a);
      r.int = (a, b) => Math.floor(a + r() * (b - a + 1));
      r.pick = arr => arr[Math.floor(r() * arr.length)];
      return r;
    }
    // Smooth value noise in [0, 1). period (in noise cells) makes it repeat across x.
    function noise2(x, y, s = 0, period = 0) {
      const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
      const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      const wx = i => (period ? ((i % period) + period) % period : i);
      const a = hash(wx(xi), yi, s), b = hash(wx(xi + 1), yi, s), cc = hash(wx(xi), yi + 1, s), d = hash(wx(xi + 1), yi + 1, s);
      return a + (b - a) * u + (cc - a) * v + (a - b - cc + d) * u * v;
    }
    function fbm(x, y, oct = 4, s = 0, period = 0) {
      let sum = 0, amp = 0.5, norm = 0;
      for (let i = 0; i < oct; i++) { sum += amp * noise2(x, y, s + i * 31, period); norm += amp; x *= 2; y *= 2; period *= 2; amp *= 0.5; }
      return sum / norm;
    }
    const mix = (a, b, k) => { const v = mixPacked(pack(a), pack(b), k); return '#' + [v & 255, (v >>> 8) & 255, (v >>> 16) & 255].map(n => n.toString(16).padStart(2, '0')).join(''); };
    // blend: like mix, but on packed colours, for per-pixel work such as reflections.
    return { buffer, rng, noise: noise2, fbm, dith, mix, pack, blend: (a, b, k) => mixPacked(pack(a), pack(b), k) };
  }

  function select(ids, tags) {
    let list = registry.slice();
    if (ids && ids.length) list = ids.map(id => registry.find(s => s.id === id)).filter(Boolean);
    if (tags && tags.length) list = list.filter(s => s.tags.some(tg => tags.includes(tg)));
    return list.length ? list : registry.slice();
  }

  function mount(canvas, opts) {
    const o = Object.assign({ interval: 12, fade: 1.6, shuffle: false, clock: true, label: true, fps: 30, scenes: null, tags: null, grain: 0 }, opts || {});
    const c = canvas.getContext('2d');
    const g = helpers(c);
    const view = { scale: 1, offX: 0, offY: 0 };
    g.riso = risoKit(c, g, view);
    g.pixel = pixelKit(c);
    const grain = makeGrain(c);
    const order = select(o.scenes, o.tags);
    if (o.shuffle) order.sort(() => Math.random() - 0.5);
    const live = new Map();                      // scene id -> draw function (created lazily, kept)
    const drawOf = s => { if (!live.has(s.id)) { g._owner = s.id; live.set(s.id, s.create(g)); g._owner = null; } return live.get(s.id); };

    let cur = 0, prev = -1, fadeT = 0, since = 0, t = 0, acc = 0, paused = false, stopped = false;
    let upcoming = -1;                           // chosen in advance so its print can be prepared
    let last = performance.now();
    let scale = 1, offX = 0, offY = 0;

    function resize() {
      const dpr = Math.min((typeof window !== 'undefined' && window.devicePixelRatio) || 1, 2);
      const w = canvas.clientWidth || canvas.width || W, h = canvas.clientHeight || canvas.height || H;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      scale = Math.max(canvas.width / W, canvas.height / H);
      offX = (canvas.width - W * scale) / 2; offY = (canvas.height - H * scale) / 2;
      view.scale = scale; view.offX = offX; view.offY = offY;
    }
    resize();
    let ro = null;
    if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(resize); ro.observe(canvas); }
    else if (typeof addEventListener !== 'undefined') addEventListener('resize', resize);

    function go(n) {
      if (order.length < 2) return;
      prev = cur; cur = ((n % order.length) + order.length) % order.length; fadeT = 0; since = 0;
      upcoming = -1; released = false;
    }
    let released = true;
    function nextIndex() {
      if (!o.shuffle || order.length < 3) return cur + 1;
      let n; do { n = Math.floor(Math.random() * order.length); } while (n === cur);
      return n;
    }

    function overlay() {
      // White text with a soft shadow by default; a scene can ask for ink-coloured text instead
      // (overlay: { color: '#3d5588', label: '#914e72', shadow: false }), which reads better on paper.
      const ov = order[cur].overlay || {}, ink = ov.color || '#ffffff';
      c.save();
      if (ov.shadow !== false) { c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 10; c.shadowOffsetY = 1; }
      c.fillStyle = ink;
      const a0 = c.globalAlpha;
      // The clock drifts slowly so nothing sits still on OLED panels.
      if (o.clock) {
        const d = new Date(), cx = W - 180 + 30 * Math.sin(t * 0.05), cy = 80 + 15 * Math.sin(t * 0.07);
        c.textAlign = 'center';
        c.globalAlpha = a0 * 0.92; c.font = '500 56px sans-serif';
        c.fillText(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), cx, cy);
        c.globalAlpha = a0 * 0.78; c.font = '22px sans-serif';
        c.fillText(d.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' }), cx, cy + 32);
      }
      if (o.label) {
        c.textAlign = 'left'; c.font = '20px sans-serif'; c.globalAlpha = a0 * 0.78; c.fillStyle = ov.label || ink;
        c.fillText(order[cur].name, 32, H - 30);
        const n = order.length, gap = n > 12 ? 14 : 20;
        for (let i = 0; i < n; i++) { c.globalAlpha = a0 * (i === cur ? 0.9 : 0.4); g.dot(W - 40 - (n - 1 - i) * gap, H - 37, i === cur ? 6 : 4, ov.label || ink); }
      }
      c.restore();
    }

    function frame(now) {
      if (stopped) return;
      requestAnimationFrame(frame);
      acc += (now - last) / 1000; last = now;
      if (acc < 1 / o.fps - 0.002) return;       // frame cap
      const dt = Math.min(0.1, acc); acc = 0; t += dt;

      if (!paused) { since += dt; if (since > o.interval) go(upcoming >= 0 ? upcoming : nextIndex()); }
      // A few seconds before the switch, create the next scene so its print can be made in slices.
      if (order.length > 1 && !paused && since > o.interval - Math.max(4, o.interval * 0.5)) {
        if (upcoming < 0) upcoming = ((nextIndex() % order.length) + order.length) % order.length;
        const nx = order[upcoming];
        if (!live.has(nx.id)) drawOf(nx); else g.riso.prepare(nx.id);
      }
      g.riso.work(o.printBudget || 6);

      c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
      c.fillStyle = '#000'; c.fillRect(0, 0, canvas.width, canvas.height);
      c.setTransform(scale, 0, 0, scale, offX, offY);
      if (prev >= 0 && fadeT < o.fade) {
        fadeT += dt;
        drawOf(order[prev])(t, dt);
        c.globalAlpha = Math.min(1, fadeT / o.fade);
        drawOf(order[cur])(t, dt);
        c.globalAlpha = 1;
      } else {
        prev = -1;
        drawOf(order[cur])(t, dt);
        // Once the crossfade is over, free the prints of scenes that are off screen.
        if (!released) { released = true; g.riso.release([order[cur].id, upcoming >= 0 ? order[upcoming].id : null]); }
      }
      // Fine paper grain over everything gives the flat shapes a printed, hand-made feel.
      if (grain && o.grain > 0) {
        c.save(); c.globalCompositeOperation = 'soft-light'; c.globalAlpha = o.grain;
        c.fillStyle = grain; c.fillRect(0, 0, W, H); c.restore();
      }
      overlay();
    }
    requestAnimationFrame(frame);

    // Don't let a long background gap make everything jump.
    const onVis = () => { last = performance.now(); acc = 0; };
    if (typeof document !== 'undefined' && document.addEventListener) document.addEventListener('visibilitychange', onVis);

    return {
      next: () => go(cur + 1),
      prev: () => go(cur - 1),
      goTo: i => { if (i !== cur) go(i); },
      get index() { return cur; },
      get order() { return order.slice(); },
      get paused() { return paused; },
      set: (key, value) => { o[key] = value; },   // e.g. set('clock', false), set('interval', 20)
      pause: p => { paused = p === undefined ? !paused : !!p; return paused; },
      get scene() { return order[cur]; },
      // Stop, and free every print this player made (they hold full-screen canvases).
      destroy() { stopped = true; if (ro) ro.disconnect(); g.riso.release([]); },
    };
  }

  const api = { register, mount, scenes: registry, W, H };
  if (typeof window !== 'undefined') window.Screensaver = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
