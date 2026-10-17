Screensaver.register({
  id: 'earthrise', name: 'Earthrise', tags: ['night', 'space', 'calm'],
  create(g) {
    const { c, W, H, R, TAU, dot, ell, rect, poly, hill } = g;
    const stars = g.makeStars(180, 400);
    const EX = 330, ER = 80;
    // Clouds of different sizes and speeds, each a bar with a few puffs on top.
    const clouds = [...Array(9)].map(() => {
      const w = R(22, 72), h = R(5, 9);
      return { oy: R(-ER * 0.8, ER * 0.8), w, h, sp: R(3, 9), o: R(0, 400), puffs: [...Array(2 + Math.floor(R(0, 2)))].map(() => ({ x: R(0.2, 0.8), r: R(0.6, 1.1) })) };
    });
    const land = [[60, -24, 34, 22, 0.4], [150, 26, 26, 16, -0.3], [230, -4, 22, 30, 0.2], [300, 40, 30, 14, 0.1]];
    const craters = [[120, 470, 40], [420, 500, 60], [250, 456, 30], [860, 505, 46], [560, 530, 30]];
    const rocks = [...Array(10)].map(() => ({ x: R(0, W), y: R(475, 535), r: R(2, 5), shape: g.wobble(0.2) }));
    // Height of the middle lunar layer, so things stand on it.
    const ground = x => 440 + 14 * Math.sin(x * 0.008 + 3.1) + 7 * Math.sin(x * 0.0184 + 5.27);
    const scroll = (o, sp, t, w) => { const span = 2 * ER + w + 60; return EX - ER - w + ((o + t * sp) % span); };

    function earth(t, ey) {
      g.halo(EX, ey, ER * 1.35, '120,180,255', 0.14);
      c.save(); c.beginPath(); c.arc(EX, ey, ER, 0, TAU); c.fillStyle = '#3f8fe0'; c.fill(); c.clip();
      for (const [ox, oy, rx, ry, rot] of land) ell(scroll(ox, 3, t, rx * 2) + rx, ey + oy, rx, ry, rot, '#57b36a');
      ell(EX, ey - ER, ER * 0.6, ER * 0.2, 0, '#eef4fb');
      ell(EX, ey + ER, ER * 0.5, ER * 0.16, 0, '#eef4fb');
      // A slow storm swirl rides along with the clouds.
      const sx = scroll(90, 4, t, 30) + 15, sy = ey + 18;
      c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 3; c.lineCap = 'round';
      for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(sx, sy, 5 + k * 5, t * 0.3 + k * 2, t * 0.3 + k * 2 + 3.6); c.stroke(); }
      for (const cl of clouds) {
        const x = scroll(cl.o, cl.sp, t, cl.w), y = ey + cl.oy;
        g.capsule(x, y, cl.w, cl.h, 'rgba(255,255,255,.85)');
        for (const p of cl.puffs) dot(x + cl.w * p.x, y + cl.h * 0.2, cl.h * p.r, 'rgba(255,255,255,.85)');
      }
      g.crescent(EX, ey, ER, ER * 0.38, -ER * 0.15, 'rgba(4,8,24,.72)');
      c.restore();
      c.strokeStyle = 'rgba(150,205,255,.35)'; c.lineWidth = 2.5; c.beginPath(); c.arc(EX, ey, ER + 1.5, -1.9, 1.2); c.stroke();
    }
    function lander(x, t) {
      const y = ground(x);
      ell(x + 10, y + 2, 46, 5, 0, 'rgba(0,0,0,.35)');
      c.strokeStyle = '#9a9caa'; c.lineWidth = 2.2; c.beginPath();
      c.moveTo(x - 20, y - 22); c.lineTo(x - 34, y); c.moveTo(x + 20, y - 22); c.lineTo(x + 34, y);
      c.moveTo(x - 10, y - 20); c.lineTo(x - 14, y); c.moveTo(x + 10, y - 20); c.lineTo(x + 14, y); c.stroke();
      for (const fx of [-34, -14, 14, 34]) ell(x + fx, y, 4, 1.6, 0, '#9a9caa');
      rect(x - 22, y - 36, 44, 17, '#d9a441'); rect(x + 8, y - 36, 14, 17, '#b8862f');
      rect(x - 18, y - 33, 8, 5, '#f0c766'); rect(x - 6, y - 27, 9, 4, '#f0c766');
      poly([x - 17, y - 36, x + 17, y - 36, x + 21, y - 49, x + 9, y - 61, x - 12, y - 61, x - 21, y - 49], '#c9ccd6');
      poly([x + 4, y - 36, x + 17, y - 36, x + 21, y - 49, x + 9, y - 61, x + 4, y - 61], '#a7aab6');
      poly([x - 13, y - 50, x - 4, y - 50, x - 4, y - 43, x - 10, y - 43], '#1b2233');
      c.strokeStyle = '#a7aab6'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + 2, y - 61); c.lineTo(x + 2, y - 72); c.stroke();
      ell(x + 2, y - 73, 6, 2, -0.3, '#d8dae2');
      if (Math.sin(t * 2.2) > 0.6) { g.halo(x - 8, y - 62, 9, '255,90,90', 0.7); dot(x - 8, y - 62, 1.6, '#ff6a6a'); }
    }
    function flag(x) {
      const y = ground(x);
      rect(x - 1, y - 54, 2, 54, '#d8dae2');
      rect(x, y - 54, 30, 2, '#d8dae2');
      poly([x + 1, y - 52, x + 30, y - 52, x + 30, y - 34, x + 18, y - 35, x + 1, y - 33], '#3f6fd8');
      dot(x + 15, y - 43, 4.5, '#eef0f5');
    }
    function astronaut(t) {
      const x = 625 + 26 * Math.sin(t * 0.15), dir = Math.cos(t * 0.15) >= 0 ? 1 : -1;
      const ph = (t * 0.55) % 1, hop = 12 * Math.sin(Math.PI * ph), y = ground(x) - hop;
      ell(x, ground(x) + 1, 9 - hop * 0.3, 2.2, 0, 'rgba(0,0,0,.35)');
      c.save(); c.translate(x, y); c.scale(dir, 1);
      rect(-9, -24, 6, 12, '#c9ccd6');
      g.capsule(-4, -10, 4, 10, '#e4e6ee'); g.capsule(1, -10, 4, 10, '#e4e6ee');
      ell(0, -17, 6, 8, 0, '#eef0f5');
      c.strokeStyle = '#e4e6ee'; c.lineWidth = 3.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(3, -19); c.lineTo(8, -13 + 3 * Math.sin(Math.PI * ph)); c.stroke();
      dot(0, -29, 6, '#eef0f5');
      ell(2, -29, 3.8, 3.2, 0, '#e0b24a');
      dot(3, -30, 1, 'rgba(255,255,255,.7)');
      c.restore();
    }
    return (t) => {
      g.rect(0, 0, W, H, '#05070f');
      g.drawStars(stars, t);
      earth(t, 255 + 35 * Math.cos(t * 0.025));
      // A satellite blinks across now and then.
      const sp = (t % 20) / 8;
      if (sp < 1) { const x = 80 + sp * 800, y = 70 + sp * 40; dot(x, y, 1.6, '#ffffff'); if (Math.sin(t * 8) > 0) dot(x, y, 3, 'rgba(255,120,120,.6)'); }
      hill(400, 18, 0.005, 1.2, '#2c2d36');
      hill(440, 14, 0.008, 3.1, '#3b3c47');
      // Footprints from the lander towards the flag.
      for (let x = 570; x < 690; x += 9) dot(x, ground(x) + 3 + (x % 18 ? 1.5 : -1.5), 1.4, '#2c2d36');
      flag(560);
      lander(720, t);
      astronaut(t);
      for (const [x, y, r] of craters) { ell(x, y, r, r * 0.28, 0, '#2a2b34'); ell(x + r * 0.15, y + r * 0.04, r * 0.75, r * 0.18, 0, '#33343e'); }
      hill(520, 8, 0.01, 0.4, '#4a4b57');
      for (const k of rocks) g.blob(k.x, k.y, k.r * 1.4, k.r, k.shape, '#5a5b68');
    };
  },
});
