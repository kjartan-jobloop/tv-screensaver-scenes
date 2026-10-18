Screensaver.register({
  id: 'nautilus', name: 'Nautilus', tags: ['abstract', 'riso', 'calm'],
  overlay: { color: '#00838a', shadow: false },
  create(g) {
    const { c, W, H, R, TAU } = g, riso = g.riso;
    const CX = 400, CY = 285;
    const cov = a => `rgba(0,0,0,${a})`;
    // Like a plate from a natural-history book: a ruled frame, a soft round field and a caption.
    const back = riso.print({
      seed: 'nautilus',
      plates: [
        { ink: 'teal', angle: 15, draw: gx => {
          const x = gx.c;
          x.fillStyle = cov(0.14); x.beginPath(); x.arc(CX, CY, 215, 0, TAU); x.fill();
          x.strokeStyle = cov(0.9); x.lineWidth = 1.5; x.strokeRect(40, 30, W - 80, H - 60); x.lineWidth = 0.8; x.strokeRect(48, 38, W - 96, H - 76);
          x.fillStyle = cov(0.9); x.font = 'italic 22px Georgia, serif'; x.fillText('Nautilus pompilius', 680, 440);
          x.font = '14px Georgia, serif'; x.fillText('Shell in section, showing the chambers.', 680, 466);
          x.fillText('Plate IV', 680, 492);
        } },
        { ink: 'red', angle: 75, shift: [0.5, 0.5], draw: gx => {
          const x = gx.c;
          x.fillStyle = cov(0.85); x.fillRect(680, 450, 180, 2);
        } },
      ],
    });
    // A logarithmic spiral r = a * e^(b * th): the shell wall, with curved walls between chambers.
    const B = 0.17, A = 17;
    const rAt = th => A * Math.exp(B * th);
    const plankton = [...Array(12)].map(() => ({ x: R(80, 900), y: R(70, 480), r: R(4, 10), spokes: 5 + Math.floor(R(0, 6)), v: R(2, 6), p: R(0, TAU) }));
    function shell(rot) {
      const pt = (th, f = 1) => [CX + Math.cos(th + rot) * rAt(th) * f, CY + Math.sin(th + rot) * rAt(th) * f];
      // Outer body, the chambers within it, then the lines.
      c.beginPath();
      for (let th = 0; th <= 4.2 * Math.PI; th += 0.08) { const [x, y] = pt(th); th ? c.lineTo(x, y) : c.moveTo(x, y); }
      for (let th = 4.2 * Math.PI; th >= 2.2 * Math.PI; th -= 0.08) { const [x, y] = pt(th - 2 * Math.PI); c.lineTo(x, y); }
      c.closePath();
      riso.multiply(() => { c.fillStyle = riso.ink('teal', 0.45); c.fill(); });
      riso.multiply(() => {
        c.strokeStyle = riso.INK.red; c.lineWidth = 1.6; c.stroke();
        c.beginPath();
        for (let th = 0.6; th < 4.2 * Math.PI - 0.3; th += 0.42) {
          const [x1, y1] = pt(th), [x0, y0] = pt(th - 2 * Math.PI), mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
          const bulge = 0.35 * rAt(th) * 0.3;
          c.moveTo(x0, y0); c.quadraticCurveTo(mx + Math.cos(th + rot + 1.2) * bulge, my + Math.sin(th + rot + 1.2) * bulge, x1, y1);
        }
        c.lineWidth = 1.2; c.stroke();
        c.beginPath(); c.arc(CX, CY, 3, 0, TAU); c.fillStyle = riso.INK.red; c.fill();
      });
    }
    return (t) => {
      back.draw();
      shell(t * 0.03);
      riso.multiply(() => {
        c.strokeStyle = riso.INK.teal; c.lineWidth = 1;
        for (const p of plankton) {
          const x = p.x + 20 * Math.sin(t * 0.05 + p.p), y = g.wrap(p.y - t * p.v, H, 20);
          c.beginPath(); c.arc(x, y, p.r, 0, TAU);
          for (let k = 0; k < p.spokes; k++) { const a = (k / p.spokes) * TAU + t * 0.1 + p.p; c.moveTo(x, y); c.lineTo(x + Math.cos(a) * p.r, y + Math.sin(a) * p.r); }
          c.stroke();
        }
      });
    };
  },
});
