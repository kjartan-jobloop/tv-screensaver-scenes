Screensaver.register({
  id: 'terraces', name: 'Terraces', tags: ['day', 'riso', 'nature', 'calm'],
  overlay: { color: '#00a95c', label: '#f2ebdb', shadow: false },
  create(g) {
    const { c, W, H, R, TAU } = g, riso = g.riso;
    const cov = a => `rgba(0,0,0,${a})`;
    // Far mountain line, and the stacked terrace edges below it.
    const ridgeY = px => 240 - 60 * Math.sin(px * 0.004 + 0.7) - 22 * Math.sin(px * 0.013 + 2);
    const bands = [...Array(16)].map((_, i) => ({ y: 255 + i * 19 + i * i * 0.5, a: 26 - i * 0.6, ph: R(0, TAU) }));
    const edge = (b, x) => b.y + b.a * Math.sin(x * 0.006 + b.ph * 0.2 + 1.2) + 10 * Math.sin(x * 0.017 + b.ph);
    const shape = (x, yOf) => { x.beginPath(); x.moveTo(0, H); for (let px = 0; px <= W; px += 6) x.lineTo(px, yOf(px)); x.lineTo(W, H); x.closePath(); };
    // Sky, far mountains and terraces in one still print. The sun is drawn live on top,
    // clipped to the sky, so it can rise and set behind the hills.
    const land = riso.print({
      seed: 'terraces',
      plates: [
        { ink: 'pink', angle: 75, draw: gx => {
          const x = gx.c;
          x.fillStyle = gx.lin(0, 0, 0, 330, [[0, cov(0.45)], [1, cov(0.12)]]); x.fillRect(0, 0, W, H);
          shape(x, ridgeY); x.fillStyle = cov(0.45); x.fill();
          x.globalCompositeOperation = 'destination-out'; shape(x, px => edge(bands[0], px)); x.fill();
        } },
        { ink: 'orange', angle: 15, draw: gx => { gx.c.fillStyle = gx.lin(0, 0, 0, 330, [[0, cov(0)], [1, cov(0.45)]]); gx.c.fillRect(0, 0, W, H); } },
        { ink: 'green', angle: 45, shift: [0.5, 0.5], draw: gx => {
          const x = gx.c;
          bands.forEach((b, i) => { shape(x, px => edge(b, px)); x.fillStyle = cov(i % 2 ? 0.7 : 0.5); x.fill(); });
          // Flooded paddies catch the sky: thin lines along each terrace edge with no green.
          x.globalCompositeOperation = 'destination-out'; x.lineWidth = 2.4;
          bands.forEach(b => { x.beginPath(); for (let px = 0; px <= W; px += 6) { const y = edge(b, px) + 4; px ? x.lineTo(px, y) : x.moveTo(px, y); } x.stroke(); });
        } },
      ],
    });
    const mist = [...Array(4)].map((_, i) => ({ x: R(0, W), y: 270 + i * 46, w: R(260, 420), v: R(4, 9) }));
    return (t) => {
      land.draw();
      // The sun rises and sets very slowly; it is clipped to the sky so it passes behind the hills.
      const sy = 215 + 75 * Math.cos(t * 0.02);
      c.save(); c.beginPath(); c.moveTo(0, 0); for (let px = 0; px <= W; px += 6) c.lineTo(px, Math.min(ridgeY(px), edge(bands[0], px))); c.lineTo(W, 0); c.closePath(); c.clip();
      riso.multiply(() => { g.dot(640, sy, 60, riso.ink('orange')); g.dot(640, sy, 60, riso.ink('pink', 0.35)); });
      c.restore();
      for (const m of mist) g.capsule(g.wrap(m.x + t * m.v, W, 420), m.y, m.w, 9, 'rgba(242,235,219,.4)');
      riso.multiply(() => {
        c.strokeStyle = riso.INK.green; c.lineWidth = 1.6; c.beginPath();
        for (let i = 0; i < 4; i++) {
          const x = g.wrap(t * 16 + i * 230, W, 40), y = 90 + i * 22 + 8 * Math.sin(t * 0.6 + i), f = 4 * Math.sin(t * 6 + i);
          c.moveTo(x - 9, y - f); c.quadraticCurveTo(x - 3, y - 3, x, y); c.quadraticCurveTo(x + 3, y - 3, x + 9, y - f);
        }
        c.stroke();
      });
    };
  },
});
