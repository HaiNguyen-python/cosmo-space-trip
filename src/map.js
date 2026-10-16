// The Solar System map: tap a planet to fly the rocket there or hear a fun fact.
// Moons circle their planets, asteroids drift in the belt, and a comet sometimes swoops past.
(function (SA) {
  const TAU = Math.PI * 2;
  const NEBULA = [
    { x: 0.55, y: 0.25, r: 420, c: 'rgba(90,60,190,0.22)' },
    { x: 0.85, y: 0.8, r: 360, c: 'rgba(30,110,200,0.18)' },
    { x: 0.35, y: 0.85, r: 300, c: 'rgba(200,70,150,0.1)' },
  ];
  // Vertical offsets (at 720 tall) so the planets sit at different points of their orbits.
  const OFFSETS = { mercury: 30, venus: -70, earth: 85, mars: -40, jupiter: 55, saturn: -95, uranus: 75, neptune: -45 };
  const BELT_COLORS = ['#9b8f86', '#7d726c', '#b3a395', '#8a7f78'];
  // A few famous moons: orbit size (x planet radius), speed, size in px, colour.
  const MOONS = {
    earth: [{ o: 1.9, sp: 0.45, s: 6, c: '#d9d9e0', id: 'moon' }],
    mars: [{ o: 1.8, sp: 1.6, s: 2.4, c: '#b7a497' }, { o: 2.5, sp: 0.9, s: 2, c: '#a8968a' }],
    jupiter: [{ o: 1.3, sp: 1.4, s: 3, c: '#f2d36b' }, { o: 1.5, sp: 1.0, s: 2.8, c: '#e8e2d6', id: 'europa' },{ o: 1.75, sp: 0.7, s: 3.6, c: '#b9aa95' }, { o: 2.05, sp: 0.45, s: 3.3, c: '#8f8578' }],
    saturn: [{ o: 2.35, sp: 0.4, s: 4, c: '#e7b45a', id: 'titan' }],
    neptune: [{ o: 1.8, sp: -0.6, s: 3, c: '#e4d8d2' }],
  };

  // Swipe a planet to spin it: each one does its own silly (and true) thing, with a fact bubble.
  const POKE = {
    mercury: ['zoom', ['Zoom! Mercury is the fastest planet. A year there is only 88 days! ⚡', 'Mercury has almost no air, so its sky is black even in the daytime!']],
    venus: ['backspin', ['Venus spins backwards! The Sun rises in the west there. 🙃', 'Venus spins so slowly that one day is longer than its whole year!']],
    earth: ['daynight', ['Wheee! Every spin of Earth makes one day and one night! 🌍', 'Earth is the only planet we know of with life. Hi, everybody! 👋']],
    mars: ['sneeze', ['Achoo! Mars is covered in rusty red dust! 🤧', 'Mars has two tiny moons, Phobos and Deimos!']],
    jupiter: ['wobble', ['Jupiter spins the fastest of all. A day there is only about 10 hours! 🌀', 'Jupiter is so big that all the other planets could fit inside it!']],
    saturn: ['float', ['Saturn is so light it could float in a giant bathtub! 🛁', 'Saturn\'s rings are made of ice and rock. Some chunks are as big as a house!']],
    uranus: ['roll', ['Uranus rolls around the Sun on its side, like a ball! 🎳', 'Uranus is an ice giant. It looks blue-green because of a gas called methane.']],
    neptune: ['whoosh', ['Whoosh! Neptune has the fastest winds in the Solar System! 💨', 'Neptune is so far away that one trip around the Sun takes 165 years!']],
  };
  const SPIN_DUR = { zoom: 1.5, roll: 1.6, wobble: 1.4, float: 2.2 };

  class MapScene {
    constructor() {
      this.stars = new SA.Starfield(240, 11);
      this.shooting = new SA.ShootingStars(3, 7);
      this.fx = new SA.Particles();
      this.t = 0;
      this.flight = null;
      this.comet = null;
      this.cometWait = 6;
    }

    layout() {
      const W = SA.W, H = SA.H, k = H / 720;
      this.sun = { x: -150 * k, y: H * 0.52, r: 270 * k };
      const x0 = 250 * k, x1 = W - 85;
      this.nodes = SA.PLANET_IDS.map((id, i) => {
        const d = x0 + (i * (x1 - x0)) / 7 - this.sun.x;
        const v = OFFSETS[id] * k;
        const prev = this.nodes && this.nodes.find(n => n.id === id);
        return { id, d, x: this.sun.x + Math.sqrt(d * d - v * v), y: this.sun.y + v, r: SA.BODY[id].mapR, pop: prev ? prev.pop : 0,
          spinT: prev ? prev.spinT : 0, spinV: prev ? prev.spinV : 0, react: prev ? prev.react : null, poke: prev ? prev.poke : 0 };
      });
      // Asteroid belt between Mars and Jupiter.
      const mars = this.node('mars'), jup = this.node('jupiter');
      this.belt = { r0: mars.d + 26, r1: jup.d - 22 };
      this.bakeBackdrop();
      const rnd = SA.seeded(77);
      this.asteroids = [];
      for (let i = 0; i < 260; i++) {
        // Bunch the rocks toward the middle of the belt.
        const u = (rnd() + rnd() + rnd()) / 3;
        const d = SA.lerp(this.belt.r0, this.belt.r1, u);
        const big = rnd() > 0.9;
        this.asteroids.push({ d, a: (rnd() - 0.5) * 1.3, s: big ? 3 + rnd() * 2 : 0.9 + rnd() * 2, sp: 0.004 + rnd() * 0.006, c: SA.pick(BELT_COLORS) });
      }
    }

    // The sky behind everything is drawn once per layout: deep gradient, a soft Milky Way band
    // full of faint dust stars, and a tiny far-away spiral galaxy.
    bakeBackdrop() {
      const W = SA.W, H = SA.H;
      // Baked a little sharper than 1:1 so the dust stars stay crisp on Retina screens.
      const k = SA.clamp(SA.pixelScale || 1, 1, 1.5);
      const c = this.bg || document.createElement('canvas');
      c.width = Math.round(W * k); c.height = Math.round(H * k);
      const g = c.getContext('2d');
      g.setTransform(k, 0, 0, k, 0, 0);
      const sky = g.createLinearGradient(0, 0, W * 0.3, H);
      sky.addColorStop(0, '#080b28');
      sky.addColorStop(0.55, '#140f3c');
      sky.addColorStop(1, '#22134a');
      g.fillStyle = sky;
      g.fillRect(0, 0, W, H);
      const rnd = SA.seeded(404);
      // Milky Way: a diagonal band of soft glows.
      const bx0 = W * 0.2, by0 = H * 1.05, bx1 = W * 1.05, by1 = -H * 0.1;
      for (let i = 0; i < 46; i++) {
        const u = rnd(), off = (rnd() - 0.5) * H * 0.22;
        const x = SA.lerp(bx0, bx1, u) + off * 0.6, y = SA.lerp(by0, by1, u) + off;
        const r = 60 + rnd() * 120;
        const gl = g.createRadialGradient(x, y, 0, x, y, r);
        const tint = rnd();
        gl.addColorStop(0, tint > 0.7 ? 'rgba(255,190,230,0.07)' : tint > 0.35 ? 'rgba(170,190,255,0.08)' : 'rgba(220,210,255,0.07)');
        gl.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gl;
        g.fillRect(x - r, y - r, r * 2, r * 2);
      }
      for (let i = 0; i < 700; i++) {
        const u = rnd(), off = (rnd() + rnd() + rnd() - 1.5) * H * 0.2;
        const x = SA.lerp(bx0, bx1, u) + off * 0.6, y = SA.lerp(by0, by1, u) + off;
        g.fillStyle = 'rgba(230,235,255,' + (0.15 + rnd() * 0.35) + ')';
        g.fillRect(x, y, rnd() < 0.85 ? 1 : 1.6, rnd() < 0.85 ? 1 : 1.6);
      }
      // A little spiral galaxy far away (the way into the Galaxy Trip, once it opens).
      const gx = W * 0.85, gy = H * 0.19;
      g.save();
      g.translate(gx, gy);
      g.rotate(-0.5);
      g.scale(1, 0.45);
      const core = g.createRadialGradient(0, 0, 0, 0, 0, 34);
      core.addColorStop(0, 'rgba(255,240,220,0.55)');
      core.addColorStop(0.3, 'rgba(200,180,255,0.18)');
      core.addColorStop(1, 'rgba(120,100,220,0)');
      g.fillStyle = core;
      g.beginPath(); g.arc(0, 0, 34, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(200,190,255,0.16)';
      g.lineWidth = 3;
      for (const s of [0, Math.PI]) {
        g.beginPath();
        for (let a = 0; a < 4.2; a += 0.15) {
          const rr = 6 + a * 7;
          g.lineTo(Math.cos(a + s) * rr, Math.sin(a + s) * rr);
        }
        g.stroke();
      }
      g.restore();
      this.bg = c;
    }

    node(id) { return this.nodes.find(n => n.id === id); }

    // Where the rocket parks beside a planet.
    parkSpot(id) {
      if (id === 'galaxy') { const g = this.galaxyPos(); return { x: g.x - 70, y: g.y + 70 }; }
      const n = this.node(id) || this.node(id === 'iss' ? 'earth' : SA.BONUS[id] || 'earth') || this.node('earth');
      return { x: n.x - n.r - 40, y: n.y - n.r - 22 };
    }

    resize() {
      this.layout();
      if (this.rocket && !this.flight) {
        const p = this.parkSpot(SA.state.at);
        this.rocket.x = p.x; this.rocket.y = p.y;
      }
    }

    enter(opts) {
      opts = opts || {};
      this.layout();
      SA.ui.setScene('map');
      SA.ui.updateHud();
      SA.audio.music('space');
      this.flight = null;
      const p = this.parkSpot(SA.state.at);
      this.rocket = { x: p.x, y: p.y, ang: 0.5, scale: 1 };

      // Players from before an update hear about what's new, once (and briefly, however many
      // updates they missed).
      const news = SA.state.introSeen && !opts.completed && !opts.expertDone ? this.newsLines() : null;
      if (news && !news.length) this.markNews();
      if (opts.expertDone) {
        // Back from an Expert mission: the badge count, and any wardrobe unlocks.
        const lines = SA.expertMapLines(opts.expertDone, opts.first);
        const un = opts.unlocked || [];
        if (un.length) lines.push('You also unlocked ' + un.map(it => 'the ' + it.name + (SA.PAINTS.indexOf(it) >= 0 ? ' rocket paint' : '')).join(' and ') + '! Tap the 🎩 button to see!');
        if (SA.story && SA.story.check()) lines.push('Beep beep! 📡 A space postcard from my family just arrived at my Space Base! Tap the 🏠 button to read it! 💌');
        SA.ui.say(lines);
      } else if (opts.fromTitle && !SA.state.introSeen) {
        SA.ui.say([
          'Hi! I\'m Cosmo! 👋 I\'m a little alien from far, far away.',
          'This is our Solar System. The Sun is in the middle, and eight planets travel around it.',
          'Let\'s explore it together! Tap the Earth to start our trip. 🌍',
        ]).then(() => { SA.state.introSeen = true; this.markNews(); });
      } else if (news && news.length) {
        SA.ui.say(news).then(() => this.markNews());
      } else if (opts.completed && !SA.state.tourDone && SA.MISSIONS.every(id => SA.state.done[id])) {
        this.grandTour();
      } else if (opts.completed) {
        const id = opts.completed;
        const bonus = !!SA.BONUS[id];
        const next = bonus ? null : SA.MISSIONS[SA.MISSIONS.indexOf(id) + 1];
        const lines = [];
        if (bonus) {
          lines.push(SA.BONUS_DONE[id]);
        } else if (next && !SA.state.done[next]) {
          const nb = SA.BODY[next];
          lines.push('Great job, space explorer! 🎉 Now we can visit ' + nb.name + ', ' + SA.NICKNAMES[next].toLowerCase() + '. Tap ' + nb.name + ' to fly there! 🚀');
        } else if (!next || SA.MISSIONS.every(m => SA.state.done[m])) {
          lines.push(
            'Wow! You explored ' + SA.MISSIONS.map(m => SA.BODY[m].name).join(', ').replace(/, ([^,]*)$/, ' AND $1') + '! 🚀',
            'Replay missions to earn more stars, and look for shy space critters! 🐾');
        }
        // The first time a planet is finished, tell the child about the bonus mission it opened.
        const opened = SA.bonusesOf(id).filter(k => !SA.state.done[k]);
        const bname = k => SA.MISSION_NAMES[k].replace(/^\S+ /, '');
        if (opts.first && opened.length === 1) {
          lines.push('Psst... you also unlocked a bonus mission: ' + bname(opened[0]) + '! ' + SA.BONUS_WHERE[opened[0]]);
        } else if (opts.first && opened.length > 1) {
          lines.push('Psst... you also unlocked ' + (['', 'one', 'two', 'three'][opened.length] || opened.length) + ' bonus missions: ' + opened.map(bname).join(', ').replace(/, ([^,]*)$/, ' and $1') + '! 🎉',
            opened.length > 2 ? 'Tap ' + SA.BODY[id].name + ' to see them all, or look for the glowing spots on the map! ✨' : opened.map(k => SA.BONUS_WHERE[k]).join(' '));
        }
        // New toys and challenges for this round, each told once at the right moment.
        if (opts.first && id === 'mars') lines.push('Astronauts need a home on Mars, too! Tap Mars, then 🏗️ Mars Base, to build one! 👩‍🚀');
        if (opts.first && id === 'jupiter' && !SA.expertCount()) lines.push('Psst... big explorers can try 🎓 Expert missions! They\'re extra tricky, with brand-new facts. Find them on the planet cards!');
        // Space critters: celebrate the very first one, or tease them after the first mission.
        const crit = SA.CRITTER[id];
        if (crit && SA.state.critters[id] && SA.critters.count() === 1 && !SA.state.baseSeen) {
          lines.push(crit.name + ' the critter moved into my Space Base! Tap the 🏠 button to visit! 🐾');
        } else if (opts.first && id === 'earth' && !SA.state.critters.earth) {
          lines.push('Psst... did you see a shy little critter peeking at you? Critters hide in every mission. Tap one to find it! 🐾');
        }
        const un = opts.unlocked || [];
        // Paints are for the rocket, so they get the word "paint" (and you paint with them, not try them on).
        const isPaint = it => SA.PAINTS.indexOf(it) >= 0;
        if (un.length) {
          lines.push('You unlocked ' + un.map(it => 'the ' + it.name + (isPaint(it) ? ' rocket paint' : '')).join(' and ') + '! Tap the 🎩 button to ' +
            (un.every(isPaint) ? 'paint your rocket!' : 'try ' + (un.length > 1 ? 'them' : 'it') + ' out!'));
        }
        // A space postcard from Cosmo's family is waiting at the base.
        if (SA.story && SA.story.check()) lines.push('Beep beep! 📡 A space postcard from my family just arrived at my Space Base! Tap the 🏠 button to read it! 💌');
        if (lines.length) SA.ui.say(lines);
        else SA.ui.hint('Welcome back! Tap a planet to visit it! 🪐', 5);
      } else if (SA.state.introSeen && SA.state.factDay !== SA.dayKey()) {
        // One fun fact a day, the first time the map opens that day. Waits for a free moment,
        // and only counts as seen once it has actually been shown.
        let tries = 0;
        const show = () => {
          if (SA.scene !== this) return;
          if (SA.ui.blocking() || this.flight) { if (++tries < 15) setTimeout(show, 1000); return; }
          SA.state.factDay = SA.dayKey();
          SA.save();
          SA.ui.hideTalk();
          SA.ui.dailyFact();
        };
        setTimeout(show, 700);
      } else {
        // Cosmo says hello for the time of day (the device clock; nothing leaves the device).
        const h = new Date().getHours();
        const hi = h < 5 ? 'Hello, night owl! 🦉' : h < 12 ? 'Good morning, explorer! ☀️' : h < 18 ? 'Good afternoon, explorer! 🌤️' : 'Good evening, explorer! 🌙';
        if (SA.state.introSeen && SA.story && SA.story.check()) SA.ui.hint('Beep beep! 📡 A space postcard from my family arrived at my Space Base! Tap the 🏠 button to read it! 💌', 7);
        else SA.ui.hint(SA.state.introSeen ? hi + ' Tap a planet to visit it!' : 'Tap a planet to visit it! 🪐', 5);
      }
      this.idleT = 0;
      this.rocketWiggle = 0;
    }

    exit() { SA.ui.hideTalk(); this.fireworkT = 0; this.plutoHidden = false; this.press = null; this.bubble = null; }

    // What's new since this player's last update, in a few short lines. Each update's news is
    // told once; someone who missed several hears one combined version, not a long stack.
    newsLines() {
      const st = SA.state, lines = [];
      const base = !st.news2, sky = !st.news3, toys = !st.news4, v6 = !st.news6, v7 = !st.news7, v8 = !st.news8, v9 = !st.news9;
      const open = id => SA.isUnlocked(id) && !st.done[id];
      const and = list => list.join(', ').replace(/, ([^,]*)$/, ' and $1');
      if (base + sky + toys + v6 + v7 + v8 + v9 > 1) lines.push('Welcome back, explorer! Lots of new things arrived while you were away! 🎉');
      if (base) {
        lines.push('I built a Space Base! 🏠 Tap the 🏠 button to visit me at home and decorate it! And shy space critters hide in every mission now. Tap one when it peeks in! 🐾');
      }
      const extra = [];
      if (sky) extra.push('look at the stars with my telescope 🔭');
      if (toys) extra.push('build your own rocket 🔧');
      if (v6) extra.push('grow space plants in my new greenhouse 🌱');
      if (extra.length) lines.push((base ? 'At my base you can also ' : 'At my Space Base 🏠 you can now ') + and(extra) + '!');
      if (toys) lines.push('Tap 🪐 to play with planets and make your own orbits! And swipe a planet on the map to make it spin! 🌀' + (v8 ? ' Tap 🎤 for my quiz show and a planet song! 🎵' : ''));
      if (toys && !sky) lines.push('My telescope 🔭 has new star pictures too: Scorpius the Scorpion and the Little Dipper! ⭐');
      if (v6 && !sky && st.skySeen) lines.push('My telescope 🔭 has two new star pictures: Taurus the Bull and Pegasus the flying horse! ⭐');
      if (v6 && SA.myRocket()) lines.push('And look at my rocket! 🚀 It\'s the one YOU built in the Workshop. Now I fly it everywhere!');
      if (v7) {
        lines.push('I made you a Space Journal! Tap the 📔 button to draw your discoveries and see what the real Moon looks like tonight. 🌙' +
          (st.done.earth ? ' And my family sends me space postcards now! 💌' : ''));
      }
      if (v8) {
        // This round: Cosmo's Stage (quiz show and song), Expert missions and the Mars Base.
        const bits = toys ? [] : ['Tap the 🎤 button for my quiz show and a planet song!'];
        if (st.done.mars) bits.push('Tap Mars to build a Mars Base. 🏗️');
        if (SA.MISSIONS.some(id => st.done[id])) bits.push((bits.length ? 'And planets' : 'Planets') + ' you explored have 🎓 Expert missions now!');
        if (bits.length) lines.push(bits.join(' '));
        if (st.story >= 1 && !v7) lines.push('Psst... my family\'s postcards are in our Space Journal 📔 now, so you can read them again! 💌');
      }
      if (v9) {
        // This round: Space Camp, the Moon Song and family quiz shows (all on the 🎤 stage), and new Mars Base parts.
        const v9line = (v8 ? 'On my 🎤 stage there\'s also' : 'Tap the 🎤 button for') + ' Space Camp 🏕️, a little astronaut training for every day, and a new Moon Song! 🌙';
        const v9more = ((st.shows ? 'My quiz show has a family mode now: play in two teams! 👨‍👩‍👧 ' : '') +
          (st.marsBase && st.marsBase.done ? 'And the Mars Base has a science lab and a launch pad! 🔬🚀' : '')).trim();
        // Someone who missed lots of updates hears it as part of the last line, so the talk stays short.
        if (v8 && lines.length > 3) lines[lines.length - 1] += ' ' + v9line;
        else { lines.push(v9line); if (v9more) lines.push(v9more); }
      }
      // Bonus missions that opened for this player since their last visit (one line).
      const fresh = [];
      if (base && open('belt')) fresh.push('belt');
      if (base && open('sun')) fresh.push('sun');
      if (sky && open('comet')) fresh.push('comet');
      // (Players already past Neptune heard about the station when it opened for them then.)
      if ((toys || (!st.news5 && !st.done.neptune)) && open('iss')) fresh.push('iss');
      if (v6 && open('europa')) fresh.push('europa');
      if (v6 && open('galaxy')) fresh.push('galaxy');
      if (v7 && open('titan')) fresh.push('titan');
      const name = k => SA.MISSION_NAMES[k].replace(/^\S+ /, '');
      if (fresh.length === 1 && fresh[0] === 'iss' && !lines.length) {
        // The only news: the space station now opens after Saturn, and this player is past Saturn.
        lines.push('Surprise! 🛰️ Because you explored Saturn, you can visit the International Space Station now!', SA.BONUS_WHERE.iss);
      } else if (fresh.length === 1) {
        lines.push('A bonus mission is waiting for you: ' + name(fresh[0]) + '! ' + SA.BONUS_WHERE[fresh[0]]);
      } else if (fresh.length) {
        lines.push('Bonus missions are waiting for you: ' + and(fresh.map(name)) + '! Look for the glowing spots on the map. ✨');
      }
      if (base + sky + toys + v6 + v7 + v8 + v9 === 1 && lines.length) lines[0] = 'Guess what? ' + lines[0];
      return lines;
    }
    markNews() {
      const st = SA.state;
      st.news2 = st.news3 = st.news4 = st.news5 = st.news6 = st.news7 = st.news8 = st.news9 = true;
      if (st.rocketBuild && !st.rocketShape) st.rocketShape = 'mine';   // told about it just now
      SA.save();
    }

    // Where the bonus missions sit on the map: Ceres in the asteroid belt, and the Sun's edge.
    ceresPos() {
      const mid = (this.belt.r0 + this.belt.r1) / 2, dy = -SA.H * 0.3;
      return { x: this.sun.x + Math.sqrt(Math.max(0, mid * mid - dy * dy)), y: this.sun.y + dy };
    }
    sunSpot() { return { x: this.sun.x + this.sun.r * 0.78, y: this.sun.y }; }
    // A comet parked in the open space under Uranus (clear of Cosmo's speech bubble on iPad):
    // the "Comet Ride" bonus.
    cometSpot() { return { x: SA.W * 0.79, y: SA.H * 0.85 }; }

    // Every planet visited: fireworks, rewards, and the secret of Pluto.
    async grandTour() {
      SA.state.tourDone = true;
      SA.state.wardNew = true;
      SA.save();
      SA.ui.updateHud();
      SA.audio.music('tour');
      this.plutoHidden = true;
      this.fireworkT = 7;
      SA.celebrate(160);
      await SA.ui.banner('Grand Tour Complete!', 'You explored all 8 planets! 🏆', 'gold', 3);
      if (SA.scene !== this) return;
      await SA.ui.say([
        'You did it! You visited every planet in the Solar System! 🏆🎉',
        'You earned the golden Explorer hat and a Golden rocket! Tap the 🎩 button to try them on!',
      ].concat(SA.state.done.iss ? [] : ['Don\'t forget the International Space Station next to Earth! Tap it for a bonus mission! 🛰️'], [
        'Wait... look over there! Something tiny is out past Neptune... 👀',
      ]));
      this.plutoHidden = false;
      if (SA.scene !== this) return;
      this.plutoPop = 1;
      SA.audio.play('card');
      SA.audio.music('space');
      SA.ui.hint('Tap the tiny world to find out what it is! ✨', 0);
    }

    plutoPos() {
      const nep = this.node('neptune');
      return { x: nep.x - 10, y: Math.min(SA.H - 70, nep.y + nep.r + 120), r: 9 };
    }

    tapPluto() {
      const b = SA.BODY.pluto;
      SA.audio.play('pop');
      if (!SA.state.cards.pluto) {
        SA.ui.say(b.teaser).then(() => {
          const isNew = SA.giveCard('pluto');
          SA.ui.updateHud();
          return SA.ui.card('pluto', { isNew });
        }).then(() => {
          // Finding Pluto opens the deep-space finale.
          if (SA.scene !== this || SA.state.done.galaxy) return;
          SA.audio.play('card');
          return SA.ui.say([
            'Psst... look at the swirly galaxy at the top of the map! It\'s glowing now! ✨',
            'Tap it for our biggest trip ever: all the way to the middle of our galaxy! 🌌',
          ]);
        });
      } else {
        SA.ui.hint(SA.pick(b.facts) + ' 💗', 6);
      }
    }

    moonPos(n, m, i) {
      const a = this.t * m.sp + i * 2.1;
      return { x: n.x + Math.cos(a) * n.r * m.o, y: n.y + Math.sin(a) * n.r * m.o * 0.38, front: Math.sin(a) > 0 };
    }

    onDown(x, y) {
      this.idleT = 0;
      if (this.flight) return;
      // Cosmo waves from his parked rocket.
      const rk = this.rocket;
      if (Math.hypot(x - rk.x, y - rk.y) < 34) {
        this.rocketWiggle = 1;
        SA.audio.play('giggle');
        this.lastQuip = SA.pick(SA.COSMO_ROCKET.filter(l => l !== this.lastQuip));
        SA.ui.hint(this.lastQuip, 4);
        return;
      }
      const cp = this.ceresPos();
      if (Math.hypot(x - cp.x, y - cp.y) < 30) { this.tapBelt(); return; }
      const cs = this.cometSpot();
      if (Math.hypot(x - cs.x, y - cs.y) < 40 || (Math.abs(x - cs.x) < 50 && y > cs.y && y < cs.y + 56)) { this.tapCometSpot(); return; }
      const c = this.comet;
      if (c && Math.hypot(x - c.x, y - c.y) < 50) {
        SA.audio.play('collect');
        this.fx.spawn('sparkle', c.x, c.y, 16, { color: '#bff4ff' });
        SA.ui.hint(SA.EXTRA_FACTS.comet + ' ☄️', 0);
        return;
      }
      // The little Moon often passes over Earth: a tap goes to whichever one it is nearer,
      // so tapping Earth (the very first thing a new player is asked to do) always opens Earth.
      const earth = this.node('earth');
      const mp = this.moonPos(earth, MOONS.earth[0], 0);
      const dMoon = Math.hypot(x - mp.x, y - mp.y), dEarth = Math.hypot(x - earth.x, y - earth.y);
      if (dMoon < 26 && dMoon < dEarth) { this.tapMoon(); return; }
      // Europa circles Jupiter: the nearer of the two wins, just like the Moon and Earth.
      const jup = this.node('jupiter'), ep = this.moonPos(jup, MOONS.jupiter[1], 1);
      const dEu = Math.hypot(x - ep.x, y - ep.y);
      if (dEu < 24 && dEu < Math.hypot(x - jup.x, y - jup.y) * 0.8) { this.tapEuropa(); return; }
      // So does Titan, circling Saturn.
      const sat = this.node('saturn'), tp = this.moonPos(sat, MOONS.saturn[0], 0);
      const dTi = Math.hypot(x - tp.x, y - tp.y);
      if (dTi < 24 && dTi < Math.hypot(x - sat.x, y - sat.y) * 0.8) { this.tapTitan(); return; }
      const gp = this.galaxyPos();
      if (Math.hypot(x - gp.x, y - gp.y) < 40) { this.tapGalaxy(); return; }
      const ip = this.issPos(), dIss = Math.hypot(x - ip.x, y - ip.y);
      if (this.issShown() && dIss < 28 && dIss < dEarth) { this.tapIss(); return; }
      if (SA.state.tourDone && !this.plutoHidden) {
        const pp = this.plutoPos();
        if (Math.hypot(x - pp.x, y - pp.y) < 36) { this.tapPluto(); return; }
      }
      if (Math.hypot(x - this.sun.x, y - this.sun.y) < this.sun.r) { this.tapSun(); return; }
      let best = null, bestD = 1e9;
      for (const n of this.nodes) {
        const d = Math.hypot(x - n.x, y - n.y);
        if (d < Math.max(n.r + 20, 40) && d < bestD) { best = n; bestD = d; }
      }
      // A planet opens its card on a tap, but a swipe across it spins it instead (decided on release).
      if (best) { this.press = { n: best, x0: x, y0: y, lx: x, lt: performance.now(), v: 0, swiped: false }; return; }
      const ds = Math.hypot(x - this.sun.x, y - this.sun.y);
      if (ds > this.belt.r0 - 10 && ds < this.belt.r1 + 10) {
        this.fx.spawn('sparkle', x, y, 8, { color: '#d8c8b8' });
        this.tapBelt();
      }
    }

    onMove(x, y) {
      const p = this.press;
      if (!p) return;
      const now = performance.now(), dts = Math.max(0.008, (now - p.lt) / 1000);
      if (!p.swiped && Math.hypot(x - p.x0, y - p.y0) > 18) p.swiped = true;
      if (p.swiped) {
        const n = p.n, dx = x - p.lx;
        // The surface follows the finger (Venus always turns the other way).
        n.spinT += dx * 0.12 * (n.id === 'venus' ? -1 : 1);
        p.v = SA.lerp(p.v, dx / dts, 0.5);
        if (Math.random() < 0.3) SA.audio.play('spin');
      }
      p.lx = x; p.lt = now;
    }

    onUp() {
      const p = this.press;
      if (!p) return;
      this.press = null;
      if (!p.swiped) { this.tapPlanet(p.n); return; }
      const still = performance.now() - p.lt > 140;
      this.spinPlanet(p.n, still ? 0 : p.v);
    }

    // A swiped planet keeps spinning, does its silly trick and says one of its facts.
    spinPlanet(n, v) {
      const pk = POKE[n.id];
      if (!pk) return;
      const dir = n.id === 'venus' ? -1 : 1;
      n.spinV = SA.clamp(v * 0.06, -60, 60) * dir;
      if (Math.abs(n.spinV) < 10) n.spinV = (v < 0 ? -12 : 12) * dir;
      n.react = { kind: pk[0], t: 0, dir: v < 0 ? -1 : 1 };
      n.pop = 1;
      const b = SA.BODY[n.id];
      SA.audio.play(pk[0] === 'whoosh' || pk[0] === 'zoom' ? 'whoosh' : pk[0] === 'sneeze' ? 'giggle' : pk[0] === 'wobble' || pk[0] === 'float' ? 'boing' : 'pop');
      this.fx.spawn('sparkle', n.x, n.y, 8, { color: b.color });
      if (pk[0] === 'sneeze') {
        for (let i = 0; i < 18; i++) {
          const a = SA.rand(-0.6, 0.6) + (v < 0 ? Math.PI : 0), sp = SA.rand(60, 180);
          this.fx.list.push({ kind: 'dot', x: n.x, y: n.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: SA.rand(0.7, 1.2), size: SA.rand(2.5, 5), rot: 0, color: 'rgba(214,110,70,0.75)' });
        }
        this.fx.text(n.x, n.y - n.r - 20, 'Achoo!', '#ffb08a');
      }
      if (pk[0] === 'daynight') this.fx.text(n.x, n.y - n.r - 22, SA.pick(['☀️ Day!', '🌙 Night!']), '#fff');
      if (pk[0] === 'backspin') this.fx.text(n.x, n.y - n.r - 22, '🙃', '#fff');
      // A short fact bubble by the planet, read aloud (the next fact each time).
      n.poke = (n.poke || 0) + 1;
      const fact = pk[1][(n.poke - 1) % pk[1].length];
      this.bubble = { n, text: fact, t: 0 };
      SA.voice.say(fact);
      this.idleT = 0;
    }

    // The International Space Station, parked just above Earth (clear of its check badge and the
    // Moon's path). It only appears once Earth is explored, so a brand-new map stays simple.
    issPos() {
      const e = this.node('earth'), k = SA.H / 720;
      return { x: e.x + 4 * k, y: e.y - e.r - 36 * k };
    }
    issShown() { return !!SA.state.done.earth || SA.isUnlocked('iss'); }

    tapIss() {
      SA.audio.play('pop');
      const p = this.issPos();
      this.fx.spawn('sparkle', p.x, p.y, 8, { color: '#cfe0ff' });
      if (SA.isUnlocked('iss')) { SA.ui.hideTalk(); SA.ui.planetCard('iss', { fly: id => this.flyTo(id) }); }
      else SA.ui.hint(SA.EXTRA_FACTS.iss + ' Finish Saturn to visit it! 🛰️', 0);
    }

    // The belt opens its bonus mission card once Mars is done; before that it tells a fact.
    tapBelt() {
      SA.audio.play('pop');
      if (SA.isUnlocked('belt')) { SA.ui.hideTalk(); SA.ui.planetCard('belt', { fly: id => this.flyTo(id) }); }
      else SA.ui.hint(SA.EXTRA_FACTS.belt + ' Finish Mars to unlock a mission here! 🪨', 0);
    }

    tapCometSpot() {
      SA.audio.play('pop');
      const p = this.cometSpot();
      this.fx.spawn('sparkle', p.x, p.y, 10, { color: '#bff4ff' });
      if (SA.isUnlocked('comet')) { SA.ui.hideTalk(); SA.ui.planetCard('comet', { fly: id => this.flyTo(id) }); }
      else SA.ui.hint(SA.EXTRA_FACTS.comet + ' Finish Saturn to ride one! ☄️', 0);
    }

    tapSun() {
      SA.audio.play('pop');
      const b = SA.BODY.sun;
      if (!SA.state.cards.sun) {
        SA.ui.say(b.teaser).then(() => {
          const isNew = SA.giveCard('sun');
          SA.ui.updateHud();
          return SA.ui.card('sun', { isNew });
        });
      } else {
        // The Sun's card shows its "Star Story" bonus mission (or what to finish first).
        SA.ui.hideTalk();
        SA.ui.planetCard('sun', { fly: id => this.flyTo(id) });
      }
    }

    // Tapping a planet opens its info card (stars, mission, fact card, Fly button).
    tapPlanet(n) {
      const b = SA.BODY[n.id];
      n.pop = 1;
      SA.audio.play('pop');
      this.fx.spawn('sparkle', n.x, n.y, 10, { color: b.color });
      SA.ui.hideTalk();
      SA.ui.planetCard(n.id, { fly: (id, o) => this.flyTo(id, o) });
    }

    // opts.expert: fly to the planet's Expert mission (a harder replay).
    flyTo(id, opts) {
      if (this.flight) return;
      SA.audio.play('launch');
      SA.ui.hint((opts && opts.expert ? '🎓 Expert mission: ' : 'Next stop: ') + SA.BODY[id].name + '! 🚀', 3);
      this.startFlight(id);
      this.flight.expert = !!(opts && opts.expert);
    }

    tapEuropa() {
      SA.audio.play('pop');
      if (SA.isUnlocked('europa')) { SA.ui.hideTalk(); SA.ui.planetCard('europa', { fly: id => this.flyTo(id) }); }
      else SA.ui.hint('That\'s Europa, one of Jupiter\'s moons. It\'s covered in ice! Finish Jupiter\'s mission to dive under the ice! 🧊', 0);
    }

    tapTitan() {
      SA.audio.play('pop');
      if (SA.isUnlocked('titan')) { SA.ui.hideTalk(); SA.ui.planetCard('titan', { fly: id => this.flyTo(id) }); }
      else SA.ui.hint(SA.EXTRA_FACTS.titan + ' Finish Saturn\'s mission to fly a drone there! 🚁', 0);
    }

    // The little spiral galaxy at the top of the map: the Galaxy Trip, once Pluto is found.
    // (Kept in the open sky between Saturn and Neptune, below the buttons along the top.)
    galaxyPos() { return { x: SA.W * 0.85, y: SA.H * 0.19 }; }
    tapGalaxy() {
      SA.audio.play('pop');
      const p = this.galaxyPos();
      this.fx.spawn('sparkle', p.x, p.y, 10, { color: '#d8ccff' });
      if (SA.isUnlocked('galaxy')) { SA.ui.hideTalk(); SA.ui.planetCard('galaxy', { fly: id => this.flyTo(id) }); }
      else SA.ui.hint('That fuzzy swirl is a galaxy: a giant family of billions of stars! Keep exploring, and one day we\'ll fly there. 🌌', 0);
    }

    tapMoon() {
      SA.audio.play('pop');
      if (SA.isUnlocked('moon')) SA.ui.planetCard('moon', { fly: id => this.flyTo(id) });
      else SA.ui.hint(SA.EXTRA_FACTS.moon + ' Finish Earth\'s mission to unlock a Moon mission! 🌙', 0);
    }

    startFlight(id) {
      const from = { x: this.rocket.x, y: this.rocket.y };
      let n = this.node(id);
      if (id === 'moon') {
        const earth = this.node('earth');
        n = this.moonPos(earth, MOONS.earth[0], 0);
      }
      if (id === 'belt') n = this.ceresPos();
      if (id === 'sun') n = this.sunSpot();
      if (id === 'comet') n = this.cometSpot();
      if (id === 'iss') n = this.issPos();
      if (id === 'europa') n = this.moonPos(this.node('jupiter'), MOONS.jupiter[1], 1);
      if (id === 'titan') n = this.moonPos(this.node('saturn'), MOONS.saturn[0], 0);
      if (id === 'galaxy') n = this.galaxyPos();
      const to = { x: n.x, y: n.y };
      const mid = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - 160 };
      this.flight = { id, from, mid, to, t: 0, dur: 1.3 };
    }

    spawnComet() {
      const H = SA.H, W = SA.W;
      const fromRight = Math.random() < 0.5;
      this.comet = {
        x: fromRight ? W + 60 : W * SA.rand(0.4, 0.8), y: fromRight ? SA.rand(H * 0.1, H * 0.35) : -60,
        vx: fromRight ? -SA.rand(70, 95) : -SA.rand(40, 70), vy: fromRight ? SA.rand(15, 35) : SA.rand(45, 65),
      };
    }

    update(dt) {
      this.t += dt;
      this.shooting.update(dt);
      this.rocketWiggle = Math.max(0, (this.rocketWiggle || 0) - dt * 1.5);
      // After a quiet while, Cosmo muses out loud (one short tip, then a long pause).
      if (!this.flight && !SA.ui.blocking() && !SA.ui.talking() && !SA.transitioning && SA.state.introSeen) {
        this.idleT = (this.idleT || 0) + dt;
        if (this.idleT > 24) {
          this.idleT = -12;
          this.lastIdle = SA.pick(SA.COSMO_IDLE.filter(l => l !== this.lastIdle));
          this.rocketWiggle = 1;
          SA.ui.hint(this.lastIdle, 5);
        }
      }
      this.plutoPop = Math.max(0, (this.plutoPop || 0) - dt * 1.5);
      // Fireworks for the Grand Tour.
      if (this.fireworkT > 0) {
        this.fireworkT -= dt;
        this.fwWait = (this.fwWait || 0) - dt;
        if (this.fwWait <= 0) {
          this.fwWait = SA.rand(0.18, 0.4);
          const fx = SA.rand(SA.W * 0.15, SA.W * 0.9), fy = SA.rand(SA.H * 0.12, SA.H * 0.55);
          const color = SA.pick(['#ff6b8b', '#ffd84d', '#5fc8ff', '#7ee08a', '#b48cff', '#ff9f4a']);
          for (let i = 0; i < 26; i++) {
            const a = (i / 26) * Math.PI * 2, sp = SA.rand(160, 260);
            this.fx.list.push({ kind: 'sparkle', x: fx, y: fy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: SA.rand(0.8, 1.2), size: SA.rand(5, 8), rot: a, color });
          }
          SA.audio.play('pop');
        }
      }
      for (const n of this.nodes) {
        n.pop = Math.max(0, n.pop - dt * 2.5);
        // Spinning planets slow down gently.
        n.spinT += n.spinV * dt;
        n.spinV *= Math.pow(0.35, dt);
        if (Math.abs(n.spinV) < 0.3) n.spinV = 0;
        if (n.react) {
          n.react.t += dt;
          if (n.react.kind === 'whoosh' && Math.random() < dt * 14) {
            this.fx.list.push({ kind: 'dot', x: n.x - n.r * 1.6, y: n.y + SA.rand(-n.r, n.r), vx: 260, vy: 0, life: 0, max: 0.5, size: 2, rot: 0, color: 'rgba(200,225,255,0.8)' });
          }
          if (n.react.kind === 'float' && Math.random() < dt * 6) this.fx.spawn('dot', n.x + SA.rand(-n.r, n.r), n.y + n.r * 0.6, 1, { color: 'rgba(200,235,255,0.7)' });
          if (n.react.t > (SPIN_DUR[n.react.kind] || 1.2)) n.react = null;
        }
      }
      if (this.bubble) { this.bubble.t += dt; if (this.bubble.t > 6) this.bubble = null; }
      for (const a of this.asteroids) a.a += a.sp * dt;

      // Comet.
      if (this.comet) {
        const c = this.comet;
        c.x += c.vx * dt; c.y += c.vy * dt;
        if (c.x < -200 || c.y > SA.H + 200) this.comet = null;
      } else {
        this.cometWait -= dt;
        if (this.cometWait <= 0) { this.cometWait = SA.rand(18, 30); this.spawnComet(); }
      }

      const r = this.rocket;
      const f = this.flight;
      if (f) {
        f.t += dt;
        const k = SA.easeInOut(f.t / f.dur);
        const bez = (a, b, c, u) => (1 - u) * (1 - u) * a + 2 * (1 - u) * u * b + u * u * c;
        const nx = bez(f.from.x, f.mid.x, f.to.x, k), ny = bez(f.from.y, f.mid.y, f.to.y, k);
        if (Math.hypot(nx - r.x, ny - r.y) > 0.5) r.ang = Math.atan2(ny - r.y, nx - r.x) + Math.PI / 2;
        r.x = nx; r.y = ny;
        r.scale = 1 - Math.max(0, k - 0.75) * 2.4;
        const back = r.ang + Math.PI / 2;
        this.fx.spawn('puff', r.x + Math.cos(back) * 40, r.y + Math.sin(back) * 40, 2, { vx: Math.cos(back) * 80, vy: Math.sin(back) * 80 });
        if (f.t >= f.dur && !f.left) f.left = SA.go(SA.flight, { to: f.id, expert: f.expert });
      } else {
        r.scale = 1;
        r.ang = SA.lerp(r.ang, 0.45, Math.min(1, dt * 3));
        if (Math.random() < 0.25) this.fx.spawn('sparkle', r.x + SA.rand(-6, 6), r.y + 30, 1, { color: '#ffe9a8' });
      }
      this.fx.update(dt);
    }

    draw(ctx) {
      const W = SA.W, H = SA.H, t = this.t;
      if (this.bg) ctx.drawImage(this.bg, 0, 0, W, H);
      else SA.spaceBg(ctx, '#0a0d2c', '#1d1446');
      SA.nebula(ctx, t, NEBULA);
      this.stars.draw(ctx, t, 0);
      this.shooting.draw(ctx);

      // Orbits: a faint glowing track with marching dashes; the next mission's orbit is golden.
      const next = SA.MISSIONS.find(id => SA.isUnlocked(id) && !SA.state.done[id]);
      ctx.save();
      for (const n of this.nodes) {
        ctx.setLineDash([]);
        ctx.lineWidth = 7;
        ctx.strokeStyle = n.id === next ? 'rgba(255,214,90,0.08)' : 'rgba(140,160,255,0.05)';
        SA.circle(ctx, this.sun.x, this.sun.y, n.d);
        ctx.stroke();
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 10]);
        ctx.lineDashOffset = -t * (n.id === next ? 14 : 6);
        ctx.strokeStyle = n.id === next ? 'rgba(255,224,120,0.45)' : 'rgba(160,180,255,0.2)';
        ctx.stroke();
      }
      ctx.restore();

      this.drawBelt(ctx);
      if (this.comet) this.drawComet(ctx, this.comet, t);

      this.drawSunSprite(ctx, t);
      const sunPill = { x: 70 * (H / 720), y: this.sun.y + 12 };
      SA.pill(ctx, 'Sun', sunPill.x, sunPill.y, 22, { color: '#fff4c2', edge: 'rgba(255,200,90,0.8)', bgTop: 'rgba(150,60,10,0.75)', bg: 'rgba(110,35,5,0.8)' });
      this.drawBonusBadge(ctx, 'sun', sunPill.x, sunPill.y + 34, t, this.sun.x, this.sun.y, this.sun.r);
      this.drawCeres(ctx, t);
      this.drawCometSpot(ctx, t);
      this.drawGalaxySpot(ctx, t);

      for (const n of this.nodes) this.drawNode(ctx, n, t);
      this.drawIss(ctx, t);
      if (SA.state.tourDone && !this.plutoHidden) this.drawPluto(ctx, t);
      this.drawBubble(ctx);

      this.fx.draw(ctx);
      const r = this.rocket;
      const bob = this.flight ? 0 : Math.sin(t * 2) * 4;
      const wig = Math.sin((this.rocketWiggle || 0) * 22) * 0.22 * (this.rocketWiggle || 0);
      if (r.scale > 0.05) SA.drawRocket(ctx, r.x, r.y + bob, 0.55 * r.scale, r.ang + wig, { t, flame: this.flight ? 1 : 0.15 + (this.rocketWiggle || 0) * 0.6 });

      ctx.font = '700 15px ' + SA.FONT;
      ctx.fillStyle = 'rgba(200,210,255,0.55)';
      ctx.textAlign = 'right';
      ctx.fillText('Sizes and distances are not to scale', W - 20, H - 16);
    }

    drawBelt(ctx) {
      const s = this.sun;
      // One path per rock colour (4 fills a frame instead of 260): cheaper on older iPads.
      for (const col of BELT_COLORS) {
        ctx.beginPath();
        for (const a of this.asteroids) {
          if (a.c !== col) continue;
          const x = s.x + Math.cos(a.a) * a.d, y = s.y + Math.sin(a.a) * a.d;
          if (y < -10 || y > SA.H + 10) continue;
          const rx = a.s * 1.2;
          ctx.moveTo(x + rx * Math.cos(a.d), y + rx * Math.sin(a.d));
          ctx.ellipse(x, y, rx, a.s, a.d, 0, TAU);
        }
        ctx.fillStyle = col;
        ctx.fill();
      }
      const ly = this.sun.y + SA.H * 0.4;
      const mid = (this.belt.r0 + this.belt.r1) / 2;
      const dy = ly - s.y;
      if (mid > Math.abs(dy)) SA.label(ctx, 'Asteroid Belt', s.x + Math.sqrt(mid * mid - dy * dy), ly, 14, 'rgba(220,210,200,0.8)', { weight: 700 });
    }

    // Ceres sits in the belt: the way into the "Space Rock Sorter" bonus mission.
    drawCeres(ctx, t) {
      const p = this.ceresPos();
      const glow = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, 26);
      glow.addColorStop(0, 'rgba(240,220,190,0.35)');
      glow.addColorStop(1, 'rgba(240,220,190,0)');
      ctx.fillStyle = glow;
      SA.circle(ctx, p.x, p.y, 26); ctx.fill();
      SA.drawRock(ctx, p.x, p.y, 11, { seed: 7, kind: 'ceres', lumps: 0.08 });
      SA.label(ctx, 'Ceres', p.x, p.y + 22, 13, 'rgba(240,225,205,0.95)', { weight: 800 });
      this.drawBonusBadge(ctx, 'belt', p.x, p.y + 44, t, p.x, p.y, 11);
    }

    // The parked comet, its tail pointing away from the Sun like a real one.
    drawCometSpot(ctx, t) {
      const p = this.cometSpot();
      const ang = Math.atan2(p.y - this.sun.y, p.x - this.sun.x);
      const open = SA.isUnlocked('comet');
      ctx.save();
      if (!open) ctx.globalAlpha = 0.7;
      SA.drawComet(ctx, p.x, p.y, 8, { ang, tail: 0.6, t, bend: 1, len: 0.45 });
      ctx.restore();
      SA.label(ctx, 'Comet', p.x, p.y + 24, 13, 'rgba(210,240,255,0.95)', { weight: 800 });
      if (!open) this.drawLock(ctx, p.x + 22, p.y - 16);
      else this.drawBonusBadge(ctx, 'comet', p.x, p.y + 46, t, p.x, p.y, 10);
    }

    // Once Pluto is found, the faraway galaxy in the backdrop lights up and slowly turns.
    drawGalaxySpot(ctx, t) {
      if (!SA.isUnlocked('galaxy')) return;
      const p = this.galaxyPos();
      const glow = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, 60);
      glow.addColorStop(0, 'rgba(200,180,255,0.35)');
      glow.addColorStop(1, 'rgba(200,180,255,0)');
      ctx.fillStyle = glow;
      SA.circle(ctx, p.x, p.y, 60); ctx.fill();
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(-0.5);
      SA.drawGalaxy(ctx, 0, 0, 38, { rot: -t * 0.05, tilt: 0.5 });
      ctx.restore();
      SA.label(ctx, 'Milky Way', p.x, p.y + 32, 13, 'rgba(225,215,255,0.95)', { weight: 800 });
      this.drawBonusBadge(ctx, 'galaxy', p.x, p.y + 56, t, p.x, p.y, 26);
    }

    // Under a bonus mission's spot: a pulsing ring and "▶ Play!" when it is open and new,
    // best stars once it is done.
    drawBonusBadge(ctx, id, x, y, t, rx, ry, rr) {
      if (!SA.isUnlocked(id)) return;
      if (!SA.state.done[id]) {
        for (const off of [0, 0.5]) {
          const pulse = (t * 0.8 + off) % 1;
          ctx.strokeStyle = 'rgba(255,224,102,' + (1 - pulse) * 0.9 + ')';
          ctx.lineWidth = 3 * (1 - pulse) + 1;
          SA.circle(ctx, rx, ry, rr + 8 + pulse * 22);
          ctx.stroke();
        }
        const ps = 1 + Math.sin(t * 5) * 0.06;
        ctx.save();
        ctx.translate(x, y + 4);
        ctx.scale(ps, ps);
        SA.pill(ctx, '▶ Play!', 0, 0, 14, { color: '#4a2d00', edge: '#fff6c8', bgTop: '#ffe680', bg: '#ffc21f', weight: 900 });
        ctx.restore();
      } else {
        const best = SA.state.best[id];
        for (let i = 0; i < 3; i++) {
          SA.starPath(ctx, x + (i - 1) * 15, y, 7, 0.45, 5);
          ctx.fillStyle = best && i < best.m ? '#ffe066' : 'rgba(255,255,255,0.18)';
          ctx.fill();
        }
      }
    }

    drawComet(ctx, c, t) {
      // The tail always points away from the Sun.
      const ax = c.x - this.sun.x, ay = c.y - this.sun.y;
      const al = Math.hypot(ax, ay);
      const ux = ax / al, uy = ay / al, px = -uy, py = ux;
      const len = 150;
      const g = ctx.createLinearGradient(c.x, c.y, c.x + ux * len, c.y + uy * len);
      g.addColorStop(0, 'rgba(190,240,255,0.75)');
      g.addColorStop(1, 'rgba(120,180,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(c.x + px * 9, c.y + py * 9);
      ctx.quadraticCurveTo(c.x + ux * len * 0.6 + px * 30, c.y + uy * len * 0.6 + py * 30, c.x + ux * len + px * 26, c.y + uy * len + py * 26);
      ctx.lineTo(c.x + ux * len - px * 18, c.y + uy * len - py * 18);
      ctx.quadraticCurveTo(c.x + ux * len * 0.5 - px * 14, c.y + uy * len * 0.5 - py * 14, c.x - px * 9, c.y - py * 9);
      ctx.closePath();
      ctx.fill();
      const glow = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 22);
      glow.addColorStop(0, 'rgba(255,255,255,1)');
      glow.addColorStop(0.35, 'rgba(200,245,255,0.8)');
      glow.addColorStop(1, 'rgba(150,220,255,0)');
      ctx.fillStyle = glow;
      SA.circle(ctx, c.x, c.y, 22);
      ctx.fill();
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 6);
      SA.label(ctx, 'Tap me!', c.x, c.y - 30, 14, '#bff4ff', { weight: 700 });
      ctx.globalAlpha = 1;
    }

    drawIss(ctx, t) {
      const p = this.issPos(), open = SA.isUnlocked('iss');
      if (!this.issShown()) return;
      ctx.save();
      if (!open) ctx.globalAlpha = 0.75;
      SA.drawStation(ctx, p.x, p.y, 15, { t, ang: -0.3 + Math.sin(t * 0.6) * 0.08 });
      ctx.restore();
      if (!open) return;
      // Pulse rings invite a tap while the mission is new (no "Play" tag: Mars's name sits close by).
      if (!SA.state.done.iss) {
        for (const off of [0, 0.5]) {
          const pulse = (t * 0.8 + off) % 1;
          ctx.strokeStyle = 'rgba(255,224,102,' + (1 - pulse) * 0.9 + ')';
          ctx.lineWidth = 2.5 * (1 - pulse) + 1;
          SA.circle(ctx, p.x, p.y, 18 + pulse * 16);
          ctx.stroke();
        }
      }
    }

    // A planet's little fact bubble after a spin (also read aloud).
    drawBubble(ctx) {
      const b = this.bubble;
      if (!b) return;
      const n = b.n, size = 17, maxW = 250;
      ctx.font = '800 ' + size + 'px ' + SA.FONT;
      const words = b.text.split(' '), lines = [];
      let cur = '';
      for (const w of words) {
        const tryL = cur ? cur + ' ' + w : w;
        if (ctx.measureText(tryL).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tryL;
      }
      if (cur) lines.push(cur);
      const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 28, h = lines.length * (size + 5) + 20;
      const a = Math.min(1, b.t * 5, (6 - b.t) * 2);
      const pop = SA.easeBack(Math.min(1, b.t * 4));
      let bx = SA.clamp(n.x - w / 2, 10, SA.W - w - 10);
      let by = n.y - n.r - h - 26;
      if (by < 80) by = n.y + n.r + 56;   // below the planet when there's no room above
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(bx + w / 2, by + h / 2);
      ctx.scale(pop, pop);
      ctx.translate(-(bx + w / 2), -(by + h / 2));
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      SA.rrect(ctx, bx, by + 3, w, h, 16); ctx.fill();
      ctx.fillStyle = '#fffaf0';
      SA.rrect(ctx, bx, by, w, h, 16); ctx.fill();
      ctx.strokeStyle = SA.BODY[n.id].color;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#1d2747';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      lines.forEach((l, i) => ctx.fillText(l, bx + 14, by + 11 + i * (size + 5)));
      ctx.restore();
    }

    drawPluto(ctx, t) {
      const p = this.plutoPos();
      const pop = 1 + Math.sin((this.plutoPop || 0) * Math.PI) * 1.2;
      if (!SA.state.cards.pluto) {
        const pulse = (t * 0.8) % 1;
        ctx.strokeStyle = 'rgba(255,170,210,' + (1 - pulse) + ')';
        ctx.lineWidth = 3;
        SA.circle(ctx, p.x, p.y, p.r + 6 + pulse * 18); ctx.stroke();
      }
      SA.drawBody(ctx, 'pluto', p.x, p.y, p.r * pop, { t, lx: -0.8, ly: -0.2 });
      SA.label(ctx, 'Pluto', p.x, p.y + 24, 17, '#ffd9ec');
      SA.label(ctx, 'dwarf planet', p.x, p.y + 42, 13, 'rgba(255,217,236,0.85)', { weight: 700 });
    }

    drawMoons(ctx, n, front) {
      const list = MOONS[n.id];
      if (!list) return;
      list.forEach((m, i) => {
        const p = this.moonPos(n, m, i);
        if (p.front !== front) return;
        // Europa is drawn a little bigger (with its icy cracks) once its mission is open.
        const eu = (m.id === 'europa' || m.id === 'titan') && SA.isUnlocked(m.id);
        if (eu) {
          SA.drawBody(ctx, m.id, p.x, p.y, m.id === 'titan' ? 5.5 : 5, { t: this.t, lx: SA.clamp((this.sun.x - p.x) / 600, -1, 1) * 0.9, ly: -0.15 });
        } else {
          ctx.fillStyle = m.c;
          SA.circle(ctx, p.x, p.y, m.s);
          ctx.fill();
          ctx.fillStyle = 'rgba(6,8,32,0.35)';
          SA.circle(ctx, p.x + m.s * 0.35, p.y + m.s * 0.2, m.s * 0.75);
          ctx.fill();
        }
        if (eu && !SA.state.done[m.id]) {
          const pulse = (this.t * 0.9) % 1;
          ctx.strokeStyle = 'rgba(255,224,102,' + (1 - pulse) + ')';
          ctx.lineWidth = 2.5;
          SA.circle(ctx, p.x, p.y, 9 + pulse * 12);
          ctx.stroke();
        }
        // The bonus Moon mission invites a tap once it unlocks.
        if (m.id === 'moon' && SA.isUnlocked('moon') && !SA.state.done.moon) {
          const pulse = (this.t * 0.9) % 1;
          ctx.strokeStyle = 'rgba(255,224,102,' + (1 - pulse) + ')';
          ctx.lineWidth = 2.5;
          SA.circle(ctx, p.x, p.y, m.s + 4 + pulse * 12);
          ctx.stroke();
        }
      });
    }

    // Performance (older iPads): a resting planet is drawn into its own small picture about 8 times
    // a second and reused in between, instead of re-shading its bands, glow and rings every frame
    // (the planets were nearly half of the map's drawing work). Spins, pops and tricks draw live.
    drawPlanetSprite(ctx, n, x, y, tt, lx) {
      const cache = this.sprites || (this.sprites = {});
      const ps = SA.clamp(SA.pixelScale || 1, 1, 2), r = n.r;
      const half = r * (n.id === 'saturn' ? 2.6 : n.id === 'uranus' ? 1.9 : 1.6);
      const tq = Math.floor(tt * 8) / 8;
      let s = cache[n.id];
      if (!s || s.r !== r || s.ps !== ps) {
        s = cache[n.id] = { c: document.createElement('canvas'), r, ps, tq: null, lx: null };
        s.c.width = s.c.height = Math.max(2, Math.ceil(half * 2 * ps));
      }
      if (s.tq !== tq || Math.abs(s.lx - lx) > 0.02) {
        const g = s.c.getContext('2d');
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.clearRect(0, 0, s.c.width, s.c.height);
        g.setTransform(ps, 0, 0, ps, 0, 0);
        SA.drawBody(g, n.id, half, half, r, { t: tq, lx, ly: -0.15 });
        s.tq = tq; s.lx = lx;
      }
      ctx.drawImage(s.c, x - half, y - half, half * 2, half * 2);
    }

    // The big Sun on the left edge, the same way: only its on-screen part, redrawn about 8 times a
    // second. Its huge glow gradients were the largest area filled on the map every frame.
    drawSunSprite(ctx, t) {
      const s = this.sun, ps = SA.clamp(SA.pixelScale || 1, 1, 1.5);
      const reach = s.r * 2.1, w = Math.max(2, Math.ceil(s.x + reach)), y0 = s.y - reach, h = Math.ceil(reach * 2);
      let sp = this.sunSp;
      if (!sp || sp.w !== w || sp.h !== h || sp.ps !== ps) {
        sp = this.sunSp = { c: document.createElement('canvas'), w, h, ps, tq: null };
        sp.c.width = Math.ceil(w * ps); sp.c.height = Math.ceil(h * ps);
      }
      const tq = Math.floor(t * 8) / 8;
      if (sp.tq !== tq) {
        const g = sp.c.getContext('2d');
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.clearRect(0, 0, sp.c.width, sp.c.height);
        g.setTransform(ps, 0, 0, ps, 0, -y0 * ps);
        SA.drawBody(g, 'sun', s.x, s.y, s.r, { t: tq });
        sp.tq = tq;
      }
      ctx.drawImage(sp.c, 0, y0, w, h);
    }

    // A small round padlock badge for planets that are still waiting.
    drawLock(ctx, x, y) {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      SA.circle(ctx, x, y + 2, 12.5); ctx.fill();
      ctx.fillStyle = '#2b2a66';
      SA.circle(ctx, x, y, 12); ctx.fill();
      ctx.strokeStyle = 'rgba(200,205,255,0.7)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.strokeStyle = '#ffd866';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(x, y - 2, 3.6, Math.PI, 0);
      ctx.stroke();
      ctx.fillStyle = '#ffd866';
      SA.rrect(ctx, x - 5.5, y - 2, 11, 8, 2); ctx.fill();
      ctx.fillStyle = '#2b2a66';
      SA.circle(ctx, x, y + 1.6, 1.4); ctx.fill();
    }

    drawNode(ctx, n, t) {
      const b = SA.BODY[n.id];
      const done = SA.state.done[n.id];
      const open = b.playable && SA.isUnlocked(n.id);
      let x = n.x, y = n.y + Math.sin(t * 1.3 + n.d) * 3;
      const sc = 1 + Math.sin(n.pop * Math.PI) * 0.3;
      // A swiped planet's trick: Mercury zooms a lap, Jupiter jiggles, Saturn bobs, Uranus rolls.
      let rot = 0, sx = 1, sy = 1;
      const rc = n.react;
      if (rc) {
        const u = SA.clamp(rc.t / (SPIN_DUR[rc.kind] || 1.2), 0, 1);
        if (rc.kind === 'zoom') {
          const a = Math.atan2(n.y - this.sun.y, n.x - this.sun.x) - SA.easeInOut(u) * TAU;
          x = this.sun.x + Math.cos(a) * n.d; y = this.sun.y + Math.sin(a) * n.d;
        } else if (rc.kind === 'wobble') {
          const w = Math.sin(u * Math.PI * 7) * 0.2 * (1 - u);
          sx = 1 + w; sy = 1 - w;
        } else if (rc.kind === 'float') {
          y += Math.sin(u * Math.PI * 4) * 7 * (1 - u);
        } else if (rc.kind === 'roll') {
          const dx = Math.sin(u * Math.PI) * n.r * 1.4 * rc.dir;
          x += dx; rot = (dx / n.r) * 1.6;
        } else if (rc.kind === 'sneeze') {
          x -= Math.sin(Math.min(1, u * 3) * Math.PI) * 5 * rc.dir;
        }
      }

      // Every planet glows softly in its own colour.
      const halo = ctx.createRadialGradient(x, y, n.r * 0.8, x, y, n.r * 2.1);
      halo.addColorStop(0, SA.rgba(b.color, open || done ? 0.28 : 0.14));
      halo.addColorStop(1, SA.rgba(b.color, 0));
      ctx.fillStyle = halo;
      SA.circle(ctx, x, y, n.r * 2.1);
      ctx.fill();
      if (open && !done) {
        // Two staggered pulse rings call out the next mission.
        for (const off of [0, 0.5]) {
          const pulse = (t * 0.8 + off) % 1;
          ctx.strokeStyle = 'rgba(255,224,102,' + (1 - pulse) * 0.9 + ')';
          ctx.lineWidth = 4 * (1 - pulse) + 1;
          SA.circle(ctx, x, y, n.r + 8 + pulse * 26);
          ctx.stroke();
        }
        const glow = ctx.createRadialGradient(x, y, n.r, x, y, n.r * 2.4);
        glow.addColorStop(0, 'rgba(255,224,102,0.3)');
        glow.addColorStop(1, 'rgba(255,224,102,0)');
        ctx.fillStyle = glow;
        SA.circle(ctx, x, y, n.r * 2.4);
        ctx.fill();
      }
      const node = { id: n.id, x, y, r: n.r * sc };
      this.drawMoons(ctx, node, false);
      const lx = SA.clamp((this.sun.x - x) / 600, -1, 1) * 0.9;
      if (rot || sx !== 1 || sy !== 1) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.scale(sx, sy);
        SA.drawBody(ctx, n.id, 0, 0, n.r * sc, { t: t + n.spinT, lx, ly: -0.15 });
        ctx.restore();
      } else if (sc === 1 && !n.spinV) this.drawPlanetSprite(ctx, n, x, y, t + n.spinT, lx);
      else SA.drawBody(ctx, n.id, x, y, n.r * sc, { t: t + n.spinT, lx, ly: -0.15 });
      this.drawMoons(ctx, node, true);

      const ly = y + n.r * (n.id === 'saturn' ? 0.9 : 1) + 24;
      SA.pill(ctx, b.name, x, ly, 18, {
        color: open || done ? '#fff' : '#c9cff0',
        edge: open && !done ? 'rgba(255,224,102,0.9)' : SA.rgba(b.color, open || done ? 0.75 : 0.35),
      });
      // Best mission stars under finished planets.
      const best = SA.state.best[n.id];
      if (done && best) {
        for (let i = 0; i < 3; i++) {
          const sx = x + (i - 1) * 17, sy = ly + 27;
          SA.starPath(ctx, sx, sy, 8, 0.45, 5);
          ctx.fillStyle = i < best.m ? '#ffe066' : 'rgba(255,255,255,0.18)';
          ctx.fill();
          ctx.strokeStyle = i < best.m ? '#a35a00' : 'rgba(255,255,255,0.3)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
      if (done) {
        const bx = x + n.r * 0.85, by = y - n.r * 0.85;
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        SA.circle(ctx, bx, by + 2, 12.5); ctx.fill();
        const bg = ctx.createLinearGradient(0, by - 12, 0, by + 12);
        bg.addColorStop(0, '#6fe08f');
        bg.addColorStop(1, '#2ea456');
        ctx.fillStyle = bg;
        SA.circle(ctx, bx, by, 12); ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bx - 5, by);
        ctx.lineTo(bx - 1, by + 4);
        ctx.lineTo(bx + 6, by - 4);
        ctx.stroke();
        // A gold Expert medal on the other shoulder once its Expert mission is done.
        if (SA.state.expert[n.id]) SA.drawExpertBadge(ctx, null, x - n.r * 0.85 - 2, y - n.r * 0.85, 10, t);
      } else if (open) {
        const hop = Math.abs(Math.sin(t * 3)) * 10;
        const ay = y - n.r - 18 - hop;
        ctx.fillStyle = '#ffe066';
        ctx.strokeStyle = '#7a5200';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, ay);
        ctx.lineTo(x - 16, ay - 18); ctx.lineTo(x - 7, ay - 18); ctx.lineTo(x - 7, ay - 34);
        ctx.lineTo(x + 7, ay - 34); ctx.lineTo(x + 7, ay - 18); ctx.lineTo(x + 16, ay - 18);
        ctx.closePath();
        const ag = ctx.createLinearGradient(0, ay - 34, 0, ay);
        ag.addColorStop(0, '#fff2a0');
        ag.addColorStop(1, '#ffc928');
        ctx.fillStyle = ag;
        ctx.fill();
        ctx.stroke();
        const ps = 1 + Math.sin(t * 5) * 0.06;
        ctx.save();
        ctx.translate(x, ly + 27);
        ctx.scale(ps, ps);
        SA.pill(ctx, '▶ Play!', 0, 0, 15, { color: '#4a2d00', edge: '#fff6c8', bgTop: '#ffe680', bg: '#ffc21f', weight: 900 });
        ctx.restore();
      } else if (b.playable) {
        this.drawLock(ctx, x + n.r * 0.8, y - n.r * 0.8);
      } else {
        SA.label(ctx, 'Coming soon', x, ly + 22, 13, 'rgba(200,210,255,0.7)', { weight: 700 });
      }
    }
  }
  SA.MapScene = MapScene;
})(window.SA);
