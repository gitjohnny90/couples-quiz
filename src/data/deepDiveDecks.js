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
      { id: 'dd-rm-3', text: "What's my signature move that I pull out when I'm trying to impress someone?", moodTag: 'chaotic' },
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

  {
    id: 'dd-small-things',
    title: 'Small Things',
    series: 'opener',
    moodTags: ['deep', 'deep', 'chaotic'],
    questions: [
      { id: 'dd-st-1', text: "What's a tiny habit of mine that you've quietly memorized?", moodTag: 'deep' },
      { id: 'dd-st-2', text: "What's something I do for you that feels small to me but means a lot to you?", moodTag: 'deep' },
      { id: 'dd-st-3', text: "What's a completely normal thing I do that you find unreasonably endearing?", moodTag: 'chaotic' },
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
      { id: 'dd-fw-2', text: 'Describe what last week felt like for us in exactly five words.', moodTag: 'vulnerable' },
      { id: 'dd-fw-3', text: 'What would your best friend say about us in five words?', moodTag: 'chaotic' },
    ],
  },

  {
    id: 'dd-permission-slip',
    title: 'Permission Slip',
    series: 'no-filter',
    moodTags: ['vulnerable', 'deep', 'vulnerable'],
    questions: [
      { id: 'dd-ps-1', text: "What's something you need permission to feel? I'm giving it to you right now.", moodTag: 'vulnerable' },
      { id: 'dd-ps-2', text: "What's a question you've been wanting to ask me but you're not sure I'm ready to answer?", moodTag: 'deep' },
      { id: 'dd-ps-3', text: "If you could take back one thing you said to me — not because it was wrong, but because of how you said it — what would it be?", moodTag: 'vulnerable' },
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
      { id: 'dd-ph-2', text: "Next time I'm in your kitchen, what's the first meal I'm making you? Be delusional or realistic, your choice.", moodTag: 'chaotic' },
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
      { id: 'dd-ic-3', text: 'If I had a warning label, what would it say?', moodTag: 'spicy' },
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

  {
    id: 'dd-parallel-universe',
    title: 'Parallel Universe',
    series: 'chaos',
    moodTags: ['chaotic', 'chaotic', 'deep'],
    questions: [
      { id: 'dd-pu-1', text: "In a universe where we never met, what do you think you'd be doing right now?", moodTag: 'chaotic' },
      { id: 'dd-pu-2', text: "If we met in a completely different way — like bumped into each other in a grocery store — how does that version of us play out?", moodTag: 'chaotic' },
      { id: 'dd-pu-3', text: "In the version of our story where everything goes exactly right from here, what does next year look like?", moodTag: 'deep' },
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
  {
    id: 'dd-phone-call',
    title: 'The Phone Call',
    series: 'after-dark',
    moodTags: ['vulnerable', 'deep', 'deep'],
    questions: [
      { id: 'dd-pc-1', text: "What's something you've wanted to bring up on a call but kept pushing to 'next time'?", moodTag: 'vulnerable' },
      { id: 'dd-pc-2', text: "If I could hear the version of you that exists right after we hang up, what would I learn?", moodTag: 'deep' },
      { id: 'dd-pc-3', text: "What's a conversation we had on the phone that changed something for you — even if I don't know it did?", moodTag: 'deep' },
    ],
  },
]

export default deepDiveDecks
