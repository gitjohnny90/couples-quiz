const drawingPrompts = [
  { id: 'dp1', text: 'Draw your partner as an animal' },
  { id: 'dp2', text: 'Draw your dream date spot' },
  { id: 'dp3', text: 'Draw what your partner looks like when they wake up' },
  { id: 'dp4', text: "Draw your partner's most-used emoji as a real thing" },
  { id: 'dp5', text: 'Draw what your relationship looks like as a weather forecast' },
  { id: 'dp6', text: "Draw your partner's favorite snack from memory" },
  { id: 'dp7', text: 'Draw what your partner would look like as a superhero' },
  { id: 'dp8', text: 'Draw your first date from memory' },
  { id: 'dp9', text: 'Draw what your partner does when nobody is watching' },
  { id: 'dp-new-1', text: 'Draw what our FaceTime calls look like from the outside' },
  { id: 'dp-new-2', text: "Draw your partner's ideal Saturday from morning to night as a comic strip" },
  { id: 'dp-new-3', text: "Draw what your partner's brain looks like inside (label the sections)" },
  { id: 'dp-new-4', text: "Draw the house you'd build together — floor plan, yard, everything" },
  { id: 'dp-new-5', text: 'Draw your partner\'s reaction when they see you after being apart' },
]

export const drawingRoundMeta = {
  id: 'draw-together',
  title: 'Draw Together',
  emoji: '🎨',
  description: 'Same prompt, two artists, zero talent required',
}

export const DRAW_PACK_PREFIX = 'draw-'
export const getDrawPackId = (promptId) => `${DRAW_PACK_PREFIX}${promptId}`

export default drawingPrompts
