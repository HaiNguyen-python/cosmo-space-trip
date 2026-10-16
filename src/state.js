// Saved progress: collected cards, finished planets, stars and settings.
(function (SA) {
  const KEY = SA.SAVE_KEY = 'cosmo-space-trip-v1';

  SA.defaultState = () => ({
    cards: {},       // id -> true once the fact card is collected
    done: {},        // id -> true once the planet's mission is finished
    best: {},        // id -> { m: mission stars 1-3, q: quiz stars } (best ever, so replays can improve)
    hat: 'none',     // Cosmo's Wardrobe choices
    paint: 'classic',
    at: 'earth',     // where the rocket is parked on the map
    introSeen: false,
    critters: {},    // mission id -> true once its shy space critter has been found
    base: [],        // stickers placed in Cosmo's Space Base: { k, x, y, s } (x, y as 0-1 of the screen)
    baseSeen: false,
    baseNew: false,  // pink dot on the 🏠 button when something new arrives at the base
    news2: false,    // returning players have heard about the Space Base update
    news3: false,    // ...and about the comet, the Night Sky and Cosmo's emotes
    sky: {},         // Night Sky: constellation id -> true once its stars are connected
    skySeen: false,  // heard Cosmo's Night Sky welcome
    myStars: null,   // the child's own constellation: { seed, lines: [[a, b], ...], name }
    critterMedal: false, // stays earned even when a new critter joins the club later
    surpriseDay: '', // the day Cosmo last pointed out the Space Base's daily surprise
    news4: false,    // ...and about the space station, Rocket Workshop, Space Playground and spinning planets
    rocketBest: 0,   // Rocket Workshop: highest place reached (0 none, 1 treetops ... 5 orbit, 6 the Moon)
    rocketBuild: null, // the last rocket built: { n, t, e, f } part choices (0-2 each)
    workshopSeen: false,
    playSeen: false, // heard Cosmo's Space Playground welcome
    news5: false,    // ...and that the space station now opens after Saturn
    hemi: 'north',   // grown-up setting: which half of the world "Tonight's sky" is for ('north' or 'south')
    news6: false,    // ...and about Europa, the Galaxy Trip, the greenhouse and flying the child's own rocket
    rocketShape: null, // 'classic' to fly Cosmo's old rocket; otherwise the Workshop rocket flies everywhere once built
    garden: { pots: [null, null, null], grown: {} }, // greenhouse: { pots: [ { k, n, d } | null ] x3, grown: { plant id: true } } (see garden.js)
    gardenSeen: false,
    news7: false,    // ...and about Titan, the Space Journal and postcards from Cosmo's family
    story: 0,        // how many of Cosmo's space postcards from home have been read (0-5, see story.js)
    storyNew: 0,     // the postcard waiting at the base's dish (0 none); told on the map once
    storyAt: 0,      // missions finished when the last postcard was read (the next needs one more)
    journalSeen: false,
    news8: false,    // ...and about Expert missions, the quiz show, the Planet Song and the Mars Base builder
    expert: {},      // planet id -> true once its Expert mission is done (gold 🎓 badge; never required)
    replies: [],     // postcards: the fact card the child picked for each reply (re-read in the Journal)
    prizes: {},      // Mission Control quiz show: silly prize id -> true once won
    shows: 0,        // quiz shows played (no score is kept: every show is a win)
    showSeen: false,
    songDone: false, // sang the whole Planet Song once (a microphone sticker)
    songSeen: false,
    marsBase: { p: [null, null, null, null, null, null, null, null, null, null], done: false }, // Mars Base builder: a part id per plot (10 since the lab and pad)
    marsSeen: false,
    news9: false,    // ...and about Space Camp, the Moon Song, family quiz shows and the new Mars Base parts
    moonSongDone: false, // sang the whole Moon Song once (a crescent Moon sticker)
    showTeams: false, // Mission Control: the last show was a two-team family show
    familyShows: 0,  // family (two-team) quiz shows played
    camp: { days: 0, last: '', seen: false }, // Cosmo's Space Camp: days of camp done (not a streak) and the last day
    muted: false,
    music: true,
    voice: true,
  });
  SA.state = SA.defaultState();

  SA.load = function () {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) Object.assign(SA.state, JSON.parse(raw));
    } catch (e) { /* storage unavailable: play without saving */ }
    // Older saves (before the Space Base) lack these, or could hold something unexpected.
    const s = SA.state;
    const obj = v => !!v && typeof v === 'object' && !Array.isArray(v);
    for (const k of ['cards', 'done', 'best', 'critters', 'sky']) if (!obj(s[k])) s[k] = {};
    // Best stars feed every star total, so an odd entry is fixed rather than allowed to break the count.
    for (const id of Object.keys(s.best)) {
      const b = s.best[id];
      if (!obj(b) || !SA.BODY[id] || !SA.BODY[id].quiz) { delete s.best[id]; continue; }
      s.best[id] = { m: SA.clamp(Math.floor(+b.m) || 0, 0, 3), q: SA.clamp(Math.floor(+b.q) || 0, 0, SA.BODY[id].quiz.length) };
    }
    if (!Array.isArray(s.base)) s.base = [];
    if (typeof s.hat !== 'string') s.hat = 'none';
    if (typeof s.paint !== 'string') s.paint = 'classic';
    if (typeof s.at !== 'string') s.at = 'earth';
    if (s.hemi !== 'south') s.hemi = 'north';
    const my = s.myStars;
    if (my && !(isFinite(my.seed) && Array.isArray(my.lines) && my.lines.every(l => Array.isArray(l) && l.length === 2 && l.every(isFinite)))) s.myStars = null;
    if (s.myStars && typeof s.myStars.name !== 'string') s.myStars.name = 'My own constellation';
    s.rocketBest = SA.clamp(Math.floor(+s.rocketBest) || 0, 0, 6);
    const rb = s.rocketBuild;
    if (rb && !(rb && typeof rb === 'object' && ['n', 't', 'e', 'f'].every(k => [0, 1, 2].indexOf(rb[k]) >= 0))) s.rocketBuild = null;
    if (s.rocketShape !== 'classic' && s.rocketShape !== 'mine') s.rocketShape = null;
    s.story = SA.clamp(Math.floor(+s.story) || 0, 0, 5);
    s.storyNew = SA.clamp(Math.floor(+s.storyNew) || 0, 0, 5);
    s.storyAt = SA.clamp(Math.floor(+s.storyAt) || 0, 0, 99);
    if (s.storyNew !== s.story + 1) s.storyNew = 0;   // only the next postcard can be waiting
    // This round's fields: Expert badges, postcard replies, quiz-show prizes and the Mars Base.
    if (!obj(s.expert)) s.expert = {};
    for (const id of Object.keys(s.expert)) if (!s.expert[id] || SA.MISSIONS.indexOf(id) < 0) delete s.expert[id];
    s.replies = (Array.isArray(s.replies) ? s.replies : []).slice(0, 5).map(r => (typeof r === 'string' && (r === 'crit' || SA.BODY[r]) ? r : null));
    if (!obj(s.prizes)) s.prizes = {};
    for (const id of Object.keys(s.prizes)) if (!s.prizes[id] || !SA.PRIZES || !SA.PRIZES.some(p => p.id === id)) delete s.prizes[id];
    s.shows = SA.clamp(Math.floor(+s.shows) || 0, 0, 9999);
    const mb = obj(s.marsBase) ? s.marsBase : {}, mp0 = Array.isArray(mb.p) ? mb.p : [];
    // Bases built before the science lab and launch pad had 8 spots (4 back, 4 front); each row
    // got a fifth spot on its right, so older parts keep their row and place.
    const mp = mp0.length <= 8 ? [mp0[0], mp0[1], mp0[2], mp0[3], null, mp0[4], mp0[5], mp0[6], mp0[7], null] : mp0;
    const PARTS = SA.MARS_PARTS ? SA.MARS_PARTS.map(p => p.id) : [];
    const seenPart = {};
    s.marsBase = {
      p: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => {
        const k = mp[i];
        if (typeof k !== 'string' || PARTS.indexOf(k) < 0 || seenPart[k]) return null;
        seenPart[k] = true;   // each part is built once
        return k;
      }),
      done: !!mb.done,
    };
    // Space Camp: how many different days of camp were finished (never a streak) and the last one.
    const cp = obj(s.camp) ? s.camp : {};
    s.camp = { days: SA.clamp(Math.floor(+cp.days) || 0, 0, 9999), last: typeof cp.last === 'string' ? cp.last : '', seen: !!cp.seen };
    s.familyShows = SA.clamp(Math.floor(+s.familyShows) || 0, 0, 9999);
    s.showTeams = !!s.showTeams;
    s.moonSongDone = !!s.moonSongDone;
    // Greenhouse pots: a known plant, how many days it has been watered (0-4), the last day watered.
    const g = obj(s.garden) ? s.garden : {};
    const PLANTS = ['lettuce', 'zinnia', 'tomato', 'shroom', 'tulip'];
    const pots = Array.isArray(g.pots) ? g.pots : [];
    s.garden = {
      pots: [0, 1, 2].map(i => {
        const p = pots[i];
        if (!obj(p) || PLANTS.indexOf(p.k) < 0) return null;
        return { k: p.k, n: SA.clamp(Math.floor(+p.n) || 0, 0, 4), d: typeof p.d === 'string' ? p.d : '' };
      }),
      grown: obj(g.grown) ? g.grown : {},
    };
    // The Critter Club medal was earned with the first 11 critters; a 12th (Frosty, the comet
    // critter) came later, so anyone who already had them all keeps the medal.
    if (!s.critterMedal && ['earth', 'mars', 'belt', 'jupiter', 'saturn', 'venus', 'mercury', 'uranus', 'neptune', 'moon', 'sun'].every(id => s.critters[id])) s.critterMedal = true;
    // Keep only stickers the base can draw (an unknown one would be invisible yet still
    // grabbable), on screen, at a known size, and no more than the base holds.
    const SIZES = [0.7, 1, 1.5];
    s.base = s.base.filter(b => b && typeof b.k === 'string' && isFinite(b.x) && isFinite(b.y) &&
      (!SA.stickerLook || SA.stickerLook(b.k))).slice(-40).map(b => ({
      k: b.k, x: SA.clamp(+b.x, 0.02, 0.98), y: SA.clamp(+b.y, 0.04, 0.96), s: SIZES.indexOf(b.s) >= 0 ? b.s : 1,
    }));
  };
  // The sticker "pop" animation is screen-only and never needs saving.
  const skipAnim = (k, v) => (k === 'pop' ? undefined : v);
  SA.save = function () {
    const json = JSON.stringify(SA.state, skipAnim);
    try { localStorage.setItem(KEY, json); } catch (e) { /* ignore */ }
    if (SA.native) SA.native.persist(json);
  };
  SA.resetProgress = function () {
    const keep = { muted: SA.state.muted, music: SA.state.music, voice: SA.state.voice, easy: SA.state.easy, calm: SA.state.calm, hemi: SA.state.hemi };    SA.state = Object.assign(SA.defaultState(), keep);
    SA.save();
    // The Space Journal's drawings are kept apart from the save; starting over clears them too.
    try { localStorage.removeItem(SA.JOURNAL_KEY); } catch (e) { /* ignore */ }
  };
  SA.JOURNAL_KEY = 'cosmo-space-trip-journal';

  // Earth is the first stop; each later mission opens when the one before it is done.
  SA.isUnlocked = function (id) {
    // The deep-space finale opens once the secret dwarf planet Pluto has been found.
    if (id === 'galaxy') return !!SA.state.cards.pluto || !!SA.state.done.galaxy;
    if (SA.BONUS[id]) return !!SA.state.done[SA.BONUS[id]];
    const i = SA.MISSIONS.indexOf(id);
    if (i < 0) return false;
    return i === 0 || !!SA.state.done[id] || !!SA.state.done[SA.MISSIONS[i - 1]];
  };

  // The bonus missions a planet opens (Saturn opens two: the comet and the space station).
  SA.bonusesOf = id => Object.keys(SA.BONUS).filter(k => SA.BONUS[k] === id);

  // ---------- Stars ----------
  SA.allMissions = () => SA.MISSIONS.concat(Object.keys(SA.BONUS));
  SA.maxStars = () => SA.allMissions().reduce((n, id) => n + 3 + SA.BODY[id].quiz.length, 0);

  SA.dayKey = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };

  // Player-friendly options from Settings.
  SA.easy = () => !!SA.state.easy;     // Little Explorer mode: gentler versions of every mission
  SA.calm = () => !!SA.state.calm;     // Calm effects: less flashing, shaking and confetti

  // Short intros when replaying a mission: a quick hello plus the how-to-play line.
  SA.introLines = function (id, lines) {
    if (!SA.state.done[id]) return lines;
    return ['Welcome back to ' + SA.BODY[id].name.replace(/^The /, 'the ') + '! ' + lines[lines.length - 1]];
  };
  SA.totalStars = function () {
    let n = 0;
    for (const id in SA.state.best) n += (SA.state.best[id].m || 0) + (SA.state.best[id].q || 0);
    return n;
  };
  // Keeps the best result for a mission; returns the wardrobe items this newly unlocked.
  SA.recordStars = function (id, mission, quiz) {
    const before = SA.totalStars();
    const b = SA.state.best[id] || { m: 0, q: 0 };
    SA.state.best[id] = { m: Math.max(b.m, mission), q: Math.max(b.q, quiz) };
    const after = SA.totalStars();
    return SA.HATS.concat(SA.PAINTS).filter(it => !it.tour && !it.story && !it.expert && it.need > before && it.need <= after);
  };
  // Grand Tour rewards unlock by visiting every planet, Grandma's hat with the family's visit
  // (the last space postcard), the Expert cap with all 8 Expert badges, and the rest by total stars.
  SA.expertCount = () => SA.MISSIONS.filter(id => SA.state.expert && SA.state.expert[id]).length;
  SA.hasItem = it => (it.tour ? !!SA.state.tourDone : it.story ? SA.state.story >= it.story : it.expert ? SA.expertCount() >= it.expert : SA.totalStars() >= it.need);
  SA.giveCard = function (id) {
    const isNew = !SA.state.cards[id];
    SA.state.cards[id] = true;
    if (isNew) SA.state.baseNew = true;   // a new planet sticker for the Space Base
    SA.save();
    return isNew;
  };
  SA.cardCount = () => Object.keys(SA.state.cards).filter(k => SA.state.cards[k]).length;
})(window.SA);
