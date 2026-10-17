Screensaver.register({
  id: 'whale', name: 'Whale', tags: ['water', 'calm'],
  create(g) {
    const { c, W, H, R, TAU, dot, ell, poly, hill } = g;
    const motes = [...Array(60)].map(() => ({ x: R(0, W), y: R(0, H), r: R(1, 2.2), v: R(3, 9) }));
    const fish = [...Array(18)].map(() => ({ dx: R(-60, 60), dy: R(-22, 22), p: R(0, TAU) }));
    const L = 300;                                   // whale length
    const CROSS = (W + L * 2) / 22;                  // seconds to cross at 22 px/s
    // Seabed: the two sand layers, and what grows on them.
    const backY = x => 470 + 26 * Math.sin(x * 0.004 + 0.5) + 13 * Math.sin(x * 0.0092 + 0.85);
    const frontY = x => 505 + 16 * Math.sin(x * 0.007 + 2) + 8 * Math.sin(x * 0.0161 + 3.4);
    const kelp = [...Array(9)].map((_, i) => ({ x: 40 + i * 110 + R(-30, 30), n: Math.round(R(6, 10)), wd: R(4, 6), p: R(0, TAU) }));
    const grass = [...Array(140)].map(() => ({ x: R(0, W), h: R(14, 40), p: R(0, TAU), col: Math.random() < 0.5 ? '#145a5e' : '#1a6868' }));
    function grow(x, y, ang, len, depth, out) {
      const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
      out.push([x, y, x2, y2, depth]);
      if (depth < 3) { grow(x2, y2, ang - R(0.25, 0.55), len * 0.72, depth + 1, out); grow(x2, y2, ang + R(0.25, 0.55), len * 0.72, depth + 1, out); }
      return out;
    }
    const branch = (x, y, len) => ({ x, y, p: R(0, TAU), segs: grow(x, y, -Math.PI / 2 + R(-0.15, 0.15), len, 0, []) });
    const backCorals = [branch(300, backY(300) + 4, 26), branch(690, backY(690) + 4, 30)];
    const frontCorals = [branch(150, frontY(150) + 4, 30), branch(290, frontY(290) + 4, 20), branch(820, frontY(820) + 4, 24)];
    const fans = [{ x: 520, y: frontY(520) + 2, s: 1, p: R(0, TAU) }, { x: 905, y: frontY(905) + 2, s: 0.7, p: R(0, TAU) }];
    const brains = [{ x: 640, y: frontY(640) + 4, s: 1, shape: g.wobble(0.08) }, { x: 60, y: frontY(60) + 6, s: 0.75, shape: g.wobble(0.08) }];
    const rock = { x: 380, y: frontY(380) + 6, shape: g.wobble(0.15) };
    function ribbon(k, t, base, col) {
      const pts = [];
      for (let s = 0; s <= k.n; s++) pts.push([k.x + Math.sin(t * 0.6 + k.p + s * 0.5) * s * 2.4, base + 6 - s * 15]);
      const wd = i => k.wd * (1 - (i / pts.length) * 0.75);
      c.beginPath();
      pts.forEach(([x, y], i) => (i ? c.lineTo(x - wd(i), y) : c.moveTo(x - wd(i), y)));
      for (let i = pts.length - 1; i >= 0; i--) c.lineTo(pts[i][0] + wd(i), pts[i][1]);
      c.closePath(); c.fillStyle = col; c.fill();
    }
    function coral(k, t, col, tip, width) {
      c.save(); c.translate(k.x, k.y); c.rotate(0.03 * Math.sin(t * 0.5 + k.p)); c.translate(-k.x, -k.y);
      c.strokeStyle = col; c.lineCap = 'round';
      // One stroke per branch thickness instead of one per branch.
      for (let depth = 0; depth <= 3; depth++) {
        c.lineWidth = width - depth * width * 0.2; c.beginPath();
        for (const [x1, y1, x2, y2, d] of k.segs) if (d === depth) { c.moveTo(x1, y1); c.lineTo(x2, y2); }
        c.stroke();
      }
      if (tip) { c.fillStyle = tip; c.beginPath(); for (const [, , x2, y2, d] of k.segs) if (d === 3) { c.moveTo(x2 + 2.4, y2); c.arc(x2, y2, 2.4, 0, TAU); } c.fill(); }
      c.restore();
    }
    function body() {
      c.beginPath(); c.moveTo(L * 0.5, 0);
      c.quadraticCurveTo(L * 0.46, -L * 0.14, L * 0.12, -L * 0.15);
      c.quadraticCurveTo(-L * 0.3, -L * 0.13, -L * 0.56, -L * 0.025);
      c.lineTo(-L * 0.56, L * 0.02);
      c.quadraticCurveTo(-L * 0.2, L * 0.13, L * 0.16, L * 0.12);
      c.quadraticCurveTo(L * 0.46, L * 0.1, L * 0.5, 0);
      c.closePath();
    }
    return (t, dt) => {
      g.rect(0, 0, W, H, '#0b3646');
      c.fillStyle = 'rgba(160,230,255,.045)';
      for (let i = 0; i < 4; i++) {
        const x = 120 + i * 230 + 40 * Math.sin(t * 0.18 + i);
        c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 80, 0); c.lineTo(x + 200, H); c.lineTo(x + 40, H); c.fill();
      }
      for (let i = 0; i < 6; i++) g.capsule(g.wrap(i * 170 + t * 9, W, 80), 14 + (i % 3) * 9, 70, 3, 'rgba(190,240,255,.12)');
      for (const m of motes) { m.y -= m.v * dt; if (m.y < -4) { m.y = H + 4; m.x = R(0, W); } dot(m.x, m.y, m.r, 'rgba(190,240,255,.3)'); }
      for (const k of kelp) ribbon(k, t, backY(k.x), '#13505c');
      for (const k of backCorals) coral(k, t, '#13505c', null, 9);
      hill(470, 26, 0.004, 0.5, '#0a2f3d');
      // Near seabed: seagrass, a rock and a few corals in muted coral pink.
      c.lineCap = 'round';
      // Blades are thin filled triangles, one fill per colour: much cheaper than curved strokes.
      for (const col of ['#145a5e', '#1a6868']) {
        c.fillStyle = col; c.beginPath();
        for (const gr of grass) {
          if (gr.col !== col) continue;
          const y = frontY(gr.x) + 4, tip = gr.x + 5 * Math.sin(t * 0.7 + gr.p) + 2;
          c.moveTo(gr.x - 1.6, y); c.lineTo(tip, y - gr.h); c.lineTo(gr.x + 1.6, y);
        }
        c.fill();
      }
      hill(505, 16, 0.007, 2, '#082833');
      g.blob(rock.x, rock.y, 26, 14, rock.shape, '#0d3a44');
      for (const k of frontCorals) coral(k, t, '#b9636c', '#e09a96', 8);
      // Sea fans: soft half-discs with ribs.
      for (const fan of fans) {
        c.save(); c.translate(fan.x, fan.y); c.rotate(0.04 * Math.sin(t * 0.45 + fan.p)); c.scale(fan.s, fan.s);
        c.fillStyle = 'rgba(185,99,108,.55)'; c.beginPath(); c.ellipse(0, 0, 34, 42, 0, Math.PI, TAU); c.fill();
        c.strokeStyle = '#b9636c'; c.lineWidth = 1.8; c.beginPath();
        for (let k = 0; k <= 6; k++) { const a = Math.PI + (k / 6) * Math.PI; c.moveTo(0, 0); c.lineTo(Math.cos(a) * 32, Math.sin(a) * 40); }
        c.stroke(); c.restore();
      }
      // Brain corals.
      for (const b of brains) {
        c.save(); c.translate(b.x, b.y); c.scale(b.s, b.s);
        g.blob(0, -10, 24, 16, b.shape, '#c7766c');
        c.strokeStyle = 'rgba(140,70,70,.5)'; c.lineWidth = 1.5; c.beginPath();
        for (let k = -2; k <= 2; k++) { c.moveTo(-16 + Math.abs(k) * 2, -10 + k * 5); c.quadraticCurveTo(0, -14 + k * 5, 16 - Math.abs(k) * 2, -10 + k * 5); }
        c.stroke(); c.restore();
      }
      // School of small fish, the other way.
      const sx = g.wrap(W - t * 30, W, 120), sy = 150 + 26 * Math.sin(t * 0.25);
      for (const f of fish) {
        const x = sx + f.dx + 4 * Math.sin(t * 2 + f.p), y = sy + f.dy + 3 * Math.cos(t * 1.6 + f.p);
        poly([x - 6, y, x + 3, y - 3, x + 3, y + 3], 'rgba(120,200,215,.55)');
      }
      // The whale glides across, rises and dips, then comes round again.
      const ph = ((t + CROSS * 0.4) % CROSS) / CROSS, x = -L + ph * (W + L * 2), y = 300 + 30 * Math.sin(t * 0.22), tilt = 0.06 * Math.cos(t * 0.22);
      c.save(); c.translate(x, y); c.rotate(tilt);
      c.save(); c.translate(-L * 0.56, 0); c.rotate(0.25 * Math.sin(t * 0.9));
      poly([0, 0, -L * 0.13, -L * 0.13, -L * 0.07, 0, -L * 0.13, L * 0.13], '#1b6478');
      c.restore();
      body(); c.fillStyle = '#1d6a7f'; c.fill();
      c.save(); c.clip();
      ell(L * 0.1, L * 0.11, L * 0.42, L * 0.07, 0, '#2c8197');
      c.strokeStyle = 'rgba(20,70,90,.5)'; c.lineWidth = 1.5;
      for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(L * 0.42, L * 0.05 + k * 4); c.quadraticCurveTo(L * 0.1, L * 0.1 + k * 4, -L * 0.12, L * 0.08 + k * 3); c.stroke(); }
      c.restore();
      c.save(); c.translate(L * 0.14, L * 0.09); c.rotate(0.5 + 0.15 * Math.sin(t * 0.9));
      ell(0, L * 0.06, L * 0.035, L * 0.1, 0, '#1b6478'); c.restore();
      dot(L * 0.36, -L * 0.01, 3.2, '#08202a');
      for (const [bx, by] of [[L * 0.3, -L * 0.1], [L * 0.05, -L * 0.13], [-L * 0.2, -L * 0.1]]) dot(bx, by, 2.4, 'rgba(200,240,250,.35)');
      c.restore();
    };
  },
});
