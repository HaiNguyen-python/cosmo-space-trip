// Cosmo's Space Camp (🎤 on the map, then 🏕️): a short daily routine, about 3 minutes, like real
// astronaut training. Three stations, one after the other:
//   1. Workout: today's astronaut move (star jumps, rocket squats, Moon hops...). The child moves
//      along for real and taps Cosmo for each one while he counts. Then a true fact about why
//      astronauts exercise.
//   2. Brain training: one picture question about a place the child has explored.
//   3. Sky watch: Cosmo shows tonight's real Moon (worked out on the device) in his telescope, the
//      child finds the matching shape, and hears where and when to look for it.
// Finishing camp on a new day adds a camp day (days are counted, never a streak: missing a day costs
// nothing) and patches unlock as stickers after 1, 3 and 7 camp days. Camp can be repeated any time.
(function (SA) {
  const TAU = Math.PI * 2;
  const $ = id => document.getElementById(id);
  const REPS = 5;
  // Today's move (one a day, in turn). say: the how-to; count: what Cosmo says after each rep; fact: true.
  const MOVES = [
    { id: 'jump', name: 'Star jumps', icon: '⭐', say: 'Today\'s move: STAR JUMPS! ⭐ Jump and stretch out like a star. Do 5 with me, and tap me each time you jump!',
      fact: 'Astronauts on the space station exercise about 2 hours every day, to keep their muscles and bones strong! 💪' },
    { id: 'squat', name: 'Rocket squats', icon: '🚀', say: 'Today\'s move: ROCKET SQUATS! 🚀 Crouch down low like a rocket on the launch pad, then blast up tall! Do 5, and tap me each time!',
      fact: 'When a rocket launches, astronauts get pushed into their seats and feel about 3 times heavier than usual! 🚀' },
    { id: 'hop', name: 'Moon hops', icon: '🌙', say: 'Today\'s move: MOON HOPS! 🌙 Do big, slow bunny hops, like an astronaut on the Moon. Do 5, and tap me each time you hop!',
      fact: 'On the Moon you would weigh only about one sixth of what you weigh on Earth, so the Apollo astronauts bounced along! 🐰' },
    { id: 'reach', name: 'Reach for the stars', icon: '🙌', say: 'Today\'s move: REACH FOR THE STARS! 🙌 Stretch up as tall as you can, then touch your toes. Do 5, and tap me each time!',
      fact: 'In space, astronauts grow a little taller, because without gravity their backs stretch out! 📏' },
    { id: 'float', name: 'Space float', icon: '🛰️', say: 'Today\'s move: SPACE FLOAT! 🛰️ Move your arms super slowly, like you\'re floating on the space station. Do 5 slow swims, and tap me each time!',
      fact: 'On the space station everything floats, so astronauts hold on to handrails and slip their feet into foot loops to stay put! 🦶' },
  ];
  const COUNT = ['One!', 'Two!', 'Three!', 'Four!', 'Five! 🎉'];
  const MOON_NAMES = ['New Moon', 'Crescent', 'Half Moon', 'Gibbous', 'Full Moon', 'Gibbous', 'Half Moon', 'Crescent'];

  SA.campToday = () => SA.state.camp && SA.state.camp.last === SA.dayKey();

  class CampScene {
    constructor() {
      this.t = 0;
      this.fx = new SA.Particles();
      this.stars = new SA.Starfield(140, 909);
      const rnd = SA.seeded(41);
      this.grass = [];
      for (let i = 0; i < 60; i++) this.grass.push({ x: rnd(), y: rnd(), h: 6 + rnd() * 10 });
    }

    layout() {
      const W = SA.W, H = SA.H, top = Math.max(H * 0.12, SA.ui.toyTop() + 8);
      this.ground = H * 0.72;
      // On phones Cosmo stands a little higher, clear of his speech bubble along the bottom.
      this.cosmo = { x: W * 0.3, y: H * (H < 720 ? 0.6 : 0.7), s: H < 720 ? 1.15 : 1.35 };
      this.badges = [0, 1, 2].map(i => ({ x: W * 0.5 + (i - 1) * Math.min(150, W * 0.13), y: top + 34 }));
      // Sky watch: the telescope view and three Moon shapes to choose from, below the station badges.
      const below = top + 34 + 62;
      const sr = Math.min(H * 0.17, W * 0.13), or = Math.min(H * 0.1, W * 0.06);
      this.scope = { x: W * 0.28, y: Math.max(H * 0.47, below + 34 + sr), r: sr };
      this.opts = [0, 1, 2].map(i => ({ x: W * (0.56 + i * 0.15), y: Math.max(H * 0.47, below + 46 + or), r: or }));
      this.goBtn = { x: W * 0.7, y: H * 0.55, w: 270, h: 64 };
    }
    resize() { this.layout(); }

    enter() {
      SA.ui.setScene('toy');
      SA.audio.music('camp');
      $('btnToyBack').textContent = '🗺️ Map';
      $('toyPick').innerHTML = '';
      this.layout();
      this.fx.list.length = 0;
      const day = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
      this.move = MOVES[day % MOVES.length];
      this.station = 0;
      this.reps = 0;
      this.repT = 0;
      this.found = -1;
      this.wrong = [];
      this.moon = SA.moonTonight();
      this.phase = 'intro';
      this.done = [false, false, false];
      this.updateInfo();
      const st = SA.state, again = SA.campToday();
      const lines = !st.camp.seen ? [
        'Welcome to COSMO\'S SPACE CAMP! 🏕️ Real astronauts train every day, and today, so will you!',
        'There are three stations: a workout 💪, brain training 🧠 and sky watch 🔭. It only takes a few minutes!',
        'Every day you come to camp, you earn a camp day. Collect camp days to win camp patches! 🎖️',
      ] : again ? ['Back for more training? 🏕️ Let\'s practise! (You already earned today\'s camp day.)']
        : ['Good to see you at Space Camp, astronaut! 🏕️ Ready for today\'s training?'];
      SA.ui.say(lines).then(() => {
        if (SA.scene !== this) return;
        st.camp.seen = true;
        SA.save();
        this.startWorkout();
      });
    }
    exit() { SA.ui.hideTalk(); SA.voice.stop(); }
    back() { SA.go(SA.map, {}); }

    updateInfo() {
      SA.ui.setInfo('🏕️ Space Camp · day ' + Math.max(1, SA.state.camp.days + (SA.campToday() ? 0 : 1)));
    }

    // ---------- Station 1: workout ----------
    startWorkout() {
      this.station = 0;
      this.phase = 'workout';
      this.reps = 0;
      SA.audio.play('whoosh');
      SA.ui.hint(this.move.say, 0);
    }
    rep() {
      if (this.phase !== 'workout' || this.repT > 0.35) return;
      this.reps++;
      this.repT = 1;
      SA.audio.play(this.move.id === 'float' ? 'bubble' : 'jump');
      const c = this.cosmo;
      this.fx.spawn('sparkle', c.x, c.y - 90 * c.s, SA.calm() ? 5 : 10, { color: '#ffe066' });
      this.fx.text(c.x + 70, c.y - 120 * c.s, String(this.reps), '#ffe066');
      SA.voice.say(COUNT[this.reps - 1]);
      if (this.reps >= REPS) {
        this.phase = 'workoutDone';
        this.done[0] = true;
        setTimeout(() => {
          if (SA.scene !== this) return;
          SA.audio.play('cheer');
          SA.celebrate(60);
          SA.ui.say(['Great workout! 💪 ' + this.move.fact]).then(() => { if (SA.scene === this) this.startBrain(); });
        }, 700);
      }
    }

    // ---------- Station 2: brain training ----------
    startBrain() {
      this.station = 1;
      this.phase = 'brain';
      SA.audio.play('whoosh');
      // A question about a place the child has explored (Earth's, for a brand-new astronaut).
      const done = SA.allMissions().filter(id => SA.state.done[id] && SA.BODY[id].quiz);
      const id = SA.pick(done.length ? done : ['earth']);
      const pool = SA.BODY[id].quiz.concat(SA.state.expert && SA.state.expert[id] && SA.EXPERT && SA.EXPERT[id] ? SA.EXPERT[id].quiz : []);
      const q = SA.pick(pool);
      SA.ui.say(['Station 2: BRAIN TRAINING! 🧠 Astronauts have to remember lots of facts. Here\'s a question about ' + SA.BODY[id].name.replace(/^The /, 'the ') + '!']).then(() => {
        if (SA.scene !== this) return;
        return SA.ui.quiz([q], { kicker: '🏕️ Brain training', ok: 'Next station ▶' });
      }).then(() => {
        if (SA.scene !== this) return;
        this.done[1] = true;
        this.startSky();
      });
    }

    // ---------- Station 3: sky watch ----------
    startSky() {
      this.station = 2;
      this.phase = 'sky';
      this.found = -1;
      this.wrong = [];
      // Tonight's shape and two different ones, in a shuffled row.
      const i = this.moon.i, others = [0, 1, 2, 3, 4, 5, 6, 7].filter(k => {
        const d = Math.min((k - i + 8) % 8, (i - k + 8) % 8);
        return d >= 2 && MOON_NAMES[k] !== MOON_NAMES[i];
      });
      const a = SA.pick(others), b = SA.pick(others.filter(k => MOON_NAMES[k] !== MOON_NAMES[a]));
      this.choices = [i, a, b === undefined ? (i + 4) % 8 : b].sort(() => Math.random() - 0.5);
      SA.audio.play('whoosh');
      SA.ui.hint('Station 3: SKY WATCH! 🔭 This is what the real Moon looks like tonight. Which shape on the right matches it? Tap it!', 0);
    }
    pickMoon(k) {
      if (this.phase !== 'sky' || this.wrong.indexOf(k) >= 0) return;
      const o = this.opts[k], idx = this.choices[k];
      if (idx === this.moon.i) {
        this.found = k;
        this.phase = 'skyDone';
        this.done[2] = true;
        SA.audio.play('collect');
        this.fx.spawn('sparkle', o.x, o.y, 22, { color: '#fff3a0' });
        SA.ui.say(['That\'s it! 🌙 Tonight\'s Moon is a ' + this.moon.name + '. ' + this.moon.tip]).then(() => { if (SA.scene === this) this.finish(); });
      } else {
        this.wrong.push(k);
        SA.audio.play('boing');
        SA.ui.hint('Not that one! Look at the bright part of the Moon in my telescope. Is it thin, half, or round? 🔭', 0);
      }
    }

    // ---------- The end of camp ----------
    finish() {
      this.phase = 'end';
      const st = SA.state, today = SA.dayKey(), isNewDay = st.camp.last !== today;
      const before = st.camp.days;
      if (isNewDay) { st.camp.days++; st.camp.last = today; }
      const n = st.camp.days;
      const patch = isNewDay && [1, 3, 7].indexOf(n) >= 0;
      if (patch) st.baseNew = true;
      SA.save();
      this.updateInfo();
      SA.audio.play('tada');
      SA.celebrate(110);
      this.patchT = 0;
      const names = { 1: 'a Space Camp patch', 3: 'a Strong Astronaut patch', 7: 'a Camp Star medal' };
      SA.ui.banner('Camp complete!', isNewDay ? 'Camp day ' + n + ' 🏕️' : 'Extra practice 💪', 'gold').then(() => {
        if (SA.scene !== this) return;
        const lines = isNewDay ? ['Training complete, astronaut! 🎉 That\'s ' + (n === 1 ? 'your first camp day' : n + ' camp days') + '!'] : ['Great practice, astronaut! 💪 Come back tomorrow for a new move and a new camp day!'];
        if (patch) lines.push('You earned ' + names[n] + '! It\'s a sticker at my Space Base now! 🏠');
        else if (isNewDay && before < 7) {
          const next = [1, 3, 7].find(k => k > n);
          lines.push('Come back on another day for more camp! ' + (next - n) + ' more camp ' + (next - n === 1 ? 'day' : 'days') + ' until your next patch! 🎖️');
        }
        lines.push('Tonight, ask a grown-up to look for the Moon with you! 🌙');
        return SA.ui.say(lines);
      }).then(() => { if (SA.scene === this) SA.ui.hint('Tap "Again" to train some more, or 🗺️ Map to explore! 🚀', 6); });
    }

    // ---------- Input ----------
    onDown(x, y) {
      if (this.phase === 'workout') {
        // Tap anywhere (Cosmo is the big target) for a rep.
        this.rep();
        return;
      }
      if (this.phase === 'sky') {
        const k = this.opts.findIndex(o => Math.hypot(x - o.x, y - o.y) < o.r * 1.35);
        if (k >= 0) this.pickMoon(k);
        return;
      }
      if (this.phase === 'end' && !SA.ui.blocking()) {
        const b = this.goBtn;
        if (Math.abs(x - b.x) < b.w / 2 + 10 && Math.abs(y - b.y) < b.h / 2 + 10) {
          SA.audio.play('pop');
          SA.ui.hideTalk();
          this.done = [false, false, false];
          this.startWorkout();
        }
      }
    }

    // ---------- Update ----------
    update(dt) {
      this.t += dt;
      this.fx.update(dt);
      // Slow moves (Moon hops, space float) take longer to play out.
      const slow = this.move && (this.move.id === 'hop' || this.move.id === 'float');
      this.repT = Math.max(0, this.repT - dt * (slow ? 1.1 : 2));
      if (this.phase === 'end') this.patchT = Math.min(1, (this.patchT || 0) + dt * 1.5);
    }

    // ---------- Drawing ----------
    draw(ctx) {
      const W = SA.W, H = SA.H, t = this.t;
      // Dusk sky over a hill, with the first stars coming out.
      const sky = ctx.createLinearGradient(0, 0, 0, this.ground);
      sky.addColorStop(0, '#141a4a'); sky.addColorStop(0.7, '#3b3a8c'); sky.addColorStop(1, '#8a6fc4');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, this.ground + 2);
      this.stars.draw(ctx, t, 0);
      // Far hills and the camp field.
      ctx.fillStyle = '#2c3a78';
      ctx.beginPath(); ctx.moveTo(0, this.ground);
      for (let x = 0; x <= W + 20; x += 20) ctx.lineTo(x, this.ground - 34 - Math.sin(x * 0.005 + 2) * 30 - Math.sin(x * 0.013) * 10);
      ctx.lineTo(W, this.ground); ctx.closePath(); ctx.fill();
      const g = ctx.createLinearGradient(0, this.ground, 0, H);
      g.addColorStop(0, '#2f8a5a'); g.addColorStop(1, '#1d5a3c');
      ctx.fillStyle = g; ctx.fillRect(0, this.ground, W, H - this.ground);
      ctx.strokeStyle = 'rgba(120,220,150,0.5)'; ctx.lineWidth = 2;
      ctx.beginPath();
      for (const b of this.grass) { const gx = b.x * W, gy = this.ground + 8 + b.y * (H - this.ground - 12); ctx.moveTo(gx, gy); ctx.lineTo(gx + Math.sin(t + b.x * 9) * 2, gy - b.h); }
      ctx.stroke();
      this.drawCamp(ctx, t);
      this.drawBadges(ctx, t);
      if (this.phase === 'sky' || this.phase === 'skyDone') this.drawSky(ctx, t);
      else this.drawCosmo(ctx, t);
      if (this.phase === 'workout' || this.phase === 'workoutDone') this.drawReps(ctx, t);
      if (this.phase === 'end') this.drawEnd(ctx, t);
      this.fx.draw(ctx);
    }

    // A tent, a flag with Cosmo's star, and a little model rocket: Cosmo's camp.
    drawCamp(ctx, t) {
      const W = SA.W, gy = this.ground;
      const tx = W * 0.85;
      ctx.fillStyle = '#ff9f1c';
      ctx.beginPath(); ctx.moveTo(tx - 90, gy + 10); ctx.lineTo(tx, gy - 90); ctx.lineTo(tx + 90, gy + 10); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e0700f';
      ctx.beginPath(); ctx.moveTo(tx, gy - 90); ctx.lineTo(tx + 90, gy + 10); ctx.lineTo(tx + 30, gy + 10); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#5a2a0a';
      ctx.beginPath(); ctx.moveTo(tx - 22, gy + 10); ctx.lineTo(tx, gy - 40); ctx.lineTo(tx + 22, gy + 10); ctx.closePath(); ctx.fill();
      // Flag pole and a waving flag (packed away during sky watch, so the Moon shapes stand clear).
      const fx = W * 0.73;
      if (this.phase !== 'sky' && this.phase !== 'skyDone') {
        ctx.strokeStyle = '#c9d0e0'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(fx, gy + 8); ctx.lineTo(fx, gy - 160); ctx.stroke();
        ctx.fillStyle = '#5b3fc4';
        ctx.beginPath(); ctx.moveTo(fx, gy - 158);
        for (let k = 0; k <= 10; k++) ctx.lineTo(fx + k * 7, gy - 158 + Math.sin(t * 4 + k * 0.6) * 4);
        for (let k = 10; k >= 0; k--) ctx.lineTo(fx + k * 7, gy - 112 + Math.sin(t * 4 + k * 0.6) * 4);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffd84d'; SA.starPath(ctx, fx + 36, gy - 135 + Math.sin(t * 4 + 3) * 4, 13, 0.45, 5); ctx.fill();
      }
      // A little model rocket on its stand.
      const rx = W * 0.96;
      ctx.strokeStyle = '#9aa3bf'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(rx - 16, gy + 8); ctx.lineTo(rx, gy - 10); ctx.lineTo(rx + 16, gy + 8); ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.moveTo(rx - 9, gy - 8); ctx.lineTo(rx - 9, gy - 50); ctx.quadraticCurveTo(rx, gy - 72, rx + 9, gy - 50); ctx.lineTo(rx + 9, gy - 8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ff5d6c'; ctx.fillRect(rx - 9, gy - 26, 18, 5);
      // A cosy campfire glow (steady with Calm effects).
      const cx = W * 0.56, flick = SA.calm() ? 0.5 : 0.5 + 0.5 * Math.sin(t * 9) * Math.sin(t * 5.3);
      const glow = ctx.createRadialGradient(cx, gy + 4, 4, cx, gy + 4, 90);
      glow.addColorStop(0, 'rgba(255,170,60,' + (0.35 + flick * 0.15) + ')'); glow.addColorStop(1, 'rgba(255,170,60,0)');
      ctx.fillStyle = glow; SA.circle(ctx, cx, gy + 4, 90); ctx.fill();
      ctx.fillStyle = '#7a4a2a'; SA.rrect(ctx, cx - 26, gy + 2, 52, 9, 4); ctx.fill();
      ctx.fillStyle = '#ff8a1c';
      ctx.beginPath(); ctx.moveTo(cx - 16, gy + 4); ctx.quadraticCurveTo(cx - 10, gy - 22 - flick * 8, cx, gy - 34 - flick * 10); ctx.quadraticCurveTo(cx + 12, gy - 18, cx + 16, gy + 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffe066';
      ctx.beginPath(); ctx.moveTo(cx - 8, gy + 4); ctx.quadraticCurveTo(cx - 4, gy - 10, cx, gy - 16 - flick * 6); ctx.quadraticCurveTo(cx + 6, gy - 8, cx + 8, gy + 4); ctx.closePath(); ctx.fill();
    }

    // The three stations along the top: done ones get a tick, the current one glows.
    drawBadges(ctx, t) {
      const icons = ['💪', '🧠', '🔭'], names = ['Workout', 'Brain', 'Sky watch'];
      const b0 = this.badges[0], b2 = this.badges[2];
      ctx.fillStyle = 'rgba(10,12,40,0.45)';
      SA.rrect(ctx, b0.x - 60, b0.y - 32, b2.x - b0.x + 120, 82, 20); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(b0.x + 30, b0.y); ctx.lineTo(b2.x - 30, b2.y); ctx.stroke();
      this.badges.forEach((b, i) => {
        const on = this.station === i && this.phase !== 'end' && this.phase !== 'intro', done = this.done[i];
        if (on) { ctx.fillStyle = 'rgba(255,224,102,' + (0.25 + 0.15 * Math.sin(t * 4)) + ')'; SA.circle(ctx, b.x, b.y, 32); ctx.fill(); }
        ctx.fillStyle = done ? '#eaffef' : on ? '#fff8dc' : 'rgba(255,255,255,0.3)';
        SA.circle(ctx, b.x, b.y, 24); ctx.fill();
        ctx.strokeStyle = done ? '#3fbf5a' : on ? '#ffd84d' : 'rgba(255,255,255,0.5)'; ctx.lineWidth = 3; ctx.stroke();
        ctx.globalAlpha = done || on ? 1 : 0.55;
        SA.emoji(ctx, icons[i], b.x, b.y + 1, 26);
        ctx.globalAlpha = 1;
        SA.label(ctx, names[i], b.x, b.y + 36, 14, done ? '#bfffd0' : '#fff', { weight: 800 });
        if (done) { ctx.fillStyle = '#3fbf5a'; SA.circle(ctx, b.x + 18, b.y - 18, 9); ctx.fill(); SA.label(ctx, '✓', b.x + 18, b.y - 18, 12, '#fff', { stroke: false }); }
      });
    }

    // Cosmo doing today's move (one rep plays each time the child taps).
    drawCosmo(ctx, t) {
      const c = this.cosmo, k = this.repT, u = 1 - k, id = this.move ? this.move.id : 'jump';
      const arc = Math.sin(u * Math.PI) * (k > 0 ? 1 : 0);
      let dy = 0, sx = 1, sy = 1, rot = 0;
      if (id === 'jump') { dy = -arc * 70; sx = 1 + arc * 0.12; }
      else if (id === 'squat') {
        // Crouch down low (the first 40%), then blast up.
        const crouch = k > 0 ? (u < 0.4 ? u / 0.4 : Math.max(0, 1 - (u - 0.4) / 0.15)) : 0;
        sy = 1 - 0.24 * crouch; sx = 1 + 0.12 * crouch;
        dy = k > 0 && u > 0.4 ? -Math.sin(((u - 0.4) / 0.6) * Math.PI) * 60 : 0;
      }
      else if (id === 'hop') { dy = -arc * 110; rot = Math.sin(u * TAU) * 0.08 * (k > 0 ? 1 : 0); }
      else if (id === 'reach') { sy = 1 + arc * 0.18; sx = 1 - arc * 0.08; dy = -arc * 12; }
      else { dy = -arc * 30 + Math.sin(t * 1.5) * 6; rot = Math.sin(u * TAU) * 0.25 * (k > 0 ? 1 : 0) + Math.sin(t * 1.2) * 0.05; }
      // Shadow on the grass.
      ctx.fillStyle = 'rgba(10,30,20,' + (0.35 - Math.min(0.2, -dy / 500)) + ')';
      SA.ellipse(ctx, c.x, c.y + 4, 46 * c.s * (1 + dy / 400), 10 * c.s); ctx.fill();
      ctx.save();
      ctx.translate(c.x, c.y + dy);
      ctx.rotate(rot);
      ctx.scale(sx, sy);
      SA.drawCosmo(ctx, 0, 0, c.s, { t, mood: k > 0 || this.phase === 'workoutDone' ? 'joy' : null, wave: this.phase === 'intro' || this.phase === 'end', talk: SA.voice.speaking });
      ctx.restore();
      if (this.phase === 'workout' && this.reps === 0) {
        const hop = Math.abs(Math.sin(t * 3)) * 10;
        SA.emoji(ctx, '👆', c.x + 70 * c.s, c.y - 40 * c.s + hop, 44);
      }
    }

    // Five rep stars beside Cosmo.
    drawReps(ctx, t) {
      const W = SA.W, y = SA.H * 0.42, x0 = W * 0.45, gap = Math.min(64, W * 0.05);
      // Today's move, above its five rep stars.
      if (this.move) {
        const pw = SA.pill(ctx, this.move.name, x0 + gap * 2 + 18, y - 52, 22, { color: '#fff', edge: '#ffd84d' });
        SA.emoji(ctx, this.move.icon, x0 + gap * 2 + 18 - pw / 2 - 20, y - 52, 26);
      }
      for (let i = 0; i < REPS; i++) {
        const x = x0 + i * gap, on = i < this.reps;
        const pop = on && i === this.reps - 1 ? 1 + Math.sin(this.repT * Math.PI) * 0.4 : 1;
        ctx.fillStyle = on ? '#ffe066' : 'rgba(255,255,255,0.2)';
        ctx.strokeStyle = on ? '#a35a00' : 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2;
        SA.starPath(ctx, x, y, 22 * pop, 0.45, 5); ctx.fill(); ctx.stroke();
        SA.label(ctx, String(i + 1), x, y + 36, 16, on ? '#ffe066' : 'rgba(255,255,255,0.6)', { weight: 800 });
      }
    }

    // Sky watch: Cosmo's telescope view of tonight's Moon, and three shapes to match.
    drawSky(ctx, t) {
      const s = this.scope;
      // The telescope view: a dark round window.
      ctx.fillStyle = '#9aa3bf'; SA.rrect(ctx, s.x - s.r * 0.12, s.y + s.r * 0.9, s.r * 0.24, s.r * 0.7, 6); ctx.fill();
      ctx.strokeStyle = '#6b7189'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(s.x - s.r * 0.6, this.ground + 10); ctx.lineTo(s.x, s.y + s.r * 1.5); ctx.lineTo(s.x + s.r * 0.6, this.ground + 10); ctx.stroke();
      ctx.fillStyle = '#05081f'; SA.circle(ctx, s.x, s.y, s.r); ctx.fill();
      ctx.save(); SA.circle(ctx, s.x, s.y, s.r); ctx.clip();
      const rnd = SA.seeded(12);
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 30; i++) { ctx.globalAlpha = 0.3 + 0.5 * Math.abs(Math.sin(t * (0.5 + rnd()) + i)); SA.circle(ctx, s.x + (rnd() - 0.5) * s.r * 2, s.y + (rnd() - 0.5) * s.r * 2, 1 + rnd()); ctx.fill(); }
      ctx.globalAlpha = 1;
      SA.drawMoonTonight(ctx, s.x, s.y, s.r * 0.62, this.moon);
      ctx.restore();
      ctx.strokeStyle = '#3b3f58'; ctx.lineWidth = 10; SA.circle(ctx, s.x, s.y, s.r); ctx.stroke();
      ctx.strokeStyle = '#c9d0e0'; ctx.lineWidth = 3; SA.circle(ctx, s.x, s.y, s.r - 7); ctx.stroke();
      SA.label(ctx, '🔭 Tonight\'s Moon', s.x, s.y - s.r - 22, 22, '#fff');
      // Cosmo peeks in from beside the telescope.
      SA.drawCosmo(ctx, s.x - s.r - 40, this.ground + 10, 0.8, { t, mood: this.phase === 'skyDone' ? 'joy' : null });
      // The three shapes to pick from.
      SA.label(ctx, 'Which one matches?', this.opts[1].x, this.opts[1].y - this.opts[1].r - 34, 22, '#ffe066');
      this.opts.forEach((o, k) => {
        const idx = this.choices[k], bad = this.wrong.indexOf(k) >= 0, good = this.found === k;
        const hint = SA.easy() && this.wrong.length && idx === this.moon.i && this.phase === 'sky';
        ctx.globalAlpha = bad ? 0.35 : 1;
        ctx.fillStyle = good ? 'rgba(126,224,138,0.35)' : 'rgba(10,12,40,0.55)';
        SA.circle(ctx, o.x, o.y, o.r * 1.3); ctx.fill();
        if (good || hint) { ctx.strokeStyle = good ? '#7ee08a' : 'rgba(255,224,102,' + (0.5 + 0.5 * Math.sin(t * 6)) + ')'; ctx.lineWidth = 5; ctx.stroke(); }
        const bob = this.phase === 'sky' && !bad ? Math.sin(t * 2.5 + k) * 3 : 0;
        SA.drawMoonTonight(ctx, o.x, o.y + bob, o.r, { p: idx / 8 });
        ctx.globalAlpha = 1;
        if (good || this.phase === 'skyDone') SA.label(ctx, MOON_NAMES[idx], o.x, o.y + o.r * 1.3 + 20, 17, good ? '#bfffd0' : '#e6e0ff');
      });
    }

    // The camp patch and the "Again" button.
    drawEnd(ctx, t) {
      const W = SA.W, H = SA.H, k = SA.easeBack(this.patchT || 0);
      const px = W * 0.7, py = H * 0.32, r = Math.min(H * 0.12, 90) * k;
      if (r > 1) {
        ctx.save(); ctx.translate(px, py); ctx.rotate(Math.sin(t * 1.5) * 0.06);
        ctx.fillStyle = '#e0a800'; SA.circle(ctx, 0, 4, r); ctx.fill();
        const pg = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r);
        pg.addColorStop(0, '#3b4fc4'); pg.addColorStop(1, '#1d2370');
        ctx.fillStyle = pg; SA.circle(ctx, 0, 0, r); ctx.fill();
        ctx.strokeStyle = '#ffd84d'; ctx.lineWidth = 6; ctx.setLineDash([6, 5]); SA.circle(ctx, 0, 0, r * 0.86); ctx.stroke(); ctx.setLineDash([]);
        SA.emoji(ctx, '🏕️', 0, -r * 0.18, r * 0.6);
        SA.label(ctx, 'SPACE CAMP', 0, r * 0.38, r * 0.17, '#ffd84d', { stroke: false });
        SA.label(ctx, 'Day ' + Math.max(1, SA.state.camp.days), 0, r * 0.6, r * 0.15, '#fff', { stroke: false });
        ctx.restore();
      }
      const b = this.goBtn, pulse = 1 + Math.sin(t * 4) * 0.04;
      ctx.save(); ctx.translate(b.x, H * 0.62); ctx.scale(pulse, pulse);
      ctx.fillStyle = '#e0a800'; SA.rrect(ctx, -b.w / 2, -b.h / 2 + 5, b.w, b.h, b.h / 2); ctx.fill();
      ctx.fillStyle = '#ffd84d'; SA.rrect(ctx, -b.w / 2, -b.h / 2, b.w, b.h, b.h / 2); ctx.fill();
      SA.label(ctx, '🔁 Again', 0, 1, 26, '#3a2400', { stroke: false });
      ctx.restore();
      b.y = H * 0.62;
    }
  }

  SA.CampScene = CampScene;
})(window.SA);
