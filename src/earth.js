// Earth mission: "Day & Night Spinner". Earth is seen from above the North Pole with the Sun on
// the left. The child drags to spin Earth until each friend is on the day or night side.
(function (SA) {
  const TAU = Math.PI * 2;
  const ZONE = 0.85;      // how close (radians) a friend must be to the middle of the day or night side
  const HOLD = 0.45;      // seconds a friend must stay in its zone

  const ROUNDS = [
    { emoji: '🐓', want: 'day', sfx: 'crow',
      ask: 'The rooster wants to wake everyone up. Spin Earth to make it DAY for the rooster! ☀️',
      done: 'Cock-a-doodle-doo! The rooster\'s side of Earth now faces the Sun.' },
    { emoji: '🦉', want: 'night', sfx: 'hoot',
      ask: 'The owl hunts in the dark. Spin Earth to make it NIGHT for the owl! 🌙',
      done: 'Hoot hoot! It\'s night when your side of Earth faces away from the Sun.' },
    { emoji: '🎒', want: 'day', sfx: 'ding',
      ask: 'Time for school! Make it DAY for the student. ☀️',
      done: 'Good morning! The Sun rises as Earth turns toward it.' },
    { emoji: '😴', want: 'night', sfx: 'lullaby',
      ask: 'This kid is sleepy. Make it NIGHT so they can go to bed. 🌙',
      done: 'Sweet dreams! While they sleep, it is daytime on the other side of Earth.' },
    { emoji: '🌻', want: 'day', sfx: 'ding',
      ask: 'Sunflowers love sunshine. Make it DAY for the sunflower! ☀️',
      done: 'Lovely! Plants need sunlight to grow.' },
  ];

  // Expert mission "Time Keeper": friends want an exact time of day. Earth spins counter-clockwise
  // (seen from above the North Pole), so the top edge is turning into the sunlight (sunrise) and
  // the bottom edge is turning away from it (sunset). Centre angles, with the Sun on the left.
  const TIMES = { sunrise: -Math.PI / 2, noon: Math.PI, sunset: Math.PI / 2, midnight: 0 };
  const TIME_LABEL = { sunrise: 'SUNRISE', noon: 'NOON', sunset: 'SUNSET', midnight: 'MIDNIGHT' };
  const EXPERT_ROUNDS = [
    { emoji: '🐓', want: 'sunrise', sfx: 'crow',
      ask: 'The rooster crows at SUNRISE! 🌅 Spin Earth so the rooster is just coming out of the night, into the light.',
      done: 'Cock-a-doodle-doo! At sunrise, your side of Earth is just turning to face the Sun.' },
    { emoji: '🎒', want: 'noon', sfx: 'ding',
      ask: 'Lunchtime! At NOON the Sun is highest in the sky. Spin the student to the very middle of the day side! 🥪',
      done: 'Noon! The student\'s side faces the Sun straight on, so the Sun is high in the sky.' },
    { emoji: '🦇', want: 'sunset', sfx: 'hoot',
      ask: 'Bats wake up at SUNSET! 🌇 Spin Earth so the bat is just leaving the light, going into the night.',
      done: 'Flap flap! At sunset, your side of Earth is turning away from the Sun.' },
    { emoji: '🦉', want: 'midnight', sfx: 'lullaby',
      ask: 'MIDNIGHT! Spin the owl to the very middle of the night side, as far from the Sun as it can be! 🌙',
      done: 'Midnight! And right now it is noon on the opposite side of Earth.' },
  ];

  class EarthScene {
    constructor() {
      this.stars = new SA.Starfield(200, 21);
      this.fx = new SA.Particles();
      this.t = 0;
      // Continents and city lights in Earth's own (rotating) frame, as polar coordinates.
      const rnd = SA.seeded(4);
      this.land = [];
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * TAU + rnd() * 0.4, d = 0.42 + rnd() * 0.38;
        const pts = [];
        for (let k = 0; k < 9; k++) pts.push(0.09 + rnd() * 0.09);
        this.land.push({ a, d, pts, rot: rnd() * TAU, big: 0.9 + rnd() * 0.7 });
      }
      this.cities = [];
      for (const l of this.land) for (let k = 0; k < 5; k++) this.cities.push({ a: l.a + (rnd() - 0.5) * 0.35, d: l.d + (rnd() - 0.5) * 0.12 });
      this.clouds = [];
      for (let i = 0; i < 9; i++) this.clouds.push({ a: rnd() * TAU, d: 0.3 + rnd() * 0.6, w: 0.07 + rnd() * 0.08, h: 0.03 + rnd() * 0.03 });
    }

    resize() {
      this.cx = SA.W * 0.6;
      this.cy = SA.H * 0.46;
      this.R = SA.H * 0.285;
    }

    enter(opts) {
      this.expert = !!(opts && opts.expert);
      this.resize();
      SA.ui.setScene('game');
      SA.audio.music('earth');
      this.rot = 0;
      this.omega = -0.35;          // gentle real-direction spin (counter-clockwise from above)
      this.dragging = false;
      this.dragAccum = 0;
      this.round = -1;
      this.phase = 'intro';
      this.zoneT = 0;
      this.spinAnim = null;
      this.cheer = 0;
      const rounds = this.expert ? EXPERT_ROUNDS : ROUNDS;
      this.markers = rounds.map((r, i) => Object.assign({ base: (i / rounds.length) * TAU + 0.3, happy: 0 }, r));
      SA.ui.setInfo(this.expert ? '🌍 Earth: Time Keeper' : '🌍 Earth: Day & Night');
      if (this.expert) {
        SA.ui.banner('Earth', '🎓 Expert: ' + SA.EXPERT.earth.name).then(() => SA.scene !== this ? new Promise(() => {}) : SA.ui.say(SA.EXPERT.earth.intro))
          .then(() => { if (SA.scene === this) this.nextRound(); });
        return;
      }
      SA.ui.banner('Earth', SA.NICKNAMES.earth).then(() => SA.scene !== this ? new Promise(() => {}) : SA.ui.say(SA.introLines('earth', [
        'Welcome home! This is planet Earth. 🌍 We are looking down on it from above the North Pole.',
        'The Sun shines on one side of Earth. That side has DAY. ☀️ The other side is dark. It has NIGHT. 🌙',
        'Earth spins around and around. Drag your finger in a circle to spin it!',
      ]))).then(() => { if (SA.scene === this) this.nextRound(); });
    }

    exit() { SA.ui.hideTalk(); }

    angleOf(m) { return SA.wrapAngle(m.base + this.rot); }
    // Where a friend wants to be: the middle of the day side (noon), of the night side (midnight),
    // or, in the Expert mission, the sunrise or sunset edge.
    center(m) { return TIMES[m.want] != null ? TIMES[m.want] : m.want === 'day' ? Math.PI : 0; }
    // Sun is to the left (angle PI). Positive = how deep into the day side.
    isDay(a) { return Math.cos(a - Math.PI) > 0; }

    nextRound() {
      this.round++;
      if (this.round >= this.markers.length) { this.finish(); return; }
      const m = this.markers[this.round];
      SA.ui.setInfo('🌍 Friend ' + (this.round + 1) + ' of ' + this.markers.length);
      // Spin (counter-clockwise, like the real Earth) so the friend starts on the wrong side.
      const startAngle = this.center(m) + Math.PI + SA.rand(-0.5, 0.5);
      let delta = SA.wrapAngle(startAngle - this.angleOf(m));
      if (delta > 0) delta -= TAU;
      this.spinAnim = { from: this.rot, to: this.rot + delta, t: 0, dur: 0.6 + Math.abs(delta) * 0.25 };
      this.omega = 0;
      this.zoneT = 0;
      this.phase = 'spinning';
      SA.audio.play('whoosh');
    }

    startPlay() {
      this.phase = 'play';
      SA.ui.hint(this.markers[this.round].ask, 0);
    }

    success() {
      const m = this.markers[this.round];
      this.phase = 'cheer';
      this.omega = 0;
      this.dragging = false;
      m.happy = 1;
      const p = this.markerPos(m);
      this.fx.spawn('sparkle', p.x, p.y, 22);
      const pop = { day: 'Day! ☀️', night: 'Night! 🌙', sunrise: 'Sunrise! 🌅', noon: 'Noon! ☀️', sunset: 'Sunset! 🌇', midnight: 'Midnight! 🌙' };
      this.fx.text(p.x, p.y - 50, pop[m.want], '#ffe066');
      SA.audio.play('collect');
      setTimeout(() => SA.audio.play(m.sfx), 250);
      SA.ui.hint(m.done, 0);
      this.cheer = 3.2;
    }

    async finish() {
      this.phase = 'done';
      SA.ui.setInfo('🌍 All friends are happy!');
      SA.celebrate(120);
      SA.audio.play('cheer');
      await SA.ui.banner('Mission Complete!', 'All ' + this.markers.length + ' friends are happy 🎉', 'gold', 3);
      if (SA.scene !== this) return;
      if (this.expert) {
        await SA.ui.say(SA.EXPERT.earth.outro);
        SA.finishExpert('earth', 3);
        return;
      }
      await SA.ui.say([
        'Amazing! You helped every friend! 🎉',
        'Earth spins all the way around once every 24 hours. That makes one day and one night.',
        'The Sun doesn\'t really move across the sky. It only looks that way because Earth is spinning!',
      ]);
      SA.finishPlanet('earth', 3);
    }

    markerPos(m) {
      const a = this.angleOf(m);
      return { x: this.cx + Math.cos(a) * this.R * 0.72, y: this.cy + Math.sin(a) * this.R * 0.72 };
    }

    onDown(x, y) {
      if (this.phase !== 'play') return;
      if (Math.hypot(x - this.cx, y - this.cy) > this.R * 1.35) return;
      this.dragging = true;
      this.prevA = Math.atan2(y - this.cy, x - this.cx);
      SA.ui.hideTalk();
    }
    onMove(x, y) {
      if (!this.dragging) return;
      const a = Math.atan2(y - this.cy, x - this.cx);
      const d = SA.wrapAngle(a - this.prevA);
      this.prevA = a;
      this.rot += d;
      this.dragAccum += d;
    }
    onUp() {
      if (!this.dragging) return;
      this.dragging = false;
      if (this.phase === 'play' && this.zoneT <= 0) SA.ui.hint(this.markers[this.round].ask, 0);
    }

    update(dt) {
      this.t += dt;
      this.fx.update(dt);
      for (const m of this.markers) m.happy = Math.max(0, m.happy - dt * 0.8);

      if (this.spinAnim) {
        const s = this.spinAnim;
        s.t += dt;
        this.rot = SA.lerp(s.from, s.to, SA.easeInOut(s.t / s.dur));
        if (s.t >= s.dur) { this.spinAnim = null; this.startPlay(); }
        return;
      }

      if (this.dragging) {
        const w = this.dragAccum / Math.max(dt, 0.001);
        this.omega = SA.clamp(SA.lerp(this.omega, w, 0.5), -7, 7);
        this.dragAccum = 0;
      } else {
        this.rot += this.omega * dt;
        const drag = this.phase === 'intro' ? 0 : 2.4;
        this.omega *= Math.exp(-drag * dt);
      }
      this.spinSound = (this.spinSound || 0) + Math.abs(this.omega) * dt;
      if (this.spinSound > 0.6) { this.spinSound = 0; SA.audio.play('spin'); }

      if (this.phase === 'play') {
        const m = this.markers[this.round];
        const a = this.angleOf(m);
        const center = this.center(m);
        const zone = this.expert ? 0.5 : ZONE;   // Expert: about 29 degrees either side, not 49
        const inZone = Math.abs(SA.wrapAngle(a - center)) < (SA.easy() ? zone * 1.45 : zone);
        if (inZone && Math.abs(this.omega) < 3) this.zoneT += dt;
        else this.zoneT = Math.max(0, this.zoneT - dt * 2);
        if (this.zoneT >= HOLD) this.success();
      } else if (this.phase === 'cheer') {
        this.cheer -= dt;
        if (this.cheer <= 0) this.nextRound();
      }
    }

    draw(ctx) {
      const t = this.t, cx = this.cx, cy = this.cy, R = this.R;
      SA.spaceBg(ctx, '#070a24', '#141039');
      this.stars.draw(ctx, t, 0);

      // Sunlight streaming in from the left.
      const beam = ctx.createRadialGradient(0, cy, R * 0.5, 0, cy, cx + R * 0.2);
      beam.addColorStop(0, 'rgba(255,220,120,0.3)');
      beam.addColorStop(1, 'rgba(255,220,120,0)');
      ctx.fillStyle = beam;
      ctx.fillRect(0, 0, cx + R, SA.H);
      SA.drawBody(ctx, 'sun', -40, cy, SA.H * 0.26, { t });
      SA.label(ctx, 'Sun', 60, cy + SA.H * 0.32, 26, '#fff4c2');

      // Earth's moon drifting on its orbit.
      const ma = t * 0.12;
      ctx.strokeStyle = 'rgba(180,190,255,0.15)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 9]);
      SA.circle(ctx, cx, cy, R * 1.55); ctx.stroke();
      ctx.setLineDash([]);
      const mx = cx + Math.cos(ma) * R * 1.55, my = cy + Math.sin(ma) * R * 1.55;
      SA.drawBody(ctx, 'moon', mx, my, 18, { t, lx: -1, ly: 0 });
      SA.label(ctx, 'Moon', mx, my + 32, 15, '#d8dcf5');

      this.drawEarth(ctx, t, cx, cy, R);

      // Day and night labels (the Expert mission also marks the sunrise and sunset edges).
      if (this.expert) {
        SA.label(ctx, '☀️ DAY', cx - R - 62, cy - R * 0.62, 24, '#ffe58a');
        SA.label(ctx, 'NIGHT 🌙', cx + R + 66, cy - R * 0.62, 24, '#b9c6ff');
        // The edge marks sit on the planet's rim. The sunset label goes up beside Earth's lower
        // right, with a dotted pointer, so Cosmo's speech bubble along the bottom never hides it.
        ctx.fillStyle = '#ffc48a';
        for (const sy of [-1, 1]) { SA.circle(ctx, cx, cy + sy * (R + 6), 6); ctx.fill(); }
        SA.label(ctx, '🌅 sunrise edge', cx, cy - R - 26, 20, '#ffc48a');
        const lx = cx + R * 0.8 + 70, ly = cy + R * 0.78;
        ctx.strokeStyle = 'rgba(255,196,138,0.8)'; ctx.lineWidth = 2.5; ctx.setLineDash([4, 6]);
        ctx.beginPath(); ctx.moveTo(lx - 60, ly + 12); ctx.quadraticCurveTo(cx + R * 0.35, cy + R + 14, cx + 10, cy + R + 8); ctx.stroke();
        ctx.setLineDash([]);
        SA.label(ctx, '🌇 sunset edge', lx, ly, 20, '#ffc48a');
      } else {
        SA.label(ctx, '☀️ DAY side', cx - R * 0.55, cy - R - 32, 26, '#ffe58a');
        SA.label(ctx, 'NIGHT side 🌙', cx + R * 0.55, cy - R - 32, 26, '#b9c6ff');
      }

      // Spin hint arrow while waiting for the first drag of a round.
      if (this.phase === 'play' && !this.dragging && this.zoneT <= 0) this.drawSpinHint(ctx, t, cx, cy, R);

      for (const m of this.markers) this.drawMarker(ctx, m, t);
      this.fx.draw(ctx);
    }

    drawEarth(ctx, t, cx, cy, R) {
      const glow = ctx.createRadialGradient(cx, cy, R * 0.95, cx, cy, R * 1.12);
      glow.addColorStop(0, 'rgba(120,190,255,0.5)');
      glow.addColorStop(1, 'rgba(120,190,255,0)');
      ctx.fillStyle = glow;
      SA.circle(ctx, cx, cy, R * 1.12); ctx.fill();

      ctx.save();
      SA.circle(ctx, cx, cy, R);
      ctx.clip();
      const sea = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R);
      sea.addColorStop(0, '#4aa3f0');
      sea.addColorStop(1, '#1f5fb8');
      ctx.fillStyle = sea;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

      // Rotating land.
      for (const l of this.land) {
        const a = l.a + this.rot;
        const lx = cx + Math.cos(a) * R * l.d, ly = cy + Math.sin(a) * R * l.d;
        const shape = sc => l.pts.map((p, k) => {
          const pa = (k / l.pts.length) * TAU + l.rot + this.rot;
          return [lx + Math.cos(pa) * R * p * l.big * sc, ly + Math.sin(pa) * R * p * l.big * sc];
        });
        ctx.fillStyle = '#5cbf5a';
        SA.blobPath(ctx, shape(1));
        ctx.fill();
        ctx.fillStyle = '#4aa94c';
        SA.blobPath(ctx, shape(0.5));
        ctx.fill();
      }
      // North Pole ice cap.
      ctx.fillStyle = '#f4fbff';
      const cap = [];
      for (let k = 0; k < 10; k++) {
        const pa = (k / 10) * TAU + this.rot;
        const pr = R * (0.19 + 0.04 * Math.sin(k * 2.7));
        cap.push([cx + Math.cos(pa) * pr, cy + Math.sin(pa) * pr]);
      }
      SA.blobPath(ctx, cap);
      ctx.fill();

      // Clouds drift a little faster than the ground.
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      for (const c of this.clouds) {
        const a = c.a + this.rot + t * 0.04;
        const x = cx + Math.cos(a) * R * c.d, y = cy + Math.sin(a) * R * c.d;
        SA.ellipse(ctx, x, y, R * c.w, R * c.h, a + Math.PI / 2);
        ctx.fill();
        SA.ellipse(ctx, x + Math.cos(a + 1.6) * R * c.w * 0.6, y + Math.sin(a + 1.6) * R * c.w * 0.6, R * c.w * 0.6, R * c.h * 0.9, a + Math.PI / 2);
        ctx.fill();
      }

      // Sunny shine on the day side.
      const shine = ctx.createRadialGradient(cx - R * 0.55, cy - R * 0.2, 0, cx - R * 0.55, cy - R * 0.2, R * 0.9);
      shine.addColorStop(0, 'rgba(255,250,210,0.28)');
      shine.addColorStop(1, 'rgba(255,250,210,0)');
      ctx.fillStyle = shine;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

      // Night side shadow (stays still: it is where sunlight can't reach).
      const night = ctx.createLinearGradient(cx - 28, 0, cx + 28, 0);
      night.addColorStop(0, 'rgba(6,10,40,0)');
      night.addColorStop(1, 'rgba(6,10,40,0.68)');
      ctx.fillStyle = night;
      ctx.fillRect(cx - 28, cy - R, R + 28, R * 2);
      // Sunrise / sunset glow along the line between day and night.
      const dusk = ctx.createLinearGradient(cx - 34, 0, cx + 34, 0);
      dusk.addColorStop(0, 'rgba(255,150,70,0)');
      dusk.addColorStop(0.5, 'rgba(255,150,70,0.32)');
      dusk.addColorStop(1, 'rgba(255,150,70,0)');
      ctx.fillStyle = dusk;
      ctx.fillRect(cx - 34, cy - R, 68, R * 2);
      // City lights glow only at night.
      ctx.fillStyle = '#ffd86b';
      for (const c of this.cities) {
        const a = c.a + this.rot;
        const x = cx + Math.cos(a) * R * c.d, y = cy + Math.sin(a) * R * c.d;
        const dark = SA.clamp((x - cx) / 40, 0, 1);
        if (dark <= 0) continue;
        ctx.globalAlpha = dark * (0.7 + 0.3 * Math.sin(t * 3 + c.a * 9));
        SA.circle(ctx, x, y, 2.6); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      ctx.strokeStyle = 'rgba(200,230,255,0.6)';
      ctx.lineWidth = 3;
      SA.circle(ctx, cx, cy, R); ctx.stroke();
      SA.emoji(ctx, '📍', cx, cy - 6, 20);
    }

    drawSpinHint(ctx, t, cx, cy, R) {
      const a0 = 1.5 - (t % 1.6) * 0.15;
      ctx.save();
      ctx.globalAlpha = 0.55 + 0.35 * Math.sin(t * 4);
      ctx.strokeStyle = '#ffe066';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, cy, R + 34, a0, a0 - 1.1, true);
      ctx.stroke();
      const ea = a0 - 1.1, ex = cx + Math.cos(ea) * (R + 34), ey = cy + Math.sin(ea) * (R + 34);
      // Arrowhead pointing along the counter-clockwise direction of travel.
      ctx.translate(ex, ey);
      ctx.rotate(Math.atan2(-Math.cos(ea), Math.sin(ea)));
      ctx.fillStyle = '#ffe066';
      ctx.beginPath();
      ctx.moveTo(16, 0); ctx.lineTo(-8, -14); ctx.lineTo(-8, 14); ctx.closePath();
      ctx.fill();
      ctx.restore();
      SA.emoji(ctx, '👆', cx + Math.cos(a0 - 0.55) * (R + 70), cy + Math.sin(a0 - 0.55) * (R + 70), 34);
    }

    drawMarker(ctx, m, t) {
      const p = this.markerPos(m);
      const isTarget = this.phase !== 'done' && this.markers[this.round] === m && this.phase !== 'spinning';
      const day = this.isDay(this.angleOf(m));
      const bounce = m.happy > 0 ? Math.abs(Math.sin(m.happy * 12)) * 14 * m.happy : 0;
      const r = isTarget ? 31 : 25;

      if (isTarget) {
        ctx.strokeStyle = 'rgba(255,224,102,' + (0.6 + 0.4 * Math.sin(t * 6)) + ')';
        ctx.lineWidth = 5;
        SA.circle(ctx, p.x, p.y - bounce, r + 8);
        ctx.stroke();
        if (this.zoneT > 0) {
          ctx.strokeStyle = '#7ee08a';
          ctx.lineWidth = 7;
          ctx.beginPath();
          ctx.arc(p.x, p.y - bounce, r + 8, -Math.PI / 2, -Math.PI / 2 + TAU * (this.zoneT / HOLD));
          ctx.stroke();
        }
      }
      ctx.fillStyle = day ? '#fff8de' : '#2c356b';
      ctx.strokeStyle = day ? '#f5b83d' : '#8fa0ff';
      ctx.lineWidth = 3;
      SA.circle(ctx, p.x, p.y - bounce, r);
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha = isTarget || m.happy > 0 ? 1 : 0.85;
      SA.emoji(ctx, m.emoji, p.x, p.y - bounce + 1, isTarget ? 36 : 28);
      ctx.globalAlpha = 1;
      SA.emoji(ctx, day ? '☀️' : '🌙', p.x + r * 0.8, p.y - bounce - r * 0.8, 16);
      if (isTarget) {
        const hop = Math.abs(Math.sin(t * 4)) * 8;
        const word = TIME_LABEL[m.want] || (m.want === 'day' ? 'DAY' : 'NIGHT');
        const col = m.want === 'sunrise' || m.want === 'sunset' ? '#ffc48a' : m.want === 'day' || m.want === 'noon' ? '#ffe58a' : '#c6d0ff';
        SA.label(ctx, 'needs ' + word, p.x, p.y - bounce - r - 26 - hop, 17, col);
      }
    }
  }
  SA.EarthScene = EarthScene;
})(window.SA);
