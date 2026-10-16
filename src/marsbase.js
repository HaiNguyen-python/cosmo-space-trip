// Mars Base builder (from Mars's card once Mars is explored): the child builds a home for astronauts
// on Mars by dragging parts onto building spots. Each part is one thing astronauts need, and Cosmo
// says why: a sealed habitat (you can't breathe Mars air), solar panels (weaker sunlight out here),
// a greenhouse (food), an ice drill (water), an oxygen maker (like MOXIE) and a radio dish (messages
// take minutes to reach Earth). Light up all six needs and astronauts land to move in. Afterwards it
// stays a toy: switch day and night, whip up a dust storm and wipe the solar panels clean, look at
// Mars rocks in the science lab's microscope, and send the launch pad's rocket home to Earth.
// Nothing can go wrong: parts can be moved or dragged back to the tray at any time.
(function (SA) {
  const TAU = Math.PI * 2;
  const $ = id => document.getElementById(id);
  const NEEDS = [['home', '🏠', 'Home'], ['air', '🫧', 'Air'], ['water', '💧', 'Water'], ['food', '🥬', 'Food'], ['power', '⚡', 'Power'], ['radio', '📡', 'Radio']];
  const partOf = id => SA.MARS_PARTS.find(p => p.id === id);
  const PLOTS = 10;
  const zeros = () => new Array(PLOTS).fill(0);
  // What the science lab's microscope shows, one per tap (all real Mars discoveries).
  const LAB = [
    'Under the microscope: tiny round "blueberries" of rock! The Opportunity rover found them. They formed in water long, long ago. 🫐',
    'This rock has thin layers, like a cake! Layers like these formed at the bottom of an old lake in Gale Crater, where the Curiosity rover explores. 🍰',
    'The Perseverance rover keeps Mars rocks in little tubes, so scientists may one day bring them to Earth to study! 🧪',
    'Did tiny living things ever live on Mars? Nobody knows yet. That\'s one of the biggest questions scientists want to answer! 🤔',
  ];

  // Places that offer extra toys on their planet card (see ui.planetCard).
  SA.PLACE_TOYS = SA.PLACE_TOYS || {};
  SA.PLACE_TOYS.mars = [{ label: '🏗️ Mars Base', go: () => { SA.ui.hideTalk(); SA.go(SA.marsbase, {}); } }];

  class MarsBaseScene {
    constructor() {
      this.t = 0;
      this.fx = new SA.Particles();
      this.stars = new SA.Starfield(160, 303);
      const rnd = SA.seeded(88);
      this.rocks = [];
      for (let i = 0; i < 40; i++) this.rocks.push({ x: rnd(), y: rnd(), s: 3 + rnd() * 9, c: rnd() > 0.5 ? '#a9472b' : '#c9643d' });
    }

    layout() {
      const W = SA.W, H = SA.H;
      this.ground = H * 0.47;
      this.trayX = W * 0.8;
      // Two rows of five building spots: a smaller back row and a bigger front row.
      this.plots = [];
      for (let i = 0; i < PLOTS; i++) {
        const back = i < 5, k = i % 5;
        const x = W * (back ? 0.1 : 0.075) + k * W * (back ? 0.138 : 0.152);
        this.plots.push({ i, x, y: H * (back ? 0.6 : 0.82), s: (back ? 0.9 : 1.1) * Math.min(1, W / (H * 1.45)) });
      }
      // Keep the tray and the needs clear of the buttons along the top (they cover more on phones).
      const hud = Math.max(H * 0.1, SA.ui.toyTop());
      this.trayTop = hud + 6;
      const rows = Math.ceil(SA.MARS_PARTS.length / 2);
      const cw = (W - this.trayX - 12) / 2, top = this.trayTop + 44, ch = Math.min(cw * 1.05, (H * 0.985 - top) / rows);
      this.cells = SA.MARS_PARTS.map((p, i) => ({ id: p.id, x: this.trayX + cw * (i % 2) + cw / 2 + 4, y: top + ch * Math.floor(i / 2) + ch / 2, r: Math.min(cw, ch) * 0.44 }));
      this.badges = NEEDS.map((n, i) => ({ id: n[0], x: W * 0.05 + 20 + i * Math.min(78, W * 0.07), y: hud + 40 }));
    }
    resize() { this.layout(); }

    enter() {
      SA.ui.setScene('toy');
      SA.audio.music('marsbase');
      $('btnToyBack').textContent = '🗺️ Map';
      this.layout();
      this.drag = null;
      this.night = false;
      this.dark = 0;
      this.storm = 0;
      this.dust = zeros();     // how dusty the solar panels on each spot are
      this.wiggle = zeros();
      this.lander = null;
      this.hop = null;         // the launch pad's rocket going home to Earth (and a new one landing)
      this.scope = null;       // the science lab's microscope picture
      this.labN = 0;
      this.landed = !!SA.state.marsBase.done;
      this.astros = this.landed ? this.makeAstros() : [];
      this.buildButtons();
      this.updateInfo();
      const st = SA.state;
      if (!st.marsSeen) {
        SA.ui.say([
          'Welcome to Mars! 🔴 Astronauts want to come and live here, but first they need a base. Let\'s build one! 🏗️',
          'Drag a part from the right onto a building spot. Each part gives the astronauts something they need!',
          'Light up all six needs at the top: home, air, water, food, power and radio. Then the astronauts can land! 👩‍🚀',
        ]).then(() => { st.marsSeen = true; SA.save(); });
      } else {
        const mbp = st.marsBase.p, fresh = mbp.indexOf('lab') < 0 && mbp.indexOf('pad') < 0;
        SA.ui.hint(this.landed && fresh ? 'Welcome back! 🏗️ Two new parts arrived: a science lab 🔬 and a launch pad 🚀. Build them, then tap them to see what they do!'
          : this.landed ? 'Welcome back to our Mars Base! 🏗️ The astronauts love it here. Tap a part to hear what it does!' : 'Welcome back! Let\'s finish the Mars Base for the astronauts! 🏗️', 6);
        // Everything was built last time, but we left before the astronauts landed.
        if (!this.landed && this.needsMet().length === NEEDS.length) setTimeout(() => { if (SA.scene === this) this.allSet(); }, 2500);
      }
    }
    exit() { SA.ui.hideTalk(); this.drag = null; }
    back() { SA.go(SA.map, {}); }

    buildButtons() {
      const pick = $('toyPick');
      pick.innerHTML =
        '<button class="round-btn toy-btn" data-a="night" aria-label="Day or night">' + (this.night ? '☀️' : '🌙') + '</button>' +
        '<button class="round-btn toy-btn" data-a="storm" aria-label="Dust storm">🌪️</button>';
      pick.querySelectorAll('button').forEach(b => {
        b.onclick = () => { if (SA.scene === this && !SA.ui.blocking() && !SA.transitioning) this.button(b.dataset.a); };
      });
    }
    button(a) {
      SA.audio.play('click');
      const has = id => SA.state.marsBase.p.indexOf(id) >= 0;
      if (a === 'night') {
        this.night = !this.night;
        this.buildButtons();
        SA.ui.hint(this.night ? (has('solar') ? 'Night on Mars! 🌙 Solar panels can\'t make power in the dark, so a real base would save power in big batteries during the day.' : 'Night on Mars! 🌙 It gets super cold: often colder than −70 °C!')
          : 'Good morning, Mars! ☀️ A day here lasts 24 hours and 37 minutes, almost like on Earth.', 7);
      } else if (a === 'storm') {
        if (this.storm > 0) return;
        this.storm = 12;
        SA.audio.play('rumble');
        SA.ui.hint('A dust storm! 🌪️ Mars dust storms can grow so big that they cover the whole planet and hide the Sun for weeks!' + (has('solar') ? ' Uh-oh, dust on the solar panels! Tap them to wipe them clean. 🧽' : ''), 8);
      }
    }

    updateInfo() {
      const n = this.needsMet().length;
      SA.ui.setInfo('🏗️ Mars Base · ' + n + ' / ' + NEEDS.length + ' needs');
    }
    needsMet() { return NEEDS.map(n => n[0]).filter(need => SA.state.marsBase.p.some(id => id && partOf(id).need === need)); }

    makeAstros() {
      return [0, 1].map(i => ({ x: SA.W * (0.3 + i * 0.2), y: SA.H * (0.66 + i * 0.03), tx: SA.W * 0.4, dir: 1, wait: i, suit: i ? '#ffd0e0' : '#e8f0ff', hi: 0 }));
    }

    // ---------- Building ----------
    cellAt(x, y) { return this.cells.find(c => Math.hypot(x - c.x, y - c.y) < c.r * 1.15); }
    plotAt(x, y, wantFree) {
      let best = null, bestD = 1e9;
      for (const p of this.plots) {
        if (wantFree && SA.state.marsBase.p[p.i]) continue;
        const d = Math.hypot(x - p.x, (y - (p.y - 30 * p.s)) * 1.3);
        if (d < bestD) { best = p; bestD = d; }
      }
      return best && bestD < 120 ? best : null;
    }
    builtAt(x, y) {
      for (let k = PLOTS - 1; k >= 0; k--) {
        const p = this.plots[k], id = SA.state.marsBase.p[k];
        if (id && Math.abs(x - p.x) < 62 * p.s && y < p.y + 14 && y > p.y - 120 * p.s) return p;
      }
      return null;
    }

    place(id, plot) {
      const mb = SA.state.marsBase, before = this.needsMet().length;
      const was = mb.p.indexOf(id);
      if (was >= 0) mb.p[was] = null;
      mb.p[plot.i] = id;
      this.dust[plot.i] = 0;
      this.wiggle[plot.i] = 1;
      SA.save();
      SA.audio.play('clunk');
      this.fx.spawn('sparkle', plot.x, plot.y - 40 * plot.s, 14, { color: '#ffe066' });
      for (let i = 0; i < 6; i++) this.fx.spawn('dust', plot.x + SA.rand(-40, 40), plot.y, 1, { color: 'rgba(214,130,90,0.6)' });
      this.updateInfo();
      SA.ui.bumpInfo();
      const P = partOf(id);
      const after = this.needsMet().length;
      if (was < 0) SA.ui.hint(P.name + '! ' + P.fact, 8);
      if (after > before && after === NEEDS.length && !SA.state.marsBase.done) setTimeout(() => { if (SA.scene === this) this.allSet(); }, 1200);
    }
    remove(id) {
      const mb = SA.state.marsBase, i = mb.p.indexOf(id);
      if (i < 0) return;
      mb.p[i] = null;
      SA.save();
      SA.audio.play('pop');
      const p = this.plots[i];
      this.fx.spawn('puff', p.x, p.y - 20, 10);
      this.updateInfo();
    }

    // All six needs: the astronauts land and move in.
    allSet() {
      if (this.lander || this.landed) return;
      this.lander = { y: -120, t: 0, x: SA.W * 0.42 };
      SA.audio.play('launch');
      SA.ui.hint('Every need is lit up! 🎉 Here come the astronauts! 👩‍🚀', 0);
    }
    touchdown() {
      this.landed = true;
      this.astros = this.makeAstros();
      for (const a of this.astros) a.x = this.lander.x;
      SA.state.marsBase.done = true;
      SA.state.baseNew = true;
      SA.save();
      SA.audio.play('cheer');
      SA.celebrate(120);
      SA.ui.banner('Mars Base is GO!', 'The astronauts moved in 👩‍🚀', 'gold').then(() => {
        if (SA.scene !== this) return;
        SA.ui.say([
          'You built a whole Mars Base! 🏗️ The astronauts have air, water, food, power, a home and a radio to call Earth!',
          'Real space agencies are planning trips like this. Maybe one day YOU will live on Mars! 🔴',
          'I put a Mars astronaut sticker at my Space Base for you! 👩‍🚀 You can keep building, or try the 🌙 and 🌪️ buttons!',
        ]);
      });
    }

    // The launch pad: the rocket blasts off for Earth, and a while later a new one lands with supplies.
    launchHome(plot) {
      if (this.hop) { this.wiggle[plot.i] = 1; SA.audio.play('boing'); return; }
      this.hop = { i: plot.i, t: 0 };
      SA.audio.play('launch');
      SA.ui.hint('Liftoff! 🚀 This rocket is going home to Earth. The trip takes about 6 to 9 months!', 6);
    }
    // The science lab: a microscope picture of a Mars rock, with a real discovery each tap.
    lookInScope(plot) {
      this.wiggle[plot.i] = 1;
      SA.audio.play('blip');
      const k = this.labN++ % LAB.length;
      this.scope = { i: plot.i, k, t: 0 };
      SA.ui.hint(LAB[k], 9);
    }

    // ---------- Input ----------
    onDown(x, y) {
      if (this.scope && this.scope.t > 0.4) { this.scope = null; SA.ui.hideTalk(); return; }
      // Wipe dust off solar panels during or after a storm.
      const bp = this.builtAt(x, y);
      if (bp && SA.state.marsBase.p[bp.i] === 'solar' && this.dust[bp.i] > 0.2) {
        this.dust[bp.i] = 0;
        SA.audio.play('pour');
        this.fx.spawn('sparkle', bp.x, bp.y - 40 * bp.s, 12, { color: '#bff4ff' });
        SA.ui.hint('Squeaky clean! ✨ On Mars, gusts of wind sometimes cleaned real rovers\' solar panels for them!', 6);
        return;
      }
      const c = this.cellAt(x, y);
      if (c) { this.drag = { id: c.id, x, y, x0: x, y0: y, from: 'tray', moved: false }; SA.audio.play('blip'); return; }
      if (bp) { this.drag = { id: SA.state.marsBase.p[bp.i], x, y, x0: x, y0: y, from: bp, moved: false }; return; }
      // Tap an astronaut for a hello.
      for (const a of this.astros) {
        if (Math.hypot(x - a.x, y - (a.y - 30)) < 36) {
          a.hi = 1.5;
          SA.audio.play('giggle');
          SA.ui.hint(SA.pick(['Hello from Mars! 👋 Our spacesuits keep us warm and give us air to breathe.', 'Look how high I can jump! Mars gravity is weaker than Earth\'s. 🦘', 'Our message to Earth takes minutes to arrive. Hi, Mom! 📡', 'Thank you for building our base! 🏗️']), 5);
          return;
        }
      }
    }
    onMove(x, y) {
      const d = this.drag;
      if (!d) return;
      d.x = x; d.y = y;
      if (Math.hypot(x - d.x0, y - d.y0) > 12) d.moved = true;
    }
    onUp(x, y) {
      const d = this.drag;
      if (!d) return;
      this.drag = null;
      if (!d.moved) {
        if (d.from === 'tray') {
          // A tap on a tray part: build it on the first free spot (or say where it already is).
          if (SA.state.marsBase.p.indexOf(d.id) >= 0) { const p = this.plots[SA.state.marsBase.p.indexOf(d.id)]; this.wiggle[p.i] = 1; SA.audio.play('boing'); SA.ui.hint(partOf(d.id).name + '! ' + partOf(d.id).fact, 8); return; }
          const free = this.plots.find(p => !SA.state.marsBase.p[p.i]);
          if (free) this.place(d.id, free);
        } else if (d.id === 'pad') {
          this.launchHome(d.from);
        } else if (d.id === 'lab') {
          this.lookInScope(d.from);
        } else {
          this.wiggle[d.from.i] = 1;
          SA.audio.play('boing');
          SA.ui.hint(partOf(d.id).name + '! ' + partOf(d.id).fact, 8);
        }
        return;
      }
      if (x > this.trayX - 20) { if (d.from !== 'tray') this.remove(d.id); return; }
      const p = this.plotAt(x, y, true);
      if (p) this.place(d.id, p);
      else SA.audio.play('boing');
    }

    // ---------- Update ----------
    update(dt) {
      this.t += dt;
      this.fx.update(dt);
      this.dark = SA.clamp(this.dark + (this.night ? dt : -dt) * 0.8, 0, 1);
      for (let i = 0; i < PLOTS; i++) this.wiggle[i] = Math.max(0, this.wiggle[i] - dt * 2);
      // The pad's rocket: up and away (about 3 s), a quiet wait, then a supply rocket lands (about 3 s).
      if (this.hop) {
        const hp = this.hop;
        hp.t += dt;
        if (SA.state.marsBase.p[hp.i] !== 'pad') this.hop = null;
        else {
          const p = this.plots[hp.i];
          if (hp.t < 3 && Math.random() < (SA.calm() ? 0.3 : 0.8)) this.fx.spawn('puff', p.x + SA.rand(-8, 8), this.hopY(p, hp.t) + 10, 1, { vy: 50 });
          if (hp.t > 7.5 && hp.t < 10.5 && Math.random() < 0.5) this.fx.spawn('puff', p.x + SA.rand(-8, 8), this.hopY(p, hp.t) + 10, 1, { vy: 50 });
          if (hp.t >= 10.5 && !hp.landed) {
            hp.landed = true;
            SA.audio.play('land');
            for (let i = 0; i < 8; i++) this.fx.spawn('dust', p.x + SA.rand(-40, 40), p.y, 1, { color: 'rgba(214,130,90,0.6)' });
            SA.ui.hint(SA.pick([
              'A new rocket landed with supplies from Earth! 📦 Rockets fly between Earth and Mars when the two planets line up just right, about every 2 years.',
              'Touchdown! 📦 Fresh supplies from Earth: seeds, tools and letters from home!',
            ]), 7);
          }
          if (hp.t > 11.5) this.hop = null;
        }
      }
      if (this.scope) { this.scope.t += dt; if (this.scope.t > 9 || SA.state.marsBase.p[this.scope.i] !== 'lab') this.scope = null; }
      if (this.storm > 0) {
        this.storm = Math.max(0, this.storm - dt);
        const mb = SA.state.marsBase;
        for (let i = 0; i < PLOTS; i++) if (mb.p[i] === 'solar') this.dust[i] = Math.min(1, this.dust[i] + dt * 0.25);
        if (Math.random() < (SA.calm() ? 0.25 : 0.7)) {
          this.fx.list.push({ kind: 'dot', x: -20, y: SA.rand(SA.H * 0.1, SA.H * 0.9), vx: SA.rand(260, 420), vy: SA.rand(-20, 30), life: 0, max: 3.5, size: SA.rand(2, 5), rot: 0, color: 'rgba(214,140,90,0.7)' });
        }
      }
      const L = this.lander;
      if (L) {
        L.t += dt;
        const gy = SA.H * 0.62;
        L.y = Math.min(gy, L.y + Math.max(40, (gy - L.y) * 1.6) * dt);
        if (Math.random() < 0.7) this.fx.spawn('puff', L.x + SA.rand(-10, 10), L.y + 10, 1, { vy: 60 });
        if (L.y >= gy && !L.down) { L.down = true; L.downT = 0; SA.audio.play('land'); for (let i = 0; i < 10; i++) this.fx.spawn('dust', L.x + SA.rand(-60, 60), gy + 6, 1, { color: 'rgba(214,130,90,0.6)' }); this.touchdown(); }
        if (L.down) { L.downT += dt; if (L.downT > 6) this.lander = null; }
      }
      // Astronauts stroll between the parts of the base.
      for (const a of this.astros) {
        a.hi = Math.max(0, a.hi - dt);
        if (a.wait > 0) { a.wait -= dt; continue; }
        const dx = a.tx - a.x;
        if (Math.abs(dx) < 4) {
          a.wait = SA.rand(1.5, 4);
          const built = this.plots.filter(p => SA.state.marsBase.p[p.i]);
          const p = built.length ? SA.pick(built) : null;
          a.tx = p ? p.x + SA.rand(-30, 30) : SA.rand(SA.W * 0.1, SA.W * 0.7);
        } else {
          a.dir = Math.sign(dx);
          a.x += a.dir * Math.min(Math.abs(dx), 46 * dt);
        }
      }
    }

    // ---------- Drawing ----------
    draw(ctx) {
      const W = SA.W, H = SA.H, t = this.t, dk = this.dark, st = SA.clamp(this.storm / 2, 0, 1);
      // Butterscotch day sky, deep blue night, brown storm.
      const sky = ctx.createLinearGradient(0, 0, 0, this.ground);
      sky.addColorStop(0, mix('#d98f62', '#0b1030', dk)); sky.addColorStop(1, mix('#f3cfa8', '#2a2350', dk));
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, this.ground + 2);
      if (dk > 0.05) { ctx.globalAlpha = dk; this.stars.draw(ctx, t, 0); ctx.globalAlpha = 1; }
      // Small, pale Sun by day; little Earth (a bright dot) by night.
      if (dk < 0.95) {
        ctx.globalAlpha = 1 - dk;
        ctx.fillStyle = 'rgba(255,250,235,0.35)'; SA.circle(ctx, W * 0.55, H * 0.12, 40); ctx.fill();
        ctx.fillStyle = '#fffaf0'; SA.circle(ctx, W * 0.55, H * 0.12, 19); ctx.fill();
        ctx.globalAlpha = 1;
      }
      if (dk > 0.3) {
        ctx.globalAlpha = dk;
        ctx.fillStyle = '#9fd0ff'; SA.circle(ctx, W * 0.6, H * 0.14, 4); ctx.fill();
        SA.label(ctx, 'Earth', W * 0.6, H * 0.14 + 18, 13, '#cfe6ff', { weight: 700 });
        ctx.globalAlpha = 1;
      }
      // Distant hills and the red ground.
      ctx.fillStyle = mix('#cf7a54', '#3a2340', dk * 0.8);
      ctx.beginPath(); ctx.moveTo(0, this.ground + 4);
      for (let x = 0; x <= W + 20; x += 20) ctx.lineTo(x, this.ground - 20 - Math.sin(x * 0.006 + 1) * 26 - Math.sin(x * 0.017) * 10);
      ctx.lineTo(W, this.ground + 4); ctx.closePath(); ctx.fill();
      const g = ctx.createLinearGradient(0, this.ground, 0, H);
      g.addColorStop(0, mix('#c9643d', '#4a2a3a', dk * 0.8)); g.addColorStop(1, mix('#8e3a22', '#2a1626', dk * 0.8));
      ctx.fillStyle = g; ctx.fillRect(0, this.ground, W, H - this.ground);
      for (const r of this.rocks) {
        ctx.fillStyle = r.c; ctx.globalAlpha = 1 - dk * 0.6;
        SA.ellipse(ctx, r.x * this.trayX, this.ground + 10 + r.y * (H - this.ground - 10), r.s, r.s * 0.55); ctx.fill();
      }
      ctx.globalAlpha = 1;

      this.drawTunnels(ctx);
      for (const p of this.plots) this.drawPlot(ctx, p, t);
      if (this.hop && !this.hop.landed) {
        const p = this.plots[this.hop.i], y = this.hopY(p, this.hop.t);
        if (y > -200) drawMarsRocket(ctx, p.x, y, p.s, this.hop.t < 3 ? 1 : 0.7);
      }
      if (this.lander) this.drawLander(ctx, this.lander, t);
      for (const a of this.astros) this.drawAstronaut(ctx, a, t);
      this.drawBadges(ctx, t);
      this.drawTray(ctx, t);
      if (this.drag && this.drag.moved) {
        const p = this.plotAt(this.drag.x, this.drag.y, true);
        if (p && this.drag.x < this.trayX - 20) { ctx.strokeStyle = 'rgba(126,224,138,0.9)'; ctx.lineWidth = 4; SA.ellipse(ctx, p.x, p.y, 60 * p.s, 17 * p.s); ctx.stroke(); }
        ctx.globalAlpha = 0.85;
        this.drawPart(ctx, this.drag.id, this.drag.x, this.drag.y + 30, 0.8, t, 0);
        ctx.globalAlpha = 1;
      }
      // Dust storm haze over everything.
      if (st > 0) {
        ctx.fillStyle = 'rgba(190,110,60,' + (0.4 * st) + ')';
        ctx.fillRect(0, 0, W, H);
      }
      if (dk > 0) { ctx.fillStyle = 'rgba(5,8,30,' + 0.25 * dk + ')'; ctx.fillRect(0, 0, W, H); }
      if (this.scope) this.drawScope(ctx, t);
      this.fx.draw(ctx);
    }

    // Tunnels join neighbouring parts in a row, so the astronauts can walk between them inside.
    drawTunnels(ctx) {
      const mb = SA.state.marsBase.p;
      const open = id => !id || id === 'solar' || id === 'dish' || id === 'pad';   // nothing to walk into
      for (let row = 0; row < 2; row++) {
        for (let k = 0; k < 4; k++) {
          const a = this.plots[row * 5 + k], b = this.plots[row * 5 + k + 1];
          if (open(mb[a.i]) || open(mb[b.i])) continue;
          const y = a.y - 14 * a.s, h = 18 * a.s;
          ctx.fillStyle = '#dfe4ee'; SA.rrect(ctx, a.x, y - h / 2, b.x - a.x, h, h / 2); ctx.fill();
          ctx.strokeStyle = '#8a93a8'; ctx.lineWidth = 2; ctx.stroke();
          ctx.strokeStyle = 'rgba(138,147,168,0.6)';
          for (let x = a.x + 20; x < b.x - 10; x += 22) { ctx.beginPath(); ctx.moveTo(x, y - h / 2); ctx.lineTo(x, y + h / 2); ctx.stroke(); }
        }
      }
    }

    drawPlot(ctx, p, t) {
      const id = SA.state.marsBase.p[p.i];
      const dragging = this.drag && this.drag.moved && this.drag.from === p;
      if (!id || dragging) {
        ctx.fillStyle = 'rgba(255,230,200,0.14)';
        SA.ellipse(ctx, p.x, p.y, 58 * p.s, 16 * p.s); ctx.fill();
        ctx.setLineDash([8, 8]); ctx.strokeStyle = 'rgba(255,235,210,0.6)'; ctx.lineWidth = 2.5; ctx.stroke(); ctx.setLineDash([]);
        SA.label(ctx, '+', p.x, p.y - 2, 22 * p.s, 'rgba(255,240,220,0.8)', { stroke: false });
        return;
      }
      const w = this.wiggle[p.i];
      ctx.fillStyle = 'rgba(60,20,10,0.25)';
      SA.ellipse(ctx, p.x, p.y + 2, 60 * p.s, 15 * p.s); ctx.fill();
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(1 + Math.sin(w * Math.PI * 3) * 0.06 * w, 1 - Math.sin(w * Math.PI * 3) * 0.06 * w);
      this.drawPart(ctx, id, 0, 0, p.s, t, p.i);
      ctx.restore();
    }

    // Each part, drawn standing on the ground at (x, y), about 120 wide at s = 1.
    drawPart(ctx, id, x, y, s, t, slot) {
      const night = this.dark > 0.5;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(s, s);
      ctx.lineJoin = 'round';
      const ink = (c, w) => { ctx.strokeStyle = c || '#6b7189'; ctx.lineWidth = w || 3; ctx.stroke(); };
      if (id === 'hab') {
        // A round white habitat with windows that glow at night.
        ctx.beginPath(); ctx.moveTo(-56, 0); ctx.lineTo(-56, -44); ctx.quadraticCurveTo(-56, -84, 0, -86); ctx.quadraticCurveTo(56, -84, 56, -44); ctx.lineTo(56, 0); ctx.closePath();
        const g = ctx.createLinearGradient(-56, 0, 56, 0); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#c9d0e0');
        ctx.fillStyle = g; ctx.fill(); ink();
        ctx.strokeStyle = 'rgba(107,113,137,0.4)'; ctx.lineWidth = 2;
        for (const yy of [-30, -56]) { ctx.beginPath(); ctx.moveTo(-56, yy); ctx.lineTo(56, yy); ctx.stroke(); }
        for (const wx of [-30, 0, 30]) { ctx.fillStyle = night ? '#ffe9a0' : '#7fb8f0'; SA.circle(ctx, wx, -44, 9); ctx.fill(); ink('#6b7189', 2); }
        ctx.fillStyle = '#9aa3bf'; SA.rrect(ctx, -12, -26, 24, 26, 6); ctx.fill(); ink('#6b7189', 2);
        ctx.fillStyle = '#ff5d6c'; SA.circle(ctx, 0, -88, 4); ctx.fill();
      } else if (id === 'solar') {
        // Three tilted solar panels on stands (dusty ones look brown and dim).
        const d = this.dust[slot] || 0;
        for (let i = -1; i <= 1; i++) {
          ctx.strokeStyle = '#6b7189'; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(i * 40, 0); ctx.lineTo(i * 40, -30); ctx.stroke();
          ctx.save(); ctx.translate(i * 40, -38); ctx.transform(1, 0, -0.35, 1, 0, 0);
          ctx.fillStyle = mix('#2f5fb8', '#a0623c', d); SA.rrect(ctx, -18, -16, 36, 30, 3); ctx.fill(); ink('#1d2a5a', 2);
          ctx.strokeStyle = 'rgba(200,225,255,' + (0.5 * (1 - d)) + ')'; ctx.lineWidth = 1.5;
          for (const gx of [-6, 6]) { ctx.beginPath(); ctx.moveTo(gx, -16); ctx.lineTo(gx, 14); ctx.stroke(); }
          ctx.beginPath(); ctx.moveTo(-18, -1); ctx.lineTo(18, -1); ctx.stroke();
          if (!night && d < 0.3) { ctx.fillStyle = 'rgba(255,255,255,' + (0.4 + 0.3 * Math.sin(t * 2 + i)) + ')'; SA.ellipse(ctx, -6, -8, 6, 2.5, -0.5); ctx.fill(); }
          ctx.restore();
        }
      } else if (id === 'green') {
        // A glass dome full of plants under pink grow lights.
        ctx.fillStyle = '#9aa3bf'; SA.rrect(ctx, -58, -12, 116, 12, 4); ctx.fill(); ink();
        ctx.beginPath(); ctx.arc(0, -12, 54, Math.PI, TAU); ctx.closePath();
        const glow = ctx.createRadialGradient(0, -30, 4, 0, -20, 60);
        glow.addColorStop(0, night ? 'rgba(255,140,220,0.55)' : 'rgba(220,255,240,0.45)'); glow.addColorStop(1, 'rgba(200,240,255,0.25)');
        ctx.fillStyle = glow; ctx.fill();
        ctx.save(); ctx.clip();
        for (let i = -3; i <= 3; i++) {
          const h = 16 + ((i * 7) % 3 + 3) * 6, sw = Math.sin(t * 1.5 + i) * 2;
          ctx.strokeStyle = '#2e9a4f'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(i * 13, -12); ctx.lineTo(i * 13 + sw, -12 - h); ctx.stroke();
          ctx.fillStyle = i % 2 ? '#5cd16a' : '#3fbf5a';
          SA.ellipse(ctx, i * 13 + sw - 5, -12 - h + 6, 7, 4, -0.5); ctx.fill();
          SA.ellipse(ctx, i * 13 + sw + 5, -12 - h + 10, 7, 4, 0.5); ctx.fill();
          if (i === -1 || i === 2) { ctx.fillStyle = '#ff5d5d'; SA.circle(ctx, i * 13 + sw, -12 - h, 4); ctx.fill(); }
        }
        ctx.restore();
        ctx.beginPath(); ctx.arc(0, -12, 54, Math.PI, TAU); ink('#8ad0e8', 3);
        ctx.strokeStyle = 'rgba(138,208,232,0.6)'; ctx.lineWidth = 2;
        for (const a of [-0.6, 0, 0.6]) { ctx.beginPath(); ctx.moveTo(0, -66); ctx.quadraticCurveTo(Math.sin(a) * 60, -40, Math.sin(a) * 54, -12); ctx.stroke(); }
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; SA.ellipse(ctx, -24, -46, 10, 5, -0.6); ctx.fill();
      } else if (id === 'drill') {
        // A drill tower and a tank of melted ice water.
        ctx.strokeStyle = '#6b7189'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(-34, 0); ctx.lineTo(-18, -96); ctx.lineTo(-2, 0); ctx.moveTo(-30, -24); ctx.lineTo(-6, -24); ctx.moveTo(-26, -52); ctx.lineTo(-10, -52); ctx.stroke();
        const bob = Math.sin(t * 6) * 4;
        ctx.fillStyle = '#ffd84d'; SA.rrect(ctx, -24, -80 + bob, 12, 30, 3); ctx.fill(); ink('#a35a00', 2);
        ctx.fillStyle = '#9aa3bf'; ctx.beginPath(); ctx.moveTo(-22, -50 + bob); ctx.lineTo(-14, -50 + bob); ctx.lineTo(-18, -38 + bob); ctx.closePath(); ctx.fill();
        SA.rrect(ctx, 6, -54, 46, 54, 10);
        const wg = ctx.createLinearGradient(0, -54, 0, 0); wg.addColorStop(0, '#eef7ff'); wg.addColorStop(1, '#b9c8e0');
        ctx.fillStyle = wg; ctx.fill(); ink();
        ctx.fillStyle = '#4fa3f0'; SA.rrect(ctx, 10, -30 + Math.sin(t * 2) * 2, 38, 26 - Math.sin(t * 2) * 2, 6); ctx.fill();
        ctx.fillStyle = '#7fd0ff'; ctx.beginPath(); ctx.moveTo(29, -48); ctx.quadraticCurveTo(36, -38, 29, -34); ctx.quadraticCurveTo(22, -38, 29, -48); ctx.fill();
        ctx.strokeStyle = '#6b7189'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-6, -8); ctx.lineTo(6, -8); ctx.stroke();
      } else if (id === 'oxy') {
        // A gold-wrapped oxygen maker (like MOXIE) with bubbles rising from it.
        SA.rrect(ctx, -44, -60, 88, 60, 8);
        const og = ctx.createLinearGradient(-44, 0, 44, 0); og.addColorStop(0, '#ffe680'); og.addColorStop(0.5, '#ffc21f'); og.addColorStop(1, '#d99a12');
        ctx.fillStyle = og; ctx.fill(); ink('#a35a00', 3);
        ctx.fillStyle = '#fff'; SA.circle(ctx, -16, -32, 14); ctx.fill(); ink('#6b7189', 2);
        ctx.strokeStyle = '#ff5d6c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-16, -32); ctx.lineTo(-16 + Math.cos(t * 1.5 - 2) * 10, -32 + Math.sin(t * 1.5 - 2) * 10); ctx.stroke();
        SA.label(ctx, 'O₂', 20, -32, 22, '#5a3a00', { stroke: false });
        for (let i = 0; i < 4; i++) {
          const k = (t * 0.6 + i / 4) % 1;
          ctx.strokeStyle = 'rgba(190,240,255,' + (1 - k) + ')'; ctx.lineWidth = 2;
          SA.circle(ctx, 30 + Math.sin(k * 6 + i) * 8, -64 - k * 50, 4 + k * 5); ctx.stroke();
        }
      } else if (id === 'dish') {
        // A radio dish that slowly turns toward Earth, sending out little signal rings.
        ctx.strokeStyle = '#6b7189'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -50); ctx.moveTo(-18, 0); ctx.lineTo(0, -30); ctx.lineTo(18, 0); ctx.stroke();
        const a = -0.6 + Math.sin(t * 0.4) * 0.2;
        ctx.save(); ctx.translate(0, -54); ctx.rotate(a);
        ctx.beginPath(); ctx.ellipse(0, 0, 42, 16, 0, 0, Math.PI); ctx.closePath();
        ctx.fillStyle = '#eef1f8'; ctx.fill(); ink();
        ctx.strokeStyle = '#6b7189'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -28); ctx.stroke();
        ctx.fillStyle = '#ff5d6c'; SA.circle(ctx, 0, -30, 4); ctx.fill();
        for (let i = 0; i < 3; i++) {
          const k = (t * 0.7 + i / 3) % 1;
          ctx.strokeStyle = 'rgba(255,240,170,' + (1 - k) * 0.8 + ')'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(0, -30, 8 + k * 40, -Math.PI * 0.75, -Math.PI * 0.25); ctx.stroke();
        }
        ctx.restore();
      } else if (id === 'rover') {
        // A garage and a pressurised rover with six wheels.
        ctx.beginPath(); ctx.moveTo(-60, 0); ctx.lineTo(-60, -50); ctx.quadraticCurveTo(-30, -70, 0, -50); ctx.lineTo(0, 0); ctx.closePath();
        ctx.fillStyle = '#dfe4ee'; ctx.fill(); ink();
        ctx.fillStyle = '#4b5470'; SA.rrect(ctx, -50, -38, 40, 38, 6); ctx.fill();
        ctx.fillStyle = '#eef1f8'; SA.rrect(ctx, 4, -40, 60, 26, 10); ctx.fill(); ink();
        ctx.fillStyle = night ? '#ffe9a0' : '#7fb8f0'; SA.rrect(ctx, 40, -36, 18, 12, 4); ctx.fill();
        for (const wx of [12, 34, 56]) { ctx.fillStyle = '#2d3247'; SA.circle(ctx, wx, -8, 8); ctx.fill(); ctx.fillStyle = '#9aa3bf'; SA.circle(ctx, wx, -8, 3); ctx.fill(); }
      } else if (id === 'shield') {
        // A shelter tucked under a thick blanket of Mars soil.
        ctx.beginPath(); ctx.moveTo(-62, 0); ctx.quadraticCurveTo(-56, -78, 0, -80); ctx.quadraticCurveTo(56, -78, 62, 0); ctx.closePath();
        const sg = ctx.createLinearGradient(0, -80, 0, 0); sg.addColorStop(0, '#d9784a'); sg.addColorStop(1, '#9c4026');
        ctx.fillStyle = sg; ctx.fill(); ink('#7a3020', 3);
        ctx.fillStyle = 'rgba(255,200,160,0.35)';
        for (const [rx, ry] of [[-30, -40], [10, -60], [30, -24], [-12, -18]]) { SA.circle(ctx, rx, ry, 5); ctx.fill(); }
        ctx.fillStyle = '#dfe4ee'; ctx.beginPath(); ctx.arc(0, 0, 20, Math.PI, TAU); ctx.closePath(); ctx.fill(); ink();
        ctx.fillStyle = night ? '#ffe9a0' : '#4b5470'; ctx.beginPath(); ctx.arc(0, 0, 12, Math.PI, TAU); ctx.closePath(); ctx.fill();
      } else if (id === 'lab') {
        // A science lab: a white module with a big window (a microscope inside) and a sample shelf.
        SA.rrect(ctx, -54, -62, 108, 62, 10);
        const lg = ctx.createLinearGradient(-54, 0, 54, 0); lg.addColorStop(0, '#ffffff'); lg.addColorStop(1, '#cdd4e4');
        ctx.fillStyle = lg; ctx.fill(); ink();
        ctx.beginPath(); ctx.arc(-18, -62, 22, Math.PI, TAU); ctx.closePath();
        ctx.fillStyle = 'rgba(160,220,255,0.55)'; ctx.fill(); ink('#6b7189', 2);
        ctx.fillStyle = night ? '#ffe9a0' : '#7fb8f0'; SA.rrect(ctx, -44, -48, 46, 30, 6); ctx.fill(); ink('#6b7189', 2);
        // The microscope in the window.
        ctx.strokeStyle = '#3b3f58'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-30, -22); ctx.lineTo(-14, -22); ctx.moveTo(-22, -22); ctx.lineTo(-22, -30); ctx.lineTo(-16, -42); ctx.stroke();
        ctx.fillStyle = '#3b3f58'; SA.circle(ctx, -15, -44, 3); ctx.fill();
        ctx.lineCap = 'butt';
        ctx.fillStyle = '#ff5d6c'; SA.rrect(ctx, 10, -54, 36, 14, 4); ctx.fill();
        SA.label(ctx, 'LAB', 28, -47, 11, '#fff', { stroke: false });
        // Rock samples on a little shelf, one gently glowing.
        ctx.fillStyle = '#9aa3bf'; ctx.fillRect(10, -26, 38, 4);
        ['#a9472b', '#6b5a50', '#c9643d'].forEach((c, i) => { ctx.fillStyle = c; SA.ellipse(ctx, 16 + i * 13, -31, 5, 4); ctx.fill(); });
        ctx.fillStyle = 'rgba(126,224,138,' + (0.35 + 0.25 * Math.sin(t * 3)) + ')'; SA.circle(ctx, 29, -31, 8); ctx.fill();
        ctx.fillStyle = '#9aa3bf'; SA.rrect(ctx, 14, -18, 22, 18, 5); ctx.fill(); ink('#6b7189', 2);
      } else if (id === 'pad') {
        // A launch pad: a round landing pad with lights, and the rocket home standing on it.
        ctx.fillStyle = '#7d8299'; SA.ellipse(ctx, 0, -4, 58, 14); ctx.fill();
        ctx.fillStyle = '#b5bbcf'; SA.ellipse(ctx, 0, -8, 54, 12); ctx.fill(); ink('#6b7189', 2);
        ctx.strokeStyle = '#ffd84d'; ctx.lineWidth = 3; SA.ellipse(ctx, 0, -8, 30, 6.5); ctx.stroke();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * TAU, on = (Math.floor(t * 3) + i) % 3 === 0;
          ctx.fillStyle = on ? '#fff3a0' : '#e0a31a';
          SA.circle(ctx, Math.cos(a) * 46, -8 + Math.sin(a) * 10, 3); ctx.fill();
        }
        if (!(this.hop && this.hop.i === slot && !this.hop.landed)) drawMarsRocket(ctx, 0, -10, 1, 0);
      }
      ctx.restore();
    }

    // Where the launch pad's rocket is (its base), while flying home and while a new one lands.
    hopY(p, t) {
      const base = p.y - 10 * p.s, far = p.y + 260;
      if (t < 3) return base - Math.pow(t / 3, 2) * far;
      if (t < 7.5) return -999;
      if (t < 10.5) return base - Math.pow(1 - (t - 7.5) / 3, 2) * far;
      return base;
    }

    // The science lab's microscope view: a round lens above the lab showing the sample.
    drawScope(ctx, t) {
      const sc = this.scope, p = this.plots[sc.i];
      const k = SA.easeBack(SA.clamp(sc.t * 3, 0, 1)) * (sc.t > 8.6 ? Math.max(0, (9 - sc.t) / 0.4) : 1);
      if (k <= 0) return;
      const r = 66 * k, x = SA.clamp(p.x, 90, this.trayX - 90), y = Math.max(this.trayTop + 150, p.y - 150 * p.s);
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 3; ctx.setLineDash([5, 6]);
      ctx.beginPath(); ctx.moveTo(p.x, p.y - 60 * p.s); ctx.lineTo(x, y + r); ctx.stroke(); ctx.setLineDash([]);
      ctx.save();
      SA.circle(ctx, x, y, r); ctx.fillStyle = '#e8c9a0'; ctx.fill(); ctx.clip();
      const rnd = SA.seeded(5 + sc.k);
      if (sc.k === 0) {
        // Hematite "blueberries": little dark grey balls in pale rock.
        for (let i = 0; i < 14; i++) {
          const bx = x + (rnd() - 0.5) * r * 1.8, by = y + (rnd() - 0.5) * r * 1.8, br = r * (0.08 + rnd() * 0.07);
          ctx.fillStyle = '#4d4f66'; SA.circle(ctx, bx, by, br); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.4)'; SA.circle(ctx, bx - br * 0.3, by - br * 0.3, br * 0.3); ctx.fill();
        }
      } else if (sc.k === 1) {
        // Lake-bottom layers.
        const cols = ['#c98a5e', '#b3704a', '#d9a274', '#9c5a3c', '#e0b386'];
        for (let i = -6; i < 7; i++) {
          ctx.fillStyle = cols[(i + 12) % cols.length];
          ctx.beginPath();
          for (let xx = -r; xx <= r; xx += 8) ctx.lineTo(x + xx, y + i * r * 0.16 + Math.sin(xx * 0.05 + i) * 3);
          ctx.lineTo(x + r, y + r); ctx.lineTo(x - r, y + r); ctx.closePath(); ctx.fill();
        }
      } else if (sc.k === 2) {
        // A sample tube with a rock core inside.
        ctx.save(); ctx.translate(x, y); ctx.rotate(-0.5);
        ctx.fillStyle = '#d7dbe6'; SA.rrect(ctx, -r * 0.8, -r * 0.22, r * 1.6, r * 0.44, r * 0.2); ctx.fill();
        ctx.strokeStyle = '#8a93a8'; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = '#a9583a'; SA.rrect(ctx, -r * 0.55, -r * 0.13, r * 0.9, r * 0.26, r * 0.1); ctx.fill();
        ctx.fillStyle = '#6b7189'; SA.rrect(ctx, r * 0.5, -r * 0.24, r * 0.25, r * 0.48, 4); ctx.fill();
        ctx.restore();
      } else {
        // A mystery: is anything alive? Sparkly question mark.
        SA.label(ctx, '?', x, y + 4, r * 1.1, '#5b3fc4', { stroke: '#fff' });
        for (let i = 0; i < 5; i++) { const a = t * 1.5 + i * 1.26; ctx.fillStyle = '#ffe066'; SA.starPath(ctx, x + Math.cos(a) * r * 0.65, y + Math.sin(a) * r * 0.65, 6, 0.45, 5, t); ctx.fill(); }
      }
      ctx.restore();
      ctx.strokeStyle = '#3b3f58'; ctx.lineWidth = 8; SA.circle(ctx, x, y, r); ctx.stroke();
      ctx.strokeStyle = '#9aa3bf'; ctx.lineWidth = 3; SA.circle(ctx, x, y, r - 5); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; SA.ellipse(ctx, x - r * 0.35, y - r * 0.45, r * 0.3, r * 0.12, -0.6); ctx.fill();
      SA.label(ctx, '🔬 Microscope', x, y - r - 16, 16, '#fff');
    }

    drawTray(ctx, t) {
      const W = SA.W, H = SA.H, x0 = this.trayX;
      ctx.fillStyle = 'rgba(20,12,50,0.55)';
      SA.rrect(ctx, x0 - 6, this.trayTop, W - x0 + 20, H - this.trayTop + 20, 22); ctx.fill();
      SA.label(ctx, 'Parts', x0 + (W - x0) / 2, this.trayTop + 24, 20, '#fff3c4');
      const used = SA.state.marsBase.p;
      for (const c of this.cells) {
        const on = used.indexOf(c.id) >= 0;
        ctx.fillStyle = on ? 'rgba(126,224,138,0.25)' : 'rgba(255,255,255,0.14)';
        SA.circle(ctx, c.x, c.y, c.r); ctx.fill();
        ctx.strokeStyle = on ? 'rgba(126,224,138,0.9)' : 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2.5; ctx.stroke();
        const s = (c.r / 70);
        ctx.globalAlpha = this.drag && this.drag.id === c.id && this.drag.moved ? 0.35 : 1;
        this.drawPart(ctx, c.id, c.x, c.y + c.r * 0.45, s * 0.85, t, -1);
        ctx.globalAlpha = 1;
        SA.label(ctx, partOf(c.id).name, c.x, c.y + c.r * 0.82, Math.max(11, Math.min(14, c.r * 0.28)), '#fff');
        if (on) { ctx.fillStyle = '#3fbf5a'; SA.circle(ctx, c.x + c.r * 0.72, c.y - c.r * 0.72, 9); ctx.fill(); SA.label(ctx, '✓', c.x + c.r * 0.72, c.y - c.r * 0.72, 12, '#fff', { stroke: false }); }
      }
    }

    // The six needs along the top: each lights up when a part gives the astronauts that thing.
    drawBadges(ctx, t) {
      const met = this.needsMet();
      const b0 = this.badges[0], bl = this.badges[this.badges.length - 1];
      ctx.fillStyle = 'rgba(20,12,50,0.45)';
      SA.rrect(ctx, b0.x - 34, b0.y - 32, bl.x - b0.x + 68, 80, 20); ctx.fill();
      NEEDS.forEach((n, i) => {
        const b = this.badges[i], on = met.indexOf(n[0]) >= 0;
        if (on) { ctx.fillStyle = 'rgba(126,224,138,0.35)'; SA.circle(ctx, b.x, b.y, 28); ctx.fill(); }
        ctx.fillStyle = on ? '#eaffef' : 'rgba(255,255,255,0.25)';
        SA.circle(ctx, b.x, b.y, 22); ctx.fill();
        ctx.strokeStyle = on ? '#3fbf5a' : 'rgba(255,255,255,0.5)'; ctx.lineWidth = 3; ctx.stroke();
        ctx.globalAlpha = on ? 1 : 0.45;
        SA.emoji(ctx, n[1], b.x, b.y + 1, 24);
        ctx.globalAlpha = 1;
        SA.label(ctx, n[2], b.x, b.y + 34, 13, on ? '#bfffd0' : '#e6e0ff', { weight: 800 });
      });
    }

    drawLander(ctx, L, t) {
      ctx.save();
      ctx.translate(L.x, L.y);
      ctx.strokeStyle = '#6b7189'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-20, -30); ctx.lineTo(-38, 0); ctx.moveTo(20, -30); ctx.lineTo(38, 0); ctx.stroke();
      if (!L.down) {
        const f = ctx.createLinearGradient(0, 0, 0, 50); f.addColorStop(0, 'rgba(255,240,170,0.95)'); f.addColorStop(1, 'rgba(255,120,60,0)');
        ctx.fillStyle = f; ctx.beginPath(); ctx.moveTo(-14, -6); ctx.lineTo(0, 46 + Math.sin(t * 40) * 6); ctx.lineTo(14, -6); ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = '#eef1f8'; ctx.beginPath(); ctx.moveTo(-28, -8); ctx.lineTo(-22, -70); ctx.quadraticCurveTo(0, -96, 22, -70); ctx.lineTo(28, -8); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#6b7189'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = '#7fb8f0'; SA.circle(ctx, 0, -58, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ff5d6c'; ctx.fillRect(-26, -26, 52, 7);
      ctx.restore();
    }

    // A little astronaut in a white suit with a gold visor.
    drawAstronaut(ctx, a, t) {
      const walk = a.wait > 0 ? 0 : Math.sin(t * 8 + a.x * 0.1);
      const hop = a.hi > 0 ? Math.abs(Math.sin(a.hi * 6)) * 16 : 0;
      ctx.save();
      ctx.translate(a.x, a.y - hop);
      ctx.scale(a.dir * 1.35, 1.35);
      ctx.fillStyle = '#d8dde8';
      SA.rrect(ctx, -6 + walk * 3, -16, 6, 16, 3); ctx.fill();
      SA.rrect(ctx, 1 - walk * 3, -16, 6, 16, 3); ctx.fill();
      ctx.fillStyle = a.suit; SA.rrect(ctx, -11, -40, 22, 28, 8); ctx.fill();
      ctx.strokeStyle = '#8a93a8'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#c9d0e0'; SA.rrect(ctx, -16, -38, 6, 20, 3); ctx.fill();
      ctx.fillStyle = a.suit; SA.circle(ctx, 1, -50, 12); ctx.fill(); ctx.stroke();
      const v = ctx.createLinearGradient(-6, -56, 10, -44); v.addColorStop(0, '#ffe680'); v.addColorStop(1, '#d99a12');
      ctx.fillStyle = v; SA.ellipse(ctx, 4, -50, 8, 6); ctx.fill();
      ctx.fillStyle = '#ff5d6c'; ctx.fillRect(-4, -34, 6, 4);
      if (a.hi > 0) { ctx.fillStyle = a.suit; ctx.save(); ctx.translate(10, -38); ctx.rotate(-1.2 + Math.sin(t * 10) * 0.3); SA.rrect(ctx, 0, -3, 14, 6, 3); ctx.fill(); ctx.restore(); }
      ctx.restore();
    }
  }

  // The little rocket that flies between Mars and Earth (base at x, y; about 70 tall at s = 1).
  function drawMarsRocket(ctx, x, y, s, flame) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    if (flame > 0) {
      const f = ctx.createLinearGradient(0, 0, 0, 44 * flame);
      f.addColorStop(0, 'rgba(255,240,170,0.95)'); f.addColorStop(1, 'rgba(255,120,60,0)');
      ctx.fillStyle = f; ctx.beginPath(); ctx.moveTo(-9, -2); ctx.lineTo(0, 44 * flame); ctx.lineTo(9, -2); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#ff5d6c';
    ctx.beginPath(); ctx.moveTo(-12, -20); ctx.lineTo(-22, 0); ctx.lineTo(-10, -4); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(12, -20); ctx.lineTo(22, 0); ctx.lineTo(10, -4); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-12, -4); ctx.lineTo(-12, -50); ctx.quadraticCurveTo(0, -78, 12, -50); ctx.lineTo(12, -4); ctx.closePath();
    const g = ctx.createLinearGradient(-12, 0, 12, 0); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#c9d0e0');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = '#6b7189'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = '#7fb8f0'; SA.circle(ctx, 0, -40, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff5d6c'; ctx.fillRect(-12, -22, 24, 5);
    ctx.restore();
  }

  // Mixes two #rrggbb colours (k from 0 to 1).
  function mix(a, b, k) {
    const p = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
    const A = p(a), B = p(b);
    return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',') + ')';
  }

  SA.MarsBaseScene = MarsBaseScene;
})(window.SA);
