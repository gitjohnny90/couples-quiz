/**
 * Hot Takes statements — 50 total across 3 categories, 10 groups of 5.
 */

const hotTakesCategories = [
  {
    key: 'relationship',
    label: 'Relationship Takes',
    emoji: '❤️',
    description: 'playful opinions about love',
    groups: [
      {
        id: 'rel-1',
        label: 'The Basics',
        statements: [
          { id: 'takes-1', text: 'Your partner should also be your best friend' },
          { id: 'takes-2', text: 'Good morning and goodnight texts are mandatory, not optional' },
          { id: 'takes-3', text: 'You should always hype up your partner in public even if you\'re exaggerating' },
          { id: 'takes-4', text: 'Couples who don\'t argue at all are hiding something' },
          { id: 'takes-5', text: 'Saying "I love you" first takes more courage than proposing' },
        ],
      },
      {
        id: 'rel-2',
        label: 'Dating Rules',
        statements: [
          { id: 'takes-6', text: 'Planning a date should be 50/50 — it\'s not always one person\'s job' },
          { id: 'takes-7', text: 'It\'s fine to check your partner\'s phone if they leave it unlocked next to you' },
          { id: 'takes-8', text: 'You should still go on dates even after years together' },
          { id: 'takes-9', text: 'Matching outfits as a couple is cute not cringe' },
          { id: 'takes-10', text: 'A handwritten note means more than an expensive gift' },
        ],
      },
      {
        id: 'rel-3',
        label: 'The Real Talk',
        statements: [
          { id: 'takes-11', text: 'Long distance makes couples stronger than couples who live in the same city' },
          { id: 'takes-12', text: 'Love languages are legit and everyone should know theirs' },
          { id: 'takes-13', text: 'You should never vent about your partner to your friends' },
          { id: 'takes-14', text: 'Your partner doesn\'t need to be into all the same things you\'re into' },
          { id: 'takes-15', text: 'The first year of a relationship is the hardest, not the easiest' },
        ],
      },
    ],
  },
  {
    key: 'spicy',
    label: 'Spicy Takes',
    emoji: '🌶️',
    description: 'opinions that split rooms',
    groups: [
      {
        id: 'spicy-1',
        label: 'Social Media & Modern Dating',
        statements: [
          { id: 'takes-16', text: 'It\'s a yellow flag if your partner never posts you on social media' },
          { id: 'takes-17', text: 'Liking someone\'s thirst trap while in a relationship is disrespectful' },
          { id: 'takes-18', text: 'Double texting is perfectly fine and people need to get over it' },
          { id: 'takes-19', text: 'You can be friends with an ex without it being weird' },
          { id: 'takes-20', text: 'Social media has made relationships harder, not easier' },
        ],
      },
      {
        id: 'spicy-2',
        label: 'Life Decisions',
        statements: [
          { id: 'takes-21', text: 'Couples should take a road trip together before getting engaged — that tells you everything' },
          { id: 'takes-22', text: 'Whoever cooks shouldn\'t have to do the dishes — that\'s the law' },
          { id: 'takes-23', text: 'Pets before kids is the correct order of operations' },
          { id: 'takes-24', text: 'You don\'t need to meet your partner\'s family in the first year' },
          { id: 'takes-25', text: 'Money conversations should happen before the "I love you" conversation' },
        ],
      },
      {
        id: 'spicy-3',
        label: 'Hot Button',
        statements: [
          { id: 'takes-26', text: 'Flirty banter with other people is harmless as long as your partner knows about it' },
          { id: 'takes-27', text: 'If your best friend and your partner don\'t get along, that\'s a real problem' },
          { id: 'takes-28', text: 'The "talking stage" has gotten way too long — people need to commit or leave' },
          { id: 'takes-29', text: 'Apologizing first doesn\'t mean you were wrong, it means you value the relationship more' },
          { id: 'takes-30', text: 'Being jealous sometimes is normal and healthy' },
        ],
      },
    ],
  },
  {
    key: 'unhinged',
    label: 'Unhinged Takes',
    emoji: '😂',
    description: 'the ones that start the dumbest debates',
    groups: [
      {
        id: 'unhinged-1',
        label: 'Food Wars',
        statements: [
          { id: 'takes-31', text: 'Pineapple on pizza is elite and haters are wrong' },
          { id: 'takes-32', text: 'Cereal is technically soup and you can\'t convince me otherwise' },
          { id: 'takes-33', text: 'Ketchup on eggs is perfectly normal' },
          { id: 'takes-34', text: 'Water is wet — and this is worth arguing about' },
          { id: 'takes-35', text: 'A hot dog IS a sandwich' },
        ],
      },
      {
        id: 'unhinged-2',
        label: 'Household Chaos',
        statements: [
          { id: 'takes-36', text: 'Socks in bed is an automatic dealbreaker' },
          { id: 'takes-37', text: 'The toilet seat should always be left down — no debate' },
          { id: 'takes-38', text: 'Sleeping with a fan on is non-negotiable even in winter' },
          { id: 'takes-39', text: 'The correct way to hang toilet paper is over, not under' },
          { id: 'takes-40', text: 'Dishes should be washed immediately — letting them "soak" is just lazy' },
        ],
      },
      {
        id: 'unhinged-3',
        label: 'Unhinged Opinions',
        statements: [
          { id: 'takes-41', text: 'If you bite string cheese instead of peeling it, I don\'t trust you as a person' },
          { id: 'takes-42', text: 'Breakfast for dinner is superior to breakfast for breakfast' },
          { id: 'takes-43', text: 'Crocs are genuinely good shoes and the haters will come around' },
          { id: 'takes-44', text: 'Napping is a hobby and deserves more respect' },
          { id: 'takes-45', text: 'The snooze button exists to be used — morning people are suspicious' },
        ],
      },
      {
        id: 'unhinged-4',
        label: 'The Final Boss',
        statements: [
          { id: 'takes-46', text: 'Die Hard is a Christmas movie' },
          { id: 'takes-47', text: 'GIF is pronounced with a hard G and anyone who says "jif" is chaotic' },
          { id: 'takes-48', text: 'Ranch goes on everything' },
          { id: 'takes-49', text: 'The best part of the Oreo is the cookie, not the cream' },
          { id: 'takes-50', text: 'You\'re either a shower thinker or a can\'t-think-in-the-shower person and this says everything about you' },
        ],
      },
    ],
  },
]

export default hotTakesCategories

/** Flat list of all groups for counting */
export const allHotTakeGroups = hotTakesCategories.flatMap(c => c.groups)

/** Flat list of all statements */
export const allHotTakeStatements = allHotTakeGroups.flatMap(g => g.statements)

/** Find a group by id */
export function getGroup(groupId) {
  return allHotTakeGroups.find(g => g.id === groupId)
}

/** Find which category a group belongs to */
export function getCategoryForGroup(groupId) {
  return hotTakesCategories.find(c => c.groups.some(g => g.id === groupId))
}
