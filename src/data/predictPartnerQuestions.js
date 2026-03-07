const predictPartnerSeries = [
  {
    id: 'series-1',
    title: 'Do You Even Know Me?',
    emoji: '🤔',
    subtitle: 'the warm-up',
    packs: [
      {
        id: 'predict-pack-1',
        title: 'The Basics',
        vibe: 'easy start',
        questions: [
          'What emoji do you use the most?',
          "What's the one food you could eat every single day and never get tired of?",
          "What's your go-to karaoke song even if you'd never actually do karaoke?",
        ],
      },
      {
        id: 'predict-pack-2',
        title: 'Your Vibe',
        vibe: 'personality check',
        questions: [
          "What's the one topic that will get you ranting for a solid 20 minutes?",
          'What would your friends say is the most "you" thing about you?',
          "What are you most likely to send a random text about at 2am?",
        ],
      },
      {
        id: 'predict-pack-3',
        title: 'Lowkey Revealing',
        vibe: 'slightly spicy',
        questions: [
          "What are you most likely doing if you don't text back for 3 hours?",
          "What's your most controversial food opinion?",
          'If you could only watch one movie for the rest of your life what is it?',
        ],
      },
      {
        id: 'predict-pack-4',
        title: 'The Fun Stuff',
        vibe: 'random & fun',
        questions: [
          'What would you grab first if your house was on fire (besides people and pets)?',
          "What's something you always say that you don't realize you say?",
          "What do you think about when you're bored at work?",
        ],
      },
    ],
  },
  {
    id: 'series-2',
    title: 'Read My Mind',
    emoji: '🧠',
    subtitle: 'getting warmer',
    packs: [
      {
        id: 'predict-pack-5',
        title: 'How I Tick',
        vibe: 'self-aware',
        questions: [
          "What's the fastest way to make you laugh no matter what mood you're in?",
          "What's your toxic trait that you're fully aware of but haven't fixed?",
          "What's the most random thing you've ever impulse bought?",
        ],
      },
      {
        id: 'predict-pack-6',
        title: 'The Real Ones',
        vibe: 'a little honest',
        questions: [
          "What compliment have you gotten that you still think about?",
          "What's the dumbest thing you've ever argued about with someone?",
          'What are you always lying about when people ask? (like "I\'m fine" or "I\'m 5 minutes away")',
        ],
      },
      {
        id: 'predict-pack-7',
        title: 'Patterns',
        vibe: 'habits & tells',
        questions: [
          "What's the one thing guaranteed to put you in a good mood?",
          "What do you always end up talking about when you're with your friends?",
          "What's your most irrational fear that you know makes no sense?",
        ],
      },
      {
        id: 'predict-pack-8',
        title: 'Guilty Pleasures',
        vibe: 'no shame zone',
        questions: [
          "What's the most embarrassing thing on your playlist that you listen to unironically?",
          'What reality TV show would you secretly love to be on?',
          "What's your comfort movie that you watch when everything feels heavy?",
        ],
      },
    ],
  },
  {
    id: 'series-3',
    title: 'Us',
    emoji: '💛',
    subtitle: 'about the relationship',
    packs: [
      {
        id: 'predict-pack-9',
        title: 'How We Started',
        vibe: 'the origin story',
        questions: [
          "What's something about me that surprised you when we first started talking?",
          "What's the first thing you noticed about me that wasn't physical?",
          "What's something I do that's adorable but I definitely don't realize it?",
        ],
      },
      {
        id: 'predict-pack-10',
        title: 'Our Dynamic',
        vibe: 'us energy',
        questions: [
          "Between us, who's more likely to cry during a movie?",
          "What's my worst take that I fully believe is correct?",
          "What's something I've gotten you into that you never expected to like?",
        ],
      },
      {
        id: 'predict-pack-11',
        title: 'If You Know You Know',
        vibe: 'prove it',
        questions: [
          "What do I always complain about but will never actually change?",
          "What's the thing I'm most likely to say on FaceTime?",
          'What would I say is the best date we\'ve had so far?',
        ],
      },
      {
        id: 'predict-pack-12',
        title: 'Our Future But Make It Fun',
        vibe: 'dreaming together',
        questions: [
          'What matching old couple thing are we absolutely going to do?',
          'What reality show would we dominate as a team?',
          'What would you name our pet? (and what kind of animal)',
        ],
      },
    ],
  },
  {
    id: 'series-4',
    title: 'Absolutely Unhinged',
    emoji: '🤪',
    subtitle: 'no serious answers allowed',
    packs: [
      {
        id: 'predict-pack-13',
        title: 'Fight Me',
        vibe: 'chaotic energy',
        questions: [
          'What celebrity do you honestly think you could beat in a fight?',
          'What hill will you die on that literally no one agrees with you about?',
          'If you could only eat one condiment for the rest of your life, what is it?',
        ],
      },
      {
        id: 'predict-pack-14',
        title: 'Expose Yourself',
        vibe: 'mildly embarrassing',
        questions: [
          "What's something you've googled that would be hard to explain to anyone?",
          "What's the dumbest reason you've ever cried?",
          "What's a word you always pronounce wrong or spell wrong and refuse to fix?",
        ],
      },
      {
        id: 'predict-pack-15',
        title: 'Chaos Scenarios',
        vibe: 'pure nonsense',
        questions: [
          'If you were a wrestler, what would your entrance song and name be?',
          "You're on death row — what's the last meal? Be specific.",
          'If you had to be haunted by one person living or dead, who would be the funniest ghost?',
        ],
      },
      {
        id: 'predict-pack-16',
        title: 'Unhinged Us',
        vibe: 'together but chaotic',
        questions: [
          'If we started a business together that was guaranteed to fail spectacularly, what would it be?',
          "What conspiracy theory would you be most likely to fall for?",
          'If we were both cartoon characters in the same show, what show is it and who are we?',
        ],
      },
    ],
  },
]

export default predictPartnerSeries

// Flat helpers
export const allPredictPacks = predictPartnerSeries.flatMap(s => s.packs)
export const getPredictPack = (packId) => allPredictPacks.find(p => p.id === packId)
export const getSeriesForPack = (packId) =>
  predictPartnerSeries.find(s => s.packs.some(p => p.id === packId))
