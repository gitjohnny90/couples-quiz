// Section IDs are permanent keys used in Storage paths and DB state. NEVER rename after launch.

const photoSections = [
  {
    id: 'morning-routine',
    title: 'Morning Routine',
    emoji: '☀️',
    description: 'How your day starts',
    prompts: [
      { id: 'morning-routine-1', text: 'What are you up to?' },
      { id: 'morning-routine-2', text: 'Show us your morning drink of choice.' },
      { id: 'morning-routine-3', text: 'Recreate your most chaotic morning face.' },
    ],
  },
  {
    id: 'current-meal',
    title: 'What Are You Eating?',
    emoji: '🍽️',
    description: "What's on your plate right now",
    prompts: [
      { id: 'current-meal-1', text: 'What are you up to?' },
      { id: 'current-meal-2', text: "Show us what's on your plate right now." },
      { id: 'current-meal-3', text: 'Make your most dramatic "this is disgusting" food face — even if you love it.' },
    ],
  },
  {
    id: 'right-now-vibes',
    title: 'Right Now Vibes',
    emoji: '🎧',
    description: 'What you\'re into at this exact moment',
    prompts: [
      { id: 'right-now-vibes-1', text: 'What are you up to?' },
      { id: 'right-now-vibes-2', text: "Show us what you're listening to or watching." },
      { id: 'right-now-vibes-3', text: 'Show us your "do not disturb" face.' },
    ],
  },
  {
    id: 'your-space',
    title: 'Your Space',
    emoji: '🏠',
    description: 'A corner of where you are right now',
    prompts: [
      { id: 'your-space-1', text: 'What are you up to?' },
      { id: 'your-space-2', text: 'Show us a corner of where you are right now.' },
      { id: 'your-space-3', text: 'Find something embarrassing and photograph it without context.' },
    ],
  },
  {
    id: 'outside-right-now',
    title: 'Outside Right Now',
    emoji: '🌤️',
    description: 'What the world looks like from where you are',
    prompts: [
      { id: 'outside-right-now-1', text: 'What are you up to?' },
      { id: 'outside-right-now-2', text: 'Show us what the sky or street looks like from where you are.' },
      { id: 'outside-right-now-3', text: 'Pose like a disappointed tourist in front of something completely ordinary.' },
    ],
  },
  {
    id: 'date-night',
    title: 'Date Night',
    emoji: '🕯️',
    description: 'Evening plans, real or imagined',
    prompts: [
      { id: 'date-night-1', text: 'What are you up to?' },
      { id: 'date-night-2', text: 'Show us your date night look.' },
      { id: 'date-night-3', text: 'Show us the most ridiculous thing in your wallet or bag right now.' },
    ],
  },
  {
    id: 'pet-or-plant',
    title: 'Pets & Plants',
    emoji: '🌿',
    description: 'Critters and greenery in your world',
    prompts: [
      { id: 'pet-or-plant-1', text: 'What are you up to?' },
      { id: 'pet-or-plant-2', text: 'Show us your pet, plant, or a random creature nearby.' },
      { id: 'pet-or-plant-3', text: "Recreate your pet's or plant's energy with your own face." },
    ],
  },
  {
    id: 'self-care-day',
    title: 'Self-Care Day',
    emoji: '🛁',
    description: 'What recharging looks like for you',
    prompts: [
      { id: 'self-care-day-1', text: 'What are you up to?' },
      { id: 'self-care-day-2', text: "Show us one thing you're doing for yourself today." },
      { id: 'self-care-day-3', text: "Show us the self-care that would horrify a wellness influencer." },
    ],
  },
  {
    id: 'working-on-it',
    title: 'Working On It',
    emoji: '💼',
    description: "What's keeping you busy today",
    prompts: [
      { id: 'working-on-it-1', text: 'What are you up to?' },
      { id: 'working-on-it-2', text: "Show us where you're working or what you're working on." },
      { id: 'working-on-it-3', text: 'Show us your actual focus face vs. your "I\'m definitely working" face.' },
    ],
  },
  {
    id: 'travel-mode',
    title: 'Travel Mode',
    emoji: '✈️',
    description: 'On the road, in the air, or heading somewhere',
    prompts: [
      { id: 'travel-mode-1', text: 'What are you up to?' },
      { id: 'travel-mode-2', text: "Show us where you are or where you're going." },
      { id: 'travel-mode-3', text: 'Recreate the most unflattering travel photo possible.' },
    ],
  },
  {
    id: 'cooking-or-ordering',
    title: 'Cooking or Ordering',
    emoji: '👨‍🍳',
    description: "Tonight's dinner plan",
    prompts: [
      { id: 'cooking-or-ordering-1', text: 'What are you up to?' },
      { id: 'cooking-or-ordering-2', text: 'Show us the meal plan (cooking or the delivery app).' },
      { id: 'cooking-or-ordering-3', text: 'Show us the most questionable ingredient or item in your kitchen right now.' },
    ],
  },
  {
    id: 'getting-ready',
    title: 'Getting Ready',
    emoji: '💄',
    description: 'The ritual, the chaos, all of it',
    prompts: [
      { id: 'getting-ready-1', text: 'What are you up to?' },
      { id: 'getting-ready-2', text: 'Show us mid-get-ready chaos.' },
      { id: 'getting-ready-3', text: "Show us the product or item you've been using since forever and refuse to stop." },
    ],
  },
  {
    id: 'weekend-energy',
    title: 'Weekend Energy',
    emoji: '🛌',
    description: 'How you actually spend your free time',
    prompts: [
      { id: 'weekend-energy-1', text: 'What are you up to?' },
      { id: 'weekend-energy-2', text: 'Show us what a weekend looks like for you.' },
      { id: 'weekend-energy-3', text: 'Recreate your most extreme weekend laziness pose.' },
    ],
  },
  {
    id: 'something-new',
    title: 'Something New',
    emoji: '🌱',
    description: "Something you've recently discovered, tried, or started",
    prompts: [
      { id: 'something-new-1', text: 'What are you up to?' },
      { id: 'something-new-2', text: "Show us something you've tried, bought, or started recently." },
      { id: 'something-new-3', text: 'Show us something new that is absolutely not living up to expectations.' },
    ],
  },
  {
    id: 'end-of-day',
    title: 'End of Day',
    emoji: '🌙',
    description: 'Winding down and wrapping up',
    prompts: [
      { id: 'end-of-day-1', text: 'What are you up to?' },
      { id: 'end-of-day-2', text: 'Show us how you wind down.' },
      { id: 'end-of-day-3', text: "Show us the decompression activity you'd be embarrassed to admit to." },
    ],
  },
]

export default photoSections
