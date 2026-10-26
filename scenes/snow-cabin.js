Screensaver.register({
  id: 'snow-cabin', name: 'Snow cabin', tags: ['night', 'nature', 'water', 'pixel', 'calm'],
  create(g) {
    const P = g.pixel, PW = 320, PH = 180, SHORE = 128, rnd = P.rng('snow-cabin');
    const bg = P.buffer(PW, PH), refl = P.buffer(PW, PH), fr = P.buffer(PW, PH);
    const LAKE = '#0b1820', LAKEP = P.pack(LAKE);

    bg.vgrad([[0, '#0c171d'], [0.6, '#132630'], [1, '#1b323c']], 0, SHORE, 0.8);
    const stars = [...Array(40)].map(() => [rnd.int(0, PW - 1), rnd.int(2, 50), rnd.range(0, 6.3)]);

    // Pines: stepped triangles with snow caught on the left of each tier.
    const pine = (x, base, h, w, col, snow) => {
      const top = base - h;
      for (let y = top; y < base; y++) {
        const k = (y - top) / h, tier = ((y - top) % 6) / 6, hw = Math.max(0.5, w * k * (0.65 + 0.35 * tier));
        bg.span(y, x - hw, x + hw + 1, col);
        if (snow && tier < 0.34 && k > 0.1) bg.span(y, x - hw, x - hw + Math.max(1, hw * 0.5), snow);
      }
      bg.rect(x, base, 1, 3, '#0a1216');
    };
    for (let x = -6; x < PW + 6; x += rnd.int(5, 9)) pine(x, rnd.int(92, 102), rnd.int(34, 62), rnd.range(5, 8), '#16303a', '#3a5763');
    for (let x = -4; x < PW + 4; x += rnd.int(7, 12)) if (x < 100 || x > 200) pine(x, rnd.int(106, 114), rnd.int(40, 72), rnd.range(6, 10), '#0f2229', '#6f8a96');

    // Snowy bank, softly shaded, down to the shore.
    bg.paint(0, 96, PW, SHORE, (x, y) => {
      const top = 104 + Math.sin(x * 0.03) * 4 + P.noise(x * 0.08, 1, 6) * 4;
      if (y < top) return;
      const k = (y - top) / 20 + (P.noise(x * 0.05, y * 0.12, 2) - 0.5);
      return k < 0.25 ? '#d4e1e8' : k < 0.55 ? (P.dith(x, y, (k - 0.25) / 0.3) ? '#a9bdc9' : '#d4e1e8') : k < 0.9 ? '#a9bdc9' : '#7d93a1';
    });

    // The cabin.
    const CX = 120, CY = 122, CW = 58;
    bg.rect(CX, CY - 26, CW, 26, '#3b2520');
    for (let y = CY - 24; y < CY; y += 3) bg.rect(CX, y, CW, 1, '#2a1915');
    bg.poly([CX - 8, CY - 25, CX + CW / 2, CY - 50, CX + CW + 8, CY - 25], '#d9e5eb');
    bg.poly([CX - 8, CY - 25, CX + CW + 8, CY - 25, CX + CW + 6, CY - 22, CX - 6, CY - 22], '#8aa0ad');
    bg.poly([CX + CW / 2, CY - 50, CX + CW + 8, CY - 25, CX + CW / 2 + 6, CY - 27], '#b9cbd5');
    bg.rect(CX + 42, CY - 54, 6, 14, '#2a1915'); bg.rect(CX + 41, CY - 56, 8, 2, '#d9e5eb');
    const WINS = [[CX + 6, CY - 19, 9, 8], [CX + 21, CY - 19, 9, 8], [CX + 44, CY - 19, 9, 8]];
    bg.rect(CX + 34, CY - 18, 7, 18, '#22140f');
    // Warm light from the windows across the snow in front.
    bg.light(CX + 26, CY + 2, 54, 9, '#ffb75a', 0.45, 4, 0, PW, SHORE);
    bg.rect(CX - 4, CY, CW + 8, 2, '#c7d6de');
    // Shore line.
    bg.paint(0, SHORE - 2, PW, SHORE + 1, (x, y) => (y === SHORE ? '#e2ecf1' : P.dith(x, y, 0.5) ? '#8fa6b3' : undefined));

    // The lake mirrors the bank, cabin and forest, darkened.
    const mirror = () => {
      for (let y = SHORE + 1; y < PH; y++) {
        const ys = 2 * SHORE - y, k = 0.55 + ((y - SHORE) / (PH - SHORE)) * 0.2;
        for (let x = 0; x < PW; x++) refl.px[y * PW + x] = P.blend(bg.get(x, ys), LAKEP, k);
      }
    };
    const drawWins = col => {
      for (const [x, y, w, h] of WINS) {
        bg.rect(x - 1, y - 1, w + 2, h + 2, '#1e110d'); bg.rect(x, y, w, h, col);
        bg.rect(x + 4, y, 1, h, '#5a3020'); bg.rect(x, y + 3, w, 1, '#5a3020'); bg.rect(x + 1, y + 1, 2, 1, '#fff2c0');
      }
    };
    drawWins('#ffc768');
    mirror();
    bg.rect(0, SHORE + 1, PW, PH - SHORE - 1, LAKE);

    const snow = [...Array(200)].map(() => ({ x: rnd.range(0, PW), y: rnd.range(0, PH), v: rnd.range(6, 16), p: rnd.range(0, 6.3), b: rnd() < 0.2 }));
    const smoke = [...Array(10)].map((_, i) => ({ age: i * 1.3 }));
    const glints = [...Array(30)].map(() => ({ x: rnd.int(0, PW - 4), y: rnd.int(SHORE + 4, PH - 1), p: rnd.range(0, 6.3) }));
    const step = q => Math.floor(q * 6) / 6;
    let fire = 0;

    return (t, dt) => {
      // The fire inside wavers a little: the windows change shade now and then.
      const f = Math.sin(t * 0.9) + Math.sin(t * 2.3 + 1) * 0.5 > 0.6 ? 1 : 0;
      if (f !== fire) { fire = f; drawWins(f ? '#ffb552' : '#ffc768'); }
      fr.copy(bg);
      for (const [x, y, p] of stars) { const s = Math.sin(t * 1.1 + p); if (s > -0.4) fr.set(x, y, s > 0.75 ? '#e8f2f6' : '#6f8892'); }
      // Lake: the reflection, rippling, plus the window light stretched on the water.
      const ts = step(t);
      for (let y = SHORE + 1; y < PH; y++) {
        const s = (y - SHORE) / (PH - SHORE), dx = Math.round(Math.sin(ts * 1.4 + y * 0.6) * (0.5 + s * 2)), row = y * PW;
        for (let x = 0; x < PW; x++) fr.px[row + x] = refl.px[row + Math.min(PW - 1, Math.max(0, x + dx))];
      }
      for (const [x, y, w] of WINS) {
        const ry = 2 * SHORE - y;
        for (let k = 0; k < 9; k++) if (Math.sin(ts * 2 + k * 1.7 + x) > -0.3) fr.span(ry - 6 + k * 2, x + 1 + (k % 2), x + w - 1 - (k % 3), fire ? '#c98436' : '#d8963f', 0.75);
      }
      for (const gl of glints) if (Math.sin(ts * 1.2 + gl.p) > 0.7) fr.span(gl.y, gl.x, gl.x + 3, '#2c4552');
      // Chimney smoke: puffs that rise, drift and thin out.
      for (const s of smoke) {
        s.age += dt; if (s.age > 13) s.age -= 13;
        const a = s.age, x = CX + 45 + a * 2.4 + Math.sin(a * 0.8) * 2, y = CY - 58 - a * 4.2, r = 1.5 + a * 0.45;
        fr.disc(x, y, r, '#5e717c', Math.max(0, 0.55 - a * 0.042));
      }
      // Snowfall.
      for (const s of snow) {
        s.y += s.v * dt; if (s.y > PH) { s.y = -2; s.x = rnd.range(0, PW); }
        const x = s.x + 2 * Math.sin(t * 0.7 + s.p), y = s.y;
        if (y < SHORE || s.b) fr.set(x, y, s.b ? '#e6eff3' : '#a8bcc6');
      }
      fr.show();
    };
  },
});
