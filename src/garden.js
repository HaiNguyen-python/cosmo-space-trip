// Cosmo's Greenhouse (from the glass greenhouse at the Space Base, or its 🌱 button). Plant a seed in
// one of three pots and water it. Each DAY it is watered it grows one step (two in Little Explorer
// mode): sprout, leaves, bud, bloom. A plant in bloom can be picked, and it becomes a sticker for
// the base. Three plants are real ones astronauts have grown in space; two are Cosmo's pretend
// plants from home (and he says so). Nothing ever wilts or dies: a plant just waits for its water.
(function (SA) {
  const TAU = Math.PI * 2;
  const $ = id => document.getElementById(id);
  const PLANTS = [
    { k: 'lettuce', name: 'Space Lettuce', real: true, leaf: '#6cc957', bloom: '#c4405e',
      fact: 'Astronauts on the space station grew red lettuce, and in 2015 they got to eat some! 🥬' },
    { k: 'zinnia', name: 'Zinnia', real: true, leaf: '#4fa84a', bloom: '#ff7a3d',
      fact: 'In 2016, a zinnia flower bloomed on the space station. It was one of the first flowers to bloom in space! 🌼' },
    { k: 'tomato', name: 'Space Tomato', real: true, leaf: '#3f9e48', bloom: '#e8352f',
      fact: 'Astronauts have grown little tomatoes on the space station, under special lights! 🍅' },
    { k: 'shroom', name: 'Glow-shroom', real: false, leaf: '#8fd6c8', bloom: '#5ff0e0',
      fact: 'This one is a pretend space mushroom from my home planet. It glows in the dark! ✨' },
    { k: 'tulip', name: 'Twinkle Tulip', real: false, leaf: '#5cbf8a', bloom: '#b48cff',
      fact: 'This is a pretend plant from my home planet. Its petals twinkle like little stars! ✨' },
  ];
  const PLANT = {};
  for (const p of PLANTS) PLANT[p.k] = p;
  SA.GARDEN_PLANTS = PLANTS;
  const FACTS = [
    'Plants need water, light and air to grow, even in space! 🌱',
    'In space, water doesn\'t pour down. Space gardens use little pillows of soil that soak up water.',
    'On the space station, plants grow under pink and purple lights. Red and blue light are the colours plants use the most!',
    'Plants make oxygen, the part of the air we breathe. One day they could help astronauts on long trips!',
    'In 2019, a cotton seed sprouted inside a little lander on the far side of the Moon! 🌱',
  ];
  const STAGE_NAMES = ['a seed', 'a sprout', 'leafy', 'a bud', 'in bloom'];

  // How grown a pot's plant is (0 seed .. 4 bloom): one step per day watered, two for Little Explorers.
  SA.potStage = p => (p ? Math.min(4, p.n * (SA.easy() ? 2 : 1)) : 0);
  // True if any planted pot still wants water today (the base shows a little drop).
  SA.gardenThirsty = () => SA.state.garden.pots.some(p => p && SA.potStage(p) < 4 && p.d !== SA.dayKey());
  SA.gardenBloom = () => SA.state.garden.pots.some(p => p && SA.potStage(p) >= 4);

  class GardenScene {
    constructor() {
      this.stars = new SA.Starfield(120, 4242);
      this.fx = new SA.Particles();
      this.t = 0;
      this.lamp = true;
    }

    layout() {
      const W = SA.W, H = SA.H;
      this.bench = H * 0.74;
      this.pots = [0.3, 0.5, 0.7].map(u => ({ x: W * u, y: this.bench }));
      this.canHome = { x: W * 0.91, y: H * 0.93 - 28 };   // on the floor at the right
      if (!this.can || !this.can.busy) this.can = { x: this.canHome.x, y: this.canHome.y, tilt: 0, busy: null };
      this.lampY = H * 0.17;
    }
    resize() { this.layout(); }

    enter() {
      SA.ui.setScene('toy');
      SA.audio.music('garden');
      this.can = null;
      this.layout();
      this.choosing = -1;
      this.wiggle = [0, 0, 0];
      this.factI = Math.floor(Math.random() * FACTS.length);
      $('btnToyBack').textContent = '🏠 Base';
      $('toyPick').innerHTML = '';
      this.updateInfo();
      // A found critter or two comes along to watch.
      const found = SA.CRITTERS.filter(c => SA.state.critters[c.id]);
      this.pals = found.sort(() => Math.random() - 0.5).slice(0, 2).map((c, i) => ({ c, x: i ? 0.18 : 0.82, seed: i * 3.1, hop: 0 }));
      if (!SA.state.gardenSeen) {
        SA.ui.say([
          'Welcome to my greenhouse! 🌱 Let\'s grow some space plants!',
          'Tap a pot to plant a seed. Then give it water with the watering can! 💧',
          'Plants grow a little more each day you water them' + (SA.easy() ? ' (twice as fast for Little Explorers!)' : '') + '. Come back tomorrow to see how big they get! 🌙',
        ]).then(() => { SA.state.gardenSeen = true; SA.save(); });
      } else {
        const st = SA.state.garden.pots;
        SA.ui.hint(SA.gardenBloom() ? 'Something is in bloom! Tap it to pick it! 🌸'
          : SA.gardenThirsty() ? 'Good to see you! Your plants are thirsty. Time for some water! 💧'
          : st.some(p => p) ? 'Your plants are growing nicely! 🌱 Tap a pot to plant more, or come back tomorrow.'
          : 'Tap a pot to plant a seed! 🌱', 5);
      }
    }

    exit() { SA.ui.hideTalk(); this.choosing = -1; }
    back() { SA.go(SA.base, {}); }

    updateInfo() {
      const n = PLANTS.filter(p => SA.state.garden.grown[p.k]).length;
      SA.ui.setInfo('🌱 Grown ' + n + ' / ' + PLANTS.length);
    }

    // ---------- Seed packets ----------
    packetRect(i) {
      const W = SA.W, H = SA.H, n = PLANTS.length, w = Math.min(150, (W * 0.8) / n - 12), h = w * 1.2;
      const x0 = W / 2 - (n * (w + 12) - 12) / 2;
      return { x: x0 + i * (w + 12), y: H * 0.26, w, h };
    }

    // ---------- Input ----------
    onDown(x, y) {
      if (this.can.busy) return;
      if (this.choosing >= 0) {
        for (let i = 0; i < PLANTS.length; i++) {
          const r = this.packetRect(i);
          if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) { this.plant(this.choosing, PLANTS[i]); return; }
        }
        this.choosing = -1;
        SA.audio.play('click');
        return;
      }
      // Pick up the watering can.
      if (Math.hypot(x - this.can.x, y - this.can.y) < 56) { this.drag = { ox: this.can.x - x, oy: this.can.y - y, pour: -1, pt: 0 }; SA.audio.play('blip'); return; }
      // The grow lamp.
      if (y < this.lampY + 30 && y > this.lampY - 40 && Math.abs(x - SA.W / 2) < SA.W * 0.3) {
        this.lamp = !this.lamp;
        SA.audio.play('click');
        SA.ui.hint(this.lamp ? 'Grow lights on! 💡 ' + FACTS[2] : 'Grow lights off. Plants need light to grow, so let\'s not leave them off for long! 🌙', 6);
        return;
      }
      for (const pal of this.pals) {
        const px = pal.x * SA.W, py = this.bench - 30;
        if (Math.hypot(x - px, y - py) < 40) { pal.hop = 1; SA.audio.play('squeak'); SA.ui.hint(pal.c.name + ' loves watching plants grow! 🐾', 3); return; }
      }
      const i = this.potAt(x, y);
      if (i >= 0) this.tapPot(i);
    }

    onMove(x, y) {
      const d = this.drag;
      if (!d) return;
      this.can.x = x + d.ox;
      this.can.y = y + d.oy;
      // Held over a thirsty plant, the can tips and pours.
      const i = this.potAt(this.can.x - 50, this.can.y + 90);
      const p = i >= 0 ? SA.state.garden.pots[i] : null;
      d.pour = p && this.thirsty(p) ? i : -1;
    }

    onUp() {
      const d = this.drag;
      if (!d) return;
      this.drag = null;
      this.can.busy = { kind: 'home', t: 0, fx: this.can.x, fy: this.can.y };
    }

    potAt(x, y) {
      for (let i = 0; i < 3; i++) {
        const p = this.pots[i];
        if (Math.abs(x - p.x) < 70 && y < p.y + 40 && y > p.y - 240) return i;
      }
      return -1;
    }
    thirsty(p) { return p && SA.potStage(p) < 4 && p.d !== SA.dayKey(); }

    tapPot(i) {
      const p = SA.state.garden.pots[i];
      this.wiggle[i] = 1;
      if (!p) {
        this.choosing = i;
        SA.audio.play('pop');
        SA.ui.hint('Pick a seed to plant! 🌱', 4);
        return;
      }
      const pl = PLANT[p.k], st = SA.potStage(p);
      if (st >= 4) { this.pick(i); return; }
      if (this.thirsty(p)) {
        // A tap waters it too: the can flies over by itself.
        this.can.busy = { kind: 'auto', t: 0, pot: i, fx: this.can.x, fy: this.can.y };
        return;
      }
      SA.audio.play('boing');
      this.factI = (this.factI + 1) % FACTS.length;
      SA.ui.hint('Your ' + pl.name + ' is ' + STAGE_NAMES[st] + ' and has had its water today. Come back tomorrow to see it grow! 🌙 ' + FACTS[this.factI], 7);
    }

    plant(i, pl) {
      SA.state.garden.pots[i] = { k: pl.k, n: 0, d: '' };
      SA.save();
      this.choosing = -1;
      this.wiggle[i] = 1;
      SA.audio.play('collect');
      const p = this.pots[i];
      this.fx.spawn('sparkle', p.x, p.y - 40, 10, { color: '#c8ffb0' });
      SA.ui.hint('You planted a ' + pl.name + ' seed! ' + pl.fact + ' Now give it some water! 💧', 0);
    }

    water(i) {
      const p = SA.state.garden.pots[i];
      if (!this.thirsty(p)) return;
      const before = SA.potStage(p);
      p.n = Math.min(4, p.n + 1);
      p.d = SA.dayKey();
      SA.save();
      const st = SA.potStage(p), pot = this.pots[i], pl = PLANT[p.k];
      this.wiggle[i] = 1;
      SA.audio.play('collect');
      this.fx.spawn('sparkle', pot.x, pot.y - 60 - st * 22, SA.calm() ? 8 : 16, { color: pl.bloom });
      if (st >= 4) {
        setTimeout(() => SA.audio.play('cheer'), 200);
        SA.celebrate(50);
        this.fx.text(pot.x, pot.y - 200, 'It bloomed! 🌸', '#fff3a0');
        SA.ui.hint('WOW! Your ' + pl.name + ' is in full bloom! Tap it to pick it for my Space Base! 🌸', 0);
      } else {
        this.fx.text(pot.x, pot.y - 120 - st * 20, before === 0 ? 'A sprout! 🌱' : 'It grew! 🌿', '#d8ffc8');
        SA.ui.hint((before === 0 ? 'Look, a little sprout! 🌱 ' : 'Slurp! It grew a bit more! 🌿 ') + 'That\'s enough water for today. Come back tomorrow to water it again! 🌙', 6);
      }
    }

    pick(i) {
      const p = SA.state.garden.pots[i], pl = PLANT[p.k], pot = this.pots[i];
      const first = !SA.state.garden.grown[pl.k];
      SA.state.garden.grown[pl.k] = true;
      SA.state.garden.pots[i] = null;
      if (first) SA.state.baseNew = true;
      SA.save();
      this.updateInfo();
      SA.ui.bumpInfo();
      SA.audio.play('card');
      SA.celebrate(first ? 80 : 40);
      this.fx.spawn('sparkle', pot.x, pot.y - 120, SA.calm() ? 10 : 24, { color: pl.bloom });
      SA.ui.say(first
        ? ['You grew a ' + pl.name + '! 🎉 It\'s a sticker for my Space Base now!', pl.real ? 'Real astronauts grow plants like this in space. You\'re a space gardener! 🧑‍🚀' : 'Tap a pot to plant another seed whenever you like! 🌱']
        : ['Another ' + pl.name + '! 🎉 You\'re a super space gardener! Plant another seed whenever you like! 🌱']);
    }

    // ---------- Update ----------
    update(dt) {
      this.t += dt;
      this.fx.update(dt);
      for (let i = 0; i < 3; i++) this.wiggle[i] = Math.max(0, this.wiggle[i] - dt * 1.6);
      for (const pal of this.pals) pal.hop = Math.max(0, pal.hop - dt * 1.8);
      const c = this.can, b = c.busy;
      if (this.drag) {
        const d = this.drag;
        c.tilt = SA.lerp(c.tilt, d.pour >= 0 ? -0.75 : 0, Math.min(1, dt * 8));
        if (d.pour >= 0) {
          d.pt += dt;
          this.pourFx(dt);
          if (d.pt > 0.7) { this.water(d.pour); d.pour = -1; d.pt = 0; }
        } else d.pt = 0;
      } else if (b) {
        b.t += dt;
        if (b.kind === 'home') {
          const u = SA.easeOut(Math.min(1, b.t / 0.4));
          c.x = SA.lerp(b.fx, this.canHome.x, u); c.y = SA.lerp(b.fy, this.canHome.y, u);
          c.tilt = SA.lerp(c.tilt, 0, Math.min(1, dt * 8));
          if (u >= 1) c.busy = null;
        } else if (b.kind === 'auto') {
          const pot = this.pots[b.pot], tx = pot.x + 50, ty = pot.y - 170;
          if (b.t < 0.5) {
            const u = SA.easeInOut(b.t / 0.5);
            c.x = SA.lerp(b.fx, tx, u); c.y = SA.lerp(b.fy, ty, u) - Math.sin(u * Math.PI) * 40;
          } else if (b.t < 1.4) {
            c.tilt = SA.lerp(c.tilt, -0.75, Math.min(1, dt * 8));
            this.pourFx(dt);
          } else if (!b.watered) {
            b.watered = true;
            this.water(b.pot);
            c.busy = { kind: 'home', t: 0, fx: c.x, fy: c.y };
          }
        }
      }
    }

    pourFx(dt) {
      const c = this.can;
      if (Math.random() < dt * 30) {
        this.fx.list.push({ kind: 'dot', x: c.x - 54, y: c.y - 10, vx: SA.rand(-30, -10), vy: SA.rand(40, 90), life: 0, max: 0.8, size: SA.rand(2.5, 4.5), rot: 0, color: 'rgba(120,200,255,0.85)' });
        if (Math.random() < 0.08) SA.audio.play('pour');
      }
    }

    // ---------- Drawing ----------
    draw(ctx) {
      const W = SA.W, H = SA.H, t = this.t;
      // Night sky outside the glass.
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#120d38');
      sky.addColorStop(1, '#3a2266');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);
      this.stars.draw(ctx, t, 0);
      SA.drawBody(ctx, 'earth', W * 0.84, H * 0.3, 26, { t, lx: -0.8, ly: -0.3 });
      // Grow lights: a pink-purple glow over everything.
      if (this.lamp) {
        const lg = ctx.createLinearGradient(0, this.lampY, 0, H * 0.85);
        lg.addColorStop(0, 'rgba(255,90,200,0.32)');
        lg.addColorStop(1, 'rgba(160,80,255,0.05)');
        ctx.fillStyle = lg;
        ctx.fillRect(0, this.lampY, W, H * 0.85 - this.lampY);
      }
      // Glass panes and the frame of the greenhouse.
      ctx.fillStyle = 'rgba(190,230,255,0.07)';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(220,235,255,0.35)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(W * 0.04, H); ctx.lineTo(W * 0.04, H * 0.3); ctx.quadraticCurveTo(W * 0.5, -H * 0.22, W * 0.96, H * 0.3); ctx.lineTo(W * 0.96, H);
      for (const u of [0.25, 0.5, 0.75]) { ctx.moveTo(W * u, H); ctx.lineTo(W * u, H * (0.3 - Math.sin(u * Math.PI) * 0.26)); }
      ctx.moveTo(W * 0.04, H * 0.55); ctx.lineTo(W * 0.96, H * 0.55);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 10;
      ctx.beginPath(); ctx.moveTo(W * 0.1, H * 0.5); ctx.lineTo(W * 0.18, H * 0.36); ctx.stroke();
      // The lamp bar.
      ctx.fillStyle = '#4b4380';
      SA.rrect(ctx, W * 0.22, this.lampY - 12, W * 0.56, 22, 11); ctx.fill();
      ctx.fillStyle = this.lamp ? '#ff8ae0' : '#8a84b8';
      for (let i = 0; i < 10; i++) { SA.circle(ctx, W * 0.25 + i * W * 0.055, this.lampY, 6); ctx.fill(); }
      if (this.lamp) {
        ctx.fillStyle = 'rgba(255,150,230,0.35)';
        for (let i = 0; i < 10; i++) { SA.circle(ctx, W * 0.25 + i * W * 0.055, this.lampY, 12); ctx.fill(); }
      }
      // The bench.
      ctx.fillStyle = '#7a5a8f';
      SA.rrect(ctx, W * 0.14, this.bench, W * 0.72, 22, 8); ctx.fill();
      ctx.fillStyle = '#5b4370';
      ctx.fillRect(W * 0.18, this.bench + 22, 14, H - this.bench);
      ctx.fillRect(W * 0.82 - 14, this.bench + 22, 14, H - this.bench);
      ctx.fillStyle = '#2a1d4a';
      ctx.fillRect(0, H * 0.93, W, H * 0.07);
      // Critter pals watching.
      for (const pal of this.pals) {
        const px = pal.x * W, hop = Math.sin(pal.hop * Math.PI) * 30;
        SA.drawCritter(ctx, px, this.bench - 26 - hop, 0.75, pal.c, { t, seed: pal.seed, mood: pal.hop > 0 ? 'joy' : null });
      }
      for (let i = 0; i < 3; i++) this.drawPot(ctx, i, t);
      this.drawCan(ctx, t);
      this.fx.draw(ctx);
      if (this.choosing >= 0) this.drawPackets(ctx, t);
    }

    drawPot(ctx, i, t) {
      const pot = this.pots[i], p = SA.state.garden.pots[i], x = pot.x, y = pot.y;
      const w = Math.sin(this.wiggle[i] * Math.PI * 4) * 0.08 * this.wiggle[i];
      // The plant.
      if (p) {
        ctx.save();
        ctx.translate(x, y - 50);
        ctx.rotate(w + Math.sin(t * 1.3 + i) * 0.03);
        this.drawPlant(ctx, PLANT[p.k], SA.potStage(p), t, 1.4);
        ctx.restore();
      }
      // A round pot.
      const g = ctx.createLinearGradient(x - 46, 0, x + 46, 0);
      g.addColorStop(0, '#ff9a6a'); g.addColorStop(0.6, '#e2683d'); g.addColorStop(1, '#a8452a');
      ctx.fillStyle = g;
      ctx.strokeStyle = '#7a2f1c';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x - 42, y - 48); ctx.lineTo(x + 42, y - 48); ctx.lineTo(x + 32, y); ctx.lineTo(x - 32, y); ctx.closePath(); ctx.fill(); ctx.stroke();
      SA.rrect(ctx, x - 48, y - 60, 96, 16, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#4a2f24';
      SA.ellipse(ctx, x, y - 58, 40, 5); ctx.fill();
      // What it needs.
      let tag = 'Tap to plant', col = '#e8e0ff';
      if (p) {
        const st = SA.potStage(p);
        if (st >= 4) { tag = '🌸 Tap to pick!'; col = '#fff3a0'; }
        else if (this.thirsty(p)) { tag = '💧 Thirsty!'; col = '#a8dcff'; }
        else { tag = '🌙 Grows tomorrow'; col = '#d8ccff'; }
      }
      SA.pill(ctx, tag, x, y + 40, 15, { color: col });
      if (p && this.thirsty(p)) {
        const bob = Math.abs(Math.sin(t * 3)) * 6;
        ctx.fillStyle = '#7fc8ff';
        ctx.beginPath(); ctx.moveTo(x + 48, y - 96 - bob); ctx.quadraticCurveTo(x + 60, y - 78 - bob, x + 48, y - 74 - bob); ctx.quadraticCurveTo(x + 36, y - 78 - bob, x + 48, y - 96 - bob); ctx.fill();
      }
      if (!p) {
        ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 3 + i);
        SA.label(ctx, '+', x, y - 92, 40, '#e8ffe0');
        ctx.globalAlpha = 1;
      }
    }

    // A plant at a stage (0 seed .. 4 bloom), growing up from (0, 0). s scales it.
    drawPlant(ctx, pl, st, t, s) {
      ctx.save();
      ctx.scale(s, s);
      ctx.lineCap = 'round';
      if (st === 0) {
        ctx.fillStyle = '#c9a26b';
        SA.ellipse(ctx, 0, -10, 6, 4); ctx.fill();
        ctx.restore();
        return;
      }
      const h = [0, 24, 58, 92, 110][st];
      const leaf = (x, y, a, len, col) => {
        ctx.save(); ctx.translate(x, y); ctx.rotate(a);
        ctx.fillStyle = col || pl.leaf; ctx.strokeStyle = SA.shade(col || pl.leaf, -60); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * 0.5, -len * 0.45, len, 0); ctx.quadraticCurveTo(len * 0.5, len * 0.45, 0, 0); ctx.fill(); ctx.stroke();
        ctx.restore();
      };
      if (pl.k === 'lettuce') {
        // A frilly rosette that gets bigger, red-edged when grown.
        const n = 3 + st * 2, len = 14 + st * 9;
        for (let i = 0; i < n; i++) {
          const a = -Math.PI / 2 + (i / (n - 1) - 0.5) * 2.6;
          leaf(0, -6, a, len * (0.8 + (i % 2) * 0.25), st >= 3 && i % 2 ? pl.bloom : pl.leaf);
        }
        ctx.restore();
        return;
      }
      if (pl.k === 'shroom') {
        // Stalks that grow tall, with glowing caps at the end.
        for (const [dx, k] of [[-14, 0.7], [0, 1], [14, 0.8]].slice(0, st >= 2 ? 3 : 1)) {
          const hh = h * k;
          ctx.strokeStyle = '#eaf6f4'; ctx.lineWidth = 6;
          ctx.beginPath(); ctx.moveTo(dx, 0); ctx.quadraticCurveTo(dx + 4, -hh * 0.5, dx, -hh); ctx.stroke();
          const cr = st >= 4 ? 18 * k + 4 : st >= 3 ? 12 * k : 7;
          if (st >= 4) {
            const gl = ctx.createRadialGradient(dx, -hh, 2, dx, -hh, cr * 2.4);
            gl.addColorStop(0, 'rgba(95,240,224,' + (0.55 + 0.25 * Math.sin(t * 3 + dx)) + ')');
            gl.addColorStop(1, 'rgba(95,240,224,0)');
            ctx.fillStyle = gl; SA.circle(ctx, dx, -hh, cr * 2.4); ctx.fill();
          }
          ctx.fillStyle = st >= 3 ? pl.bloom : '#bfe8e2';
          ctx.beginPath(); ctx.ellipse(dx, -hh, cr, cr * 0.7, 0, Math.PI, TAU); ctx.closePath(); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          SA.circle(ctx, dx - cr * 0.3, -hh - cr * 0.35, cr * 0.15); ctx.fill();
        }
        ctx.restore();
        return;
      }
      // Stem with leaves (zinnia, tomato, tulip).
      ctx.strokeStyle = SA.shade(pl.leaf, -30); ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-6, -h * 0.5, 0, -h); ctx.stroke();
      const pairs = Math.min(3, st);
      for (let i = 0; i < pairs; i++) {
        const yy = -h * (0.25 + i * 0.25), len = 18 + st * 3;
        leaf(-2, yy, Math.PI + 0.5, len);
        leaf(2, yy - 6, -0.5, len);
      }
      if (st === 3) {
        ctx.fillStyle = SA.shade(pl.bloom, -20);
        SA.ellipse(ctx, 0, -h - 8, 8, 12); ctx.fill();
        ctx.fillStyle = pl.leaf;
        ctx.beginPath(); ctx.moveTo(-8, -h); ctx.lineTo(0, -h - 10); ctx.lineTo(8, -h); ctx.closePath(); ctx.fill();
      }
      if (st >= 4) {
        if (pl.k === 'zinnia') {
          for (let ring = 0; ring < 2; ring++) {
            const n = 12, rr = ring ? 14 : 24;
            ctx.fillStyle = ring ? '#ffb347' : pl.bloom;
            for (let i = 0; i < n; i++) {
              const a = (i / n) * TAU + ring * 0.25;
              SA.ellipse(ctx, Math.cos(a) * rr * 0.6, -h + Math.sin(a) * rr * 0.6, rr * 0.45, rr * 0.2, a); ctx.fill();
            }
          }
          ctx.fillStyle = '#7a3a12'; SA.circle(ctx, 0, -h, 7); ctx.fill();
          ctx.fillStyle = '#ffd84d'; SA.circle(ctx, 0, -h, 3.5); ctx.fill();
        } else if (pl.k === 'tomato') {
          for (const [dx, dy, r] of [[-16, -h * 0.5, 10], [14, -h * 0.62, 11], [-4, -h - 4, 12]]) {
            const g = ctx.createRadialGradient(dx - r * 0.3, dy - r * 0.3, 1, dx, dy, r);
            g.addColorStop(0, '#ff8a7a'); g.addColorStop(1, pl.bloom);
            ctx.fillStyle = g; SA.circle(ctx, dx, dy, r); ctx.fill();
            ctx.fillStyle = '#3f9e48';
            SA.starPath(ctx, dx, dy - r + 1, 4, 0.4, 5, 0); ctx.fill();
          }
        } else if (pl.k === 'tulip') {
          ctx.fillStyle = pl.bloom;
          ctx.strokeStyle = SA.shade(pl.bloom, -70); ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-16, -h - 26); ctx.lineTo(-8, -h - 12); ctx.lineTo(0, -h - 30); ctx.lineTo(8, -h - 12); ctx.lineTo(16, -h - 26);
          ctx.quadraticCurveTo(18, -h + 4, 0, -h + 4); ctx.quadraticCurveTo(-18, -h + 4, -16, -h - 26);
          ctx.closePath(); ctx.fill(); ctx.stroke();
          for (let i = 0; i < 3; i++) {
            const tw = 0.5 + 0.5 * Math.sin(t * 4 + i * 2);
            ctx.fillStyle = 'rgba(255,250,210,' + tw + ')';
            SA.starPath(ctx, -12 + i * 12, -h - 40 - (i % 2) * 8, 4 + tw * 2, 0.35, 4, t); ctx.fill();
          }
        }
      }
      ctx.restore();
    }

    drawCan(ctx, t) {
      const c = this.can;
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.tilt);
      // Spout, body, handle.
      ctx.strokeStyle = '#2f7fd6'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-20, 6); ctx.lineTo(-52, -16); ctx.stroke();
      ctx.fillStyle = '#7fc4ff';
      SA.rrect(ctx, -58, -24, 14, 10, 3); ctx.fill();
      ctx.beginPath(); ctx.arc(8, -26, 18, Math.PI, 0); ctx.stroke();
      const g = ctx.createLinearGradient(-28, 0, 28, 0);
      g.addColorStop(0, '#9fd6ff'); g.addColorStop(0.6, '#4fa3f0'); g.addColorStop(1, '#2a6fc2');
      ctx.fillStyle = g;
      ctx.strokeStyle = '#1d4f8f'; ctx.lineWidth = 3;
      SA.rrect(ctx, -26, -24, 56, 48, 12); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      SA.ellipse(ctx, -12, -10, 5, 10, 0.2); ctx.fill();
      ctx.restore();
      if (!c.busy && !this.drag && this.choosing < 0 && SA.state.garden.pots.some(p => this.thirsty(p))) {
        ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 4);
        SA.label(ctx, 'Drag me!', c.x, c.y - 52, 15, '#cfeaff');
        ctx.globalAlpha = 1;
      }
    }

    drawPackets(ctx, t) {
      const W = SA.W, H = SA.H;
      ctx.fillStyle = 'rgba(10,8,30,0.55)';
      ctx.fillRect(0, 0, W, H);
      SA.label(ctx, 'Pick a seed to plant!', W / 2, H * 0.2, 24, '#fff3c4');
      PLANTS.forEach((pl, i) => {
        const r = this.packetRect(i), pop = 1 + Math.sin(t * 3 + i) * 0.02;
        ctx.save();
        ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
        ctx.scale(pop, pop);
        ctx.translate(-(r.x + r.w / 2), -(r.y + r.h / 2));
        ctx.fillStyle = pl.real ? '#fff6e0' : '#efe4ff';
        ctx.strokeStyle = pl.real ? '#c98b2e' : '#8f5bff';
        ctx.lineWidth = 3;
        SA.rrect(ctx, r.x, r.y, r.w, r.h, 12); ctx.fill(); ctx.stroke();
        ctx.save();
        ctx.translate(r.x + r.w / 2, r.y + r.h * 0.74);
        this.drawPlant(ctx, pl, 4, t, r.w / 170);
        ctx.restore();
        ctx.restore();
        SA.label(ctx, pl.name, r.x + r.w / 2, r.y + r.h + 16, Math.min(16, r.w / 7.5), '#fff');
        SA.label(ctx, pl.real ? 'Grown in space!' : 'Pretend plant', r.x + r.w / 2, r.y + r.h + 36, Math.min(13, r.w / 9), pl.real ? '#ffe08a' : '#d8c8ff', { weight: 700 });
      });
    }
  }
  SA.GardenScene = GardenScene;
})(window.SA);
