// Uranus mission: "Gravity Slingshot". Pull back the probe and let go, like Voyager 2.
// Uranus's gravity bends each path, so the child learns to aim curving shots to photograph
// the five big moons. A dotted line previews the path. Every shot is free; nothing is lost.
(function (SA) {
  const TAU = Math.PI * 2;
  const GM = 1.4e7;          // gravity strength (px^3/s^2)
  const HIT = 24;            // extra catch distance around each moon (kind to small fingers)
  const POWER = 3.6;         // launch speed per px of pull
  const MAX_PULL = 190;
  const SHOT_TIME = 7;
  const MOONS = [
    { id: 'miranda', name: 'Miranda', d: 0.18, a: -150, r: 13, color: '#bdb6ae',
      fact: 'Snap! Miranda has the tallest cliff in the Solar System, about 20 kilometres high!' },
    { id: 'ariel', name: 'Ariel', d: 0.24, a: 20, r: 16, color: '#ddd8d0',
      fact: 'Snap! Ariel is the brightest of Uranus\'s big moons, with long valleys across it.' },
    { id: 'umbriel', name: 'Umbriel', d: 0.3, a: 140, r: 16, color: '#77706a',
      fact: 'Snap! Umbriel is the darkest of Uranus\'s big moons.' },
    { id: 'titania', name: 'Titania', d: 0.38, a: -60, r: 21, color: '#c9b8a8',
      fact: 'Snap! Titania is Uranus\'s biggest moon.' },
    { id: 'oberon', name: 'Oberon', d: 0.44, a: 75, r: 20, color: '#a89a8e',
      fact: 'Snap! Oberon is the farthest of the big moons, and it\'s covered in old craters.' },
  ];

  class UranusScene {
    constructor() {
      this.stars = new SA.Starfield(260, 61);
      this.fx = new SA.Particles();
      this.t = 0;
    }

    layout() {
      const W = SA.W, H = SA.H;
      this.planet = { x: W * 0.6, y: H * 0.5, r: H * 0.11 };
      this.launcher = { x: W * 0.1, y: H * 0.7 };
      for (const m of this.moons) {
        const a = m.a * Math.PI / 180;
        m.x = this.planet.x + Math.cos(a) * m.d * H;
        m.y = this.planet.y + Math.sin(a) * m.d * H * 0.92;
      }
    }

    resize() { if (this.moons) this.layout(); }

    enter(opts) {
      SA.ui.setScene('game');
      SA.audio.music('uranus');
      // Expert mission "Short Guide": the dotted guide shows only the start of the path; new facts.
      this.expert = !!(opts && opts.expert);
      const E = SA.EXPERT.uranus;
      this.moons = MOONS.map(m => Object.assign({ got: false }, m, this.expert ? { fact: E.facts[m.id] } : null));
      this.layout();
      this.phase = 'intro';
      this.got = 0;
      this.shots = 0;
      this.aiming = false;
      this.pull = null;
      this.probe = null;
      this.trail = [];
      this.flash = 0;
      this.crashed = false;
      this.updateInfo();
      SA.ui.banner('Uranus', this.expert ? '🎓 Expert: ' + E.name : SA.NICKNAMES.uranus).then(() => SA.scene !== this ? new Promise(() => {}) : SA.ui.say(this.expert ? E.intro : SA.introLines('uranus', [
        'Welcome to Uranus, the sideways planet! It spins tipped over on its side. 🎳',
        'Only one spacecraft has ever visited: Voyager 2, in 1986. Let\'s fly like Voyager!',
        'Pull back the probe and let go. Uranus\'s gravity will bend its path! Photograph all 5 big moons. 📸',
      ]))).then(() => {
        if (SA.scene !== this) return;
        this.phase = 'aim';
        SA.ui.hint('Pull back from the probe, then let go! 👆', 4);
      });
    }

    exit() { SA.ui.hideTalk(); }

    updateInfo() { SA.ui.setInfo('📸 Moons ' + this.got + ' / ' + MOONS.length); }

    // ---------- Aiming ----------
    onDown(x, y) {
      if (this.phase !== 'aim' || this.probe) return;
      this.aiming = true;
      this.setPull(x, y);
    }
    onMove(x, y) { if (this.aiming) this.setPull(x, y); }
    onUp() {
      if (!this.aiming) return;
      this.aiming = false;
      const p = this.pull;
      if (!p || Math.hypot(p.x, p.y) < 18) { this.pull = null; return; }
      this.launch(p.x * POWER, p.y * POWER);
      this.pull = null;
    }

    // Pull vector points from the finger back toward the launcher (slingshot style).
    setPull(x, y) {
      let dx = this.launcher.x - x, dy = this.launcher.y - y;
      const len = Math.hypot(dx, dy);
      if (len > MAX_PULL) { dx *= MAX_PULL / len; dy *= MAX_PULL / len; }
      this.pull = { x: dx, y: dy };
    }

    launch(vx, vy) {
      this.shots++;
      this.probe = { x: this.launcher.x, y: this.launcher.y, vx, vy, t: 0, snaps: 0 };
      this.trail = [];
      SA.audio.play('launch');
    }

    step(p, dt) {
      const dx = this.planet.x - p.x, dy = this.planet.y - p.y;
      const r2 = Math.max(dx * dx + dy * dy, 400);
      const r = Math.sqrt(r2);
      const a = (SA.easy() ? GM * 0.75 : GM) / r2;
      p.vx += (dx / r) * a * dt;
      p.vy += (dy / r) * a * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      return r;
    }

    // Where the probe would go: used for the dotted guide line.
    predict() {
      const p = { x: this.launcher.x, y: this.launcher.y, vx: this.pull.x * POWER, vy: this.pull.y * POWER };
      const pts = [];
      for (let i = 0; i < 150; i++) {
        let r = 0;
        for (let k = 0; k < 2; k++) r = this.step(p, 1 / 120);
        if (r < this.planet.r) break;
        if (i % 3 === 0) pts.push([p.x, p.y]);
      }
      return pts;
    }

    update(dt) {
      this.t += dt;
      this.fx.update(dt);
      this.flash = Math.max(0, this.flash - dt * 3);
      const p = this.probe;
      if (!p) return;
      p.t += dt;
      const sub = 8;
      for (let i = 0; i < sub; i++) {
        const r = this.step(p, dt / sub);
        if (r < this.planet.r) { this.endShot('crash'); return; }
        for (const m of this.moons) {
          if (!m.got && Math.hypot(p.x - m.x, p.y - m.y) < m.r + (SA.easy() ? HIT * 1.7 : HIT)) this.snap(m, p);
        }
      }
      this.trail.push([p.x, p.y]);
      if (this.trail.length > 90) this.trail.shift();
      const W = SA.W, H = SA.H;
      if (p.t > SHOT_TIME || p.x < -160 || p.x > W + 160 || p.y < -160 || p.y > H + 160) this.endShot('away');
    }

    snap(m, p) {
      m.got = true;
      this.got++;
      p.snaps++;
      this.updateInfo();
      this.flash = 1;
      SA.audio.play('shutter');
      setTimeout(() => SA.audio.play('collect'), 150);
      this.fx.spawn('sparkle', m.x, m.y, 20);
      this.fx.text(m.x, m.y - 40, p.snaps > 1 ? '📸 Double snap!' : '📸 ' + m.name, '#ffe066');
      SA.ui.hint(m.fact, 6);
    }

    endShot(why) {
      const p = this.probe;
      this.fx.spawn('sparkle', p.x, p.y, 10, { color: why === 'crash' ? '#bff4ff' : '#ffffff' });
      this.probe = null;
      if (why === 'crash' && !this.crashed) {
        this.crashed = true;
        SA.audio.play('bump');
        SA.ui.hint('Whoa! Uranus\'s gravity pulled the probe in. Try a different aim! 🌀', 4);
      }
      if (this.got === MOONS.length) { this.phase = 'done'; setTimeout(() => { if (SA.scene === this) this.finish(); }, 1500); }
    }

    async finish() {
      SA.audio.play('cheer');
      SA.celebrate(120);
      const stars = this.shots <= 10 ? 3 : this.shots <= 20 ? 2 : 1;
      await SA.ui.banner('Mission Complete!', '📸 All 5 moons in ' + this.shots + ' shots', 'gold', stars);
      if (SA.scene !== this) return;
      if (this.expert) {
        await SA.ui.say(SA.EXPERT.uranus.outro);
        SA.finishExpert('uranus', stars);
        return;
      }
      await SA.ui.say([
        'You photographed all 5 big moons, just like Voyager 2! 🎉',
        'Uranus is the coldest planet of all: about −224 °C at the top of its clouds! 🥶',
        'And its moons are named after characters from famous plays and poems. 🎭',
      ]);
      SA.finishPlanet('uranus', stars);
    }

    // ---------- Drawing ----------
    draw(ctx) {
      const W = SA.W, H = SA.H, t = this.t;
      SA.spaceBg(ctx, '#040a1c', '#0d1a3a');
      this.stars.draw(ctx, t, 0);
      const pl = this.planet;

      // Moon orbits (faint) and the planet.
      ctx.setLineDash([4, 10]);
      ctx.strokeStyle = 'rgba(160,230,240,0.16)';
      ctx.lineWidth = 2;
      for (const m of this.moons) {
        SA.ellipse(ctx, pl.x, pl.y, m.d * H, m.d * H * 0.92);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      const glow = ctx.createRadialGradient(pl.x, pl.y, pl.r, pl.x, pl.y, pl.r * 2.6);
      glow.addColorStop(0, 'rgba(150,235,240,0.18)');
      glow.addColorStop(1, 'rgba(150,235,240,0)');
      ctx.fillStyle = glow;
      SA.circle(ctx, pl.x, pl.y, pl.r * 2.6); ctx.fill();
      SA.drawBody(ctx, 'uranus', pl.x, pl.y, pl.r, { t, lx: -0.8, ly: -0.2 });
      SA.label(ctx, 'Uranus', pl.x, pl.y + pl.r + 26, 20, '#d6fbff');

      for (const m of this.moons) this.drawMoon(ctx, m, t);

      // Aiming guide.
      if (this.pull) {
        const L = this.launcher;
        // Expert mission: only the start of the path shows; the child imagines the curve.
        const all = this.predict(), pts = this.expert ? all.slice(0, Math.max(6, Math.round(all.length * 0.3))) : all;
        pts.forEach(([x, y], i) => {
          ctx.globalAlpha = 1 - i / pts.length;
          ctx.fillStyle = '#ffe066';
          SA.circle(ctx, x, y, 4); ctx.fill();
        });
        ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(255,224,102,0.8)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(L.x, L.y);
        ctx.lineTo(L.x - this.pull.x, L.y - this.pull.y);
        ctx.stroke();
        ctx.fillStyle = '#fff';
        SA.circle(ctx, L.x - this.pull.x, L.y - this.pull.y, 10); ctx.fill();
      }

      // Probe trail and probe.
      if (this.trail.length > 1) {
        ctx.strokeStyle = 'rgba(160,240,255,0.55)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        this.trail.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
      }
      const p = this.probe;
      if (p) this.drawProbe(ctx, p.x, p.y, Math.atan2(p.vy, p.vx), t);
      else if (this.phase === 'aim') {
        const L = this.launcher;
        const px = this.pull ? L.x - this.pull.x * 0.3 : L.x, py = this.pull ? L.y - this.pull.y * 0.3 : L.y;
        this.drawProbe(ctx, px, py, this.pull ? Math.atan2(this.pull.y, this.pull.x) : -0.6, t);
        if (!this.pull && this.shots === 0) {
          const hop = Math.abs(Math.sin(t * 3)) * 10;
          SA.emoji(ctx, '👆', L.x - 50, L.y + 60 + hop, 40);
          SA.label(ctx, 'Pull back & let go!', L.x + 10, L.y + 110, 18, '#ffe066');
        }
      }
      // Launch pad.
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      SA.circle(ctx, this.launcher.x, this.launcher.y, 34); ctx.fill();

      this.fx.draw(ctx);
      SA.drawCosmo(ctx, this.launcher.x - 20, this.launcher.y + 80, 0.6, { t, wave: !!this.probe });
      this.drawStrip(ctx);
      if (this.flash > 0) {
        ctx.globalAlpha = this.flash * (SA.calm() ? 0.1 : 0.5);
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }
    }

    drawMoon(ctx, m, t) {
      if (!m.got) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 4 + m.d * 10);
        ctx.strokeStyle = 'rgba(255,224,102,' + (0.35 + pulse * 0.5) + ')';
        ctx.lineWidth = 3;
        SA.circle(ctx, m.x, m.y, m.r + 12 + pulse * 4); ctx.stroke();
      }
      ctx.fillStyle = m.color;
      SA.circle(ctx, m.x, m.y, m.r); ctx.fill();
      const g = ctx.createRadialGradient(m.x - m.r * 0.4, m.y - m.r * 0.4, 1, m.x, m.y, m.r);
      g.addColorStop(0, 'rgba(255,255,255,0.3)');
      g.addColorStop(1, 'rgba(0,0,20,0.5)');
      ctx.fillStyle = g;
      SA.circle(ctx, m.x, m.y, m.r); ctx.fill();
      SA.label(ctx, (m.got ? '✅ ' : '') + m.name, m.x, m.y + m.r + 18, 15, m.got ? '#a8f0b8' : '#e8ecff');
    }

    // A little Voyager-style probe: dish, body and a long boom.
    drawProbe(ctx, x, y, ang, t) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      ctx.strokeStyle = '#c9cfe0';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-30, 10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-24, -14); ctx.stroke();
      ctx.fillStyle = '#d9a441';
      ctx.fillRect(-8, -6, 12, 12);
      ctx.fillStyle = '#f4f4f8';
      SA.ellipse(ctx, 8, 0, 5, 15); ctx.fill();
      ctx.strokeStyle = '#8a90ad';
      ctx.stroke();
      ctx.restore();
    }

    drawStrip(ctx) {
      const W = SA.W, n = MOONS.length, size = 40, gap = 8;
      const total = n * size + (n - 1) * gap, x0 = (W - total) / 2, y0 = 14;
      ctx.fillStyle = 'rgba(10,8,30,0.55)';
      SA.rrect(ctx, x0 - 10, y0 - 6, total + 20, size + 12, 12); ctx.fill();
      this.moons.forEach((m, i) => {
        const x = x0 + i * (size + gap);
        ctx.fillStyle = m.got ? '#fff' : 'rgba(255,255,255,0.14)';
        SA.rrect(ctx, x, y0, size, size, 6); ctx.fill();
        if (m.got) {
          ctx.fillStyle = '#0d1a3a';
          ctx.fillRect(x + 4, y0 + 4, size - 8, size - 8);
          ctx.fillStyle = m.color;
          SA.circle(ctx, x + size / 2, y0 + size / 2, 11); ctx.fill();
        } else {
          SA.label(ctx, '?', x + size / 2, y0 + size / 2, 20, '#c9cff0', { stroke: false });
        }
      });
    }
  }
  SA.UranusScene = UranusScene;
})(window.SA);
