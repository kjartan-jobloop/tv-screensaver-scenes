Screensaver.register({
  id: 'moth', name: 'Moth and lamp', tags: ['night', 'riso', 'calm'],
  overlay: { color: '#ffe800', label: '#ffe800', shadow: false },
  create(g) {
    const { c, W, H, R, TAU } = g, riso = g.riso;
    const LX = 330, LY = 230;
    const cov = a => `rgba(0,0,0,${a})`;
    // A porch at night: plank wall, the lamp, and its pool of warm light.
    const back = riso.print({
      seed: 'moth',
      plates: [
        { ink: 'burgundy', angle: 15, draw: gx => {
          const x = gx.c;
          x.fillStyle = cov(0.95); x.fillRect(0, 0, W, H);
          // Light thins the dark ink near the lamp.
          x.globalCompositeOperation = 'destination-out';
          x.fillStyle = gx.rad(LX, LY + 20, 10, 270, [[0, cov(0.95)], [0.5, cov(0.45)], [1, cov(0)]]); x.fillRect(0, 0, W, H);
          x.globalCompositeOperation = 'source-over';
          x.fillStyle = cov(0.35); for (let y = 0; y < H; y += 46) x.fillRect(0, y, W, 3);   // plank seams
          x.fillStyle = cov(1);
          x.fillRect(LX - 6, LY - 120, 12, 70);                                  // bracket
          x.beginPath(); x.moveTo(LX - 34, LY - 50); x.lineTo(LX + 34, LY - 50); x.lineTo(LX + 22, LY - 30); x.lineTo(LX - 22, LY - 30); x.closePath(); x.fill();
          x.fillRect(LX - 24, LY + 24, 48, 8);
          x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.ellipse(LX, LY, 18, 26, 0, 0, TAU); x.fill();
        } },
        { ink: 'yellow', angle: 0, shift: [0.5, 0], draw: gx => {
          const x = gx.c;
          x.fillStyle = gx.rad(LX, LY + 20, 10, 300, [[0, cov(1)], [0.45, cov(0.55)], [1, cov(0)]]); x.fillRect(0, 0, W, H);
        } },
      ],
    });
    const motes = [...Array(40)].map(() => ({ a: R(0, TAU), r: R(30, 200), v: R(0.05, 0.2), p: R(0, TAU) }));
    const moths = [{ s: 1, sp: 0.55, p: 0 }, { s: 0.7, sp: 0.8, p: 2.4 }];
    const dark = riso.mix(['burgundy'], ['yellow', 0.3]);
    function moth(x, y, s, flap, ang) {
      c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
      riso.multiply(() => {
        c.fillStyle = dark;
        for (const sd of [-1, 1]) {
          c.beginPath(); c.ellipse(sd * 9 * flap, -3, 11 * flap, 8, sd * 0.5, 0, TAU); c.fill();
          c.beginPath(); c.ellipse(sd * 6 * flap, 7, 7 * flap, 5, -sd * 0.4, 0, TAU); c.fill();
        }
        c.beginPath(); c.ellipse(0, 1, 2.4, 9, 0, 0, TAU); c.fill();
        c.strokeStyle = dark; c.lineWidth = 1; c.beginPath(); c.moveTo(-1, -7); c.lineTo(-5, -14); c.moveTo(1, -7); c.lineTo(5, -14); c.stroke();
      });
      c.restore();
    }
    return (t) => {
      back.draw();
      // Dust drifting through the light.
      for (const m of motes) {
        const a = m.a + t * m.v, x = LX + Math.cos(a) * m.r, y = LY + 40 + Math.sin(a * 1.3) * m.r * 0.6;
        g.dot(x, y, 1.4, `rgba(255,250,220,${0.5 + 0.4 * Math.sin(t * 2 + m.p)})`);
      }
      // Moths loop around the lamp, swinging close and away.
      for (const m of moths) {
        const a = t * m.sp + m.p, rr = 70 + 50 * Math.sin(t * 0.37 + m.p);
        const x = LX + Math.cos(a) * rr * 1.3, y = LY + 10 + Math.sin(a * 1.7) * rr * 0.55;
        const dx = -Math.sin(a) * rr * 1.3, dy = Math.cos(a * 1.7) * rr * 0.55 * 1.7;
        moth(x, y, m.s, 0.3 + 0.7 * Math.abs(Math.sin(t * 14 + m.p)), Math.atan2(dy, dx) + Math.PI / 2);
      }
    };
  },
});
