Screensaver.register({
  id: 'jellyfish', name: 'Jellyfish', tags: ['water', 'calm'],
  create(g) {
    const { c, W, H, R, TAU, pick, dot, ell } = g;
    const motes = [...Array(70)].map(() => ({ x: R(0, W), y: R(0, H), r: R(1, 2.5), v: R(4, 12) }));
    const jellies = [...Array(7)].map(() => ({ x: R(50, 910), y: R(0, H), s: R(22, 48), v: R(12, 28), p: R(0, TAU), rgb: pick(['247,154,211', '154,208,247', '195,166,255', '255,212,163']) }));
    return (t, dt) => {
      g.rect(0, 0, W, H, '#071e36');
      c.fillStyle = 'rgba(120,180,255,.04)';
      for (let i = 0; i < 3; i++) {
        const x = 200 + i * 280 + 50 * Math.sin(t * 0.2 + i);
        c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 90, 0); c.lineTo(x + 220, H); c.lineTo(x + 50, H); c.fill();
      }
      for (const m of motes) {
        m.y -= m.v * dt;
        if (m.y < -5) { m.y = H + 5; m.x = R(0, W); }
        dot(m.x, m.y, m.r, 'rgba(200,230,255,.35)');
      }
      for (const j of jellies) {
        const pulse = Math.sin(t * 1.6 + j.p);
        const bw = j.s * (1 + 0.12 * pulse), bh = j.s * (0.85 - 0.1 * pulse);
        // They push upward on each contraction and drift the rest of the time.
        j.y -= j.v * (0.5 + 0.5 * Math.max(0, pulse)) * dt;
        j.x += Math.sin(t * 0.3 + j.p) * 6 * dt;
        if (j.y < -j.s * 3) { j.y = H + j.s; j.x = R(50, 910); }
        c.strokeStyle = `rgba(${j.rgb},.45)`; c.lineWidth = 2;
        for (let k = 0; k < 5; k++) {
          const tx = j.x - bw * 0.7 + k * (bw * 1.4 / 4);
          c.beginPath(); c.moveTo(tx, j.y);
          for (let s = 1; s <= 8; s++) c.lineTo(tx + Math.sin(t * 2 + j.p + k + s * 0.6) * s * 1.5, j.y + s * j.s * 0.28);
          c.stroke();
        }
        c.fillStyle = `rgba(${j.rgb},.75)`;
        c.beginPath(); c.ellipse(j.x, j.y, bw, bh, 0, Math.PI, TAU);
        for (let i = 0; i <= 6; i++) c.lineTo(j.x + bw - i * bw / 3, j.y + (i % 2 ? 5 : 0));
        c.closePath(); c.fill();
        ell(j.x, j.y - bh * 0.4, bw * 0.55, bh * 0.35, 0, 'rgba(255,255,255,.18)');
      }
    };
  },
});
