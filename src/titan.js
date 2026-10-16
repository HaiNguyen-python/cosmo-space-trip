// Bonus mission: "Titan Drone Flight" (Titan, Saturn's biggest moon; opens after Saturn).
// Cosmo's drone floats down under a parachute through Titan's thick orange haze, then the child
// drags to fly it across the moon (the view scrolls along). Thick air and weak gravity make flying
// easy: let go and the drone just drifts slowly down. Five glowing science spots wait along the way:
// giant dunes, a methane rain cloud (catch 3 slow raindrops), a methane lake, the old Huygens probe
// among ice pebbles, and Selk Crater, where the real Dragonfly drone is headed. There is nothing to
// fail: the drone bumps softly off the ground, and an arrow always points to the next spot.
(function (SA) {
  const TAU = Math.PI * 2;
  const LEN = 4.4;   // the world is this many screens wide
  // Science spots, by fraction of the world's width. air: found in the sky rather than on the ground.
  const SITES = [
    { id: 'dunes', u: 0.15, name: 'Giant dunes',
      lines: ['Look at these giant dunes! 🏜️ Many are about 100 metres tall, as tall as a big building.', 'They\'re not made of sand like on Earth. Their dark grains are made of stuff that falls out of the hazy sky, a bit like coffee grounds!'] },
    { id: 'rain', u: 0.35, air: true, name: 'Methane rain',
      lines: ['Ooh, it\'s raining! 🌧️ Titan has clouds and rain, just like Earth...', '...but the raindrops are liquid methane, and they fall slowly, like snowflakes drifting down. Catch 3 raindrops with the drone! 💧'] },
    { id: 'lake', u: 0.56, hover: true, name: 'Methane lake',
      lines: ['A lake! 🌊 Titan is the only place we know, besides Earth, with lakes and seas on top of the ground.', 'But it isn\'t water! It\'s super cold liquid methane and ethane. On Earth, methane is a gas.'] },
    { id: 'huygens', u: 0.76, name: 'Huygens probe',
      lines: ['What\'s that? It\'s the Huygens probe! 📡 It landed on Titan in 2005. That\'s the farthest landing ever!', 'See the round pebbles? They\'re not rock. They\'re made of water ice, frozen as hard as rock!'] },
    { id: 'crater', u: 0.93, name: 'Selk Crater',
      lines: ['This is Selk Crater, where a space rock crashed into Titan long ago. 💥', 'A real drone called Dragonfly is being built to fly here! It should reach Titan in 2034, and it will hop from place to place, just like we did! 🚁'] },
  ];
  const DROPS_NEEDED = 3;

  class TitanScene {
    constructor() {
      this.fx = new SA.Particles();
      this.t = 0;
      const rnd = SA.seeded(66);
      // Round ice pebbles near the Huygens probe, and rocks scattered everywhere.
      this.pebbles = [];
      for (let i = 0; i < 26; i++) this.pebbles.push({ u: 0.73 + rnd() * 0.08, s: 4 + rnd() * 9, k: rnd() });
      this.rocks = [];
      for (let i = 0; i < 60; i++) this.rocks.push({ u: rnd(), s: 3 + rnd() * 7, k: rnd() });
      this.haze = [];
      for (let i = 0; i < 7; i++) this.haze.push({ y: 0.08 + rnd() * 0.5, h: 30 + rnd() * 60, sp: 4 + rnd() * 10, o: rnd() * 1000, a: 0.05 + rnd() * 0.08 });
    }

    layout() {
      const W = SA.W, H = SA.H;
      this.L = W * LEN;
      this.k = H / 720;
      this.top = H * 0.17;   // below the HUD chips
      this.trigger = (SA.easy() ? 130 : 95) * this.k;
      if (this.d) this.d.y = SA.clamp(this.d.y, this.top, this.groundY(this.d.x) - 40 * this.k);
    }
    resize() { this.layout(); }

    // ---------- The ground ----------
    // Gentle plains, a band of long dunes, a lake lying lower, and a crater bowl near the end.
    groundY(wx) {
      const H = SA.H, u = wx / this.L, k = this.k;
      const win = (a, b, e) => SA.clamp((u - a) / e, 0, 1) * SA.clamp((b - u) / e, 0, 1);
      let y = H * 0.83 + Math.sin(wx * 0.004) * 10 * k + Math.sin(wx * 0.011 + 1) * 5 * k;
      // Dunes: long ridges with sharp crests (1 - |cos| peaks to a point).
      y -= win(0.09, 0.24, 0.02) * Math.pow(1 - Math.abs(Math.cos(wx * 0.011)), 1.6) * 80 * k;
      y += win(0.5, 0.63, 0.015) * 26 * k;
      const c = (u - 0.93) / 0.045;
      if (Math.abs(c) < 1.6) y += (Math.abs(c) < 1 ? (1 - c * c) * 40 : 0) * k - Math.exp(-Math.pow(Math.abs(c) - 1, 2) * 18) * 24 * k;
      return y;
    }
    lake(wx) { const u = wx / this.L; return u > 0.505 && u < 0.625; }
    sitePos(s) {
      const x = s.u * this.L;
      return { x, y: s.air ? SA.H * 0.33 : this.groundY(x) - 70 * this.k };
    }

    enter() {
      SA.ui.setScene('game');
      SA.audio.music('titan');
      this.d = null;
      this.layout();
      this.phase = 'intro';
      this.found = {};
      this.foundN = 0;
      this.drops = [];
      this.caught = 0;
      this.quietT = 0;
      this.cam = 0;
      this.chute = 1;   // the parachute, until we land
      this.d = { x: SA.W * 0.4, y: -80 * this.k, vx: 0, vy: 0, tx: null, ty: null, sx: null, sy: null, tilt: 0, spin: 1 };
      this.dropT = 0;
      SA.ui.setInfo('🚁 Titan Drone Flight');
      SA.ui.banner('Titan', SA.NICKNAMES.titan).then(() => SA.scene !== this ? new Promise(() => {}) : SA.ui.say(SA.introLines('titan', [
        'Welcome to Titan, Saturn\'s biggest moon! 🟠 It\'s even bigger than the planet Mercury!',
        'Titan is wrapped in thick orange haze. Saturn is up there somewhere, but the haze hides it! And brrr, it\'s about −180 °C.',
        'Here the air is thick and gravity is weak, so flying is easy. That\'s why scientists are sending a drone! 🚁',
        'Drag your finger to fly. Let\'s visit 5 science spots! The glowing rings show the way. 👆',
      ]))).then(() => {
        if (SA.scene !== this) return;
        this.phase = 'play';
        this.chuteGo = true;
        SA.audio.play('pop');
        SA.ui.setInfo('🔬 Science 0 / ' + SITES.length);
        SA.ui.hint('Drag your finger to fly the drone! 👆', 5);
      });
    }

    exit() { SA.ui.hideTalk(); if (this.d) this.d.sx = null; }

    // ---------- Input ----------
    onDown(x, y) {
      if (this.phase !== 'play' && this.phase !== 'rain') return;
      this.steer(x, y);
      this.dragging = true;
    }
    onMove(x, y) { if (this.dragging) this.steer(x, y); }
    onUp() { this.dragging = false; this.d.sx = null; this.d.tx = null; }
    // The finger's spot on screen is kept, so holding near an edge keeps flying that way.
    steer(x, y) { this.d.sx = x; this.d.sy = y; }

    // ---------- Update ----------
    update(dt) {
      this.t += dt;
      this.fx.update(dt);
      const d = this.d, k = this.k, W = SA.W;
      if (this.phase === 'intro') {
        // Floating down under the parachute while Cosmo talks.
        d.y = SA.lerp(d.y, SA.H * 0.38, Math.min(1, dt * 0.6));
        d.x = SA.W * 0.4 + Math.sin(this.t * 0.7) * 20 * k;
        this.cam = 0;
      } else {
        if (this.chuteGo) this.chute = Math.max(0, this.chute - dt * 1.2);
        this.fly(dt);
      }
      // Rotors spin fast in flight and slow down when landed.
      d.spin = SA.lerp(d.spin, this.phase === 'visit' && this.landed ? 0.15 : 1, Math.min(1, dt * 2));
      // Kicked-up dust when flying low.
      const gy = this.groundY(d.x);
      if (gy - d.y < 90 * k && d.spin > 0.5 && !this.lake(d.x) && Math.random() < dt * (SA.calm() ? 5 : 14)) {
        this.fx.list.push({ kind: 'dot', x: d.x + SA.rand(-30, 30) * k, y: gy - 4, vx: SA.rand(-60, 60), vy: SA.rand(-30, -8), life: 0, max: SA.rand(0.6, 1.1), size: SA.rand(3, 7), rot: 0, color: 'rgba(120,70,30,0.45)' });
      }
      this.updateRain(dt);
      // The view follows the drone (a little ahead of it).
      const want = SA.clamp(d.x - W * 0.42, 0, this.L - W);
      this.cam = this.phase === 'intro' ? 0 : SA.lerp(this.cam, want, Math.min(1, dt * 3));
    }

    fly(dt) {
      const d = this.d, k = this.k;
      const gy = this.groundY(d.x), floor = gy - 40 * k;
      if (this.phase === 'land' || this.phase === 'lift' || (this.phase === 'visit' && this.landed)) {
        // Autopilot: down onto the science spot, then back up.
        const s = this.cur, p = this.sitePos(s);
        const ty = this.phase === 'lift' ? floor - 120 * k : floor + 6 * k;
        d.x = SA.lerp(d.x, p.x, Math.min(1, dt * 2.4));
        d.y = SA.lerp(d.y, ty, Math.min(1, dt * 2.4));
        d.vx = d.vy = 0;
        if (this.phase === 'land' && Math.abs(d.y - ty) < 3) {
          this.landed = true;
          this.phase = 'visit';
          SA.audio.play('land');
          for (let i = 0; i < (SA.calm() ? 6 : 14); i++) this.fx.spawn('dust', d.x + SA.rand(-30, 30), gy, 1, { color: 'rgba(130,80,40,0.5)' });
          this.tellSite(s);
        }
        if (this.phase === 'lift' && Math.abs(d.y - ty) < 6) { this.phase = 'play'; this.landed = false; this.afterSite(); }
      } else {
        // Steer toward the finger (in world space, so holding near an edge keeps going).
        let ax, ay;
        if (d.sx != null && (this.phase === 'play' || this.phase === 'rain')) {
          d.tx = this.cam + d.sx; d.ty = d.sy;
          const dx = d.tx - d.x, dy = d.ty - d.y, dist = Math.hypot(dx, dy);
          const max = (SA.easy() ? 320 : 270) * k;
          if (dist > 6) { ax = (dx / dist) * Math.min(max, dist * 2.6) - d.vx; ay = (dy / dist) * Math.min(max, dist * 2.6) - d.vy; }
          else { ax = -d.vx; ay = -d.vy; }
          ax *= 2.6; ay *= 2.6;
        } else {
          // Thick air and weak gravity: let go and the drone drifts slowly down, swaying a little.
          ax = -d.vx * 1.4 + Math.sin(this.t * 0.8) * 6 * k;
          ay = -d.vy * 1.4 + 22 * k;
        }
        d.vx += ax * dt; d.vy += ay * dt;
        d.x += d.vx * dt; d.y += d.vy * dt;
      }
      // Soft limits: the ground (a gentle bounce), the haze above, and the ends of the world.
      if (this.phase !== 'land' && !(this.phase === 'visit' && this.landed) && d.y > floor) { d.y = floor; d.vy = -Math.abs(d.vy) * 0.3; }
      if (d.y < this.top) { d.y = this.top; d.vy = Math.abs(d.vy) * 0.3; }
      d.x = SA.clamp(d.x, 60 * k, this.L - 60 * k);
      d.tilt = SA.lerp(d.tilt, SA.clamp(d.vx / 900, -0.3, 0.3), Math.min(1, dt * 5));
      if (this.phase !== 'play') return;
      this.quietT += dt;
      for (const s of SITES) {
        if (this.found[s.id]) continue;
        const p = this.sitePos(s);
        const near = s.air ? Math.abs(d.x - p.x) < this.trigger * 1.6 && d.y < SA.H * 0.62 : Math.hypot(d.x - p.x, d.y - p.y) < this.trigger;
        if (near) { this.discover(s); break; }
      }
    }

    discover(s) {
      this.found[s.id] = 1;
      this.foundN++;
      this.cur = s;
      this.quietT = 0;
      this.dragging = false;
      this.d.sx = null;
      const p = this.sitePos(s);
      SA.audio.play('collect');
      setTimeout(() => SA.audio.play('ding'), 150);
      this.fx.spawn('sparkle', p.x, p.y, SA.calm() ? 10 : 22, { color: '#ffe2a0' });
      this.fx.text(p.x, p.y - 60 * this.k, s.name + '!', '#fff3a0');
      SA.ui.setInfo('🔬 Science ' + this.foundN + ' / ' + SITES.length);
      SA.ui.bumpInfo();
      if (s.hover) {
        // Drones can't land on a lake, so we hover and dip a little sample cup instead.
        const ly = this.groundY(p.x);
        for (let i = 0; i < 3; i++) this.fx.list.push({ kind: 'ring', x: p.x, y: ly, vx: 0, vy: 0, life: -i * 0.25, max: 0.9, size: 6, rot: 0, color: 'rgba(255,200,140,0.8)', grow: 60 });
        SA.audio.play('bubble');
      }
      if (s.air || s.hover) { this.phase = 'visit'; this.landed = false; this.tellSite(s); }
      else { this.phase = 'land'; this.landed = false; }
    }

    tellSite(s) {
      SA.ui.say(s.lines).then(() => {
        if (SA.scene !== this) return;
        if (s.id === 'rain') {
          this.phase = 'rain';
          this.caught = 0;
          SA.ui.setInfo('💧 Raindrops 0 / ' + DROPS_NEEDED);
          SA.ui.hint('Fly into the falling raindrops to catch them! 💧', 0);
        } else if (this.landed) this.phase = 'lift';
        else { this.phase = 'play'; this.afterSite(); }
      });
    }

    // Back to flying: one more spot, or the end.
    afterSite() {
      if (this.foundN >= SITES.length) { this.finish(); return; }
      SA.ui.setInfo('🔬 Science ' + this.foundN + ' / ' + SITES.length);
      if (this.foundN === 1) SA.ui.hint('Great! Follow the arrow to the next glowing ring! ➡️', 5);
    }

    // ---------- Methane rain ----------
    updateRain(dt) {
      const k = this.k, rs = SITES[1], cx = rs.u * this.L, span = SA.W * 0.42;
      // Drops drift slowly down from the cloud (always, for the look; catchable while raining).
      this.dropT -= dt;
      if (this.dropT <= 0 && Math.abs(this.d.x - cx) < SA.W * 1.2) {
        this.dropT = this.phase === 'rain' ? (SA.easy() ? 0.28 : 0.38) : 0.5;
        this.drops.push({ x: cx + SA.rand(-span / 2, span / 2), y: SA.H * 0.27, vy: SA.rand(38, 55) * k, r: SA.rand(8, 12) * k, w: SA.rand(0, 6) });
      }
      const d = this.d, reach = (SA.easy() ? 58 : 44) * k;
      for (const p of this.drops) {
        p.y += p.vy * dt;
        p.x += Math.sin(this.t * 1.5 + p.w) * 6 * dt;
        if (this.phase === 'rain' && Math.hypot(p.x - d.x, p.y - d.y) < reach) {
          p.gone = true;
          this.caught++;
          SA.audio.play('bubble');
          this.fx.spawn('sparkle', p.x, p.y, 6, { color: '#ffd29a' });
          SA.ui.setInfo('💧 Raindrops ' + this.caught + ' / ' + DROPS_NEEDED);
          SA.ui.bumpInfo();
          if (this.caught >= DROPS_NEEDED) this.rainDone();
        }
        if (p.y > this.groundY(p.x) - 2) {
          p.gone = true;
          if (Math.abs(p.x - this.cam - SA.W / 2) < SA.W) this.fx.list.push({ kind: 'ring', x: p.x, y: p.y, vx: 0, vy: 0, life: 0, max: 0.5, size: 2, rot: 0, color: 'rgba(255,210,150,0.8)', grow: 14 });
        }
      }
      this.drops = this.drops.filter(p => !p.gone);
    }
    rainDone() {
      this.phase = 'visit';
      SA.ui.hideTalk();
      SA.audio.play('cheer');
      SA.ui.say('You caught 3 methane raindrops! 💧 On Titan, rain falls so slowly that you could almost walk between the drops!').then(() => {
        if (SA.scene !== this) return;
        this.phase = 'play';
        this.afterSite();
      });
    }

    async finish() {
      this.phase = 'done';
      SA.audio.play('cheer');
      SA.celebrate(110);
      await SA.ui.say([
        'You visited all 5 science spots on Titan! 🎉',
        'Titan is one of the most Earth-like places we know, with clouds, rain, rivers, lakes and dunes. But it\'s all super, super cold! 🥶',
      ]);
      if (SA.scene !== this) return;
      await SA.ui.banner('Mission Complete!', '🚁 You flew through Titan\'s orange sky', 'gold', 3);
      if (SA.scene !== this) return;
      SA.finishPlanet('titan', 3);
    }

    // ---------- Drawing ----------
    draw(ctx) {
      const W = SA.W, H = SA.H, t = this.t, cam = this.cam, k = this.k;
      // An orange sky, darker above and pale near the horizon.
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#9a4f1c');
      sky.addColorStop(0.45, '#d98a3e');
      sky.addColorStop(0.8, '#f2bd78');
      sky.addColorStop(1, '#f7cf92');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);
      // The Sun is just a dim glow through the haze.
      const sx = W * 0.75 - cam * 0.03, sy = H * 0.2;
      const sg = ctx.createRadialGradient(sx, sy, 2, sx, sy, 90 * k);
      sg.addColorStop(0, 'rgba(255,240,200,0.55)');
      sg.addColorStop(1, 'rgba(255,220,160,0)');
      ctx.fillStyle = sg;
      SA.circle(ctx, sx, sy, 90 * k); ctx.fill();
      // Drifting haze bands.
      for (const h of this.haze) {
        const y = h.y * H + Math.sin(t * 0.2 + h.o) * 8;
        const g = ctx.createLinearGradient(0, y - h.h, 0, y + h.h);
        g.addColorStop(0, 'rgba(255,200,130,0)');
        g.addColorStop(0.5, 'rgba(255,205,140,' + h.a + ')');
        g.addColorStop(1, 'rgba(255,200,130,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, y - h.h, W, h.h * 2);
      }
      this.drawHills(ctx, 0.25, H * 0.66, 'rgba(150,80,40,0.45)', 38, 0.0021);
      this.drawHills(ctx, 0.5, H * 0.72, 'rgba(120,62,30,0.6)', 30, 0.0034);
      this.drawCloud(ctx, t);
      this.drawGround(ctx, t);
      // The raindrops.
      ctx.fillStyle = 'rgba(255,236,200,0.85)';
      ctx.strokeStyle = 'rgba(140,70,30,0.8)';
      ctx.lineWidth = 2;
      for (const p of this.drops) {
        const x = p.x - cam;
        if (x < -20 || x > W + 20) continue;
        ctx.beginPath();
        ctx.moveTo(x, p.y - p.r * 1.5);
        ctx.quadraticCurveTo(x + p.r, p.y, x, p.y + p.r);
        ctx.quadraticCurveTo(x - p.r, p.y, x, p.y - p.r * 1.5);
        ctx.fill(); ctx.stroke();
      }
      this.drawSites(ctx, t);
      ctx.save();
      ctx.translate(-cam, 0);
      this.fx.draw(ctx);
      ctx.restore();
      this.drawDrone(ctx, this.d.x - cam, this.d.y, t);
      this.drawArrow(ctx, t);
      // Foreground haze, thicker while we float down.
      const fog = this.phase === 'intro' ? 0.3 : 0.08;
      ctx.fillStyle = 'rgba(240,170,100,' + fog + ')';
      ctx.fillRect(0, 0, W, H);
      if (this.phase === 'play' && this.foundN === 0 && this.d.sx == null && this.t % 6 < 4) {
        SA.emoji(ctx, '👆', this.d.x - cam + 120 * k + Math.sin(t * 2) * 30 * k, this.d.y + 70 * k, 40 * k);
      }
    }

    drawHills(ctx, par, base, col, amp, f) {
      const W = SA.W, H = SA.H, off = this.cam * par;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W + 20; x += 20) {
        const wx = x + off;
        ctx.lineTo(x, base - (Math.sin(wx * f) * 0.6 + Math.sin(wx * f * 2.3 + 2) * 0.4 + 1) * amp * this.k);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();
    }

    drawCloud(ctx, t) {
      const cx = SITES[1].u * this.L - this.cam, cy = SA.H * 0.24, k = this.k;
      if (cx < -SA.W * 0.4 || cx > SA.W * 1.4) return;
      ctx.fillStyle = 'rgba(150,90,60,0.55)';
      ctx.beginPath();
      for (const [dx, dy, r] of [[-170, 10, 50], [-110, -14, 64], [-30, -26, 78], [60, -18, 70], [140, -2, 56], [190, 14, 40], [0, 18, 70]]) {
        const x = cx + dx * k + Math.sin(t * 0.3 + dx) * 4, y = cy + dy * k, rr = r * k;
        ctx.moveTo(x + rr, y); ctx.arc(x, y, rr, 0, TAU);
      }
      ctx.fill();
      ctx.fillStyle = 'rgba(255,215,170,0.18)';
      SA.ellipse(ctx, cx - 30 * k, cy - 50 * k, 120 * k, 26 * k); ctx.fill();
    }

    drawGround(ctx, t) {
      const W = SA.W, H = SA.H, cam = this.cam, k = this.k;
      const g = ctx.createLinearGradient(0, H * 0.7, 0, H);
      g.addColorStop(0, '#8a5530');
      g.addColorStop(1, '#4e2c16');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W + 16; x += 16) ctx.lineTo(x, this.groundY(x + cam));
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();
      // Dune ridges: darker streaks along the crests.
      ctx.strokeStyle = 'rgba(60,32,14,0.35)';
      ctx.lineWidth = 3 * k;
      for (let x = 0; x <= W; x += 6) {
        const wx = x + cam, u = wx / this.L;
        if (u < 0.1 || u > 0.23) continue;
        if (Math.cos(wx * 0.011) * Math.cos((wx + 6) * 0.011) <= 0) {
          // The shady side of each crest.
          const y = this.groundY(wx);
          ctx.fillStyle = 'rgba(70,38,16,0.35)';
          ctx.beginPath(); ctx.moveTo(x, y + 1); ctx.lineTo(x + 90 * k, y + 52 * k); ctx.lineTo(x + 20 * k, y + 60 * k); ctx.closePath(); ctx.fill();
        }
      }
      // The lake: dark and glassy, with soft reflections of the orange sky.
      const lx0 = 0.505 * this.L - cam, lx1 = 0.625 * this.L - cam;
      if (lx1 > 0 && lx0 < W) {
        const ly = this.groundY(0.565 * this.L) - 4 * k;
        const lg = ctx.createLinearGradient(0, ly, 0, H);
        lg.addColorStop(0, '#3a2418');
        lg.addColorStop(1, '#1e120c');
        ctx.fillStyle = lg;
        ctx.beginPath();
        ctx.moveTo(lx0, ly + 10 * k);
        ctx.quadraticCurveTo((lx0 + lx1) / 2, ly - 6 * k, lx1, ly + 10 * k);
        ctx.lineTo(lx1 - 30 * k, ly + 44 * k);
        ctx.quadraticCurveTo((lx0 + lx1) / 2, ly + 70 * k, lx0 + 30 * k, ly + 44 * k);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,190,120,0.35)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
          const yy = ly + 8 * k + i * 8 * k, xx = (lx0 + lx1) / 2 + Math.sin(t * 0.8 + i) * 30 * k;
          ctx.beginPath(); ctx.moveTo(xx - (70 - i * 10) * k, yy); ctx.lineTo(xx + (70 - i * 10) * k, yy); ctx.stroke();
        }
      }
      // Rocks everywhere, and round ice pebbles by the Huygens probe.
      for (const r of this.rocks) {
        const x = r.u * this.L - cam;
        if (x < -20 || x > W + 20 || this.lake(r.u * this.L)) continue;
        ctx.fillStyle = r.k > 0.5 ? '#6b3f20' : '#a5764e';
        SA.ellipse(ctx, x, this.groundY(r.u * this.L) + r.s * 0.3, r.s * k, r.s * 0.6 * k); ctx.fill();
      }
      for (const p of this.pebbles) {
        const x = p.u * this.L - cam;
        if (x < -20 || x > W + 20) continue;
        const y = this.groundY(p.u * this.L) + 4 * k + p.k * 14 * k;
        ctx.fillStyle = '#cdd4dc';
        SA.ellipse(ctx, x, y, p.s * k, p.s * 0.7 * k); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        SA.ellipse(ctx, x - p.s * 0.3 * k, y - p.s * 0.25 * k, p.s * 0.35 * k, p.s * 0.2 * k); ctx.fill();
      }
      // The Huygens probe: a round shell sitting on the plain.
      const hx = SITES[3].u * this.L - cam + 40 * k;
      if (hx > -60 && hx < W + 60) {
        const hy = this.groundY(hx + cam) + 2;
        ctx.fillStyle = '#c9cdd6'; ctx.strokeStyle = '#5d6984'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.ellipse(hx, hy - 10 * k, 30 * k, 14 * k, 0, Math.PI, TAU); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#e0a420';
        ctx.fillRect(hx - 30 * k, hy - 12 * k, 60 * k, 8 * k);
        ctx.strokeRect(hx - 30 * k, hy - 12 * k, 60 * k, 8 * k);
        ctx.beginPath(); ctx.moveTo(hx + 10 * k, hy - 22 * k); ctx.lineTo(hx + 18 * k, hy - 40 * k); ctx.stroke();
        ctx.fillStyle = '#eef1f8'; SA.circle(ctx, hx + 18 * k, hy - 42 * k, 4 * k); ctx.fill();
      }
    }

    drawSites(ctx, t) {
      const k = this.k;
      for (const s of SITES) {
        const p = this.sitePos(s), x = p.x - this.cam;
        if (x < -120 || x > SA.W + 120) continue;
        if (this.found[s.id]) {
          // A little flag shows where we've been.
          if (!s.air && !s.hover) {
            const gy = this.groundY(p.x);
            ctx.strokeStyle = '#eef1f8'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(x + 46 * k, gy); ctx.lineTo(x + 46 * k, gy - 40 * k); ctx.stroke();
            ctx.fillStyle = '#7ee08a';
            ctx.beginPath(); ctx.moveTo(x + 46 * k, gy - 40 * k); ctx.lineTo(x + 66 * k, gy - 33 * k); ctx.lineTo(x + 46 * k, gy - 26 * k); ctx.closePath(); ctx.fill();
          }
          continue;
        }
        // A glowing target ring with pulses, and its name.
        const next = SITES.find(o => !this.found[o.id]) === s;
        for (const off of [0, 0.5]) {
          const u = (t * 0.7 + off) % 1;
          ctx.strokeStyle = 'rgba(255,240,170,' + (1 - u) * (next ? 0.9 : 0.45) + ')';
          ctx.lineWidth = 3 * (1 - u) + 1;
          SA.ellipse(ctx, x, p.y, (34 + u * 30) * k, (s.air ? 34 + u * 30 : 14 + u * 10) * k); ctx.stroke();
        }
        const glow = ctx.createRadialGradient(x, p.y, 2, x, p.y, 46 * k);
        glow.addColorStop(0, 'rgba(255,245,200,0.5)');
        glow.addColorStop(1, 'rgba(255,240,180,0)');
        ctx.fillStyle = glow;
        SA.circle(ctx, x, p.y, 46 * k); ctx.fill();
        SA.label(ctx, next ? s.name : '?', x, p.y - 48 * k + Math.sin(t * 2) * 3, 17 * k, '#fff3c4');
      }
    }

    // When the next spot is off screen, an arrow at the edge points the way.
    drawArrow(ctx, t) {
      if (this.phase !== 'play') return;
      const s = SITES.find(o => !this.found[o.id]);
      if (!s) return;
      const p = this.sitePos(s), x = p.x - this.cam, k = this.k;
      if (x > -20 && x < SA.W + 20) return;
      const right = x > SA.W, ax = right ? SA.W - 46 * k : 46 * k, ay = SA.H * 0.5 + Math.sin(t * 3) * 6;
      ctx.save();
      ctx.translate(ax + Math.sin(t * 5) * 5 * (right ? 1 : -1), ay);
      if (!right) ctx.scale(-1, 1);
      ctx.fillStyle = '#ffe066';
      ctx.strokeStyle = '#7a5200';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(26 * k, 0); ctx.lineTo(0, -22 * k); ctx.lineTo(0, -10 * k); ctx.lineTo(-24 * k, -10 * k);
      ctx.lineTo(-24 * k, 10 * k); ctx.lineTo(0, 10 * k); ctx.lineTo(0, 22 * k); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.restore();
    }

    // Cosmo's drone: four rotors on arms, landing skids, and Cosmo in the round window.
    drawDrone(ctx, x, y, t) {
      const d = this.d, k = this.k * 1.1;
      // The parachute, while floating down.
      if (this.chute > 0) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, this.chute * 1.5);
        const cy = y - 120 * k - (1 - this.chute) * 80 * k;
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.5;
        for (const dx of [-60, -20, 20, 60]) { ctx.beginPath(); ctx.moveTo(x + dx * k, cy); ctx.lineTo(x, y - 24 * k); ctx.stroke(); }
        ctx.beginPath();
        ctx.moveTo(x - 66 * k, cy);
        ctx.quadraticCurveTo(x, cy - 80 * k, x + 66 * k, cy);
        for (let i = 3; i >= 0; i--) ctx.quadraticCurveTo(x - 66 * k + (i + 0.5) * 33 * k, cy + 10 * k, x - 66 * k + i * 33 * k, cy);
        ctx.closePath();
        const pg = ctx.createLinearGradient(x - 66 * k, 0, x + 66 * k, 0);
        pg.addColorStop(0, '#ff5d6c'); pg.addColorStop(0.5, '#fff6e8'); pg.addColorStop(1, '#ff5d6c');
        ctx.fillStyle = pg; ctx.fill();
        ctx.strokeStyle = '#a8283a'; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
      }
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(d.tilt);
      ctx.scale(k, k);
      ctx.lineCap = 'round';
      // Skids and arms.
      ctx.strokeStyle = '#5d6984'; ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-26, 24); ctx.lineTo(-20, 12); ctx.moveTo(26, 24); ctx.lineTo(20, 12);
      ctx.moveTo(-36, 24); ctx.lineTo(-14, 24); ctx.moveTo(14, 24); ctx.lineTo(36, 24);
      ctx.moveTo(-16, -8); ctx.lineTo(-40, -22); ctx.moveTo(16, -8); ctx.lineTo(40, -22);
      ctx.stroke();
      // Rotors: blurry discs when fast, two blades when slow.
      for (const rx of [-40, 40]) {
        if (d.spin > 0.5) {
          ctx.fillStyle = 'rgba(230,235,250,' + 0.45 * d.spin + ')';
          SA.ellipse(ctx, rx, -24, 30, 6); ctx.fill();
          ctx.strokeStyle = 'rgba(120,130,160,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
        }
        const a = t * 40 * d.spin;
        ctx.strokeStyle = '#4b5470'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(rx - Math.cos(a) * 28, -24); ctx.lineTo(rx + Math.cos(a) * 28, -24); ctx.stroke();
        ctx.fillStyle = '#4b5470'; SA.circle(ctx, rx, -24, 4); ctx.fill();
      }
      // Body.
      const bg = ctx.createLinearGradient(0, -18, 0, 16);
      bg.addColorStop(0, '#fff3c4');
      bg.addColorStop(1, '#e0a420');
      ctx.fillStyle = bg;
      ctx.strokeStyle = '#8a5a00'; ctx.lineWidth = 3;
      SA.rrect(ctx, -30, -18, 60, 34, 12); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#c8641e';
      ctx.fillRect(-30, 4, 60, 5);
      // Window with Cosmo.
      ctx.fillStyle = '#9fb2d9';
      SA.circle(ctx, 0, -2, 14); ctx.fill();
      ctx.fillStyle = '#16204a';
      SA.circle(ctx, 0, -2, 11); ctx.fill();
      ctx.save();
      SA.circle(ctx, 0, -2, 11); ctx.clip();
      SA.drawCosmo(ctx, 0, 4, 0.24, { t, noBob: true, hat: 'none', mood: this.phase === 'visit' ? 'joy' : null });
      ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      SA.ellipse(ctx, -5, -8, 4, 2.4, -0.6); ctx.fill();
      // A blinking light.
      ctx.fillStyle = Math.floor(t * 2) % 2 ? '#ff5d6c' : '#7ee08a';
      SA.circle(ctx, 24, -12, 3); ctx.fill();
      ctx.restore();
    }
  }
  SA.TitanScene = TitanScene;
})(window.SA);
