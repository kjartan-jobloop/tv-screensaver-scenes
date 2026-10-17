Screensaver.register({
  id: 'bonfire', name: 'Bonfire', tags: ['night', 'nature', 'calm'],
  create(g) {
    const { c, W, H, R, TAU, pick, dot, ell, rect, poly, hill } = g;
    const FX = 560;
    // The near hillside: a soft bump with the fire on its crest.
    const nearY = x => 458 - 58 * Math.exp(-Math.pow((x - FX) / 280, 2));
    const FY = nearY(FX);
    const stars = g.makeStars(80, 210);
    const clouds = [[30, 120, 180, 2.6], [380, 70, 150, 2], [700, 150, 170, 2.3]].map(([x, y, w, v]) => ({ x, y, w, v }));
    const strips = [[150, 300, 220, 3], [600, 318, 180, 2.5]];
    const trees = [[70, 18, 'round'], [110, 13, 'pine'], [300, 15, 'round'], [330, 11, 'round'], [860, 17, 'pine'], [900, 14, 'round'], [930, 12, 'pine']];
    const sparks = [...Array(34)].map(() => ({ age: R(0, 3), life: R(1.8, 3.2), x: 0, y: 0, vx: 0, vy: 0, p: R(0, TAU) }));
    const smoke = [...Array(8)].map((_, i) => i / 8);
    const leaves = [...Array(6)].map(() => ({ x: R(0, W), y: R(0, H), v: R(10, 18), a: R(0, TAU), col: pick(['#d9763a', '#e9a23b', '#b8502e']) }));
    const grass = [...Array(70)].map(() => ({ x: R(0, W), h: R(5, 12), lean: R(-3, 3) }));
    const stones = [...Array(8)].map((_, i) => ({ a: Math.PI + (i / 7) * Math.PI, shape: g.wobble(0.2) }));

    function flame(x, y, w, h, col, sway) {
      c.fillStyle = col; c.beginPath(); c.moveTo(x - w / 2, y);
      c.quadraticCurveTo(x - w * 0.62, y - h * 0.55, x + sway, y - h);
      c.quadraticCurveTo(x + w * 0.62, y - h * 0.55, x + w / 2, y);
      c.closePath(); c.fill();
    }
    function sitter(x, dir, glow, guitar) {
      const y = nearY(x);
      // Firelight rim: the same shapes, nudged towards the fire, drawn first in orange.
      const rim = `rgba(255,150,70,${0.55 * glow})`;
      ell(x + 2 * dir, y - 16, 8, 14, 0, rim); dot(x + 4 * dir, y - 36, 7, rim);
      ell(x, y - 16, 8, 14, 0, '#17112a');
      dot(x + 2 * dir, y - 36, 7, '#17112a');
      poly([x - 2 * dir, y - 6, x + 18 * dir, y - 9, x + 21 * dir, y + 6, x + 15 * dir, y + 6, x + 13 * dir, y - 1, x, y + 2], '#17112a');
      if (guitar) { ell(x + 10 * dir, y - 12, 8, 6, 0.3 * dir, '#2a1d33'); c.strokeStyle = '#2a1d33'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x + 10 * dir, y - 12); c.lineTo(x - 12 * dir, y - 28); c.stroke(); }
    }
    return (t, dt) => {
      rect(0, 0, W, 200, '#2c2a52');
      rect(0, 200, W, 80, '#41355f');
      rect(0, 280, W, 50, '#664363');
      rect(0, 330, W, 40, '#b0626a');
      g.drawStars(stars, t, '255,240,225');
      dot(140, 110, 22, '#f6e7c8'); dot(150, 103, 20, '#2c2a52');
      for (const k of clouds) g.puffCloud(g.wrap(k.x + t * k.v, W, 220), k.y, k.w, '#443760', '#55466f', '#a8607a');
      for (const [x, y, w, v] of strips) g.capsule(g.wrap(x + t * v, W, 260), y, w, 6, 'rgba(150,84,110,.9)');
      hill(345, 18, 0.004, 0.5, '#3b2f57');
      hill(388, 24, 0.006, 2, '#2e2546');
      for (const [x, s, kind] of trees) {
        const y = 388 + 24 * Math.sin(x * 0.006 + 2) + 12 * Math.sin(x * 0.0138 + 3.4) + 4;
        if (kind === 'pine') poly([x - s * 0.6, y, x, y - s * 3, x + s * 0.6, y], '#2e2546');
        else { rect(x - 2, y - s, 4, s, '#2e2546'); dot(x, y - s * 1.6, s, '#2e2546'); }
      }
      // Near hillside.
      c.fillStyle = '#211a35'; c.beginPath(); c.moveTo(0, H);
      for (let x = 0; x <= W; x += 10) c.lineTo(x, nearY(x));
      c.lineTo(W, H); c.closePath(); c.fill();
      c.strokeStyle = '#211a35'; c.lineWidth = 1.6; c.beginPath();
      for (const gr of grass) { const y = nearY(gr.x) + 1; c.moveTo(gr.x, y); c.lineTo(gr.x + gr.lean, y - gr.h); }
      c.stroke();
      // Tent on the slope.
      const tx = 820, ty = nearY(tx);
      poly([tx - 34, ty + 2, tx, ty - 38, tx + 34, ty + 2], '#1a1430');
      poly([tx - 6, ty + 2, tx, ty - 26, tx + 6, ty + 2], 'rgba(255,160,90,.18)');
      // Firelight breathes slowly; only the flames themselves flicker quickly.
      const flick = 0.92 + 0.05 * Math.sin(t * 0.9) + 0.03 * Math.sin(t * 1.7);
      // Soft firelight: many faint discs, so there are no visible rings.
      for (let k = 0; k < 7; k++) dot(FX, FY - 22, (36 + k * 14) * flick, 'rgba(255,140,60,.022)');
      ell(FX, FY + 4, 120, 16, 0, `rgba(255,140,60,${0.14 * flick})`);
      // Smoke drifting up and away.
      for (const k of smoke) {
        const ph = (t * 0.08 + k) % 1;
        dot(FX + ph * 70 + 8 * Math.sin(t * 0.6 + k * 9), FY - 70 - ph * 200, 8 + ph * 26, `rgba(190,170,200,${0.07 * (1 - ph)})`);
      }
      sitter(FX - 74, 1, flick, false);
      sitter(FX + 70, -1, flick, true);
      // Logs, stones and flames.
      c.save(); c.translate(FX, FY - 4);
      for (const rot of [-0.35, 0.35]) { c.save(); c.rotate(rot); g.capsule(-26, -5, 52, 10, '#4a2e22'); dot(-21, 0, 4, '#b8763f'); dot(21, 0, 4, '#b8763f'); c.restore(); }
      c.restore();
      for (const s of stones) {
        const x = FX + Math.cos(s.a) * 34, y = FY + 2 + Math.sin(s.a) * -6 + 4;
        g.blob(x, y, 7, 5, s.shape, '#3d3450'); g.blob(x + (FX - x) * 0.08, y - 2, 4, 2.5, s.shape, `rgba(255,150,80,${0.45 * flick})`);
      }
      const h = 1 + 0.14 * Math.sin(t * 9) + 0.07 * Math.sin(t * 14.7);
      flame(FX, FY - 6, 40, 64 * h, '#ff6a2e', 6 * Math.sin(t * 3.1));
      flame(FX - 9, FY - 6, 20, 38 * h, '#ff8a3a', 4 * Math.sin(t * 4.3));
      flame(FX + 2, FY - 6, 26, 46 * (2 - h), '#ffb347', 4 * Math.sin(t * 3.7 + 1));
      flame(FX, FY - 6, 12, 24 * h, '#ffe08a', 2 * Math.sin(t * 5));
      // Sparks rise, sway and fade.
      for (const s of sparks) {
        s.age += dt;
        if (s.age > s.life) { s.age = 0; s.life = R(1.8, 3.2); s.x = FX + R(-12, 12); s.y = FY - 30; s.vx = R(-8, 14); s.vy = R(-60, -35); }
        s.x += (s.vx + 10 * Math.sin(t * 2 + s.p)) * dt; s.y += s.vy * dt;
        const a = 1 - s.age / s.life;
        if (s.y < FY - 20) dot(s.x, s.y, 1.5, `rgba(255,${180 + 50 * a | 0},110,${0.9 * a})`);
      }
      for (const l of leaves) {
        l.y += l.v * dt; l.x += 12 * dt; l.a += dt;
        if (l.y > H + 10) { l.y = -10; l.x = R(-100, W); }
        ell(g.wrap(l.x + 20 * Math.sin(l.a), W, 20), l.y, 4.5, 2 * (0.3 + 0.7 * Math.abs(Math.cos(l.a * 1.3))), l.a, l.col);
      }
    };
  },
});
