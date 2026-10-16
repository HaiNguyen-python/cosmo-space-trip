// Postcards from home: a gentle story thread about Cosmo's family on Planet Zoop (a pretend planet,
// far, far away). As the child explores, five space postcards arrive at the radar dish of Cosmo's
// Space Base. Each one is a short cutscene: a message capsule zooms in, a hologram of a family
// member says hello, and the child picks a fact card for Cosmo to tell them about in his reply
// (so every postcard is also a chance to say a real space fact out loud). In the last one, the whole
// family flies in for a visit and Grandma brings a knitted hat. Nothing can be missed or lost: a
// postcard simply waits at the dish until it is read.
(function (SA) {
  const TAU = Math.PI * 2;
  const $ = id => document.getElementById(id);
  const and = list => list.join(', ').replace(/, ([^,]*)$/, ' and $1');
  const doneCount = () => SA.allMissions().filter(id => SA.state.done[id]).length;

  // The family, in Cosmo's shape and their own colours.
  const FAMILY = {
    dot: { name: 'Dot', s: 0.78, o: { hat: 'none', bow: '#8f5bff', skin: { hi: '#ffe0f0', mid: '#ff9fd0', lo: '#e06aa8', line: '#b8467e', limbHi: '#ff9fd0', limbLo: '#e06aa8', belly: 'rgba(255,240,248,0.75)', rim: 'rgba(255,220,240,0.55)', stalk: '#b8467e', freckle: 'rgba(184,70,126,0.35)' } } },
    grandma: { name: 'Grandma Zola', s: 1, o: { hat: 'beanie', glasses: true, skin: { hi: '#efe6ff', mid: '#b9a2f0', lo: '#8a70d0', line: '#6b4fb0', limbHi: '#b9a2f0', limbLo: '#8a70d0', belly: 'rgba(245,240,255,0.75)', rim: 'rgba(235,225,255,0.55)', stalk: '#6b4fb0', freckle: 'rgba(107,79,176,0.35)' } } },
    papa: { name: 'Papa Ziggy', s: 1.08, o: { hat: 'none', tache: '#2f5f9a', skin: { hi: '#d8ecff', mid: '#7fb8f0', lo: '#4f88d0', line: '#2f5f9a', limbHi: '#7fb8f0', limbLo: '#4f88d0', belly: 'rgba(235,245,255,0.75)', rim: 'rgba(220,235,255,0.55)', stalk: '#2f5f9a', freckle: 'rgba(47,95,154,0.35)' } } },
  };
  const WUZZLE = { id: 'wuzzle', name: 'Wuzzle', color: '#ffb86b', eyes: 2, feature: 'ears' };

  // The five postcards: when each arrives, who sends it, what it says, and how Cosmo replies.
  // letter: the family's own words (kept for re-reading in the Space Journal).
  const CHAPTERS = [
    { from: ['dot'], when: () => !!SA.state.done.earth,
      letter: 'Dear Cosmo, did you find a planet with water yet? I drew you a picture of Planet Zoop! Love, Dot. P.S. Wuzzle chewed your slippers again!',
      lines: ['A space postcard from my little sister, Dot! 💌 Let me read it to you...',
        '"Dear Cosmo, did you find a planet with water yet? I drew you a picture of Planet Zoop! Love, Dot. P.S. Wuzzle chewed your slippers again!" 🐾',
        'Let\'s write back to Dot! Pick a card, and I\'ll tell her about that place. 🎴'],
      reply: (b, f) => 'Dear Dot, my best friend and I explored ' + b + '! ' + f + ' Love, Cosmo. 💚' },
    { from: ['grandma'], when: () => SA.MISSIONS.filter(id => SA.state.done[id]).length >= 3,
      letter: 'My dear Cosmo, are you wearing your scarf? Space is chilly! Grandpa wants to know: what is the most amazing place you have seen? I am knitting you a surprise! Hugs, Grandma.',
      lines: ['Ooh, a postcard from Grandma Zola! 👵💌',
        '"My dear Cosmo, are you wearing your scarf? Space is chilly! Grandpa wants to know: what is the most amazing place you have seen? I am knitting you a surprise! Hugs, Grandma."',
        'What should we tell Grandma about? Pick a card! 🎴'],
      reply: (b, f) => 'Dear Grandma, the most amazing place? ' + b + '! ' + f + ' And yes, I\'m wearing my scarf! Love, Cosmo. 🧣' },
    { from: ['papa', 'wuzzle'], when: () => !!SA.state.done.saturn,
      letter: 'Woof woof! That means Wuzzle misses you! Cosmo, have you made any new friends out there? Papa.',
      lines: ['Beep beep! A hologram from Papa Ziggy... and Wuzzle, our fluffy space pet! 🐾',
        '"Woof woof! That means Wuzzle misses you! Cosmo, have you made any new friends out there? Papa."'],
      crit: true },
    { from: ['dot', 'grandma', 'papa'], when: () => !!SA.state.tourDone,
      letter: 'We looked through our big telescope and saw your Sun, a tiny yellow star far, far away! Which planet was your favourite? Love from all of us!',
      lines: ['A postcard from my whole family! 💌',
        '"We looked through our big telescope and saw your Sun, a tiny yellow star far, far away! Which planet was your favourite? Love from all of us!"',
        'Pick your favourite card, and I\'ll tell them! 🎴'],
      reply: (b, f) => 'Dear everyone, our favourite was ' + b + '! ' + f + ' I wish you could see it too! Love, Cosmo. 🌟' },
    { from: ['dot', 'grandma', 'papa', 'wuzzle'], when: () => !!SA.state.tourDone && doneCount() >= 12,
      letter: 'WE\'RE COMING TO VISIT! Love, Dot, Grandma, Papa and Wuzzle.',
      lines: ['Beep beep beep! This postcard says... "WE\'RE COMING TO VISIT!" 😲', 'Look! Here they come! 🛸'],
      visit: true },
  ];
  const critLine = () => {
    const found = SA.CRITTERS.filter(c => SA.state.critters[c.id]).map(c => c.name);
    return found.length
      ? 'Dear Papa and Wuzzle, I have ' + found.length + ' critter friend' + (found.length > 1 ? 's' : '') + ' now: ' + and(found.slice(0, 5)) + (found.length > 5 ? ', and more' : '') + '! And my very best friend is right here, exploring with me! 💚'
      : 'Dear Papa and Wuzzle, I haven\'t found any shy critters yet, but my best friend is right here, exploring with me! We\'ll keep looking! 💚';
  };

  SA.story = {
    count: CHAPTERS.length,
    // True when a postcard has just arrived (and marks it as waiting at the dish).
    check() {
      const st = SA.state;
      if (st.storyNew > st.story || st.story >= CHAPTERS.length) return false;
      if (!CHAPTERS[st.story].when()) return false;
      // One postcard per new mission finished, so they never arrive in a pile.
      if (st.story > 0 && doneCount() <= st.storyAt) return false;
      st.storyNew = st.story + 1;
      st.baseNew = true;
      SA.save();
      return true;
    },
    waiting: () => SA.state.storyNew > SA.state.story,
    // A postcard that has been read, for its page in the Space Journal (n is 0-based).
    page(n) {
      const C = CHAPTERS[n];
      if (!C) return null;
      const r = SA.state.replies[n];
      let reply = null;
      if (C.visit) reply = 'Then the whole family landed for a visit, and Grandma brought me a knitted hat! 🧶';
      else if (C.crit) reply = critLine();
      else if (r && SA.BODY[r] && C.reply) reply = C.reply(SA.BODY[r].name.replace(/^The /, 'the '), SA.BODY[r].facts[0]);
      return { from: C.from, names: C.from.map(k => (FAMILY[k] || WUZZLE).name), letter: C.letter, reply };
    },
    // The family, drawn for the hologram and the journal pages.
    drawMember(ctx, k, x, y, s, t, o) {
      if (k === 'wuzzle') SA.drawCritter(ctx, x, y + 20 * s, s * 0.8, WUZZLE, Object.assign({ t }, o));
      else { const f = FAMILY[k]; SA.drawCosmo(ctx, x, y, f.s * s, Object.assign({ t, noBob: true }, f.o, o)); }
    },
  };

  // Planet Zoop: a pink, bubbly world with a ring of floating bubbles (pretend, like Cosmo).
  SA.drawZoop = function (ctx, x, y, r, o) {
    const t = (o && o.t) || 0;
    const ring = front => {
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * TAU + t * 0.3, sx = Math.cos(a) * r * 1.55, sy = Math.sin(a) * r * 0.42;
        if ((Math.sin(a) > 0) !== front) continue;
        ctx.fillStyle = 'rgba(190,240,255,0.7)';
        SA.circle(ctx, x + sx, y + sy - r * 0.05, r * (0.1 + (i % 3) * 0.03)); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        SA.circle(ctx, x + sx - r * 0.03, y + sy - r * 0.08, r * 0.03); ctx.fill();
      }
    };
    ring(false);
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    g.addColorStop(0, '#ffd0ef'); g.addColorStop(0.6, '#e070c0'); g.addColorStop(1, '#8a3a9a');
    ctx.fillStyle = g;
    SA.circle(ctx, x, y, r); ctx.fill();
    ctx.save();
    SA.circle(ctx, x, y, r); ctx.clip();
    ctx.fillStyle = 'rgba(110,230,210,0.55)';
    for (const [dx, dy, s] of [[-0.4, 0.1, 0.28], [0.3, -0.35, 0.22], [0.25, 0.45, 0.3], [-0.1, -0.55, 0.14]]) { SA.circle(ctx, x + dx * r, y + dy * r, s * r); ctx.fill(); }
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    SA.ellipse(ctx, x - r * 0.38, y - r * 0.42, r * 0.22, r * 0.12, -0.6); ctx.fill();
    ring(true);
  };

  class PostcardScene {
    constructor() {
      this.stars = new SA.Starfield(220, 919);
      this.fx = new SA.Particles();
      this.t = 0;
    }
    layout() {
      const W = SA.W, H = SA.H;
      this.zoop = { x: W * 0.16, y: H * 0.28, r: H * 0.1 };
      this.holo = { x: W * 0.48, y: H * 0.47, w: Math.min(W * 0.44, 560), h: H * 0.48 };
      this.ground = H * 0.86;
      this.cosmo = { x: W * 0.84, y: this.ground - 52 };
    }
    resize() { this.layout(); }

    enter() {
      SA.ui.setScene('toy');
      SA.audio.music('story');
      this.layout();
      $('btnToyBack').textContent = '🏠 Base';
      $('toyPick').innerHTML = '';
      SA.ui.setInfo('💌 Postcard from home');
      this.ch = SA.state.story;   // which postcard (0-based)
      this.C = CHAPTERS[this.ch] || CHAPTERS[CHAPTERS.length - 1];
      this.phase = 'arrive';
      this.cap = 0;         // the capsule's trip (0 at Zoop .. 1 here)
      this.holoA = 0;
      this.picks = null;
      this.visitT = -1;
      this.sent = -1;
      SA.audio.play('ping');
      SA.ui.hint('Beep beep! 📡 A message capsule from Planet Zoop is on its way! 💌', 0);
    }
    exit() { SA.ui.hideTalk(); }
    back() { SA.go(SA.base, {}); }

    onDown(x, y) {
      if (this.phase === 'arrive' && this.cap > 0.3) { this.cap = 1; return; }
      if (this.phase === 'pick' && this.picks) {
        const p = this.picks.find(c => Math.hypot(x - c.x, y - c.y) < c.r + 18);
        if (p) this.choose(p.id);
      }
    }

    open() {
      this.phase = 'read';
      SA.audio.play('card');
      this.fx.spawn('sparkle', this.holo.x, this.holo.y, 18, { color: '#bff4ff' });
      if (this.C.visit) { this.visitT = 0; this.phase = 'visit'; }
      SA.ui.say(this.C.lines).then(() => {
        if (SA.scene !== this) return;
        if (this.C.visit) this.visitParty();
        else if (this.C.crit) this.critReply();
        else this.askPick();
      });
    }

    askPick() {
      // Up to four collected cards (Jupiter or Saturn first, they make great stories).
      const have = SA.BODIES.filter(b => SA.state.cards[b.id] && b.facts).map(b => b.id);
      const pref = have.filter(id => id === 'jupiter' || id === 'saturn' || id === SA.state.at);
      const rest = have.filter(id => pref.indexOf(id) < 0).sort(() => Math.random() - 0.5);
      const ids = pref.concat(rest).slice(0, 4).sort(() => Math.random() - 0.5);
      if (!ids.length) ids.push('earth');
      const W = SA.W, H = SA.H, gap = Math.min(170, W * 0.13);
      this.picks = ids.map((id, i) => ({ id, x: this.holo.x + (i - (ids.length - 1) / 2) * gap, y: H * 0.5, r: Math.min(56, gap * 0.36) }));
      this.phase = 'pick';
      SA.ui.hint('Tap a card to tell them about it! 🎴', 0);
    }

    choose(id) {
      const b = SA.BODY[id];
      this.phase = 'reply';
      this.picks = null;
      SA.audio.play('collect');
      SA.state.replies[this.ch] = id;   // kept, so the reply can be re-read in the Space Journal
      SA.save();
      const line = this.C.reply(b.name.replace(/^The /, 'the '), b.facts[0]);
      SA.ui.say([line]).then(() => { if (SA.scene === this) this.send(); });
    }

    critReply() {
      const line = critLine();
      this.phase = 'reply';
      SA.ui.say([line]).then(() => { if (SA.scene === this) this.send(); });
    }

    // The reply capsule zooms back to Planet Zoop.
    send() {
      this.phase = 'send';
      this.sent = 0;
      SA.audio.play('launch');
      this.finishChapter();
    }
    finishChapter() {
      const st = SA.state, first = st.story < this.ch + 1;
      st.story = Math.max(st.story, this.ch + 1);
      st.storyNew = 0;
      st.storyAt = doneCount();
      if (first && (this.ch === 0 || this.C.visit)) st.baseNew = true;   // a new sticker
      SA.save();
    }

    // The last postcard: the family lands for a visit.
    async visitParty() {
      this.phase = 'party';
      SA.audio.play('cheer');
      SA.celebrate(120);
      for (const k of ['dot', 'grandma', 'papa']) this.fx.spawn('sparkle', this.memberX(k), this.ground - 60, 12, { color: '#ffd0ef' });
      await SA.ui.say([
        'Everybody\'s here! Hi, Dot! Hi, Grandma! Hi, Papa! Hi, Wuzzle! 🤗',
        'Dot says: "Thank you for showing my big brother all the planets!" 💜',
        'And Grandma made something for you... a knitted hat! 🧶 Find Grandma\'s hat in my Wardrobe 🎩, and a Planet Zoop sticker for my base! 🏡',
        'Thank you for being my best space friend. Now, let\'s keep exploring! 🚀',
      ]);
      if (SA.scene !== this) return;
      this.finishChapter();
      SA.state.wardNew = true;
      SA.save();
      SA.go(SA.base, {});
    }
    memberX(k) { const order = ['dot', 'grandma', 'papa', 'wuzzle']; return SA.W * 0.3 + order.indexOf(k) * SA.W * 0.11; }

    update(dt) {
      this.t += dt;
      this.fx.update(dt);
      if (this.phase === 'arrive') {
        this.cap = Math.min(1, this.cap + dt * 0.55);
        if (this.cap >= 1) { SA.ui.hideTalk(); this.open(); }
      }
      this.holoA = SA.clamp(this.holoA + (this.phase !== 'arrive' && this.phase !== 'visit' && this.phase !== 'party' ? dt : -dt) * 2.5, 0, 1);
      if (this.visitT >= 0) this.visitT += dt;
      if (this.sent >= 0) {
        this.sent += dt * 0.6;
        if (this.sent >= 1 && this.phase === 'send') {
          this.phase = 'done';
          SA.audio.play('ding');
          this.fx.spawn('sparkle', this.zoop.x, this.zoop.y, 16, { color: '#ffd0ef' });
          SA.ui.say(['Sent! 💌 My family will love it. Thank you for helping me write back! I\'ll keep their postcard in our Space Journal 📔, so we can read it again.']).then(() => { if (SA.scene === this) SA.go(SA.base, {}); });
        }
      }
    }

    capsulePos(u) {
      const z = this.zoop, h = this.holo;
      const x = SA.lerp(z.x, h.x, u), y = SA.lerp(z.y, h.y, u) - Math.sin(u * Math.PI) * SA.H * 0.12;
      return { x, y };
    }

    draw(ctx) {
      const W = SA.W, H = SA.H, t = this.t;
      SA.spaceBg(ctx, '#140b36', '#3a1550');
      SA.nebula(ctx, t, [{ x: 0.2, y: 0.3, r: 360, c: 'rgba(220,90,190,0.2)' }, { x: 0.8, y: 0.7, r: 320, c: 'rgba(60,140,230,0.16)' }]);
      this.stars.draw(ctx, t, 0);
      SA.drawZoop(ctx, this.zoop.x, this.zoop.y, this.zoop.r, { t });
      SA.label(ctx, 'Planet Zoop', this.zoop.x, this.zoop.y + this.zoop.r * 1.6 + 6, 16, '#ffd0ef');
      // The ground of Cosmo's base, for the family's visit.
      const g = ctx.createLinearGradient(0, this.ground, 0, H);
      g.addColorStop(0, '#8f82bd'); g.addColorStop(1, '#3f3670');
      ctx.fillStyle = g;
      ctx.fillRect(0, this.ground, W, H - this.ground);
      // Incoming capsule with a sparkly trail, and the reply going home.
      if (this.phase === 'arrive') this.drawCapsule(ctx, this.capsulePos(this.cap), t, 1);
      if (this.sent >= 0 && this.sent < 1) this.drawCapsule(ctx, this.capsulePos(1 - this.sent), t, 1 - this.sent * 0.5);
      if (this.holoA > 0) this.drawHolo(ctx, t);
      if (this.visitT >= 0) this.drawVisit(ctx, t);
      if (this.picks) this.drawPicks(ctx, t);
      SA.drawCosmo(ctx, this.cosmo.x, this.cosmo.y, 1.15, { t, mood: this.phase === 'party' || this.phase === 'done' ? 'joy' : this.phase === 'arrive' ? 'wow' : null, wave: this.phase === 'party' });
      this.fx.draw(ctx);
    }

    drawCapsule(ctx, p, t, s) {
      if (!SA.calm() || Math.random() < 0.5) this.fx.list.push({ kind: 'sparkle', x: p.x, y: p.y, vx: SA.rand(-20, 20), vy: SA.rand(-20, 20), life: 0, max: 0.6, size: 4, rot: 0, color: '#ffd0ef' });
      const glow = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, 40 * s);
      glow.addColorStop(0, 'rgba(255,200,240,0.6)'); glow.addColorStop(1, 'rgba(255,200,240,0)');
      ctx.fillStyle = glow; SA.circle(ctx, p.x, p.y, 40 * s); ctx.fill();
      SA.icon(ctx, 'postcard', p.x, p.y + Math.sin(t * 6) * 3, 56 * s);
    }

    // The hologram: a glowing screen showing who sent the postcard.
    drawHolo(ctx, t) {
      const h = this.holo, a = this.holoA, calm = SA.calm();
      ctx.save();
      ctx.globalAlpha = a;
      const x0 = h.x - h.w / 2, y0 = h.y - h.h / 2;
      ctx.fillStyle = 'rgba(80,200,255,0.14)';
      SA.rrect(ctx, x0, y0, h.w, h.h, 24); ctx.fill();
      ctx.strokeStyle = 'rgba(150,230,255,0.85)'; ctx.lineWidth = 3; ctx.stroke();
      // A light beam up from the dish below.
      ctx.fillStyle = 'rgba(120,220,255,0.08)';
      ctx.beginPath(); ctx.moveTo(h.x - 40, this.ground); ctx.lineTo(x0 + 20, y0 + h.h); ctx.lineTo(x0 + h.w - 20, y0 + h.h); ctx.lineTo(h.x + 40, this.ground); ctx.closePath(); ctx.fill();
      ctx.save();
      SA.rrect(ctx, x0, y0, h.w, h.h, 24); ctx.clip();
      if (!this.picks) {
        const from = this.C.from, n = from.length;
        from.forEach((k, i) => {
          const x = h.x + (i - (n - 1) / 2) * Math.min(150, h.w / n), y = y0 + h.h * 0.62;
          if (k === 'wuzzle') SA.drawCritter(ctx, x, y + 20, Math.min(1.9, h.h / 190) * (n > 2 ? 0.6 : 0.8), WUZZLE, { t, mood: Math.sin(t * 2) > 0 ? 'joy' : null });
          else { const f = FAMILY[k]; SA.drawCosmo(ctx, x, y, f.s * Math.min(1.9, h.h / 190) * (n > 2 ? 0.62 : n > 1 ? 0.8 : 1), Object.assign({ t: t + i, wave: i === 0 }, f.o)); }
        });
      }
      // Hologram scan lines (still, with Calm effects).
      ctx.fillStyle = 'rgba(160,235,255,0.08)';
      const off = calm ? 0 : (t * 30) % 8;
      for (let y = y0 + off; y < y0 + h.h; y += 8) ctx.fillRect(x0, y, h.w, 3);
      ctx.restore();
      if (!this.picks) SA.label(ctx, this.C.from.map(k => (FAMILY[k] || WUZZLE).name).join(' · '), h.x, y0 + 26, 17, '#dff6ff');
      ctx.restore();
    }

    drawPicks(ctx, t) {
      for (const p of this.picks) {
        const bob = Math.sin(t * 3 + p.x) * 4;
        ctx.fillStyle = 'rgba(255,255,255,0.14)';
        SA.rrect(ctx, p.x - p.r * 1.2, p.y - p.r * 1.3 + bob, p.r * 2.4, p.r * 3, 16); ctx.fill();
        ctx.strokeStyle = 'rgba(255,240,180,0.8)'; ctx.lineWidth = 2.5; ctx.stroke();
        SA.drawBody(ctx, p.id, p.x, p.y - p.r * 0.2 + bob, p.r * (p.id === 'saturn' ? 0.6 : 0.8), { t });
        SA.label(ctx, SA.BODY[p.id].name.replace(/^The /, ''), p.x, p.y + p.r * 1.2 + bob, 16, '#fff');
      }
    }

    // The family's saucer lands, and out they hop.
    drawVisit(ctx, t) {
      const u = SA.easeOut(Math.min(1, this.visitT / 2.2)), W = SA.W;
      const sx = W * 0.45, sy = SA.lerp(-80, this.ground - 150, u);
      SA.icon(ctx, 'saucer', sx, sy + Math.sin(t * 2) * 4, 170);
      if (this.visitT > 2.4) {
        const k = SA.clamp((this.visitT - 2.4) / 0.8, 0, 1);
        for (const key of ['dot', 'grandma', 'papa', 'wuzzle']) {
          const x = SA.lerp(sx, this.memberX(key), k), hop = Math.abs(Math.sin(t * 4 + x)) * (this.phase === 'party' ? 14 : 0);
          if (key === 'wuzzle') SA.drawCritter(ctx, x, this.ground - 28 - hop, 0.85, WUZZLE, { t, mood: 'joy' });
          else { const f = FAMILY[key]; SA.drawCosmo(ctx, x, this.ground - 46 * f.s - hop, f.s, Object.assign({ t: t + x, mood: this.phase === 'party' ? 'joy' : null }, f.o)); }
        }
      }
    }
  }
  SA.PostcardScene = PostcardScene;
})(window.SA);
