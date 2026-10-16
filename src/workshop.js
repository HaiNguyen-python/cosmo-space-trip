// Rocket Workshop (from the 🔧 button or the launch pad at Cosmo's Space Base). Pick a nose, a
// fuel tank, engines and fins, then launch. The parts really change the flight: more engines push
// harder, a bigger tank burns longer but is heavier, a pointy nose slips through the air and fins
// keep the rocket steady. Every launch is a success: the rocket reaches the treetops, the clouds,
// the jets, space, orbit or even the Moon, and Cosmo suggests one thing to try next.
(function (SA) {
  const TAU = Math.PI * 2;
  const $ = id => document.getElementById(id);
  const PARTS = [
    { key: 'n', name: 'Nose', opts: [['Flat', 'A flat nose: the air pushes back hard!'], ['Round', 'A round nose: nice and smooth.'], ['Pointy', 'A pointy nose: it slices through the air!']] },
    { key: 't', name: 'Fuel', opts: [['Small', 'A small fuel tank: light, but not much fuel.'], ['Medium', 'A medium fuel tank: more fuel, a bit heavier.'], ['Big', 'A big fuel tank: lots of fuel, but heavy!']] },
    { key: 'e', name: 'Engines', opts: [['1', 'One engine: a little push.'], ['2', 'Two engines: a bigger push!'], ['3', 'Three engines: a giant push! They burn fuel fast.']] },
    { key: 'f', name: 'Fins', opts: [['None', 'No fins: whoa, wobbly!'], ['Small', 'Small fins: a bit steadier.'], ['Big', 'Big fins: nice and steady!']] },
  ];
  // [emoji (for text), place, what Cosmo says, drawn icon (for the canvas: SA.icon)]
  const LEVELS = [
    ['🚀', 'the launch pad', '', 'rocket'],
    ['🌳', 'the treetops', 'Your rocket flew higher than the trees! 🌳', 'tree'],
    ['☁️', 'the clouds', 'Your rocket flew up into the clouds! ☁️', 'cloud'],
    ['✈️', 'the jet planes', 'Your rocket flew higher than the jet planes! ✈️', 'plane'],
    ['🌌', 'SPACE', 'You reached SPACE! 🌌 Space starts about 100 kilometres above the ground.', 'space'],
    ['🛰️', 'ORBIT', 'You reached ORBIT! 🛰️ To stay up there, a rocket has to zoom sideways super fast, around and around Earth.', 'satellite'],
    ['🌙', 'the MOON', 'You flew all the way to the MOON! 🌙 That takes a giant rocket, just like the real Moon rockets!', 'moon'],
  ];
  // Peak heights (in the simulation's units) that reach each level.
  // Tuned so every rocket that lifts off reaches the treetops, and only the very best builds
  // (pointy nose, big tank, 3 engines, fins) reach the Moon without Little Explorer mode.
  const TH = [0, 60, 140, 200, 300, 400, 500];

  // A simple 1-D flight: thrust against weight and air drag. Heavier tanks carry more fuel; air
  // thins out higher up; without fins the rocket wobbles and wastes some of its push.
  function simulate(b, easy) {
    const drag = [1.8, 1.0, 0.5][b.n] + [0, 0.05, 0.12][b.f];
    const wobble = [1, 0.35, 0.08][b.f];
    const fuel0 = [3, 6, 10][b.t], dry = [0.4, 0.7, 1.0][b.t];
    const E = b.e + 1, T = 75 * (easy ? 1.12 : 1), g = 10;
    const mass = f => 1.5 + dry + E * 0.6 + f;
    if (E * T <= mass(fuel0) * g) return { fizzle: true, h: 0, level: 0, burnFrac: 0, wobble };
    let fuel = fuel0, h = 0, v = 0, t = 0, burnT = 0;
    const dt = 0.01;
    while (t < 300) {
      const m = mass(fuel);
      const thrust = fuel > 0 ? E * T * (1 - wobble * 0.15) : 0;
      const air = Math.exp(-h / 600);
      const a = (thrust - drag * 0.015 * v * Math.abs(v) * air) / m - g;
      v += a * dt; h += v * dt; t += dt;
      if (fuel > 0) { fuel = Math.max(0, fuel - E * 0.5 * dt); burnT = t; }
      if (v < 0 && fuel <= 0) break;
    }
    let level = 0;
    for (let i = 1; i < TH.length; i++) if (h >= TH[i]) level = i;
    return { fizzle: false, h, level, burnFrac: SA.clamp(burnT / t, 0.15, 1), wobble };
  }
  SA.rocketSim = simulate;   // also handy for checking the balance

  // Height in "levels" (0 ground ... 6 Moon), smooth between the thresholds.
  function levelOf(h) {
    for (let i = 0; i < TH.length - 1; i++) if (h < TH[i + 1]) return i + (h - TH[i]) / (TH[i + 1] - TH[i]);
    return TH.length - 1;
  }

  class WorkshopScene {
    constructor() {
      this.fx = new SA.Particles();
      this.stars = new SA.Starfield(160, 919);
      this.t = 0;
      const rnd = SA.seeded(321);
      this.clouds = [];
      for (let i = 0; i < 9; i++) this.clouds.push({ x: rnd(), L: 1.55 + rnd() * 0.9, s: 0.7 + rnd() * 0.8 });
    }

    layout() {
      const W = SA.W, H = SA.H;
      this.k = 1;   // logical units: phones (600 tall) already draw everything bigger
      this.groundY = H * 0.87;
      this.rocketX = W * 0.66;
      const top = H < 720 ? 104 : 92;
      const pw = Math.min(W * 0.48, 560 * this.k);
      // On phones Cosmo's speech bubble is taller, so the parts stop a little higher.
      this.pick = { x: 18, y: top, w: pw, h: H * (H < 720 ? 0.68 : 0.72) - top };
      this.launchBtn = { x: this.rocketX + Math.min(W * 0.2, 230 * this.k), y: this.groundY - 64 * this.k, r: 58 * this.k };
      this.resultBtns = null;
    }
    resize() { this.layout(); }

    enter() {
      SA.ui.setScene('toy');
      SA.audio.music('workshop');
      this.layout();
      this.build = Object.assign({ n: 1, t: 1, e: 1, f: 1 }, SA.state.rocketBuild || {});
      this.phase = 'build';
      this.pops = {};
      this.fl = null;
      this.shake = 0;
      $('btnToyBack').textContent = '🏠 Base';
      $('toyPick').innerHTML = '';
      this.updateInfo();
      if (!SA.state.workshopSeen) {
        SA.ui.say([
          'Welcome to my Rocket Workshop! 🔧 Let\'s build a rocket and launch it from Earth!',
          'Tap the parts on the left to change your rocket. Every part changes how it flies!',
          'When it looks good, press the big red LAUNCH button! 🚀 Can you get all the way to the Moon? 🌙',
        ]).then(() => { SA.state.workshopSeen = true; SA.save(); });
      } else SA.ui.hint('Build a rocket, then press LAUNCH! 🚀', 5);
    }

    exit() { SA.ui.hideTalk(); }
    back() { SA.go(SA.base, {}); }

    updateInfo() {
      const b = SA.state.rocketBest;
      SA.ui.setInfo(b ? 'Best: ' + LEVELS[b][0] + ' ' + LEVELS[b][1].replace(/^the /, '') : '🏆 Best: none yet');
    }

    // ---------- Building ----------
    tileRect(row, i) {
      const p = this.pick, rh = p.h / PARTS.length, lw = 112 * this.k;
      const tw = (p.w - lw - 16) / 3;
      return { x: p.x + lw + i * tw, y: p.y + row * rh + 6, w: tw - 8, h: rh - 12 };
    }

    onDown(x, y) {
      if (this.phase === 'build') {
        for (let row = 0; row < PARTS.length; row++) {
          for (let i = 0; i < 3; i++) {
            const r = this.tileRect(row, i);
            if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) { this.choose(row, i); return; }
          }
        }
        const lb = this.launchBtn;
        if (Math.hypot(x - lb.x, y - lb.y) < lb.r + 16) { this.launch(); return; }
        // Tapping the rocket itself makes it give a little hop.
        if (Math.abs(x - this.rocketX) < 70 * this.k && y < this.groundY && y > this.groundY - 320 * this.k) {
          this.hop = 1;
          SA.audio.play('boing');
        }
      } else if (this.phase === 'result' && this.resultBtns) {
        for (const b of this.resultBtns) {
          if (Math.abs(x - b.x) < b.w / 2 && Math.abs(y - b.y) < b.h / 2 + 6) { b.go(); return; }
        }
      } else if (this.phase === 'fly' && this.fl && this.fl.t > 1 && this.fl.stage === 'up') {
        // Tap to hurry the flight along.
        this.fl.fast = true;
      }
    }
    onMove() {}
    onUp() {}

    choose(row, i) {
      const P = PARTS[row];
      if (this.build[P.key] === i) { SA.audio.play('click'); this.pops[P.key] = 1; return; }
      this.build[P.key] = i;
      this.pops[P.key] = 1;
      SA.audio.play('pop');
      this.fx.spawn('sparkle', this.rocketX, this.partY(P.key), 8, { color: '#ffe066' });
      SA.ui.hint(P.opts[i][1], 3);
    }

    // Rocket geometry for the current build (in logical units, bottom of the engines at y = 0).
    dims() {
      const b = this.build, s = 1.12 * this.k;
      const tankH = [62, 98, 140][b.t] * s, noseH = [18, 34, 60][b.n] * s;
      return { s, w: 64 * s, nozH: 20 * s, tankH, capH: 46 * s, noseH, total: 20 * s + tankH + 46 * s + noseH };
    }
    partY(key) {
      const d = this.dims(), g = this.groundY;
      if (key === 'e') return g - d.nozH / 2;
      if (key === 'f') return g - d.nozH - d.tankH * 0.2;
      if (key === 't') return g - d.nozH - d.tankH / 2;
      return g - d.nozH - d.tankH - d.capH - d.noseH / 2;
    }

    // ---------- Launch ----------
    launch() {
      SA.state.rocketBuild = Object.assign({}, this.build);
      SA.save();
      const sim = simulate(this.build, SA.easy());
      this.phase = 'count';
      this.count = 0;
      this.sim = sim;
      SA.ui.hideTalk();
      SA.audio.play('click');
    }

    startFlight() {
      const sim = this.sim;
      this.phase = 'fly';
      if (sim.fizzle) {
        this.fl = { stage: 'fizzle', t: 0, L: 0, maxL: 0, sway: 0, ang: 0 };
        SA.audio.play('fizzle');
        return;
      }
      const maxL = Math.min(levelOf(sim.h), 6);
      SA.audio.play('rumble');
      SA.audio.play('launch');
      this.fl = { stage: 'up', t: 0, L: 0, maxL, upTo: Math.min(maxL, 5), dur: 2.6 + Math.min(maxL, 5) * 0.75, sway: 0, ang: 0, fast: false };
      if (!SA.calm()) this.shake = 0.5;
    }

    update(dt) {
      this.t += dt;
      this.fx.update(dt);
      for (const k in this.pops) this.pops[k] = Math.max(0, this.pops[k] - dt * 3);
      this.hop = Math.max(0, (this.hop || 0) - dt * 2);
      this.shake = Math.max(0, this.shake - dt);
      if (this.phase === 'count') {
        const before = this.count;
        this.count += dt;
        for (const m of [0.05, 0.75, 1.45]) if (before < m && this.count >= m) SA.audio.play('blip');
        if (this.count >= 2.1) this.startFlight();
        if (Math.random() < dt * 12) this.smoke(0.4);
        return;
      }
      const f = this.fl;
      if (this.phase !== 'fly' || !f) return;
      f.t += dt * (f.fast ? 2.2 : 1);
      const d = this.dims();
      if (f.stage === 'fizzle') {
        if (Math.random() < dt * 25) this.smoke(1);
        if (f.t > 2.2) this.finish();
        return;
      }
      if (f.stage === 'up') {
        const u = SA.clamp(f.t / f.dur, 0, 1);
        // Slow off the pad, fast through the middle, easing out at the top.
        f.L = f.upTo * (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
        f.burning = u < this.sim.burnFrac || f.upTo >= 5;
        f.sway = Math.sin(this.t * 7) * this.sim.wobble * 0.32 * Math.min(1, u * 4);
        if (f.burning && Math.random() < dt * 30) this.flameFx(d);
        if (u >= 1) {
          if (f.maxL >= 5) { f.stage = 'orbit'; f.t = 0; SA.audio.play('whoosh'); }
          else if (f.maxL >= 4) { f.stage = 'float'; f.t = 0; }
          else { f.stage = 'chute'; f.t = 0; f.top = f.L; SA.audio.play('pop'); }
        }
      } else if (f.stage === 'chute') {
        const u = SA.clamp((f.t - 0.6) / 2.6, 0, 1);
        f.L = f.top * (1 - SA.easeInOut(u));
        f.sway = Math.sin(this.t * 2.2) * 0.12;
        if (u >= 1) { SA.audio.play('land'); this.smoke(0.6); this.finish(); }
      } else if (f.stage === 'float') {
        f.sway = Math.sin(this.t * 1.5) * 0.08;
        if (f.t > 1.4) this.finish();
      } else if (f.stage === 'orbit') {
        f.ang = SA.lerp(f.ang, Math.PI / 2, Math.min(1, dt * 2.5));
        if (f.t > 2.8) {
          if (f.maxL >= 6) { f.stage = 'moon'; f.t = 0; SA.audio.play('whoosh'); }
          else this.finish();
        }
      } else if (f.stage === 'moon') {
        f.ang = SA.lerp(f.ang, 0, Math.min(1, dt * 2));
        if (f.t > 3.4 && !f.landed) {
          f.landed = true;
          SA.audio.play('land');
          setTimeout(() => SA.audio.play('cheer'), 200);
          this.fx.spawn('sparkle', SA.W * 0.5, SA.H * 0.62, 26, { color: '#fff3a0' });
        }
        if (f.t > 4.6) this.finish();
      }
    }

    smoke(n) {
      const g = this.groundY;
      for (let i = 0; i < 2; i++) {
        this.fx.list.push({ kind: 'dot', x: this.rocketX + SA.rand(-60, 60) * this.k, y: g - SA.rand(0, 20), vx: SA.rand(-90, 90), vy: SA.rand(-40, -10), life: 0, max: SA.rand(0.8, 1.5) * n + 0.3, size: SA.rand(10, 20) * this.k, rot: 0, color: 'rgba(235,235,245,0.55)' });
      }
    }
    flameFx(d) {
      const p = this.rocketScreen();
      this.fx.list.push({ kind: 'dot', x: p.x + SA.rand(-12, 12), y: p.y + 6, vx: SA.rand(-40, 40), vy: SA.rand(160, 260), life: 0, max: SA.rand(0.3, 0.6), size: SA.rand(5, 10) * this.k, rot: 0, color: 'rgba(255,190,110,0.6)' });
    }

    finish() {
      const f = this.fl, sim = this.sim;
      this.phase = 'result';
      const level = sim.fizzle ? 0 : sim.level;
      const record = level > SA.state.rocketBest;
      const moonFirst = level >= 6 && SA.state.rocketBest < 6;
      if (record) { SA.state.rocketBest = level; SA.save(); this.updateInfo(); SA.ui.bumpInfo(); }
      if (moonFirst) { SA.state.baseNew = true; SA.save(); }
      this.result = { level, record, moonFirst };
      if (level >= 6) SA.celebrate(120);
      else if (level >= 4) { SA.celebrate(60); SA.audio.play('cheer'); }
      else if (level > 0) SA.audio.play('collect');
      else SA.audio.play('giggle');
      const lines = [];
      if (sim.fizzle) lines.push('Pfffft! 😄 The rocket was too heavy to lift off. Try more engines, or a smaller fuel tank!');
      else lines.push(LEVELS[level][2] + ' ' + this.tip(level));
      if (moonFirst) lines.push('You unlocked the 🚀 Moon rocket sticker for my Space Base!');
      // The first rocket built becomes Cosmo's rocket everywhere (the Wardrobe can switch back).
      if (!SA.state.rocketShape) {
        SA.state.rocketShape = 'mine';
        SA.save();
        lines.push('And guess what? From now on, I\'ll fly YOUR rocket everywhere we go! 🚀');
      }
      SA.ui.hint(lines.join(' '), 0);
      if (f) f.done = true;
    }

    // One thing to try next, from the part holding the rocket back the most.
    tip(level) {
      const b = this.build;
      if (level >= 6) return 'You\'re a real rocket scientist! 🏆';
      if (b.f === 0) return 'Tip: fins keep a rocket flying straight. Try adding fins!';
      if (b.n === 0) return 'Tip: a pointy nose slips through the air more easily. Try a pointy nose!';
      if (b.e === 0) return 'Tip: more engines give a bigger push. Try 2 or 3 engines!';
      if (b.t === 0) return 'Tip: your rocket ran out of fuel fast. Try a bigger fuel tank!';
      if (b.n === 1) return 'Tip: try a pointy nose to cut through the air!';
      if (b.e === 1 || b.t === 1) return 'Tip: to fly really high, try 3 engines with the big fuel tank!';
      return 'So close! Try big fins to keep it super steady!';
    }

    // ---------- Drawing ----------
    rocketScreen() {
      const f = this.fl, H = SA.H;
      const L = f ? f.L : 0;
      const Y = this.worldY(L);
      const cam = this.camY(L);
      const lift = this.hop ? Math.sin(this.hop * Math.PI) * 18 * this.k : 0;
      return { x: this.rocketX + (f ? f.sway * 60 * this.k : 0), y: this.groundY - (Y - cam) - lift, H };
    }
    // World height of a level, in screen units: the treetops are close, the rest a screen apart.
    worldY(L) { const H = SA.H; return L <= 1 ? L * H * 0.42 : H * 0.42 + (L - 1) * H * 0.9; }
    camY(L) { return Math.max(0, this.worldY(L) - (this.groundY - SA.H * 0.52)); }

    draw(ctx) {
      const W = SA.W, H = SA.H, t = this.t, f = this.fl;
      const flying = this.phase === 'fly' || (this.phase === 'result' && f && !this.sim.fizzle);
      const L = flying && f ? f.L : 0;
      const cam = this.camY(L);
      ctx.save();
      if (this.shake > 0) ctx.translate(SA.rand(-4, 4) * this.shake, SA.rand(-4, 4) * this.shake);
      const stage = f && flying ? f.stage : 'pad';
      if (stage === 'orbit' || (stage === 'moon' && f.t < 0.9)) this.drawOrbit(ctx, t, f);
      else if (stage === 'moon') this.drawMoonTrip(ctx, t, f);
      else this.drawSky(ctx, t, L, cam);
      if (stage !== 'orbit' && stage !== 'moon') this.drawFlyingRocket(ctx, t);
      this.fx.draw(ctx);
      ctx.restore();
      if (this.phase === 'build') { this.drawPicker(ctx, t); this.drawLaunchBtn(ctx, t); }
      if (this.phase === 'count') {
        const n = 3 - Math.floor(this.count / 0.7);
        const u = (this.count % 0.7) / 0.7;
        ctx.save();
        ctx.translate(W * 0.36, H * 0.42);
        ctx.scale(1.4 - u * 0.4, 1.4 - u * 0.4);
        ctx.globalAlpha = 1 - u * 0.6;
        SA.label(ctx, n > 0 ? String(n) : 'Liftoff!', 0, 0, n > 0 ? 120 : 80, '#ffe066', { strokeW: 12 });
        ctx.restore();
      }
      if (flying || this.phase === 'fly') this.drawMeter(ctx, t, f && f.stage === 'moon' ? 5 + SA.clamp((f.t - 0.9) / 2.5, 0, 1) : L);
      if (this.phase === 'result') this.drawResult(ctx, t);
    }

    drawSky(ctx, t, L, cam) {
      const W = SA.W, H = SA.H, g = this.groundY;
      // Blue sky darkens to the black of space as the camera climbs.
      const mix = (a, b, u) => { const p = n => parseInt(a.slice(n, n + 2), 16), q = n => parseInt(b.slice(n, n + 2), 16); return 'rgb(' + [1, 3, 5].map(n => Math.round(SA.lerp(p(n), q(n), u))).join(',') + ')'; };
      const stops = [['#6fb8f5', '#cdeaff'], ['#4b97e6', '#9fd2fa'], ['#2a62b8', '#5f9de0'], ['#13245e', '#2a4a96'], ['#050818', '#0e1a44'], ['#02030c', '#05081c']];
      const i = SA.clamp(Math.floor(L * 0.85), 0, stops.length - 2), u = SA.clamp(L * 0.85 - i, 0, 1);
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, mix(stops[i][0], stops[i + 1][0], u));
      sky.addColorStop(1, mix(stops[i][1], stops[i + 1][1], u));
      ctx.fillStyle = sky;
      ctx.fillRect(-10, -10, W + 20, H + 20);
      const starA = SA.clamp(L - 2.6, 0, 1);
      if (starA > 0) { ctx.globalAlpha = starA; this.stars.draw(ctx, t, 0); ctx.globalAlpha = 1; }
      const sy = Y => g - (Y - cam);   // world height -> screen y
      // Clouds, birds, a jet, the edge of space, and a satellite.
      for (const c of this.clouds) {
        const y = sy(this.worldY(c.L));
        if (y < -80 || y > H + 80) continue;
        const x = ((c.x * W * 1.2 + t * 12 * c.s) % (W * 1.2)) - W * 0.1;
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        for (const [dx, dy, r] of [[-40, 6, 30], [0, -8, 40], [44, 6, 30], [0, 12, 30]]) { SA.circle(ctx, x + dx * c.s * this.k, y + dy * c.s * this.k, r * c.s * this.k); ctx.fill(); }
      }
      const by = sy(this.worldY(1.35));
      if (by > -40 && by < H + 40) {
        // A few birds flapping past.
        ctx.strokeStyle = '#2b3a5c';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        for (let i = 0; i < 4; i++) {
          const bx = ((t * 50 + i * 60) % (W + 200)) - 100, byy = by + (i % 2) * 22 + Math.sin(t * 2 + i) * 6, fl = Math.sin(t * 9 + i * 2) * 7 * this.k, s = 11 * this.k;
          ctx.beginPath(); ctx.moveTo(bx - s, byy - fl); ctx.quadraticCurveTo(bx - s * 0.4, byy - 4, bx, byy); ctx.quadraticCurveTo(bx + s * 0.4, byy - 4, bx + s, byy - fl); ctx.stroke();
        }
      }
      const jy = sy(this.worldY(3));
      if (jy > -40 && jy < H + 40) {
        ctx.save(); ctx.translate(W - ((t * 140) % (W + 300)) + 150, jy); ctx.scale(-1, 1);
        SA.icon(ctx, 'plane', 0, 0, 64 * this.k); ctx.restore();
      }
      const ly = sy(this.worldY(4));
      if (ly > -20 && ly < H + 20) {
        ctx.strokeStyle = 'rgba(160,200,255,0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(W, ly); ctx.stroke();
        ctx.setLineDash([]);
        const txt = 'Space starts here! (about 100 km up)';
        SA.label(ctx, txt, W * 0.3 + 16, ly - 18, 18, '#cfe0ff');
        SA.icon(ctx, 'space', W * 0.3 + 16 - ctx.measureText(txt).width / 2 - 20, ly - 18, 28);
      }
      const sty = sy(this.worldY(4.6));
      if (sty > -40 && sty < H + 40) SA.icon(ctx, 'satellite', W * 0.85 - Math.sin(t * 0.3) * 40, sty, 56 * this.k);
      // The launch site: hills, grass, trees and the tower.
      const gy = sy(0);
      if (gy < H + 200) {
        ctx.fillStyle = '#7fbf6a';
        ctx.beginPath(); ctx.moveTo(0, gy - 40 * this.k); ctx.quadraticCurveTo(W * 0.25, gy - 120 * this.k, W * 0.5, gy - 50 * this.k);
        ctx.quadraticCurveTo(W * 0.75, gy - 110 * this.k, W, gy - 30 * this.k); ctx.lineTo(W, H + 300); ctx.lineTo(0, H + 300); ctx.fill();
        ctx.fillStyle = '#5aa64e';
        ctx.fillRect(0, gy, W, H + 300);
        for (const [tx, s] of [[0.06, 1], [0.13, 0.8], [0.9, 1.1], [0.96, 0.85], [0.47, 0.7]]) this.drawTree(ctx, W * tx, gy, s);
        this.drawTower(ctx, gy);
        // Launch pad.
        ctx.fillStyle = '#8a91a8';
        SA.rrect(ctx, this.rocketX - 80 * this.k, gy - 6, 160 * this.k, 14 * this.k, 4); ctx.fill();
      }
    }

    drawTree(ctx, x, gy, s) {
      const k = this.k * s;
      const h = SA.H * 0.42 * s;   // the treetops are level 1
      ctx.fillStyle = '#7a5532';
      ctx.fillRect(x - 8 * k, gy - h * 0.45, 16 * k, h * 0.45);
      ctx.fillStyle = '#3f9e48';
      for (const [dy, r] of [[0.55, 46], [0.75, 40], [0.92, 30]]) { SA.circle(ctx, x, gy - h * dy, r * k); ctx.fill(); }
    }

    drawTower(ctx, gy) {
      const k = this.k, x = this.rocketX - 92 * k, h = 330 * k;
      ctx.strokeStyle = '#d0473c';
      ctx.lineWidth = 4 * k;
      ctx.beginPath();
      ctx.moveTo(x - 16 * k, gy); ctx.lineTo(x - 16 * k, gy - h);
      ctx.moveTo(x + 16 * k, gy); ctx.lineTo(x + 16 * k, gy - h);
      for (let y = 0; y < h; y += 30 * k) { ctx.moveTo(x - 16 * k, gy - y); ctx.lineTo(x + 16 * k, gy - y - 30 * k); ctx.moveTo(x + 16 * k, gy - y); ctx.lineTo(x - 16 * k, gy - y - 30 * k); }
      ctx.stroke();
      ctx.fillStyle = '#ffd84d';
      SA.circle(ctx, x, gy - h - 6 * k, 6 * k); ctx.fill();
    }

    drawFlyingRocket(ctx, t) {
      const f = this.fl, p = this.rocketScreen();
      const fizz = f && f.stage === 'fizzle';
      const jiggle = fizz ? Math.sin(t * 40) * 3 : this.phase === 'count' ? Math.sin(t * 50) * 1.2 : 0;
      ctx.save();
      ctx.translate(p.x + jiggle, p.y - (fizz ? Math.abs(Math.sin(f.t * 9)) * 6 * this.k : 0));
      ctx.rotate(f ? f.sway * (f.stage === 'chute' ? 1 : 0.8) : 0);
      if (f && f.stage === 'chute') this.drawChute(ctx, t);
      const burning = f && (f.stage === 'up' && f.burning);
      this.drawRocket(ctx, t, { flame: burning ? 1 : this.phase === 'count' ? 0.3 : fizz ? 0.25 : 0 });
      ctx.restore();
    }

    drawChute(ctx, t) {
      const d = this.dims(), top = -d.total;
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, top); ctx.lineTo(-70 * d.s, top - 90 * d.s);
      ctx.moveTo(0, top); ctx.lineTo(70 * d.s, top - 90 * d.s);
      ctx.moveTo(0, top); ctx.lineTo(0, top - 100 * d.s);
      ctx.stroke();
      const cols = ['#ff6b8b', '#ffffff', '#ff6b8b', '#ffffff'];
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = cols[i];
        ctx.beginPath();
        ctx.moveTo(0, top - 92 * d.s);
        ctx.arc(0, top - 92 * d.s, 80 * d.s, Math.PI + (i * Math.PI) / 4, Math.PI + ((i + 1) * Math.PI) / 4);
        ctx.closePath();
        ctx.fill();
      }
    }

    // The rocket from its parts, standing on y = 0.
    drawRocket(ctx, t, o) {
      const b = this.build, d = this.dims(), s = d.s;
      const pid = SA.state.paint || 'classic';
      const P = SA.PAINTS.find(p => p.id === pid) || SA.PAINTS[0];
      const trim = P.trim, band = P.band === 'rainbow' ? '#ffd84d' : P.band;
      const pop = k => 1 + Math.sin((this.pops[k] || 0) * Math.PI) * 0.15;
      const w = d.w, E = b.e + 1;
      let y = 0;
      // Flames.
      if (o.flame > 0) {
        for (let i = 0; i < E; i++) {
          const nx = (i - (E - 1) / 2) * 22 * s;
          const len = (30 + o.flame * 70 + Math.sin(t * 40 + i) * 8) * s;
          const fg = ctx.createLinearGradient(0, 0, 0, len);
          fg.addColorStop(0, '#fff6c2'); fg.addColorStop(0.4, '#ffb340'); fg.addColorStop(1, 'rgba(255,80,40,0)');
          ctx.fillStyle = fg;
          ctx.beginPath(); ctx.moveTo(nx - 10 * s, 0); ctx.quadraticCurveTo(nx, len * 1.1, nx + 10 * s, 0); ctx.fill();
        }
      }
      // Engines.
      ctx.save();
      ctx.translate(0, -d.nozH / 2); ctx.scale(pop('e'), pop('e')); ctx.translate(0, d.nozH / 2);
      for (let i = 0; i < E; i++) {
        const nx = (i - (E - 1) / 2) * 22 * s;
        ctx.fillStyle = '#6b7493'; ctx.strokeStyle = '#3e4862'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(nx - 7 * s, -d.nozH); ctx.lineTo(nx + 7 * s, -d.nozH); ctx.lineTo(nx + 11 * s, 0); ctx.lineTo(nx - 11 * s, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      ctx.restore();
      y = -d.nozH;
      // Fins (behind the tank's lower part).
      if (b.f > 0) {
        const fh = (b.f === 2 ? 70 : 42) * s, fw = (b.f === 2 ? 34 : 20) * s;
        ctx.save();
        ctx.translate(0, y - fh / 2); ctx.scale(pop('f'), pop('f')); ctx.translate(0, -(y - fh / 2));
        ctx.fillStyle = trim; ctx.strokeStyle = SA.shade(trim, -80); ctx.lineWidth = 2.5;
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(side * w / 2, y - fh); ctx.quadraticCurveTo(side * (w / 2 + fw), y - fh * 0.4, side * (w / 2 + fw), y + 6 * s);
          ctx.lineTo(side * w / 2, y); ctx.closePath(); ctx.fill(); ctx.stroke();
        }
        ctx.restore();
      }
      // Fuel tank.
      const body = (y0, h) => {
        const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
        g.addColorStop(0, '#ffffff'); g.addColorStop(0.7, SA.shade(P.body, -14)); g.addColorStop(1, SA.shade(P.body, -62));
        ctx.fillStyle = g; ctx.strokeStyle = '#4b5578'; ctx.lineWidth = 2.5;
        SA.rrect(ctx, -w / 2, y0 - h, w, h, 6 * s); ctx.fill(); ctx.stroke();
      };
      ctx.save();
      ctx.translate(0, y - d.tankH / 2); ctx.scale(pop('t'), pop('t')); ctx.translate(0, -(y - d.tankH / 2));
      body(y, d.tankH);
      ctx.fillStyle = band;
      ctx.fillRect(-w / 2 + 1, y - d.tankH * 0.5 - 4 * s, w - 2, 8 * s);
      SA.label(ctx, 'FUEL', 0, y - d.tankH * 0.25, 12 * s, SA.shade(trim, -40), { stroke: false, weight: 900 });
      ctx.restore();
      y -= d.tankH;
      // Capsule with Cosmo at the window.
      body(y, d.capH);
      ctx.fillStyle = '#9fb2d9'; SA.circle(ctx, 0, y - d.capH / 2, 15 * s); ctx.fill();
      ctx.fillStyle = '#16204a'; SA.circle(ctx, 0, y - d.capH / 2, 12 * s); ctx.fill();
      ctx.save();
      SA.circle(ctx, 0, y - d.capH / 2, 12 * s); ctx.clip();
      SA.drawCosmo(ctx, 0, y - d.capH / 2 + 6 * s, 0.26 * s, { t, noBob: true, hat: 'none', mood: this.phase === 'fly' ? 'joy' : null });
      ctx.restore();
      y -= d.capH;
      // Nose.
      ctx.save();
      ctx.translate(0, y); ctx.scale(pop('n'), pop('n')); ctx.translate(0, -y);
      ctx.fillStyle = trim; ctx.strokeStyle = SA.shade(trim, -80); ctx.lineWidth = 2.5;
      ctx.beginPath();
      if (b.n === 0) { ctx.moveTo(-w / 2, y); ctx.lineTo(-w * 0.42, y - d.noseH); ctx.lineTo(w * 0.42, y - d.noseH); ctx.lineTo(w / 2, y); }
      else if (b.n === 1) ctx.ellipse(0, y, w / 2, d.noseH, 0, Math.PI, TAU);
      else { ctx.moveTo(-w / 2, y); ctx.quadraticCurveTo(-w * 0.3, y - d.noseH * 0.6, 0, y - d.noseH); ctx.quadraticCurveTo(w * 0.3, y - d.noseH * 0.6, w / 2, y); }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    }

    drawPicker(ctx, t) {
      const p = this.pick, k = this.k, rh = p.h / PARTS.length;
      ctx.fillStyle = 'rgba(16,14,56,0.72)';
      SA.rrect(ctx, p.x - 6, p.y - 6, p.w + 12, p.h + 12, 22); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.stroke();
      PARTS.forEach((P, row) => {
        SA.label(ctx, P.name, p.x + 56 * k, p.y + row * rh + rh / 2, 20 * Math.min(1, k * 1.1), '#fff3c4', { stroke: false });
        for (let i = 0; i < 3; i++) {
          const r = this.tileRect(row, i), on = this.build[P.key] === i;
          ctx.fillStyle = on ? '#ffd84d' : 'rgba(255,255,255,0.92)';
          SA.rrect(ctx, r.x, r.y, r.w, r.h, 14); ctx.fill();
          if (on) { ctx.strokeStyle = '#fff6c8'; ctx.lineWidth = 3; ctx.stroke(); }
          this.drawPartIcon(ctx, P.key, i, r.x + r.w / 2, r.y + r.h * 0.42, Math.min(r.h * 0.5, r.w * 0.45));
          SA.label(ctx, P.opts[i][0], r.x + r.w / 2, r.y + r.h - 12 * k, 15 * Math.min(1, k * 1.15), on ? '#4a2d00' : '#3e4862', { stroke: false, weight: 900 });
        }
      });
    }

    drawPartIcon(ctx, key, i, x, y, sz) {
      ctx.save();
      ctx.translate(x, y);
      const u = sz / 40;
      ctx.scale(u, u);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#3e4862';
      if (key === 'n') {
        ctx.fillStyle = '#ff5d6c';
        ctx.beginPath();
        if (i === 0) { ctx.moveTo(-20, 12); ctx.lineTo(-16, -2); ctx.lineTo(16, -2); ctx.lineTo(20, 12); }
        else if (i === 1) ctx.ellipse(0, 12, 20, 22, 0, Math.PI, TAU);
        else { ctx.moveTo(-20, 12); ctx.quadraticCurveTo(-10, -8, 0, -22); ctx.quadraticCurveTo(10, -8, 20, 12); }
        ctx.closePath(); ctx.fill(); ctx.stroke();
      } else if (key === 't') {
        const h = [20, 32, 44][i];
        ctx.fillStyle = '#eef2fa';
        SA.rrect(ctx, -14, 18 - h, 28, h, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ff9f1c';
        ctx.fillRect(-12, 18 - h * 0.85, 24, h * 0.8);
      } else if (key === 'e') {
        ctx.fillStyle = '#6b7493';
        for (let j = 0; j <= i; j++) {
          const nx = (j - i / 2) * 15;
          ctx.beginPath(); ctx.moveTo(nx - 5, -8); ctx.lineTo(nx + 5, -8); ctx.lineTo(nx + 8, 8); ctx.lineTo(nx - 8, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#ffb340';
          ctx.beginPath(); ctx.moveTo(nx - 6, 9); ctx.quadraticCurveTo(nx, 26, nx + 6, 9); ctx.fill();
          ctx.fillStyle = '#6b7493';
        }
      } else {
        ctx.fillStyle = '#eef2fa';
        SA.rrect(ctx, -10, -20, 20, 40, 4); ctx.fill(); ctx.stroke();
        if (i > 0) {
          const fw = i === 2 ? 16 : 9, fh = i === 2 ? 28 : 16;
          ctx.fillStyle = '#ff5d6c';
          for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(side * 10, 20 - fh); ctx.lineTo(side * (10 + fw), 22); ctx.lineTo(side * 10, 20); ctx.closePath(); ctx.fill(); ctx.stroke(); }
        } else {
          ctx.strokeStyle = '#ff6b8b'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(0, 0, 26, -0.5, 0.5); ctx.stroke();
          ctx.beginPath(); ctx.arc(0, 0, 26, Math.PI - 0.5, Math.PI + 0.5); ctx.stroke();
        }
      }
      ctx.restore();
    }

    drawLaunchBtn(ctx, t) {
      const b = this.launchBtn, ps = 1 + Math.sin(t * 4) * 0.05;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.scale(ps, ps);
      ctx.fillStyle = '#8a91a8';
      SA.circle(ctx, 0, 8, b.r + 6); ctx.fill();
      const g = ctx.createRadialGradient(-b.r * 0.3, -b.r * 0.4, 4, 0, 0, b.r);
      g.addColorStop(0, '#ff9a9a'); g.addColorStop(0.6, '#ff3b4e'); g.addColorStop(1, '#c4152a');
      ctx.fillStyle = g;
      SA.circle(ctx, 0, 0, b.r); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.stroke();
      SA.label(ctx, 'LAUNCH', 0, -6, 19 * this.k + 2, '#fff', { strokeW: 5, stroke: '#8a0f1d' });
      SA.icon(ctx, 'rocket', 0, 24 * this.k, 30 * this.k);
      ctx.restore();
    }

    // How high: a strip on the right with the six places to reach and a marker for the rocket.
    drawMeter(ctx, t, L) {
      const H = SA.H, x = SA.W - 46 * this.k, y0 = H * 0.86, y1 = H < 720 ? 120 : 110;
      ctx.fillStyle = 'rgba(16,14,56,0.6)';
      SA.rrect(ctx, x - 26, y1 - 30, 52, y0 - y1 + 60, 26); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke();
      const yOf = l => SA.lerp(y0, y1, l / 6);
      for (let i = 1; i <= 6; i++) {
        ctx.globalAlpha = L >= i - 0.02 ? 1 : 0.6;
        SA.icon(ctx, LEVELS[i][3], x, yOf(i), 34 * this.k);
      }
      ctx.globalAlpha = 1;
      const best = SA.state.rocketBest;
      if (best) { ctx.strokeStyle = '#ffd84d'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 24, yOf(best)); ctx.lineTo(x - 14, yOf(best)); ctx.stroke(); }
      ctx.fillStyle = '#ffe066';
      SA.starPath(ctx, x - 22, yOf(Math.min(6, L)), 9, 0.45, 5); ctx.fill();
    }

    drawResult(ctx, t) {
      const W = SA.W, H = SA.H, r = this.result, k = this.k;
      if (!r) return;
      const pw = Math.min(560 * k, W * 0.6), ph = 230 * k, px = W * 0.5 - pw / 2, py = H * 0.2;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      SA.rrect(ctx, px, py + 5, pw, ph, 26); ctx.fill();
      ctx.fillStyle = '#fffaf0';
      SA.rrect(ctx, px, py, pw, ph, 26); ctx.fill();
      ctx.strokeStyle = '#8f7bf0'; ctx.lineWidth = 4; ctx.stroke();
      const lv = LEVELS[r.level];
      SA.icon(ctx, r.level ? lv[3] : 'puff', px + 70 * k, py + 78 * k, 84 * k);
      SA.label(ctx, r.level ? 'Your rocket reached' : 'Too heavy to lift off!', px + pw / 2 + 40 * k, py + 50 * k, 20 * k + 2, '#6b7190', { stroke: false, weight: 800 });
      SA.label(ctx, r.level ? lv[1] + '!' : 'Pffft! 😄', px + pw / 2 + 40 * k, py + 92 * k, 34 * k + 4, '#3e2f96', { stroke: false, weight: 900 });
      if (r.record && r.level) SA.label(ctx, '⭐ New best! ⭐', px + pw / 2 + 40 * k, py + 128 * k, 18 * k + 2, '#c47a00', { stroke: false, weight: 900 });
      const by = py + ph - 42 * k;
      this.resultBtns = [
        { label: 'Change parts', icon: 'wrench', x: px + pw * 0.28, y: by, w: pw * 0.42, h: 52 * k, go: () => this.toBuild() },
        { label: 'Launch again', icon: 'rocket', x: px + pw * 0.72, y: by, w: pw * 0.42, h: 52 * k, go: () => { this.toBuild(true); this.launch(); }, gold: true },
      ];
      for (const b of this.resultBtns) {
        // Room at the front of the pill for a drawn icon (no emoji on the canvas).
        const fs = 22 * k + 2;
        const w = SA.pill(ctx, '  ' + b.label, b.x, b.y, fs, b.gold ? { color: '#4a2d00', edge: '#fff6c8', bgTop: '#ffe680', bg: '#ffc21f', weight: 900 } : {});
        SA.icon(ctx, b.icon, b.x - w / 2 + fs * 1.15, b.y, fs * 1.25);
      }
    }

    toBuild(quiet) {
      this.phase = 'build';
      this.fl = null;
      this.result = null;
      this.resultBtns = null;
      SA.audio.play('click');
      if (!quiet) SA.ui.hint('Change some parts, then press LAUNCH! 🚀', 4);
    }

    // Orbit: Earth's curve below, the rocket zooming sideways with speed lines.
    drawOrbit(ctx, t, f) {
      const W = SA.W, H = SA.H;
      ctx.fillStyle = '#02030c';
      ctx.fillRect(-10, -10, W + 20, H + 20);
      this.stars.draw(ctx, t, t * 120);
      const R = W * 1.6;
      SA.drawBody(ctx, 'earth', W * 0.5, H * 0.78 + R, R, { t: t * 40, lx: -0.2, ly: -1 });
      const x = W * 0.5, y = H * 0.42;
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 7; i++) {
        const yy = y - 60 + i * 20, off = (t * 1200 + i * 211) % (W + 200);
        ctx.beginPath(); ctx.moveTo(W - off, yy); ctx.lineTo(W - off + 120, yy); ctx.stroke();
      }
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(f.ang);
      ctx.translate(0, this.dims().total / 2);
      this.drawRocket(ctx, t, { flame: 0.6 });
      ctx.restore();
      const oy = H * 0.16 + (H < 720 ? 20 : 0);
      SA.label(ctx, 'ORBIT!', W * 0.5, oy, 40, '#bfe3ff');
      for (const side of [-1, 1]) SA.icon(ctx, 'satellite', W * 0.5 + side * 110, oy, 56);
    }

    // To the Moon: the Moon grows, then the rocket lands next to a flag.
    drawMoonTrip(ctx, t, f) {
      const W = SA.W, H = SA.H, u = SA.clamp((f.t - 0.9) / 2.5, 0, 1);
      ctx.fillStyle = '#02030c';
      ctx.fillRect(-10, -10, W + 20, H + 20);
      this.stars.draw(ctx, t, 0);
      const mr = SA.lerp(H * 0.1, W * 1.4, SA.easeInOut(u));
      const my = SA.lerp(H * 0.2, H * 0.72 + mr, SA.easeInOut(u));
      SA.drawBody(ctx, 'moon', W * 0.5, my, mr, { t: 0, lx: -0.6, ly: -0.6 });
      const surf = my - mr;
      const ry = u < 1 ? SA.lerp(H * 0.75, surf, SA.easeInOut(u)) : surf;
      ctx.save();
      ctx.translate(W * 0.5, ry);
      this.drawRocket(ctx, t, { flame: u < 1 ? 0.5 : 0 });
      ctx.restore();
      if (f.landed) {
        const fu = SA.easeBack(Math.min(1, (f.t - 3.4) * 3));
        ctx.save();
        ctx.translate(W * 0.5 + 120 * this.k, surf);
        ctx.scale(fu, fu);
        SA.icon(ctx, 'flag', 0, -38 * this.k, 80 * this.k);
        ctx.restore();
        SA.label(ctx, 'You made it to the Moon!', W * 0.5, H * 0.16 + (H < 720 ? 20 : 0), 38, '#fff3a0');
      }
    }
  }
  SA.WorkshopScene = WorkshopScene;
})(window.SA);
