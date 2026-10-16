// Shy space critters. One hides in every mission and now and then peeks in from a screen edge,
// waving (only during play, never over the intro or Mission Complete). Tapping it finds it: it moves into Cosmo's Space Base. Nothing is lost by missing it;
// it simply peeks again a little later (and on the next visit).
(function (SA) {
  const FIRST = 12;   // seconds of play before the first peek
  const GAP = 18;     // seconds between peeks
  const SHOW = 7.5;   // how long each peek lasts (longer in Little Explorer mode)
  const SLIDE = 0.45; // seconds to slide in or out
  const SLOTS = [0.38, 0.56, 0.3, 0.68];
  // Mission moments that belong to the story, not to play: the intro, a chapter or round
  // cheer, a famous visitor, and Mission Complete. Critters stay hidden (and slip away) then.
  const QUIET = { intro: 1, cheer: 1, visit: 1, moon: 1, done: 1, move: 1, sleep: 1 };
  let sceneRef = null, wait = FIRST, showT = -1, showLen = SHOW, slot = 0, found = null;

  function missionId() {
    for (const id of SA.allMissions()) if (SA[id] && SA[id] === SA.scene) return id;
    return null;
  }
  const scale = () => 1.05;   // logical units: bigger on phones, like everything else

  // How far the critter has slid in (0 hidden, 1 fully peeking).
  function amount() {
    if (showT < 0) return 0;
    return SA.easeOut(Math.min(1, Math.min(showT, showLen - showT) / SLIDE));
  }
  // Where a critter peeks when the right edge is busy: [side, heights]. Belt: the cargo pods;
  // Mercury: the thermometer; Moon: the "Seen from Earth" window. Left-side peeks stay in the
  // upper half, because Cosmo's speech bubble covers the lower left on phones.
  // Comet: the right edge is where the ride starts and the meteor shower's sky is, so the upper left.
  // Space Station: the Cupola's day clock and "Hold to go faster" sign sit on the right edge at
  // mid height, so Floaty peeks above or below them.
  // Europa: the ice-depth meter runs down the right edge, so Glimmer peeks from the upper left.
  const SPOTS = { europa: ['left', [0.3, 0.46]], belt: ['left', [0.36, 0.5]], mercury: ['left', [0.3, 0.46]], moon: ['right', [0.86]], comet: ['left', [0.3, 0.44]], iss: ['right', [0.2, 0.84]] };
  function pos() {
    const k = amount(), s = scale(), spot = SPOTS[missionId()];
    const slots = spot ? spot[1] : SLOTS, left = !!spot && spot[0] === 'left';
    const y = slots[slot % slots.length] * SA.H;
    return left ? { x: -8 * s + k * 52 * s, y, s, dir: -1 } : { x: SA.W + 8 * s - k * 52 * s, y, s, dir: 1 };
  }

  SA.critters = {
    count: () => SA.CRITTERS.filter(c => SA.state.critters[c.id]).length,

    update(dt) {
      if (SA.scene !== sceneRef) { sceneRef = SA.scene; wait = FIRST; showT = -1; found = null; }
      if (found) { found.t += dt; if (found.t > 1.8) found = null; }
      const id = missionId();
      if (!id || !SA.CRITTER[id] || SA.state.critters[id]) { showT = -1; return; }
      // Time only passes while the child is playing (not during talks, panels or scene changes).
      if (SA.ui.blocking() || SA.transitioning) return;
      const quiet = !!(SA.scene && QUIET[SA.scene.phase]);
      if (showT >= 0) {
        // A story moment started: slide straight back out from wherever it is.
        if (quiet) showT = Math.max(showT, showLen - Math.min(showT, SLIDE));
        showT += dt;
        if (showT >= showLen) { showT = -1; wait = GAP; slot++; }
      } else if (!quiet) {
        wait -= dt;
        if (wait <= 0) { showT = 0; showLen = SA.easy() ? 10 : SHOW; SA.audio.play('squeak'); }
      }
    },

    // True if the tap found the critter (the mission then ignores the tap).
    tap(x, y) {
      const id = missionId();
      if (!id || showT < 0 || amount() < 0.3 || SA.state.critters[id]) return false;
      const p = pos();
      const reach = (SA.easy() ? 82 : 62) * p.s;
      if (Math.hypot(x - (p.x - 6 * p.s * p.dir), y - p.y) > reach) return false;
      const c = SA.CRITTER[id];
      SA.state.critters[id] = true;
      SA.state.baseNew = true;
      SA.save();
      found = { c, x: p.x - 10 * p.s * p.dir, y: p.y, s: p.s, t: 0, dir: p.dir };
      showT = -1;
      SA.audio.play('squeak');
      setTimeout(() => SA.audio.play('collect'), 120);
      SA.screenFx.spawn('sparkle', found.x, found.y, 22, { color: c.color });
      if (SA.critters.count() === SA.CRITTERS.length) {
        // The very last one: a reward is waiting in the sticker tray.
        SA.state.critterMedal = true;
        SA.save();
        SA.ui.toast('🐾 You found ' + c.name + '! That\'s ALL the critters! A 🏅 medal sticker is waiting at the base!');
        SA.celebrate(100);
      } else {
        SA.ui.toast('🐾 You found ' + c.name + '! ' + c.name + ' moved into Cosmo\'s base!');
      }
      return true;
    },

    draw(ctx) {
      const t = performance.now() / 1000;
      if (found) {
        // A happy hop up and away.
        const k = found.t / 1.8;
        const hop = Math.sin(Math.min(1, k * 1.6) * Math.PI) * 90 * found.s;
        ctx.save();
        ctx.globalAlpha = 1 - Math.max(0, (k - 0.6) / 0.4);
        SA.drawCritter(ctx, found.x - k * 60 * found.s * found.dir, found.y - hop, found.s * 1.15, found.c, { t, mood: 'joy' });
        ctx.restore();
      }
      if (showT < 0 || SA.ui.blocking()) return;
      const id = missionId();
      if (!id) return;
      const c = SA.CRITTER[id], p = pos();
      // A soft glow so the critter is easy to spot on any background.
      const glow = ctx.createRadialGradient(p.x, p.y, 10 * p.s, p.x, p.y, 70 * p.s);
      glow.addColorStop(0, SA.rgba('#fff6c8', 0.35 * amount()));
      glow.addColorStop(1, 'rgba(255,246,200,0)');
      ctx.fillStyle = glow;
      SA.circle(ctx, p.x, p.y, 70 * p.s);
      ctx.fill();
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(p.dir, 1);   // mirrored when peeking from the left
      ctx.rotate(-0.35 + Math.sin(t * 3) * 0.08);
      SA.drawCritter(ctx, 0, 0, p.s, c, { t, look: [-1, -0.2] });
      ctx.restore();
      // Little twinkles around it while it peeks (steady, not blinking, with Calm effects).
      if (amount() > 0.9 && (SA.calm() || Math.floor(t * 2) % 2 === 0)) {
        ctx.fillStyle = '#fff6c8';
        SA.starPath(ctx, p.x - 44 * p.s * p.dir, p.y - 34 * p.s, 7 * p.s, 0.35, 4, t);
        ctx.fill();
        SA.starPath(ctx, p.x - 30 * p.s * p.dir, p.y + 36 * p.s, 5 * p.s, 0.35, 4, -t);
        ctx.fill();
      }
    },
  };
})(window.SA);
