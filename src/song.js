// The Planet Song and the Moon Song (🎤 on the map, then 🎵 or 🌙): sing-alongs with music made on
// the device. The Moon Song is a slower lullaby about the Moon's shapes, with the big Moon gliding
// through its phases as each verse is sung (a crescent Moon sticker the first time). Cosmo sings
// (reads aloud) each line while a bouncing star hops from word to word, karaoke style, and the
// planet of each verse bounces to the beat. Tapping anywhere plays twinkly notes that always fit
// the music. "You sing" mode turns Cosmo's voice off so the child can sing the words. Nothing to win
// or lose: it's a song. Singing it all the way through once unlocks a microphone sticker.
(function (SA) {
  const TAU = Math.PI * 2;
  const $ = id => document.getElementById(id);
  const COUNT_IN = 8;      // eighth notes of "one, two, three, four" before the first line
  const LINE = 16;         // eighth notes per line (two bars)

  // Chords (C major): a low root for the bass and the tones the melody may use.
  const CH = {
    C: { root: 48, tones: [72, 76, 79, 84] }, G: { root: 43, tones: [71, 74, 79, 83] }, Am: { root: 45, tones: [72, 76, 81, 84] },
    F: { root: 41, tones: [72, 77, 81, 84] }, Em: { root: 40, tones: [71, 76, 79, 83] }, Dm: { root: 50, tones: [74, 77, 81, 86] },
  };
  const VERSE = [['C', 'Am'], ['F', 'G']], CHORUS = [['F', 'C'], ['Dm', 'G']], LAST = [['F', 'C'], ['G', 'C']];
  // The Moon Song is a gentler lullaby with its own chords.
  const M_VERSE = [['Am', 'F'], ['C', 'G']], M_CHORUS = [['F', 'G'], ['Em', 'Am']], M_LAST = [['F', 'G'], ['C', 'C']];
  // Cosmo's original lyrics: a chorus, then a verse for each planet in order from the Sun.
  const PLANET_SONG = [
    { p: 'sun', ch: CHORUS, lines: ['Round and round the Sun we go,', 'Eight planets spinning, row by row!'] },
    { p: 'mercury', ch: VERSE, lines: ['Mercury is small and fast,', 'Closest to the Sun, it whizzes past!'] },
    { p: 'venus', ch: VERSE, lines: ['Venus is the hottest one,', 'Thick clouds trap the heat of the Sun!'] },
    { p: 'earth', ch: VERSE, lines: ['Earth is home for me and you,', 'With lots of water, green and blue!'] },
    { p: 'mars', ch: VERSE, lines: ['Mars is red with rusty dust,', 'Jump up high on Mars, you must!'] },
    { p: 'belt', ch: CHORUS, lines: ['Round and round the Sun we go,', 'Past the asteroid belt, let\'s go!'] },
    { p: 'jupiter', ch: VERSE, lines: ['Jupiter\'s the biggest, wow!', 'Its Great Red Spot is swirling now!'] },
    { p: 'saturn', ch: VERSE, lines: ['Saturn\'s rings are made of ice,', 'It could float in a bath, how nice!'] },
    { p: 'uranus', ch: VERSE, lines: ['Uranus rolls along its side,', 'A sideways planet, what a ride!'] },
    { p: 'neptune', ch: VERSE, lines: ['Neptune\'s far and cold and blue,', 'With the fastest winds, it\'s true!'] },
    { p: 'sun', ch: LAST, lines: ['Round and round the Sun we go,', 'Now you know them all! Bravo!'] },
  ];
  // The Moon Song: the Moon's shapes in order, as seen from Earth. ph: the phase shown
  // (0 new, 0.25 first quarter, 0.5 full, 0.75 last quarter); a chorus shows the Moon slowly turning.
  const MOON_SONG = [
    { ph: null, ch: M_CHORUS, lines: ['Moon, oh Moon, up in the night,', 'You change your shape, but shine so bright!'] },
    { ph: 0, name: 'New Moon', ch: M_VERSE, lines: ['New Moon is hiding, dark and shy,', 'Its sunny side looks away, oh my!'] },
    { ph: 0.14, name: 'Crescent', ch: M_VERSE, lines: ['Then a crescent, thin and bright,', 'Like a smile up in the night!'] },
    { ph: 0.25, name: 'First Quarter', ch: M_VERSE, lines: ['First Quarter: half is lit,', 'Watch it grow a little bit!'] },
    { ph: 0.37, name: 'Gibbous', ch: M_VERSE, lines: ['Gibbous Moon is nearly round,', 'Growing bigger, safe and sound!'] },
    { ph: 0.5, name: 'Full Moon', ch: M_VERSE, lines: ['Full Moon, full Moon, big and round,', 'Its whole bright face is shining down!'] },
    { ph: null, ch: M_CHORUS, lines: ['Moon, oh Moon, up in the night,', 'You have no light, you shine with sunlight!'] },
    { ph: 0.63, name: 'Gibbous', ch: M_VERSE, lines: ['Then it shrinks, night after night,', 'Waning slowly out of sight!'] },
    { ph: 0.75, name: 'Last Quarter', ch: M_VERSE, lines: ['Last Quarter: half again,', 'The other half is lit by then!'] },
    { ph: 0.86, name: 'Crescent', ch: M_VERSE, lines: ['Crescent Moon at early dawn,', 'A few more days and then it\'s gone!'] },
    { ph: 1, name: 'New Moon', ch: M_VERSE, lines: ['About a month to go around,', 'And then a new Moon can be found!'] },
    { ph: null, ch: M_LAST, lines: ['Moon, oh Moon, up in the night,', 'Goodnight, Moon! Sleep tight tonight!'] },
  ];
  const PLANETS = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
  const PHASES = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875];

  // Each line's tune: syllables spread over the first 14 eighths, the melody stepping between chord
  // tones in a pattern seeded by the words (so the chorus sings the same tune every time).
  const syllables = w => Math.max(1, (w.toLowerCase().replace(/[^a-z]/g, '').replace(/e$/, '').match(/[aeiouy]+/g) || []).length);
  function makeSong(verses, opts) {
    const lines = [];
    verses.forEach((v, vi) => v.lines.forEach((text, li) => lines.push({ text, p: v.p, ph: v.ph, name: v.name, verse: vi, ch: v.ch[li] })));
    lines.forEach(tune);
    return Object.assign({ verses, lines, total: COUNT_IN + lines.length * LINE }, opts);
  }
  function tune(L) {
    const words = L.text.split(' ');
    const syl = [];
    words.forEach((w, wi) => { for (let k = 0; k < syllables(w); k++) syl.push(wi); });
    const S = syl.length, rnd = SA.seeded([...L.text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 100003, 7));
    let idx = 1;
    L.notes = syl.map((wi, k) => {
      const at = Math.min(13, Math.round((k * 14) / S));
      const chord = CH[L.ch[at < 8 ? 0 : 1]];
      if (k === S - 1) idx = 0;
      else idx = SA.clamp(idx + (rnd() < 0.5 ? -1 : 1) * (rnd() < 0.7 ? 1 : 0), 0, chord.tones.length - 1);
      return { at, m: chord.tones[idx], word: wi, len: k === S - 1 ? 16 - at - 1 : 1 };
    });
    for (let k = 0; k < S - 1; k++) L.notes[k].len = Math.max(1, L.notes[k + 1].at - L.notes[k].at);
    L.words = words;
    L.wordAt = words.map((w, wi) => L.notes.find(n => n.word === wi).at);
  }
  const SONGS = {
    planets: makeSong(PLANET_SONG, { id: 'planets', title: 'The Planet Song', icon: '🎵', bpm: 96, easyBpm: 84 }),
    moon: makeSong(MOON_SONG, { id: 'moon', title: 'The Moon Song', icon: '🌙', bpm: 84, easyBpm: 74, soft: true }),
  };

  class SongScene {
    constructor() {
      this.t = 0;
      this.fx = new SA.Particles();
      this.stars = new SA.Starfield(200, 77);
      this.mode = 'cosmo';
      this.S = SONGS.planets;
      this.moonP = 0;
    }

    eighth() { return 60 / (SA.easy() ? this.S.easyBpm : this.S.bpm) / 2; }
    resize() { this.hudY = SA.ui.toyTop(); }

    // opts.song: 'planets' (the Planet Song) or 'moon' (the Moon Song).
    enter(opts) {
      this.S = SONGS[(opts && opts.song) || 'planets'] || SONGS.planets;
      const moon = this.S.id === 'moon';
      SA.ui.setScene('toy');
      SA.audio.music(null);
      $('btnToyBack').textContent = '🗺️ Map';
      this.buildButtons();
      SA.ui.setInfo(this.S.icon + ' ' + this.S.title);
      this.hudY = SA.ui.toyTop();
      this.playing = false;
      this.done = false;
      this.pos = 0;           // song position in eighth notes
      this.spoken = -1;       // the last line Cosmo sang
      this.bump = 0;
      this.planetPop = 0;
      this.cosmoSpin = 0;
      const lines = moon ? (SA.state.moonSongDone ? ['Ready to sing the Moon Song? 🌙 Here we go!'] : [
        'Let\'s sing the Moon Song! 🌙 It\'s about all the shapes the Moon makes in the sky.',
        'Watch the Moon change as we sing. Then look for its shape tonight, with a grown-up! ⭐',
      ]) : SA.state.songSeen ? ['Ready to sing the Planet Song? 🎵 Here we go!'] : [
        'Let\'s sing the Planet Song! 🎵 It has a verse for every planet.',
        'Watch the bouncing star, and sing along with me! ⭐ Tap anywhere to play twinkly notes with the music.',
      ];
      SA.ui.say(lines).then(() => {
        if (SA.scene !== this) return;
        SA.state.songSeen = true;
        SA.save();
        this.start(0);
      });
    }
    exit() { SA.ui.hideTalk(); this.playing = false; SA.voice.stop(); }
    back() { SA.go(SA.map, {}); }

    buildButtons() {
      const pick = $('toyPick');
      pick.innerHTML =
        '<button class="round-btn toy-btn" data-a="prev" aria-label="Verse before">⏮</button>' +
        '<button class="round-btn toy-btn" data-a="play" aria-label="Play or pause">⏸</button>' +
        '<button class="round-btn toy-btn" data-a="next" aria-label="Next verse">⏭</button>' +
        '<span class="sep"></span>' +
        '<button class="round-btn toy-btn' + (this.mode === 'you' ? ' on' : '') + '" data-a="mode" aria-label="Who sings: Cosmo or you">' + (this.mode === 'you' ? '🎤' : '🗣️') + '</button>';
      pick.querySelectorAll('button').forEach(b => {
        b.onclick = () => { if (SA.scene === this && !SA.ui.blocking() && !SA.transitioning) this.button(b.dataset.a); };
      });
    }
    setPlayIcon() {
      const b = $('toyPick').querySelector('[data-a="play"]');
      if (b) b.textContent = this.playing ? '⏸' : '▶';
    }

    button(a) {
      SA.audio.play('click');
      if (a === 'play') {
        if (this.playing) { this.playing = false; SA.voice.stop(); }
        else this.start(this.done ? 0 : this.pos);
      } else if (a === 'mode') {
        this.mode = this.mode === 'you' ? 'cosmo' : 'you';
        this.buildButtons();
        this.setPlayIcon();
        SA.ui.toast(this.mode === 'you' ? '🎤 Your turn! You sing the words.' : '🗣️ Cosmo sings with you!');
        if (this.mode === 'you') SA.voice.stop();
      } else {
        // Jump to the verse before or after (a chorus counts as a verse).
        const cur = this.lineAt(this.pos);
        const v = cur < 0 ? 0 : this.S.lines[cur].verse;
        const to = SA.clamp(v + (a === 'next' ? 1 : (this.pos - this.verseStart(v) > LINE ? 0 : -1)), 0, this.S.verses.length - 1);
        this.start(this.verseStart(to));
      }
      this.setPlayIcon();
    }
    verseStart(v) { return COUNT_IN + this.S.lines.findIndex(L => L.verse === v) * LINE; }
    lineAt(pos) { return pos < COUNT_IN ? -1 : Math.min(this.S.lines.length - 1, Math.floor((pos - COUNT_IN) / LINE)); }

    // Starts (or resumes) the song at a position in eighth notes.
    start(pos) {
      this.done = false;
      this.playing = true;
      this.pos = pos;
      this.next = Math.ceil(pos - 1e-6);   // next eighth to schedule
      // Sing the line we start on, unless we're resuming from the middle of it.
      const li = this.lineAt(pos), into = pos - (COUNT_IN + li * LINE);
      this.spoken = li >= 0 && into > 1 ? li : li - 1;
      this.base = SA.audio.now() - pos * this.eighth();
      this.setPlayIcon();
      if (pos === 0) SA.voice.say(this.mode === 'cosmo' ? 'One, two, three, four!' : '');
    }

    // ---------- Music ----------
    schedule(step, when) {
      const E = this.eighth();
      const beat = step % 2 === 0, inBar = step % 8;
      // Count-in: four clicks.
      if (step < COUNT_IN) { if (beat) SA.audio.note(step === 0 ? 84 : 79, when, 0.15, 'bell', 0.07); return; }
      const li = Math.floor((step - COUNT_IN) / LINE), k = (step - COUNT_IN) % LINE, L = this.S.lines[li];
      if (!L) return;
      const chord = CH[L.ch[k < 8 ? 0 : 1]];
      // Drums: kick on 1 and 3, a soft clap on 2 and 4, little hats on every eighth.
      // The Moon Song is a lullaby: just a soft kick on 1 and a hat on each beat.
      if (this.S.soft) {
        if (inBar === 0) SA.audio.drum('kick', when);
        if (beat) SA.audio.drum('hat', when);
      } else {
        if (inBar === 0 || inBar === 4) SA.audio.drum('kick', when);
        if (inBar === 2 || inBar === 6) SA.audio.drum('clap', when);
        SA.audio.drum('hat', when);
      }
      // A pad chord and a bass note at the start of each bar, bass bounce on beat 3.
      if (k === 0 || k === 8) {
        for (const m of chord.tones.slice(0, 3)) SA.audio.note(m - 12, when, E * 8, 'pad', 0.018);
        SA.audio.note(chord.root - 12 + 12, when, E * 3, 'bass', 0.12);
      }
      if (k === 4 || k === 12) SA.audio.note(chord.root + 7 - 12 + 12, when, E * 2, 'bass', 0.09);
      // Twinkly arpeggio on the off-beats.
      if (!beat) SA.audio.note(chord.tones[(k >> 1) % chord.tones.length] + 12, when, E, 'bell', 0.022);
      // The sung melody, hummed by a soft "voice".
      for (const n of L.notes) if (n.at === k) SA.audio.note(n.m, when, Math.max(E * 0.9, E * n.len * 0.92), 'voice', 0.055);
    }

    update(dt) {
      this.t += dt;
      this.fx.update(dt);
      this.bump = Math.max(0, this.bump - dt * 4);
      this.planetPop = Math.max(0, this.planetPop - dt * 3);
      this.cosmoSpin = Math.max(0, this.cosmoSpin - dt * 1.5);
      if (this.S.id === 'moon') {
        // The big Moon glides (always forward, like the real Moon) to the shape being sung;
        // during a chorus it slowly turns through all its shapes.
        const L = this.S.lines[Math.max(0, this.lineAt(this.pos))];
        const want = this.lineAt(this.pos) >= 0 && L.ph !== null ? L.ph : null;
        if (want === null) this.moonP = ((this.moonP || 0) + dt * (this.playing ? 0.06 : 0.02)) % 1;
        else {
          const ahead = (((want - this.moonP) % 1) + 1) % 1;
          this.moonP = (this.moonP + Math.min(ahead, Math.max(0.002, ahead * dt * 3))) % 1;
          if (want === 1 && ahead < 0.003) this.moonP = 0;
        }
      }
      if (!this.playing) return;
      const E = this.eighth();
      // The song follows the audio clock when there is one (so words and music stay together).
      const now = SA.audio.now();
      if (now > 0) this.pos = (now - this.base) / E;
      else { this.pos += dt / E; }
      const LINES = this.S.lines;
      while (this.next < this.S.total && this.next < this.pos + 0.3 / E) {
        if (now > 0) this.schedule(this.next, this.base + this.next * E);
        this.next++;
      }
      // A little beat bump for the visuals on every beat.
      const beat = Math.floor(this.pos / 2);
      if (beat !== this.lastBeat) { this.lastBeat = beat; this.bump = 1; }
      // Cosmo sings each line as it starts (a moment early, as speech takes a beat to begin).
      const li = this.lineAt(this.pos + 0.5);
      if (li >= 0 && li > this.spoken) {
        this.spoken = li;
        if (this.mode === 'cosmo') SA.voice.say(LINES[li].text);
        if ((li === 0 || LINES[li].verse !== LINES[li - 1].verse) && LINES[li].p !== 'sun' && LINES[li].ph !== null) this.planetPop = 1;
      }
      if (this.pos >= this.S.total + 2) this.finish();
    }

    async finish() {
      this.playing = false;
      this.done = true;
      this.setPlayIcon();
      SA.audio.play('tada');
      SA.celebrate(110);
      if (this.S.id === 'moon') {
        const firstMoon = !SA.state.moonSongDone;
        if (firstMoon) { SA.state.moonSongDone = true; SA.state.baseNew = true; SA.save(); }
        await SA.ui.say(firstMoon ? [
          'Bravo! 👏 You sang every shape of the Moon! 🌙',
          'I made you a Moon sticker for my Space Base! 🌙 Tonight, ask a grown-up to help you look for the real Moon. Which shape will it be?',
        ] : ['Bravo! 👏 Goodnight, Moon! Tap ▶ to sing it again! 🌙']);
        return;
      }
      const first = !SA.state.songDone;
      if (first) { SA.state.songDone = true; SA.state.baseNew = true; SA.save(); }
      await SA.ui.say(first ? [
        'Bravo! 👏 You sang all 8 planets, in order from the Sun! 🎉',
        'I made you a microphone sticker for my Space Base! 🎤 Tap ▶ to sing it again, or 🎤 to sing it all by yourself!',
      ] : ['Bravo! 👏 What a beautiful song! Tap ▶ to sing it again! 🎵']);
    }

    onDown(x, y) {
      // Tap the planet to make it bounce, tap Cosmo to make him spin, or tap anywhere for a note.
      const pl = this.planetSpot();
      const cur = this.lineAt(this.pos), L = this.S.lines[Math.max(0, cur)];
      const chord = CH[L.ch[((this.pos - COUNT_IN) % LINE) < 8 ? 0 : 1]] || CH.C;
      const m = SA.pick(chord.tones) + (y < SA.H * 0.4 ? 12 : 0);
      if (SA.audio.ready()) SA.audio.note(m, SA.audio.now() + 0.01, 0.35, 'bell', 0.08);
      if (Math.hypot(x - pl.x, y - pl.y) < pl.r * 1.2) {
        this.planetPop = 1;
        SA.audio.play('boing');
      } else if (Math.hypot(x - this.cosmoX(), y - SA.H * 0.62) < 70) {
        this.cosmoSpin = 1;
        SA.audio.play('giggle');
      }
      const col = SA.pick(['#ffe066', '#ff8ad8', '#7fe0ff', '#9bff9b', '#ffb36b']);
      this.fx.spawn('sparkle', x, y, SA.calm() ? 3 : 6, { color: col });
    }

    // ---------- Drawing ----------
    // On short (phone) screens everything sits a little lower, clear of the buttons along the top.
    planetSpot() { const ph = SA.H < 720; return { x: SA.W * 0.5, y: SA.H * (ph ? 0.415 : 0.36), r: SA.H * (ph ? 0.14 : 0.15) }; }
    lineupY() { return Math.max(SA.H * 0.135, (this.hudY || 0) + 26); }
    cosmoX() { return SA.W * 0.13; }

    draw(ctx) {
      const W = SA.W, H = SA.H, t = this.t, calm = SA.calm();
      const cur = this.lineAt(this.pos), L = this.S.lines[Math.max(0, cur)];
      const moon = this.S.id === 'moon';
      const col = moon ? '#8fa2ff' : SA.BODY[L.p] ? SA.BODY[L.p].color : '#ffb627';
      // Night sky tinted by the planet we're singing about.
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#0a0d2c'); bg.addColorStop(1, SA.shade(col, -150));
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      const glow = ctx.createRadialGradient(W / 2, H * 0.36, 10, W / 2, H * 0.36, H * 0.6);
      glow.addColorStop(0, SA.rgba(col, 0.28)); glow.addColorStop(1, SA.rgba(col, 0));
      ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
      this.stars.draw(ctx, t, t * 6);
      this.drawLights(ctx, t, calm);
      this.drawLineup(ctx, t, cur);
      // The planet of this verse, bouncing on every beat.
      const pl = this.planetSpot(), beatK = calm ? this.bump * 0.4 : this.bump;
      const s = 1 + beatK * 0.04 + Math.sin(this.planetPop * Math.PI) * 0.18;
      const pr = pl.r * (L.p === 'saturn' ? 0.7 : L.p === 'uranus' ? 0.78 : L.p === 'belt' ? 0.9 : 1) * s;
      if (moon) {
        // The Moon in tonight's song shape (as seen from the child's half of the world), with a soft glow.
        const mg = ctx.createRadialGradient(pl.x, pl.y, pr * 0.8, pl.x, pl.y, pr * 1.7);
        mg.addColorStop(0, 'rgba(240,240,220,' + (0.12 + 0.2 * this.litFrac()) + ')'); mg.addColorStop(1, 'rgba(240,240,220,0)');
        ctx.fillStyle = mg; SA.circle(ctx, pl.x, pl.y, pr * 1.7); ctx.fill();
        SA.drawMoonTonight(ctx, pl.x, pl.y - beatK * 6, pr * 0.92, { p: this.moonP || 0 });
        SA.label(ctx, cur >= 0 && L.name ? L.name : 'The Moon', pl.x, pl.y + pl.r * 1.15 + 16, 26, '#fff');
      } else {
        if (L.p === 'belt') this.drawBelt(ctx, pl.x, pl.y, pr, t);
        else SA.drawBody(ctx, L.p, pl.x, pl.y - beatK * 6, pr, { t: t * 0.6, lx: -0.6, ly: -0.4 });
        SA.label(ctx, L.p === 'belt' ? 'The Asteroid Belt' : SA.BODY[L.p].name, pl.x, pl.y + pl.r * 1.15 + 16, 26, '#fff');
      }
      // Cosmo sings and dances on the left; critters dance along at the bottom right.
      const cx = this.cosmoX(), hop = this.playing ? Math.abs(Math.sin(this.pos * Math.PI / 2)) * 14 : 0;
      ctx.save();
      ctx.translate(cx, H * 0.62 - hop);
      ctx.rotate(this.cosmoSpin * TAU);
      SA.drawCosmo(ctx, 0, 0, 1.05, { t, talk: this.playing && this.mode === 'cosmo' && SA.voice.speaking, mood: this.playing ? 'joy' : null, wave: !this.playing });
      ctx.restore();
      SA.icon(ctx, 'mic', cx + 52, H * 0.62 - hop + 10, 40);
      this.drawDancers(ctx, t);
      this.drawLyrics(ctx, t, cur);
      this.fx.draw(ctx);
    }

    drawLights(ctx, t, calm) {
      const W = SA.W, H = SA.H, cols = ['#ff6bb5', '#ffd84d', '#5fc8ff', '#7ee08a', '#b48cff'];
      for (let i = 0; i < 5; i++) {
        const x = W * (0.1 + i * 0.2), on = calm ? 0.5 : (Math.floor(this.pos / 2) + i) % 3 === 0 ? 1 : 0.35;
        const g = ctx.createRadialGradient(x, H * 0.06, 2, x, H * 0.06, 120);
        g.addColorStop(0, SA.rgba(cols[i], 0.35 * on)); g.addColorStop(1, SA.rgba(cols[i], 0));
        ctx.fillStyle = g; ctx.fillRect(x - 120, 0, 240, 200);
      }
    }

    litFrac() { return (1 - Math.cos((this.moonP || 0) * TAU)) / 2; }

    // All 8 planets in a row along the top: the one being sung grows and glows.
    // (In the Moon Song: the Moon's 8 shapes, in order.)
    drawLineup(ctx, t, cur) {
      const W = SA.W, y = this.lineupY(), x0 = W * 0.3, x1 = W * 0.7;
      if (this.S.id === 'moon') {
        const ph = cur >= 0 ? this.S.lines[cur].ph : null;
        PHASES.forEach((q, i) => {
          const x = x0 + (i / (PHASES.length - 1)) * (x1 - x0);
          const on = ph !== null && ph !== undefined && Math.abs(SA.wrapAngle((ph - q) * TAU)) < TAU / 16 + 0.01;
          const r = on ? 15 : 10;
          if (on) { ctx.fillStyle = 'rgba(255,240,170,0.35)'; SA.circle(ctx, x, y, r * 1.8); ctx.fill(); }
          SA.drawMoonTonight(ctx, x, y + (on ? Math.sin(t * 6) * 2 : 0), r, { p: q });
        });
        return;
      }
      const p = cur >= 0 ? this.S.lines[cur].p : null;
      PLANETS.forEach((id, i) => {
        const x = x0 + (i / (PLANETS.length - 1)) * (x1 - x0), on = id === p;
        const r = (on ? 15 : 9) * (id === 'jupiter' || id === 'saturn' ? 1.3 : 1);
        if (on) { ctx.fillStyle = 'rgba(255,240,170,0.35)'; SA.circle(ctx, x, y, r * 1.9); ctx.fill(); }
        SA.drawBody(ctx, id, x, y + (on ? Math.sin(t * 6) * 2 : 0), id === 'saturn' ? r * 0.7 : r, { t: 1 });
      });
    }

    drawBelt(ctx, x, y, r, t) {
      const rnd = SA.seeded(31);
      for (let i = 0; i < 26; i++) {
        const a = rnd() * TAU + t * 0.3 * (0.5 + rnd()), d = r * (0.3 + rnd() * 0.9), s = 4 + rnd() * 12;
        ctx.fillStyle = ['#9b8f86', '#7d726c', '#b3a395', '#8a7f78'][i % 4];
        SA.blobPath(ctx, [0, 1, 2, 3, 4, 5].map(k => [x + Math.cos(a) * d + Math.cos(k * 1.05) * s * (0.7 + 0.3 * Math.sin(k + i)), y + Math.sin(a) * d * 0.5 + Math.sin(k * 1.05) * s * (0.7 + 0.3 * Math.cos(k + i))]));
        ctx.fill();
      }
    }

    drawDancers(ctx, t) {
      const W = SA.W, H = SA.H;
      const found = SA.CRITTERS.filter(c => SA.state.critters[c.id]).slice(0, 5);
      const crew = found.length ? found : [{ color: '#9be86a', eyes: 3, feature: 'none' }, { color: '#ff9fd0', eyes: 2, feature: 'none' }];
      crew.forEach((c, i) => {
        const x = W * (0.78 + (i % 3) * 0.07) - (i >= 3 ? W * 0.035 : 0), y = H * (i >= 3 ? 0.5 : 0.62);
        const hop = this.playing ? Math.abs(Math.sin(this.pos * Math.PI / 2 + i)) * 12 : 0;
        ctx.save();
        ctx.translate(x, y - hop);
        ctx.rotate(this.playing ? Math.sin(this.pos * Math.PI / 4 + i) * 0.15 : 0);
        SA.drawCritter(ctx, 0, 0, 0.55, c, { t: t + i, mood: this.playing ? 'joy' : null, seed: i * 5 });
        ctx.restore();
      });
    }

    // Karaoke: the line being sung, big, with each word lighting up and a star hopping along;
    // the next line waits underneath.
    drawLyrics(ctx, t, cur) {
      const W = SA.W, H = SA.H, x0 = W * 0.22, w = W * 0.56, y = H * 0.76, LINES = this.S.lines;
      ctx.fillStyle = 'rgba(10,8,40,0.6)';
      SA.rrect(ctx, x0 - 20, y - 52, w + 40, 132, 26); ctx.fill();
      ctx.strokeStyle = 'rgba(255,224,102,0.5)'; ctx.lineWidth = 3; ctx.stroke();
      if (cur < 0) {
        const n = Math.min(4, Math.floor(this.pos / 2) + 1);
        SA.label(ctx, this.playing ? ['One', 'Two', 'Three', 'Four!'].slice(0, n).join('... ') : 'Tap ▶ to sing!', W / 2, y, 34, '#ffe066');
        if (LINES[0]) SA.label(ctx, LINES[0].text, W / 2, y + 48, 21, 'rgba(220,225,255,0.75)', { weight: 700 });
        return;
      }
      const L = LINES[cur], k = (this.pos - COUNT_IN) - cur * LINE;
      let size = 38;
      ctx.font = '800 ' + size + 'px ' + SA.FONT;
      while (ctx.measureText(L.text).width > w && size > 20) { size -= 2; ctx.font = '800 ' + size + 'px ' + SA.FONT; }
      const space = ctx.measureText(' ').width, widths = L.words.map(wd => ctx.measureText(wd).width);
      const total = widths.reduce((a, b) => a + b, 0) + space * (L.words.length - 1);
      let x = W / 2 - total / 2;
      const xs = widths.map(wd => { const at = x + wd / 2; x += wd + space; return at; });
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      let curWord = -1;
      L.words.forEach((wd, i) => {
        const sung = this.playing || this.done ? k >= L.wordAt[i] : false;
        if (sung) curWord = i;
        ctx.lineWidth = Math.max(3, size * 0.2); ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(10,14,40,0.9)';
        ctx.strokeText(wd, xs[i], y);
        ctx.fillStyle = sung ? '#ffe066' : '#ffffff';
        ctx.fillText(wd, xs[i], y);
      });
      // The bouncing star hops from word to word.
      if (curWord >= 0 && this.playing) {
        const a = L.wordAt[curWord], b = curWord + 1 < L.words.length ? L.wordAt[curWord + 1] : a + 2;
        const u = SA.clamp((k - a) / Math.max(1, b - a), 0, 1);
        const nx = curWord + 1 < L.words.length ? xs[curWord + 1] : xs[curWord];
        const bx = SA.lerp(xs[curWord], nx, u), by = y - size * 0.95 - Math.sin(u * Math.PI) * 22;
        ctx.fillStyle = '#ffe066'; ctx.strokeStyle = '#a35a00'; ctx.lineWidth = 2;
        SA.starPath(ctx, bx, by, 11, 0.45, 5, t * 3); ctx.fill(); ctx.stroke();
      }
      const nxt = LINES[cur + 1];
      if (nxt) SA.label(ctx, nxt.text, W / 2, y + 50, Math.min(22, size * 0.6), 'rgba(220,225,255,0.7)', { weight: 700 });
    }
  }
  SA.SongScene = SongScene;
})(window.SA);
