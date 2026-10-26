Screensaver.register({
  id: 'chick', name: 'Little chick', tags: ['day', 'pixel', 'calm'],
  create(g) {
    const P = g.pixel, PW = 160, PH = 90, GROUND = 62, rnd = P.rng('chick');
    const bg = P.buffer(PW, PH), fr = P.buffer(PW, PH);
    bg.clear('#77502a');
    bg.paint(0, 0, PW, PH, (x, y) => (P.noise(x * 0.5, y * 0.5, 2) > 0.9 ? '#7d552d' : undefined));

    // The chick, without eyes and beak (drawn live so it can look about and blink).
    const BODY = [
      '.....hhhh.....',
      '...hhhhhhhh...',
      '..hhhhhhhhhh..',
      '..hhhhhhhhhh..',
      '..hhhhhhhhhh..',
      '.bbhhhhhhhhbb.',
      'bbbbbhhhhbbbbb',
      'bbbbbbbbbbbbbb',
      'bbbbbbbbbbbbbb',
      'sbbbbbbbbbbbbs',
      'sbbbbbbbbbbbbs',
      '.sbbbbbbbbbbs.',
      '..ssbbbbbbss..',
      '....ssssss....',
    ];
    const pal = { h: '#f6c890', b: '#efb67c', s: '#d4935a' };
    const FEET = [['....f....f....', '...ff....ff...'], ['....f.....f...', '...ff.....ff..'], ['.....f...f....', '....ff...ff...']];
    const fpal = { f: '#e2561d' };

    const seeds = [...Array(5)].map(() => ({ x: rnd.int(10, PW - 10), y: rnd.int(GROUND - 1, GROUND + 14), back: 0 }));
    const c = { x: 70, y: GROUND, face: 0, mode: 'idle', until: 2, target: 70, step: 0, pecks: 0 };
    let blinkAt = 3;
    const choose = t => {
      const r = rnd();
      // Mostly stand and look about; sometimes wander to a seed and peck at it.
      if (r < 0.3) { c.mode = 'look'; c.face = rnd.pick([-1, 1]); c.until = t + rnd.range(1.2, 2.6); }
      else if (r < 0.65) {
        const s = rnd.pick(seeds.filter(q => !q.back)) || { x: rnd.int(20, PW - 20) };
        c.mode = 'walk'; c.target = Math.max(12, Math.min(PW - 12, s.x)); c.until = t + 20;
      } else if (r < 0.8) { c.mode = 'hop'; c.until = t + 0.9; }
      else { c.mode = 'idle'; c.face = 0; c.until = t + rnd.range(2, 4.5); }
    };

    return (t, dt) => {
      fr.copy(bg);
      for (const s of seeds) {
        if (s.back && t > s.back) { s.back = 0; s.x = rnd.int(10, PW - 10); s.y = rnd.int(GROUND - 1, GROUND + 14); }
        if (!s.back) { fr.set(s.x, s.y, '#c9a46a'); fr.set(s.x + 1, s.y, '#a8834e'); }
      }
      if (t > c.until && c.mode !== 'walk' && c.mode !== 'peck') choose(t);
      let dy = 0, feet = 0, peck = false;
      if (c.mode === 'walk') {
        const dir = Math.sign(c.target - c.x); c.face = dir;
        c.step += dt * 6; if (c.step >= 1) { c.step -= 1; c.x += dir; }
        feet = 1 + (Math.floor(t * 6) % 2);
        if (Math.abs(c.target - c.x) < 1) { c.mode = 'peck'; c.pecks = 0; c.until = t + 1.6; }
      } else if (c.mode === 'peck') {
        peck = Math.floor(t * 5) % 2 === 0;
        if (t > c.until) {
          const s = seeds.find(q => !q.back && Math.abs(q.x - c.x) < 8); if (s) s.back = t + rnd.range(6, 14);
          c.mode = 'idle'; c.face = 0; c.until = t + rnd.range(1.5, 3);
        }
      } else if (c.mode === 'hop') {
        const k = (c.until - t) / 0.9; dy = k > 0.5 ? -Math.round(Math.sin((k - 0.5) * 2 * Math.PI) * 3) : -Math.round(Math.sin(k * 2 * Math.PI) * 2);
      }
      const breathe = c.mode === 'idle' || c.mode === 'look' ? Math.floor(t * 1.6) % 2 : 0;
      const x = Math.round(c.x) - 7, top = c.y - 16 + dy + (peck ? 2 : 0);
      // Shadow, body (squashed a pixel when it breathes out), feet.
      fr.rect(x + 1, c.y, 12 + (dy < 0 ? -2 : 0) + (dy < 0 ? 1 : 0), 1, '#5c3b1b');
      fr.sprite(BODY.slice(breathe), pal, x, top + breathe);
      if (dy === 0) fr.sprite(FEET[feet], fpal, x, c.y - 2);
      else fr.sprite(FEET[0].slice(1), fpal, x, c.y - 2 + dy);
      // Face: eyes and beak move with where it looks; it blinks every few seconds.
      if (t > blinkAt + 0.15) blinkAt = t + rnd.range(2.5, 5);
      const fx = x + c.face * (c.mode === 'walk' ? 2 : 1), ey = top + 3 + breathe + (peck ? 1 : 0);
      const blink = t > blinkAt;
      if (blink) { fr.rect(fx + 3, ey + 1, 2, 1, '#c98b52'); fr.rect(fx + 9, ey + 1, 2, 1, '#c98b52'); }
      else { fr.rect(fx + 4, ey, 1, 2, '#2a1a10'); fr.rect(fx + 9, ey, 1, 2, '#2a1a10'); }
      fr.rect(fx + 6, ey + 2 + (peck ? 1 : 0), 2, 1, '#ef6a26'); fr.rect(fx + 6, ey + 3 + (peck ? 1 : 0), 2, 1, '#d1531c');
      fr.show();
    };
  },
});
