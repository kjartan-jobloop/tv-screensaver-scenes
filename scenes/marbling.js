Screensaver.register({
  id: 'marbling', name: 'Marbling', tags: ['abstract', 'riso', 'calm'],
  overlay: { color: '#3d5588', shadow: false },
  create(g) {
    const { c, W, H, TAU } = g, riso = g.riso;
    // Paper only: the marbled ink is drawn live on top of it.
    const back = riso.print({ seed: 'marbling', plates: [] });
    // Thin bands of ink across the tray, in a repeating order, with paper between some of them.
    const ORDER = [['blue', 0.9], ['pink', 0.85], null, ['yellow', 0.95], ['pink', 0.55], ['blue', 0.6], null, ['yellow', 0.7], ['blue', 0.35], null];
    const BAND = 24, COUNT = Math.ceil(H / BAND) + 12;
    // Flat ink colours, drawn slightly see-through so the printed paper's texture shows (cheaper
    // than dot patterns or multiply blending, which matters on TV graphics chips).
    const flat = {};
    for (const ink of ORDER) if (ink) flat[ink[0] + ink[1]] = riso.mix(ink);
    // Where a point of the tray has been dragged to: two slow swirls that wander around,
    // long folding waves, and a fine comb that pulls the bands into points.
    // Swirls stay gentle (well under a half-turn), so the bands bend but never fold over
    // themselves: folded shapes are very costly to fill.
    const swirls = [[0.04, 0.031, 1.2, 0], [0.027, 0.045, -1, 2.3]];
    function flow(x, y, t) {
      let px = x, py = y;
      for (const [fx, fy, turn, ph] of swirls) {
        const sx = W / 2 + 300 * Math.sin(t * fx + ph), sy = H / 2 + 150 * Math.cos(t * fy + ph);
        const dx = px - sx, dy = py - sy, ang = turn * Math.exp(-(dx * dx + dy * dy) / 30000) * Math.sin(t * 0.05 + ph);
        const ca = Math.cos(ang), sa = Math.sin(ang);
        px = sx + dx * ca - dy * sa; py = sy + dx * sa + dy * ca;
      }
      py += 30 * Math.sin(px * 0.007 + t * 0.09 + py * 0.004) + 14 * Math.sin(px * 0.019 - t * 0.07);
      py += 10 * Math.sin(px * 0.045) * (0.5 + 0.5 * Math.sin(py * 0.013 + t * 0.04));   // the comb
      return [px, py];
    }
    return (t) => {
      back.draw();
      const drift = (t * 5) % (BAND * ORDER.length);
      c.save(); c.globalAlpha *= 0.93;
      (() => {
        for (let i = -6; i < COUNT; i++) {
          const ink = ORDER[((i % ORDER.length) + ORDER.length) % ORDER.length];
          if (!ink) continue;
          // Bend only the band's centre line; the edges sit a fixed distance above and below it,
          // so they stay parallel and the shape never crosses itself (crossed shapes are very
          // costly to fill and can overwhelm a TV's graphics chip).
          const yc = i * BAND + drift - BAND * 6 + BAND * 0.39, half = BAND * 0.39;
          const pts = [];
          for (let x = -60; x <= W + 60; x += 20) pts.push(flow(x, yc, t));
          c.fillStyle = flat[ink[0] + ink[1]];
          c.beginPath();
          pts.forEach(([px, py], k) => (k ? c.lineTo(px, py - half) : c.moveTo(px, py - half)));
          for (let k = pts.length - 1; k >= 0; k--) c.lineTo(pts[k][0], pts[k][1] + half);
          c.closePath(); c.fill();
        }
      })();
      c.restore();
    };
  },
});
