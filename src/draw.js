// Character and world drawing: Cosmo the alien, the rocket, and every body of the Solar System.
(function (SA) {
  const TAU = Math.PI * 2;

  // ---------- Cosmo ----------
  // Glowing star, used for the antenna tip (and the tip of pointy hats).
  function glowStar(ctx, x, y, t) {
    const glow = ctx.createRadialGradient(x, y, 0, x, y, 22);
    glow.addColorStop(0, 'rgba(255,230,100,0.7)');
    glow.addColorStop(1, 'rgba(255,230,100,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 22, y - 22, 44, 44);
    ctx.fillStyle = '#ffd84d';
    SA.starPath(ctx, x, y, 11, 0.48, 5, -Math.PI / 2 + t * 1.2);
    ctx.fill();
  }

  function antenna(ctx, t, col) {
    const sway = Math.sin(t * 2.6) * 0.25;
    const tipX = Math.sin(sway) * 22, tipY = -68 + Math.abs(sway) * 6;
    ctx.strokeStyle = col || '#2f8d72';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.quadraticCurveTo(tipX * 0.2, -54, tipX, tipY);
    ctx.stroke();
    glowStar(ctx, tipX, tipY, t);
  }

  // Hats from Cosmo's Wardrobe, drawn in Cosmo's own coordinates (body top is y = -38).
  // Pointy hats carry Cosmo's star on their tip instead of the antenna.
  const HAT_TOP = { none: -80, party: -96, helmet: -80, cap: -76, crown: -80, wizard: -120, halo: -80, beanie: -82, grad: -72 };
  SA.hatTop = hat => HAT_TOP[hat] || -80;

  function ringHalf(ctx, front) {
    ctx.save();
    ctx.translate(0, -30);
    ctx.rotate(-0.22);
    for (const [w, c] of [[9, '#d9b676'], [5, '#f5e7c6']]) {
      ctx.strokeStyle = c;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.ellipse(0, 0, 60, 13, 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawHat(ctx, hat, t) {
    ctx.lineJoin = 'round';
    if (hat === 'party') {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(-22, -26);
      ctx.quadraticCurveTo(0, -20, 22, -26);
      ctx.lineTo(4, -84);
      ctx.closePath();
      ctx.fillStyle = '#ff6bb5';
      ctx.fill();
      ctx.clip();
      ctx.fillStyle = '#ffe066';
      for (let i = -4; i < 6; i++) { ctx.save(); ctx.translate(i * 14, -50); ctx.rotate(-0.6); ctx.fillRect(-3, -60, 6, 120); ctx.restore(); }
      ctx.restore();
      ctx.strokeStyle = '#c23d86';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-22, -26); ctx.quadraticCurveTo(0, -20, 22, -26); ctx.lineTo(4, -84); ctx.closePath();
      ctx.stroke();
      glowStar(ctx, 4, -86, t);
    } else if (hat === 'helmet') {
      ctx.fillStyle = 'rgba(190,225,255,0.18)';
      SA.circle(ctx, 0, -8, 62); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.65)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, -8, 50, Math.PI * 1.1, Math.PI * 1.4);
      ctx.stroke();
      ctx.fillStyle = '#aab3cc';
      SA.ellipse(ctx, 0, 40, 40, 8); ctx.fill();
      ctx.strokeStyle = '#6b7493';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    } else if (hat === 'cap') {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, -28, 31, 20, 0, Math.PI, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      const cols = ['#ff5d6c', '#ffd84d', '#4fa3f0', '#7ee08a'];
      for (let i = 0; i < 4; i++) { ctx.fillStyle = cols[i]; ctx.fillRect(-31 + i * 15.5, -50, 15.5, 24); }
      ctx.restore();
      ctx.strokeStyle = '#1d2747';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(0, -28, 31, 20, 0, Math.PI, Math.PI * 2); ctx.closePath(); ctx.stroke();
      ctx.fillStyle = '#4fa3f0';
      SA.ellipse(ctx, 26, -28, 18, 5, 0.1); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -48); ctx.lineTo(0, -60); ctx.stroke();
      const spin = Math.abs(Math.cos(t * 14));
      ctx.fillStyle = '#ff5d6c';
      SA.ellipse(ctx, 0, -61, 4 + 22 * spin, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffd84d';
      SA.circle(ctx, 0, -61, 4); ctx.fill();
    } else if (hat === 'crown') {
      ctx.beginPath();
      ctx.moveTo(-26, -28);
      ctx.lineTo(-28, -56); ctx.lineTo(-14, -42); ctx.lineTo(0, -64); ctx.lineTo(14, -42); ctx.lineTo(28, -56);
      ctx.lineTo(26, -28);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, -64, 0, -28);
      g.addColorStop(0, '#fff2a8');
      g.addColorStop(1, '#f5b827');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = '#b8860b';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      for (const [gx, gy, c] of [[-14, -34, '#ff5d6c'], [0, -36, '#4fa3f0'], [14, -34, '#7ee08a']]) {
        ctx.fillStyle = c; SA.circle(ctx, gx, gy, 4); ctx.fill();
      }
      ctx.fillStyle = '#fffbe0';
      for (const [px, py] of [[-28, -56], [0, -64], [28, -56]]) { SA.circle(ctx, px, py, 3.5); ctx.fill(); }
    } else if (hat === 'wizard') {
      ctx.fillStyle = '#4b34b0';
      SA.ellipse(ctx, 0, -30, 42, 9); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-26, -32);
      ctx.quadraticCurveTo(-6, -70, 16, -108);
      ctx.quadraticCurveTo(12, -66, 26, -32);
      ctx.closePath();
      ctx.fillStyle = '#6f5bd6';
      ctx.fill();
      ctx.strokeStyle = '#3a2690';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = '#ffe066';
      for (const [sx, sy, r] of [[-8, -46, 5], [8, -62, 4], [2, -80, 3.5]]) { SA.starPath(ctx, sx, sy, r, 0.45, 5); ctx.fill(); }
      glowStar(ctx, 16, -110, t);
    } else if (hat === 'halo') {
      ringHalf(ctx, true);
    } else if (hat === 'trophy') {
      // Golden explorer's hat, the Grand Tour reward.
      const g = ctx.createLinearGradient(0, -58, 0, -28);
      g.addColorStop(0, '#fff2a8');
      g.addColorStop(1, '#e0a31a');
      ctx.fillStyle = g;
      ctx.strokeStyle = '#a8740a';
      ctx.lineWidth = 2.5;
      SA.ellipse(ctx, 0, -29, 48, 9); ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, -30, 32, 26, 0, Math.PI, Math.PI * 2);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#b5121b';
      ctx.fillRect(-31, -38, 62, 7);
      glowStar(ctx, 0, -48, t);
    } else if (hat === 'beanie') {
      // Grandma's knitted hat: stripes, a ribbed band and a fluffy pompom (the antenna pokes out).
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, -27, 34, 32, 0, Math.PI, Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = '#ff7ab0';
      ctx.fill();
      ctx.clip();
      ctx.fillStyle = '#ffe066';
      for (const y of [-52, -40]) ctx.fillRect(-40, y, 80, 6);
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      for (let x = -30; x <= 30; x += 8) { SA.ellipse(ctx, x, -46, 2.2, 14); ctx.fill(); }
      ctx.restore();
      ctx.strokeStyle = '#b8336e';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(0, -27, 34, 32, 0, Math.PI, Math.PI * 2); ctx.closePath(); ctx.stroke();
      ctx.fillStyle = '#8f5bff';
      SA.rrect(ctx, -36, -34, 72, 12, 6); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
      for (let x = -30; x <= 30; x += 6) { ctx.beginPath(); ctx.moveTo(x, -32); ctx.lineTo(x, -24); ctx.stroke(); }
      ctx.fillStyle = '#fff6fb'; ctx.strokeStyle = '#d9a3c0'; ctx.lineWidth = 2;
      SA.circle(ctx, -22, -56, 9); ctx.fill(); ctx.stroke();
    } else if (hat === 'grad') {
      // The Expert cap: a navy graduation cap with gold trim and a swinging gold tassel.
      ctx.fillStyle = '#26306e'; ctx.strokeStyle = '#141a45'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(0, -30, 28, 15, 0, Math.PI, Math.PI * 2); ctx.lineTo(28, -26); ctx.lineTo(-28, -26); ctx.closePath(); ctx.fill(); ctx.stroke();
      const board = [[-48, -48], [0, -60], [48, -48], [0, -36]];
      ctx.beginPath(); board.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath();
      const bg = ctx.createLinearGradient(0, -60, 0, -36);
      bg.addColorStop(0, '#3a46a0'); bg.addColorStop(1, '#1f2760');
      ctx.fillStyle = bg; ctx.fill();
      ctx.strokeStyle = '#ffd84d'; ctx.lineWidth = 3; ctx.stroke();
      const sw = Math.sin(t * 2.4) * 3;
      ctx.strokeStyle = '#ffd84d'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(0, -48); ctx.quadraticCurveTo(22, -50, 32 + sw * 0.3, -44); ctx.lineTo(33 + sw, -24); ctx.stroke();
      ctx.fillStyle = '#ffc21f';
      ctx.beginPath(); ctx.moveTo(29 + sw, -26); ctx.lineTo(37 + sw, -26); ctx.lineTo(39 + sw, -12); ctx.lineTo(27 + sw, -12); ctx.closePath(); ctx.fill();
      glowStar(ctx, 0, -48, t);
    }
  }

  // Idle glance: Cosmo looks somewhere new every couple of seconds, with a quick eye dart.
  function idleLook(t) {
    const k = Math.floor(t / 2.3);
    const r = SA.seeded(k * 7919 + 13);
    const p = SA.seeded((k - 1) * 7919 + 13);
    const to = [r() * 1.6 - 0.8, r() * 0.9 - 0.5], from = [p() * 1.6 - 0.8, p() * 0.9 - 0.5];
    const u = SA.easeOut(((t % 2.3) / 0.18));
    // Every third glance is straight at the player.
    if (k % 3 === 0) to[0] = to[1] = 0;
    if ((k - 1) % 3 === 0) from[0] = from[1] = 0;
    return [SA.lerp(from[0], to[0], u), SA.lerp(from[1], to[1], u)];
  }

  // Base size: body is about 84 x 76 at s = 1.
  // o: { t, talk, wave, mood: 'happy'|'wow'|'joy', look: [dx,dy], noBob, hat, squash }
  // squash > 0 flattens Cosmo (landing), < 0 stretches him (jumping).
  // Cosmo's family (story.js) share his shape in their own colours: o.skin.
  const COSMO_SKIN = { hi: '#b6f7de', mid: '#62d6ad', lo: '#36a982', line: '#2b8569', limbHi: '#5ad3aa', limbLo: '#3aa883', belly: 'rgba(225,255,243,0.75)', rim: 'rgba(200,255,240,0.55)', stalk: '#2f8d72' };
  SA.COSMO_SKIN = COSMO_SKIN;
  SA.drawCosmo = function (ctx, x, y, s, o) {
    o = o || {};
    const t = o.t || 0;
    const K = o.skin || COSMO_SKIN;
    const hat = o.hat || (SA.state && SA.state.hat) || 'none';
    const bob = o.noBob ? 0 : Math.sin(t * 2.2) * 4;
    // Gentle squash and stretch: stretched while rising, squashed at the bottom of the bob.
    let sq = o.squash || 0;
    if (!o.noBob) sq += -Math.cos(t * 2.2) * 0.035;
    sq = SA.clamp(sq, -0.25, 0.25);
    ctx.save();
    ctx.translate(x, y + bob * s);
    ctx.scale(s, s);
    // Squash around the feet so Cosmo stays planted.
    ctx.translate(0, 44);
    ctx.scale(1 + sq, 1 - sq);
    ctx.translate(0, -44);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Antenna with a glowing star tip (pointy hats wear the star instead).
    if (hat === 'halo') ringHalf(ctx, false);
    if (hat !== 'party' && hat !== 'wizard' && hat !== 'cap' && hat !== 'trophy' && hat !== 'grad') antenna(ctx, t, K.stalk);

    // Feet and arms behind the body.
    const limb = ctx.createLinearGradient(0, -10, 0, 44);
    limb.addColorStop(0, K.limbHi);
    limb.addColorStop(1, K.limbLo);
    ctx.fillStyle = limb;
    ctx.strokeStyle = K.line;
    ctx.lineWidth = 2;
    SA.ellipse(ctx, -17, 36, 12, 8); ctx.fill(); ctx.stroke();
    SA.ellipse(ctx, 17, 36, 12, 8); ctx.fill(); ctx.stroke();
    const joy = o.mood === 'joy';
    const wave = o.wave ? Math.sin(t * 9) * 0.5 - 0.9 : joy ? -1.6 + Math.sin(t * 10) * 0.25 : 0.35 + Math.sin(t * 1.7) * 0.06;
    const left = joy ? 1.6 - Math.sin(t * 10) * 0.25 : -0.35 - Math.sin(t * 1.7 + 1) * 0.06;
    ctx.save(); ctx.translate(-36, 6); ctx.rotate(left);SA.ellipse(ctx, -8, 6, 9, 15); ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.translate(36, 6); ctx.rotate(wave); SA.ellipse(ctx, 8, 6, 9, 15); ctx.fill(); ctx.stroke(); ctx.restore();

    // Body.
    const g = ctx.createRadialGradient(-14, -18, 6, 0, 0, 50);
    g.addColorStop(0, K.hi);
    g.addColorStop(0.55, K.mid);
    g.addColorStop(1, K.lo);
    ctx.fillStyle = g;
    SA.ellipse(ctx, 0, 0, 42, 38);
    ctx.fill();
    // Rim light along the lower right and a soft gloss on the forehead.
    ctx.save();
    ctx.clip();
    const rim = ctx.createRadialGradient(-8, -8, 34, -8, -8, 52);
    rim.addColorStop(0, K.rim.replace(/[\d.]+\)$/, '0)'));
    rim.addColorStop(1, K.rim);
    ctx.fillStyle = rim;
    ctx.fillRect(-44, -40, 88, 80);
    ctx.restore();
    ctx.strokeStyle = K.line;
    ctx.lineWidth = 3;
    SA.ellipse(ctx, 0, 0, 42, 38);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    SA.ellipse(ctx, -16, -26, 11, 5, -0.4); ctx.fill();
    ctx.fillStyle = K.belly;
    SA.ellipse(ctx, 0, 16, 23, 15); ctx.fill();
    // Three tiny freckle spots.
    ctx.fillStyle = K.freckle || 'rgba(43,133,105,0.35)';
    SA.circle(ctx, 30, -16, 2.2); ctx.fill();
    SA.circle(ctx, 34, -10, 1.6); ctx.fill();
    SA.circle(ctx, -31, -14, 1.8); ctx.fill();

    // Cheeks (rosier when excited).
    ctx.fillStyle = joy || o.mood === 'wow' ? 'rgba(255,110,145,0.6)' : 'rgba(255,120,150,0.45)';
    SA.ellipse(ctx, -27, 8, 7, 4.5); ctx.fill();
    SA.ellipse(ctx, 27, 8, 7, 4.5); ctx.fill();

    // Eyes: idle glances, a blink every few seconds (sometimes a double blink), happy arcs for joy.
    const look = o.look || idleLook(t + (o.seed || 0));
    const bt = t % 3.8, cyc = Math.floor(t / 3.8);
    const blink = bt < 0.12 || (cyc % 3 === 1 && bt > 0.24 && bt < 0.36);
    const wow = o.mood === 'wow';
    for (const ex of [-15, 15]) {
      if (joy) {
        ctx.strokeStyle = '#1d2747';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(ex, -3, 8, 1.15 * Math.PI, 1.85 * Math.PI);
        ctx.stroke();
      } else if (blink || o.sleep) {
        ctx.strokeStyle = '#1d2747';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ex, -6, 8, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
      } else {
        const er = wow ? 1.12 : 1;
        ctx.fillStyle = '#fff';
        SA.ellipse(ctx, ex, -7, 11 * er, 13 * er); ctx.fill();
        ctx.strokeStyle = 'rgba(29,39,71,0.15)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        const px = ex + look[0] * 3, py = -5 + look[1] * 3;
        const ig = ctx.createRadialGradient(px, py + 2, 1, px, py, 7.5);
        ig.addColorStop(0, '#3b5aa8');
        ig.addColorStop(0.55, '#1d2747');
        ig.addColorStop(1, '#141b36');
        ctx.fillStyle = ig;
        SA.circle(ctx, px, py, wow ? 6 : 7); ctx.fill();
        ctx.fillStyle = '#fff';
        SA.circle(ctx, px + 2.5, py - 3, 2.8); ctx.fill();
        SA.circle(ctx, px - 2.2, py + 2.6, 1.2); ctx.fill();
      }
    }

    // Mouth.
    ctx.strokeStyle = '#1d2747';
    ctx.fillStyle = '#7a2440';
    ctx.lineWidth = 3;
    if (o.talk) {
      const open = 3 + Math.abs(Math.sin(t * 16)) * 5;
      SA.ellipse(ctx, 0, 13, 6.5, open); ctx.fill();
      ctx.fillStyle = '#ff7f9c';
      SA.ellipse(ctx, 0, 13 + open * 0.55, 4, Math.max(0.5, open * 0.35)); ctx.fill();
    } else if (wow) {
      SA.ellipse(ctx, 0, 14, 5, 6); ctx.fill();
    } else if (joy) {
      // Big open grin.
      ctx.beginPath();
      ctx.moveTo(-10, 8);
      ctx.quadraticCurveTo(0, 26, 10, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ff7f9c';
      SA.ellipse(ctx, 0, 16, 4.5, 2.6); ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, 9, 8, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }
    // Family looks: Dot's bow, Grandma's round glasses, Dad's bushy moustache.
    if (o.bow) {
      ctx.fillStyle = o.bow; ctx.strokeStyle = SA.shade(o.bow, -70); ctx.lineWidth = 2;
      for (const side of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(-20, -32); ctx.quadraticCurveTo(-20 + side * 16, -50, -20 + side * 18, -30); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      SA.circle(ctx, -20, -34, 5); ctx.fill(); ctx.stroke();
    }
    if (o.glasses) {
      ctx.strokeStyle = '#6b3fa0'; ctx.lineWidth = 2.5;
      ctx.fillStyle = 'rgba(220,240,255,0.25)';
      for (const ex of [-15, 15]) { SA.circle(ctx, ex, -6, 12.5); ctx.fill(); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(-3, -7); ctx.quadraticCurveTo(0, -10, 3, -7); ctx.stroke();
    }
    if (o.tache) {
      ctx.fillStyle = o.tache;
      for (const side of [-1, 1]) { SA.ellipse(ctx, side * 7, 5, 8, 4, side * 0.25); ctx.fill(); }
    }
    if (hat !== 'none') drawHat(ctx, hat, t);
    ctx.restore();
  };

  // ---------- Rocket ----------
  // The rocket the child built in the Rocket Workshop ({ n nose, t tank, e engines, f fins }, each
  // 0-2), or null for Cosmo's classic rocket. Once one is built it flies everywhere, unless a
  // grown-up or child picks "Classic" in the Wardrobe.
  SA.myRocket = () => {
    const st = SA.state;
    return st && st.rocketShape !== 'classic' && st.rocketBuild ? st.rocketBuild : null;
  };

  // Points up at angle 0. Base size about 50 x 120 at s = 1.
  // o: { flame (0-1), t, pilot, paint, shape: 'classic' (ignore the built rocket) or a build }
  SA.drawRocket = function (ctx, x, y, s, ang, o) {
    o = o || {};
    const t = o.t || 0;
    const pid = o.paint || (SA.state && SA.state.paint) || 'classic';
    const P = (SA.PAINTS && SA.PAINTS.find(p => p.id === pid)) || { body: '#ffffff', trim: '#ff5d6c', band: '#ffd84d' };
    const B = o.shape === 'classic' ? null : (o.shape && typeof o.shape === 'object' ? o.shape : SA.myRocket());
    // Shape: how far the nose reaches (bigger tank = longer rocket), nose style, engines, fin size.
    const ext = B ? [-6, 2, 12][B.t] : 0, tip = -62 - ext;
    const nose = B ? B.n : 1, eng = B ? B.e + 1 : 1, fin = B ? [0, 0.68, 1.05][B.f] : 1;
    const rainbow = (y0, y1) => {
      const g = ctx.createLinearGradient(-30, y0, 30, y1);
      ['#ff5d6c', '#ff9f1c', '#ffd84d', '#7ee08a', '#4fa3f0', '#8f5bff'].forEach((c, i) => g.addColorStop(i / 5, c));
      return g;
    };
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang || 0);
    ctx.scale(s, s);

    if (o.flame > 0) {
      // One flame per engine (a single big one for the classic rocket).
      const fw = eng === 1 ? 15 : eng === 2 ? 10 : 8;
      for (let i = 0; i < eng; i++) {
        const nx = (i - (eng - 1) / 2) * (eng === 2 ? 12 : 11);
        const len = (26 + o.flame * 40 + Math.sin(t * 40 + i * 2) * 6) * (eng === 1 ? 1 : 0.85);
        const fg = ctx.createLinearGradient(0, 40, 0, 40 + len);
        fg.addColorStop(0, '#fff6c2');
        fg.addColorStop(0.4, '#ffb340');
        fg.addColorStop(1, 'rgba(255,80,40,0)');
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.moveTo(nx - fw, 40);
        ctx.quadraticCurveTo(nx - fw * 0.8, 40 + len * 0.6, nx, 40 + len);
        ctx.quadraticCurveTo(nx + fw * 0.8, 40 + len * 0.6, nx + fw, 40);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(235,245,255,0.9)';
        ctx.beginPath();
        ctx.moveTo(nx - fw * 0.4, 42);
        ctx.quadraticCurveTo(nx, 42 + len * 0.55, nx + fw * 0.4, 42);
        ctx.closePath();
        ctx.fill();
      }
      // A warm glow around the exhaust.
      const glow = ctx.createRadialGradient(0, 48, 2, 0, 48, 30 + o.flame * 20);
      glow.addColorStop(0, 'rgba(255,220,140,0.45)');
      glow.addColorStop(1, 'rgba(255,140,60,0)');
      ctx.fillStyle = glow;
      SA.circle(ctx, 0, 48, 30 + o.flame * 20);
      ctx.fill();
    }

    // Fins (none, small or big on a built rocket).
    if (fin > 0) {
      ctx.fillStyle = P.trim;
      ctx.strokeStyle = SA.shade(P.trim, -80);
      ctx.lineWidth = 2.5;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(side * 18, 38 - 38 * fin);
        ctx.quadraticCurveTo(side * (18 + 22 * fin), 38 - 20 * fin, side * (18 + 20 * fin), 38 + 8 * fin);
        ctx.lineTo(side * 16, 34);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
      }
    }
    // Nozzles.
    ctx.fillStyle = '#6b7493';
    if (eng === 1) { SA.rrect(ctx, -13, 34, 26, 10, 3); ctx.fill(); }
    else for (let i = 0; i < eng; i++) { SA.rrect(ctx, (i - (eng - 1) / 2) * (eng === 2 ? 12 : 11) - 5.5, 34, 11, 10, 3); ctx.fill(); }

    // Body: flat, round or pointy nose.
    ctx.beginPath();
    if (nose === 0) {
      ctx.moveTo(-12, tip + 10);
      ctx.lineTo(12, tip + 10);
      ctx.bezierCurveTo(26, tip + 30, 26, 10, 20, 38);
      ctx.lineTo(-20, 38);
      ctx.bezierCurveTo(-26, 10, -26, tip + 30, -12, tip + 10);
    } else if (nose === 2) {
      ctx.moveTo(0, tip - 8);
      ctx.bezierCurveTo(18, tip + 20, 26, 10, 20, 38);
      ctx.lineTo(-20, 38);
      ctx.bezierCurveTo(-26, 10, -18, tip + 20, 0, tip - 8);
    } else {
      ctx.moveTo(0, tip);
      ctx.bezierCurveTo(30, tip + 22, 26, 10, 20, 38);
      ctx.lineTo(-20, 38);
      ctx.bezierCurveTo(-26, 10, -30, tip + 22, 0, tip);
    }
    ctx.closePath();
    const bg = ctx.createLinearGradient(-24, 0, 24, 0);
    bg.addColorStop(0, '#ffffff');
    bg.addColorStop(0.7, SA.shade(P.body, -14));
    bg.addColorStop(1, SA.shade(P.body, -62));
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.strokeStyle = '#4b5578';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Nose cap and stripe.
    ctx.save();
    ctx.clip();
    ctx.fillStyle = P.band === 'rainbow' ? rainbow(tip - 8, tip + 18) : P.trim;
    ctx.fillRect(-40, tip - 10, 80, 28);
    ctx.fillStyle = P.band === 'rainbow' ? rainbow(22, 28) : P.band;
    ctx.fillRect(-40, 22, 80, P.band === 'rainbow' ? 10 : 6);
    // Glossy highlight down the left side and two rivet dots.
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.moveTo(-12, -40);
    ctx.quadraticCurveTo(-20, -6, -15, 30);
    ctx.lineTo(-10, 30);
    ctx.quadraticCurveTo(-14, -6, -8, -42);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(75,85,120,0.35)';
    SA.circle(ctx, -10, 10, 1.8); ctx.fill();
    SA.circle(ctx, 10, 10, 1.8); ctx.fill();
    ctx.restore();

    // Window with Cosmo peeking out (a little higher on a long rocket).
    const wy = -14 - Math.max(0, ext) * 0.4;
    ctx.fillStyle = '#9fb2d9';
    SA.circle(ctx, 0, wy, 16); ctx.fill();
    ctx.fillStyle = '#16204a';
    SA.circle(ctx, 0, wy, 12.5); ctx.fill();
    if (o.pilot !== false) {
      ctx.save();
      SA.circle(ctx, 0, wy, 12.5);
      ctx.clip();
      SA.drawCosmo(ctx, 0, wy + 6, 0.27, { t, noBob: true, hat: 'none' });
      ctx.restore();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    SA.ellipse(ctx, -5, wy - 6, 4, 2.5, -0.6); ctx.fill();
    ctx.restore();
  };

  // ---------- Planets ----------
  // Rim-light colour and atmosphere glow per body (the glow sits behind the ball).
  const RIM = {
    mercury: '#fff2e0', venus: '#fff0c8', earth: '#bfe6ff', mars: '#ffd2b8', jupiter: '#fff1dc',
    saturn: '#fff6dc', uranus: '#e2fdff', neptune: '#a9c6ff', moon: '#ffffff', pluto: '#fff1e6', europa: '#ffffff', titan: '#ffe2b0',
  };
  const AIR = {
    earth: ['#7cc4ff', 1.22, 0.5], venus: ['#ffe2a0', 1.22, 0.45], mars: ['#ff9f7a', 1.1, 0.28],
    jupiter: ['#ffd9a8', 1.1, 0.22], saturn: ['#ffe9b8', 1.1, 0.2], uranus: ['#a8f0f2', 1.18, 0.45],
    neptune: ['#5b8cff', 1.18, 0.5], pluto: ['#e8d8ff', 1.08, 0.18], titan: ['#ffb45a', 1.24, 0.55],
  };

  // Lit-sphere shading from a light direction (lx, ly in -1..1): a soft terminator into the
  // night side, darker edges (limb darkening), a bright rim on the sunny edge and a soft gloss.
  function sphereShade(ctx, x, y, r, lx, ly, dark, rim) {
    const ll = Math.hypot(lx, ly) || 1;
    const ux = lx / ll, uy = ly / ll;
    ctx.save();
    SA.circle(ctx, x, y, r);
    ctx.clip();
    // Night side.
    const g = ctx.createRadialGradient(x + lx * r * 0.45, y + ly * r * 0.45, r * 0.05, x - lx * r * 0.15, y - ly * r * 0.15, r * 1.2);
    g.addColorStop(0, 'rgba(255,255,255,0.2)');
    g.addColorStop(0.4, 'rgba(255,255,255,0)');
    g.addColorStop(0.72, 'rgba(6,8,32,0.28)');
    g.addColorStop(1, 'rgba(6,8,32,' + (dark == null ? 0.72 : dark) + ')');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    // Limb darkening.
    const limb = ctx.createRadialGradient(x, y, r * 0.62, x, y, r);
    limb.addColorStop(0, 'rgba(10,12,40,0)');
    limb.addColorStop(1, 'rgba(10,12,40,0.28)');
    ctx.fillStyle = limb;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    // Rim light: a gradient centred away from the light only reaches the sunny edge.
    if (rim) {
      const d = r * 0.14;
      const rg = ctx.createRadialGradient(x - ux * d, y - uy * d, r * 0.9, x - ux * d, y - uy * d, r + d);
      rg.addColorStop(0, SA.rgba(rim, 0));
      rg.addColorStop(0.75, SA.rgba(rim, 0.12));
      rg.addColorStop(1, SA.rgba(rim, 0.6));
      ctx.fillStyle = rg;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // Gloss.
    const hx = x + ux * r * 0.42, hy = y + uy * r * 0.42;
    const hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, r * 0.42);
    hg.addColorStop(0, 'rgba(255,255,255,0.22)');
    hg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hg;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
  }

  function atmosphere(ctx, x, y, r, color, size, alpha) {
    const g = ctx.createRadialGradient(x, y, r * 0.9, x, y, r * (size || 1.25));
    g.addColorStop(0, SA.rgba(color, alpha == null ? 0.45 : alpha));
    g.addColorStop(0.45, SA.rgba(color, (alpha == null ? 0.45 : alpha) * 0.35));
    g.addColorStop(1, SA.rgba(color, 0));
    ctx.fillStyle = g;
    SA.circle(ctx, x, y, r * (size || 1.25));
    ctx.fill();
  }

  // Thin wavy streaks inside the bands of the giant planets.
  function streaks(ctx, x, y, r, seed, color, n, t) {
    const rnd = SA.seeded(seed);
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const sy = y + (rnd() * 2 - 1) * r * 0.9;
      const len = r * (0.4 + rnd() * 0.9);
      let sx = x - r + ((rnd() * r * 2 + t * r * 0.04 * (0.5 + rnd())) % (r * 2.6)) - r * 0.3;
      ctx.lineWidth = Math.max(0.6, r * (0.012 + rnd() * 0.02));
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(sx + len * 0.5, sy + r * 0.03 * (rnd() - 0.5) * 4, sx + len, sy);
      ctx.stroke();
    }
  }

  // Fine speckles that make rocky surfaces look less flat.
  function speckle(ctx, x, y, r, seed, color, n) {
    const rnd = SA.seeded(seed);
    ctx.fillStyle = color;
    for (let i = 0; i < n; i++) {
      const a = rnd() * TAU, d = Math.sqrt(rnd()) * r;
      SA.circle(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, Math.max(0.5, r * (0.01 + rnd() * 0.025)));
      ctx.fill();
    }
  }

  function bands(ctx, x, y, r, colors, t, wobble) {
    const h = (r * 2) / colors.length;
    for (let i = 0; i < colors.length; i++) {
      ctx.fillStyle = colors[i];
      ctx.beginPath();
      const y0 = y - r + i * h;
      ctx.moveTo(x - r, y0);
      for (let k = 0; k <= 12; k++) {
        const px = x - r + (k / 12) * r * 2;
        ctx.lineTo(px, y0 + Math.sin(k * 1.3 + i * 2 + t * 0.6) * (wobble || 0));
      }
      ctx.lineTo(x + r, y0 + h + 2);
      ctx.lineTo(x - r, y0 + h + 2);
      ctx.closePath();
      ctx.fill();
    }
  }

  function craters(ctx, x, y, r, seed, color, n) {
    const rnd = SA.seeded(seed);
    for (let i = 0; i < n; i++) {
      const a = rnd() * TAU, d = Math.sqrt(rnd()) * r * 0.85, cr = r * (0.06 + rnd() * 0.14);
      const cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d;
      // Bright rim, dark bowl, lighter floor: reads as a dent at any size.
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      SA.circle(ctx, cx + cr * 0.12, cy + cr * 0.12, cr * 1.08); ctx.fill();
      ctx.fillStyle = color;
      SA.circle(ctx, cx, cy, cr); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      SA.circle(ctx, cx + cr * 0.2, cy + cr * 0.2, cr * 0.6); ctx.fill();
    }
  }

  function blobs(ctx, x, y, r, seed, color, n, size, drift) {
    const rnd = SA.seeded(seed);
    ctx.fillStyle = color;
    for (let i = 0; i < n; i++) {
      let bx = x + (rnd() * 2 - 1) * r + (drift || 0);
      bx = x - r + ((((bx - (x - r)) % (r * 2)) + r * 2) % (r * 2));
      const by = y + (rnd() * 2 - 1) * r * 0.8;
      SA.ellipse(ctx, bx, by, r * size * (0.6 + rnd() * 0.8), r * size * (0.35 + rnd() * 0.5), rnd() * 3);
      ctx.fill();
    }
  }

  // Saturn's rings, inside to outside: faint C ring, bright B ring, the dark Cassini Division,
  // the A ring with its Encke gap, and the thin F ring.
  const RINGS = [
    [1.28, 0.1, 'rgba(170,150,120,0.35)'], [1.38, 0.1, 'rgba(190,168,130,0.5)'],
    [1.5, 0.14, 'rgba(240,222,180,0.95)'], [1.63, 0.13, 'rgba(226,202,152,0.95)'], [1.73, 0.08, 'rgba(246,232,196,0.9)'],
    [1.8, 0.05, 'rgba(40,30,30,0.25)'],
    [1.88, 0.1, 'rgba(214,190,144,0.8)'], [1.96, 0.02, 'rgba(60,45,40,0.2)'], [2.02, 0.08, 'rgba(206,182,140,0.7)'],
    [2.14, 0.02, 'rgba(235,225,205,0.55)'],
  ];
  function saturnRings(ctx, x, y, r, half) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.32);
    for (const [rr, w, c] of RINGS) {
      ctx.strokeStyle = c;
      ctx.lineWidth = Math.max(0.6, r * w);
      ctx.beginPath();
      if (half === 'back') ctx.ellipse(0, 0, r * rr * 0.92, r * rr * 0.28, 0, Math.PI, TAU);
      else ctx.ellipse(0, 0, r * rr * 0.92, r * rr * 0.28, 0, 0, Math.PI);
      ctx.stroke();
    }
    ctx.restore();
  }

  // o: { t, lx, ly, glow }
  SA.drawBody = function (ctx, id, x, y, r, o) {
    o = o || {};
    const t = o.t || 0;
    const lx = o.lx == null ? -0.8 : o.lx, ly = o.ly == null ? -0.3 : o.ly;

    if (id === 'sun') { drawSun(ctx, x, y, r, t, o.halo); return; }
    if (id === 'belt') { drawBeltArt(ctx, x, y, r, t); return; }
    if (id === 'comet') {
      // Card art: a little icy nucleus low on the left, its two tails sweeping up and right.
      SA.drawComet(ctx, x - r * 0.5, y + r * 0.35, r * 0.2, { ang: -0.6, tail: 0.8, t, bend: -1, len: 0.27 });
      return;
    }
    if (id === 'iss') { SA.drawStation(ctx, x, y, r * 1.1, { t, ang: -0.35 }); return; }
    if (id === 'galaxy') { SA.drawGalaxy(ctx, x, y, r * 1.2, { t, tilt: 0.62, rot: -0.35 + t * 0.02 }); return; }
    const big = r > 18;   // fine detail only where it can be seen
    if (AIR[id]) atmosphere(ctx, x, y, r, AIR[id][0], AIR[id][1], AIR[id][2]);
    if (id === 'saturn') saturnRings(ctx, x, y, r, 'back');
    if (id === 'uranus') uranusRing(ctx, x, y, r, false);

    ctx.save();
    SA.circle(ctx, x, y, r);
    ctx.clip();
    switch (id) {
      case 'mercury':
        ctx.fillStyle = '#a3a0a0'; ctx.fillRect(x - r, y - r, r * 2, r * 2);
        blobs(ctx, x, y, r, 4, 'rgba(120,112,108,0.35)', 4, 0.35, 0);
        if (big) speckle(ctx, x, y, r, 5, 'rgba(70,64,64,0.25)', 40);
        craters(ctx, x, y, r, 3, '#7e7b7c', big ? 14 : 9);
        break;
      case 'venus':
        ctx.fillStyle = '#e6bf73'; ctx.fillRect(x - r, y - r, r * 2, r * 2);
        bands(ctx, x, y, r, ['#efcf8c', '#e2b765', '#f3dba2', '#d9aa58', '#efcf8c', '#e6bf73'], t * 0.3, r * 0.08);
        blobs(ctx, x, y, r, 8, 'rgba(255,240,200,0.35)', 6, 0.35, t * 2);
        // Venus's sideways "Y" of swirling cloud.
        ctx.strokeStyle = 'rgba(190,140,70,0.35)';
        ctx.lineWidth = r * 0.09;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x + r * 0.9, y); ctx.quadraticCurveTo(x, y + r * 0.05, x - r * 0.6, y - r * 0.5);
        ctx.moveTo(x + r * 0.05, y + r * 0.02); ctx.quadraticCurveTo(x - r * 0.3, y + r * 0.3, x - r * 0.7, y + r * 0.45);
        ctx.stroke();
        if (big) streaks(ctx, x, y, r, 9, 'rgba(255,248,225,0.35)', 10, t * 2);
        break;
      case 'earth': {
        const og = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
        og.addColorStop(0, '#3d94ea');
        og.addColorStop(1, '#1f5fb8');
        ctx.fillStyle = og; ctx.fillRect(x - r, y - r, r * 2, r * 2);
        // Shallow sea around the land, then land with darker forests and sandy deserts.
        blobs(ctx, x, y, r, 21, 'rgba(110,200,230,0.5)', 5, 0.46, t * 3);
        blobs(ctx, x, y, r, 21, '#5cbf5a', 5, 0.4, t * 3);
        blobs(ctx, x, y, r, 22, '#3f9e48', 3, 0.22, t * 3);
        if (big) blobs(ctx, x, y, r, 24, 'rgba(226,196,120,0.75)', 3, 0.12, t * 3);
        ctx.fillStyle = '#f4fbff';
        SA.ellipse(ctx, x, y - r, r * 0.7, r * 0.18); ctx.fill();
        SA.ellipse(ctx, x, y + r, r * 0.6, r * 0.16); ctx.fill();
        blobs(ctx, x, y, r, 23, 'rgba(255,255,255,0.65)', 5, 0.25, t * 6);
        if (big) blobs(ctx, x, y, r, 25, 'rgba(255,255,255,0.4)', 6, 0.12, t * 7);
        break;
      }
      case 'mars':
        ctx.fillStyle = '#d0603a'; ctx.fillRect(x - r, y - r, r * 2, r * 2);
        blobs(ctx, x, y, r, 31, '#a8472b', 5, 0.3, t * 2);
        blobs(ctx, x, y, r, 32, '#e58a5c', 4, 0.22, t * 2);
        if (big) {
          speckle(ctx, x, y, r, 33, 'rgba(120,40,20,0.3)', 40);
          // Valles Marineris, the giant canyon.
          ctx.strokeStyle = 'rgba(110,36,20,0.5)';
          ctx.lineWidth = r * 0.04;
          ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(x - r * 0.6, y + r * 0.12); ctx.quadraticCurveTo(x - r * 0.15, y - r * 0.02, x + r * 0.3, y - r * 0.3); ctx.stroke();
          ctx.lineWidth = r * 0.025;
          ctx.beginPath(); ctx.moveTo(x - r * 0.2, y + r * 0.02); ctx.lineTo(x - r * 0.12, y + r * 0.14); ctx.stroke();
        }
        ctx.fillStyle = '#fff6f0';
        SA.ellipse(ctx, x, y - r * 0.98, r * 0.45, r * 0.16); ctx.fill();
        SA.ellipse(ctx, x, y + r * 0.99, r * 0.3, r * 0.1); ctx.fill();
        break;
      case 'jupiter':
        ctx.fillStyle = '#d6a676'; ctx.fillRect(x - r, y - r, r * 2, r * 2);
        bands(ctx, x, y, r, ['#ead7b8', '#c6955f', '#f2e4ca', '#b67c52', '#ecd5ac', '#c48d5d', '#f0e0c4', '#a9714b', '#e5cfa8', '#c99a68'], t, r * 0.03);
        if (big) {
          streaks(ctx, x, y, r, 41, 'rgba(255,245,225,0.35)', 16, t);
          streaks(ctx, x, y, r, 42, 'rgba(140,80,45,0.25)', 12, t * 1.3);
          // Little white storms.
          ctx.fillStyle = 'rgba(255,250,240,0.8)';
          for (const [ox, oy, s] of [[-0.45, 0.48, 0.07], [-0.2, 0.5, 0.05], [0.05, 0.52, 0.06], [-0.3, -0.42, 0.05]]) {
            SA.ellipse(ctx, x + ox * r, y + oy * r, r * s * 1.5, r * s * 0.8); ctx.fill();
          }
        }
        // The Great Red Spot with its pale collar.
        ctx.fillStyle = 'rgba(245,225,200,0.8)';
        SA.ellipse(ctx, x + r * 0.28, y + r * 0.3, r * 0.31, r * 0.18); ctx.fill();
        ctx.fillStyle = '#c4553c';
        SA.ellipse(ctx, x + r * 0.28, y + r * 0.3, r * 0.26, r * 0.14); ctx.fill();
        ctx.fillStyle = '#a8402c';
        SA.ellipse(ctx, x + r * 0.3, y + r * 0.31, r * 0.16, r * 0.08); ctx.fill();
        ctx.fillStyle = 'rgba(255,200,170,0.5)';
        SA.ellipse(ctx, x + r * 0.25, y + r * 0.27, r * 0.12, r * 0.06); ctx.fill();
        break;
      case 'saturn':
        ctx.fillStyle = '#e8cf95'; ctx.fillRect(x - r, y - r, r * 2, r * 2);
        bands(ctx, x, y, r, ['#f2e0b4', '#e2c487', '#f5e7c6', '#d8b574', '#efdaa6', '#e2c487', '#f2e0b4'], t, r * 0.02);
        if (big) streaks(ctx, x, y, r, 51, 'rgba(255,250,235,0.3)', 10, t);
        // The blue-ish north pole and the shadow the rings cast on the ball.
        ctx.fillStyle = 'rgba(160,180,200,0.28)';
        SA.ellipse(ctx, x - r * 0.15, y - r * 0.95, r * 0.6, r * 0.25, -0.32); ctx.fill();
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-0.32);
        ctx.fillStyle = 'rgba(70,50,30,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, r * 0.08, r * 1.3, r * 0.3, 0, 0, Math.PI);
        ctx.ellipse(0, r * 0.02, r * 1.3, r * 0.22, 0, Math.PI, 0, true);
        ctx.fill();
        ctx.restore();
        break;
      case 'uranus':
        ctx.fillStyle = '#8fdde3'; ctx.fillRect(x - r, y - r, r * 2, r * 2);
        // Uranus is tipped on its side, so its faint bands run up and down, parallel to the
        // (nearly upright) rings, and the pole tipped toward us shows as a soft bright cap.
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.PI / 2 + 0.12);
        bands(ctx, 0, 0, r, ['#a6e8ec', '#8fdde3', '#9fe4e8', '#86d4dc', '#8fdde3'], t, 0);
        ctx.restore();
        {
          const pg = ctx.createRadialGradient(x - r * 0.3, y - r * 0.15, 0, x - r * 0.3, y - r * 0.15, r * 0.6);
          pg.addColorStop(0, 'rgba(235,255,255,0.5)');
          pg.addColorStop(1, 'rgba(235,255,255,0)');
          ctx.fillStyle = pg; ctx.fillRect(x - r, y - r, r * 2, r * 2);
        }
        break;
      case 'moon':
        ctx.fillStyle = '#cfcfd8'; ctx.fillRect(x - r, y - r, r * 2, r * 2);
        blobs(ctx, x, y, r, 81, 'rgba(120,120,140,0.55)', 4, 0.3, 0);
        if (big) speckle(ctx, x, y, r, 83, 'rgba(90,90,110,0.25)', 30);
        craters(ctx, x, y, r, 82, 'rgba(150,150,165,0.8)', big ? 9 : 6);
        break;
      case 'europa': {
        // Creamy ice criss-crossed by long reddish-brown cracks, with darker "chaos" patches.
        ctx.fillStyle = '#efe6d6'; ctx.fillRect(x - r, y - r, r * 2, r * 2);
        blobs(ctx, x, y, r, 91, 'rgba(190,150,110,0.4)', 5, 0.3, 0);
        if (big) speckle(ctx, x, y, r, 92, 'rgba(160,110,80,0.25)', 30);
        const rnd = SA.seeded(93);
        ctx.strokeStyle = 'rgba(150,75,45,0.6)';
        ctx.lineCap = 'round';
        for (let i = 0; i < (big ? 11 : 6); i++) {
          const a = rnd() * TAU, cx0 = x + (rnd() - 0.5) * r, cy0 = y + (rnd() - 0.5) * r, len = r * (0.9 + rnd() * 0.9);
          ctx.lineWidth = Math.max(0.6, r * (0.015 + rnd() * 0.025));
          ctx.beginPath();
          ctx.moveTo(cx0 - Math.cos(a) * len / 2, cy0 - Math.sin(a) * len / 2);
          ctx.quadraticCurveTo(cx0 + Math.sin(a) * r * 0.25 * (rnd() - 0.5), cy0 - Math.cos(a) * r * 0.25 * (rnd() - 0.5), cx0 + Math.cos(a) * len / 2, cy0 + Math.sin(a) * len / 2);
          ctx.stroke();
        }
        break;
      }
      case 'titan': {
        // Smooth orange haze hides the ground, with soft bands and a darker hood over the north pole.
        ctx.fillStyle = '#e39a48'; ctx.fillRect(x - r, y - r, r * 2, r * 2);
        bands(ctx, x, y, r, ['#efb86a', '#e39a48', '#eaa95a', '#d98c3e', '#e6a253'], t * 0.2, 0);
        ctx.fillStyle = 'rgba(150,80,30,0.32)';
        SA.ellipse(ctx, x, y - r * 0.92, r * 0.85, r * 0.3); ctx.fill();
        if (big) blobs(ctx, x, y, r, 101, 'rgba(255,225,170,0.22)', 4, 0.3, t);
        break;
      }
      case 'pluto':
        ctx.fillStyle = '#d9b49a'; ctx.fillRect(x - r, y - r, r * 2, r * 2);
        blobs(ctx, x, y, r, 61, '#a5684a', 4, 0.3, 0);
        // The big icy heart (Tombaugh Regio).
        ctx.fillStyle = '#fbf3ea';
        SA.heart(ctx, x + r * 0.15, y + r * 0.2, r * 0.42);
        ctx.fill();
        break;
      case 'neptune':
        ctx.fillStyle = '#4170e0'; ctx.fillRect(x - r, y - r, r * 2, r * 2);
        bands(ctx, x, y, r, ['#4a7cec', '#3f6ad8', '#4a7cec', '#3863cc', '#4677e6'], t, r * 0.04);
        if (big) streaks(ctx, x, y, r, 71, 'rgba(255,255,255,0.4)', 7, t * 3);
        ctx.fillStyle = '#28469e';
        SA.ellipse(ctx, x - r * 0.2, y + r * 0.15, r * 0.22, r * 0.12); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        SA.ellipse(ctx, x - r * 0.05, y + r * 0.02, r * 0.18, r * 0.04); ctx.fill();
        break;
    }
    ctx.restore();
    sphereShade(ctx, x, y, r, lx, ly, o.dark, RIM[id]);

    if (id === 'saturn') saturnRings(ctx, x, y, r, 'front');
    if (id === 'uranus') uranusRing(ctx, x, y, r, true);
    if (id === 'titan') {
      // Titan's thin bluish layer of haze, high above the orange (seen at its edge).
      ctx.strokeStyle = 'rgba(150,190,255,0.45)';
      ctx.lineWidth = Math.max(1, r * 0.05);
      SA.circle(ctx, x, y, r * 1.06); ctx.stroke();
    }
  };

  // Uranus's thin, nearly upright rings: the far (left) arc passes behind the planet and the
  // near (right) arc in front, matching the pole tipped toward us on the left.
  function uranusRing(ctx, x, y, r, front) {
    ctx.strokeStyle = 'rgba(200,245,250,0.4)';
    ctx.lineWidth = Math.max(1, r * 0.05);
    ctx.beginPath();
    if (front) ctx.ellipse(x, y, r * 0.35, r * 1.6, 0.12, -Math.PI / 2, Math.PI / 2);
    else ctx.ellipse(x, y, r * 0.35, r * 1.6, 0.12, Math.PI / 2, Math.PI * 1.5);
    ctx.stroke();
  }

  // halo: how far the outer glow reaches (x r); smaller for the little card canvases.
  function drawSun(ctx, x, y, r, t, haloK) {
    const hk = haloK || 2.1;
    const halo = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * hk);
    halo.addColorStop(0, 'rgba(255,200,80,0.55)');
    halo.addColorStop(0.5, 'rgba(255,140,40,0.15)');
    halo.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = halo;
    SA.circle(ctx, x, y, r * hk);
    ctx.fill();

    // Slowly turning rays.
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t * 0.08);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(255,170,60,0.1)';
    for (let i = 0; i < 14; i++) {
      ctx.rotate(TAU / 14);
      ctx.beginPath();
      ctx.moveTo(-r * 0.07, r * 0.97);
      ctx.lineTo(0, r * (1.28 + 0.06 * Math.sin(t * 2 + i)));
      ctx.lineTo(r * 0.07, r * 0.97);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Soft corona that breathes slowly.
    const cor = ctx.createRadialGradient(x, y, r * 0.95, x, y, r * (1.18 + 0.03 * Math.sin(t * 1.3)));
    cor.addColorStop(0, 'rgba(255,240,170,0.75)');
    cor.addColorStop(1, 'rgba(255,190,80,0)');
    ctx.fillStyle = cor;
    SA.circle(ctx, x, y, r * 1.22);
    ctx.fill();

    const g = ctx.createRadialGradient(x - r * 0.2, y - r * 0.2, r * 0.1, x, y, r);
    g.addColorStop(0, '#fffbe0');
    g.addColorStop(0.45, '#ffd84a');
    g.addColorStop(0.85, '#ffa22e');
    g.addColorStop(1, '#ff7a1f');
    ctx.fillStyle = g;
    SA.circle(ctx, x, y, r);
    ctx.fill();

    // Bubbling surface: big churning cells plus a few dark sunspots.
    ctx.save();
    SA.circle(ctx, x, y, r);
    ctx.clip();
    const rnd = SA.seeded(99);
    for (let i = 0; i < 30; i++) {
      const a = rnd() * TAU + t * 0.01, d = Math.sqrt(rnd()) * r;
      const pulse = 0.5 + 0.5 * Math.sin(t * (0.8 + rnd()) + i);
      ctx.fillStyle = i % 3 ? 'rgba(255,170,40,' + (0.12 + pulse * 0.18) + ')' : 'rgba(255,250,210,' + (0.1 + pulse * 0.15) + ')';
      SA.circle(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, r * (0.05 + rnd() * 0.1) * (0.9 + pulse * 0.2));
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(170,70,20,0.4)';
    for (const [dx, dy, s] of [[0.25, -0.35, 0.035], [0.31, -0.3, 0.022], [-0.15, 0.4, 0.03]]) {
      SA.circle(ctx, x + dx * r, y + dy * r, r * s); ctx.fill();
    }
    // Hot bright edge.
    const edge = ctx.createRadialGradient(x, y, r * 0.8, x, y, r);
    edge.addColorStop(0, 'rgba(255,120,30,0)');
    edge.addColorStop(1, 'rgba(255,110,30,0.45)');
    ctx.fillStyle = edge;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
  }

  // The Moon as seen from Earth at phase p (0 new, 0.25 first quarter, 0.5 full, 0.75 last quarter).
  SA.drawMoonPhase = function (ctx, x, y, r, p) {
    p = ((p % 1) + 1) % 1;
    const LIT = '#f4f1e2', DARK = '#262a45';
    ctx.save();
    SA.circle(ctx, x, y, r);
    ctx.fillStyle = DARK;
    ctx.fill();
    ctx.clip();
    // Waxing: the right side is lit. Waning: the left side is lit.
    ctx.fillStyle = LIT;
    ctx.beginPath();
    if (p < 0.5) ctx.arc(x, y, r, -Math.PI / 2, Math.PI / 2);
    else ctx.arc(x, y, r, Math.PI / 2, Math.PI * 1.5);
    ctx.closePath();
    ctx.fill();
    // The terminator is an ellipse: dark when less than half is lit, light when more than half.
    const k = Math.cos(p * TAU);
    ctx.fillStyle = k > 0 ? DARK : LIT;
    SA.ellipse(ctx, x, y, Math.abs(k) * r + 0.5, r + 1);
    ctx.fill();
    // Grey "seas" so it looks like our Moon.
    ctx.fillStyle = 'rgba(110,110,130,0.28)';
    for (const [dx, dy, s] of [[-0.25, -0.25, 0.22], [0.2, -0.1, 0.18], [0.05, 0.3, 0.2], [-0.35, 0.15, 0.12]]) {
      SA.circle(ctx, x + dx * r, y + dy * r, s * r); ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    SA.circle(ctx, x, y, r); ctx.stroke();
  };

  // ---------- Asteroids ----------
  // Rock colours by kind: dark carbon-rich (most common), stony, shiny metal, and the big
  // named ones. Each: [light, mid, dark, crater].
  const ROCK = {
    dark: ['#6b5f58', '#4a403b', '#2a2320', 'rgba(20,14,12,0.45)'],
    stony: ['#d8c6a8', '#ab9478', '#6f5c48', 'rgba(90,70,50,0.4)'],
    metal: ['#f2f6ff', '#a9b4c8', '#5d6680', 'rgba(60,70,95,0.35)'],
    ceres: ['#cfc8c0', '#99918a', '#5d5650', 'rgba(70,64,60,0.4)'],
    vesta: ['#d9c9b3', '#a8957c', '#6a5a48', 'rgba(90,72,55,0.4)'],
  };
  // A lumpy space rock. o: { seed, kind, rot, lumps (0-1) }
  SA.drawRock = function (ctx, x, y, r, o) {
    o = o || {};
    const rnd = SA.seeded(o.seed || 1);
    const C = ROCK[o.kind] || ROCK.stony;
    const n = 11, lumps = o.lumps == null ? 0.22 : o.lumps;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + (o.rot || 0);
      const rr = r * (1 - lumps / 2 + rnd() * lumps);
      pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.86]);
    }
    ctx.save();
    SA.blobPath(ctx, pts);
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.1);
    g.addColorStop(0, C[0]);
    g.addColorStop(0.55, C[1]);
    g.addColorStop(1, C[2]);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.clip();
    // Craters: a dark bowl with a bright lower lip.
    const nc = o.kind === 'metal' ? 3 : 5;
    for (let i = 0; i < nc; i++) {
      const a = rnd() * TAU + (o.rot || 0), d = rnd() * r * 0.6, cr = r * (0.1 + rnd() * 0.16);
      const cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * 0.86;
      ctx.fillStyle = C[3];
      SA.circle(ctx, cx, cy, cr); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      SA.ellipse(ctx, cx + cr * 0.15, cy + cr * 0.35, cr * 0.8, cr * 0.4); ctx.fill();
    }
    if (o.kind === 'metal') {
      // A bright metal glint that slides as the rock tumbles.
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = r * 0.12;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(x, y, r * 0.62, Math.PI * 1.05 + (o.rot || 0) * 0.3, Math.PI * 1.4 + (o.rot || 0) * 0.3);
      ctx.stroke();
      ctx.fillStyle = 'rgba(190,220,255,0.25)';
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    if (o.kind === 'ceres') {
      // Ceres's famous bright spots (salty deposits in Occator crater).
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      SA.circle(ctx, x + r * 0.2, y - r * 0.1, r * 0.07); ctx.fill();
      SA.circle(ctx, x + r * 0.3, y - r * 0.05, r * 0.04); ctx.fill();
    }
    // Shadow side away from the light.
    const sh = ctx.createRadialGradient(x - r * 0.5, y - r * 0.5, r * 0.6, x - r * 0.3, y - r * 0.3, r * 1.7);
    sh.addColorStop(0, 'rgba(0,0,0,0)');
    sh.addColorStop(1, 'rgba(5,4,20,0.55)');
    ctx.fillStyle = sh;
    ctx.fillRect(x - r * 1.2, y - r * 1.2, r * 2.4, r * 2.4);
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = Math.max(1, r * 0.04);
    SA.blobPath(ctx, pts);
    ctx.stroke();
  };

  // The asteroid belt as one picture (cards, flight): a sweep of rocks around big Ceres.
  function drawBeltArt(ctx, x, y, r, t) {
    const glow = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 1.3);
    glow.addColorStop(0, 'rgba(230,200,160,0.25)');
    glow.addColorStop(1, 'rgba(230,200,160,0)');
    ctx.fillStyle = glow;
    SA.circle(ctx, x, y, r * 1.3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(230,210,180,0.25)';
    ctx.lineWidth = r * 0.12;
    SA.ellipse(ctx, x, y, r * 1.15, r * 0.4, -0.3);
    ctx.stroke();
    const rocks = [[-0.95, 0.35, 0.13, 'dark'], [0.95, -0.35, 0.12, 'stony'], [-0.6, 0.62, 0.09, 'metal'], [0.62, -0.62, 0.1, 'dark'], [0.75, 0.2, 0.07, 'stony'], [-0.8, -0.15, 0.06, 'stony']];
    rocks.forEach(([dx, dy, s, kind], i) => SA.drawRock(ctx, x + dx * r, y + dy * r, r * s, { seed: 30 + i, kind, rot: t * 0.3 + i }));
    SA.drawRock(ctx, x, y, r * 0.5, { seed: 7, kind: 'ceres', lumps: 0.08 });
  }

  // ---------- Comets ----------
  // One tail as a filled ribbon from the head outwards: it widens and fades, and can curve
  // (bend) to one side, like a dust tail lagging behind along the comet's path.
  function cometTail(ctx, x, y, ang, len, w0, w1, rgb, alpha, bend) {
    const L = [], R = [], n = 14;
    for (let i = 0; i <= n; i++) {
      const u = i / n, a = ang + bend * u * u;
      // Integrate a little along the bending centre line.
      const cx = x + Math.cos(ang) * len * u * (1 - Math.abs(bend) * u * 0.15) + Math.cos(a + Math.PI / 2) * bend * len * u * u * 0.25;
      const cy = y + Math.sin(ang) * len * u * (1 - Math.abs(bend) * u * 0.15) + Math.sin(a + Math.PI / 2) * bend * len * u * u * 0.25;
      const w = SA.lerp(w0, w1, u);
      L.push([cx + Math.cos(a + Math.PI / 2) * w, cy + Math.sin(a + Math.PI / 2) * w]);
      R.push([cx - Math.cos(a + Math.PI / 2) * w, cy - Math.sin(a + Math.PI / 2) * w]);
    }
    const end = L[n];
    const g = ctx.createLinearGradient(x, y, end[0], end[1]);
    g.addColorStop(0, 'rgba(' + rgb + ',' + alpha + ')');
    g.addColorStop(0.5, 'rgba(' + rgb + ',' + alpha * 0.45 + ')');
    g.addColorStop(1, 'rgba(' + rgb + ',0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(L[0][0], L[0][1]);
    for (const p of L) ctx.lineTo(p[0], p[1]);
    for (let i = n; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
    ctx.closePath();
    ctx.fill();
  }

  // A comet with its nucleus radius s. o: { ang: tail direction (away from the Sun),
  // tail: 0 (frozen, far from the Sun) to 1 (blazing), t, bend: which way the dust tail curves }
  SA.drawComet = function (ctx, x, y, s, o) {
    o = o || {};
    const k = SA.clamp(o.tail == null ? 1 : o.tail, 0, 1), ang = o.ang || 0, t = o.t || 0, bend = o.bend == null ? 1 : o.bend;
    const L = o.len || 1;   // tail length multiplier (short for card pictures)
    if (k > 0.02) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      // Dust tail: wide, curved and creamy. Ion (gas) tail: thin, straight and blue.
      cometTail(ctx, x, y, ang, s * (3 + 22 * k) * L, s * 0.8, s * (2 + 5 * k), '255,236,200', 0.55 * k, 0.35 * bend);
      const flick = 1 + Math.sin(t * 3) * 0.04;
      cometTail(ctx, x, y, ang, s * (4 + 30 * k) * flick * L, s * 0.5, s * (0.8 + 1.4 * k), '120,200,255', 0.7 * k, 0);
      ctx.restore();
    }
    // Coma: the fuzzy glowing cloud of gas around the head.
    const cr = s * (1.6 + 3.2 * k);
    const coma = ctx.createRadialGradient(x, y, 0, x, y, cr);
    coma.addColorStop(0, 'rgba(255,255,255,' + (0.35 + 0.6 * k) + ')');
    coma.addColorStop(0.3, 'rgba(190,240,255,' + (0.15 + 0.4 * k) + ')');
    coma.addColorStop(1, 'rgba(140,210,255,0)');
    ctx.fillStyle = coma;
    SA.circle(ctx, x, y, cr);
    ctx.fill();
    // Nucleus: a dark, lumpy snowball with icy patches.
    SA.drawRock(ctx, x, y, s, { seed: 19, kind: 'dark', rot: t * 0.2, lumps: 0.18 });
    ctx.fillStyle = 'rgba(225,245,255,0.75)';
    SA.ellipse(ctx, x - s * 0.3, y - s * 0.35, s * 0.32, s * 0.18, -0.5); ctx.fill();
    SA.ellipse(ctx, x + s * 0.3, y + s * 0.1, s * 0.18, s * 0.12, 0.3); ctx.fill();
  };

  // ---------- Space critters ----------
  // A round little creature about 60 x 52 at s = 1, feet at y = +26.
  // o: { t, mood: 'joy'|null, squash, look: [dx, dy], seed }
  SA.drawCritter = function (ctx, x, y, s, c, o) {
    o = o || {};
    const t = (o.t || 0) + (o.seed || 0);
    const sq = SA.clamp(o.squash || 0, -0.3, 0.3);
    const joy = o.mood === 'joy';
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.translate(0, 26);
    ctx.scale(1 + sq, 1 - sq);
    ctx.translate(0, -26);
    if (c.feature === 'tilt') ctx.rotate(-0.42);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const dark = SA.shade(c.color, -70);

    // Behind the body.
    if (c.feature === 'ring') {
      ctx.strokeStyle = '#c99a4a'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.ellipse(0, 4, 46, 11, -0.15, Math.PI, TAU); ctx.stroke();
    }
    if (c.feature === 'ears') {
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.translate(side * 13, -18);
        ctx.rotate(side * (0.25 + Math.sin(t * 3 + side) * 0.08));
        ctx.fillStyle = c.color; ctx.strokeStyle = dark; ctx.lineWidth = 2.5;
        SA.ellipse(ctx, 0, -18, 8, 20); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffb3c6';
        SA.ellipse(ctx, 0, -18, 4, 13); ctx.fill();
        ctx.restore();
      }
    }
    if (c.feature === 'fins') {
      ctx.fillStyle = SA.shade(c.color, -30); ctx.strokeStyle = dark; ctx.lineWidth = 2.5;
      for (const side of [-1, 1]) {
        const w = Math.sin(t * 6 + side) * 3;
        ctx.beginPath(); ctx.moveTo(side * 26, -2); ctx.lineTo(side * (44 + w), -14); ctx.lineTo(side * 28, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(-8, -24); ctx.lineTo(4, -40); ctx.lineTo(10, -22); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    if (c.feature === 'horns') {
      // Speed lines trailing behind Zip.
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 3;
      for (const [yy, len] of [[-8, 18], [2, 26], [12, 16]]) {
        const off = (t * 40) % 10;
        ctx.beginPath(); ctx.moveTo(-36 - off, yy); ctx.lineTo(-36 - off - len, yy); ctx.stroke();
      }
    }
    if (c.feature === 'flame') {
      const fl = 1 + Math.sin(t * 9) * 0.12;
      const glow = ctx.createRadialGradient(0, -6, 10, 0, -6, 58);
      glow.addColorStop(0, 'rgba(255,210,80,0.45)');
      glow.addColorStop(1, 'rgba(255,170,40,0)');
      ctx.fillStyle = glow; SA.circle(ctx, 0, -6, 58); ctx.fill();
      ctx.fillStyle = '#ff8a2a';
      ctx.beginPath(); ctx.moveTo(-14, -20); ctx.quadraticCurveTo(-12, -44 * fl, 2, -54 * fl); ctx.quadraticCurveTo(0, -38, 14, -20); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffe066';
      ctx.beginPath(); ctx.moveTo(-7, -20); ctx.quadraticCurveTo(-5, -36 * fl, 2, -42 * fl); ctx.quadraticCurveTo(2, -30, 8, -20); ctx.closePath(); ctx.fill();
    }
    if (c.feature === 'tail') {
      // Frosty's sparkly comet tail streams out behind.
      const wv = Math.sin(t * 4) * 4;
      const tg = ctx.createLinearGradient(-20, 0, -78, -10);
      tg.addColorStop(0, 'rgba(190,240,255,0.9)');
      tg.addColorStop(1, 'rgba(120,200,255,0)');
      ctx.fillStyle = tg;
      ctx.beginPath();
      ctx.moveTo(-18, -18);
      ctx.quadraticCurveTo(-50, -26 + wv, -80, -20 + wv);
      ctx.quadraticCurveTo(-56, -2 + wv * 0.5, -80, 12 + wv);
      ctx.quadraticCurveTo(-50, 14, -18, 14);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 3; i++) {
        const u = (t * 0.6 + i / 3) % 1;
        SA.starPath(ctx, -26 - u * 52, -6 + Math.sin(u * 9 + i) * 10, 4 * (1 - u) + 1, 0.4, 4, t);
        ctx.fill();
      }
    }
    if (c.feature === 'stars') {
      // Nova: a faint swirl of galaxy light behind it.
      ctx.save();
      ctx.rotate(t * 0.4);
      ctx.strokeStyle = 'rgba(200,180,255,0.35)';
      ctx.lineWidth = 5;
      for (const s of [0, Math.PI]) {
        ctx.beginPath();
        for (let a = 0; a < 3.2; a += 0.2) ctx.lineTo(Math.cos(a + s) * (20 + a * 9), Math.sin(a + s) * (20 + a * 9) * 0.75);
        ctx.stroke();
      }
      ctx.restore();
    }
    if (c.feature === 'lure') {
      const pulse = 0.6 + 0.4 * Math.sin(t * 3);
      const glow = ctx.createRadialGradient(18, -52, 2, 18, -52, 34);
      glow.addColorStop(0, 'rgba(200,255,250,' + 0.55 * pulse + ')');
      glow.addColorStop(1, 'rgba(120,230,255,0)');
      ctx.fillStyle = glow; SA.circle(ctx, 18, -52, 34); ctx.fill();
    }
    if (c.feature === 'spots') {
      const glow = ctx.createRadialGradient(0, 0, 14, 0, 0, 50);
      glow.addColorStop(0, 'rgba(220,225,255,0.35)');
      glow.addColorStop(1, 'rgba(220,225,255,0)');
      ctx.fillStyle = glow; SA.circle(ctx, 0, 0, 50); ctx.fill();
    }

    // Feet and body: always the same for a critter, so they are drawn once into a small picture.
    ctx.drawImage(critterBody(c), -42, -38, 84, 76);

    // Head features in front.
    drawCritterFront(ctx, c, t, dark, joy, o);
    ctx.restore();
  };

  const critterBodies = new Map();
  function critterBody(c) {
    const key = c.color + '|' + c.feature;
    let sp = critterBodies.get(key);
    if (!sp) {
      const R = 3;   // pixels per unit: sharp at every size critters are drawn
      sp = document.createElement('canvas');
      sp.width = 84 * R; sp.height = 76 * R;
      const g = sp.getContext('2d');
      g.setTransform(R, 0, 0, R, 42 * R, 38 * R);
      g.lineCap = 'round';
      g.lineJoin = 'round';
      drawCritterBody(g, c, SA.shade(c.color, -70));
      critterBodies.set(key, sp);
    }
    return sp;
  }

  function drawCritterBody(ctx, c, dark) {
    // Feet.
    ctx.fillStyle = SA.shade(c.color, -35);
    ctx.strokeStyle = dark;
    ctx.lineWidth = 2.5;
    SA.ellipse(ctx, -13, 23, 9, 6); ctx.fill(); ctx.stroke();
    SA.ellipse(ctx, 13, 23, 9, 6); ctx.fill(); ctx.stroke();

    // Body (Pebble is lumpy, Toasty is a cloud).
    const g = ctx.createRadialGradient(-10, -12, 4, 0, 0, 36);
    g.addColorStop(0, SA.shade(c.color, 60));
    g.addColorStop(0.6, c.color);
    g.addColorStop(1, SA.shade(c.color, -40));
    ctx.fillStyle = g;
    if (c.feature === 'lumpy') {
      const rnd = SA.seeded(12), pts = [];
      for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU, rr = 1 - 0.08 + rnd() * 0.16; pts.push([Math.cos(a) * 31 * rr, Math.sin(a) * 27 * rr]); }
      SA.blobPath(ctx, pts);
    } else if (c.feature === 'fluff') {
      ctx.beginPath();
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * TAU;
        ctx.moveTo(Math.cos(a) * 24 + 11, Math.sin(a) * 20);
        ctx.arc(Math.cos(a) * 24, Math.sin(a) * 20, 11, 0, TAU);
      }
      ctx.ellipse(0, 0, 27, 23, 0, 0, TAU);
    } else {
      SA.ellipse(ctx, 0, 0, 30, 27);
    }
    ctx.fill();
    ctx.save();
    ctx.clip();
    if (c.feature === 'spot') {
      ctx.fillStyle = 'rgba(160,100,60,0.35)';
      ctx.fillRect(-40, -14, 80, 5);
      ctx.fillRect(-40, -2, 80, 4);
      ctx.fillStyle = '#d0583c';
      SA.ellipse(ctx, 6, 13, 10, 6); ctx.fill();
    }
    if (c.feature === 'spots' || c.feature === 'lumpy') {
      ctx.fillStyle = 'rgba(80,80,110,0.25)';
      for (const [cx, cy, cr] of [[-18, 10, 5], [17, -14, 4], [20, 12, 3.5], [-6, -20, 3]]) { SA.circle(ctx, cx, cy, cr); ctx.fill(); }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    SA.ellipse(ctx, -11, -15, 8, 4, -0.4); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = dark;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  function drawCritterFront(ctx, c, t, dark, joy, o) {
    if (c.feature === 'leaf') {
      const sw = Math.sin(t * 2.5) * 0.2;
      ctx.save();
      ctx.translate(0, -26);
      ctx.rotate(sw);
      ctx.strokeStyle = '#2f8d4a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(2, -10, 0, -16); ctx.stroke();
      ctx.fillStyle = '#5cc85a'; ctx.strokeStyle = '#2f8d4a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, -14); ctx.quadraticCurveTo(14, -30, 22, -16); ctx.quadraticCurveTo(10, -8, 0, -14); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    if (c.feature === 'tail') {
      // A frosty snow cap on top.
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = dark; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-17, -20);
      ctx.quadraticCurveTo(-14, -32, -2, -30);
      ctx.quadraticCurveTo(10, -35, 17, -22);
      ctx.quadraticCurveTo(9, -16, 4, -21);
      ctx.quadraticCurveTo(-3, -15, -8, -20);
      ctx.quadraticCurveTo(-13, -15, -17, -20);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    }
    if (c.feature === 'horns') {
      ctx.fillStyle = '#fff2c8'; ctx.strokeStyle = dark; ctx.lineWidth = 2;
      for (const side of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(side * 10, -24); ctx.lineTo(side * 15, -38); ctx.lineTo(side * 19, -21); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    }
    if (c.feature === 'tilt') {
      const sw = Math.sin(t * 3) * 3;
      ctx.strokeStyle = dark; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(0, -26); ctx.lineTo(sw, -42); ctx.stroke();
      ctx.fillStyle = '#ffe066'; SA.circle(ctx, sw, -44, 5); ctx.fill(); ctx.stroke();
    }
    if (c.feature === 'lure') {
      // Glimmer's little light on a bendy stalk, and two fin-ears.
      ctx.fillStyle = SA.shade(c.color, -25); ctx.strokeStyle = dark; ctx.lineWidth = 2;
      for (const side of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(side * 27, -8); ctx.quadraticCurveTo(side * 40, -16 + Math.sin(t * 5) * 2, side * 36, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      const sw = Math.sin(t * 2) * 3;
      ctx.strokeStyle = dark; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(0, -26); ctx.quadraticCurveTo(4, -50, 18 + sw, -50); ctx.stroke();
      ctx.fillStyle = '#eafffb';
      SA.circle(ctx, 18 + sw, -50, 6); ctx.fill();
      ctx.fillStyle = 'rgba(120,240,230,0.9)';
      SA.circle(ctx, 18 + sw, -50, 3.5); ctx.fill();
    }
    if (c.feature === 'stars') {
      // Three tiny stars twirl around Nova's head.
      for (let i = 0; i < 3; i++) {
        const a = t * 1.6 + (i * TAU) / 3, sx = Math.cos(a) * 26, sy = -34 + Math.sin(a) * 7;
        ctx.fillStyle = ['#fff3a0', '#bfe6ff', '#ffc2ec'][i];
        SA.starPath(ctx, sx, sy, Math.sin(a) > 0 ? 6 : 4.5, 0.42, 5, a);
        ctx.fill();
      }
    }
    if (c.feature === 'umbrella') {
      // Drizzle's little umbrella, tipped back over its head, with a slow drop sliding off the edge.
      const sw = Math.sin(t * 1.8) * 0.08;
      ctx.save();
      ctx.translate(16, 6);
      ctx.rotate(0.35 + sw);
      ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -52); ctx.stroke();
      ctx.beginPath(); ctx.arc(-5, 0, 5, 0, Math.PI); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-34, -48);
      ctx.quadraticCurveTo(-30, -82, 0, -84);
      ctx.quadraticCurveTo(30, -82, 34, -48);
      for (let i = 3; i >= 0; i--) ctx.quadraticCurveTo(-34 + (i + 0.5) * 17, -56, -34 + i * 17, -48);
      ctx.closePath();
      const ug = ctx.createLinearGradient(-34, 0, 34, 0);
      ug.addColorStop(0, '#5fb8ff'); ug.addColorStop(0.5, '#9fd8ff'); ug.addColorStop(1, '#4a8fe0');
      ctx.fillStyle = ug; ctx.fill();
      ctx.strokeStyle = '#2a5a9a'; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -84); ctx.lineTo(0, -90); ctx.stroke();
      const u = (t * 0.45) % 1;
      ctx.fillStyle = 'rgba(255,190,120,' + (1 - u) + ')';
      SA.ellipse(ctx, 34, -46 + u * 30, 3, 4.5); ctx.fill();
      ctx.restore();
    }
    if (c.feature === 'ring') {
      ctx.strokeStyle = '#e8bf6a'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.ellipse(0, 4, 46, 11, -0.15, 0, Math.PI); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,245,210,0.8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, 4, 46, 11, -0.15, 0.3, Math.PI - 0.3); ctx.stroke();
    }

    // Eyes (blink every few seconds) and face.
    const look = o.look || [Math.sin(t * 0.7) * 0.6, Math.cos(t * 0.5) * 0.3];
    const blink = (t % 3.3) < 0.12;
    const ex = c.eyes === 1 ? [0] : c.eyes === 3 ? [-13, 0, 13] : [-10, 10];
    const er = c.eyes === 1 ? 11 : c.eyes === 3 ? 6 : 8;
    const ey = c.eyes === 3 ? -9 : -6;
    for (const px of ex) {
      if (joy) {
        ctx.strokeStyle = '#1d2747'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(px, ey + 2, er * 0.7, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke();
      } else if (blink) {
        ctx.strokeStyle = '#1d2747'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(px - er * 0.7, ey); ctx.lineTo(px + er * 0.7, ey); ctx.stroke();
      } else {
        ctx.fillStyle = '#fff';
        SA.circle(ctx, px, ey, er); ctx.fill();
        ctx.fillStyle = '#1d2747';
        SA.circle(ctx, px + look[0] * er * 0.35, ey + look[1] * er * 0.35, er * 0.58); ctx.fill();
        ctx.fillStyle = '#fff';
        SA.circle(ctx, px + look[0] * er * 0.35 + er * 0.22, ey + look[1] * er * 0.35 - er * 0.25, er * 0.22); ctx.fill();
      }
    }
    ctx.fillStyle = 'rgba(255,110,150,0.45)';
    SA.ellipse(ctx, -19, 7, 5, 3); ctx.fill();
    SA.ellipse(ctx, 19, 7, 5, 3); ctx.fill();
    ctx.strokeStyle = '#1d2747';
    ctx.lineWidth = 2.5;
    if (joy) {
      ctx.fillStyle = '#7a2440';
      ctx.beginPath(); ctx.moveTo(-7, 6); ctx.quadraticCurveTo(0, 18, 7, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(0, 5, 6, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
    }
    if (c.feature === 'helmet') {
      // Floaty's round glass space helmet, with a shine and a little blinking light on top.
      ctx.fillStyle = 'rgba(200,235,255,0.16)';
      ctx.strokeStyle = 'rgba(225,245,255,0.85)';
      ctx.lineWidth = 2.5;
      SA.circle(ctx, 0, -3, 38); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(0, -3, 31, 3.6, 4.4); ctx.stroke();
      ctx.fillStyle = '#9aa3c7'; ctx.strokeStyle = dark; ctx.lineWidth = 2;
      SA.rrect(ctx, -16, 28, 32, 7, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = Math.floor(t * 2) % 2 ? '#ff6b8b' : '#ffd84d';
      SA.circle(ctx, 0, -43, 4); ctx.fill();
    }
  }

  // The International Space Station seen from above: a long truss with four pairs of golden
  // solar wings, white living modules across the middle, and radiators. About 2r wide.
  SA.drawStation = function (ctx, x, y, r, o) {
    o = o || {};
    const t = o.t || 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(o.ang || 0);
    if (o.glow !== false) {
      const gl = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r * 1.25);
      gl.addColorStop(0, 'rgba(170,200,255,0.3)');
      gl.addColorStop(1, 'rgba(170,200,255,0)');
      ctx.fillStyle = gl;
      SA.circle(ctx, 0, 0, r * 1.25); ctx.fill();
    }
    const lw = Math.max(0.6, r * 0.018);
    // Solar wings (behind the truss).
    for (const px of [-0.86, -0.58, 0.58, 0.86]) {
      for (const side of [-1, 1]) {
        const w = r * 0.2, h = r * 0.46, x0 = px * r - w / 2, y0 = side < 0 ? -h - r * 0.04 : r * 0.04;
        const g = ctx.createLinearGradient(x0, y0, x0 + w, y0 + h);
        g.addColorStop(0, '#f2c467');
        g.addColorStop(0.5, '#c98b2e');
        g.addColorStop(1, '#e8b052');
        ctx.fillStyle = g;
        ctx.fillRect(x0, y0, w, h);
        if (r > 14) {
          ctx.strokeStyle = 'rgba(90,50,10,0.45)';
          ctx.lineWidth = lw;
          ctx.beginPath();
          for (let i = 1; i < 4; i++) { ctx.moveTo(x0, y0 + (h * i) / 4); ctx.lineTo(x0 + w, y0 + (h * i) / 4); }
          ctx.moveTo(x0 + w / 2, y0); ctx.lineTo(x0 + w / 2, y0 + h);
          ctx.stroke();
          // A glint sweeps across the panels.
          const gx = x0 + (((t * 0.25 + px) % 1) + 1) % 1 * w;
          ctx.fillStyle = 'rgba(255,250,220,0.35)';
          ctx.fillRect(gx, y0, Math.max(1, w * 0.08), h);
        }
      }
    }
    // The long truss.
    ctx.fillStyle = '#c8cedd';
    ctx.fillRect(-r, -r * 0.035, r * 2, r * 0.07);
    ctx.strokeStyle = '#7d869e';
    ctx.lineWidth = lw;
    ctx.strokeRect(-r, -r * 0.035, r * 2, r * 0.07);
    // Radiators near the middle.
    ctx.fillStyle = '#eef2fa';
    for (const side of [-1, 1]) { ctx.fillRect(side * r * 0.3 - r * 0.05, side < 0 ? -r * 0.28 : r * 0.04, r * 0.1, r * 0.24); }
    // Living modules across the middle.
    const mg = ctx.createLinearGradient(-r * 0.08, 0, r * 0.08, 0);
    mg.addColorStop(0, '#ffffff');
    mg.addColorStop(1, '#a9b2c8');
    ctx.fillStyle = mg;
    SA.rrect(ctx, -r * 0.075, -r * 0.5, r * 0.15, r * 1.0, r * 0.05); ctx.fill();
    ctx.strokeStyle = '#7d869e';
    ctx.stroke();
    SA.rrect(ctx, -r * 0.24, r * 0.2, r * 0.48, r * 0.12, r * 0.05); ctx.fill(); ctx.stroke();
    if (r > 14) {
      ctx.beginPath();
      for (const yy of [-0.3, -0.1, 0.1, 0.38]) { ctx.moveTo(-r * 0.075, yy * r); ctx.lineTo(r * 0.075, yy * r); }
      ctx.stroke();
    }
    // A blinking light.
    if (Math.sin(t * 4) > 0.3) {
      ctx.fillStyle = '#ff6b6b';
      SA.circle(ctx, 0, -r * 0.5, Math.max(1.2, r * 0.03)); ctx.fill();
    }
    ctx.restore();
  };

  // ---------- A spiral galaxy (the Milky Way) ----------
  // Seen face-on it is drawn once per size into a picture: a warm bulging middle, two main arms of
  // blue-white stars with pink star nurseries and dark dust lanes, and a faint halo. tilt squashes
  // it (1 = seen from straight above), rot turns it.
  const galaxySprites = new Map();
  function galaxySprite(px) {
    // A few fixed sizes, so a galaxy that grows or shrinks every frame reuses the same pictures.
    const ps = SA.clamp(SA.pixelScale || 1, 1, 1.5);
    const size = [32, 64, 128, 256, 384].find(s => s >= px * 0.9) || 384, key = size + '|' + ps.toFixed(2);
    let c = galaxySprites.get(key);
    if (c) return c;
    if (galaxySprites.size > 12) galaxySprites.clear();
    c = document.createElement('canvas');
    c.width = c.height = Math.ceil(size * 2 * ps);
    const g = c.getContext('2d');
    g.scale(ps, ps);
    g.translate(size, size);
    const R = size, rnd = SA.seeded(2024);
    const halo = g.createRadialGradient(0, 0, 0, 0, 0, R);
    halo.addColorStop(0, 'rgba(255,236,200,0.9)');
    halo.addColorStop(0.12, 'rgba(255,214,160,0.55)');
    halo.addColorStop(0.35, 'rgba(160,150,255,0.18)');
    halo.addColorStop(1, 'rgba(90,80,200,0)');
    g.fillStyle = halo;
    SA.circle(g, 0, 0, R); g.fill();
    // Arms: logarithmic spirals, drawn as soft dots.
    const dots = Math.min(900, Math.round(R * 3.2));
    const PH = [0, Math.PI, Math.PI / 2 + 0.35, Math.PI * 1.5 + 0.35];   // two main arms, two fainter ones
    for (let arm = 0; arm < 4; arm++) {
      const major = arm < 2, ph = PH[arm];
      const n = major ? dots : dots * 0.45;
      // A soft milky glow along the arm, under its stars.
      g.lineCap = 'round';
      for (const [lw, col] of [[0.16, 'rgba(150,150,255,0.08)'], [0.07, 'rgba(210,215,255,' + (major ? 0.16 : 0.08) + ')']]) {
        g.strokeStyle = col;
        g.lineWidth = R * lw;
        g.beginPath();
        for (let u = 0.04; u <= 0.95; u += 0.02) {
          const a = u * 3.6 + ph, rr = R * (0.1 + u * 0.82);
          u === 0.04 ? g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr) : g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        g.stroke();
      }
      for (let i = 0; i < n; i++) {
        const u = Math.pow(rnd(), 0.8);
        const rr = R * (0.1 + u * 0.82);
        const spread = R * (0.03 + u * 0.07) * (rnd() + rnd() - 1);
        const a = u * 3.6 + ph;
        const x = Math.cos(a) * rr + Math.cos(a + 1.57) * spread, y = Math.sin(a) * rr + Math.sin(a + 1.57) * spread;
        const big = rnd() < 0.08;
        g.fillStyle = big ? 'rgba(255,255,255,' + (0.5 + rnd() * 0.5) + ')' : rnd() < 0.55 ? 'rgba(190,210,255,' + (0.25 + rnd() * 0.45) + ')' : 'rgba(255,240,220,' + (0.2 + rnd() * 0.35) + ')';
        const s = (big ? 1.6 : 0.9) * Math.max(1, R / 140) * (major ? 1 : 0.8);
        g.beginPath(); g.arc(x, y, s * 0.6, 0, TAU); g.fill();
      }
      // A few pink star nurseries and dark dust along the main arms.
      if (major) {
        for (let i = 0; i < 9; i++) {
          const u = 0.25 + rnd() * 0.7, a = u * 3.6 + ph, rr = R * (0.1 + u * 0.82);
          const x = Math.cos(a) * rr, y = Math.sin(a) * rr, s = R * (0.025 + rnd() * 0.025);
          const pg = g.createRadialGradient(x, y, 0, x, y, s * 2);
          pg.addColorStop(0, 'rgba(255,140,200,0.7)');
          pg.addColorStop(1, 'rgba(255,120,190,0)');
          g.fillStyle = pg;
          SA.circle(g, x, y, s * 2); g.fill();
        }
        g.strokeStyle = 'rgba(40,20,50,0.28)';
        g.lineWidth = Math.max(1, R * 0.02);
        g.beginPath();
        for (let u = 0.08; u <= 0.85; u += 0.02) {
          const a = u * 3.6 + ph - 0.18, rr = R * (0.1 + u * 0.82);
          u === 0.08 ? g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr) : g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        g.stroke();
      }
    }
    // The bright middle (a bar of old yellow stars).
    g.save();
    g.rotate(0.5);
    g.scale(1, 0.5);
    const core = g.createRadialGradient(0, 0, 0, 0, 0, R * 0.22);
    core.addColorStop(0, 'rgba(255,250,235,1)');
    core.addColorStop(0.4, 'rgba(255,225,170,0.8)');
    core.addColorStop(1, 'rgba(255,200,140,0)');
    g.fillStyle = core;
    SA.circle(g, 0, 0, R * 0.22); g.fill();
    g.restore();
    c.size = size;
    galaxySprites.set(key, c);
    return c;
  }
  SA.drawGalaxy = function (ctx, x, y, r, o) {
    o = o || {};
    const c = galaxySprite(r);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, o.tilt == null ? 1 : o.tilt);
    ctx.rotate(o.rot || 0);
    ctx.drawImage(c, -r, -r, r * 2, r * 2);
    ctx.restore();
  };

  // Render a critter into its own small canvas (planet cards, the sticker tray).
  SA.renderCritterCanvas = function (id, px, found) {
    const c = document.createElement('canvas');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = c.height = Math.round(px * dpr);
    c.style.width = c.style.height = px + 'px';
    const ctx = c.getContext('2d');
    ctx.scale(dpr, dpr);
    const cr = SA.CRITTER[id];
    SA.drawCritter(ctx, px / 2, px * 0.56, px / 110, cr, { t: 1, look: [0, 0] });
    if (!found) {
      // A mystery silhouette (canvas filters are missing on older iPads, so tint instead).
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = '#4a4380';
      ctx.fillRect(0, 0, px, px);
    }
    return c;
  };

  // Render a drawn icon into its own small canvas (the sticker tray).
  SA.renderIconCanvas = function (name, px) {
    const c = document.createElement('canvas');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = c.height = Math.round(px * dpr);
    c.style.width = c.style.height = px + 'px';
    const ctx = c.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.translate(px / 2, px / 2);
    ctx.scale(px / 110, px / 110);
    const draw = ICONS[name];
    if (draw) draw(ctx);
    return c;
  };

  // Render a body into its own canvas (used for cards and the album).
  SA.renderBodyCanvas = function (id, px) {
    const c = document.createElement('canvas');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = c.height = Math.round(px * dpr);
    c.style.width = c.style.height = px + 'px';
    const ctx = c.getContext('2d');
    ctx.scale(dpr, dpr);
    // Keep rings, glows and the Sun's halo inside the square so nothing is cut off.
    const r = id === 'saturn' ? px * 0.24 : id === 'sun' ? px * 0.3 : id === 'uranus' ? px * 0.29 : px * 0.36;
    SA.drawBody(ctx, id, px / 2, px / 2, r, { t: 0, halo: 1.62 });
    return c;
  };

  // ---------- Small drawn icons ----------
  // Things that used to be emoji in the Space Station and the Rocket Workshop (snacks, the height
  // meter). Colour emoji look different on every device, and plain or blank on some, so these
  // are drawn instead: each in a 100-unit box centred on 0, and kept as a small cached picture.
  const ink = (g, c, w) => { g.strokeStyle = c; g.lineWidth = w || 4; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); };
  const vgrad = (g, y0, y1, c0, c1) => { const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, c0); gr.addColorStop(1, c1); return gr; };
  const hgrad = (g, x0, x1, stops) => { const gr = g.createLinearGradient(x0, 0, x1, 0); stops.forEach((c, i) => gr.addColorStop(i / (stops.length - 1), c)); return gr; };
  const ICONS = {
    // A soft tortilla folded round lettuce, tomato and cheese.
    taco(g) {
      g.fillStyle = '#ffd84d';
      for (const [x, y] of [[-26, -10], [6, -12], [28, -8]]) { g.fillRect(x - 5, y - 9, 10, 12); }
      g.beginPath();
      for (let i = 0; i <= 8; i++) { const x = -40 + i * 10; g.moveTo(x + 10, -6); g.arc(x, -6, 10, 0, TAU); }
      g.fillStyle = '#5fbf45'; g.fill();
      g.fillStyle = '#e8483b';
      for (const [x, y] of [[-14, -14], [16, -16], [-34, -6], [34, -4]]) { SA.circle(g, x, y, 6.5); g.fill(); }
      g.beginPath(); g.ellipse(0, -4, 46, 42, 0, 0, Math.PI); g.closePath();
      g.fillStyle = vgrad(g, -4, 38, '#f8d98c', '#e2a94e'); g.fill();
      ink(g, '#9a6424', 4);
      g.fillStyle = 'rgba(170,100,40,0.45)';
      for (const [x, y, r] of [[-22, 12, 4], [8, 22, 5], [26, 8, 3.5], [-6, 30, 3], [-30, 2, 3]]) { SA.circle(g, x, y, r); g.fill(); }
    },
    apple(g) {
      g.beginPath();
      g.moveTo(0, -24);
      g.bezierCurveTo(20, -38, 46, -26, 42, 4);
      g.bezierCurveTo(40, 30, 20, 46, 6, 40);
      g.quadraticCurveTo(0, 37, -6, 40);
      g.bezierCurveTo(-20, 46, -40, 30, -42, 4);
      g.bezierCurveTo(-46, -26, -20, -38, 0, -24);
      g.closePath();
      const gr = g.createRadialGradient(-14, -10, 4, 0, 6, 50);
      gr.addColorStop(0, '#ff8a7a'); gr.addColorStop(0.55, '#e8352f'); gr.addColorStop(1, '#a5161c');
      g.fillStyle = gr; g.fill();
      ink(g, '#7e1218', 4);
      g.beginPath(); g.moveTo(0, -22); g.quadraticCurveTo(1, -36, 8, -44); ink(g, '#6b4423', 6);
      g.fillStyle = '#5fbf45';
      SA.ellipse(g, 18, -38, 13, 6, -0.5); g.fill(); ink(g, '#2f7d32', 3);
      g.fillStyle = 'rgba(255,255,255,0.55)';
      SA.ellipse(g, -22, -8, 6, 12, 0.35); g.fill();
    },
    // A wrapped sweet with twisted ends.
    candy(g) {
      for (const side of [-1, 1]) {
        g.beginPath();
        g.moveTo(side * 22, 0); g.lineTo(side * 48, -20); g.quadraticCurveTo(side * 40, 0, side * 48, 20); g.closePath();
        g.fillStyle = '#ff9fc0'; g.fill(); ink(g, '#c2416b', 3.5);
      }
      SA.circle(g, 0, 0, 26);
      const gr = g.createRadialGradient(-8, -10, 3, 0, 0, 28);
      gr.addColorStop(0, '#ff9fc0'); gr.addColorStop(1, '#e83b7a');
      g.fillStyle = gr; g.fill();
      g.save(); g.clip();
      g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 7;
      for (const off of [-22, 0, 22]) { g.beginPath(); g.moveTo(off - 30, 30); g.lineTo(off + 30, -30); g.stroke(); }
      g.restore();
      SA.circle(g, 0, 0, 26); ink(g, '#a8285a', 3.5);
      g.fillStyle = 'rgba(255,255,255,0.6)';
      SA.ellipse(g, -10, -12, 7, 4, -0.6); g.fill();
    },
    wrench(g) {
      g.rotate(-0.75);
      g.fillStyle = hgrad(g, -12, 12, ['#eef1f8', '#b9c2d4', '#8590a8']);
      SA.rrect(g, -8, -16, 16, 64, 8);
      g.fill(); ink(g, '#4b5470', 4);
      SA.circle(g, 0, -28, 20); g.fill(); ink(g, '#4b5470', 4);
      SA.rrect(g, -8, -18, 16, 20, 6); g.fill();
      // The open jaw and the hole at the far end.
      g.globalCompositeOperation = 'destination-out';
      g.fillRect(-7, -52, 14, 24);
      SA.circle(g, 0, 40, 5); g.fill();
      g.globalCompositeOperation = 'source-over';
    },
    // A tin of space food.
    can(g) {
      g.fillStyle = hgrad(g, -28, 28, ['#8d97ad', '#eef1f8', '#b9c2d4', '#6f7890']);
      g.fillRect(-26, -32, 52, 66);
      g.fillStyle = '#ff7a3d'; g.fillRect(-26, -16, 52, 34);
      g.fillStyle = 'rgba(255,255,255,0.85)'; SA.circle(g, 0, 1, 10); g.fill();
      g.fillStyle = '#5fbf45'; SA.circle(g, 0, 1, 5); g.fill();
      SA.ellipse(g, 0, 34, 26, 7); g.fillStyle = '#6f7890'; g.fill();
      g.beginPath(); g.moveTo(-26, -32); g.lineTo(-26, 34); g.moveTo(26, -32); g.lineTo(26, 34); ink(g, '#4b5470', 3.5);
      SA.ellipse(g, 0, 34, 26, 7, 0); g.beginPath(); g.ellipse(0, 34, 26, 7, 0, 0, Math.PI); ink(g, '#4b5470', 3.5);
      SA.ellipse(g, 0, -32, 26, 7); g.fillStyle = '#dfe4ee'; g.fill(); ink(g, '#4b5470', 3.5);
      SA.ellipse(g, 0, -32, 17, 4); ink(g, 'rgba(75,84,112,0.5)', 2);
    },
    juicebox(g) {
      g.beginPath(); g.moveTo(10, -34); g.lineTo(10, -50); g.lineTo(22, -58); ink(g, '#ff6b8b', 6);
      g.fillStyle = vgrad(g, -34, 44, '#ffc861', '#f08a1c');
      SA.rrect(g, -24, -34, 48, 78, 6); g.fill(); ink(g, '#a35a00', 4);
      g.fillStyle = '#ffe8b0';
      g.beginPath(); g.moveTo(-24, -34); g.lineTo(-16, -42); g.lineTo(16, -42); g.lineTo(24, -34); g.closePath(); g.fill(); ink(g, '#a35a00', 3);
      g.fillStyle = '#fffaf0'; SA.circle(g, 0, 8, 16); g.fill();
      g.fillStyle = '#ff9f1c'; SA.circle(g, 0, 9, 10); g.fill();
      g.fillStyle = '#5fbf45'; SA.ellipse(g, 6, -3, 6, 3, -0.6); g.fill();
    },
    tree(g) {
      g.fillStyle = '#8a5a33'; g.fillRect(-7, 8, 14, 40);
      g.beginPath();
      for (const [x, y, r] of [[0, -16, 30], [-22, 4, 21], [22, 4, 21]]) { g.moveTo(x + r, y); g.arc(x, y, r, 0, TAU); }
      ink(g, '#24652d', 7);
      g.fillStyle = vgrad(g, -46, 26, '#6fd35e', '#2f8a3c'); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.3)'; SA.circle(g, -10, -26, 8); g.fill();
    },
    cloud(g) {
      g.beginPath();
      for (const [x, y, r] of [[-24, 8, 19], [0, -6, 26], [25, 6, 19]]) { g.moveTo(x + r, y); g.arc(x, y, r, 0, TAU); }
      g.rect(-40, 8, 80, 18);
      ink(g, '#9fb4d0', 6);
      g.fillStyle = vgrad(g, -32, 28, '#ffffff', '#d6e4f5'); g.fill();
    },
    // A jet airliner flying to the right.
    plane(g) {
      g.fillStyle = '#aeb8cc';
      g.beginPath(); g.moveTo(-2, -4); g.lineTo(-16, -22); g.lineTo(-8, -22); g.lineTo(12, -4); g.closePath(); g.fill();
      g.beginPath();
      g.moveTo(-44, -5); g.lineTo(28, -8); g.quadraticCurveTo(48, -7, 48, 0); g.quadraticCurveTo(48, 7, 28, 8); g.lineTo(-40, 6); g.closePath();
      g.fillStyle = vgrad(g, -8, 8, '#ffffff', '#c9d1e0'); g.fill(); ink(g, '#5d6984', 3.5);
      g.beginPath(); g.moveTo(-30, -6); g.lineTo(-44, -26); g.lineTo(-35, -26); g.lineTo(-18, -6); g.closePath();
      g.fillStyle = '#ff5d6c'; g.fill(); ink(g, '#a8283a', 3);
      g.beginPath(); g.moveTo(-6, 2); g.lineTo(-22, 26); g.lineTo(-11, 26); g.lineTo(14, 2); g.closePath();
      g.fillStyle = '#d7deea'; g.fill(); ink(g, '#5d6984', 3);
      g.fillStyle = '#4fa3f0';
      for (let x = -24; x <= 22; x += 8) { SA.circle(g, x, -1, 2.4); g.fill(); }
      SA.ellipse(g, 39, -2, 5, 3); g.fill();
    },
    // Outer space: a dark round window full of stars and a far-away galaxy.
    space(g) {
      SA.circle(g, 0, 0, 44);
      const gr = g.createRadialGradient(-10, -10, 4, 0, 0, 46);
      gr.addColorStop(0, '#4a3aa8'); gr.addColorStop(1, '#0b0d2c');
      g.fillStyle = gr; g.fill(); ink(g, '#b9a8ff', 4);
      g.save(); g.translate(4, 6); g.rotate(-0.5); g.scale(1, 0.5);
      g.strokeStyle = 'rgba(220,200,255,0.75)'; g.lineWidth = 4;
      for (const s of [0, Math.PI]) { g.beginPath(); for (let a = 0; a < 4; a += 0.2) g.lineTo(Math.cos(a + s) * (4 + a * 6), Math.sin(a + s) * (4 + a * 6)); g.stroke(); }
      g.restore();
      g.fillStyle = '#ffffff';
      for (const [x, y, r] of [[-20, -18, 9], [22, -20, 5], [-22, 20, 5], [26, 22, 4]]) { SA.starPath(g, x, y, r, 0.35, 4, 0); g.fill(); }
    },
    satellite(g) {
      g.rotate(-0.45);
      for (const side of [-1, 1]) {
        const x0 = side < 0 ? -50 : 18;
        g.fillStyle = hgrad(g, x0, x0 + 32, ['#5b8cff', '#2a52b8']);
        g.fillRect(x0, -13, 32, 26);
        g.strokeStyle = 'rgba(200,220,255,0.7)'; g.lineWidth = 1.5;
        g.beginPath(); for (let i = 1; i < 4; i++) { g.moveTo(x0 + i * 8, -13); g.lineTo(x0 + i * 8, 13); } g.moveTo(x0, 0); g.lineTo(x0 + 32, 0); g.stroke();
        g.strokeRect(x0, -13, 32, 26);
      }
      g.beginPath(); g.moveTo(-18, 0); g.lineTo(18, 0); ink(g, '#8d97ad', 4);
      g.fillStyle = vgrad(g, -16, 16, '#ffe08a', '#c98b2e');
      SA.rrect(g, -12, -16, 24, 32, 4); g.fill(); ink(g, '#7a5200', 3);
      g.beginPath(); g.moveTo(0, -16); g.lineTo(0, -26); ink(g, '#8d97ad', 3);
      g.fillStyle = '#eef1f8'; g.beginPath(); g.ellipse(0, -28, 11, 5, 0, Math.PI, TAU); g.closePath(); g.fill(); ink(g, '#5d6984', 2.5);
    },
    moon(g) { SA.drawBody(g, 'moon', 0, 0, 40, { t: 0, lx: -0.6, ly: -0.6, halo: 1.2 }); },
    rocket(g) { SA.drawRocket(g, 0, 4, 0.72, 0.6, { t: 0, flame: 0, paint: 'classic', shape: 'classic' }); },
    flag(g) {
      g.fillStyle = '#9aa3b8'; SA.ellipse(g, -22, 46, 14, 4); g.fill();
      g.fillStyle = hgrad(g, -27, -19, ['#ffffff', '#b9c2d4']);
      g.fillRect(-26, -46, 7, 92);
      g.beginPath(); g.moveTo(-26, -46); g.lineTo(-26, 46); g.moveTo(-19, -46); g.lineTo(-19, 46); ink(g, '#5d6984', 2.5);
      g.beginPath();
      g.moveTo(-19, -44); g.quadraticCurveTo(4, -50, 38, -32); g.quadraticCurveTo(10, -22, -19, -12); g.closePath();
      g.fillStyle = vgrad(g, -48, -12, '#ff7b84', '#e0303f'); g.fill(); ink(g, '#9c1b28', 3);
    },
    // A pointing hand for "tap here" hints, fingertip at the top (replaces the 👆 emoji).
    hand(g) {
      const skin = vgrad(g, -48, 40, '#ffe3c4', '#f5b98a'), line = '#9a5a2e';
      // Sleeve cuff.
      g.fillStyle = vgrad(g, 30, 48, '#7fc4ff', '#3f86d6');
      SA.rrect(g, -22, 30, 44, 18, 6); g.fill(); ink(g, '#24508a', 3.5);
      // Palm with three curled fingers and a thumb.
      g.beginPath();
      g.moveTo(-20, 32); g.lineTo(-20, 2);
      g.quadraticCurveTo(-30, -2, -26, -12); g.quadraticCurveTo(-20, -18, -11, -6);
      g.lineTo(-11, -40); g.quadraticCurveTo(-11, -50, -2, -50); g.quadraticCurveTo(7, -50, 7, -40);
      g.lineTo(7, -8);
      g.quadraticCurveTo(14, -16, 20, -8); g.quadraticCurveTo(26, -8, 25, 2);
      g.lineTo(24, 32); g.closePath();
      g.fillStyle = skin; g.fill(); ink(g, line, 4);
      g.beginPath();
      g.moveTo(7, -2); g.quadraticCurveTo(12, 2, 9, 8);
      g.moveTo(15, 2); g.quadraticCurveTo(21, 6, 18, 12);
      g.moveTo(-11, -6); g.lineTo(-11, 4);
      ink(g, 'rgba(154,90,46,0.7)', 3);
      g.fillStyle = 'rgba(255,255,255,0.6)';
      SA.ellipse(g, -5, -38, 2.5, 6); g.fill();
    },
    // Smoke puffs for a rocket too heavy to lift off.
    puff(g) {
      g.beginPath();
      for (const [x, y, r] of [[-20, 10, 18], [6, -4, 24], [28, 14, 14]]) { g.moveTo(x + r, y); g.arc(x, y, r, 0, TAU); }
      ink(g, '#8f9bb4', 5);
      g.fillStyle = vgrad(g, -28, 32, '#ffffff', '#d3d9e6'); g.fill();
      g.beginPath(); g.moveTo(-46, -18); g.lineTo(-30, -18); g.moveTo(-48, -6); g.lineTo(-38, -6); ink(g, 'rgba(143,155,180,0.8)', 4);
    },
  };
  // Drawn versions of the most-used sticker emoji (they look the same on every device).
  Object.assign(ICONS, {
    balloon(g) {
      g.beginPath(); g.moveTo(0, 26); g.bezierCurveTo(-8, 38, 10, 44, 0, 56); ink(g, '#8a8fa8', 2.5);
      g.beginPath(); g.moveTo(-6, 30); g.lineTo(6, 30); g.lineTo(0, 22); g.closePath();
      g.fillStyle = '#d93a52'; g.fill();
      SA.ellipse(g, 0, -10, 30, 36);
      const gr = g.createRadialGradient(-10, -24, 4, 0, -8, 40);
      gr.addColorStop(0, '#ff9aaa'); gr.addColorStop(0.6, '#ff4d6a'); gr.addColorStop(1, '#c41f3e');
      g.fillStyle = gr; g.fill(); ink(g, '#9c1b33', 3);
      g.fillStyle = 'rgba(255,255,255,0.65)'; SA.ellipse(g, -12, -24, 6, 11, 0.4); g.fill();
    },
    // A potted space plant with glowing bulbs.
    plant(g) {
      for (const [a, len, c] of [[-0.5, 52, '#5fd6a0'], [0, 62, '#4fc28c'], [0.5, 50, '#6fe0b0']]) {
        const tx = Math.sin(a) * len, ty = 6 - Math.cos(a) * len;
        g.beginPath(); g.moveTo(0, 8); g.quadraticCurveTo(tx * 0.3, ty * 0.6, tx, ty); ink(g, '#2f8a62', 6);
        g.beginPath(); g.moveTo(0, 8); g.quadraticCurveTo(tx * 0.3, ty * 0.6, tx, ty); ink(g, c, 3.5);
        const bg = g.createRadialGradient(tx, ty, 1, tx, ty, 12);
        bg.addColorStop(0, '#fffbe0'); bg.addColorStop(0.5, '#ff9ae0'); bg.addColorStop(1, 'rgba(255,120,210,0)');
        g.fillStyle = bg; SA.circle(g, tx, ty, 12); g.fill();
      }
      g.beginPath(); g.moveTo(-28, 10); g.lineTo(28, 10); g.lineTo(20, 48); g.lineTo(-20, 48); g.closePath();
      g.fillStyle = vgrad(g, 10, 48, '#e8875a', '#b65a32'); g.fill(); ink(g, '#7a3a1e', 3.5);
      g.fillStyle = '#f2a274'; g.fillRect(-30, 6, 60, 10); g.strokeRect(-30, 6, 60, 10);
    },
    // A friendly little green alien.
    alien(g) {
      for (const side of [-1, 1]) {
        g.beginPath(); g.moveTo(side * 12, -30); g.quadraticCurveTo(side * 20, -46, side * 26, -50); ink(g, '#3f9a3a', 4);
        g.fillStyle = '#ffe066'; SA.circle(g, side * 26, -50, 6); g.fill(); ink(g, '#b08a00', 2);
      }
      g.beginPath();
      g.moveTo(0, -38); g.bezierCurveTo(36, -38, 40, 6, 0, 40); g.bezierCurveTo(-40, 6, -36, -38, 0, -38); g.closePath();
      const gr = g.createRadialGradient(-10, -16, 4, 0, 0, 44);
      gr.addColorStop(0, '#c8ff9a'); gr.addColorStop(0.6, '#7ee05a'); gr.addColorStop(1, '#4aa83a');
      g.fillStyle = gr; g.fill(); ink(g, '#2f7a2a', 3.5);
      g.fillStyle = '#1d2747';
      for (const side of [-1, 1]) { SA.ellipse(g, side * 13, -6, 9, 13, side * 0.5); g.fill(); }
      g.fillStyle = '#fff';
      for (const side of [-1, 1]) { SA.circle(g, side * 13 + 3, -11, 3); g.fill(); }
      g.beginPath(); g.arc(0, 14, 8, 0.15 * Math.PI, 0.85 * Math.PI); ink(g, '#1d2747', 3);
      g.fillStyle = 'rgba(255,120,150,0.45)'; SA.ellipse(g, -22, 10, 5, 3); g.fill(); SA.ellipse(g, 22, 10, 5, 3); g.fill();
    },
    sunflower(g) {
      g.beginPath(); g.moveTo(0, 12); g.quadraticCurveTo(6, 32, 0, 54); ink(g, '#3f8f3a', 6);
      g.fillStyle = '#5fbf45'; SA.ellipse(g, 12, 38, 12, 5, -0.5); g.fill(); SA.ellipse(g, -10, 30, 11, 5, 0.5); g.fill();
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * TAU;
        g.save(); g.translate(0, -8); g.rotate(a);
        SA.ellipse(g, 0, -26, 7.5, 14); g.fillStyle = i % 2 ? '#ffd23a' : '#ffc21f'; g.fill(); ink(g, '#c98a00', 1.5);
        g.restore();
      }
      SA.circle(g, 0, -8, 15); g.fillStyle = '#7a4a1e'; g.fill(); ink(g, '#4a2a0e', 2.5);
      g.fillStyle = 'rgba(255,220,150,0.5)';
      for (let i = 0; i < 9; i++) { const a = i * 2.4, rr = 4 + (i % 3) * 3.5; SA.circle(g, Math.cos(a) * rr, -8 + Math.sin(a) * rr, 1.6); g.fill(); }
    },
    // A Dragonfly-style drone: a body on landing skids with four spinning rotors.
    drone(g) {
      g.beginPath(); g.moveTo(-30, 32); g.lineTo(-22, 18); g.moveTo(30, 32); g.lineTo(22, 18); g.moveTo(-38, 32); g.lineTo(-20, 32); g.moveTo(20, 32); g.lineTo(38, 32); ink(g, '#5d6984', 4);
      g.beginPath(); for (const x of [-30, 30]) { g.moveTo(x * 0.5, -6); g.lineTo(x, -20); } ink(g, '#5d6984', 4);
      for (const x of [-34, 34]) {
        SA.ellipse(g, x, -22, 22, 5); g.fillStyle = 'rgba(200,215,240,0.6)'; g.fill(); ink(g, '#8d97ad', 2);
        SA.circle(g, x, -22, 3); g.fillStyle = '#5d6984'; g.fill();
      }
      SA.rrect(g, -26, -10, 52, 30, 10);
      g.fillStyle = vgrad(g, -10, 20, '#fff3c4', '#e0a420'); g.fill(); ink(g, '#8a5a00', 3.5);
      g.fillStyle = '#16204a'; SA.circle(g, 0, 4, 8); g.fill();
      g.fillStyle = '#9fe0ff'; SA.circle(g, 2, 2, 3); g.fill();
    },
    saucer(g) {
      SA.ellipse(g, 0, -10, 22, 20);
      g.fillStyle = 'rgba(170,230,255,0.55)'; g.fill(); ink(g, '#5d8ab4', 3);
      g.fillStyle = 'rgba(255,255,255,0.7)'; SA.ellipse(g, -8, -18, 5, 8, 0.4); g.fill();
      SA.ellipse(g, 0, 6, 46, 14);
      g.fillStyle = hgrad(g, -46, 46, ['#8d97ad', '#eef1f8', '#b9c2d4', '#6f7890']); g.fill(); ink(g, '#4b5470', 3.5);
      for (let i = -2; i <= 2; i++) { g.fillStyle = ['#ff6b8b', '#ffd84d', '#7ee08a', '#5fc8ff', '#b48cff'][i + 2]; SA.circle(g, i * 16, 8, 4); g.fill(); }
    },
    // An envelope sealed with a heart (Cosmo's space postcards).
    postcard(g) {
      SA.rrect(g, -42, -28, 84, 58, 6);
      g.fillStyle = vgrad(g, -28, 30, '#fffaf0', '#f0e2c8'); g.fill(); ink(g, '#a8875a', 3.5);
      g.beginPath(); g.moveTo(-42, -26); g.lineTo(0, 6); g.lineTo(42, -26); ink(g, '#a8875a', 3);
      g.fillStyle = '#ff5d8a'; SA.heart(g, 0, 4, 11); g.fill(); ink(g, '#b8285a', 2);
      g.fillStyle = '#8f5bff'; g.fillRect(24, -22, 12, 14);
      g.fillStyle = '#ffe066'; SA.starPath(g, 30, -15, 4, 0.45, 5); g.fill();
    },
    zoop(g) { if (SA.drawZoop) SA.drawZoop(g, 0, 0, 34, { t: 0 }); },
    // Cosmo's singing microphone (the Planet Song).
    mic(g) {
      g.save();
      g.rotate(0.45);
      SA.rrect(g, -9, -2, 18, 46, 8);
      g.fillStyle = vgrad(g, -2, 44, '#6b7493', '#2b3045'); g.fill(); ink(g, '#1d2235', 3);
      SA.rrect(g, -11, -6, 22, 9, 3); g.fillStyle = '#ffd84d'; g.fill(); ink(g, '#a35a00', 2);
      SA.circle(g, 0, -24, 21);
      const sg = g.createRadialGradient(-7, -31, 2, 0, -24, 21);
      sg.addColorStop(0, '#ffffff'); sg.addColorStop(1, '#9aa3bf');
      g.fillStyle = sg; g.fill(); ink(g, '#5d6984', 3);
      g.strokeStyle = 'rgba(80,90,120,0.45)'; g.lineWidth = 2;
      for (const k of [-12, -4, 4, 12]) {
        g.beginPath(); g.moveTo(k, -24 - Math.sqrt(400 - k * k)); g.lineTo(k, -24 + Math.sqrt(400 - k * k)); g.stroke();
        g.beginPath(); g.moveTo(-Math.sqrt(400 - k * k), -24 + k); g.lineTo(Math.sqrt(400 - k * k), -24 + k); g.stroke();
      }
      g.restore();
    },
  });
  // Sticker emoji drawn as icons instead (SA.emoji routes these; see util.js).
  SA.EMOJI_ICONS = { '🎈': 'balloon', '🪴': 'plant', '👽': 'alien', '🌻': 'sunflower', '🚁': 'drone', '🛸': 'saucer', '💌': 'postcard', '🏡': 'zoop', '🚀': 'rocket', '🚩': 'flag', '🌮': 'taco', '🎤': 'mic' };
  SA.ICON_NAMES = Object.keys(ICONS);
  const iconCache = new Map();
  // Draws an icon centred on (x, y), about size wide.
  SA.icon = function (ctx, name, x, y, size) {
    const draw = ICONS[name];
    if (!draw) return;
    const ps = SA.clamp(SA.pixelScale || 1, 1, 3), px = Math.max(8, Math.round(size));
    const key = name + '|' + px + '|' + ps.toFixed(2);
    let c = iconCache.get(key);
    if (!c) {
      if (iconCache.size > 60) iconCache.clear();
      const box = px * 1.2;   // a little room for outlines
      c = document.createElement('canvas');
      c.width = c.height = Math.max(2, Math.ceil(box * ps));
      const g = c.getContext('2d');
      g.scale(c.width / box, c.height / box);
      g.translate(box / 2, box / 2);
      g.scale(px / 100, px / 100);
      draw(g);
      c.box = box;
      iconCache.set(key, c);
    }
    const d = c.box * (size / px);
    ctx.drawImage(c, x - d / 2, y - d / 2, d, d);
  };
})(window.SA);
