// Bonus mission: "Space Rock Sorter" in the asteroid belt. Space rocks float about in zero
// gravity; the child drags each one into the right cargo pod: DARK (carbon-rich, the most common
// kind), STONY, or shiny METAL. Every few rocks a famous asteroid floats by to say hello.
// A rock dropped in the wrong pod just boings back out with a gentle tip, so there's no failure.
(function (SA) {
  const TAU = Math.PI * 2;
  const PER_POD = 4;
  const PODS = [
    { kind: 'dark', name: 'Dark', icon: '⚫', color: '#9b8cff',
      fact: 'Dark rocks are the most common kind of asteroid. They\'re full of carbon, like soot! ⚫',
      tip: 'Hmm, that one is dark and sooty. Try the DARK pod!' },
    { kind: 'stony', name: 'Stony', icon: '🪨', color: '#ffc46b',
      fact: 'Stony asteroids are made of rock, a lot like the rocks here on Earth! 🪨',
      tip: 'Hmm, that one looks like a plain stony rock. Try the STONY pod!' },
    { kind: 'metal', name: 'Metal', icon: '🔩', color: '#7fd4ff',
      fact: 'Metal asteroids are made of iron and nickel. Look how shiny they are! 🔩',
      tip: 'Ooh, that one is shiny! Try the METAL pod!' },
  ];
  // Famous asteroids that visit after every few sorted rocks (the last one ends the mission).
  const VISITORS = [
    { after: 3, id: 'ceres', name: 'Ceres', kind: 'ceres', r: 1, lumps: 0.06,
      fact: 'This is Ceres, the biggest thing in the asteroid belt! It\'s a dwarf planet, and its bright spots are made of salt! 🧂' },
    { after: 6, id: 'vesta', name: 'Vesta', kind: 'vesta', r: 0.85, lumps: 0.16,
      fact: 'This is Vesta, the brightest asteroid! It has a mountain more than twice as tall as Mount Everest! ⛰️' },
    { after: 9, id: 'ida', name: 'Ida and Dactyl', kind: 'stony', r: 0.75, lumps: 0.2, long: true,
      fact: 'This is Ida, and look! It has its own tiny moon, called Dactyl! 🌙' },
    { after: 12, id: 'psyche', name: 'Psyche', kind: 'metal', r: 0.8, lumps: 0.12,
      fact: 'This is Psyche. It might be made mostly of metal! A spacecraft named Psyche was sent to visit it. 🛰️' },
  ];

  class BeltScene {
    constructor() {
      this.stars = new SA.Starfield(240, 61);
      this.fx = new SA.Particles();
      this.t = 0;
      const rnd = SA.seeded(19);
      // Far-away rocks drifting in the background (parallax decoration).
      this.far = [];
      for (let i = 0; i < 46; i++) this.far.push({ x: rnd(), y: rnd(), r: 1.5 + rnd() * 5, sp: 4 + rnd() * 10, seed: i + 100, kind: ['dark', 'dark', 'stony', 'metal'][i % 4] });
    }

    layout() {
      // Sizes stay in logical units: on phones (H = 600) that already draws them bigger.
      const W = SA.W, H = SA.H, k = 1;
      this.k = k;
      const pw = 190 * k, ph = 116 * k, px = W - pw / 2 - 26 * k;
      this.pods.forEach((p, i) => Object.assign(p, { x: px, y: H * (0.3 + i * 0.215), w: pw, h: ph }));
      // Rocks float in the open space left of the pods, above Cosmo's speech bubble.
      this.field = { x0: W * 0.12, x1: px - pw / 2 - 90 * k, y0: H * 0.22, y1: H * 0.66 };
      this.ship = { x: 90 * k, y: H * 0.2 };
    }

    resize() { if (this.pods) this.layout(); }

    enter() {
      SA.ui.setScene('game');
      SA.audio.music('belt');
      this.pods = PODS.map(p => Object.assign({ n: 0, flash: 0, bad: 0, told: false }, p));
      this.layout();
      this.rocks = [];
      this.sorted = 0;
      this.wrongs = 0;
      this.drag = null;
      this.flyers = [];
      this.visitor = null;
      this.vi = 0;
      this.phase = 'intro';
      // Exactly 4 of each kind, shuffled, so every pod can be filled.
      this.queue = [];
      for (const p of PODS) for (let i = 0; i < PER_POD; i++) this.queue.push(p.kind);
      this.queue.sort(() => Math.random() - 0.5);
      this.spawnWait = 0;
      this.updateInfo();
      SA.ui.banner('The Asteroid Belt', SA.NICKNAMES.belt).then(() => SA.scene !== this ? new Promise(() => {}) : SA.ui.say(SA.introLines('belt', [
        'Welcome to the asteroid belt! 🪨 Millions of space rocks travel around the Sun out here, between Mars and Jupiter.',
        'Scientists want to study them, and my rocket has a tractor beam! Let\'s collect some rocks. 🚀',
        'Drag each rock into the right pod: DARK rocks, STONY rocks, or shiny METAL rocks!',
      ]))).then(() => {
        if (SA.scene !== this) return;
        this.phase = 'play';
        SA.ui.hint('Drag a rock into the pod that matches it! 👆', 5);
      });
    }

    exit() { SA.ui.hideTalk(); this.drag = null; }

    updateInfo() { SA.ui.setInfo('🪨 ' + this.sorted + ' / ' + PODS.length * PER_POD + '   ✨ ' + this.vi + ' / ' + VISITORS.length); }

    pod(kind) { return this.pods.find(p => p.kind === kind); }

    spawnRock() {
      const f = this.field, k = this.k;
      const kind = this.queue.shift();
      // Floats in from the top-left, then wanders gently around its own spot in the field.
      const hx = SA.rand(f.x0 + 40 * k, f.x1 - 40 * k), hy = SA.rand(f.y0 + 30 * k, f.y1 - 30 * k);
      this.rocks.push({
        kind, seed: Math.floor(Math.random() * 1000), r: (kind === 'metal' ? 33 : 37) * k * SA.rand(0.92, 1.08),
        x: SA.rand(-60, SA.W * 0.4), y: -70 * k, hx, hy, vx: 0, vy: 0,
        rot: Math.random() * TAU, spin: SA.rand(-0.5, 0.5), ph: Math.random() * TAU, back: 0, pop: 0,
      });
    }

    // Spread new homes apart so rocks don't sit on top of each other.
    settleHomes() {
      for (const a of this.rocks) for (const b of this.rocks) {
        if (a === b) continue;
        const dx = a.hx - b.hx, dy = a.hy - b.hy, d = Math.hypot(dx, dy) || 1, min = (a.r + b.r) * 1.5;
        if (d < min) { a.hx += (dx / d) * (min - d) * 0.5; a.hy += (dy / d) * (min - d) * 0.5; }
      }
      const f = this.field;
      for (const r of this.rocks) { r.hx = SA.clamp(r.hx, f.x0, f.x1); r.hy = SA.clamp(r.hy, f.y0, f.y1); }
    }

    onDown(x, y) {
      if (this.phase === 'visit' && this.visitor && this.visitor.state === 'wait') {
        const v = this.visitor;
        if (Math.hypot(x - v.x, y - v.y) < v.r + 50 * this.k) this.meetVisitor();
        return;
      }
      if (this.phase !== 'play') return;
      let best = null, bd = 1e9;
      for (const r of this.rocks) {
        if (r.inPod) continue;
        const d = Math.hypot(x - r.x, y - r.y);
        if (d < r.r + 26 * this.k && d < bd) { best = r; bd = d; }
      }
      if (!best) return;
      this.drag = { r: best, ox: best.x - x, oy: best.y - y, tx: x, ty: y };
      best.pop = 1;
      SA.audio.play('blip');
      SA.ui.hideTalk();
    }

    onMove(x, y) { if (this.drag) { this.drag.tx = x; this.drag.ty = y; } }

    onUp() {
      const d = this.drag;
      if (!d) return;
      this.drag = null;
      const r = d.r;
      // The drop zones are generous and overlap between pods, so the nearest pod wins (a rock
      // dropped on the bottom edge of its own pod must never count as the pod below).
      const reach = SA.easy() ? 1.0 : 0.75;
      let hit = null, best = 1e9;
      for (const p of this.pods) {
        const dx = Math.abs(r.x - p.x), dy = Math.abs(r.y - p.y);
        if (dx < p.w * reach && dy < p.h * reach && dy < best) { hit = p; best = dy; }
      }
      if (!hit) return;   // just let go: the rock floats back home
      if (hit.kind === r.kind && hit.n < PER_POD) this.sortRock(r, hit);
      else this.bounceRock(r, hit);
    }

    sortRock(r, p) {
      r.inPod = true;
      this.rocks = this.rocks.filter(o => o !== r);
      p.n++;
      p.flash = 1;
      this.sorted++;
      this.updateInfo();
      SA.ui.bumpInfo();
      this.flyers.push({ kind: r.kind, seed: r.seed, x0: r.x, y0: r.y, p, slot: p.n - 1, t: 0, r: r.r });
      SA.audio.play('collect');
      this.fx.spawn('sparkle', p.x, p.y, 14, { color: p.color });
      this.fx.text(p.x - p.w * 0.1, p.y - p.h * 0.6, p.name + '! ✓', '#ffe066');
      if (!p.told) { p.told = true; SA.ui.hint(p.fact, 6); }
      const v = VISITORS[this.vi];
      if (v && this.sorted >= v.after) setTimeout(() => { if (SA.scene === this && this.phase === 'play') this.startVisit(); }, 900);
    }

    bounceRock(r, p) {
      this.wrongs++;
      p.bad = 1;
      SA.audio.play('boing');
      // Pushed back out into the field, toward the middle.
      r.vx = -420 * this.k;
      r.vy = SA.rand(-80, 80);
      r.back = 1;
      SA.ui.hint(p.n >= PER_POD && p.kind === r.kind ? 'That pod is full! 😊' : PODS.find(o => o.kind === r.kind).tip, 4);
    }

    startVisit() {
      const v = VISITORS[this.vi];
      this.phase = 'visit';
      this.drag = null;
      const k = this.k;
      this.visitor = Object.assign({}, v, {
        x: -160 * k, y: SA.H * 0.42, tx: (this.field.x0 + this.field.x1) / 2, r: 92 * k * v.r, state: 'in', t: 0, rot: 0,
      });
      SA.audio.play('whoosh');
      SA.ui.hint('Whoa, look! A famous asteroid is coming! Tap it to say hello! 👋', 0);
    }

    meetVisitor() {
      const v = this.visitor;
      v.state = 'met';
      v.t = 0;
      this.vi++;
      this.updateInfo();
      SA.audio.play('shutter');
      setTimeout(() => SA.audio.play('ding'), 200);
      this.fx.spawn('sparkle', v.x, v.y, 24);
      this.fx.text(v.x, v.y - v.r - 30 * this.k, '✨ ' + v.name, '#ffe066');
      SA.ui.hint(v.fact, 0);
      this.metT = 5.5;
    }

    update(dt) {
      this.t += dt;
      this.fx.update(dt);
      const k = this.k;
      for (const p of this.pods) { p.flash = Math.max(0, p.flash - dt * 2); p.bad = Math.max(0, p.bad - dt * 2.5); }
      for (const f of this.flyers) f.t += dt * 2.6;
      this.flyers = this.flyers.filter(f => f.t < 1);
      for (const fr of this.far) { fr.x -= (fr.sp / SA.W) * dt; if (fr.x < -0.02) fr.x += 1.04; }

      // Keep up to three rocks floating while there are rocks left to sort.
      if (this.phase === 'play') {
        this.spawnWait -= dt;
        const loose = this.rocks.length;
        if (this.queue.length && loose < 3 && this.spawnWait <= 0) {
          this.spawnRock();
          this.settleHomes();
          this.spawnWait = 0.7;
        }
      }

      for (const r of this.rocks) {
        r.rot += r.spin * dt;
        r.pop = Math.max(0, r.pop - dt * 3);
        if (this.drag && this.drag.r === r) {
          // Pulled along by the tractor beam, a little behind the finger.
          const tx = this.drag.tx + this.drag.ox * 0.5, ty = this.drag.ty + this.drag.oy * 0.5;
          r.x += (tx - r.x) * Math.min(1, dt * 16);
          r.y += (ty - r.y) * Math.min(1, dt * 16);
          r.vx = r.vy = 0;
          continue;
        }
        r.back = Math.max(0, r.back - dt * 1.5);
        // Zero-gravity drift: a soft spring toward its home spot, plus a slow wander.
        const hx = r.hx + Math.sin(this.t * 0.5 + r.ph) * 18 * k, hy = r.hy + Math.cos(this.t * 0.6 + r.ph) * 14 * k;
        r.vx += (hx - r.x) * 2.2 * dt;
        r.vy += (hy - r.y) * 2.2 * dt;
        r.vx *= Math.pow(0.25, dt);
        r.vy *= Math.pow(0.25, dt);
        r.x += r.vx * dt;
        r.y += r.vy * dt;
      }

      const v = this.visitor;
      if (v) {
        v.t += dt;
        v.rot += dt * 0.15;
        if (v.state === 'in') {
          v.x += (v.tx - v.x) * Math.min(1, dt * 1.6);
          if (Math.abs(v.tx - v.x) < 4) v.state = 'wait';
        } else if (v.state === 'met') {
          this.metT -= dt;
          if (this.metT <= 0) {
            v.x += 380 * k * dt * Math.min(1, -this.metT);
            if (v.x > SA.W + v.r * 2) this.endVisit();
          }
        }
      }
    }

    endVisit() {
      this.visitor = null;
      if (this.vi >= VISITORS.length) { this.finish(); return; }
      this.phase = 'play';
      SA.ui.hint('Let\'s sort more rocks! 🪨', 3);
    }

    async finish() {
      this.phase = 'done';
      SA.audio.play('cheer');
      SA.celebrate(120);
      const stars = this.wrongs <= 2 ? 3 : this.wrongs <= 5 ? 2 : 1;
      await SA.ui.banner('Mission Complete!', '🪨 12 rocks sorted · ✨ 4 famous asteroids', 'gold', stars);
      if (SA.scene !== this) return;
      await SA.ui.say([
        'You sorted all 12 space rocks! 🎉 The scientists say thank you!',
        'Out here the rocks are very far apart, so spaceships can fly right through the belt safely. 🚀',
      ]);
      SA.finishPlanet('belt', stars);
    }

    // ---------- Drawing ----------
    draw(ctx) {
      const W = SA.W, H = SA.H, t = this.t, k = this.k;
      SA.spaceBg(ctx, '#07091f', '#1a1238');
      // The far-off Sun glows from the left, Jupiter waits on the right.
      const sun = ctx.createRadialGradient(-W * 0.05, H * 0.5, 10, -W * 0.05, H * 0.5, W * 0.55);
      sun.addColorStop(0, 'rgba(255,220,140,0.35)');
      sun.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = sun;
      ctx.fillRect(0, 0, W, H);
      this.stars.draw(ctx, t, t * 4);
      SA.drawBody(ctx, 'jupiter', W * 0.62, H * 1.02, H * 0.32, { t, lx: -1, ly: -0.2, dark: 0.3 });
      SA.drawBody(ctx, 'mars', W * 0.26, H * 0.09, 16 * k, { t, lx: -1, ly: 0.3 });
      ctx.globalAlpha = 0.55;
      for (const fr of this.far) SA.drawRock(ctx, fr.x * W, fr.y * H * 0.9, fr.r * k, { seed: fr.seed, kind: fr.kind, rot: t * 0.2 + fr.seed });
      ctx.globalAlpha = 1;

      this.drawShip(ctx, t);
      for (const p of this.pods) this.drawPod(ctx, p, t);

      // Tractor beam from the rocket to the rock being dragged.
      if (this.drag) {
        const r = this.drag.r, s = this.ship;
        const ang = Math.atan2(r.y - s.y, r.x - s.x), px = -Math.sin(ang), py = Math.cos(ang);
        const g = ctx.createLinearGradient(s.x, s.y, r.x, r.y);
        g.addColorStop(0, 'rgba(140,255,220,0.5)');
        g.addColorStop(1, 'rgba(140,255,220,0.15)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(s.x + px * 6, s.y + py * 6);
        ctx.lineTo(r.x + px * r.r, r.y + py * r.r);
        ctx.lineTo(r.x - px * r.r, r.y - py * r.r);
        ctx.lineTo(s.x - px * 6, s.y - py * 6);
        ctx.closePath();
        ctx.fill();
      }

      // While a famous asteroid visits, the little rocks fade back behind it.
      if (this.visitor) ctx.globalAlpha = 0.4;
      for (const r of this.rocks) {
        const held = this.drag && this.drag.r === r;
        const sc = 1 + Math.sin(r.pop * Math.PI) * 0.15 + (held ? 0.08 : 0);
        if (held || (SA.easy() && this.phase === 'play')) {
          ctx.strokeStyle = held ? 'rgba(140,255,220,0.8)' : 'rgba(255,255,255,0.25)';
          ctx.lineWidth = 3;
          SA.circle(ctx, r.x, r.y, r.r * sc + 10 * k);
          ctx.stroke();
        }
        SA.drawRock(ctx, r.x, r.y, r.r * sc, { seed: r.seed, kind: r.kind, rot: r.rot });
      }
      ctx.globalAlpha = 1;
      if (this.visitor) this.drawVisitor(ctx, this.visitor, t);

      // Sorted rocks zipping into their pod.
      for (const f of this.flyers) {
        const e = SA.easeInOut(f.t), to = this.slotPos(f.p, f.slot);
        SA.drawRock(ctx, SA.lerp(f.x0, to.x, e), SA.lerp(f.y0, to.y, e) - Math.sin(e * Math.PI) * 40, SA.lerp(f.r, 11 * k, e), { seed: f.seed, kind: f.kind });
      }

      // A helping hand before the first rock is sorted.
      if (this.phase === 'play' && !this.drag && this.sorted === 0 && this.rocks.length) {
        const r = this.rocks[0], p = this.pod(r.kind);
        const u = (t * 0.6) % 1, e = SA.easeInOut(Math.min(1, u * 1.4));
        ctx.globalAlpha = Math.sin(u * Math.PI);
        SA.emoji(ctx, '👆', SA.lerp(r.x, p.x - p.w * 0.25, e) + 14, SA.lerp(r.y, p.y, e) + 26, 34 * k);
        ctx.globalAlpha = 1;
      }
      this.fx.draw(ctx);
    }

    slotPos(p, i) {
      return { x: p.x - p.w * 0.12 + i * p.w * 0.14, y: p.y + p.h * 0.18 };
    }

    drawShip(ctx, t) {
      const s = this.ship;
      SA.drawRocket(ctx, s.x, s.y + Math.sin(t * 1.8) * 5, 0.55 * this.k * 1.3, 1.9, { t, flame: 0.2 });
    }

    drawPod(ctx, p, t) {
      const k = this.k, x = p.x - p.w / 2, y = p.y - p.h / 2;
      const dragKind = this.drag && this.drag.r.kind;
      const glow = (SA.easy() && dragKind === p.kind) ? 0.5 + 0.5 * Math.sin(t * 8) : 0;
      ctx.save();
      if (p.bad) ctx.translate(Math.sin(p.bad * 30) * 6 * p.bad, 0);
      // Glass capsule with a coloured rim.
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      SA.rrect(ctx, x, y + 5, p.w, p.h, 26 * k); ctx.fill();
      const g = ctx.createLinearGradient(0, y, 0, y + p.h);
      g.addColorStop(0, 'rgba(60,54,130,0.92)');
      g.addColorStop(1, 'rgba(24,20,70,0.92)');
      ctx.fillStyle = g;
      SA.rrect(ctx, x, y, p.w, p.h, 26 * k); ctx.fill();
      ctx.lineWidth = 4 + glow * 4;
      ctx.strokeStyle = p.bad ? '#ff9b7a' : p.flash ? '#ffffff' : glow ? SA.rgba('#ffe066', 0.6 + glow * 0.4) : p.color;
      ctx.stroke();
      if (p.flash) {
        ctx.fillStyle = SA.rgba('#ffffff', p.flash * 0.25);
        SA.rrect(ctx, x, y, p.w, p.h, 26 * k); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      SA.rrect(ctx, x + 8 * k, y + 6 * k, p.w - 16 * k, p.h * 0.28, 14 * k); ctx.fill();
      // Sample rock and name.
      // A big sample rock, so children who can't read the name yet can match by look.
      SA.drawRock(ctx, x + 36 * k, p.y - p.h * 0.14, 25 * k, { seed: 5, kind: p.kind, rot: t * 0.3 });
      SA.label(ctx, p.name, x + 68 * k, p.y - p.h * 0.16, 24 * k, '#fff', { align: 'left' });
      // Four slots that fill up.
      for (let i = 0; i < PER_POD; i++) {
        const sp = this.slotPos(p, i);
        const filled = i < p.n && !this.flyers.some(f => f.p === p && f.slot === i);
        if (filled) SA.drawRock(ctx, sp.x, sp.y, 11 * k, { seed: 40 + i, kind: p.kind });
        else {
          ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          ctx.lineWidth = 2;
          SA.circle(ctx, sp.x, sp.y, 10 * k); ctx.stroke();
        }
      }
      if (p.n >= PER_POD) SA.label(ctx, '✓', x + p.w - 22 * k, y + 22 * k, 22 * k, '#7ee08a');
      ctx.restore();
    }

    drawVisitor(ctx, v, t) {
      const k = this.k;
      const glow = ctx.createRadialGradient(v.x, v.y, v.r * 0.6, v.x, v.y, v.r * 1.6);
      glow.addColorStop(0, 'rgba(255,240,180,0.25)');
      glow.addColorStop(1, 'rgba(255,240,180,0)');
      ctx.fillStyle = glow;
      SA.circle(ctx, v.x, v.y, v.r * 1.6); ctx.fill();
      if (v.long) {
        // Ida is long like a potato, with little Dactyl circling it.
        const a = t * 0.9, mx = v.x + Math.cos(a) * v.r * 1.5, my = v.y + Math.sin(a) * v.r * 0.45;
        const moon = () => SA.drawRock(ctx, mx, my, v.r * 0.14, { seed: 9, kind: 'stony', lumps: 0.1 });
        if (Math.sin(a) < 0) moon();
        ctx.save();
        ctx.translate(v.x, v.y);
        ctx.scale(1.55, 0.75);
        SA.drawRock(ctx, 0, 0, v.r, { seed: 21, kind: v.kind, lumps: v.lumps, rot: v.rot });
        ctx.restore();
        if (Math.sin(a) >= 0) moon();
      } else {
        SA.drawRock(ctx, v.x, v.y, v.r, { seed: v.id.length * 13, kind: v.kind, lumps: v.lumps, rot: v.rot });
      }
      SA.pill(ctx, v.name, v.x, v.y + v.r * (v.long ? 0.9 : 1) + 30 * k, 20 * k, { color: '#fff6c8', edge: 'rgba(255,224,102,0.9)' });
      if (v.state === 'wait') {
        const pulse = (t * 0.9) % 1;
        ctx.strokeStyle = 'rgba(255,224,102,' + (1 - pulse) + ')';
        ctx.lineWidth = 4;
        SA.circle(ctx, v.x, v.y, v.r * (v.long ? 1.5 : 1) + 12 * k + pulse * 30 * k); ctx.stroke();
        const hop = Math.abs(Math.sin(t * 3)) * 10 * k;
        SA.emoji(ctx, '👆', v.x + v.r * 0.7, v.y + v.r * 0.6 + hop, 38 * k);
      }
    }
  }
  SA.BeltScene = BeltScene;
})(window.SA);
