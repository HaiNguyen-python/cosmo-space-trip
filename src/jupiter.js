// Jupiter mission: "Moon Photo Tour". The rocket skims past giant Jupiter. The child drags up and
// down to fly through camera frames and photograph the four big moons and the Great Red Spot,
// steering around lightning storms. A zap only spins the rocket: nothing is ever lost.
(function (SA) {
  const TAU = Math.PI * 2;
  const SPEED = 240;
  const TRACK = 6900;
  const TARGETS = [
    { id: 'io', x: 900, fy: 0.3, r: 44, name: 'Io',
      fact: 'Snap! That\'s Io. It has more active volcanoes than anywhere else in the Solar System! 🌋' },
    { id: 'europa', x: 2050, fy: 0.56, r: 40, name: 'Europa',
      fact: 'Snap! That\'s Europa. Under its icy shell there is a giant salty ocean!' },
    { id: 'grs', x: 3250, fy: 0, r: 0, name: 'Great Red Spot',
      fact: 'Snap! The Great Red Spot is a storm bigger than Earth. It has been swirling for at least 150 years!' },
    { id: 'ganymede', x: 4450, fy: 0.22, r: 58, name: 'Ganymede',
      fact: 'Snap! Ganymede is the biggest moon in the Solar System. It\'s even bigger than the planet Mercury!' },
    { id: 'callisto', x: 5650, fy: 0.46, r: 50, name: 'Callisto',
      fact: 'Snap! Callisto is covered in craters. It\'s one of the most cratered places in the Solar System!' },
  ];
  const STORMS = [{ x: 1480, fy: 0.44 }, { x: 2650, fy: 0.3 }, { x: 3850, fy: 0.5 }, { x: 5050, fy: 0.34 }, { x: 6200, fy: 0.58 }];
  const BANDS = ['#ead7b8', '#c6955f', '#f2e4ca', '#b67c52', '#ecd5ac', '#c48d5d', '#f0e0c4', '#a9714b', '#e5cfa8', '#c99a68', '#efdcbc', '#b98257'];
  const MOON_LOOK = {
    io: { base: '#f2d36b', spots: ['#e08a2c', '#5a3a1a', '#fff3c4', '#d2691e'] },
    europa: { base: '#efe3cf', spots: ['#d9c4a6'], cracks: '#a86b45' },
    ganymede: { base: '#9c9184', spots: ['#c9bfae', '#7e7468'] },
    callisto: { base: '#6c6258', spots: ['#d8d0c4', '#8a8076'] },
  };

  class JupiterScene {
    constructor() {
      this.stars = new SA.Starfield(220, 31);
      this.fx = new SA.Particles();
      this.t = 0;
    }

    enter(opts) {
      SA.ui.setScene('game');
      SA.audio.music('jupiter');
      // Expert mission "Storm Dodger": storms drift up and down, frames are smaller, new facts.
      this.expert = !!(opts && opts.expert);
      const E = SA.EXPERT.jupiter;
      this.x = 0;
      this.y = SA.H * 0.45;
      this.aimY = this.y;
      this.vy = 0;
      this.phase = 'intro';
      this.targets = TARGETS.map(t => Object.assign({ done: false, missed: false }, t, this.expert ? { fact: E.facts[t.id] } : null));
      this.storms = STORMS.map(s => Object.assign({ hit: false, fy0: s.fy }, s));
      this.got = 0;
      this.zapT = 0;
      this.spin = 0;
      this.flash = 0;
      this.flashColor = '#fff';
      this.shake = 0;
      this.zapped = false;
      this.flyers = [];
      this.updateInfo();
      SA.ui.banner('Jupiter', this.expert ? '🎓 Expert: ' + E.name : SA.NICKNAMES.jupiter).then(() => SA.scene !== this ? new Promise(() => {}) : SA.ui.say(this.expert ? E.intro : SA.introLines('jupiter', [
        'Welcome to Jupiter, the biggest planet! 🪐 More than 1,300 Earths could fit inside it.',
        'Let\'s take photos of Jupiter\'s moons, just like the real Juno spacecraft. 📸',
        'Drag your finger up and down to steer. Fly through the camera frames, and stay away from lightning storms! ⚡',
      ]))).then(() => {
        if (SA.scene !== this) return;
        this.phase = 'fly';
        SA.ui.hint('Drag up and down to steer! 👆', 3);
      });
    }

    exit() { SA.ui.hideTalk(); }

    updateInfo() { SA.ui.setInfo('📸 Photos ' + this.got + ' / ' + TARGETS.length); }

    // ---------- Geometry ----------
    rocketX() { return SA.W * 0.25; }
    camX() { return this.x - this.rocketX(); }
    planet() {
      const BR = SA.W * 1.4;
      return { cx: SA.W * 0.5, cy: SA.H * 0.76 + BR, R: BR };
    }
    horizonY(sx) {
      const p = this.planet();
      const dx = sx - p.cx;
      return p.cy - Math.sqrt(Math.max(0, p.R * p.R - dx * dx));
    }
    maxY() { return this.horizonY(this.rocketX()) + 6; }
    targetY(tg) { return tg.id === 'grs' ? this.horizonY(this.rocketX()) - 6 : tg.fy * SA.H; }

    onDown(x, y) { if (this.phase === 'fly') this.aimY = y; }
    onMove(x, y) { if (this.phase === 'fly') this.aimY = y; }

    update(dt) {
      this.t += dt;
      this.fx.update(dt);
      this.flash = Math.max(0, this.flash - dt * 3);
      this.shake = Math.max(0, this.shake - dt * 3);
      this.spin = Math.max(0, this.spin - dt * 1.4);
      this.zapT = Math.max(0, this.zapT - dt);
      for (const f of this.flyers) {
        f.t += dt * 1.3;
        if (f.t >= 1 && !f.done) { f.done = true; SA.audio.play('pop'); SA.ui.bumpInfo(); }
      }
      this.flyers = this.flyers.filter(f => f.t < 1.05);
      if (this.phase !== 'fly') return;

      const speed = SPEED * (this.zapT > 0 ? 0.45 : 1);
      this.x += speed * dt;
      const prevY = this.y;
      const aim = SA.clamp(this.aimY, SA.H * 0.1, this.maxY());
      this.y += (aim - this.y) * Math.min(1, dt * 5);
      this.vy = (this.y - prevY) / Math.max(dt, 0.001);

      const rx = this.rocketX();
      const back = Math.PI;
      if (Math.random() < 0.8) this.fx.spawn('puff', rx - 48, this.y + SA.rand(-4, 4), 1, { vx: Math.cos(back) * 120, vy: 0 });

      // Photos.
      for (const tg of this.targets) {
        if (tg.done || tg.missed) continue;
        const ty = this.targetY(tg);
        if (Math.abs(this.x - tg.x) < 40 && Math.abs(this.y - ty) < (SA.easy() ? 125 : this.expert ? 62 : 80)) this.capture(tg, ty);
        else if (this.x > tg.x + 60) {
          tg.missed = true;
          SA.ui.hint('Oops, we missed that photo. Let\'s get the next one! 📸', 3);
        }
      }

      // Lightning storms (in the Expert mission they drift slowly up and down).
      for (const s of this.storms) {
        if (this.expert) s.fy = s.fy0 + Math.sin(this.t * 0.9 + s.x * 0.01) * 0.1;
        if (s.hit) continue;
        if (Math.hypot(this.x - s.x, this.y - s.fy * SA.H) < (SA.easy() ? 46 : 72)) {
          s.hit = true;
          this.zapT = 1;
          this.spin = 1;
          this.shake = 1;
          this.flash = 0.8;
          this.flashColor = '#c9b3ff';
          SA.audio.play('zap');
          SA.ui.hint(this.zapped ? 'Zap! Steer around the storms! ⚡'
            : 'Zap! Jupiter has giant lightning storms, much bigger than storms on Earth! ⚡', 4);
          this.zapped = true;
        }
      }

      if (this.x >= TRACK) this.finish();
    }

    capture(tg, ty) {
      tg.done = true;
      this.got++;
      this.updateInfo();
      this.flash = 1;
      this.flashColor = '#ffffff';
      SA.audio.play('shutter');
      setTimeout(() => SA.audio.play('collect'), 160);
      const sx = tg.x - this.camX();
      this.fx.spawn('sparkle', sx, ty, 18);
      this.fx.text(sx, ty - 60, '📸 ' + tg.name, '#ffe066');
      this.flyers.push({ id: tg.id, x0: sx, y0: ty, t: 0 });
      SA.ui.hint(tg.fact, 6);
    }

    async finish() {
      this.phase = 'done';
      SA.audio.play('cheer');
      SA.celebrate(120);
      const all = this.got === TARGETS.length;
      const stars = all ? 3 : this.got >= 3 ? 2 : 1;
      await SA.ui.banner('Mission Complete!', '📸 ' + this.got + ' of ' + TARGETS.length + ' photos taken', 'gold', stars);
      if (SA.scene !== this) return;
      if (this.expert) {
        await SA.ui.say(SA.EXPERT.jupiter.outro);
        SA.finishExpert('jupiter', stars);
        return;
      }
      await SA.ui.say([
        all ? 'What an amazing photo album! You photographed everything! 🎉'
            : 'Great flying! You took ' + this.got + ' of ' + TARGETS.length + ' photos! 🎉',
        'Io, Europa, Ganymede and Callisto were discovered by Galileo in 1610, with a small telescope!',
        'Jupiter has more than 90 moons altogether. Wow! 🌙',
      ]);
      SA.finishPlanet('jupiter', stars);
    }

    // ---------- Drawing ----------
    draw(ctx) {
      const W = SA.W, H = SA.H, t = this.t;
      const camX = this.camX();
      const sh = SA.calm() ? 0 : this.shake * 7;
      ctx.save();
      ctx.translate(Math.sin(t * 60) * sh, Math.cos(t * 47) * sh);

      SA.spaceBg(ctx, '#05071d', '#1a1238');
      this.stars.draw(ctx, t, camX * 0.05);
      // The Sun looks tiny this far away.
      const sg = ctx.createRadialGradient(W * 0.07, H * 0.1, 0, W * 0.07, H * 0.1, 40);
      sg.addColorStop(0, 'rgba(255,250,220,1)');
      sg.addColorStop(0.25, 'rgba(255,220,140,0.8)');
      sg.addColorStop(1, 'rgba(255,200,100,0)');
      ctx.fillStyle = sg;
      SA.circle(ctx, W * 0.07, H * 0.1, 40); ctx.fill();

      this.drawJupiter(ctx, camX, t);

      for (const s of this.storms) {
        const sx = s.x - camX;
        if (sx > -150 && sx < W + 150) this.drawStorm(ctx, sx, s.fy * H, t + s.x, s.hit);
      }
      for (const tg of this.targets) {
        const sx = tg.x - camX;
        if (sx < -200 || sx > W + 200) continue;
        if (tg.id !== 'grs') this.drawMoon(ctx, tg.id, sx, tg.fy * H, tg.r);
        if (!tg.done && !tg.missed) this.drawFrame(ctx, sx, this.targetY(tg), t, tg === this.targets.find(x => !x.done && !x.missed));
      }

      this.fx.draw(ctx);
      const tilt = SA.clamp(this.vy * 0.0015, -0.4, 0.4);
      SA.drawRocket(ctx, this.rocketX(), this.y, 0.6, Math.PI / 2 + tilt + this.spin * TAU, { t, flame: this.zapT > 0 ? 0.3 : 0.9 });
      ctx.restore();

      if (this.flash > 0) {
        ctx.globalAlpha = this.flash * (SA.calm() ? 0.12 : 0.6);
        ctx.fillStyle = this.flashColor;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }
      this.drawFilmStrip(ctx);
      for (const f of this.flyers) this.drawFlyer(ctx, f);
    }

    drawJupiter(ctx, camX, t) {
      const p = this.planet(), W = SA.W;
      const glow = ctx.createRadialGradient(p.cx, p.cy, p.R * 0.98, p.cx, p.cy, p.R * 1.04);
      glow.addColorStop(0, 'rgba(255,220,170,0.35)');
      glow.addColorStop(1, 'rgba(255,220,170,0)');
      ctx.fillStyle = glow;
      SA.circle(ctx, p.cx, p.cy, p.R * 1.04); ctx.fill();

      ctx.save();
      SA.circle(ctx, p.cx, p.cy, p.R);
      ctx.clip();
      // Cloud bands run parallel to the horizon.
      const bh = 24;
      for (let i = 0; i < 16; i++) {
        ctx.fillStyle = BANDS[i % BANDS.length];
        SA.circle(ctx, p.cx, p.cy, p.R - i * bh);
        ctx.fill();
      }
      // Swirls drifting along the bands as we fly.
      const span = W + 400;
      for (let i = 0; i < 26; i++) {
        const band = (i % 8) + 0.5;
        const sx = ((((i * 397 - camX * 1.0) % span) + span) % span) - 200;
        const y = this.horizonY(sx) + band * bh;
        ctx.fillStyle = i % 3 === 0 ? 'rgba(255,250,235,0.45)' : 'rgba(150,90,50,0.3)';
        SA.ellipse(ctx, sx, y, 36 + (i % 4) * 14, 6 + (i % 3) * 2);
        ctx.fill();
      }
      // The Great Red Spot.
      const gx = TARGETS[2].x - camX;
      if (gx > -200 && gx < W + 200) {
        const gy = this.horizonY(gx) + 48;
        ctx.fillStyle = '#b8472f';
        SA.ellipse(ctx, gx, gy, 100, 30); ctx.fill();
        ctx.fillStyle = '#d0603f';
        SA.ellipse(ctx, gx, gy, 72, 20); ctx.fill();
        ctx.strokeStyle = 'rgba(255,200,170,0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(gx, gy, 46, 12, 0, t * 1.5, t * 1.5 + 4.5);
        ctx.stroke();
        SA.label(ctx, 'Great Red Spot', gx, gy + 46, 16, '#ffd9c9');
      }
      // Night-side shading toward the edges.
      const sh = ctx.createRadialGradient(p.cx, p.cy - p.R, 0, p.cx, p.cy - p.R, W * 0.75);
      sh.addColorStop(0, 'rgba(0,0,0,0)');
      sh.addColorStop(1, 'rgba(10,6,30,0.55)');
      ctx.fillStyle = sh;
      ctx.fillRect(0, 0, W, SA.H);
      ctx.restore();
    }

    drawMoon(ctx, id, x, y, r) {
      const look = MOON_LOOK[id];
      ctx.save();
      SA.circle(ctx, x, y, r);
      ctx.fillStyle = look.base;
      ctx.fill();
      ctx.clip();
      const rnd = SA.seeded(id.length * 31 + r);
      for (let i = 0; i < 14; i++) {
        ctx.fillStyle = look.spots[i % look.spots.length];
        const a = rnd() * TAU, d = Math.sqrt(rnd()) * r;
        SA.circle(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, r * (0.05 + rnd() * 0.12));
        ctx.fill();
      }
      if (look.cracks) {
        ctx.strokeStyle = look.cracks;
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
          ctx.beginPath();
          ctx.moveTo(x - r + rnd() * r * 2, y - r);
          ctx.quadraticCurveTo(x - r + rnd() * r * 2, y, x - r + rnd() * r * 2, y + r);
          ctx.stroke();
        }
      }
      const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.1, x, y, r * 1.1);
      g.addColorStop(0, 'rgba(255,255,255,0.22)');
      g.addColorStop(0.6, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(5,6,25,0.6)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
      ctx.restore();
      SA.label(ctx, TARGETS.find(tg => tg.id === id).name, x, y + r + 20, 18, '#e8ecff');
    }

    // Camera viewfinder: fly through it to take the photo.
    drawFrame(ctx, x, y, t, isNext) {
      const s = 78 + Math.sin(t * 5) * 4, c = 26;
      ctx.strokeStyle = isNext ? '#ffe066' : 'rgba(255,224,102,0.5)';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        ctx.beginPath();
        ctx.moveTo(x + dx * s, y + dy * (s - c));
        ctx.lineTo(x + dx * s, y + dy * s);
        ctx.lineTo(x + dx * (s - c), y + dy * s);
        ctx.stroke();
      }
      if (isNext) {
        ctx.fillStyle = 'rgba(255,90,90,' + (0.5 + 0.5 * Math.sin(t * 6)) + ')';
        SA.circle(ctx, x + s - 14, y - s + 14, 6); ctx.fill();
        SA.label(ctx, '📸 Fly through!', x, y - s - 18, 17, '#ffe066');
      }
    }

    drawStorm(ctx, x, y, t, hit) {
      // Lightning flickers out of the cloud now and then.
      const bolt = (t % 1.7) < 0.18;
      if (bolt) {
        ctx.strokeStyle = '#fff6a8';
        ctx.lineWidth = 5;
        ctx.shadowColor = '#ffe066';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.moveTo(x - 6, y + 16);
        ctx.lineTo(x + 12, y + 44);
        ctx.lineTo(x - 4, y + 50);
        ctx.lineTo(x + 14, y + 84);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      const puffs = [[-34, 6, 30], [0, -8, 38], [34, 4, 30], [-16, 16, 28], [18, 18, 28]];
      for (const [dx, dy, r] of puffs) {
        ctx.fillStyle = hit ? '#5d5578' : '#4b3f6b';
        SA.circle(ctx, x + dx, y + dy, r); ctx.fill();
        ctx.fillStyle = 'rgba(190,170,255,0.25)';
        SA.circle(ctx, x + dx - r * 0.25, y + dy - r * 0.3, r * 0.55); ctx.fill();
      }
      if (bolt) {
        ctx.fillStyle = 'rgba(255,240,170,0.25)';
        SA.circle(ctx, x, y, 70); ctx.fill();
      }
    }

    // Five photo slots across the top; they fill in as photos are taken.
    drawFilmStrip(ctx) {
      const W = SA.W, n = TARGETS.length, size = 46, gap = 10;
      const total = n * size + (n - 1) * gap;
      const x0 = (W - total) / 2, y0 = 12;
      ctx.fillStyle = 'rgba(10,8,30,0.55)';
      SA.rrect(ctx, x0 - 10, y0 - 6, total + 20, size + 26, 14); ctx.fill();
      this.targets.forEach((tg, i) => {
        const x = x0 + i * (size + gap), y = y0;
        ctx.fillStyle = tg.done ? '#fff' : 'rgba(255,255,255,0.15)';
        SA.rrect(ctx, x, y, size, size, 6); ctx.fill();
        if (tg.done) this.drawThumb(ctx, tg.id, x + size / 2, y + size / 2, size * 0.36);
        else SA.label(ctx, tg.missed ? '✖' : '?', x + size / 2, y + size / 2, 22, tg.missed ? '#ff9b8a' : '#c9cff0', { stroke: false });
      });
      const k = SA.clamp(this.x / TRACK, 0, 1);
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(x0, y0 + size + 8, total, 4);
      ctx.fillStyle = '#ffe066';
      ctx.fillRect(x0, y0 + size + 8, total * k, 4);
    }

    drawThumb(ctx, id, x, y, r) {
      ctx.fillStyle = '#0d0f30';
      ctx.fillRect(x - r * 1.25, y - r * 1.25, r * 2.5, r * 2.5);
      if (id === 'grs') {
        ctx.fillStyle = '#e2c49a'; ctx.fillRect(x - r * 1.25, y - r * 0.4, r * 2.5, r * 1.65);
        ctx.fillStyle = '#c4553c'; SA.ellipse(ctx, x, y + r * 0.3, r * 0.8, r * 0.35); ctx.fill();
      } else {
        ctx.fillStyle = MOON_LOOK[id].base;
        SA.circle(ctx, x, y, r * 0.9); ctx.fill();
        ctx.fillStyle = MOON_LOOK[id].spots[0];
        SA.circle(ctx, x - r * 0.3, y - r * 0.1, r * 0.25); ctx.fill();
      }
    }

    drawFlyer(ctx, f) {
      const k = SA.easeInOut(f.t);
      const x = SA.lerp(f.x0, SA.W - 110, k), y = SA.lerp(f.y0, 30, k) - Math.sin(k * Math.PI) * 100;
      const s = 1 - k * 0.55;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((1 - k) * 0.3);
      ctx.fillStyle = '#fff';
      ctx.fillRect(-34 * s, -34 * s, 68 * s, 80 * s);
      this.drawThumb(ctx, f.id, 0, 0, 22 * s);
      ctx.restore();
    }
  }
  SA.JupiterScene = JupiterScene;
})(window.SA);
