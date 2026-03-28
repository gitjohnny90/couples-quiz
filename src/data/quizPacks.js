const quizPacks = [
  {
    id: 'first-date-energy',
    title: 'First Date Energy',
    emoji: '💫',
    description: 'The butterflies, the nerves, the overthinking',
    color: '#E88D7A',
    questions: [
      {
        id: 'fde1',
        text: "What did you actually think the first time you saw me?",
        options: [
          "Oh no, they're cute",
          "Hmm... interesting",
          "Didn't think much honestly, then it crept up on me",
          "Immediate heart-drop, game over",
        ],
      },
      {
        id: 'fde2',
        text: "If I showed up to our first date in Crocs, what would you have done?",
        options: [
          "Left immediately, no explanation",
          "Stayed but judged silently the entire time",
          "Honestly wouldn't have cared",
          "Would've respected the confidence",
        ],
      },
      {
        id: 'fde3',
        text: "What's something you wanted to ask me early on but didn't?",
        options: [
          "Are you actually into me or just bored?",
          "What happened with your last relationship?",
          "What are you actually looking for?",
          "Can I kiss you right now?",
        ],
      },
      {
        id: 'fde4',
        text: "How long did you wait to text me back at the beginning and why?",
        options: [
          "Immediately — I have no chill",
          "Waited just long enough to seem cool",
          "Hours, because I was overthinking what to say",
          "Whenever I saw it — no games",
        ],
      },
      {
        id: 'fde5',
        text: "If our first conversation had a title, what would it be?",
        options: [
          "'Two People Trying Way Too Hard'",
          "'Surprisingly Easy'",
          "'I Didn't Expect This'",
          "'The Beginning of Something Stupid'",
        ],
      },
    ],
  },
  {
    id: 'read-my-mind',
    title: 'Read My Mind',
    emoji: '🧠',
    description: 'How well do you actually know how I work?',
    color: '#8b5cf6',
    questions: [
      {
        id: 'rmm1',
        text: "What do I order at a restaurant when I can't decide?",
        options: [
          "Whatever you're having — 'I'll have the same'",
          "The safest thing on the menu",
          "Something totally random just to try it",
          "Ask the waiter what's good and go with that",
        ],
      },
      {
        id: 'rmm2',
        text: "I'm having the worst day. What do I actually need from you?",
        options: [
          "Just listen, don't try to fix it",
          "Distract me — make me laugh or change the subject",
          "Space — let me process alone first",
          "Words — tell me it's going to be okay",
        ],
      },
      {
        id: 'rmm3',
        text: "What's my nervous habit that I don't think you've noticed?",
        options: [
          "You fidget with your hands or phone",
          "You get quiet and withdraw",
          "You start talking way more than usual",
          "You make jokes to deflect",
        ],
      },
      {
        id: 'rmm4',
        text: "If I could go back to any age for a week, which would I pick?",
        options: [
          "Childhood — no responsibilities, pure joy",
          "High school — unfinished business",
          "Early twenties — peak freedom",
          "Right now — I'd just relive a good week with you",
        ],
      },
      {
        id: 'rmm5',
        text: "What lie do I tell myself the most?",
        options: [
          "'I'm fine'",
          "'I don't care what people think'",
          "'I'll start tomorrow'",
          "'I'm not that stressed'",
        ],
      },
    ],
  },
  {
    id: 'the-dealbreakers',
    title: 'The Dealbreakers',
    emoji: '🚩',
    description: 'The lines, the limits, the green flags too',
    color: '#ef4444',
    questions: [
      {
        id: 'td1',
        text: "Which one would actually end us?",
        options: [
          "You stopped communicating when things got hard",
          "You got too comfortable and stopped trying",
          "You lied about something important",
          "You made me feel like I wasn't a priority",
        ],
      },
      {
        id: 'td2',
        text: "What's your biggest ick that you'd never recover from?",
        options: [
          "Chewing with your mouth open aggressively",
          "Being rude to service workers",
          "Posting everything about us on social media",
          "Not having any ambition or goals",
        ],
      },
      {
        id: 'td3',
        text: "What kind of couple do you never want us to become?",
        options: [
          "The ones who argue about everything in front of people",
          "The ones who seem perfect online but are falling apart",
          "The ones who stopped being their own person",
          "The ones who stayed together just because leaving felt harder",
        ],
      },
      {
        id: 'td4',
        text: "What's the biggest green flag I've shown you?",
        options: [
          "You remember small things I've said",
          "You own it when you're wrong",
          "You make me feel safe being myself",
          "You show up consistently, not just when it's easy",
        ],
      },
      {
        id: 'td5',
        text: "If we hit a really rough patch, what would you do?",
        options: [
          "Fight for it — I'm not giving up easily",
          "Suggest we get help — therapy or counseling",
          "Need to step back and think before deciding",
          "Talk it out until we figure it out together",
        ],
      },
    ],
  },
  {
    id: 'build-our-world',
    title: 'Build Our World',
    emoji: '🏠',
    description: 'Sunday mornings, grocery runs, and the life we\'re building',
    color: '#D4A843',
    questions: [
      {
        id: 'bow1',
        text: "It's Sunday morning. No alarms. What's happening?",
        options: [
          "We're sleeping until noon, don't talk to me",
          "Coffee in bed, phones out, parallel existing",
          "One of us is cooking breakfast, the other is 'supervising'",
          "Already up doing something — we don't waste the day",
        ],
      },
      {
        id: 'bow2',
        text: "We're grocery shopping together. What kind of couple are we?",
        options: [
          "List couple — efficient, in and out",
          "Chaotic — came for milk, left with $200 of snacks",
          "The 'we need to split up or we'll be here forever' couple",
          "The couple that makes it a whole date somehow",
        ],
      },
      {
        id: 'bow3',
        text: "What's the first thing we're hanging on our wall?",
        options: [
          "A photo of us being us",
          "Something one of us made or picked out",
          "Art that means something — not just decoration",
          "Nothing for six months because we can't agree",
        ],
      },
      {
        id: 'bow4',
        text: "How are we splitting chores and be honest?",
        options: [
          "Whatever you hate, I'll do, and vice versa",
          "We're making a chart — someone has to be organized",
          "Chaos — whoever can't stand the mess first does it",
          "Hiring help as soon as we can afford it",
        ],
      },
      {
        id: 'bow5',
        text: "When people talk about us, what do you want them to say?",
        options: [
          "Those two are so fun to be around",
          "I want what they have",
          "They're building something — you can just tell",
          "They're lowkey but you can see how solid they are",
        ],
      },
    ],
  },
  {
    id: 'spicy-takes',
    title: 'Spicy Takes',
    emoji: '🌶️',
    description: 'Honest answers only, no playing it safe',
    color: '#f97316',
    questions: [
      {
        id: 'st1',
        text: "How jealous are you actually? Be real.",
        options: [
          "Not at all — I trust you completely",
          "A little — I'm human, but I handle it",
          "Depends on the situation and who's involved",
          "I won't admit it but yes",
        ],
      },
      {
        id: 'st2',
        text: "What's something you find attractive that most people would think is weird?",
        options: [
          "When someone gets really passionate explaining something nerdy",
          "A little bit of stubbornness — it shows backbone",
          "Messy hair, no effort, just natural",
          "Being kind of awkward — perfection is boring",
        ],
      },
      {
        id: 'st3',
        text: "If you saw my screen time report, what app are you judging me for?",
        options: [
          "TikTok or YouTube — how long are you scrolling??",
          "Texting — who are you talking to that much?",
          "Games — are you twelve?",
          "Shopping apps — what are you buying now?",
        ],
      },
      {
        id: 'st4',
        text: "What's a pattern you keep falling into that you wish you could break?",
        options: [
          "I go quiet when I should speak up",
          "I overthink until I've created a problem that wasn't there",
          "I wait for the other person to make the first move on everything",
          "I give so much I forget to check what I actually need",
        ],
      },
      {
        id: 'st5',
        text: "What's the difference between loving someone and being IN love with them?",
        options: [
          "Being in love means they still make you a little nervous",
          "Love is a choice you make on the hard days, not just a feeling",
          "Being in love means their dreams matter as much as yours",
          "Honestly? I think the line is blurrier than people admit",
        ],
      },
    ],
  },
  {
    id: 'research-round',
    title: 'The Research Round',
    emoji: '🔬',
    description: 'Questions backed by 40 years of marriage research',
    color: '#10b981',
    questions: [
      {
        id: 'rr1',
        text: "When I'm excited about something small — a meme, a good sandwich, whatever — what do you usually do?",
        options: [
          "Stop what you're doing and engage with it",
          "Acknowledge it but keep doing your thing",
          "Depends on how busy you are",
          "Honestly? Probably miss it sometimes",
        ],
        researchNote: "Gottman found that couples who 'turn toward' each other's small bids for connection 86% of the time stayed together, vs 33% for those who divorced.",
      },
      {
        id: 'rr2',
        text: "When we disagree, how do I usually bring it up?",
        options: [
          "Gently — you start soft and explain how you feel",
          "Directly — you say what's wrong right away",
          "You hint at it and hope I pick up on it",
          "You bottle it up until it explodes",
        ],
        researchNote: "Gottman found that conversations end on the same note they begin — harsh startups predict failure, soft startups predict resolution.",
      },
      {
        id: 'rr3',
        text: "After we have a fight, who usually makes the first move to repair things?",
        options: [
          "I do — I reach out first",
          "You do — you're the first to break the ice",
          "We both kind of drift back together naturally",
          "It takes a while — we both need space first",
        ],
        researchNote: "The #1 thing successful couples do is make 'repairs' — small gestures to reconnect after conflict. This predicted success more than how much they fought.",
      },
      {
        id: 'rr4',
        text: "Which of these would hurt the most coming from me?",
        options: [
          "'You always do this...' (attacking your character)",
          "'Whatever, I don't care' (shutting down completely)",
          "'Yeah right...' with an eye roll (contempt)",
          "'Well maybe if YOU hadn't...' (getting defensive)",
        ],
        researchNote: "These are Gottman's 'Four Horsemen' — 4 communication patterns that predict divorce with over 90% accuracy. Contempt is the single strongest predictor.",
      },
      {
        id: 'rr5',
        text: "What matters more for us long-term?",
        options: [
          "Having a deep friendship underneath everything",
          "Being physically attracted and keeping the spark alive",
          "Sharing the same goals and values",
          "Being able to laugh together no matter what",
        ],
        researchNote: "Gottman found that the foundation of lasting love is deep friendship with mutual respect — not passion or conflict skills. Happy couples kept a 5:1 ratio of positive to negative interactions.",
      },
    ],
  },
  {
    id: 'long-distance-round',
    title: 'The Long Distance Round',
    emoji: '📱',
    description: 'The ache, the wait, the everything in between',
    color: '#7EB8D8',
    questions: [
      {
        id: 'ldq1',
        text: "What's the hardest part of our day to do alone?",
        options: [
          "Morning — waking up without you hits different",
          "Meals — eating alone when I'd rather be across from you",
          "Nighttime — the quiet before sleep is the loneliest",
          "Random moments — something funny happens and you're the only person I want to tell",
        ],
      },
      {
        id: 'ldq2',
        text: "If you could teleport to me for exactly one hour right now, what are we doing?",
        options: [
          "Nothing special — just existing in the same room",
          "Going to that one spot we always talk about",
          "Cooking something together and making a mess",
          "Honestly? Just sitting close. That's enough.",
        ],
      },
      {
        id: 'ldq3',
        text: "What's the most creative way you've almost booked a spontaneous flight to see me?",
        options: [
          "I've had the checkout page open more times than I'll admit",
          "I've never gotten that far but I've thought about it",
          "I literally had to close the app and talk myself down",
          "I haven't yet but this question is giving me ideas",
        ],
      },
      {
        id: 'ldq4',
        text: "What's something you've learned about yourself because of the distance?",
        options: [
          "I'm more patient than I thought",
          "I need words more than I realized",
          "I can handle harder things than I expected",
          "I learned that missing someone is its own kind of closeness",
        ],
      },
      {
        id: 'ldq5',
        text: "What's your go-to move when you miss me and can't call?",
        options: [
          "Scroll through our old texts and screenshots",
          "Listen to a song that reminds me of you",
          "Send you something random so you know I'm thinking of you",
          "Zone out and just... think about you for a bit",
        ],
      },
    ],
  },
  {
    id: 'money-talks',
    title: 'Money Talks',
    emoji: '💰',
    description: 'The conversation nobody wants to start but everybody needs',
    color: '#8DAE8B',
    questions: [
      {
        id: 'mt1',
        text: "What's the most you'd spend on something dumb that made you happy?",
        options: [
          "Under $20 — I'm practical even with fun money",
          "$20-50 — treat yourself but within reason",
          "$50-100 — life's short, buy the thing",
          "Over $100 — if it sparks joy, it's not dumb",
        ],
      },
      {
        id: 'mt2',
        text: "When it comes to money, which one are you?",
        options: [
          "The spreadsheet person — I know where every dollar goes",
          "The \"vibes\" person — it works out somehow",
          "Somewhere in between — I budget the big stuff, wing the small stuff",
          "I don't want to answer this question and that's probably the answer",
        ],
      },
      {
        id: 'mt3',
        text: "What's a non-negotiable thing you'd always spend money on, even when broke?",
        options: [
          "Good food — I refuse to eat sad meals",
          "Experiences — concerts, trips, adventures",
          "Gifts for people I love",
          "Something just for me — self-care isn't optional",
        ],
      },
    ],
  },
]

export default quizPacks
