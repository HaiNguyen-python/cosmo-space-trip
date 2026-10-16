// Cosmo's Space Journal (📔 on the map): a scrapbook where the child draws with crayons and stamps
// the planets and critters they have found. Each new page comes with a gentle prompt ("Draw what you
// saw on Titan!"), and a "Tonight's Moon" page shows the real Moon phase for today (worked out on
// the device) with where to look for it: a Moon diary. Nothing can go wrong: there is an undo,
// stamps can be moved or dragged off the page, and a page can be wiped clean.
// Drawings are saved only on this device, in their own storage key (never in the main save, never
// sent anywhere). Strokes are stored as compact points, so a full journal stays small.
(function (SA) {
  const TAU = Math.PI * 2;
  const $ = id => document.getElementById(id);
  const PW = 1000, PH = 640;          // paper size in its own units (drawings survive any screen)
  const MAX_PAGES = 30, MAX_POINTS = 9000, MAX_STAMPS = 30;
  const COLORS = ['#1d2747', '#e8352f', '#ff9f1c', '#ffd23a', '#3fbf5a', '#3a8fe0', '#8f5bff', '#ff7ac8'];
  const ERASER = COLORS.length;
  const LINE = 9, RUB = 34;           // crayon and eraser widths in paper units
  const SIZES = [0.7, 1, 1.5];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // ---------- Saving (its own key, on this device only) ----------
  const enc = n => SA.clamp(Math.round(n), 0, 1295).toString(36).padStart(2, '0');
  function decode(str) {
    const pts = [];
    for (let i = 0; i + 3 < str.length; i += 4) pts.push([parseInt(str.substr(i, 2), 36), parseInt(str.substr(i + 2, 2), 36)]);
    return pts;
  }
  function load() {
    let data = null;
    try { data = JSON.parse(localStorage.getItem(SA.JOURNAL_KEY) || 'null'); } catch (e) { data = null; }
    const pages = data && Array.isArray(data.pages) ? data.pages : [];
    // Keep only what can be drawn (a damaged page is dropped rather than breaking the journal).
    return {
      pages: pages.filter(p => p && typeof p.topic === 'string').slice(0, MAX_PAGES + 5).map(p => ({
        topic: p.topic, day: typeof p.day === 'string' ? p.day : '',
        s: (Array.isArray(p.s) ? p.s : []).filter(s => s && typeof s.p === 'string' && /^[0-9a-z]*$/.test(s.p) && s.c >= 0 && s.c <= ERASER).map(s => ({ c: s.c | 0, p: s.p })),
        st: (Array.isArray(p.st) ? p.st : []).filter(s => s && typeof s.k === 'string' && isFinite(s.x) && isFinite(s.y)).slice(0, MAX_STAMPS)
          .map(s => ({ k: s.k, x: SA.clamp(+s.x, 0, PW), y: SA.clamp(+s.y, 0, PH), s: SIZES.indexOf(s.s) >= 0 ? s.s : 1 })),
      })),
    };
  }

  // ---------- Page prompts ----------
  const placeName = id => SA.BODY[id].name.replace(/^The /, 'the ');
  function promptText(topic) {
    if (topic === 'moon') return 'Tonight\'s Moon';
    if (topic === 'free') return 'Draw anything you like! ✏️';
    if (topic === 'critter') return 'Draw your favourite critter friend! 🐾';
    if (topic === 'rocket') return 'Design your dream rocket! 🚀';
    if (topic === 'alien') return 'Draw a new alien friend for me! 👽';
    if (topic === 'myplanet') return 'Invent your own planet! Does it have rings? 🪐';
    if (topic === 'window') return 'Draw the sky from your window! ✨';
    if (topic === 'family') return 'Draw a picture for my sister Dot! 💌';
    if (topic.indexOf('place:') === 0 && SA.BODY[topic.slice(6)]) return 'Draw what we saw on ' + placeName(topic.slice(6)) + '!';
    const pc = postcardOf(topic);
    if (pc) return '💌 Postcard from ' + pc.names.join(' & ').replace(/ & ([^&]*)$/, ' and $1').replace(/ & /g, ', ');
    return 'Draw anything you like! ✏️';
  }
  // Postcards from Cosmo's family get their own pages ("post:1" .. "post:5"), added once read.
  const postN = topic => (/^post:[1-5]$/.test(topic) ? +topic.slice(5) : 0);
  const postcardOf = topic => (postN(topic) && SA.story && SA.story.page ? SA.story.page(postN(topic) - 1) : null);
  const drawingPages = pages => pages.filter(p => !postN(p.topic)).length;
  function nextTopic(pages) {
    const today = SA.dayKey();
    if (!pages.some(p => p.topic === 'moon' && p.day === today)) return 'moon';
    const recent = pages.slice(-6).map(p => p.topic);
    const pool = [];
    // Places we have explored, newest first (the last one visited is the likeliest).
    const at = SA.state.at;
    if (SA.state.done[at] && SA.BODY[at]) pool.push('place:' + at, 'place:' + at);
    for (const id of SA.allMissions()) if (SA.state.done[id]) pool.push('place:' + id);
    if (SA.critters.count()) pool.push('critter');
    if (SA.state.story >= 1) pool.push('family');
    pool.push('rocket', 'alien', 'myplanet', 'window', 'free');
    return pool.find(t => recent.indexOf(t) < 0) || 'free';
  }

  // Stamps: always-there fun ones, then found critters and collected cards.
  function stampKeys() {
    const out = ['i:star', 'i:heart', 'cosmo', 'moon', 'i:rocket', 'i:alien', 'i:saucer', 'i:balloon'];
    for (const c of SA.CRITTERS) if (SA.state.critters[c.id]) out.push('c:' + c.id);
    for (const b of SA.BODIES) if (SA.state.cards[b.id]) out.push('b:' + b.id);
    return out;
  }
  const bodyPics = new Map();
  function drawStamp(ctx, k, x, y, r, t) {
    const [type, id] = k.split(':');
    if (k === 'i:star') {
      ctx.fillStyle = '#ffd23a'; ctx.strokeStyle = '#b8860b'; ctx.lineWidth = Math.max(1.5, r * 0.08);
      SA.starPath(ctx, x, y, r, 0.45, 5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; SA.circle(ctx, x - r * 0.18, y - r * 0.2, r * 0.14); ctx.fill();
    } else if (k === 'i:heart') {
      ctx.fillStyle = '#ff5d8a'; ctx.strokeStyle = '#b8285a'; ctx.lineWidth = Math.max(1.5, r * 0.08);
      SA.heart(ctx, x, y + r * 0.1, r * 0.75); ctx.fill(); ctx.stroke();
    } else if (type === 'i') SA.icon(ctx, id, x, y, r * 1.9);
    else if (k === 'cosmo') SA.drawCosmo(ctx, x, y - r * 0.05, r / 50, { t, noBob: true });
    else if (k === 'moon') SA.drawMoonTonight(ctx, x, y, r * 0.8);
    else if (type === 'c' && SA.CRITTER[id]) SA.drawCritter(ctx, x, y, r / 40, SA.CRITTER[id], { t });
    else if (type === 'b' && SA.BODY[id]) {
      let c = bodyPics.get(id);
      if (!c) { c = SA.renderBodyCanvas(id, 110); bodyPics.set(id, c); }
      ctx.drawImage(c, x - r * 1.15, y - r * 1.15, r * 2.3, r * 2.3);
    }
  }
  const stampOk = k => {
    const [type, id] = k.split(':');
    return k === 'cosmo' || k === 'moon' || k === 'i:star' || k === 'i:heart' || (type === 'i' && SA.ICON_NAMES.indexOf(id) >= 0) ||
      (type === 'c' && !!SA.CRITTER[id]) || (type === 'b' && !!SA.BODY[id]);
  };

  class JournalScene {
    constructor() {
      this.t = 0;
      this.fx = new SA.Particles();
      this.tool = 0;
      this.ink = document.createElement('canvas');
      this.paperC = document.createElement('canvas');
    }

    // ---------- Layout ----------
    hudBottom() {
      const c = $('game').getBoundingClientRect(), h = $('toyHud').getBoundingClientRect();
      if (!c.height || !h.height) return SA.H * 0.13;
      return ((h.bottom - c.top) / c.height) * SA.H;
    }
    layout() {
      const W = SA.W, H = SA.H;
      this.toolW = 150;
      const top = Math.max(H * 0.1, this.hudBottom() + 8), x0 = 14, x1 = W - this.toolW - 10, y1 = H - 12;
      const s = Math.min((x1 - x0) / PW, (y1 - top) / PH);
      this.ps = s;
      this.paper = { x: x0 + ((x1 - x0) - PW * s) / 2, y: top + ((y1 - top) - PH * s) / 2, w: PW * s, h: PH * s };
      // Tool buttons down the right: 8 crayons in two columns, eraser and undo, stamps, clear.
      const tx = W - this.toolW / 2 - 4, gap = Math.min(58, (y1 - top) / 9.6), r = Math.min(23, gap * 0.42);
      this.btns = [];
      COLORS.forEach((c, i) => this.btns.push({ id: 'c' + i, x: tx + (i % 2 ? 30 : -30), y: top + r + Math.floor(i / 2) * gap, r }));
      const y2 = top + r + 4 * gap + 6;
      this.btns.push({ id: 'eraser', x: tx - 30, y: y2, r }, { id: 'undo', x: tx + 30, y: y2, r });
      this.btns.push({ id: 'stamp', x: tx, y: y2 + gap * 1.25, r: r * 1.35 });
      this.btns.push({ id: 'clear', x: tx, y: Math.min(y1 - r, y2 + gap * 2.6), r: r * 0.95 });
      this.bakePaper();
      this.rebuildInk();
    }
    resize() { this.layout(); }

    enter() {
      SA.ui.setScene('toy');
      SA.audio.music('journal');
      $('btnToyBack').textContent = '🗺️ Map';
      const pick = $('toyPick');
      this.data = load();
      // Every postcard that has been read gets a page (once), so it can be read again.
      let posted = 0;
      for (let n = 1; n <= SA.state.story; n++) {
        if (!this.data.pages.some(p => p.topic === 'post:' + n)) { this.data.pages.push({ topic: 'post:' + n, day: SA.dayKey(), s: [], st: [] }); posted++; }
      }
      if (posted) this.saveNow();
      const hasPost = this.data.pages.some(p => postN(p.topic));
      pick.innerHTML = '<button class="round-btn toy-btn" data-a="prev" aria-label="Page before">◀</button>' +
        '<button class="round-btn toy-btn" data-a="new" aria-label="New page">➕</button>' +
        '<button class="round-btn toy-btn" data-a="next" aria-label="Next page">▶</button>' +
        (hasPost ? '<span class="sep"></span><button class="round-btn toy-btn" data-a="post" aria-label="Postcards from Cosmo\'s family">💌</button>' : '');
      pick.querySelectorAll('button').forEach(b => { b.onclick = () => { if (SA.scene === this && !SA.ui.blocking() && !SA.transitioning) this.pageBtn(b.dataset.a); }; });
      this.undo = [];
      this.stroke = null;
      this.drag = null;
      this.trayOpen = false;
      this.stamp = null;
      this.armed = false;
      this.full = false;
      // Open on today's Moon page (made if needed), or the last page.
      let made = false;
      if (!this.data.pages.length || !this.data.pages.some(p => p.topic === 'moon' && p.day === SA.dayKey())) {
        made = this.addPage(true);
      }
      this.pi = this.data.pages.length - 1;
      // A newly arrived postcard opens first.
      if (posted && SA.state.journalSeen) this.pi = Math.max(0, this.data.pages.findIndex(p => p.topic === 'post:' + SA.state.story));
      this.layout();
      this.updateInfo();
      const pg = this.page();
      if (posted && SA.state.journalSeen) {
        SA.ui.say(['I put the postcard from my family in our journal! 💌 Now we can read it again any time. Tap 💌 to find the postcards.']).then(() => { if (SA.scene === this) this.readPrompt(); });
        return;
      }
      if (!SA.state.journalSeen) {
        SA.ui.say([
          'This is our Space Journal! 📔 Real scientists keep journals to draw what they discover.',
          'Pick a crayon on the right and draw with your finger. Tap the ⭐ button to stamp the planets and critters you found!',
          'Tap ➕ for a new page. Your drawings stay safe right here on this device. 🔒',
        ]).then(() => { SA.state.journalSeen = true; SA.save(); if (SA.scene === this) this.readPrompt(); });
      } else if (made || pg.topic === 'moon') this.readPrompt();
      else SA.ui.hint('Welcome back to our Space Journal! 📔 ' + promptText(pg.topic), 5);
    }
    exit() {
      SA.ui.hideTalk(); this.finishStroke(); this.saveNow(); this.trayOpen = false;
      // Let go of the two page-sized pictures (memory on older iPads); enter() makes them again.
      this.ink.width = this.ink.height = this.paperC.width = this.paperC.height = 1;
    }
    back() { SA.go(SA.map, {}); }

    page() { return this.data.pages[this.pi]; }
    updateInfo() { SA.ui.setInfo('📔 Page ' + (this.pi + 1) + ' / ' + this.data.pages.length); }

    // Cosmo reads the page's prompt (and, on a Moon page, where to look tonight).
    readPrompt() {
      const pg = this.page();
      const pc = postcardOf(pg.topic);
      if (pc) { SA.ui.hint('"' + pc.letter + '"' + (pc.reply ? ' I wrote back: "' + pc.reply.replace(/\s*[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]️?$/u, '') + '"' : '') + ' ✏️ You can draw a picture back!', 0); return; }
      if (pg.topic !== 'moon') { SA.ui.hint(promptText(pg.topic), 6); return; }
      const today = pg.day === SA.dayKey();
      const m = today ? SA.moonTonight() : SA.moonTonight(this.dateOf(pg.day));
      if (!today) { SA.ui.hint('On this day, the Moon was ' + m.look + ': a ' + m.name + '. 🌙', 6); return; }
      const ev = SA.skyToday().events[0];
      SA.ui.hint('Tonight the Moon is ' + m.look + ': a ' + m.name + '! 🌙 ' + m.tip + ' Draw the Moon you see tonight!' + (ev ? ' ' + ev.text : ''), 0);
    }
    dateOf(day) { const p = day.split('-').map(Number); return p.length === 3 && p.every(isFinite) ? new Date(p[0], p[1] - 1, p[2], 12) : new Date(); }

    addPage(quiet) {
      if (drawingPages(this.data.pages) >= MAX_PAGES) {
        if (!quiet) SA.ui.hint('Wow, your journal is full! 📔 You can wipe a page clean with the 🧽 button and draw on it again.', 6);
        return false;
      }
      this.data.pages.push({ topic: nextTopic(this.data.pages), day: SA.dayKey(), s: [], st: [] });
      this.saveNow();
      return true;
    }

    pageBtn(a) {
      this.finishStroke();
      this.trayOpen = false;
      this.armed = false;
      if (a === 'new') {
        if (!this.addPage(false)) { SA.audio.play('wrong'); return; }
        this.pi = this.data.pages.length - 1;
        SA.audio.play('card');
      } else if (a === 'post') {
        // Flip to the next postcard page (round and round).
        const pages = this.data.pages, idx = pages.map((p, i) => (postN(p.topic) ? i : -1)).filter(i => i >= 0);
        if (!idx.length) return;
        this.pi = idx.find(i => i > this.pi) != null ? idx.find(i => i > this.pi) : idx[0];
        SA.audio.play('card');
      } else {
        const n = this.pi + (a === 'next' ? 1 : -1);
        if (n < 0 || n >= this.data.pages.length) { SA.audio.play('boing'); SA.ui.hint(a === 'next' ? 'This is the last page! Tap ➕ for a new one.' : 'This is the very first page!', 3); return; }
        this.pi = n;
        SA.audio.play('whoosh');
      }
      this.undo = [];
      this.full = false;
      this.updateInfo();
      this.bakePaper();
      this.rebuildInk();
      this.readPrompt();
    }

    saveNow() {
      clearTimeout(this.saveT);
      if (!this.data) return;
      try { localStorage.setItem(SA.JOURNAL_KEY, JSON.stringify(this.data, (k, v) => (k === 'pop' ? undefined : v))); }
      catch (e) { if (!this.warned) { this.warned = true; SA.ui.hint('Your journal is very full! Try wiping an old page with 🧽.', 6); } }
    }
    saveSoon() { clearTimeout(this.saveT); this.saveT = setTimeout(() => this.saveNow(), 400); }

    // ---------- Paper and ink ----------
    bakePaper() {
      const p = this.paper, ps = SA.clamp(SA.pixelScale || 1, 1, 1.6), c = this.paperC;
      c.width = Math.max(2, Math.round(p.w * ps)); c.height = Math.max(2, Math.round(p.h * ps));
      const g = c.getContext('2d'), s = (p.w / PW) * ps, pg = this.page();
      g.setTransform(s, 0, 0, s, 0, 0);
      const bg = g.createLinearGradient(0, 0, 0, PH);
      bg.addColorStop(0, '#fffaf0'); bg.addColorStop(1, '#f7ecd6');
      g.fillStyle = bg; g.fillRect(0, 0, PW, PH);
      // Faint dotted grid, like a real science notebook.
      g.fillStyle = 'rgba(120,140,190,0.22)';
      for (let x = 40; x < PW; x += 40) for (let y = 120; y < PH; y += 40) { g.beginPath(); g.arc(x, y, 1.6, 0, TAU); g.fill(); }
      // Header: the prompt and the date.
      g.fillStyle = 'rgba(143,91,255,0.12)';
      g.fillRect(0, 0, PW, 92);
      g.strokeStyle = 'rgba(143,91,255,0.35)'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(0, 92); g.lineTo(PW, 92); g.stroke();
      const d = this.dateOf(pg.day);
      g.textAlign = 'left'; g.textBaseline = 'middle';
      g.fillStyle = '#4b2d9a';
      g.font = '800 40px ' + SA.FONT;
      const moon = pg.topic === 'moon' ? SA.moonTonight(d) : null;
      g.fillText(moon ? 'Tonight\'s Moon: ' + moon.name : promptText(pg.topic), 26, 40, PW - (moon ? 190 : 60));
      g.font = '700 22px ' + SA.FONT;
      g.fillStyle = '#6b7190';
      g.fillText(DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() + (moon ? '  ·  ' + moon.lit + '% lit  ·  Full Moon in ' + moon.toFull + (moon.toFull === 1 ? ' day' : ' days') : ''), 28, 74);
      const pc = postcardOf(pg.topic);
      if (pc) this.bakePostcard(g, pc);
      if (moon) {
        // The real phase, drawn small in the corner, and a dashed circle to draw it in.
        const glow = g.createRadialGradient(PW - 80, 46, 10, PW - 80, 46, 70);
        glow.addColorStop(0, 'rgba(30,30,70,0.9)'); glow.addColorStop(1, 'rgba(30,30,70,0.85)');
        g.fillStyle = '#1b1d44'; SA.rrect(g, PW - 150, 6, 140, 80, 18); g.fill();
        SA.drawMoonTonight(g, PW - 80, 46, 32, moon);
        g.setLineDash([10, 12]);
        g.strokeStyle = 'rgba(120,140,190,0.5)'; g.lineWidth = 4;
        g.beginPath(); g.arc(PW / 2, 370, 190, 0, TAU); g.stroke();
        g.setLineDash([]);
        g.font = '700 22px ' + SA.FONT; g.textAlign = 'center'; g.fillStyle = 'rgba(107,113,144,0.75)';
        g.fillText('Draw the Moon you see tonight!', PW / 2, 600);
      }
    }
    // A postcard page: a stamp and the family's portrait on the left, their letter on ruled lines on
    // the right, Cosmo's reply underneath, and room for the child to draw a picture back.
    bakePostcard(g, pc) {
      const wrapText = (text, maxW) => {
        const out = []; let line = '';
        for (const w of text.split(' ')) { const tst = line ? line + ' ' + w : w; if (g.measureText(tst).width > maxW && line) { out.push(line); line = w; } else line = tst; }
        if (line) out.push(line);
        return out;
      };
      // Portrait frame with the senders, and a Planet Zoop stamp with a wavy postmark.
      g.fillStyle = 'rgba(255,208,239,0.35)'; SA.rrect(g, 28, 112, 340, 300, 22); g.fill();
      g.strokeStyle = 'rgba(184,70,126,0.45)'; g.lineWidth = 3; g.setLineDash([12, 8]); g.stroke(); g.setLineDash([]);
      const n = pc.from.length, sc = n > 2 ? 0.95 : n > 1 ? 1.25 : 1.75;
      pc.from.forEach((k, i) => SA.story.drawMember(g, k, 198 + (i - (n - 1) / 2) * Math.min(150, 300 / n), n > 1 ? 310 : 318, sc, 1.3 + i, { wave: i === 0 }));
      g.fillStyle = '#fff'; SA.rrect(g, 48, 124, 86, 96, 6); g.fill();
      g.strokeStyle = 'rgba(184,70,126,0.6)'; g.lineWidth = 2; g.setLineDash([4, 4]); g.stroke(); g.setLineDash([]);
      if (SA.drawZoop) SA.drawZoop(g, 91, 168, 20, { t: 1 });
      g.strokeStyle = 'rgba(80,80,140,0.45)'; g.lineWidth = 2;
      for (let k = 0; k < 3; k++) { g.beginPath(); for (let x = 120; x <= 200; x += 4) g.lineTo(x, 150 + k * 12 + Math.sin(x * 0.15) * 4); g.stroke(); }
      // The letter, in the family's own words.
      const x0 = 400, w = PW - x0 - 30;
      g.strokeStyle = 'rgba(120,140,190,0.35)'; g.lineWidth = 2;
      for (let y = 158; y < 420; y += 40) { g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + w, y); g.stroke(); }
      g.textAlign = 'left'; g.textBaseline = 'alphabetic';
      g.font = 'italic 700 27px ' + SA.FONT;
      g.fillStyle = '#7a2a6a';
      wrapText(pc.letter, w).slice(0, 7).forEach((ln, i) => g.fillText(ln, x0 + 4, 150 + i * 40));
      // Cosmo's reply.
      if (pc.reply) {
        g.font = '800 19px ' + SA.FONT; g.fillStyle = '#4b2d9a';
        g.fillText('Cosmo wrote back:', 40, 452);
        g.font = '700 19px ' + SA.FONT; g.fillStyle = '#5b4aa0';
        wrapText(pc.reply, PW - 80).slice(0, 3).forEach((ln, i) => g.fillText(ln, 40, 480 + i * 26));
      }
      g.font = '700 20px ' + SA.FONT; g.textAlign = 'right'; g.fillStyle = 'rgba(107,113,144,0.7)';
      g.fillText('✏️ Draw a picture back!', PW - 30, PH - 22);
    }
    toPaper(x, y) { const p = this.paper; return { x: ((x - p.x) / p.w) * PW, y: ((y - p.y) / p.h) * PH }; }
    onPaper(x, y) { const p = this.paper; return x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h; }

    rebuildInk() {
      const p = this.paper, ps = SA.clamp(SA.pixelScale || 1, 1, 1.6), c = this.ink;
      c.width = Math.max(2, Math.round(p.w * ps)); c.height = Math.max(2, Math.round(p.h * ps));
      const g = c.getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, c.width, c.height);
      g.setTransform(c.width / PW, 0, 0, c.height / PH, 0, 0);
      for (const s of this.page().s) this.paint(g, s.c, decode(s.p), 0);
    }
    // Draws points[from..] of a stroke (smoothed through the middles of each pair).
    paint(g, c, pts, from) {
      if (!pts.length) return;
      g.globalCompositeOperation = c === ERASER ? 'destination-out' : 'source-over';
      g.strokeStyle = c === ERASER ? '#000' : COLORS[c];
      g.fillStyle = g.strokeStyle;
      g.lineWidth = c === ERASER ? RUB : LINE;
      g.lineCap = 'round'; g.lineJoin = 'round';
      if (pts.length === 1) { g.beginPath(); g.arc(pts[0][0], pts[0][1], g.lineWidth / 2, 0, TAU); g.fill(); }
      else {
        g.beginPath();
        const s = Math.max(0, from - 1);
        g.moveTo(s === 0 ? pts[0][0] : (pts[s - 1][0] + pts[s][0]) / 2, s === 0 ? pts[0][1] : (pts[s - 1][1] + pts[s][1]) / 2);
        for (let i = Math.max(1, s); i < pts.length; i++) {
          const mx = (pts[i - 1][0] + pts[i][0]) / 2, my = (pts[i - 1][1] + pts[i][1]) / 2;
          g.quadraticCurveTo(pts[i - 1][0], pts[i - 1][1], mx, my);
        }
        g.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
        g.stroke();
      }
      g.globalCompositeOperation = 'source-over';
    }
    pointsUsed() { return this.page().s.reduce((n, s) => n + s.p.length / 4, 0); }

    // ---------- Input ----------
    btnAt(x, y) { return this.btns.find(b => Math.hypot(x - b.x, y - b.y) < b.r + 8); }
    trayCells() {
      const keys = stampKeys(), p = this.paper, n = keys.length;
      const cols = Math.max(4, Math.ceil(Math.sqrt(n * (p.w / p.h)))), rows = Math.ceil(n / cols);
      const cell = Math.min(80, (p.w - 30) / cols, (p.h - 70) / rows);
      const x0 = p.x + (p.w - cols * cell) / 2, y0 = p.y + 56;
      return keys.map((k, i) => ({ k, x: x0 + (i % cols + 0.5) * cell, y: y0 + (Math.floor(i / cols) + 0.5) * cell, r: cell * 0.38 }));
    }
    stampAt(x, y) {
      const st = this.page().st, p = this.paper;
      for (let i = st.length - 1; i >= 0; i--) {
        const s = st[i], sx = p.x + (s.x / PW) * p.w, sy = p.y + (s.y / PH) * p.h;
        if (Math.hypot(x - sx, y - sy) < 40 * this.ps * s.s + 10) return s;
      }
      return null;
    }

    onDown(x, y) {
      if (this.trayOpen) {
        const cell = this.trayCells().find(c => Math.hypot(x - c.x, y - c.y) < c.r * 1.3);
        this.trayOpen = false;
        if (cell) {
          this.stamp = cell.k;
          this.tool = 'stamp';
          SA.audio.play('collect');
          SA.ui.hint('Now tap the page to stamp it! Drag a stamp to move it, or off the page to take it away. 🖐️', 5);
        } else SA.audio.play('click');
        return;
      }
      const b = this.btnAt(x, y);
      if (b) { this.tapTool(b); return; }
      if (this.armed) { this.armed = false; }
      if (!this.onPaper(x, y)) return;
      const q = this.toPaper(x, y);
      if (this.tool === 'stamp') {
        const s = this.stampAt(x, y);
        if (s) { this.drag = { s, x0: x, y0: y, moved: false }; SA.audio.play('blip'); return; }
        const st = this.page().st;
        if (st.length >= MAX_STAMPS) { SA.audio.play('wrong'); SA.ui.hint('This page has lots of stamps! Tap ➕ for a new page. 📔', 4); return; }
        const ns = { k: this.stamp || 'i:star', x: Math.round(q.x), y: Math.round(q.y), s: 1, pop: 1 };
        st.push(ns);
        this.undo.push('t');
        SA.audio.play('pop');
        this.fx.spawn('sparkle', x, y, 6, { color: '#ffe9a8' });
        this.saveSoon();
        return;
      }
      if (this.pointsUsed() > MAX_POINTS) {
        if (!this.full) { this.full = true; SA.ui.hint('This page is full of drawing! 🎨 Tap ➕ for a new page.', 5); }
        return;
      }
      this.stroke = { c: this.tool === 'eraser' ? ERASER : this.tool, pts: [[q.x, q.y]] };
      this.paintLive();
    }
    onMove(x, y) {
      if (this.drag) {
        const d = this.drag;
        if (Math.hypot(x - d.x0, y - d.y0) > 10) d.moved = true;
        if (d.moved) { const q = this.toPaper(x, y); d.s.x = q.x; d.s.y = q.y; }
        return;
      }
      const s = this.stroke;
      if (!s) return;
      const q = this.toPaper(x, y), last = s.pts[s.pts.length - 1];
      q.x = SA.clamp(q.x, 0, PW); q.y = SA.clamp(q.y, 0, PH);
      if (Math.hypot(q.x - last[0], q.y - last[1]) < 4) return;
      s.pts.push([q.x, q.y]);
      this.paintLive();
    }
    onUp() {
      if (this.drag) {
        const d = this.drag, s = d.s;
        this.drag = null;
        if (!d.moved) { s.s = SIZES[(SIZES.indexOf(s.s) + 1) % SIZES.length]; s.pop = 1; SA.audio.play('boing'); }
        else if (s.x < -20 || s.x > PW + 20 || s.y < -20 || s.y > PH + 20) {
          const p = this.paper, st = this.page().st;
          st.splice(st.indexOf(s), 1);
          this.fx.spawn('puff', p.x + SA.clamp(s.x / PW, 0, 1) * p.w, p.y + SA.clamp(s.y / PH, 0, 1) * p.h, 8);
          SA.audio.play('pop');
        } else { s.x = Math.round(s.x); s.y = Math.round(s.y); SA.audio.play('land'); }
        this.saveSoon();
        return;
      }
      this.finishStroke();
    }
    // Strokes draw straight onto the ink layer as the finger moves.
    paintLive() {
      const s = this.stroke, g = this.ink.getContext('2d');
      g.setTransform(this.ink.width / PW, 0, 0, this.ink.height / PH, 0, 0);
      this.paint(g, s.c, s.pts, Math.max(0, s.pts.length - 2));
    }
    finishStroke() {
      const s = this.stroke;
      if (!s) return;
      this.stroke = null;
      this.page().s.push({ c: s.c, p: s.pts.map(q => enc(q[0]) + enc(q[1])).join('') });
      this.undo.push('s');
      if (s.c !== ERASER && Math.random() < 0.25) SA.audio.play('blip');
      this.saveSoon();
    }

    tapTool(b) {
      const id = b.id;
      if (id !== 'clear') this.armed = false;
      if (id[0] === 'c' && id.length === 2) { this.tool = +id[1]; SA.audio.play('click'); return; }
      if (id === 'eraser') { this.tool = 'eraser'; SA.audio.play('click'); SA.ui.hint('Eraser! Rub out crayon lines. (Stamps move: drag them off the page.) 🧽', 3); return; }
      if (id === 'stamp') { this.trayOpen = true; SA.audio.play('pop'); return; }
      if (id === 'undo') {
        const u = this.undo.pop(), pg = this.page();
        if (u === 's') pg.s.pop();
        else if (u === 't') pg.st.pop();
        else { SA.audio.play('boing'); SA.ui.hint('Nothing to undo yet! ↩️', 2); return; }
        SA.audio.play('whoosh');
        this.rebuildInk();
        this.saveSoon();
        return;
      }
      if (id === 'clear') {
        if (!this.armed) { this.armed = true; SA.audio.play('click'); SA.ui.hint('Wipe this page clean? Tap the 🧽 again to wipe it.', 4); return; }
        this.armed = false;
        const pg = this.page();
        pg.s = []; pg.st = [];
        this.undo = [];
        this.full = false;
        SA.audio.play('whoosh');
        this.fx.spawn('puff', this.paper.x + this.paper.w / 2, this.paper.y + this.paper.h / 2, 16);
        this.rebuildInk();
        this.saveNow();
      }
    }

    update(dt) {
      this.t += dt;
      this.fx.update(dt);
      for (const s of this.page().st) if (s.pop) s.pop = Math.max(0, s.pop - dt * 2.5);
    }

    // ---------- Drawing ----------
    draw(ctx) {
      const W = SA.W, H = SA.H, t = this.t, p = this.paper;
      // A cosy desk at Cosmo's base: a starry window glow behind a wooden table top.
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#2a1d5c'); bg.addColorStop(1, '#4a2f6e');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      SA.rrect(ctx, p.x + 6, p.y + 8, p.w, p.h, 14 * this.ps * 1.2); ctx.fill();
      ctx.save();
      SA.rrect(ctx, p.x, p.y, p.w, p.h, 14 * this.ps * 1.2); ctx.clip();
      ctx.drawImage(this.paperC, p.x, p.y, p.w, p.h);
      ctx.drawImage(this.ink, p.x, p.y, p.w, p.h);
      for (const s of this.page().st) {
        if (!stampOk(s.k)) continue;
        const r = 40 * this.ps * s.s * (1 + Math.sin((s.pop || 0) * Math.PI) * 0.25);
        drawStamp(ctx, s.k, p.x + (s.x / PW) * p.w, p.y + (s.y / PH) * p.h, r, t);
      }
      ctx.restore();
      // A dragged stamp can be pulled right off the paper.
      if (this.drag && this.drag.moved) {
        const s = this.drag.s;
        if (s.x < 0 || s.x > PW || s.y < 0 || s.y > PH) {
          ctx.globalAlpha = 0.7;
          drawStamp(ctx, s.k, p.x + (s.x / PW) * p.w, p.y + (s.y / PH) * p.h, 40 * this.ps * s.s, t);
          ctx.globalAlpha = 1;
        }
      }
      this.drawTools(ctx, t);
      if (this.trayOpen) this.drawTray(ctx, t);
      this.fx.draw(ctx);
    }

    drawTools(ctx, t) {
      for (const b of this.btns) {
        const on = (b.id === 'eraser' && this.tool === 'eraser') || (b.id === 'stamp' && this.tool === 'stamp') || (b.id === 'c' + this.tool);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        SA.circle(ctx, b.x, b.y + 3, b.r); ctx.fill();
        if (on) { ctx.fillStyle = 'rgba(255,224,102,0.55)'; SA.circle(ctx, b.x, b.y, b.r + 7); ctx.fill(); }
        if (b.id[0] === 'c' && b.id.length === 2) {
          const c = COLORS[+b.id[1]];
          ctx.fillStyle = c; SA.circle(ctx, b.x, b.y, b.r); ctx.fill();
          ctx.strokeStyle = '#fff'; ctx.lineWidth = on ? 4 : 2.5; ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,0.35)'; SA.ellipse(ctx, b.x - b.r * 0.3, b.y - b.r * 0.35, b.r * 0.35, b.r * 0.2, -0.5); ctx.fill();
          continue;
        }
        ctx.fillStyle = b.id === 'clear' && this.armed ? '#ff8a8a' : '#f5f2ff';
        SA.circle(ctx, b.x, b.y, b.r); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.stroke();
        if (b.id === 'eraser') {
          ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(-0.6);
          ctx.fillStyle = '#ff9fc0'; SA.rrect(ctx, -b.r * 0.6, -b.r * 0.3, b.r * 0.75, b.r * 0.6, 4); ctx.fill();
          ctx.fillStyle = '#6fa8ff'; SA.rrect(ctx, b.r * 0.1, -b.r * 0.3, b.r * 0.5, b.r * 0.6, 4); ctx.fill();
          ctx.restore();
        } else if (b.id === 'undo') {
          ctx.strokeStyle = '#4b2d9a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.arc(b.x + 2, b.y + 2, b.r * 0.45, Math.PI * 1.1, Math.PI * 2.4); ctx.stroke();
          ctx.fillStyle = '#4b2d9a';
          ctx.beginPath(); ctx.moveTo(b.x - b.r * 0.62, b.y - b.r * 0.35); ctx.lineTo(b.x - b.r * 0.1, b.y - b.r * 0.2); ctx.lineTo(b.x - b.r * 0.55, b.y + b.r * 0.2); ctx.closePath(); ctx.fill();
        } else if (b.id === 'stamp') {
          if (this.stamp && this.tool === 'stamp') drawStamp(ctx, this.stamp, b.x, b.y, b.r * 0.62, t);
          else { ctx.fillStyle = '#ffd23a'; SA.starPath(ctx, b.x, b.y, b.r * 0.6, 0.45, 5); ctx.fill(); }
          SA.label(ctx, 'Stamps', b.x, b.y + b.r + 12, 13, '#fff');
        } else if (b.id === 'clear') {
          ctx.fillStyle = '#ffd84d'; SA.rrect(ctx, b.x - b.r * 0.55, b.y - b.r * 0.35, b.r * 1.1, b.r * 0.7, 6); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          for (const [dx, dy] of [[-0.2, -0.55], [0.25, -0.65], [0.05, -0.85]]) { SA.circle(ctx, b.x + dx * b.r, b.y + dy * b.r, b.r * 0.16); ctx.fill(); }
          if (this.armed) SA.label(ctx, 'Again?', b.x, b.y - b.r - 12, 13, '#ffd0d0');
        }
      }
    }

    drawTray(ctx, t) {
      const p = this.paper;
      ctx.fillStyle = 'rgba(20,14,60,0.88)';
      SA.rrect(ctx, p.x + 6, p.y + 6, p.w - 12, p.h - 12, 18); ctx.fill();
      SA.label(ctx, 'Pick a stamp! ✨', p.x + p.w / 2, p.y + 32, 22, '#fff3c4');
      for (const c of this.trayCells()) {
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        SA.circle(ctx, c.x, c.y, c.r * 1.25); ctx.fill();
        drawStamp(ctx, c.k, c.x, c.y, c.r, t);
      }
    }
  }
  SA.JournalScene = JournalScene;
})(window.SA);
