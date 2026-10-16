// Venus mission: "Radar Explorer". Thick clouds hide the ground, so the child rubs the screen
// with a radar beam (like the real Magellan spacecraft) to uncover five hidden wonders.
// It is pure exploration: there is no way to fail.
(function (SA) {
  const TAU = Math.PI * 2;
  const MASK = 4;          // the cloud layer is kept at 1/4 size: soft edges and cheap to check
  const BRUSH = 64;        // radar beam radius
  const FOUND_AT = 0.55;   // share of a wonder that must be uncovered to count as found

  // Positions are fractions of the screen; r is a fraction of the screen height.
  const FEATURES = [
    { id: 'maat', name: 'Maat Mons', x: 0.72, y: 0.42, r: 0.15,
      fact: 'Maat Mons, a giant volcano! Venus has more volcanoes than any other planet. 🌋' },
    { id: 'craters', name: 'Impact craters', x: 0.22, y: 0.3, r: 0.09,
      fact: 'Impact craters! Only big space rocks get through Venus\'s thick air. Small ones burn up on the way down.' },
    { id: 'domes', name: 'Pancake domes', x: 0.3, y: 0.74, r: 0.1,
      fact: 'Pancake domes! These round, flat hills were made by thick, gooey lava. 🥞' },
    { id: 'channel', name: 'Lava channel',
      path: [[0.04, 0.52], [0.14, 0.47], [0.26, 0.53], [0.38, 0.5], [0.5, 0.58], [0.58, 0.67], [0.68, 0.73]],
      fact: 'A super-long lava channel! One on Venus is even longer than the Nile, the longest river on Earth!' },
    { id: 'lander', name: 'Venera 13', x: 0.88, y: 0.78, r: 0.065,
      fact: 'A spacecraft! In 1982, Venera 13 landed on Venus and sent back the first color photos of its ground. It lasted about 2 hours in the heat!' },
  ];

  class VenusScene {
    constructor() {
      this.fx = new SA.Particles();
      this.t = 0;
    }

    enter(opts) {
      SA.ui.setScene('game');
      SA.audio.music('venus');
      // Expert mission "Narrow Beam": a thinner radar beam, shyer sparkle hints, new facts.
      this.expert = !!(opts && opts.expert);
      const E = SA.EXPERT.venus;
      this.phase = 'intro';
      this.got = 0;
      this.down = false;
      this.idle = 0;
      this.hinted = false;
      this.scanned = false;
      this.blipT = 0;
      this.checkT = 0;
      this.dirty = false;
      this.pings = [];
      this.pointer = { x: SA.W * 0.5, y: SA.H * 0.5 };
      this.craftX = SA.W * 0.5;
      this.features = FEATURES.map(f => Object.assign({ found: false }, f, this.expert ? { fact: E.facts[f.id] } : null));
      this.build();
      this.updateInfo();
      SA.ui.banner('Venus', this.expert ? '🎓 Expert: ' + E.name : SA.NICKNAMES.venus).then(() => SA.scene !== this ? new Promise(() => {}) : SA.ui.say(this.expert ? E.intro : SA.introLines('venus', [
        'Welcome to Venus! It\'s the hottest planet: 465 °C, hot enough to melt lead! 🔥',
        'Thick clouds hide the ground, so we can\'t see it. But radar can see right through clouds!',
        'Rub the clouds with your finger to scan with radar. Find 5 hidden wonders! 📡',
      ]))).then(() => {
        if (SA.scene !== this) return;
        this.phase = 'scan';
        SA.ui.hint('Rub the clouds to scan! 👆📡', 4);
      });
    }

    exit() { SA.ui.hideTalk(); }

    resize() { if (this.features) this.build(); }

    updateInfo() { SA.ui.setInfo('📡 Found ' + this.got + ' / ' + FEATURES.length); }

    // Screen positions and the points used to measure how much of each wonder is uncovered.
    geometry(f) {
      const W = SA.W, H = SA.H;
      if (f.path) {
        const pts = f.path.map(p => [p[0] * W, p[1] * H]);
        const samples = [];
        for (let i = 0; i < pts.length - 1; i++) {
          const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
          const n = Math.ceil(Math.hypot(bx - ax, by - ay) / 24);
          for (let k = 0; k < n; k++) samples.push([SA.lerp(ax, bx, k / n), SA.lerp(ay, by, k / n)]);
        }
        const mid = pts[Math.floor(pts.length / 2)];
        return { x: mid[0], y: mid[1], r: 40, pts, samples };
      }
      const x = f.x * W, y = f.y * H, r = f.r * H;
      const samples = [];
      for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) {
        if (i * i + j * j <= 10) samples.push([x + (i / 3) * r * 0.85, y + (j / 3) * r * 0.85]);
      }
      return { x, y, r, samples };
    }

    build() {
      const W = SA.W, H = SA.H;
      for (const f of this.features) f.g = this.geometry(f);
      this.buildTerrain(W, H);
      this.buildClouds(W, H);
      // Keep already-found wonders uncovered after a resize.
      for (const f of this.features) if (f.found) this.clearFeature(f);
    }

    // ---------- Scanning ----------
    brush() { return SA.easy() ? BRUSH * 1.45 : this.expert ? BRUSH * 0.7 : BRUSH; }
    // Seconds of no scanning before the sparkles hint at a hidden wonder (shyer when Expert).
    hintAfter() { return this.expert ? 18 : 9; }

    // Wipes clouds away around (x, y). The cloud context is already scaled to screen units.
    erase(x, y, r, strength) {
      const m = this.mctx;
      const g = m.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(0,0,0,' + strength + ')');
      g.addColorStop(0.6, 'rgba(0,0,0,' + strength * 0.7 + ')');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      m.globalCompositeOperation = 'destination-out';
      m.fillStyle = g;
      m.fillRect(x - r, y - r, r * 2, r * 2);
      m.globalCompositeOperation = 'source-over';
      this.dirty = true;
    }

    scanTo(x, y) {
      const p = this.prev || { x, y };
      const d = Math.hypot(x - p.x, y - p.y);
      const b = this.brush();
      const n = Math.max(1, Math.ceil(d / (b / 3)));
      for (let i = 1; i <= n; i++) this.erase(SA.lerp(p.x, x, i / n), SA.lerp(p.y, y, i / n), b, 0.35);
      this.prev = { x, y };
    }

    onDown(x, y) {
      this.pointer = { x, y };
      if (this.phase !== 'scan') return;
      this.down = true;
      this.prev = null;
      this.scanTo(x, y);
      if (!this.scanned) {
        this.scanned = true;
        SA.ui.hint('Radar sees right through the clouds! Keep scanning! 📡', 4);
      }
    }
    onMove(x, y) {
      this.pointer = { x, y };
      if (this.down && this.phase === 'scan') {
        this.scanTo(x, y);
        this.idle = 0;
      }
    }
    onUp() { this.down = false; this.prev = null; }

    clearFeature(f) {
      const g = f.g;
      if (f.path) for (const [x, y] of g.samples) this.erase(x, y, 46, 1);
      else this.erase(g.x, g.y, g.r * 1.35, 1);
    }

    checkFound() {
      const m = this.mask;
      const data = this.mctx.getImageData(0, 0, m.width, m.height).data;
      for (const f of this.features) {
        if (f.found) continue;
        let open = 0;
        for (const [x, y] of f.g.samples) {
          const mx = SA.clamp(Math.floor(x / MASK), 0, m.width - 1), my = SA.clamp(Math.floor(y / MASK), 0, m.height - 1);
          if (data[(my * m.width + mx) * 4 + 3] < 110) open++;
        }
        if (open / f.g.samples.length >= FOUND_AT) this.found(f);
      }
    }

    found(f) {
      f.found = true;
      this.got++;
      this.idle = 0;
      this.updateInfo();
      this.clearFeature(f);
      SA.audio.play('ping');
      setTimeout(() => SA.audio.play('collect'), 180);
      this.fx.spawn('sparkle', f.g.x, f.g.y, 22);
      this.pings.push({ x: f.g.x, y: f.g.y, t: 0 });
      SA.ui.hint(f.fact, 7);
      if (this.got === FEATURES.length) {
        this.phase = 'done';
        this.down = false;
        setTimeout(() => { if (SA.scene === this) this.finish(); }, 3000);
      }
    }

    async finish() {
      SA.audio.play('cheer');
      SA.celebrate(120);
      await SA.ui.banner('Mission Complete!', '📡 All 5 wonders found', 'gold', 3);
      if (SA.scene !== this) return;
      if (this.expert) {
        await SA.ui.say(SA.EXPERT.venus.outro);
        SA.finishExpert('venus', 3);
        return;
      }
      await SA.ui.say([
        'You mapped Venus with radar, just like the Magellan spacecraft did in the 1990s! 📡',
        'Here\'s a weird one: Venus spins backwards, and one day there is longer than its whole year! 🤯',
      ]);
      SA.finishPlanet('venus', 3);
    }

    update(dt) {
      this.t += dt;
      this.fx.update(dt);
      this.craftX = SA.lerp(this.craftX, this.pointer.x, Math.min(1, dt * 4));
      for (const p of this.pings) p.t += dt;
      this.pings = this.pings.filter(p => p.t < 1.6);
      if (this.phase !== 'scan') return;

      if (this.down) {
        this.blipT -= dt;
        if (this.blipT <= 0) { this.blipT = 0.35; SA.audio.play('blip'); }
        if (Math.random() < 0.5) this.fx.spawn('sparkle', this.pointer.x + SA.rand(-30, 30), this.pointer.y + SA.rand(-30, 30), 1, { color: '#9fffd0' });
      } else {
        this.idle += dt;
      }
      this.checkT -= dt;
      if (this.dirty && this.checkT <= 0) {
        this.checkT = 0.2;
        this.dirty = false;
        this.checkFound();
      }
      if (this.idle > this.hintAfter() && !this.hinted) {
        this.hinted = true;
        SA.ui.hint('Look for the sparkles! Something is hiding there. ✨', 4);
      }
    }

    // ---------- Drawing ----------
    draw(ctx) {
      const W = SA.W, H = SA.H, t = this.t;
      ctx.drawImage(this.terrain, 0, 0, W, H);
      ctx.drawImage(this.mask, 0, 0, W, H);

      // A thin, slowly drifting haze over everything.
      ctx.fillStyle = 'rgba(250,225,160,0.07)';
      for (let i = 0; i < 5; i++) {
        const x = (((i * 331 + t * 14) % (W + 600)) + W + 600) % (W + 600) - 300;
        SA.ellipse(ctx, x, H * (0.15 + i * 0.18), 260, 50, 0.1);
        ctx.fill();
      }

      // After a while, sparkles show where an unfound wonder hides.
      if (this.idle > this.hintAfter() && this.phase === 'scan') {
        const f = this.nearestUnfound();
        if (f) {
          for (let i = 0; i < 3; i++) {
            const a = t * 2 + i * 2.1;
            ctx.fillStyle = 'rgba(255,255,220,' + (0.5 + 0.5 * Math.sin(t * 5 + i)) + ')';
            SA.starPath(ctx, f.g.x + Math.cos(a) * 30, f.g.y + Math.sin(a) * 20, 8, 0.35, 4, a);
            ctx.fill();
          }
        }
      }

      for (const p of this.pings) {
        const k = p.t / 1.6;
        ctx.strokeStyle = 'rgba(140,255,200,' + (1 - k) + ')';
        ctx.lineWidth = 4;
        SA.circle(ctx, p.x, p.y, 30 + k * 160);
        ctx.stroke();
      }
      for (const f of this.features) {
        if (!f.found) continue;
        const g = f.g;
        const ly = f.path ? g.y - 34 : g.y - g.r - 16;
        SA.label(ctx, '📍 ' + f.name, g.x, ly, 20, '#fff');
      }
      this.fx.draw(ctx);
      this.drawThermometer(ctx);
      this.drawRadar(ctx, t);
    }

    nearestUnfound() {
      let best = null, bd = 1e9;
      for (const f of this.features) {
        if (f.found) continue;
        const d = Math.hypot(f.g.x - this.pointer.x, f.g.y - this.pointer.y);
        if (d < bd) { bd = d; best = f; }
      }
      return best;
    }

    // Magellan-style spacecraft above the clouds, beaming radar down to the finger.
    drawRadar(ctx, t) {
      const x = this.craftX, y = 88;
      if (this.down) {
        const p = this.pointer;
        const g = ctx.createLinearGradient(x, y, p.x, p.y);
        g.addColorStop(0, 'rgba(140,255,200,0.45)');
        g.addColorStop(1, 'rgba(140,255,200,0.12)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(x - 8, y + 10);
        const B = this.brush();
        ctx.lineTo(p.x - B * 0.8, p.y);
        ctx.lineTo(p.x + B * 0.8, p.y);
        ctx.lineTo(x + 8, y + 10);
        ctx.closePath();
        ctx.fill();
        for (let i = 0; i < 3; i++) {
          const k = ((t * 1.6 + i / 3) % 1);
          ctx.strokeStyle = 'rgba(140,255,200,' + (1 - k) * 0.8 + ')';
          ctx.lineWidth = 3;
          SA.ellipse(ctx, p.x, p.y, B * k, B * k * 0.6);
          ctx.stroke();
        }
      }
      ctx.save();
      ctx.translate(x, y + Math.sin(t * 2) * 3);
      ctx.fillStyle = '#3a6fd8';
      ctx.fillRect(-58, -8, 36, 16);
      ctx.fillRect(22, -8, 36, 16);
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      for (const sx of [-58, 22]) for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(sx + i * 9, -8); ctx.lineTo(sx + i * 9, 8); ctx.stroke(); }
      ctx.fillStyle = '#d9a441';
      SA.rrect(ctx, -16, -14, 32, 26, 4); ctx.fill();
      ctx.fillStyle = '#f4f4f8';
      SA.ellipse(ctx, 0, 16, 22, 8); ctx.fill();
      ctx.strokeStyle = '#8a90ad';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      SA.label(ctx, 'Radar', x, y - 28, 13, '#c8ffe6', { weight: 700 });
    }

    drawThermometer(ctx) {
      const x = 36, y0 = SA.H * 0.3, y1 = SA.H * 0.7;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      SA.rrect(ctx, x - 9, y0, 18, y1 - y0, 9); ctx.fill();
      SA.circle(ctx, x, y1 + 6, 17); ctx.fill();
      ctx.fillStyle = '#ff5030';
      SA.rrect(ctx, x - 5, y0 + 10, 10, y1 - y0 - 6, 5); ctx.fill();
      SA.circle(ctx, x, y1 + 6, 12); ctx.fill();
      SA.label(ctx, '465 °C', x + 4, y0 - 16, 16, '#fff', { align: 'left' });
    }

    // ---------- Building the ground and the clouds ----------
    buildTerrain(W, H) {
      const S = 2;
      const c = this.terrain || document.createElement('canvas');
      c.width = Math.ceil(W * S); c.height = Math.ceil(H * S);
      const ctx = c.getContext('2d');
      ctx.setTransform(S, 0, 0, S, 0, 0);
      const rnd = SA.seeded(73);

      const base = ctx.createLinearGradient(0, 0, W, H);
      base.addColorStop(0, '#b8652e');
      base.addColorStop(1, '#7e3f1d');
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 700; i++) {
        ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,190,120,0.07)' : 'rgba(60,20,5,0.09)';
        SA.ellipse(ctx, rnd() * W, rnd() * H, 4 + rnd() * 30, 3 + rnd() * 16, rnd() * 3);
        ctx.fill();
      }
      // Wrinkled ridges.
      ctx.strokeStyle = 'rgba(255,200,140,0.14)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 40; i++) {
        const x = rnd() * W, y = rnd() * H;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + 30 + rnd() * 40, y + (rnd() - 0.5) * 40, x + 70 + rnd() * 60, y + (rnd() - 0.5) * 30);
        ctx.stroke();
      }

      const F = id => this.features.find(f => f.id === id).g;

      // Lava channel: a dark groove with bright edges.
      const ch = F('channel');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const strokePath = () => {
        ctx.beginPath();
        ctx.moveTo(ch.pts[0][0], ch.pts[0][1]);
        for (let i = 1; i < ch.pts.length - 1; i++) {
          const mx = (ch.pts[i][0] + ch.pts[i + 1][0]) / 2, my = (ch.pts[i][1] + ch.pts[i + 1][1]) / 2;
          ctx.quadraticCurveTo(ch.pts[i][0], ch.pts[i][1], mx, my);
        }
        const last = ch.pts[ch.pts.length - 1];
        ctx.lineTo(last[0], last[1]);
        ctx.stroke();
      };
      ctx.strokeStyle = 'rgba(240,185,138,0.6)'; ctx.lineWidth = 18; strokePath();
      ctx.strokeStyle = '#4a2410'; ctx.lineWidth = 10; strokePath();
      ctx.strokeStyle = 'rgba(255,140,60,0.5)'; ctx.lineWidth = 3; strokePath();

      // Maat Mons: a broad volcano with lava flows running down its sides.
      const mm = F('maat');
      const cone = ctx.createRadialGradient(mm.x, mm.y, 0, mm.x, mm.y, mm.r * 1.15);
      cone.addColorStop(0, 'rgba(255,200,150,0.55)');
      cone.addColorStop(1, 'rgba(255,200,150,0)');
      ctx.fillStyle = cone;
      SA.circle(ctx, mm.x, mm.y, mm.r * 1.15); ctx.fill();
      for (let i = 0; i < 46; i++) {
        const a = rnd() * TAU, len = mm.r * (0.5 + rnd() * 0.7);
        ctx.strokeStyle = rnd() > 0.5 ? 'rgba(242,178,122,0.6)' : 'rgba(80,30,10,0.45)';
        ctx.lineWidth = 2 + rnd() * 3;
        ctx.beginPath();
        ctx.moveTo(mm.x + Math.cos(a) * mm.r * 0.15, mm.y + Math.sin(a) * mm.r * 0.15);
        ctx.quadraticCurveTo(mm.x + Math.cos(a + 0.2) * len * 0.6, mm.y + Math.sin(a + 0.2) * len * 0.6, mm.x + Math.cos(a) * len, mm.y + Math.sin(a) * len);
        ctx.stroke();
      }
      ctx.fillStyle = '#e8a26a';
      SA.ellipse(ctx, mm.x, mm.y, mm.r * 0.2, mm.r * 0.15); ctx.fill();
      ctx.fillStyle = '#4a2410';
      SA.ellipse(ctx, mm.x, mm.y, mm.r * 0.13, mm.r * 0.09); ctx.fill();
      ctx.fillStyle = '#ff7a30';
      SA.ellipse(ctx, mm.x, mm.y, mm.r * 0.06, mm.r * 0.04); ctx.fill();

      // Impact craters with bright splashes around them.
      const cr = F('craters');
      for (const [dx, dy, r] of [[-0.35, -0.1, 0.42], [0.42, 0.25, 0.32], [0.05, 0.5, 0.24]]) {
        const x = cr.x + dx * cr.r, y = cr.y + dy * cr.r, rr = r * cr.r;
        const ej = ctx.createRadialGradient(x, y, rr, x, y, rr * 2.2);
        ej.addColorStop(0, 'rgba(255,215,170,0.45)');
        ej.addColorStop(1, 'rgba(255,215,170,0)');
        ctx.fillStyle = ej;
        SA.circle(ctx, x, y, rr * 2.2); ctx.fill();
        ctx.fillStyle = '#5a2e14';
        SA.circle(ctx, x, y, rr); ctx.fill();
        ctx.strokeStyle = '#f0b98a';
        ctx.lineWidth = rr * 0.22;
        SA.circle(ctx, x, y, rr); ctx.stroke();
        ctx.fillStyle = '#c98552';
        SA.circle(ctx, x, y, rr * 0.18); ctx.fill();
      }

      // Pancake domes: flat round hills with a pit in the middle.
      const dm = F('domes');
      for (const [dx, dy, r] of [[-0.45, -0.1, 0.42], [0.35, -0.3, 0.34], [0.2, 0.42, 0.28]]) {
        const x = dm.x + dx * dm.r, y = dm.y + dy * dm.r, rr = r * dm.r;
        const g = ctx.createRadialGradient(x - rr * 0.3, y - rr * 0.3, rr * 0.1, x, y, rr);
        g.addColorStop(0, '#f2c08e');
        g.addColorStop(0.8, '#d38a52');
        g.addColorStop(1, '#8a4a22');
        ctx.fillStyle = g;
        SA.circle(ctx, x, y, rr); ctx.fill();
        ctx.strokeStyle = 'rgba(90,40,15,0.5)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * TAU + 0.3;
          ctx.beginPath();
          ctx.moveTo(x + Math.cos(a) * rr * 0.25, y + Math.sin(a) * rr * 0.25);
          ctx.lineTo(x + Math.cos(a) * rr * 0.75, y + Math.sin(a) * rr * 0.75);
          ctx.stroke();
        }
        ctx.fillStyle = '#5a2e14';
        SA.circle(ctx, x, y, rr * 0.14); ctx.fill();
      }

      // Venera 13: a round lander on its landing ring, with petal panels.
      const ld = F('lander');
      const s = ld.r / 40;
      ctx.save();
      ctx.translate(ld.x, ld.y);
      ctx.scale(s, s);
      ctx.fillStyle = 'rgba(40,15,5,0.35)';
      SA.ellipse(ctx, 6, 30, 46, 10); ctx.fill();
      ctx.fillStyle = '#8f97b0';
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 20, 22 + Math.sin(a) * 6);
        ctx.lineTo(Math.cos(a + 0.4) * 40, 26 + Math.sin(a + 0.4) * 10);
        ctx.lineTo(Math.cos(a - 0.4) * 40, 26 + Math.sin(a - 0.4) * 10);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = '#b8bfd2';
      SA.ellipse(ctx, 0, 22, 26, 8); ctx.fill();
      ctx.fillStyle = '#d7dbe6';
      SA.circle(ctx, 0, 2, 18); ctx.fill();
      ctx.strokeStyle = '#5b6380';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#5b6380';
      ctx.fillRect(-18, 0, 36, 4);
      ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(0, -34); ctx.stroke();
      ctx.fillStyle = '#d7dbe6';
      SA.ellipse(ctx, 0, -36, 10, 4); ctx.fill();
      ctx.restore();

      this.terrain = c;
    }

    buildClouds(W, H) {
      const m = this.mask || document.createElement('canvas');
      m.width = Math.ceil(W / MASK); m.height = Math.ceil(H / MASK);
      const ctx = m.getContext('2d');
      ctx.setTransform(1 / MASK, 0, 0, 1 / MASK, 0, 0);
      const rnd = SA.seeded(19);
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#f3dda0');
      g.addColorStop(0.5, '#e9c87e');
      g.addColorStop(1, '#ddb56a');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      // Swirling bands and puffs.
      for (let i = 0; i < 14; i++) {
        ctx.fillStyle = i % 2 ? 'rgba(255,240,200,0.35)' : 'rgba(200,150,80,0.22)';
        SA.ellipse(ctx, rnd() * W, rnd() * H, 160 + rnd() * 260, 24 + rnd() * 40, (rnd() - 0.5) * 0.5);
        ctx.fill();
      }
      // Soft puffs (gradients, so they blend instead of looking like dots).
      for (let i = 0; i < 90; i++) {
        const x = rnd() * W, y = rnd() * H, r = 40 + rnd() * 90;
        const light = rnd() > 0.45;
        const p = ctx.createRadialGradient(x, y, 0, x, y, r);
        p.addColorStop(0, light ? 'rgba(255,248,222,0.4)' : 'rgba(196,142,72,0.28)');
        p.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = p;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      // Wispy streaks, like Venus's fast-moving upper clouds.
      ctx.strokeStyle = 'rgba(255,245,215,0.25)';
      ctx.lineCap = 'round';
      for (let i = 0; i < 26; i++) {
        const x = rnd() * W, y = rnd() * H, len = 120 + rnd() * 220;
        ctx.lineWidth = 6 + rnd() * 10;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + len / 2, y - 20 + rnd() * 40, x + len, y + (rnd() - 0.5) * 30);
        ctx.stroke();
      }
      this.mask = m;
      this.mctx = ctx;
    }
  }
  SA.VenusScene = VenusScene;
})(window.SA);
