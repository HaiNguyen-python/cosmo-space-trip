// Mission Control: Cosmo's space quiz show (🎤 on the map, then 📺). A celebration of what the child
// has learned, never a test: spin the wheel of planets they have explored, hit a buzzer to answer a
// question about the planet it lands on, and the studio audience (their critter friends) cheers.
// A wrong buzzer just goes dim ("so close!"), points only ever go up, and every show ends with the
// Prize Door and a silly prize, which becomes a sticker for the Space Base.
// Family show: two teams (Team Rocket and Team Comet) take turns spinning and buzzing, 3 rounds each
// (their last round is double), and at the end EVERY team picks a door and wins a prize.
(function (SA) {
  const TAU = Math.PI * 2;
  const $ = id => document.getElementById(id);
  const ROUNDS = 5;        // a show for one player
  const TEAM_ROUNDS = 6;   // a family show: two teams take turns, 3 rounds each
  // Family show teams (the team on turn spins and buzzes; grown-ups and kids can mix as they like).
  const TEAMS = [{ name: 'Team Rocket', e: '🚀', col: '#ff5d6c' }, { name: 'Team Comet', e: '☄️', col: '#4fa3f0' }];
  const BUZZ = ['#ff5d6c', '#4fa3f0', '#3fbf5a'];
  const AUDIENCE = [{ color: '#9be86a', eyes: 3, feature: 'none' }, { color: '#ff9fd0', eyes: 2, feature: 'none' }, { color: '#7fd6e8', eyes: 1, feature: 'none' }, { color: '#ffc46b', eyes: 2, feature: 'none' }, { color: '#b79bff', eyes: 2, feature: 'none' }];

  function wrap(ctx, text, maxW) {
    const words = String(text).split(' '), lines = [];
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }
  // Fit text in a box: the biggest font size (down to min) that fits in maxLines.
  function fitText(ctx, text, maxW, size, min, maxLines, weight) {
    let s = size, lines;
    for (; s >= min; s -= 2) {
      ctx.font = (weight || 800) + ' ' + s + 'px ' + SA.FONT;
      lines = wrap(ctx, text, maxW);
      if (lines.length <= maxLines) break;
    }
    return { size: Math.max(s, min), lines };
  }

  class QuizShowScene {
    constructor() {
      this.t = 0;
      this.fx = new SA.Particles();
      this.stars = new SA.Starfield(120, 515);
      this.wheelPic = null;
    }

    layout() {
      const W = SA.W, H = SA.H;
      const top = Math.max(H * 0.13, SA.ui.toyTop() + 12);
      this.wheel = { x: W * 0.2, y: H * 0.47, r: Math.min(H * 0.25, W * 0.155) };
      this.screen = { x: W * 0.39, y: top, w: W * 0.57, h: H * 0.3 };
      const bw = Math.min(200, (this.screen.w - 30) / 3), gap = (this.screen.w - bw * 3) / 2;
      this.buzzers = [0, 1, 2].map(i => ({ x: this.screen.x + bw / 2 + i * (bw + gap), y: H * 0.66, w: bw, h: H * 0.21 }));
      // Buttons drawn on the canvas stay finger-sized on phones (where the canvas is scaled down).
      const big = H < 720 ? 1.25 : 1;
      this.hear = { x: this.screen.x + this.screen.w - 32 * big, y: this.screen.y + 32 * big, r: 24 * big };
      this.nextBtn = { x: this.screen.x + this.screen.w - 100 * big, y: this.screen.y + this.screen.h - 32 * big, w: 170 * big, h: 50 * big };
      this.doors = [0, 1, 2].map(i => ({ x: W * 0.36 + i * W * 0.21, y: H * 0.5, w: Math.min(170, W * 0.16), h: H * 0.36 }));
      this.again = { x: W * 0.57, y: H * 0.81, w: 230, h: 58 };
      // "Who's playing?" buttons on the big screen: just me, or a family show with two teams.
      const s = this.screen, pw = (s.w - 60) / 2, ph = s.h * 0.5;
      this.pickBtns = [0, 1].map(i => ({ x: s.x + 20 + pw / 2 + i * (pw + 20), y: s.y + s.h * 0.66, w: pw, h: ph }));
      this.bakeWheel();
    }
    resize() { this.layout(); }

    enter() {
      SA.ui.setScene('toy');
      SA.audio.music('show');
      $('btnToyBack').textContent = '🗺️ Map';
      $('toyPick').innerHTML = '';
      this.setupShow(false);
      this.layout();
      const first = !SA.state.showSeen;
      const intro = first ? [
        'Welcome to MISSION CONTROL! 📺 The space quiz show where YOU are the star! 🌟',
        'Spin the planet wheel. Then hit a buzzer to answer a question about that planet. 🔴🔵🟢',
        'And here\'s the best part: on my show, everybody wins a prize! 🏆',
      ] : ['Welcome back to MISSION CONTROL! 📺'];
      this.phase = 'intro';
      SA.ui.say(intro).then(() => {
        if (SA.scene !== this) return;
        SA.state.showSeen = true;
        SA.save();
        this.choose();
      });
    }

    // Before each show: play alone, or a family show with two teams taking turns.
    choose() {
      this.phase = 'pick';
      this.q = null;
      this.planet = null;
      SA.ui.setInfo('📺 Mission Control');
      SA.ui.hint('Who\'s playing today? Tap "Just me", or "Family show" to play in two teams with your family or friends! 👨‍👩‍👧', 0);
    }
    pickMode(teams) {
      if (this.phase !== 'pick') return;
      SA.audio.play('pop');
      SA.ui.hideTalk();
      SA.state.showTeams = teams;
      SA.save();
      this.setupShow(teams);
      this.layout();
      if (!teams) { this.startRound(); return; }
      this.phase = 'intro';
      SA.ui.say([
        'A family show! 🎉 Make two teams: ' + TEAMS[0].e + ' Team Rocket and ' + TEAMS[1].e + ' Team Comet. Grown-ups, help the little ones read!',
        'The teams take turns. On your turn, you spin the wheel and you hit the buzzers. Ready? Let\'s play! 📺',
      ]).then(() => { if (SA.scene === this) this.startRound(); });
    }
    get rounds() { return this.teams ? TEAM_ROUNDS : ROUNDS; }
    // The team on turn (null in a one-player show). Team Rocket starts.
    turn() { return this.teams ? this.teams[(Math.max(1, this.round) - 1) % 2] : null; }
    isDouble() { return this.round > this.rounds - (this.teams ? 2 : 1); }
    exit() { SA.ui.hideTalk(); SA.voice.stop(); this.drag = null; }
    back() { SA.go(SA.map, {}); }

    // The planets on the wheel: the missions finished (a mix of up to 8, shuffled), repeated to fill it.
    setupShow(teams) {
      this.teams = teams ? TEAMS.map(t => Object.assign({ pts: 0, prize: null }, t)) : null;
      this.doorTeam = 0;
      const done = SA.allMissions().filter(id => SA.state.done[id] && SA.BODY[id].quiz);
      const pick = done.slice().sort(() => Math.random() - 0.5).slice(0, 8);
      const segs = pick.slice();
      while (segs.length < 6) segs.push(pick[segs.length % pick.length] || 'earth');
      this.segs = segs;
      this.rot = Math.random() * TAU;
      this.landedOn = {};
      this.round = 0;
      this.points = 0;
      this.asked = {};
      this.q = null;
      this.wrong = [];
      this.planet = null;
      this.prize = null;
      this.cheer = 0;
      this.doorPick = -1;
      this.doorOpen = 0;
      this.wheelPic = null;
      this.updateInfo();
    }
    updateInfo() {
      if (this.teams && this.round) {
        SA.ui.setInfo('📺 ' + Math.min(this.round, this.rounds) + '/' + this.rounds + ' · ' + this.teams.map(t => t.e + ' ' + t.pts).join('  '));
        return;
      }
      SA.ui.setInfo(this.round ? '📺 Round ' + Math.min(this.round, this.rounds) + ' of ' + this.rounds + ' · ⭐ ' + this.points : '📺 Mission Control');
    }

    // The wheel's planets are drawn once into a picture that is then simply turned.
    bakeWheel() {
      const w = this.wheel, ps = SA.clamp(SA.pixelScale || 1, 1, 3), n = this.segs.length, seg = TAU / n;
      const c = this.wheelPic || document.createElement('canvas');
      c.width = c.height = Math.ceil(w.r * 2 * ps);
      const g = c.getContext('2d');
      g.setTransform(ps, 0, 0, ps, 0, 0);
      g.translate(w.r, w.r);
      const cols = ['#5b3fc4', '#2f7fd6', '#c2409a', '#1f9bb8', '#e0700f', '#3fa65a', '#8f5bff', '#d6455a'];
      for (let i = 0; i < n; i++) {
        g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, w.r * 0.97, i * seg, (i + 1) * seg); g.closePath();
        g.fillStyle = cols[i % cols.length]; g.fill();
        g.strokeStyle = '#fff6c8'; g.lineWidth = 3; g.stroke();
        const a = (i + 0.5) * seg, id = this.segs[i];
        const pr = Math.min(w.r * 0.2, w.r * Math.sin(seg / 2) * 0.55) * (id === 'saturn' ? 0.75 : 1);
        SA.drawBody(g, id, Math.cos(a) * w.r * 0.64, Math.sin(a) * w.r * 0.64, pr, { t: 1, lx: -0.5, ly: -0.5 });
      }
      // Light bulbs around the rim.
      g.lineWidth = 6; g.strokeStyle = '#ffd84d';
      g.beginPath(); g.arc(0, 0, w.r * 0.97, 0, TAU); g.stroke();
      this.wheelPic = c;
    }

    // Which segment is under the pointer at the top.
    segAt() {
      const n = this.segs.length, seg = TAU / n;
      const a = ((-Math.PI / 2 - this.rot) % TAU + TAU) % TAU;
      return Math.floor(a / seg) % n;
    }

    startRound() {
      this.round++;
      this.q = null;
      this.picked = null;
      this.wrong = [];
      this.firstTry = true;
      this.phase = 'spin';
      this.updateInfo();
      SA.audio.play('whoosh');
      const tm = this.turn();
      if (tm) {
        const last = this.round > this.rounds - 2;
        SA.ui.hint(tm.e + ' ' + tm.name + ', it\'s your turn! ' + (last ? 'Your last round is worth DOUBLE points! ✨ ' : '') + 'Spin the wheel! 🎡', 0);
        return;
      }
      SA.ui.hint(this.round === this.rounds ? 'Last round, and it\'s worth DOUBLE points! ✨ Spin the wheel! 🎡' : 'Round ' + this.round + '! Spin the wheel! Flick it or tap it. 🎡', 0);
    }

    // The wheel always lands on a planet that still has a question the child hasn't had this show
    // (a planet not landed on yet, if possible). It spins the way it was flicked, about 1-2 turns,
    // and eases to a stop in the middle of that planet's slice.
    spin(v) {
      if (this.phase !== 'spin') return;
      const n = this.segs.length, seg = TAU / n;
      const fresh = id => SA.BODY[id].quiz.concat(SA.state.expert[id] && SA.EXPERT[id] ? SA.EXPERT[id].quiz : []).some(q => !this.asked[q.q]);
      let pool = this.segs.map((id, i) => i).filter(i => fresh(this.segs[i]) && !this.landedOn[this.segs[i]]);
      if (!pool.length) pool = this.segs.map((id, i) => i).filter(i => fresh(this.segs[i]));
      if (!pool.length) pool = this.segs.map((id, i) => i);
      const target = SA.pick(pool), dir = v < 0 ? -1 : 1;
      // Final angle: the pointer (straight up) in the middle of the target slice, plus whole turns.
      const want = -Math.PI / 2 - (target + 0.5 + SA.rand(-0.25, 0.25)) * seg;
      let delta = ((want - this.rot) % TAU + TAU) % TAU;
      if (dir < 0) delta -= TAU;
      delta += dir * TAU * (1 + Math.floor(Math.random() * 2));
      this.spinAnim = { from: this.rot, by: delta, t: 0, dur: 2.6 + Math.abs(delta) * 0.06 };
      this.phase = 'spinning';
      this.lastSeg = this.segAt();
      SA.ui.hideTalk();
      SA.audio.play('whoosh');
    }

    landed() {
      const id = this.segs[this.segAt()];
      this.planet = id;
      this.landedOn[id] = true;
      this.phase = 'reveal';
      this.revealT = 0;
      SA.audio.play('ding');
      this.fx.spawn('sparkle', this.wheel.x, this.wheel.y - this.wheel.r, 14, { color: '#ffe066' });
      // A question about that planet the child hasn't had yet this show (its Expert questions too, once earned).
      const pool = SA.BODY[id].quiz.concat(SA.state.expert[id] && SA.EXPERT[id] ? SA.EXPERT[id].quiz : []);
      const fresh = pool.filter(q => !this.asked[q.q]);
      const q = SA.pick(fresh.length ? fresh : pool);
      this.asked[q.q] = true;
      const order = [0, 1, 2].sort(() => Math.random() - 0.5);
      this.q = { q: q.q, explain: q.explain, opts: order.map(i => q.options[i]), answer: order.indexOf(q.answer) };
      this.buzzIn = 0;
      SA.voice.say(SA.BODY[id].name + '!');
      setTimeout(() => { if (SA.scene === this && this.phase === 'reveal') this.ask(); }, 900);
    }

    ask() {
      this.phase = 'ask';
      this.readQuestion();
    }
    readQuestion() {
      const q = this.q;
      if (!q) return;
      if (this.phase === 'right') { SA.voice.say(q.explain); return; }
      const opts = q.opts.map(o => o[1]);
      SA.voice.say(q.q + ' Is it: ' + opts.slice(0, 2).join('? ') + '? Or ' + opts[2] + '?');
    }

    press(i) {
      if (this.phase !== 'ask' || this.wrong.indexOf(i) >= 0) return;
      const b = this.buzzers[i];
      b.down = 1;
      SA.audio.play('buzz');
      if (i === this.q.answer) {
        const pts = (this.firstTry ? 100 : 50) * (this.isDouble() ? 2 : 1);
        this.points += pts;
        if (this.turn()) this.turn().pts += pts;
        this.phase = 'right';
        this.picked = i;
        this.cheer = 2.5;
        this.updateInfo();
        SA.ui.bumpInfo();
        setTimeout(() => { if (SA.scene === this) { SA.audio.play('tada'); SA.audio.play('applause'); } }, 180);
        SA.celebrate(70);
        this.fx.spawn('sparkle', b.x, b.y - b.h * 0.3, 22, { color: '#ffe066' });
        this.fx.text(b.x, b.y - b.h * 0.75, '+' + pts + ' ⭐', '#ffe066');
        this.rightT = 0;
        SA.voice.say((this.firstTry ? 'Correct! ' : 'You got it! ') + this.q.explain);
      } else {
        this.firstTry = false;
        this.wrong.push(i);
        setTimeout(() => SA.audio.play('boing'), 150);
        const line = SA.pick(['Ooh, so close! Try another buzzer! 💪', 'Not that one, but you\'re warming up! Try again! 🔥', 'Hmm, nope! Another buzzer, quick! ⚡']);
        SA.ui.hint(line, 3);
      }
    }

    // After the last round: the Prize Door.
    finale() {
      this.phase = 'doors';
      this.q = null;
      SA.ui.setInfo(this.teams ? '📺 Final · ' + this.teams.map(t => t.e + ' ' + t.pts).join('  ') : '📺 Final score · ⭐ ' + this.points);
      SA.audio.play('tada');
      SA.celebrate(120);
      const n = this.points;
      if (this.teams) {
        const [a, b] = this.teams;
        const lines = ['What a show! ' + a.e + ' ' + a.name + ' scored ' + a.pts + ', and ' + b.e + ' ' + b.name + ' scored ' + b.pts + '! 🎉'];
        if (a.pts === b.pts) lines.push('It\'s a TIE! Everybody\'s a space superstar! 🌟');
        else lines.push((a.pts > b.pts ? a : b).name + ' gets the most points... but on my show, EVERY team wins a prize! 🏆');
        SA.ui.say(lines).then(() => {
          if (SA.scene === this) SA.ui.hint(this.teams[0].e + ' ' + this.teams[0].name + ', it\'s time for the PRIZE DOOR! 🚪✨ Pick a door, any door!', 0);
        });
        return;
      }
      SA.ui.say(['What a show! You scored ' + n + ' space points! 🎉']).then(() => {
        if (SA.scene === this) SA.ui.hint('And now... it\'s time for the PRIZE DOOR! 🚪✨ Pick a door, any door!', 0);
      });
    }
    openDoor(i) {
      if (this.phase !== 'doors' || SA.ui.blocking()) return;
      this.doorPick = i;
      this.doorOpen = 0;
      this.phase = 'opening';
      SA.ui.hideTalk();
      SA.audio.play('drumroll');
      // A prize this child doesn't have yet, if there are any left.
      const fresh = SA.PRIZES.filter(p => !SA.state.prizes[p.id]);
      // In a family show the second team gets a different prize from the first.
      const other = this.teams && this.doorTeam === 1 ? this.teams[0].prize : null;
      const pool = (fresh.length ? fresh : SA.PRIZES).filter(p => p !== other);
      this.prize = SA.pick(pool.length ? pool : SA.PRIZES);
      this.prizeNew = !SA.state.prizes[this.prize.id];
    }
    reveal() {
      this.phase = 'prize';
      const p = this.prize;
      SA.state.prizes[p.id] = true;
      if (this.prizeNew) SA.state.baseNew = true;
      const tm = this.teams ? this.teams[this.doorTeam] : null;
      const lastDoor = !tm || this.doorTeam === 1;
      if (tm) tm.prize = p;
      if (lastDoor) {
        SA.state.shows = (SA.state.shows || 0) + 1;
        if (tm) {
          if (!SA.state.familyShows) SA.state.baseNew = true;   // the family show sticker
          SA.state.familyShows = (SA.state.familyShows || 0) + 1;
        }
      }
      SA.save();
      SA.audio.play('tada');
      SA.audio.play('applause');
      SA.celebrate(110);
      const d = this.doors[this.doorPick];
      this.fx.spawn('sparkle', d.x, d.y, 26, { color: '#ffe066' });
      this.cheer = 3;
      const have = SA.PRIZES.filter(q => SA.state.prizes[q.id]).length;
      const lines = [
        (tm ? tm.e + ' ' + tm.name + ' won... ' : 'You won... ') + p.line,
        this.prizeNew ? 'It\'s a sticker now! Find it at my Space Base 🏠. That\'s ' + have + ' of ' + SA.PRIZES.length + ' silly prizes!' : 'Another one for your collection! 😄',
      ];
      if (tm && !lastDoor) {
        // Now the second team picks a door.
        SA.ui.say(lines).then(() => {
          if (SA.scene !== this) return;
          this.doorTeam = 1;
          this.doorPick = -1;
          this.doorOpen = 0;
          this.prize = null;
          this.phase = 'doors';
          SA.audio.play('whoosh');
          SA.ui.hint(this.teams[1].e + ' ' + this.teams[1].name + ', your turn! Pick a door! 🚪✨', 0);
        });
        return;
      }
      lines.push(tm ? 'Thanks for playing the family show! What a team! 👨‍👩‍👧' + (SA.state.familyShows === 1 ? ' I made you a family sticker for my Space Base, too! 🏠' : '')
        : 'Thanks for playing MISSION CONTROL! You\'re a space superstar! 🌟');
      SA.ui.say(lines).then(() => {
        if (SA.scene !== this) return;
        this.phase = 'end';
        SA.ui.hint('Tap "Play again" for another show, or 🗺️ Map to explore! 🚀', 6);
      });
    }

    // ---------- Input ----------
    onDown(x, y) {
      if (this.phase === 'pick') {
        const i = this.pickBtns.findIndex(b => Math.abs(x - b.x) < b.w / 2 + 8 && Math.abs(y - b.y) < b.h / 2 + 8);
        if (i >= 0) this.pickMode(i === 1);
        return;
      }
      if (this.phase === 'spin') {
        const w = this.wheel;
        if (Math.hypot(x - w.x, y - w.y) < w.r * 1.15) {
          this.drag = { a: Math.atan2(y - w.y, x - w.x), t: performance.now(), v: 0, moved: 0 };
          return;
        }
        SA.audio.play('boing');
        SA.ui.hint('Spin the wheel first! Tap it or flick it. 🎡', 3);
        return;
      }
      if (this.q && Math.hypot(x - this.hear.x, y - this.hear.y) < this.hear.r + 12) { SA.audio.play('click'); this.readQuestion(); return; }
      if (this.phase === 'ask') {
        const i = this.buzzers.findIndex(b => Math.abs(x - b.x) < b.w / 2 && y > b.y - b.h * 0.7 && y < b.y + b.h * 0.55);
        if (i >= 0) this.press(i);
        return;
      }
      if (this.phase === 'right' && this.rightT > 0.8) {
        const n = this.nextBtn;
        if (Math.abs(x - n.x) < n.w / 2 + 10 && Math.abs(y - n.y) < n.h / 2 + 10) this.next();
        return;
      }
      if (this.phase === 'doors') {
        const i = this.doors.findIndex(d => Math.abs(x - d.x) < d.w / 2 && Math.abs(y - d.y) < d.h / 2);
        if (i >= 0) this.openDoor(i);
        return;
      }
      if (this.phase === 'end') {
        const a = this.again;
        if (Math.abs(x - a.x) < a.w / 2 + 10 && Math.abs(y - a.y) < a.h / 2 + 10) {
          SA.audio.play('pop');
          SA.ui.hideTalk();
          this.setupShow(false);
          this.layout();
          this.choose();
        }
      }
    }
    onMove(x, y) {
      const d = this.drag;
      if (!d) return;
      const w = this.wheel, a = Math.atan2(y - w.y, x - w.x), now = performance.now();
      const da = SA.wrapAngle(a - d.a), dt = Math.max(0.008, (now - d.t) / 1000);
      this.rot += da;
      d.moved += Math.abs(da);
      d.v = SA.lerp(d.v, da / dt, 0.5);
      d.a = a; d.t = now;
    }
    onUp() {
      const d = this.drag;
      if (!d) return;
      this.drag = null;
      // A flick spins it that way; a plain tap spins it the usual way.
      this.spin(Math.abs(d.v) > 2 && d.moved > 0.1 ? d.v : 1);
    }
    next() {
      SA.audio.play('click');
      SA.voice.stop();
      if (this.round >= this.rounds) this.finale();
      else this.startRound();
    }

    // ---------- Update ----------
    update(dt) {
      this.t += dt;
      this.fx.update(dt);
      this.cheer = Math.max(0, this.cheer - dt);
      for (const b of this.buzzers || []) b.down = Math.max(0, (b.down || 0) - dt * 4);
      if (this.phase === 'spinning') {
        const a = this.spinAnim;
        a.t = Math.min(a.dur, a.t + dt);
        const u = a.t / a.dur;
        this.rot = a.from + a.by * (1 - Math.pow(1 - u, 3));
        const s = this.segAt();
        if (s !== this.lastSeg) { this.lastSeg = s; SA.audio.play('tick'); }
        if (a.t >= a.dur) this.landed();
      }
      if (this.q) this.buzzIn = Math.min(1, (this.buzzIn || 0) + dt * 2.2);
      if (this.phase === 'right') this.rightT += dt;
      if (this.phase === 'opening') {
        this.doorOpen = Math.min(1, this.doorOpen + dt * 0.75);
        if (this.doorOpen >= 1) this.reveal();
      }
    }

    // ---------- Drawing ----------
    draw(ctx) {
      const W = SA.W, H = SA.H, t = this.t, calm = SA.calm();
      // The studio: a deep purple stage, curtains, spotlights and a shiny floor.
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#120a3a'); bg.addColorStop(0.7, '#2a1660'); bg.addColorStop(1, '#3a1a5e');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      this.stars.draw(ctx, t, 0);
      this.drawCurtains(ctx, t);
      this.drawSpots(ctx, t, calm);
      const floorY = H * 0.8;
      const fl = ctx.createLinearGradient(0, floorY, 0, H);
      fl.addColorStop(0, '#5a2f8a'); fl.addColorStop(1, '#25124a');
      ctx.fillStyle = fl; ctx.fillRect(0, floorY, W, H - floorY);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      for (let x = (t * 20) % 80 - 80; x < W; x += 80) ctx.fillRect(x, floorY, 40, 4);

      if (this.phase === 'doors' || this.phase === 'opening' || this.phase === 'prize' || this.phase === 'end') {
        this.drawDoors(ctx, t);
      } else {
        this.drawWheel(ctx, t);
        this.drawScreen(ctx, t, calm);
        this.drawBuzzers(ctx, t);
      }
      this.drawAudience(ctx, t);
      this.fx.draw(ctx);
    }

    drawCurtains(ctx, t) {
      const W = SA.W, H = SA.H;
      for (const side of [0, 1]) {
        const x0 = side ? W - W * 0.05 : 0, w = W * 0.05;
        const g = ctx.createLinearGradient(x0, 0, x0 + w, 0);
        g.addColorStop(0, side ? '#7a1240' : '#a3195a'); g.addColorStop(1, side ? '#a3195a' : '#7a1240');
        ctx.fillStyle = g; ctx.fillRect(x0, 0, w, H * 0.82);
        ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 2;
        for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x0 + (w * k) / 4, 0); ctx.lineTo(x0 + (w * k) / 4 + Math.sin(t + k) * 2, H * 0.82); ctx.stroke(); }
      }
      // A scalloped valance along the top.
      ctx.fillStyle = '#a3195a';
      ctx.fillRect(0, 0, W, H * 0.035);
      for (let x = 0; x < W + 40; x += 40) { SA.circle(ctx, x + 20, H * 0.035, 20); ctx.fill(); }
      ctx.fillStyle = '#ffd84d';
      for (let x = 0; x < W + 40; x += 40) { SA.circle(ctx, x + 20, H * 0.035 + 16, 3); ctx.fill(); }
    }

    drawSpots(ctx, t, calm) {
      const W = SA.W, H = SA.H;
      for (let i = 0; i < 3; i++) {
        const sx = W * (0.2 + i * 0.3), sway = calm ? 0 : Math.sin(t * 0.7 + i * 2) * W * 0.08;
        const ex = sx + sway + (i - 1) * W * 0.05;
        const g = ctx.createLinearGradient(sx, 0, ex, H * 0.85);
        g.addColorStop(0, ['rgba(255,240,180,0.22)', 'rgba(180,220,255,0.18)', 'rgba(255,190,240,0.2)'][i]);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(sx - 18, 0); ctx.lineTo(sx + 18, 0); ctx.lineTo(ex + 120, H * 0.85); ctx.lineTo(ex - 120, H * 0.85); ctx.closePath(); ctx.fill();
      }
    }

    drawWheel(ctx, t) {
      const w = this.wheel;
      // Stand.
      ctx.fillStyle = '#c7b8f0';
      ctx.beginPath(); ctx.moveTo(w.x - w.r * 0.3, SA.H * 0.82); ctx.lineTo(w.x, w.y); ctx.lineTo(w.x + w.r * 0.3, SA.H * 0.82); ctx.closePath(); ctx.fill();
      // Glow behind while it is waiting to be spun.
      if (this.phase === 'spin') {
        const g = ctx.createRadialGradient(w.x, w.y, w.r * 0.9, w.x, w.y, w.r * 1.3);
        g.addColorStop(0, 'rgba(255,224,102,' + (0.25 + 0.15 * Math.sin(t * 4)) + ')'); g.addColorStop(1, 'rgba(255,224,102,0)');
        ctx.fillStyle = g; SA.circle(ctx, w.x, w.y, w.r * 1.3); ctx.fill();
      }
      if (!this.wheelPic) this.bakeWheel();
      ctx.save();
      ctx.translate(w.x, w.y);
      ctx.rotate(this.rot);
      ctx.drawImage(this.wheelPic, -w.r, -w.r, w.r * 2, w.r * 2);
      ctx.restore();
      // Rim bulbs that chase around (steady with Calm effects).
      const n = 18;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU, on = SA.calm() ? i % 2 === 0 : (i + Math.floor(t * 8)) % 3 === 0;
        ctx.fillStyle = on ? '#fff6c8' : 'rgba(255,216,77,0.5)';
        SA.circle(ctx, w.x + Math.cos(a) * w.r * 1.04, w.y + Math.sin(a) * w.r * 1.04, on ? 5 : 3.5); ctx.fill();
      }
      // Hub.
      ctx.fillStyle = '#fff'; SA.circle(ctx, w.x, w.y, w.r * 0.24); ctx.fill();
      ctx.strokeStyle = '#ffd84d'; ctx.lineWidth = 4; ctx.stroke();
      SA.label(ctx, this.phase === 'spin' ? 'SPIN!' : '★', w.x, w.y + 1, this.phase === 'spin' ? Math.max(16, w.r * 0.15) : 26, '#5b3fc4', { stroke: false });
      // Pointer at the top.
      ctx.fillStyle = '#ffd84d'; ctx.strokeStyle = '#a35a00'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(w.x, w.y - w.r * 0.86); ctx.lineTo(w.x - 16, w.y - w.r - 22); ctx.lineTo(w.x + 16, w.y - w.r - 22); ctx.closePath(); ctx.fill(); ctx.stroke();
      // Which planet it landed on.
      if (this.planet && this.phase !== 'spin' && this.phase !== 'spinning') {
        SA.pill(ctx, SA.BODY[this.planet].name, w.x, w.y + w.r + 30, 20, { color: '#fff', edge: '#ffd84d' });
      } else if (this.phase === 'spin') {
        const hop = Math.abs(Math.sin(t * 3)) * 10;
        SA.emoji(ctx, '👆', w.x + w.r * 0.55, w.y + w.r * 0.65 + hop, 40);
      }
    }

    drawScreen(ctx, t, calm) {
      const s = this.screen;
      // Frame with chasing marquee bulbs.
      ctx.fillStyle = '#ffd84d';
      SA.rrect(ctx, s.x - 10, s.y - 10, s.w + 20, s.h + 20, 22); ctx.fill();
      const per = 2 * (s.w + s.h), n = Math.floor(per / 34);
      for (let i = 0; i < n; i++) {
        let d = (i / n) * per, bx, by;
        if (d < s.w) { bx = s.x + d; by = s.y - 5; } else if ((d -= s.w) < s.h) { bx = s.x + s.w + 5; by = s.y + d; }
        else if ((d -= s.h) < s.w) { bx = s.x + s.w - d; by = s.y + s.h + 5; } else { d -= s.w; bx = s.x - 5; by = s.y + s.h - d; }
        const on = calm ? i % 2 === 0 : (i + Math.floor(t * 6)) % 2 === 0;
        ctx.fillStyle = on ? '#fffbe6' : '#e0a31a';
        SA.circle(ctx, bx, by, 3.5); ctx.fill();
      }
      const g = ctx.createLinearGradient(0, s.y, 0, s.y + s.h);
      g.addColorStop(0, '#13205a'); g.addColorStop(1, '#0a1238');
      ctx.fillStyle = g;
      SA.rrect(ctx, s.x, s.y, s.w, s.h, 16); ctx.fill();
      const pad = 26;
      if (this.phase === 'pick') {
        // Who's playing? Two big buttons on the screen.
        SA.label(ctx, 'Who\'s playing?', s.x + s.w / 2, s.y + s.h * 0.2, Math.min(36, s.w * 0.065), '#ffd84d', { stroke: 'rgba(160,60,0,0.8)' });
        const opts = [['🧑‍🚀', 'Just me'], ['👨‍👩‍👧', 'Family show']];
        this.pickBtns.forEach((b, i) => {
          const pulse = 1 + Math.sin(t * 4 + i * 1.6) * 0.03;
          ctx.save(); ctx.translate(b.x, b.y); ctx.scale(pulse, pulse);
          const c = i ? '#4fa3f0' : '#3fbf5a';
          ctx.fillStyle = SA.shade(c, -50); SA.rrect(ctx, -b.w / 2, -b.h / 2 + 5, b.w, b.h, 18); ctx.fill();
          ctx.fillStyle = c; SA.rrect(ctx, -b.w / 2, -b.h / 2, b.w, b.h, 18); ctx.fill();
          if (SA.state.showTeams === !!i) { ctx.strokeStyle = 'rgba(255,240,170,0.9)'; ctx.lineWidth = 4; ctx.stroke(); }
          SA.emoji(ctx, opts[i][0], -b.w * 0.3, 0, Math.min(44, b.h * 0.55));
          const f = fitText(ctx, opts[i][1], b.w * 0.55, 28, 15, 2, 800);
          ctx.font = '800 ' + f.size + 'px ' + SA.FONT; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          f.lines.forEach((ln, j) => ctx.fillText(ln, b.w * 0.14, (j - (f.lines.length - 1) / 2) * f.size * 1.1));
          ctx.restore();
        });
        return;
      }
      if (!this.q) {
        // Title card while waiting (in a family show: whose turn it is).
        const tm = this.turn();
        SA.label(ctx, tm ? tm.e + ' ' + tm.name.toUpperCase() : 'MISSION CONTROL', s.x + s.w / 2, s.y + s.h * 0.42, Math.min(46, s.w * 0.08), tm ? '#fff' : '#ffd84d', { stroke: tm ? SA.shade(tm.col, -60) : 'rgba(160,60,0,0.8)' });
        SA.label(ctx, this.phase === 'spinning' ? 'Spinning... 🎡' : tm ? 'Your turn! Spin the wheel! 🎡' : 'The space quiz show! 📺', s.x + s.w / 2, s.y + s.h * 0.72, 22, '#bfe8ff', { weight: 700 });
        return;
      }
      // In a family show, a little tag says which team is answering.
      const tm = this.turn();
      if (tm) {
        ctx.font = '800 16px ' + SA.FONT;
        const tw = ctx.measureText(tm.e + ' ' + tm.name).width + 24;
        ctx.fillStyle = tm.col; SA.rrect(ctx, s.x + 12, s.y + 8, tw, 26, 13); ctx.fill();
        SA.label(ctx, tm.e + ' ' + tm.name, s.x + 12 + tw / 2, s.y + 21, 16, '#fff', { stroke: false });
      }
      const right = this.phase === 'right';
      const text = right ? '⭐ ' + this.q.explain : this.q.q;
      // The explanation leaves room at the bottom for the Next button.
      const f = fitText(ctx, text, s.w - pad * 2 - 50, 32, 16, 3, 800);
      ctx.font = '800 ' + f.size + 'px ' + SA.FONT;
      ctx.fillStyle = right ? '#bfffd0' : '#ffffff';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      const lh = f.size * 1.22, mid = right ? s.y + (s.h - this.nextBtn.h - 8) / 2 + 4 : s.y + s.h / 2;
      const top = mid - ((f.lines.length - 1) * lh) / 2;
      f.lines.forEach((ln, i) => ctx.fillText(ln, s.x + pad, top + i * lh));
      // 🔊 read-aloud button.
      const h = this.hear;
      ctx.fillStyle = '#f5f2ff'; SA.circle(ctx, h.x, h.y, h.r); ctx.fill();
      SA.emoji(ctx, '🔊', h.x, h.y + 1, h.r * 1.05);
      if (right && this.rightT > 0.8) {
        const b = this.nextBtn, pulse = 1 + Math.sin(t * 5) * 0.04;
        ctx.save(); ctx.translate(b.x, b.y); ctx.scale(pulse, pulse);
        ctx.fillStyle = '#e0a800'; SA.rrect(ctx, -b.w / 2, -b.h / 2 + 4, b.w, b.h, b.h / 2); ctx.fill();
        ctx.fillStyle = '#ffd84d'; SA.rrect(ctx, -b.w / 2, -b.h / 2, b.w, b.h, b.h / 2); ctx.fill();
        SA.label(ctx, this.round >= this.rounds ? 'Prizes! ▶' : 'Next ▶', 0, 1, Math.round(b.h * 0.45), '#3a2400', { stroke: false });
        ctx.restore();
      }
    }

    drawBuzzers(ctx, t) {
      const q = this.q, k = this.buzzIn || 0;
      this.buzzers.forEach((b, i) => {
        const appear = SA.easeBack(SA.clamp(k * 3 - i * 0.6, 0, 1));
        const dim = this.wrong.indexOf(i) >= 0, win = this.phase === 'right' && this.picked === i;
        const hintGlow = this.phase === 'ask' && SA.easy() && this.wrong.length > 0 && i === q.answer;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.globalAlpha = dim ? 0.4 : 1;
        // Podium.
        const pw = b.w, ph = b.h;
        const pg = ctx.createLinearGradient(0, -ph * 0.2, 0, ph * 0.6);
        pg.addColorStop(0, '#f5f2ff'); pg.addColorStop(1, '#bfb3f0');
        ctx.fillStyle = pg;
        SA.rrect(ctx, -pw / 2, -ph * 0.2, pw, ph * 0.75, 16); ctx.fill();
        if (win || hintGlow) { ctx.strokeStyle = win ? '#7ee08a' : 'rgba(255,224,102,' + (0.5 + 0.5 * Math.sin(t * 6)) + ')'; ctx.lineWidth = 6; ctx.stroke(); }
        // The big round buzzer on top (pressed down for a moment when hit).
        const press = (b.down || 0) * 8;
        ctx.fillStyle = SA.shade(BUZZ[i], -60);
        SA.ellipse(ctx, 0, -ph * 0.2, pw * 0.3, 12); ctx.fill();
        ctx.fillStyle = win ? '#7ee08a' : BUZZ[i];
        ctx.beginPath(); ctx.ellipse(0, -ph * 0.2 + press, pw * 0.27, ph * 0.22 - press * 0.6, 0, Math.PI, TAU); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        SA.ellipse(ctx, -pw * 0.08, -ph * 0.3 + press, pw * 0.08, 5, -0.3); ctx.fill();
        // The answer, once the question is up.
        if (q && appear > 0) {
          ctx.scale(appear, appear);
          const o = q.opts[i];
          SA.emoji(ctx, o[0], 0, -ph * 0.01, Math.min(38, ph * 0.22));
          const f = fitText(ctx, o[1], pw - 18, 19, 13, 2, 800);
          ctx.font = '800 ' + f.size + 'px ' + SA.FONT;
          ctx.fillStyle = '#2b1d6e'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          f.lines.forEach((ln, j) => ctx.fillText(ln, 0, ph * 0.35 + j * f.size * 1.1 - ((f.lines.length - 1) * f.size * 1.1) / 2));
        }
        ctx.restore();
        if (dim) SA.label(ctx, 'So close!', b.x, b.y - b.h * 0.55, 15, '#ffd0d0');
      });
    }

    drawDoors(ctx, t) {
      const H = SA.H;
      const tm = this.teams ? this.teams[this.doorTeam] : null;
      SA.label(ctx, '🚪 THE PRIZE DOOR 🚪', SA.W * 0.57, H * 0.2 - (tm ? 14 : 0), Math.min(44, SA.W * 0.04), '#ffd84d', { stroke: 'rgba(160,60,0,0.85)' });
      if (tm) {
        SA.label(ctx, tm.e + ' ' + tm.name + (this.phase === 'doors' ? ', pick a door!' : ''), SA.W * 0.57, H * 0.2 + 22, 22, '#fff', { stroke: SA.shade(tm.col, -70) });
        // The first team's prize stays on show while the second team picks.
        const first = this.teams[0];
        if (this.doorTeam === 1 && first.prize) SA.pill(ctx, first.e + ' ' + first.prize.name, SA.W * 0.57, H * 0.77, 18, { color: '#fff', edge: first.col });
      }
      const cols = ['#ff5d6c', '#4fa3f0', '#3fbf5a'];
      this.doors.forEach((d, i) => {
        const x0 = d.x - d.w / 2, y0 = d.y - d.h / 2;
        // Door frame and the prize glowing behind it.
        ctx.fillStyle = '#2a1660'; SA.rrect(ctx, x0 - 8, y0 - 8, d.w + 16, d.h + 12, 14); ctx.fill();
        const picked = i === this.doorPick;
        if (picked && this.prize) {
          const g = ctx.createRadialGradient(d.x, d.y, 4, d.x, d.y, d.w);
          g.addColorStop(0, 'rgba(255,240,170,0.95)'); g.addColorStop(1, 'rgba(255,200,80,0.2)');
          ctx.fillStyle = g; ctx.fillRect(x0, y0, d.w, d.h);
          const pop = this.phase === 'opening' ? SA.easeBack(SA.clamp((this.doorOpen - 0.5) * 2, 0, 1)) : 1 + Math.sin(t * 4) * 0.05;
          if (pop > 0) SA.emojiCached(ctx, this.prize.e, d.x, d.y, d.w * 0.6 * pop);
        }
        // The door swings open (shrinks sideways like it's turning on its hinge).
        const open = picked ? SA.easeInOut(this.doorOpen) : 0;
        const dw = d.w * (1 - open * 0.88);
        const dg = ctx.createLinearGradient(x0, 0, x0 + dw, 0);
        dg.addColorStop(0, cols[i]); dg.addColorStop(1, SA.shade(cols[i], -40));
        ctx.fillStyle = dg;
        SA.rrect(ctx, x0, y0, dw, d.h, 10); ctx.fill();
        if (open < 0.6) {
          ctx.fillStyle = 'rgba(255,255,255,0.18)';
          SA.rrect(ctx, x0 + dw * 0.15, y0 + d.h * 0.1, dw * 0.7, d.h * 0.35, 8); ctx.fill();
          SA.rrect(ctx, x0 + dw * 0.15, y0 + d.h * 0.52, dw * 0.7, d.h * 0.35, 8); ctx.fill();
          ctx.fillStyle = '#ffd84d'; SA.circle(ctx, x0 + dw * 0.85, d.y, 7); ctx.fill();
          SA.label(ctx, String(i + 1), x0 + dw / 2, y0 + d.h * 0.27, Math.min(44, dw * 0.35), '#fff');
        }
        if (this.phase === 'doors') {
          const bob = Math.abs(Math.sin(t * 3 + i)) * 8;
          SA.emoji(ctx, '✨', d.x, y0 - 22 - bob, 26);
        }
      });
      if (this.phase === 'prize' || this.phase === 'end') {
        const d = this.doors[this.doorPick];
        SA.pill(ctx, this.prize.name, d.x, d.y + d.h / 2 + 26, 20, { color: '#fff', edge: '#ffd84d' });
      }
      if (this.phase === 'end') {
        const a = this.again, pulse = 1 + Math.sin(t * 4) * 0.04;
        ctx.save(); ctx.translate(a.x, a.y); ctx.scale(pulse, pulse);
        ctx.fillStyle = '#e0a800'; SA.rrect(ctx, -a.w / 2, -a.h / 2 + 5, a.w, a.h, a.h / 2); ctx.fill();
        ctx.fillStyle = '#ffd84d'; SA.rrect(ctx, -a.w / 2, -a.h / 2, a.w, a.h, a.h / 2); ctx.fill();
        SA.label(ctx, '🔁 Play again', 0, 1, 24, '#3a2400', { stroke: false });
        ctx.restore();
      }
    }

    // The studio audience: the child's critter friends (or Cosmo's alien pals), cheering.
    drawAudience(ctx, t) {
      const W = SA.W, H = SA.H;
      const found = SA.CRITTERS.filter(c => SA.state.critters[c.id]).slice(0, 7);
      const crowd = found.length >= 3 ? found : found.concat(AUDIENCE).slice(0, 6);
      const x0 = W * 0.3, x1 = W * 0.95, n = crowd.length;
      // The audience row: a dark front edge of the stage with the crowd peeking over it.
      crowd.forEach((c, i) => {
        const x = x0 + ((i + 0.5) / n) * (x1 - x0);
        const hop = this.cheer > 0 ? Math.abs(Math.sin(t * 10 + i)) * 16 : Math.abs(Math.sin(t * 2 + i)) * 2;
        SA.drawCritter(ctx, x, H * 0.93 - hop, 0.72, c, { t: t + i, mood: this.cheer > 0 ? 'joy' : null, seed: i * 3 });
      });
      // Cosmo the host, with his microphone, at the front of the stage.
      const hx = W * 0.15, hy = H * 0.89, hop = this.cheer > 0 ? Math.abs(Math.sin(t * 9)) * 10 : 0;
      SA.drawCosmo(ctx, hx, hy - hop, 0.72, { t, mood: this.cheer > 0 ? 'joy' : null, wave: this.phase === 'doors' || this.phase === 'spin' });
      SA.icon(ctx, 'mic', hx + 38, hy - hop + 2, 30);
    }
  }
  SA.QuizShowScene = QuizShowScene;
})(window.SA);
