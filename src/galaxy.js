// Deep-space finale: "Galaxy Trip" (opens once Pluto is found; tap the swirly galaxy on the map).
// 1. Hold to zoom out: the Solar System shrinks to a dot among its star neighbours, then the whole
//    Milky Way appears, with a "You are here" pin on one of its arms.
// 2. Tap three things in the galaxy: a pink star nursery, a ball-shaped star cluster and our Sun.
// 3. Fly to the very middle: the giant black hole Sagittarius A*. It is shown gently and truly:
//    a dark middle inside a glowing orange ring (like the real 2022 picture), and stars that simply
//    orbit it, like planets round the Sun. Fling stars to make 3 orbits; a star flung right at it
//    swirls into the glowing ring, because nothing gets back out, not even light.
// 4. Zoom right out to see other galaxies, with our neighbour Andromeda.
// Nothing can be failed; Little Explorer mode nudges wild throws into orbit.
(function (SA) {
  const TAU = Math.PI * 2;
  // Places in the galaxy (in the galaxy's own frame: angle and distance as a fraction of its radius).
  const SPOTS = [
    { id: 'sun', a: 1.8, f: 0.51, name: 'Our Sun',
      lines: ['You are here! 📍 Our Sun and all its planets are way out here, in one of the galaxy\'s arms.', 'Our Sun takes about 230 million years to go once around the galaxy. The last time it was here, the very first dinosaurs were walking on Earth! 🦕'] },
    { id: 'nursery', a: 4.6, f: 0.45, name: 'Star nursery',
      lines: ['Ooh, a pink glowing cloud! 💗 This is a star nursery.', 'Inside clouds of gas and dust like this, baby stars are being born right now!'] },
    { id: 'cluster', a: 5.75, f: 0.86, name: 'Star cluster',
      lines: ['Look at this big ball of stars! ✨ It\'s called a star cluster.', 'Some clusters have hundreds of thousands of stars, all packed together and very, very old.'] },
  ];
  const ORBITS = 3;

  class GalaxyScene {
    constructor() {
      this.stars = new SA.Starfield(260, 977);
      this.fx = new SA.Particles();
      this.t = 0;
      const rnd = SA.seeded(31);
      // Star neighbours, and the dust of more and more stars as we zoom out.
      this.near = [];
      for (let i = 0; i < 70; i++) this.near.push({ a: rnd() * TAU, d: 0.25 + rnd() * 1.1, s: 1 + rnd() * 2.2, c: SA.pick(['#ffffff', '#bfd6ff', '#ffe2b0', '#ffc2a0']) });
      this.far = [];
      for (let i = 0; i < 28; i++) this.far.push({ x: rnd(), y: rnd(), r: 6 + rnd() * 16, tilt: 0.3 + rnd() * 0.7, rot: rnd() * TAU, hue: rnd() });
    }

    layout() {
      const W = SA.W, H = SA.H;
      // Kept a little above the middle: Cosmo's bubble covers the bottom on phones.
      this.c = { x: W * 0.55, y: H * 0.47 };
      this.k = H / 720;
      this.gR = H * 0.4;
      this.R = H * 0.085;   // the black hole's dark middle
      this.g = 1.6e7 * this.k * this.k * this.k;
    }
    resize() { this.layout(); }

    enter() {
      SA.ui.setScene('game');
      SA.audio.music('galaxy');
      this.layout();
      this.phase = 'intro';
      this.view = 'zoom';
      this.z = 0;
      this.stop = 1;
      this.holding = false;
      this.seen = {};
      this.seenN = 0;
      this.dive = 0;
      this.fade = 0;
      this.fadeDir = 0;
      this.bodies = [];
      this.aim = null;
      this.orbits = 0;
      this.flash = 0;
      this.told = {};
      this.outroT = 0;
      SA.ui.setInfo('🌌 Galaxy Trip');
      SA.ui.banner('The Milky Way', SA.NICKNAMES.galaxy).then(() => SA.scene !== this ? new Promise(() => {}) : SA.ui.say(SA.introLines('galaxy', [
        'This is our biggest trip EVER! 🚀 We\'re going to fly far, far away from the Sun and see our whole galaxy!',
        'Here\'s our Solar System: the Sun and its eight planets. It\'s our home in space.',
        'Hold your finger on the screen to zoom out! 👆',
      ]))).then(() => {
        if (SA.scene !== this) return;
        this.phase = 'zoom';
        SA.ui.hint('Hold your finger down to zoom out! 👆', 0);
      });
    }

    exit() { SA.ui.hideTalk(); this.holding = false; this.aim = null; }

    // ---------- Input ----------
    onDown(x, y) {
      if (this.phase === 'zoom') { this.holding = true; SA.ui.hideTalk(); SA.audio.play('whoosh'); return; }
      if (this.phase === 'tour') { this.tapGalaxy(x, y); return; }
      if (this.phase === 'play') {
        if (Math.hypot(x - this.c.x, y - this.c.y) < this.R * 1.6) {
          SA.audio.play('ping');
          SA.ui.hint('That\'s the black hole! Don\'t worry, it\'s super far from Earth. Fling a star around it! ⭐', 4);
          return;
        }
        this.aim = { x0: x, y0: y, x, y };
        SA.audio.play('blip');
      }
    }
    onMove(x, y) { if (this.aim) { this.aim.x = x; this.aim.y = y; } }
    onUp() {
      this.holding = false;
      const a = this.aim;
      if (!a) return;
      this.aim = null;
      if (this.phase !== 'play') return;
      const tap = Math.hypot(a.x - a.x0, a.y - a.y0) < 12;
      let v = this.aimVel(a);
      if (tap) {
        const dx = a.x0 - this.c.x, dy = a.y0 - this.c.y, d = Math.max(1, Math.hypot(dx, dy)), sp = Math.sqrt(this.g / d);
        v = { x: (dy / d) * sp, y: (-dx / d) * sp };
      } else if (SA.easy()) {
        const as = SA.orbitAssist(a.x0, a.y0, v.x, v.y, this.c.x, this.c.y, this.g, this.R * 2.2, Math.max(SA.W, SA.H) * 0.62);
        v = { x: as.vx, y: as.vy };
        if (as.nudged && !this.told.assist) { this.told.assist = true; SA.ui.hint('Little Explorer helper: I nudged your star into orbit! 🧸', 4); }
      }
      this.addStar(a.x0, a.y0, v.x, v.y);
      SA.audio.play(tap ? 'pop' : 'whoosh');
      this.fx.spawn('sparkle', a.x0, a.y0, 8, { color: '#fff3a0' });
    }
    aimVel(a) { return { x: (a.x - a.x0) * 2.2, y: (a.y - a.y0) * 2.2 }; }

    addStar(x, y, vx, vy, opts) {
      const dx = x - this.c.x, dy = y - this.c.y;
      const b = Object.assign({ x, y, vx, vy, trail: [], ang: Math.atan2(dy, dx), turn: 0, c: SA.pick(['#fff6d8', '#bfe0ff', '#ffd6a8', '#ffffff']), s: SA.rand(5, 7) }, opts || {});
      if (this.bodies.length > 9) this.bodies.splice(this.bodies.findIndex(o => !o.s2), 1);
      this.bodies.push(b);
      return b;
    }

    // ---------- The galaxy ----------
    rot() { return -0.35 - this.t * 0.02; }
    gCenter() {
      // While zooming out, the galaxy grows from around the Sun's spot to its place in the middle.
      if (this.view !== 'zoom') return { x: this.c.x, y: this.c.y, r: this.gR };
      const u = SA.easeInOut(SA.clamp((this.z - 1.3) / 0.7, 0, 1));
      const r = this.gR * Math.pow(7, 1 - u);
      const sp = this.spotIn(SPOTS[0], { x: 0, y: 0, r });
      return { x: this.c.x - sp.x * (1 - u), y: this.c.y - sp.y * (1 - u), r };
    }
    spotIn(s, g) {
      const a = s.a + this.rot();
      return { x: g.x + Math.cos(a) * s.f * g.r, y: g.y + Math.sin(a) * s.f * g.r * 0.92 };
    }

    tapGalaxy(x, y) {
      const g = this.gCenter();
      for (const s of SPOTS) {
        const p = this.spotIn(s, g);
        if (Math.hypot(x - p.x, y - p.y) < (SA.easy() ? 64 : 50)) {
          SA.audio.play('collect');
          this.fx.spawn('sparkle', p.x, p.y, 16, { color: s.id === 'nursery' ? '#ffb3e6' : '#fff3a0' });
          if (!this.seen[s.id]) { this.seen[s.id] = 1; this.seenN++; SA.ui.setInfo('✨ Found ' + this.seenN + ' / ' + SPOTS.length); SA.ui.bumpInfo(); }
          this.phase = 'visit';
          SA.ui.say(s.lines).then(() => {
            if (SA.scene !== this) return;
            this.phase = 'tour';
            if (this.seenN >= SPOTS.length) SA.ui.hint('Now let\'s fly to the very middle of the galaxy! Tap the bright middle! 👆', 0);
          });
          return;
        }
      }
      if (this.seenN >= SPOTS.length && Math.hypot(x - g.x, y - g.y) < this.gR * 0.2) {
        this.phase = 'cheer';
        SA.ui.hideTalk();
        SA.audio.play('launch');
        this.diveT = 0;
        return;
      }
      SA.audio.play('blip');
      this.fx.spawn('sparkle', x, y, 5, { color: '#cfc8ff' });
    }

    // ---------- Update ----------
    update(dt) {
      this.t += dt;
      this.fx.update(dt);
      this.flash = Math.max(0, this.flash - dt * 1.5);
      if (this.fadeDir) {
        this.fade = SA.clamp(this.fade + this.fadeDir * dt * 1.5, 0, 1);
        if (this.fadeDir > 0 && this.fade >= 1) { this.fadeDir = -1; this.onFaded(); }
        else if (this.fadeDir < 0 && this.fade <= 0) this.fadeDir = 0;
      }
      if (this.phase === 'zoom' && this.holding) {
        const before = this.z;
        this.z = Math.min(this.stop, this.z + dt * (SA.easy() ? 0.5 : 0.4));
        if (before < this.stop && this.z >= this.stop) this.reachStop();
      }
      if (this.diveT != null && this.view === 'galaxy') {
        this.diveT += dt;
        if (this.diveT > 1.1 && !this.fadeDir && this.fade === 0) { this.fadeDir = 1; this.next = 'hole'; }
      }
      if (this.view === 'hole') this.updateHole(dt);
      if (this.view === 'outro') this.outroT += dt;
    }

    reachStop() {
      this.holding = false;
      this.phase = 'cheer';
      SA.audio.play('ding');
      const lines = this.stop === 1 ? [
        'See that tiny dot? That\'s our whole Solar System now! ☀️ And all around it are other stars.',
        'Our Sun is a star too. The nearest star to it, Proxima Centauri, is so far away that its light takes about 4 years to reach us!',
        'Let\'s zoom out even more! Hold your finger down again! 👆',
      ] : [
        'WOW! 🤩 This is our galaxy, the MILKY WAY! It\'s a giant spinning swirl of hundreds of billions of stars.',
        'Tap the glowing places in the galaxy to find out what they are! ✨',
      ];
      SA.ui.say(lines).then(() => {
        if (SA.scene !== this) return;
        if (this.stop === 1) { this.stop = 2; this.phase = 'zoom'; SA.ui.hint('Hold your finger down to zoom out more! 👆', 0); }
        else { this.view = 'galaxy'; this.phase = 'tour'; SA.ui.setInfo('✨ Found 0 / ' + SPOTS.length); }
      });
    }

    onFaded() {
      if (this.next === 'hole') {
        this.view = 'hole';
        this.diveT = null;
        this.phase = 'intro';
        // A star called S2 already loops round the black hole on a long oval.
        const d = this.R * 3.4, sp = Math.sqrt(this.g / d) * 1.12;
        this.addStar(this.c.x + d, this.c.y, 0, -sp, { s2: true, c: '#cfe4ff', s: 6 });
        SA.ui.setInfo('⭐ Orbits 0 / ' + ORBITS);
        SA.ui.say([
          'We made it to the middle of our galaxy! Here lives a giant BLACK HOLE called Sagittarius A-star. 🕳️',
          'It\'s about 4 million times heavier than our Sun! Its gravity is SO strong that if anything gets too close, it can never get back out. Not even light! That\'s why it\'s black.',
          'But it\'s super, super far from Earth, so don\'t worry! From far away, stars just zoom around it, like planets around the Sun.',
          'Drag and let go to fling a star. Make ' + ORBITS + ' stars go around the black hole! 👆',
        ]).then(() => { if (SA.scene === this) { this.phase = 'play'; this.told.start = true; } });
      } else if (this.next === 'outro') {
        this.view = 'outro';
        this.outroT = 0;
        SA.ui.setInfo('🌌 Galaxy Trip');
        this.phase = 'cheer';
        SA.ui.say([
          'Now let\'s zoom out as far as we can... 🔭',
          'Look! Our Milky Way is just one galaxy. There are BILLIONS of galaxies in the universe!',
          'This big one is our neighbour, the Andromeda Galaxy. Its light takes about 2.5 million years to reach us. On a very dark night, you can see it as a faint fuzzy smudge with just your eyes!',
        ]).then(() => { if (SA.scene === this) this.finish(); });
      }
    }

    updateHole(dt) {
      const steps = 4, h = dt / steps, c = this.c;
      for (const b of this.bodies) {
        if (b.fall != null) { b.fall += dt; continue; }
        for (let i = 0; i < steps; i++) {
          const dx = c.x - b.x, dy = c.y - b.y, d2 = Math.max(dx * dx + dy * dy, 100), d = Math.sqrt(d2), a = this.g / d2;
          b.vx += (dx / d) * a * h; b.vy += (dy / d) * a * h;
          b.x += b.vx * h; b.y += b.vy * h;
        }
        if ((b.tick = (b.tick || 0) + 1) % 2 === 0) { b.trail.push(b.x, b.y); if (b.trail.length > 120) b.trail.splice(0, 2); }
        const d = Math.hypot(b.x - c.x, b.y - c.y);
        // Too close: it swirls into the glowing ring and is gone.
        if (d < this.R * 1.55) { b.fall = 0; b.fa = Math.atan2(b.y - c.y, b.x - c.x); b.fd = d; this.swallow(b); continue; }
        if (b.x < -SA.W * 0.4 || b.x > SA.W * 1.4 || b.y < -SA.H * 0.6 || b.y > SA.H * 1.6) { b.gone = true; this.awayTip(); continue; }
        const ang = Math.atan2(b.y - c.y, b.x - c.x);
        b.turn += SA.wrapAngle(ang - b.ang);
        b.ang = ang;
        if (Math.abs(b.turn) >= TAU) {
          b.turn -= Math.sign(b.turn) * TAU;
          if (b.s2) continue;
          this.fx.spawn('sparkle', b.x, b.y, 8, { color: '#bfffd9' });
          SA.audio.play('ding');
          if (this.phase === 'play' && this.orbits < ORBITS) {
            this.orbits++;
            SA.ui.setInfo('⭐ Orbits ' + this.orbits + ' / ' + ORBITS);
            SA.ui.bumpInfo();
            if (this.orbits === 1) SA.ui.hint('An orbit! 🎉 The black hole\'s gravity keeps pulling the star around and around.', 5);
            if (this.orbits >= ORBITS) this.allOrbits();
          }
        }
      }
      this.bodies = this.bodies.filter(b => !b.gone && !(b.fall != null && b.fall > 1));
    }

    swallow(b) {
      SA.audio.play('gulp');
      this.flash = SA.calm() ? 0.4 : 1;
      this.fx.text(this.c.x, this.c.y - this.R * 2.6, 'Swirl!', '#ffcf8a');
      if (!this.told.fall) {
        this.told.fall = true;
        SA.ui.hint('Swirl! That star went too close. Its gas swirled into the hot glowing ring, and nothing gets back out of a black hole! 🌀', 6);
      }
    }
    awayTip() {
      if (this.told.away) return;
      this.told.away = true;
      SA.ui.hint('Whoosh! That one was so fast it zoomed away. Try a gentler fling! 👋', 5);
    }

    allOrbits() {
      this.phase = 'cheer';
      SA.audio.play('cheer');
      SA.celebrate(70);
      setTimeout(() => {
        if (SA.scene !== this) return;
        SA.ui.say([
          'You did it! ' + ORBITS + ' stars are going around the black hole! ⭐⭐⭐',
          'A real star called S2 zooms around this black hole once every 16 years. Scientists watched it for years to find the black hole!',
          'In 2022, scientists showed the very first picture of this black hole. It looks like a glowing orange donut, just like this! 🍩',
        ]).then(() => { if (SA.scene === this) { this.fadeDir = 1; this.next = 'outro'; SA.audio.play('whoosh'); } });
      }, 900);
    }

    async finish() {
      this.phase = 'done';
      SA.audio.play('cheer');
      SA.celebrate(160);
      await SA.ui.banner('Galaxy Explorer!', '🌌 You flew to the middle of the Milky Way', 'gold', 3);
      if (SA.scene !== this) return;
      await SA.ui.say(['Thank you for exploring the universe with me, space explorer! From our little planet, all the way to the middle of the galaxy! 💜']);
      SA.finishPlanet('galaxy', 3);
    }

    // ---------- Drawing ----------
    draw(ctx) {
      const W = SA.W, H = SA.H;
      ctx.fillStyle = '#03030f';
      ctx.fillRect(0, 0, W, H);
      if (this.view === 'zoom') this.drawZoom(ctx);
      else if (this.view === 'galaxy') this.drawTour(ctx);
      else if (this.view === 'hole') this.drawHole(ctx);
      else this.drawOutro(ctx);
      this.fx.draw(ctx);
      if (this.fade > 0) {
        ctx.fillStyle = 'rgba(3,3,15,' + this.fade + ')';
        ctx.fillRect(0, 0, W, H);
      }
    }

    drawZoom(ctx) {
      const W = SA.W, H = SA.H, t = this.t, z = this.z, c = this.c;
      this.stars.draw(ctx, t, 0);
      // Zooming out between the star neighbours and the whole galaxy, a field of stars rushes in
      // toward the middle (it hides the moment when the galaxy picture would look blurry and huge).
      const ra = SA.clamp((z - 1.15) / 0.2, 0, 1) * SA.clamp((1.95 - z) / 0.25, 0, 1);
      if (ra > 0) {
        const rush = this.rush || (this.rush = Array.from({ length: 140 }, (_, i) => { const r = SA.seeded(i * 97 + 5); return { a: r() * TAU, d: r(), c: r() }; }));
        ctx.lineCap = 'round';
        const R = Math.hypot(W, H) * 0.6, speed = this.holding ? 1 : 0.35, LV = 6;
        // Batched into a dozen strokes (by colour and brightness), not one per star.
        for (let warm = 0; warm < 2; warm++) {
          for (let lv = 0; lv < LV; lv++) {
            ctx.beginPath();
            for (const s of rush) {
              if ((s.c > 0.8 ? 1 : 0) !== warm) continue;
              // Each star slides inward as z grows, wrapping round to the outside again.
              const d = 1 - ((s.d + z * 2.2) % 1);
              if (Math.min(LV - 1, Math.floor(d * LV)) !== lv) continue;
              const d2 = Math.min(1, d + 0.05 * speed), cs = Math.cos(s.a), sn = Math.sin(s.a);
              ctx.moveTo(c.x + cs * d * R, c.y + sn * d * R * 0.8);
              ctx.lineTo(c.x + cs * d2 * R, c.y + sn * d2 * R * 0.8);
            }
            const a = ra * (lv + 0.5) / LV;
            ctx.strokeStyle = warm ? 'rgba(255,220,180,' + a + ')' : 'rgba(210,225,255,' + a + ')';
            ctx.lineWidth = 1 + ((lv + 0.5) / LV) * 2.5;
            ctx.stroke();
          }
        }
      }
      // The Milky Way grows into view, only once its picture is small enough to look sharp.
      const g0 = this.gCenter();
      const ga = SA.clamp((z - 1.25) / 0.45, 0, 1) * SA.clamp((3.2 - g0.r / this.gR) / 1.4, 0, 1);
      if (ga > 0) {
        const g = g0;
        ctx.save();
        ctx.globalAlpha = ga;
        SA.drawGalaxy(ctx, g.x, g.y, g.r, { rot: this.rot(), tilt: 0.92 });
        ctx.restore();
      }
      // Star neighbours spread out, then bunch up as we zoom out.
      const na = SA.clamp((z - 0.35) / 0.4, 0, 1) * SA.clamp((1.9 - z) / 0.4, 0, 1);
      if (na > 0) {
        const kB = H * 0.42 * Math.pow(0.15, z - 1);
        for (const s of this.near) {
          const x = c.x + Math.cos(s.a) * s.d * kB, y = c.y + Math.sin(s.a) * s.d * kB * 0.8;
          if (x < -10 || x > W + 10 || y < -10 || y > H + 10) continue;
          ctx.fillStyle = SA.rgba(s.c, na * (0.6 + 0.4 * Math.sin(t * 2 + s.a * 5)));
          SA.circle(ctx, x, y, s.s * 1.3); ctx.fill();
          if (s.s > 2) { SA.starPath(ctx, x, y, s.s * 3.2, 0.25, 4, 0); ctx.fill(); }
        }
        // Proxima Centauri, the nearest one.
        const px = c.x + Math.cos(-0.6) * 0.42 * kB, py = c.y + Math.sin(-0.6) * 0.42 * kB * 0.8;
        if (px < W + 40 && py > -40) {
          ctx.fillStyle = SA.rgba('#ffb080', na);
          SA.circle(ctx, px, py, 5); ctx.fill();
          ctx.globalAlpha = na * SA.clamp((1.4 - z) / 0.3, 0, 1);
          SA.label(ctx, 'Proxima Centauri', px, py - 22, 16, '#ffd2b0');
          ctx.globalAlpha = 1;
        }
      }
      // Our Solar System shrinking away to a dot.
      const sa = SA.clamp((1.25 - z) / 0.3, 0, 1);
      if (sa > 0) {
        const k = Math.pow(0.04, z);
        const radii = [0.06, 0.085, 0.11, 0.14, 0.21, 0.28, 0.34, 0.4];
        const cols = ['#a3a0a0', '#e6bf73', '#3a8fe0', '#d0603a', '#d6a676', '#e8cf95', '#8fdde3', '#4170e0'];
        ctx.save();
        ctx.globalAlpha = sa;
        ctx.strokeStyle = 'rgba(160,180,255,0.25)';
        ctx.lineWidth = 1.5;
        radii.forEach((r0, i) => {
          const r = r0 * H * 1.15 * k;
          if (r > 2) { SA.ellipse(ctx, c.x, c.y, r, r * 0.8); ctx.stroke(); }
          const a = t * (0.6 / (i + 1)) + i * 1.9;
          ctx.fillStyle = cols[i];
          SA.circle(ctx, c.x + Math.cos(a) * r, c.y + Math.sin(a) * r * 0.8, Math.max(1, (i >= 4 ? 7 : 4.5) * Math.min(1, k * 2 + 0.25))); ctx.fill();
        });
        SA.drawBody(ctx, 'sun', c.x, c.y, Math.max(3, 18 * Math.min(1, k * 3 + 0.15)), { t, halo: 1.8 });
        ctx.restore();
        ctx.globalAlpha = SA.clamp((0.45 - z) / 0.25, 0, 1);
        SA.label(ctx, 'Our Solar System', c.x, c.y - 46, 19, '#e8ecff');
        ctx.globalAlpha = 1;
      }
      // "Our Sun" pin while it is a tiny dot.
      const pa = SA.clamp((z - 0.55) / 0.2, 0, 1) * SA.clamp((1.45 - z) / 0.2, 0, 1);
      if (pa > 0) {
        ctx.globalAlpha = pa;
        this.drawPin(ctx, c.x, c.y, 'Our Sun', t);
        ctx.globalAlpha = 1;
      }
      if (z >= 1.8) {
        const g = this.gCenter(), p = this.spotIn(SPOTS[0], g);
        ctx.globalAlpha = SA.clamp((z - 1.8) / 0.2, 0, 1);
        this.drawPin(ctx, p.x, p.y, 'You are here', t);
        ctx.globalAlpha = 1;
      }
      if (this.phase === 'zoom' && !this.holding) {
        SA.emoji(ctx, '👆', W * 0.8, H * 0.8 - Math.abs(Math.sin(t * 3)) * 8, 42);
        SA.label(ctx, 'Hold to zoom out', W * 0.8, H * 0.9, 18, '#fff3c4');
      }
    }

    drawPin(ctx, x, y, text, t) {
      const bob = Math.sin(t * 3) * 3;
      ctx.fillStyle = '#ff5d6c';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x, y - 6 + bob);
      ctx.bezierCurveTo(x - 14, y - 22 + bob, x - 12, y - 40 + bob, x, y - 40 + bob);
      ctx.bezierCurveTo(x + 12, y - 40 + bob, x + 14, y - 22 + bob, x, y - 6 + bob);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff';
      SA.circle(ctx, x, y - 30 + bob, 4.5); ctx.fill();
      SA.pill(ctx, text, x, y - 62 + bob, 16, { color: '#fff', edge: 'rgba(255,140,160,0.9)' });
    }

    drawTour(ctx) {
      const t = this.t;
      this.stars.draw(ctx, t, 0);
      const g = this.gCenter();
      // Diving to the middle: the galaxy rushes toward us.
      const dz = this.diveT != null ? Math.pow(Math.min(1.2, this.diveT) / 1.2, 2) : 0;
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.scale(1 + dz * 5, 1 + dz * 5);
      ctx.translate(-g.x, -g.y);
      SA.drawGalaxy(ctx, g.x, g.y, g.r, { rot: this.rot(), tilt: 0.92 });
      ctx.restore();
      if (dz > 0) return;
      for (const s of SPOTS) {
        const p = this.spotIn(s, g), seen = !!this.seen[s.id];
        if (s.id === 'cluster') {
          // A round ball of old stars.
          const cg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 16);
          cg.addColorStop(0, 'rgba(255,240,200,0.95)');
          cg.addColorStop(1, 'rgba(255,220,170,0)');
          ctx.fillStyle = cg;
          SA.circle(ctx, p.x, p.y, 16); ctx.fill();
          ctx.fillStyle = 'rgba(255,245,220,0.9)';
          for (let i = 0; i < 18; i++) { const a = i * 2.4, r = 3 + (i % 5) * 2.4; ctx.fillRect(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, 1.6, 1.6); }
        } else if (s.id === 'nursery') {
          const ng = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 22);
          ng.addColorStop(0, 'rgba(255,150,210,0.85)');
          ng.addColorStop(1, 'rgba(255,110,190,0)');
          ctx.fillStyle = ng;
          SA.circle(ctx, p.x, p.y, 22); ctx.fill();
        }
        if (s.id === 'sun') this.drawPin(ctx, p.x, p.y, 'You are here', t);
        else if (seen) SA.label(ctx, s.name, p.x, p.y + 30, 15, '#f0e8ff');
        if (!seen && this.phase === 'tour') {
          const pulse = (t * 0.8 + s.f) % 1;
          ctx.strokeStyle = 'rgba(255,224,102,' + (1 - pulse) * 0.9 + ')';
          ctx.lineWidth = 3 * (1 - pulse) + 1;
          SA.circle(ctx, p.x, p.y, 16 + pulse * 22); ctx.stroke();
        }
      }
      if (this.seenN >= SPOTS.length && this.phase === 'tour') {
        const pulse = (t * 0.8) % 1;
        ctx.strokeStyle = 'rgba(255,224,102,' + (1 - pulse) + ')';
        ctx.lineWidth = 3;
        SA.circle(ctx, g.x, g.y, 24 + pulse * 40); ctx.stroke();
        SA.emoji(ctx, '👆', g.x + 34, g.y + 46 + Math.abs(Math.sin(t * 4)) * 6, 40);
      } else if (this.phase === 'tour' && this.seenN === 0) {
        const p = this.spotIn(SPOTS[0], g);
        SA.emoji(ctx, '👆', p.x + 30, p.y + 42 + Math.abs(Math.sin(t * 4)) * 6, 38);
      }
      SA.label(ctx, 'The Milky Way', g.x, g.y + g.r * 0.92 + 22, 20, '#e8e0ff');
    }

    drawHole(ctx) {
      const W = SA.W, H = SA.H, t = this.t, c = this.c, R = this.R;
      this.stars.draw(ctx, t, 0);
      // A soft warm haze of gas around the middle.
      const haze = ctx.createRadialGradient(c.x, c.y, R, c.x, c.y, R * 5);
      haze.addColorStop(0, 'rgba(255,150,60,0.18)');
      haze.addColorStop(1, 'rgba(255,120,40,0)');
      ctx.fillStyle = haze;
      SA.circle(ctx, c.x, c.y, R * 5); ctx.fill();
      // Trails and stars.
      for (const b of this.bodies) {
        if (b.fall != null) continue;
        if (b.trail.length > 4) {
          ctx.strokeStyle = SA.rgba(b.c, 0.35);
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let i = 0; i < b.trail.length; i += 2) i ? ctx.lineTo(b.trail[i], b.trail[i + 1]) : ctx.moveTo(b.trail[i], b.trail[i + 1]);
          ctx.stroke();
        }
      }
      // The glowing ring of hot gas around the dark middle (brighter at the bottom, like the real
      // picture), turning slowly.
      const glow = ctx.createRadialGradient(c.x, c.y, R * 0.9, c.x, c.y, R * 2.4);
      glow.addColorStop(0, 'rgba(255,200,110,' + (0.75 + this.flash * 0.25) + ')');
      glow.addColorStop(0.35, 'rgba(255,140,50,' + (0.45 + this.flash * 0.3) + ')');
      glow.addColorStop(1, 'rgba(200,70,20,0)');
      ctx.fillStyle = glow;
      SA.circle(ctx, c.x, c.y, R * 2.4); ctx.fill();
      // The thick glowing donut, brightest along the bottom.
      ctx.lineWidth = R * 0.55;
      ctx.strokeStyle = 'rgba(255,150,60,' + (0.4 + this.flash * 0.3) + ')';
      SA.circle(ctx, c.x, c.y, R * 1.32); ctx.stroke();
      ctx.lineWidth = R * 0.3;
      ctx.strokeStyle = 'rgba(255,215,140,' + (0.55 + this.flash * 0.3) + ')';
      ctx.beginPath(); ctx.arc(c.x, c.y, R * 1.25, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.lineCap = 'round';
      for (let i = 0; i < 14; i++) {
        const a0 = t * (0.5 + (i % 3) * 0.15) + i * 0.9, rr = R * (1.12 + (i % 4) * 0.09);
        const bright = 0.5 + 0.5 * Math.sin(a0 + Math.PI / 2);
        ctx.strokeStyle = 'rgba(255,' + Math.round(200 + bright * 50) + ',' + Math.round(120 + bright * 90) + ',' + (0.25 + bright * 0.5) + ')';
        ctx.lineWidth = R * (0.08 + (i % 3) * 0.03);
        ctx.beginPath(); ctx.arc(0, 0, rr, a0, a0 + 0.9); ctx.stroke();
      }
      ctx.restore();
      ctx.fillStyle = '#000';
      SA.circle(ctx, c.x, c.y, R); ctx.fill();
      ctx.strokeStyle = 'rgba(255,230,170,0.85)';
      ctx.lineWidth = 2;
      SA.circle(ctx, c.x, c.y, R * 1.04); ctx.stroke();
      // Stars swirling in.
      for (const b of this.bodies) {
        if (b.fall == null) continue;
        const u = Math.min(1, b.fall), a = b.fa + u * 4, d = SA.lerp(b.fd, R * 1.1, u);
        ctx.strokeStyle = 'rgba(255,220,160,' + (1 - u) + ')';
        ctx.lineWidth = 4 * (1 - u) + 1;
        ctx.beginPath(); ctx.arc(c.x, c.y, d, a - 0.6 * (0.3 + u), a); ctx.stroke();
      }
      for (const b of this.bodies) {
        if (b.fall != null) continue;
        const sg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.s * 2.6);
        sg.addColorStop(0, '#ffffff');
        sg.addColorStop(0.35, b.c);
        sg.addColorStop(1, SA.rgba(b.c, 0));
        ctx.fillStyle = sg;
        SA.circle(ctx, b.x, b.y, b.s * 2.6); ctx.fill();
        if (b.s2) SA.label(ctx, 'S2', b.x, b.y - 18, 14, '#cfe4ff');
      }
      SA.label(ctx, 'Sagittarius A*', c.x, c.y + R * 2.6 + 12, 17, '#ffd9a8');
      // Aiming: the dotted path a flung star would take.
      if (this.aim) {
        const a = this.aim, v = this.aimVel(a);
        if (Math.hypot(a.x - a.x0, a.y - a.y0) > 12) {
          let x = a.x0, y = a.y0, vx = v.x, vy = v.y;
          if (SA.easy()) { const as = SA.orbitAssist(x, y, vx, vy, c.x, c.y, this.g, R * 2.2, Math.max(W, H) * 0.62); vx = as.vx; vy = as.vy; }
          ctx.fillStyle = 'rgba(255,243,196,0.7)';
          const hh = 1 / 30;
          for (let i = 0; i < 160; i++) {
            const dx = c.x - x, dy = c.y - y, d2 = Math.max(dx * dx + dy * dy, 100), d = Math.sqrt(d2);
            if (d < R * 1.5) break;
            vx += (dx / d) * this.g / d2 * hh; vy += (dy / d) * this.g / d2 * hh;
            x += vx * hh; y += vy * hh;
            if (i % 4 === 0) { SA.circle(ctx, x, y, 2.2); ctx.fill(); }
          }
        }
        ctx.fillStyle = '#fff6d8';
        SA.circle(ctx, a.x0, a.y0, 6); ctx.fill();
      }
      if (this.phase === 'play' && this.orbits === 0 && !this.aim && this.bodies.length < 2) {
        const sx = c.x + R * 4.2, sy = c.y - R * 1.2, u = (t * 0.7) % 1;
        SA.emoji(ctx, '👆', sx + 10, sy + 30 - u * 50, 40);
      }
    }

    drawOutro(ctx) {
      const W = SA.W, H = SA.H, t = this.t, u = SA.easeOut(Math.min(1, this.outroT / 2));
      this.stars.draw(ctx, t, 0);
      // Lots of little far-away galaxies.
      for (const f of this.far) {
        ctx.save();
        ctx.globalAlpha = 0.5 + 0.3 * u;
        SA.drawGalaxy(ctx, f.x * W, f.y * H * 0.85 + H * 0.05, f.r * (0.6 + 0.4 * u), { rot: f.rot + t * 0.01, tilt: f.tilt });
        ctx.restore();
      }
      // The Milky Way (small, left) and Andromeda (tilted, right).
      const mw = { x: W * 0.3, y: H * 0.42, r: SA.lerp(H * 0.4, H * 0.16, u) };
      SA.drawGalaxy(ctx, mw.x, mw.y, mw.r, { rot: this.rot(), tilt: 0.92 });
      SA.label(ctx, 'Our Milky Way', mw.x, mw.y + mw.r + 20, 18, '#e8e0ff');
      ctx.save();
      ctx.globalAlpha = u;
      const an = { x: W * 0.68, y: H * 0.36, r: H * 0.2 };
      ctx.translate(an.x, an.y);
      ctx.rotate(-0.55);
      SA.drawGalaxy(ctx, 0, 0, an.r, { rot: 1.2, tilt: 0.32 });
      ctx.restore();
      ctx.globalAlpha = u;
      SA.label(ctx, 'Andromeda Galaxy', W * 0.7, H * 0.36 + H * 0.17, 18, '#ffe2f2');
      ctx.globalAlpha = 1;
    }
  }
  SA.GalaxyScene = GalaxyScene;
})(window.SA);
