Screensaver.register({
  id: 'space', name: 'Solar system', tags: ['night', 'space'],
  create(g) {
    // Kept deliberately light: one flat background, disc "glows" instead of gradients,
    // and one clip per planet for its shadow side.
    const { c, W, H, R, TAU, dot } = g;
    const CX = 480, CY = 280, TILT = 0.32;
    const layers = [3, 8, 16].map((speed, i) => ({
      speed, a: 0.35 + i * 0.25, stars: [...Array(70 - i * 20)].map(() => ({ x: R(0, W), y: R(0, H), r: 0.6 + i * 0.5 })),
    }));
    const twinkle = g.makeStars(30, H);
    const planets = [
      { a: 92, sp: 0.5, r: 9, base: '#bdb3a4', shade: '#6e665c' },
      { a: 148, sp: 0.36, r: 14, base: '#e9875f', shade: '#8e3f2a' },
      { a: 210, sp: 0.26, r: 17, base: '#3f8fe0', shade: '#1b3f7d', land: '#57b36a', moon: true },
      { a: 305, sp: 0.15, r: 30, base: '#f2b46b', shade: '#8c5428', bands: ['#e39b55', '#f8d29a', '#d48448'], ring: true },
      { a: 390, sp: 0.1, r: 21, base: '#8f7cf0', shade: '#3a2d85', bands: ['#a596ff'] },
    ].map(p => Object.assign(p, { p: R(0, TAU) }));
    const belt = [...Array(48)].map(() => ({ a: R(250, 268), ang: R(0, TAU), r: R(1, 2) }));
    const pos = (a, ang) => [CX + a * Math.cos(ang), CY + a * TILT * Math.sin(ang)];

    function planet(p, t) {
      const [x, y] = pos(p.a, t * p.sp + p.p), r = p.r;
      const light = Math.atan2(CY - y, CX - x);
      if (p.ring) { c.strokeStyle = 'rgba(255,230,190,.5)'; c.lineWidth = 3; c.beginPath(); c.ellipse(x, y, r * 2, r * 0.55, -0.25, Math.PI, TAU); c.stroke(); }
      c.save(); c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = p.base; c.fill(); c.clip();
      if (p.bands) p.bands.forEach((col, i) => { c.fillStyle = col; c.fillRect(x - r, y - r + (i + 0.6) * (2 * r / (p.bands.length + 0.4)) - r * 0.12, 2 * r, r * 0.22); });
      if (p.land) { const d = (t * 4) % (r * 4) - r * 2; g.ell(x + d, y - r * 0.2, r * 0.5, r * 0.35, 0.4, p.land); g.ell(x + d - r * 1.5, y + r * 0.35, r * 0.4, r * 0.25, -0.3, p.land); }
      g.crescent(x, y, r, Math.cos(light) * r * 0.5, Math.sin(light) * r * 0.5, p.shade);
      c.restore();
      if (p.ring) { c.strokeStyle = 'rgba(255,230,190,.75)'; c.lineWidth = 3; c.beginPath(); c.ellipse(x, y, r * 2, r * 0.55, -0.25, 0, Math.PI); c.stroke(); }
      if (p.moon) { const ma = t * 1.2; dot(x + r * 2.2 * Math.cos(ma), y + r * Math.sin(ma), 3.5, '#d8d8e0'); }
    }
    return (t) => {
      g.rect(0, 0, W, H, '#070a1a');
      for (const L of layers) { c.fillStyle = `rgba(255,255,255,${L.a})`; for (const s of L.stars) { c.beginPath(); c.arc(g.wrap(s.x - t * L.speed, W, 2), s.y, s.r, 0, TAU); c.fill(); } }
      g.drawStars(twinkle, t);
      // A comet every 11 seconds.
      const k = Math.floor(t / 11), ph = (t % 11) / 3.5;
      if (ph < 1) {
        const x = -60 + ph * (W + 120), y = 70 + (k * 53) % 140 + ph * 70;
        c.strokeStyle = 'rgba(200,240,255,.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 90, y - 22); c.stroke();
        dot(x, y, 2.5, '#fff');
      }
      c.strokeStyle = 'rgba(255,255,255,.08)'; c.lineWidth = 1;
      for (const p of planets) { c.beginPath(); c.ellipse(CX, CY, p.a, p.a * TILT, 0, 0, TAU); c.stroke(); }
      const behind = ang => Math.sin(ang) < 0;
      c.fillStyle = '#8d8578';
      for (const b of belt) { const ang = t * 0.2 + b.ang; if (behind(ang)) { const [x, y] = pos(b.a, ang); c.fillRect(x, y, b.r, b.r); } }
      for (const p of planets) if (behind(t * p.sp + p.p)) planet(p, t);
      const pulse = 1 + 0.04 * Math.sin(t * 0.8);
      g.halo(CX, CY, 110 * pulse, '255,190,90', 0.22);
      dot(CX, CY, 44, '#ffc75a');
      dot(CX - 6, CY - 6, 30, '#ffd97a');
      c.fillStyle = '#a59c8e';
      for (const b of belt) { const ang = t * 0.2 + b.ang; if (!behind(ang)) { const [x, y] = pos(b.a, ang); c.fillRect(x, y, b.r, b.r); } }
      for (const p of planets) if (!behind(t * p.sp + p.p)) planet(p, t);
    };
  },
});
