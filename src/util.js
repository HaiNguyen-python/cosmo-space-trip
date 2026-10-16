// Shared helpers: math, shapes, colors, particles, starfield.
window.SA = window.SA || {};

(function (SA) {
  SA.W = 1280;
  SA.H = 720;
  // Matches the CSS --title font (system rounded font, no downloads).
  SA.FONT = 'ui-rounded, "SF Pro Rounded", "Arial Rounded MT Bold", "Segoe UI", sans-serif';

  SA.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  SA.lerp = (a, b, t) => a + (b - a) * t;
  SA.rand = (a, b) => a + Math.random() * (b - a);
  SA.pick = arr => arr[Math.floor(Math.random() * arr.length)];
  SA.easeOut = t => 1 - Math.pow(1 - SA.clamp(t, 0, 1), 3);
  SA.easeInOut = t => {
    t = SA.clamp(t, 0, 1);
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };
  SA.easeBack = t => {
    t = SA.clamp(t, 0, 1);
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  };
  SA.wrapAngle = a => {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  };
  SA.esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  SA.wait = ms => new Promise(r => setTimeout(r, ms));
  // Width of the progress bar centred along the top of a mission, leaving room for the Map
  // and info chips on both sides (on phones the chips take up more of the logical width).
  SA.topBarW = () => Math.min(520, SA.W * 0.4, SA.W - (SA.H < 720 ? 700 : 520));

  // Small deterministic random generator so decorations look the same every frame.
  SA.seeded = function (seed) {
    let s = (seed >>> 0) || 1;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  };

  // ---------- Colors ----------
  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  SA.shade = function (hex, amt) {
    const c = hexToRgb(hex).map(v => SA.clamp(Math.round(v + amt), 0, 255));
    return 'rgb(' + c.join(',') + ')';
  };
  SA.rgba = function (hex, a) {
    return 'rgba(' + hexToRgb(hex).join(',') + ',' + a + ')';
  };

  // ---------- Shapes ----------
  SA.ellipse = function (ctx, x, y, rx, ry, rot) {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, Math.PI * 2);
  };
  SA.circle = (ctx, x, y, r) => SA.ellipse(ctx, x, y, r, r);
  SA.rrect = function (ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };
  // Heart shape centred on (x, y), about 2s wide.
  SA.heart = function (ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.9);
    ctx.bezierCurveTo(x - s * 1.4, y - s * 0.1, x - s * 0.6, y - s * 1.1, x, y - s * 0.45);
    ctx.bezierCurveTo(x + s * 0.6, y - s * 1.1, x + s * 1.4, y - s * 0.1, x, y + s * 0.9);
    ctx.closePath();
  };

  // Smooth closed blob through a list of [x, y] points.
  SA.blobPath = function (ctx, pts) {
    const n = pts.length;
    const mid = i => [(pts[i % n][0] + pts[(i + 1) % n][0]) / 2, (pts[i % n][1] + pts[(i + 1) % n][1]) / 2];
    ctx.beginPath();
    const m0 = mid(0);
    ctx.moveTo(m0[0], m0[1]);
    for (let i = 1; i <= n; i++) {
      const p = pts[i % n], m = mid(i);
      ctx.quadraticCurveTo(p[0], p[1], m[0], m[1]);
    }
    ctx.closePath();
  };
  SA.starPath = function (ctx, x, y, r, inner, points, rot) {
    points = points || 5;
    rot = rot == null ? -Math.PI / 2 : rot;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const rr = i % 2 ? r * (inner || 0.45) : r;
      const a = rot + (i * Math.PI) / points;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
  };
  // Little Explorer helper for flung orbits (Space Playground, Galaxy Trip). Gravity pulls with
  // strength g / d^2 toward (cx, cy). If the throw would fall in (closest pass under rMin) or fly
  // away (escape, or farthest point past rMax), it is gently nudged into a safe, stretched orbit
  // going the same way round. Returns { vx, vy, nudged }.
  SA.orbitAssist = function (px, py, vx, vy, cx, cy, g, rMin, rMax) {
    const dx = px - cx, dy = py - cy, d = Math.max(1, Math.hypot(dx, dy));
    const rx = dx / d, ry = dy / d, tx = -ry, ty = rx;
    const fate = (ux, uy) => {
      const e0 = (ux * ux + uy * uy) / 2 - g / d;
      if (e0 >= 0) return false;
      const h = d * (ux * tx + uy * ty), a = -g / (2 * e0);
      const e = Math.sqrt(Math.max(0, 1 + (2 * e0 * h * h) / (g * g)));
      return a * (1 - e) >= rMin && a * (1 + e) <= rMax;
    };
    if (fate(vx, vy)) return { vx, vy, nudged: false };
    const vc = Math.sqrt(g / d);
    const vr0 = vx * rx + vy * ry, vt0 = vx * tx + vy * ty, sign = vt0 < 0 ? -1 : 1;
    let vt = sign * SA.clamp(Math.abs(vt0), vc * 0.88, vc * 1.1), vr = SA.clamp(vr0, -vc * 0.18, vc * 0.18);
    let ox = rx * vr + tx * vt, oy = ry * vr + ty * vt;
    if (!fate(ox, oy)) { ox = tx * vc * sign; oy = ty * vc * sign; }
    return { vx: ox, vy: oy, nudged: true };
  };

  SA.emoji = function (ctx, ch, x, y, size) {
    // The "tap here" hand is drawn art, so it looks the same on every device.
    if (ch === '👆' && SA.icon) { SA.icon(ctx, 'hand', x, y, size * 1.05); return; }
    // So are the most-used sticker emoji (balloon, plant, alien, sunflower...).
    if (SA.EMOJI_ICONS && SA.EMOJI_ICONS[ch]) { SA.icon(ctx, SA.EMOJI_ICONS[ch], x, y, size); return; }
    ctx.font = size + 'px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Colour emoji ignore this; it only matters where a plain (one-colour) emoji font is used.
    ctx.fillStyle = '#ffffff';
    ctx.fillText(ch, x, y);
  };
  // The same emoji, drawn once into a small picture and reused. Colour-emoji text is slow to draw,
  // so busy screens (stickers at the Space Base, the Night Sky's picture) use this every frame.
  const emojiCache = new Map();
  // cacheSize (optional) is the size to keep the picture at, for things that pulse in size.
  SA.emojiCached = function (ctx, ch, x, y, size, cacheSize) {
    const ps = SA.clamp(SA.pixelScale || 1, 1, 3), px = Math.max(8, Math.round(cacheSize || size));
    const key = ch + '|' + px + '|' + ps.toFixed(2);
    let c = emojiCache.get(key);
    if (!c) {
      if (emojiCache.size > 80) emojiCache.clear();   // e.g. after the screen changed size
      const box = px * 1.3;
      c = document.createElement('canvas');
      c.width = c.height = Math.max(2, Math.ceil(box * ps));
      const g = c.getContext('2d');
      g.scale(c.width / box, c.height / box);
      SA.emoji(g, ch, box / 2, box / 2, px);
      c.box = box;
      emojiCache.set(key, c);
    }
    const d = c.box * (size / px);
    ctx.drawImage(c, x - d / 2, y - d / 2, d, d);
  };
  // Outlined label text, readable on any space background.
  SA.label = function (ctx, str, x, y, size, color, opts) {
    opts = opts || {};
    ctx.font = (opts.weight || 800) + ' ' + size + 'px ' + (opts.font || SA.FONT);
    ctx.textAlign = opts.align || 'center';
    ctx.textBaseline = 'middle';
    if (opts.stroke !== false) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = opts.strokeW || Math.max(3, size * 0.22);
      ctx.strokeStyle = opts.stroke || 'rgba(10,14,40,0.85)';
      ctx.strokeText(str, x, y);
    }
    ctx.fillStyle = color || '#fff';
    ctx.fillText(str, x, y);
  };

  // A rounded name tag: soft dark glass with a coloured edge. Used for planet names on the map.
  SA.pill = function (ctx, str, x, y, size, opts) {
    opts = opts || {};
    ctx.font = (opts.weight || 800) + ' ' + size + 'px ' + SA.FONT;
    const w = ctx.measureText(str).width + size * 1.1, h = size * 1.55;
    ctx.save();
    if (opts.alpha != null) ctx.globalAlpha *= opts.alpha;
    SA.rrect(ctx, x - w / 2, y - h / 2 + 2, w, h, h / 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();
    SA.rrect(ctx, x - w / 2, y - h / 2, w, h, h / 2);
    const g = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2);
    g.addColorStop(0, opts.bgTop || 'rgba(40,36,100,0.88)');
    g.addColorStop(1, opts.bg || 'rgba(16,14,56,0.88)');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = opts.edge || 'rgba(190,200,255,0.45)';
    ctx.stroke();
    ctx.fillStyle = opts.color || '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(str, x, y + size * 0.04);
    ctx.restore();
    return w;
  };

  // ---------- Space backdrop ----------
  SA.spaceBg = function (ctx, top, bottom) {
    const g = ctx.createLinearGradient(0, 0, 0, SA.H);
    g.addColorStop(0, top || '#0b0f2e');
    g.addColorStop(1, bottom || '#1c1347');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, SA.W, SA.H);
  };
  SA.nebula = function (ctx, t, blobs) {
    for (const b of blobs) {
      const x = b.x * SA.W + Math.sin(t * 0.05 + b.x * 9) * 20;
      const y = b.y * SA.H + Math.cos(t * 0.04 + b.y * 7) * 14;
      const g = ctx.createRadialGradient(x, y, 0, x, y, b.r);
      g.addColorStop(0, b.c);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - b.r, y - b.r, b.r * 2, b.r * 2);
    }
  };

  const STAR_COLS = ['#ffffff', '#ffd9a8', '#bcd4ff'];
  class Starfield {
    constructor(n, seed) {
      const r = SA.seeded(seed || 7);
      this.stars = [];
      for (let i = 0; i < n; i++) {
        this.stars.push({ x: r(), y: r(), s: 0.6 + r() * 1.7, tw: r() * 6.28, sp: 0.6 + r() * 2.2, depth: 0.15 + r() * 0.85, hue: r() });
      }
    }

    draw(ctx, t, ox) {
      ox = ox || 0;
      // Small stars are batched by colour and twinkle level (a couple of dozen fills instead of
      // one per star), which keeps every scene's backdrop cheap on older iPads.
      const STEPS = 8, base = ctx.globalAlpha;
      const buckets = this.buckets || (this.buckets = []);
      for (let i = 0; i < STAR_COLS.length * STEPS; i++) buckets[i] = null;
      for (const s of this.stars) {
        const x = (((s.x * SA.W - ox * s.depth) % SA.W) + SA.W) % SA.W;
        const y = s.y * SA.H;
        const a = 0.35 + 0.65 * Math.abs(Math.sin(t * s.sp + s.tw));
        const ci = s.hue > 0.86 ? 1 : s.hue > 0.72 ? 2 : 0;
        if (s.s > 2.05) {
          // Bright stars get a soft halo and a twinkling four-point flare.
          ctx.fillStyle = STAR_COLS[ci];
          ctx.globalAlpha = base * a * 0.25;
          SA.circle(ctx, x, y, s.s * 2.2);
          ctx.fill();
          ctx.globalAlpha = base * a;
          SA.starPath(ctx, x, y, s.s * (1.7 + a * 1.1), 0.22, 4, 0);
          ctx.fill();
        } else {
          const bi = ci * STEPS + Math.min(STEPS - 1, Math.floor(((a - 0.35) / 0.65) * STEPS));
          (buckets[bi] || (buckets[bi] = [])).push(x, y, s.s * 0.8);
        }
      }
      for (let i = 0; i < buckets.length; i++) {
        const b = buckets[i];
        if (!b) continue;
        ctx.fillStyle = STAR_COLS[Math.floor(i / STEPS)];
        ctx.globalAlpha = base * (0.35 + 0.65 * ((i % STEPS) + 0.5) / STEPS);
        ctx.beginPath();
        for (let j = 0; j < b.length; j += 3) { ctx.moveTo(b[j] + b[j + 2], b[j + 1]); ctx.arc(b[j], b[j + 1], b[j + 2], 0, Math.PI * 2); }
        ctx.fill();
      }
      ctx.globalAlpha = base;
    }
  }
  SA.Starfield = Starfield;

  // Occasional shooting stars streaking across the sky.
  class ShootingStars {
    constructor(minGap, maxGap) {
      this.list = [];
      this.minGap = minGap || 2.5;
      this.maxGap = maxGap || 6;
      this.wait = SA.rand(1, 3);
    }

    update(dt) {
      this.wait -= dt;
      if (this.wait <= 0) {
        this.wait = SA.rand(this.minGap, this.maxGap);
        const a = SA.rand(0.35, 0.7);
        const sp = SA.rand(700, 1000);
        this.list.push({ x: SA.rand(SA.W * 0.15, SA.W * 0.95), y: SA.rand(-20, SA.H * 0.35), vx: -Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: SA.rand(0.6, 0.9) });
      }
      for (const s of this.list) { s.life += dt; s.x += s.vx * dt; s.y += s.vy * dt; }
      this.list = this.list.filter(s => s.life < s.max);
    }

    draw(ctx) {
      ctx.lineCap = 'round';
      for (const s of this.list) {
        const k = s.life / s.max;
        const tail = 0.16;
        const g = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * tail, s.y - s.vy * tail);
        g.addColorStop(0, 'rgba(255,255,255,' + (1 - k) + ')');
        g.addColorStop(1, 'rgba(160,190,255,0)');
        ctx.strokeStyle = g;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * tail, s.y - s.vy * tail);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,' + (1 - k) + ')';
        SA.circle(ctx, s.x, s.y, 2.5);
        ctx.fill();
      }
    }
  }
  SA.ShootingStars = ShootingStars;

  // ---------- Particles ----------
  class Particles {
    constructor() { this.list = []; }

    spawn(kind, x, y, n, opts) {
      opts = opts || {};
      n = n || 1;
      const calm = SA.calm && SA.calm();
      // A big sparkle burst is a reward moment: add a soft shockwave ring and a glow flash.
      if (kind === 'sparkle' && n >= 12) {
        const c = opts.color || '#ffe066';
        this.list.push({ kind: 'ring', x, y, vx: 0, vy: 0, life: 0, max: 0.55, size: 14, rot: 0, color: c, grow: calm ? 90 : 150 });
        if (!calm) this.list.push({ kind: 'ring', x, y, vx: 0, vy: 0, life: -0.08, max: 0.6, size: 6, rot: 0, color: '#ffffff', grow: 110 });
        this.list.push({ kind: 'glow', x, y, vx: 0, vy: 0, life: 0, max: 0.4, size: calm ? 40 : 70, rot: 0, color: c });
      }
      if (calm && kind === 'sparkle' && n > 4) n = Math.ceil(n * 0.5);
      for (let i = 0; i < n; i++) {
        const p = { kind, x, y, vx: SA.rand(-40, 40), vy: SA.rand(-80, -30), life: 0, max: SA.rand(0.7, 1.1), size: SA.rand(5, 9), rot: SA.rand(0, 6), color: opts.color };
        if (kind === 'sparkle') { p.vx = SA.rand(-120, 120); p.vy = SA.rand(-140, 40); p.max = SA.rand(0.5, 0.9); p.size = SA.rand(5, 10); p.color = opts.color || '#ffe066'; }
        if (kind === 'dust') { p.x += SA.rand(-8, 8); p.vx = SA.rand(-70, -20); p.vy = SA.rand(-45, -10); p.max = SA.rand(0.6, 1); p.size = SA.rand(4, 9); p.color = opts.color || 'rgba(200,120,80,0.6)'; }
        if (kind === 'puff') { p.vx = (opts.vx || 0) + SA.rand(-25, 25); p.vy = (opts.vy || 0) + SA.rand(-25, 25); p.max = SA.rand(0.35, 0.6); p.size = SA.rand(5, 11); }
        this.list.push(p);
      }
    }

    text(x, y, str, color) {
      this.list.push({ kind: 'text', x, y, vx: 0, vy: -50, life: 0, max: 1.4, size: 30, rot: 0, str, color: color || '#ffe066' });
    }

    // Confetti in three shapes (strips, dots and stars) that flutter as they fall.
    confetti(n) {
      const colors = ['#ff6b8b', '#ffd84d', '#5fc8ff', '#7ee08a', '#b48cff', '#ff9f4a'];
      for (let i = 0; i < (n || 90); i++) {
        this.list.push({
          kind: 'confetti', x: SA.rand(0, SA.W), y: SA.rand(-160, -10), vx: SA.rand(-50, 50), vy: SA.rand(140, 280),
          life: 0, max: SA.rand(2.4, 3.4), size: SA.rand(8, 14), rot: SA.rand(0, 6), spin: SA.rand(-8, 8), color: SA.pick(colors),
          shape: Math.random() < 0.6 ? 0 : Math.random() < 0.5 ? 1 : 2, flip: SA.rand(5, 11),
        });
      }
    }

    // Two party poppers fire confetti up from the bottom corners.
    cannons(n) {
      const colors = ['#ff6b8b', '#ffd84d', '#5fc8ff', '#7ee08a', '#b48cff', '#ff9f4a'];
      for (let i = 0; i < n; i++) {
        const side = i % 2 ? 1 : -1;
        const a = -Math.PI / 2 + side * SA.rand(0.2, 0.55), sp = SA.rand(950, 1300) * (SA.H / 720);
        this.list.push({
          kind: 'confetti', x: side < 0 ? -10 : SA.W + 10, y: SA.H + 10, vx: -side * Math.abs(Math.cos(a)) * sp, vy: -Math.abs(Math.sin(a)) * sp,
          life: -Math.random() * 0.15, max: SA.rand(2.2, 3), size: SA.rand(8, 14), rot: SA.rand(0, 6), spin: SA.rand(-10, 10), color: SA.pick(colors),
          shape: Math.random() < 0.5 ? 0 : Math.random() < 0.5 ? 1 : 2, flip: SA.rand(5, 11), drag: true,
        });
      }
    }

    update(dt) {
      for (const p of this.list) {
        p.life += dt;
        if (p.life < 0) continue;
        if (p.drag) { p.vx *= Math.pow(0.5, dt); p.vy = p.vy * Math.pow(0.5, dt) + 380 * dt; if (p.vy > 220) p.vy = 220; }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.kind === 'sparkle') { p.vx *= 0.94; p.vy *= 0.94; }
        if (p.kind === 'text') p.vy *= 0.95;
        if (p.kind === 'confetti') { p.rot += p.spin * dt; p.x += Math.sin(p.life * 4 + p.size) * 40 * dt; }
      }
      this.list = this.list.filter(p => p.life < p.max);
    }

    draw(ctx) {
      for (const p of this.list) {
        if (p.life < 0) continue;
        const k = p.life / p.max;
        ctx.globalAlpha = 1 - k;
        if (p.kind === 'text') {
          // Pops in with a little overshoot, then floats and fades.
          ctx.globalAlpha = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
          const pop = SA.easeBack(p.life / 0.25);
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.scale(pop, pop);
          SA.label(ctx, p.str, 0, 0, p.size, p.color, { strokeW: 8 });
          ctx.restore();
        } else if (p.kind === 'ring') {
          ctx.globalAlpha = (1 - k) * 0.8;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 6 * (1 - k) + 1;
          SA.circle(ctx, p.x, p.y, p.size + SA.easeOut(k) * p.grow);
          ctx.stroke();
        } else if (p.kind === 'glow') {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          g.addColorStop(0, SA.rgba('#ffffff', 0.7 * (1 - k)));
          g.addColorStop(0.4, p.color.charAt(0) === '#' ? SA.rgba(p.color, 0.35 * (1 - k)) : 'rgba(255,230,120,' + 0.35 * (1 - k) + ')');
          g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.globalAlpha = 1;
          ctx.fillStyle = g;
          SA.circle(ctx, p.x, p.y, p.size);
          ctx.fill();
        } else if (p.kind === 'confetti') {
          ctx.globalAlpha = Math.min(1, (p.max - p.life) * 2);
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.scale(1, Math.cos(p.life * p.flip));
          ctx.fillStyle = p.color;
          if (p.shape === 1) { SA.circle(ctx, 0, 0, p.size * 0.35); ctx.fill(); }
          else if (p.shape === 2) { SA.starPath(ctx, 0, 0, p.size * 0.55, 0.45, 5); ctx.fill(); }
          else ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          ctx.restore();
        } else if (p.kind === 'sparkle') {
          const sz = p.size * (1 - k * 0.5);
          // Soft halo behind each sparkle.
          ctx.globalAlpha = (1 - k) * 0.35;
          ctx.fillStyle = p.color;
          SA.circle(ctx, p.x, p.y, sz * 0.9);
          ctx.fill();
          ctx.globalAlpha = 1 - k;
          SA.starPath(ctx, p.x, p.y, sz, 0.35, 4, p.rot + p.life * 4);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          SA.circle(ctx, p.x, p.y, sz * 0.18);
          ctx.fill();
        } else if (p.kind === 'puff') {
          ctx.fillStyle = k < 0.3 ? '#ffe9a8' : k < 0.6 ? '#ffa94d' : 'rgba(200,200,220,0.8)';
          SA.circle(ctx, p.x, p.y, p.size * (1 + k));
          ctx.fill();
        } else {
          ctx.fillStyle = p.color || '#fff';
          SA.circle(ctx, p.x, p.y, p.size * (1 + k * 0.8));
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }
  }
  SA.Particles = Particles;
})(window.SA);
