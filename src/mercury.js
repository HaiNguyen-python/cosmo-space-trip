// Mercury mission: "Sunrise Escape". Mercury has almost no air, so the sunny side is scorching
// and the night side is freezing. Sunrise creeps so slowly there that you could walk to stay
// ahead of it. The child drags Cosmo to stay in the comfy twilight glow; the walk (and the
// discoveries) only move forward while Cosmo is comfy. Nothing is ever lost.
(function (SA) {
  const TAU = Math.PI * 2;
  const WALK = 140;          // walking speed while comfy, px/s
  const TRACK = 4700;
  const ITEMS = [
    { x: 700, icon: '🕳️', name: 'Craters', fact: 'Mercury is covered in craters, just like our Moon!' },
    { x: 1500, icon: '☀️', name: 'Giant Sun', fact: 'Look at the giant Sun! From Mercury, it looks about 3 times bigger than from Earth.' },
    { x: 2300, icon: '⛰️', name: 'Wrinkle ridge', fact: 'A wrinkle ridge! Mercury shrank a little as it cooled, so its ground got wrinkles.' },
    { x: 3100, icon: '🧊', name: 'Hidden ice', fact: 'Ice! Some deep craters on Mercury never get sunlight, so ice can hide inside them.' },
    { x: 3900, icon: '🛰️', name: 'MESSENGER', fact: 'MESSENGER! This spacecraft went around Mercury for 4 years and mapped the whole planet.' },
  ];

  class MercuryScene {
    constructor() {
      this.stars = new SA.Starfield(200, 51);
      this.fx = new SA.Particles();
      this.t = 0;
      const rnd = SA.seeded(23);
      this.craters = [];
      for (let i = 0; i < 70; i++) this.craters.push({ x: rnd() * (TRACK + 2000) - 400, w: 30 + rnd() * 90, d: rnd() * 30 });
    }

    enter(opts) {
      SA.ui.setScene('game');
      SA.audio.music('mercury');
      // Expert mission "Tricky Twilight": a thinner, faster-wiggling comfy band and new facts.
      this.expert = !!(opts && opts.expert);
      const E = SA.EXPERT.mercury;
      this.phase = 'intro';
      this.dist = 0;
      this.x = SA.W * 0.5;
      this.aimX = this.x;
      this.zone = 'comfy';
      this.zoneT = 0;
      this.got = 0;
      this.flyers = [];
      this.items = ITEMS.map((it, i) => Object.assign({ got: false, missed: false }, it, this.expert ? E.items[i] : null));
      this.updateInfo();
      SA.ui.banner('Mercury', this.expert ? '🎓 Expert: ' + E.name : SA.NICKNAMES.mercury).then(() => SA.scene !== this ? new Promise(() => {}) : SA.ui.say(this.expert ? E.intro : SA.introLines('mercury', [
        'Welcome to Mercury, the closest planet to the Sun! ☀️',
        'There\'s almost no air here, so the sky is black even in the daytime. The sunny side is 430 °C, and the night side is −180 °C!',
        'Sunrise moves so slowly here that you could walk to stay ahead of it! Drag Cosmo to stay in the comfy orange glow. 🧡',
      ]))).then(() => {
        if (SA.scene !== this) return;
        this.phase = 'walk';
        SA.ui.hint('Drag Cosmo to stay in the orange glow! 👆', 4);
      });
    }

    exit() { SA.ui.hideTalk(); }

    updateInfo() { SA.ui.setInfo('🔍 Found ' + this.got + ' / ' + ITEMS.length); }

    groundY() { return SA.H * 0.8; }
    bandW() { return SA.H * (SA.easy() ? 0.5 : this.expert ? 0.27 : 0.34); }
    // The twilight band drifts as the sunrise speeds up and slows down (faster in the Expert mission).
    bandX() {
      const W = SA.W, t = this.t * (this.expert ? 1.45 : 1);
      return W * 0.52 + Math.sin(t * 0.33) * W * 0.2 + Math.sin(t * 0.13 + 1) * W * 0.07;
    }

    onDown(x) { if (this.phase === 'walk') this.aimX = x; }
    onMove(x) { if (this.phase === 'walk') this.aimX = x; }

    update(dt) {
      this.t += dt;
      this.fx.update(dt);
      for (const f of this.flyers) {
        f.t += dt * 1.4;
        if (f.t >= 1 && !f.done) { f.done = true; SA.audio.play('pop'); SA.ui.bumpInfo(); }
      }
      this.flyers = this.flyers.filter(f => f.t < 1.05);
      if (this.phase !== 'walk') return;

      // Cosmo walks toward the finger.
      const dx = SA.clamp(this.aimX, 60, SA.W - 60) - this.x;
      this.x += SA.clamp(dx, -380 * dt, 380 * dt);

      const bx = this.bandX(), half = this.bandW() / 2;
      const zone = this.x < bx - half ? 'hot' : this.x > bx + half ? 'cold' : 'comfy';
      if (zone !== this.zone) {
        this.zone = zone;
        this.zoneT = 0;
        if (zone === 'comfy') SA.audio.play('blip');
      }
      this.zoneT += dt;
      if (zone === 'comfy') {
        this.dist += WALK * dt;
      } else {
        if (this.zoneT > 0.8 && this.zoneT - dt <= 0.8) {
          SA.ui.hint(zone === 'hot' ? 'Too hot! 🥵 Move right, toward the shade!' : 'Brrr, too cold! 🥶 Move left, toward the warm glow!', 3);
        }
        if (Math.random() < 0.3) {
          this.fx.spawn('sparkle', this.x + SA.rand(-20, 20), this.groundY() - 70, 1, { color: zone === 'hot' ? '#ff8a3a' : '#bfe8ff' });
        }
      }

      // Discoveries scroll in with the walk; Cosmo picks them up when close.
      for (const it of this.items) {
        if (it.got || it.missed) continue;
        const sx = it.x - this.dist + SA.W * 0.5;
        if (Math.abs(sx - this.x) < 46) {
          it.got = true;
          this.got++;
          this.updateInfo();
          SA.audio.play('collect');
          this.fx.spawn('sparkle', sx, this.groundY() - 60, 18);
          this.fx.text(sx, this.groundY() - 120, it.icon + ' ' + it.name, '#ffe066');
          this.flyers.push({ icon: it.icon, x0: sx, y0: this.groundY() - 60, t: 0 });
          SA.ui.hint(it.fact, 6);
        } else if (sx < -40) {
          it.missed = true;
        }
      }
      if (this.dist >= TRACK) this.finish();
    }

    async finish() {
      this.phase = 'done';
      SA.audio.play('cheer');
      SA.celebrate(120);
      const stars = this.got === ITEMS.length ? 3 : this.got >= 3 ? 2 : 1;
      await SA.ui.banner('Mission Complete!', '🔍 ' + this.got + ' of ' + ITEMS.length + ' discoveries', 'gold', stars);
      if (SA.scene !== this) return;
      if (this.expert) {
        await SA.ui.say(SA.EXPERT.mercury.outro);
        SA.finishExpert('mercury', stars);
        return;
      }
      await SA.ui.say([
        'We walked with the sunrise all the way across Mercury! 🎉',
        'Mercury is the smallest planet, and a year there lasts only 88 Earth days!',
      ]);
      SA.finishPlanet('mercury', stars);
    }

    // ---------- Drawing ----------
    draw(ctx) {
      const W = SA.W, H = SA.H, t = this.t, gy = this.groundY();
      const bx = this.bandX(), half = this.bandW() / 2;

      // No air, so the sky is black even in the day.
      ctx.fillStyle = '#04040e';
      ctx.fillRect(0, 0, W, H);
      this.stars.draw(ctx, t, this.dist * 0.05);

      // The giant Sun on the left horizon.
      const sr = H * 0.5, sx = -W * 0.06, sy = H * 0.5;
      SA.drawBody(ctx, 'sun', sx, sy, sr, { t });

      // Ground with scrolling craters.
      const g = ctx.createLinearGradient(0, gy, 0, H);
      g.addColorStop(0, '#9a9592');
      g.addColorStop(1, '#5e5a58');
      ctx.fillStyle = g;
      ctx.fillRect(0, gy, W, H - gy);
      for (const c of this.craters) {
        const x = c.x - this.dist + W * 0.5;
        if (x < -120 || x > W + 120) continue;
        const y = gy + 18 + c.d * 2.5;
        ctx.fillStyle = 'rgba(60,56,55,0.6)';
        SA.ellipse(ctx, x, y, c.w * 0.5, c.w * 0.12); ctx.fill();
        ctx.fillStyle = 'rgba(220,215,210,0.35)';
        SA.ellipse(ctx, x, y - c.w * 0.06, c.w * 0.5, c.w * 0.05); ctx.fill();
      }
      ctx.fillStyle = '#b5b0ac';
      ctx.fillRect(0, gy - 3, W, 5);

      // Day, twilight and night lighting.
      const k = v => SA.clamp(v / W, 0, 1);
      const light = ctx.createLinearGradient(0, 0, W, 0);
      light.addColorStop(0, 'rgba(255,240,180,0.45)');
      light.addColorStop(k(bx - half - 40), 'rgba(255,220,140,0.3)');
      light.addColorStop(k(bx), 'rgba(255,140,60,0.18)');
      light.addColorStop(k(bx + half + 40), 'rgba(10,20,70,0.45)');
      light.addColorStop(1, 'rgba(5,10,50,0.7)');
      ctx.fillStyle = light;
      ctx.fillRect(0, 0, W, H);

      // The comfy band, glowing on the ground.
      ctx.save();
      ctx.translate(bx, gy);
      ctx.scale(1, 1.5);
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, half * 1.1);
      glow.addColorStop(0, 'rgba(255,170,80,0.45)');
      glow.addColorStop(1, 'rgba(255,170,80,0)');
      ctx.fillStyle = glow;
      SA.circle(ctx, 0, 0, half * 1.1); ctx.fill();
      ctx.restore();
      SA.label(ctx, '🧡 comfy zone', bx, gy + 30, 16, '#ffd29a', { weight: 700 });
      SA.label(ctx, '🔥 Sunny side: 430 °C', W * 0.22, H * 0.2, 20, '#ffe08a');
      SA.label(ctx, 'Night side: −180 °C 🥶', W * 0.72, H * 0.2, 20, '#bfe8ff');

      // Discoveries waiting on the ground.
      for (const it of this.items) {
        if (it.got) continue;
        const x = it.x - this.dist + W * 0.5;
        if (x < -60 || x > W + 60) continue;
        const pulse = 0.6 + 0.4 * Math.sin(t * 4 + it.x);
        const beam = ctx.createLinearGradient(0, gy - 170, 0, gy);
        beam.addColorStop(0, 'rgba(255,240,150,0)');
        beam.addColorStop(1, 'rgba(255,240,150,' + 0.45 * pulse + ')');
        ctx.fillStyle = beam;
        ctx.fillRect(x - 18, gy - 170, 36, 170);
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        SA.circle(ctx, x, gy - 60, 26); ctx.fill();
        ctx.strokeStyle = '#ffd84d';
        ctx.lineWidth = 4;
        ctx.stroke();
        SA.emoji(ctx, it.icon, x, gy - 59, 28);
      }

      this.fx.draw(ctx);
      this.drawWalker(ctx, t, gy);
      this.drawThermo(ctx, bx, half);
      this.drawProgress(ctx);
      for (const f of this.flyers) {
        const e = SA.easeInOut(f.t);
        const x = SA.lerp(f.x0, W - 110, e), y = SA.lerp(f.y0, 30, e) - Math.sin(e * Math.PI) * 100;
        SA.emoji(ctx, f.icon, x, y, 34 * (1 - e * 0.5));
      }
    }

    drawWalker(ctx, t, gy) {
      const moving = this.phase === 'walk' && this.zone === 'comfy';
      const step = moving ? Math.abs(Math.sin(t * 8)) * 6 : 0;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      SA.ellipse(ctx, this.x, gy + 2, 34, 7); ctx.fill();
      const tint = this.zone === 'hot' ? 'rgba(255,90,40,0.35)' : this.zone === 'cold' ? 'rgba(140,200,255,0.4)' : null;
      if (tint) {
        const halo = ctx.createRadialGradient(this.x, gy - 45, 10, this.x, gy - 45, 80);
        halo.addColorStop(0, tint);
        halo.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = halo;
        SA.circle(ctx, this.x, gy - 45, 80); ctx.fill();
      }
      SA.drawCosmo(ctx, this.x, gy - 46 - step, 1, { t, noBob: true, mood: this.zone === 'comfy' ? 'happy' : 'wow', wave: !moving && this.zone === 'comfy' });
    }

    drawThermo(ctx, bx, half) {
      const x = SA.W - 46, y0 = SA.H * 0.22, y1 = SA.H * 0.62;
      // Needle position: hot at the top, cold at the bottom, comfy in the middle.
      const rel = SA.clamp((bx - this.x) / (half * 3), -1, 1);
      const ny = SA.lerp((y0 + y1) / 2, rel > 0 ? y0 + 10 : y1 - 10, Math.abs(rel));
      const g = ctx.createLinearGradient(0, y0, 0, y1);
      g.addColorStop(0, '#ff4d2e');
      g.addColorStop(0.5, '#7ee08a');
      g.addColorStop(1, '#4fa3f0');
      ctx.fillStyle = g;
      SA.rrect(ctx, x - 10, y0, 20, y1 - y0, 10); ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(x - 18, ny); ctx.lineTo(x - 32, ny - 9); ctx.lineTo(x - 32, ny + 9); ctx.closePath();
      ctx.fill();
      const label = this.zone === 'hot' ? '🥵' : this.zone === 'cold' ? '🥶' : '😊';
      SA.emoji(ctx, label, x, y1 + 26, 30);
    }

    drawProgress(ctx) {
      const W = SA.W, w = SA.topBarW(), x = (W - w) / 2, y = 34;
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      SA.rrect(ctx, x, y - 9, w, 18, 9); ctx.fill();
      const k = SA.clamp(this.dist / TRACK, 0, 1);
      ctx.fillStyle = '#ffb347';
      SA.rrect(ctx, x, y - 9, Math.max(18, w * k), 18, 9); ctx.fill();
      for (const it of this.items) {
        const ix = x + w * (it.x / TRACK);
        ctx.fillStyle = it.got ? '#7ee08a' : it.missed ? 'rgba(255,255,255,0.3)' : '#fff';
        SA.circle(ctx, ix, y, 5); ctx.fill();
      }
      SA.emoji(ctx, '🏁', x + w + 18, y, 26);
    }
  }
  SA.MercuryScene = MercuryScene;
})(window.SA);
