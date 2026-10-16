// The real sky, worked out on the device from today's date (nothing is looked up online):
// tonight's Moon phase, meteor showers, the start of the seasons and space anniversaries.
// Used by the Space Journal's "Tonight" page, Today's Space Fact and the grown-up page.
// Everything suggested is safe: the Moon, stars and meteors, never looking at the Sun.
(function (SA) {
  const SYN = 29.530588853;                      // days from one new Moon to the next
  const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);  // a known new Moon
  const NAMES = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
  // What it looks like, in kid words, and where (and when) to look for it.
  const LOOKS = ['hiding', 'a thin smile', 'half a Moon', 'almost full', 'a big round full Moon', 'a bit less than full', 'half a Moon', 'a thin smile'];
  const TIPS = [
    'The Moon is too close to the Sun in the sky to see tonight. That makes it a great night for spotting stars! ⭐',
    'Look low in the west just after sunset for a thin, shining crescent. 🌙',
    'Half the Moon is lit! Look for it in the afternoon or evening sky. If it\'s daytime, never look at the Sun! 😎',
    'Look for a big, bright, almost-full Moon in the evening sky.',
    'The full Moon rises in the east around sunset and shines all night long! 🌕',
    'The Moon rises later in the evening now. Night owls can spot it! 🦉',
    'Half the Moon is lit. Look for it in the morning sky, maybe on the way to school! Never look at the Sun! 😎',
    'Early birds: look east before sunrise for a thin crescent Moon. 🐦',
  ];

  // Tonight's Moon (worked out for 9 pm today). p: 0 new, 0.25 first quarter, 0.5 full, 0.75 last quarter.
  SA.moonTonight = function (date) {
    const d = date ? new Date(date) : new Date();
    d.setHours(21, 0, 0, 0);
    const age = ((((d.getTime() - NEW_MOON) / 86400000) % SYN) + SYN) % SYN;
    const p = age / SYN;
    const i = Math.floor(p * 8 + 0.5) % 8;
    const toFull = Math.round((((SYN / 2 - age) % SYN) + SYN) % SYN);
    return { p, age, i, name: NAMES[i], look: LOOKS[i], tip: TIPS[i], lit: Math.round((1 - Math.cos(p * Math.PI * 2)) * 50), toFull };
  };

  // Meteor showers: [month, peak day, name, note, hemisphere where it is best ('' for both)].
  const SHOWERS = [
    [1, 3, 'Quadrantid', 'One of the strongest showers, but only for a few hours.', 'north'],
    [4, 22, 'Lyrid', 'People have watched this one for more than 2,000 years!', ''],
    [5, 6, 'Eta Aquariid', 'Its shooting stars are tiny bits of dust from Halley\'s Comet!', ''],
    [8, 12, 'Perseid', 'One of the best showers of the year, on warm summer nights.', 'north'],
    [10, 21, 'Orionid', 'Its shooting stars are tiny bits of dust from Halley\'s Comet!', ''],
    [11, 17, 'Leonid', 'Its shooting stars are some of the fastest of all!', ''],
    [12, 14, 'Geminid', 'Often the best shower of the whole year!', ''],
  ];
  // On this day: [month, day, year, what happened].
  const DAYS = [
    [1, 14, 2005, 'the Huygens probe landed on Saturn\'s moon Titan'],
    [2, 18, 1930, 'Clyde Tombaugh found Pluto'],
    [3, 13, 1781, 'William Herschel found the planet Uranus'],
    [4, 12, 1961, 'Yuri Gagarin became the first person to fly in space'],
    [4, 24, 1990, 'the Hubble Space Telescope was launched'],
    [7, 20, 1969, 'Neil Armstrong and Buzz Aldrin walked on the Moon'],
    [8, 20, 1977, 'Voyager 2 set off on its trip to the giant planets'],
    [9, 5, 1977, 'Voyager 1 set off. Today it is the farthest spacecraft from Earth'],
    [9, 23, 1846, 'astronomers first spotted Neptune, right where maths said it would be'],
    [10, 4, 1957, 'Sputnik, the very first satellite, was launched'],
    [11, 2, 2000, 'the first crew moved into the International Space Station'],
    [12, 24, 1968, 'the Apollo 8 astronauts took the famous "Earthrise" photo'],
  ];
  const hemi = () => (SA.state && SA.state.hemi === 'south' ? 'south' : 'north');
  const dayDiff = (d, m, day) => {
    // Days from d to the nearest m/day (this year, last year or next year).
    const y = d.getFullYear(), t0 = new Date(y, d.getMonth(), d.getDate()).getTime();
    let best = null;
    for (const yy of [y - 1, y, y + 1]) {
      const v = Math.round((new Date(yy, m - 1, day).getTime() - t0) / 86400000);
      if (best === null || Math.abs(v) < Math.abs(best)) best = v;
    }
    return best;
  };

  // What's happening in the sky around today: { moon, events: [{ icon, text, grown }] }.
  // text is for children (read aloud); grown is an extra line for the grown-up page.
  SA.skyToday = function (date) {
    const d = date ? new Date(date) : new Date(), h = hemi(), out = [];
    for (const [m, day, name, note, best] of SHOWERS) {
      const dd = dayDiff(d, m, day);
      if (dd < -2 || dd > 7) continue;
      if (best && best !== h) continue;
      const when = dd === 0 ? 'tonight' : dd > 0 ? 'in ' + dd + (dd === 1 ? ' day' : ' days') : 'this week';
      out.push({ icon: '🌠', text: 'The ' + name + ' meteor shower is at its best ' + when + '! ' + note + ' Ask a grown-up to watch for shooting stars with you, somewhere dark.',
        grown: 'Meteor shower: the ' + name + 's peak around ' + day + ' ' + ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m - 1] + '. The best views are usually after midnight, away from street lights, with no telescope needed: just lie back and look up for 20 minutes or more.' });
    }
    // The seasons begin (near enough: the exact day moves by a day or so between years).
    const SEASONS = [[3, 20, 'eq'], [6, 21, 'jun'], [9, 22, 'eq'], [12, 21, 'dec']];
    for (const [m, day, kind] of SEASONS) {
      const dd = dayDiff(d, m, day);
      if (Math.abs(dd) > 1) continue;
      if (kind === 'eq') out.push({ icon: '⚖️', text: 'Around today, day and night are about the same length all over the world! It\'s called an equinox.' });
      else {
        const longest = (kind === 'jun') === (h === 'north');
        out.push({ icon: longest ? '☀️' : '🌙', text: 'Around today is the ' + (longest ? 'longest day' : 'longest night') + ' of the year where you live! It\'s called a solstice. Earth\'s tilt makes the seasons.' });
      }
    }
    for (const [m, day, year, what] of DAYS) {
      if (d.getMonth() + 1 !== m || d.getDate() !== day) continue;
      const ago = d.getFullYear() - year;
      out.push({ icon: '🎂', text: 'On this day in ' + year + ', ' + what + '! That was ' + ago + ' years ago.' });
    }
    return { moon: SA.moonTonight(d), events: out };
  };

  // Draws tonight's Moon the way it looks from the child's half of the world (in the south the
  // lit side is flipped).
  SA.drawMoonTonight = function (ctx, x, y, r, moon) {
    moon = moon || SA.moonTonight();
    ctx.save();
    ctx.translate(x, y);
    if (hemi() === 'south') ctx.scale(-1, 1);
    SA.drawMoonPhase(ctx, 0, 0, r, moon.p);
    ctx.restore();
  };
  SA.renderMoonCanvas = function (px, moon) {
    const c = document.createElement('canvas');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = c.height = Math.round(px * dpr);
    c.style.width = c.style.height = px + 'px';
    const g = c.getContext('2d');
    g.scale(dpr, dpr);
    SA.drawMoonTonight(g, px / 2, px / 2, px * 0.42, moon);
    return c;
  };
})(window.SA);
