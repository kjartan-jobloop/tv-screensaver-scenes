Screensaver.register({
  id: 'lighthouse', name: 'Lighthouse', tags: ['night', 'water', 'calm'],
  create(g) {
    const { c, W, H, R, TAU, dot, rect, poly, hill } = g;
    const LX = 230, LY = 212;
    const stars = g.makeStars(90, 300);
    const SEA = ['#1d3557', '#18304f', '#132844', '#0f2038'];
    const motes = [...Array(40)].map(() => ({ u: R(0.05, 1), v: R(-1, 1), p: R(0, TAU) }));
    const half = y => 25 - ((370 - y) / 140) * 10;   // tower half-width at height y
    const stripe = (a, b) => poly([LX - half(a), a, LX + half(a), a, LX + half(b), b, LX - half(b), b], '#d94f4f');
    const sea = (i, t) => hill(390 + i * 36, 6 + i * 2, 0.01 + i * 0.004, t * (0.3 + i * 0.15) * (i % 2 ? 1 : -1), SEA[i]);
    function cone(len, spread, side, rgb, a) {
      const ex = LX + side * len;
      c.fillStyle = g.lin(LX, LY, ex, LY, [[0, `rgba(${rgb},${a})`], [0.6, `rgba(${rgb},${a * 0.35})`], [1, `rgba(${rgb},0)`]]);
      c.beginPath(); c.moveTo(LX, LY - 5); c.lineTo(ex, LY - spread); c.lineTo(ex, LY + spread * 0.85); c.lineTo(LX, LY + 5); c.closePath(); c.fill();
    }
    return (t) => {
      rect(0, 0, W, H, '#101d36');
      g.drawStars(stars, t);
      dot(600, 80, 28, '#eef2ff');
      // The lamp turns: the beam is long when it points sideways and short when it swings
      // towards or away from us. Facing us, the lamp flares.
      const ang = t * 0.7, cs = Math.cos(ang), side = cs < 0 ? -1 : 1, reach = Math.abs(cs);
      const facing = Math.pow(Math.max(0, Math.sin(ang)), 6);
      const len = 80 + 760 * reach, spread = 40 + 70 * reach;
      cone(len, spread, side, '255,236,180', 0.32 * reach);
      cone(len * 0.9, spread * 0.38, side, '255,246,215', 0.5 * reach);
      for (const m of motes) {
        const x = LX + side * len * m.u, y = LY + m.v * spread * m.u * 0.8 + 3 * Math.sin(t * 0.7 + m.p);
        dot(x, y, 1.3, `rgba(255,248,220,${0.7 * reach * (1 - m.u) * (0.5 + 0.5 * Math.sin(t * 2 + m.p))})`);
      }
      sea(0, t);
      // Where the beam meets the sea, the waves catch the light.
      if (reach > 0.25) {
        const gx = LX + side * len * 0.75;
        for (let i = 0; i < 5; i++) g.capsule(gx - 40 + 18 * Math.sin(t * 1.5 + i * 2), 398 + i * 7, 80 - i * 12, 2.5, `rgba(255,236,180,${0.3 * reach})`);
      }
      poly([120, 430, 160, 380, 230, 365, 300, 378, 340, 430], '#1b2232');
      poly([LX - 25, 370, LX + 25, 370, LX + 15, 230, LX - 15, 230], '#eef0f4');
      stripe(330, 305); stripe(280, 255);
      // Lamp light falls on the tower's lit side.
      poly([LX + side * 3, 370, LX + side * 25, 370, LX + side * 15, 230, LX + side * 3, 230], `rgba(255,236,180,${0.12 * reach})`);
      rect(208, 224, 44, 6, '#2b3245');
      rect(214, 200, 32, 24, '#ffe9a8');
      poly([208, 200, 252, 200, LX, 180], '#d94f4f');
      g.glow(LX, LY, 45 + 90 * facing, '255,236,170', 0.35 + 0.55 * facing);
      dot(LX, LY, 6 + 4 * facing, '#fffbe8');
      sea(1, t);
      const bx = g.wrap(t * 18, W, 80), by = 440 + 4 * Math.sin(t * 1.5);
      poly([bx - 26, by, bx + 26, by, bx + 18, by + 10, bx - 18, by + 10], '#e0b07a');
      rect(bx - 1, by - 46, 2, 46, '#e0b07a');
      poly([bx + 2, by - 4, bx + 2, by - 46, bx + 24, by - 8], '#f4f1e8');
      sea(2, t); sea(3, t);
      for (let i = 0; i < 7; i++) rect(580 + 14 * Math.sin(t * 1.3 + i * 1.7), 405 + i * 9, 40 - i * 4, 2, 'rgba(238,242,255,.25)');
    };
  },
});
