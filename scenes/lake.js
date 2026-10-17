Screensaver.register({
  id: 'lake', name: 'Mountain lake', tags: ['day', 'water', 'calm'],
  create(g) {
    const { c, W, H, R, TAU, dot, rect, poly } = g;
    const LAKE = 370;
    const RANGES = [[300, 110, 95, '#c9a9cb', '#d9c0d8'], [330, 80, 70, '#a98ab6', '#c2a8c9'], [355, 50, 55, '#8a6ba1', '#a88dbb']]
      .map(([y0, amp, step, col, refl]) => ({ pts: g.ridge(y0, amp, step, 5, LAKE), col, refl }));
    const mist = [...Array(4)].map((_, i) => ({ x: R(0, W), y: 290 + i * 18, w: R(200, 340), v: R(3, 7) }));
    const ripples = [...Array(18)].map(() => ({ x: R(0, W), y: R(LAKE + 6, H - 6), w: R(30, 110), v: R(4, 10) }));
    const birds = [...Array(4)].map((_, i) => ({ o: i * 260, y: R(70, 180) }));
    const clouds = [[40, 70, 170, 5], [330, 120, 130, 4], [620, 55, 190, 6], [880, 150, 120, 3.5]].map(([x, y, w, v]) => ({ x, y, w, v }));
    const strips = [...Array(4)].map((_, i) => ({ x: R(0, W), y: 205 + i * 16, w: R(150, 260), v: R(5, 9) }));
    return (t) => {
      rect(0, 0, W, LAKE, '#fbd6c6');
      rect(0, 200, W, LAKE - 200, '#f8c6b8');
      for (const k of clouds) g.puffCloud(g.wrap(k.x + t * k.v, W, 220), k.y, k.w, '#ffe5da', '#fff3ee', '#f3c3b6');
      const sunY = 235 + 65 * Math.cos(t * 0.02);   // rises and sets very slowly behind the peaks
      g.halo(560, sunY, 120, '255,240,220', 0.3);
      dot(560, sunY, 56, '#fff1e4');
      for (const s of strips) g.capsule(g.wrap(s.x + t * s.v, W, 280), s.y, s.w, 7, 'rgba(246,190,180,.85)');
      c.strokeStyle = '#7a5a7e'; c.lineWidth = 1.6;
      for (const b of birds) {
        const x = g.wrap(t * 20 + b.o, W, 40), y = b.y + 6 * Math.sin(t * 0.8 + b.o), fl = 4 * Math.sin(t * 6 + b.o);
        c.beginPath(); c.moveTo(x - 9, y - fl); c.quadraticCurveTo(x - 3, y - 3, x, y); c.quadraticCurveTo(x + 3, y - 3, x + 9, y - fl); c.stroke();
      }
      for (const r of RANGES) poly(r.pts, r.col);
      for (const m of mist) g.capsule(g.wrap(m.x + t * m.v, W, 360), m.y, m.w, 9, 'rgba(255,240,236,.45)');
      // Still water: the mountains mirrored, a shade lighter.
      rect(0, LAKE, W, H - LAKE, '#e7c9d6');
      c.save(); c.translate(0, LAKE * 2); c.scale(1, -1);
      dot(560, sunY, 56, 'rgba(255,241,228,.7)');
      for (const r of RANGES) poly(r.pts, r.refl);
      c.restore();
      // Gentle ripples break the reflection into lines.
      for (const r of ripples) g.capsule(g.wrap(r.x + t * r.v, W, 120), r.y, r.w, 2, 'rgba(240,222,232,.75)');
      // A little rowing boat crosses now and then.
      const bx = g.wrap(t * 12, W, 400), by = LAKE + 60 + 2 * Math.sin(t * 1.2);
      poly([bx - 22, by, bx + 22, by, bx + 15, by + 7, bx - 15, by + 7], '#5b4a72');
      dot(bx, by - 8, 5, '#5b4a72'); rect(bx - 3, by - 6, 6, 7, '#5b4a72');
      c.strokeStyle = '#5b4a72'; c.lineWidth = 1.5; c.beginPath();
      const row = 0.5 * Math.sin(t * 1.5);
      c.moveTo(bx, by - 2); c.lineTo(bx - 18 * Math.cos(row), by + 6 + 4 * Math.sin(row)); c.stroke();
      g.capsule(bx - 30, by + 9, 60, 2, 'rgba(91,74,114,.25)');
    };
  },
});
