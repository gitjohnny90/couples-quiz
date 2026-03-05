export function calculateMatchScore(responses, questions) {
  const p1 = responses.find((r) => r.player_id === 'player1')
  const p2 = responses.find((r) => r.player_id === 'player2')
  if (!p1 || !p2) return 0
  const p1A = p1.answers || {}
  const p2A = p2.answers || {}
  let matchCount = 0
  questions.forEach((q) => { if (p1A[q.id] === p2A[q.id]) matchCount++ })
  return matchCount
}

export function hasFinishedAll(data, questions, playerId) {
  if (!questions) return false
  return questions.every((q) =>
    data.some((r) => r.question_id === q.id && r.player_id === playerId)
  )
}
