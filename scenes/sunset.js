Screensaver.register({
  id: 'sunset', name: 'Sunset sea', tags: ['water', 'calm'],
  create(g) {
    const { c, W, H, R, hill } = g;
    // Long thin cloud strips low in the sky (some cross the sun) and a few puffy ones higher up.
    const strips = [...Array(7)].map((_, i) => ({ x: R(0, W), y: 200 + i * 14 + R(-4, 4), w: R(120, 260), h: R(6, 11), v: R(4, 9), col: i % 2 ? '#ff9f80' : '#ffa98a' }));
    const puffs = [...Array(4)].map((_, i) => ({ x: i * 280 + R(0, 120), y: R(50, 120), w: R(120, 180), v: R(3, 6) }));
    return (t) => {
      g.rect(0, 0, W, H, '#ffcf9e');
      g.rect(0, 170, W, 140, '#ffb48a');
      for (const p of puffs) g.puffCloud(g.wrap(p.x + t * p.v, W, 200), p.y, p.w, '#ffe3c9', '#fff1e3', '#f9bf9c');
      g.dot(480, 300, 90, '#ff8a5c');
      for (const s of strips) g.capsule(g.wrap(s.x + t * s.v, W, 280), s.y, s.w, s.h, s.col);
      c.strokeStyle = '#5a3b4f'; c.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const x = ((t * 30 + i * 230) % (W + 200)) - 100, y = 120 + i * 25 + 8 * Math.sin(t + i), fl = 6 * Math.sin(t * 6 + i);
        c.beginPath(); c.moveTo(x - 12, y - fl); c.lineTo(x, y); c.lineTo(x + 12, y - fl); c.stroke();
      }
      ['#5c7fb8', '#4a6aa3', '#3a568d', '#2b4476', '#1e335e'].forEach((col, i) =>
        hill(300 + i * 48, 9 + i * 2, 0.008 + i * 0.003, t * (0.4 + i * 0.2) * (i % 2 ? 1 : -1), col));
      // Glints of sun on the water.
      for (let i = 0; i < 9; i++) {
        const w = 70 - i * 6 + 10 * Math.sin(t * 1.4 + i * 1.9);
        g.capsule(480 - w / 2 + 6 * Math.sin(t * 0.8 + i), 330 + i * 18, w, 3, `rgba(255,190,150,${0.5 - i * 0.04})`);
      }
    };
  },
});
