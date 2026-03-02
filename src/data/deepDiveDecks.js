export const MOOD_TAGS = {
  deep:       { emoji: '💭', label: 'deep' },
  chaotic:    { emoji: '😂', label: 'chaotic' },
  future:     { emoji: '🔮', label: 'future' },
  vulnerable: { emoji: '💛', label: 'vulnerable' },
  spicy:      { emoji: '🌶️', label: 'spicy' },
}

export const SERIES = [
  { id: 'opener',     title: 'The Opener',     emoji: '👋', description: 'ease into it' },
  { id: 'no-filter',  title: 'No Filter',      emoji: '🔊', description: 'say what you mean' },
  { id: 'build',      title: 'Build a Life',   emoji: '🏠', description: 'dream it up together' },
  { id: 'chaos',      title: 'Chaos Cards',    emoji: '🃏', description: 'unhinged energy only' },
  { id: 'after-dark', title: 'After Dark',     emoji: '🌙', description: 'walls down, hearts open' },
]

const deepDiveDecks = [
  // ═══ THE OPENER SERIES ═══
  {
    id: 'dd-first-impressions',
    title: 'First Impressions',
    series: 'opener',
    moodTags: ['deep', 'spicy', 'chaotic'],
    questions: [
      { id: 'dd-fi-1', text: "What's something about me you noticed that you don't think I realize you noticed?", moodTag: 'deep' },
      { id: 'dd-fi-2', text: 'Rate my texting back speed 1-10 and explain yourself.', moodTag: 'spicy' },
      { id: 'dd-fi-3', text: 'Finish this sentence honestly: "I knew I was in trouble when you..."', moodTag: 'chaotic' },
    ],
  },
  {
    id: 'dd-unserious',
    title: 'Unserious Questions, Serious Answers',
    series: 'opener',
    moodTags: ['chaotic', 'future', 'vulnerable'],
    questions: [
      { id: 'dd-us-1', text: 'If I became a worm, how would you take care of me? Be specific.', moodTag: 'chaotic' },
      { id: 'dd-us-2', text: 'What would be the centerpiece of our future living room? Defend your answer.', moodTag: 'future' },
      { id: 'dd-us-3', text: "What do you think I'm most insecure about that I shouldn't be?", moodTag: 'vulnerable' },
    ],
  },
  {
    id: 'dd-read-me',
    title: 'Read Me Like a Book',
    series: 'opener',
    moodTags: ['spicy', 'chaotic', 'deep'],
    questions: [
      { id: 'dd-rm-1', text: "What's my biggest ick and do I know about it yet?", moodTag: 'spicy' },
      { id: 'dd-rm-2', text: 'If we had a couples reality show, what would the dramatic narrator say about us?', moodTag: 'chaotic' },
      { id: 'dd-rm-3', text: 'If you had to describe our relationship as a sandwich, what kind and why?', moodTag: 'chaotic' },
    ],
  },
  {
    id: 'dd-caught-off-guard',
    title: 'Caught Off Guard',
    series: 'opener',
    moodTags: ['vulnerable', 'deep', 'spicy'],
    questions: [
      { id: 'dd-cog-1', text: "What's a moment with me that felt like slow motion?", moodTag: 'vulnerable' },
      { id: 'dd-cog-2', text: "What would you guess I journal about when you're not around?", moodTag: 'deep' },
      { id: 'dd-cog-3', text: "What's something I do that you find attractive that I definitely don't do on purpose?", moodTag: 'spicy' },
    ],
  },

  // ═══ NO FILTER SERIES ═══
  {
    id: 'dd-say-it',
    title: 'Say It to My Face',
    series: 'no-filter',
    moodTags: ['deep', 'spicy', 'vulnerable'],
    questions: [
      { id: 'dd-si-1', text: "What's the most attractive thing about me that has nothing to do with how I look?", moodTag: 'deep' },
      { id: 'dd-si-2', text: 'If you could fix one thing about how we communicate, what would it be?', moodTag: 'spicy' },
      { id: 'dd-si-3', text: 'What do you think I need to hear from you more often?', moodTag: 'vulnerable' },
    ],
  },
  {
    id: 'dd-hot-takes',
    title: 'Hot Takes Only',
    series: 'no-filter',
    moodTags: ['spicy', 'chaotic', 'deep'],
    questions: [
      { id: 'dd-ht-1', text: "What's your hottest take about relationships that most people would disagree with?", moodTag: 'spicy' },
      { id: 'dd-ht-2', text: "What habit of mine are you secretly hoping I'll grow out of?", moodTag: 'spicy' },
      { id: 'dd-ht-3', text: "If our relationship was a song, what genre is it and what's the chorus?", moodTag: 'chaotic' },
    ],
  },
  {
    id: 'dd-truth-booth',
    title: 'The Truth Booth',
    series: 'no-filter',
    moodTags: ['vulnerable', 'deep', 'spicy'],
    questions: [
      { id: 'dd-tb-1', text: "What's something you've bitten your tongue about with me?", moodTag: 'vulnerable' },
      { id: 'dd-tb-2', text: 'If you could only keep three qualities about me and trade the rest, which three stay?', moodTag: 'deep' },
      { id: 'dd-tb-3', text: 'What do you daydream about when you think about us?', moodTag: 'vulnerable' },
    ],
  },
  {
    id: 'dd-five-words',
    title: 'Five Words or Less',
    series: 'no-filter',
    moodTags: ['chaotic', 'vulnerable', 'future'],
    questions: [
      { id: 'dd-fw-1', text: 'Describe your dream Sunday morning with me using only five words.', moodTag: 'vulnerable' },
      { id: 'dd-fw-2', text: 'Describe our future in exactly five words.', moodTag: 'future' },
      { id: 'dd-fw-3', text: 'What would your best friend say about us in five words?', moodTag: 'chaotic' },
    ],
  },

  // ═══ BUILD A LIFE SERIES ═══
  {
    id: 'dd-playing-house',
    title: 'Playing House',
    series: 'build',
    moodTags: ['future', 'chaotic', 'deep'],
    questions: [
      { id: 'dd-ph-1', text: "Our future home has a junk drawer. What's in it?", moodTag: 'future' },
      { id: 'dd-ph-2', text: "What's the first meal I'm cooking you when we live together? Be delusional or realistic, your choice.", moodTag: 'chaotic' },
      { id: 'dd-ph-3', text: 'How many pets and what kinds? This is a dealbreaker question.', moodTag: 'deep' },
    ],
  },
  {
    id: 'dd-blueprint',
    title: 'The Blueprint',
    series: 'build',
    moodTags: ['future', 'vulnerable', 'deep'],
    questions: [
      { id: 'dd-bp-1', text: 'If we opened a business together, what would it be and who does what?', moodTag: 'future' },
      { id: 'dd-bp-2', text: "What's a tradition you want us to have that's just ours?", moodTag: 'vulnerable' },
      { id: 'dd-bp-3', text: "What room in our future place are you claiming as yours and what's in it?", moodTag: 'deep' },
    ],
  },
  {
    id: 'dd-date-night',
    title: 'Date Night Architects',
    series: 'build',
    moodTags: ['future', 'chaotic', 'spicy'],
    questions: [
      { id: 'dd-dn-1', text: 'We have a Friday night with zero plans. Paint the picture.', moodTag: 'future' },
      { id: 'dd-dn-2', text: "What's the first trip we should take together and why?", moodTag: 'future' },
      { id: 'dd-dn-3', text: 'Plan our perfect double date — who are we going with and what are we doing?', moodTag: 'chaotic' },
    ],
  },
  {
    id: 'dd-real-stuff',
    title: 'The Real Stuff',
    series: 'build',
    moodTags: ['future', 'vulnerable', 'deep'],
    questions: [
      { id: 'dd-rs-1', text: "We're old and sitting on a porch. What are we talking about?", moodTag: 'future' },
      { id: 'dd-rs-2', text: 'What do you think our biggest challenge will be when the distance is finally closed? Be real.', moodTag: 'vulnerable' },
      { id: 'dd-rs-3', text: "What's one thing you want to promise me but haven't said out loud yet?", moodTag: 'deep' },
    ],
  },

  // ═══ CHAOS CARDS SERIES ═══
  {
    id: 'dd-unhinged',
    title: 'Unhinged Scenarios',
    series: 'chaos',
    moodTags: ['chaotic', 'chaotic', 'chaotic'],
    questions: [
      { id: 'dd-uh-1', text: "I've been kidnapped. How are you rescuing me? Be detailed.", moodTag: 'chaotic' },
      { id: 'dd-uh-2', text: 'Which one of us is getting possessed by a ghost first and how is the other one handling it?', moodTag: 'chaotic' },
      { id: 'dd-uh-3', text: "If we had to survive a zombie apocalypse, what's my assigned role and yours?", moodTag: 'chaotic' },
    ],
  },
  {
    id: 'dd-identity-crisis',
    title: 'Identity Crisis',
    series: 'chaos',
    moodTags: ['chaotic', 'spicy', 'deep'],
    questions: [
      { id: 'dd-ic-1', text: "Describe me using only characters from shows we've both watched.", moodTag: 'chaotic' },
      { id: 'dd-ic-2', text: 'Write my dating profile bio but make it accurate and unhinged.', moodTag: 'spicy' },
      { id: 'dd-ic-3', text: 'If I were a candle, what would I smell like? Think hard.', moodTag: 'deep' },
    ],
  },
  {
    id: 'dd-chaos-reigns',
    title: 'Chaos Reigns',
    series: 'chaos',
    moodTags: ['chaotic', 'chaotic', 'spicy'],
    questions: [
      { id: 'dd-cr-1', text: "We're both contestants on a cooking show. What dish are you making and are you sabotaging me?", moodTag: 'chaotic' },
      { id: 'dd-cr-2', text: "You have to pick my outfit for a week straight. What am I wearing?", moodTag: 'chaotic' },
      { id: 'dd-cr-3', text: 'If our relationship had a Yelp review from a hater, what would it say?', moodTag: 'spicy' },
    ],
  },
  {
    id: 'dd-plot-twist',
    title: 'Plot Twist',
    series: 'chaos',
    moodTags: ['chaotic', 'deep', 'chaotic'],
    questions: [
      { id: 'dd-pt-1', text: "You find out I've been secretly training for something for 6 months. What is it?", moodTag: 'chaotic' },
      { id: 'dd-pt-2', text: 'We accidentally start a viral trend as a couple. What is it?', moodTag: 'chaotic' },
      { id: 'dd-pt-3', text: "A movie is being made about us. What's the title, the genre, and who plays us?", moodTag: 'deep' },
    ],
  },

  // ═══ AFTER DARK SERIES ═══
  {
    id: 'dd-miss-you',
    title: 'Miss You Hours',
    series: 'after-dark',
    moodTags: ['vulnerable', 'vulnerable', 'deep'],
    questions: [
      { id: 'dd-my-1', text: 'When do you miss me the most during the day? Like specifically what moment?', moodTag: 'vulnerable' },
      { id: 'dd-my-2', text: "What's a version of me you've seen that you don't think anyone else gets to see?", moodTag: 'vulnerable' },
      { id: 'dd-my-3', text: "If you could bottle a feeling from our relationship, which moment's feeling would you keep?", moodTag: 'deep' },
    ],
  },
  {
    id: 'dd-walls-down',
    title: 'Walls Down',
    series: 'after-dark',
    moodTags: ['vulnerable', 'deep', 'vulnerable'],
    questions: [
      { id: 'dd-wd-1', text: "What's something you're scared to need from me?", moodTag: 'vulnerable' },
      { id: 'dd-wd-2', text: 'What\'s the hardest part of loving someone long distance that nobody talks about?', moodTag: 'deep' },
      { id: 'dd-wd-3', text: 'What part of your life do you want me to understand better?', moodTag: 'vulnerable' },
    ],
  },
  {
    id: 'dd-no-overthinking',
    title: 'No Overthinking Allowed',
    series: 'after-dark',
    moodTags: ['vulnerable', 'spicy', 'deep'],
    questions: [
      { id: 'dd-no-1', text: 'Finish this: "I feel closest to you when..."', moodTag: 'vulnerable' },
      { id: 'dd-no-2', text: "What's something small I do that wrecks you every time?", moodTag: 'spicy' },
      { id: 'dd-no-3', text: 'Write me a three-sentence love letter. No overthinking. Go.', moodTag: 'deep' },
    ],
  },
  {
    id: 'dd-deep-end',
    title: 'The Deep End',
    series: 'after-dark',
    moodTags: ['vulnerable', 'deep', 'vulnerable'],
    questions: [
      { id: 'dd-de-1', text: 'If I asked you "are we going to make it?" right now, what would you honestly say and why?', moodTag: 'vulnerable' },
      { id: 'dd-de-2', text: "What do you need from me that you've never directly asked for?", moodTag: 'deep' },
      { id: 'dd-de-3', text: "What's something about us that makes you proud?", moodTag: 'vulnerable' },
    ],
  },
]

export default deepDiveDecks
