// Space Playground (the 🪐 button on the map): a toy with no goals and nothing to lose.
//   Orbits: pick a planet, moon or comet, then drag from anywhere to fling it. A dotted line shows
//   where the Sun's gravity will bend its path. A quick tap drops it into a perfect circle. Too slow
//   and the Sun gulps it, too fast and it escapes to deep space, just right and it orbits.
//   Craters: fling space rocks at a big Moon. Faster rocks make bigger craters, and the craters stay
//   (the Moon has no wind or rain to wear them away) until the sponge makes a brand new Moon.
(function (SA) {
  const TAU = Math.PI * 2;
  const $ = id => document.getElementById(id);
  const KINDS = {
    rocky: { btn: '🌍', label: 'Rocky planet', bodies: ['earth', 'mars', 'venus', 'mercury'], r: 13 },
    giant: { btn: '🪐', label: 'Giant planet', bodies: ['jupiter', 'saturn', 'neptune', 'uranus'], r: 19 },
    moon: { btn: '🌙', label: 'Moon', bodies: ['moon', 'pluto'], r: 8 },
    comet: { btn: '☄️', label: 'Comet', bodies: ['comet'], r: 6 },
  };
  const MAX = 12;
  const G = 5.2e6;          // the Sun's pull (logical units, scaled by screen size)
  const ROCK_G = 320;       // the Moon's pull on falling rocks in Craters mode

  class PlaygroundScene {
    constructor() {
      this.stars = new SA.Starfield(260, 777);
      this.fx = new SA.Particles();
      this.t = 0;
      this.mode = 'orbits';
      this.kind = 'rocky';
      this.bodies = [];
      this.rocks = [];
      this.craterCount = 0;
      this.told = {};
    }

    layout() {
      const W = SA.W, H = SA.H;
      this.k = H / 720;
      this.sun = { x: W * 0.5, y: H * 0.55, r: 44 * this.k };
      this.g = G * this.k * this.k * this.k;   // so orbits look the same on every screen
      this.moon = { x: W * 0.5, R: W * 0.95, top: H * 0.56 };
      this.moon.y = this.moon.top + this.moon.R;
      this.bakeMoon(false);   // craters are kept (as angles on the Moon), even if the screen changes shape
    }
    resize() { this.layout(); }

    enter() {
      SA.ui.setScene('toy');
      SA.audio.music('play');
      this.layout();
      this.aim = null;
      this.shake = 0;
      $('btnToyBack').textContent = '🗺️ Map';
      this.buildHud();
      if (!this.bodies.length) this.seed();
      this.setMode(this.mode, true);
      if (!SA.state.playSeen) {
        SA.ui.say([
          'Welcome to the Space Playground! 🪐 Here you can play with planets!',
          'Pick a planet at the top. Then drag from anywhere and let go to fling it. The dotted line shows where it will go!',
          'Just tap to drop a planet into a perfect orbit. Tap 🌑 to crash space rocks into the Moon! 💥',
        ]).then(() => { SA.state.playSeen = true; SA.save(); });
      }
    }

    exit() { SA.ui.hideTalk(); this.aim = null; }
    back() { SA.go(SA.map, {}); }

    buildHud() {
      const pick = $('toyPick');
      const kinds = Object.keys(KINDS).map(id => '<button class="round-btn toy-btn kind" data-k="' + id + '" aria-label="' + SA.esc(KINDS[id].label) + '">' + KINDS[id].btn + '</button>').join('');
      pick.innerHTML =
        '<button class="round-btn toy-btn mode" data-m="orbits" aria-label="Orbits">☀️</button>' +
        '<button class="round-btn toy-btn mode" data-m="craters" aria-label="Craters">🌑</button>' +
        '<span class="sep"></span>' + kinds +
        '<button class="round-btn toy-btn clear" aria-label="Start over">🧽</button>';
      pick.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
        if (SA.transitioning || SA.ui.blocking() || SA.scene !== this) return;
        SA.audio.play('pop');
        if (b.dataset.m) this.setMode(b.dataset.m);
        else if (b.dataset.k) { this.kind = b.dataset.k; if (this.mode !== 'orbits') this.setMode('orbits'); this.refreshHud(); SA.ui.hint(KINDS[this.kind].label + '! Drag anywhere to fling it, or just tap. ' + KINDS[this.kind].btn, 3); }
        else this.clear();
      }));
    }

    refreshHud() {
      document.querySelectorAll('#toyPick .mode').forEach(b => b.classList.toggle('on', b.dataset.m === this.mode));
      document.querySelectorAll('#toyPick .kind').forEach(b => {
        b.classList.toggle('on', this.mode === 'orbits' && b.dataset.k === this.kind);
        b.style.display = this.mode === 'orbits' ? '' : 'none';
      });
      const sep = document.querySelector('#toyPick .sep');
      if (sep) sep.style.display = this.mode === 'orbits' ? '' : 'none';
      this.updateInfo();
    }

    updateInfo() {
      if (this.mode === 'orbits') SA.ui.setInfo('🔄 Orbits: ' + (this.orbitCount || 0));
      else SA.ui.setInfo('💥 Craters: ' + this.craterCount);
    }

    setMode(m, quiet) {
      this.mode = m;
      this.aim = null;
      this.refreshHud();
      if (quiet && !SA.state.playSeen) return;
      if (m === 'orbits') SA.ui.hint(quiet ? 'Drag from anywhere to fling a planet around the Sun! ☀️' : 'Back to the Sun! Fling planets to make orbits. ☀️', 4);
      else SA.ui.hint('Drag from the sky to fling a space rock at the Moon! 💥 Or tap the Moon to drop one.', 5);
    }

    clear() {
      if (this.mode === 'orbits') {
        for (const b of this.bodies) this.fx.spawn('puff', b.x, b.y, 4);
        this.bodies = [];
        this.orbitCount = 0;
        SA.ui.hint('All clear! Fling some new planets! ✨', 3);
      } else {
        this.rocks = [];
        this.craterCount = 0;
        this.bakeMoon(true);
        SA.ui.hint('A brand new, smooth Moon! 🌕 Let\'s make some craters!', 3);
      }
      this.updateInfo();
    }

    // Two planets are already going round when the playground opens, to show what orbits look like.
    seed() {
      this.orbitCount = 0;
      this.add('rocky', 'earth', this.sun.x + 170 * this.k, this.sun.y, null);
      this.add('moon', 'moon', this.sun.x - 270 * this.k, this.sun.y, null);
    }

    // A new body at (x, y). Without a velocity it gets a perfect circular orbit.
    add(kind, body, x, y, v) {
      const K = KINDS[kind], s = this.sun;
      const dx = x - s.x, dy = y - s.y, d = Math.max(1, Math.hypot(dx, dy));
      if (!v) {
        const sp = Math.sqrt(this.g / d);
        v = { x: (dy / d) * sp, y: (-dx / d) * sp };   // anticlockwise, like the real planets seen from above
      }
      if (this.bodies.length >= MAX) {
        const old = this.bodies.shift();
        this.fx.spawn('puff', old.x, old.y, 5);
      }
      const b = { kind, body: body || SA.pick(K.bodies), x, y, vx: v.x, vy: v.y, r: K.r * this.k, trail: [], ang: Math.atan2(dy, dx), turn: 0, age: 0, spin: SA.rand(0, 10) };
      this.bodies.push(b);
      return b;
    }

    // ---------- Input ----------
    onDown(x, y) {
      if (this.mode === 'orbits') {
        if (Math.hypot(x - this.sun.x, y - this.sun.y) < this.sun.r + 6) {
          SA.audio.play('ping');
          this.fx.spawn('sparkle', x, y, 10, { color: '#ffd27a' });
          SA.ui.hint('That\'s the Sun! Its gravity pulls on everything around it. ☀️', 4);
          return;
        }
        this.aim = { x0: x, y0: y, x, y };
      } else {
        const m = this.moon;
        if (Math.hypot(x - m.x, y - m.y) < m.R) {
          // Tapped the Moon: a rock falls from the sky right onto that spot.
          this.rocks.push({ x: x + SA.rand(-30, 30), y: -30, vx: 0, vy: 420, r: SA.rand(8, 15) * this.k, seed: Math.floor(Math.random() * 99), rot: 0 });
          SA.audio.play('whoosh');
          return;
        }
        this.aim = { x0: x, y0: y, x, y };
      }
      SA.audio.play('blip');
    }

    onMove(x, y) { if (this.aim) { this.aim.x = x; this.aim.y = y; } }

    onUp() {
      const a = this.aim;
      if (!a) return;
      this.aim = null;
      const v = this.assisted(a, this.aimVel(a));
      const tap = Math.hypot(a.x - a.x0, a.y - a.y0) < 12;
      if (this.mode === 'orbits') {
        const b = this.add(this.kind, null, a.x0, a.y0, tap ? null : v);
        if (v.nudged && !this.told.assist) { this.told.assist = true; SA.ui.hint('Little Explorer helper: I gave it a little nudge so it goes into orbit! 🧸', 5); }
        SA.audio.play(tap ? 'pop' : 'whoosh');
        this.fx.spawn('sparkle', b.x, b.y, 8, { color: '#fff3a0' });
        if (tap && !this.told.tap) { this.told.tap = true; SA.ui.hint('Plop! A tap gives it just the right speed for a circle. Try dragging for a wild one! 🌀', 5); }
      } else {
        this.rocks.push({ x: a.x0, y: a.y0, vx: tap ? 0 : v.x, vy: tap ? 60 : v.y, r: SA.rand(8, 16) * this.k * (SA.easy() ? 1.3 : 1), seed: Math.floor(Math.random() * 99), rot: 0 });
        SA.audio.play('whoosh');
      }
    }

    aimVel(a) {
      const m = this.mode === 'orbits' ? 2.0 : 3.2;
      return { x: (a.x - a.x0) * m, y: (a.y - a.y0) * m };
    }
    // Little Explorer mode: a throw that would fall into the Sun or fly away is gently nudged into
    // an orbit (the dotted preview shows the nudged path, so what you see is what you get).
    assisted(a, v) {
      if (this.mode !== 'orbits' || !SA.easy() || Math.hypot(a.x - a.x0, a.y - a.y0) < 12) return v;
      const s = this.sun, rMax = Math.min(SA.W * 1.1, SA.H * 1.3) * 0.9;
      const as = SA.orbitAssist(a.x0, a.y0, v.x, v.y, s.x, s.y, this.g, s.r + 30 * this.k, rMax);
      return { x: as.vx, y: as.vy, nudged: as.nudged };
    }

    // ---------- Physics ----------
    pull(x, y) {
      const dx = this.sun.x - x, dy = this.sun.y - y, d2 = Math.max(dx * dx + dy * dy, 400), d = Math.sqrt(d2);
      const a = this.g / d2;
      return { ax: (dx / d) * a, ay: (dy / d) * a, d };
    }

    update(dt) {
      this.t += dt;
      this.fx.update(dt);
      this.shake = Math.max(0, this.shake - dt * 2);
      this.mode === 'orbits' ? this.updateOrbits(dt) : this.updateCraters(dt);
    }

    updateOrbits(dt) {
      const steps = 4, h = dt / steps, s = this.sun, W = SA.W, H = SA.H;
      for (const b of this.bodies) {
        for (let i = 0; i < steps; i++) {
          const p = this.pull(b.x, b.y);
          b.vx += p.ax * h; b.vy += p.ay * h;
          b.x += b.vx * h; b.y += b.vy * h;
        }
        b.age += dt;
        // Count trips around the Sun.
        const ang = Math.atan2(b.y - s.y, b.x - s.x);
        b.turn += SA.wrapAngle(ang - b.ang);
        b.ang = ang;
        if (Math.abs(b.turn) >= TAU) {
          b.turn -= Math.sign(b.turn) * TAU;
          this.orbitCount = (this.orbitCount || 0) + 1;
          this.updateInfo();
          SA.ui.bumpInfo();
          SA.audio.play('ding');
          this.fx.spawn('sparkle', b.x, b.y, 8, { color: '#bfffd9' });
          if (!this.told.orbit) { this.told.orbit = true; SA.ui.hint('You made an orbit! 🎉 The Sun\'s gravity keeps pulling it around and around.', 6); }
          else if (this.bodies.length >= 3 && !this.told.kepler) { this.told.kepler = true; SA.ui.hint('Look! Planets close to the Sun go around faster, just like speedy Mercury! ⚡', 6); }
        }
        if ((b.tick = (b.tick || 0) + 1) % 2 === 0) { b.trail.push(b.x, b.y); if (b.trail.length > 180) b.trail.splice(0, 2); }
        const d = Math.hypot(b.x - s.x, b.y - s.y);
        if (d < s.r + b.r * 0.4) b.gone = 'sun';
        else if (b.x < -W * 0.6 || b.x > W * 1.6 || b.y < -H * 0.8 || b.y > H * 1.8) b.gone = 'away';
      }
      // Bodies that bump into each other stick together into a bigger one.
      for (let i = 0; i < this.bodies.length; i++) {
        const a = this.bodies[i];
        if (a.gone) continue;
        for (let j = i + 1; j < this.bodies.length; j++) {
          const b = this.bodies[j];
          if (b.gone || Math.hypot(a.x - b.x, a.y - b.y) > (a.r + b.r) * 0.85) continue;
          const ma = a.r * a.r * a.r, mb = b.r * b.r * b.r, big = ma >= mb ? a : b, small = big === a ? b : a;
          big.vx = (a.vx * ma + b.vx * mb) / (ma + mb);
          big.vy = (a.vy * ma + b.vy * mb) / (ma + mb);
          big.r = Math.min(30 * this.k, Math.cbrt(ma + mb));
          small.gone = 'merge';
          SA.audio.play('thud');
          this.fx.spawn('sparkle', big.x, big.y, 14, { color: '#ffb36b' });
          this.fx.text(big.x, big.y - big.r - 16, 'Crash!', '#ffd27a');
          if (!this.told.merge) { this.told.merge = true; SA.ui.hint('Crash! They smooshed together into a bigger one. Long ago, planets grew this way! 🪨', 6); }
          if (a.gone) break;
        }
      }
      for (const b of this.bodies) {
        if (b.gone === 'sun') {
          SA.audio.play('gulp');
          this.fx.spawn('sparkle', b.x, b.y, 12, { color: '#ffb340' });
          this.fx.text(s.x, s.y - s.r - 24, 'Gulp!', '#ffd27a');
          if (!this.told.sun) { this.told.sun = true; SA.ui.hint('Gulp! It was too slow, so the Sun\'s gravity pulled it in! ☀️', 5); }
        } else if (b.gone === 'away') {
          if (!this.told.away) { this.told.away = true; SA.ui.hint('Whoosh! That one went so fast it escaped into deep space! Bye-bye! 👋', 5); }
        }
      }
      this.bodies = this.bodies.filter(b => !b.gone);
    }

    updateCraters(dt) {
      const m = this.moon;
      for (const r of this.rocks) {
        // The Moon pulls rocks down toward its middle.
        const dx = m.x - r.x, dy = m.y - r.y, d = Math.hypot(dx, dy);
        r.vx += (dx / d) * ROCK_G * dt;
        r.vy += (dy / d) * ROCK_G * dt;
        r.x += r.vx * dt; r.y += r.vy * dt;
        r.rot += dt * 3;
        if (Math.hypot(r.x - m.x, r.y - m.y) <= m.R + r.r * 0.3) this.impact(r);
        else if (r.x < -200 || r.x > SA.W + 200 || r.y < -SA.H) r.gone = true;
      }
      this.rocks = this.rocks.filter(r => !r.gone);
    }

    impact(r) {
      r.gone = true;
      const m = this.moon, k = this.k;
      const a = Math.atan2(r.y - m.y, r.x - m.x);
      const x = m.x + Math.cos(a) * m.R, y = m.y + Math.sin(a) * m.R;
      const speed = Math.hypot(r.vx, r.vy);
      const size = SA.clamp(10 + speed * 0.04 + r.r / k * 1.3, 14, 90) * k;
      const rays = speed > 900;
      this.craters.push([a, size / k, rays, r.seed]);
      this.drawCrater(a, size / k, rays, r.seed);
      this.craterCount++;
      this.updateInfo();
      SA.ui.bumpInfo();
      SA.audio.play('thud');
      if (!SA.calm()) this.shake = Math.min(1, size / (60 * k));
      // A spray of moon dust (no air, so it flies in neat arcs).
      const n = SA.calm() ? 10 : 22;
      for (let i = 0; i < n; i++) {
        const da = a + SA.rand(-1.1, 1.1), sp = SA.rand(80, 200) * (size / (40 * k));
        this.fx.list.push({ kind: 'dot', x, y, vx: Math.cos(da) * sp, vy: Math.sin(da) * sp, life: 0, max: SA.rand(0.5, 1), size: SA.rand(2, 5) * k, rot: 0, color: 'rgba(210,210,220,0.85)' });
      }
      this.fx.spawn('sparkle', x, y, size > 50 * k ? 14 : 6, { color: '#fff3c4' });
      const c = this.craterCount;
      if (c === 1) SA.ui.hint('BOOM! 💥 The Moon has no air, so space rocks don\'t burn up. They crash and make craters!', 6);
      else if (rays && !this.told.rays) { this.told.rays = true; SA.ui.hint('Wow! See the bright lines? They are rays of dust thrown out by a big crash, just like the crater Tycho on the real Moon!', 7); }
      else if (c === 3) SA.ui.hint('Faster rocks make bigger craters! Try a really hard flick! 💪', 5);
      else if (c === 7) SA.ui.hint('The Moon has no wind or rain, so its craters stay for billions of years! 🌕', 6);
    }

    // ---------- The Moon's surface (craters are kept in a baked picture) ----------
    bakeMoon(clear) {
      const W = SA.W, H = SA.H, ps = SA.clamp(SA.pixelScale || 1, 1, 2);
      if (!this.craters) this.craters = [];
      if (!this.moonCanvas || clear || this.moonCanvas.w !== W || this.moonCanvas.h !== H || this.moonCanvas.ps !== ps) {
        const c = this.moonCanvas || document.createElement('canvas');
        c.width = Math.round(W * ps); c.height = Math.round(H * ps);
        c.w = W; c.h = H; c.ps = ps;
        const g = c.getContext('2d');
        g.setTransform(ps, 0, 0, ps, 0, 0);
        g.clearRect(0, 0, W, H);
        const m = this.moon;
        g.save();
        SA.circle(g, m.x, m.y, m.R); g.clip();
        const gr = g.createLinearGradient(0, m.top, 0, H);
        gr.addColorStop(0, '#d9d9e3');
        gr.addColorStop(1, '#8d8da3');
        g.fillStyle = gr;
        g.fillRect(0, m.top - 10, W, H - m.top + 20);
        // Dark "seas" of old lava, and a few old craters.
        const rnd = SA.seeded(55);
        g.fillStyle = 'rgba(110,110,130,0.35)';
        for (let i = 0; i < 7; i++) { SA.ellipse(g, rnd() * W, m.top + 30 + rnd() * (H - m.top), 60 + rnd() * 120, 18 + rnd() * 30, 0); g.fill(); }
        g.restore();
        this.moonCanvas = c;
        if (clear) this.craters = [];
        for (const cr of this.craters) this.drawCrater(cr[0], cr[1], cr[2], cr[3]);
      }
    }

    // A crater where a rock hit the Moon's edge at angle a (size in units at the 720-tall screen).
    drawCrater(a, sizeU, rays, seed) {
      const c = this.moonCanvas, g = c.getContext('2d'), m = this.moon;
      const size = sizeU * this.k, x = m.x + Math.cos(a) * m.R, y = m.y + Math.sin(a) * m.R;
      g.setTransform(c.ps, 0, 0, c.ps, 0, 0);
      g.save();
      SA.circle(g, m.x, m.y, m.R); g.clip();
      // Seen from the side: craters near the edge look squashed.
      const tilt = 0.32 + 0.1 * Math.abs(Math.sin(a + Math.PI / 2));
      const cx = x - Math.cos(a) * size * 0.25, cy = y - Math.sin(a) * size * 0.2 + size * tilt * 0.6;
      if (rays) {
        const rnd = SA.seeded(seed + 7);
        g.strokeStyle = 'rgba(250,250,255,0.35)';
        g.lineCap = 'round';
        for (let i = 0; i < 9; i++) {
          const ra = (i / 9) * TAU + rnd() * 0.5, len = size * (1.6 + rnd() * 2.2);
          g.lineWidth = size * (0.06 + rnd() * 0.06);
          g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(ra) * len, cy + Math.sin(ra) * len * tilt * 1.4); g.stroke();
        }
      }
      // Bright raised rim, dark bowl, and a lit far wall.
      g.fillStyle = 'rgba(240,240,248,0.9)';
      SA.ellipse(g, cx, cy, size * 1.12, size * tilt * 1.15); g.fill();
      g.fillStyle = '#7b7b92';
      SA.ellipse(g, cx, cy + size * tilt * 0.05, size, size * tilt); g.fill();
      g.fillStyle = 'rgba(200,200,215,0.85)';
      SA.ellipse(g, cx + size * 0.1, cy + size * tilt * 0.35, size * 0.75, size * tilt * 0.5); g.fill();
      if (size > 50 * this.k) {
        // Big craters get a little central peak.
        g.fillStyle = 'rgba(235,235,245,0.9)';
        SA.ellipse(g, cx, cy + size * tilt * 0.2, size * 0.12, size * tilt * 0.12); g.fill();
      }
      g.restore();
    }

    // ---------- Drawing ----------
    draw(ctx) {
      const W = SA.W, H = SA.H, t = this.t;
      SA.spaceBg(ctx, '#05071d', '#1a1040');
      SA.nebula(ctx, t, [{ x: 0.2, y: 0.25, r: 380, c: 'rgba(120,80,220,0.16)' }, { x: 0.8, y: 0.7, r: 340, c: 'rgba(40,140,220,0.12)' }]);
      this.stars.draw(ctx, t, 0);
      ctx.save();
      if (this.shake > 0) ctx.translate(SA.rand(-6, 6) * this.shake, SA.rand(-6, 6) * this.shake);
      if (this.mode === 'orbits') this.drawOrbits(ctx, t);
      else this.drawCraters(ctx, t);
      this.drawAim(ctx, t);
      this.fx.draw(ctx);
      ctx.restore();
    }

    drawOrbits(ctx, t) {
      const s = this.sun;
      // Faint guide rings, then trails, the Sun and the bodies.
      ctx.strokeStyle = 'rgba(160,180,255,0.08)';
      ctx.lineWidth = 2;
      for (const r of [150, 260, 380]) { SA.circle(ctx, s.x, s.y, r * this.k); ctx.stroke(); }
      for (const b of this.bodies) {
        const tr = b.trail, col = b.kind === 'comet' ? '#9fe6ff' : (SA.BODY[b.body] && SA.BODY[b.body].color) || '#ffffff';
        if (tr.length < 4) continue;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        // Drawn in a few pieces that fade toward the tail (cheaper than one stroke per segment).
        const pieces = 6, n = tr.length / 2, per = Math.ceil(n / pieces);
        for (let p = 0; p < pieces; p++) {
          const a = p * per, b = Math.min(n - 1, (p + 1) * per);
          if (b <= a) continue;
          ctx.strokeStyle = SA.rgba(col, ((p + 1) / pieces) * 0.7);
          ctx.beginPath();
          ctx.moveTo(tr[a * 2], tr[a * 2 + 1]);
          for (let i = a + 1; i <= b; i++) ctx.lineTo(tr[i * 2], tr[i * 2 + 1]);
          ctx.stroke();
        }
      }
      SA.drawBody(ctx, 'sun', s.x, s.y, s.r, { t, halo: 1.9 });
      for (const b of this.bodies) {
        const dx = s.x - b.x, dy = s.y - b.y, d = Math.hypot(dx, dy) || 1;
        if (b.kind === 'comet') {
          SA.drawComet(ctx, b.x, b.y, b.r, { ang: Math.atan2(-dy, -dx), tail: SA.clamp(1.3 - d / (320 * this.k), 0.15, 1), t, bend: 0.6, len: 0.55 });
        } else {
          SA.drawBody(ctx, b.body, b.x, b.y, b.r, { t: t + b.spin, lx: dx / d, ly: dy / d });
        }
      }
      if (this.bodies.length === 0 && !this.aim) {
        ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 3);
        SA.label(ctx, 'Drag anywhere to fling a planet!', s.x, s.y + s.r + 60 * this.k, 22, '#fff3c4');
        ctx.globalAlpha = 1;
      }
    }

    drawCraters(ctx, t) {
      const W = SA.W, H = SA.H, m = this.moon;
      // Earth hangs in the black sky above the Moon.
      SA.drawBody(ctx, 'earth', W * 0.84, H * 0.26, 46 * this.k, { t, lx: -0.8, ly: -0.2 });
      const glow = ctx.createRadialGradient(m.x, m.y, m.R * 0.98, m.x, m.y, m.R * 1.03);
      glow.addColorStop(0, 'rgba(220,220,255,0.25)');
      glow.addColorStop(1, 'rgba(220,220,255,0)');
      ctx.fillStyle = glow;
      SA.circle(ctx, m.x, m.y, m.R * 1.03); ctx.fill();
      this.bakeMoon(false);
      const c = this.moonCanvas;
      ctx.drawImage(c, 0, 0, c.w, c.h);
      for (const r of this.rocks) {
        // A short glowing streak behind fast rocks.
        const sp = Math.hypot(r.vx, r.vy);
        if (sp > 200) {
          const tl = Math.min(0.12, 50 / sp);
          const g = ctx.createLinearGradient(r.x, r.y, r.x - r.vx * tl, r.y - r.vy * tl);
          g.addColorStop(0, 'rgba(255,220,160,0.6)');
          g.addColorStop(1, 'rgba(255,220,160,0)');
          ctx.strokeStyle = g;
          ctx.lineWidth = r.r * 1.2;
          ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x - r.vx * tl, r.y - r.vy * tl); ctx.stroke();
        }
        SA.drawRock(ctx, r.x, r.y, r.r, { seed: r.seed, kind: r.seed % 3 === 0 ? 'dark' : 'stony', rot: r.rot });
      }
      if (this.craterCount === 0 && !this.aim && !this.rocks.length) {
        ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 3);
        SA.label(ctx, 'Drag in the sky and let go!', W * 0.42, H * 0.3, 22, '#fff3c4');
        SA.emoji(ctx, '👆', W * 0.42 + Math.sin(t * 2) * 30, H * 0.38, 40);
        ctx.globalAlpha = 1;
      }
    }

    // While dragging: the new body or rock, an arrow, and a dotted preview of its path.
    drawAim(ctx, t) {
      const a = this.aim;
      if (!a) return;
      const v = this.assisted(a, this.aimVel(a)), tap = Math.hypot(a.x - a.x0, a.y - a.y0) < 12;
      let x = a.x0, y = a.y0, vx = v.x, vy = v.y;
      if (this.mode === 'orbits' && tap) {
        const s = this.sun, dx = x - s.x, dy = y - s.y, d = Math.max(1, Math.hypot(dx, dy)), sp = Math.sqrt(this.g / d);
        vx = (dy / d) * sp; vy = (-dx / d) * sp;
      }
      ctx.fillStyle = 'rgba(255,240,170,0.85)';
      const steps = SA.easy() ? 320 : 220, h = 1 / 30;
      for (let i = 0; i < steps; i++) {
        if (this.mode === 'orbits') {
          const p = this.pull(x, y);
          if (p.d < this.sun.r) break;
          vx += p.ax * h; vy += p.ay * h;
        } else {
          const m = this.moon, dx = m.x - x, dy = m.y - y, d = Math.hypot(dx, dy);
          if (d <= m.R) break;
          vx += (dx / d) * ROCK_G * h; vy += (dy / d) * ROCK_G * h;
        }
        x += vx * h; y += vy * h;
        if (i % 3 === 0) { ctx.globalAlpha = 0.85 * (1 - i / steps); SA.circle(ctx, x, y, 2.6); ctx.fill(); }
      }
      ctx.globalAlpha = 1;
      if (!tap) {
        ctx.strokeStyle = '#ffe066';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        const ex = a.x, ey = a.y, ang = Math.atan2(ey - a.y0, ex - a.x0);
        ctx.beginPath(); ctx.moveTo(a.x0, a.y0); ctx.lineTo(ex, ey);
        ctx.moveTo(ex, ey); ctx.lineTo(ex - Math.cos(ang - 0.5) * 16, ey - Math.sin(ang - 0.5) * 16);
        ctx.moveTo(ex, ey); ctx.lineTo(ex - Math.cos(ang + 0.5) * 16, ey - Math.sin(ang + 0.5) * 16);
        ctx.stroke();
      }
      if (this.mode === 'orbits') {
        const K = KINDS[this.kind];
        if (this.kind === 'comet') SA.drawComet(ctx, a.x0, a.y0, K.r * this.k, { tail: 0.2, t, ang: Math.atan2(a.y0 - this.sun.y, a.x0 - this.sun.x) });
        else { ctx.globalAlpha = 0.85; SA.drawBody(ctx, K.bodies[0], a.x0, a.y0, K.r * this.k, { t }); ctx.globalAlpha = 1; }
      } else SA.drawRock(ctx, a.x0, a.y0, 12 * this.k, { seed: 3, kind: 'stony' });
    }
  }
  SA.PlaygroundScene = PlaygroundScene;
})(window.SA);
