// Warp-speed trip between the map and a planet: stars streak past while the destination grows
// from a dot to a giant ball. Tap to skip once it has started.
(function (SA) {
  const DUR = 4.2;

  class FlightScene {
    constructor() {
      this.fx = new SA.Particles();
      this.streaks = [];
      for (let i = 0; i < 170; i++) this.streaks.push(this.newStreak(Math.random()));
      this.t = 0;
    }

    newStreak(d) {
      const hue = Math.random();
      return { a: Math.random() * Math.PI * 2, d: d == null ? 0.02 : d, sp: 0.35 + Math.random() * 0.6, c: hue > 0.8 ? '#ffd9a8' : hue > 0.55 ? '#9fc4ff' : '#ffffff' };
    }

    enter(opts) {
      this.to = opts.to;
      this.expert = !!opts.expert && !!(SA.EXPERT && SA.EXPERT[opts.to]);
      this.t = 0;
      this.left = false;
      this.hinted = false;
      SA.ui.setScene('flight');
      SA.audio.music('warp');
      SA.audio.play('launch');
    }

    exit() { SA.ui.hideTalk(); }

    onDown() { if (this.t > 0.8) this.arrive(); }

    arrive() {
      if (this.left) return;
      // If a transition is still running, stay and try again next frame instead of getting stuck.
      this.left = SA.go(SA[this.to], { arrived: true, expert: this.expert });
      if (this.left) SA.audio.play('whoosh');
    }

    vp() { return { x: SA.W * 0.64, y: SA.H * 0.44 }; }

    update(dt) {
      this.t += dt;
      const speed = this.speed();
      for (const s of this.streaks) {
        s.d += s.sp * dt * speed * (0.15 + s.d);
        if (s.d > 1.4) Object.assign(s, this.newStreak());
      }
      const r = this.rocketPos();
      const v = this.vp();
      const back = Math.atan2(v.y - r.y, v.x - r.x) + Math.PI;
      this.fx.spawn('puff', r.x + Math.cos(back) * 70, r.y + Math.sin(back) * 70, 3, { vx: Math.cos(back) * 260, vy: Math.sin(back) * 260 });
      this.fx.update(dt);
      if (!this.hinted && this.t > 0.6) {
        this.hinted = true;
        SA.ui.hint((this.expert ? SA.EXPERT[this.to].flight : SA.FLIGHT_FACTS[this.to]) || 'Here we go! 🚀', 0);
      }
      if (this.t >= DUR) this.arrive();
    }

    // Slow start, warp in the middle, brake at the end.
    speed() {
      const k = this.t / DUR;
      return 0.4 + SA.easeInOut(Math.min(1, k * 3)) * 3 - SA.easeInOut(Math.max(0, (k - 0.75) * 4)) * 2.2;
    }

    rocketPos() {
      const t = this.t;
      return { x: SA.W * 0.3 + Math.sin(t * 2.3) * 14, y: SA.H * 0.56 + Math.sin(t * 3.1) * 12 };
    }

    draw(ctx) {
      const W = SA.W, H = SA.H, t = this.t;
      const v = this.vp();
      const bg = ctx.createRadialGradient(v.x, v.y, 10, v.x, v.y, W * 0.8);
      bg.addColorStop(0, '#2a1f6b');
      bg.addColorStop(0.5, '#110d36');
      bg.addColorStop(1, '#04051a');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Warp streaks.
      const speed = this.speed();
      ctx.lineCap = 'round';
      for (const s of this.streaks) {
        const len = Math.min(0.5, s.d * 0.12 * speed);
        const d0 = Math.max(0, s.d - len);
        const R = W * 0.75;
        ctx.strokeStyle = s.c;
        ctx.globalAlpha = SA.clamp(s.d * 1.5, 0, 1);
        ctx.lineWidth = 1 + s.d * 3;
        ctx.beginPath();
        ctx.moveTo(v.x + Math.cos(s.a) * d0 * R, v.y + Math.sin(s.a) * d0 * R);
        ctx.lineTo(v.x + Math.cos(s.a) * s.d * R, v.y + Math.sin(s.a) * s.d * R);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Warp tunnel: soft rings rushing outward while at full speed.
      const warp = SA.clamp((speed - 1) / 2.4, 0, 1);
      if (warp > 0) {
        ctx.lineWidth = 3;
        for (let i = 0; i < 6; i++) {
          const u = ((t * 0.9 * speed) / 3 + i / 6) % 1;
          ctx.strokeStyle = 'rgba(150,170,255,' + (0.16 * warp * Math.sin(u * Math.PI)) + ')';
          SA.ellipse(ctx, v.x, v.y, 20 + u * u * W * 0.9, 14 + u * u * H * 0.9);
          ctx.stroke();
        }
      }

      // Destination growing in the distance, glowing in its own colour.
      const k = SA.clamp(this.t / DUR, 0, 1);
      const pr = 4 + Math.pow(k, 2.4) * H * 0.34;
      const col = (SA.BODY[this.to] && SA.BODY[this.to].color) || '#ffffff';
      const halo = ctx.createRadialGradient(v.x, v.y, pr * 0.5, v.x, v.y, pr * 2.6 + 30);
      halo.addColorStop(0, SA.rgba(col, 0.45));
      halo.addColorStop(1, SA.rgba(col, 0));
      ctx.fillStyle = halo;
      SA.circle(ctx, v.x, v.y, pr * 2.6 + 30);
      ctx.fill();
      SA.drawBody(ctx, this.to, v.x, v.y, pr, { t, lx: -0.6, ly: -0.4 });

      this.fx.draw(ctx);
      const r = this.rocketPos();
      const ang = Math.atan2(v.y - r.y, v.x - r.x) + Math.PI / 2;
      SA.drawRocket(ctx, r.x, r.y, 1.25, ang, { t, flame: 1 });

      // Soft vignette pulls the eye to the middle.
      const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, W * 0.75);
      vg.addColorStop(0, 'rgba(2,3,16,0)');
      vg.addColorStop(1, 'rgba(2,3,16,0.55)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);

      if (this.t > 0.8) {
        ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 5);
        SA.label(ctx, 'Tap to skip ▶', W - 100, H - 28, 18, '#c9d2ff', { weight: 700 });
        ctx.globalAlpha = 1;
      }
    }
  }
  SA.FlightScene = FlightScene;
})(window.SA);
