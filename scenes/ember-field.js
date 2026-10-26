Screensaver.register({
  id: 'ember-field', name: 'Ember field', tags: ['nature', 'pixel', 'calm'],
  create(g) {
    const P = g.pixel, PW = 320, PH = 180, HZ = 128, SW = 480, rnd = P.rng('ember-field');
    const sky = P.buffer(SW, HZ), bg = P.buffer(PW, PH), fr = P.buffer(PW, PH);
    const over = P.buffer(PW, PH);                                    // things in front of the drifting sky; 0 = see-through
    over.clear(0);

    // Brooding sky of swirling cloud, twice the screen wide and seamless, so it can drift.
    const SKY = ['#121a17', '#18221e', '#1f2a25', '#28352e', '#34423a', '#45554f', '#566c6c'];
    sky.paint(0, 0, SW, HZ, (x, y) => {
      const wx = P.fbm(x / 60, y / 40, 2, 5, SW / 60) * 2.2;
      let v = P.fbm(x / 40 + wx, y / 26, 4, 9, SW / 40);
      v += 0.22 * Math.exp(-(((y - 92) / 30) ** 2)) - y / 900;            // a paler band low down
      v = (v - 0.43) * 2.8 * 7;
      let k = Math.floor(v); if (P.dith(x, y, v - k)) k++;
      return SKY[Math.max(0, Math.min(SKY.length - 1, k))];
    });

    // The field: a band of grass glowing in the last light, then dark grass in front.
    bg.vgrad([[0, '#d98a2c'], [0.5, '#b9651d'], [1, '#6e3a16']], HZ - 2, 150, 0.7);
    bg.vgrad([[0, '#3a2a18'], [0.25, '#242a20'], [1, '#161a16']], 146, PH, 0.7);
    bg.light(70, 134, 120, 16, '#ffd27a', 0.6, 4);
    // Little white flowers caught in the light.
    for (let i = 0; i < 14; i++) {
      const x = 80 + rnd.range(-20, 26) + (i % 3) * 4, y = HZ + rnd.range(-6, 8), h = rnd.int(4, 12);
      over.line(x, y, x + rnd.int(-2, 2), y - h, '#c99a5a');
      over.set(x, y - h, '#f6ead0'); over.set(x + 1, y - h + 1, '#f6ead0');
    }
    // The bare tree on the right with small buds at the twig ends.
    const branch = (x, y, ang, len, th, depth) => {
      const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
      for (let i = 0; i <= len; i++) { const k = i / len; over.disc(x + (x2 - x) * k, y + (y2 - y) * k, Math.max(0.5, th * (1 - 0.4 * k)), '#1b211c'); }
      if (depth > 0) {
        const n = depth > 2 ? 2 : rnd.int(1, 3);
        for (let i = 0; i < n; i++) branch(x2, y2, ang + rnd.range(-0.7, 0.7), len * rnd.range(0.55, 0.8), th * 0.65, depth - 1);
      } else if (rnd() < 0.7) { over.set(x2, y2, '#7a6040'); over.set(x2 + 1, y2, '#5b4a34'); }
    };
    branch(204, PH + 2, -1.6, 60, 3.6, 0);
    branch(203, 124, -1.85, 34, 2.6, 5); branch(204, 132, -1.0, 32, 2, 4); branch(202, 142, -2.4, 30, 1.8, 4);

    // Grass blades, drawn live so the wind can move them.
    const blades = [];
    const GLOW = ['#f7b347', '#e8902c', '#c86e1f', '#ffd36e'];
    for (let i = 0; i < 300; i++) { const x = rnd.range(-4, PW + 4); blades.push({ x, y: HZ + rnd.range(-2, 16), h: rnd.range(4, 12), col: P.pack(rnd.pick(GLOW)), p: rnd.range(0, 1) }); }
    for (let i = 0; i < 240; i++) { const x = rnd.range(-6, PW + 6); blades.push({ x, y: rnd.range(150, PH + 6), h: rnd.range(10, 34), col: P.pack(rnd.pick(['#1d231d', '#242c23', '#2c3427', '#1a1f1a'])), p: rnd.range(0, 1) }); }
    blades.sort((a, b) => a.y - b.y);
    const leaves = [...Array(9)].map(() => ({ x: rnd.range(0, PW), y: rnd.range(0, PH), vx: rnd.range(10, 18), vy: rnd.range(6, 11), p: rnd.range(0, 6.3) }));
    const motes = [...Array(16)].map(() => ({ x: rnd.range(20, 200), y: rnd.range(100, 140), v: rnd.range(1.5, 4), p: rnd.range(0, 6.3) }));
    const step = q => Math.floor(q * 8) / 8;

    return (t, dt) => {
      fr.copy(bg);
      fr.band(sky, 0, 0, HZ - 2, Math.floor(t * 0.6));
      for (let i = 0; i < over.px.length; i++) if (over.px[i]) fr.px[i] = over.px[i];
      const ts = step(t);
      // A gust rolls across the field from the left.
      for (const b of blades) {
        const gust = Math.sin(ts * 1.6 - b.x * 0.035 + b.p * 0.8) * 0.5 + Math.sin(ts * 0.7 - b.x * 0.012) * 0.5;
        const lean = (0.25 + gust * 0.45) * b.h;
        fr.line(b.x, b.y, b.x + lean, b.y - b.h * (1 - Math.abs(gust) * 0.12), b.col);
      }
      // Leaves tumble on the wind.
      for (const l of leaves) {
        l.x += l.vx * dt; l.y += l.vy * dt;
        if (l.x > PW + 4 || l.y > PH + 4) { l.x = rnd.range(-20, PW * 0.6); l.y = -4; }
        const x = l.x + 4 * Math.sin(t * 1.7 + l.p), y = l.y + 2 * Math.sin(t * 2.3 + l.p), f = Math.floor(t * 6 + l.p) % 2;
        fr.set(x, y, '#e8902c'); fr.set(x + 1, y + f, '#c86e1f'); if (f) fr.set(x - 1, y, '#f7b347');
      }
      // Specks of light drift up from the bright grass.
      for (const m of motes) {
        m.y -= m.v * dt; if (m.y < 70) { m.y = rnd.range(126, 140); m.x = rnd.range(20, 200); }
        if (Math.sin(t * 2 + m.p) > -0.2) fr.set(m.x + 3 * Math.sin(t * 0.6 + m.p), m.y, Math.sin(t * 2 + m.p) > 0.7 ? '#fff1c4' : '#e5a04a');
      }
      fr.show();
    };
  },
});
