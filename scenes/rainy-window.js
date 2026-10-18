Screensaver.register({
  id: 'rainy-window', name: 'Rainy window', tags: ['night', 'riso', 'calm'],
  overlay: { color: '#f2ebdb', label: '#f2ebdb', shadow: false },
  create(g) {
    const { c, W, H, R, TAU, pick } = g, riso = g.riso;
    const cov = a => `rgba(0,0,0,${a})`;
    // City lights out of focus behind wet glass: soft discs in the inks, overlapping.
    const bokeh = [...Array(46)].map(() => ({ x: R(0, W), y: R(120, 520), r: R(14, 46), ink: pick(['pink', 'yellow', 'yellow', 'pink', 'medium']), a: R(0.35, 0.9) }));
    const back = riso.print({
      seed: 'rainy-window',
      plates: [
        { ink: 'medium', angle: 15, draw: gx => {
          const x = gx.c;
          x.fillStyle = gx.lin(0, 0, 0, H, [[0, cov(0.95)], [1, cov(0.7)]]); x.fillRect(0, 0, W, H);
          x.globalCompositeOperation = 'destination-out';
          for (const b of bokeh) if (b.ink !== 'medium') { x.fillStyle = cov(b.a * 0.9); x.beginPath(); x.arc(b.x, b.y, b.r, 0, TAU); x.fill(); }
          x.globalCompositeOperation = 'source-over';
          for (const b of bokeh) if (b.ink === 'medium') { x.fillStyle = cov(0.25); x.beginPath(); x.arc(b.x, b.y, b.r, 0, TAU); x.fill(); }
          x.globalCompositeOperation = 'source-over'; x.fillStyle = cov(1); x.fillRect(612, 0, 16, H); x.fillRect(0, 300, W, 14);   // window bars
        } },
        { ink: 'pink', angle: 75, shift: [1, 0], draw: gx => {
          const x = gx.c;
          for (const b of bokeh) if (b.ink === 'pink') { x.fillStyle = cov(b.a); x.beginPath(); x.arc(b.x, b.y, b.r, 0, TAU); x.fill(); }
          x.globalCompositeOperation = 'destination-out'; x.fillRect(612, 0, 16, H); x.fillRect(0, 300, W, 14); x.globalCompositeOperation = 'source-over';
          x.fillStyle = gx.lin(0, H - 200, 0, H, [[0, cov(0)], [1, cov(0.35)]]); x.fillRect(0, H - 200, W, 200);   // street glow
        } },
        { ink: 'yellow', angle: 0, shift: [0, 1], draw: gx => {
          const x = gx.c;
          for (const b of bokeh) if (b.ink === 'yellow') { x.fillStyle = cov(b.a); x.beginPath(); x.arc(b.x, b.y, b.r, 0, TAU); x.fill(); }
          x.globalCompositeOperation = 'destination-out'; x.fillRect(612, 0, 16, H); x.fillRect(0, 300, W, 14);
        } },
      ],
    });
    // Raindrops on the glass: most sit still; some gather and run down, leaving a trail.
    const still = [...Array(90)].map(() => ({ x: R(0, W), y: R(0, H), r: R(1.5, 4) }));
    const runners = [...Array(9)].map(() => ({ x: R(20, W - 20), y: R(-H, 0), v: R(30, 70), r: R(3, 5), wob: R(0, TAU) }));
    const dark = riso.mix(['medium'], ['pink', 0.3]);
    function drop(x, y, r) {
      riso.multiply(() => { c.fillStyle = dark; c.beginPath(); c.arc(x, y + r * 0.15, r, 0, TAU); c.fill(); });
      g.dot(x - r * 0.3, y - r * 0.3, r * 0.45, riso.PAPER);
    }
    return (t, dt) => {
      back.draw();
      for (const d of still) drop(d.x, d.y, d.r);
      for (const d of runners) {
        // Drops stall, then slip: the speed pulses.
        d.y += d.v * dt * (0.25 + 0.75 * Math.max(0, Math.sin(t * 0.8 + d.wob)));
        if (d.y > H + 20) { d.y = R(-200, -20); d.x = R(20, W - 20); }
        const x = d.x + 3 * Math.sin(d.y * 0.03 + d.wob);
        riso.multiply(() => { c.strokeStyle = dark; c.globalAlpha *= 0.5; c.lineWidth = d.r * 0.7; c.beginPath(); c.moveTo(x, d.y - 90); c.lineTo(x, d.y); c.stroke(); });
        drop(x, d.y, d.r);
      }
    };
  },
});
