Screensaver.register({
  id: 'night-desk', name: 'Night desk', tags: ['night', 'pixel', 'calm'],
  create(g) {
    const P = g.pixel, PW = 320, PH = 180, rnd = P.rng('night-desk');
    const bg = P.buffer(PW, PH), fr = P.buffer(PW, PH);
    const WX0 = 122, WX1 = 198, WY0 = 26, WY1 = 104;                // the window opening

    // Room: dark blue wall, ceiling and floor.
    bg.vgrad([[0, '#0d1529'], [0.15, '#111c36'], [1, '#14203c']], 0, 148, 0.8);
    bg.rect(0, 0, PW, 14, '#0c1326');
    bg.light(160, 6, 120, 14, '#2a4f9e', 0.6, 4, 0, PW, 14);            // moonlight on the ceiling
    bg.rect(0, 14, PW, 1, '#1a2a50');
    bg.vgrad([[0, '#101a2e'], [1, '#0a101e']], 148, PH, 0.6);
    bg.rect(0, 148, PW, 1, '#1c2a48');

    // Outside: night sky, moon, snowy rooftops with a few lit windows.
    bg.vgrad([[0, '#1b46a6'], [0.7, '#2f68cf'], [1, '#3f7fe0']], WY0, WY1, 0.7, WX0, WX1);
    bg.disc(140, 42, 6, '#eaf2ff'); bg.disc(143, 40, 5, '#2556bb');
    const stars = [...Array(16)].map(() => [rnd.int(WX0 + 2, WX1 - 2), rnd.int(WY0 + 2, 70), rnd.range(0, 6.3)]);
    const outWin = [];
    for (let x = WX0; x < WX1;) {
      const w = rnd.int(10, 20), top = rnd.int(72, 88);
      bg.rect(x, top, w, WY1 - top, '#163679'); bg.rect(x, top, w, 2, '#c9dcf6'); bg.rect(x, top + 2, w, 1, '#8fb0e4');
      for (let yy = top + 5; yy < WY1 - 2; yy += 4) for (let xx = x + 2; xx < x + w - 2; xx += 4) if (rnd() < 0.3) outWin.push({ x: xx, y: yy, on: rnd() < 0.6 });
      x += w + 1;
    }
    // Frame, mullions and sill.
    bg.rect(WX0 - 3, WY0 - 3, WX1 - WX0 + 6, 3, '#0a1120'); bg.rect(WX0 - 3, WY0, 3, WY1 - WY0, '#0a1120'); bg.rect(WX1, WY0, 3, WY1 - WY0, '#0a1120');
    bg.rect(159, WY0, 2, WY1 - WY0, '#0a1120'); bg.rect(WX0, 62, WX1 - WX0, 2, '#0a1120');
    bg.rect(WX0 - 8, WY1, WX1 - WX0 + 16, 4, '#233a6e'); bg.rect(WX0 - 8, WY1, WX1 - WX0 + 16, 1, '#3c63b4'); bg.rect(WX0 - 6, WY1 + 4, WX1 - WX0 + 12, 2, '#0e1a33');

    // Moonlight falling through the window onto the floor and the bed.
    const shaft = [WX0, WY1 + 6, WX1, WY1 + 6, WX1 + 70, PH, WX0 + 40, PH];
    bg.poly(shaft, '#1b3264', 0.45);

    // Desk, shelf and a glowing CRT on the left.
    bg.rect(14, 112, 84, 4, '#1d2b4c'); bg.rect(14, 112, 84, 1, '#33497c');
    bg.rect(18, 116, 3, 34, '#141f38'); bg.rect(90, 116, 3, 34, '#141f38'); bg.rect(62, 116, 26, 18, '#17243f');
    bg.rect(20, 58, 70, 3, '#1d2b4c');
    let bx = 24;
    for (let i = 0; i < 9; i++) { const h = rnd.int(9, 14), w = rnd.int(3, 5); bg.rect(bx, 58 - h, w, h, rnd.pick(['#2c4a8a', '#3b5a9c', '#24396e', '#6a5a8a'])); bx += w + 1; }
    bg.disc(78, 52, 5, '#2b4f8c'); bg.rect(77, 56, 3, 2, '#1d2b4c');
    bg.rect(30, 82, 34, 30, '#cbb98a'); bg.rect(30, 82, 34, 1, '#e8d8aa'); bg.rect(60, 82, 4, 30, '#a2915f');
    bg.rect(34, 86, 24, 19, '#f3e7bb'); bg.rect(40, 108, 14, 4, '#a2915f');
    bg.light(46, 96, 54, 40, '#f0dfa6', 0.28, 4);
    bg.rect(66, 108, 18, 4, '#20304f'); bg.rect(67, 109, 16, 1, '#314672');      // keyboard
    // Chair back, a cushion of moonlight on the floor.
    bg.rect(70, 118, 22, 28, '#0f182c'); bg.rect(70, 118, 22, 2, '#1d2b4c');

    // Wall posters.
    bg.rect(232, 28, 26, 32, '#0f1930'); bg.rect(234, 30, 22, 28, '#1b2d55'); for (let i = 0; i < 4; i++) bg.rect(237 + i * 5, 40 + (i % 2) * 6, 3, 12, '#24396a');
    bg.rect(266, 40, 20, 16, '#0f1930'); bg.rect(268, 42, 16, 12, '#22385f'); bg.disc(276, 48, 3, '#3a5a8e');

    // The bed, then the nightstand and its lamp.
    bg.poly([168, 128, 304, 124, 312, 166, 160, 170], '#182433');
    bg.poly([164, 140, 308, 136, 312, 166, 160, 170], '#1f2f42');
    for (let i = 0; i < 6; i++) { const x = 176 + i * 22; bg.line(x, 142, x + 10, 166, '#16222f'); bg.line(x + 1, 142, x + 11, 166, '#2a3d54'); }
    bg.line(164, 140, 308, 136, '#33496a'); bg.line(160, 169, 312, 165, '#2b3e57');
    for (let i = 0; i < 3; i++) bg.poly([190 + i * 34, 146, 214 + i * 34, 145, 220 + i * 34, 160, 198 + i * 34, 161], '#26384e', 0.5);
    bg.poly([248, 116, 298, 114, 302, 132, 250, 134], '#9b6c3a'); bg.poly([252, 116, 298, 114, 300, 126, 256, 128], '#c48f4c');
    bg.poly([270, 115, 298, 114, 299, 121, 274, 122], '#e8b066'); bg.line(250, 134, 302, 132, '#6e4a28');
    bg.poly(shaft, '#24406f', 0.3);
    bg.rect(292, 108, 28, 52, '#16213a'); bg.rect(292, 108, 28, 2, '#2a3c66');
    for (let y = 118; y < 158; y += 12) { bg.rect(295, y, 22, 1, '#0e172b'); bg.rect(304, y + 5, 4, 1, '#2a3c66'); }
    bg.rect(304, 90, 12, 10, '#f0b45c'); bg.rect(304, 90, 12, 1, '#ffd88f'); bg.rect(309, 100, 2, 8, '#5a4030'); bg.rect(306, 106, 8, 2, '#5a4030');
    bg.light(310, 100, 70, 50, '#f0a24a', 0.35, 4);
    bg.light(310, 96, 20, 16, '#ffd58a', 0.5, 3);

    // The cat on the sill, with a tail that hangs and swings.
    const CAT = [
      '.k...k...',
      '.kk.kk...',
      '.kkkkk...',
      '.kekek...',
      '..kkk....',
      '.kkkkk...',
      'kkkkkkk..',
      'kkkkkkkk.',
      'kkkkkkkk.',
    ];
    const catPal = { k: '#070b16', e: '#7fd0a0' };
    bg.sprite(CAT, catPal, 178, WY1 - 9);

    const snow = [...Array(60)].map(() => ({ x: rnd.range(WX0, WX1), y: rnd.range(WY0, WY1), v: rnd.range(5, 11), p: rnd.range(0, 6.3) }));
    let nextFlip = 4, shoot = -1;
    const step = q => Math.floor(q * 6) / 6;

    return (t, dt) => {
      if (t > nextFlip) { nextFlip = t + rnd.range(3, 7); const w = rnd.pick(outWin); if (w) w.on = !w.on; }
      fr.copy(bg);
      // Stars, city windows and snow outside, kept inside the window opening.
      for (const [x, y, p] of stars) if (Math.sin(t * 1.3 + p) > -0.3) fr.set(x, y, Math.sin(t * 1.3 + p) > 0.6 ? '#ffffff' : '#9cbcf2');
      for (const w of outWin) fr.rect(w.x, w.y, 2, 2, w.on ? '#f2c46b' : '#10295e');
      for (const s of snow) {
        s.y += s.v * dt; if (s.y > WY1) { s.y = WY0; s.x = rnd.range(WX0, WX1); }
        const x = Math.round(s.x + 2 * Math.sin(t * 0.8 + s.p)), y = Math.round(s.y);
        if (x >= WX0 && x < WX1 && x !== 159 && x !== 160 && y !== 62 && y !== 63) fr.set(x, y, '#dfeaff');
      }
      // Now and then a shooting star.
      if (shoot < 0 && rnd() < dt / 40) shoot = 0;
      if (shoot >= 0) {
        shoot += dt; const x = WX1 - 6 - shoot * 60, y = WY0 + 4 + shoot * 24;
        for (let i = 0; i < 6; i++) { const xx = Math.round(x + i * 2), yy = Math.round(y - i * 0.8); if (xx > WX0 && xx < WX1 && yy < 60) fr.set(xx, yy, i < 2 ? '#ffffff' : '#9cbcf2'); }
        if (shoot > 0.9) shoot = -1;
      }
      // Curtains sway gently in a draught.
      const ts = step(t);
      for (let y = 20; y < 116; y++) {
        const k = (y - 20) / 96, sway = Math.round(Math.sin(ts * 0.9 + y * 0.05) * k * 2);
        fr.span(y, 104 + sway * 0.5, 123 + sway, '#2a59b4');
        fr.span(y, 108 + sway * 0.5, 110 + sway * 0.6, '#1f468f'); fr.span(y, 115 + sway * 0.7, 117 + sway * 0.8, '#1f468f'); fr.span(y, 121 + sway, 123 + sway, '#3b72d0');
        fr.span(y, 197 - sway, 216 - sway * 0.5, '#2a59b4');
        fr.span(y, 203 - sway * 0.8, 205 - sway * 0.7, '#1f468f'); fr.span(y, 210 - sway * 0.6, 212 - sway * 0.5, '#1f468f'); fr.span(y, 197 - sway, 199 - sway, '#3b72d0');
      }
      fr.rect(100, 18, 120, 2, '#0a1120');
      // The cat's tail swings below the sill; it blinks now and then.
      const sw = Math.round(Math.sin(step(t) * 1.4) * 2);
      for (let i = 0; i < 9; i++) fr.set(185 + Math.round(sw * (i / 8) * (i / 8)), WY1 + 1 + i, '#070b16');
      if ((t % 6) < 0.18) { fr.set(180, WY1 - 6, '#070b16'); fr.set(182, WY1 - 6, '#070b16'); }
      // Screen: lines of text and a blinking cursor; every so often the text scrolls.
      const scroll = Math.floor(t / 5);
      for (let i = 0; i < 5; i++) { const len = 4 + ((i + scroll) * 7) % 14; fr.rect(36, 88 + i * 3, len, 1, '#6b86c4'); }
      if (Math.floor(t * 2) % 2) fr.rect(36 + 4 + ((4 + scroll) * 7) % 14 + 1, 100, 2, 1, '#3b58a0');
      fr.show();
    };
  },
});
