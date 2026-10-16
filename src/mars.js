// Mars mission: "Rover Rock Hunt". The rover drives itself; tap to jump (floaty, because Mars
// gravity is weak), hop over boulders and grab rock samples, each one teaching a Mars fact.
(function (SA) {
  const SPEED = 230;        // rover cruising speed, px/s
  const GRAVITY = 380;      // Mars-light gravity
  const JUMP = 470;
  const TRACK = 7000;       // distance to Mars Base
  const BOULDERS = [1150, 2100, 3050, 3950, 4850, 5800];
  const SAMPLES = [
    { x: 650, h: 34, color: '#c4512f', name: 'Red rock', fact: 'A red rock! Mars dust is full of rusty iron. That\'s why Mars looks red!' },
    { x: 2100, h: 250, color: '#bfe8ff', name: 'Ice', fact: 'Ice! Mars has frozen water at its poles and under the ground.' },
    { x: 2650, h: 34, color: '#4a3d3d', name: 'Volcano rock', fact: 'Volcano rock! Mars has Olympus Mons, the biggest volcano in the Solar System.' },
    { x: 3950, h: 250, color: '#e0a464', name: 'River pebble', fact: 'A smooth pebble! Long, long ago, rivers of water flowed on Mars.' },
    { x: 4400, h: 34, color: '#e38a5a', name: 'Dust ball', fact: 'Mars has giant dust storms that can cover the whole planet!' },
    { x: 5800, h: 250, color: '#9a9cb3', name: 'Meteorite', fact: 'A meteorite, a rock from space! The air on Mars is very thin, so lots of space rocks land there.' },
  ];

  class MarsScene {
    constructor() {
      this.fx = new SA.Particles();
      this.t = 0;
      const rnd = SA.seeded(17);
      this.pebbles = [];
      for (let i = 0; i < 260; i++) this.pebbles.push({ x: rnd() * (TRACK + 1600) - 400, s: 2 + rnd() * 6, d: 6 + rnd() * 60, c: rnd() > 0.5 ? '#a9472b' : '#e08e66' });
      this.craters = [];
      for (let x = 900; x < TRACK; x += 700 + rnd() * 500) {
        if (BOULDERS.some(b => Math.abs(b - x) < 320)) continue;
        this.craters.push({ x, w: 110 + rnd() * 70, d: 26 + rnd() * 18 });
      }
    }

    groundY(x) {
      let y = SA.H * 0.78 + Math.sin(x * 0.0035) * 26 + Math.sin(x * 0.011 + 1.3) * 10;
      for (const c of this.craters) {
        const k = (x - c.x) / c.w;
        if (Math.abs(k) < 1) y += c.d * (0.5 + 0.5 * Math.cos(Math.PI * k));
        else if (Math.abs(k) < 1.4) y -= c.d * 0.25 * Math.sin(Math.PI * (Math.abs(k) - 1) / 0.4);
      }
      return y;
    }

    enter(opts) {
      SA.ui.setScene('game');
      // Expert mission "Speedy Scientist": a turbo rover and six new samples with new facts.
      this.expert = !!(opts && opts.expert);
      const E = SA.EXPERT.mars;
      this.rover = { x: 100, y: 0, vy: 0, ground: true, speed: 0, ang: 0, wheel: 0 };
      this.rover.y = this.groundY(this.rover.x);
      this.samples = SAMPLES.map((s, i) => Object.assign({ got: false }, s, this.expert ? E.samples[i] : null));
      this.boulders = BOULDERS.map(x => ({ x, r: 34 }));
      this.got = 0;
      this.phase = 'intro';
      this.shake = 0;
      this.jumped = false;
      this.bumped = false;
      this.cheerT = 0;
      this.flyers = [];
      this.airGaps = [];
      this.devils = [{ x: 500 }, { x: 1700 }];
      this.updateInfo();
      SA.audio.music('mars');
      SA.ui.banner('Mars', this.expert ? '🎓 Expert: ' + E.name : SA.NICKNAMES.mars).then(() => SA.scene !== this ? new Promise(() => {}) : SA.ui.say(this.expert ? E.intro : SA.introLines('mars', [
        'Welcome to Mars, the red planet! 🔴',
        'Let\'s drive our rover and collect rock samples, just like real scientists. 🔬',
        'Tap anywhere to jump. Hop over big rocks and grab the shiny samples! ✨',
      ]))).then(() => {
        if (SA.scene !== this) return;
        this.phase = 'drive';
        SA.ui.hint('Tap to jump! 👆', 3);
      });
    }

    exit() { SA.ui.hideTalk(); }

    updateInfo() { SA.ui.setInfo('🪨 Samples ' + this.got + ' / ' + SAMPLES.length); }

    onDown() {
      if (this.phase !== 'drive' || !this.rover.ground) return;
      this.rover.vy = -JUMP;
      this.rover.ground = false;
      this.airGaps.push([this.rover.x, Infinity]);
      SA.audio.play('jump');
      if (!this.jumped) {
        this.jumped = true;
        SA.ui.hint('Wheee! Mars gravity is weak, so we jump super high! 🦘', 4);
      }
    }

    update(dt) {
      this.t += dt;
      this.fx.update(dt);
      this.shake = Math.max(0, this.shake - dt * 3);
      this.cheerT = Math.max(0, this.cheerT - dt);
      for (const d of this.devils) d.x += 25 * dt;
      // Collected samples fly up into the sample counter.
      for (const f of this.flyers) {
        f.t += dt * 1.4;
        if (f.t >= 1 && !f.done) { f.done = true; SA.audio.play('pop'); SA.ui.bumpInfo(); }
      }
      this.flyers = this.flyers.filter(f => f.t < 1.05);
      const r = this.rover;
      if (this.phase !== 'drive') {
        r.speed = SA.lerp(r.speed, 0, Math.min(1, dt * 4));
        return;
      }

      r.speed = Math.min(this.expert ? SPEED * 1.3 : SPEED, r.speed + 260 * dt);
      r.x += r.speed * dt;
      r.wheel += (r.speed * dt) / 13;

      // Boulders stop the rover until it jumps over.
      for (const b of this.boulders) {
        const top = this.groundY(b.x) - b.r * 1.5;
        if (r.x + 46 > b.x - b.r && r.x - 46 < b.x + b.r && r.y > top + 4) {
          r.x = b.x - b.r - 47;
          if (r.speed > 60) {
            this.stuckT = 0;
            SA.audio.play('bump');
            this.shake = 1;
            if (!this.bumped || Math.random() < 0.3) SA.ui.hint('Bonk! Tap to jump over the big rock! 👆', 3);
            this.bumped = true;
          }
          r.speed = 0;
          // Little Explorer mode: hop over automatically after a short wait.
          this.stuckT = (this.stuckT || 0) + dt;
          if (SA.easy() && this.stuckT > 1.2 && r.ground) { this.stuckT = 0; this.onDown(); }
        }
      }

      const gy = this.groundY(r.x);
      if (r.ground) {
        r.y = gy;
        if (Math.random() < 0.5) this.fx.spawn('dust', r.x - 40, gy - 4, 1, { color: 'rgba(214,130,90,0.55)' });
      } else {
        r.vy += GRAVITY * dt;
        r.y += r.vy * dt;
        if (r.y >= gy) {
          r.y = gy; r.vy = 0; r.ground = true;
          const gap = this.airGaps[this.airGaps.length - 1];
          if (gap) gap[1] = r.x;
          SA.audio.play('land');
          this.fx.spawn('dust', r.x, gy, 8, { color: 'rgba(214,130,90,0.6)' });
        }
      }
      const slope = Math.atan2(this.groundY(r.x + 30) - this.groundY(r.x - 30), 60);
      r.ang = SA.lerp(r.ang, r.ground ? slope : r.vy * 0.0004, Math.min(1, dt * 8));

      for (const s of this.samples) {
        if (s.got) continue;
        const sy = this.groundY(s.x) - s.h;
        if (Math.hypot(r.x - s.x, r.y - 40 - sy) < (SA.easy() ? 95 : 70)) {
          s.got = true;
          this.got++;
          this.updateInfo();
          SA.audio.play('collect');
          this.fx.spawn('sparkle', s.x, sy, 18, { color: '#ffe066' });
          this.fx.text(s.x, sy - 40, '+1 ' + s.name, '#ffe066');
          const camX = r.x - SA.W * 0.28;
          this.flyers.push({ x0: s.x - camX, y0: sy, color: s.color, t: 0 });
          this.cheerT = 1.4;
          SA.ui.hint(s.fact, 5);
        }
      }

      if (r.x >= TRACK - 160) this.finish();
    }

    async finish() {
      this.phase = 'done';
      SA.audio.play('cheer');
      SA.celebrate(120);
      const all = this.got === SAMPLES.length;
      const stars = all ? 3 : this.got >= 4 ? 2 : 1;
      await SA.ui.banner('Mission Complete!', '🪨 ' + this.got + ' of ' + SAMPLES.length + ' samples collected', 'gold', stars);
      if (SA.scene !== this) return;
      if (this.expert) {
        await SA.ui.say([all ? 'ALL ' + SAMPLES.length + ' expert samples! Amazing science! 🔬' : 'You found ' + this.got + ' of ' + SAMPLES.length + ' expert samples! Great driving! 🔬'].concat(SA.EXPERT.mars.outro));
        SA.finishExpert('mars', stars);
        return;
      }
      await SA.ui.say([
        all ? 'We made it to Mars Base with ALL ' + SAMPLES.length + ' samples! You\'re a real scientist! 🎉'
            : 'We made it to Mars Base! You found ' + this.got + ' of ' + SAMPLES.length + ' samples. Great driving! 🎉',
        'Did you know? Real robot rovers, like Perseverance, are exploring Mars right now!',
        'One day, people might visit Mars too. Maybe it will be you! 👩‍🚀',
      ]);
      SA.finishPlanet('mars', stars);
    }

    draw(ctx) {
      const W = SA.W, H = SA.H, t = this.t, r = this.rover;
      const camX = r.x - W * 0.28;
      const sh = SA.calm() ? 0 : this.shake * 6;
      ctx.save();
      ctx.translate(Math.sin(t * 60) * sh, Math.cos(t * 50) * sh);

      // Butterscotch Martian sky.
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#d98f62');
      sky.addColorStop(0.6, '#f0c49a');
      sky.addColorStop(1, '#f7d9b4');
      ctx.fillStyle = sky;
      ctx.fillRect(-20, -20, W + 40, H + 40);

      // Small, pale Sun (Mars is farther away) and the two little moons.
      ctx.fillStyle = 'rgba(255,250,235,0.35)';
      SA.circle(ctx, W * 0.82, H * 0.17, 46); ctx.fill();
      ctx.fillStyle = '#fffaf0';
      SA.circle(ctx, W * 0.82, H * 0.17, 22); ctx.fill();
      this.drawMoon(ctx, W * 0.2 - camX * 0.01, H * 0.14, 16, 'Phobos');
      this.drawMoon(ctx, W * 0.48 - camX * 0.006, H * 0.09, 9, 'Deimos');

      // Olympus Mons far away: a huge, gently sloped shield volcano.
      const ox = W * 0.75 - camX * 0.05;
      ctx.fillStyle = '#d9997a';
      ctx.beginPath();
      ctx.moveTo(ox - 520, H * 0.62);
      ctx.bezierCurveTo(ox - 260, H * 0.6, ox - 140, H * 0.36, ox - 60, H * 0.35);
      ctx.lineTo(ox + 60, H * 0.35);
      ctx.bezierCurveTo(ox + 140, H * 0.36, ox + 260, H * 0.6, ox + 520, H * 0.62);
      ctx.closePath();
      ctx.fill();
      SA.label(ctx, 'Olympus Mons', ox, H * 0.31, 17, '#7a3a24', { stroke: 'rgba(255,235,210,0.8)', strokeW: 4 });

      // Middle hills (parallax).
      ctx.fillStyle = '#cf7a54';
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W + 20; x += 20) {
        const wx = x + camX * 0.35;
        ctx.lineTo(x, H * 0.64 + Math.sin(wx * 0.006) * 30 + Math.sin(wx * 0.017) * 12);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();

      // Dust devils: little whirlwinds that wander across Mars.
      for (const d of this.devils) {
        const span = W + 600;
        const sx = ((((d.x - camX * 0.35) % span) + span) % span) - 300;
        this.drawDevil(ctx, sx, H * 0.66, t + d.x);
      }

      ctx.save();
      ctx.translate(-camX, 0);

      // Ground.
      const g = ctx.createLinearGradient(0, H * 0.7, 0, H);
      g.addColorStop(0, '#c9643d');
      g.addColorStop(1, '#8e3a22');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(camX - 20, H + 20);
      for (let x = camX - 20; x <= camX + W + 20; x += 12) ctx.lineTo(x, this.groundY(x));
      ctx.lineTo(camX + W + 20, H + 20);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#e48b62';
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let x = camX - 20; x <= camX + W + 20; x += 12) ctx.lineTo(x, this.groundY(x));
      ctx.stroke();

      for (const p of this.pebbles) {
        if (p.x < camX - 20 || p.x > camX + W + 20) continue;
        ctx.fillStyle = p.c;
        SA.ellipse(ctx, p.x, this.groundY(p.x) + p.d, p.s, p.s * 0.6);
        ctx.fill();
      }

      // Tyre tracks behind the rover (with gaps where it jumped).
      ctx.fillStyle = 'rgba(100,35,15,0.5)';
      for (let x = Math.max(100, Math.floor((camX - 20) / 16) * 16); x < r.x - 40; x += 16) {
        if (this.airGaps.some(gp => x > gp[0] - 30 && x < gp[1] - 30)) continue;
        const gy = this.groundY(x);
        ctx.fillRect(x, gy + 5, 10, 6);
      }

      this.drawBase(ctx, TRACK, t);
      for (const b of this.boulders) this.drawBoulder(ctx, b);
      for (const s of this.samples) if (!s.got) this.drawSample(ctx, s, t);
      this.fx.draw(ctx);
      this.drawRover(ctx, r, t);
      ctx.restore();
      ctx.restore();

      this.drawProgress(ctx, r);
      for (const f of this.flyers) this.drawFlyer(ctx, f);
    }

    // A sample zooming from the ground up to the counter in the top-right corner.
    drawFlyer(ctx, f) {
      const k = SA.easeInOut(f.t);
      const tx = SA.W - 110, ty = 30;
      const x = SA.lerp(f.x0, tx, k), y = SA.lerp(f.y0, ty, k) - Math.sin(k * Math.PI) * 120;
      const s = 1 - k * 0.5;
      ctx.fillStyle = 'rgba(255,240,150,0.6)';
      SA.circle(ctx, x, y, 22 * s); ctx.fill();
      ctx.fillStyle = f.color;
      SA.circle(ctx, x, y, 12 * s); ctx.fill();
      ctx.fillStyle = '#fff';
      SA.starPath(ctx, x + 10 * s, y - 10 * s, 6 * s, 0.3, 4, f.t * 6);
      ctx.fill();
    }

    drawDevil(ctx, x, baseY, t) {
      ctx.save();
      for (let i = 0; i < 9; i++) {
        const k = i / 8;
        const y = baseY - k * 140;
        const w = 8 + k * 34;
        const sway = Math.sin(t * 3 + k * 4) * (6 + k * 14);
        ctx.fillStyle = 'rgba(190,110,75,' + (0.42 - k * 0.25) + ')';
        SA.ellipse(ctx, x + sway, y, w, 7 + k * 4);
        ctx.fill();
      }
      ctx.restore();
    }

    drawMoon(ctx, x, y, rr, name) {
      ctx.fillStyle = '#9c8a80';
      SA.ellipse(ctx, x, y, rr * 1.3, rr, 0.4); ctx.fill();
      ctx.fillStyle = '#7d6c64';
      SA.circle(ctx, x - rr * 0.3, y, rr * 0.3); ctx.fill();
      SA.label(ctx, name, x, y + rr + 16, 14, '#6b3420', { stroke: 'rgba(255,235,210,0.8)', strokeW: 4 });
    }

    drawBoulder(ctx, b) {
      const gy = this.groundY(b.x);
      ctx.fillStyle = '#7d3a26';
      ctx.beginPath();
      ctx.moveTo(b.x - b.r * 1.2, gy + 6);
      ctx.quadraticCurveTo(b.x - b.r * 1.2, gy - b.r * 1.4, b.x - b.r * 0.1, gy - b.r * 1.55);
      ctx.quadraticCurveTo(b.x + b.r * 1.2, gy - b.r * 1.3, b.x + b.r * 1.15, gy + 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,180,140,0.3)';
      SA.ellipse(ctx, b.x - b.r * 0.4, gy - b.r * 1.0, b.r * 0.35, b.r * 0.2, -0.5);
      ctx.fill();
    }

    drawSample(ctx, s, t) {
      const y = this.groundY(s.x) - s.h + Math.sin(t * 3 + s.x) * 6;
      const glow = ctx.createRadialGradient(s.x, y, 4, s.x, y, 44);
      glow.addColorStop(0, 'rgba(255,240,150,0.85)');
      glow.addColorStop(1, 'rgba(255,240,150,0)');
      ctx.fillStyle = glow;
      SA.circle(ctx, s.x, y, 44); ctx.fill();
      ctx.fillStyle = s.color;
      ctx.strokeStyle = 'rgba(40,20,20,0.6)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(s.x - 18, y + 4);
      ctx.lineTo(s.x - 10, y - 14);
      ctx.lineTo(s.x + 8, y - 16);
      ctx.lineTo(s.x + 19, y - 2);
      ctx.lineTo(s.x + 10, y + 13);
      ctx.lineTo(s.x - 10, y + 13);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      SA.ellipse(ctx, s.x - 4, y - 8, 6, 3, -0.4); ctx.fill();
      ctx.fillStyle = '#fff';
      SA.starPath(ctx, s.x + 16, y - 16, 6 + Math.sin(t * 5 + s.x) * 2, 0.3, 4, 0);
      ctx.fill();
    }

    drawBase(ctx, x, t) {
      const gy = this.groundY(x);
      ctx.fillStyle = '#eef1f7';
      ctx.strokeStyle = '#7f8aa8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x + 60, gy, 90, Math.PI, 0);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#9fd3ff';
      SA.circle(ctx, x + 30, gy - 45, 16); ctx.fill();
      SA.circle(ctx, x + 90, gy - 45, 16); ctx.fill();
      ctx.strokeStyle = '#5a6380';
      ctx.beginPath(); ctx.moveTo(x - 60, gy); ctx.lineTo(x - 60, gy - 150); ctx.stroke();
      ctx.fillStyle = '#ff5d6c';
      ctx.beginPath();
      ctx.moveTo(x - 60, gy - 150);
      ctx.quadraticCurveTo(x - 20, gy - 140 + Math.sin(t * 4) * 6, x + 4, gy - 132);
      ctx.lineTo(x - 60, gy - 112);
      ctx.closePath();
      ctx.fill();
      SA.label(ctx, 'Mars Base', x + 60, gy - 110, 22, '#fff');
    }

    drawRover(ctx, r, t) {
      ctx.save();
      ctx.translate(r.x, r.y);
      ctx.rotate(r.ang);
      // Wheels and suspension.
      ctx.strokeStyle = '#59607a';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-34, -13); ctx.lineTo(-10, -34); ctx.lineTo(0, -13);
      ctx.moveTo(34, -13); ctx.lineTo(14, -34);
      ctx.stroke();
      for (const wx of [-34, 0, 34]) {
        ctx.fillStyle = '#2d3247';
        SA.circle(ctx, wx, -13, 14); ctx.fill();
        ctx.fillStyle = '#9aa3bf';
        SA.circle(ctx, wx, -13, 6); ctx.fill();
        ctx.strokeStyle = '#9aa3bf';
        ctx.lineWidth = 2;
        for (let k = 0; k < 3; k++) {
          const a = r.wheel + (k * Math.PI) / 3;
          ctx.beginPath();
          ctx.moveTo(wx + Math.cos(a) * 12, -13 + Math.sin(a) * 12);
          ctx.lineTo(wx - Math.cos(a) * 12, -13 - Math.sin(a) * 12);
          ctx.stroke();
        }
      }
      // Body.
      ctx.fillStyle = '#ece7de';
      ctx.strokeStyle = '#6d6a74';
      ctx.lineWidth = 3;
      SA.rrect(ctx, -48, -60, 96, 28, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#2b3d7a';
      SA.rrect(ctx, -54, -66, 60, 8, 3); ctx.fill();
      ctx.fillStyle = '#ffd84d';
      ctx.fillRect(-40, -46, 22, 6);
      // Camera mast.
      ctx.strokeStyle = '#6d6a74';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(34, -60); ctx.lineTo(34, -98); ctx.stroke();
      ctx.fillStyle = '#ece7de';
      SA.rrect(ctx, 22, -112, 28, 16, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#16204a';
      SA.circle(ctx, 42, -104, 4.5); ctx.fill();
      ctx.restore();
      // Cosmo riding along, kept upright.
      const wow = !r.ground || this.cheerT > 0;
      const hop = this.cheerT > 0 ? Math.abs(Math.sin(this.cheerT * 10)) * 8 : 0;
      SA.drawCosmo(ctx, r.x - 6, r.y - 92 - hop, 0.5, { t, mood: this.cheerT > 0 ? 'joy' : wow ? 'wow' : 'happy', wave: wow && !(this.cheerT > 0), noBob: true });
    }

    drawProgress(ctx, r) {
      const W = SA.W, w = SA.topBarW(), x = (W - w) / 2, y = 34;
      ctx.fillStyle = 'rgba(40,16,10,0.35)';
      SA.rrect(ctx, x, y - 9, w, 18, 9); ctx.fill();
      const k = SA.clamp((r.x - 100) / (TRACK - 260), 0, 1);
      ctx.fillStyle = '#ffd84d';
      SA.rrect(ctx, x, y - 9, Math.max(18, w * k), 18, 9); ctx.fill();
      for (const s of this.samples) {
        const sx = x + w * SA.clamp((s.x - 100) / (TRACK - 260), 0, 1);
        ctx.fillStyle = s.got ? '#7ee08a' : 'rgba(255,255,255,0.75)';
        SA.circle(ctx, sx, y, 5); ctx.fill();
      }
      SA.emoji(ctx, '🏁', x + w + 18, y, 26);
      SA.emoji(ctx, '🚙', x + w * k, y - 2, 28);
    }
  }
  SA.MarsScene = MarsScene;
})(window.SA);
