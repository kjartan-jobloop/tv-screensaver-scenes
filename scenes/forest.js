Screensaver.register({
  id: 'forest', name: 'Firefly forest', tags: ['night', 'nature', 'calm'],
  create(g) {
    const { c, W, H, R, TAU, dot, poly } = g;
    const stars = g.makeStars(60, 220);
    // Four rows of pines, darker towards the front. The forest stands still; the wind moves it.
    const ROWS = [[300, 0.55, 0.045, '#174242'], [350, 0.75, 0.055, '#123637'], [410, 1, 0.065, '#0d2a2b'], [480, 1.3, 0.075, '#081f20']].map(([base, k, sway, col]) => {
      const trees = []; let x = -40;
      while (x < W + 40) { trees.push({ x, h: R(80, 140) * k, w: R(30, 44) * k, p: R(0, TAU) }); x += R(34, 80) * k; }
      return { base, k, sway, col, trees };
    });
    // Fog banks: a few per row, hugging the tree line, plus ground mist in front. Fronts drift faster.
    const fog = ROWS.flatMap((row, i) => [...Array(2)].map((_, j) => ({ row: i, x: j * W / 2 + R(0, W / 3), y: row.base - R(6, 34), w: R(340, 560), h: R(20, 38), v: 3 + i * 2 + R(0, 3), a: R(0.055, 0.08) })));
    const ground = [...Array(5)].map(() => ({ x: R(0, W), y: R(492, 522), w: R(320, 560), h: R(24, 38), v: R(10, 15), a: R(0.05, 0.07) }));
    // Each bank is two stacked shapes, the outer one larger and fainter, so its edges stay soft.
    const bank = f => {
      const x = g.wrap(f.x, W, f.w + 60);
      for (let k = 1; k >= 0; k--) g.capsule(x - k * 40, f.y - k * f.h * 0.35, f.w + k * 80, f.h * (1 + k * 0.7), `rgba(130,190,180,${f.a * (k ? 0.35 : 0.6)})`);
    };
    // Only a few fireflies, glowing up and fading slowly.
    const flies = [...Array(13)].map(() => ({ x: R(0, W), y: R(300, 520), p: R(0, TAU), s: R(0.7, 1.1) }));
    // Dark night clouds with a moonlit upper edge.
    const clouds = [[60, 70, 200, 3], [420, 130, 150, 2.2], [760, 60, 180, 2.6]].map(([x, y, w, v]) => ({ x, y, w, v }));
    function pine(x, base, h, w, col) {
      const top = base - h;
      poly([x, top, x + w * 0.32, top + h * 0.32, x + w * 0.16, top + h * 0.32, x + w * 0.42, top + h * 0.62, x + w * 0.2, top + h * 0.62,
        x + w * 0.5, base, x - w * 0.5, base, x - w * 0.2, top + h * 0.62, x - w * 0.42, top + h * 0.62, x - w * 0.16, top + h * 0.32, x - w * 0.32, top + h * 0.32], col);
    }
    return (t, dt) => {
      g.rect(0, 0, W, H, '#0e2a2b');
      g.drawStars(stars, t, '220,255,235');
      g.halo(190, 110, 90, '210,240,220', 0.1);
      dot(190, 110, 34, '#d5ecdc');
      for (const k of clouds) g.puffCloud(g.wrap(k.x + t * k.v, W, 240), k.y, k.w, '#173a3a', '#2a5450', '#123030');
      ROWS.forEach((row, i) => {
        for (const tr of row.trees) {
          // Slow gusts roll across from the left; each tree also has its own small flutter.
          const gust = 0.5 + 0.5 * Math.sin(t * 0.35 - tr.x * 0.005 + i * 0.6);
          const lean = row.sway * (0.25 + 0.75 * gust) * (0.85 + 0.15 * Math.sin(t * 1.3 + tr.p));
          c.save(); c.translate(tr.x, row.base); c.transform(1, 0, -lean, 1, 0, 0);
          pine(0, 0, tr.h, tr.w, row.col);
          c.restore();
        }
        g.rect(0, row.base - 1, W, H - row.base + 1, row.col);
        for (const f of fog) if (f.row === i) { f.x += f.v * dt; bank(f); }
      });
      for (const f of ground) { f.x += f.v * dt; bank(f); }
      for (const f of flies) {
        const x = g.wrap(f.x + 14 * Math.sin(t * 0.12 * f.s + f.p) + t * 1.2, W, 10), y = f.y + 8 * Math.cos(t * 0.18 * f.s + f.p);
        const on = Math.pow(Math.max(0, Math.sin(t * 0.45 * f.s + f.p * 3)), 2);
        if (on > 0.03) { g.halo(x, y, 7 * f.s, '233,245,138', 0.3 * on); dot(x, y, 1.4 * f.s, `rgba(240,250,190,${0.25 + 0.55 * on})`); }
      }
    };
  },
});
