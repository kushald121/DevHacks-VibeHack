const STORAGE_KEY = 'csi-decision-session'

export function getOrCreateSessionId(): string {
  try {
    let id = sessionStorage.getItem(STORAGE_KEY)
    if (!id) {
      id = crypto.randomUUID()
      sessionStorage.setItem(STORAGE_KEY, id)
    }
    return id
  } catch {
    return crypto.randomUUID()
  }
}

export function resetSessionId(): string {
  const id = crypto.randomUUID()
  try {
    sessionStorage.setItem(STORAGE_KEY, id)
  } catch {
    /* ignore */
  }
  return id
}
