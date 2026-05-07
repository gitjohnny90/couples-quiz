/**
 * Hot Takes statements — 120 total across 6 categories, 24 groups of 5.
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
          { id: 'takes-7', text: 'It\'s a bigger flex to leave your phone unlocked around your partner than to say "I love you"' },
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
      {
        id: 'rel-4',
        label: 'Long Distance Edition',
        statements: [
          { id: 'ht-new-1', text: 'FaceTime dates count as real dates' },
          { id: 'ht-new-2', text: 'You should tell your partner when something bothers you, even if it\'s small and you know you\'ll get over it' },
          { id: 'ht-new-3', text: 'Sending memes IS a love language' },
          { id: 'ht-new-5', text: 'Your partner should be the first person you tell good news to — before anyone else' },
          { id: 'ht-new-6', text: 'Falling asleep on FaceTime together is one of the most intimate things you can do long distance' },
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
          { id: 'takes-17', text: 'Liking your ex\'s posts while in a relationship is always disrespectful, no matter how innocent it seems' },
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
          { id: 'takes-26', text: 'Being naturally charming and friendly isn\'t the same as flirting, and your partner shouldn\'t have to worry about it' },
          { id: 'takes-27', text: 'If your best friend and your partner don\'t get along, that\'s a real problem' },
          { id: 'takes-28', text: 'The "talking stage" has gotten way too long — people need to commit or leave' },
          { id: 'takes-29', text: 'Apologizing first doesn\'t mean you were wrong, it means you value the relationship more' },
          { id: 'takes-30', text: 'Being jealous sometimes is normal and healthy' },
        ],
      },
      {
        id: 'spicy-4',
        label: 'Modern Love',
        statements: [
          { id: 'ht-new-4', text: 'If you can\'t be happy alone, you\'re not ready to be in a relationship' },
          { id: 'ht-new-7', text: 'You should never have to wonder where you stand with someone who loves you' },
          { id: 'ht-new-8', text: 'The strongest couples are the ones who can sit in silence and it\'s not awkward' },
          { id: 'ht-new-9', text: 'Sending voice notes is more personal than texting and everyone should do it more' },
          { id: 'ht-new-10', text: 'It\'s okay to miss your partner even when you just talked to them' },
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
          { id: 'takes-34', text: 'The person who cares less in a relationship has more power — and that\'s a problem' },
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
  {
    key: 'goofball',
    label: 'Goofball',
    emoji: '🦆',
    description: 'pure chaos, accuse each other freely',
    groups: [
      {
        id: 'goofball-1',
        label: 'Confess Your Crimes',
        statements: [
          { id: 'gb-takes-1', text: 'I\'ve had a full conversation with a pet I\'m 90% sure understood every word' },
          { id: 'gb-takes-2', text: 'I rehearse phone calls in my head before I make them' },
          { id: 'gb-takes-3', text: 'I\'ve eaten food off the floor and acted like nothing happened' },
          { id: 'gb-takes-4', text: 'I\'ve absolutely faked knowing a song\'s lyrics by mumbling the whole way through' },
          { id: 'gb-takes-5', text: 'I\'ve parked, turned off the car, and then just sat there way longer than I meant to' },
        ],
      },
      {
        id: 'goofball-2',
        label: 'In an Emergency',
        statements: [
          { id: 'gb-takes-6', text: 'If we got attacked by a flock of geese right now, you\'d freeze and I\'d carry the team' },
          { id: 'gb-takes-7', text: 'If we got dropped in the wilderness with nothing, you\'d last about 36 hours' },
          { id: 'gb-takes-8', text: 'If a horror movie scenario started in real life, you\'d be the one going to investigate the noise' },
          { id: 'gb-takes-9', text: 'If we had to fight one angry toddler, only one of us is making it home' },
          { id: 'gb-takes-10', text: 'If a zombie outbreak hit, you\'d panic-buy something pointless in the first hour' },
        ],
      },
      {
        id: 'goofball-3',
        label: 'You Specifically',
        statements: [
          { id: 'gb-takes-11', text: 'You\'d 100% try to befriend a wild raccoon' },
          { id: 'gb-takes-12', text: 'You walk into rooms and forget why you came in there at least twice a day' },
          { id: 'gb-takes-13', text: 'You talk to the GPS like it can hear you' },
          { id: 'gb-takes-14', text: 'You\'d lose a 1v1 fight against a goose' },
          { id: 'gb-takes-15', text: 'You\'d absolutely try to swim across that body of water "just to see"' },
        ],
      },
      {
        id: 'goofball-4',
        label: 'Hot-Button Nonsense',
        statements: [
          { id: 'gb-takes-16', text: 'Talking to plants makes them grow better and I will defend this with my life' },
          { id: 'gb-takes-17', text: 'The 5-second rule is real and the science backs me up' },
          { id: 'gb-takes-18', text: 'If a road\'s empty at 3am, the speed limit is just a suggestion' },
          { id: 'gb-takes-19', text: 'Saying "bless you" after a sneeze is mandatory — people who skip it are choosing chaos' },
          { id: 'gb-takes-20', text: 'You\'re either a person who reads cereal boxes at breakfast or you\'re not, and that says everything' },
        ],
      },
    ],
  },
  {
    key: 'end-of-world',
    label: 'End of the World',
    emoji: '🧟',
    description: 'apocalypse roles and survival hypotheticals',
    groups: [
      {
        id: 'eotw-1',
        label: 'Apocalypse Roles',
        statements: [
          { id: 'eotw-takes-1', text: 'In a zombie apocalypse, you\'d die in the first week trying to do something heroic' },
          { id: 'eotw-takes-2', text: 'If aliens invaded, I\'d absolutely try to negotiate before fighting' },
          { id: 'eotw-takes-3', text: 'In a horror movie, you\'d be the one who splits up from the group' },
          { id: 'eotw-takes-4', text: 'If society collapsed, you\'d be cutting hair for cans of beans within 6 months' },
          { id: 'eotw-takes-5', text: 'In a disaster movie, I\'d be the comedic relief who somehow survives' },
        ],
      },
      {
        id: 'eotw-2',
        label: 'Stranded Together',
        statements: [
          { id: 'eotw-takes-6', text: 'If we were stuck on a deserted island, you\'d lose your mind first' },
          { id: 'eotw-takes-7', text: 'I could start a fire from scratch in under 30 minutes' },
          { id: 'eotw-takes-8', text: 'You\'d absolutely eat a weird-looking berry "just to see"' },
          { id: 'eotw-takes-9', text: 'I\'d be the first one trying to build a shelter' },
          { id: 'eotw-takes-10', text: 'You\'d waste all our energy trying to spell SOS in shells' },
        ],
      },
      {
        id: 'eotw-3',
        label: 'Doomsday Prep',
        statements: [
          { id: 'eotw-takes-11', text: 'I have an actual go-bag (or I really should)' },
          { id: 'eotw-takes-12', text: 'I know exactly which window I\'d break to escape our home' },
          { id: 'eotw-takes-13', text: 'I\'ve thought about what I\'d grab in a fire and the list is too long' },
          { id: 'eotw-takes-14', text: 'I keep a flashlight in a specific place "just in case"' },
          { id: 'eotw-takes-15', text: 'I have a fully formed plan for if the power went out for a week' },
        ],
      },
      {
        id: 'eotw-4',
        label: 'Final Hours',
        statements: [
          { id: 'eotw-takes-16', text: 'If we had 24 hours left, you\'d absolutely spend the first 3 of them stuck in traffic somewhere stupid' },
          { id: 'eotw-takes-17', text: 'If I had one last meal, it would be something embarrassingly basic' },
          { id: 'eotw-takes-18', text: 'If the world ended tomorrow, you\'d still try to hit the gym in the morning' },
          { id: 'eotw-takes-19', text: 'If I had one hour left, I\'d waste at least 15 minutes scrolling my phone' },
          { id: 'eotw-takes-20', text: 'I\'d be eerily calm if we had 24 hours left' },
        ],
      },
    ],
  },
  {
    key: 'brain-goblins',
    label: 'Brain Goblins',
    emoji: '🧠',
    description: 'weird thoughts you\'ve never said out loud',
    groups: [
      {
        id: 'bg-1',
        label: 'Intrusive Thoughts',
        statements: [
          { id: 'bg-takes-1', text: 'I sometimes imagine just dropping the thing I\'m holding for no reason' },
          { id: 'bg-takes-2', text: 'I\'ve had the thought "what if I just yelled right now" in a quiet public place' },
          { id: 'bg-takes-3', text: 'My brain offers up a cringe memory from 8 years ago, completely unprompted, on a regular basis' },
          { id: 'bg-takes-4', text: 'I\'ve imagined wildly inappropriate responses to normal questions and had to actively not say them' },
          { id: 'bg-takes-5', text: 'My brain occasionally suggests something chaotic just to see if I\'d do it — I won\'t, but it\'s loud' },
        ],
      },
      {
        id: 'bg-2',
        label: 'Irrational Fears',
        statements: [
          { id: 'bg-takes-6', text: 'I do not trust escalators and I have a backup plan for every single one' },
          { id: 'bg-takes-7', text: 'I\'m convinced something is in the dark hallway when I have to walk past it' },
          { id: 'bg-takes-8', text: 'I cannot eat the last piece of food in front of people, even close friends' },
          { id: 'bg-takes-9', text: 'I check the back seat of my car for murderers — even when I just got out of it' },
          { id: 'bg-takes-10', text: 'I think a wave will come up and grab me at the beach if I turn my back to the ocean' },
        ],
      },
      {
        id: 'bg-3',
        label: 'Daydream Plans',
        statements: [
          { id: 'bg-takes-11', text: 'I have a fully-rehearsed speech for what I\'d say if I went viral' },
          { id: 'bg-takes-12', text: 'I have an exact plan for what I\'d do if I won the lottery and it\'s surprisingly weird' },
          { id: 'bg-takes-13', text: 'I\'ve imagined how I\'d react in an emergency so many times it might actually backfire' },
          { id: 'bg-takes-14', text: 'I have a dream house designed in my head that has at least one impractical room' },
          { id: 'bg-takes-15', text: 'I\'ve cast a movie about my own life and I won\'t reveal who plays me' },
        ],
      },
      {
        id: 'bg-4',
        label: '2 AM Brain',
        statements: [
          { id: 'bg-takes-16', text: 'I\'ve been kept awake by a conversation from 6 years ago that I should have ended differently' },
          { id: 'bg-takes-17', text: 'My brain has full panic attacks about something I forgot — that I actually didn\'t forget' },
          { id: 'bg-takes-18', text: 'I lie awake spiraling about a specific embarrassing thing I did that no one else remembers' },
          { id: 'bg-takes-19', text: 'I\'ve stayed up writing imaginary text messages I\'ll never send' },
          { id: 'bg-takes-20', text: 'My brain saves the heaviest existential questions specifically for 3am' },
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
