// Bonus mission: "Star Story", the life of a star like our Sun, in six chapters, each with its
// own touch: swirl a nebula together, tap to squeeze the baby star until it shines, tap dust
// clumps into planets, hold to fast-forward into a red giant (which grows past the paths of
// Mercury and Venus), tap to puff off a glowing planetary nebula around a tiny white dwarf, and
// finally swirl that old gas into a brand-new baby star, so the story goes round in a circle.
// Every chapter just waits for the child.
(function (SA) {
  const TAU = Math.PI * 2;
  const CHAPTERS = 6;
  const GIANT = 1.25;   // the red giant grows to (1 + GIANT) x the Sun: past Venus's path, short of Earth's
  // The inner planets' paths, shown while the Sun swells (same sizes as the planet clumps).
  const PATHS = [
    { o: 0.3, name: 'Mercury' },
    { o: 0.42, name: 'Venus' },
    { o: 0.56, name: 'Earth' },
  ];
  const SHELL_COLS = ['#7fe8ff', '#ff8ad0', '#ff9a6b', '#c48bff'];
  const CLOUD = ['#ff7ac8', '#9b7bff', '#5fc8ff', '#ffb36b', '#ff8a9e', '#c48bff'];
  const PLANETS = [
    { id: 'mercury', o: 0.34, a: 0.6, name: 'Rocky planet' },
    { id: 'earth', o: 0.5, a: 3.2, name: 'Rocky planet' },
    { id: 'jupiter', o: 0.72, a: 1.9, name: 'Giant planet' },
    { id: 'saturn', o: 0.92, a: 4.6, name: 'Giant planet' },
  ];

  // A soft round glow baked once per colour, so the nebula can draw lots of them cheaply.
  function blob(color) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, SA.rgba(color, 0.9));
    gr.addColorStop(0.45, SA.rgba(color, 0.35));
    gr.addColorStop(1, SA.rgba(color, 0));
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    return c;
  }

  class SunScene {
    constructor() {
      this.stars = new SA.Starfield(260, 37);
      this.fx = new SA.Particles();
      this.t = 0;
      this.sprites = CLOUD.map(blob);
      const rnd = SA.seeded(73);
      this.gas = [];
      for (let i = 0; i < 120; i++) {
        this.gas.push({ a: rnd() * TAU, d: 0.12 + Math.sqrt(rnd()) * 0.88, s: 90 + rnd() * 160, c: i % CLOUD.length, sp: 0.04 + rnd() * 0.1, w: rnd() * TAU });
      }
      this.dust = [];
      for (let i = 0; i < 160; i++) this.dust.push({ a: rnd() * TAU, d: 0.22 + rnd() * 0.8, s: 0.8 + rnd() * 1.8, l: 0.3 + rnd() * 0.5 });
    }

    layout() {
      const W = SA.W, H = SA.H;
      this.cx = W * 0.54;
      this.cy = H * 0.44;
      this.R = H * 0.46;
      this.rb = H * 0.12;
      this.k = 1;   // sizes in logical units (phones already draw them bigger)
    }

    resize() { this.layout(); }

    enter() {
      SA.ui.setScene('game');
      SA.audio.music('sun');
      this.layout();
      this.chapter = -1;
      this.phase = 'intro';
      this.swirl = 0;
      this.dragging = false;
      this.last = null;
      this.heat = 0;
      this.taps = 0;
      this.squeeze = 0;
      this.lit = false;
      this.flash = 0;
      this.planets = PLANETS.map(p => Object.assign({ made: false, pop: 0 }, p));
      this.planetFade = 1;
      this.grow = 0;
      this.holding = false;
      this.shells = [];
      this.puffs = 0;
      this.dwarf = 0;
      this.passed = 0;
      this.passMsg = null;
      this.pan = 0;
      this.swirl2 = 0;
      this.lit2 = false;
      SA.ui.setInfo('✨ Star Story');
      SA.ui.banner('The Sun', SA.NICKNAMES.sun).then(() => SA.scene !== this ? new Promise(() => {}) : SA.ui.say(SA.introLines('sun', [
        'Welcome to the Sun, our very own star! ☀️',
        'Every star has a life story, just like you! Let\'s watch a star like our Sun be born, grow up and grow old.',
        'It all starts long, long ago, in a giant cloud of gas and dust called a NEBULA. Swirl your finger around to pull it together! 🌀',
      ]))).then(() => { if (SA.scene === this) this.nextChapter(); });
    }

    exit() { SA.ui.hideTalk(); this.dragging = false; this.holding = false; }

    nextChapter() {
      this.chapter++;
      this.phase = 'play';
      SA.ui.setInfo('✨ Chapter ' + (this.chapter + 1) + ' of ' + CHAPTERS);
      const tips = [
        'Swirl your finger around and around to pull the gas together! 🌀',
        'Tap the glowing ball to squeeze it tighter and hotter! 👆',
        'Tap the dusty clumps to stick them together into planets! 🪐',
        'Hold your finger down to fast-forward billions of years! ⏩',
        'The old star is puffing out its outer layers. Tap to help it puff! 💨',
        'Swirl the glowing old gas around and around to make a NEW star! 🌀',
      ];
      SA.ui.hint(tips[this.chapter], 0);
    }

    // A chapter is done: let the moment play, then Cosmo explains (the child taps Next).
    chapterDone(lines, delay) {
      this.phase = 'cheer';
      this.dragging = false;
      this.holding = false;
      setTimeout(() => {
        if (SA.scene !== this) return;
        SA.ui.say(lines).then(() => {
          if (SA.scene !== this) return;
          if (this.chapter >= CHAPTERS - 1) this.finish();
          else this.nextChapter();
        });
      }, delay || 1200);
    }

    onDown(x, y) {
      if (this.phase !== 'play') return;
      const c = this.chapter;
      if (c === 0 || c === 5) { this.dragging = true; this.last = { x, y }; SA.ui.hideTalk(); }
      else if (c === 1) this.squeezeTap();
      else if (c === 2) this.tapClump(x, y);
      else if (c === 3) { this.holding = true; SA.ui.hideTalk(); }
      else if (c === 4) this.puff();
    }

    onMove(x, y) {
      if (!this.dragging || (this.chapter !== 0 && this.chapter !== 5) || this.phase !== 'play') return;
      const d = Math.hypot(x - this.last.x, y - this.last.y);
      this.last = { x, y };
      if (d < 1) return;
      this.trail = (this.trail || 0) + d;
      if (this.trail > 40) {
        this.trail = 0;
        this.fx.spawn('sparkle', x, y, 1, { color: SA.pick(this.chapter === 5 ? SHELL_COLS : CLOUD) });
        if (Math.random() < 0.3) SA.audio.play('spin');
      }
      if (this.chapter === 5) { this.swirlNew(d); return; }
      const need = (SA.easy() ? 2200 : 3400) * this.k;
      this.swirl = Math.min(1, this.swirl + d / need);
      if (this.swirl >= 1) {
        SA.audio.play('collect');
        this.fx.spawn('sparkle', this.cx, this.cy, 24, { color: '#ff9a6b' });
        this.chapterDone([
          'Look! Gravity pulled the gas into a big, warm ball! 🔴',
          'This is a baby star. It isn\'t shining yet. Let\'s squeeze it to heat it up!',
        ]);
      }
    }

    onUp() { this.dragging = false; this.holding = false; }

    // Chapter 6: the old star's glowing gas is swirled into a new cloud, and a new star lights up.
    swirlNew(d) {
      if (this.lit2) return;
      const need = (SA.easy() ? 1500 : 2300) * this.k;
      this.swirl2 = Math.min(1, this.swirl2 + d / need);
      if (this.swirl2 < 1) return;
      this.lit2 = true;
      this.flash = SA.calm() ? 0.3 : 0.8;
      const p = this.newPos();
      SA.audio.play('card');
      setTimeout(() => SA.audio.play('cheer'), 250);
      SA.celebrate(80);
      this.fx.spawn('sparkle', p.x, p.y, 30, { color: '#fff3a0' });
      this.chapterDone([
        'A brand-new baby star is born! ✨ One day, it might have planets of its own.',
        'Old stars help make new stars. So the story of the stars goes round and round, like a big circle! 🔄',
      ], 1600);
    }

    // Where the new star forms in chapter 6 (the old white dwarf drifts to the left).
    newPos() { return { x: this.cx + SA.W * 0.2, y: this.cy - SA.H * 0.02 }; }

    squeezeTap() {
      const need = SA.easy() ? 5 : 7;
      this.taps++;
      this.heat = this.taps / need;
      this.squeeze = 1;
      SA.audio.play('pop');
      this.fx.spawn('sparkle', this.cx + SA.rand(-30, 30), this.cy + SA.rand(-30, 30), 6, { color: this.heat > 0.6 ? '#ffe066' : '#ff8a4a' });
      if (this.taps === 1) SA.ui.hideTalk();
      if (this.taps >= need) {
        this.lit = true;
        this.flash = SA.calm() ? 0.35 : 1;
        SA.audio.play('card');
        setTimeout(() => SA.audio.play('cheer'), 250);
        SA.celebrate(80);
        this.fx.spawn('sparkle', this.cx, this.cy, 30);
        this.chapterDone([
          'WOW! A star is born! ✨ When the middle of the ball got hot enough, it started to shine!',
          'This young star is our Sun! Around it, there\'s a big flat disk of leftover dust. 🌀',
        ], 1600);
      }
    }

    clumpPos(p) {
      // Slow enough for small fingers to catch (inner ones still go faster, like real orbits).
      const a = p.a + this.t * (0.16 / Math.sqrt(p.o));
      return { x: this.cx + Math.cos(a) * this.R * p.o * 1.25, y: this.cy + Math.sin(a) * this.R * p.o * 0.42, front: Math.sin(a) > 0 };
    }

    tapClump(x, y) {
      let best = null, bd = 1e9;
      for (const p of this.planets) {
        if (p.made) continue;
        const q = this.clumpPos(p), d = Math.hypot(x - q.x, y - q.y);
        if (d < (SA.easy() ? 80 : 60) * this.k && d < bd) { best = p; bd = d; }
      }
      if (!best) return;
      best.made = true;
      best.pop = 1;
      const q = this.clumpPos(best);
      SA.audio.play('collect');
      this.fx.spawn('sparkle', q.x, q.y, 16, { color: SA.BODY[best.id].color });
      this.fx.text(q.x, q.y - 50 * this.k, best.name + '!', '#ffe066');
      SA.ui.hideTalk();
      if (this.planets.every(p => p.made)) {
        this.chapterDone([
          'Close to the Sun, small rocky planets formed, like Earth. Farther out, giant planets formed, like Jupiter! 🪐',
          'That\'s how our Solar System was born, about 4.6 billion years ago! 🎂',
          'Now let\'s zoom far, far into the future... ⏩',
        ], 1400);
      }
    }

    puff() {
      if (this.puffs >= 3) return;
      this.puffs++;
      this.shells.push({ t: 0, n: this.puffs });
      SA.audio.play('whoosh');
      setTimeout(() => SA.audio.play('ping'), 150);
      SA.ui.hideTalk();
      if (this.puffs >= 3) {
        setTimeout(() => SA.audio.play('card'), 900);
        this.chapterDone([
          'The puffed-out gas makes a beautiful glowing cloud called a planetary nebula! 🌈',
          'And in the middle is a tiny, hot star called a WHITE DWARF. ⚪',
          'Here\'s the coolest part: gas from old stars can help make NEW stars and planets! Let\'s try it! ✨',
        ], 2600);
      }
    }

    update(dt) {
      this.t += dt;
      this.fx.update(dt);
      this.squeeze = Math.max(0, this.squeeze - dt * 3);
      this.flash = Math.max(0, this.flash - dt * 1.2);
      for (const p of this.planets) p.pop = Math.max(0, p.pop - dt * 2);
      if (this.chapter >= 3) this.planetFade = Math.max(0, this.planetFade - dt * 0.8);
      if (this.chapter === 3 && this.phase === 'play' && this.holding) {
        this.grow = Math.min(1, this.grow + dt / (SA.easy() ? 2.5 : 3.5));
        if (Math.random() < dt * 6) SA.audio.play('spin');
        // The swelling star reaches past Mercury's path, then Venus's (never Earth's here).
        const r = this.rb * (1 + this.grow * GIANT);
        const next = PATHS[this.passed];
        if (next && next.name !== 'Earth' && r > this.R * next.o * 1.25) {
          this.passed++;
          this.passMsg = { text: '🔴 Past ' + next.name + '\'s path!', t: 0 };
          SA.audio.play('ping');
          this.fx.spawn('sparkle', this.cx + this.R * next.o * 1.25, this.cy, 10, { color: '#ffb36b' });
        }
        if (this.grow >= 1) {
          SA.audio.play('ding');
          this.chapterDone([
            'In about 5 billion years, the Sun will swell up into a huge RED GIANT star! 🔴',
            'It will grow so big that it reaches past the paths of Mercury and Venus! 😮',
            'Don\'t worry, that\'s a super, super long time from now!',
          ], 600);
        }
      }
      if (this.passMsg) { this.passMsg.t += dt; if (this.passMsg.t > 2.6) this.passMsg = null; }
      // Chapter 6: the old star drifts aside to make room for the new cloud.
      if (this.chapter === 5) this.pan = Math.min(1, this.pan + dt / 1.6);
      for (const s of this.shells) s.t += dt;
      // The star shrinks with every puff, down to a tiny white dwarf.
      const want = this.puffs / 3;
      this.dwarf += (want - this.dwarf) * Math.min(1, dt * 2);
    }

    async finish() {
      this.phase = 'done';
      SA.audio.play('cheer');
      SA.celebrate(120);
      await SA.ui.banner('Mission Complete!', '✨ The life story of a star', 'gold', 3);
      if (SA.scene !== this) return;
      await SA.ui.say([
        'You saw the whole life of a star! 🎉',
        'Our Sun is about halfway through its life. It will keep shining on us for billions of years! ☀️',
      ]);
      SA.finishPlanet('sun', 3);
    }

    // ---------- Drawing ----------
    draw(ctx) {
      const W = SA.W, H = SA.H, t = this.t, c = this.chapter;
      SA.spaceBg(ctx, '#05061a', '#1a0f3a');
      this.stars.draw(ctx, t, 0);
      if (c <= 1) this.drawCloud(ctx, t);
      if (c === 1 || (c === 0 && this.phase === 'cheer')) this.drawProtostar(ctx, t);
      if (c >= 2 && c <= 3) { this.drawDisk(ctx, t); this.drawPlanets(ctx, t, false); }
      if (c === 5) this.drawNewCloud(ctx, t);
      if (c >= 2 || this.lit) this.drawStar(ctx, t);
      if (c >= 2 && c <= 3) this.drawPlanets(ctx, t, true);
      if (c === 3) { this.drawPaths(ctx, t); this.drawYears(ctx, t); }
      if (c === 5) this.drawNewStar(ctx, t);
      this.fx.draw(ctx);
      if (c === 0 && this.phase !== 'cheer') this.drawProgress(ctx, this.swirl, '🌀 Pull the gas together');
      if (c === 1 && !this.lit) this.drawProgress(ctx, this.heat, '🔥 Heat it up');
      if (c === 5 && !this.lit2) this.drawProgress(ctx, this.swirl2, '🌀 Make a new star');
      if (this.phase === 'play') this.drawFinger(ctx, t);
      if (this.flash > 0) {
        ctx.fillStyle = 'rgba(255,250,225,' + this.flash * 0.85 + ')';
        ctx.fillRect(0, 0, W, H);
      }
    }

    drawCloud(ctx, t) {
      const s = this.swirl, fade = this.chapter === 1 ? 0.35 : 1;
      // Added light, so overlapping gas glows brighter like a real nebula.
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const g of this.gas) {
        const a = g.a + t * g.sp * (0.6 + s * 4) + s * 2;
        const d = g.d * this.R * (1 - 0.86 * s) * (1 + Math.sin(t * 0.7 + g.w) * 0.04);
        const x = this.cx + Math.cos(a) * d * 1.35, y = this.cy + Math.sin(a) * d * 0.8;
        const size = g.s * this.k * (1 - 0.45 * s);
        ctx.globalAlpha = 0.2 * fade;
        ctx.drawImage(this.sprites[g.c], x - size / 2, y - size / 2, size, size);
      }
      ctx.restore();
      // The warm core grows as the gas gathers.
      if (this.chapter === 0) {
        const r = this.rb * (0.3 + s * 0.9);
        const core = ctx.createRadialGradient(this.cx, this.cy, 0, this.cx, this.cy, r * 1.8);
        core.addColorStop(0, 'rgba(255,170,120,' + (0.2 + s * 0.6) + ')');
        core.addColorStop(1, 'rgba(255,90,80,0)');
        ctx.fillStyle = core;
        SA.circle(ctx, this.cx, this.cy, r * 1.8);
        ctx.fill();
      }
    }

    // Baby star: deep red when cool, glowing orange then yellow as it is squeezed.
    drawProtostar(ctx, t) {
      if (this.lit) return;
      const h = this.heat, r = this.rb * (1 - this.squeeze * 0.14) * (1 + Math.sin(t * 2) * 0.02);
      const glow = ctx.createRadialGradient(this.cx, this.cy, r * 0.5, this.cx, this.cy, r * (2.2 + h));
      glow.addColorStop(0, 'rgba(255,' + Math.round(110 + h * 110) + ',80,' + (0.35 + h * 0.3) + ')');
      glow.addColorStop(1, 'rgba(255,90,60,0)');
      ctx.fillStyle = glow;
      SA.circle(ctx, this.cx, this.cy, r * (2.2 + h));
      ctx.fill();
      const g = ctx.createRadialGradient(this.cx - r * 0.3, this.cy - r * 0.3, r * 0.1, this.cx, this.cy, r);
      g.addColorStop(0, h > 0.6 ? '#fff3c0' : '#ffb08a');
      g.addColorStop(0.5, 'rgb(' + Math.round(200 + h * 55) + ',' + Math.round(70 + h * 120) + ',' + Math.round(50 + h * 20) + ')');
      g.addColorStop(1, 'rgb(' + Math.round(110 + h * 100) + ',30,40)');
      ctx.fillStyle = g;
      ctx.save();
      ctx.translate(this.cx, this.cy);
      ctx.scale(1 + this.squeeze * 0.1, 1 - this.squeeze * 0.1);
      SA.circle(ctx, 0, 0, r);
      ctx.fill();
      ctx.restore();
    }

    drawDisk(ctx, t) {
      const a0 = this.planetFade;
      if (a0 <= 0) return;
      const made = this.planets.filter(p => p.made).length;
      // A soft, flat glowing disk of leftover dust (thinner as planets gather it up).
      ctx.save();
      ctx.translate(this.cx, this.cy);
      ctx.scale(1, 0.42 / 1.25);
      const R = this.R * 1.25 * 1.05;
      const ring = ctx.createRadialGradient(0, 0, R * 0.12, 0, 0, R);
      ring.addColorStop(0, 'rgba(255,200,140,0)');
      ring.addColorStop(0.3, 'rgba(255,190,130,0.28)');
      ring.addColorStop(0.7, 'rgba(230,150,120,0.16)');
      ring.addColorStop(1, 'rgba(200,120,140,0)');
      ctx.globalAlpha = a0 * (1 - made * 0.15);
      ctx.fillStyle = ring;
      SA.circle(ctx, 0, 0, R);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#ffd9a8';
      for (const d of this.dust) {
        const a = d.a + t * (0.3 / Math.sqrt(d.d));
        const x = this.cx + Math.cos(a) * this.R * d.d * 1.25, y = this.cy + Math.sin(a) * this.R * d.d * 0.42;
        ctx.globalAlpha = a0 * d.l * (1 - made * 0.18);
        ctx.fillRect(x, y, d.s * this.k * 1.6, d.s * this.k * 1.6);
      }
      ctx.globalAlpha = 1;
    }

    // front: planets on the near side of their orbit draw in front of the star.
    drawPlanets(ctx, t, front) {
      const a0 = this.planetFade;
      if (a0 <= 0) return;
      ctx.globalAlpha = a0;
      for (const p of this.planets) {
        const q = this.clumpPos(p);
        if (q.front !== front) continue;
        if (p.made) {
          const r = (p.id === 'jupiter' ? 26 : p.id === 'saturn' ? 20 : p.id === 'earth' ? 12 : 9) * this.k * (1 + Math.sin(p.pop * Math.PI) * 0.5);
          SA.drawBody(ctx, p.id, q.x, q.y, r, { t, lx: SA.clamp((this.cx - q.x) / 200, -1, 1), ly: SA.clamp((this.cy - q.y) / 200, -1, 1) });
        } else {
          // A dusty, swirling clump waiting to be tapped.
          const pulse = (t * 0.9 + p.a) % 1, k = this.k;
          const glow = ctx.createRadialGradient(q.x, q.y, 2, q.x, q.y, 30 * k);
          glow.addColorStop(0, 'rgba(255,225,170,0.6)');
          glow.addColorStop(1, 'rgba(255,200,140,0)');
          ctx.fillStyle = glow;
          SA.circle(ctx, q.x, q.y, 30 * k); ctx.fill();
          ctx.strokeStyle = 'rgba(255,224,102,' + (1 - pulse) * a0 + ')';
          ctx.lineWidth = 3;
          SA.circle(ctx, q.x, q.y, (22 + pulse * 24) * k); ctx.stroke();
          ctx.fillStyle = '#f0d2a8';
          for (let i = 0; i < 9; i++) {
            const aa = t * 2 + i * 0.75 + p.a, dd = (5 + (i % 3) * 6) * k;
            SA.circle(ctx, q.x + Math.cos(aa) * dd, q.y + Math.sin(aa) * dd * 0.7, (3 + (i % 2) * 1.5) * k); ctx.fill();
          }
        }
      }
      ctx.globalAlpha = 1;
    }

    // The star itself from chapter 3 on: the Sun, swelling into a red giant, then shrinking
    // inside its glowing nebula into a white dwarf.
    drawStar(ctx, t) {
      // In chapter 6 the old star and its nebula drift left and shrink a little, fading as their
      // gas flows into the new cloud.
      const pan = SA.easeInOut(this.pan), sc = 1 - 0.4 * pan;
      const cx = this.cx - pan * SA.W * 0.24, cy = this.cy, rb = this.rb * sc, g = this.grow;
      ctx.save();
      ctx.globalAlpha = 1 - pan * (0.25 + 0.4 * this.swirl2);
      // Nebula shells from the puffs, expanding and then staying as glowing rings.
      for (const s of this.shells) {
        const e = SA.easeOut(Math.min(1, s.t / 2.2));
        const r = rb * (2.2 + e * (0.9 + s.n * 0.5));
        const cols = [['#7fe8ff', '#5fc8ff'], ['#ff8ad0', '#c48bff'], ['#ff9a6b', '#ff5d7a']][s.n - 1];
        const ring = ctx.createRadialGradient(cx, cy, r * 0.55, cx, cy, r);
        ring.addColorStop(0, SA.rgba(cols[1], 0));
        ring.addColorStop(0.75, SA.rgba(cols[0], 0.42 * (0.6 + 0.4 * e)));
        ring.addColorStop(1, SA.rgba(cols[1], 0));
        ctx.fillStyle = ring;
        SA.ellipse(ctx, cx, cy, r * 1.15, r);
        ctx.fill();
      }
      if (this.chapter < 3) { SA.drawBody(ctx, 'sun', cx, cy, rb, { t }); ctx.restore(); return; }
      const d = this.dwarf;
      if (d < 0.98) {
        const r = rb * (1 + g * GIANT) * (1 - d * 0.93);
        if (g < 1) {
          ctx.globalAlpha = 1 - g;
          SA.drawBody(ctx, 'sun', cx, cy, r, { t });
          ctx.globalAlpha = 1;
        }
        if (g > 0) this.drawRedGiant(ctx, cx, cy, r, t, g * (1 - d));
      }
      if (d > 0.05) {
        // White dwarf: small, very bright and a little blue.
        const r = rb * 0.17;
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 6);
        glow.addColorStop(0, SA.rgba('#ffffff', 0.9 * d));
        glow.addColorStop(0.2, SA.rgba('#cfe4ff', 0.5 * d));
        glow.addColorStop(1, 'rgba(160,200,255,0)');
        ctx.fillStyle = glow;
        SA.circle(ctx, cx, cy, r * 6); ctx.fill();
        ctx.fillStyle = SA.rgba('#ffffff', d);
        SA.circle(ctx, cx, cy, r); ctx.fill();
        if (d > 0.9 && (this.phase !== 'play' || this.chapter === 5)) SA.label(ctx, 'White dwarf', cx, cy + r * 6 + 10, 18 * this.k, '#dfeaff');
      }
      ctx.restore();
    }

    // Chapter 4: the inner planets' paths, so the child sees how far the red giant reaches.
    drawPaths(ctx, t) {
      const a0 = 1 - this.planetFade;
      if (a0 <= 0) return;
      const rG = this.rb * (1 + this.grow * GIANT);
      ctx.save();
      ctx.globalAlpha = a0;
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 9]);
      ctx.lineDashOffset = -t * 10;
      for (const p of PATHS) {
        const ax = this.R * p.o * 1.25, ay = this.R * p.o * 0.42;
        const inside = rG > ax;
        ctx.strokeStyle = inside ? 'rgba(255,220,170,0.75)' : 'rgba(200,215,255,0.55)';
        SA.ellipse(ctx, this.cx, this.cy, ax, ay);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      // Name tags at the right end of each path, staggered up and down so they never overlap.
      for (const p of PATHS) {
        const ax = this.R * p.o * 1.25, inside = rG > ax;
        const ly = this.cy + (p.name === 'Venus' ? 1 : p.name === 'Earth' ? -1 : 0) * 24 * this.k;
        SA.pill(ctx, p.name, this.cx + ax + 4, ly, 13 * this.k, inside
          ? { color: '#fff1d6', edge: 'rgba(255,170,110,0.9)', bgTop: 'rgba(120,40,20,0.85)', bg: 'rgba(80,20,10,0.88)' }
          : { color: '#e6ecff' });
      }
      ctx.restore();
      const m = this.passMsg;
      if (m) {
        const pop = SA.easeBack(m.t / 0.3), fade = Math.min(1, (2.6 - m.t) / 0.4);
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(SA.W / 2, 78);
        ctx.scale(pop, pop);
        SA.pill(ctx, m.text, 0, 0, 20 * this.k, { color: '#fff1d6', edge: 'rgba(255,140,90,0.95)', bgTop: 'rgba(150,40,20,0.85)', bg: 'rgba(100,20,10,0.88)' });
        ctx.restore();
      }
    }

    // Chapter 6: the old gas gathers into a new cloud with a warm, growing core.
    drawNewCloud(ctx, t) {
      const p = this.newPos(), s = this.swirl2, k = SA.easeInOut(this.pan);
      if (k <= 0) return;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const cols = [0, 2, 3, 4, 1, 5];   // sprites: pink, blue, orange, rose, violet, purple
      for (let i = 0; i < this.gas.length; i += 2) {
        const g = this.gas[i];
        const a = g.a + t * g.sp * (0.6 + s * 4) + s * 2;
        const d = g.d * this.R * 0.6 * (1 - 0.85 * s) * (1 + Math.sin(t * 0.7 + g.w) * 0.04);
        const x = p.x + Math.cos(a) * d * 1.3, y = p.y + Math.sin(a) * d * 0.85;
        const size = g.s * this.k * 0.8 * (1 - 0.4 * s);
        ctx.globalAlpha = 0.2 * k;
        ctx.drawImage(this.sprites[cols[i % cols.length]], x - size / 2, y - size / 2, size, size);
      }
      ctx.restore();
      if (!this.lit2) {
        const r = this.rb * 0.45 * (0.3 + s * 0.9);
        const core = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 1.8);
        core.addColorStop(0, 'rgba(255,190,130,' + (0.2 + s * 0.6) * k + ')');
        core.addColorStop(1, 'rgba(255,110,90,0)');
        ctx.fillStyle = core;
        SA.circle(ctx, p.x, p.y, r * 1.8);
        ctx.fill();
      }
    }

    drawNewStar(ctx, t) {
      if (!this.lit2) return;
      const p = this.newPos(), r = this.rb * 0.5 * (1 + Math.sin(t * 2) * 0.03);
      SA.drawBody(ctx, 'sun', p.x, p.y, r, { t });
      if (this.phase !== 'play') SA.label(ctx, 'New baby star!', p.x, p.y + r * 2.3 + 10, 20 * this.k, '#fff3b0');
    }

    drawRedGiant(ctx, x, y, r, t, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha;
      const halo = ctx.createRadialGradient(x, y, r * 0.8, x, y, r * 1.6);
      halo.addColorStop(0, 'rgba(255,110,70,0.5)');
      halo.addColorStop(1, 'rgba(255,80,60,0)');
      ctx.fillStyle = halo;
      SA.circle(ctx, x, y, r * 1.6); ctx.fill();
      const g = ctx.createRadialGradient(x - r * 0.25, y - r * 0.25, r * 0.1, x, y, r);
      g.addColorStop(0, '#ffd2a0');
      g.addColorStop(0.5, '#ff7a45');
      g.addColorStop(1, '#c2301e');
      ctx.fillStyle = g;
      SA.circle(ctx, x, y, r); ctx.fill();
      ctx.save();
      SA.circle(ctx, x, y, r);
      ctx.clip();
      const rnd = SA.seeded(5);
      for (let i = 0; i < 14; i++) {
        const a = rnd() * TAU + t * 0.02, dd = Math.sqrt(rnd()) * r;
        ctx.fillStyle = 'rgba(255,200,140,' + (0.1 + 0.1 * Math.sin(t + i)) + ')';
        SA.circle(ctx, x + Math.cos(a) * dd, y + Math.sin(a) * dd, r * (0.12 + rnd() * 0.12)); ctx.fill();
      }
      ctx.restore();
      ctx.restore();
    }

    drawYears(ctx, t) {
      const yrs = Math.round(this.grow * 50) / 10;
      SA.pill(ctx, '⏩ +' + yrs.toFixed(1) + ' billion years', SA.W / 2, 36, 22 * this.k, { color: '#ffe8b0', edge: 'rgba(255,170,90,0.9)' });
    }

    drawProgress(ctx, k, text) {
      const W = SA.W, w = SA.topBarW(), x = (W - w) / 2, y = 34;
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      SA.rrect(ctx, x, y - 9, w, 18, 9); ctx.fill();
      const g = ctx.createLinearGradient(x, 0, x + w, 0);
      g.addColorStop(0, '#ff7ac8');
      g.addColorStop(1, '#ffd84d');
      ctx.fillStyle = g;
      SA.rrect(ctx, x, y - 9, Math.max(18, w * k), 18, 9); ctx.fill();
      SA.label(ctx, text, W / 2, y + 30, 17, '#fff', { weight: 800 });
    }

    // A pointing hand that shows what to do in each chapter.
    drawFinger(ctx, t) {
      const k = this.k, c = this.chapter;
      let x, y;
      if (c === 0) {
        if (this.dragging) return;
        const a = t * 2.4;
        x = this.cx + Math.cos(a) * this.R * 0.55; y = this.cy + Math.sin(a) * this.R * 0.35;
      } else if (c === 1) {
        if (this.taps > 2) return;
        x = this.cx + this.rb * 0.7; y = this.cy + this.rb * 0.8 + Math.abs(Math.sin(t * 4)) * 10;
      } else if (c === 2) {
        const p = this.planets.find(q => !q.made);
        if (!p || this.planets.some(q => q.made)) return;
        const q = this.clumpPos(p);
        x = q.x + 18 * k; y = q.y + 26 * k + Math.abs(Math.sin(t * 3)) * 8;
      } else if (c === 3) {
        if (this.holding) return;
        x = this.cx + this.rb * 1.2; y = this.cy + this.rb * 1.4 + Math.abs(Math.sin(t * 2)) * 6;
      } else if (c === 5) {
        if (this.dragging || this.pan < 1) return;
        const a = t * 2.4, p = this.newPos();
        x = p.x + Math.cos(a) * this.R * 0.4; y = p.y + Math.sin(a) * this.R * 0.28;
      } else {
        if (this.puffs > 0) return;
        x = this.cx + this.rb * 2; y = this.cy + this.rb * 2 + Math.abs(Math.sin(t * 4)) * 10;
      }
      SA.emoji(ctx, '👆', x, y, 40 * k);
    }
  }
  SA.SunScene = SunScene;
})(window.SA);
