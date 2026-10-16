// Bonus mission: "Comet Ride". Cosmo rides a comet on its long oval path around the Sun (real
// Kepler motion: slow far out, zooming close to the Sun). Far away it is a frozen dirty snowball;
// near the Sun its ice turns to gas and the tail grows. Three times the ride pauses and the child
// drags the tail the way the Sun's wind blows it: always AWAY from the Sun, even when that means
// the tail goes in front of the comet. Then Earth passes through the comet's old dust, and the
// child catches shooting stars in a meteor shower. Nothing can be failed: a wrong tail just
// swings loose with a gentle tip, and missed meteors simply fade away.
(function (SA) {
  const TAU = Math.PI * 2;
  // Checkpoints by mean anomaly (the ride starts far out at M = PI and ends there one orbit later).
  const STOPS = [
    { M: Math.PI * 1.75,
      ask: 'The comet is warming up, and its ice is turning into gas! Drag the tail the way the Sun\'s wind blows it! 👆',
      fact: ['Yes! Sunlight and the Sun\'s wind push the comet\'s gas and dust away. So the tail points AWAY from the Sun! ☀️💨'] },
    { M: Math.PI * 2 + 0.18,
      ask: 'We\'re right next to the Sun! Drag the tail again! 👆',
      fact: ['Whoosh! Close to the Sun, comets zoom fastest, and their tails grow longest.', 'A comet\'s tail can be millions of kilometres long! 🤩'] },
    { M: Math.PI * 2.4,
      ask: 'Now we\'re zooming away from the Sun. Which way does the tail point? Drag it! 👆',
      fact: ['Look! Now the tail is in FRONT of the comet! 🤯', 'Even when the comet flies away from the Sun, its tail still points away from the Sun.'] },
  ];

  class CometScene {
    constructor() {
      this.stars = new SA.Starfield(260, 61);
      this.fx = new SA.Particles();
      this.t = 0;
      const rnd = SA.seeded(23);
      this.wind = [];
      for (let i = 0; i < 46; i++) this.wind.push({ a: rnd() * TAU, d: rnd(), sp: 0.25 + rnd() * 0.3 });
      // Night-sky hills for the meteor shower.
      this.hills = [];
      for (let i = 0; i <= 24; i++) this.hills.push(rnd());
    }

    layout() {
      const W = SA.W, H = SA.H;
      // Kept in the upper three quarters: Cosmo's speech bubble covers the bottom on phones.
      const phone = H < 720;
      this.sun = { x: W * 0.27, y: H * (phone ? 0.42 : 0.46), r: H * 0.075 };
      const ra = W * 0.6, rp = H * 0.13;
      this.a = (ra + rp) / 2;
      this.e = (ra - rp) / (ra + rp);
      this.b = Math.min(this.a * Math.sqrt(1 - this.e * this.e), H * (phone ? 0.24 : 0.29));
      this.ra = ra;
      this.rp = rp;
      this.rEarth = H * 0.24;
      this.s = 20;   // nucleus size (logical units, so phones draw it bigger)
    }

    resize() { this.layout(); }

    enter() {
      SA.ui.setScene('game');
      SA.audio.music('comet');
      this.layout();
      this.M = Math.PI;
      this.stop = 0;
      this.phase = 'intro';
      this.view = 'orbit';
      this.misses = 0;
      this.stopMiss = 0;
      this.dragging = false;
      this.tailAng = null;   // while the child is choosing the tail direction
      this.locked = 0;       // a little "snap" pulse when the tail is right
      this.windBoost = 0;
      this.trail = [];
      this.earthA = 2.2;
      this.fade = 0;
      this.fadeDir = 0;
      this.meteors = [];
      this.wishes = 0;
      this.spawnT = 0.6;
      this.tailK = 0;
      SA.ui.setInfo('☄️ Comet Ride');
      SA.ui.banner('The Comet', SA.NICKNAMES.comet).then(() => SA.scene !== this ? new Promise(() => {}) : SA.ui.say(SA.introLines('comet', [
        'Hop on! Today we\'re riding a COMET! ☄️',
        'Comets are giant dirty snowballs made of ice, rock and dust. They travel around the Sun on long, stretched-out paths.',
        'Out here, far from the Sun, it\'s freezing, so our comet has no tail yet. Tap the comet to give it a push! 👆',
      ]))).then(() => {
        if (SA.scene !== this) return;
        this.phase = 'push';
        SA.ui.hint('Tap the comet to give it a push toward the Sun! 👆', 0);
      });
    }

    exit() { SA.ui.hideTalk(); this.dragging = false; }

    // ---------- Orbit ----------
    // Eccentric anomaly from mean anomaly (Kepler's equation, a few Newton steps).
    ecc(M) {
      let E = M;
      for (let i = 0; i < 8; i++) E -= (E - this.e * Math.sin(E) - M) / (1 - this.e * Math.cos(E));
      return E;
    }
    posAt(M) {
      const E = this.ecc(M), cx = this.sun.x + this.a * this.e;
      return { x: cx - this.a * Math.cos(E), y: this.sun.y - this.b * Math.sin(E), E };
    }
    comet() { return this.posAt(this.M); }
    dist(p) { return Math.hypot(p.x - this.sun.x, p.y - this.sun.y); }
    // 0 (frozen) .. 1 (blazing): the tail grows as the comet nears the Sun.
    tailFor(p) { return SA.clamp((this.ra * 0.72 - this.dist(p)) / (this.ra * 0.72 - this.rp * 1.4), 0, 1); }
    awayAng(p) { return Math.atan2(p.y - this.sun.y, p.x - this.sun.x); }

    // ---------- Input ----------
    onDown(x, y) {
      if (this.view === 'sky') { this.tapSky(x, y); return; }
      if (this.phase === 'push') {
        this.phase = 'travel';
        SA.ui.hideTalk();
        SA.audio.play('whoosh');
        const p = this.comet();
        this.fx.spawn('sparkle', p.x, p.y, 14, { color: '#bff4ff' });
        return;
      }
      if (this.phase === 'tail') {
        this.dragging = true;
        SA.ui.hideTalk();
        this.aim(x, y);
        return;
      }
      if (this.phase === 'travel') {
        // A tap during the ride: Cosmo whoops and the comet sheds a puff of sparkly ice.
        const p = this.comet();
        this.fx.spawn('sparkle', p.x, p.y, 6, { color: '#dff8ff' });
        SA.audio.play('blip');
      }
    }
    onMove(x, y) { if (this.dragging && this.phase === 'tail') this.aim(x, y); }
    onUp() {
      if (!this.dragging) return;
      this.dragging = false;
      if (this.phase !== 'tail' || this.tailAng == null) return;
      // Let go pointing the wrong way: the tail flops loose and Cosmo gives a gentle clue.
      this.misses++;
      this.stopMiss++;
      this.tailAng = null;
      this.windBoost = 3;
      SA.audio.play('boing');
      SA.ui.hint(this.stopMiss >= (SA.easy() ? 1 : 2)
        ? 'Follow the dotted arrow! The Sun\'s wind blows outward from the Sun. ☀️➡️'
        : 'Hmm! See the Sun\'s wind streaming out? Which way would it blow the tail? ☀️💨', 0);
    }

    aim(x, y) {
      const p = this.comet();
      if (Math.hypot(x - p.x, y - p.y) < 24) return;
      this.tailAng = Math.atan2(y - p.y, x - p.x);
      if (Math.random() < 0.25) SA.audio.play('spin');
      const tol = (SA.easy() ? 50 : 32) * Math.PI / 180;
      if (Math.abs(SA.wrapAngle(this.tailAng - this.awayAng(p))) < tol) this.tailRight(p);
    }

    tailRight(p) {
      this.phase = 'cheer';
      this.dragging = false;
      this.tailAng = null;
      this.locked = 1;
      SA.audio.play('collect');
      setTimeout(() => SA.audio.play('ding'), 180);
      const a = this.awayAng(p);
      this.fx.spawn('sparkle', p.x + Math.cos(a) * 90, p.y + Math.sin(a) * 90, 22, { color: '#9fe4ff' });
      const st = STOPS[this.stop];
      setTimeout(() => {
        if (SA.scene !== this) return;
        SA.ui.say(st.fact).then(() => {
          if (SA.scene !== this) return;
          this.stop++;
          this.phase = 'travel';
        });
      }, 700);
    }

    // ---------- Meteor shower ----------
    tapSky(x, y) {
      if (this.phase !== 'meteors') return;
      const reach = SA.easy() ? 100 : 70;
      for (const m of this.meteors) {
        if (m.caught) continue;
        // Anywhere near the bright head or the front of its streak counts.
        let best = 1e9;
        for (let u = 0; u <= 1; u += 0.25) best = Math.min(best, Math.hypot(x - (m.x - m.vx * 0.12 * u), y - (m.y - m.vy * 0.12 * u)));
        if (best < reach) { this.catchMeteor(m); return; }
      }
    }

    catchMeteor(m) {
      m.caught = true;
      this.wishes++;
      SA.audio.play('collect');
      setTimeout(() => SA.audio.play('ding'), 120);
      this.fx.spawn('sparkle', m.x, m.y, 18, { color: SA.pick(['#fff3a0', '#bff4ff', '#ffb3e6']) });
      this.fx.text(m.x, m.y - 40, SA.pick(['Wish! ✨', 'Make a wish! 🌠', 'Sparkle! ✨', 'Wheee! 🌠']), '#fff3a0');
      const need = this.wishNeed();
      SA.ui.setInfo('🌠 Wishes ' + Math.min(this.wishes, need) + ' / ' + need);
      SA.ui.bumpInfo();
      if (this.wishes === 1) SA.ui.hideTalk();
      if (this.wishes >= need) {
        this.phase = 'cheer';
        setTimeout(() => {
          if (SA.scene !== this) return;
          SA.ui.say([
            'Wow! You caught ' + need + ' shooting stars! 🌠',
            'Shooting stars are called METEORS. Most are tiny bits of comet dust, smaller than a grain of sand, burning up high in the sky! ✨',
          ]).then(() => { if (SA.scene === this) this.finish(); });
        }, 900);
      }
    }
    wishNeed() { return SA.easy() ? 5 : 6; }

    spawnMeteor() {
      const W = SA.W, H = SA.H;
      // The radiant: where the shower seems to come from. Meteors head down and to the right,
      // away from Cosmo's speech bubble in the lower left.
      const rx = W * 0.26, ry = H * 0.08;
      const a = SA.rand(0.06, 0.4) * Math.PI;
      const sp = (SA.easy() ? 190 : 260) * (0.85 + Math.random() * 0.3);
      const d0 = SA.rand(40, 220);
      this.meteors.push({ x: rx + Math.cos(a) * d0, y: ry + Math.sin(a) * d0, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: SA.easy() ? 2.6 : 1.9, caught: false });
    }

    // ---------- Update ----------
    update(dt) {
      this.t += dt;
      this.fx.update(dt);
      this.locked = Math.max(0, this.locked - dt * 1.5);
      this.windBoost = Math.max(0, this.windBoost - dt);
      for (const w of this.wind) { w.d += w.sp * dt * 0.35; if (w.d > 1) w.d -= 1; }
      this.earthA += dt * 0.12;

      if (this.fadeDir) {
        this.fade = SA.clamp(this.fade + this.fadeDir * dt * 1.6, 0, 1);
        if (this.fadeDir > 0 && this.fade >= 1) { this.view = 'sky'; this.fadeDir = -1; this.startSky(); }
        else if (this.fadeDir < 0 && this.fade <= 0) this.fadeDir = 0;
      }

      if (this.view === 'orbit') {
        const p = this.comet();
        this.tailK = this.tailFor(p);
        if (this.phase === 'travel') {
          // Kepler's second law does the drama: slow far out, a quick swing past the Sun.
          // Far out the clock runs faster, so the child isn't kept waiting.
          const far = this.dist(p) > this.ra * 0.7 ? 2.4 : 1;
          const before = this.M;
          this.M += (TAU / 26) * far * dt;
          const st = STOPS[this.stop];
          if (st && before < st.M && this.M >= st.M) {
            this.M = st.M;
            this.phase = 'tail';
            this.stopMiss = 0;
            this.tailAng = null;
            SA.audio.play('ping');
            SA.ui.hint(st.ask, 0);
          }
          if (!st && this.M >= Math.PI * 2.85 && !this.toSky) {
            this.toSky = true;
            this.phase = 'cheer';
            SA.ui.say([
              'See the dusty trail our comet left behind? 🌫️',
              'Every year, Earth passes through old comet dust like this. Then we see a METEOR SHOWER! Let\'s go and watch from Earth! 🌠',
            ]).then(() => { if (SA.scene === this) { this.fadeDir = 1; SA.audio.play('whoosh'); } });
          }
          // A dusty trail stays along the path near the Sun.
          if (this.tailK > 0.15 && (!this.trail.length || Math.hypot(p.x - this.trail[this.trail.length - 1].x, p.y - this.trail[this.trail.length - 1].y) > 9)) {
            this.trail.push({ x: p.x, y: p.y });
          }
          // Ice turning to gas: sparkly bits fly off down the tail.
          if (Math.random() < this.tailK * dt * 16) {
            const a = this.awayAng(p) + SA.rand(-0.5, 0.5), sp = SA.rand(40, 110);
            this.fx.list.push({ kind: 'sparkle', x: p.x, y: p.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: SA.rand(0.5, 0.9), size: SA.rand(3, 6), rot: a, color: '#dff8ff' });
          }
        }
      } else if (this.phase === 'meteors') {
        this.spawnT -= dt;
        if (this.spawnT <= 0 && this.meteors.filter(m => !m.caught).length < 3) {
          this.spawnT = SA.rand(0.7, 1.3);
          this.spawnMeteor();
        }
      }
      for (const m of this.meteors) { m.life += dt; if (!m.caught) { m.x += m.vx * dt; m.y += m.vy * dt; } }
      this.meteors = this.meteors.filter(m => m.life < m.max && !(m.caught && m.life > m.max * 0.4));
    }

    startSky() {
      this.phase = 'meteors';
      this.meteors = [];
      this.spawnT = 1;
      const need = this.wishNeed();
      SA.ui.setInfo('🌠 Wishes 0 / ' + need);
      SA.ui.hint('A meteor shower! Tap the shooting stars to make a wish! 🌠', 0);
    }

    async finish() {
      this.phase = 'done';
      const stars = this.misses <= 1 ? 3 : this.misses <= 3 ? 2 : 1;
      SA.audio.play('cheer');
      SA.celebrate(120);
      await SA.ui.banner('Mission Complete!', '☄️ You rode a comet around the Sun', 'gold', stars);
      if (SA.scene !== this) return;
      await SA.ui.say([
        'You rode a comet all the way around the Sun! 🎉',
        'The most famous comet, Halley\'s Comet, comes back about every 76 years. Its next visit is in 2061. How old will you be then? 🤔',
      ]);
      SA.finishPlanet('comet', stars);
    }

    // ---------- Drawing ----------
    draw(ctx) {
      if (this.view === 'sky') this.drawSky(ctx);
      else this.drawOrbit(ctx);
      this.fx.draw(ctx);
      if (this.fade > 0) {
        ctx.fillStyle = 'rgba(4,5,20,' + this.fade + ')';
        ctx.fillRect(0, 0, SA.W, SA.H);
      }
    }

    drawOrbit(ctx) {
      const W = SA.W, H = SA.H, t = this.t, s = this.sun;
      SA.spaceBg(ctx, '#050720', '#160f3a');
      this.stars.draw(ctx, t, 0);

      // Earth's path and Earth, small and far inside the comet's long oval.
      ctx.strokeStyle = 'rgba(120,180,255,0.25)';
      ctx.lineWidth = 2;
      SA.circle(ctx, s.x, s.y, this.rEarth);
      ctx.stroke();
      const ex = s.x + Math.cos(this.earthA) * this.rEarth, ey = s.y + Math.sin(this.earthA) * this.rEarth;
      SA.drawBody(ctx, 'earth', ex, ey, 9, { t, lx: SA.clamp((s.x - ex) / 60, -1, 1), ly: SA.clamp((s.y - ey) / 60, -1, 1) });

      // The comet's path, dotted, with the stops marked by sparkly question stars.
      ctx.save();
      ctx.setLineDash([4, 10]);
      ctx.strokeStyle = 'rgba(190,230,255,0.28)';
      ctx.lineWidth = 2;
      SA.ellipse(ctx, s.x + this.a * this.e, s.y, this.a, this.b);
      ctx.stroke();
      ctx.restore();
      for (let i = this.stop; i < STOPS.length; i++) {
        if (this.phase === 'tail' && i === this.stop) continue;
        const q = this.posAt(STOPS[i].M);
        ctx.fillStyle = 'rgba(255,230,120,' + (0.55 + 0.35 * Math.sin(t * 3 + i)) + ')';
        SA.starPath(ctx, q.x, q.y, 9, 0.45, 5, t * 0.5);
        ctx.fill();
      }
      // The dusty trail the comet leaves behind near the Sun.
      ctx.fillStyle = 'rgba(255,225,190,0.45)';
      for (let i = 0; i < this.trail.length; i++) {
        const q = this.trail[i];
        SA.circle(ctx, q.x + Math.sin(i * 1.7) * 3, q.y + Math.cos(i * 2.3) * 3, 1.6 + (i % 3) * 0.5);
        ctx.fill();
      }

      // The Sun, and its wind streaming outward in every direction.
      const boost = this.phase === 'tail' ? 1 + Math.min(1, this.windBoost) : 0.6;
      ctx.lineCap = 'round';
      for (const w of this.wind) {
        const d0 = s.r * 1.3 + w.d * H * 0.5, len = 16 + w.d * 18;
        ctx.strokeStyle = 'rgba(255,220,130,' + 0.22 * boost * (1 - w.d) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s.x + Math.cos(w.a) * d0, s.y + Math.sin(w.a) * d0);
        ctx.lineTo(s.x + Math.cos(w.a) * (d0 + len), s.y + Math.sin(w.a) * (d0 + len));
        ctx.stroke();
      }
      SA.drawBody(ctx, 'sun', s.x, s.y, s.r, { t });
      SA.label(ctx, 'Sun', s.x, s.y + s.r * 1.9 + 8, 16, '#ffe8a8');
      if (this.phase === 'tail') SA.label(ctx, 'Sun\'s wind ➜', s.x + s.r * 1.6, s.y - s.r * 1.7, 15, 'rgba(255,230,150,0.95)', { align: 'left', weight: 800 });

      // The comet with Cosmo riding on top.
      const p = this.comet();
      const away = this.awayAng(p);
      // While the child is choosing, the tail follows the finger (or hangs loose, asking).
      let ang = away, k = this.tailK;
      if (this.phase === 'tail') {
        ang = this.tailAng != null ? this.tailAng : this.awayAng(p) + Math.PI + Math.sin(t * 2) * 0.25;
        k = Math.max(0.35, k) * 0.85;
        if (this.stopMiss >= (SA.easy() ? 1 : 2)) this.drawArrow(ctx, p, away, t);
      }
      const v = this.posAt(this.M + 0.01);
      const bend = Math.sign(SA.wrapAngle(Math.atan2(v.y - p.y, v.x - p.x) - ang)) || 1;
      if (this.phase === 'tail' && this.tailAng == null) {
        ctx.save();
        ctx.globalAlpha = 0.45 + 0.2 * Math.sin(t * 4);
        SA.drawComet(ctx, p.x, p.y, this.s, { ang, tail: k, t, bend: -bend, len: 0.6 });
        ctx.restore();
        SA.label(ctx, '?', p.x + Math.cos(ang) * 70, p.y + Math.sin(ang) * 70, 30, '#fff3a0');
      } else {
        SA.drawComet(ctx, p.x, p.y, this.s, { ang, tail: k, t, bend: -bend, len: 0.6 });
      }
      if (this.locked > 0) {
        ctx.strokeStyle = 'rgba(126,224,138,' + this.locked + ')';
        ctx.lineWidth = 4;
        SA.circle(ctx, p.x, p.y, 30 + (1 - this.locked) * 40);
        ctx.stroke();
      }
      SA.drawCosmo(ctx, p.x, p.y - this.s - 22, 0.38, { t, mood: this.phase === 'cheer' || this.tailK > 0.6 ? 'joy' : null, wave: this.phase === 'push' });

      if (this.phase === 'push' || (this.phase === 'tail' && !this.dragging && this.stopMiss === 0)) {
        // A finger sliding outward along the right direction (or tapping the comet to start).
        const fa = this.phase === 'tail' ? away : Math.PI * 0.75;
        const slide = this.phase === 'tail' ? 70 + ((t * 0.8) % 1) * 60 : 60;
        const fx = p.x + Math.cos(fa) * slide, fy = p.y + Math.sin(fa) * slide + (this.phase === 'tail' ? 0 : Math.abs(Math.sin(t * 3)) * 8);
        SA.emoji(ctx, '👆', fx + 8, fy + 18, 36);
      }
      if (this.phase === 'travel' && this.tailK > 0.05 && this.tailK < 0.4 && this.stop === 0) {
        SA.pill(ctx, '🌡️ Warming up! Ice is turning into gas', W / 2, 40, 18, { color: '#e8fbff', edge: 'rgba(150,220,255,0.8)' });
      }
    }

    // A dotted arrow from the comet pointing away from the Sun: help after a couple of tries.
    drawArrow(ctx, p, a, t) {
      const pulse = 0.55 + 0.35 * Math.sin(t * 5);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(a);
      ctx.strokeStyle = 'rgba(255,240,150,' + pulse + ')';
      ctx.fillStyle = 'rgba(255,240,150,' + pulse + ')';
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 8]);
      ctx.lineDashOffset = -t * 30;
      ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(120, 0); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(136, 0); ctx.lineTo(116, -12); ctx.lineTo(116, 12); ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    // The meteor shower, watched from a hill on Earth at night.
    drawSky(ctx) {
      const W = SA.W, H = SA.H, t = this.t;
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#04061c');
      g.addColorStop(0.65, '#121a4a');
      g.addColorStop(1, '#2a2f6e');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      this.stars.draw(ctx, t, 0);
      // Meteors: a bright head and a fading streak, all coming from the same part of the sky.
      ctx.lineCap = 'round';
      for (const m of this.meteors) {
        if (m.caught) continue;
        const k = m.life / m.max, a = k < 0.15 ? k / 0.15 : k > 0.75 ? (1 - k) / 0.25 : 1;
        const tx = m.x - m.vx * 0.4, ty = m.y - m.vy * 0.4;
        const sg = ctx.createLinearGradient(m.x, m.y, tx, ty);
        sg.addColorStop(0, 'rgba(255,255,255,' + a + ')');
        sg.addColorStop(0.3, 'rgba(190,230,255,' + a * 0.6 + ')');
        sg.addColorStop(1, 'rgba(150,180,255,0)');
        ctx.strokeStyle = sg;
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(tx, ty); ctx.stroke();
        const hg = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 18);
        hg.addColorStop(0, 'rgba(255,255,240,' + a + ')');
        hg.addColorStop(1, 'rgba(255,240,200,0)');
        ctx.fillStyle = hg;
        SA.circle(ctx, m.x, m.y, 18); ctx.fill();
      }
      // Hills, a little house with a lit window, and Cosmo watching from the hilltop.
      const hy = x => H * 0.8 - Math.sin(x / W * Math.PI * 1.3 + 0.4) * H * 0.07 - this.hills[Math.floor(x / W * 24)] * 6;
      ctx.fillStyle = '#0a0f2c';
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += W / 48) ctx.lineTo(x, hy(x));
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();
      const hx = W * 0.6, hb = hy(hx);
      ctx.fillStyle = '#141a40';
      ctx.fillRect(hx - 26, hb - 34, 52, 36);
      ctx.beginPath(); ctx.moveTo(hx - 32, hb - 32); ctx.lineTo(hx, hb - 58); ctx.lineTo(hx + 32, hb - 32); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd77a';
      ctx.fillRect(hx - 12, hb - 24, 12, 11);
      ctx.fillStyle = '#0d1333';
      for (const tx of [W * 0.12, W * 0.47, W * 0.93]) {
        const ty = hy(tx);
        ctx.fillRect(tx - 3, ty - 26, 6, 26);
        SA.circle(ctx, tx, ty - 34, 16); ctx.fill();
      }
      const cx = W * 0.8, cy = hy(cx) - 40;
      SA.drawCosmo(ctx, cx, cy, 0.7, { t, look: [-0.6, -0.8], mood: this.wishes > 0 && this.phase !== 'meteors' ? 'joy' : null, wave: this.phase === 'meteors' && this.wishes > 0 && Math.sin(t) > 0.6 });
      if (this.phase === 'meteors' && this.wishes === 0 && this.meteors.length) {
        const m = this.meteors.find(q => !q.caught && q.life < q.max * 0.6);
        if (m) SA.emoji(ctx, '👆', m.x + 26, m.y + 34 + Math.abs(Math.sin(t * 4)) * 6, 34);
      }
    }
  }
  SA.CometScene = CometScene;
})(window.SA);
