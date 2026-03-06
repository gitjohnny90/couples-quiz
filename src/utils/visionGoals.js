/**
 * Create a new goal object.
 * @returns {object|null} goal object, or null if title is empty
 */
export function createGoal(categoryId, title, playerId, id, dateNow = new Date()) {
  if (!title?.trim()) return null
  return {
    id,
    category: categoryId,
    title: title.trim(),
    status: 'dreaming',
    createdBy: playerId,
    createdAt: dateNow.toISOString(),
    achievedAt: null,
  }
}

/**
 * Update a goal's status within a goals array.
 * Sets achievedAt when status becomes 'achieved', clears it otherwise.
 */
export function updateGoalStatus(goals, goalId, newStatus, dateNow = new Date()) {
  return goals.map(g =>
    g.id === goalId
      ? { ...g, status: newStatus, achievedAt: newStatus === 'achieved' ? dateNow.toISOString() : null }
      : g
  )
}

/**
 * Remove a goal from the goals array.
 */
export function deleteGoal(goals, goalId) {
  return goals.filter(g => g.id !== goalId)
}
