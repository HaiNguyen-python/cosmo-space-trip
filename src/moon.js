// Bonus mission: "Moon Phases". Seen from above, the Sun lights the left half of the Moon all the
// time. The child drags the Moon around Earth to make each Moon shape, while a window shows what
// the Moon looks like from Earth. Teaches why the Moon's shape seems to change.
(function (SA) {
  const TAU = Math.PI * 2;
  const HOLD = 0.5;
  const ROUNDS = [
    { p: 0.5, name: 'Full Moon', emoji: '🌕',
      fact: 'Full Moon! 🌕 The Moon is on the far side of Earth, so we see its whole sunny side.' },
    { p: 0, name: 'New Moon', emoji: '🌑',
      fact: 'New Moon! 🌑 The Moon is between Earth and the Sun, so its sunny side faces away from us.' },
    { p: 0.25, name: 'Half Moon', emoji: '🌓',
      fact: 'Half Moon! 🌓 We see half of the sunny side. It\'s also called a quarter moon, because the Moon has gone a quarter of the way around.' },
    { p: 0.12, name: 'Crescent Moon', emoji: '🌒',
      fact: 'A crescent Moon! 🌒 A thin smile of light.' },
    { p: 0.62, name: 'Gibbous Moon', emoji: '🌖',
      fact: 'A gibbous Moon! 🌖 More than half, but not quite full.' },
  ];

  const phaseOf = a => (((Math.PI - a) / TAU) % 1 + 1) % 1;
  const angleOf = p => Math.PI - p * TAU;
  const phaseDist = (a, b) => { const d = Math.abs(a - b) % 1; return Math.min(d, 1 - d); };
  // The name shown in the window is also what counts for the goal, so they never disagree.
  function phaseName(p) {
    const w = SA.easy() ? 0.08 : 0.05;
    if (p < w || p > 1 - w) return 'New Moon';
    if (Math.abs(p - 0.5) < w) return 'Full Moon';
    if (Math.abs(p - 0.25) < w || Math.abs(p - 0.75) < w) return 'Half Moon';
    if (p < 0.25 || p > 0.75) return 'Crescent Moon';
    return 'Gibbous Moon';
  }

  class MoonScene {
    constructor() {
      this.stars = new SA.Starfield(240, 91);
      this.fx = new SA.Particles();
      this.t = 0;
    }

    layout() {
      const W = SA.W, H = SA.H;
      this.earth = { x: W * 0.4, y: H * 0.46, r: H * 0.085 };
      this.orbit = H * 0.3;
      this.view = { x: W * 0.82, y: H * 0.5, r: H * 0.15 };
    }

    resize() { this.layout(); }

    enter() {
      SA.ui.setScene('game');
      SA.audio.music('earth');
      this.layout();
      this.angle = angleOf(0.3);
      this.round = -1;
      this.phase = 'intro';
      this.dragging = false;
      this.holdT = 0;
      this.anim = null;
      this.cheer = 0;
      SA.ui.setInfo('🌙 Moon shapes');
      SA.ui.banner('The Moon', SA.NICKNAMES.moon).then(() => SA.scene !== this ? new Promise(() => {}) : SA.ui.say(SA.introLines('moon', [
        'Welcome to the Moon, our nearest neighbor in space! 🌙',
        'Half of the Moon is always lit by the Sun. As the Moon goes around Earth, we see different amounts of that sunny half.',
        'Drag the Moon around Earth to make each Moon shape! The window shows what it looks like from Earth. 🔭',
      ]))).then(() => { if (SA.scene === this) this.nextRound(); });
    }

    exit() { SA.ui.hideTalk(); }

    moonPos() {
      return { x: this.earth.x + Math.cos(this.angle) * this.orbit, y: this.earth.y + Math.sin(this.angle) * this.orbit };
    }
    current() { return phaseOf(this.angle); }
    matches(r) { return phaseName(this.current()) === r.name; }

    nextRound() {
      this.round++;
      if (this.round >= ROUNDS.length) { this.finish(); return; }
      const r = ROUNDS[this.round];
      SA.ui.setInfo('🌙 Shape ' + (this.round + 1) + ' of ' + ROUNDS.length);
      // Start the Moon well away from the answer.
      if (phaseDist(this.current(), r.p) < 0.2) {
        const from = this.angle, to = angleOf(r.p + 0.35);
        let d = SA.wrapAngle(to - from);
        this.anim = { from, to: from + d, t: 0 };
      }
      this.phase = 'play';
      this.holdT = 0;
      this.goalHint();
    }

    onDown(x, y) {
      if (this.phase !== 'play' || this.anim) return;
      this.dragging = true;
      // Like Earth: the tip makes room once the child starts dragging (on phones it covers the
      // bottom of the orbit). The goal stays written under the "Seen from Earth" window.
      SA.ui.hideTalk();
      this.drag(x, y);
    }
    onMove(x, y) { if (this.dragging) this.drag(x, y); }
    onUp() {
      if (this.dragging && this.phase === 'play' && this.holdT <= 0) this.goalHint();
      this.dragging = false;
    }
    goalHint() {
      const r = ROUNDS[this.round];
      SA.ui.hint('Make a ' + r.name.toUpperCase() + '! ' + r.emoji + ' Drag the Moon around Earth.', 0);
    }
    drag(x, y) {
      const a = Math.atan2(y - this.earth.y, x - this.earth.x);
      // Only follow the finger near the orbit, so tapping the window doesn't jump the Moon.
      if (Math.hypot(x - this.earth.x, y - this.earth.y) < this.orbit * 1.6) {
        if (Math.abs(SA.wrapAngle(a - this.angle)) > 0.02) this.tick = (this.tick || 0) + 1;
        this.angle = a;
        if (this.tick % 6 === 0) SA.audio.play('spin');
      }
    }

    update(dt) {
      this.t += dt;
      this.fx.update(dt);
      if (this.anim) {
        const an = this.anim;
        an.t += dt / 0.8;
        this.angle = SA.lerp(an.from, an.to, SA.easeInOut(an.t));
        if (an.t >= 1) this.anim = null;
        return;
      }
      if (this.phase === 'play') {
        const r = ROUNDS[this.round];
        if (this.matches(r)) this.holdT += dt;
        else this.holdT = Math.max(0, this.holdT - dt * 2);
        if (this.holdT >= HOLD) this.success(r);
      } else if (this.phase === 'cheer') {
        this.cheer -= dt;
        if (this.cheer <= 0) this.nextRound();
      }
    }

    success(r) {
      this.phase = 'cheer';
      this.dragging = false;
      this.cheer = 3.4;
      // Snap neatly onto the exact shape.
      this.anim = { from: this.angle, to: this.angle + SA.wrapAngle(angleOf(r.p) - this.angle), t: 0.5 };
      SA.audio.play('collect');
      setTimeout(() => SA.audio.play('ding'), 200);
      this.fx.spawn('sparkle', this.view.x, this.view.y, 26);
      SA.ui.hint(r.fact, 0);
    }

    async finish() {
      this.phase = 'done';
      SA.audio.play('cheer');
      SA.celebrate(120);
      await SA.ui.banner('Mission Complete!', '🌙 All 5 Moon shapes made', 'gold', 3);
      if (SA.scene !== this) return;
      await SA.ui.say([
        'You made every Moon shape! 🎉',
        'The Moon doesn\'t really change shape. We just see different parts of its sunny side. One full cycle takes about a month!',
        'And in 1969, astronauts walked on the Moon for the very first time! 👩‍🚀',
      ]);
      SA.finishPlanet('moon', 3);
    }

    // ---------- Drawing ----------
    draw(ctx) {
      const W = SA.W, H = SA.H, t = this.t;
      SA.spaceBg(ctx, '#05071d', '#141039');
      this.stars.draw(ctx, t, 0);
      const e = this.earth;

      // Sunlight from the left.
      const beam = ctx.createLinearGradient(0, 0, e.x, 0);
      beam.addColorStop(0, 'rgba(255,220,120,0.22)');
      beam.addColorStop(1, 'rgba(255,220,120,0)');
      ctx.fillStyle = beam;
      ctx.fillRect(0, 0, e.x + this.orbit, H);
      SA.drawBody(ctx, 'sun', -H * 0.18, e.y, H * 0.3, { t });
      SA.label(ctx, 'Sunlight ➜', H * 0.2, H * 0.12, 18, '#ffe08a');

      // Orbit with little phase markers, and Earth.
      ctx.setLineDash([6, 10]);
      ctx.strokeStyle = 'rgba(200,210,255,0.3)';
      ctx.lineWidth = 2;
      SA.circle(ctx, e.x, e.y, this.orbit); ctx.stroke();
      ctx.setLineDash([]);
      SA.drawBody(ctx, 'earth', e.x, e.y, e.r, { t, lx: -1, ly: 0 });
      SA.label(ctx, 'Earth', e.x, e.y + e.r + 20, 18, '#cfe6ff');

      // The Moon from above: its sun-facing (left) half is always lit.
      const m = this.moonPos(), mr = H * 0.05;
      const target = this.phase === 'play' ? ROUNDS[this.round] : null;
      if (target) {
        const ta = angleOf(target.p);
        const tx = e.x + Math.cos(ta) * this.orbit, ty = e.y + Math.sin(ta) * this.orbit;
        if (SA.easy()) {
          ctx.strokeStyle = 'rgba(255,224,102,' + (0.4 + 0.3 * Math.sin(t * 4)) + ')';
          ctx.lineWidth = 3;
          SA.circle(ctx, tx, ty, mr + 14); ctx.stroke();
        }
      }
      ctx.save();
      SA.circle(ctx, m.x, m.y, mr);
      ctx.fillStyle = '#2a2d45';
      ctx.fill();
      ctx.clip();
      ctx.fillStyle = '#f4f1e2';
      ctx.fillRect(m.x - mr, m.y - mr, mr, mr * 2);
      ctx.restore();
      ctx.strokeStyle = this.dragging ? '#ffe066' : 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 3;
      SA.circle(ctx, m.x, m.y, mr + 6); ctx.stroke();
      if (this.phase === 'play' && !this.dragging && !this.anim) {
        const hop = Math.abs(Math.sin(t * 3)) * 8;
        SA.emoji(ctx, '👆', m.x + mr + 18, m.y + mr + 18 + hop, 30);
      }
      // A line from Earth to the Moon shows which way we're looking.
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.setLineDash([3, 6]);
      ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(m.x, m.y); ctx.stroke();
      ctx.setLineDash([]);

      this.drawWindow(ctx, t, target);
      this.fx.draw(ctx);
    }

    // "What we see from Earth": a round window with the live Moon shape.
    drawWindow(ctx, t, target) {
      const v = this.view, p = this.current();
      ctx.fillStyle = 'rgba(10,12,40,0.85)';
      SA.circle(ctx, v.x, v.y, v.r + 18); ctx.fill();
      const ok = target && this.matches(target);
      ctx.strokeStyle = ok ? '#7ee08a' : '#8fa0ff';
      ctx.lineWidth = 6;
      SA.circle(ctx, v.x, v.y, v.r + 18); ctx.stroke();
      if (ok) {
        ctx.strokeStyle = '#7ee08a';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(v.x, v.y, v.r + 30, -Math.PI / 2, -Math.PI / 2 + TAU * (this.holdT / HOLD));
        ctx.stroke();
      }
      SA.drawMoonPhase(ctx, v.x, v.y, v.r, p);
      SA.label(ctx, '🔭 Seen from Earth', v.x, v.y - v.r - 44, 18, '#e8ecff');
      SA.label(ctx, phaseName(p), v.x, v.y + v.r + 44, 22, ok ? '#a8f0b8' : '#fff');
      if (target) {
        SA.label(ctx, 'Goal: ' + target.name + ' ' + target.emoji, v.x, v.y + v.r + 76, 18, '#ffe066');
      }
    }
  }
  SA.MoonScene = MoonScene;
})(window.SA);
