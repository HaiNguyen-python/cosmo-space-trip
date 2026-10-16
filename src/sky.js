// Night Sky (from the telescope at Cosmo's Space Base): connect the stars of six real
// constellations, tapping the twinkly numbered star each time, and hear a short star story plus
// a stargazing tip for the real sky. Each one finished becomes a sticker for the base. In
// "My own" the child joins any stars they like, and Cosmo gives their constellation a silly name.
// There is nothing to get wrong: a tap on another star just points to the right one again.
(function (SA) {
  const TAU = Math.PI * 2;
  const $ = id => document.getElementById(id);
  // Stars as [x, y, brightness 1 (brightest) - 4], in a box of size box[0] x box[1];
  // lines join star indexes, and each line appears once both of its stars are lit.
  // Shapes follow the real sky as seen with the eye (Leo's head on the right, as on star charts).
  const SKY = [
    { id: 'dipper', name: 'The Big Dipper', pic: '🐻', box: [1, 0.62],
      stars: [[0.02, 0.3, 2], [0.2, 0.17, 2], [0.34, 0.15, 1], [0.48, 0.22, 3], [0.52, 0.47, 2], [0.82, 0.5, 2], [0.86, 0.22, 1]],
      lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]],
      story: ['You made the Big Dipper! 🥄 It looks like a giant spoon for soup.', 'Long ago, people in Greece imagined it as part of a Great Bear. 🐻 In Britain it\'s called the Plough!'],
      tip: 'Stargazing tip: the two stars at the end of the spoon point to the North Star! ⭐' },
    { id: 'orion', name: 'Orion the Hunter', pic: '🏹', box: [0.8, 1],
      stars: [[0.25, 0.1, 1, '#ffb58a'], [0.72, 0.16, 2], [0.58, 0.48, 2], [0.5, 0.51, 2], [0.42, 0.54, 2], [0.32, 0.92, 2], [0.78, 0.86, 1, '#bcd6ff']],
      lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [4, 5], [5, 6], [6, 2]],
      story: ['You made Orion the Hunter! 🏹', 'See the three stars in a row? That\'s Orion\'s Belt. The red star on his shoulder, Betelgeuse, is a giant star!'],
      tip: 'Stargazing tip: between December and March, look for three bright stars in a row in the evening sky. That\'s Orion\'s Belt!' },
    { id: 'cassiopeia', name: 'Cassiopeia', pic: '👸', box: [1, 0.55],
      stars: [[0.02, 0.25, 2], [0.25, 0.62, 2], [0.5, 0.4, 2], [0.72, 0.72, 2], [0.98, 0.48, 3]],
      lines: [[0, 1], [1, 2], [2, 3], [3, 4]],
      story: ['You made Cassiopeia! 👸 Long ago, people in Greece told stories about a queen sitting on her throne.', 'Her five bright stars make a W shape... or an M when she\'s upside down!'],
      tip: 'Stargazing tip: Cassiopeia is on the other side of the North Star from the Big Dipper.' },
    { id: 'cygnus', name: 'Cygnus the Swan', pic: '🦢', box: [0.75, 1],
      stars: [[0.55, 0.04, 1], [0.5, 0.38, 2], [0.42, 0.98, 3, '#ffd9a0'], [0.18, 0.5, 2], [0.82, 0.26, 2]],
      lines: [[0, 1], [1, 2], [3, 1], [1, 4]],
      story: ['You made Cygnus the Swan! 🦢 It flies along the Milky Way with its long neck stretched out.', 'Some people call it the Northern Cross. Can you see the cross shape?'],
      tip: 'Stargazing tip: the star at the swan\'s beak, Albireo, is really two stars, one gold and one blue! A small telescope shows them both.' },
    { id: 'leo', name: 'Leo the Lion', pic: '🦁', box: [1, 0.75],
      stars: [[0.78, 0.78, 1], [0.82, 0.55, 3], [0.72, 0.4, 2], [0.78, 0.25, 3], [0.68, 0.12, 3], [0.88, 0.1, 3], [0.3, 0.38, 2], [0.05, 0.55, 2], [0.3, 0.62, 3]],
      lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [2, 6], [6, 7], [7, 8], [8, 0], [6, 8]],
      story: ['You made Leo the Lion! 🦁', 'The stars of his head make a backwards question mark. His brightest star, Regulus, is called the lion\'s heart.'],
      tip: 'Stargazing tip: from March to May, Leo is easy to spot in the evening sky.' },
    { id: 'crux', name: 'The Southern Cross', pic: '🧭', box: [0.7, 1],
      stars: [[0.52, 0.02, 2, '#ffc9a0'], [0.47, 0.98, 1], [0.12, 0.48, 1], [0.85, 0.38, 3], [0.68, 0.68, 4]],
      lines: [[0, 1], [2, 3]],
      story: ['You made the Southern Cross! 🧭 It\'s the smallest constellation in the whole sky, but its stars are very bright.', 'It\'s on the flags of Australia and New Zealand!'],
      tip: 'Stargazing tip: people in the south of the world use the Southern Cross to find which way is south.' },
    // Claws at the top right, the red heart Antares, then the long tail curling round to the stinger.
    { id: 'scorpius', name: 'Scorpius the Scorpion', pic: '🦂', box: [1, 0.8],
      stars: [[0.9, 0.05, 2], [0.86, 0.19, 2], [0.84, 0.33, 3], [0.72, 0.24, 3], [0.62, 0.3, 1, '#ff8a6a'], [0.56, 0.4, 3], [0.5, 0.57, 2], [0.44, 0.73, 3], [0.33, 0.78, 3], [0.17, 0.76, 2], [0.07, 0.62, 3], [0.18, 0.53, 2]],
      lines: [[0, 1], [1, 2], [1, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11]],
      story: ['You made Scorpius the Scorpion! 🦂 Can you see its curly tail, with a stinger at the end?', 'The bright red star at its heart is Antares. It\'s a giant star, hundreds of times wider than our Sun!'],
      tip: 'Stargazing tip: from June to August, look for a bright red star with a curly tail of stars below it in the evening sky.' },
    // Polaris, the North Star, sits at the very end of the Little Dipper's handle.
    { id: 'ursaminor', name: 'The Little Dipper', pic: '🧸', box: [1, 0.62],
      stars: [[0.02, 0.1, 1, '#fffbe0'], [0.22, 0.18, 4], [0.4, 0.28, 4], [0.56, 0.4, 3], [0.62, 0.58, 4], [0.92, 0.5, 3], [0.86, 0.3, 2, '#ffd2a0']],
      lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]],
      story: ['You made the Little Dipper! 🧸 Long ago, people in Greece called it the Little Bear.', 'The star at the end of its handle is Polaris, the North Star. It hardly moves, while all the other stars turn slowly around it!'],
      tip: 'Stargazing tip: in the north half of the world, face the North Star and you are facing north! It isn\'t the brightest star, but it stays put.' },
    // The V of the bull's face (the Hyades) with orange Aldebaran as its eye, two long horns, and
    // the Pleiades, a tiny bunch of stars on its shoulder (tapped last, as one sparkly cluster).
    { id: 'taurus', name: 'Taurus the Bull', pic: '🐂', box: [1, 0.85],
      stars: [[0.54, 0.74, 1, '#ffb070'], [0.67, 0.8, 3], [0.6, 0.6, 3], [0.16, 0.08, 2], [0.08, 0.5, 3], [0.91, 0.33, 2, '#cfe0ff', 'cluster']],
      lines: [[0, 1], [1, 2], [2, 3], [0, 4]],
      story: ['You made Taurus the Bull! 🐂 The V shape is the bull\'s face, and the long lines are its horns.', 'Its bright orange eye is a giant star called Aldebaran. And that tiny sparkly bunch is the Pleiades, also called the Seven Sisters!'],
      tip: 'Stargazing tip: follow the line of Orion\'s Belt to find orange Aldebaran, then keep going to the Pleiades. How many stars can you count? Most people see six or seven!' },
    // The Great Square (one corner star, Alpheratz, is shared with Andromeda), then the neck and nose.
    { id: 'pegasus', name: 'Pegasus the Flying Horse', pic: '🐴', box: [1, 0.95],
      stars: [[0.09, 0.04, 2], [0.48, 0.08, 2], [0.47, 0.59, 2], [0.06, 0.59, 2], [0.61, 0.77, 3], [0.8, 0.93, 3], [0.95, 0.78, 2, '#ffc890']],
      lines: [[0, 1], [1, 2], [2, 3], [3, 0], [2, 4], [4, 5], [5, 6]],
      story: ['You made Pegasus, the flying horse! 🐴 Long ago, people in Greece told stories about a horse with wings.', 'Its four corner stars make a giant box called the Great Square. The star at its nose, Enif, is a big orange giant star.'],
      tip: 'Stargazing tip: from September to November, look for four stars making a giant square in the evening sky. Near one corner is a faint fuzzy smudge: the Andromeda Galaxy, one of the farthest things you can see with just your eyes!' },
    // The keel of a ship, with brilliant Canopus at the bow (best seen from the south).
    { id: 'carina', name: 'Carina the Keel', pic: '⛵', box: [1, 0.9],
      stars: [[0.03, 0.18, 1, '#fffbe8'], [0.3, 0.3, 3], [0.52, 0.12, 2, '#ffd9a8'], [0.72, 0.36, 2], [0.96, 0.62, 3], [0.6, 0.86, 2]],
      lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 1]],
      story: ['You made Carina, the Keel! ⛵ Long ago, people imagined it as the bottom of a giant ship sailing through the stars.', 'Its brightest star, Canopus, is the second brightest star in the whole night sky! Only Sirius is brighter.'],
      tip: 'Stargazing tip: from December to April, Canopus shines in the evening sky in the south half of the world. With binoculars, look nearby for a glowing cloud called the Carina Nebula!' },
  ];
  SA.CONSTELLATIONS = SKY;

  // What's up tonight: constellations that are easy to see in the evening sky this month (from the
  // device's date, nothing else), for mid-northern latitudes (Europe, North America, most of Asia)
  // or mid-southern ones (Australia, New Zealand, South Africa, Argentina), as a grown-up chooses
  // in Settings. The Dippers and Cassiopeia never rise there; the Southern Cross never rises here.
  const TONIGHT = {
    north: [
      ['orion', 'taurus'], ['orion', 'dipper'], ['orion', 'leo'], ['leo', 'dipper'], ['leo', 'dipper'], ['scorpius', 'ursaminor'],
      ['scorpius', 'cygnus'], ['scorpius', 'cygnus'], ['cygnus', 'pegasus'], ['pegasus', 'cassiopeia'], ['pegasus', 'taurus'], ['taurus', 'orion'],
    ],
    // November and December used to list only Orion here: Taurus and Pegasus fill those evenings.
    south: [
      ['orion', 'taurus'], ['orion', 'carina'], ['carina', 'crux'], ['crux', 'leo'], ['crux', 'leo'], ['scorpius', 'crux'],
      ['scorpius', 'crux'], ['scorpius', 'crux'], ['scorpius', 'cygnus'], ['pegasus', 'scorpius'], ['pegasus', 'taurus'], ['orion', 'taurus'],
    ],
  };
  // Constellations that only one half of the world can see.
  const ONLY = { dipper: 'north', ursaminor: 'north', cassiopeia: 'north', crux: 'south' };
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const hemi = () => (SA.state.hemi === 'south' ? 'south' : 'north');
  SA.tonightSky = () => TONIGHT[hemi()][new Date().getMonth()];
  // A friendly note when a constellation can't be seen from the child's half of the world.
  const awayNote = id => (id === 'carina' && hemi() === 'north' ? ' It\'s easiest to see from the south half of the world. From most northern places it stays below the horizon, but people in the far south of the USA, North Africa and India can spot Canopus low in the sky!'
    : !ONLY[id] || ONLY[id] === hemi() ? ''
    : ONLY[id] === 'north' ? ' You can\'t see it from where you live, but children in the north half of the world can! 🌍'
    : ' You can\'t see it from where you live, but children in the south half of the world can! 🌏');
  const MINE_N = 14;
  const ADJ = ['Sparkly', 'Giant', 'Sleepy', 'Dancing', 'Wobbly', 'Happy', 'Cosmic', 'Twinkly', 'Super', 'Fuzzy', 'Bouncy', 'Magic'];
  const NOUN = ['Space Noodle', 'Dragon', 'Rocket', 'Unicorn', 'Banana', 'Kitten', 'Robot', 'Jellyfish', 'Dinosaur', 'Teapot', 'Pizza', 'Octopus'];

  class SkyScene {
    constructor() {
      this.stars = new SA.Starfield(320, 515);
      this.fx = new SA.Particles();
      this.shooting = new SA.ShootingStars(6, 12);
      this.t = 0;
      $('btnSkyBack').addEventListener('click', () => {
        if (SA.transitioning || SA.ui.panelOpen() || SA.scene !== this) return;
        SA.audio.play('click');
        SA.ui.hideTalk();
        SA.go(SA.base, {});
      });
      const pick = $('skyPick');
      pick.innerHTML = SKY.map(c => '<button class="round-btn sky-btn" data-id="' + c.id + '" aria-label="' + SA.esc(c.name) + '">' + c.pic + '</button>').join('') +
        '<button class="round-btn sky-btn" data-id="mine" aria-label="Make your own">✏️</button>';
      pick.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
        if (SA.transitioning || SA.ui.blocking() || SA.scene !== this) return;
        SA.audio.play('pop');
        this.choose(b.dataset.id);
      }));
    }

    layout() {
      const W = SA.W, H = SA.H;
      // The constellation sits in the open sky, clear of the HUD, the horizon and the
      // speech bubble in the lower left.
      const top = H < 720 ? H * 0.22 : H * 0.17;   // below the name tag (the HUD is taller on phones)
      this.area = { x: W * 0.24, y: top, w: W * 0.6, h: H * 0.71 - top };
      if (this.cur) this.place();
    }
    resize() { this.layout(); }

    enter(opts) {
      opts = opts || {};
      SA.ui.setScene('sky');
      SA.audio.music('sky');
      this.layout();
      this.updateHud();
      // Start with one that's up in tonight's sky, if it still needs finding.
      const tn = SA.tonightSky();
      const first = SKY.find(c => tn.indexOf(c.id) >= 0 && !SA.state.sky[c.id]) || SKY.find(c => !SA.state.sky[c.id]);
      this.choose(opts.pick || (first ? first.id : 'mine'), true);
      this.tonightTold = false;
      const lines = !SA.state.skySeen ? [
        'Welcome to my telescope! 🔭 At night, the sky is full of star pictures called CONSTELLATIONS.',
        'Long ago, people joined up the stars with pretend lines to make pictures and tell stories.',
        'Tap the twinkly star with the number 1, then 2, then 3... to join them up! ✨',
      ] : null;
      if (lines) SA.ui.say(lines).then(() => { SA.state.skySeen = true; SA.save(); if (SA.scene === this) this.prompt(); });
      else this.prompt();
    }

    exit() { SA.ui.hideTalk(); }

    updateHud() {
      const n = SKY.filter(c => SA.state.sky[c.id]).length;
      $('skyCount').textContent = n + '/' + SKY.length;
      const tn = SA.tonightSky();
      document.querySelectorAll('#skyPick button').forEach(b => {
        b.classList.toggle('tonight', tn.indexOf(b.dataset.id) >= 0);
        b.classList.toggle('done', b.dataset.id !== 'mine' ? !!SA.state.sky[b.dataset.id] : !!SA.state.myStars);
        b.classList.toggle('on', !!this.cur && b.dataset.id === this.cur.id);
      });
      // On narrow screens the row scrolls: keep the chosen constellation's button in view.
      const pk = $('skyPick'), on = pk.querySelector('.on');
      if (on && pk.scrollWidth > pk.clientWidth) {
        const x = on.offsetLeft - pk.offsetLeft;
        if (x < pk.scrollLeft || x + on.offsetWidth > pk.scrollLeft + pk.clientWidth) pk.scrollLeft = x - (pk.clientWidth - on.offsetWidth) / 2;
      }
    }

    // ---------- Choosing a constellation ----------
    choose(id, quiet) {
      if (id === 'mine') {
        const saved = SA.state.myStars;
        const seed = saved ? saved.seed : 1 + Math.floor(Math.random() * 100000);
        this.cur = { id: 'mine', name: saved ? saved.name : 'My own constellation', pic: '', box: [1, 0.7], stars: this.makeStars(seed), lines: [], seed };
        this.mine = { lines: saved ? saved.lines.filter(l => l[0] < MINE_N && l[1] < MINE_N).map(l => l.slice()) : [], pen: -1, named: !!saved };
      } else {
        this.cur = SKY.find(c => c.id === id) || SKY[0];
        this.mine = null;
      }
      this.place();
      this.lit = 0;
      this.drawn = [];   // { a, b, t } lines drawing in
      this.done = this.cur.id !== 'mine' && !!SA.state.sky[this.cur.id];
      if (this.done) { this.lit = this.cur.stars.length; this.drawn = this.cur.lines.map(l => ({ a: l[0], b: l[1], t: 1 })); }
      if (this.mine) this.drawn = this.mine.lines.map(l => ({ a: l[0], b: l[1], t: 1 }));
      this.picA = this.done ? 1 : 0;
      this.nudge = 0;
      this.phase = 'play';
      this.updateHud();
      if (!quiet) this.prompt();
    }

    // Once per visit: what to look for in the real sky this month.
    tonightLine() {
      const names = SA.tonightSky().map(id => SKY.find(c => c.id === id).name.replace(/^The /, 'the '));
      return '🌙 Tonight\'s sky: in ' + MONTHS[new Date().getMonth()] + ', look for ' + names.join(' and ') + ' in the evening! ' +
        (names.length > 1 ? 'They have a 🌙 on their buttons.' : 'It has a 🌙 on its button.');
    }

    prompt() {
      if (SA.ui.blocking()) return;
      const c = this.cur;
      if (!this.tonightTold) {
        this.tonightTold = true;
        const next = c.id === 'mine' || this.done ? '' : ' Let\'s find ' + c.name.replace(/^The /, 'the ') + ': tap star number 1! ✨';
        SA.ui.hint(this.tonightLine() + next, 9);
        return;
      }
      if (c.id === 'mine') SA.ui.hint(this.mine.named ? 'Here\'s your constellation, ' + c.name + '! Tap 🧽 to start a new one.' : 'Make your own constellation! Tap a star, then another star to join them. ✏️', 6);
      else if (this.done) SA.ui.hint(c.name + '! ' + c.tip + awayNote(c.id), 0);
      else SA.ui.hint('Let\'s find ' + c.name.replace(/^The /, 'the ') + '! Tap the twinkly star number 1. ✨', 5);
    }

    // Random-looking but repeatable stars for "My own" (the seed is saved with the drawing).
    makeStars(seed) {
      const rnd = SA.seeded(seed), out = [];
      let guard = 0;
      while (out.length < MINE_N && guard++ < 500) {
        const p = [0.04 + rnd() * 0.92, 0.04 + rnd() * 0.92, 1 + Math.floor(rnd() * 3)];
        if (out.every(q => Math.hypot((q[0] - p[0]) * 1, (q[1] - p[1]) * 0.7) > 0.16)) out.push(p);
      }
      return out;
    }

    // Fit the constellation's box into the open sky area.
    place() {
      const c = this.cur, bw = c.box[0], bh = c.box[1];
      // "My own" leaves room on the right for its Name it! and Start over buttons.
      const a = c.id === 'mine' ? { x: SA.W * 0.2, y: this.area.y, w: SA.W * 0.8 - 250, h: this.area.h } : this.area;
      const s = Math.min(a.w / bw, a.h / bh);
      const ox = a.x + (a.w - bw * s) / 2, oy = a.y + (a.h - bh * s) / 2;
      this.pts = c.stars.map(st => ({ x: ox + st[0] * s, y: oy + st[1] * s, m: st[2], c: st[3], cl: st[4] === 'cluster' }));
      this.picBox = { x: ox + bw * s / 2, y: oy + bh * s / 2, s: Math.min(bw, bh) * s };
    }

    // ---------- Input ----------
    starAt(x, y) {
      const reach = SA.easy() ? 70 : 48;
      let best = -1, bd = 1e9;
      this.pts.forEach((p, i) => { const d = Math.hypot(x - p.x, y - p.y); if (d < reach && d < bd) { bd = d; best = i; } });
      return best;
    }

    onDown(x, y) {
      if (this.phase !== 'play') return;
      if (this.cur.id === 'mine') { this.tapMine(x, y); return; }
      if (this.done) {
        // Finished: tapping the picture tells the story again.
        const i = this.starAt(x, y);
        if (i >= 0) { SA.audio.play('ping'); this.fx.spawn('sparkle', this.pts[i].x, this.pts[i].y, 6); }
        SA.ui.hint(this.cur.story[1], 0);
        return;
      }
      const i = this.starAt(x, y);
      if (i < 0) return;
      if (i !== this.lit) {
        if (i < this.lit) return;   // already lit
        this.nudge = 1;
        SA.audio.play('boing');
        SA.ui.hint('Try the twinkly star with the number ' + (this.lit + 1) + '! ✨', 4);
        return;
      }
      this.lightStar(i);
    }

    lightStar(i) {
      const p = this.pts[i];
      this.lit++;
      SA.audio.play(this.lit === this.cur.stars.length ? 'collect' : 'ping');
      this.fx.spawn('sparkle', p.x, p.y, 8, { color: '#fff3a0' });
      if (this.lit === 1) SA.ui.hideTalk();
      for (const l of this.cur.lines) if (Math.max(l[0], l[1]) === i) this.drawn.push({ a: l[0], b: l[1], t: 0 });
      if (this.lit === this.cur.stars.length) this.complete();
    }

    complete() {
      const c = this.cur, first = !SA.state.sky[c.id];
      this.phase = 'cheer';
      SA.state.sky[c.id] = true;
      if (first) SA.state.baseNew = true;   // its picture is a new sticker
      SA.save();
      this.updateHud();
      setTimeout(() => {
        if (SA.scene !== this) return;
        this.done = true;
        SA.audio.play('cheer');
        SA.celebrate(60);
        this.fx.spawn('sparkle', this.picBox.x, this.picBox.y, 24, { color: '#fff3a0' });
        const lines = c.story.concat([c.tip + awayNote(c.id)]);
        if (first) lines.push('You unlocked a new sticker for my Space Base: ' + c.pic + ' ' + SA.DECOR.find(d => d.sky === c.id).name + '!');
        const left = SKY.filter(k => !SA.state.sky[k.id]);
        if (first && !left.length) lines.push('You found ALL the constellations! You\'re a real star gazer! 🌟');
        else if (left.length) lines.push('Tap ' + left[0].pic + ' at the top to find ' + left[0].name.replace(/^The /, 'the ') + ' next!');
        SA.ui.say(lines).then(() => { if (SA.scene === this) this.phase = 'play'; });
      }, 700);
    }

    // "My own": tap a star to start, tap another to join them, tap the last one again to lift the pen.
    tapMine(x, y) {
      const b = this.mineButtons();
      for (const k of ['name', 'clear']) {
        const r = b[k];
        if (r && x > r.x - r.w / 2 && x < r.x + r.w / 2 && Math.abs(y - r.y) < r.h / 2) { k === 'name' ? this.nameMine() : this.clearMine(); return; }
      }
      const m = this.mine;
      if (m.named) { SA.ui.hint('Tap 🧽 to start a new constellation!', 4); return; }
      const i = this.starAt(x, y);
      if (i < 0) return;
      const p = this.pts[i];
      if (m.pen < 0) { m.pen = i; SA.audio.play('blip'); this.fx.spawn('sparkle', p.x, p.y, 5); SA.ui.hideTalk(); return; }
      if (m.pen === i) { m.pen = -1; SA.audio.play('click'); return; }
      const has = m.lines.some(l => (l[0] === m.pen && l[1] === i) || (l[0] === i && l[1] === m.pen));
      if (!has && m.lines.length < 24) {
        m.lines.push([m.pen, i]);
        this.drawn.push({ a: m.pen, b: i, t: 0 });
        SA.audio.play('ping');
        this.fx.spawn('sparkle', p.x, p.y, 6, { color: '#fff3a0' });
        if (m.lines.length === 2) SA.ui.hint('Looking good! Join more stars, then tap ✨ Name it! when you\'re done.', 5);
      }
      m.pen = i;
    }

    mineButtons() {
      const m = this.mine, W = SA.W, H = SA.H;
      if (!m) return {};
      return {
        name: !m.named && m.lines.length >= 2 ? { x: W - 120, y: H * 0.6, w: 190, h: 54, label: '✨ Name it!' } : null,
        clear: m.lines.length ? { x: W - 120, y: H * 0.6 + 66, w: 190, h: 54, label: '🧽 Start over' } : null,
      };
    }

    nameMine() {
      const m = this.mine;
      const name = 'The ' + SA.pick(ADJ) + ' ' + SA.pick(NOUN);
      m.named = true;
      m.pen = -1;
      this.cur.name = name;
      SA.state.myStars = { seed: this.cur.seed, lines: m.lines.map(l => l.slice()), name };
      SA.save();
      this.updateHud();
      SA.audio.play('cheer');
      SA.celebrate(60);
      this.phase = 'cheer';
      SA.ui.say([
        'Ooh, I know! I name it... ' + name.toUpperCase() + '! 🌟',
        'That\'s just what people did long ago: they joined up stars to make pictures and tell stories about them!',
      ]).then(() => { if (SA.scene === this) this.phase = 'play'; });
    }

    clearMine() {
      SA.audio.play('pop');
      SA.state.myStars = null;
      SA.save();
      this.choose('mine', true);
      SA.ui.hint('A fresh patch of sky! Tap a star, then another star to join them. ✏️', 5);
    }

    onMove() {}
    onUp() {}

    update(dt) {
      this.t += dt;
      this.fx.update(dt);
      this.shooting.update(dt);
      this.nudge = Math.max(0, this.nudge - dt * 2.5);
      for (const d of this.drawn) d.t = Math.min(1, d.t + dt / 0.35);
      if (this.done) this.picA = Math.min(1, this.picA + dt * 0.8);
    }

    // ---------- Drawing ----------
    draw(ctx) {
      const W = SA.W, H = SA.H, t = this.t;
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#03041a');
      g.addColorStop(0.7, '#0d1440');
      g.addColorStop(1, '#1d2560');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      SA.nebula(ctx, t, [
        { x: 0.3, y: 0.15, r: 420, c: 'rgba(120,110,220,0.12)' },
        { x: 0.7, y: 0.45, r: 380, c: 'rgba(200,120,220,0.08)' },
      ]);
      // The background stars are dimmed so the constellation's stars stand out.
      this.stars.draw(ctx, t, 0);
      ctx.fillStyle = 'rgba(4,6,30,0.42)';
      ctx.fillRect(0, 0, W, H);
      this.shooting.draw(ctx);
      if (this.cur.pic && this.picA > 0) {
        const b = this.picBox;
        ctx.globalAlpha = 0.2 * this.picA;
        SA.emojiCached(ctx, this.cur.pic, b.x, b.y, b.s * 0.95);
        ctx.globalAlpha = 1;
      }
      this.drawLines(ctx);
      this.drawStars(ctx, t);
      this.drawHorizon(ctx, t);
      this.fx.draw(ctx);
      // The constellation's name once known.
      if (this.done || (this.mine && this.mine.named)) {
        SA.pill(ctx, (this.cur.pic ? this.cur.pic + ' ' : '🌟 ') + this.cur.name, W / 2, H < 720 ? 112 : H * 0.12, 22, { color: '#fff3c4', edge: 'rgba(255,224,120,0.85)' });
      }
      if (this.mine) {
        const b = this.mineButtons();
        for (const k of ['name', 'clear']) {
          const r = b[k];
          if (!r) continue;
          const ps = k === 'name' ? 1 + Math.sin(t * 5) * 0.04 : 1;
          ctx.save();
          ctx.translate(r.x, r.y);
          ctx.scale(ps, ps);
          SA.pill(ctx, r.label, 0, 0, 22, k === 'name' ? { color: '#4a2d00', edge: '#fff6c8', bgTop: '#ffe680', bg: '#ffc21f', weight: 900 } : {});
          ctx.restore();
        }
      }
    }

    drawLines(ctx) {
      ctx.lineCap = 'round';
      for (const d of this.drawn) {
        const a = this.pts[d.a], b = this.pts[d.b];
        if (!a || !b) continue;
        const ex = SA.lerp(a.x, b.x, SA.easeOut(d.t)), ey = SA.lerp(a.y, b.y, SA.easeOut(d.t));
        ctx.strokeStyle = 'rgba(255,224,140,0.25)';
        ctx.lineWidth = 9;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,246,210,0.9)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(ex, ey); ctx.stroke();
      }
      // "My own": a dotted line from the pen star shows it's ready to join.
      const m = this.mine;
      if (m && m.pen >= 0) {
        const p = this.pts[m.pen];
        ctx.strokeStyle = 'rgba(255,224,102,' + (0.5 + 0.4 * Math.sin(this.t * 6)) + ')';
        ctx.lineWidth = 3;
        SA.circle(ctx, p.x, p.y, 22); ctx.stroke();
      }
    }

    drawStars(ctx, t) {
      const mine = !!this.mine;
      this.pts.forEach((p, i) => {
        const lit = mine ? (this.mine.lines.some(l => l[0] === i || l[1] === i) || this.mine.pen === i) : i < this.lit;
        const next = !mine && !this.done && i === this.lit;
        const r = [0, 11, 9, 7.5, 6][p.m] || 7;
        const tw = 0.75 + 0.25 * Math.sin(t * 2.3 + i * 1.7);
        const col = p.c || '#ffffff';
        const glowR = r * (lit ? 4.2 : 3);
        const gl = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
        gl.addColorStop(0, SA.rgba(lit ? '#fff3c4' : col, (lit ? 0.75 : 0.45) * tw));
        gl.addColorStop(1, SA.rgba(col, 0));
        ctx.fillStyle = gl;
        SA.circle(ctx, p.x, p.y, glowR); ctx.fill();
        ctx.fillStyle = lit ? '#fffbe6' : col;
        if (p.cl) {
          // A little sparkly bunch of stars (the Pleiades): seven tiny ones in a small dipper shape.
          for (const [dx, dy, rr] of [[-14, -6, 4], [-6, -12, 3.2], [4, -9, 3.6], [12, -3, 3], [6, 6, 4.2], [-6, 4, 3.4], [-15, 9, 2.8]]) {
            SA.starPath(ctx, p.x + dx, p.y + dy, rr * (lit ? 1.4 : 1.15) * tw, 0.35, 4, 0); ctx.fill();
          }
        } else {
          SA.starPath(ctx, p.x, p.y, r * (lit ? 1.6 : 1.25) * tw, 0.3, 4, 0);
          ctx.fill();
          SA.circle(ctx, p.x, p.y, r * 0.55); ctx.fill();
        }
        if (next) {
          // The next star to tap: a pulsing gold ring and its number (nudged on a wrong tap).
          const pulse = (t * 1.2) % 1, nud = Math.sin(this.nudge * Math.PI * 4) * 6 * this.nudge;
          ctx.strokeStyle = 'rgba(255,224,102,' + (1 - pulse) + ')';
          ctx.lineWidth = 3;
          SA.circle(ctx, p.x + nud, p.y, 16 + pulse * 22); ctx.stroke();
          ctx.strokeStyle = 'rgba(255,224,102,0.9)';
          SA.circle(ctx, p.x + nud, p.y, 16); ctx.stroke();
          SA.label(ctx, String(i + 1), p.x + nud + 24, p.y - 22, 20, '#ffe066');
          if (i === 0 || SA.easy()) SA.emoji(ctx, '👆', p.x + 22, p.y + 34 + Math.abs(Math.sin(t * 3)) * 6, 34);
        }
      });
    }

    // Cosmo's base on the horizon, with Cosmo at his telescope (bottom right, clear of the bubble).
    drawHorizon(ctx, t) {
      const W = SA.W, H = SA.H, y0 = H * 0.86;
      ctx.fillStyle = '#0b0d2c';
      ctx.beginPath();
      ctx.moveTo(0, H);
      ctx.lineTo(0, y0 + 10);
      ctx.quadraticCurveTo(W * 0.5, y0 - 30, W, y0 + 6);
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();
      const tx = W * 0.86, ty = y0 - 6;
      // Telescope on a tripod, pointing up at the sky.
      ctx.strokeStyle = '#8f88c8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(tx - 18, ty + 4); ctx.lineTo(tx, ty - 36); ctx.lineTo(tx + 18, ty + 4);
      ctx.moveTo(tx, ty - 36); ctx.lineTo(tx, ty + 4);
      ctx.stroke();
      ctx.save();
      ctx.translate(tx, ty - 40);
      ctx.rotate(-0.75);
      ctx.fillStyle = '#d9d4f5';
      SA.rrect(ctx, -12, -8, 62, 16, 6); ctx.fill();
      ctx.fillStyle = '#6f5bd6';
      ctx.fillRect(34, -9, 8, 18);
      ctx.restore();
      SA.drawCosmo(ctx, tx - 58, ty - 28, 0.55, { t, look: [0.6, -0.9] });
    }
  }
  SA.SkyScene = SkyScene;
})(window.SA);
