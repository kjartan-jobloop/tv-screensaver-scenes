Screensaver.register({
  id: 'train', name: 'Night train', tags: ['night', 'riso', 'calm'],
  overlay: { color: '#f2ebdb', label: '#3d5588', shadow: false },
  create(g) {
    const { c, W, R, TAU } = g, riso = g.riso;
    const WX = 70, WY = 46, WW = 820, WH = 430, WR = 46;           // the window
    const HORIZON = 330, MOON = [250, 130, 34], BAND = 290;        // hill strips start at BAND
    const roundRect = (cx, x, y, w, h, r) => {
      cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r);
      cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath();
    };
    const winPath = cx => roundRect(cx, WX, WY, WW, WH, WR);
    const cov = a => `rgba(0,0,0,${a})`;
    const stars = [...Array(70)].map(() => [R(WX + 20, WX + WW - 20), R(WY + 16, HORIZON - 60), R(1.8, 3)]);

    // Hill strips: one screen wide, with shapes that repeat exactly, so they scroll seamlessly.
    const ridge = (x, y0, amp, k1, k2, ph) => {
      x.beginPath(); x.moveTo(0, 200);
      for (let px = 0; px <= W; px += 4) x.lineTo(px, y0 + amp * Math.sin((TAU * k1 * px) / W + ph) + amp * 0.45 * Math.sin((TAU * k2 * px) / W + ph * 2.1));
      x.lineTo(W, 200); x.closePath(); x.fill();
    };
    // The still print: carriage wall, window frame, night sky, moon and stars.
    const back = riso.print({
      seed: 'train',
      plates: [
        { ink: 'federal', angle: 15, shift: [0.5, 0], draw: gx => {
          const x = gx.c;
          roundRect(x, WX - 16, WY - 16, WW + 32, WH + 32, WR + 14); x.fillStyle = cov(0.7); x.fill();
          x.globalCompositeOperation = 'destination-out'; winPath(x); x.fill(); x.globalCompositeOperation = 'source-over';
          winPath(x); x.fillStyle = gx.lin(0, WY, 0, WY + WH, [[0, cov(0.92)], [0.6, cov(0.6)], [1, cov(0.5)]]); x.fill();
          // The far hills barely move, so they are part of the still print.
          x.save(); winPath(x); x.clip(); x.translate(0, BAND); x.fillStyle = cov(0.3); ridge(x, 40, 14, 3, 7, 0.4); x.restore();
          x.globalCompositeOperation = 'destination-out';
          x.beginPath(); x.arc(MOON[0], MOON[1], MOON[2], 0, TAU); x.fill();
          for (const [sx, sy, sr] of stars) { x.beginPath(); x.arc(sx, sy, sr, 0, TAU); x.fill(); }
        } },
        { ink: 'pink', angle: 75, shift: [-0.5, 0.5], draw: gx => {
          const x = gx.c;
          x.fillStyle = cov(0.42); x.fillRect(0, 0, W, gx.H);                    // the wall
          x.globalCompositeOperation = 'destination-out'; roundRect(x, WX - 16, WY - 16, WW + 32, WH + 32, WR + 14); x.fill();
          x.globalCompositeOperation = 'source-over';
          winPath(x); x.fillStyle = gx.lin(0, HORIZON - 140, 0, WY + WH, [[0, cov(0)], [0.5, cov(0.5)], [1, cov(0.6)]]); x.fill();
          x.fillStyle = cov(0.8); x.fillRect(0, WY + WH + 30, W, 5);               // stripe along the sill
          x.save(); winPath(x); x.clip(); x.translate(0, BAND); x.fillStyle = cov(0.35); ridge(x, 40, 14, 3, 7, 0.4); x.restore();
        } },
        { ink: 'yellow', angle: 45, shift: [0, -0.5], draw: gx => {
          const x = gx.c;
          x.fillStyle = cov(0.95); x.beginPath(); x.arc(MOON[0], MOON[1], MOON[2] - 1, 0, TAU); x.fill();
        } },
      ],
    });

    // Each strip covers only the rows its hills reach (top..200 of the band), to keep the
    // area copied each frame small.
    const strip = (seed, top, y0, amp, k1, k2, ph, inks) => riso.print({
      seed, w: W, h: 200 - top, paper: 'white',
      plates: inks.map(([ink, a, angle]) => ({ ink, angle, draw: gx => { gx.c.fillStyle = cov(a); gx.c.translate(0, -top); ridge(gx.c, y0, amp, k1, k2, ph); } })),
    });
    const MID_TOP = 54, NEAR_TOP = 138;
    const mid = strip('train-mid', MID_TOP, 78, 16, 2, 5, 1.7, [['federal', 0.85, 15], ['pink', 0.6, 75]]);
    const near = strip('train-near', NEAR_TOP, 150, 7, 9, 17, 0.9, [['federal', 1, 15], ['pink', 0.85, 75]]);
    const midY = x => 78 + 16 * Math.sin((TAU * 2 * x) / W + 1.7) + 7.2 * Math.sin((TAU * 5 * x) / W + 3.57);
    const lights = [...Array(12)].map(() => ({ x: R(0, W), dy: R(10, 26) }));
    const POLE_GAP = 260;

    return (t) => {
      back.draw();
      c.save(); winPath(c); c.clip();
      const midOff = t * 26;
      mid.scroll(midOff, BAND + MID_TOP);
      // Village lights on the middle hills: knocked out of the ink, then printed yellow.
      for (const l of lights) {
        const x = (((l.x - midOff) % W) + W) % W;
        const y = BAND + midY(l.x) + l.dy;
        g.dot(x, y, 2.6, riso.PAPER);
        riso.multiply(() => g.dot(x, y, 2.6, riso.INK.yellow));
      }
      near.scroll(t * 140, BAND + NEAR_TOP);
      // Telegraph poles and sagging wires flick past.
      riso.multiply(() => {
        const off = (t * 220) % POLE_GAP;
        c.strokeStyle = riso.mix(['federal'], ['pink', 0.5]); c.lineWidth = 2.2;
        c.beginPath();
        for (let x = WX - off; x < WX + WW + POLE_GAP; x += POLE_GAP) {
          c.moveTo(x, BAND + 160); c.lineTo(x, WY + 60);
          c.moveTo(x - 10, WY + 72); c.lineTo(x + 10, WY + 72);
          c.moveTo(x, WY + 72); c.quadraticCurveTo(x + POLE_GAP / 2, WY + 110, x + POLE_GAP, WY + 72);
        }
        c.stroke();
      });
      c.restore();
    };
  },
});
