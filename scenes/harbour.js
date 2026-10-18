Screensaver.register({
  id: 'harbour', name: 'Harbour', tags: ['night', 'water', 'riso', 'calm'],
  overlay: { color: '#3d5588', shadow: false },
  create(g) {
    const { c, W, H, R, TAU } = g, riso = g.riso;
    const WATER = 360, SUN = [700, 330, 54];
    const cov = a => `rgba(0,0,0,${a})`;
    // A small town on the far shore: houses, a church and lit windows.
    const houses = [];
    for (let x = 30; x < W - 20;) { const w = R(26, 52), h = R(30, 70); houses.push({ x, w, h, roof: Math.random() < 0.6 }); x += w + R(2, 10); }
    const windows = houses.flatMap(hs => [...Array(Math.floor(hs.h / 18))].map(() => ({ x: hs.x + R(5, hs.w - 10), y: WATER - R(10, hs.h - 8) }))).filter(() => Math.random() < 0.5);

    const back = riso.print({
      seed: 'harbour',
      plates: [
        { ink: 'orange', angle: 15, draw: gx => {
          const x = gx.c;
          x.fillStyle = gx.lin(0, 0, 0, WATER, [[0, cov(0.05)], [0.7, cov(0.5)], [1, cov(0.8)]]); x.fillRect(0, 0, W, WATER);
          x.fillStyle = cov(1); x.beginPath(); x.arc(SUN[0], SUN[1], SUN[2], 0, TAU); x.fill();
          for (let y = WATER; y < H; y += 8) { x.fillStyle = cov(0.45 - ((y - WATER) / (H - WATER)) * 0.3); x.fillRect(0, y, W, 3); }
          for (const w of windows) { x.fillStyle = cov(1); x.fillRect(w.x, w.y, 5, 6); }
          x.globalCompositeOperation = 'destination-out'; x.fillRect(0, H - 52, 260, 14); x.fillRect(0, H - 40, 300, 40);   // no orange under the quay
        } },
        { ink: 'federal', angle: 75, shift: [0.5, -0.5], draw: gx => {
          const x = gx.c;
          x.fillStyle = gx.lin(0, 0, 0, 220, [[0, cov(0.35)], [1, cov(0)]]); x.fillRect(0, 0, W, 220);
          x.fillStyle = cov(0.85);
          for (const hs of houses) {
            x.fillRect(hs.x, WATER - hs.h, hs.w, hs.h);
            if (hs.roof) { x.beginPath(); x.moveTo(hs.x - 3, WATER - hs.h); x.lineTo(hs.x + hs.w / 2, WATER - hs.h - hs.w * 0.4); x.lineTo(hs.x + hs.w + 3, WATER - hs.h); x.fill(); }
          }
          x.fillRect(470, WATER - 130, 26, 130); x.beginPath(); x.moveTo(466, WATER - 130); x.lineTo(483, WATER - 175); x.lineTo(500, WATER - 130); x.fill();   // church
          x.globalCompositeOperation = 'destination-out';
          for (const w of windows) x.fillRect(w.x, w.y, 5, 6);
          x.globalCompositeOperation = 'source-over';
          x.fillStyle = gx.lin(0, WATER, 0, H, [[0, cov(0.45)], [1, cov(0.8)]]); x.fillRect(0, WATER, W, H - WATER);
          x.fillStyle = cov(1); x.fillRect(0, H - 40, 300, 40); x.fillRect(0, H - 52, 260, 14);   // the quay
        } },
      ],
    });
    const boats = [[180, 438, 1.1, 0], [430, 470, 0.85, 1.7], [640, 420, 0.7, 3.1], [830, 455, 1, 4.4]].map(([x, y, s, p]) => ({ x, y, s, p }));
    const ripples = [...Array(16)].map(() => ({ x: R(0, W), y: R(WATER + 8, H - 50), w: R(20, 70), v: R(3, 8) }));
    const dark = riso.mix(['federal'], ['orange', 0.4]);
    return (t) => {
      back.draw();
      // Glints on the water: knocked out of the ink, so they show bare paper.
      for (const r of ripples) g.capsule(g.wrap(r.x + t * r.v, W, 80), r.y, r.w, 2.5, `rgba(242,235,219,${0.55 + 0.3 * Math.sin(t + r.x)})`);
      for (const b of boats) {
        const bob = 3 * Math.sin(t * 0.9 + b.p), roll = 0.04 * Math.sin(t * 0.7 + b.p);
        c.save(); c.translate(b.x, b.y + bob); c.rotate(roll); c.scale(b.s, b.s);
        riso.multiply(() => {
          c.fillStyle = dark;
          c.beginPath(); c.moveTo(-48, 0); c.lineTo(48, 0); c.lineTo(36, 14); c.lineTo(-40, 14); c.closePath(); c.fill();
          c.fillRect(-14, -16, 24, 16);
          c.strokeStyle = dark; c.lineWidth = 2; c.beginPath(); c.moveTo(4, -16); c.lineTo(4, -86); c.moveTo(4, -80); c.lineTo(-40, -2); c.moveTo(4, -80); c.lineTo(46, -2); c.stroke();
          c.globalAlpha *= 0.35; c.fillRect(-46, 16, 92, 3); c.fillRect(-36, 22, 72, 3);           // reflection
        });
        const on = Math.sin(t * 1.4 + b.p) > -0.2;
        if (on) { g.dot(4, -88, 3.5, riso.PAPER); riso.multiply(() => g.dot(4, -88, 3.5, riso.INK.orange)); }
        c.restore();
      }
      // Gulls.
      riso.multiply(() => {
        c.strokeStyle = dark; c.lineWidth = 1.8; c.beginPath();
        for (let i = 0; i < 3; i++) {
          const x = g.wrap(t * 18 + i * 300, W, 40), y = 120 + i * 30 + 8 * Math.sin(t * 0.6 + i), f = 5 * Math.sin(t * 5 + i);
          c.moveTo(x - 10, y - f); c.quadraticCurveTo(x - 4, y - 4, x, y); c.quadraticCurveTo(x + 4, y - 4, x + 10, y - f);
        }
        c.stroke();
      });
    };
  },
});
