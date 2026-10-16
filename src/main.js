// Boot, resize, input routing, scene transitions and the main loop.
(function (SA) {
  const stage = document.getElementById('stage');
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const fade = document.getElementById('fade');
  // Screen-wide confetti draws on its own layer above the panels (lower resolution is fine).
  const fxCanvas = document.getElementById('fx');
  const fxCtx = fxCanvas.getContext('2d');
  let dpr = 1, scale = 1, fxDpr = 1, fxDirty = false;

  // Logical height is 720 (600 on short phone screens so everything draws bigger there);
  // width follows the screen shape, from iPad 4:3 up to wide phones.
  function resize() {
    const vw = stage.clientWidth, vh = stage.clientHeight;
    SA.H = vh < 520 ? 600 : 720;
    const minW = SA.H * 1.333, maxW = SA.H * 2.22;
    const want = SA.H * (vw / vh);
    SA.W = Math.round(SA.clamp(want, minW, maxW));
    let cw = vw, ch = vh;
    if (want < minW) ch = (vw * SA.H) / minW;
    else if (want > maxW) cw = (vh * maxW) / SA.H;
    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';
    canvas.style.left = (vw - cw) / 2 + 'px';
    canvas.style.top = (vh - ch) / 2 + 'px';
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    scale = cw / SA.W;
    SA.pixelScale = dpr * scale;   // device pixels per logical unit (for baked layers)
    fxDpr = Math.min(dpr, 1.5);
    fxCanvas.style.cssText = 'width:' + cw + 'px;height:' + ch + 'px;left:' + (vw - cw) / 2 + 'px;top:' + (vh - ch) / 2 + 'px';
    fxCanvas.width = Math.round(cw * fxDpr);
    fxCanvas.height = Math.round(ch * fxDpr);
    fxDirty = true;
    if (SA.scene && SA.scene.resize) SA.scene.resize();
  }
  window.addEventListener('resize', resize);

  function toLocal(e) {
    const r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * SA.W, y: ((e.clientY - r.top) / r.height) * SA.H };
  }

  canvas.addEventListener('pointerdown', e => {
    SA.audio.init();
    if (!SA.scene || SA.ui.blocking() || SA.transitioning) return;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    const p = toLocal(e);
    if (SA.critters.tap(p.x, p.y)) return;   // found a shy critter peeking in
    if (SA.scene.onDown) SA.scene.onDown(p.x, p.y);
  });
  canvas.addEventListener('pointermove', e => {
    const p = toLocal(e);
    if (SA.scene && SA.scene.onMove) SA.scene.onMove(p.x, p.y);
  });
  const up = e => {
    const p = toLocal(e);
    if (SA.scene && SA.scene.onUp) SA.scene.onUp(p.x, p.y);
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  document.addEventListener('pointerdown', () => SA.audio.init(), true);
  // Keyboard: space jumps / continues, for testing on a computer.
  window.addEventListener('keydown', e => {
    if (e.code !== 'Space' || !SA.scene) return;
    e.preventDefault();
    if (SA.ui.blocking()) { const n = document.getElementById('btnNext'); if (!document.getElementById('cosmoTalk').hidden && !n.hidden) n.click(); return; }
    if (!e.repeat && SA.scene.onDown) SA.scene.onDown(SA.W / 2, SA.H / 2);
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'Space' && SA.scene && SA.scene.onUp) SA.scene.onUp(SA.W / 2, SA.H / 2);
  });

  SA.setScene = function (scene, opts) {
    if (SA.scene && SA.scene.exit) SA.scene.exit();
    SA.scene = scene;
    scene.enter(opts || {});
  };

  // Fade to black, swap scenes, fade back in. Returns false (and does nothing) if another
  // transition is already running, so callers that must leave can simply try again.
  SA.go = function (scene, opts) {
    if (SA.transitioning) return false;
    SA.transitioning = true;
    fade.classList.add('on');
    setTimeout(() => {
      SA.setScene(scene, opts);
      fade.classList.remove('on');
      setTimeout(() => { SA.transitioning = false; }, 350);
    }, 380);
    return true;
  };

  // Shared end of every planet mission: quiz, then the fact card, then back to the map.
  // missionStars (1-3) is how well the mission went; the quiz adds more.
  SA.finishPlanet = async function (id, missionStars) {
    if (SA.scene !== SA[id]) return;   // the player already went back to the map
    const b = SA.BODY[id];
    const quizStars = await SA.ui.quiz(b.quiz);
    const unlocked = SA.recordStars(id, missionStars || 3, quizStars);
    if (unlocked.length) SA.state.wardNew = true;
    const isNew = SA.giveCard(id);
    const first = !SA.state.done[id];
    if (first) SA.state.baseNew = true;   // a new souvenir sticker for the Space Base
    SA.state.done[id] = true;
    SA.state.at = id;
    SA.save();
    SA.ui.updateHud();
    await SA.ui.card(id, { isNew });
    SA.go(SA.map, { completed: id, unlocked, first });
  };

  // ★★☆ style text for banners.
  SA.starText = n => '★'.repeat(n) + '☆'.repeat(3 - n);

  SA.screenFx = new SA.Particles();
  SA.celebrate = n => {
    SA.screenFx.confetti(SA.calm() ? Math.round(n * 0.3) : n);
    // Big moments (mission complete, Grand Tour) also fire party poppers from the corners.
    if (n >= 100 && !SA.calm()) SA.screenFx.cannons(Math.round(n * 0.5));
  };

  // ---------- Boot ----------
  async function boot() {
    await SA.native.restore();
    SA.load();
    SA.audio.setMuted(SA.state.muted);
    SA.audio.setMusicOn(SA.state.music !== false);
    SA.ui.init();
    SA.title = new SA.TitleScene();
    SA.map = new SA.MapScene();
    SA.flight = new SA.FlightScene();
    SA.earth = new SA.EarthScene();
    SA.mars = new SA.MarsScene();
    SA.jupiter = new SA.JupiterScene();
    SA.saturn = new SA.SaturnScene();
    SA.venus = new SA.VenusScene();
    SA.mercury = new SA.MercuryScene();
    SA.uranus = new SA.UranusScene();
    SA.neptune = new SA.NeptuneScene();
    SA.moon = new SA.MoonScene();
    SA.belt = new SA.BeltScene();
    SA.sun = new SA.SunScene();
    SA.comet = new SA.CometScene();
    SA.sky = new SA.SkyScene();
    SA.iss = new SA.IssScene();
    SA.workshop = new SA.WorkshopScene();
    SA.playground = new SA.PlaygroundScene();
    SA.europa = new SA.EuropaScene();
    SA.galaxy = new SA.GalaxyScene();
    SA.garden = new SA.GardenScene();
    SA.titan = new SA.TitanScene();
    SA.journal = new SA.JournalScene();
    SA.postcard = new SA.PostcardScene();
    SA.quizshow = new SA.QuizShowScene();
    SA.song = new SA.SongScene();
    SA.marsbase = new SA.MarsBaseScene();
    SA.camp = new SA.CampScene();
    SA.base = new SA.BaseScene();
    resize();
    SA.setScene(SA.title);
    requestAnimationFrame(frame);
    requestAnimationFrame(() => SA.native.ready());
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { SA.save(); SA.voice.stop(); SA.audio.suspend(); }
    else SA.audio.resume();
  });
  window.addEventListener('pagehide', SA.save);

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    SA.scene.update(dt);
    SA.critters.update(dt);
    SA.screenFx.update(dt);
    SA.ui.tick(dt);
    SA.audio.tick();
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    ctx.clearRect(0, 0, SA.W, SA.H);
    SA.scene.draw(ctx);
    SA.critters.draw(ctx);
    // The confetti layer is only redrawn while something is on it (and once more to clear it).
    if (SA.screenFx.list.length || fxDirty) {
      fxCtx.setTransform(fxDpr * scale, 0, 0, fxDpr * scale, 0, 0);
      fxCtx.clearRect(0, 0, SA.W, SA.H);
      SA.screenFx.draw(fxCtx);
      fxDirty = SA.screenFx.list.length > 0;
    }
    requestAnimationFrame(frame);
  }
  boot();
})(window.SA);
