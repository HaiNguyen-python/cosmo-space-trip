// Title screen: Cosmo waves hello while the rocket loops past Saturn and shooting stars fly by.
(function (SA) {
  const NEBULA = [
    { x: 0.2, y: 0.3, r: 380, c: 'rgba(120,70,200,0.28)' },
    { x: 0.8, y: 0.75, r: 420, c: 'rgba(40,120,220,0.22)' },
    { x: 0.55, y: 0.1, r: 260, c: 'rgba(220,80,160,0.16)' },
  ];

  class TitleScene {
    constructor() {
      this.stars = new SA.Starfield(260, 5);
      this.shooting = new SA.ShootingStars(1.5, 4);
      this.fx = new SA.Particles();
      this.t = 0;
      document.getElementById('btnPlay').addEventListener('click', () => {
        if (SA.transitioning) return;
        SA.audio.init();
        SA.audio.play('launch');
        SA.go(SA.map, { fromTitle: true });
      });
    }

    enter() {
      SA.ui.setScene('title');
      SA.ui.hideTalk();
      SA.audio.music('space');
      // Returning players see their progress and a Continue button.
      const visited = SA.MISSIONS.filter(id => SA.state.done[id]).length;
      const prog = document.getElementById('titleProgress');
      document.getElementById('btnPlay').textContent = SA.state.introSeen ? '🚀 Continue' : '🚀 Play';
      prog.hidden = !SA.state.introSeen;
      prog.textContent = '🪐 ' + visited + ' / ' + SA.MISSIONS.length + ' planets   ⭐ ' + SA.totalStars() + ' / ' + SA.maxStars() +
        (SA.state.tourDone ? '   🏆 Grand Tour!' : '');
    }

    // Tapping Cosmo makes a happy sparkle.
    onDown(x, y) {
      const c = this.cosmoPos();
      if (Math.hypot(x - c.x, y - c.y) < 110) {
        this.happy = 1.2;
        SA.audio.play('collect');
        this.fx.spawn('sparkle', c.x, c.y - 40, 16);
      }
    }

    cosmoPos() { return { x: SA.W * 0.16, y: SA.H * 0.6 + Math.sin(this.t * 1.6) * 12 }; }

    rocketPos(t) {
      // A lazy figure-eight across the screen.
      const W = SA.W, H = SA.H;
      return { x: W * 0.5 + Math.sin(t * 0.45) * W * 0.38, y: H * 0.5 + Math.sin(t * 0.9) * H * 0.26 };
    }

    update(dt) {
      this.t += dt;
      this.happy = Math.max(0, (this.happy || 0) - dt);
      this.shooting.update(dt);
      const a = this.rocketPos(this.t), b = this.rocketPos(this.t + 0.05);
      this.ang = Math.atan2(b.y - a.y, b.x - a.x) + Math.PI / 2;
      this.pos = a;
      if (Math.random() < 0.7) {
        const back = this.ang + Math.PI / 2;
        this.fx.spawn('puff', a.x + Math.cos(back) * 48, a.y + Math.sin(back) * 48, 1, { vx: Math.cos(back) * 60, vy: Math.sin(back) * 60 });
      }
      this.fx.update(dt);
    }

    draw(ctx) {
      const W = SA.W, H = SA.H, t = this.t;
      SA.spaceBg(ctx, '#090c28', '#22124a');
      SA.nebula(ctx, t, NEBULA);
      this.stars.draw(ctx, t, t * 6);
      this.shooting.draw(ctx);

      // Saturn with its big moon Titan circling.
      const sx = W * 0.86, sy = H * 0.24;
      const ta = t * 0.5;
      const tx = sx + Math.cos(ta) * 170, ty = sy + Math.sin(ta) * 50;
      const titan = () => { ctx.fillStyle = '#e7b45a'; SA.circle(ctx, tx, ty, 9); ctx.fill(); };
      if (Math.sin(ta) < 0) titan();
      SA.drawBody(ctx, 'saturn', sx, sy, 70, { t, lx: -0.7, ly: 0.2 });
      if (Math.sin(ta) >= 0) titan();
      SA.drawBody(ctx, 'mars', W * 0.08, H * 0.16, 26, { t, lx: 0.6, ly: 0.4 });
      SA.drawBody(ctx, 'neptune', W * 0.62, H * 0.1, 14, { t, lx: -0.6, ly: 0.4 });
      SA.drawBody(ctx, 'earth', W * 0.5, H + 330, 420, { t: t * 0.3, lx: 0, ly: -1, dark: 0.5 });

      this.fx.draw(ctx);
      SA.drawRocket(ctx, this.pos.x, this.pos.y, 0.8, this.ang, { t, flame: 0.7 });

      const c = this.cosmoPos();
      const glow = ctx.createRadialGradient(c.x, c.y, 10, c.x, c.y, 150);
      glow.addColorStop(0, 'rgba(120,255,210,0.25)');
      glow.addColorStop(1, 'rgba(120,255,210,0)');
      ctx.fillStyle = glow;
      SA.circle(ctx, c.x, c.y, 150);
      ctx.fill();
      // Tapped: a happy hop with squash on take-off and landing.
      const h = this.happy > 0 ? 1.2 - this.happy : 0;
      const hop = h > 0 && h < 0.7 ? Math.sin((h / 0.7) * Math.PI) * 60 : 0;
      const squash = h > 0 ? (h < 0.08 ? 0.18 : h < 0.7 ? -0.1 * Math.sin((h / 0.7) * Math.PI) : h < 0.85 ? 0.16 * (1 - (h - 0.7) / 0.15) : 0) : 0;
      SA.drawCosmo(ctx, c.x, c.y - hop, 1.9, { t, wave: !this.happy, mood: this.happy > 0 ? 'joy' : 'happy', noBob: true, squash, look: this.happy > 0 ? [0, 0] : null });
    }
  }
  SA.TitleScene = TitleScene;
})(window.SA);
