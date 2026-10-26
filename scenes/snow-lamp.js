Screensaver.register({
  id: 'snow-lamp', name: 'Snowy lamp', tags: ['night', 'pixel', 'calm'],
  create(g) {
    const P = g.pixel, PW = 320, PH = 180, rnd = P.rng('snow-lamp');
    const bg = P.buffer(PW, PH), fr = P.buffer(PW, PH);
    const LX = 186, LY = 64;                                         // the lamp head

    // Night sky, a little lighter low down where the city glows.
    bg.vgrad([[0, '#232229'], [0.55, '#2b2a32'], [1, '#383640']], 0, PH, 0.7);
    bg.paint(0, 0, PW, PH, (x, y, cur) => (P.noise(x * 0.9, y * 0.9, 3) > 0.96 ? P.mix('#2b2a32', '#55535c', 0.6) : undefined));

    // Point on a four-corner patch: corners are [tl, tr, br, bl], each [x, y].
    const at = (q, u, v) => {
      const top = [q[0][0] + (q[1][0] - q[0][0]) * u, q[0][1] + (q[1][1] - q[0][1]) * u];
      const bot = [q[3][0] + (q[2][0] - q[3][0]) * u, q[3][1] + (q[2][1] - q[3][1]) * u];
      return [top[0] + (bot[0] - top[0]) * v, top[1] + (bot[1] - top[1]) * v];
    };
    const face = (q, col) => bg.poly([].concat(...q), col);
    const WARM = ['#c8955b', '#e2b877', '#b5794a', '#f0cf94'], COOL = ['#7fa8c3', '#4fae9c', '#b48d8d', '#9cadbd'];
    const windows = [];
    // Windows in rows and columns over a face, as small four-sided shapes that follow its perspective.
    const grid = (q, cols, rows, mu, mv, litShare, dark) => {
      for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
        const u0 = (k + mu) / cols, u1 = (k + 1 - mu) / cols, v0 = (r + mv) / rows, v1 = (r + 1 - mv * 0.6) / rows;
        const pts = [at(q, u0, v0), at(q, u1, v0), at(q, u1, v1), at(q, u0, v1)];
        const w = { pts: [].concat(...pts), dark, lit: rnd() < litShare, col: rnd() < 0.55 ? rnd.pick(WARM) : rnd.pick(COOL) };
        windows.push(w);
      }
    };
    const drawWindow = w => {
      bg.poly(w.pts, w.lit ? w.col : w.dark);
      if (w.lit) bg.line(w.pts[0], w.pts[1], w.pts[2], w.pts[3], P.mix(w.col, '#ffffff', 0.35));
    };

    // A far block in the fog, then the tall block leaning over the viewer: side face and front face.
    const far = [[160, 58], [208, 70], [208, 180], [160, 180]];
    face(far, '#33323b'); grid(far, 4, 9, 0.3, 0.35, 0.25, '#2e2d35');
    const side = [[114, 6], [170, 36], [174, 180], [128, 180]];
    const front = [[-14, -24], [114, 6], [128, 180], [-14, 180]];
    face(side, '#33323c'); face(front, '#3b3a44'); bg.line(...side[0], ...side[3], '#45444f');
    for (let r = 1; r < 16; r++) bg.line(...at(front, 0, r / 16), ...at(front, 1, r / 16), '#4a4954');   // floor ledges
    grid(side, 3, 16, 0.25, 0.3, 0.3, '#25242b');
    grid(front, 6, 16, 0.22, 0.3, 0.34, '#2a2930');
    // The TV window: a cool light that wavers.
    const tv = windows.filter(w => w.lit).sort((a, b) => b.pts[1] - a.pts[1])[3];
    windows.forEach(drawWindow);
    bg.light(176, 186, 80, 52, '#3d5b97', 0.5, 4);                    // blue haze at street level

    // The lamp post: a tapering curve, lit on its left side.
    const curve = (t2) => {
      const a = [240, 182], b = [232, 62], e = [LX + 4, LY + 1], m = 1 - t2;
      return [m * m * a[0] + 2 * m * t2 * b[0] + t2 * t2 * e[0], m * m * a[1] + 2 * m * t2 * b[1] + t2 * t2 * e[1]];
    };
    for (let i = 0; i <= 260; i++) {
      const s = i / 260, [x, y] = curve(s), r = 2.6 - 1.4 * s;
      bg.span(y, x - r, x + r, '#7d4a24');
      bg.span(y, x - r, x - r + 1, '#c9853f');
      bg.span(y, x + r - 1, x + r, '#3a2417');
    }
    bg.light(LX, LY, 72, 66, '#d8c7a3', 0.42, 5);
    bg.light(LX, LY + 2, 22, 18, '#fff3d6', 0.85, 4);
    bg.rect(LX - 5, LY - 2, 12, 2, '#4b3020');
    bg.rect(LX - 4, LY, 10, 2, '#fff6dd');
    bg.rect(LX - 2, LY + 2, 6, 1, '#ffe5a8');

    // Snow: most flakes are single far pixels, a few near ones are bigger and faster.
    const flakes = [...Array(460)].map((_, i) => {
      const near = i < 34;
      return { x: rnd.range(0, PW), y: rnd.range(0, PH), vy: near ? rnd.range(26, 38) : rnd.range(7, 17), sway: rnd.range(2, 6), f: rnd.range(0.4, 1.2), p: rnd.range(0, 6.3), near, b: rnd.range(0, 0.4) };
    });
    const SNOW = ['#4c4b54', '#6c6a72', '#9b968f', '#d8cfbd', '#fbf4e2', '#fffaf0'].map(P.pack);
    const lightAt = (x, y) => {
      const dx = x - LX, dy = y - LY, d = Math.sqrt(dx * dx + dy * dy);
      let k = Math.max(0, 1 - d / 95);
      if (dy > 0 && Math.abs(dx) < dy * 0.55 + 6) k = Math.max(k, 0.55 * (1 - dy / 170));   // the cone under the lamp
      return k;
    };
    const lit = windows.filter(w => w !== tv);
    let nextFlip = 3;

    return (t, dt) => {
      // Now and then someone switches a light on or off.
      if (t > nextFlip) { nextFlip = t + rnd.range(2.5, 6); const w = rnd.pick(lit); w.lit = !w.lit; drawWindow(w); }
      if (tv) { const k = 0.5 + 0.5 * Math.sin(t * 3.1) * Math.sin(t * 1.7 + 1); tv.col = k > 0.6 ? '#8fb7ea' : k > 0.3 ? '#77a1dc' : '#6a8fd0'; drawWindow(tv); }
      fr.copy(bg);
      for (const s of flakes) {
        s.y += s.vy * dt;
        if (s.y > PH + 2) { s.y = -2; s.x = rnd.range(0, PW); }
        const x = Math.round(s.x + s.sway * Math.sin(t * s.f + s.p)), y = Math.round(s.y);
        const k = Math.min(5, Math.floor((s.near ? 2 : 0.6) + s.b + lightAt(x, y) * 4.4));
        if (x < 0 || x >= PW || y < 0 || y >= PH) continue;
        fr.px[y * PW + x] = SNOW[k];
        if (s.near) { fr.set(x + 1, y, SNOW[Math.max(1, k - 1)]); fr.set(x, y + 1, SNOW[Math.max(1, k - 1)]); }
      }
      fr.show();
    };
  },
});
