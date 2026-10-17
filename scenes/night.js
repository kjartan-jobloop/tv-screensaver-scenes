Screensaver.register({
  id: 'night', name: 'Night sky', tags: ['night', 'calm'],
  create(g) {
    const { c, W, R, TAU, dot, hill } = g;
    const stars = g.makeStars(170, 380);
    const flies = [...Array(22)].map(() => ({ x: R(0, W), y: R(420, 520), p: R(0, TAU) }));
    return (t) => {
      g.rect(0, 0, W, g.H, '#0d1633');
      g.drawStars(stars, t);
      dot(600, 120, 42, '#f4ecd0'); dot(620, 106, 38, '#0d1633');
      // A shooting star every 4 seconds, in a different place each time.
      const k = Math.floor(t / 4), ph = (t % 4) / 1.1;
      if (ph < 1) {
        const sx = 80 + (k * 137) % 520, sy = 40 + (k * 71) % 120, x = sx + ph * 320, y = sy + ph * 130;
        c.strokeStyle = `rgba(255,255,255,${1 - ph})`; c.lineWidth = 2;
        c.beginPath(); c.moveTo(x - 70, y - 28); c.lineTo(x, y); c.stroke();
      }
      hill(400, 30, 0.006, t * 0.05, '#1b2550');
      hill(450, 24, 0.009, t * 0.1 + 2, '#141c3d');
      hill(495, 16, 0.013, t * 0.18 + 4, '#0a1028');
      for (const f of flies) dot(f.x + 24 * Math.sin(t * 0.5 + f.p), f.y + 10 * Math.cos(t * 0.7 + f.p), 2.5, `rgba(247,226,122,${0.2 + 0.8 * Math.abs(Math.sin(t * 2 + f.p))})`);
    };
  },
});
