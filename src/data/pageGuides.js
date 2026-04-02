// First-visit tooltip content for every page in the app.
// Each key matches the pageKey passed to <PageGuide pageKey="...">

const pageGuides = {
  vault: {
    title: 'Your Quiz Vault',
    lines: [
      'This is your home base — everything you and your partner can do together lives here.',
      'Tap any section to jump in. You\'ll see progress badges so you know what you\'ve tried and what\'s new.',
      'Both of you answer separately, then compare — no peeking!'
    ]
  },
  quizPacks: {
    title: 'Quiz Packs',
    lines: [
      'Each pack is a set of fun questions about your tastes, habits, and preferences.',
      'You each answer on your own, then see how many you matched. It\'s not about getting it "right" — it\'s about learning what makes you both tick.'
    ]
  },
  quiz: {
    title: 'Quiz Time',
    lines: [
      'Pick the answer that fits YOU best. Your partner answers the same questions separately.',
      'Once you\'re both done, you\'ll see your results side by side — matches, surprises, and all.'
    ]
  },
  results: {
    title: 'Your Results',
    lines: [
      'Here\'s how your answers compare! Matching answers are highlighted.',
      'Long-press on any answer to leave an emoji reaction for your partner to see.'
    ]
  },
  deepDive: {
    title: 'Deep Dive',
    lines: [
      'These are open-ended conversation starters — no right or wrong answers.',
      'Pick a deck that matches your mood, write your thoughts, and then read what your partner said. It\'s a great way to understand each other on a deeper level.'
    ]
  },
  deepDiveDeck: {
    title: 'Deep Dive Deck',
    lines: [
      'Take your time with each question — write from the heart.',
      'You\'ll each answer separately, and when you\'re both done, you can read each other\'s responses. Long-press any answer to react with an emoji.'
    ]
  },
  funStuff: {
    title: 'Fun Stuff',
    lines: [
      'Games, drawing, movies, and more — this is the playful side of your relationship.',
      'Everything here is meant to be lighthearted. Jump into whatever sounds fun!'
    ]
  },
  draw: {
    title: 'Draw Together',
    lines: [
      'You\'ll each get the same drawing prompt and create your masterpiece separately.',
      'When you\'re both done, you\'ll reveal your drawings side by side. Stick figures absolutely count!'
    ]
  },
  drawResults: {
    title: 'Drawing Reveal',
    lines: [
      'Here are your drawings side by side!',
      'Long-press a drawing to leave an emoji reaction for your partner.'
    ]
  },
  movies: {
    title: 'Movie Night',
    lines: [
      'Build a shared movie list together. Spin the genre wheel for inspiration, or add your own picks.',
      'You can mark movies as want-to-watch, watching, or watched — and rate them with stars. Each of you gets 2 vetoes if something\'s a hard no!'
    ]
  },
  watchGuide: {
    title: 'Watch Guide',
    lines: [
      'A quick reference for tools that let you watch movies or shows together remotely.',
      'Each one works a little differently — find the one that fits your setup best.'
    ]
  },
  tictactoe: {
    title: 'Tic Tac Toe',
    lines: [
      'Classic tic-tac-toe, but with hearts! You and your partner take turns in real time.',
      'Your hearts are one color, theirs are another. Three in a row wins!'
    ]
  },
  heartLine: {
    title: 'Heart Line',
    lines: [
      'It\'s like Connect Four — but with hearts! Tap a column to drop your heart in. It falls to the lowest open spot.',
      'Get 4 hearts in a row to win — horizontal, vertical, or diagonal all count.',
      'Your hearts are one color, your partner\'s are another — same as tic-tac-toe. You take turns in real time, so plan your moves!'
    ]
  },
  loveNotes: {
    title: 'Love Note Hunt',
    lines: [
      'Write 3 secret love notes and hide them in a grid for your partner to find.',
      'Then you\'ll search for theirs — tap cells to hunt! When you\'re both done, all the notes are revealed together.'
    ]
  },
  predictPartner: {
    title: 'Predict Your Partner',
    lines: [
      'For each question, you answer for YOURSELF and then guess what your PARTNER would say.',
      'After you\'re both done, you\'ll reveal the predictions and mark which ones were right. It\'s a fun way to see how well you really know each other!'
    ]
  },
  finishSentence: {
    title: 'Finish My Sentence',
    lines: [
      'You write a sentence starter for your partner, and they finish it — then vice versa.',
      'It can be sweet, silly, or deep — whatever you\'re in the mood for. You\'ll see the completed sentences together at the end.'
    ]
  },
  hotTakes: {
    title: 'Hot Takes',
    lines: [
      'Bold statements. Do you agree or disagree? Vote on each one and see if your partner feels the same way.',
      'If you disagree on something, you can write a short defense explaining your side. No judgment — just honest opinions!'
    ]
  },
  profiles: {
    title: 'About Us',
    lines: [
      'This is your shared space — personality tests, journals, goals, and more.',
      'Everything here helps you understand yourselves as individuals and as a couple.'
    ]
  },
  personality: {
    title: 'Personality Tests',
    lines: [
      'Add your results from popular personality tests (Love Languages, MBTI, Enneagram, and more).',
      'You each fill in your own, then switch to the Compare tab to see them side by side. If you haven\'t taken a test yet, you can search for any of them online — they\'re all free!'
    ]
  },
  vision: {
    title: 'Our Vision',
    lines: [
      'Dream together! Set shared goals, build a vision board, and write letters to your future selves.',
      'This is YOUR space to imagine what you\'re building together — no pressure, just possibilities.'
    ]
  },
  journal: {
    title: 'Our Journal',
    lines: [
      'A record of everything you\'ve done together in the app — quiz answers, deep dive responses, drawings, and book reflections.',
      'Think of it as a scrapbook of your relationship. Come back anytime to revisit your favorite moments.'
    ]
  },
  studyTogether: {
    title: 'Study Together',
    lines: [
      'Pick a book to read together and track your progress as a couple.',
      'When you\'re both finished, you\'ll each write reflections about what you learned — then read each other\'s thoughts. It\'s like a mini book club for two.'
    ]
  },
  home: {
    title: 'Welcome!',
    lines: [
      'This is The Us Quiz — a place for you and your partner to learn about each other through quizzes, games, and conversations.',
      'Share your invite code with your partner so they can join your session. Once they\'re in, you\'re all set to start exploring together!'
    ]
  },
  dailyPhotos: {
    title: 'Daily Photos',
    lines: [
      'Pick a theme and take 3 photos together — one for each prompt.',
      'You can only do one section per day. After you finish, the rest unlock again at 6am tomorrow.',
      "Once you pick a theme, it locks in until you're done — no switching mid-section!"
    ]
  },
  dailyPhotoSection: {
    title: 'Your Photo Prompts',
    lines: [
      'Answer each prompt with a photo — one at a time.',
      'Add a caption if you want, then tap Add this photo to move to the next one.',
      "After you finish all 3, wait for your partner — then you'll see your photos side by side!"
    ]
  },
  dailyPhotoReveal: {
    title: 'Your Photo Board',
    lines: [
      'Both of you finished — here are your photos together!',
      'Each cork board shows one prompt with both of your photos side by side.'
    ]
  },
}

export default pageGuides
