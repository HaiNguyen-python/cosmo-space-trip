// Synthesized sound effects (no audio files) and Cosmo's read-aloud voice.
(function (SA) {
  let ac = null, master = null, noiseBuf = null, muted = false;

  function tone(freq, dur, type, vol, freqEnd, delay) {
    const t = ac.currentTime + (delay || 0);
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.03);
  }

  function noise(dur, vol, freq, delay, type, freqEnd) {
    const t = ac.currentTime + (delay || 0);
    const src = ac.createBufferSource();
    src.buffer = noiseBuf;
    const f = ac.createBiquadFilter();
    f.type = type || 'lowpass';
    f.frequency.setValueAtTime(freq || 1000, t);
    if (freqEnd) f.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, t + Math.min(0.05, dur / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t, Math.random()); src.stop(t + dur + 0.03);
  }

  const SFX = {
    click() { tone(660, 0.05, 'triangle', 0.08); },
    pop() { tone(700, 0.08, 'sine', 0.14, 1400); },
    blip() { tone(880, 0.06, 'sine', 0.08, 1320); },
    launch() { noise(1.4, 0.3, 200, 0, 'bandpass', 2400); tone(110, 1.2, 'sawtooth', 0.05, 330); },
    whoosh() { noise(0.7, 0.18, 300, 0, 'bandpass', 2200); },
    ding() { tone(1320, 0.25, 'sine', 0.13); tone(1760, 0.32, 'sine', 0.09, null, 0.08); },
    collect() { [988, 1319, 1760].forEach((f, i) => tone(f, 0.18, 'triangle', 0.1, null, i * 0.06)); },
    jump() { tone(220, 0.45, 'sine', 0.18, 660); },
    land() { noise(0.18, 0.12, 400); },
    bump() { tone(140, 0.2, 'square', 0.1, 70); noise(0.12, 0.14, 600); },
    wrong() { tone(330, 0.16, 'triangle', 0.12, 260); tone(260, 0.2, 'triangle', 0.1, 220, 0.14); },
    cheer() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.22, 'triangle', 0.12, null, i * 0.08)); },
    card() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.45, 'sine', 0.1, null, i * 0.1)); noise(0.8, 0.04, 6000, 0.1, 'highpass'); },
    crow() { tone(600, 0.15, 'sawtooth', 0.08, 900); tone(900, 0.5, 'sawtooth', 0.07, 700, 0.16); },
    hoot() { tone(420, 0.25, 'sine', 0.18, 380); tone(400, 0.4, 'sine', 0.16, 340, 0.35); },
    lullaby() { [659, 587, 523].forEach((f, i) => tone(f, 0.4, 'sine', 0.1, null, i * 0.3)); },
    spin() { noise(0.12, 0.05, 1800, 0, 'bandpass'); },
    shutter() { noise(0.05, 0.25, 3000, 0, 'highpass'); noise(0.06, 0.18, 2000, 0.09, 'highpass'); tone(1800, 0.08, 'square', 0.04, null, 0.02); },
    giggle() { [880, 1046, 932, 1174, 1046, 1318].forEach((f, i) => tone(f, 0.09, 'triangle', 0.09, f * 1.15, i * 0.07)); },
    ping() { tone(1500, 0.5, 'sine', 0.08, 900); tone(2200, 0.25, 'sine', 0.04, null, 0.05); },
    zap() { noise(0.35, 0.3, 4000, 0, 'highpass', 600); tone(900, 0.3, 'sawtooth', 0.08, 120); },
    // A critter's little squeak, and a springy boing.
    squeak() { tone(1200, 0.08, 'sine', 0.1, 1900); tone(1500, 0.1, 'sine', 0.08, 2300, 0.09); },
    boing() { tone(180, 0.35, 'triangle', 0.16, 420); tone(420, 0.25, 'sine', 0.06, 200, 0.12); },
    // Space station snacks, rocket engines, and space rocks landing on the Moon.
    munch() { [0, 0.11, 0.22].forEach((d, i) => noise(0.07, 0.16, 1300 - i * 200, d, 'bandpass')); },
    fizzle() { noise(0.9, 0.14, 2500, 0, 'highpass', 400); tone(300, 0.5, 'triangle', 0.06, 120, 0.2); },
    rumble() { noise(1.6, 0.32, 160, 0, 'lowpass', 900); tone(70, 1.4, 'sawtooth', 0.06, 140); },
    thud() { tone(120, 0.3, 'sine', 0.25, 45); noise(0.35, 0.2, 500, 0, 'lowpass', 120); },
    gulp() { tone(500, 0.12, 'sine', 0.14, 220); tone(260, 0.2, 'sine', 0.12, 140, 0.1); },
    // Underwater bubbles, ice cracking, and a watering can.
    bubble() { [0, 0.07, 0.15].forEach((d, i) => tone(300 + i * 140 + Math.random() * 60, 0.09, 'sine', 0.07, 900 + i * 200, d)); },
    crack() { noise(0.16, 0.22, 2600, 0, 'bandpass', 900); tone(180, 0.12, 'triangle', 0.06, 90, 0.02); },
    pour() { noise(0.9, 0.08, 1400, 0, 'bandpass', 2600); },
    // Mission Control (the quiz show): a buzzer, the wheel's ticks, a drum roll, a fanfare and clapping.
    buzz() { tone(196, 0.28, 'square', 0.07, 185); tone(294, 0.28, 'square', 0.05, 280); },
    tick() { tone(1900, 0.03, 'square', 0.04); },
    drumroll() { for (let i = 0; i < 16; i++) noise(0.06, 0.05 + i * 0.006, 1800, i * 0.07, 'bandpass'); },
    tada() { [523, 659, 784].forEach((f, i) => tone(f, 0.16, 'triangle', 0.12, null, i * 0.11)); tone(1047, 0.7, 'triangle', 0.14, null, 0.36); tone(784, 0.7, 'sine', 0.08, null, 0.36); },
    applause() { for (let i = 0; i < 26; i++) noise(0.05, 0.04 + Math.random() * 0.05, 1500 + Math.random() * 2500, Math.random() * 1.4, 'bandpass'); },
    // Building the Mars Base: a clunk as a part locks into place.
    clunk() { tone(160, 0.18, 'square', 0.08, 90); noise(0.12, 0.15, 900, 0.02, 'lowpass'); tone(620, 0.08, 'triangle', 0.05, null, 0.1); },
  };

  // ---------- Generated background music ----------
  // Soft pad chords, a low bass note and sparkly plucks through an echo, scheduled ahead of time.
  // Notes are MIDI numbers. Each mood loops a 4-chord progression, 2 bars per chord.
  const MOODS = {
    space: { bpm: 66, plucks: 0.3, chords: [[48, 55, 64, 71], [45, 52, 60, 67], [41, 48, 57, 64], [43, 50, 55, 62]], scale: [72, 74, 76, 79, 81, 84, 86, 88] },
    earth: { bpm: 72, plucks: 0.38, chords: [[50, 57, 62, 66], [47, 54, 59, 62], [43, 50, 55, 59], [45, 52, 57, 61]], scale: [74, 76, 78, 81, 83, 86, 88] },
    mars: { bpm: 100, plucks: 0.62, chords: [[45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59], [40, 47, 52, 55]], scale: [69, 72, 74, 76, 79, 81, 84] },
    jupiter: { bpm: 62, plucks: 0.4, chords: [[50, 57, 62, 65], [46, 53, 58, 62], [41, 48, 53, 57], [48, 55, 60, 64]], scale: [74, 77, 79, 81, 84, 86, 89] },
    saturn: { bpm: 84, plucks: 0.45, chords: [[41, 48, 57, 64], [40, 47, 55, 62], [38, 45, 53, 60], [36, 43, 52, 59]], scale: [72, 76, 77, 79, 81, 84, 88] },
    venus: { bpm: 70, plucks: 0.4, chords: [[45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59], [40, 47, 52, 56]], scale: [69, 72, 74, 76, 79, 81] },
    mercury: { bpm: 92, plucks: 0.5, chords: [[48, 55, 60, 64], [45, 52, 57, 60], [53, 57, 60, 65], [50, 55, 59, 62]], scale: [72, 74, 76, 79, 81, 84] },
    uranus: { bpm: 60, plucks: 0.3, chords: [[44, 51, 56, 60], [42, 49, 54, 58], [40, 47, 52, 56], [42, 49, 54, 61]], scale: [68, 71, 73, 75, 78, 80, 83] },
    neptune: { bpm: 112, plucks: 0.7, chords: [[45, 52, 57, 61], [47, 54, 59, 62], [42, 49, 54, 57], [44, 51, 56, 59]], scale: [69, 71, 73, 76, 78, 81, 83] },
    belt: { bpm: 88, plucks: 0.45, chords: [[43, 50, 55, 59], [45, 52, 57, 60], [41, 48, 53, 57], [40, 47, 52, 59]], scale: [67, 69, 71, 74, 76, 79, 81] },
    sun: { bpm: 64, plucks: 0.35, chords: [[45, 52, 57, 64], [41, 48, 57, 60], [48, 55, 60, 67], [43, 50, 59, 62]], scale: [69, 72, 76, 79, 81, 84, 88] },
    comet: { bpm: 80, plucks: 0.5, chords: [[50, 57, 62, 69], [46, 53, 62, 65], [48, 55, 64, 67], [45, 52, 60, 64]], scale: [74, 76, 79, 81, 83, 86, 88] },
    sky: { bpm: 56, plucks: 0.28, chords: [[45, 52, 59, 64], [41, 48, 57, 60], [43, 50, 55, 62], [40, 47, 55, 59]], scale: [76, 79, 81, 83, 86, 88] },
    base: { bpm: 76, plucks: 0.42, chords: [[48, 55, 64, 67], [45, 52, 60, 64], [41, 48, 57, 64], [43, 50, 59, 65]], scale: [72, 74, 76, 79, 81, 84] },
    iss: { bpm: 68, plucks: 0.34, chords: [[43, 50, 59, 66], [40, 47, 55, 62], [45, 52, 61, 64], [38, 45, 54, 61]], scale: [74, 78, 79, 81, 83, 86, 90] },
    workshop: { bpm: 104, plucks: 0.55, chords: [[48, 55, 60, 64], [45, 52, 57, 64], [50, 57, 62, 65], [43, 50, 55, 62]], scale: [72, 74, 76, 79, 81, 84] },
    play: { bpm: 90, plucks: 0.45, chords: [[41, 48, 57, 64], [43, 50, 59, 62], [45, 52, 60, 64], [40, 47, 55, 62]], scale: [69, 72, 74, 77, 79, 81, 84] },
    europa: { bpm: 58, plucks: 0.3, chords: [[38, 45, 53, 60], [41, 48, 55, 62], [36, 43, 52, 59], [40, 47, 55, 62]], scale: [69, 72, 74, 76, 79, 81, 84] },
    galaxy: { bpm: 60, plucks: 0.32, chords: [[40, 47, 55, 62], [36, 43, 52, 59], [43, 50, 57, 64], [38, 45, 54, 61]], scale: [71, 74, 76, 78, 81, 83, 86] },
    garden: { bpm: 84, plucks: 0.5, chords: [[48, 55, 64, 67], [53, 60, 65, 69], [45, 52, 60, 64], [50, 57, 62, 65]], scale: [72, 74, 76, 79, 81, 84] },
    titan: { bpm: 66, plucks: 0.36, chords: [[41, 48, 55, 60], [44, 51, 56, 63], [39, 46, 55, 58], [43, 50, 55, 62]], scale: [67, 70, 72, 75, 77, 79, 82] },
    journal: { bpm: 78, plucks: 0.3, chords: [[48, 55, 64, 67], [52, 59, 64, 71], [45, 52, 60, 64], [50, 57, 62, 66]], scale: [72, 74, 76, 79, 81, 83] },
    story: { bpm: 70, plucks: 0.4, chords: [[46, 53, 62, 65], [43, 50, 58, 62], [48, 55, 62, 67], [41, 48, 57, 60]], scale: [70, 72, 74, 77, 79, 82, 84] },
    show: { bpm: 116, plucks: 0.6, chords: [[48, 55, 64, 67], [45, 52, 60, 64], [50, 57, 62, 65], [43, 50, 59, 62]], scale: [72, 74, 76, 79, 81, 84] },
    camp: { bpm: 108, plucks: 0.55, chords: [[43, 50, 59, 62], [48, 55, 64, 67], [45, 52, 60, 64], [50, 57, 62, 66]], scale: [67, 71, 74, 76, 79, 83, 86] },
    marsbase: { bpm: 84, plucks: 0.42, chords: [[45, 52, 57, 64], [41, 48, 57, 60], [43, 50, 55, 62], [40, 47, 55, 59]], scale: [69, 72, 74, 76, 79, 81] },
    tour: { bpm: 120, plucks: 0.8, chords: [[48, 55, 60, 64], [53, 60, 65, 69], [55, 62, 67, 71], [48, 55, 64, 67]], scale: [72, 76, 79, 84, 88, 91] },
    warp: { bpm: 132, plucks: 0.9, chords: [[48, 55, 60, 64], [50, 57, 62, 65], [52, 59, 64, 67], [53, 60, 65, 69]], scale: [72, 76, 79, 84, 88, 91] },
  };
  const midi = m => 440 * Math.pow(2, (m - 69) / 12);
  let musicBus = null, musicOn = true, mood = null, nextTime = 0, stepN = 0, timer = null, ducked = false;

  function buildMusicBus() {
    musicBus = ac.createGain();
    musicBus.gain.value = 1;
    const vol = ac.createGain();
    vol.gain.value = 0.55;
    const echo = ac.createDelay(1);
    echo.delayTime.value = 0.38;
    const fb = ac.createGain();
    fb.gain.value = 0.32;
    const wet = ac.createGain();
    wet.gain.value = 0.4;
    musicBus.connect(vol);
    musicBus.connect(echo);
    echo.connect(fb); fb.connect(echo);
    echo.connect(wet); wet.connect(vol);
    vol.connect(master);
  }

  function padNote(m, t, dur, vol) {
    const f = ac.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 1100;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + Math.min(1.4, dur * 0.3));
    g.gain.setValueAtTime(vol, t + dur - Math.min(1.2, dur * 0.3));
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.4);
    f.connect(g); g.connect(musicBus);
    for (const det of [-6, 6]) {
      const o = ac.createOscillator();
      o.type = 'triangle';
      o.frequency.value = midi(m);
      o.detune.value = det;
      o.connect(f);
      o.start(t); o.stop(t + dur + 0.5);
    }
  }

  function pluck(m, t, vol, type) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine';
    o.frequency.value = midi(m);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    o.connect(g); g.connect(musicBus);
    o.start(t); o.stop(t + 1);
  }

  function scheduleMusic() {
    if (!ac || !mood || !musicOn) return;
    const M = MOODS[mood];
    const eighth = 60 / M.bpm / 2;
    if (nextTime < ac.currentTime) nextTime = ac.currentTime + 0.05;
    while (nextTime < ac.currentTime + 0.3) {
      const chord = M.chords[Math.floor(stepN / 16) % M.chords.length];
      if (stepN % 16 === 0) {
        chord.forEach(n => padNote(n, nextTime, eighth * 16, 0.022));
        padNote(chord[0] - 12, nextTime, eighth * 16, 0.03);
      }
      if (stepN % 2 === 0 || mood === 'mars' || mood === 'warp') {
        if (Math.random() < M.plucks) {
          const pool = Math.random() < 0.5 ? M.scale : chord.map(n => n + 24);
          pluck(SA.pick(pool), nextTime, mood === 'mars' ? 0.05 : 0.045, mood === 'mars' ? 'triangle' : 'sine');
        }
      }
      nextTime += eighth;
      stepN++;
    }
  }

  SA.audio = {
    init() {
      if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
      try {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        master = ac.createGain();
        master.gain.value = muted ? 0 : 0.6;
        master.connect(ac.destination);
        noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
        const data = noiseBuf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        buildMusicBus();
        timer = setInterval(scheduleMusic, 80);
      } catch (e) { ac = null; }
    },
    setMuted(m) {
      muted = m;
      if (master) master.gain.value = m ? 0 : 0.6;
    },
    play(name) {
      if (SA.native) SA.native.hapticFor(name);
      if (!ac || muted || !SFX[name]) return;
      try { SFX[name](); } catch (e) { /* ignore audio errors */ }
    },
    // Switch the background music mood ('space' | 'earth' | 'mars' | 'warp' | null).
    music(name) {
      if (name === mood) return;
      mood = name;
      stepN = 0;
      if (ac && musicBus) {
        musicBus.gain.cancelScheduledValues(ac.currentTime);
        musicBus.gain.setValueAtTime(0.0001, ac.currentTime);
        musicBus.gain.linearRampToValueAtTime(!musicOn ? 0.0001 : ducked ? 0.4 : 1, ac.currentTime + 1.2);
        nextTime = ac.currentTime + 0.1;
      }
    },
    setMusicOn(on) {
      musicOn = on;
      if (musicBus) musicBus.gain.setTargetAtTime(on ? 1 : 0.0001, ac.currentTime, 0.2);
    },
    // ---------- Notes scheduled ahead of time (the Planet Song plays its own music with these) ----------
    now: () => (ac ? ac.currentTime : 0),
    ready: () => !!ac && ac.state === 'running',
    // A melodic note at an exact time. kind: 'voice' (soft, with vibrato), 'bell', 'bass' or 'pad'.
    note(m, when, dur, kind, vol) {
      if (!ac || muted) return;
      try {
        const t = Math.max(when, ac.currentTime), f = midi(m), g = ac.createGain();
        const v = vol || 0.08;
        g.gain.setValueAtTime(0.0001, t);
        if (kind === 'pad') {
          g.gain.linearRampToValueAtTime(v, t + Math.min(0.5, dur * 0.3));
          g.gain.setValueAtTime(v, t + dur * 0.7);
          g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.3);
        } else {
          g.gain.exponentialRampToValueAtTime(v, t + (kind === 'voice' ? 0.05 : 0.01));
          g.gain.exponentialRampToValueAtTime(v * (kind === 'voice' ? 0.7 : 0.3), t + dur * 0.6);
          g.gain.exponentialRampToValueAtTime(0.0001, t + dur + (kind === 'bell' ? 0.6 : 0.1));
        }
        g.connect(master);
        const types = kind === 'voice' ? ['triangle', 'sine'] : kind === 'bass' ? ['triangle'] : kind === 'pad' ? ['triangle', 'triangle'] : ['sine'];
        types.forEach((type, i) => {
          const o = ac.createOscillator();
          o.type = type;
          o.frequency.value = kind === 'bell' && i === 0 ? f : f * (kind === 'voice' && i === 1 ? 2 : 1);
          if (kind === 'pad') o.detune.value = i ? 7 : -7;
          if (kind === 'voice') {
            // A gentle vibrato, so the melody sounds sung rather than beeped.
            const lfo = ac.createOscillator(), lg = ac.createGain();
            lfo.frequency.value = 5.5; lg.gain.value = f * 0.012 * (i + 1);
            lfo.connect(lg); lg.connect(o.frequency);
            lfo.start(t + 0.12); lfo.stop(t + dur + 0.2);
          }
          const og = ac.createGain();
          og.gain.value = kind === 'voice' && i === 1 ? 0.25 : 1;
          o.connect(og); og.connect(g);
          o.start(t); o.stop(t + dur + 0.7);
        });
      } catch (e) { /* ignore audio errors */ }
    },
    // Soft drums: 'kick', 'snare', 'hat' and 'clap'.
    drum(kind, when) {
      if (!ac || muted) return;
      try {
        const d = Math.max(0, when - ac.currentTime);
        if (kind === 'kick') tone(120, 0.22, 'sine', 0.22, 45, d);
        else if (kind === 'snare') { noise(0.14, 0.09, 1800, d, 'bandpass'); tone(190, 0.08, 'triangle', 0.05, 140, d); }
        else if (kind === 'hat') noise(0.04, 0.035, 7000, d, 'highpass');
        else if (kind === 'clap') { noise(0.03, 0.08, 1400, d, 'bandpass'); noise(0.09, 0.09, 1200, d + 0.02, 'bandpass'); }
      } catch (e) { /* ignore audio errors */ }
    },
    // Pause everything while the app is in the background.
    suspend() { if (ac && ac.state === 'running') ac.suspend(); },
    resume() { if (ac && ac.state === 'suspended') ac.resume(); },
    // Quietly lower the music while Cosmo is talking.
    tick() {
      if (!musicBus || !musicOn) return;
      const want = !!SA.voice.speaking;
      if (want !== ducked) {
        ducked = want;
        musicBus.gain.setTargetAtTime(want ? 0.4 : 1, ac.currentTime, 0.3);
      }
    },
  };

  // ---------- Read-aloud (Web Speech API; works in iOS WKWebView) ----------
  const synth = window.speechSynthesis;
  let voice = null, current = null;
  const PREFERRED = ['Samantha', 'Aria', 'Jenny', 'Google US English', 'Karen', 'Moira', 'Zira'];

  function pickVoice() {
    if (!synth) return;
    const list = synth.getVoices().filter(v => /^en[-_]/i.test(v.lang));
    if (!list.length) return;
    const natural = list.find(v => /natural/i.test(v.name) && /en[-_]US/i.test(v.lang));
    voice = natural || null;
    for (const name of PREFERRED) {
      if (voice) break;
      voice = list.find(v => v.name.indexOf(name) >= 0) || null;
    }
    voice = voice || list.find(v => /en[-_]US/i.test(v.lang)) || list[0];
  }
  if (synth) {
    pickVoice();
    if (synth.addEventListener) synth.addEventListener('voiceschanged', pickVoice);
  }

  // Turn display text into something a speech engine reads naturally.
  function speakable(text) {
    return String(text)
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, '')
      .replace(/°C/g, ' degrees Celsius')
      .replace(/—|–/g, ', ')
      .replace(/…/g, '...')
      .replace(/\s+/g, ' ')
      .trim();
  }

  SA.voice = {
    speaking: false,
    say(text) {
      if (!synth || !SA.state.voice) return;
      const clean = speakable(text);
      if (!clean) return;
      try {
        synth.cancel();
        const u = new SpeechSynthesisUtterance(clean);
        u.lang = 'en-US';
        u.rate = 0.95;
        u.pitch = 1.25;
        if (voice) u.voice = voice;
        // cancel() makes the previous line fire onend late; only the newest line may clear the flag.
        current = u;
        u.onstart = () => { if (current === u) SA.voice.speaking = true; };
        u.onend = u.onerror = () => { if (current === u) SA.voice.speaking = false; };
        synth.speak(u);
      } catch (e) { /* speech unsupported */ }
    },
    stop() {
      SA.voice.speaking = false;
      current = null;
      try { if (synth) synth.cancel(); } catch (e) { /* ignore */ }
    },
  };
})(window.SA);
