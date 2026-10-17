Screensaver.register({
  id: 'koi', name: 'Koi pond', tags: ['water', 'calm', 'nature'],
  create(g) {
    const { c, W, H, R, TAU, pick, dot, ell, poly } = g;
    const PATTERNS = {
      white: { base: '#f5f1ea', fin: '#efe6d8', spots: [[0.3, 0, 0.22, '#ef6c33'], [-0.3, 0.05, 0.15, '#ef6c33']] },
      orange: { base: '#f08a3c', fin: '#f6b07a', spots: [[0.1, 0, 0.18, '#fff3e6']] },
      gold: { base: '#f6c453', fin: '#f9da8c', spots: [[0, 0, 0.12, '#2b2b2b']] },
    };
    const koi = [...Array(6)].map(() => ({
      cx: R(250, 710), cy: R(170, 370), rx: R(120, 260), ry: R(70, 140),
      sp: R(0.12, 0.25) * pick([1, -1]), p: R(0, TAU), s: R(26, 42), pat: PATTERNS[pick(Object.keys(PATTERNS))],
    }));
    const pads = [[120, 110, 34], [210, 430, 42], [420, 80, 28], [650, 470, 38], [820, 150, 44], [880, 380, 30], [520, 300, 26]]
      .map(([x, y, r], i) => ({ x, y, r, rot: R(0, TAU), flower: i % 3 === 0 }));
    const ripples = [...Array(6)].map(() => ({ x: R(0, W), y: R(0, H), ph: R(0, 1) }));
    function fish(k, t) {
      const a = t * k.sp + k.p;
      const x = k.cx + k.rx * Math.cos(a), y = k.cy + k.ry * Math.sin(a);
      const head = Math.atan2(k.ry * Math.cos(a) * k.sp, -k.rx * Math.sin(a) * k.sp);
      const s = k.s, P = k.pat;
      c.save(); c.translate(x, y); c.rotate(head);
      c.save(); c.translate(-s * 0.85, 0); c.rotate(Math.sin(t * 6 + k.p) * 0.35);
      poly([0, 0, -s * 0.55, -s * 0.3, -s * 0.55, s * 0.3], P.fin);
      c.restore();
      ell(s * 0.25, s * 0.3, s * 0.18, s * 0.07, 0.6, P.fin);
      ell(s * 0.25, -s * 0.3, s * 0.18, s * 0.07, -0.6, P.fin);
      ell(0, 0, s, s * 0.32, 0, P.base);
      for (const [sx, sy, sr, col] of P.spots) dot(sx * s, sy * s, sr * s, col);
      c.restore();
    }
    return (t, dt) => {
      g.rect(0, 0, W, H, '#1d6a73');
      for (let i = 0; i < 4; i++) dot(240 * i + 120 + 40 * Math.sin(t * 0.1 + i), 270 + 120 * Math.sin(t * 0.07 + i * 2), 150, 'rgba(0,0,0,.06)');
      for (const k of koi) fish(k, t);
      c.lineWidth = 1.5;
      for (const r of ripples) {
        r.ph += dt * 0.35;
        if (r.ph > 1) { r.ph = 0; r.x = R(0, W); r.y = R(0, H); }
        c.strokeStyle = `rgba(255,255,255,${0.3 * (1 - r.ph)})`;
        c.beginPath(); c.arc(r.x, r.y, 5 + r.ph * 60, 0, TAU); c.stroke();
      }
      pads.forEach((p, i) => {
        const x = p.x + 3 * Math.sin(t * 0.2 + i), y = p.y + 2 * Math.cos(t * 0.25 + i);
        c.fillStyle = '#3f8f4f'; c.beginPath(); c.moveTo(x, y);
        c.arc(x, y, p.r, p.rot + 0.35, p.rot + TAU - 0.35); c.closePath(); c.fill();
        if (p.flower) { dot(x, y, p.r * 0.32, '#f7a1c4'); dot(x, y, p.r * 0.12, '#ffe28a'); }
      });
    };
  },
});
