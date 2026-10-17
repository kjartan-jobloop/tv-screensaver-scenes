Screensaver.register({
  id: 'desert', name: 'Desert night', tags: ['night', 'calm'],
  create(g) {
    const { c, W, H, TAU, dot, ell, hill } = g;
    const stars = g.makeStars(160, 360);
    const DUNES = [[340, 30, 0.004, 0.03, '#3b2650'], [390, 26, 0.006, 0.05, '#4a2e5c'], [445, 20, 0.008, 0.08, '#5a3766'], [500, 12, 0.011, 0.12, '#6b4170']];
    const duneY = (x, [y0, amp, f, sp], t) => { const o = t * sp + 1; return y0 + amp * Math.sin(x * f + o) + amp * 0.5 * Math.sin(x * f * 2.3 + o * 1.7); };
    function camel(x, y, s, t, k) {
      const step = t * 3 + k;
      c.strokeStyle = '#24152f'; c.lineWidth = 2.4 * s; c.lineCap = 'round';
      c.beginPath();
      [[-9, 0.0], [-5, Math.PI], [6, Math.PI * 0.5], [10, Math.PI * 1.5]].forEach(([lx, lp]) => {
        c.moveTo(x + lx * s, y - 14 * s); c.lineTo(x + lx * s + 3 * s * Math.sin(step + lp), y);
      });
      c.moveTo(x + 12 * s, y - 20 * s); c.quadraticCurveTo(x + 19 * s, y - 24 * s, x + 18 * s, y - 33 * s);
      c.stroke();
      ell(x, y - 19 * s, 15 * s, 7 * s, 0, '#24152f');
      dot(x - 1 * s, y - 25 * s, 6.5 * s, '#24152f');
      ell(x + 21 * s, y - 34 * s, 5 * s, 2.6 * s, 0.2, '#24152f');
    }
    return (t) => {
      g.rect(0, 0, W, H, '#2a1a3d');
      g.drawStars(stars, t, '255,236,200');
      // A full moon with soft flat spots.
      g.halo(250, 130, 110, '255,230,176', 0.12);
      dot(250, 130, 52, '#ffe6b0');
      dot(232, 118, 10, '#f5d698'); dot(266, 146, 13, '#f5d698'); dot(270, 112, 6, '#f5d698');
      // Night clouds drift past, sometimes across the moon.
      for (const [x, y, w, v] of [[0, 150, 190, 3.2], [380, 80, 150, 2.4], [700, 190, 170, 2.8]]) g.puffCloud(g.wrap(x + t * v, W, 240), y, w, '#3a2752', '#5b4472', '#2f1f45');
      for (const [x, y, w, v] of [[200, 228, 240, 4], [620, 244, 200, 3.4]]) g.capsule(g.wrap(x + t * v, W, 260), y, w, 6, 'rgba(70,48,96,.9)');
      const k = Math.floor(t / 5), ph = (t % 5) / 1.2;
      if (ph < 1) {
        const sx = 380 + (k * 131) % 380, sy = 40 + (k * 67) % 110, x = sx + ph * 260, y = sy + ph * 100;
        c.strokeStyle = `rgba(255,240,220,${1 - ph})`; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 60, y - 23); c.lineTo(x, y); c.stroke();
      }
      DUNES.forEach((d, i) => {
        hill(d[0], d[1], d[2], t * d[3] + 1, d[4]);
        // A small caravan walks the crest of the middle dune.
        if (i === 1) for (let n = 0; n < 3; n++) {
          const x = g.wrap(t * 9 + 420 - n * 52, W, 60);
          camel(x, duneY(x, d, t) + 2, 0.9, t, n * 1.7);
        }
      });
    };
  },
});
