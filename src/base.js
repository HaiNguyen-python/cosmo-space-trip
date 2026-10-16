// Cosmo's Space Base: Cosmo's home on a tiny moon, and the child's own space scene to decorate.
// Stickers (planet cards, mission souvenirs and star-unlocked decorations) can be placed anywhere,
// dragged around, tapped to change size, or dropped in the bin to put away. Found space critters
// wander about, and Cosmo reacts when he's tickled. Nothing here can be lost: stickers are never
// used up and can be placed again any time.
(function (SA) {
  const TAU = Math.PI * 2;
  const MAX = 40;
  const SIZES = [0.7, 1, 1.5];
  const $ = id => document.getElementById(id);

  // Everything that can go on the base, in tray order, with whether it is unlocked yet.
  SA.stickerItems = function () {
    const st = SA.state, out = [];
    for (const b of SA.BODIES) {
      out.push({ k: 'b:' + b.id, has: !!st.cards[b.id], name: b.name, body: b.id,
        need: 'Collect the ' + b.name.replace(/^The /, '') + ' card to unlock this!' });
    }
    for (const id of Object.keys(SA.SOUVENIRS)) {
      const s = SA.SOUVENIRS[id];
      out.push({ k: 's:' + id, has: !!st.done[id], name: s[1], emoji: s[0],
        need: 'Finish the ' + SA.BODY[id].name.replace(/^The /, '') + ' mission to unlock this!' });
    }
    const allCritters = st.critterMedal || SA.critters.count() >= SA.CRITTERS.length;
    SA.DECOR.forEach((d, i) => {
      if (d.check) { out.push({ k: 'd:' + i, has: !!d.check(), name: d.name, emoji: d.e, need: d.hint, spoken: null }); return; }
      const has = d.tour ? !!st.tourDone : d.critters ? allCritters : d.sky ? !!st.sky[d.sky] : d.rocket ? st.rocketBest >= 6
        : d.garden ? !!(st.garden && st.garden.grown[d.garden]) : d.story ? st.story >= d.story : SA.totalStars() >= d.need;
      out.push({ k: 'd:' + i, has, name: d.name, emoji: d.e,
        need: d.tour ? 'Visit all 8 planets to unlock this!' : d.critters ? 'Find all ' + SA.CRITTERS.length + ' shy critters to unlock this! 🐾'
          : d.sky ? 'Connect the stars of ' + d.name + ' in the Night Sky to unlock this! 🔭'
          : d.rocket ? 'Build a rocket that flies to the Moon in the Rocket Workshop to unlock this! 🔧'
          : d.garden ? 'Grow a ' + d.name + ' in my greenhouse to unlock this! 🌱'
          : d.story ? 'Keep exploring! Postcards from my family arrive at my radar dish. 💌' : 'Collect ⭐ ' + d.need + ' to unlock this!',
        spoken: d.tour || d.critters || d.sky || d.rocket || d.garden || d.story ? null : 'Collect ' + d.need + ' stars to unlock this!' });
    });
    return out;
  };
  function stickerLook(k) {
    const [type, id] = k.split(':');
    if (type === 'b' && SA.BODY[id]) return { body: id };
    if (type === 's' && SA.SOUVENIRS[id]) return { emoji: SA.SOUVENIRS[id][0] };
    if (type === 'd' && SA.DECOR[+id]) return { emoji: SA.DECOR[+id].e };
    return null;
  }
  SA.stickerLook = stickerLook;   // the save loader uses it to drop stickers it can't draw

  // Planet stickers are drawn once into a small picture and reused every frame. Drawing a full
  // shaded planet (glow, rings, bands) for each of up to 40 stickers made the base the slowest
  // screen in the game, which older iPads would feel.
  const sprites = new Map();
  function bodySprite(id, br) {
    const ps = Math.min(SA.pixelScale || 1, 3);
    const key = id + '|' + Math.round(br) + '|' + ps.toFixed(2);
    let c = sprites.get(key);
    if (!c) {
      if (sprites.size > 48) sprites.clear();   // e.g. after the screen changed size
      const half = br * (id === 'saturn' ? 2.5 : id === 'uranus' ? 2.1 : 1.8);
      c = document.createElement('canvas');
      c.width = c.height = Math.max(2, Math.ceil(half * 2 * ps));
      const g = c.getContext('2d');
      g.scale(c.width / (half * 2), c.height / (half * 2));
      SA.drawBody(g, id, half, half, br, { t: 0, halo: 1.6 });
      c.half = half;
      sprites.set(key, c);
    }
    return c;
  }

  // A different surprise visits the base each day (by the device's date; nothing leaves the
  // device). Each one can be tapped.
  const SURPRISES = [
    { id: 'ufo', line: 'Look! My friend Zib came to visit in a flying saucer! Tap it to say hi! 🛸' },
    { id: 'meteors', line: 'It\'s a meteor shower night at my base! Tap a shooting star to make a wish! 🌠' },
    { id: 'gift', line: 'A space parcel is floating down! 📦 What could be inside? Tap it!' },
    { id: 'balloons', line: 'It\'s balloon day! 🎈 Tap the balloons to pop them!' },
    { id: 'aurora', line: 'Ooh, look at the glowing lights in the sky today! 🌌 Tap them!' },
    { id: 'comet', line: 'A comet is drifting past my base today! ☄️ Tap it!' },
  ];
  const dayNumber = () => { const d = new Date(); return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000); };
  const BALLOON_COLS = ['#ff6b8b', '#ffd84d', '#5fc8ff', '#7ee08a', '#b48cff'];

  class BaseScene {
    constructor() {
      this.stars = new SA.Starfield(220, 303);
      this.shooting = new SA.ShootingStars(3, 8);
      this.fx = new SA.Particles();
      this.t = 0;
      this.lights = true;
      const rnd = SA.seeded(88);
      this.craters = [];
      for (let i = 0; i < 16; i++) this.craters.push({ u: rnd(), d: 0.15 + rnd() * 0.75, r: 8 + rnd() * 26 });
      $('btnBaseBack').addEventListener('click', () => {
        if (SA.transitioning || SA.ui.panelOpen() || SA.scene !== this) return;
        SA.audio.play('click');
        SA.ui.hideTalk();
        SA.go(SA.map, {});
      });
      $('btnStickers').addEventListener('click', () => {
        if (SA.transitioning || SA.ui.blocking() || SA.scene !== this) return;
        SA.audio.play('pop');
        this.setTray(!this.trayOpen);
        // The tray's how-to line is small print (and hidden on phones), so say it once per visit.
        if (this.trayOpen && !this.trayTold) {
          this.trayTold = true;
          SA.ui.toast('Tap a sticker to add it! Drag it to move it. ✨', 'Tap a sticker to put it on my base! Then drag it to move it, or tap it to make it bigger.');
        }
      });
      $('btnCritters').addEventListener('click', () => {
        if (SA.transitioning || SA.ui.blocking() || SA.scene !== this) return;
        SA.audio.play('pop');
        this.setTray(false);
        SA.ui.hideTalk();
        SA.ui.critterClub();
      });
      $('trayClose').addEventListener('click', () => { SA.audio.play('click'); this.setTray(false); });
      $('btnSky').addEventListener('click', () => {
        if (SA.transitioning || SA.ui.blocking() || SA.scene !== this) return;
        this.openSky();
      });
      $('btnWorkshop').addEventListener('click', () => {
        if (SA.transitioning || SA.ui.blocking() || SA.scene !== this) return;
        this.openWorkshop();
      });
      $('btnGarden').addEventListener('click', () => {
        if (SA.transitioning || SA.ui.blocking() || SA.scene !== this) return;
        this.openGarden();
      });
      // Cosmo's emotes: a little row of buttons that make him wave, dance, flip, sing or nap.
      const bar = $('emoteBar');
      bar.innerHTML = SA.EMOTES.map((e, i) => '<button data-i="' + i + '" aria-label="' + SA.esc(e[1]) + '">' + e[0] + '</button>').join('');
      bar.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
        if (SA.transitioning || SA.ui.blocking() || SA.scene !== this) return;
        this.emote(SA.EMOTES[+b.dataset.i]);
      }));
      $('btnEmote').addEventListener('click', () => {
        if (SA.transitioning || SA.ui.blocking() || SA.scene !== this) return;
        SA.audio.play('pop');
        this.setEmotes($('emoteBar').hidden);
      });
    }

    setEmotes(open) {
      $('emoteBar').hidden = !open;
      $('btnEmote').classList.toggle('on', !!open);
      if (open) { this.setTray(false); if (!this.emoteTold) { this.emoteTold = true; SA.ui.hint('Tap a button to make me wave, dance, flip, sing or take a nap! 💃', 4); } }
    }

    openSky() {
      SA.audio.play('pop');
      this.setTray(false);
      this.setEmotes(false);
      SA.ui.hideTalk();
      SA.go(SA.sky, {});
    }

    openWorkshop() {
      if (SA.transitioning) return;
      SA.audio.play('pop');
      this.setTray(false);
      this.setEmotes(false);
      SA.ui.hideTalk();
      SA.go(SA.workshop, {});
    }

    openPostcard() {
      if (SA.transitioning) return;
      SA.audio.play('pop');
      this.setTray(false);
      this.setEmotes(false);
      SA.ui.hideTalk();
      SA.go(SA.postcard, {});
    }

    openGarden() {
      if (SA.transitioning) return;
      SA.audio.play('pop');
      this.setTray(false);
      this.setEmotes(false);
      SA.ui.hideTalk();
      SA.go(SA.garden, {});
    }

    // ---------- Critter joyride ----------
    // Tap the rocket: up to four critters climb aboard and it loops round the sky, then lands.
    startRide() {
      if (this.ride) return;
      const riders = this.critters.slice().sort(() => Math.random() - 0.5).slice(0, 4);
      for (const cr of riders) {
        cr.riding = true;
        const p = this.critterPos(cr);
        this.fx.spawn('sparkle', p.x, p.y, 6, { color: cr.c.color });
      }
      this.ride = { t: 0, riders, x: this.pad.x, y: this.groundY(this.pad.x) - 70 * this.k, ang: 0 };
      SA.audio.play('launch');
      this.tell(riders.length ? (riders.length > 1 ? 'All aboard! Critter joyride! 🚀' : riders[0].c.name + ' is coming for a ride! 🚀') : 'Watch my rocket do a loop-the-loop! 🚀', 4);
    }
    // Where the rocket is during the ride (t in seconds): rumble, lift off, a big loop, land.
    ridePos(t) {
      const W = SA.W, H = SA.H, px = this.pad.x, py = this.groundY(px) - 70 * this.k, top = H * 0.24;
      if (t < 1) return { x: px, y: py };
      if (t < 2) { const u = (t - 1); return { x: px, y: SA.lerp(py, top, u * u) }; }
      if (t < 6.5) {
        const a = SA.easeInOut((t - 2) / 4.5) * TAU;
        return { x: px + (Math.cos(a) - 1) * W * 0.34, y: top + Math.sin(2 * a) * H * 0.1 };
      }
      const u = SA.easeOut(Math.min(1, (t - 6.5) / 1.5));
      return { x: px, y: SA.lerp(top, py, u) };
    }
    updateRide(dt) {
      const r = this.ride;
      if (!r) return;
      r.t += dt;
      const p = this.ridePos(r.t), q = this.ridePos(r.t + 0.05);
      r.x = p.x; r.y = p.y;
      const flying = r.t > 2 && r.t < 6.5;
      r.ang = SA.lerp(r.ang, flying ? Math.atan2(q.y - p.y, q.x - p.x) + Math.PI / 2 : 0, Math.min(1, dt * 6));
      if (r.t > 0.6 && r.t < 7.4 && Math.random() < dt * (SA.calm() ? 8 : 20)) {
        const back = r.ang + Math.PI / 2;
        this.fx.spawn(flying ? 'sparkle' : 'puff', r.x + Math.cos(back) * 50 * this.k, r.y + Math.sin(back) * 50 * this.k, 1, { color: SA.pick(['#ffe9a8', '#bff4ff', '#ffb3e6']) });
      }
      if (r.t >= 8) {
        SA.audio.play('land');
        for (const cr of r.riders) { cr.riding = false; cr.x = this.pad.x + SA.rand(-90, 90) * this.k; cr.hop = 1; cr.joy = 2; cr.wait = 1.5; }
        this.ride = null;
        this.tell(r.riders.length ? 'Wheee! The critters loved it! 🐾 Tap 🔧 to build a new rocket!' : 'Ta-da! 🚀 Tap 🔧 to build a new rocket!', 4);
      }
    }

    emote(e) {
      this.react = { kind: e[3], t: 0, fired: false };
      SA.audio.play(e[3] === 'sing' || e[3] === 'nap' ? 'lullaby' : e[3] === 'flip' ? 'jump' : 'giggle');
      if (e[3] === 'party') {
        SA.celebrate(50);
        for (const cr of this.critters) { cr.joy = 3.2; cr.hop = 1; cr.wait = 3.2; cr.party = 3.2; }
      }
      this.tell(e[2], 3);
    }

    layout() {
      // Sizes in logical units (phones, at H = 600, already draw everything bigger).
      const W = SA.W, H = SA.H, k = this.k = 1;
      this.gR = W * 1.15;
      this.gx = W * 0.5;
      this.gy = H * 0.72 + this.gR;
      this.dome = { x: W * 0.27, r: 125 * k };
      this.dish = { x: W * 0.09 };
      this.pad = { x: W * 0.84 };
      this.cosmoX = W * 0.53;
      this.scope = { x: W * 0.45 };
      this.plants = [0.4, 0.165, 0.96].map((u, i) => ({ x: W * u, h: (34 + (i % 3) * 14) * k, c: ['#ff7ac8', '#ffd84d', '#7ee08a'][i] }));
      this.green = { x: W * 0.695, r: 58 * k };   // the greenhouse
    }
    groundY(x) { const dx = x - this.gx; return this.gy - Math.sqrt(Math.max(0, this.gR * this.gR - dx * dx)); }

    resize() { this.layout(); }

    enter() {
      SA.ui.setScene('base');
      SA.audio.music('base');
      this.layout();
      this.drag = null;
      this.react = null;
      this.ride = null;
      this.rocketHop = 0;
      this.pings = [];
      this.waveT = 3;
      this.trayTold = false;
      this.setTray(false);
      const wasNew = SA.state.baseNew;
      SA.state.baseNew = false;
      // (The HUD is shown by setScene above, so its size is known here.)
      for (const s of SA.state.base) this.keepClear(s);
      SA.save();
      SA.ui.updateHud();
      this.updateChip();
      // Found critters wander along the ground.
      this.critters = SA.CRITTERS.filter(c => SA.state.critters[c.id]).map((c, i) => ({
        c, x: SA.W * (0.12 + ((i * 0.37) % 0.8)), dir: i % 2 ? 1 : -1, sp: SA.rand(26, 44), wait: SA.rand(0, 2), hop: 0, joy: 0, seed: i * 1.7,
        cool: SA.rand(2, 6), party: 0,
      }));
      this.setEmotes(false);
      // Today's surprise, and a seasonal touch (pumpkins in October, snow in December).
      this.surprise = SURPRISES[dayNumber() % SURPRISES.length];
      this.month = new Date().getMonth();
      this.sp = { t: 0, open: 0, hit: 0, balloons: [], snow: [] };
      if (this.surprise.id === 'balloons') for (let i = 0; i < 5; i++) this.sp.balloons.push(this.newBalloon(SA.rand(0, 1)));
      this.shooting.minGap = this.surprise.id === 'meteors' ? 0.5 : 3;
      this.shooting.maxGap = this.surprise.id === 'meteors' ? 1.4 : 8;
      const sayToday = SA.state.baseSeen && SA.state.surpriseDay !== SA.dayKey();
      if (sayToday) { SA.state.surpriseDay = SA.dayKey(); SA.save(); }
      if (!SA.state.baseSeen) {
        const n = this.critters.length;
        SA.ui.say([
          'Welcome to my Space Base! 🏠 This is where I live!',
          'Tap ✨ Stickers to decorate it with planets and souvenirs from our trip!',
          n ? 'And look! My critter friends live here too! 🐾' : 'Shy space critters hide in every mission. When you find one, it comes to live here! 🐾',
          'You can tap me any time. I\'m very ticklish! 😆',
          'Tap 💃 to make me dance, and 🔭 to look at the stars with my telescope!',
          'Tap 🔧 to build your very own rocket, and 🌱 to grow space plants in my greenhouse!',
          'Oh, and tap my rocket. My critter friends LOVE going for a ride! 🚀',
        ]).then(() => { SA.state.baseSeen = true; SA.state.surpriseDay = SA.dayKey(); SA.save(); });
      } else if (SA.story.check() || SA.story.waiting()) {
        SA.ui.hint('Beep beep! 📡 A space postcard from my family arrived! Tap my radar dish to read it! 💌', 7);
      } else if (sayToday) {
        SA.ui.hint('Today\'s surprise! ' + this.surprise.line, 7);
      } else if (wasNew) {
        SA.ui.hint('Something new is here! Tap ✨ Stickers, or say hi to your critters! 🐾', 5);
      } else {
        SA.ui.hint('Welcome home! 🏠 Tap me, the critters, or ✨ Stickers!', 4);
      }
    }

    // Leaving mid-drag keeps the sticker where it was let go, and saves it.
    exit() { this.setTray(false); this.setEmotes(false); SA.ui.hideTalk(); if (this.drag) { this.drag = null; this.save(); } }

    // ---------- Today's surprise ----------
    newBalloon(u) {
      return { x: SA.W * SA.rand(0.08, 0.92), y: SA.H * (0.75 - u * 0.7), sp: SA.rand(28, 45), c: SA.pick(BALLOON_COLS), w: SA.rand(0, 6) };
    }
    ufoPos() { return { x: SA.W * 0.66 + Math.sin(this.t * 0.6) * SA.W * 0.06, y: SA.H * 0.31 + Math.sin(this.t * 1.7) * 8 }; }
    giftPos() {
      const land = this.groundY(SA.W * 0.62) - 22, k = Math.min(1, this.sp.t / 7);
      return { x: SA.W * 0.62 + Math.sin(this.sp.t * 1.3) * 30 * (1 - k), y: SA.lerp(-60, land, SA.easeOut(k)), landed: k >= 1 };
    }
    cometPos() {
      const u = ((this.t * 0.012) % 1.3) - 0.15;
      return { x: SA.W * (1.05 - u), y: SA.H * (0.08 + u * 0.22) };
    }

    // True if the tap hit today's surprise (or a seasonal decoration).
    tapSurprise(x, y) {
      const id = this.surprise.id, k = this.k;
      if (id === 'ufo') {
        const p = this.ufoPos();
        if (Math.hypot(x - p.x, y - p.y) < 70 * k) {
          this.sp.hit = 1.6;
          SA.audio.play('zap');
          this.tell(SA.pick(['Zib says: "Bleep blorp!" That means hello! 👽', 'Zib beamed down some stardust for you! ✨', 'Zib is on a trip around the galaxy. Bye, Zib! 👋']), 4);
          return true;
        }
      } else if (id === 'meteors') {
        for (const s of this.shooting.list) {
          if (Math.hypot(x - s.x, y - s.y) < 70 * k) {
            s.life = s.max;
            SA.audio.play('collect');
            this.fx.spawn('sparkle', s.x, s.y, 14, { color: '#fff3a0' });
            this.fx.text(s.x, s.y - 30, 'Wish! ✨', '#fff3a0');
            return true;
          }
        }
      } else if (id === 'gift') {
        const p = this.giftPos();
        if (Math.hypot(x - p.x, y - p.y) < 60 * k) {
          this.sp.open = 1;
          SA.audio.play('card');
          SA.celebrate(40);
          this.fx.spawn('sparkle', p.x, p.y - 20, 18);
          this.tell('Inside is a space fact! ' + SA.pick(SA.DAILY_FACTS) + ' 🎁', 7);
          return true;
        }
      } else if (id === 'balloons') {
        for (const b of this.sp.balloons) {
          if (Math.hypot(x - b.x, y - b.y) < 40 * k) {
            SA.audio.play('pop');
            this.fx.spawn('sparkle', b.x, b.y, 10, { color: b.c });
            Object.assign(b, this.newBalloon(0));
            return true;
          }
        }
      } else if (id === 'aurora') {
        if (y < SA.H * 0.32 && y > SA.H * 0.08 && !this.sp.told) {
          this.sp.told = true;
          SA.audio.play('ding');
          this.tell('Earth has real glowing lights like these, called AURORAS! They happen when the Sun\'s wind reaches the air near the North and South Poles. 🌌', 8);
          return true;
        }
      } else if (id === 'comet') {
        const p = this.cometPos();
        if (Math.hypot(x - p.x, y - p.y) < 60 * k) {
          SA.audio.play('collect');
          this.fx.spawn('sparkle', p.x, p.y, 12, { color: '#bff4ff' });
          this.tell('A comet! Its tail always points away from the Sun. ☄️', 4);
          return true;
        }
      }
      // Seasonal decorations.
      const sea = this.seasonal();
      for (const d of sea) {
        if (Math.hypot(x - d.x, y - d.y) < 34 * k) {
          SA.audio.play('boing');
          d.onTap();
          return true;
        }
      }
      return false;
    }

    // Pumpkins in October and a snowman in December, sitting on the ground.
    seasonal() {
      const W = SA.W, out = [];
      if (this.month === 9) {
        for (const u of [0.135, 0.6]) {
          out.push({ e: '🎃', x: W * u, y: this.groundY(W * u) - 18, s: 40, onTap: () => this.tell('Space pumpkins! 🎃 I grew them in my moon garden this month!', 4) });
        }
      }
      if (this.month === 11) {
        out.push({ e: '⛄', x: W * 0.6, y: this.groundY(W * 0.6) - 30, s: 60, onTap: () => this.tell('I made a space snowman! ⛄ Brrr! Real space is very, very cold.', 4) });
      }
      return out;
    }

    updateChip() { $('critterCount').textContent = SA.critters.count() + '/' + SA.CRITTERS.length; }

    // Cosmo says something; with the tray open his bubble would be hidden, so use the top toast.
    tell(line, secs) {
      if (this.trayOpen) SA.ui.toast(line);
      else SA.ui.hint(line, secs || 4);
    }

    // ---------- Sticker tray ----------
    setTray(open) {
      this.trayOpen = !!open;
      const tray = $('tray');
      tray.hidden = !open;
      $('btnStickers').classList.toggle('on', !!open);
      if (!open) return;
      SA.ui.hideTalk();
      const row = $('trayRow');
      row.innerHTML = '';
      // Every sticker the child already has comes first (by group), then the locked ones at the
      // end, so nothing usable is ever scrolled out of sight behind a row of padlocks.
      const items = SA.stickerItems();
      const groups = [
        ['🪐', 'Planets', items.filter(i => i.has && i.k.indexOf('b:') === 0)],
        ['🎒', 'Souvenirs', items.filter(i => i.has && i.k.indexOf('s:') === 0)],
        ['🎨', 'Fun stuff', items.filter(i => i.has && i.k.indexOf('d:') === 0)],
        // Undiscovered planets stay a mystery (so the secret one isn't spoiled).
        ['🔒', 'Still to find', items.filter(i => !i.has && i.body !== 'pluto')],
      ];
      for (const [icon, title, list] of groups) {
        if (!list.length) continue;
        const h = document.createElement('div');
        h.className = 'tray-group';
        h.innerHTML = '<span>' + icon + '</span><small>' + title + '</small>';
        row.appendChild(h);
        for (const it of list) {
          const b = document.createElement('button');
          b.className = 'tray-item' + (it.has ? '' : ' locked');
          b.setAttribute('aria-label', it.has ? it.name : 'Locked sticker');
          if (it.body) b.appendChild(SA.renderBodyCanvas(it.body, 56));
          else if (SA.EMOJI_ICONS[it.emoji]) b.appendChild(SA.renderIconCanvas(SA.EMOJI_ICONS[it.emoji], 48));
          else { const e = document.createElement('i'); e.textContent = it.emoji; b.appendChild(e); }
          if (!it.has) { const l = document.createElement('span'); l.className = 'lock'; l.textContent = '🔒'; b.appendChild(l); }
          b.onclick = () => {
            if (!it.has) { SA.audio.play('wrong'); SA.ui.toast(it.need, it.spoken); return; }
            this.addSticker(it.k);
          };
          row.appendChild(b);
        }
      }
    }

    addSticker(k) {
      const list = SA.state.base;
      if (list.length >= MAX) {
        SA.audio.play('wrong');
        SA.ui.toast('The base is full! Drag a sticker to the bin to make room. 🗑️');
        return;
      }
      // New stickers pop in near the middle of the sky, a little scattered.
      const s = { k, x: SA.clamp(0.5 + SA.rand(-0.2, 0.2), 0.08, 0.92), y: SA.rand(0.25, 0.45), s: 1, pop: 1 };
      list.push(s);
      SA.audio.play('collect');
      this.fx.spawn('sparkle', s.x * SA.W, s.y * SA.H, 12);
      this.save();
    }

    save() {
      // Rounded in place (the same objects keep animating), so the save stays small.
      for (const s of SA.state.base) { s.x = Math.round(s.x * 1000) / 1000; s.y = Math.round(s.y * 1000) / 1000; }
      SA.save();
    }

    stickerR(s) { return 34 * this.k * (s.s || 1); }
    binPos() { return { x: SA.W / 2, y: 64 * this.k, r: 46 * this.k }; }

    // ---------- Input ----------
    onDown(x, y) {
      const list = SA.state.base;
      for (let i = list.length - 1; i >= 0; i--) {
        const s = list[i];
        if (Math.hypot(x - s.x * SA.W, y - s.y * SA.H) < this.stickerR(s) + 12 * this.k) {
          list.splice(i, 1);
          list.push(s);   // bring to the front
          this.drag = { s, ox: s.x * SA.W - x, oy: s.y * SA.H - y, x0: x, y0: y, moved: false };
          SA.audio.play('blip');
          return;
        }
      }
      const k = this.k;
      const cy = this.groundY(this.cosmoX) - 50 * k;
      if (Math.hypot(x - this.cosmoX, y - cy) < 80 * k) { this.tickle(); return; }
      for (const cr of this.critters) {
        if (cr.riding) continue;
        const p = this.critterPos(cr);
        if (Math.hypot(x - p.x, y - p.y) < 46 * k) { this.pokeCritter(cr); return; }
      }
      if (this.tapSurprise(x, y)) return;
      const sx = this.scope.x, sy = this.groundY(sx);
      if (Math.abs(x - sx) < 44 * k && y < sy + 6 && y > sy - 110 * k) { this.openSky(); return; }
      const d = this.dome, dy = this.groundY(d.x);
      if (y < dy && Math.hypot(x - d.x, y - dy) < d.r) {
        this.lights = !this.lights;
        SA.audio.play('click');
        this.tell(this.lights ? 'Lights on! 💡' : 'Lights off! Shhh... 🌙', 2);
        return;
      }
      const gh = this.green, gy = this.groundY(gh.x);
      if (Math.abs(x - gh.x) < gh.r + 6 * k && y < gy + 6 && y > gy - gh.r * 1.5 - 30 * k) { this.openGarden(); return; }
      const px = this.pad.x, py = this.groundY(px);
      if (!this.ride && Math.abs(x - px) < 50 * k && y < py && y > py - 170 * k) {
        // Critters climb aboard and the rocket does a loop-the-loop round the sky.
        this.startRide();
        return;
      }
      const dx = this.dish.x, ddy = this.groundY(dx) - 60 * k;
      if (SA.story.waiting() && Math.hypot(x - dx, y - (ddy - 50 * k)) < 90 * k) { this.openPostcard(); return; }
      if (Math.hypot(x - dx, y - ddy) < 60 * k) {
        this.pings.push({ t: 0 });
        SA.audio.play('ping');
        this.tell('Beep boop! 📡 Calling Earth... Hi, everyone!', 3);
      }
    }

    onMove(x, y) {
      const d = this.drag;
      if (!d) return;
      if (Math.hypot(x - d.x0, y - d.y0) > 10) d.moved = true;
      if (!d.moved) return;
      d.s.x = SA.clamp((x + d.ox) / SA.W, 0.02, 0.98);
      d.s.y = SA.clamp((y + d.oy) / SA.H, 0.04, 0.96);
    }

    onUp() {
      const d = this.drag;
      if (!d) return;
      this.drag = null;
      const s = d.s;
      if (!d.moved) {
        // A tap (no drag) changes the size: small, medium, big.
        const i = SIZES.indexOf(s.s);
        s.s = SIZES[(i + 1) % SIZES.length];
        s.pop = 1;
        SA.audio.play('boing');
      } else {
        const b = this.binPos();
        if (Math.hypot(s.x * SA.W - b.x, s.y * SA.H - b.y) < b.r + 20 * this.k) {
          SA.state.base = SA.state.base.filter(o => o !== s);
          this.fx.spawn('puff', b.x, b.y, 10);
          SA.audio.play('pop');
        } else { SA.audio.play('land'); this.keepClear(s); }
      }
      this.save();
    }

    // A sticker dropped under the buttons along the top could never be picked up again (the
    // buttons get the tap), so it settles just below them.
    hudBottom() {
      const c = $('game').getBoundingClientRect(), h = $('baseHud').getBoundingClientRect();
      if (!c.height || !h.height) return 0;
      return ((h.bottom - c.top) / c.height) * SA.H;
    }
    keepClear(s) {
      const min = this.hudBottom() + 4;
      if (s.y * SA.H < min) s.y = SA.clamp(min / SA.H, 0.04, 0.96);
    }

    tickle() {
      const r = SA.pick(SA.COSMO_TICKLE.filter(x => !this.lastTickle || x[0] !== this.lastTickle));
      this.lastTickle = r[0];
      this.react = { kind: r[1], t: 0, fired: false };
      SA.audio.play(r[1] === 'sneeze' ? 'whoosh' : 'giggle');
      this.tell(r[0], 4);
    }

    pokeCritter(cr) {
      cr.joy = 1.2;
      cr.hop = 1;
      cr.wait = 1.4;
      SA.audio.play('squeak');
      const p = this.critterPos(cr);
      this.fx.spawn('sparkle', p.x, p.y - 20 * this.k, 8, { color: cr.c.color });
      this.tell(cr.c.line, 5);
    }

    critterPos(cr) {
      const s = 0.85 * this.k;
      const hop = Math.sin(Math.min(1, cr.hop) * Math.PI) * 50 * this.k + (cr.wait > 0 ? 0 : Math.abs(Math.sin(this.t * 7 + cr.seed)) * 4 * this.k);
      return { x: cr.x, y: this.groundY(cr.x) - 26 * s - hop, s };
    }

    update(dt) {
      this.t += dt;
      this.fx.update(dt);
      this.shooting.update(dt);
      for (const s of SA.state.base) if (s.pop) s.pop = Math.max(0, s.pop - dt * 2.5);
      this.rocketHop = Math.max(0, this.rocketHop - dt * 0.8);
      this.updateRide(dt);
      for (const p of this.pings) p.t += dt;
      this.pings = this.pings.filter(p => p.t < 1.6);
      const W = SA.W;
      // Today's surprise.
      const sp = this.sp;
      sp.t += dt;
      sp.hit = Math.max(0, sp.hit - dt);
      if (sp.hit > 0 && Math.random() < dt * 20) {
        const p = this.ufoPos();
        this.fx.spawn('sparkle', p.x + SA.rand(-20, 20), p.y + SA.rand(30, 160), 1, { color: '#bfffd9' });
      }
      for (const b of sp.balloons) {
        b.y -= b.sp * dt;
        if (b.y < -60) Object.assign(b, this.newBalloon(0), { y: SA.H * 0.8 });
      }
      if (this.month === 11) {
        // Gentle space snow (fewer flakes with Calm effects).
        if (sp.snow.length < (SA.calm() ? 25 : 60) && Math.random() < dt * 20) sp.snow.push({ x: SA.rand(0, W), y: -10, sp: SA.rand(18, 40), w: SA.rand(0, 6), r: SA.rand(1.5, 3.5) });
        for (const f of sp.snow) { f.y += f.sp * dt; f.x += Math.sin(this.t + f.w) * 10 * dt; }
        sp.snow = sp.snow.filter(f => f.y < SA.H + 10);
      }
      // Critters say hello when they meet, and play with stickers sitting on the ground.
      for (const cr of this.critters) cr.cool = Math.max(0, cr.cool - dt);
      for (let i = 0; i < this.critters.length; i++) {
        const a = this.critters[i];
        if (a.cool > 0 || a.wait > 0 || a.riding) continue;
        for (let j = i + 1; j < this.critters.length; j++) {
          const b = this.critters[j];
          if (b.cool > 0 || b.wait > 0 || b.riding || Math.abs(a.x - b.x) > 48 * this.k) continue;
          a.dir = b.x > a.x ? 1 : -1;
          b.dir = -a.dir;
          a.wait = b.wait = 1.6;
          a.hop = 1;
          setTimeout(() => { b.hop = 1; }, 250);
          a.joy = b.joy = 1.6;
          a.cool = b.cool = SA.rand(12, 18);
          this.fx.text((a.x + b.x) / 2, this.groundY(a.x) - 90 * this.k, SA.pick(['💕', '👋', '🎵', '😄', '✨']), '#fff');
          break;
        }
        if (a.cool > 0) continue;
        for (const s of SA.state.base) {
          const sx = s.x * W, sy = s.y * SA.H;
          if (Math.abs(sx - a.x) < 30 * this.k && sy > this.groundY(sx) - 130 * this.k) {
            a.wait = 1.2; a.hop = 1; a.joy = 1.2; a.cool = SA.rand(14, 22);
            s.pop = 1;
            this.fx.text(a.x, this.groundY(a.x) - 80 * this.k, SA.pick(['!', '♪', '💫', 'Wheee!']), '#fff3a0');
            break;
          }
        }
      }
      for (const cr of this.critters) {
        cr.joy = Math.max(0, cr.joy - dt);
        cr.hop = cr.hop > 0 ? cr.hop - dt * 1.6 : 0;
        if (cr.party > 0) {
          // Critter party: everyone bounces along with Cosmo.
          cr.party -= dt;
          if (cr.hop <= 0 && cr.party > 0.4) cr.hop = 1;
        }
        if (cr.wait > 0) { cr.wait -= dt; continue; }
        cr.x += cr.dir * cr.sp * this.k * dt;
        if (cr.x < W * 0.06) cr.dir = 1;
        if (cr.x > W * 0.94) cr.dir = -1;
        if (Math.random() < dt * 0.25) { cr.wait = SA.rand(0.8, 2.5); if (Math.random() < 0.5) cr.dir *= -1; }
        if (Math.random() < dt * 0.12) cr.hop = 1;
      }
      // Cosmo's reactions, plus a friendly wave now and then.
      const r = this.react;
      if (r) {
        r.t += dt;
        const k = this.k, cx = this.cosmoX, cy = this.groundY(cx) - 60 * k;
        if (r.kind === 'sneeze' && r.t > 0.9 && !r.fired) {
          r.fired = true;
          SA.audio.play('collect');
          this.fx.spawn('sparkle', cx, cy, 24, { color: '#fff6c2' });
        }
        const beat = n => Math.floor(r.t * n) !== Math.floor((r.t - dt) * n);
        if ((r.kind === 'dance' || r.kind === 'party' || r.kind === 'sing') && beat(2.5)) this.fx.text(cx + SA.rand(-70, 70) * k, cy - 70 * k, SA.pick(['🎵', '🎶']), '#fff');
        if (r.kind === 'yawn' && r.t > 0.6 && !r.fired) { r.fired = true; this.fx.text(cx + 50 * k, cy - 70 * k, 'Zzz', '#cfe0ff'); }
        if (r.kind === 'nap' && r.t > 0.5 && beat(1.1)) this.fx.text(cx + 50 * k, cy - 70 * k, 'z', '#cfe0ff');
        if (r.kind === 'flip' && r.t > 1 && !r.fired) { r.fired = true; SA.audio.play('land'); this.fx.spawn('sparkle', cx, cy + 40 * k, 12, { color: '#bfffe8' }); }
        if (r.t > ({ hop: 0.8, spin: 1, sneeze: 1.8, dance: 2.6, yawn: 2.2, wow: 1.2, bounce: 1.5, wave: 2, flip: 1.3, sing: 2.8, nap: 3.6, party: 3.2 }[r.kind] || 1)) this.react = null;
      }
      this.waveT -= dt;
      if (this.waveT < -2) this.waveT = SA.rand(6, 10);
    }

    // ---------- Drawing ----------
    draw(ctx) {
      const W = SA.W, H = SA.H, t = this.t, k = this.k;
      SA.spaceBg(ctx, '#0a0b2e', '#2a1656');
      SA.nebula(ctx, t, [
        { x: 0.25, y: 0.2, r: 380, c: 'rgba(120,70,200,0.25)' },
        { x: 0.8, y: 0.35, r: 340, c: 'rgba(40,140,220,0.18)' },
      ]);
      this.stars.draw(ctx, t, 0);
      const sid = this.surprise.id;
      if (sid === 'aurora') this.drawAurora(ctx, t);
      this.shooting.draw(ctx);
      // Earth hangs in the sky: home is never far away.
      SA.drawBody(ctx, 'earth', W * 0.92, H * 0.2, 30 * k, { t, lx: -0.8, ly: -0.3 });
      if (sid === 'comet') { const c = this.cometPos(); SA.drawComet(ctx, c.x, c.y, 9, { ang: -0.35, tail: 0.6, t, bend: 1 }); }
      if (sid === 'ufo') this.drawUfo(ctx, t);

      this.drawGround(ctx, t);
      this.drawDish(ctx, t);
      this.drawDome(ctx, t);
      this.drawScope(ctx, t);
      this.drawGreenhouse(ctx, t);
      this.drawPad(ctx, t);
      for (const p of this.plants) this.drawPlant(ctx, p, t);
      if (sid === 'gift') this.drawGift(ctx, t);

      for (const s of SA.state.base) this.drawSticker(ctx, s, t);
      if (sid === 'balloons') this.drawBalloons(ctx, t);

      for (const cr of this.critters) {
        if (cr.riding) continue;
        const p = this.critterPos(cr);
        ctx.save();
        ctx.translate(p.x, p.y);
        if (cr.dir < 0) ctx.scale(-1, 1);
        SA.drawCritter(ctx, 0, 0, p.s, cr.c, { t, mood: cr.joy > 0 ? 'joy' : null, seed: cr.seed, squash: cr.hop > 0.85 ? 0.15 : 0 });
        ctx.restore();
      }
      // Seasonal props stand in front of the wandering critters.
      for (const d of this.seasonal()) SA.emojiCached(ctx, d.e, d.x, d.y + Math.sin(t * 2 + d.x) * 1.5, d.s * k);
      this.drawCosmo(ctx, t);
      this.drawRide(ctx, t);
      if (this.sp.snow.length) {
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        for (const f of this.sp.snow) { SA.circle(ctx, f.x, f.y, f.r); ctx.fill(); }
      }
      this.fx.draw(ctx);

      if (this.drag && this.drag.moved) {
        const b = this.binPos();
        const over = Math.hypot(this.drag.s.x * W - b.x, this.drag.s.y * H - b.y) < b.r + 20 * k;
        ctx.fillStyle = over ? 'rgba(255,120,120,0.45)' : 'rgba(20,16,60,0.7)';
        SA.circle(ctx, b.x, b.y, b.r * (over ? 1.15 : 1)); ctx.fill();
        ctx.strokeStyle = over ? '#ffb3b3' : 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
        SA.emoji(ctx, '🗑️', b.x, b.y - 4 * k, 34 * k);
        SA.label(ctx, 'Put away', b.x, b.y + b.r + 16 * k, 16 * k, '#fff');
      }
    }

    drawGround(ctx) {
      const W = SA.W, H = SA.H, k = this.k;
      const top = this.gy - this.gR;
      const g = ctx.createLinearGradient(0, top, 0, H);
      g.addColorStop(0, '#a99ccc');
      g.addColorStop(0.35, '#776aa3');
      g.addColorStop(1, '#3f3670');
      ctx.fillStyle = g;
      SA.circle(ctx, this.gx, this.gy, this.gR);
      ctx.fill();
      // A bright rim where sunlight catches the edge of the little moon.
      ctx.strokeStyle = 'rgba(230,220,255,0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.gx, this.gy, this.gR - 1.5, Math.PI * 1.25, Math.PI * 1.75);
      ctx.stroke();
      for (const c of this.craters) {
        const x = c.u * W, y = this.groundY(x) + c.d * (H - this.groundY(x));
        const r = c.r * k;
        ctx.fillStyle = 'rgba(40,30,80,0.3)';
        SA.ellipse(ctx, x, y, r, r * 0.35); ctx.fill();
        ctx.fillStyle = 'rgba(220,210,255,0.18)';
        SA.ellipse(ctx, x, y + r * 0.12, r * 0.8, r * 0.22); ctx.fill();
      }
    }

    drawDome(ctx, t) {
      const k = this.k, d = this.dome, x = d.x, y = this.groundY(x) + 6 * k, r = d.r;
      // Base ring.
      ctx.fillStyle = '#5b5296';
      SA.rrect(ctx, x - r - 10 * k, y - 18 * k, (r + 10 * k) * 2, 26 * k, 10 * k); ctx.fill();
      // Warm room inside the glass.
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y - 12 * k, r, Math.PI, 0);
      ctx.closePath();
      ctx.clip();
      const room = ctx.createRadialGradient(x, y - r * 0.3, 10, x, y - r * 0.3, r * 1.2);
      room.addColorStop(0, this.lights ? 'rgba(255,214,140,0.85)' : 'rgba(60,60,130,0.6)');
      room.addColorStop(1, this.lights ? 'rgba(255,150,90,0.55)' : 'rgba(25,25,70,0.6)');
      ctx.fillStyle = room;
      ctx.fillRect(x - r, y - r - 20 * k, r * 2, r + 20 * k);
      // Inside: a bed, a picture of Earth, a little lamp, a bookshelf.
      ctx.fillStyle = '#ff7ac8';
      SA.rrect(ctx, x - r * 0.75, y - 52 * k, r * 0.6, 26 * k, 8 * k); ctx.fill();
      ctx.fillStyle = '#fff';
      SA.rrect(ctx, x - r * 0.72, y - 58 * k, r * 0.18, 14 * k, 6 * k); ctx.fill();
      SA.drawBody(ctx, 'earth', x + r * 0.05, y - r * 0.62, 13 * k, { t, lx: -0.5, ly: -0.5 });
      ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 3 * k;
      ctx.strokeRect(x + r * 0.05 - 17 * k, y - r * 0.62 - 17 * k, 34 * k, 34 * k);
      ctx.fillStyle = '#6b4a8a';
      ctx.fillRect(x + r * 0.35, y - 70 * k, r * 0.35, 54 * k);
      ['#ffd84d', '#5fc8ff', '#ff6b8b', '#7ee08a'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(x + r * 0.38 + i * r * 0.075, y - 64 * k, r * 0.055, 20 * k); });
      ctx.fillStyle = this.lights ? '#fff6c2' : '#8f8fb0';
      SA.circle(ctx, x - r * 0.05, y - 26 * k, 7 * k); ctx.fill();
      ctx.restore();
      // Glass dome with highlights.
      ctx.fillStyle = 'rgba(190,230,255,0.16)';
      ctx.beginPath(); ctx.arc(x, y - 12 * k, r, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(230,245,255,0.85)';
      ctx.lineWidth = 4 * k;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 6 * k;
      ctx.beginPath(); ctx.arc(x, y - 12 * k, r * 0.84, Math.PI * 1.15, Math.PI * 1.38); ctx.stroke();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(230,245,255,0.3)';
      ctx.beginPath(); ctx.ellipse(x, y - 12 * k, r * 0.45, r, 0, Math.PI, 0); ctx.stroke();
      // Name sign on top.
      SA.pill(ctx, '🏠 Cosmo\'s Base', x, y - r - 30 * k, 18 * k, { color: '#4a2d00', edge: '#fff6c8', bgTop: '#ffe680', bg: '#ffc21f', weight: 900 });
    }

    drawDish(ctx, t) {
      const k = this.k, x = this.dish.x, y = this.groundY(x);
      // Tripod legs and a mast.
      ctx.strokeStyle = '#9d95cf';
      ctx.lineWidth = 5 * k;
      ctx.beginPath();
      ctx.moveTo(x - 22 * k, y + 2 * k); ctx.lineTo(x, y - 40 * k); ctx.lineTo(x + 22 * k, y + 2 * k);
      ctx.moveTo(x, y); ctx.lineTo(x, y - 62 * k);
      ctx.stroke();
      ctx.save();
      ctx.translate(x, y - 66 * k);
      ctx.rotate(-0.55 + Math.sin(t * 0.4) * 0.3);
      // A deep bowl: shaded inside, bright rim.
      const dg = ctx.createLinearGradient(0, -6 * k, 0, 26 * k);
      dg.addColorStop(0, '#ffffff');
      dg.addColorStop(1, '#b9b2e0');
      ctx.fillStyle = dg;
      ctx.strokeStyle = '#7d75b5';
      ctx.lineWidth = 3 * k;
      ctx.beginPath(); ctx.ellipse(0, 0, 44 * k, 26 * k, 0, 0, Math.PI); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#d9d4f5';
      SA.ellipse(ctx, 0, 0, 44 * k, 8 * k); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 2 * k); ctx.lineTo(0, -30 * k); ctx.stroke();
      ctx.fillStyle = Math.sin(t * 4) > 0 ? '#ff6b8b' : '#7a2440';
      SA.circle(ctx, 0, -32 * k, 5 * k); ctx.fill();
      ctx.restore();
      for (const p of this.pings) {
        ctx.strokeStyle = 'rgba(127,232,255,' + (1 - p.t / 1.6) + ')';
        ctx.lineWidth = 3;
        for (const off of [0, 0.3]) {
          const u = Math.max(0, p.t - off);
          ctx.beginPath(); ctx.arc(x, y - 100 * k, 10 * k + u * 90 * k, -Math.PI * 0.8, -Math.PI * 0.2); ctx.stroke();
        }
      }
      // A space postcard from Cosmo's family is waiting: a bouncing envelope over the dish.
      if (SA.story && SA.story.waiting()) {
        const ey = y - 150 * k - Math.abs(Math.sin(t * 3)) * 12 * k;
        const glow = ctx.createRadialGradient(x, ey, 4, x, ey, 46 * k);
        glow.addColorStop(0, 'rgba(255,200,240,0.6)'); glow.addColorStop(1, 'rgba(255,200,240,0)');
        ctx.fillStyle = glow; SA.circle(ctx, x, ey, 46 * k); ctx.fill();
        SA.icon(ctx, 'postcard', x, ey, 54 * k);
        if (Math.floor(t * 1.2) % 3 === 0 && !this.pings.length) this.pings.push({ t: 0 });
      }
    }

    drawPad(ctx, t) {
      const k = this.k, x = this.pad.x, y = this.groundY(x);
      ctx.fillStyle = '#4f467f';
      SA.rrect(ctx, x - 62 * k, y - 10 * k, 124 * k, 18 * k, 8 * k); ctx.fill();
      ctx.fillStyle = '#ffd84d';
      for (let i = 0; i < 5; i++) ctx.fillRect(x - 54 * k + i * 24 * k, y - 6 * k, 12 * k, 5 * k);
      if (this.ride) {
        if (this.ride.t < 1.6 && Math.random() < 0.6) this.fx.spawn('puff', x + SA.rand(-30, 30), y - 4 * k, 1, { vy: -20 });
        return;   // drawn in front of everything by drawRide
      }
      const hop = Math.sin(this.rocketHop * Math.PI) * 60 * k;
      SA.drawRocket(ctx, x, y - 70 * k - hop, 0.95 * k, Math.sin(this.rocketHop * TAU * 2) * 0.08, { t, flame: this.rocketHop > 0 ? 1 : 0 });
      if (this.rocketHop > 0 && Math.random() < 0.6) this.fx.spawn('puff', x + SA.rand(-20, 20), y - 4 * k, 1, { vy: -20 });
    }

    drawRide(ctx, t) {
      const r = this.ride, k = this.k;
      if (r) {
        // Joyride: the rocket (smaller once it's flying) with its critter passengers holding on.
        const sc = SA.lerp(0.95, 0.85, SA.clamp((r.t - 1) / 1, 0, 1) * SA.clamp((8 - r.t) / 1.2, 0, 1)) * k;
        const shake = r.t < 1 && !SA.calm() ? Math.sin(t * 60) * 1.5 : 0;
        SA.drawRocket(ctx, r.x + shake, r.y, sc, r.ang, { t, flame: r.t < 0.4 ? 0.3 : r.t < 7.6 ? 1 : 0.3 });
        const SEATS = [[-38, 14], [38, 14], [-34, -24], [34, -24]];
        r.riders.forEach((cr, i) => {
          const [ox, oy] = SEATS[i], ca = Math.cos(r.ang), sa = Math.sin(r.ang);
          const cx = r.x + (ox * ca - oy * sa) * sc, cy = r.y + (ox * sa + oy * ca) * sc;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(r.ang + (ox < 0 ? -0.3 : 0.3));
          if (ox < 0) ctx.scale(-1, 1);
          SA.drawCritter(ctx, 0, 0, 0.55 * sc, cr.c, { t, mood: 'joy', seed: cr.seed });
          ctx.restore();
        });
      }
    }

    // The greenhouse: a little glass house showing the plants growing in its three pots.
    drawGreenhouse(ctx, t) {
      const k = this.k, g = this.green, x = g.x, y = this.groundY(x) + 4 * k, r = g.r, h = r * 0.75;
      ctx.fillStyle = '#5b5296';
      SA.rrect(ctx, x - r - 6 * k, y - 12 * k, (r + 6 * k) * 2, 18 * k, 7 * k); ctx.fill();
      // Inside: soft pink grow light and the plants.
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x - r, y - 8 * k); ctx.lineTo(x - r, y - h); ctx.arc(x, y - h, r, Math.PI, 0); ctx.lineTo(x + r, y - 8 * k); ctx.closePath();
      ctx.clip();
      const glow = ctx.createLinearGradient(0, y - h - r, 0, y);
      glow.addColorStop(0, 'rgba(255,120,220,0.45)');
      glow.addColorStop(1, 'rgba(140,90,220,0.35)');
      ctx.fillStyle = glow;
      ctx.fillRect(x - r, y - h - r, r * 2, h + r);
      const pots = SA.state.garden.pots;
      for (let i = 0; i < 3; i++) {
        const px = x + (i - 1) * r * 0.62, py = y - 12 * k, p = pots[i];
        if (p && SA.garden && SA.GARDEN_PLANTS) {
          const pl = SA.GARDEN_PLANTS.find(q => q.k === p.k);
          ctx.save();
          ctx.translate(px, py - 10 * k);
          ctx.rotate(Math.sin(t * 1.3 + i) * 0.04);
          SA.garden.drawPlant(ctx, pl, SA.potStage(p), t, 0.36 * k);
          ctx.restore();
        }
        ctx.fillStyle = '#e2683d';
        ctx.beginPath(); ctx.moveTo(px - 13 * k, py - 14 * k); ctx.lineTo(px + 13 * k, py - 14 * k); ctx.lineTo(px + 10 * k, py); ctx.lineTo(px - 10 * k, py); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      // Glass and frame.
      ctx.fillStyle = 'rgba(200,240,255,0.14)';
      ctx.beginPath();
      ctx.moveTo(x - r, y - 8 * k); ctx.lineTo(x - r, y - h); ctx.arc(x, y - h, r, Math.PI, 0); ctx.lineTo(x + r, y - 8 * k); ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(230,248,255,0.85)';
      ctx.lineWidth = 3.5 * k;
      ctx.stroke();
      ctx.lineWidth = 2 * k;
      ctx.strokeStyle = 'rgba(230,248,255,0.5)';
      ctx.beginPath();
      for (const u of [-0.5, 0, 0.5]) { ctx.moveTo(x + u * r, y - 8 * k); ctx.lineTo(x + u * r, y - h - Math.sqrt(1 - u * u) * r); }
      ctx.moveTo(x - r, y - h); ctx.lineTo(x + r, y - h);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 4 * k;
      ctx.beginPath(); ctx.arc(x, y - h, r * 0.82, Math.PI * 1.15, Math.PI * 1.4); ctx.stroke();
      // A water drop when a plant is thirsty, sparkles when one is in bloom.
      const thirsty = SA.gardenThirsty && SA.gardenThirsty(), bloom = SA.gardenBloom && SA.gardenBloom();
      if (thirsty || bloom) {
        const bob = Math.abs(Math.sin(t * 3)) * 6 * k, bx = x + r * 0.75, by = y - h - r - 4 * k - bob;
        if (bloom) {
          ctx.fillStyle = '#fff3a0';
          SA.starPath(ctx, bx, by, 9 * k, 0.4, 5, t); ctx.fill();
        } else {
          ctx.fillStyle = '#7fc8ff';
          ctx.strokeStyle = '#2f6fb8'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(bx, by - 12 * k); ctx.quadraticCurveTo(bx + 10 * k, by + 2 * k, bx, by + 6 * k); ctx.quadraticCurveTo(bx - 10 * k, by + 2 * k, bx, by - 12 * k); ctx.fill(); ctx.stroke();
        }
      }
      SA.pill(ctx, '🌱 Greenhouse', x, y + 22 * k, 14 * k, { color: '#eaffe0', edge: 'rgba(140,230,150,0.9)' });
    }

    drawPlant(ctx, p, t) {
      const k = this.k, y = this.groundY(p.x), sway = Math.sin(t * 1.4 + p.x) * 0.12;
      ctx.save();
      ctx.translate(p.x, y);
      ctx.rotate(sway);
      ctx.strokeStyle = '#3aa883';
      ctx.lineWidth = 4 * k;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-6 * k, -p.h * 0.5, 0, -p.h); ctx.stroke();
      ctx.fillStyle = '#5ad3aa';
      SA.ellipse(ctx, -9 * k, -p.h * 0.45, 9 * k, 4 * k, -0.5); ctx.fill();
      const glow = ctx.createRadialGradient(0, -p.h, 0, 0, -p.h, 22 * k);
      glow.addColorStop(0, SA.rgba(p.c, 0.6));
      glow.addColorStop(1, SA.rgba(p.c, 0));
      ctx.fillStyle = glow;
      SA.circle(ctx, 0, -p.h, 22 * k); ctx.fill();
      ctx.fillStyle = p.c;
      SA.circle(ctx, 0, -p.h, (7 + Math.sin(t * 2 + p.x) * 1.2) * k); ctx.fill();
      ctx.restore();
    }

    // Cosmo's telescope (tap it for the Night Sky).
    drawScope(ctx, t) {
      const k = this.k, x = this.scope.x, y = this.groundY(x);
      ctx.strokeStyle = '#9d95cf';
      ctx.lineWidth = 4 * k;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - 20 * k, y + 2); ctx.lineTo(x, y - 46 * k); ctx.lineTo(x + 20 * k, y + 2);
      ctx.moveTo(x, y - 46 * k); ctx.lineTo(x + 4 * k, y + 2);
      ctx.stroke();
      ctx.save();
      ctx.translate(x, y - 50 * k);
      ctx.rotate(-0.8 + Math.sin(t * 0.5) * 0.06);
      const g = ctx.createLinearGradient(0, -10 * k, 0, 10 * k);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(1, '#b9b2e0');
      ctx.fillStyle = g;
      ctx.strokeStyle = '#7d75b5';
      ctx.lineWidth = 2.5 * k;
      SA.rrect(ctx, -22 * k, -9 * k, 70 * k, 18 * k, 7 * k); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#6f5bd6';
      ctx.fillRect(38 * k, -11 * k, 10 * k, 22 * k);
      ctx.fillStyle = '#ffd84d';
      ctx.fillRect(-4 * k, -9 * k, 6 * k, 18 * k);
      ctx.restore();
      // A soft twinkle above it says "tap me".
      const tw = 0.5 + 0.5 * Math.sin(t * 3);
      ctx.fillStyle = 'rgba(255,240,170,' + (0.4 + 0.5 * tw) + ')';
      SA.starPath(ctx, x + 40 * k, y - 110 * k, (6 + tw * 3) * k, 0.35, 4, t);
      ctx.fill();
    }

    drawAurora(ctx, t) {
      const W = SA.W, H = SA.H, sp = SA.calm() ? 0.3 : 0.7;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      [['126,232,170', 0.16, 0], ['200,120,255', 0.24, 2], ['110,200,255', 0.3, 4]].forEach(([c, y0, ph]) => {
        const g = ctx.createLinearGradient(0, H * (y0 - 0.1), 0, H * (y0 + 0.08));
        g.addColorStop(0, 'rgba(' + c + ',0)');
        g.addColorStop(0.6, 'rgba(' + c + ',0.22)');
        g.addColorStop(1, 'rgba(' + c + ',0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        for (let i = 0; i <= 24; i++) {
          const x = (i / 24) * W, y = H * y0 + Math.sin(i * 0.6 + t * sp + ph) * H * 0.03 - H * 0.08;
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        for (let i = 24; i >= 0; i--) {
          const x = (i / 24) * W, y = H * y0 + Math.sin(i * 0.5 + t * sp * 0.8 + ph) * H * 0.025 + H * 0.06;
          ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
      });
      ctx.restore();
    }

    drawUfo(ctx, t) {
      const p = this.ufoPos(), k = this.k;
      if (this.sp.hit > 0) {
        const a = Math.min(1, this.sp.hit) * 0.35;
        const g = ctx.createLinearGradient(0, p.y, 0, p.y + 180 * k);
        g.addColorStop(0, 'rgba(190,255,220,' + a + ')');
        g.addColorStop(1, 'rgba(190,255,220,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(p.x - 14 * k, p.y + 10 * k); ctx.lineTo(p.x + 14 * k, p.y + 10 * k); ctx.lineTo(p.x + 60 * k, p.y + 180 * k); ctx.lineTo(p.x - 60 * k, p.y + 180 * k); ctx.closePath(); ctx.fill();
      }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.sin(t * 1.3) * 0.06);
      ctx.fillStyle = 'rgba(190,240,255,0.5)';
      SA.ellipse(ctx, 0, -10 * k, 20 * k, 18 * k); ctx.fill();
      SA.drawCritter(ctx, 0, -14 * k, 0.32 * k, { color: '#9be86a', eyes: 3, feature: 'none' }, { t, mood: this.sp.hit > 0 ? 'joy' : null });
      const g = ctx.createLinearGradient(0, -6 * k, 0, 12 * k);
      g.addColorStop(0, '#e8e6ff');
      g.addColorStop(1, '#8c86c8');
      ctx.fillStyle = g;
      SA.ellipse(ctx, 0, 2 * k, 48 * k, 12 * k); ctx.fill();
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = (Math.floor(t * 4) + i) % 2 ? '#ffd84d' : '#ff6b8b';
        SA.circle(ctx, (i - 2) * 18 * k, 4 * k, 3.5 * k); ctx.fill();
      }
      ctx.restore();
    }

    drawGift(ctx, t) {
      const p = this.giftPos(), k = this.k;
      if (!p.landed) {
        // Parachute.
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(p.x - 18 * k, p.y - 14 * k); ctx.lineTo(p.x - 30 * k, p.y - 60 * k); ctx.moveTo(p.x + 18 * k, p.y - 14 * k); ctx.lineTo(p.x + 30 * k, p.y - 60 * k); ctx.stroke();
        ctx.fillStyle = '#ff7ac8';
        ctx.beginPath(); ctx.arc(p.x, p.y - 60 * k, 34 * k, Math.PI, 0); ctx.closePath(); ctx.fill();
      }
      SA.emoji(ctx, this.sp.open ? '✨' : '🎁', p.x, p.y, (this.sp.open ? 36 : 44) * k);
      if (p.landed && !this.sp.open) {
        const tw = Math.abs(Math.sin(t * 3));
        ctx.fillStyle = 'rgba(255,240,170,' + tw + ')';
        SA.starPath(ctx, p.x + 26 * k, p.y - 26 * k, 7 * k, 0.35, 4, t);
        ctx.fill();
      }
    }

    drawBalloons(ctx, t) {
      const k = this.k;
      for (const b of this.sp.balloons) {
        const x = b.x + Math.sin(t * 1.2 + b.w) * 8;
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x, b.y + 26 * k); ctx.quadraticCurveTo(x - 6, b.y + 44 * k, x + 2, b.y + 62 * k); ctx.stroke();
        const g = ctx.createRadialGradient(x - 7 * k, b.y - 9 * k, 2, x, b.y, 28 * k);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.25, b.c);
        g.addColorStop(1, SA.shade(b.c, -60));
        ctx.fillStyle = g;
        SA.ellipse(ctx, x, b.y, 21 * k, 26 * k); ctx.fill();
        ctx.fillStyle = SA.shade(b.c, -40);
        ctx.beginPath(); ctx.moveTo(x - 4 * k, b.y + 28 * k); ctx.lineTo(x + 4 * k, b.y + 28 * k); ctx.lineTo(x, b.y + 23 * k); ctx.closePath(); ctx.fill();
      }
    }

    drawSticker(ctx, s, t) {
      const look = stickerLook(s.k);
      if (!look) return;
      const x = s.x * SA.W, y = s.y * SA.H, held = this.drag && this.drag.s === s && this.drag.moved;
      const r = this.stickerR(s) * (1 + Math.sin((s.pop || 0) * Math.PI) * 0.25) * (held ? 1.1 : 1);
      if (held) {
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        SA.ellipse(ctx, x + 6, y + r + 8, r * 0.8, r * 0.2); ctx.fill();
      }
      if (look.body) {
        const base = this.stickerR(s), kb = look.body === 'saturn' ? 0.8 : look.body === 'sun' ? 0.85 : 1;
        const img = bodySprite(look.body, base * kb), d = img.half * 2 * (r / base);
        ctx.drawImage(img, x - d / 2, y - d / 2, d, d);
      } else {
        SA.emojiCached(ctx, look.emoji, x, y + r * 0.08, r * 1.8, this.stickerR(s) * 1.8);
      }
    }

    drawCosmo(ctx, t) {
      const k = this.k, s = 1.15 * k, x = this.cosmoX, gy = this.groundY(x);
      const r = this.react;
      let dx = 0, dy = 0, rot = 0, squash = 0, mood = 'happy', wave = this.waveT < 0, talk = false, sleep = false;
      if (r) {
        const u = r.t;
        wave = false;
        mood = 'joy';
        if (r.kind === 'hop') { dy = -Math.sin(Math.min(1, u / 0.7) * Math.PI) * 70 * k; squash = u < 0.08 ? 0.15 : 0; }
        if (r.kind === 'spin') { rot = SA.easeInOut(u / 0.9) * TAU; dy = -Math.sin(Math.min(1, u / 0.9) * Math.PI) * 30 * k; }
        if (r.kind === 'sneeze') { mood = u < 0.9 ? 'wow' : 'joy'; squash = u < 0.9 ? -0.15 * (u / 0.9) : u < 1.1 ? 0.2 : 0; }
        if (r.kind === 'dance') { dx = Math.sin(u * 8) * 14 * k; rot = Math.sin(u * 8) * 0.15; dy = -Math.abs(Math.sin(u * 8)) * 10 * k; }
        if (r.kind === 'yawn') { mood = null; squash = -0.08 * Math.sin(Math.min(1, u / 1.2) * Math.PI); }
        if (r.kind === 'wow') { mood = 'wow'; dy = -Math.sin(Math.min(1, u / 0.5) * Math.PI) * 20 * k; }
        if (r.kind === 'bounce') { dy = -Math.abs(Math.sin(u / 1.5 * Math.PI * 3)) * 45 * k; }
        if (r.kind === 'wave') { wave = true; mood = 'happy'; dy = -Math.abs(Math.sin(u * 5)) * 6 * k; }
        if (r.kind === 'flip') { const f = SA.clamp(u / 1, 0, 1); rot = -SA.easeInOut(f) * TAU; dy = -Math.sin(f * Math.PI) * 95 * k; squash = u > 1 && u < 1.12 ? 0.18 : 0; }
        if (r.kind === 'sing') { mood = null; talk = true; rot = Math.sin(u * 3) * 0.08; }
        if (r.kind === 'nap') { mood = null; sleep = true; squash = Math.sin(u * 2.5) * 0.04; }
        if (r.kind === 'party') { dx = Math.sin(u * 10) * 18 * k; rot = Math.sin(u * 10) * 0.2; dy = -Math.abs(Math.sin(u * 10)) * 16 * k; }
      }
      // Soft shadow on the ground.
      ctx.fillStyle = 'rgba(20,10,60,' + (0.35 - Math.min(0.2, -dy / 400)) + ')';
      SA.ellipse(ctx, x + dx, gy + 2 * k, 40 * k, 9 * k); ctx.fill();
      const cy = gy - 44 * s;
      ctx.save();
      ctx.translate(x + dx, cy + dy);
      ctx.rotate(rot);
      SA.drawCosmo(ctx, 0, 0, s, { t, mood, wave, squash, noBob: !!r, talk, sleep });
      ctx.restore();
    }
  }
  SA.BaseScene = BaseScene;
})(window.SA);
