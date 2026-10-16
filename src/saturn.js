// Saturn mission: "Ring Hopper". Cosmo hops up through Saturn's rings on drifting chunks of ice
// to reach the rocket, then visits a moon, three times. Rings nearer Saturn move faster (real
// physics), so timing each hop is the lesson. A missed hop is caught by Cosmo's jetpack.
(function (SA) {
  const TAU = Math.PI * 2;
  const HOP_T = 0.45;    // seconds per hop
  const SPAN = 2600;     // each ring lane repeats every SPAN world px
  const FLOAT_T = 0.9;   // jetpack rescue after a missed hop

  // Inner (bottom) to outer (top), with their real names.
  const LANES = [
    { name: 'C ring', speed: 300, w: [60, 130], gap: [110, 220], band: 'rgba(210,180,130,0.4)',
      fact: 'This is the C ring. Saturn\'s rings are made of billions of chunks of ice and rock!' },
    { name: 'B ring', speed: 225, w: [90, 200], gap: [70, 160], band: 'rgba(250,220,160,0.55)',
      fact: 'The B ring is the biggest and brightest ring. Some ice chunks are as big as a house!' },
    { name: 'Cassini Division', speed: 160, w: [55, 95], gap: [190, 280], band: 'rgba(140,120,170,0.15)',
      fact: 'This is the Cassini Division, a wide gap between the rings. Hardly any ice here!' },
    { name: 'A ring', speed: 100, w: [80, 170], gap: [90, 180], band: 'rgba(235,205,150,0.42)',
      fact: 'The A ring! The rings are super wide, but in many places only about as thick as a house is tall.' },
    { name: 'F ring', speed: 50, w: [55, 105], gap: [100, 190], band: 'rgba(220,200,180,0.28)',
      fact: 'The skinny F ring! Tiny "shepherd moons" keep it in shape.' },
  ];
  const MOONS = [
    { id: 'enceladus', name: 'Enceladus',
      fact: 'We made it to Enceladus! It shoots giant fountains of icy water into space. Some of that ice ends up in Saturn\'s rings!' },
    { id: 'titan', name: 'Titan',
      fact: 'This is Titan, Saturn\'s biggest moon. It has thick orange air and lakes of liquid methane!' },
    { id: 'mimas', name: 'Mimas',
      fact: 'This is Mimas. One giant crater makes it look like a big eye!' },
  ];
  const mod = (a, n) => ((a % n) + n) % n;

  class SaturnScene {
    constructor() {
      this.stars = new SA.Starfield(220, 41);
      this.fx = new SA.Particles();
      this.t = 0;
    }

    enter(opts) {
      SA.ui.setScene('game');
      SA.audio.music('saturn');
      // Expert mission "No Helper Circle": the landing guide never turns green, and new facts.
      this.expert = !!(opts && opts.expert);
      const E = SA.EXPERT.saturn;
      this.crossing = 0;
      this.seen = {};
      this.misses = 0;
      this.fade = 0;
      this.setupCrossing();
      this.phase = 'intro';
      SA.ui.banner('Saturn', this.expert ? '🎓 Expert: ' + E.name : SA.NICKNAMES.saturn).then(() => SA.scene !== this ? new Promise(() => {}) : SA.ui.say(this.expert ? E.intro : SA.introLines('saturn', [
        'Welcome to Saturn, the ringed planet! 🪐',
        'Saturn\'s rings are made of chunks of ice. Rings closer to Saturn zoom around faster than rings farther away!',
        'Tap to hop up onto the ice. When the circle above you turns green, it\'s safe to hop! Let\'s visit 3 of Saturn\'s moons. 🌙',
      ]))).then(() => {
        if (SA.scene !== this) return;
        this.phase = 'hop';
        SA.ui.hint(this.expert ? 'Tap to hop up! Watch the ice and pick your moment. 👆' : 'Tap to hop up! Wait for the green circle. 👆', 4);
      });
    }

    exit() { SA.ui.hideTalk(); }

    // Fresh ice for each crossing.
    setupCrossing() {
      const rnd = SA.seeded(101 + this.crossing * 17);
      const r = (a) => a[0] + rnd() * (a[1] - a[0]);
      this.lanes = LANES.map(L => {
        const chunks = [];
        let off = r(L.gap) * 0.5;
        while (off < SPAN - L.w[1] - L.gap[0]) {
          const w = r(L.w);
          chunks.push({ off, w, seed: Math.floor(rnd() * 1e6), h: Math.min(w * 0.6, 26 + rnd() * 16) });
          off += w + r(L.gap);
        }
        return { L, chunks };
      });
      this.clock = 0;
      this.cosmo = { lane: -1, x: 0, y: this.cosmoY(-1), v: 0, state: 'hover' };
      this.camX = -SA.W / 2;
      this.rocketX = SA.W / 2;
      this.pickup = null;
      SA.ui.setInfo('🌙 Moon ' + (this.crossing + 1) + ' of ' + MOONS.length);
    }

    // ---------- Geometry ----------
    laneY(k) { return SA.H * (0.69 - k * 0.104); }
    cosmoY(k) {
      if (k < 0) return SA.H * 0.81;
      if (k >= LANES.length) return this.topY() + 18;
      return this.laneY(k) - 26;
    }
    topY() { return SA.H * 0.15; }

    chunkAt(k, x, T) {
      const lane = this.lanes[k];
      const local = mod(x - lane.L.speed * T, SPAN);
      const grace = SA.easy() ? 36 : 8;   // Little Explorer mode: landings are more forgiving
      return lane.chunks.find(c => local >= c.off - grace && local <= c.off + c.w + grace) || null;
    }
    chunkWorldX(k, c, T, nearX) {
      const base = c.off + this.lanes[k].L.speed * T;
      return base + Math.round((nearX - base) / SPAN) * SPAN;
    }
    // Will a hop started now land on ice?
    willLand() {
      const c = this.cosmo, to = c.lane + 1;
      if (to >= LANES.length) return true;
      return !!this.chunkAt(to, c.x + c.v * HOP_T, this.clock + HOP_T);
    }

    onDown() {
      if (this.phase !== 'hop') return;
      const c = this.cosmo;
      if (c.state !== 'ride' && c.state !== 'hover') return;
      c.state = 'hop';
      c.hop = { t: 0, from: c.lane, to: c.lane + 1, fromY: c.y };
      SA.audio.play('jump');
    }

    update(dt) {
      this.t += dt;
      this.clock += dt;
      this.fx.update(dt);
      this.fade = Math.max(0, this.fade - dt * 2.5);
      const c = this.cosmo;

      if (this.phase === 'moon') {
        if (Math.random() < 0.6 && MOONS[this.crossing].id === 'enceladus') {
          const m = this.moonView();
          this.fx.spawn('dust', m.x + SA.rand(-30, 30), m.y + m.r * 0.85, 1, { color: 'rgba(220,240,255,0.8)' });
          const p = this.fx.list[this.fx.list.length - 1];
          p.vx = SA.rand(-20, 20); p.vy = SA.rand(40, 90);
        }
        return;
      }

      if (c.state === 'ride') {
        c.x += c.v * dt;
        c.y = this.cosmoY(c.lane) + Math.sin(this.t * 3) * 1.5;
      } else if (c.state === 'hover') {
        c.y = this.cosmoY(-1) + Math.sin(this.t * 2.5) * 5;
        if (Math.random() < 0.6) this.fx.spawn('puff', c.x - this.camX, c.y + 30, 1, { vy: 70 });
      } else if (c.state === 'hop') {
        const h = c.hop;
        h.t += dt / HOP_T;
        c.x += c.v * dt;
        const k = Math.min(1, h.t);
        c.y = SA.lerp(h.fromY, this.cosmoY(h.to), k) - Math.sin(k * Math.PI) * 46;
        if (h.t >= 1) this.land(h);
      } else if (c.state === 'float') {
        const f = c.float;
        f.t += dt / FLOAT_T;
        const k = SA.easeInOut(Math.min(1, f.t));
        const tx = f.chunk ? this.chunkWorldX(f.lane, f.chunk, this.clock, c.x) + f.off : f.x0 + f.v0 * 0.4;
        c.x = SA.lerp(f.x0, tx, k);
        c.y = SA.lerp(f.y0, this.cosmoY(f.lane), k);
        if (Math.random() < 0.7) this.fx.spawn('puff', c.x - this.camX, c.y + 28, 1, { vy: 60 });
        if (f.t >= 1) {
          c.lane = f.lane;
          c.state = f.lane < 0 ? 'hover' : 'ride';
          c.v = f.lane < 0 ? 0 : LANES[f.lane].speed;
        }
      } else if (c.state === 'pickup') {
        const p = this.pickup;
        p.t += dt;
        if (p.t > 1.3 && !p.done) {
          p.done = true;
          this.visitMoon();
        }
      }

      // Camera follows Cosmo sideways; the rocket waits above Cosmo.
      this.camX = SA.lerp(this.camX, c.x - SA.W / 2, Math.min(1, dt * 5));
      if (c.state !== 'pickup') this.rocketX = SA.lerp(this.rocketX, c.x - this.camX, Math.min(1, dt * 4));
    }

    land(h) {
      const c = this.cosmo;
      if (h.to >= LANES.length) {
        // Into the rocket!
        c.state = 'pickup';
        this.pickup = { t: 0 };
        SA.audio.play('launch');
        this.fx.spawn('sparkle', this.rocketX, this.topY(), 16);
        return;
      }
      const chunk = this.chunkAt(h.to, c.x, this.clock);
      if (chunk) {
        c.lane = h.to;
        c.state = 'ride';
        c.v = LANES[h.to].speed;
        SA.audio.play('land');
        this.fx.spawn('sparkle', c.x - this.camX, c.y + 30, 8, { color: '#dff4ff' });
        if (!this.seen[h.to]) {
          this.seen[h.to] = true;
          SA.ui.hint(this.expert ? LANES[h.to].name + '! ' + SA.EXPERT.saturn.lanes[h.to] : LANES[h.to].fact, 5);
        }
        return;
      }
      // Missed: the jetpack carries Cosmo back down to the nearest ice (or to hovering).
      this.misses++;
      SA.audio.play('whoosh');
      const f = { t: 0, lane: h.from, x0: c.x, y0: c.y, v0: c.v, chunk: null, off: 0 };
      if (h.from >= 0) {
        let best = null, bestD = 1e9;
        for (const ch of this.lanes[h.from].chunks) {
          const wx = this.chunkWorldX(h.from, ch, this.clock + FLOAT_T, c.x);
          const d = Math.abs(wx + ch.w / 2 - c.x);
          if (d < bestD) { best = ch; bestD = d; }
        }
        f.chunk = best;
        f.off = best.w / 2;
      }
      c.state = 'float';
      c.float = f;
      if (this.misses <= 2 || Math.random() < 0.25) SA.ui.hint(this.expert ? 'Whoops! Jetpack to the rescue! Wait for ice to slide under the circle. 🧊' : 'Whoops! Jetpack to the rescue! Hop when the circle is green. 🟢', 3);
    }

    visitMoon() {
      this.phase = 'moon';
      this.fade = 1;
      this.fx.list = [];
      const m = MOONS[this.crossing];
      SA.audio.play('collect');
      SA.ui.say(this.expert ? SA.EXPERT.saturn.moons[m.id] : m.fact).then(() => {
        if (SA.scene !== this) return;
        this.crossing++;
        if (this.crossing >= MOONS.length) { this.finish(); return; }
        this.fade = 1;
        this.setupCrossing();
        this.phase = 'hop';
        SA.ui.hint('Next stop: ' + MOONS[this.crossing].name + '! Hop up through the rings. 🪐', 4);
      });
    }

    async finish() {
      this.phase = 'done';
      SA.audio.play('cheer');
      SA.celebrate(120);
      // Fewer jetpack rescues = more stars (generous: this is for young kids).
      const stars = this.misses <= 4 ? 3 : this.misses <= 10 ? 2 : 1;
      await SA.ui.banner('Mission Complete!', '🌙 3 of Saturn\'s moons visited', 'gold', stars);
      if (SA.scene !== this) return;
      if (this.expert) {
        await SA.ui.say(SA.EXPERT.saturn.outro);
        SA.finishExpert('saturn', stars);
        return;
      }
      await SA.ui.say([
        'You visited Enceladus, Titan and Mimas! 🎉',
        'Saturn is so light for its size that it would float in a giant bathtub of water!',
        'And Saturn has more moons than any other planet. 🌙',
      ]);
      SA.finishPlanet('saturn', stars);
    }

    // ---------- Drawing ----------
    draw(ctx) {
      const W = SA.W, H = SA.H, t = this.t;
      if (this.phase === 'moon' || this.phase === 'done') { this.drawMoonVisit(ctx, t); this.drawFade(ctx); return; }

      SA.spaceBg(ctx, '#070a24', '#1c1540');
      this.stars.draw(ctx, t, this.camX * 0.04);
      this.drawSaturnBelow(ctx, t);

      // Next moon waiting in the sky.
      const m = MOONS[this.crossing];
      this.drawSaturnMoon(ctx, m.id, W * 0.84, H * 0.1, 30, t);
      SA.label(ctx, 'Next: ' + m.name, W * 0.84, H * 0.1 + 48, 15, '#e8ecff');

      for (let k = 0; k < LANES.length; k++) this.drawLane(ctx, k, t);

      // Landing guide above Cosmo.
      const c = this.cosmo;
      if (this.phase === 'hop' && (c.state === 'ride' || c.state === 'hover') && c.lane + 1 < LANES.length) {
        // Expert mission: the guide only shows where a hop lands, not whether there is ice there.
        const ok = this.expert ? false : this.willLand();
        const gx = c.x + c.v * HOP_T - this.camX, gy = this.laneY(c.lane + 1) - 4;
        ctx.strokeStyle = this.expert ? 'rgba(255,255,255,0.75)' : ok ? '#7ee08a' : 'rgba(255,140,120,0.8)';
        ctx.lineWidth = 4;
        ctx.setLineDash(ok ? [] : [6, 6]);
        SA.ellipse(ctx, gx, gy, 26, 10);
        ctx.stroke();
        ctx.setLineDash([]);
        if (ok) { ctx.fillStyle = 'rgba(126,224,138,0.25)'; ctx.fill(); }
      }

      // The rocket waits above the rings.
      this.drawTopRocket(ctx, t);
      this.fx.draw(ctx);
      if (c.state !== 'pickup') this.drawCosmoJet(ctx, c.x - this.camX, c.y, t, c.state === 'hover' || c.state === 'float');
      this.drawFade(ctx);
    }

    drawFade(ctx) {
      if (this.fade <= 0) return;
      ctx.globalAlpha = this.fade;
      ctx.fillStyle = '#05061a';
      ctx.fillRect(0, 0, SA.W, SA.H);
      ctx.globalAlpha = 1;
    }

    drawSaturnBelow(ctx, t) {
      const W = SA.W, H = SA.H;
      const R = W * 1.2, cx = W / 2 - this.camX * 0.02, cy = H * 0.9 + R;
      const glow = ctx.createRadialGradient(cx, cy, R * 0.98, cx, cy, R * 1.05);
      glow.addColorStop(0, 'rgba(255,230,170,0.35)');
      glow.addColorStop(1, 'rgba(255,230,170,0)');
      ctx.fillStyle = glow;
      SA.circle(ctx, cx, cy, R * 1.05); ctx.fill();
      const bands = ['#f2e0b4', '#e2c487', '#f5e7c6', '#d8b574', '#efdaa6', '#e2c487'];
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = bands[i];
        SA.circle(ctx, cx, cy, R - i * 20);
        ctx.fill();
      }
      SA.label(ctx, 'Saturn', W / 2, H * 0.95, 18, '#fff3cf', { stroke: 'rgba(90,60,10,0.6)' });
    }

    drawLane(ctx, k, t) {
      const W = SA.W, L = LANES[k], y = this.laneY(k);
      // Soft ring band, brightest in the middle.
      const band = ctx.createLinearGradient(0, y - 34, 0, y + 34);
      band.addColorStop(0, 'rgba(0,0,0,0)');
      band.addColorStop(0.5, L.band);
      band.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = band;
      ctx.fillRect(0, y - 34, W, 68);
      // Fine ice dust drifting with the ring.
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      for (let i = 0; i < 40; i++) {
        const dx = mod(i * 173 + L.speed * this.clock - this.camX, W + 40) - 20;
        SA.circle(ctx, dx, y - 24 + ((i * 37) % 48), 1.2);
        ctx.fill();
      }
      for (const c of this.lanes[k].chunks) {
        const wx = this.chunkWorldX(k, c, this.clock, this.camX + W / 2);
        const sx = wx - this.camX;
        if (sx + c.w < -40 || sx > W + 40) continue;
        this.drawIce(ctx, sx, y, c);
      }
      SA.label(ctx, L.name, 12, y - 40, 14, 'rgba(230,235,255,0.75)', { align: 'left', weight: 700 });
      const arrows = '›'.repeat(Math.max(1, Math.round(L.speed / 75)));
      SA.label(ctx, arrows, 12 + ctx.measureText(L.name).width + 10, y - 40, 16, '#ffe066', { align: 'left' });
    }

    drawIce(ctx, x, y, c) {
      const rnd = SA.seeded(c.seed);
      const pts = [];
      const n = 9;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU;
        const rr = 0.8 + rnd() * 0.3;
        pts.push([x + c.w / 2 + Math.cos(a) * c.w / 2 * rr, y + Math.sin(a) * c.h / 2 * rr]);
      }
      ctx.fillStyle = '#cfe6f5';
      SA.blobPath(ctx, pts);
      ctx.fill();
      ctx.strokeStyle = 'rgba(90,120,160,0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      SA.ellipse(ctx, x + c.w * 0.38, y - c.h * 0.2, c.w * 0.2, c.h * 0.16);
      ctx.fill();
      ctx.fillStyle = 'rgba(120,140,170,0.35)';
      SA.ellipse(ctx, x + c.w * 0.6, y + c.h * 0.18, c.w * 0.22, c.h * 0.12);
      ctx.fill();
    }

    drawTopRocket(ctx, t) {
      const p = this.pickup;
      let x = this.rocketX, y = this.topY() - 30, s = 0.55, ang = 0;
      if (p) {
        const k = SA.easeInOut(Math.min(1, p.t / 1.2));
        x = SA.lerp(this.rocketX, SA.W * 0.84, k);
        y = SA.lerp(this.topY() - 30, SA.H * 0.1, k);
        s = 0.55 * (1 - k * 0.8);
        ang = Math.atan2(SA.H * 0.1 - (this.topY() - 30), SA.W * 0.84 - this.rocketX) + Math.PI / 2;
        ang = SA.lerp(0, ang, Math.min(1, k * 3));
      }
      SA.drawRocket(ctx, x, y + Math.sin(t * 2) * 3, s, ang, { t, flame: p ? 1 : 0.3, pilot: !!p });
      if (!p) SA.label(ctx, 'Hop up to the rocket!', x, this.topY() - 88, 14, 'rgba(255,230,140,0.85)', { weight: 700 });
    }

    // Cosmo with a little jetpack (flames when hovering or flying back).
    drawCosmoJet(ctx, x, y, t, flying) {
      ctx.fillStyle = '#8b93b5';
      SA.rrect(ctx, x - 30, y - 12, 12, 26, 5); ctx.fill();
      SA.rrect(ctx, x + 18, y - 12, 12, 26, 5); ctx.fill();
      if (flying) {
        for (const fx of [x - 24, x + 24]) {
          const len = 14 + Math.sin(t * 40 + fx) * 4;
          ctx.fillStyle = '#ffb340';
          ctx.beginPath();
          ctx.moveTo(fx - 5, y + 14); ctx.lineTo(fx, y + 14 + len); ctx.lineTo(fx + 5, y + 14);
          ctx.closePath(); ctx.fill();
        }
      }
      SA.drawCosmo(ctx, x, y, 0.55, { t, noBob: true, mood: flying ? 'wow' : 'happy', wave: this.cosmo.state === 'hop', squash: this.cosmo.state === 'hop' ? -0.12 : 0 });
    }

    // ---------- Moon visit ----------
    moonView() { return { x: SA.W * 0.5, y: SA.H * 0.46, r: SA.H * 0.27 }; }

    drawMoonVisit(ctx, t) {
      const W = SA.W, H = SA.H;
      SA.spaceBg(ctx, '#05071d', '#1a1238');
      this.stars.draw(ctx, t, 0);
      // Saturn and its rings in the background sky.
      SA.drawBody(ctx, 'saturn', W * 0.16, H * 0.24, H * 0.11, { t, lx: 0.6, ly: -0.2 });
      const m = this.moonView();
      const id = MOONS[Math.min(this.crossing, MOONS.length - 1)].id;
      // The rocket circles the moon, passing behind it on the far side.
      const a = t * 0.8;
      const rx = m.x + Math.cos(a) * m.r * 1.35, ry = m.y + Math.sin(a) * m.r * 0.5;
      const rocket = () => SA.drawRocket(ctx, rx, ry, 0.4, a + Math.PI, { t, flame: 0.6 });
      if (Math.sin(a) < 0) rocket();
      this.drawSaturnMoon(ctx, id, m.x, m.y, m.r, t);
      this.fx.draw(ctx);
      if (Math.sin(a) >= 0) rocket();
      SA.label(ctx, MOONS[Math.min(this.crossing, MOONS.length - 1)].name, m.x, m.y - m.r - 30, 34, '#fff');
    }

    drawSaturnMoon(ctx, id, x, y, r, t) {
      ctx.save();
      if (id === 'titan') {
        const haze = ctx.createRadialGradient(x, y, r * 0.9, x, y, r * 1.25);
        haze.addColorStop(0, 'rgba(255,190,90,0.55)');
        haze.addColorStop(1, 'rgba(255,190,90,0)');
        ctx.fillStyle = haze;
        SA.circle(ctx, x, y, r * 1.25); ctx.fill();
      }
      SA.circle(ctx, x, y, r);
      ctx.fillStyle = id === 'enceladus' ? '#f4f8ff' : id === 'titan' ? '#e0a050' : '#cfcac4';
      ctx.fill();
      ctx.clip();
      if (id === 'enceladus') {
        // Blue "tiger stripes" near the south pole, where the geysers are.
        ctx.strokeStyle = '#7fb8e6';
        ctx.lineWidth = Math.max(2, r * 0.05);
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(x - r * 0.6, y + r * (0.45 + i * 0.1));
          ctx.quadraticCurveTo(x, y + r * (0.35 + i * 0.1), x + r * 0.6, y + r * (0.5 + i * 0.1));
          ctx.stroke();
        }
      } else if (id === 'titan') {
        ctx.fillStyle = 'rgba(200,130,50,0.5)';
        for (let i = 0; i < 4; i++) { ctx.fillRect(x - r, y - r * 0.6 + i * r * 0.4, r * 2, r * 0.14); }
      } else {
        const rnd = SA.seeded(7);
        ctx.fillStyle = '#b3aea8';
        for (let i = 0; i < 12; i++) {
          SA.circle(ctx, x + (rnd() * 2 - 1) * r, y + (rnd() * 2 - 1) * r, r * (0.04 + rnd() * 0.08));
          ctx.fill();
        }
        // Herschel, the giant crater.
        ctx.fillStyle = '#a49f99';
        SA.circle(ctx, x + r * 0.32, y - r * 0.08, r * 0.34); ctx.fill();
        ctx.fillStyle = '#c9c4be';
        SA.circle(ctx, x + r * 0.32, y - r * 0.08, r * 0.08); ctx.fill();
      }
      const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.1, x, y, r * 1.1);
      g.addColorStop(0, 'rgba(255,255,255,0.2)');
      g.addColorStop(0.6, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(5,6,25,0.6)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
      ctx.restore();
    }
  }
  SA.SaturnScene = SaturnScene;
})(window.SA);
