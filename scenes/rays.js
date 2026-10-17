Screensaver.register({
  id: 'rays', name: 'Stingrays', tags: ['water', 'calm'],
  create(g) {
    const { c, W, H, R, TAU, pick, dot, poly } = g;
    const rays = [...Array(4)].map(() => ({
      cx: R(260, 700), cy: R(180, 360), rx: R(160, 300), ry: R(80, 160), sp: R(0.06, 0.12) * pick([1, -1]), p: R(0, TAU), s: R(34, 54),
      col: pick([['#2b6f7a', '#3e8a94'], ['#3a5f7d', '#5079a0'], ['#2f6a64', '#46867f']]),
    }));
    const stars = [[130, 440, 12, 0.3], [820, 120, 10, 1.2], [700, 470, 9, 2.1], [260, 90, 8, 0.8]];
    const ripples = [...Array(5)].map(() => ({ x: R(0, W), y: R(0, H), ph: R(0, 1) }));
    const sand = [...Array(9)].map((_, i) => ({ y: 30 + i * 60, p: R(0, TAU) }));
    function seastar(x, y, r, rot) {
      const pts = [];
      for (let k = 0; k < 10; k++) { const a = rot + (k / 10) * TAU, rr = k % 2 ? r * 0.42 : r; pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
      poly(pts, '#f08a5d'); dot(x, y, r * 0.22, '#f7a982');
    }
    function ray(k, t) {
      const a = t * k.sp + k.p;
      const x = k.cx + k.rx * Math.cos(a), y = k.cy + k.ry * Math.sin(a);
      const head = Math.atan2(k.ry * Math.cos(a) * k.sp, -k.rx * Math.sin(a) * k.sp);
      const s = k.s, f = 0.82 + 0.18 * Math.sin(t * 2.2 + k.p);
      const shape = (dx, dy, col) => {
        c.save(); c.translate(x + dx, y + dy); c.rotate(head);
        c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.moveTo(-s * 0.55, 0);
        c.quadraticCurveTo(-s * 1.2, Math.sin(t * 2 + k.p) * 6, -s * 1.9, Math.sin(t * 2.5 + k.p) * 10); c.stroke();
        c.fillStyle = col; c.beginPath(); c.moveTo(s, 0);
        c.quadraticCurveTo(s * 0.45, -s * 0.95 * f, -s * 0.15, -s * 1.1 * f);
        c.quadraticCurveTo(-s * 0.3, -s * 0.4, -s * 0.6, 0);
        c.quadraticCurveTo(-s * 0.3, s * 0.4, -s * 0.15, s * 1.1 * f);
        c.quadraticCurveTo(s * 0.45, s * 0.95 * f, s, 0);
        c.fill(); c.restore();
      };
      shape(10, 14, 'rgba(10,60,60,.16)');       // shadow on the sand
      shape(0, 0, k.col[0]);
      c.save(); c.translate(x, y); c.rotate(head);
      for (const [px, py, pr] of [[0.1, -0.35, 0.07], [-0.05, 0.4, 0.06], [0.25, 0.1, 0.05], [-0.2, -0.1, 0.06]]) dot(px * s, py * s, pr * s, k.col[1]);
      dot(s * 0.55, -s * 0.13, 2.2, '#123'); dot(s * 0.55, s * 0.13, 2.2, '#123');
      c.restore();
    }
    return (t, dt) => {
      g.rect(0, 0, W, H, '#43aaa5');
      c.strokeStyle = 'rgba(255,255,255,.08)'; c.lineWidth = 2;
      for (const s of sand) {
        c.beginPath();
        for (let x = 0; x <= W; x += 16) { const y = s.y + 8 * Math.sin(x * 0.012 + s.p) + 3 * Math.sin(x * 0.03 + t * 0.2); x ? c.lineTo(x, y) : c.moveTo(x, y); }
        c.stroke();
      }
      for (const [x, y, r, rot] of stars) seastar(x, y, r, rot);
      for (const k of rays) ray(k, t);
      c.lineWidth = 1.5;
      for (const r of ripples) {
        r.ph += dt * 0.3; if (r.ph > 1) { r.ph = 0; r.x = R(0, W); r.y = R(0, H); }
        c.strokeStyle = `rgba(255,255,255,${0.28 * (1 - r.ph)})`; c.beginPath(); c.arc(r.x, r.y, 5 + r.ph * 60, 0, TAU); c.stroke();
      }
    };
  },
});
