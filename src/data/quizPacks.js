const quizPacks = [
  {
    id: 'silly-scenarios',
    title: 'Silly Scenarios',
    emoji: '🤪',
    description: 'Absurd hypotheticals that reveal how your brain really works',
    color: '#ff6b9d',
    questions: [
      {
        id: 'ss1',
        text: "If your life was a video game, what genre would it be?",
        options: ['RPG — side quests everywhere', 'Simulation — managing chaos daily', 'Platformer — jumping from thing to thing', 'Horror survival — just trying to make it'],
      },
      {
        id: 'ss2',
        text: "Zombie apocalypse: what are you hoarding?",
        options: ['Snacks — going out well-fed', 'Weapons — full doomsday prep', 'Books — rebuild civilization', 'Skincare — undead but glowing'],
      },
      {
        id: 'ss3',
        text: "If you two were an animal duo, what would you be?",
        options: ['Two cats ignoring each other lovingly', 'Golden retriever + grumpy cat', 'Two otters holding hands', 'Wolf pack — ride or die'],
      },
      {
        id: 'ss4',
        text: "You win a free vacation but must travel in style. You pick:",
        options: ['Road trip with zero plans', 'First class everything, fully planned', 'Backpacking with one carry-on', 'Cruise ship — floating buffet life'],
      },
      {
        id: 'ss5',
        text: "If you had to teach a college course, what would it be?",
        options: ['Napping 101: An Advanced Study', 'The Art of Overthinking', 'Snack Pairing for Every Mood', 'How to Look Busy While Doing Nothing'],
      },
    ],
  },
  {
    id: 'deep-cuts',
    title: 'Deep Cuts',
    emoji: '💎',
    description: 'The questions that actually matter',
    color: '#7c5cbf',
    questions: [
      {
        id: 'dc1',
        text: "What's your primary love language?",
        options: ['Words of Affirmation', 'Quality Time', 'Physical Touch', 'Acts of Service', 'Receiving Gifts'],
      },
      {
        id: 'dc2',
        text: "Where do you see us in 5 years?",
        options: ['Traveling the world together', 'Cozy home with a routine we love', 'Building something together (business, project)', 'Honestly just vibing — no pressure'],
      },
      {
        id: 'dc3',
        text: "When you're stressed, what do you need most?",
        options: ['Space — let me decompress alone', 'Talk it out — I need to vent', 'Distraction — make me laugh or take me out', 'Physical comfort — just hold me'],
      },
      {
        id: 'dc4',
        text: "What makes you feel most appreciated?",
        options: ['Being told specifically what I did well', 'Someone noticing without me having to ask', 'Surprise gestures — big or small', 'Just being chosen and prioritized'],
      },
      {
        id: 'dc5',
        text: "What's the hardest thing about being in a relationship?",
        options: ['Vulnerability — letting someone really see me', 'Compromise — balancing two lives', 'Communication — saying what I actually mean', 'Trust — letting go of control'],
      },
    ],
  },
  {
    id: 'would-you-rather',
    title: 'Would You Rather',
    emoji: '⚡',
    description: 'Impossible choices, no right answers',
    color: '#f39c12',
    questions: [
      {
        id: 'wyr1',
        text: "Would you rather have telepathy or teleportation?",
        options: ['Telepathy — know what everyone thinks', 'Teleportation — anywhere instantly'],
      },
      {
        id: 'wyr2',
        text: "Would you rather cook together every night or eat out every night?",
        options: ['Cook together — it\'s our thing', 'Eat out — we deserve to be served'],
      },
      {
        id: 'wyr3',
        text: "Would you rather never argue again or never have to do dishes again?",
        options: ['Never argue — peace is priceless', 'Never do dishes — let\'s be real'],
      },
      {
        id: 'wyr4',
        text: "Would you rather relive your first date forever or fast-forward to retirement together?",
        options: ['Relive first date — butterflies forever', 'Fast-forward — rocking chairs and chill'],
      },
      {
        id: 'wyr5',
        text: "Would you rather always know what your partner is thinking or always know what they're feeling?",
        options: ['Thinking — give me the facts', 'Feeling — emotions tell the real story'],
      },
    ],
  },
  {
    id: 'taste-test',
    title: 'Taste Test',
    emoji: '🎯',
    description: 'Do your preferences actually match?',
    color: '#2ecc71',
    questions: [
      {
        id: 'tt1',
        text: "Ideal lazy Sunday?",
        options: ['Couch + movies all day', 'Brunch and a walk outside', 'Sleep in, then separate hobbies', 'Spontaneous adventure — no plans'],
      },
      {
        id: 'tt2',
        text: "Dream vacation vibe?",
        options: ['Beach resort — do nothing', 'City exploration — see everything', 'Mountain cabin — off the grid', 'Cultural immersion — eat local, learn local'],
      },
      {
        id: 'tt3',
        text: "Go-to movie genre for date night?",
        options: ['Comedy — we need to laugh', 'Thriller — edge of our seats', 'Romance — yes, we\'re that couple', 'Documentary — learn something wild'],
      },
      {
        id: 'tt4',
        text: "What's the ideal date night?",
        options: ['Home-cooked dinner + candles', 'Trying a new restaurant', 'Game night or puzzle', 'A concert, show, or event'],
      },
      {
        id: 'tt5',
        text: "How do you like to wind down before bed?",
        options: ['Scrolling our phones in silence (honestly)', 'Talking about our day', 'Reading or journaling', 'Watching a show together'],
      },
    ],
  },
  {
    id: 'chaos-round',
    title: 'Chaos Round',
    emoji: '🔥',
    description: 'Unhinged questions only',
    color: '#e74c3c',
    questions: [
      {
        id: 'cr1',
        text: "If you swapped bodies for a day, what's the first thing you'd do?",
        options: ['Look in the mirror and judge', 'Text my friends from their phone', 'See what snacks they secretly eat', 'Take a nap in their body — research purposes'],
      },
      {
        id: 'cr2',
        text: "If we were a crime duo, what's our specialty?",
        options: ['Art heist — we have taste', 'Con artists — charm is our weapon', 'Hackers — brains over brawn', 'Snack thieves — raiding every pantry'],
      },
      {
        id: 'cr3',
        text: "If there was a documentary about us, what would it be called?",
        options: ['\"How Did This Even Work?\"', '\"Chaotic But Make It Cute\"', '\"Two Against the World\"', '\"The Snack That Smiles Back\"'],
      },
      {
        id: 'cr4',
        text: "Which reality show would we survive the longest on?",
        options: ['The Amazing Race — we work well under pressure', 'Love Island — we\'d be the power couple', 'Survivor — we\'d scheme together', 'Bake Off — low stakes, high sugar'],
      },
      {
        id: 'cr5',
        text: "If our relationship had a theme song, what genre would it be?",
        options: ['R&B slow jam — smooth and soulful', 'Pop banger — catchy and fun', 'Indie folk — quirky and heartfelt', 'Heavy metal — intense and passionate'],
      },
    ],
  },
]

export default quizPacks
