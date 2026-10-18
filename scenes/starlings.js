Screensaver.register({
  id: 'starlings', name: 'Starlings', tags: ['day', 'riso', 'nature', 'calm'],
  overlay: { color: '#914e72', shadow: false },
  create(g) {
    const { c, W, H, R, TAU } = g, riso = g.riso;
    const HORIZON = 360, SUN = [300, 330, 46];
    const cov = a => `rgba(0,0,0,${a})`;
    const reeds = [...Array(140)].map(() => ({ x: R(0, W), h: R(30, 90), lean: R(-8, 8) }));
    const trees = [...Array(18)].map((_, i) => ({ x: i * 56 + R(-20, 20), r: R(12, 24) }));

    // The still print: a dusk sky, the low sun, a tree line, the marsh water and reeds.
    const back = riso.print({
      seed: 'starlings',
      plates: [
        { ink: 'orange', angle: 15, draw: gx => {
          const x = gx.c;
          x.fillStyle = gx.lin(0, 0, 0, HORIZON, [[0, cov(0.08)], [1, cov(0.7)]]); x.fillRect(0, 0, W, HORIZON);
          x.fillStyle = cov(1); x.beginPath(); x.arc(SUN[0], SUN[1], SUN[2], 0, TAU); x.fill();
          // The sky reflected in the marsh, broken into horizontal streaks.
          for (let y = HORIZON; y < H; y += 7) { x.fillStyle = cov(0.5 - (y - HORIZON) / (H - HORIZON) * 0.35); x.fillRect(0, y, W, 4); }
          x.fillStyle = cov(0.9); x.fillRect(SUN[0] - 50, HORIZON + 6, 100, 3); x.fillRect(SUN[0] - 34, HORIZON + 16, 68, 3); x.fillRect(SUN[0] - 20, HORIZON + 26, 40, 3);
        } },
        { ink: 'teal', angle: 75, shift: [0.5, 0.5], draw: gx => {
          const x = gx.c;
          x.fillStyle = gx.lin(0, HORIZON, 0, H, [[0, cov(0.35)], [1, cov(0.75)]]); x.fillRect(0, HORIZON, W, H - HORIZON);
          x.globalCompositeOperation = 'destination-out'; x.fillRect(SUN[0] - 50, HORIZON + 6, 100, 3);
          x.globalCompositeOperation = 'source-over';
          x.fillStyle = gx.lin(0, 0, 0, 200, [[0, cov(0.4)], [1, cov(0)]]); x.fillRect(0, 0, W, 200);   // cool sky fading in at the top
        } },
        { ink: 'burgundy', angle: 45, shift: [-0.5, 0], draw: gx => {
          const x = gx.c;
          x.fillStyle = cov(0.85);
          x.beginPath(); x.moveTo(0, HORIZON + 4);
          for (const tr of trees) { x.lineTo(tr.x - tr.r, HORIZON + 2); x.arc(tr.x, HORIZON - tr.r * 0.4, tr.r, Math.PI, 0); }
          x.lineTo(W, HORIZON + 4); x.lineTo(W, HORIZON + 8); x.lineTo(0, HORIZON + 8); x.closePath(); x.fill();
          x.strokeStyle = cov(0.9); x.lineWidth = 2; x.lineCap = 'round'; x.beginPath();
          for (const r of reeds) { x.moveTo(r.x, H); x.quadraticCurveTo(r.x + r.lean * 0.3, H - r.h * 0.6, r.x + r.lean, H - r.h); }
          x.stroke();
          x.fillStyle = cov(0.9); x.fillRect(0, H - 14, W, 14);
        } },
      ],
    });

    // The murmuration: each bird has a fixed place on a long, folding ribbon of birds.
    // The ribbon's shape is a sum of slow waves, so the flock swells, folds and thins.
    const birds = [...Array(760)].map(() => ({ u: Math.random(), v: (Math.random() - 0.5) * 2, p: Math.random() * TAU }));
    return (t) => {
      back.draw();
      const cx = 560 + 120 * Math.sin(t * 0.05), cy = 170 + 30 * Math.sin(t * 0.07);
      const twist = 0.6 + 0.4 * Math.sin(t * 0.11), fold = Math.sin(t * 0.08);
      riso.multiply(() => {
        c.fillStyle = riso.INK.burgundy; c.beginPath();
        for (const b of birds) {
          const s = b.u * TAU;
          const x = cx + 240 * Math.cos(s + 0.4 * Math.sin(t * 0.13)) * (0.55 + 0.45 * Math.sin(t * 0.07 + b.u * 3 * twist)) + 36 * b.v * Math.sin(t * 0.21 + b.u * 6);
          const y = cy + 60 * Math.sin(2 * s + t * 0.17) * fold + 26 * b.v * Math.cos(t * 0.19 + b.u * 5) + 3 * Math.sin(t * 1.3 + b.p);
          c.moveTo(x + 1.7, y); c.arc(x, y, 1.7, 0, TAU);
        }
        c.fill();
      });
    };
  },
});
