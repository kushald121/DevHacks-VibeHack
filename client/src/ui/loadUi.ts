export type UiSpec = {
  theme?: { name?: string; mode?: 'light' | 'dark' }
  tokens: {
    color: {
      brand: Record<string, string>
      neutral: Record<string, string>
      semantic?: Record<string, string>
      background?: Record<string, string>
    }
    typography: {
      fontFamily: Record<string, string>
      fontWeight: Record<string, number>
      fontSize: Record<string, string>
      lineHeight: Record<string, number>
      letterSpacing: Record<string, string>
    }
    spacing: Record<string, string>
    layout: Record<string, string>
    borderRadius: Record<string, string>
    shadow: Record<string, string>
    breakpoints: Record<string, string>
  }
}

let cached: UiSpec | null = null

export async function loadUiSpec(): Promise<UiSpec> {
  if (cached) return cached
  const res = await fetch('/ui.json')
  if (!res.ok) throw new Error(`Failed to load ui.json (${res.status})`)
  cached = (await res.json()) as UiSpec
  return cached
}
