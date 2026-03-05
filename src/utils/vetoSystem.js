export function createVetoSystem(storageKey) {
  function getVetoInfo() {
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return { count: 0, weekStart: Date.now() }
      const data = JSON.parse(raw)
      const weekMs = 7 * 24 * 60 * 60 * 1000
      if (Date.now() - data.weekStart > weekMs) return { count: 0, weekStart: Date.now() }
      return data
    } catch { return { count: 0, weekStart: Date.now() } }
  }

  function saveVeto() {
    const info = getVetoInfo()
    const updated = { count: info.count + 1, weekStart: info.weekStart || Date.now() }
    localStorage.setItem(storageKey, JSON.stringify(updated))
    return updated
  }

  return { getVetoInfo, saveVeto }
}
