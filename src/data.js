// Everything Cosmo teaches: the bodies of the Solar System, their facts, stats and quizzes.
// Facts are kept short enough for a 6-9 year old to repeat at dinner, and checked for accuracy.
(function (SA) {
  SA.BODIES = [
    {
      id: 'sun', name: 'The Sun', kind: 'Star', mapR: 0, playable: false,
      color: '#ffb627',
      teaser: "That's the Sun! It's a star, and it gives us light and warmth. Here's a card for you!",
      facts: [
        'The Sun is a star. It is the closest star to Earth!',
        'Sunlight takes about 8 minutes to travel all the way to Earth.',
        'Our Sun is about halfway through its life. It will shine for billions more years!',
      ],
      stats: [['⭐', 'Type', 'Star'], ['📏', 'Width', '109 Earths'], ['🌡️', 'Surface', '5,500 °C']],
      // Bonus mission "Star Story" (sun.js), unlocked after Mercury.
      quiz: [
        {
          q: 'Where are stars born?',
          options: [['🌫️', 'In giant clouds of gas and dust'], ['🥚', 'In giant eggs'], ['🌊', 'In the ocean']],
          answer: 0,
          explain: 'Yes! Stars are born in giant clouds of gas and dust called nebulas.',
        },
        {
          q: 'What will our Sun become, billions of years from now?',
          options: [['🔴', 'A red giant star'], ['🪐', 'A planet'], ['☄️', 'A comet']],
          answer: 0,
          explain: 'Right! In about 5 billion years, the Sun will swell into a red giant. Then it will shrink into a tiny white dwarf.',
        },
      ],
    },
    {
      id: 'mercury', name: 'Mercury', kind: 'Rocky planet', mapR: 13, playable: true,
      color: '#a3a0a0',
      teaser: 'Mercury is the smallest planet and the closest to the Sun. It zooms around the Sun in just 88 days!',
      facts: [
        'Mercury is the smallest planet and the closest one to the Sun.',
        'A year on Mercury is only 88 Earth days. It zooms around the Sun!',
        'It has almost no air, so days are super hot and nights are freezing cold.',
      ],
      stats: [['📏', 'Size', 'Smallest'], ['🗓️', 'Year', '88 days'], ['🌙', 'Moons', '0']],
      quiz: [
        {
          q: 'What happens at night on Mercury?',
          options: [['🥶', 'It gets freezing cold'], ['🔥', 'It stays hot'], ['🌧️', 'It rains']],
          answer: 0,
          explain: 'Yes! Mercury has almost no air to hold heat, so nights drop to about −180 °C.',
        },
        {
          q: 'Which planet zooms around the Sun fastest?',
          options: [['⚡', 'Mercury'], ['🪐', 'Saturn'], ['🌍', 'Earth']],
          answer: 0,
          explain: 'Right! Mercury is closest to the Sun, so it races around in just 88 days.',
        },
      ],
    },
    {
      id: 'venus', name: 'Venus', kind: 'Rocky planet', mapR: 21, playable: true,
      color: '#e6bf73',
      teaser: 'Venus is the hottest planet, even though Mercury is closer to the Sun. Its thick clouds trap the heat like a blanket!',
      facts: [
        'Venus is the hottest planet. It is hot enough to melt lead!',
        'Thick clouds trap the Sun\'s heat like a heavy blanket.',
        'Venus spins backwards, so the Sun rises in the west there.',
      ],
      stats: [['🌡️', 'Heat', '465 °C'], ['🗓️', 'Year', '225 days'], ['🌙', 'Moons', '0']],
      quiz: [
        {
          q: 'Why is Venus so hot?',
          options: [['🧣', 'Thick clouds trap heat'], ['🔥', 'It is on fire'], ['☀️', 'It touches the Sun']],
          answer: 0,
          explain: 'Yes! Venus\'s thick clouds trap the Sun\'s heat like a heavy blanket.',
        },
        {
          q: 'How did scientists see through Venus\'s clouds?',
          options: [['📡', 'With radar'], ['🔦', 'With a flashlight'], ['🪟', 'They opened a window']],
          answer: 0,
          explain: 'Right! Radar can see through clouds. The Magellan spacecraft used it to map Venus.',
        },
      ],
    },
    {
      id: 'earth', name: 'Earth', kind: 'Rocky planet', mapR: 23, playable: true,
      color: '#3a8fe0',
      facts: [
        'Earth is the only planet where we know there is life.',
        'About 7 out of every 10 parts of Earth are covered by water.',
        'Earth spins around once every 24 hours. That makes day and night!',
      ],
      stats: [['🕐', 'Day', '24 hours'], ['🗓️', 'Year', '365 days'], ['🌙', 'Moons', '1']],
      quiz: [
        {
          q: 'What makes day and night?',
          options: [['🌍', 'Earth spins around'], ['💡', 'The Sun turns off'], ['☁️', 'Clouds hide the Sun']],
          answer: 0,
          explain: 'Yes! Earth spins around. The side facing the Sun has day, and the other side has night.',
        },
        {
          q: 'How much of Earth is covered by water?',
          options: [['🌊', 'Most of it'], ['🏜️', 'Just a little'], ['🚫', 'None at all']],
          answer: 0,
          explain: 'Right! About 7 out of every 10 parts of Earth are ocean, lakes and rivers.',
        },
      ],
    },
    {
      id: 'mars', name: 'Mars', kind: 'Rocky planet', mapR: 17, playable: true,
      color: '#d0603a',
      facts: [
        'Mars looks red because its dust is full of rusty iron.',
        'Olympus Mons on Mars is the biggest volcano in the Solar System.',
        'Mars has weak gravity, so you could jump more than twice as high there!',
      ],
      stats: [['🕐', 'Day', '24 h 37 min'], ['🗓️', 'Year', '687 days'], ['🌙', 'Moons', '2']],
      quiz: [
        {
          q: 'Why is Mars red?',
          options: [['🧱', 'Its dust is rusty'], ['🔥', 'It is on fire'], ['🍓', 'It is made of jam']],
          answer: 0,
          explain: 'That\'s it! Mars dust has lots of iron in it, and the iron has gone rusty.',
        },
        {
          q: 'On Mars, you can jump…',
          options: [['🦘', 'Higher than on Earth'], ['🐢', 'Lower than on Earth'], ['⛔', 'Not at all']],
          answer: 0,
          explain: 'Yes! Mars has weaker gravity than Earth, so you would float up higher.',
        },
      ],
    },
    {
      // Bonus mission "Space Rock Sorter" (belt.js), reached from the belt after Mars.
      id: 'belt', name: 'The Asteroid Belt', kind: 'Ring of space rocks', mapR: 0, playable: true, bonus: true,
      color: '#b59a82',
      facts: [
        'The asteroid belt is a giant ring of space rocks between Mars and Jupiter.',
        'The rocks are very far apart, so spaceships can fly through safely.',
        'Ceres, the biggest rock in the belt, is a dwarf planet.',
      ],
      stats: [['🪨', 'Rocks', 'Millions'], ['📍', 'Where', 'Mars to Jupiter'], ['👑', 'Biggest', 'Ceres']],
      quiz: [
        {
          q: 'Where is the asteroid belt?',
          options: [['🪐', 'Between Mars and Jupiter'], ['🌙', 'Around the Moon'], ['☀️', 'Inside the Sun']],
          answer: 0,
          explain: 'Yes! The asteroid belt is a giant ring of rocks between Mars and Jupiter.',
        },
        {
          q: 'Are the rocks in the belt close together?',
          options: [['↔️', 'No, they are very far apart'], ['💥', 'Yes, they crash all the time'], ['🧲', 'They are stuck together']],
          answer: 0,
          explain: 'Right! The rocks are so far apart that spaceships fly through the belt safely.',
        },
      ],
    },
    {
      id: 'jupiter', name: 'Jupiter', kind: 'Gas giant', mapR: 50, playable: true,
      color: '#d6a676',
      teaser: 'Jupiter is the biggest planet of all. More than 1,300 Earths could fit inside it!',
      facts: [
        'Jupiter is the biggest planet. More than 1,300 Earths could fit inside!',
        'The Great Red Spot is a giant storm that is bigger than Earth.',
        'Jupiter is a gas giant. There is no solid ground to stand on!',
      ],
      stats: [['🕐', 'Day', '10 hours'], ['🗓️', 'Year', '12 Earth years'], ['🌙', 'Moons', '95+']],
      quiz: [
        {
          q: 'What is the Great Red Spot?',
          options: [['🌀', 'A giant storm'], ['🌊', 'A red ocean'], ['🌋', 'A volcano']],
          answer: 0,
          explain: 'Yes! It\'s a huge storm that is bigger than the whole Earth.',
        },
        {
          q: 'Could you stand on Jupiter?',
          options: [['☁️', 'No, it\'s made of gas'], ['🌱', 'Yes, on the grass'], ['🧊', 'Yes, on the ice']],
          answer: 0,
          explain: 'Right! Jupiter is a gas giant. There is no solid ground to stand on.',
        },
      ],
    },
    {
      // Bonus mission "Ice Ocean Dive" (europa.js), reached from little Europa circling Jupiter.
      id: 'europa', name: 'Europa', kind: 'Jupiter\'s icy moon', mapR: 0, playable: true, bonus: true,
      color: '#e9dcc4',
      facts: [
        'Europa is one of Jupiter\'s moons. It is covered in a thick shell of ice.',
        'Scientists think a giant salty ocean hides under the ice!',
        'Jupiter\'s gravity squeezes Europa, and that keeps its ocean from freezing.',
      ],
      stats: [['📏', 'Size', 'A bit smaller than our Moon'], ['🧊', 'Outside', 'Ice'], ['🌊', 'Ocean', 'About 2× Earth\'s water']],
      quiz: [
        {
          q: 'What do scientists think is hiding under Europa\'s ice?',
          options: [['🌊', 'A giant salty ocean'], ['🍦', 'Ice cream'], ['🔥', 'Hot lava']],
          answer: 0,
          explain: 'Yes! Scientists think a giant salty ocean hides under Europa\'s ice shell.',
        },
        {
          q: 'What keeps Europa\'s ocean from freezing?',
          options: [['🪐', 'Jupiter squeezes it'], ['🧥', 'A big warm coat'], ['☀️', 'The Sun is very close']],
          answer: 0,
          explain: 'Right! Jupiter\'s strong gravity squeezes and stretches Europa. That makes heat inside it.',
        },
      ],
    },
    {
      id: 'saturn', name: 'Saturn', kind: 'Gas giant', mapR: 38, playable: true,
      color: '#e8cf95',
      teaser: 'Saturn\'s beautiful rings are made of ice and rock. Some pieces are tiny, and some are as big as a house!',
      facts: [
        'Saturn\'s rings are made of billions of chunks of ice and rock.',
        'Saturn is so light that it would float in a giant bathtub!',
        'Saturn has more moons than any other planet.',
      ],
      stats: [['🕐', 'Day', '10.5 hours'], ['🗓️', 'Year', '29 Earth years'], ['🌙', 'Moons', '270+']],
      quiz: [
        {
          q: 'What are Saturn\'s rings made of?',
          options: [['🧊', 'Ice and rock'], ['🍬', 'Candy'], ['🔥', 'Fire']],
          answer: 0,
          explain: 'Yes! Billions of chunks of ice and rock, from tiny grains to pieces as big as a house.',
        },
        {
          q: 'Which part of the rings goes around fastest?',
          options: [['⬇️', 'Closest to Saturn'], ['⬆️', 'Farthest from Saturn'], ['🟰', 'All the same speed']],
          answer: 0,
          explain: 'Right! The closer a ring is to Saturn, the faster it zooms around.',
        },
      ],
    },
    {
      // Bonus mission "Titan Drone Flight" (titan.js), reached from little Titan circling Saturn.
      id: 'titan', name: 'Titan', kind: 'Saturn\'s biggest moon', mapR: 0, playable: true, bonus: true,
      color: '#e8a04f',
      facts: [
        'Titan is Saturn\'s biggest moon. It is even bigger than the planet Mercury!',
        'Titan is the only moon with thick air. It is wrapped in an orange haze.',
        'It rains on Titan, but the rain, rivers and lakes are liquid methane, not water.',
      ],
      stats: [['📏', 'Size', 'Bigger than Mercury'], ['🌡️', 'Cold', 'About −180 °C'], ['🌧️', 'Rain', 'Liquid methane']],
      quiz: [
        {
          q: 'What are Titan\'s lakes filled with?',
          options: [['🛢️', 'Liquid methane'], ['💧', 'Water, like ours'], ['🥤', 'Orange juice']],
          answer: 0,
          explain: 'Yes! Titan is far too cold for liquid water. Its lakes, rivers and rain are liquid methane.',
        },
        {
          q: 'Why is flying easy on Titan?',
          options: [['🪶', 'Thick air and weak gravity'], ['🧲', 'Giant magnets'], ['🌪️', 'Strong tornadoes']],
          answer: 0,
          explain: 'Right! Titan\'s air is thick and its gravity is weak. A drone called Dragonfly is going there to fly around!',
        },
      ],
    },
    {
      id: 'uranus', name: 'Uranus', kind: 'Ice giant', mapR: 29, playable: true,
      color: '#8fdde3',
      teaser: 'Uranus is tipped over on its side, so it rolls around the Sun like a ball!',
      facts: [
        'Uranus spins on its side, like a ball rolling around the Sun.',
        'It is an ice giant. A gas called methane makes it look blue-green.',
        'Uranus was the first planet found with a telescope, in 1781.',
      ],
      stats: [['🕐', 'Day', '17 hours'], ['🗓️', 'Year', '84 Earth years'], ['🌙', 'Moons', '28+']],
      quiz: [
        {
          q: 'How does Uranus spin?',
          options: [['🎳', 'On its side, like a rolling ball'], ['⬆️', 'Straight up and down'], ['🚫', 'It does not spin']],
          answer: 0,
          explain: 'Yes! Uranus is tipped right over, so it rolls around the Sun on its side.',
        },
        {
          q: 'Which spacecraft visited Uranus?',
          options: [['🛰️', 'Voyager 2'], ['🚗', 'A space car'], ['🎈', 'A balloon']],
          answer: 0,
          explain: 'Right! Voyager 2 flew past Uranus in 1986. It\'s the only spacecraft that has been there.',
        },
      ],
    },
    {
      id: 'neptune', name: 'Neptune', kind: 'Ice giant', mapR: 28, playable: true,
      color: '#4170e0',
      teaser: 'Neptune is the farthest planet. It has the fastest winds in the Solar System, faster than a jet plane!',
      facts: [
        'Neptune is the farthest planet from the Sun.',
        'It has the fastest winds in the Solar System, faster than a jet plane!',
        'One year on Neptune lasts 165 Earth years.',
      ],
      stats: [['🕐', 'Day', '16 hours'], ['🗓️', 'Year', '165 Earth years'], ['🌙', 'Moons', '16']],
      quiz: [
        {
          q: 'What is Neptune famous for?',
          options: [['💨', 'The fastest winds'], ['🌋', 'Lava oceans'], ['🌴', 'Palm trees']],
          answer: 0,
          explain: 'Yes! Neptune\'s winds are the fastest in the Solar System, faster than a jet plane.',
        },
        {
          q: 'How was Neptune first found?',
          options: [['🧮', 'Using math'], ['🐕', 'A dog sniffed it out'], ['📺', 'On TV']],
          answer: 0,
          explain: 'Right! In 1846, scientists used math to work out where Neptune was, and then they spotted it.',
        },
      ],
    },
    {
      // Bonus mission, reached from Earth.
      id: 'moon', name: 'The Moon', kind: 'Earth\'s moon', mapR: 5, playable: true, bonus: true,
      color: '#c9c9d4',
      facts: [
        'The Moon goes around Earth about once a month.',
        'The Moon has no light of its own. It shines with sunlight bouncing off it.',
        'In 1969, Neil Armstrong and Buzz Aldrin were the first people to walk on the Moon.',
      ],
      stats: [['🗓️', 'Trip around Earth', '27 days'], ['📏', 'Size', '¼ of Earth'], ['👣', 'Moonwalkers', '12 people']],
      quiz: [
        {
          q: 'Why does the Moon seem to change shape?',
          options: [['🌗', 'We see different parts of its sunny side'], ['🍪', 'Someone takes a bite'], ['☁️', 'Clouds cover it']],
          answer: 0,
          explain: 'Yes! Half of the Moon is always sunny. As it goes around Earth, we see more or less of that sunny half.',
        },
        {
          q: 'How long does the Moon take to go around Earth?',
          options: [['🗓️', 'About a month'], ['⏰', 'One hour'], ['📅', 'Ten years']],
          answer: 0,
          explain: 'Right! About a month. That\'s where the word "month" comes from: "moon-th"!',
        },
      ],
    },
    {
      // Bonus mission "Comet Ride" (comet.js), reached from the comet on the map after Saturn.
      id: 'comet', name: 'The Comet', kind: 'Icy space traveller', mapR: 0, playable: true, bonus: true,
      color: '#8fe3ff',
      facts: [
        'A comet is a giant dirty snowball made of ice, rock and dust.',
        'Near the Sun, some of its ice turns to gas and makes a long glowing tail.',
        'A comet\'s tail always points away from the Sun.',
      ],
      stats: [['🧊', 'Made of', 'Ice and dust'], ['📏', 'Tail', 'Millions of km'], ['🔁', 'Halley\'s Comet', 'Every 76 years']],
      quiz: [
        {
          q: 'Which way does a comet\'s tail point?',
          options: [['💨', 'Away from the Sun'], ['🔙', 'Always behind the comet'], ['🌍', 'Toward Earth']],
          answer: 0,
          explain: 'Yes! Sunlight and the Sun\'s wind push the tail, so it always points away from the Sun.',
        },
        {
          q: 'What makes a meteor shower?',
          options: [['🌠', 'Earth passes through comet dust'], ['🌧️', 'Rain clouds'], ['🎆', 'Fireworks in space']],
          answer: 0,
          explain: 'Right! Tiny bits of comet dust burn up high in our sky. We see them as shooting stars.',
        },
      ],
    },
    {
      // Bonus mission "Space Station Visit" (iss.js), reached from the station beside Earth after Saturn.
      id: 'iss', name: 'The Space Station', kind: 'Home in space', mapR: 0, playable: true, bonus: true,
      color: '#9fc4ff',
      facts: [
        'The International Space Station goes all the way around Earth every 90 minutes.',
        'Everything floats inside, so astronauts sleep in sleeping bags tied to the wall.',
        'People have lived on the space station all the time since the year 2000.',
      ],
      stats: [['🔁', 'Trip around Earth', '90 minutes'], ['📏', 'Height', 'About 400 km up'], ['🌅', 'Sunrises', '16 a day']],
      quiz: [
        {
          q: 'Why do astronauts sleep in sleeping bags tied to the wall?',
          options: [['🎈', 'So they don\'t float away'], ['❄️', 'Because it is snowy'], ['👽', 'To hide from aliens']],
          answer: 0,
          explain: 'Yes! Everything floats on the space station, so the sleeping bags are tied down.',
        },
        {
          q: 'How many sunrises do astronauts on the space station see in one day?',
          options: [['🌅', 'About 16'], ['☀️', 'Just 1'], ['🚫', 'None']],
          answer: 0,
          explain: 'Right! The station goes around Earth every 90 minutes, so it sees about 16 sunrises every day.',
        },
      ],
    },
    {
      // Secret: appears on the map after the Grand Tour.
      id: 'pluto', name: 'Pluto', kind: 'Dwarf planet', mapR: 9, playable: false, secret: true,
      color: '#d9b49a',
      teaser: 'You found Pluto! It used to be called the ninth planet. Now it\'s called a dwarf planet. Here\'s a secret card for you!',
      facts: [
        'Pluto used to be called the ninth planet. Since 2006, it has been called a dwarf planet.',
        'Pluto has a giant heart-shaped plain made of ice!',
        'Pluto is smaller than our Moon.',
      ],
      stats: [['🗓️', 'Year', '248 Earth years'], ['🌙', 'Moons', '5'], ['📏', 'Size', 'Smaller than our Moon']],
    },
    {
      // Deep-space finale "Galaxy Trip" (galaxy.js): opens once Pluto has been found, from the
      // little spiral galaxy at the top of the map.
      id: 'galaxy', name: 'The Milky Way', kind: 'Our galaxy', mapR: 0, playable: true, bonus: true,
      color: '#b9a8ff',
      facts: [
        'The Milky Way is our galaxy. It has hundreds of billions of stars!',
        'Our Sun takes about 230 million years to go once around the galaxy.',
        'A giant black hole sits in the middle. It is about 4 million times heavier than our Sun.',
      ],
      stats: [['✨', 'Stars', 'Hundreds of billions'], ['📏', 'Across', 'About 100,000 light-years'], ['🕳️', 'In the middle', 'A giant black hole']],
      quiz: [
        {
          q: 'What is the Milky Way?',
          options: [['🌌', 'Our galaxy, full of stars'], ['🍫', 'A chocolate bar in space'], ['🥛', 'A river of milk']],
          answer: 0,
          explain: 'Yes! The Milky Way is our galaxy: a giant spiral of hundreds of billions of stars. Our Sun is one of them!',
        },
        {
          q: 'Why is a black hole black?',
          options: [['🔦', 'Not even light can get out'], ['🎨', 'Someone painted it'], ['🌑', 'It is in a shadow']],
          answer: 0,
          explain: 'Right! A black hole\'s gravity is so strong that not even light can get back out.',
        },
      ],
    },
  ];

  SA.NICKNAMES = {
    sun: 'Our Star', mercury: 'The Speedy Planet', venus: 'The Hottest Planet', earth: 'Our Home Planet',
    mars: 'The Red Planet', jupiter: 'The Giant Planet', saturn: 'The Ringed Planet', uranus: 'The Sideways Planet',
    neptune: 'The Windy Planet',
  };
  // Cosmo's line during the warp flight to each playable planet.
  SA.FLIGHT_FACTS = {
    earth: 'Did you know? Earth is the third planet from the Sun. Not too hot, not too cold. Just right for life!',
    mars: 'Did you know? A real spaceship takes about 7 months to fly from Earth to Mars!',
    jupiter: 'Did you know? The Juno spacecraft took about 5 years to fly all the way to Jupiter!',
    saturn: 'Did you know? Saturn is so far away that sunlight takes more than an hour to get there!',
    venus: 'Did you know? Venus is the brightest planet in our night sky. People call it the Evening Star!',
    mercury: 'Did you know? Mercury is so close to the Sun that the Sun looks about 3 times bigger from there!',
    uranus: 'Did you know? Uranus is so far away that Voyager 2 took about 9 years to get there!',
    neptune: 'Did you know? Neptune is the farthest planet. Voyager 2 took 12 years to reach it!',
  };
  // Playable missions, in the order they unlock.
  SA.MISSIONS = ['earth', 'mars', 'jupiter', 'saturn', 'venus', 'mercury', 'uranus', 'neptune'];
  SA.MISSION_NAMES = {
    earth: '🌍 Day & Night Spinner', mars: '🚙 Rover Rock Hunt', jupiter: '📸 Moon Photo Tour', saturn: '🧊 Ring Hopper',
    venus: '📡 Radar Explorer', mercury: '🌅 Sunrise Escape', uranus: '🎯 Gravity Slingshot', neptune: '💨 Wind Rider',
    moon: '🌙 Moon Phases', belt: '🪨 Space Rock Sorter', sun: '✨ Star Story', comet: '☄️ Comet Ride',
    iss: '🛰️ Space Station Visit', europa: '🌊 Ice Ocean Dive', galaxy: '🌌 Galaxy Trip', titan: '🚁 Titan Drone Flight',
  };
  // Bonus missions and the planet that opens each one. Saturn opens two: the space station used
  // to wait until Neptune (the very end), and many kids never got that far.
  // Europa opens after Jupiter; the Galaxy Trip opens once Pluto is found (see SA.isUnlocked).
  SA.BONUS = { moon: 'earth', belt: 'mars', comet: 'saturn', sun: 'mercury', iss: 'saturn', europa: 'jupiter', galaxy: 'pluto', titan: 'saturn' };
  // Where to find each bonus mission on the map (said when it unlocks).
  SA.BONUS_WHERE = {
    moon: 'Tap the little Moon next to Earth. 🌙',
    belt: 'Tap the asteroid belt past Mars. 🪨',
    comet: 'Tap the comet under Uranus, near the bottom of the map. ☄️',
    sun: 'Tap the Sun to find it. ☀️',
    iss: 'Tap the little space station next to Earth. 🛰️',
    europa: 'Tap Jupiter, then tap Ice Ocean Dive. Or catch little Europa as it circles Jupiter! 🧊',
    galaxy: 'Tap the swirly galaxy at the top of the map. 🌌',
    titan: 'Tap Saturn, then tap Titan Drone Flight. Or catch little orange Titan as it circles Saturn! 🚁',
  };
  SA.BONUS_DONE = {
    moon: 'Bonus mission complete! You\'re a Moon expert now! 🌙',
    belt: 'Bonus mission complete! You\'re a space rock expert now! 🪨',
    comet: 'Bonus mission complete! You rode a comet all the way around the Sun! ☄️',
    sun: 'Bonus mission complete! Now you know the life story of a star! ✨',
    iss: 'Bonus mission complete! You lived just like a real astronaut! 🧑‍🚀',
    europa: 'Bonus mission complete! You explored an ocean under the ice! 🌊',
    galaxy: 'You flew all the way to the middle of our galaxy and back! You\'re a true galaxy explorer! 🌌',
    titan: 'Bonus mission complete! You flew a drone through Titan\'s orange sky! 🚁',
  };
  SA.FLIGHT_FACTS.titan = 'Did you know? A real drone called Dragonfly is being built to fly on Titan. It should get there in 2034!';
  SA.NICKNAMES.titan = 'The Orange Haze Moon';
  SA.FLIGHT_FACTS.europa = 'Did you know? Europa is a bit smaller than our Moon, but its hidden ocean may hold about twice as much water as all of Earth\'s oceans!';
  SA.NICKNAMES.europa = 'The Ice Ocean Moon';
  SA.FLIGHT_FACTS.galaxy = 'Did you know? Light is the fastest thing there is, and it still takes about 100,000 years to cross our galaxy!';
  SA.NICKNAMES.galaxy = 'Our Home Galaxy';
  SA.FLIGHT_FACTS.iss = 'Did you know? The space station zooms around Earth at about 28,000 kilometres per hour!';
  SA.NICKNAMES.iss = 'Our Home in Orbit';
  SA.FLIGHT_FACTS.comet = 'Did you know? Some comets take thousands of years to go once around the Sun!';
  SA.NICKNAMES.comet = 'The Dirty Snowball';
  SA.FLIGHT_FACTS.moon = 'Did you know? The Apollo astronauts took about 3 days to fly from Earth to the Moon!';
  SA.FLIGHT_FACTS.belt = 'Did you know? Some space rocks that landed on Earth came all the way from an asteroid called Vesta!';
  SA.FLIGHT_FACTS.sun = 'Did you know? Our Sun is about 4.6 billion years old! Never look straight at the real Sun. It can hurt your eyes! 😎';
  SA.NICKNAMES.moon = 'Our Nearest Neighbor';
  SA.NICKNAMES.belt = 'The Space Rock Ring';

  // ---------- Space critters ----------
  // One shy critter hides in every mission. It peeks in from the edge now and then; tap it to
  // find it, and it moves into Cosmo's Space Base. Look: body colour, eyes, and a special feature.
  SA.CRITTERS = [
    { id: 'earth', name: 'Pip', color: '#7ee08a', eyes: 2, feature: 'leaf', line: 'Pip loves sunshine, just like the plants on Earth! 🌱' },
    { id: 'mars', name: 'Rusty', color: '#e07a4f', eyes: 2, feature: 'ears', line: 'Rusty is a dust bunny from Mars. Achoo! Red dust everywhere!' },
    { id: 'belt', name: 'Pebble', color: '#a8927c', eyes: 2, feature: 'lumpy', line: 'Pebble is a tiny space rock with a great big smile! 🪨' },
    { id: 'jupiter', name: 'Swirl', color: '#e2b98a', eyes: 2, feature: 'spot', line: 'Swirl has a storm on its tummy, just like Jupiter\'s Great Red Spot!' },
    { id: 'saturn', name: 'Hula', color: '#f2d27a', eyes: 2, feature: 'ring', line: 'Hula wears a ring, just like Saturn! It loves to hula hoop.' },
    { id: 'venus', name: 'Toasty', color: '#f5c46a', eyes: 2, feature: 'fluff', line: 'Toasty is a cloud critter from Venus. It\'s always warm and toasty!' },
    { id: 'mercury', name: 'Zip', color: '#b9b4c8', eyes: 1, feature: 'horns', line: 'Zip is super speedy, just like Mercury racing around the Sun!' },
    { id: 'uranus', name: 'Tilt', color: '#7fe0e6', eyes: 2, feature: 'tilt', line: 'Tilt likes to lean over sideways, just like Uranus!' },
    { id: 'neptune', name: 'Gust', color: '#5b8cff', eyes: 3, feature: 'fins', line: 'Gust surfs on Neptune\'s super fast winds. Wheee!' },
    { id: 'moon', name: 'Moonbeam', color: '#d8d8e8', eyes: 2, feature: 'spots', line: 'Moonbeam naps all day and glows at night! 🌙' },
    { id: 'sun', name: 'Sparky', color: '#ffc93c', eyes: 2, feature: 'flame', line: 'Sparky is a little ray of sunshine! ☀️' },
    { id: 'comet', name: 'Frosty', color: '#bfefff', eyes: 2, feature: 'tail', line: 'Frosty is a snowball critter from a comet. Brrr! Its sparkly tail always points away from the Sun! ❄️' },
    { id: 'iss', name: 'Floaty', color: '#c9b8ff', eyes: 2, feature: 'helmet', line: 'Floaty grew up on the space station, so it floats everywhere, even at bedtime! 💤' },
    { id: 'europa', name: 'Glimmer', color: '#7fd6e8', eyes: 2, feature: 'lure', line: 'Glimmer is a pretend critter who loves deep, dark water. Its little light helps it find the way! 💡' },
    { id: 'galaxy', name: 'Nova', color: '#b79bff', eyes: 3, feature: 'stars', line: 'Nova has tiny stars twirling around its head, like a galaxy! It loves to spin. 🌌' },
    { id: 'titan', name: 'Drizzle', color: '#f2b25e', eyes: 2, feature: 'umbrella', line: 'Drizzle is a pretend critter who loves Titan\'s slow, drifty rain. It never forgets its umbrella! ☂️' },
  ];
  SA.CRITTER = {};
  for (const c of SA.CRITTERS) SA.CRITTER[c.id] = c;

  // ---------- Cosmo's Space Base stickers ----------
  // Planet stickers come from album cards, souvenirs from finished missions, and decorations
  // from total stars (never spent). kind: 'body' draws a planet, 'emoji' draws an emoji.
  SA.SOUVENIRS = {
    earth: ['🌻', 'Sunflower'], mars: ['🚙', 'Rover'], belt: ['💎', 'Space gem'], jupiter: ['📸', 'Camera'],
    saturn: ['🧊', 'Ring ice'], venus: ['📡', 'Radar dish'], mercury: ['🛰️', 'MESSENGER'], uranus: ['🔭', 'Telescope'],
    neptune: ['💨', 'Wind puff'], moon: ['🚩', 'Moon flag'], sun: ['🌟', 'Baby star'], comet: ['☄️', 'Comet'],
    iss: ['🌮', 'Space tortilla'], europa: ['🤿', 'Diving mask'], galaxy: ['🌌', 'Milky Way'], titan: ['🚁', 'Drone'],
  };
  SA.DECOR = [
    { e: '🪴', name: 'Space plant', need: 0 },
    { e: '🎈', name: 'Balloon', need: 0 },
    { e: '👽', name: 'Alien pal', need: 4 },
    { e: '🛸', name: 'Flying saucer', need: 10 },
    { e: '🌈', name: 'Rainbow', need: 16 },
    { e: '🏮', name: 'Lantern', need: 22 },
    { e: '🎪', name: 'Space tent', need: 30 },
    { e: '🦄', name: 'Space unicorn', need: 38 },
    { e: '👑', name: 'Crown', need: 46 },
    { e: '🏆', name: 'Grand Tour cup', need: 0, tour: true },
    // New items go at the end: saved stickers refer to these by position.
    { e: '🏅', name: 'Critter Club medal', need: 0, critters: true },
    // Night Sky: connecting a constellation's stars unlocks its picture as a sticker.
    { e: '🐻', name: 'Great Bear', need: 0, sky: 'dipper' },
    { e: '🏹', name: 'Orion the Hunter', need: 0, sky: 'orion' },
    { e: '👸', name: 'Queen Cassiopeia', need: 0, sky: 'cassiopeia' },
    { e: '🦢', name: 'Cygnus the Swan', need: 0, sky: 'cygnus' },
    { e: '🦁', name: 'Leo the Lion', need: 0, sky: 'leo' },
    { e: '🧭', name: 'Southern Cross', need: 0, sky: 'crux' },
    { e: '🦂', name: 'Scorpius', need: 0, sky: 'scorpius' },
    { e: '🧸', name: 'Little Bear', need: 0, sky: 'ursaminor' },
    // Rocket Workshop: a rocket the child built that flew all the way to the Moon.
    { e: '🚀', name: 'Moon rocket', need: 0, rocket: true },
    { e: '🐂', name: 'Taurus the Bull', need: 0, sky: 'taurus' },
    { e: '🐴', name: 'Pegasus', need: 0, sky: 'pegasus' },
    // The greenhouse at the Space Base: each plant grown to full bloom becomes a sticker.
    { e: '🥬', name: 'Space lettuce', need: 0, garden: 'lettuce' },
    { e: '🌼', name: 'Zinnia', need: 0, garden: 'zinnia' },
    { e: '🍅', name: 'Space tomato', need: 0, garden: 'tomato' },
    { e: '🍄', name: 'Glow-shroom', need: 0, garden: 'shroom' },
    { e: '🌷', name: 'Twinkle tulip', need: 0, garden: 'tulip' },
    { e: '⛵', name: 'Carina the Keel', need: 0, sky: 'carina' },
    // Postcards from Cosmo's family (story.js): the first one, and the family's visit.
    { e: '💌', name: 'Space postcard', need: 0, story: 1 },
    { e: '🏡', name: 'Planet Zoop', need: 0, story: 5 },
    // Expert missions, the Planet Song, the Mars Base builder and the quiz show's silly prizes.
    // check() says whether it is unlocked; hint is said when a locked one is tapped.
    { e: '🎓', name: 'Expert medal', need: 0, check: () => SA.expertCount() >= 8, hint: 'Earn all 8 Expert badges to unlock this! Tap a planet you explored, then 🎓 Expert.' },
    { e: '🎤', name: 'Planet Song mic', need: 0, check: () => !!SA.state.songDone, hint: 'Sing the whole Planet Song with me to unlock this! Tap 🎤 on the map. 🎵' },
    { e: '👩‍🚀', name: 'Mars astronaut', need: 0, check: () => !!SA.state.marsBase.done, hint: 'Build a Mars Base for the astronauts to unlock this! Tap Mars on the map. 🏗️' },
  ];
  // Mission Control (the quiz show): every show ends with a silly prize, which becomes a sticker.
  SA.PRIZES = [
    { id: 'duck', e: '🦆', name: 'Space duck', line: 'a rubber duck in a teeny tiny spacesuit! Quack quack! 🦆' },
    { id: 'cheese', e: '🧀', name: 'Moon cheese', line: 'a slice of Moon cheese! Shh... the real Moon is made of rock, not cheese! 🧀' },
    { id: 'socks', e: '🧦', name: 'Rocket socks', line: 'a pair of rocket socks for super speedy toes! Zoom zoom! 🧦' },
    { id: 'donut', e: '🍩', name: 'Saturn donut', line: 'a Saturn donut with a ring of sprinkles! 🍩' },
    { id: 'trumpet', e: '🎺', name: 'Space trumpet', line: 'a space trumpet! But in space nobody could hear it, because there\'s no air to carry the sound! 🎺' },
    { id: 'yoyo', e: '🪀', name: 'Gravity yo-yo', line: 'a gravity yo-yo! What goes down must come back up! 🪀' },
    { id: 'pizza', e: '🍕', name: 'Planet pizza', line: 'a pizza as big as a planet! Well... a very, very small planet. 🍕' },
    { id: 'cup', e: '🏆', name: 'Golden buzzer', line: 'the Golden Buzzer trophy, for the best space explorer on the show! 🏆' },
  ];
  for (const p of SA.PRIZES) {
    SA.DECOR.push({ e: p.e, name: p.name, need: 0, check: () => !!SA.state.prizes[p.id], hint: 'Win this silly prize on Mission Control, my quiz show! Tap 🎤 on the map. 📺' });
  }
  // The Moon Song, family quiz shows and Cosmo's Space Camp (camp patches come from days of camp,
  // never a streak). Pushed after the prizes, so every saved sticker keeps its position.
  SA.DECOR.push(
    { e: '🌙', name: 'Moon Song moon', need: 0, check: () => !!SA.state.moonSongDone, hint: 'Sing the whole Moon Song with me to unlock this! Tap 🎤 on the map. 🌙' },
    { e: '👨‍👩‍👧', name: 'Family show', need: 0, check: () => SA.state.familyShows > 0, hint: 'Play a family quiz show on Mission Control, with two teams! Tap 🎤 on the map. 📺' },
    { e: '🏕️', name: 'Space Camp patch', need: 0, check: () => SA.state.camp.days >= 1, hint: 'Finish a day of Cosmo\'s Space Camp to unlock this! Tap 🎤 on the map. 🏕️' },
    { e: '🏋️', name: 'Strong astronaut', need: 0, check: () => SA.state.camp.days >= 3, hint: 'Go to Space Camp on 3 different days to unlock this! 🏕️' },
    { e: '🎖️', name: 'Camp star', need: 0, check: () => SA.state.camp.days >= 7, hint: 'Go to Space Camp on 7 different days to unlock this! 🏕️' },
  );

  // ---------- Mars Base builder (marsbase.js, from Mars's card once Mars is explored) ----------
  // Each part answers one thing astronauts need. need: the checklist light it switches on.
  SA.MARS_PARTS = [
    { id: 'hab', name: 'Habitat', need: 'home',
      fact: 'The habitat is the astronauts\' home. Mars air is very thin, and nobody can breathe it, so they live inside a sealed home full of good air. 🏠' },
    { id: 'solar', name: 'Solar panels', need: 'power',
      fact: 'Solar panels turn sunlight into electricity. Mars is farther from the Sun than Earth, so its sunshine is weaker, and a base needs lots of panels! ⚡' },
    { id: 'green', name: 'Greenhouse', need: 'food',
      fact: 'A greenhouse dome lets astronauts grow fresh food, like lettuce and potatoes. And plants breathe out oxygen too! 🥬' },
    { id: 'drill', name: 'Ice drill', need: 'water',
      fact: 'Mars has ice hiding under the ground. Dig it up and melt it, and you get water to drink! 💧' },
    { id: 'oxy', name: 'Oxygen maker', need: 'air',
      fact: 'Mars air is mostly carbon dioxide. A machine called MOXIE, on the Perseverance rover, showed we can turn it into oxygen to breathe! 🫧' },
    { id: 'dish', name: 'Radio dish', need: 'radio',
      fact: 'A radio dish sends messages to Earth. They take between about 3 and 22 minutes to get there, so you can\'t chat quickly! 📡' },
    { id: 'rover', name: 'Rover garage', need: null,
      fact: 'A rover with air inside would let astronauts drive far away to explore, without wearing their spacesuits inside. 🚙' },
    { id: 'shield', name: 'Soil shelter', need: null,
      fact: 'Mars has no thick air or magnetic bubble to block harmful rays from space. Covering a shelter with Mars soil helps keep astronauts safe! 🛡️' },
    // Added later (saved bases keep working: parts are saved by id).
    { id: 'lab', name: 'Science lab', need: null,
      fact: 'In the science lab, astronauts look at Mars rocks under a microscope. Long ago Mars had rivers and lakes, so scientists hunt for clues that tiny living things were ever there. 🔬' },
    { id: 'pad', name: 'Launch pad', need: null,
      fact: 'A launch pad sends rockets home! Mars has less gravity than Earth, so leaving it takes less push. The trip back to Earth takes about 6 to 9 months. 🚀' },
  ];

  // ---------- Cosmo's emotes (the 💃 button at the Space Base) ----------
  // [button emoji, label, what Cosmo says, animation]
  SA.EMOTES = [
    ['👋', 'Wave', 'Hi there, friend! 👋', 'wave'],
    ['💃', 'Dance', 'Dance party! 🎶', 'dance'],
    ['🤸', 'Flip', 'Watch this... a space flip! 🤸', 'flip'],
    ['🎵', 'Sing', 'La la la... twinkle twinkle, little star! 🎵', 'sing'],
    ['😴', 'Nap', 'Time for a teeny tiny nap... Zzz. 😴', 'nap'],
    ['🎉', 'Party', 'Critter party! Everybody dance! 🎉', 'party'],
  ];

  // ---------- Cosmo's personality ----------
  // Musings when the map has been quiet for a while (never more than one at a time).
  SA.COSMO_IDLE = [
    'I wonder if Saturn\'s rings are crunchy... 🤔',
    'Do you think there are aliens on other planets? I\'m one, so... yes! 👽',
    'My antenna is tingling. I think a comet is coming! ☄️',
    'If I lived on Jupiter, my birthday would come only once every 12 years! 🎂',
    'I miss my critter friends. Want to visit my space base? Tap the 🏠 button!',
    'Space is SO big. Let\'s go explore some more! 🚀',
    'Hmm, which planet should we visit next? 🪐',
    'Did you know a day on Mercury is longer than its year? Weird! 🤯',
    'Psst... shy space critters hide in every mission. Have you spotted any? 🐾',
    'I\'m getting hungry. Do you think the Milky Way tastes like chocolate? 🍫',
    'My telescope is at my Space Base. Want to look at the night sky together? 🔭',
    'Psst... swipe a planet sideways to give it a spin! 🌀',
    'Want to build a rocket? Visit my Space Base and tap the 🔧 button!',
    'Tap the 🪐 button to play with planets and make your own orbits!',
    'Have you watered the plants in my greenhouse today? 🌱 They grow a little more every day!',
    'Brrr! I wonder how cold the ocean under Europa\'s ice is... 🧊',
    'Want to draw what we discovered? Tap 📔 to open our Space Journal!',
    'I wonder what my little sister Dot is doing back home on Planet Zoop... 💌',
  ];

  // ---------- For grown-ups: "What your child learned" (behind the parental gate) ----------
  // What each mission teaches, in one line, and a real-world thing to try together afterwards.
  SA.LEARNED = {
    earth: ['Earth\'s spin makes day and night.', 'In a dark room, shine a torch on a ball and turn it slowly. Where is it day? Where is it night?'],
    mars: ['Mars is red because of rusty dust, and its weak gravity lets you jump higher.', 'Look for Mars in the night sky: it looks like a small orange-red "star" that hardly twinkles.'],
    jupiter: ['Jupiter is the biggest planet, with a giant storm and many moons.', 'With ordinary binoculars held very still, Jupiter\'s four biggest moons can show up as tiny dots beside it.'],
    saturn: ['Saturn\'s rings are chunks of ice and rock, and the inner rings move fastest.', 'Saturn\'s rings can be seen through even a small telescope. Many astronomy clubs hold free public viewing nights.'],
    venus: ['Venus is the hottest planet because its thick clouds trap heat. Radar sees through them.', 'Look for Venus near sunset or sunrise. It is the brightest "star" in the sky, often called the Evening Star.'],
    mercury: ['Mercury has almost no air, so its days are scorching and its nights freezing.', 'Talk about why a blanket keeps you warm at night, just like air keeps a planet warm.'],
    uranus: ['Uranus spins on its side, and gravity can bend a spacecraft\'s path (a slingshot).', 'Put a lamp in the middle of the room and carry a ball around it, tipped right over on its side. That\'s how Uranus travels!'],
    neptune: ['Neptune is the farthest planet, with the fastest winds. It was found using maths.', 'Imagine a scale model: if the Sun were a football, Neptune would be a pea about 700 metres away!'],
    moon: ['The Moon\'s shape changes because we see different parts of its sunny half.', 'Keep a Moon diary: draw the Moon\'s shape every clear evening for a month.'],
    belt: ['The asteroid belt is a ring of space rocks between Mars and Jupiter, mostly far apart.', 'Sort pebbles from a walk into dark, light and shiny piles, like the Space Rock Sorter.'],
    comet: ['Comets are dirty snowballs. Their tails always point away from the Sun, and their dust makes meteor showers.', 'Watch a meteor shower together: the Perseids (around 12 August) and Geminids (around 14 December) are the best of the year.'],
    sun: ['Stars are born in clouds of gas, and our Sun will one day become a red giant, then a white dwarf.', 'Never look straight at the Sun. Instead, make a pinhole in a card and let the sunlight shine a tiny picture of the Sun onto paper.'],
    iss: ['On the space station everything floats, astronauts sleep in bags tied to the wall, and they see about 16 sunrises a day.', 'The space station can often be seen from your garden: look online together for "spot the station" times where you live, then watch for a bright, steady dot gliding across the sky.'],
    europa: ['Jupiter\'s moon Europa has an ice shell, and scientists think a salty ocean lies underneath, kept liquid by Jupiter squeezing it.', 'Float an ice cube in a glass of salty water and talk about how Europa\'s ice shell floats on its ocean. Nobody knows yet if anything lives there: what do you think?'],
    galaxy: ['Our Sun is one star in the Milky Way, a spiral galaxy with a giant black hole in the middle. Black holes are black because not even light escapes.', 'On a very dark night away from town lights, look for the Milky Way as a faint, milky band across the sky. Binoculars show it is made of countless stars.'],
    titan: ['Saturn\'s moon Titan has thick orange air, weak gravity, and rain, rivers and lakes of liquid methane. The Huygens probe landed there in 2005, and the Dragonfly drone is on its way next.', 'Drop a feather and a coin together, then talk about why the feather drifts: air pushes back. On Titan the air is so thick, and gravity so weak, that things fall slowly, even raindrops.'],
  };
  SA.STARGAZING_TIPS = [
    'Go somewhere away from street lights, and give your eyes about 20 minutes to get used to the dark.',
    'Cover a torch with red paper or cellophane. Red light keeps your night vision working.',
    'Planets shine with a steadier light than stars, which twinkle more.',
    'The International Space Station looks like a bright, steady dot sliding across the sky in a few minutes, with no blinking lights.',
    'Lie back on a blanket. You don\'t need a telescope: binoculars or just your eyes show a lot!',
  ];
  // When the parked rocket is tapped.
  SA.COSMO_ROCKET = [
    'That\'s my rocket! Isn\'t she shiny? ✨',
    'Beep beep! Rocket ready! Tap a planet and let\'s go! 🚀',
    'Ten, nine, eight... just kidding! Pick a planet first! 😄',
    'I keep my snacks in the rocket. Space cookies! 🍪',
    'Vroom vroom! Oh wait, rockets go WHOOSH! 🚀',
  ];
  // Cosmo's reactions when tapped at the Space Base: [line, animation].
  SA.COSMO_TICKLE = [
    ['Hee hee hee! That tickles! 😆', 'hop'],
    ['Wheeee! Watch me spin! 🌀', 'spin'],
    ['Ah... ah... ACHOO! ✨ Oops, I sneezed stardust!', 'sneeze'],
    ['Dance party! 🎶', 'dance'],
    ['*Yawn* Exploring space makes me sleepy. 😴', 'yawn'],
    ['Did you know I have one antenna and zero noses? 👽', 'wow'],
    ['High five! ✋ You\'re the best space explorer!', 'hop'],
    ['Boing boing boing! 🦘', 'bounce'],
  ];

  // One fact a day, shown when the map opens (no streaks, no pressure).
  SA.DAILY_FACTS = [
    'A day on Venus is longer than a whole year on Venus!',
    'The Sun is so big that about 1.3 million Earths could fit inside it.',
    'Footprints on the Moon could last for millions of years, because there is no wind to blow them away.',
    'Saturn is so light that it would float in a giant bathtub of water.',
    'Jupiter has the shortest day of any planet: only about 10 hours!',
    'Light from the Sun takes about 8 minutes to reach Earth.',
    'Mars has the biggest volcano in the Solar System, Olympus Mons.',
    'Astronauts on the space station see about 16 sunrises every day!',
    'In space, astronauts grow a little taller, because their backs stretch out without gravity.',
    'Neptune\'s winds can blow faster than 2,000 kilometres per hour!',
    'The Moon is slowly drifting away from Earth, about 4 centimetres every year.',
    'Uranus spins on its side, like a ball rolling around the Sun.',
    'A spoonful of a neutron star would weigh about as much as a mountain!',
    'Our Sun is about halfway through its life. It will keep shining for billions of years.',
    'Some stars are so far away that their light takes thousands of years to reach us.',
    'A comet\'s tail always points away from the Sun.',
    'Our galaxy is called the Milky Way, and it has hundreds of billions of stars.',
    'In 1960, two dogs named Belka and Strelka flew around Earth in a spaceship and came home safely!',
    'Venus is the hottest planet, even though Mercury is closer to the Sun.',
    'Mercury and Venus are the only planets with no moons.',
    'The International Space Station goes all the way around Earth in about 90 minutes!',
    'Saturn\'s moon Titan has lakes, but they are full of liquid methane, not water.',
    'Mars has a canyon called Valles Marineris that is much longer than the Grand Canyon!',
    'Pluto is smaller than our Moon.',
    'A year on Neptune lasts 165 Earth years!',
    'The hottest stars glow blue, and cooler stars glow red.',
    'Earth is the only planet in our Solar System not named after a god or goddess.',
    'Jupiter has a storm called the Great Red Spot that is bigger than Earth.',
    'There is no sound in space, because there is no air to carry it.',
    'Astronauts sleep in sleeping bags tied to the wall so they don\'t float away!',
    'The asteroid Ida has its own tiny moon, called Dactyl!',
    'Most asteroids are dark, sooty rocks full of carbon.',
    'When a star like our Sun gets old, it puffs out a glowing cloud of gas into space.',
    'Some stars are so big that our Sun would look like a tiny dot next to them!',
    'The gas from old stars can make new stars and planets one day.',
    'Halley\'s Comet comes back about every 76 years. Its next visit is in 2061!',
    'There are 88 official constellations. The smallest one is the Southern Cross.',
    'Shooting stars are tiny bits of space dust burning up high in our sky.',
    'Jupiter\'s moon Europa has a shell of ice, and scientists think a salty ocean hides underneath!',
    'Astronauts on the space station have grown lettuce, flowers and even little tomatoes!',
    'The Pleiades, in Taurus, are a sparkly bunch of stars. Most people can see about six or seven of them.',
    'The Andromeda Galaxy is so far away that its light takes about 2.5 million years to reach us.',
    'Saturn\'s moon Titan is bigger than the planet Mercury!',
    'In 2005, the Huygens probe landed on Titan. It is the farthest landing any spacecraft has ever made.',
    'Canopus is the second brightest star in the night sky. Only Sirius is brighter.',
  ];

  // Cosmo's Wardrobe: unlocked by total stars (stars are never spent).
  SA.HATS = [
    { id: 'none', name: 'No hat', need: 0 },
    { id: 'party', name: 'Party hat', need: 0 },
    { id: 'helmet', name: 'Space helmet', need: 3 },
    { id: 'cap', name: 'Propeller cap', need: 8 },
    { id: 'crown', name: 'Star crown', need: 14 },
    { id: 'wizard', name: 'Wizard hat', need: 20 },
    { id: 'halo', name: 'Saturn ring', need: 27 },
    { id: 'trophy', name: 'Explorer hat', need: 0, tour: true },
    // Knitted by Cosmo's grandma, delivered when the family visits (the last space postcard).
    { id: 'beanie', name: 'Grandma\'s hat', need: 0, story: 5 },
    // A golden graduation cap for earning all 8 Expert badges (expert.js).
    { id: 'grad', name: 'Expert cap', need: 0, expert: 8 },
  ];
  SA.PAINTS = [
    { id: 'classic', name: 'Classic', need: 0, body: '#ffffff', trim: '#ff5d6c', band: '#ffd84d' },
    { id: 'ocean', name: 'Ocean', need: 5, body: '#eef7ff', trim: '#2f7fd6', band: '#7fe0ff' },
    { id: 'sunny', name: 'Sunny', need: 11, body: '#fff8dc', trim: '#ff9f1c', band: '#ff5d6c' },
    { id: 'galaxy', name: 'Galaxy', need: 17, body: '#f0ebff', trim: '#6f5bd6', band: '#ff6bd6' },
    { id: 'mint', name: 'Cosmo Mint', need: 24, body: '#eafff6', trim: '#2fbf8f', band: '#ffd84d' },
    { id: 'rainbow', name: 'Rainbow', need: 32, body: '#ffffff', trim: '#8f5bff', band: 'rainbow' },
    { id: 'nebula', name: 'Nebula', need: 42, body: '#f6ecff', trim: '#c2409a', band: '#5fc8ff' },
    { id: 'comet', name: 'Comet', need: 50, body: '#eef9ff', trim: '#1f9bb8', band: '#bff4ff' },
    { id: 'gold', name: 'Golden', need: 0, tour: true, body: '#fff3c4', trim: '#d4a017', band: '#fff8dc' },
    { id: 'ocean2', name: 'Ice Ocean', need: 58, body: '#effcff', trim: '#1f7fa8', band: '#e9dcc4' },
    { id: 'deep', name: 'Deep Space', need: 66, body: '#e9e4ff', trim: '#2b2370', band: '#ffb340' },
    { id: 'haze', name: 'Titan Haze', need: 74, body: '#fff3e2', trim: '#c8641e', band: '#ffc46b' },
  ];

  // Cosmo's space jokes: [setup, punchline].
  SA.JOKES = [
    ['Why did the cow go to space?', 'To see the mooooon! 🐮'],
    ['How do you throw a party in space?', 'You planet! 🎉'],
    ['What is an astronaut\'s favorite key on a keyboard?', 'The space bar! ⌨️'],
    ['Why did the Sun go to school?', 'To get brighter! ☀️'],
    ['What did Saturn say to Jupiter?', 'Give me a ring sometime! 💍'],
    ['What do you call a tick on the Moon?', 'A luna-tick! 🌙'],
    ['Where do astronauts park their spaceships?', 'At a parking meteor! 🚀'],
    ['What kind of music do planets like?', 'Nep-tunes! 🎵'],
    ['How do astronauts eat ice cream?', 'In floats! 🍦'],
    ['What holds up the Sun in the sky?', 'Sunbeams! 🌞'],
    ['How does the Moon get a haircut?', 'Eclipse it! ✂️'],
    ['What is an alien\'s favorite treat?', 'Martian-mallows! 👽'],
  ];
  // Extra things to tap on the map.
  SA.EXTRA_FACTS = {
    belt: 'That\'s the asteroid belt! It\'s a ring of space rocks between Mars and Jupiter. The biggest one, Ceres, is a dwarf planet!',
    comet: 'A comet! Comets are like giant dirty snowballs. When they get close to the Sun, they grow a long glowing tail!',
    moon: 'That\'s our Moon! It goes around Earth about once a month. It has no light of its own. It shines because sunlight bounces off it.',
    iss: 'That\'s the International Space Station! Astronauts live and work there, high above Earth. 🛰️',
    titan: 'That\'s Titan, Saturn\'s biggest moon! It\'s wrapped in thick orange haze.',
  };

  SA.BODY = {};
  for (const b of SA.BODIES) SA.BODY[b.id] = b;
  SA.PLANET_IDS = SA.BODIES.filter(b => b.id !== 'sun' && !b.secret && !b.bonus).map(b => b.id);
})(window.SA);
