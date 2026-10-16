// Expert missions: optional harder replays of the 8 planet missions, for 8-9 year olds who want more.
// Each one keeps the same mission with a twist (a trickier time-of-day puzzle, a faster rover, drifting
// storms, no helper circle...) and swaps in new, deeper facts. Finishing one earns a gold 🎓 Expert
// badge for that planet. Expert missions are never required and never add to the star total, so a
// younger child loses nothing by skipping them. All 8 badges unlock the Expert cap and a medal sticker.
(function (SA) {
  SA.EXPERT = {
    earth: {
      name: 'Time Keeper',
      flight: 'Expert mission! On Earth, you\'ll make sunrise, noon, sunset and midnight happen. Ready, Time Keeper? 🕰️',
      intro: [
        'Expert mission: Time Keeper! 🕰️ This time, friends want a special time of day.',
        'Earth spins this way, toward the Sun. The edge turning INTO the light has SUNRISE. 🌅 The edge turning away has SUNSET. 🌇',
        'The middle of the day side is NOON, and the middle of the night side is MIDNIGHT. Spin carefully! 🎯',
      ],
      outro: [
        'Time Keeper complete! You can make any time of day happen! 🎉',
        'Earth spins toward the east. That\'s why the Sun always rises in the east and sets in the west!',
        'And when it\'s noon for you, it\'s midnight on the other side of the world. 🌍',
      ],
      card: [
        'The Sun rises in the east because Earth spins toward the east.',
        'When it is noon on one side of Earth, it is midnight on the other side.',
        'Sunrise and sunset happen at the line between day and night.',
      ],
      quiz: [
        { q: 'When it is noon on your side of Earth, what time is it on the opposite side?',
          options: [['🌙', 'Midnight'], ['☀️', 'Noon too'], ['🌅', 'Breakfast time']], answer: 0,
          explain: 'Yes! The opposite side of Earth faces away from the Sun, so it\'s the middle of the night there.' },
        { q: 'Why does the Sun rise in the east?',
          options: [['🌍', 'Earth spins toward the east'], ['🏃', 'The Sun runs around Earth'], ['🧭', 'The Sun likes the east best']], answer: 0,
          explain: 'Right! Earth spins toward the east, so the Sun seems to come up in the east every morning.' },
      ],
    },
    mars: {
      name: 'Speedy Scientist',
      flight: 'Expert mission! Our Mars rover has a turbo boost today, and there are brand-new samples to find. 🏎️',
      intro: [
        'Expert mission: Speedy Scientist! 🏎️ Our rover has a turbo boost today.',
        'These samples are new, with brand-new Mars secrets. Jump at just the right time to grab them all! 🔬',
      ],
      samples: [
        { name: 'Canyon rock', color: '#b5502e', fact: 'Canyon rock! Valles Marineris, a giant canyon on Mars, is so long it would stretch almost all the way across the USA!' },
        { name: 'Polar ice', color: '#e6f6ff', fact: 'Polar ice! Mars\'s ice caps are frozen water, and in winter a frosty layer of frozen carbon dioxide, called dry ice, covers them too.' },
        { name: 'Sunset dust', color: '#9ec7e8', fact: 'Super-fine dust! It makes something amazing: sunsets on Mars are BLUE!' },
        { name: 'Clay pebble', color: '#c9a27a', fact: 'A clay pebble! Clay forms in water, so finding it tells scientists that Mars was much wetter long ago.' },
        { name: 'Sample tube', color: '#d8dde8', fact: 'A sample tube! Perseverance seals rocks in tubes like this, so one day a mission might bring them back to Earth.' },
        { name: 'Phobos rock', color: '#7d7068', fact: 'A rock from Phobos! This little moon is slowly getting closer to Mars. In millions of years it may break up into a ring!' },
      ],
      outro: [
        'Speedy Scientist complete! What a turbo-charged science trip! 🎉',
        'Real rovers drive very slowly and carefully, so they don\'t get stuck. Our turbo rover is just for fun! 😄',
      ],
      card: [
        'Valles Marineris is a canyon on Mars almost as long as the USA is wide.',
        'Sunsets on Mars look blue, because of fine dust in the air.',
        'Perseverance seals rock samples in tubes for a future trip to Earth.',
      ],
      quiz: [
        { q: 'What colour are sunsets on Mars?', options: [['🔵', 'Blue'], ['🟢', 'Green'], ['⚫', 'Black']], answer: 0,
          explain: 'Yes! Fine Martian dust makes the sky around the setting Sun glow blue.' },
        { q: 'What does Perseverance do with its rock samples?', options: [['🧪', 'Seals them in tubes'], ['🍽️', 'Eats them for lunch'], ['🗑️', 'Throws them away']], answer: 0,
          explain: 'Right! It seals them in tubes, so a future mission might bring them back to Earth to study.' },
      ],
    },
    jupiter: {
      name: 'Storm Dodger',
      flight: 'Expert mission! Jupiter\'s lightning storms are on the move today. Let\'s dodge them and snap some new photos! ⚡',
      intro: [
        'Expert mission: Storm Dodger! ⚡ Today the lightning storms drift up and down.',
        'The camera frames are smaller too, so steer carefully. Let\'s learn new secrets about each moon! 📸',
      ],
      facts: {
        io: 'Snap! Io\'s volcanoes shoot giant plumes of gas and dust hundreds of kilometres up into space! 🌋',
        europa: 'Snap! The Europa Clipper spacecraft is on its way to study Europa\'s hidden ocean.',
        grs: 'Snap! The Great Red Spot is slowly shrinking. Long ago, it was much bigger than it is now!',
        ganymede: 'Snap! Ganymede is the only moon we know of with its own magnetic field, just like Earth!',
        callisto: 'Snap! Callisto\'s craters are very, very old. Its surface has hardly changed for about 4 billion years!',
      },
      outro: [
        'Storm Dodger complete! You flew like a real Jupiter pilot! 🎉',
        'Jupiter has faint, dusty rings too. They are so thin that they were only discovered in 1979, by Voyager 1!',
      ],
      card: [
        'Ganymede is the only moon known to have its own magnetic field.',
        'Jupiter\'s Great Red Spot is slowly shrinking.',
        'Jupiter has faint rings, discovered by Voyager 1 in 1979.',
      ],
      quiz: [
        { q: 'Which of Jupiter\'s moons has its own magnetic field, like Earth?', options: [['🧲', 'Ganymede'], ['🌋', 'Io'], ['🧊', 'Europa']], answer: 0,
          explain: 'Yes! Ganymede is the only moon we know of with its own magnetic field.' },
        { q: 'What is happening to the Great Red Spot?', options: [['📉', 'It is slowly shrinking'], ['🎈', 'It doubles in size every day'], ['🛑', 'It stopped spinning']], answer: 0,
          explain: 'Right! The Great Red Spot is still a giant storm, but it is slowly getting smaller.' },
      ],
    },
    saturn: {
      name: 'No Helper Circle',
      flight: 'Expert mission! Today there\'s no green helper circle on Saturn\'s rings. You\'ll time every hop yourself! 🧊',
      intro: [
        'Expert mission: No Helper Circle! 🧊 Today the circle won\'t turn green to help you.',
        'Watch the ice chunks zoom by and pick your moment. My jetpack still catches you if you miss! 🚀',
      ],
      lanes: [
        'The rings are mostly water ice: more than 9 out of every 10 bits are ice! 🧊',
        'Sometimes dark streaks called "spokes" appear across the B ring, then fade away. Scientists are still studying them!',
        'Giovanni Cassini spotted this gap with a telescope way back in 1675!',
        'Little moons hide in gaps in the A ring. A tiny moon called Pan sweeps one gap clean!',
        'The F ring\'s shepherd moons are called Prometheus and Pandora. 🐑',
      ],
      moons: {
        enceladus: 'Enceladus! The Cassini spacecraft flew right through its icy fountains. They come from a salty ocean under the ice! ⛲',
        titan: 'Titan! Its air is thicker than Earth\'s, and in 2005 the Huygens probe parachuted down through it.',
        mimas: 'Mimas! Its giant crater, called Herschel, is about a third as wide as the whole moon!',
      },
      outro: [
        'No Helper Circle complete! You timed every hop like a pro! 🎉',
        'Saturn\'s rings are huge but very thin. From Earth, they almost disappear when we see them edge-on!',
      ],
      card: [
        'Saturn\'s rings are mostly water ice.',
        'Enceladus has icy fountains that come from an ocean under its ice.',
        'Mimas\'s Herschel crater is about a third as wide as the whole moon.',
      ],
      quiz: [
        { q: 'What are Saturn\'s rings mostly made of?', options: [['🧊', 'Water ice'], ['🍬', 'Sugar'], ['🪙', 'Gold']], answer: 0,
          explain: 'Yes! Saturn\'s rings are mostly chunks of water ice, from tiny grains to pieces as big as a house.' },
        { q: 'Where do the icy fountains of Enceladus come from?', options: [['🌊', 'An ocean under the ice'], ['🚿', 'A giant shower'], ['☁️', 'Rain clouds']], answer: 0,
          explain: 'Right! Scientists think a salty ocean hides under Enceladus\'s icy shell.' },
      ],
    },
    venus: {
      name: 'Narrow Beam',
      flight: 'Expert mission! Our radar beam is narrower today, so scan carefully to find Venus\'s secrets. 📡',
      intro: [
        'Expert mission: Narrow Beam! 📡 Our radar beam is thinner today, and the sparkly hints are shy.',
        'Scan carefully, like a real radar scientist, and find all 5 wonders!',
      ],
      facts: {
        maat: 'Maat Mons! Scientists think some of Venus\'s volcanoes may still be active today. 🌋',
        craters: 'Craters! Venus has fewer craters than the Moon, because lava covered up the old ones long ago.',
        domes: 'Pancake domes! Each one is about as wide as a big city.',
        channel: 'This lava channel is called Baltis Vallis. It\'s about 6,800 kilometres long!',
        lander: 'Venera 13 sent back sounds from Venus, too: a microphone recorded the wind!',
      },
      outro: [
        'Narrow Beam complete! You mapped Venus like a real radar expert! 🎉',
        'Venus\'s clouds race all the way around the planet in about 4 Earth days, while the planet itself spins super slowly!',
      ],
      card: [
        'Venus\'s cloud tops race around the planet in about 4 Earth days.',
        'Some of Venus\'s volcanoes may still be active.',
        'Venera 13 recorded the sound of the wind on Venus.',
      ],
      quiz: [
        { q: 'How long do Venus\'s cloud tops take to whip around the planet?', options: [['🌪️', 'About 4 days'], ['🐌', 'About 100 years'], ['⏸️', 'They never move']], answer: 0,
          explain: 'Yes! The winds high up carry the clouds around Venus in about 4 Earth days.' },
        { q: 'Why does Venus have fewer craters than the Moon?', options: [['🌋', 'Lava covered old ones'], ['🧹', 'Robots swept them away'], ['🧲', 'Magnets push rocks away']], answer: 0,
          explain: 'Right! Long ago, lava flowed over Venus and covered up many old craters.' },
      ],
    },
    mercury: {
      name: 'Tricky Twilight',
      flight: 'Expert mission! On Mercury today, the comfy glow is thinner and it wiggles faster. Stay cool... and warm! 🌅',
      intro: [
        'Expert mission: Tricky Twilight! 🌅 The comfy glow is thinner today, and it wiggles faster.',
        'Keep Cosmo in the orange glow and discover 5 new Mercury secrets! 🧡',
      ],
      items: [
        { name: 'Caloris Basin', fact: 'The Caloris Basin is one of the biggest craters in the Solar System, about 1,500 kilometres across!' },
        { name: 'Slow day', fact: 'One day on Mercury, from one sunrise to the next, lasts about 176 Earth days. That\'s two of its years!' },
        { name: 'Iron heart', icon: '⚙️', fact: 'Mercury has a giant iron core. For its size, it\'s the biggest core of any planet!' },
        { name: 'Radar ice', fact: 'Scientists first spotted Mercury\'s hidden ice with radar from Earth. MESSENGER checked it later!' },
        { name: 'BepiColombo', fact: 'BepiColombo, a spacecraft from Europe and Japan, is the next explorer sent to study Mercury!' },
      ],
      outro: [
        'Tricky Twilight complete! You walked the trickiest sunrise in the Solar System! 🎉',
        'Even though Mercury is closest to the Sun, it isn\'t the hottest planet. Venus is, because of its thick, heat-trapping clouds!',
      ],
      card: [
        'A day on Mercury, sunrise to sunrise, lasts about 176 Earth days.',
        'Mercury has a giant iron core.',
        'The Caloris Basin is about 1,500 kilometres across.',
      ],
      quiz: [
        { q: 'How long is one day on Mercury, from sunrise to sunrise?', options: [['📅', 'About 176 Earth days'], ['⏱️', 'One hour'], ['🗓️', 'One Earth day']], answer: 0,
          explain: 'Yes! Mercury spins so slowly that one sunrise to the next takes about 176 Earth days.' },
        { q: 'What is inside Mercury?', options: [['⚙️', 'A giant iron core'], ['🍫', 'Chocolate'], ['💧', 'A big ocean']], answer: 0,
          explain: 'Right! Mercury has a huge iron core. For its size, it\'s the biggest of any planet.' },
      ],
    },
    uranus: {
      name: 'Short Guide',
      flight: 'Expert mission! At Uranus, the dotted guide line is shorter today. You\'ll imagine the curve yourself! 🎯',
      intro: [
        'Expert mission: Short Guide! 🎯 The dotted guide line only shows the start of the path today.',
        'Imagine how Uranus\'s gravity will bend the rest of it. Every shot is free, so experiment! 🌀',
      ],
      facts: {
        miranda: 'Snap! Miranda looks like a patchwork, as if it was broken up and stuck back together!',
        ariel: 'Snap! Ariel has the brightest, youngest-looking surface of Uranus\'s big moons.',
        umbriel: 'Snap! Umbriel has a mysterious bright ring on one crater. Scientists nicknamed it the "fluorescent Cheerio"!',
        titania: 'Snap! Titania was discovered in 1787 by William Herschel, the same astronomer who found Uranus!',
        oberon: 'Snap! Oberon is the second biggest moon of Uranus. Some of its old craters have mysterious dark floors!',
      },
      outro: [
        'Short Guide complete! You can predict gravity like a real space navigator! 🎉',
        'William Herschel discovered Uranus in 1781 with a telescope. It was the first planet found with a telescope!',
      ],
      card: [
        'Uranus was the first planet discovered with a telescope, in 1781.',
        'A gravity slingshot bends a spacecraft\'s path and can speed it up.',
        'Umbriel has a bright ring nicknamed the "fluorescent Cheerio".',
      ],
      quiz: [
        { q: 'How was Uranus discovered in 1781?', options: [['🔭', 'With a telescope'], ['🚀', 'By an astronaut'], ['🐶', 'By a space dog']], answer: 0,
          explain: 'Yes! William Herschel found Uranus with a telescope. It was the first planet ever found that way.' },
        { q: 'How does a gravity slingshot help a spacecraft?', options: [['🌀', 'It bends the path and can speed it up'], ['🧲', 'Magnets push it'], ['⛽', 'It stops for fuel']], answer: 0,
          explain: 'Right! Flying past a planet, a spacecraft\'s path bends, and it can steal a little speed. Voyager 2 did this!' },
      ],
    },
    neptune: {
      name: 'Storm Chaser',
      flight: 'Expert mission! Neptune\'s winds are even faster today, and the storms are moving. Hold on tight! 💨',
      intro: [
        'Expert mission: Storm Chaser! 💨 The winds are faster today, and the dark storms drift up and down.',
        'Hold to fly up and let go to glide. Catch 5 new discoveries! 🔭',
      ],
      finds: [
        { name: 'Blue methane', fact: 'Neptune looks blue because methane gas in its air soaks up red light!' },
        { name: 'Vanishing storm', fact: 'When the Hubble telescope looked again in 1994, the Great Dark Spot was gone! Neptune\'s storms come and go.' },
        { name: 'Ice giant', icon: '🧊', fact: 'Neptune is an ice giant. Deep inside, it\'s full of hot, squished water, ammonia and methane.' },
        { name: 'Frozen Triton', fact: 'Triton is one of the coldest places ever measured in the Solar System: about −235 °C!' },
        { name: 'Faint rings', icon: '💫', fact: 'Neptune has 5 faint rings. Two are named after Galle and Le Verrier, who helped find Neptune!' },
      ],
      outro: [
        'Storm Chaser complete! You rode the wildest winds in the Solar System! 🎉',
        'Neptune is so far from the Sun that sunlight there is about 900 times dimmer than on Earth!',
      ],
      card: [
        'Neptune is blue because methane gas soaks up red light.',
        'Neptune\'s storms come and go: the Great Dark Spot had vanished by 1994.',
        'Triton is about −235 °C, one of the coldest places measured.',
      ],
      quiz: [
        { q: 'Why does Neptune look blue?', options: [['💙', 'Methane gas soaks up red light'], ['🌊', 'It is covered in oceans'], ['🎨', 'Someone painted it']], answer: 0,
          explain: 'Yes! Methane in Neptune\'s air soaks up red light, so the light that bounces back looks blue.' },
        { q: 'What happened to Neptune\'s Great Dark Spot?', options: [['🌫️', 'It disappeared'], ['🧊', 'It froze solid'], ['🪨', 'It turned into a moon']], answer: 0,
          explain: 'Right! By 1994 it was gone. Storms on Neptune come and go.' },
      ],
    },
  };

  const place = id => SA.BODY[id].name;

  // A gold medal with the planet in the middle and a ribbon: the Expert badge.
  SA.drawExpertBadge = function (ctx, id, x, y, r, t) {
    t = t || 0;
    // Ribbon tails.
    for (const side of [-1, 1]) {
      ctx.fillStyle = side < 0 ? '#5b6cff' : '#ff5d8a';
      ctx.beginPath();
      ctx.moveTo(x + side * r * 0.2, y + r * 0.5);
      ctx.lineTo(x + side * r * 0.75, y + r * 1.55);
      ctx.lineTo(x + side * r * 0.42, y + r * 1.38);
      ctx.lineTo(x + side * r * 0.22, y + r * 1.62);
      ctx.lineTo(x + side * r * 0.02, y + r * 0.62);
      ctx.closePath();
      ctx.fill();
    }
    // Scalloped gold rim.
    ctx.fillStyle = '#e0a31a';
    SA.starPath(ctx, x, y, r * 1.08, 0.88, 16, t * 0.2);
    ctx.fill();
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
    g.addColorStop(0, '#fff6c4'); g.addColorStop(0.6, '#ffd84d'); g.addColorStop(1, '#d99a12');
    ctx.fillStyle = g;
    SA.circle(ctx, x, y, r * 0.92); ctx.fill();
    ctx.strokeStyle = 'rgba(150,95,0,0.6)'; ctx.lineWidth = Math.max(1, r * 0.05);
    SA.circle(ctx, x, y, r * 0.72); ctx.stroke();
    if (id && SA.BODY[id]) SA.drawBody(ctx, id, x, y, r * (id === 'saturn' ? 0.36 : 0.5), { t, lx: -0.5, ly: -0.5 });
    // A little graduation cap on top.
    ctx.fillStyle = '#26306e';
    ctx.beginPath(); ctx.moveTo(x - r * 0.42, y - r * 0.86); ctx.lineTo(x, y - r * 1.05); ctx.lineTo(x + r * 0.42, y - r * 0.86); ctx.lineTo(x, y - r * 0.7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd84d'; SA.circle(ctx, x, y - r * 0.87, Math.max(1.5, r * 0.06)); ctx.fill();
  };
  SA.renderExpertBadge = function (id, px) {
    const c = document.createElement('canvas'), ps = Math.min(window.devicePixelRatio || 1, 2);
    c.width = c.height = Math.round(px * ps);
    c.style.width = c.style.height = px + 'px';
    const g = c.getContext('2d');
    g.scale(ps, ps);
    SA.drawExpertBadge(g, id, px / 2, px * 0.42, px * 0.3, 1);
    return c;
  };

  // End of an Expert mission: a harder quiz (it never changes the star total), then the badge.
  SA.finishExpert = async function (id, missionStars) {
    if (SA.scene !== SA[id]) return;
    const E = SA.EXPERT[id];
    await SA.ui.quiz(E.quiz, { kicker: '🎓 Expert Quiz', ok: 'Get my badge! 🎓' });
    const unlocked = SA.recordStars(id, missionStars || 3, 0);
    if (unlocked.length) SA.state.wardNew = true;
    const first = !SA.state.expert[id];
    SA.state.expert[id] = true;
    if (first && SA.expertCount() >= 8) { SA.state.wardNew = true; SA.state.baseNew = true; }
    SA.save();
    SA.ui.updateHud();
    await SA.ui.expertBadge(id, { isNew: first });
    SA.go(SA.map, { expertDone: id, first, unlocked });
  };

  // What Cosmo says back on the map after an Expert mission.
  SA.expertMapLines = function (id, first) {
    const n = SA.expertCount();
    if (!first) return ['You\'re still the ' + place(id) + ' Expert! 🎓 What a brain!'];
    if (n >= 8) {
      return [
        'You earned ALL 8 Expert badges! 🎓 You\'re a real Solar System Expert!',
        'You unlocked the golden Expert cap! Tap the 🎩 button to wear it. And there\'s an Expert medal sticker at my Space Base! 🏅',
      ];
    }
    return ['You earned the ' + place(id) + ' Expert badge! 🎓 That\'s ' + n + ' of 8. ' +
      (n === 1 ? 'Every planet you explored has an Expert mission. Find them on the planet cards!' : 'Keep going, super scientist!')];
  };
})(window.SA);
