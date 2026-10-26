Screensaver.register({
  id: 'blossom-canal', name: 'Blossom canal', tags: ['day', 'water', 'pixel', 'calm'],
  overlay: { color: '#46506a', label: '#46506a', shadow: false },
  create(g) {
    const P = g.pixel, PW = 320, PH = 180, HZ = 118, rnd = P.rng('blossom-canal');
    const bg = P.buffer(PW, PH), refl = P.buffer(PW, PH), fr = P.buffer(PW, PH);
    const WATER = P.pack('#a9b7c1');
    // The canal narrows towards the horizon: its edges at row y.
    const edgeL = y => 146 - ((y - HZ) / (PH - HZ)) * 112, edgeR = y => 174 + ((y - HZ) / (PH - HZ)) * 128;

    // Pale sky and a low red sun.
    bg.vgrad([[0, '#e6eaec'], [0.6, '#eff1f0'], [1, '#f3f2ee']], 0, HZ, 0.8);
    bg.disc(192, 36, 9, '#ee9d8c');
    bg.disc(192, 36, 9, '#f4b4a2', 0.3);

    // Far city in two hazy layers, with a slender tower.
    const skyline = (base, hmin, hmax, wmin, wmax, col, win, seed) => {
      const r = P.rng(seed);
      for (let x = -4; x < PW;) {
        const w = r.int(wmin, wmax), h = r.int(hmin, hmax);
        bg.rect(x, base - h, w, h, col);
        if (win) for (let yy = base - h + 3; yy < base - 2; yy += 3) for (let xx = x + 2; xx < x + w - 2; xx += 3) if (r() < 0.6) bg.set(xx, yy, win);
        x += w + r.int(0, 2);
      }
    };
    skyline(HZ - 6, 12, 40, 8, 18, '#dce1e5', '#d0d6dc', 'far');
    bg.rect(98, 40, 2, 72, '#cfd5db'); bg.rect(96, 52, 6, 3, '#cfd5db'); bg.rect(97, 30, 1, 10, '#cfd5db');
    skyline(HZ - 2, 6, 24, 10, 22, '#c6cdd4', '#b7c0c8', 'mid');

    // The tram bridge across the far end of the canal.
    bg.rect(0, 97, PW, 3, '#98a4b0'); bg.rect(0, 96, PW, 1, '#b3bdc6');
    for (let x = 6; x < PW; x += 26) { bg.rect(x, 100, 3, HZ - 100, '#a3aeb9'); bg.rect(x - 1, 100, 5, 1, '#8e9aa6'); }
    for (let x = 0; x < PW; x += 4) bg.set(x, 95, '#a3aeb9');

    // Low houses along both banks.
    const r2 = P.rng('houses');
    for (let x = -2; x < PW;) {
      const w = r2.int(12, 22), h = r2.int(8, 18), roof = r2.pick(['#6d7888', '#5f6a7b', '#7b8595']);
      if (x + w < 140 || x > 182) {
        bg.rect(x, HZ - h, w, h, roof === '#6d7888' ? '#8a95a3' : '#97a1ae');
        bg.rect(x, HZ - h, w, 2, roof);
        for (let yy = HZ - h + 4; yy < HZ - 2; yy += 4) for (let xx = x + 2; xx < x + w - 2; xx += 4) bg.rect(xx, yy, 2, 2, r2() < 0.2 ? '#e9d7b8' : '#5d6878');
      }
      x += w + r2.int(1, 3);
    }

    // The cherry tree: branches first, then a canopy of blossom lit from the top left.
    const branch = (x, y, ang, len, th, depth) => {
      const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
      for (let i = 0; i <= len; i++) { const k = i / len; bg.disc(x + (x2 - x) * k, y + (y2 - y) * k, th * (1 - 0.35 * k), '#4b4966'); }
      if (depth > 0) {
        branch(x2, y2, ang - rnd.range(0.3, 0.7), len * rnd.range(0.6, 0.8), th * 0.65, depth - 1);
        branch(x2, y2, ang + rnd.range(0.2, 0.6), len * rnd.range(0.55, 0.75), th * 0.6, depth - 1);
      }
    };
    branch(34, PH + 4, -1.45, 58, 5, 0);
    branch(42, 128, -1.9, 34, 3.4, 3); branch(42, 128, -0.75, 46, 3.4, 3); branch(40, 140, -0.2, 40, 2.6, 2);
    const canopy = (x, y) => {
      const dx = (x - 70) / 120, dy = (y - 48) / 62;
      return P.fbm(x * 0.045, y * 0.06, 4, 11) + 0.5 - Math.sqrt(dx * dx + dy * dy) * 0.85 + (P.fbm(x * 0.16, y * 0.16, 2, 5) - 0.5) * 0.16;
    };
    const BLOSSOM = ['#c8687f', '#e5889c', '#f4b5c1', '#fcdde3'];
    const CW = 200, CH = 150, CN = new Float32Array(CW * CH);
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) CN[y * CW + x] = canopy(x, y);
    bg.paint(0, 0, CW, CH, (x, y) => {
      const n = CN[y * CW + x];
      if (n < 0.47 || (n < 0.5 && !P.dith(x, y, (n - 0.47) / 0.03))) return;
      const lit = n - (x > 2 && y > 2 ? CN[(y - 3) * CW + x - 3] : 0) + (n - 0.5) * 0.6;         // brighter where the canopy rises towards the light
      let k = lit > 0.05 ? 3 : lit > -0.01 ? 2 : lit > -0.07 ? 1 : 0;
      if (k < 3 && P.dith(x, y, ((lit + 0.13) * 8) % 1 * 0.5)) k++;
      return BLOSSOM[k];
    });

    // The reflection: everything above the horizon mirrored into the water, tinted by it.
    for (let y = HZ; y < PH; y++) {
      const ys = 2 * HZ - y - 1, k = 0.3 + ((y - HZ) / (PH - HZ)) * 0.25;
      for (let x = 0; x < PW; x++) refl.px[y * PW + x] = P.blend(bg.get(x, Math.max(0, ys)), WATER, k);
    }
    // Banks: pavement, a stone edge and receding railings and lamps on the right.
    for (let y = HZ; y < PH; y++) {
      const l = edgeL(y), r = edgeR(y), s = (y - HZ) / (PH - HZ);
      bg.span(y, 0, l, '#8f99a5'); bg.span(y, r, PW, '#8f99a5');
      bg.span(y, l - 1 - s * 3, l, '#4c5567'); bg.span(y, r, r + 1 + s * 3, '#4c5567');
    }
    // Paving in perspective, a few fallen petals and a hedge along the far edge.
    for (let i = 1; i < 12; i++) { const y = HZ + Math.round((i / 12) ** 1.6 * (PH - HZ)); bg.span(y, 0, edgeL(y) - 4, '#848e9b'); bg.span(y, edgeR(y) + 4, PW, '#848e9b'); }
    bg.paint(0, HZ + 2, PW, PH, (x, y, cur) => (cur === P.pack('#8f99a5') && P.noise(x * 0.7, y * 0.9, 21) > 0.9 ? (P.noise(x, y, 4) > 0.5 ? '#e6a2b0' : '#f2c6ce') : undefined));
    for (let x = 0; x < 150; x++) { const h = 3 + Math.round(P.noise(x * 0.3, 0, 8) * 3); bg.rect(x, HZ - h + 1, 1, h, x % 3 ? '#5d6b66' : '#6b7a73'); }
    for (let i = 0; i < 7; i++) {
      const s = (i + 1) / 7, y = HZ + s * s * (PH - HZ), x = edgeR(y) + 4 + s * 8, h = 3 + s * 12;
      bg.rect(x, y - h, 1 + (s > 0.5), h, '#4c5567');
      if (i % 3 === 1) { bg.rect(x, y - h * 2.6, 1 + (s > 0.5), h * 1.6, '#4c5567'); bg.rect(x - 1, y - h * 2.6 - 2, 3 + s * 2, 2, '#4c5567'); }
    }
    for (let x = 170; x < PW; x++) { const y = HZ + ((x - 174) / 128) * (PH - HZ); bg.set(x + 6, y - 4 - ((x - 174) / 128) * 10, '#5f6879'); }

    // Moving parts.
    const shimmer = [...Array(46)].map(() => { const y = rnd.int(HZ + 3, PH - 2); return { y, x: rnd.range(edgeL(y) + 4, edgeR(y) - 8), w: rnd.int(2, 5), p: rnd.range(0, 6.3), f: rnd.range(0.6, 1.4) }; });
    const petals = [...Array(30)].map(() => ({ x: 0, y: 0, vx: 0, vy: 0, p: 0, life: 0, float: false }));
    const spawn = (q, anywhere) => {
      q.x = rnd.range(10, 170); q.y = anywhere ? rnd.range(20, PH) : rnd.range(20, 90);
      q.vx = rnd.range(5, 12); q.vy = rnd.range(5, 10); q.p = rnd.range(0, 6.3); q.float = false; q.life = 0;
    };
    petals.forEach(q => spawn(q, true));
    const clouds = [[30, 22, 46], [160, 34, 30], [250, 74, 38], [90, 82, 24]];
    const DUCK = ['..h..', '.hbbb', 'bbbbb'], duckPal = { h: '#3e6157', b: '#7f6a5a' };
    const TRAM_PERIOD = 46;
    const step = q => Math.floor(q * 6) / 6;                         // pixel-art motion: 6 updates a second

    return (t, dt) => {
      fr.copy(bg);
      const ts = step(t);
      // Thin clouds drifting across the sky.
      for (const [x0, y, w] of clouds) {
        const x = g.wrap(x0 + t * 1.2, PW, 50);
        fr.span(y, x, x + w, '#d9dee3'); fr.span(y + 1, x + 6, x + w + 10, '#e1e5e8'); fr.span(y - 1, x + 10, x + w - 8, '#e4e7ea');
      }
      // The tram crosses the bridge now and then.
      const tx = ((t % TRAM_PERIOD) - 6) * 14 - 40;
      if (tx > -40 && tx < PW) {
        fr.rect(tx, 90, 36, 6, '#ebe5da'); fr.rect(tx, 93, 36, 1, '#d48479'); fr.rect(tx + 1, 89, 34, 1, '#c9c2b7');
        for (let i = 0; i < 6; i++) fr.rect(tx + 3 + i * 5.5, 91, 3, 1, '#7c8897');
        fr.rect(tx + 17, 86, 1, 3, '#7c8897');
      }
      // Water: the reflection, rippling row by row, with glints that come and go.
      for (let y = HZ; y < PH; y++) {
        const l = Math.ceil(edgeL(y)), r = Math.floor(edgeR(y)), s = (y - HZ) / (PH - HZ);
        const dx = Math.round(Math.sin(ts * 1.7 + y * 0.55) * (0.4 + s * 1.8));
        const row = y * PW;
        for (let x = l; x < r; x++) fr.px[row + x] = refl.px[row + Math.min(PW - 1, Math.max(0, x + dx))];
      }
      for (const s of shimmer) if (Math.sin(ts * s.f + s.p) > 0.55) fr.span(s.y, s.x, s.x + s.w, '#e3e9ec');
      // Two ducks paddle across, leaving a little wake.
      for (let i = 0; i < 2; i++) {
        const x = g.wrap(300 - t * 3 + i * 9, PW, 30), y = 148 + i * 2 + (Math.floor(t * 2 + i) % 2);
        if (x > edgeL(y) + 2 && x < edgeR(y) - 6) {
          fr.sprite(DUCK, duckPal, x, y - 3);
          fr.span(y, x + 6, x + 9, '#dfe6ea'); fr.set(x + 10, y + 1, '#dfe6ea');
        }
      }
      // Petals fall from the tree; those that reach the water float a while.
      for (const q of petals) {
        if (q.float) { q.x += 2 * dt; q.life += dt; if (q.life > 9) spawn(q); }
        else {
          q.x += q.vx * dt; q.y += q.vy * dt;
          const y = q.y;
          if (y > HZ + 4 && q.x > edgeL(y) + 2 && q.x < edgeR(y) - 2 && rnd() < dt * 1.5) q.float = true;
          if (q.x > PW + 4 || q.y > PH + 2) spawn(q);
        }
        const x = q.x + (q.float ? 0 : 3 * Math.sin(t * 1.3 + q.p)), spin = Math.floor(t * 5 + q.p) % 3;
        const col = q.float ? '#f2c3cb' : spin === 0 ? '#fcdde3' : '#ec97a8';
        fr.set(x, q.y, col);
        if (spin === 1 || q.float) fr.set(x + 1, q.y, col);
      }
      fr.show();
    };
  },
});
