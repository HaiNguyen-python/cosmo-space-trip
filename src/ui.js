// DOM UI: Cosmo's speech bubble, toasts, HUD, and the quiz / card / album / settings panels.
(function (SA) {
  const $ = id => document.getElementById(id);
  let stage, talkEl, textEl, nextBtn, hearBtn, avCtx, overlay, panel, toastEl;
  let line = '', shown = 0, typing = false, waitMode = false, queue = [], resolveTalk = null, hintLeft = 0;
  let panelOpen = false, t = 0, toastTimer = 0;
  let lineCb = null, lineNo = 0, wardCanvas = null, jokeDeck = [];
  const CPS = 42; // typing speed, characters per second

  function showLine(text) {
    line = text;
    shown = 0;
    typing = true;
    textEl.textContent = '';
    talkEl.hidden = false;
    talkEl.classList.remove('pop');
    void talkEl.offsetWidth;
    talkEl.classList.add('pop');
    SA.voice.say(text);
  }

  function advance() {
    if (typing) { shown = line.length; typing = false; textEl.textContent = line; return; }
    SA.audio.play('click');
    if (queue.length) {
      showLine(queue.shift());
      lineNo++;
      if (lineCb) lineCb(lineNo);
      return;
    }
    closeTalk();
  }

  function closeTalk() {
    talkEl.hidden = true;
    waitMode = false;
    hintLeft = 0;
    SA.voice.stop();
    const r = resolveTalk;
    resolveTalk = null;
    if (r) r();
  }

  // Cosmo's face matches what he just said: a big grin for celebrations, wide eyes for surprises.
  function moodFor(text) {
    if (/🎉|🏆|⭐|Great|Yay|did it|Perfect|Hooray|Awesome/i.test(text)) return 'joy';
    if (/Wow|Whoa|👀|\?$/i.test(text)) return 'wow';
    return null;
  }

  function bump(el) {
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
  }

  // reward = true shows slowly turning sunburst rays behind the panel.
  function openPanel(html, cls, reward) {
    panel.className = 'panel ' + (cls || '');
    panel.innerHTML = html;
    overlay.classList.toggle('reward', !!reward);
    overlay.hidden = false;
    panelOpen = true;
    SA.voice.stop();
  }
  function closePanel() {
    wardCanvas = null;
    overlay.classList.remove('reward');
    overlay.hidden = true;
    panel.innerHTML = '';
    panelOpen = false;
    SA.voice.stop();
  }

  SA.ui = {
    init() {
      stage = $('stage');
      talkEl = $('cosmoTalk');
      textEl = $('talkText');
      nextBtn = $('btnNext');
      hearBtn = $('btnHear');
      avCtx = $('cosmoAvatar').getContext('2d');
      overlay = $('overlay');
      panel = $('panel');
      toastEl = $('toast');

      $('talkBubble').addEventListener('click', e => {
        if (e.target === hearBtn) return;
        if (waitMode) advance();
      });
      hearBtn.addEventListener('click', () => SA.voice.say(line));
      // Map buttons do nothing while the rocket is taking off or the scene is changing,
      // so a panel can never be left open over the next scene.
      const mapBusy = () => SA.transitioning || panelOpen || SA.scene !== SA.map || !!SA.map.flight;
      $('btnAlbum').addEventListener('click', () => { if (mapBusy()) return; SA.audio.play('pop'); SA.ui.album(); });
      $('btnWardrobe').addEventListener('click', () => { if (mapBusy()) return; SA.audio.play('pop'); SA.ui.wardrobe(); });
      $('btnBase').addEventListener('click', () => {
        if (mapBusy() || SA.ui.blocking()) return;
        SA.audio.play('pop');
        SA.ui.hideTalk();
        SA.go(SA.base, {});
      });
      $('btnPlayground').addEventListener('click', () => {
        if (mapBusy() || SA.ui.blocking()) return;
        SA.audio.play('pop');
        SA.ui.hideTalk();
        SA.go(SA.playground, {});
      });
      $('btnJournal').addEventListener('click', () => {
        if (mapBusy() || SA.ui.blocking()) return;
        SA.audio.play('pop');
        SA.ui.hideTalk();
        SA.go(SA.journal, {});
      });
      $('btnStage').addEventListener('click', () => {
        if (mapBusy() || SA.ui.blocking()) return;
        SA.audio.play('pop');
        SA.ui.hideTalk();
        SA.ui.stage();
      });
      $('btnSettings').addEventListener('click', () => {
        if (mapBusy()) return;
        SA.audio.play('pop');
        SA.ui.parentGate().then(ok => { if (ok) SA.ui.settings(); });
      });
      // The toys (Rocket Workshop, Space Playground) share one HUD; each scene says where Back goes.
      $('btnToyBack').addEventListener('click', () => {
        if (SA.transitioning || panelOpen || !SA.scene || !SA.scene.back) return;
        SA.audio.play('click');
        closeTalk();
        SA.scene.back();
      });
      $('btnBack').addEventListener('click', () => {
        if (SA.transitioning || panelOpen) return;
        SA.audio.play('click');
        closeTalk();
        SA.go(SA.map, {});
      });
      SA.ui.updateHud();
      SA.ui.applyCalm();
    },

    // The "Calm effects" setting also tones down CSS animations (sweeps, rays, iris wipe).
    applyCalm() { document.body.classList.toggle('calm', SA.calm()); },

    blocking:() => panelOpen || (!talkEl.hidden && waitMode),
    panelOpen: () => panelOpen,

    // Cosmo speaks one or more lines; the player taps Next to continue. Resolves when done.
    say(lines, onLine) {
      lines = Array.isArray(lines) ? lines.slice() : [lines];
      lineCb = onLine || null;
      lineNo = 0;
      if (resolveTalk) { const r = resolveTalk; resolveTalk = null; r(); }
      return new Promise(resolve => {
        resolveTalk = resolve;
        waitMode = true;
        hintLeft = 0;
        talkEl.classList.remove('hint');
        nextBtn.hidden = false;
        queue = lines;
        showLine(queue.shift());
      });
    },

    // A non-blocking tip during play. secs = 0 keeps it up until replaced.
    hint(text, secs) {
      if (waitMode) return;
      talkEl.classList.add('hint');
      nextBtn.hidden = true;
      hintLeft = secs || 0;
      showLine(text);
    },
    hideTalk() { if (!waitMode) closeTalk(); },

    // Short notice at the top. It is read aloud too (spoken can say it more clearly, e.g. "12 stars").
    toast(text, spoken) {
      toastEl.textContent = text;
      toastEl.classList.add('show');
      toastTimer = 2.6;
      SA.voice.say(spoken || text);
    },

    setScene(name) { stage.dataset.scene = name; },
    // Where the toy HUD (Back button, toy buttons, info chip) ends, in canvas units, so toys can
    // keep their own buttons clear of it (it covers more of the canvas on phones).
    toyTop() {
      const c = $('game').getBoundingClientRect(), h = $('toyHud').getBoundingClientRect();
      if (!c.height || !h.height) return SA.H * 0.13;
      return ((h.bottom - c.top) / c.height) * SA.H;
    },
    // The info chip of missions (and of the toys, which have their own HUD).
    setInfo(text) {
      // Expert missions wear a little cap in the corner, so it's clear which version is playing.
      if (SA.scene && SA.scene.expert && $('gameInfo')) text = '🎓 ' + text;
      $('gameInfo').textContent = text; $('toyInfo').textContent = text;
    },
    bumpInfo() { bump($('gameInfo')); bump($('toyInfo')); },

    // Big animated title across the screen. Resolves when it has finished.
    banner(title, sub, style, stars) {
      const el = $('banner');
      el.className = style || '';
      el.style.animationDuration = (stars ? 2.8 : 2.3) + 's';
      el.innerHTML = (stars ? '<div class="banner-stars">' + [0, 1, 2].map(i =>
        '<span class="' + (i < stars ? 'on' : '') + '" style="animation-delay:' + (0.3 + i * 0.25) + 's">★</span>').join('') + '</div>' : '') +
        '<h2>' + SA.esc(title) + '</h2>' + (sub ? '<p>' + SA.esc(sub) + '</p>' : '') + '<i class="sweep"></i>';
      el.hidden = false;
      void el.offsetWidth;
      el.classList.add('show');
      SA.audio.play(style === 'gold' ? 'card' : 'whoosh');
      SA.voice.say(title + '! ' + (sub || ''));
      if (stars) for (let i = 0; i < stars; i++) setTimeout(() => SA.audio.play('ding'), 350 + i * 250);
      return new Promise(resolve => setTimeout(() => {
        el.classList.remove('show');
        el.hidden = true;
        resolve();
      }, stars ? 2800 : 2300));
    },

    updateHud() {
      const stars = String(SA.totalStars()), cards = SA.cardCount() + '/' + SA.BODIES.length;
      if ($('starCount').textContent !== stars) { $('starCount').textContent = stars; bump($('starCount').parentNode); }
      if ($('albumCount').textContent !== cards) { $('albumCount').textContent = cards; bump($('btnAlbum')); }
      $('btnWardrobe').classList.toggle('has-new', !!SA.state.wardNew);
      $('btnBase').classList.toggle('has-new', !!SA.state.baseNew);
    },
    // True while Cosmo's bubble (a tip or a talk) is on screen.
    talking: () => !talkEl.hidden,

    tick(dt) {
      t += dt;
      if (typing) {
        shown = Math.min(line.length, shown + CPS * dt);
        textEl.textContent = line.slice(0, Math.floor(shown));
        if (shown >= line.length) typing = false;
      }
      if (hintLeft > 0 && !typing) {
        hintLeft -= dt;
        if (hintLeft <= 0 && !SA.voice.speaking) closeTalk();
        else if (hintLeft <= 0) hintLeft = 0.2;
      }
      if (toastTimer > 0) {
        toastTimer -= dt;
        if (toastTimer <= 0) toastEl.classList.remove('show');
      }
      if (!talkEl.hidden) {
        // Shrink Cosmo a little when a tall hat needs room.
        const s = Math.min(1.55, 200 / (44 - SA.hatTop(SA.state.hat)));
        avCtx.setTransform(1, 0, 0, 1, 0, 0);
        avCtx.clearRect(0, 0, 220, 220);
        const talking = typing || SA.voice.speaking;
        SA.drawCosmo(avCtx, 110, 212 - 44 * s, s, { t, talk: talking, mood: talking ? null : moodFor(line) });
      }
      if (wardCanvas && panelOpen) {
        const c = wardCanvas.getContext('2d');
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.clearRect(0, 0, wardCanvas.width, wardCanvas.height);
        SA.drawCosmo(c, 140, 160, 1.15, { t, wave: true });
        SA.drawRocket(c, 330, 125, 1.05, 0.35 + Math.sin(t * 1.5) * 0.05, { t, flame: 0.5 });
      }
    },

    // ---------- Quiz ----------
    // opts (optional): { kicker, ok } change the heading and the last button (Expert quizzes).
    quiz(questions, opts) {
      opts = opts || {};
      const kicker = opts.kicker || '🧠 Cosmo\'s Quiz';
      return new Promise(resolve => {
        let qi = 0, stars = 0;
        const ask = () => {
          const q = questions[qi];
          let firstTry = true;
          const order = q.options.map((o, i) => i).sort(() => Math.random() - 0.5);
          openPanel(
            '<div class="quiz">' +
              '<div class="panel-kicker">' + kicker + ' <span class="qnum">' + (qi + 1) + ' / ' + questions.length + '</span></div>' +
              '<div class="q-row"><h2>' + SA.esc(q.q) + '</h2><button class="mini hear" aria-label="Read aloud">🔊</button></div>' +
              '<div class="options">' + order.map(i =>
                '<button class="option" data-i="' + i + '"><i>' + q.options[i][0] + '</i><span>' + SA.esc(q.options[i][1]) + '</span></button>').join('') +
              '</div>' +
              '<p class="feedback"></p>' +
              '<div class="panel-actions"><button class="btn primary next" hidden>Next ▶</button></div>' +
            '</div>', 'quiz-panel');
          const fb = panel.querySelector('.feedback');
          const next = panel.querySelector('.next');
          SA.voice.say(q.q);
          panel.querySelector('.hear').onclick = () => SA.voice.say(q.q + ' ' + q.options.map(o => o[1]).join('? ') + '?');
          panel.querySelectorAll('.option').forEach(btn => {
            btn.onclick = () => {
              const i = +btn.dataset.i;
              if (i === q.answer) {
                panel.querySelectorAll('.option').forEach(b => { b.disabled = true; });
                btn.classList.add('correct');
                if (firstTry) stars++;
                fb.className = 'feedback good';
                fb.textContent = (firstTry ? '⭐ ' : '✅ ') + q.explain;
                SA.voice.say(q.explain);
                SA.audio.play('cheer');
                SA.celebrate(60);
                next.hidden = false;
                next.textContent = qi < questions.length - 1 ? 'Next ▶' : 'Finish ▶';
              } else {
                firstTry = false;
                btn.classList.add('wrong');
                btn.disabled = true;
                fb.className = 'feedback try';
                fb.textContent = 'Hmm, not quite! Try another one. 💪';
                SA.voice.say('Hmm, not quite! Try another one.');
                SA.audio.play('wrong');
              }
            };
          });
          next.onclick = () => {
            SA.audio.play('click');
            qi++;
            if (qi < questions.length) ask();
            else results();
          };
        };

        // Show the stars earned before the card reward.
        const results = () => {
          const msg = stars === questions.length ? 'Perfect! You are a space genius!'
            : stars > 0 ? 'Great job! You learned new space facts!'
            : 'Great trying! You learned new space facts!';
          openPanel(
            '<div class="results">' +
              '<div class="panel-kicker">' + (opts.kicker ? opts.kicker + ' complete!' : '🧠 Quiz complete!') + '</div>' +
              '<div class="big-stars">' + questions.map((q, i) =>
                '<span class="' + (i < stars ? 'on' : '') + '" style="animation-delay:' + (0.2 + i * 0.35) + 's">★</span>').join('') + '</div>' +
              '<h2>' + msg + '</h2>' +
              '<div class="panel-actions"><button class="btn primary ok">' + (opts.ok || 'Get my card! 🎴') + '</button></div>' +
            '</div>', 'results-panel', stars > 0);
          SA.voice.say(msg);
          for (let i = 0; i < stars; i++) setTimeout(() => SA.audio.play('ding'), 200 + i * 350);
          panel.querySelector('.ok').onclick = () => { SA.audio.play('click'); closePanel(); resolve(stars); };
        };
        ask();
      });
    },

    // ---------- Fact card ----------
    card(id, opts) {
      opts = opts || {};
      const b = SA.BODY[id];
      return new Promise(resolve => {
        openPanel(
          (opts.isNew ? '<div class="ribbon">✨ New card! ✨</div>' : '') +
          '<div class="fact-card" style="--c:' + b.color + '">' +
            '<div class="fc-top"><div class="fc-art"></div><div class="fc-title"><small>' + SA.esc(b.kind) + '</small><h2>' + SA.esc(b.name) + '</h2></div></div>' +
            '<div class="fc-stats">' + b.stats.map(s => '<div class="stat"><i>' + s[0] + '</i><small>' + s[1] + '</small><b>' + SA.esc(s[2]) + '</b></div>').join('') + '</div>' +
            '<ul class="fc-facts">' + b.facts.map(f => '<li>' + SA.esc(f) + '</li>').join('') + '</ul>' +
          '</div>' +
          '<div class="panel-actions"><button class="btn ghost hear">🔊 Read to me</button><button class="btn primary ok">' + (opts.isNew ? 'Cool! 👍' : 'Close') + '</button></div>',
          'card-panel' + (opts.isNew ? ' is-new' : ''), opts.isNew);
        panel.querySelector('.fc-art').appendChild(SA.renderBodyCanvas(id, 150));
        panel.querySelector('.hear').onclick = () => SA.voice.say(b.name + '. ' + b.facts.join(' '));
        panel.querySelector('.ok').onclick = () => { SA.audio.play('click'); closePanel(); resolve(); };
        if (opts.isNew) {
          SA.audio.play('card');
          SA.celebrate(80);
          SA.voice.say('New card! ' + b.name + '.');
        }
      });
    },

    // ---------- Expert badge (after an Expert mission) ----------
    expertBadge(id, opts) {
      opts = opts || {};
      const b = SA.BODY[id], E = SA.EXPERT[id];
      return new Promise(resolve => {
        const n = SA.expertCount();
        openPanel(
          (opts.isNew ? '<div class="ribbon">🎓 New Expert badge! 🎓</div>' : '') +
          '<div class="expert-card">' +
            '<div class="ex-art"></div>' +
            '<div class="ex-info"><small>Expert mission: ' + SA.esc(E.name) + '</small><h2>' + SA.esc(b.name) + ' Expert</h2>' +
              '<ul class="fc-facts">' + E.card.map(f => '<li>' + SA.esc(f) + '</li>').join('') + '</ul>' +
              '<div class="ex-count">' + SA.MISSIONS.map(m => '<i class="' + (SA.state.expert[m] ? 'on' : '') + '" title="' + SA.esc(SA.BODY[m].name) + '">🎓</i>').join('') + '<b>' + n + ' / 8</b></div>' +
            '</div>' +
          '</div>' +
          '<div class="panel-actions"><button class="btn ghost hear">🔊 Read to me</button><button class="btn primary ok">' + (opts.isNew ? 'Hooray! 🎉' : 'Close') + '</button></div>',
          'card-panel expert-panel' + (opts.isNew ? ' is-new' : ''), opts.isNew);
        panel.querySelector('.ex-art').appendChild(SA.renderExpertBadge(id, 170));
        const read = b.name + ' Expert! ' + E.card.join(' ');
        panel.querySelector('.hear').onclick = () => SA.voice.say(read);
        panel.querySelector('.ok').onclick = () => { SA.audio.play('click'); closePanel(); resolve(); };
        if (opts.isNew) {
          SA.audio.play('card');
          SA.celebrate(90);
        }
        SA.voice.say((opts.isNew ? 'New Expert badge! ' : '') + b.name + ' Expert! You have ' + n + ' of 8 Expert badges.');
      });
    },

    // ---------- Cosmo's Stage (🎤 on the map): the quiz show, the Planet Song and a joke ----------
    stage() {
      const showOpen = SA.allMissions().some(id => SA.state.done[id]);
      const campDone = SA.campToday && SA.campToday();
      openPanel(
        '<div class="panel-kicker">🎤 Cosmo\'s Stage</div>' +
        '<p class="panel-sub">What shall we do? Pick one!</p>' +
        '<div class="stage-grid">' +
          '<button class="stage-tile show' + (showOpen ? '' : ' locked') + '"><i>📺</i><b>Mission Control</b><small>' + (showOpen ? 'My space quiz show! Play alone, or as a family in two teams.' : '🔒 Finish your first mission, then show what you learned!') + '</small></button>' +
          '<button class="stage-tile camp' + (campDone ? '' : ' fresh') + '"><i>🏕️</i><b>Space Camp</b><small>' + (campDone ? '✅ Done today! Train again, or come back tomorrow.' : 'Today\'s astronaut training: a workout, a brain quiz and the Moon!') + '</small></button>' +
          '<button class="stage-tile song"><i>🎵</i><b>Planet Song</b><small>Sing the planets with me! Tap along to the music.</small></button>' +
          '<button class="stage-tile moonsong"><i>🌙</i><b>Moon Song</b><small>A sleepy song about the Moon\'s shapes.</small></button>' +
          '<button class="stage-tile joke"><i>😂</i><b>Space Joke</b><small>A silly joke from Cosmo.</small></button>' +
        '</div>' +
        '<div class="panel-actions"><button class="btn ghost hear">🔊 Read to me</button><button class="btn primary ok">Close</button></div>', 'stage-panel');
      const read = 'Cosmo\'s Stage! Pick one. Mission Control, my space quiz show. Space Camp' + (campDone ? ', which you already did today' : ', today\'s astronaut training') + '. The Planet Song. The Moon Song. Or a space joke.';
      SA.voice.say(read);
      const go = (scene, opts) => { SA.audio.play('pop'); closePanel(); SA.ui.hideTalk(); SA.go(scene, opts || {}); };
      panel.querySelector('.show').onclick = () => {
        if (!showOpen) { SA.audio.play('wrong'); SA.ui.toast('Finish your first mission, then come back to show what you learned! 🚀'); return; }
        go(SA.quizshow);
      };
      panel.querySelector('.camp').onclick = () => go(SA.camp);
      panel.querySelector('.song').onclick = () => go(SA.song, { song: 'planets' });
      panel.querySelector('.moonsong').onclick = () => go(SA.song, { song: 'moon' });
      panel.querySelector('.joke').onclick = () => { closePanel(); SA.ui.joke(); };
      panel.querySelector('.hear').onclick = () => SA.voice.say(read);
      panel.querySelector('.ok').onclick = () => { SA.audio.play('click'); closePanel(); };
    },

    // ---------- Album ----------
    album() {
      openPanel(
        '<div class="panel-kicker">📒 My Space Album</div>' +
        '<p class="panel-sub">Collect a card for every place we visit! <b>' + SA.cardCount() + ' / ' + SA.BODIES.length + '</b></p>' +
        '<div class="album-progress"><i style="width:' + Math.round((SA.cardCount() / SA.BODIES.length) * 100) + '%"></i></div>' +
        '<div class="album">' + SA.BODIES.map(b => {
          const has = SA.state.cards[b.id];
          return '<button class="slot' + (has ? ' has' : '') + '" data-id="' + b.id + '" style="--c:' + b.color + '">' +
            '<div class="slot-art">' + (has ? '' : '?') + '</div><span>' + SA.esc(has ? b.name : '???') + '</span></button>';
        }).join('') + '</div>' +
        '<div class="panel-actions"><button class="btn primary ok">Close</button></div>', 'album-panel');
      panel.querySelectorAll('.slot.has').forEach(el => {
        el.querySelector('.slot-art').appendChild(SA.renderBodyCanvas(el.dataset.id, 78));
        el.onclick = () => { SA.audio.play('pop'); SA.ui.card(el.dataset.id).then(() => SA.ui.album()); };
      });
      panel.querySelectorAll('.slot:not(.has)').forEach(el => {
        el.onclick = () => { SA.audio.play('wrong'); SA.ui.toast('Visit this place to unlock its card!'); };
      });
      panel.querySelector('.ok').onclick = () => { SA.audio.play('click'); closePanel(); };
    },

    // ---------- Critter Club (from the 🐾 button at the Space Base) ----------
    // Every critter: found ones in colour with their name and line, the rest as silhouettes
    // with the place they hide, so older kids can go hunting and younger ones can just listen.
    critterClub() {
      const n = SA.critters.count(), all = SA.CRITTERS.length;
      const place = id => SA.BODY[id].name.replace(/^The /, '');
      let said = n === all ? 'You found every single critter! You\'re a super space explorer! 🎉'
        : n ? 'You found ' + n + ' of ' + all + ' critters! Tap one to hear about it.'
        : 'No critters yet! They peek in at the edge of the screen during missions. Tap one to find it!';
      openPanel(
        '<div class="panel-kicker">🐾 Critter Club <span class="qnum">' + n + ' / ' + all + '</span></div>' +
        '<p class="panel-sub club-msg">' + SA.esc(said) + '</p>' +
        '<div class="album-progress"><i style="width:' + Math.round((n / all) * 100) + '%"></i></div>' +
        '<div class="album club">' + SA.CRITTERS.map(c => {
          const has = !!SA.state.critters[c.id];
          return '<button class="slot' + (has ? ' has' : '') + '" data-id="' + c.id + '" style="--c:' + c.color + '">' +
            '<div class="slot-art"></div><span>' + SA.esc(has ? c.name : '???') + '</span><small>' + (has ? '🏠 ' : '🔍 ') + SA.esc(place(c.id)) + '</small></button>';
        }).join('') + '</div>' +
        '<div class="panel-actions"><button class="btn ghost hear">🔊 Read to me</button><button class="btn primary ok">Close</button></div>', 'album-panel club-panel', n === all);
      const msg = panel.querySelector('.club-msg');
      SA.voice.say('Critter Club! ' + said);
      panel.querySelectorAll('.slot').forEach(el => {
        const c = SA.CRITTER[el.dataset.id], has = !!SA.state.critters[c.id];
        el.querySelector('.slot-art').appendChild(SA.renderCritterCanvas(c.id, 78, has));
        el.onclick = () => {
          if (has) {
            SA.audio.play('squeak');
            said = c.name + '! ' + c.line;
          } else {
            SA.audio.play('pop');
            const open = SA.isUnlocked(c.id);
            said = open ? 'This shy critter hides in the ' + place(c.id) + ' mission. Watch the edges of the screen! 👀'
              : 'This shy critter hides in the ' + place(c.id) + ' mission. Keep exploring to get there! 🚀';
          }
          msg.textContent = said;
          SA.voice.say(said);
        };
      });
      panel.querySelector('.hear').onclick = () => SA.voice.say(said);
      panel.querySelector('.ok').onclick = () => { SA.audio.play('click'); closePanel(); };
    },

    // ---------- Cosmo's Wardrobe ----------
    // Hats and rocket paints unlock as total stars grow. Stars are never spent.
    wardrobe(tab) {
      tab = tab || 'hats';
      SA.state.wardNew = false;
      SA.save();
      SA.ui.updateHud();
      const total = SA.totalStars(), max = SA.maxStars();
      // Rocket shape: Cosmo's classic rocket, or the one the child built in the Rocket Workshop.
      const SHAPES = [{ id: 'classic', name: 'Classic rocket', need: 0 }, { id: 'mine', name: 'My rocket', need: 0, built: true }];
      const items = tab === 'hats' ? SA.HATS : tab === 'shape' ? SHAPES : SA.PAINTS;
      const cur = tab === 'hats' ? SA.state.hat : tab === 'shape' ? (SA.myRocket() ? 'mine' : 'classic') : SA.state.paint;
      const has = it => (it.built ? !!SA.state.rocketBuild : SA.hasItem(it));
      openPanel(
        '<div class="panel-kicker">🎩 Cosmo\'s Wardrobe <span class="qnum">⭐ ' + total + ' / ' + max + '</span></div>' +
        '<div class="ward-top"><canvas class="ward-preview" width="440" height="240"></canvas>' +
          '<div class="tabs">' +
            '<button data-tab="hats" class="tab' + (tab === 'hats' ? ' on' : '') + '">🎩 Hats</button>' +
            '<button data-tab="paints" class="tab' + (tab === 'paints' ? ' on' : '') + '">🎨 Paint</button>' +
            '<button data-tab="shape" class="tab' + (tab === 'shape' ? ' on' : '') + '">🚀 Rocket</button>' +
          '</div></div>' +
        '<div class="ward-grid">' + items.map(it => {
          const ok = has(it);
          return '<button class="ward-item' + (it.id === cur ? ' on' : '') + (ok ? '' : ' locked') + '" data-id="' + it.id + '">' +
            '<canvas width="140" height="140"></canvas><span>' + (ok ? SA.esc(it.name) : it.built ? '🔒 Build one 🔧' : it.tour ? '🔒 Grand Tour' : it.story ? '🔒 💌 Postcards' : it.expert ? '🔒 🎓 ' + SA.expertCount() + '/' + it.expert : '🔒 ⭐ ' + it.need) + '</span></button>';
        }).join('') + '</div>' +
        '<p class="panel-sub small">Earn stars in missions and quizzes to unlock more. Replay missions to beat your best!</p>' +
        '<div class="panel-actions"><button class="btn primary ok">Done</button></div>', 'ward-panel');
      wardCanvas = panel.querySelector('.ward-preview');
      panel.querySelectorAll('.tab').forEach(b => {
        b.onclick = () => { SA.audio.play('click'); SA.ui.wardrobe(b.dataset.tab); };
      });
      panel.querySelectorAll('.ward-item').forEach(btn => {
        const it = items.find(i => i.id === btn.dataset.id);
        const c = btn.querySelector('canvas').getContext('2d');
        if (tab === 'hats') SA.drawCosmo(c, 70, 102, 0.78, { t: 1, noBob: true, hat: it.id });
        else if (tab === 'shape') SA.drawRocket(c, 70, 74, 0.78, 0.5, { t: 1, shape: it.id === 'mine' && SA.state.rocketBuild ? SA.state.rocketBuild : 'classic' });
        else SA.drawRocket(c, 70, 72, 0.82, 0.5, { t: 1, paint: it.id });
        btn.onclick = () => {
          if (!has(it)) {
            SA.audio.play('wrong');
            if (it.built) { SA.ui.toast('Build a rocket in the Rocket Workshop 🔧 at my Space Base to fly it here!'); return; }
            if (it.story) { SA.ui.toast('A surprise from my family! Keep exploring, and watch for postcards at my radar dish. 💌'); return; }
            if (it.expert) { SA.ui.toast('Earn all 8 Expert badges to unlock this! 🎓 Tap a planet you explored, then tap Expert.'); return; }
            SA.ui.toast(it.tour ? 'Visit all 8 planets to unlock this!' : 'Collect ⭐ ' + it.need + ' to unlock this!',
              it.tour ? null : 'Collect ' + it.need + ' stars to unlock this!');
            return;
          }
          SA.audio.play('collect');
          if (tab === 'hats') SA.state.hat = it.id;
          else if (tab === 'shape') SA.state.rocketShape = it.id;
          else SA.state.paint = it.id;
          SA.save();
          SA.ui.wardrobe(tab);
        };
      });
      panel.querySelector('.ok').onclick = () => { SA.audio.play('click'); closePanel(); };
    },

    // ---------- Planet info card (map) ----------
    planetCard(id, actions) {
      const b = SA.BODY[id];
      const open = SA.isUnlocked(id), done = SA.state.done[id], best = SA.state.best[id];
      const starRow = n => [0, 1, 2].map(i => '<span class="' + (i < n ? 'on' : '') + '">★</span>').join('');
      let status, said;
      if (done && best) { status = '<div class="pc-stars">' + starRow(best.m) + '</div><small>Your best · replay to beat it!</small>'; said = 'You got ' + best.m + (best.m === 1 ? ' star' : ' stars') + ' here.'; }
      else if (done) { status = '<div class="pc-new">✅ Explored!</div><small>Replay to earn stars!</small>'; said = 'You explored it! Replay to earn stars.'; }
      else if (open) { status = '<div class="pc-new">✨ New mission!</div>'; said = 'New mission!'; }
      else {
        const prev = SA.BONUS[id] || SA.MISSIONS[SA.MISSIONS.indexOf(id) - 1];
        const verb = prev === 'pluto' ? 'Find ' : 'Finish ';
        status = '<div class="pc-lock">🔒 ' + verb + SA.esc(SA.BODY[prev].name) + ' first</div>';
        said = verb + SA.BODY[prev].name + ' first.';
      }
      // Bonus missions this planet opens (Saturn has two).
      const bonusIds = SA.bonusesOf(id).filter(k => SA.isUnlocked(k));
      // The shy critter of this mission: found, or a nudge to look for it (once played).
      const cr = SA.CRITTER[id], crFound = cr && SA.state.critters[id];
      const critterRow = !cr || !(crFound || done) ? '' : '<div class="pc-critter"><span class="pc-crit-art"></span>' +
        (crFound ? '🐾 Critter friend: <b>' + SA.esc(cr.name) + '</b>' : '🐾 A shy critter hides here. Can you spot it?') + '</div>';
      // Expert mission (8 planets, once explored): a harder replay with new facts and a gold badge.
      const ex = done && SA.EXPERT && SA.EXPERT[id], exDone = !!(ex && SA.state.expert[id]);
      const expertRow = !ex ? '' : '<div class="pc-expert' + (exDone ? ' on' : '') + '"><span class="pc-ex-art"></span>' +
        (exDone ? '🎓 <b>' + SA.esc(b.name) + ' Expert!</b>' : '🎓 Expert mission: <b>' + SA.esc(ex.name) + '</b>') + '</div>';
      // Extra toys a place opens (Mars: the Mars Base builder).
      const toys = (SA.PLACE_TOYS && SA.PLACE_TOYS[id] && done) ? SA.PLACE_TOYS[id] : [];
      const nBtns = (open ? 1 : 0) + (SA.state.cards[id] ? 1 : 0) + bonusIds.length + (ex ? 1 : 0) + toys.length + 1;
      openPanel(
        '<div class="pc" style="--c:' + b.color + '">' +
          '<div class="pc-art"></div>' +
          '<div class="pc-info">' +
            '<small class="pc-kind">' + SA.esc(b.kind) + '</small>' +
            '<h2>' + SA.esc(b.name) + '</h2>' +
            '<p class="pc-nick">' + SA.esc(SA.NICKNAMES[id] || '') + '</p>' +
            '<p class="pc-mission">Mission: <b>' + SA.esc(SA.MISSION_NAMES[id] || '') + '</b></p>' +
            status + critterRow + expertRow +
          '</div>' +
        '</div>' +
        '<div class="panel-actions pc-actions">' +
          (open ? '<button class="btn primary fly">🚀 Fly there!</button>' : '') +
          (ex ? '<button class="btn expert-btn">🎓 Expert</button>' : '') +
          (SA.state.cards[id] ? '<button class="btn ghost cardbtn">📇 Fact card</button>' : '') +
          bonusIds.map(k => '<button class="btn ghost bonus" data-id="' + k + '">' + SA.esc(SA.MISSION_NAMES[k]) + (bonusIds.length > 1 ? '' : ' (bonus)') + '</button>').join('') +
          toys.map((tk, i) => '<button class="btn ghost toy" data-i="' + i + '">' + SA.esc(tk.label) + '</button>').join('') +
          '<button class="btn ghost ok">Close</button>' +
        '</div>', 'planet-panel' + (nBtns > 4 ? ' many-actions' : ''));
      panel.querySelector('.pc-art').appendChild(SA.renderBodyCanvas(id, 150));
      const crArt = panel.querySelector('.pc-crit-art');
      if (crArt) crArt.appendChild(SA.renderCritterCanvas(id, 48, crFound));
      const exArt = panel.querySelector('.pc-ex-art');
      if (exArt) exArt.appendChild(exDone ? SA.renderExpertBadge(id, 44) : SA.renderExpertBadge(null, 44));
      // Read aloud: the name, nickname, how it went (or what to finish first), the critter and Expert.
      SA.voice.say(b.name + '. ' + (SA.NICKNAMES[id] ? SA.NICKNAMES[id] + '. ' : '') + said +
        (!critterRow ? '' : crFound ? ' Critter friend: ' + cr.name + '.' : ' A shy critter hides here. Can you spot it?') +
        (!ex ? '' : exDone ? ' You are a ' + b.name + ' Expert!' : ' Expert mission: ' + ex.name + '. It\'s extra tricky, for big explorers!'));
      const fly = panel.querySelector('.fly');
      if (fly) fly.onclick = () => { closePanel(); actions.fly(id); };
      const exBtn = panel.querySelector('.expert-btn');
      if (exBtn) exBtn.onclick = () => { closePanel(); actions.fly(id, { expert: true }); };
      panel.querySelectorAll('.toy').forEach(bt => { bt.onclick = () => { closePanel(); toys[+bt.dataset.i].go(); }; });
      const cardBtn = panel.querySelector('.cardbtn');
      if (cardBtn) cardBtn.onclick = () => { SA.audio.play('pop'); SA.ui.card(id).then(() => SA.ui.planetCard(id, actions)); };
      panel.querySelectorAll('.bonus').forEach(bt => { bt.onclick = () => { SA.audio.play('pop'); SA.ui.planetCard(bt.dataset.id, actions); }; });
      panel.querySelector('.ok').onclick = () => { SA.audio.play('click'); closePanel(); };
    },

    // ---------- Today's space fact ----------
    dailyFact() {
      const days = Math.floor(Date.now() / 86400000);
      const fact = SA.DAILY_FACTS[days % SA.DAILY_FACTS.length];
      const moon = SA.moonTonight();
      openPanel(
        '<div class="daily">' +
          '<div class="daily-burst">🌟</div>' +
          '<div class="panel-kicker">Today\'s Space Fact</div>' +
          '<p class="daily-fact">' + SA.esc(fact) + '</p>' +
          '<div class="daily-moon"><span class="dm-art"></span><span><b>Tonight\'s Moon: ' + SA.esc(moon.name) + '</b><small>' + SA.esc(moon.tip) + '</small></span></div>' +
          '<div class="panel-actions"><button class="btn ghost hear">🔊 Read to me</button><button class="btn primary ok">Wow! 🤩</button></div>' +
        '</div>', 'daily-panel', true);
      panel.querySelector('.dm-art').appendChild(SA.renderMoonCanvas(54, moon));
      SA.audio.play('card');
      SA.voice.say('Today\'s space fact! ' + fact);
      panel.querySelector('.hear').onclick = () => SA.voice.say(fact + ' Tonight\'s Moon: ' + moon.name + '. ' + moon.tip);
      panel.querySelector('.ok').onclick = () => { SA.audio.play('click'); closePanel(); };
    },

    // ---------- Space jokes ----------
    joke() {
      if (!jokeDeck.length) jokeDeck = SA.JOKES.slice().sort(() => Math.random() - 0.5);
      const j = jokeDeck.pop();
      SA.audio.play('pop');
      SA.ui.say([j[0], j[1]], n => { if (n === 1) SA.audio.play('giggle'); });
    },

    // ---------- Parental gate ----------
    // Apple's Kids Category asks for a gate before grown-up areas. A multiplication question
    // typed on a keypad is easy for adults and hard to guess for young children.
    parentGate() {
      return new Promise(resolve => {
        let a, b, typed = '', settled = false, retry = 0;
        const finish = ok => { settled = true; clearTimeout(retry); closePanel(); resolve(ok); };
        const ask = () => {
          if (settled) return;
          a = 3 + Math.floor(Math.random() * 7);
          b = 3 + Math.floor(Math.random() * 7);
          typed = '';
          openPanel(
            '<div class="gate">' +
              '<div class="panel-kicker">🔒 For grown-ups</div>' +
              '<p class="panel-sub">Please ask a grown-up to answer:</p>' +
              '<h2>What is ' + a + ' × ' + b + '?</h2>' +
              '<div class="gate-answer">&nbsp;</div>' +
              '<div class="keypad">' + [1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '✓'].map(k =>
                '<button data-k="' + k + '">' + k + '</button>').join('') + '</div>' +
              '<div class="panel-actions"><button class="btn ghost cancel">Cancel</button></div>' +
            '</div>', 'gate-panel');
          const out = panel.querySelector('.gate-answer');
          panel.querySelectorAll('.keypad button').forEach(btn => {
            btn.onclick = () => {
              if (retry) return;   // a wrong answer is shaking; a fresh question is on its way
              const k = btn.dataset.k;
              SA.audio.play('click');
              if (k === '⌫') typed = typed.slice(0, -1);
              else if (k === '✓') {
                if (typed && +typed === a * b) { finish(true); return; }
                out.classList.remove('wrong');
                void out.offsetWidth;
                out.classList.add('wrong');
                retry = setTimeout(() => { retry = 0; ask(); }, 500);
                return;
              } else if (typed.length < 3) typed += k;
              out.innerHTML = typed || '&nbsp;';
            };
          });
          panel.querySelector('.cancel').onclick = () => { SA.audio.play('click'); finish(false); };
        };
        ask();
      });
    },

    // ---------- For grown-ups: what your child learned (opened from Settings, behind the gate) ----------
    // Built on the device from the saved progress; nothing is sent anywhere.
    parentReport() {
      const st = SA.state, all = SA.MISSIONS.concat(Object.keys(SA.BONUS));
      const done = all.filter(id => st.done[id]);
      const sky = SA.CONSTELLATIONS || [];
      const skyDone = sky.filter(c => st.sky[c.id]);
      const name = id => SA.MISSION_NAMES[id].replace(/^\S+ /, '');
      const plain = s => s.replace(/\s*[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}][\u{FE0F}]?/gu, '');
      const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
      const place = id => SA.BODY[id].name.replace(/^The /, '');
      const stars = id => { const b = st.best[id]; return b ? '★'.repeat(b.m) + '☆'.repeat(3 - b.m) + ' · quiz ' + b.q + '/' + SA.BODY[id].quiz.length : ''; };
      const sum = [
        [done.length + '/' + all.length, 'missions'], [SA.totalStars() + '/' + SA.maxStars(), 'stars'],
        [SA.cardCount() + '/' + SA.BODIES.length, 'fact cards'], [SA.critters.count() + '/' + SA.CRITTERS.length, 'critters'],
        [skyDone.length + '/' + sky.length, 'constellations'], [SA.expertCount() + '/8', 'Expert badges'],
        [String(st.camp ? st.camp.days : 0), 'Space Camp days'],
      ];
      const missions = all.map(id => '<li class="' + (st.done[id] ? '' : 'todo') + '">' + (st.done[id] ? '✅ ' : '⬜ ') +
        '<b>' + SA.esc(place(id)) + '</b>: ' + SA.esc(name(id)) + (st.done[id] ? ' <span>' + stars(id) + (st.expert[id] ? ' · 🎓 Expert' : '') + '</span>' : '') +
        '<small>' + SA.esc(SA.LEARNED[id][0]) + '</small></li>').join('');
      const facts = SA.BODIES.filter(b => st.cards[b.id]).map(b =>
        '<details><summary>' + SA.esc(b.name) + '</summary><ul>' + b.facts.map(f => '<li>' + SA.esc(f) + '</li>').join('') + '</ul></details>').join('') +
        (skyDone.length ? '<details><summary>Constellations (' + skyDone.length + ')</summary><ul>' +
          skyDone.map(c => '<li><b>' + SA.esc(c.name) + '</b>: ' + SA.esc(plain(c.story[1])) + '</li>').join('') + '</ul></details>' : '');
      const tries = done.map(id => '<li class="tip"><b>' + SA.esc(place(id)) + ':</b> ' + SA.esc(SA.LEARNED[id][1]) + '</li>').join('') +
        skyDone.map(c => '<li class="tip"><b>' + SA.esc(c.name) + ':</b> ' + SA.esc(cap(plain(c.tip.replace(/^Stargazing tip: /, '')))) + '</li>').join('');
      // The real sky around today (worked out on the device): the Moon, showers, seasons, anniversaries.
      const today = SA.skyToday();
      const skyWeek = '<li class="tip"><b>Moon tonight:</b> ' + SA.esc(today.moon.name) + ' (' + today.moon.lit + '% lit; full Moon in ' + today.moon.toFull + ' days). ' + SA.esc(plain(today.moon.tip)) +
        ' Your child\'s Space Journal (📔 on the map) has a "Tonight\'s Moon" page for drawing it: a simple Moon diary.</li>' +
        today.events.map(e => '<li class="tip">' + SA.esc(plain(e.grown || e.text)) + '</li>').join('');
      openPanel(
        '<div class="report">' +
          '<div class="panel-kicker">📖 What your child learned</div>' +
          '<div class="report-sum">' + sum.map(s => '<div><b>' + s[0] + '</b><small>' + s[1] + '</small></div>').join('') + '</div>' +
          '<h3>🚀 Missions</h3><ul>' + missions + '</ul>' +
          '<h3>🎴 Facts collected</h3>' + (facts || '<ul><li class="todo">Fact cards appear here as missions are finished.</li></ul>') +
          '<h3>🏡 Things to try together</h3><ul>' + (tries || '<li class="tip">Finish the Earth mission, then try this: in a dark room, shine a torch on a ball and turn it slowly to see day and night.</li>') + '</ul>' +
          '<h3>🗓️ This week\'s sky</h3><ul>' + skyWeek + '</ul>' +
          '<h3>🔭 Stargazing tips</h3><ul>' + SA.STARGAZING_TIPS.map(s => '<li class="tip">' + SA.esc(s) + '</li>').join('') + '</ul>' +
          '<h3>👨‍👩‍👧 Play together</h3><ul>' +
            '<li class="tip"><b>Space Camp</b> (🎤 on the map): a 3-minute daily routine with a real astronaut exercise to do together, one question, and tonight\'s Moon. Camp days are counted, never as a streak, so a missed day costs nothing.</li>' +
            '<li class="tip"><b>Family quiz show</b> (🎤, then Mission Control, then "Family show"): two teams take turns answering questions about the places your child has explored. Every team wins a prize.</li>' +
            '<li class="tip"><b>The Moon Song</b> (🎤): sing it at bedtime, then look for the Moon\'s shape together.</li>' +
          '</ul>' +
          '<p class="report-note">This page is made on this device from the game\'s saved progress. Nothing is sent anywhere, and there are no accounts or ads.</p>' +
        '</div>' +
        '<div class="panel-actions"><button class="btn ghost back">◀ Settings</button><button class="btn primary ok">Close</button></div>', 'report-panel');
      panel.querySelector('.back').onclick = () => { SA.audio.play('click'); SA.ui.settings(); };
      panel.querySelector('.ok').onclick = () => { SA.audio.play('click'); closePanel(); };
    },

    // ---------- Settings (grown-ups) ----------
    settings() {
      const render = () => {
        openPanel(
          '<div class="panel-kicker">⚙️ Settings</div>' +
          '<div class="settings">' +
            '<button class="toggle" data-k="sound">🔊 Sounds <b>' + (SA.state.muted ? 'Off' : 'On') + '</b></button>' +
            '<button class="toggle" data-k="music">🎵 Music <b>' + (SA.state.music !== false ? 'On' : 'Off') + '</b></button>' +
            '<button class="toggle" data-k="voice">🗣️ Read aloud <b>' + (SA.state.voice ? 'On' : 'Off') + '</b></button>' +
            '<button class="toggle" data-k="easy"><span>🧸 Little Explorer mode<small>Easier missions for younger kids</small></span><b>' + (SA.easy() ? 'On' : 'Off') + '</b></button>' +
            '<button class="toggle" data-k="calm"><span>😌 Calm effects<small>Less flashing, shaking and confetti</small></span><b>' + (SA.calm() ? 'On' : 'Off') + '</b></button>' +
            '<button class="toggle" data-k="hemi"><span>🌏 Night sky tips for<small>The half of the world you live in (for "Tonight\'s sky")</small></span><b>' + (SA.state.hemi === 'south' ? 'South' : 'North') + '</b></button>' +
            '<button class="toggle" data-k="report"><span>📖 What your child learned<small>Missions, facts and things to try together</small></span><b>Open</b></button>' +
            '<button class="toggle danger" data-k="reset">🗑️ Start over</button>' +
          '</div>' +
          '<p class="panel-sub small">For grown-ups: no ads, no accounts and no data leaves this device.</p>' +
          '<div class="panel-actions"><button class="btn primary ok">Close</button></div>', 'settings-panel');
        let armed = false;
        panel.querySelectorAll('.toggle').forEach(btn => {
          btn.onclick = () => {
            const k = btn.dataset.k;
            if (k === 'report') { SA.audio.play('click'); SA.ui.parentReport(); return; }
            if (k === 'sound') { SA.state.muted = !SA.state.muted; SA.audio.setMuted(SA.state.muted); }
            if (k === 'music') { SA.state.music = SA.state.music === false; SA.audio.setMusicOn(SA.state.music); }
            if (k === 'voice') { SA.state.voice = !SA.state.voice; if (!SA.state.voice) SA.voice.stop(); }
            if (k === 'easy') SA.state.easy = !SA.state.easy;
            if (k === 'calm') { SA.state.calm = !SA.state.calm; SA.ui.applyCalm(); }
            if (k === 'hemi') SA.state.hemi = SA.state.hemi === 'south' ? 'north' : 'south';
            if (k === 'reset') {
              if (!armed) { armed = true; btn.innerHTML = '⚠️ Tap again to erase all progress'; return; }
              SA.resetProgress();
              closePanel();
              SA.ui.updateHud();
              SA.go(SA.title, {});
              return;
            }
            SA.save();
            SA.audio.play('click');
            render();
          };
        });
        panel.querySelector('.ok').onclick = () => { SA.audio.play('click'); closePanel(); };
      };
      render();
    },
  };
})(window.SA);
