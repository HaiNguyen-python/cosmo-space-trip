// Bonus mission: "Space Station Visit" (unlocks after Saturn). Three rooms of the International
// Space Station, where everything floats:
//   1. Kitchen: fling floating snacks to hungry Cosmo (a floating wrench is NOT a snack).
//   2. Cupola: hold a finger down to speed up time and count 16 sunrises in one day.
//   3. Bedroom: drag sleepy, floating Cosmo into a sleeping bag tied to the wall and zip it up.
// Nothing can go wrong: snacks bounce softly off the walls, and Cosmo just drifts until tucked in.
(function (SA) {
  const TAU = Math.PI * 2;
  const SNACKS = [
    // Snacks are drawn (SA.icon), not emoji, so they look the same on every device.
    { kind: 'icon', icon: 'taco', fact: 'Yum! Astronauts eat tortillas instead of bread, because bread crumbs would float away and get into the machines!' },
    { kind: 'juice', fact: 'Slurp! In space, juice and water float around in wobbly balls!' },
    { kind: 'icon', icon: 'apple', fact: 'Crunch! Fresh fruit comes up on supply rockets. It\'s a special treat in space!' },
    { kind: 'pouch', fact: 'Mmm! Lots of space food comes in pouches. Astronauts add water, then squeeze!' },
    { kind: 'icon', icon: 'candy', fact: 'Gulp! Astronauts like to catch floating candy with their mouths, just like this!' },
  ];
  const ROOMS = ['🍽️ Kitchen', '🪟 Big window', '😴 Bedtime'];
  const SUNRISES = 16;

  class IssScene {
    constructor() {
      this.fx = new SA.Particles();
      this.stars = new SA.Starfield(160, 616);
      this.t = 0;
      const rnd = SA.seeded(4242);
      // Earth's surface features for the Cupola view: [u around the strip, depth, size, kind].
      this.ground = [];
      for (let i = 0; i < 46; i++) this.ground.push({ u: rnd(), d: rnd(), s: 0.4 + rnd() * 0.9, k: rnd() < 0.42 ? 'land' : 'cloud', seed: rnd() * 100 });
    }

    layout() {
      const W = SA.W, H = SA.H;
      // Logical units, like the Space Base: phones (600 tall) already draw everything bigger.
      this.k = 1;
      const top = H < 720 ? 96 : 88;
      this.box = { x0: 24, x1: W - 24, y0: top, y1: H - 24 };
      this.view = { x: W * 0.47, y: H * 0.53, r: Math.min(H * 0.35, W * 0.3) };
      // On phones the bag hangs a little higher, clear of Cosmo's (taller) speech bubble.
      this.bag = H < 720 ? { x: W * 0.77, y: H * 0.46, w: 140, h: 260 } : { x: W * 0.77, y: H * 0.53, w: 150, h: 290 };
    }
    resize() { this.layout(); }

    enter() {
      SA.ui.setScene('game');
      SA.audio.music('iss');
      this.layout();
      this.t = 0;
      this.room = -1;
      this.phase = 'intro';
      this.grab = null;
      this.items = [];
      this.hatch = 0;
      this.cosmo = this.newCosmo(SA.W * 0.68, SA.H * 0.5);
      this.fillKitchen();
      SA.ui.setInfo('🛰️ Space Station');
      SA.ui.banner('The Space Station', SA.NICKNAMES.iss).then(() => SA.scene !== this ? new Promise(() => {}) : SA.ui.say(SA.introLines('iss', [
        'Welcome aboard the International Space Station! 🛰️ Astronauts live and work here, high above Earth.',
        'Up here, everything floats. Even me! Wheee! 🎈 Try dragging me around!',
        'Let\'s visit three rooms. First, the kitchen. I\'m hungry! Fling the floating snacks to me! 😋',
      ]))).then(() => { if (SA.scene === this) this.startRoom(0); });
    }

    exit() { SA.ui.hideTalk(); this.grab = null; }

    newCosmo(x, y) { return { x, y, vx: 0, vy: 0, rot: 0, vr: 0.15, r: 46, munch: 0, yawn: 0, home: { x, y }, cosmo: true }; }

    // ---------- Rooms ----------
    fillKitchen() {
      const W = SA.W, H = SA.H;
      this.items = SNACKS.map((s, i) => this.floater(Object.assign({ snack: true }, s), W * (0.16 + (i % 3) * 0.14), H * (0.3 + Math.floor(i / 3) * 0.24 + (i % 2) * 0.06)));
      this.items.push(this.floater({ kind: 'icon', icon: 'wrench', wrench: true }, W * 0.45, H * 0.72));
      this.fed = 0;
    }
    floater(o, x, y) {
      return Object.assign(o, { x, y, vx: SA.rand(-30, 30), vy: SA.rand(-30, 30), rot: SA.rand(-0.5, 0.5), vr: SA.rand(-0.6, 0.6), r: 34, seed: Math.random() * 10 });
    }

    startRoom(i) {
      this.room = i;
      this.phase = 'play';
      this.idle = 0;
      if (i === 0) {
        this.updateInfo();
        SA.ui.hint('Drag a snack and fling it to me! 😋', 0);
      } else if (i === 1) {
        this.orbit = { phi: 0.9, n: 0, hours: 0, started: false, ended: false };
        this.holding = false;
        this.updateInfo();
        SA.ui.hint('Hold your finger down anywhere to speed up time! ⏩', 0);
      } else {
        this.cosmo = this.newCosmo(SA.W * 0.36, SA.H * 0.42);
        this.cosmo.vx = 40;
        this.items = [];
        this.tucked = 0;      // 0 floating, 0-1 sliding into the bag, then 1
        this.zip = 0;
        this.zipping = false;
        this.sleepT = -1;
        this.driftSaid = false;
        this.updateInfo();
        SA.ui.hint('Drag me into my sleeping bag on the wall! 🛌', 0);
      }
    }

    updateInfo() {
      const r = this.room;
      SA.ui.setInfo(r === 0 ? ROOMS[0] + ' · ' + this.fed + '/' + SNACKS.length
        : r === 1 ? '🌅 Sunrises ' + this.orbit.n + '/' + SUNRISES
        : ROOMS[2]);
    }

    // Leave the room through the round hatch in the back wall (a quick iris), then talk.
    async nextRoom(lines) {
      this.phase = 'cheer';
      this.grab = null;
      await SA.ui.say(lines);
      if (SA.scene !== this) return;
      this.phase = 'move';
      this.hatch = 0.001;
      SA.audio.play('whoosh');
    }

    // ---------- Input ----------
    onDown(x, y) {
      this.idle = 0;
      if (this.phase !== 'play') return;
      if (this.room === 1) { this.holding = true; SA.audio.play('blip'); return; }
      if (this.room === 2 && this.tucked >= 1) {
        // Tucked in: drag the zipper up, or just tap the bag.
        const b = this.bag;
        if (Math.abs(x - b.x) < b.w * 0.8 && Math.abs(y - b.y) < b.h * 0.6) { this.zipping = true; this.zipFrom = y; this.zipMoved = false; }
        return;
      }
      const list = this.room === 0 ? this.items.slice().reverse().concat([this.cosmo]) : [this.cosmo];
      const reach = SA.easy() ? 34 : 18;
      for (const o of list) {
        if (o.gone) continue;
        if (Math.hypot(x - o.x, y - o.y) < o.r + reach) {
          this.grab = { o, ox: o.x - x, oy: o.y - y, vx: 0, vy: 0, lx: x, ly: y, lt: performance.now() };
          o.vx = o.vy = 0;
          SA.audio.play('blip');
          if (this.room === 0 && o.snack) SA.ui.hideTalk();
          return;
        }
      }
    }

    onMove(x, y) {
      if (this.zipping) {
        if (Math.abs(y - this.zipFrom) > 8) this.zipMoved = true;
        this.zip = Math.max(this.zip, SA.clamp((this.zipFrom - y) / (this.bag.h * 0.55), 0, 1));
        return;
      }
      const g = this.grab;
      if (!g) return;
      const now = performance.now(), dts = Math.max(0.008, (now - g.lt) / 1000);
      g.vx = SA.lerp(g.vx, (x - g.lx) / dts, 0.5);
      g.vy = SA.lerp(g.vy, (y - g.ly) / dts, 0.5);
      g.lx = x; g.ly = y; g.lt = now;
      const b = this.box;
      g.o.x = SA.clamp(x + g.ox, b.x0 + g.o.r * 0.5, b.x1 - g.o.r * 0.5);
      g.o.y = SA.clamp(y + g.oy, b.y0 + g.o.r * 0.5, b.y1 - g.o.r * 0.5);
    }

    onUp() {
      this.holding = false;
      if (this.zipping) {
        this.zipping = false;
        if (!this.zipMoved && this.zip < 1) this.autoZip = true;   // a tap zips it all the way
        return;
      }
      const g = this.grab;
      if (!g) return;
      this.grab = null;
      // Stale speed (the finger stopped before letting go) means a gentle drop, not a fling.
      const still = performance.now() - g.lt > 120;
      const max = 1500;
      g.o.vx = still ? 0 : SA.clamp(g.vx, -max, max);
      g.o.vy = still ? 0 : SA.clamp(g.vy, -max, max);
      g.o.vr = SA.clamp(g.o.vx / 400, -4, 4);
      if (Math.hypot(g.o.vx, g.o.vy) > 500) SA.audio.play('whoosh');
      if (this.room === 2 && g.o.cosmo) this.tryTuck();
    }

    // ---------- Update ----------
    update(dt) {
      this.t += dt;
      this.fx.update(dt);
      this.idle += dt;
      if (this.phase === 'move') {
        this.hatch += dt / (SA.calm() ? 0.6 : 0.9);
        if (this.hatch >= 0.5 && this.room < 2 && this.hatchRoom !== this.room + 1) {
          this.hatchRoom = this.room + 1;
          this.roomShown = this.hatchRoom;
        }
        if (this.hatch >= 1) {
          this.hatch = 0;
          const next = this.hatchRoom;
          this.hatchRoom = null;
          this.startRoom(next);
        }
        return;
      }
      this.roomShown = this.room;
      if (this.room === 0 || this.room === -1) this.updateKitchen(dt);
      else if (this.room === 1) this.updateCupola(dt);
      else this.updateBedroom(dt);
    }

    // Floating physics: no gravity, a little air drag, soft bounces off the walls.
    float(o, dt, home) {
      if (this.grab && this.grab.o === o) return;
      if (home) {
        // Cosmo drifts gently back to his spot after being flung.
        o.vx += (home.x - o.x) * 0.6 * dt;
        o.vy += (home.y - o.y) * 0.6 * dt;
      }
      const drift = Math.hypot(o.vx, o.vy) < 25 ? 1 : 0;
      o.vx += Math.sin(this.t * 0.7 + o.seed * 3 || 0) * 10 * dt * drift;
      o.vy += Math.cos(this.t * 0.6 + (o.seed || 1) * 5) * 10 * dt * drift;
      const damp = Math.pow(0.72, dt);
      o.vx *= damp; o.vy *= damp; o.vr *= Math.pow(0.8, dt);
      o.x += o.vx * dt; o.y += o.vy * dt; o.rot += o.vr * dt;
      const b = this.box, r = o.r * 0.8;
      let hit = false;
      if (o.x < b.x0 + r) { o.x = b.x0 + r; o.vx = Math.abs(o.vx) * 0.7; hit = true; }
      if (o.x > b.x1 - r) { o.x = b.x1 - r; o.vx = -Math.abs(o.vx) * 0.7; hit = true; }
      if (o.y < b.y0 + r) { o.y = b.y0 + r; o.vy = Math.abs(o.vy) * 0.7; hit = true; }
      if (o.y > b.y1 - r) { o.y = b.y1 - r; o.vy = -Math.abs(o.vy) * 0.7; hit = true; }
      if (hit && Math.hypot(o.vx, o.vy) > 260) { SA.audio.play('boing'); o.vr = -o.vr + SA.rand(-1, 1); }
      // Keep loose things out from under Cosmo's speech bubble (lower left), where fingers can't reach them.
      if (SA.ui.talking() && o.x < SA.W * 0.42 && o.y > SA.H * 0.66) { o.vy -= 220 * dt; o.vx += 120 * dt; }
    }

    mouth() {
      const c = this.cosmo;
      return { x: c.x - Math.sin(c.rot) * 12, y: c.y + Math.cos(c.rot) * 12 };
    }

    updateKitchen(dt) {
      const c = this.cosmo;
      this.float(c, dt, c.home);
      c.munch = Math.max(0, c.munch - dt);
      for (const o of this.items) this.float(o, dt);
      if (this.phase !== 'play') return;
      const m = this.mouth(), reach = SA.easy() ? 88 : 64;
      this.near = false;
      for (const o of this.items) {
        if (o.gone) continue;
        const d = Math.hypot(o.x - m.x, o.y - m.y);
        if (o.snack && d < 170) this.near = true;
        if (d > reach) continue;
        if (o.wrench) {
          if ((this.wrenchT || 0) < this.t - 4) {
            this.wrenchT = this.t;
            SA.audio.play('boing');
            SA.ui.hint('Hey! A wrench isn\'t a snack, silly! 🔧😄', 4);
          }
          const a = Math.atan2(o.y - m.y, o.x - m.x);
          o.vx = Math.cos(a) * 320; o.vy = Math.sin(a) * 320; o.vr = 5;
          if (this.grab && this.grab.o === o) this.grab = null;
          continue;
        }
        this.eat(o);
      }
      // A nudge for a child who hasn't fed Cosmo for a while.
      if (this.idle > 10 && !SA.ui.talking()) { this.idle = 0; SA.ui.hint('I\'m sooo hungry! Drag a snack to my mouth! 😋', 5); }
    }

    eat(o) {
      o.gone = true;
      if (this.grab && this.grab.o === o) this.grab = null;
      this.items = this.items.filter(i => i !== o);
      this.fed++;
      this.cosmo.munch = 0.9;
      SA.audio.play('munch');
      setTimeout(() => SA.audio.play('collect'), 250);
      const m = this.mouth();
      this.fx.spawn('sparkle', m.x, m.y, 14, { color: '#ffe066' });
      this.updateInfo();
      SA.ui.bumpInfo();
      if (this.fed >= SNACKS.length) {
        SA.audio.play('cheer');
        this.nextRoom([o.fact, 'Burp! Oops, excuse me! 😄 Thank you for the snacks!',
          'Now let\'s float to the Cupola. It\'s the station\'s big window! 🪟']);
      } else SA.ui.hint(o.fact, 0);
    }

    updateCupola(dt) {
      const c = this.cosmo, o = this.orbit;
      c.x = this.view.x - this.view.r - 70 * this.k;
      c.y = this.view.y - this.view.r * 0.45 + Math.sin(this.t * 1.3) * 8;
      c.rot = Math.sin(this.t * 0.7) * 0.15;
      if (this.phase !== 'play') return;
      const slow = SA.easy() ? 3.6 : 5, fast = SA.easy() ? 0.7 : 0.9;
      const d = dt / (this.holding ? fast : slow);
      const before = o.phi;
      o.phi += d;
      if (o.started) o.hours += d * 1.5;
      if (o.started && o.n >= SUNRISES && o.hours >= 24) {
        // A whole day: stop just as the next day's first sunrise peeks over Earth.
        o.hours = 24; o.phi = 0.995;
        this.holding = false;
        this.dayDone();
        return;
      }
      if (before < 1 && o.phi >= 1) {
        o.phi -= 1;
        o.started = true;
        o.n++;
        this.updateInfo();
        SA.ui.bumpInfo();
        SA.audio.play(o.n === SUNRISES ? 'collect' : 'ding');
        const sx = this.view.x - this.view.r * 0.78, sy = this.view.y + this.view.r * 0.3;
        this.fx.spawn('sparkle', sx, sy, o.n === 1 || o.n === SUNRISES ? 16 : 8, { color: '#ffcf7a' });
        const say = {
          1: 'Good morning! 🌅 That\'s our first space sunrise!',
          2: 'Another sunrise already! The station goes all the way around Earth every 90 minutes!',
          4: 'Sunrise number 4! On Earth, you only get one sunrise each day.',
          8: '8 sunrises! That\'s about half a day. Keep going! ⏩',
          12: '12! Look at the city lights twinkling on the night side! ✨',
          16: '16 sunrises! Let\'s finish the day... ⏰',
        }[o.n];
        if (say) SA.ui.hint(say, 6);
      }
      if (this.idle > 9 && !this.holding && !SA.ui.talking()) { this.idle = 0; SA.ui.hint('Hold your finger down to make time go faster! ⏩', 5); }
    }

    dayDone() {
      SA.audio.play('cheer');
      SA.celebrate(50);
      this.fx.spawn('sparkle', this.view.x, this.view.y, 24, { color: '#ffd27a' });
      this.nextRoom([
        '16 sunrises in just ONE day! 🌅 That\'s because the station zooms around Earth every 90 minutes.',
        'Phew! What a long day. 😴 It\'s bedtime on the space station. Let\'s float to the bedroom!',
      ]);
    }

    updateBedroom(dt) {
      const c = this.cosmo, b = this.bag;
      c.yawn = Math.max(0, c.yawn - dt);
      if (this.tucked <= 0) {
        this.float(c, dt);
        c.vr += Math.sin(this.t * 0.5) * 0.05 * dt;
        if (!c.yawn && Math.random() < dt * 0.15) { c.yawn = 1.2; this.fx.text(c.x + 40, c.y - 60, 'Yawn!', '#cfe0ff'); }
        if (this.phase === 'play' && this.idle > 9 && !SA.ui.talking()) {
          this.idle = 0;
          SA.ui.hint(this.driftSaid ? 'Drag me into my sleeping bag! 🛌' : 'Zzz... wait, I\'m floating away! 😄 Drag me into my sleeping bag on the wall!', 5);
          this.driftSaid = true;
        }
        // Dragged right over the bag: in he goes, without even letting go.
        if (this.grab && this.grab.o === c && this.inBag(c.x, c.y, 0.25)) this.tryTuck(true);
        return;
      }
      if (this.tucked < 1) {
        this.tucked = Math.min(1, this.tucked + dt / 0.45);
        const k = SA.easeOut(this.tucked);
        c.x = SA.lerp(this.tuckFrom.x, b.x, k);
        c.y = SA.lerp(this.tuckFrom.y, b.y - b.h * 0.3, k);
        c.rot = SA.lerp(this.tuckFrom.rot, 0, k);
        if (this.tucked >= 1) SA.ui.hint('Now zip up the bag! Drag the zipper up, or just tap the bag. 🤐', 0);
        return;
      }
      c.x = b.x; c.y = b.y - b.h * 0.3 + Math.sin(this.t * 1.4) * 2;
      if (this.autoZip) this.zip = Math.min(1, this.zip + dt * 1.6);
      if (this.zip >= 1 && this.sleepT < 0 && this.phase === 'play') {
        this.sleepT = 0;
        this.phase = 'sleep';
        SA.audio.play('lullaby');
        SA.ui.hint('Good night, Cosmo! 😴 The bag is tied to the wall, so astronauts don\'t float away while they sleep.', 0);
      }
      if (this.sleepT >= 0) {
        this.sleepT += dt;
        const beat = n => Math.floor(this.sleepT * n) !== Math.floor((this.sleepT - dt) * n);
        if (this.sleepT < 5.5 && beat(0.9)) this.fx.text(c.x + 48, c.y - 50, 'z', '#cfe0ff');
        if (this.sleepT >= 6 && !this.woke) {
          this.woke = true;
          SA.audio.play('ding');
          setTimeout(() => SA.audio.play('ding'), 260);
          this.fx.spawn('sparkle', c.x, c.y - 30, 16, { color: '#fff3a0' });
          this.finish();
        }
      }
    }

    inBag(x, y, extra) {
      const b = this.bag, e = (extra == null ? (SA.easy() ? 0.7 : 0.45) : extra);
      return Math.abs(x - b.x) < b.w * (0.5 + e) && Math.abs(y - b.y) < b.h * (0.5 + e * 0.5);
    }

    tryTuck(force) {
      const c = this.cosmo;
      if (this.tucked > 0 || this.phase !== 'play' || (!force && !this.inBag(c.x, c.y))) return;
      this.grab = null;
      this.tucked = 0.001;
      this.tuckFrom = { x: c.x, y: c.y, rot: SA.wrapAngle(c.rot) };
      c.vx = c.vy = c.vr = 0;
      SA.audio.play('collect');
      this.fx.spawn('sparkle', this.bag.x, this.bag.y - this.bag.h * 0.3, 10, { color: '#bfe3ff' });
    }

    async finish() {
      this.phase = 'done';
      this.woke = true;
      SA.audio.play('cheer');
      SA.celebrate(120);
      await SA.ui.banner('Mission Complete!', '🛰️ You lived like an astronaut', 'gold', 3);
      if (SA.scene !== this) return;
      await SA.ui.say([
        'Good morning! ☀️ You fed me floating snacks, saw 16 sunrises, and tucked me into bed!',
        'Real astronauts do all of these things on the space station every day. Maybe one day you will too! 🧑‍🚀',
      ]);
      SA.finishPlanet('iss', 3);
    }

    // ---------- Drawing ----------
    draw(ctx) {
      const room = this.roomShown == null || this.roomShown < 0 ? 0 : this.roomShown;
      if (room === 1) this.drawCupola(ctx);
      else {
        this.drawModule(ctx, room);
        if (room === 2) this.drawBedroom(ctx);
        else this.drawKitchen(ctx);
      }
      this.fx.draw(ctx);
      // Lights out at bedtime.
      if (room === 2 && this.sleepT >= 0) {
        const a = this.sleepT < 5.5 ? Math.min(1, this.sleepT / 1.2) : Math.max(0, 1 - (this.sleepT - 5.5) * 2);
        ctx.fillStyle = 'rgba(8,10,40,' + 0.6 * a + ')';
        ctx.fillRect(0, 0, SA.W, SA.H);
        if (a > 0.3) {
          const c = this.cosmo;
          ctx.globalAlpha = a;
          SA.label(ctx, 'Zzz...', c.x + 70, c.y - 70, 26, '#cfe0ff');
          ctx.globalAlpha = 1;
        }
      }
      if (this.phase === 'move' && this.hatch > 0) this.drawHatchWipe(ctx, this.hatch);
    }

    // The inside of a station module, in perspective: padded walls, handrails, bags, lights and
    // a round hatch in the back wall leading to the next room.
    drawModule(ctx, room) {
      const W = SA.W, H = SA.H, t = this.t;
      const bx0 = W * 0.31, bx1 = W * 0.69, by0 = H * 0.31, by1 = H * 0.69;
      const wall = (pts, c0, c1, gx0, gy0, gx1, gy1) => {
        const g = ctx.createLinearGradient(gx0, gy0, gx1, gy1);
        g.addColorStop(0, c0); g.addColorStop(1, c1);
        ctx.fillStyle = g;
        ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fill();
      };
      wall([[0, 0], [W, 0], [bx1, by0], [bx0, by0]], '#f1f4fa', '#c9d0de', 0, 0, 0, by0);
      wall([[0, H], [W, H], [bx1, by1], [bx0, by1]], '#a9b3c6', '#cbd2df', 0, H, 0, by1);
      wall([[0, 0], [bx0, by0], [bx0, by1], [0, H]], '#c3cbda', '#a6b0c4', 0, 0, bx0, 0);
      wall([[W, 0], [bx1, by0], [bx1, by1], [W, H]], '#bcc5d6', '#a2acc0', W, 0, bx1, 0);
      ctx.fillStyle = '#8f9bb4';
      ctx.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
      // Ring seams down the tunnel and panel lines along it.
      ctx.strokeStyle = 'rgba(90,100,130,0.28)';
      ctx.lineWidth = 2;
      const frame = k => [SA.lerp(0, bx0, k), SA.lerp(0, by0, k), SA.lerp(W, bx1, k), SA.lerp(H, by1, k)];
      for (const k of [0.38, 0.7]) { const f = frame(k); ctx.strokeRect(f[0], f[1], f[2] - f[0], f[3] - f[1]); }
      ctx.beginPath();
      for (const u of [0.25, 0.5, 0.75]) {
        ctx.moveTo(u * W, 0); ctx.lineTo(SA.lerp(bx0, bx1, u), by0);
        ctx.moveTo(u * W, H); ctx.lineTo(SA.lerp(bx0, bx1, u), by1);
        ctx.moveTo(0, u * H); ctx.lineTo(bx0, SA.lerp(by0, by1, u));
        ctx.moveTo(W, u * H); ctx.lineTo(bx1, SA.lerp(by0, by1, u));
      }
      ctx.stroke();
      // Light strips on the ceiling.
      for (const k of [0.12, 0.5]) {
        const f = frame(k), f2 = frame(k + 0.14);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath();
        ctx.moveTo(SA.lerp(f[0], f[2], 0.4), f[1]); ctx.lineTo(SA.lerp(f[0], f[2], 0.6), f[1]);
        ctx.lineTo(SA.lerp(f2[0], f2[2], 0.6), f2[1]); ctx.lineTo(SA.lerp(f2[0], f2[2], 0.4), f2[1]);
        ctx.closePath(); ctx.fill();
      }
      // Handrails.
      ctx.strokeStyle = '#e8c65a';
      ctx.lineWidth = 7 * this.k;
      ctx.lineCap = 'round';
      for (const k of [0.22, 0.55]) {
        const f = frame(k);
        ctx.beginPath();
        ctx.moveTo(f[0] + (bx0 - f[0]) * 0.1 + 6, SA.lerp(f[1], f[3], 0.38)); ctx.lineTo(f[0] + (bx0 - f[0]) * 0.1 + 6, SA.lerp(f[1], f[3], 0.55));
        ctx.moveTo(f[2] - (f[2] - bx1) * 0.1 - 6, SA.lerp(f[1], f[3], 0.42)); ctx.lineTo(f[2] - (f[2] - bx1) * 0.1 - 6, SA.lerp(f[1], f[3], 0.6));
        ctx.stroke();
      }
      // Stowage bags with Velcro patches, and a laptop.
      const bag = (x, y, w, h, c) => {
        ctx.fillStyle = c; SA.rrect(ctx, x, y, w, h, 8 * this.k); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x + w * 0.3, y + h * 0.2, w * 0.4, h * 0.12);
      };
      const k = this.k;
      bag(W * 0.035, H * 0.2, 70 * k, 56 * k, '#e9e2cf');
      bag(W * 0.06, H * 0.66, 82 * k, 60 * k, '#d8dee9');
      bag(W * 0.2, H * 0.36, 44 * k, 64 * k, '#7fa6d9');
      bag(W * 0.73, H * 0.17, 76 * k, 48 * k, '#e9e2cf');
      ctx.fillStyle = '#2b3247';
      SA.rrect(ctx, W * 0.86, H * 0.6, 84 * k, 56 * k, 5); ctx.fill();
      ctx.fillStyle = '#3d8be0';
      ctx.fillRect(W * 0.86 + 6 * k, H * 0.6 + 6 * k, 72 * k, 40 * k);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillRect(W * 0.86 + 12 * k, H * 0.6 + 14 * k, 30 * k, 4 * k);
      ctx.fillRect(W * 0.86 + 12 * k, H * 0.6 + 24 * k, 46 * k, 4 * k);
      // A cable loop drifting from the ceiling.
      ctx.strokeStyle = '#4b5578';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(W * 0.62, 0);
      ctx.bezierCurveTo(W * 0.63, H * 0.08 + Math.sin(t * 0.8) * 6, W * 0.68, H * 0.1, W * 0.67, by0 - 6);
      ctx.stroke();
      // The round hatch to the next room, with a peek of the next module's light.
      const hx = (bx0 + bx1) / 2, hy = (by0 + by1) / 2, hr = (by1 - by0) * 0.34;
      ctx.fillStyle = '#5d6984';
      SA.circle(ctx, hx, hy, hr + 10 * k); ctx.fill();
      const hg = ctx.createRadialGradient(hx, hy, 2, hx, hy, hr);
      hg.addColorStop(0, '#fff8e0');
      hg.addColorStop(1, '#b9c3d6');
      ctx.fillStyle = hg;
      SA.circle(ctx, hx, hy, hr); ctx.fill();
      ctx.strokeStyle = '#3e4862'; ctx.lineWidth = 4;
      SA.circle(ctx, hx, hy, hr + 10 * k); ctx.stroke();
      // A little window with Earth sliding past (on the left wall in the bedroom, where the bag hangs right).
      const wx = room === 2 ? W * 0.11 : W * 0.85, wy = room === 2 ? H * 0.47 : H * 0.33, wr = 44 * k;
      ctx.fillStyle = '#5d6984';
      SA.circle(ctx, wx, wy, wr + 8 * k); ctx.fill();
      ctx.save();
      SA.circle(ctx, wx, wy, wr); ctx.clip();
      ctx.fillStyle = '#04061a'; ctx.fillRect(wx - wr, wy - wr, wr * 2, wr * 2);
      SA.drawBody(ctx, 'earth', wx + wr * 0.2, wy + wr * 1.9, wr * 1.6, { t: t * 3, lx: -0.5, ly: -0.7 });
      ctx.restore();
      ctx.strokeStyle = '#3e4862'; ctx.lineWidth = 3;
      SA.circle(ctx, wx, wy, wr + 8 * k); ctx.stroke();
      SA.label(ctx, room === 2 ? 'Crew Quarters' : 'Galley', W * 0.5, by0 - 22 * k, 18 * k, '#4b5578', { stroke: 'rgba(255,255,255,0.8)', strokeW: 5 });
    }

    drawCosmoFloat(ctx, c, s, o) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);
      SA.drawCosmo(ctx, 0, 0, s, Object.assign({ t: this.t, noBob: true }, o));
      ctx.restore();
    }

    drawKitchen(ctx) {
      const t = this.t, k = this.k, c = this.cosmo;
      // A juice bag and a tray of food stuck to the wall with Velcro.
      ctx.fillStyle = '#ffffff';
      SA.rrect(ctx, SA.W * 0.08, SA.H * 0.44, 96 * k, 64 * k, 10); ctx.fill();
      ctx.strokeStyle = '#9aa6bd'; ctx.lineWidth = 2; ctx.stroke();
      SA.icon(ctx, 'can', SA.W * 0.08 + 28 * k, SA.H * 0.44 + 32 * k, 36 * k);
      SA.icon(ctx, 'juicebox', SA.W * 0.08 + 68 * k, SA.H * 0.44 + 32 * k, 36 * k);
      const munch = c.munch > 0;
      this.drawCosmoFloat(ctx, c, 1.05 * k * (munch ? 1 + Math.sin(c.munch * 30) * 0.03 : 1), {
        talk: munch, mood: munch ? null : this.near ? 'wow' : this.fed >= SNACKS.length ? 'joy' : null,
      });
      if (this.near && !munch && this.phase === 'play') SA.label(ctx, 'Ahh!', c.x + 52 * k, c.y - 52 * k, 20, '#fff');
      for (const o of this.items) this.drawItem(ctx, o, t);
      // First-time hint: a hand showing the drag.
      if (this.phase === 'play' && this.fed === 0 && !this.grab && this.items.length) {
        const o = this.items[0];
        const u = (t * 0.6) % 1, m = this.mouth();
        ctx.globalAlpha = Math.sin(u * Math.PI);
        SA.emoji(ctx, '👆', SA.lerp(o.x, m.x, SA.easeInOut(u)) + 20, SA.lerp(o.y, m.y, SA.easeInOut(u)) + 34, 34);
        ctx.globalAlpha = 1;
      }
    }

    drawItem(ctx, o, t) {
      const k = this.k;
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.rotate(o.rot);
      if (this.grab && this.grab.o === o) {
        ctx.fillStyle = 'rgba(255,240,150,0.35)';
        SA.circle(ctx, 0, 0, o.r + 10); ctx.fill();
      }
      if (o.kind === 'juice') {
        // A wobbly floating ball of orange juice.
        const w = Math.sin(t * 5 + o.seed) * 0.08;
        const g = ctx.createRadialGradient(-8, -10, 2, 0, 0, 28 * k);
        g.addColorStop(0, '#fff2c0');
        g.addColorStop(0.35, '#ffb43a');
        g.addColorStop(1, '#e77c10');
        ctx.fillStyle = g;
        SA.ellipse(ctx, 0, 0, 26 * k * (1 + w), 26 * k * (1 - w)); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        SA.ellipse(ctx, -9 * k, -10 * k, 6 * k, 3.5 * k, -0.5); ctx.fill();
        ctx.fillStyle = '#ffb43a';
        SA.circle(ctx, 30 * k, -16 * k + Math.sin(t * 3) * 3, 5 * k); ctx.fill();
      } else if (o.kind === 'pouch') {
        ctx.fillStyle = '#d7dde8';
        SA.rrect(ctx, -22 * k, -30 * k, 44 * k, 60 * k, 8); ctx.fill();
        ctx.strokeStyle = '#8f9bb4'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#ff9f4a';
        ctx.fillRect(-22 * k, -6 * k, 44 * k, 16 * k);
        ctx.fillStyle = '#5d6984';
        ctx.fillRect(-6 * k, -38 * k, 12 * k, 9 * k);
        SA.label(ctx, 'SPACE', 0, 2 * k, 9 * k, '#fff', { stroke: false });
      } else {
        SA.icon(ctx, o.icon, 0, 0, 60 * k);
      }
      ctx.restore();
    }

    // The Cupola: a big round window with Earth turning below. The station circles Earth every
    // 90 minutes, so a sunrise comes round every orbit.
    drawCupola(ctx) {
      const W = SA.W, H = SA.H, t = this.t, k = this.k, v = this.view;
      const o = this.orbit || { phi: 0.9, n: 0, hours: 0 };
      // Dim interior around the window.
      const bg = ctx.createRadialGradient(v.x, v.y, v.r, v.x, v.y, W * 0.8);
      bg.addColorStop(0, '#59647e');
      bg.addColorStop(1, '#2a3047');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      // Six side windows around the big one, like the real Cupola.
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + i * TAU / 6;
        const x = v.x + Math.cos(a) * v.r * 1.28, y = v.y + Math.sin(a) * v.r * 1.28;
        ctx.save();
        ctx.translate(x, y); ctx.rotate(a + Math.PI / 2);
        ctx.fillStyle = '#3a4360';
        SA.rrect(ctx, -v.r * 0.42, -v.r * 0.16, v.r * 0.84, v.r * 0.3, 10); ctx.fill();
        ctx.fillStyle = 'rgba(10,14,40,0.85)';
        SA.rrect(ctx, -v.r * 0.36, -v.r * 0.11, v.r * 0.72, v.r * 0.2, 8); ctx.fill();
        ctx.restore();
      }
      // The view.
      const sun = Math.sin(o.phi * TAU);            // above 0: the Sun is up
      const day = SA.clamp(sun * 4 + 0.35, 0, 1);
      ctx.save();
      SA.circle(ctx, v.x, v.y, v.r); ctx.clip();
      ctx.fillStyle = '#02030f';
      ctx.fillRect(v.x - v.r, v.y - v.r, v.r * 2, v.r * 2);
      ctx.save();
      ctx.translate(v.x - W / 2, v.y - H / 2);
      ctx.globalAlpha = 1 - day * 0.7;
      this.stars.draw(ctx, t, 0);
      ctx.globalAlpha = 1;
      ctx.restore();
      const hz = v.y + v.r * 0.25, ER = v.r * 3, ecx = v.x, ecy = hz + ER;
      // Atmosphere glow along the horizon (a sunrise flare when the Sun is low).
      const low = 1 - SA.clamp(Math.abs(sun) * 5, 0, 1);
      const sideX = o.phi < 0.25 || o.phi > 0.75 ? -1 : 1;
      const atm = ctx.createRadialGradient(ecx, ecy, ER * 0.99, ecx, ecy, ER * 1.07);
      atm.addColorStop(0, SA.rgba('#6fc4ff', 0.25 + day * 0.6));
      atm.addColorStop(1, 'rgba(60,140,255,0)');
      ctx.fillStyle = atm;
      SA.circle(ctx, ecx, ecy, ER * 1.07); ctx.fill();
      if (low > 0) {
        const gx = v.x + sideX * v.r * 0.75;
        const fl = ctx.createRadialGradient(gx, hz, 2, gx, hz, v.r * 1.1);
        fl.addColorStop(0, 'rgba(255,220,140,' + 0.85 * low + ')');
        fl.addColorStop(0.3, 'rgba(255,120,80,' + 0.45 * low + ')');
        fl.addColorStop(1, 'rgba(255,80,120,0)');
        ctx.fillStyle = fl;
        ctx.fillRect(v.x - v.r, v.y - v.r, v.r * 2, v.r * 2);
      }
      // The Sun crosses the sky from one horizon to the other while it's day.
      if (sun > -0.05) {
        const u = SA.clamp(o.phi / 0.5, 0, 1);
        const sx = v.x - v.r * 0.85 + u * v.r * 1.7, sy = hz - Math.sin(u * Math.PI) * v.r * 0.85 + 4;
        const sg = ctx.createRadialGradient(sx, sy, 2, sx, sy, 60 * k);
        sg.addColorStop(0, 'rgba(255,255,240,1)');
        sg.addColorStop(0.25, 'rgba(255,240,180,0.8)');
        sg.addColorStop(1, 'rgba(255,200,120,0)');
        ctx.fillStyle = sg;
        SA.circle(ctx, sx, sy, 60 * k); ctx.fill();
      }
      // Earth's surface: oceans, land and clouds slide past (lit by day, city lights by night).
      ctx.save();
      SA.circle(ctx, ecx, ecy, ER); ctx.clip();
      const sea = ctx.createLinearGradient(0, hz, 0, v.y + v.r);
      sea.addColorStop(0, SA.rgba(day > 0.5 ? '#7fb8ec' : '#1b2a55', 1));
      sea.addColorStop(1, day > 0.5 ? '#1f5fb8' : '#070b20');
      ctx.fillStyle = sea;
      ctx.fillRect(v.x - v.r, hz - 4, v.r * 2, v.r * 2);
      if (day > 0 && day < 1) {
        ctx.fillStyle = 'rgba(7,11,32,' + (1 - day) * 0.85 + ')';
        if (day > 0.5) ctx.fillRect(v.x - v.r, hz - 4, v.r * 2, v.r * 2);
        else { ctx.fillStyle = 'rgba(31,95,184,' + day * 1.4 + ')'; ctx.fillRect(v.x - v.r, hz - 4, v.r * 2, v.r * 2); }
      }
      const scroll = (o.phi + (o.n || 0)) * 1.4;
      const span = v.r * 2.6;
      for (const g of this.ground) {
        const depth = g.d, sc = 0.25 + depth * 1.1;
        let u = ((g.u - scroll * (0.4 + depth * 0.8)) % 1 + 1) % 1;
        const x = v.x + (u - 0.5) * span;
        const y = hz + 8 + Math.pow(depth, 1.4) * v.r * 0.95;
        const rx = 46 * g.s * sc * k, ry = rx * (0.25 + depth * 0.3);
        if (g.k === 'land') {
          ctx.fillStyle = day > 0.5 ? SA.rgba('#6aa84f', 0.35 + day * 0.6) : 'rgba(46,56,80,0.75)';
          SA.ellipse(ctx, x, y, rx, ry); ctx.fill();
          if (day < 0.5) {
            // City lights twinkle on the night side.
            const r = SA.seeded(Math.floor(g.seed * 1000));
            for (let i = 0; i < 9; i++) {
              const lx = x + (r() - 0.5) * rx * 1.5, ly = y + (r() - 0.5) * ry * 1.3, lr = (1.4 + r() * 2) * sc;
              ctx.globalAlpha = (1 - day * 2) * (0.65 + 0.35 * Math.sin(t * 3 + i + g.seed));
              ctx.fillStyle = 'rgba(255,200,90,0.35)';
              SA.circle(ctx, lx, ly, lr * 2.4); ctx.fill();
              ctx.fillStyle = '#ffe39a';
              SA.circle(ctx, lx, ly, lr); ctx.fill();
            }
            ctx.globalAlpha = 1;
          }
        } else {
          ctx.fillStyle = 'rgba(255,255,255,' + (0.12 + day * 0.6) + ')';
          SA.ellipse(ctx, x, y, rx * 0.9, ry * 0.7); ctx.fill();
          SA.ellipse(ctx, x + rx * 0.4, y - ry * 0.3, rx * 0.5, ry * 0.5); ctx.fill();
        }
      }
      ctx.restore();
      // Speed lines while time is racing.
      if (this.holding) {
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
          const yy = v.y - v.r * 0.6 + i * v.r * 0.16, off = ((t * 900 + i * 137) % (v.r * 2.4));
          ctx.beginPath(); ctx.moveTo(v.x + v.r - off, yy); ctx.lineTo(v.x + v.r - off - 60 * k, yy); ctx.stroke();
        }
      }
      ctx.restore();
      // Window frame with bolts.
      ctx.strokeStyle = '#8b96b1';
      ctx.lineWidth = 16 * k;
      SA.circle(ctx, v.x, v.y, v.r + 8 * k); ctx.stroke();
      ctx.strokeStyle = '#c3cbdc';
      ctx.lineWidth = 3;
      SA.circle(ctx, v.x, v.y, v.r + 1); ctx.stroke();
      ctx.fillStyle = '#5d6984';
      for (let i = 0; i < 12; i++) {
        const a = i * TAU / 12;
        SA.circle(ctx, v.x + Math.cos(a) * (v.r + 8 * k), v.y + Math.sin(a) * (v.r + 8 * k), 3.5 * k); ctx.fill();
      }
      // Cosmo looking out of the window.
      this.drawCosmoFloat(ctx, this.cosmo, 0.75 * k, { look: [0.9, 0.3], mood: o.n >= SUNRISES ? 'joy' : this.holding ? 'wow' : null });
      // A 24-hour clock that fills up with the day, and the sunrise count.
      const cx = Math.min(W - 100 * k, v.x + v.r + 150 * k), cy = v.y - v.r * 0.2, cr = 64 * k;
      ctx.fillStyle = 'rgba(16,14,56,0.85)';
      SA.circle(ctx, cx, cy, cr + 10); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 10;
      SA.circle(ctx, cx, cy, cr - 6); ctx.stroke();
      if (o.hours > 0) {
        ctx.strokeStyle = '#ffd27a';
        ctx.beginPath(); ctx.arc(cx, cy, cr - 6, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, o.hours / 24)); ctx.stroke();
      }
      SA.label(ctx, Math.floor(o.hours) + ' h', cx, cy - 6, 26, '#fff');
      SA.label(ctx, 'of 24', cx, cy + 20, 15, '#c9d2ff', { weight: 700 });
      SA.label(ctx, '⏰ One day', cx, cy - cr - 26, 17, '#e8ecff');
      SA.label(ctx, '🌅 ' + o.n + ' / ' + SUNRISES, cx, cy + cr + 34, 26, '#ffd27a');
      // Hold-to-speed-up hint under the clock (the lower left is where Cosmo's tips appear).
      if (this.phase === 'play') {
        const ps = this.holding ? 1.08 : 1 + Math.sin(t * 4) * 0.04;
        ctx.save();
        ctx.translate(Math.min(cx, W - 118), Math.min(H - 36, cy + cr + 84));
        ctx.scale(ps, ps);
        SA.pill(ctx, this.holding ? '⏩ Zoom!' : '👆 Hold to go faster', 0, 0, 19, this.holding
          ? { color: '#4a2d00', edge: '#fff6c8', bgTop: '#ffe680', bg: '#ffc21f', weight: 900 } : {});
        ctx.restore();
      }
    }

    drawBedroom(ctx) {
      const b = this.bag, k = this.k, t = this.t, c = this.cosmo;
      // Straps tie the bag to the wall.
      ctx.strokeStyle = '#4b5578';
      ctx.lineWidth = 5;
      for (const sy of [-0.42, 0.42]) {
        ctx.beginPath(); ctx.moveTo(b.x - b.w * 0.62, b.y + sy * b.h); ctx.lineTo(b.x + b.w * 0.62, b.y + sy * b.h); ctx.stroke();
        ctx.fillStyle = '#4b5578';
        for (const sx of [-0.62, 0.62]) { SA.circle(ctx, b.x + sx * b.w, b.y + sy * b.h, 6); ctx.fill(); }
      }
      const glow = this.phase === 'play' && this.tucked <= 0 && (this.grab && this.grab.o === c);
      if (glow || (this.phase === 'play' && this.tucked <= 0 && SA.easy())) {
        ctx.strokeStyle = 'rgba(255,224,102,' + (0.5 + 0.3 * Math.sin(t * 6)) + ')';
        ctx.lineWidth = 5;
        SA.rrect(ctx, b.x - b.w / 2 - 12, b.y - b.h / 2 - 12, b.w + 24, b.h + 24, 40); ctx.stroke();
      }
      const bagBody = () => {
        const g = ctx.createLinearGradient(b.x - b.w / 2, 0, b.x + b.w / 2, 0);
        g.addColorStop(0, '#5a7fd6');
        g.addColorStop(0.5, '#7aa0f0');
        g.addColorStop(1, '#4a6cc0');
        ctx.fillStyle = g;
        SA.rrect(ctx, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, b.w * 0.42);
      };
      // Back of the bag, then Cosmo, then the front of the bag over his body.
      bagBody(); ctx.fill();
      ctx.fillStyle = '#e8eefc';
      SA.rrect(ctx, b.x - b.w * 0.38, b.y - b.h * 0.47, b.w * 0.76, b.h * 0.22, 20); ctx.fill();
      const inBag = this.tucked >= 1;
      const sleeping = this.sleepT >= 0 && this.sleepT < 6;
      if (!inBag) {
        // Floating, sleepy Cosmo (drawn after the bag when out of it).
      } else {
        this.drawCosmoFloat(ctx, c, 0.95 * k, { sleep: sleeping, mood: this.woke ? 'joy' : null });
      }
      if (inBag) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(b.x - b.w, b.y - b.h * 0.2, b.w * 2, b.h);
        ctx.clip();
        bagBody(); ctx.fill();
        // Quilted stitching.
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) { const yy = b.y - b.h * 0.15 + i * b.h * 0.12; ctx.moveTo(b.x - b.w / 2 + 8, yy); ctx.lineTo(b.x + b.w / 2 - 8, yy); }
        ctx.stroke();
        ctx.restore();
        // The zipper runs up the middle; the zipped part is a neat line.
        const zTop = b.y - b.h * 0.18, zBot = b.y + b.h * 0.44, zy = SA.lerp(zBot, zTop, this.zip);
        ctx.strokeStyle = '#2b3a78';
        ctx.lineWidth = 4;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(b.x, zBot); ctx.lineTo(b.x, zy); ctx.stroke();
        ctx.setLineDash([]);
        if (this.zip < 1) {
          ctx.strokeStyle = 'rgba(20,30,70,0.6)';
          ctx.lineWidth = 6;
          ctx.beginPath(); ctx.moveTo(b.x, zy); ctx.lineTo(b.x, zTop); ctx.stroke();
        }
        ctx.fillStyle = '#ffd84d'; ctx.strokeStyle = '#a35a00'; ctx.lineWidth = 2;
        SA.rrect(ctx, b.x - 10, zy - 4, 20, 26, 6); ctx.fill(); ctx.stroke();
        if (this.zip < 1 && this.phase === 'play') {
          const hop = Math.abs(Math.sin(t * 3)) * 8;
          SA.emoji(ctx, '👆', b.x + 34, zy + 30 - hop, 34);
          SA.emoji(ctx, '⬆️', b.x + 36, zy - 30 - hop, 26);
        }
      } else {
        ctx.strokeStyle = 'rgba(20,30,70,0.5)';
        ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(b.x, b.y - b.h * 0.18); ctx.lineTo(b.x, b.y + b.h * 0.44); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(20,30,70,0.35)';
      ctx.lineWidth = 3;
      bagBody(); ctx.stroke();
      SA.label(ctx, '🛌 Cosmo\'s bed', b.x, b.y + b.h / 2 + 26 * k, 18, '#fff');
      if (!inBag) {
        const yawn = c.yawn > 0;
        this.drawCosmoFloat(ctx, c, 0.95 * k * (this.tucked > 0 ? 1 : 1), { mood: yawn ? 'wow' : null, look: [0.6, 0.2] });
        if (this.phase === 'play' && !this.grab && this.idle > 3) {
          const u = (t * 0.5) % 1;
          ctx.globalAlpha = Math.sin(u * Math.PI);
          SA.emoji(ctx, '👆', SA.lerp(c.x, b.x, SA.easeInOut(u)) + 20, SA.lerp(c.y, b.y - b.h * 0.2, SA.easeInOut(u)) + 34, 34);
          ctx.globalAlpha = 1;
        }
      }
    }

    // Floating through the round hatch: a circle closes to dark and opens on the next room.
    drawHatchWipe(ctx, h) {
      const W = SA.W, H = SA.H;
      const close = h < 0.5 ? h * 2 : (1 - h) * 2;   // 0 open, 1 shut
      if (SA.calm()) {
        ctx.fillStyle = 'rgba(20,24,44,' + close + ')';
        ctx.fillRect(0, 0, W, H);
        return;
      }
      const r = Math.hypot(W, H) * 0.6 * (1 - SA.easeInOut(close)) + 1;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.arc(W / 2, H / 2, r, 0, TAU, true);
      ctx.fillStyle = '#2a3047';
      ctx.fill('evenodd');
      ctx.strokeStyle = '#8b96b1';
      ctx.lineWidth = 18;
      SA.circle(ctx, W / 2, H / 2, r + 9); ctx.stroke();
      ctx.restore();
    }
  }
  SA.IssScene = IssScene;
})(window.SA);
