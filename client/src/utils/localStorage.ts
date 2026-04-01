export type SavedDecision = {
  id: string
  title: string
  input: string
  createdAt: string
}

const STORAGE_KEY = 'decision_copilot_history'

export function readDecisionHistory(): SavedDecision[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SavedDecision[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeDecisionHistory(items: SavedDecision[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function saveDecision(item: SavedDecision): SavedDecision[] {
  const next = [item, ...readDecisionHistory()].slice(0, 50)
  writeDecisionHistory(next)
  return next
}

export function deleteDecision(id: string): SavedDecision[] {
  const next = readDecisionHistory().filter((item) => item.id !== id)
  writeDecisionHistory(next)
  return next
}
