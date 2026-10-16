// Neptune mission: "Wind Rider". A one-touch flying game on the fastest winds in the Solar System:
// hold to rise, let go to glide down. Collect diamonds and five glowing discoveries; dark storm
// swirls spin the rocket around but never end the ride.
(function (SA) {
  const TAU = Math.PI * 2;
  const SPEED = 280;
  const TRACK = 7000;
  const THRUST = 1050;
  const GRAVITY = 520;
  const FINDS = [
    { x: 1100, fy: 0.3, icon: '☁️', name: 'Scooter', fact: 'Scooter! A fast white cloud that zips around Neptune. Scientists gave it that nickname!' },
    { x: 2400, fy: 0.68, icon: '🌀', name: 'Great Dark Spot', fact: 'The Great Dark Spot! A storm as big as Earth, spotted by Voyager 2 in 1989.' },
    { x: 3700, fy: 0.4, icon: '💎', name: 'Diamond rain', fact: 'Scientists think it might rain diamonds deep inside Neptune! 💎' },
    { x: 5000, fy: 0.24, icon: '🌙', name: 'Triton', fact: 'Triton, Neptune\'s biggest moon, goes around backwards, and it has geysers of icy gas!' },
    { x: 6200, fy: 0.6, icon: '🧮', name: 'Found by math', fact: 'Neptune was found using math! In 1846, scientists worked out where it was before anyone saw it.' },
  ];
  const STORMS = [{ x: 1750, fy: 0.5 }, { x: 3050, fy: 0.34 }, { x: 4350, fy: 0.62 }, { x: 5600, fy: 0.44 }];

  class NeptuneScene {
    constructor() {
      this.stars = new SA.Starfield(220, 71);
      this.fx = new SA.Particles();
      this.t = 0;
      const rnd = SA.seeded(5);
      this.gemPlan = [];
      for (let x = 520; x < TRACK - 300; x += 150 + rnd() * 60) {
        if (FINDS.some(f => Math.abs(f.x - x) < 110) || STORMS.some(s => Math.abs(s.x - x) < 120)) continue;
        this.gemPlan.push({ x, fy: 0.45 + Math.sin(x * 0.0021) * 0.24 + (rnd() - 0.5) * 0.06 });
      }
      this.streaks = [];
      for (let i = 0; i < 40; i++) this.streaks.push({ x: rnd(), y: rnd(), len: 40 + rnd() * 120, sp: 0.6 + rnd() * 1.2 });
    }

    enter(opts) {
      SA.ui.setScene('game');
      SA.audio.music('neptune');
      // Expert mission "Storm Chaser": faster winds, storms that drift up and down, new facts.
      this.expert = !!(opts && opts.expert);
      const E = SA.EXPERT.neptune;
      this.phase = 'intro';
      this.x = 0;
      this.y = SA.H * 0.45;
      this.vy = 0;
      this.holding = false;
      this.spin = 0;
      this.slowT = 0;
      this.got = 0;
      this.gems = 0;
      this.flyers = [];
      this.stormed = false;
      this.finds = FINDS.map((f, i) => Object.assign({ got: false, missed: false }, f, this.expert ? E.finds[i] : null));
      this.storms = STORMS.map(s => Object.assign({ hit: false, fy0: s.fy }, s));
      this.gemList = this.gemPlan.map(g => Object.assign({ got: false }, g));
      this.updateInfo();
      SA.ui.banner('Neptune', this.expert ? '🎓 Expert: ' + E.name : SA.NICKNAMES.neptune).then(() => SA.scene !== this ? new Promise(() => {}) : SA.ui.say(this.expert ? E.intro : SA.introLines('neptune', [
        'Welcome to Neptune, the farthest planet! 💙',
        'It has the fastest winds in the Solar System, more than 2,000 kilometres per hour! Let\'s ride them!',
        'Hold your finger down to fly up, and let go to glide down. Grab the glowing discoveries and the diamonds! 💎',
      ]))).then(() => {
        if (SA.scene !== this) return;
        this.phase = 'fly';
        SA.ui.hint('Hold to fly up, let go to glide! 👆', 4);
      });
    }

    exit() { SA.ui.hideTalk(); this.holding = false; }

    updateInfo() { SA.ui.setInfo('🔭 ' + this.got + ' / ' + FINDS.length + '   💎 ' + this.gems); }

    rx() { return SA.W * 0.25; }
    floorY() { return SA.H * 0.82; }

    onDown() { if (this.phase === 'fly') this.holding = true; }
    onUp() { this.holding = false; }

    update(dt) {
      this.t += dt;
      this.fx.update(dt);
      this.spin = Math.max(0, this.spin - dt * 1.4);
      this.slowT = Math.max(0, this.slowT - dt);
      for (const f of this.flyers) {
        f.t += dt * 1.4;
        if (f.t >= 1 && !f.done) { f.done = true; SA.ui.bumpInfo(); }
      }
      this.flyers = this.flyers.filter(f => f.t < 1.05);
      if (this.phase !== 'fly') return;

      const speed = SPEED * (this.expert ? 1.22 : 1) * (this.slowT > 0 ? 0.5 : 1);
      if (this.expert) for (const s of this.storms) s.fy = s.fy0 + Math.sin(this.t * 1.1 + s.x * 0.013) * 0.12;
      this.x += speed * dt;
      this.vy += (this.holding ? -THRUST : SA.easy() ? GRAVITY * 0.75 : GRAVITY) * dt;
      const reach = SA.easy() ? 1.4 : 1;
      this.vy = SA.clamp(this.vy, -420, 380);
      this.y += this.vy * dt;
      const top = SA.H * 0.1, floor = this.floorY();
      if (this.y < top) { this.y = top; this.vy = 0; }
      if (this.y > floor) {
        // Bounce softly off the cloud tops.
        this.y = floor;
        this.vy = -300;
        SA.audio.play('jump');
        this.fx.spawn('puff', this.rx(), floor + 20, 6, { vy: 30 });
      }
      if (this.holding && Math.random() < 0.8) this.fx.spawn('puff', this.rx() - 44, this.y + SA.rand(-3, 3), 1, { vx: -160 });

      const rx = this.rx();
      for (const g of this.gemList) {
        if (g.got) continue;
        if (Math.abs(this.x - g.x) < 48 * reach && Math.abs(this.y - g.fy * SA.H) < 56 * reach) {
          g.got = true;
          this.gems++;
          this.updateInfo();
          SA.audio.play('blip');
          this.fx.spawn('sparkle', rx + (g.x - this.x), g.fy * SA.H, 6, { color: '#9fe8ff' });
        }
      }
      for (const f of this.finds) {
        if (f.got || f.missed) continue;
        const fy = f.fy * SA.H;
        if (Math.abs(this.x - f.x) < 44 * reach && Math.abs(this.y - fy) < 64 * reach) {
          f.got = true;
          this.got++;
          this.updateInfo();
          SA.audio.play('collect');
          const sx = rx + (f.x - this.x);
          this.fx.spawn('sparkle', sx, fy, 22);
          this.fx.text(sx, fy - 56, f.icon + ' ' + f.name, '#ffe066');
          this.flyers.push({ icon: f.icon, x0: sx, y0: fy, t: 0 });
          SA.ui.hint(f.fact, 6);
        } else if (this.x > f.x + 70) {
          f.missed = true;
          SA.ui.hint('Missed one! There are more discoveries ahead. 🔭', 3);
        }
      }
      for (const s of this.storms) {
        if (s.hit) continue;
        if (Math.hypot(this.x - s.x, this.y - s.fy * SA.H) < (SA.easy() ? 46 : 70)) {
          s.hit = true;
          this.spin = 1;
          this.slowT = 1;
          this.vy = 200;
          SA.audio.play('zap');
          SA.ui.hint(this.stormed ? 'Whirl! Steer around the dark storms!' : 'Whoa, a storm swirl spun us around! Neptune has huge storms. 🌀', 3);
          this.stormed = true;
        }
      }
      if (this.x >= TRACK) this.finish();
    }

    async finish() {
      this.phase = 'done';
      this.holding = false;
      SA.audio.play('cheer');
      SA.celebrate(120);
      const stars = this.got === FINDS.length ? 3 : this.got >= 3 ? 2 : 1;
      await SA.ui.banner('Mission Complete!', '🔭 ' + this.got + ' of ' + FINDS.length + ' discoveries · 💎 ' + this.gems, 'gold', stars);
      if (SA.scene !== this) return;
      if (this.expert) {
        const O = SA.EXPERT.neptune.outro;
        await SA.ui.say([O[0], 'You found ' + this.got + ' discoveries and ' + this.gems + ' diamonds! 💎'].concat(O.slice(1)));
        SA.finishExpert('neptune', stars);
        return;
      }
      await SA.ui.say([
        'What a wild ride! 🎉 You found ' + this.got + ' discoveries and ' + this.gems + ' diamonds!',
        'Neptune is so far away that one trip around the Sun takes 165 Earth years!',
      ]);
      SA.finishPlanet('neptune', stars);
    }

    // ---------- Drawing ----------
    draw(ctx) {
      const W = SA.W, H = SA.H, t = this.t;
      const cam = this.x - this.rx();
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#030a2a');
      sky.addColorStop(0.65, '#0b2a7a');
      sky.addColorStop(1, '#2a5fd8');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);
      this.stars.draw(ctx, t, cam * 0.05);

      // Racing wind streaks.
      ctx.strokeStyle = 'rgba(200,230,255,0.35)';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      for (const s of this.streaks) {
        const x = ((((s.x * (W + 300) - cam * s.sp * 1.6) % (W + 300)) + W + 300) % (W + 300)) - 150;
        const y = s.y * H * 0.85;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + s.len, y); ctx.stroke();
      }

      // Neptune's cloud tops: banded blue waves scrolling past.
      const fl = this.floorY();
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = ['#3a72e8', '#2f60d0', '#2652b8', '#1d4298'][i];
        ctx.beginPath();
        ctx.moveTo(0, H);
        for (let x = 0; x <= W + 20; x += 20) {
          const wx = x + cam * (0.4 + i * 0.25);
          ctx.lineTo(x, fl + 26 + i * 22 + Math.sin(wx * 0.01 + i) * 8);
        }
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fill();
      }

      for (const s of this.storms) {
        const sx = s.x - cam;
        if (sx > -120 && sx < W + 120) this.drawStorm(ctx, sx, s.fy * H, t, s.hit);
      }
      for (const g of this.gemList) {
        if (g.got) continue;
        const sx = g.x - cam;
        if (sx < -30 || sx > W + 30) continue;
        this.drawGem(ctx, sx, g.fy * H + Math.sin(t * 3 + g.x) * 4, 11, t + g.x);
      }
      for (const f of this.finds) {
        if (f.got) continue;
        const sx = f.x - cam;
        if (sx < -80 || sx > W + 80) continue;
        const y = f.fy * H + Math.sin(t * 2 + f.x) * 6;
        const glow = ctx.createRadialGradient(sx, y, 8, sx, y, 60);
        glow.addColorStop(0, 'rgba(255,240,160,0.8)');
        glow.addColorStop(1, 'rgba(255,240,160,0)');
        ctx.fillStyle = glow;
        SA.circle(ctx, sx, y, 60); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        SA.circle(ctx, sx, y, 30); ctx.fill();
        SA.emoji(ctx, f.icon, sx, y + 1, 32);
        SA.label(ctx, f.name, sx, y + 46, 15, '#fff6c8');
      }

      this.fx.draw(ctx);
      const tilt = SA.clamp(this.vy * 0.0016, -0.45, 0.45);
      SA.drawRocket(ctx, this.rx(), this.y, 0.6, Math.PI / 2 + tilt + this.spin * TAU, { t, flame: this.holding ? 1 : 0.25 });
      this.drawProgress(ctx);
      for (const f of this.flyers) {
        const e = SA.easeInOut(f.t);
        const x = SA.lerp(f.x0, W - 110, e), y = SA.lerp(f.y0, 30, e) - Math.sin(e * Math.PI) * 100;
        SA.emoji(ctx, f.icon, x, y, 34 * (1 - e * 0.5));
      }
    }

    drawGem(ctx, x, y, s, t) {
      ctx.fillStyle = '#bff4ff';
      ctx.strokeStyle = '#3aa0d8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.8, y - s * 0.2); ctx.lineTo(x, y + s); ctx.lineTo(x - s * 0.8, y - s * 0.2);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      SA.starPath(ctx, x + s * 0.5, y - s * 0.7, 3 + Math.sin(t * 6) * 1.5, 0.3, 4, 0);
      ctx.fill();
    }

    drawStorm(ctx, x, y, t, hit) {
      const a = hit ? 0.35 : 1;
      ctx.save();
      ctx.translate(x, y);
      const core = ctx.createRadialGradient(0, 0, 4, 0, 0, 70);
      core.addColorStop(0, 'rgba(5,8,40,' + 0.85 * a + ')');
      core.addColorStop(1, 'rgba(5,8,40,0)');
      ctx.fillStyle = core;
      SA.ellipse(ctx, 0, 0, 74, 44); ctx.fill();
      ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        ctx.rotate(t * (1.2 + i * 0.3));
        ctx.strokeStyle = 'rgba(170,200,255,' + (0.7 - i * 0.12) * a + ')';
        ctx.lineWidth = 6 - i;
        ctx.beginPath();
        ctx.ellipse(0, 0, 62 - i * 13, 32 - i * 7, 0, 0, Math.PI * 1.3);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawProgress(ctx) {
      const W = SA.W, w = SA.topBarW(), x = (W - w) / 2, y = 34;
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      SA.rrect(ctx, x, y - 9, w, 18, 9); ctx.fill();
      const k = SA.clamp(this.x / TRACK, 0, 1);
      ctx.fillStyle = '#7fd4ff';
      SA.rrect(ctx, x, y - 9, Math.max(18, w * k), 18, 9); ctx.fill();
      for (const f of this.finds) {
        ctx.fillStyle = f.got ? '#7ee08a' : f.missed ? 'rgba(255,255,255,0.3)' : '#fff';
        SA.circle(ctx, x + w * (f.x / TRACK), y, 5); ctx.fill();
      }
      SA.emoji(ctx, '🏁', x + w + 18, y, 26);
    }
  }
  SA.NeptuneScene = NeptuneScene;
})(window.SA);
