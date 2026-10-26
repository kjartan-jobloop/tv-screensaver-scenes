Screensaver.register({
  id: 'golden-hour', name: 'Golden hour', tags: ['day', 'pixel', 'calm'],
  create(g) {
    const P = g.pixel, PW = 320, PH = 180, rnd = P.rng('golden-hour');
    const bg = P.buffer(PW, PH), fr = P.buffer(PW, PH);
    const step = (q, n = 6) => Math.floor(q * n) / n;

    // Warm dusty sky.
    bg.vgrad([[0, '#9c7352'], [0.45, '#b9895c'], [1, '#d6a468']], 0, 140, 0.9);
    // A towering cumulus, lit from the low sun on the right.
    const CLOUD = ['#9e5a37', '#c4723a', '#e5983f', '#f6c157', '#ffe08c'];
    const DW = 256, DH = 140, D = new Float32Array(DW * DH);
    for (let x = 0; x < DW; x++) {
      const top = 4 + P.fbm(x * 0.018, 3, 3, 2) * 60 + Math.abs(x - 110) * 0.3;
      for (let y = 0; y < DH; y++) D[y * DW + x] = y < top - 20 ? 0 : P.fbm(x * 0.035, y * 0.045, 4, 7) * 0.9 + Math.min(0.5, (y - top) * 0.02);
    }
    bg.paint(0, 0, 250, DH, (x, y) => {
      const d = D[y * DW + x];
      if (d < 0.5 || (d < 0.53 && !P.dith(x, y, (d - 0.5) / 0.03))) return;
      const lit = (d - (y > 2 ? D[(y - 3) * DW + x + 4] : 0)) * 6 + (0.62 - y / 230);
      let k = lit > 0.55 ? 4 : lit > 0.25 ? 3 : lit > -0.05 ? 2 : lit > -0.35 ? 1 : 0;
      if (k < 4 && P.dith(x, y, (((lit + 2) * 3.3) % 1) * 0.45)) k++;
      return CLOUD[k];
    });
    // Sunlit mountains low on the right, and wispy streaks.
    bg.paint(200, 96, PW, 140, (x, y) => (y > 104 + P.fbm(x * 0.03, 0, 3, 4) * 26 ? (P.dith(x, y, (y - 100) / 40) ? '#a35a35' : '#c97b45') : undefined));
    for (let i = 0; i < 9; i++) { const y = rnd.int(10, 70), x = rnd.int(150, 300), w = rnd.int(14, 40); bg.span(y, x, x + w, '#c79764', 0.5); }

    // Tower blocks with rim light on their right edges; windows remembered so they can switch.
    const windows = [];
    const tower = (x, top, w, col) => {
      bg.rect(x, top, w, 140 - top, col);
      bg.rect(x + w - 2, top, 2, 140 - top, '#6f4a37'); bg.rect(x, top, w, 1, '#7a5440');
      for (let yy = top + 5; yy < 128; yy += 4) for (let xx = x + 3; xx < x + w - 4; xx += 3) {
        const wd = { x: xx, y: yy, on: rnd() < 0.42, col: rnd.pick(['#f2c66d', '#e2a24e', '#f7dc93']) };
        windows.push(wd);
      }
    };
    bg.rect(205, 100, 90, 40, '#4b3530');
    for (let x = 210; x < 292; x += 14) { bg.rect(x, 92 - (x % 3) * 3, 8, 48, '#55392f'); bg.rect(x + 3, 84 - (x % 3) * 3, 2, 8, '#55392f'); }
    tower(26, 34, 52, '#3a2e2c'); tower(118, 58, 40, '#3d302d'); tower(170, 74, 30, '#3a2d2b');
    // Rooftop signs: a billboard and a neon word.
    bg.rect(32, 22, 36, 11, '#cdb79b'); bg.rect(33, 23, 34, 9, '#a8907a'); bg.rect(48, 33, 2, 2, '#3a2e2c');
    for (let i = 0; i < 5; i++) bg.rect(36 + i * 6, 25, 4, 5, '#5b4639');
    // Neon "HOTEL" from 3x5 letters.
    const GLYPH = { H: '101101111101101', O: '111101101101111', T: '111010010010010', E: '111100110100111', L: '100100100100111' };
    const NEON = [...'HOTEL'].map((ch, i) => ({ x: 121 + i * 7, y: 49, bits: GLYPH[ch] }));
    const drawWin = w => bg.rect(w.x, w.y, 2, 2, w.on ? w.col : '#2a2221');
    windows.forEach(drawWin);

    // Overpass, then the street with a kiosk and lamps.
    bg.rect(0, 138, PW, 12, '#3a2c29');
    for (let x = 3; x < PW; x += 7) if (rnd() < 0.5) bg.rect(x, 142, 3, 2, rnd() < 0.5 ? '#c98a4a' : '#5a3f33');
    bg.rect(0, 128, PW, 10, '#2e2626'); bg.rect(0, 127, PW, 1, '#5a4235');
    for (let x = 0; x < PW; x += 3) bg.rect(x, 122, 1, 5, '#3a302e');
    bg.rect(0, 121, PW, 1, '#3a302e');
    for (let x = 14; x < PW; x += 46) bg.rect(x, 138, 6, 14, '#2a2324');
    bg.rect(0, 150, PW, 30, '#241e20'); bg.rect(0, 150, PW, 3, '#3a2f2c');
    for (let x = 6; x < PW; x += 20) bg.rect(x, 166, 9, 1, '#4f4239');
    bg.rect(136, 136, 34, 16, '#3b2d2b'); bg.rect(136, 134, 34, 3, '#a14438');
    bg.rect(139, 140, 9, 8, '#4a6cff'); bg.rect(150, 140, 7, 8, '#f0c37a'); bg.rect(159, 140, 8, 8, '#4a6cff');
    bg.light(153, 150, 26, 8, '#6d83ff', 0.4, 3);
    const lamp = (x, top) => {
      bg.rect(x, top, 2, 152 - top, '#2b2324'); bg.rect(x, top, 12, 2, '#2b2324'); bg.rect(x + 10, top + 2, 4, 1, '#ffe6b0');
    };
    lamp(98, 40); lamp(206, 70);
    // Traffic light and a roadside tree on the right.
    bg.rect(262, 104, 2, 48, '#251f20'); bg.rect(258, 106, 10, 22, '#1e1a1b');
    const foliage = [];
    bg.rect(290, 96, 4, 56, '#2a2523');
    bg.paint(250, 52, PW, 140, (x, y) => {
      const dx = (x - 292) / 40, dy = (y - 92) / 40, n = P.fbm(x * 0.09, y * 0.09, 3, 13) + 0.55 - Math.sqrt(dx * dx + dy * dy);
      if (n < 0.5) return;
      const lit = P.fbm((x + 2) * 0.09, (y - 2) * 0.09, 3, 13) < P.fbm(x * 0.09, y * 0.09, 3, 13);
      foliage.push(x, y, P.pack(n > 0.62 && lit ? '#4b5a4a' : n > 0.56 ? '#36433b' : '#28322e'));
    });
    // Road works: striped barriers with little lamps.
    for (let x = 8; x < 120; x += 22) { bg.rect(x, 156, 6, 12, '#d7c2a4'); for (let y = 158; y < 168; y += 4) bg.rect(x, y, 6, 2, '#b4473a'); }

    const birds = [0, 1, 2].map(i => ({ x: -20 - i * 14, y: 50 + i * 5, v: 9 + i }));
    let nextFlip = 2;
    return (t) => {
      if (t > nextFlip) { nextFlip = t + rnd.range(1.5, 4); const w = rnd.pick(windows); w.on = !w.on; drawWin(w); }
      fr.copy(bg);
      // Neon letters; one sputters now and then.
      const bad = Math.floor(t / 7) % 5, off = Math.sin(t * 23) > 0.2 && (t % 7) < 1.2;
      NEON.forEach((n, i) => {
        if (i === bad && off) return;
        for (let b = 0; b < 15; b++) if (n.bits[b] === '1') fr.rect(n.x + (b % 3) * 2 - 1, n.y + Math.floor(b / 3) * 2 - 1, 2, 2, b === 4 ? '#ffb090' : '#ff4f3b');
      });
      // Traffic light: red, green, amber.
      const ph = t % 18, light = ph < 8 ? 0 : ph < 16 ? 2 : 1;
      ['#ff4636', '#ffb236', '#38e07a'].forEach((col, i) => fr.rect(260, 108 + i * 7, 6, 5, i === light ? col : '#3a2e2b'));
      if (light === 2) fr.rect(270, 124, 4, 2, '#38e07a');
      // A tram crosses the overpass every so often, and a car passes below.
      const tx = ((t % 40) - 4) * 22 - 120;
      if (tx > -120 && tx < PW) for (let k = 0; k < 3; k++) {
        const x = tx + k * 38; fr.rect(x, 113, 36, 9, '#c4a681'); fr.rect(x, 113, 36, 1, '#e8cfa4'); fr.rect(x, 120, 36, 2, '#7a4a3a');
        for (let i = 0; i < 6; i++) fr.rect(x + 3 + i * 5.5, 115, 4, 3, '#f5d58b');
      }
      const cx = PW + 40 - ((t + 11) % 26) * 24;
      if (cx > -40 && cx < PW + 10) {
        fr.rect(cx, 158, 30, 6, '#cfa36c'); fr.rect(cx + 6, 154, 16, 4, '#a98059'); fr.rect(cx + 8, 155, 12, 2, '#4a3a36');
        fr.rect(cx, 158, 2, 2, '#ffe9a8'); fr.rect(cx + 28, 159, 2, 2, '#ff5a3a');
        fr.rect(cx + 4, 164, 5, 2, '#151112'); fr.rect(cx + 21, 164, 5, 2, '#151112');
      }
      // Barrier lamps blink slowly in turn.
      for (let i = 0; i < 6; i++) if (Math.floor(t * 1.5) % 6 === i) fr.rect(10 + i * 22, 154, 2, 2, '#ffb54a');
      // Birds glide across.
      for (const b of birds) {
        const x = g.wrap(b.x + t * b.v, PW + 200, 20), y = b.y + Math.sin(t * 0.7 + b.v) * 3, up = Math.floor(t * 4 + b.v) % 2;
        fr.set(x, y, '#3a2a24'); fr.set(x - 1, y - up, '#3a2a24'); fr.set(x + 1, y - up, '#3a2a24'); fr.set(x - 2, y - up * 2 + 1, '#3a2a24'); fr.set(x + 2, y - up * 2 + 1, '#3a2a24');
      }
      // The tree sways a pixel or two, more at the top.
      const ts = step(t, 5);
      for (let i = 0; i < foliage.length; i += 3) {
        const y = foliage[i + 1], x = foliage[i] + Math.round(Math.sin(ts * 1.1 + y * 0.06) * (1.6 - (y - 52) / 60));
        if (x >= 0 && x < PW) fr.px[y * PW + x] = foliage[i + 2];
      }
      fr.show();
    };
  },
});
