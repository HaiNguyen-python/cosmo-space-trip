// Bonus mission: "Ice Ocean Dive" (Europa, one of Jupiter's moons; opens after Jupiter).
// Cosmo's little submarine stands on Europa's cracked ice with giant Jupiter in the sky. The child
// taps (or holds) to melt down through the thick ice shell, splashes into the dark salty ocean
// underneath, then steers the sub with a searchlight to find 5 secrets: a water fountain through a
// crack, warm water from Jupiter's squeezing, sparkly salt, warm sea-floor vents and the big
// mystery (could anything live here? nobody knows yet). Nothing can be failed: the sub just
// bumps softly off the ice and the sea floor, and a twinkle shows the way after a quiet while.
(function (SA) {
  const TAU = Math.PI * 2;
  // The five secrets, as fractions of the ocean view. The lower left stays clear for Cosmo's
  // speech bubble on phones, and the right edge for a peeking critter.
  const ITEMS = [
    { id: 'plume', x: 0.24, y: 0.25, name: 'Ice fountain',
      lines: ['Look up! Water is spraying out through a crack in the ice! ⛲', 'Scientists think Europa may have giant fountains like this. The Hubble Space Telescope may have spotted some!'] },
    { id: 'warm', x: 0.5, y: 0.5, name: 'Warm water',
      lines: ['Ooh, the water feels warmer here! ♨️', 'Jupiter\'s strong gravity squeezes and stretches Europa, like squishing a stress ball. That makes heat, so the ocean doesn\'t freeze!'] },
    { id: 'salt', x: 0.77, y: 0.31, name: 'Salty sea',
      lines: ['Sparkly salt! 🧂 Europa\'s ocean is salty, like the seas on Earth.', 'It might hold about twice as much water as all of Earth\'s oceans put together! 🌊'] },
    { id: 'vents', x: 0.64, y: 0.83, name: 'Sea-floor vents',
      lines: ['Look at the sea floor! These rocky chimneys puff out warm, cloudy water.', 'Earth\'s deep oceans have warm vents like these. Scientists wonder if Europa\'s sea floor has them too!'] },
    { id: 'mystery', x: 0.36, y: 0.73, name: 'The big mystery',
      lines: ['A glowing question mark! ❓ This is the biggest mystery of all...', 'Could tiny living things live in an ocean like this? Nobody knows yet! Scientists really want to find out. 🔍'] },
  ];

  class EuropaScene {
    constructor() {
      this.stars = new SA.Starfield(200, 71);
      this.fx = new SA.Particles();
      this.t = 0;
      const rnd = SA.seeded(57);
      // Ice flakes drifting in the water, little bubbles trapped in the ice, and surface cracks.
      this.flakes = [];
      for (let i = 0; i < 70; i++) this.flakes.push({ x: rnd(), y: rnd(), s: 0.8 + rnd() * 1.8, sp: 0.004 + rnd() * 0.01, w: rnd() * 6 });
      this.specks = [];
      for (let i = 0; i < 90; i++) this.specks.push({ x: rnd(), d: rnd(), s: 1 + rnd() * 3, k: rnd() });
      this.cracks = [];
      for (let i = 0; i < 9; i++) this.cracks.push({ x: rnd(), y: rnd(), a: (rnd() - 0.5) * 0.5, len: 0.25 + rnd() * 0.4, w: 1.5 + rnd() * 2.5 });
    }

    layout() {
      const W = SA.W, H = SA.H;
      this.ground = H * 0.62;          // the icy surface, in the surface view
      this.iceDepth = H * 2.4;         // how far down the ocean starts (world units below the surface)
      this.ceil = H * 0.14;            // the underside of the ice, in the ocean view
      this.floor = H * 0.9;            // the sea floor
      this.lightR = SA.easy() ? 200 : 160;
      if (this.sub) {
        this.sub.x = SA.clamp(this.sub.x, W * 0.06, W * 0.94);
        this.sub.y = SA.clamp(this.sub.y, this.ceil + 34, this.floor - 34);
      }
    }
    resize() { this.layout(); }
    itemPos(it) { return { x: it.x * SA.W, y: it.y * SA.H }; }

    enter() {
      SA.ui.setScene('game');
      SA.audio.music('europa');
      this.sub = null;
      this.layout();
      this.phase = 'intro';
      this.view = 'surface';
      this.depth = 0;          // 0 on the surface .. 1 through the ice
      this.depthGoal = 0;
      this.holding = false;
      this.drillT = 0;
      this.said = {};
      this.fade = 0;
      this.fadeDir = 0;
      this.found = {};
      this.foundN = 0;
      this.quietT = 0;
      this.sub = { x: SA.W * 0.5, y: this.ceil + 60, vx: 0, vy: 0, dir: 1, tx: null, ty: null };
      SA.ui.setInfo('🧊 Ice Ocean Dive');
      SA.ui.banner('Europa', SA.NICKNAMES.europa).then(() => SA.scene !== this ? new Promise(() => {}) : SA.ui.say(SA.introLines('europa', [
        'Welcome to Europa, one of Jupiter\'s moons! 🧊 Look how big Jupiter looks from here!',
        'Europa is covered in a thick shell of ice. See the long reddish cracks? The ice cracks and moves, a bit like a giant jigsaw puzzle.',
        'Scientists think a giant salty OCEAN hides under the ice! Let\'s melt our way down and explore it! 🌊',
        'Tap the screen again and again, or hold your finger down, to melt through the ice! 👆',
      ]))).then(() => {
        if (SA.scene !== this) return;
        this.phase = 'drill';
        SA.ui.hint('Tap again and again, or hold, to melt down through the ice! 👆', 0);
      });
    }

    exit() { SA.ui.hideTalk(); this.holding = false; }

    // ---------- Input ----------
    onDown(x, y) {
      if (this.phase === 'drill') {
        this.holding = true;
        this.depthGoal = Math.min(1.02, this.depthGoal + (SA.easy() ? 0.1 : 0.07));
        this.drillT = 0.25;
        SA.audio.play('crack');
        if (this.depth < 0.05) SA.ui.hideTalk();
        return;
      }
      if (this.phase === 'play') { this.steer(x, y); this.dragging = true; }
    }
    onMove(x, y) { if (this.dragging && this.phase === 'play') this.steer(x, y); }
    onUp() { this.holding = false; this.dragging = false; }

    steer(x, y) {
      this.sub.tx = SA.clamp(x, SA.W * 0.06, SA.W * 0.94);
      this.sub.ty = SA.clamp(y, this.ceil + 34, this.floor - 34);
    }

    // ---------- Update ----------
    update(dt) {
      this.t += dt;
      this.fx.update(dt);
      this.drillT = Math.max(0, this.drillT - dt);
      if (this.fadeDir) {
        this.fade = SA.clamp(this.fade + this.fadeDir * dt * 1.4, 0, 1);
        if (this.fadeDir > 0 && this.fade >= 1) { this.view = 'ocean'; this.fadeDir = -1; this.arrive(); }
        else if (this.fadeDir < 0 && this.fade <= 0) this.fadeDir = 0;
      }
      if (this.view !== 'ocean') this.updateDrill(dt);
      else this.updateSwim(dt);
      for (const f of this.flakes) { f.y += f.sp * dt; if (f.y > 1) { f.y -= 1; f.x = Math.random(); } }
    }

    updateDrill(dt) {
      if (this.phase !== 'drill') return;
      if (this.holding) { this.depthGoal = Math.min(1.02, this.depthGoal + dt * (SA.easy() ? 0.3 : 0.22)); this.drillT = Math.max(this.drillT, 0.1); }
      const before = this.depth;
      this.depth = Math.min(this.depthGoal, this.depth + dt * 0.5);
      if (this.depth > before) {
        this.view = 'drill';
        // Melted ice chips and bubbles fizz around the hot nose.
        if (Math.random() < dt * (SA.calm() ? 10 : 24)) {
          const p = this.probeScreen();
          this.fx.list.push({ kind: 'dot', x: p.x + SA.rand(-16, 16), y: p.y + 40, vx: SA.rand(-60, 60), vy: SA.rand(-80, -20), life: 0, max: SA.rand(0.4, 0.8), size: SA.rand(2, 5), rot: 0, color: SA.pick(['rgba(220,245,255,0.9)', 'rgba(170,220,255,0.8)']) });
        }
        if (Math.random() < dt * 3) SA.audio.play('crack');
      }
      const pass = m => before < m && this.depth >= m;
      if (pass(0.08)) this.fx.text(this.probeScreen().x + 70, this.probeScreen().y - 40, 'Brrr! So cold! 🥶', '#dff6ff');
      if (pass(0.34) && !this.said.thick) {
        this.said.thick = true;
        SA.ui.hint('This ice is many kilometres thick! Scientists are still working out exactly how thick. Keep going! 👆', 6);
      }
      if (pass(0.7)) this.fx.text(this.probeScreen().x + 70, this.probeScreen().y - 40, 'Almost there! 💪', '#fff3a0');
      if (this.depth >= 1) {
        this.phase = 'cheer';
        this.holding = false;
        SA.audio.play('whoosh');
        setTimeout(() => SA.audio.play('bubble'), 200);
        SA.ui.hideTalk();
        this.fadeDir = 1;
      }
    }

    // In the ocean: Cosmo explains the dark, then off we go.
    arrive() {
      this.sub.x = SA.W * 0.5; this.sub.y = this.ceil + 60; this.sub.tx = null;
      for (let i = 0; i < (SA.calm() ? 8 : 20); i++) this.fx.spawn('dot', this.sub.x + SA.rand(-30, 30), this.sub.y + SA.rand(-20, 20), 1, { color: 'rgba(200,240,255,0.8)' });
      SA.ui.say([
        'SPLASH! We made it into the ocean under the ice! 🌊',
        'It\'s very dark down here, because sunlight can\'t shine through all that ice. Good thing my submarine has a light! 🔦',
        'Drag your finger to steer. Let\'s find 5 secrets of Europa\'s ocean! 👆',
      ]).then(() => {
        if (SA.scene !== this) return;
        this.phase = 'play';
        this.quietT = 0;
        SA.ui.setInfo('🔦 Secrets 0 / ' + ITEMS.length);
      });
    }

    updateSwim(dt) {
      const s = this.sub, W = SA.W;
      if (this.phase === 'play' || this.phase === 'cheer' || this.phase === 'intro') {
        let ax = 0, ay = 0;
        if (s.tx != null && this.phase === 'play') {
          const dx = s.tx - s.x, dy = s.ty - s.y, d = Math.hypot(dx, dy);
          const max = SA.easy() ? 300 : 250;
          if (d > 6) { ax = (dx / d) * Math.min(max, d * 3) - s.vx; ay = (dy / d) * Math.min(max, d * 3) - s.vy; }
          else { ax = -s.vx; ay = -s.vy; }
          ax *= 3; ay *= 3;
        } else { ax = -s.vx * 2; ay = -s.vy * 2 + Math.sin(this.t * 1.6) * 12; }
        s.vx += ax * dt; s.vy += ay * dt;
        s.x += s.vx * dt; s.y += s.vy * dt;
        // Soft bumps off the ice above, the sea floor below and the sides.
        if (s.y < this.ceil + 34) { s.y = this.ceil + 34; s.vy = Math.abs(s.vy) * 0.4; }
        if (s.y > this.floor - 34) { s.y = this.floor - 34; s.vy = -Math.abs(s.vy) * 0.4; }
        s.x = SA.clamp(s.x, W * 0.06, W * 0.94);
        if (Math.abs(s.vx) > 20) s.dir = s.vx > 0 ? 1 : -1;
        if (Math.hypot(s.vx, s.vy) > 40 && Math.random() < dt * (SA.calm() ? 6 : 14)) {
          this.fx.list.push({ kind: 'dot', x: s.x - s.dir * 46, y: s.y + SA.rand(-6, 6), vx: -s.dir * SA.rand(20, 60), vy: SA.rand(-50, -20), life: 0, max: SA.rand(0.6, 1.1), size: SA.rand(2, 4.5), rot: 0, color: 'rgba(210,240,255,0.7)' });
        }
      }
      if (this.phase !== 'play') return;
      this.quietT += dt;
      // A secret comes into the searchlight.
      for (const it of ITEMS) {
        if (this.found[it.id]) continue;
        const p = this.itemPos(it);
        if (Math.hypot(p.x - s.x, p.y - s.y) < this.lightR * 0.72) { this.discover(it); break; }
      }
    }

    discover(it) {
      this.found[it.id] = 1;
      this.foundN++;
      this.phase = 'visit';
      this.quietT = 0;
      this.sub.tx = null;
      this.dragging = false;
      const p = this.itemPos(it);
      SA.audio.play('collect');
      setTimeout(() => SA.audio.play('ding'), 150);
      this.fx.spawn('sparkle', p.x, p.y, SA.calm() ? 10 : 22, { color: it.id === 'warm' ? '#ffc58a' : '#bff4ff' });
      this.fx.text(p.x, p.y - 56, it.name + '!', '#fff3a0');
      SA.ui.setInfo('🔦 Secrets ' + this.foundN + ' / ' + ITEMS.length);
      SA.ui.bumpInfo();
      setTimeout(() => {
        if (SA.scene !== this) return;
        SA.ui.say(it.lines).then(() => {
          if (SA.scene !== this) return;
          if (this.foundN >= ITEMS.length) this.finish();
          else {
            this.phase = 'play';
            if (this.foundN === 1) SA.ui.hint('Great! ' + (ITEMS.length - 1) + ' more secrets are hiding in the dark. Drag to explore! 🔦', 5);
          }
        });
      }, 650);
    }

    async finish() {
      this.phase = 'done';
      SA.audio.play('cheer');
      SA.celebrate(110);
      await SA.ui.say([
        'You found all 5 secrets of Europa\'s ocean! 🎉',
        'A real spacecraft called Europa Clipper set off in 2024. It will reach Jupiter in 2030 and fly past Europa again and again to study it! 🛰️',
      ]);
      if (SA.scene !== this) return;
      await SA.ui.banner('Mission Complete!', '🌊 You explored an ocean under the ice', 'gold', 3);
      if (SA.scene !== this) return;
      SA.finishPlanet('europa', 3);
    }

    // ---------- Drawing ----------
    probeScreen() {
      // The probe stays at the same height on screen while the ice scrolls up past it.
      const H = SA.H, top = this.ground - 44;
      const cam = this.camY();
      return { x: SA.W * 0.42, y: top + this.depth * this.iceDepth - cam };
    }
    camY() { return Math.max(0, this.depth * this.iceDepth - SA.H * 0.12); }

    draw(ctx) {
      if (this.view === 'ocean') this.drawOcean(ctx);
      else this.drawIce(ctx);
      this.fx.draw(ctx);
      if (this.fade > 0) {
        ctx.fillStyle = 'rgba(2,10,30,' + this.fade + ')';
        ctx.fillRect(0, 0, SA.W, SA.H);
      }
    }

    // The surface, then a cut-away of the ice shell as the probe melts down through it.
    drawIce(ctx) {
      const W = SA.W, H = SA.H, t = this.t, cam = this.camY(), g0 = this.ground - cam;
      // Black sky with giant Jupiter (only near the surface).
      ctx.fillStyle = '#04051a';
      ctx.fillRect(0, 0, W, H);
      if (g0 > 0) {
        ctx.save();
        ctx.translate(0, -cam);
        this.stars.draw(ctx, t, 0);
        SA.drawBody(ctx, 'jupiter', W * 0.78, H * 0.2, H * 0.17, { t: t * 0.3, lx: -0.9, ly: -0.1 });
        ctx.restore();
      }
      // The ice shell: pale and creamy at the top, deep glassy blue further down.
      const top = g0, bottom = g0 + this.iceDepth;
      const ig = ctx.createLinearGradient(0, top, 0, bottom);
      ig.addColorStop(0, '#f2eadb');
      ig.addColorStop(0.03, '#cfe8f5');
      ig.addColorStop(0.3, '#8cc4e8');
      ig.addColorStop(0.7, '#4f8cc8');
      ig.addColorStop(1, '#24508f');
      ctx.fillStyle = ig;
      ctx.fillRect(0, Math.max(0, top), W, Math.min(H, bottom) - Math.max(0, top));
      // The surface: a gently curved edge with reddish cracks across it.
      if (top > -20) {
        ctx.fillStyle = '#efe6d6';
        ctx.beginPath();
        ctx.moveTo(0, top + 8);
        ctx.quadraticCurveTo(W / 2, top - 22, W, top + 8);
        ctx.lineTo(W, top + 40); ctx.lineTo(0, top + 40); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(150,75,45,0.55)';
        ctx.lineCap = 'round';
        for (const c of this.cracks) {
          const cx = c.x * W, cy = top + 2 + c.y * 30;
          ctx.lineWidth = c.w;
          ctx.beginPath();
          ctx.moveTo(cx - c.len * W * 0.5, cy - c.a * 40);
          ctx.quadraticCurveTo(cx, cy + 6, cx + c.len * W * 0.5, cy + c.a * 40);
          ctx.stroke();
        }
      }
      // Trapped bubbles, bits of reddish dust and white crystal cracks in the ice, and faint layers.
      ctx.lineWidth = 1.5;
      for (const s of this.specks) {
        const y = top + 50 + s.d * (this.iceDepth - 80), x = s.x * W;
        if (y < -20 || y > H + 20) continue;
        if (s.k < 0.6) {
          ctx.fillStyle = 'rgba(255,255,255,0.18)';
          ctx.strokeStyle = 'rgba(255,255,255,0.6)';
          SA.circle(ctx, x, y, s.s + 1); ctx.fill(); ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          SA.circle(ctx, x - s.s * 0.35, y - s.s * 0.35, Math.max(0.8, s.s * 0.3)); ctx.fill();
        } else if (s.k < 0.8) {
          ctx.fillStyle = 'rgba(160,90,60,0.35)';
          SA.ellipse(ctx, x, y, s.s * 3, s.s * 0.8, s.k * 4); ctx.fill();
        } else {
          ctx.strokeStyle = 'rgba(255,255,255,0.45)';
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 14 * s.s, y + 9); ctx.lineTo(x + 6 * s.s, y + 22); ctx.lineTo(x + 18 * s.s, y + 34); ctx.stroke();
        }
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 2;
      for (let i = 1; i < 12; i++) {
        const y = top + (i / 12) * this.iceDepth;
        if (y < 0 || y > H) continue;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(W * 0.3, y - 10, W * 0.7, y + 10, W, y); ctx.stroke();
      }
      // The ocean showing at the bottom.
      if (bottom < H) {
        const og = ctx.createLinearGradient(0, bottom, 0, H);
        og.addColorStop(0, '#0e3a74');
        og.addColorStop(1, '#061a3f');
        ctx.fillStyle = og;
        ctx.fillRect(0, bottom, W, H - bottom);
        ctx.fillStyle = 'rgba(200,235,255,0.5)';
        ctx.fillRect(0, bottom - 3, W, 3);
      }
      // The melted tunnel behind the probe.
      const p = this.probeScreen();
      if (this.depth > 0) {
        const tg = ctx.createLinearGradient(0, top, 0, p.y);
        tg.addColorStop(0, 'rgba(40,90,150,0.35)');
        tg.addColorStop(1, 'rgba(30,70,130,0.6)');
        ctx.fillStyle = tg;
        ctx.fillRect(p.x - 26, Math.max(-5, top), 52, p.y - Math.max(-5, top));
      }
      // The probe: Cosmo's submarine pointing down, with a glowing hot nose.
      const hot = this.drillT > 0 ? 1 : 0.35;
      const glow = ctx.createRadialGradient(p.x, p.y + 52, 2, p.x, p.y + 52, 46);
      glow.addColorStop(0, 'rgba(255,190,120,' + 0.65 * hot + ')');
      glow.addColorStop(1, 'rgba(255,140,80,0)');
      ctx.fillStyle = glow;
      SA.circle(ctx, p.x, p.y + 52, 46); ctx.fill();
      ctx.save();
      ctx.translate(p.x + (this.drillT > 0 && !SA.calm() ? Math.sin(t * 60) * 1.5 : 0), p.y);
      ctx.rotate(Math.PI / 2);
      this.drawSub(ctx, 0, 0, 0.9, t, { lamp: false, nose: hot });
      ctx.restore();
      // Depth meter on the right.
      this.drawMeter(ctx);
      if (this.phase === 'drill' && this.depth < 0.04) {
        SA.emoji(ctx, '👆', p.x + 70, p.y + 60 + Math.abs(Math.sin(t * 4)) * 8, 40);
      }
    }

    drawMeter(ctx) {
      const W = SA.W, H = SA.H, x = W - 46, y0 = H * 0.2, y1 = H * 0.78;
      ctx.fillStyle = 'rgba(10,20,50,0.6)';
      SA.rrect(ctx, x - 14, y0 - 10, 28, y1 - y0 + 20, 14); ctx.fill();
      const g = ctx.createLinearGradient(0, y0, 0, y1);
      g.addColorStop(0, '#f2eadb'); g.addColorStop(0.5, '#7fb8e0'); g.addColorStop(1, '#1d4d8c');
      ctx.fillStyle = g;
      SA.rrect(ctx, x - 7, y0, 14, y1 - y0, 7); ctx.fill();
      const my = SA.lerp(y0, y1, SA.clamp(this.depth, 0, 1));
      ctx.fillStyle = '#ffd84d';
      ctx.strokeStyle = '#7a5200';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x - 20, my - 9); ctx.lineTo(x - 8, my); ctx.lineTo(x - 20, my + 9); ctx.closePath(); ctx.fill(); ctx.stroke();
      SA.label(ctx, 'Ice', x, y0 - 24, 15, '#e8f6ff');
      SA.label(ctx, 'Ocean', x - 8, y1 + 26, 15, '#9fd8ff');
    }

    // Cosmo's little yellow submarine, facing right (dir flips it). o.lamp: the searchlight is on.
    drawSub(ctx, x, y, s, t, o) {
      o = o || {};
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(s * (o.dir || 1), s);
      // Propeller.
      ctx.fillStyle = '#8a93ad';
      const pr = Math.sin(t * 30) * 9;
      SA.ellipse(ctx, -54, 0, 4, Math.abs(pr) + 2); ctx.fill();
      ctx.fillStyle = '#5b6482';
      ctx.fillRect(-52, -3, 10, 6);
      // Fins and body.
      ctx.fillStyle = '#ff9f1c'; ctx.strokeStyle = '#a35a00'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(-34, -14); ctx.lineTo(-48, -28); ctx.lineTo(-30, -24); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-34, 14); ctx.lineTo(-48, 28); ctx.lineTo(-30, 24); ctx.closePath(); ctx.fill(); ctx.stroke();
      const g = ctx.createLinearGradient(0, -26, 0, 26);
      g.addColorStop(0, '#fff3a0'); g.addColorStop(0.5, '#ffd84d'); g.addColorStop(1, '#e0a420');
      ctx.fillStyle = g;
      SA.ellipse(ctx, 0, 0, 46, 25); ctx.fill(); ctx.stroke();
      // Tower on top.
      SA.rrect(ctx, -12, -36, 24, 14, 5); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#6b7493'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(4, -36); ctx.lineTo(4, -46); ctx.lineTo(12, -46); ctx.stroke();
      // Porthole with Cosmo.
      ctx.fillStyle = '#9fb2d9';
      SA.circle(ctx, 8, -2, 15); ctx.fill();
      ctx.fillStyle = '#16204a';
      SA.circle(ctx, 8, -2, 11.5); ctx.fill();
      ctx.save();
      SA.circle(ctx, 8, -2, 11.5); ctx.clip();
      SA.drawCosmo(ctx, 8, 4, 0.25, { t, noBob: true, hat: 'none', mood: this.phase === 'visit' ? 'joy' : null });
      ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      SA.ellipse(ctx, 3, -8, 4, 2.4, -0.6); ctx.fill();
      // Rivets and the nose: a searchlight, or a hot melting tip in the ice.
      ctx.fillStyle = 'rgba(163,90,0,0.5)';
      for (const rx of [-26, -16, 30]) { SA.circle(ctx, rx, 10, 2); ctx.fill(); }
      if (o.nose != null) {
        ctx.fillStyle = SA.rgba('#ff7a3d', 0.5 + 0.5 * o.nose);
        ctx.beginPath(); ctx.moveTo(42, -12); ctx.lineTo(62, 0); ctx.lineTo(42, 12); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#a35a00'; ctx.lineWidth = 2; ctx.stroke();
      } else {
        ctx.fillStyle = '#6b7493';
        SA.rrect(ctx, 40, -8, 10, 16, 3); ctx.fill();
        ctx.fillStyle = o.lamp ? '#fffbe0' : '#c9d2e8';
        SA.ellipse(ctx, 50, 0, 3.5, 7); ctx.fill();
      }
      ctx.restore();
    }

    drawOcean(ctx) {
      const W = SA.W, H = SA.H, t = this.t, s = this.sub;
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#16508f');
      g.addColorStop(0.5, '#0c3268');
      g.addColorStop(1, '#061636');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      // The underside of the ice shell, with icicle bumps.
      const ig = ctx.createLinearGradient(0, 0, 0, this.ceil + 20);
      ig.addColorStop(0, '#5f9ad0');
      ig.addColorStop(1, '#a9d6f2');
      ctx.fillStyle = ig;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(W, 0);
      for (let i = 24; i >= 0; i--) {
        const x = (i / 24) * W, bump = ((i * 37) % 7) / 7;
        ctx.lineTo(x, this.ceil + Math.sin(i * 1.7) * 8 + bump * 16 * (i % 3 === 0 ? 1.6 : 0.6));
      }
      ctx.closePath();
      ctx.fill();
      // The hole we melted.
      ctx.fillStyle = 'rgba(20,60,120,0.6)';
      ctx.fillRect(W * 0.5 - 24, 0, 48, this.ceil + 8);
      // The rocky sea floor.
      ctx.fillStyle = '#1d2238';
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let i = 0; i <= 30; i++) {
        const x = (i / 30) * W;
        ctx.lineTo(x, this.floor + Math.sin(i * 0.9) * 10 + Math.sin(i * 2.3) * 5);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();
      // Drifting ice flakes.
      ctx.fillStyle = 'rgba(220,240,255,0.55)';
      for (const f of this.flakes) {
        const x = f.x * W + Math.sin(t * 0.5 + f.w) * 10, y = this.ceil + f.y * (this.floor - this.ceil);
        ctx.fillRect(x, y, f.s, f.s);
      }
      // The secrets (hidden in the dark until the light finds them).
      for (const it of ITEMS) this.drawItem(ctx, it, t, false);

      // Darkness everywhere except around the submarine's light.
      const R = this.lightR;
      const dark = ctx.createRadialGradient(s.x + s.dir * 30, s.y, R * 0.45, s.x + s.dir * 30, s.y, R);
      dark.addColorStop(0, 'rgba(1,6,22,0)');
      dark.addColorStop(1, 'rgba(1,6,22,0.86)');
      ctx.fillStyle = dark;
      ctx.fillRect(0, 0, W, H);
      // The searchlight beam ahead of the sub.
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const bx = s.x + s.dir * 44;
      const bg = ctx.createRadialGradient(bx, s.y, 4, bx, s.y, R * 0.95);
      bg.addColorStop(0, 'rgba(255,250,210,0.22)');
      bg.addColorStop(1, 'rgba(255,250,210,0)');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.moveTo(bx, s.y - 6);
      ctx.lineTo(bx + s.dir * R * 0.95, s.y - R * 0.42);
      ctx.lineTo(bx + s.dir * R * 0.95, s.y + R * 0.42);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      // Found secrets keep glowing in the dark; the rest show a twinkle after a quiet while
      // (always, very softly, in Little Explorer mode).
      for (const it of ITEMS) {
        if (this.found[it.id]) this.drawItem(ctx, it, t, true);
        else if (this.phase === 'play' && (this.quietT > 10 || SA.easy())) {
          const p = this.itemPos(it), a = (this.quietT > 10 ? 0.75 : 0.35) * (0.5 + 0.5 * Math.sin(t * 3 + it.x * 9));
          ctx.fillStyle = 'rgba(255,245,180,' + a + ')';
          SA.starPath(ctx, p.x, p.y, 9, 0.35, 4, t);
          ctx.fill();
        }
      }
      const bob = Math.sin(t * 2) * 3;
      this.drawSub(ctx, s.x, s.y + bob, 1.05, t, { dir: s.dir, lamp: true });
      if (this.phase === 'play' && this.foundN === 0 && s.tx == null) {
        SA.emoji(ctx, '👆', s.x + 120 + Math.sin(t * 2) * 30, s.y + 70, 40);
      }
    }

    // glowing = drawn on top of the darkness (already found).
    drawItem(ctx, it, t, glowing) {
      const p = this.itemPos(it), H = SA.H;
      ctx.save();
      if (glowing) {
        const gl = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, 70);
        gl.addColorStop(0, it.id === 'warm' || it.id === 'vents' ? 'rgba(255,170,110,0.28)' : 'rgba(170,230,255,0.28)');
        gl.addColorStop(1, 'rgba(170,230,255,0)');
        ctx.fillStyle = gl;
        SA.circle(ctx, p.x, p.y, 70); ctx.fill();
      }
      if (it.id === 'plume') {
        // A crack up through the ice, and a stream of water and bubbles rushing up into it.
        const cy = this.ceil + 6;
        ctx.strokeStyle = '#123a6a';
        ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(p.x - 6, 0); ctx.lineTo(p.x + 6, cy * 0.4); ctx.lineTo(p.x - 4, cy * 0.7); ctx.lineTo(p.x + 3, cy + 6); ctx.stroke();
        const sg = ctx.createLinearGradient(0, p.y + 50, 0, cy);
        sg.addColorStop(0, 'rgba(200,240,255,0)');
        sg.addColorStop(1, 'rgba(220,250,255,0.75)');
        ctx.fillStyle = sg;
        ctx.beginPath(); ctx.moveTo(p.x - 22, p.y + 50); ctx.quadraticCurveTo(p.x - 4, p.y - 20, p.x - 3, cy); ctx.lineTo(p.x + 4, cy); ctx.quadraticCurveTo(p.x + 6, p.y - 20, p.x + 22, p.y + 50); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(230,250,255,0.85)';
        for (let i = 0; i < 6; i++) {
          const u = (t * 0.5 + i / 6) % 1;
          SA.circle(ctx, p.x + Math.sin(i * 2.1 + t * 3) * 9 * (1 - u), SA.lerp(p.y + 40, cy + 6, u), 2.5 + (i % 3)); ctx.fill();
        }
      } else if (it.id === 'warm') {
        const pulse = 0.6 + 0.4 * Math.sin(t * 2);
        const wg = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, 46);
        wg.addColorStop(0, 'rgba(255,190,120,' + 0.6 * pulse + ')');
        wg.addColorStop(1, 'rgba(255,120,80,0)');
        ctx.fillStyle = wg;
        SA.circle(ctx, p.x, p.y, 46); ctx.fill();
        ctx.strokeStyle = 'rgba(255,220,170,0.8)';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        for (const dx of [-16, 0, 16]) {
          ctx.beginPath();
          for (let k = 0; k <= 10; k++) {
            const yy = p.y + 22 - k * 4.6, xx = p.x + dx + Math.sin(k * 0.9 + t * 4 + dx) * 4;
            k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
          }
          ctx.stroke();
        }
      } else if (it.id === 'salt') {
        // A cluster of little cube crystals, twinkling.
        for (const [dx, dy, sz, rot] of [[-14, 6, 14, 0.2], [6, -6, 18, -0.3], [18, 10, 11, 0.5], [-2, 16, 10, -0.1], [-22, -10, 9, 0.7]]) {
          ctx.save();
          ctx.translate(p.x + dx, p.y + dy);
          ctx.rotate(rot);
          ctx.fillStyle = '#f4fbff';
          ctx.fillRect(-sz / 2, -sz / 2, sz, sz);
          ctx.fillStyle = 'rgba(160,200,230,0.6)';
          ctx.fillRect(-sz / 2, sz * 0.15, sz, sz * 0.35);
          ctx.strokeStyle = '#8fb8d8'; ctx.lineWidth = 1.5;
          ctx.strokeRect(-sz / 2, -sz / 2, sz, sz);
          ctx.restore();
        }
        ctx.fillStyle = 'rgba(255,255,255,' + (0.5 + 0.5 * Math.sin(t * 5)) + ')';
        SA.starPath(ctx, p.x + 12, p.y - 20, 6, 0.3, 4, t); ctx.fill();
      } else if (it.id === 'vents') {
        // Rocky chimneys on the sea floor puffing out warm, cloudy water.
        for (const [dx, h, w] of [[-26, 46, 16], [4, 64, 20], [30, 36, 14]]) {
          const bx = p.x + dx, by = this.floor + 4;
          ctx.fillStyle = '#3a3048';
          ctx.strokeStyle = '#1a1526'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(bx - w, by); ctx.lineTo(bx - w * 0.45, by - h); ctx.lineTo(bx + w * 0.45, by - h); ctx.lineTo(bx + w, by); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.fillStyle = 'rgba(255,150,90,0.6)';
          ctx.fillRect(bx - w * 0.3, by - h - 2, w * 0.6, 4);
          for (let i = 0; i < 4; i++) {
            const u = (t * 0.35 + i / 4 + dx * 0.01) % 1;
            ctx.fillStyle = 'rgba(210,205,220,' + 0.45 * (1 - u) + ')';
            SA.circle(ctx, bx + Math.sin(u * 5 + dx) * 8, by - h - u * 70, 6 + u * 14); ctx.fill();
          }
        }
      } else if (it.id === 'mystery') {
        const pulse = 0.7 + 0.3 * Math.sin(t * 2.5);
        const mg = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, 44);
        mg.addColorStop(0, 'rgba(150,255,230,' + 0.5 * pulse + ')');
        mg.addColorStop(1, 'rgba(120,230,255,0)');
        ctx.fillStyle = mg;
        SA.circle(ctx, p.x, p.y, 44); ctx.fill();
        SA.label(ctx, '?', p.x, p.y + Math.sin(t * 2) * 3, 46, 'rgba(220,255,250,' + pulse + ')', { stroke: 'rgba(20,60,90,0.8)' });
      }
      ctx.restore();
      if (glowing && H) SA.label(ctx, it.name, p.x, (it.id === 'vents' ? this.floor - 92 : p.y + 52), 14, 'rgba(230,248,255,0.9)', { weight: 800 });
    }
  }
  SA.EuropaScene = EuropaScene;
})(window.SA);
