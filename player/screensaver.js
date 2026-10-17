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
    const grain = makeGrain(c);
    const order = select(o.scenes, o.tags);
    if (o.shuffle) order.sort(() => Math.random() - 0.5);
    const live = new Map();                      // scene id -> draw function (created lazily, kept)
    const drawOf = s => { if (!live.has(s.id)) live.set(s.id, s.create(g)); return live.get(s.id); };

    let cur = 0, prev = -1, fadeT = 0, since = 0, t = 0, acc = 0, paused = false, stopped = false;
    let last = performance.now();
    let scale = 1, offX = 0, offY = 0;

    function resize() {
      const dpr = Math.min((typeof window !== 'undefined' && window.devicePixelRatio) || 1, 2);
      const w = canvas.clientWidth || canvas.width || W, h = canvas.clientHeight || canvas.height || H;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      scale = Math.max(canvas.width / W, canvas.height / H);
      offX = (canvas.width - W * scale) / 2; offY = (canvas.height - H * scale) / 2;
    }
    resize();
    let ro = null;
    if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(resize); ro.observe(canvas); }
    else if (typeof addEventListener !== 'undefined') addEventListener('resize', resize);

    function go(n) {
      if (order.length < 2) return;
      prev = cur; cur = ((n % order.length) + order.length) % order.length; fadeT = 0; since = 0;
    }
    function nextIndex() {
      if (!o.shuffle || order.length < 3) return cur + 1;
      let n; do { n = Math.floor(Math.random() * order.length); } while (n === cur);
      return n;
    }

    function overlay() {
      // A soft shadow keeps white text readable on bright day scenes.
      c.save();
      c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 10; c.shadowOffsetY = 1;
      // The clock drifts slowly so nothing sits still on OLED panels.
      if (o.clock) {
        const d = new Date(), cx = W - 180 + 30 * Math.sin(t * 0.05), cy = 80 + 15 * Math.sin(t * 0.07);
        c.textAlign = 'center';
        c.fillStyle = 'rgba(255,255,255,.92)'; c.font = '500 56px sans-serif';
        c.fillText(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), cx, cy);
        c.fillStyle = 'rgba(255,255,255,.78)'; c.font = '22px sans-serif';
        c.fillText(d.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' }), cx, cy + 32);
      }
      if (o.label) {
        c.textAlign = 'left'; c.font = '20px sans-serif'; c.fillStyle = 'rgba(255,255,255,.78)';
        c.fillText(order[cur].name, 32, H - 30);
        const n = order.length, gap = n > 12 ? 14 : 20;
        for (let i = 0; i < n; i++) g.dot(W - 40 - (n - 1 - i) * gap, H - 37, i === cur ? 6 : 4, i === cur ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.4)');
      }
      c.restore();
    }

    function frame(now) {
      if (stopped) return;
      requestAnimationFrame(frame);
      acc += (now - last) / 1000; last = now;
      if (acc < 1 / o.fps - 0.002) return;       // frame cap
      const dt = Math.min(0.1, acc); acc = 0; t += dt;

      if (!paused) { since += dt; if (since > o.interval) go(nextIndex()); }

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
      destroy() { stopped = true; if (ro) ro.disconnect(); },
    };
  }

  const api = { register, mount, scenes: registry, W, H };
  if (typeof window !== 'undefined') window.Screensaver = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
