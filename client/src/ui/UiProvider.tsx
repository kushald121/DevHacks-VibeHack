import { useEffect, useState } from 'react'
import { applyThemePalette, applyUiSpec } from './applyUi'
import { loadUiSpec, type UiSpec } from './loadUi'
import { UiContext } from './UiContext'

const STORAGE_KEY = 'csi-ui-theme'

function readStoredMode(): 'light' | 'dark' | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'dark' || v === 'light') return v
  } catch {
    /* ignore */
  }
  return null
}

export function UiProvider({ children }: { children: React.ReactNode }) {
  const [ui, setUi] = useState<UiSpec | null>(null)
  const [mode, setMode] = useState<'light' | 'dark'>(() => readStoredMode() ?? 'light')

  useEffect(() => {
    loadUiSpec()
      .then((spec) => {
        setUi(spec)
        applyUiSpec(spec)
        const defaultMode = spec.theme?.mode === 'dark' ? 'dark' : 'light'
        const stored = readStoredMode()
        setMode(stored ?? defaultMode)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = mode
    document.documentElement.style.colorScheme = mode === 'dark' ? 'dark' : 'light'
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      /* ignore */
    }
  }, [mode])

  useEffect(() => {
    if (!ui) return
    applyThemePalette(mode, ui.tokens)
  }, [ui, mode])

  return <UiContext.Provider value={{ ui, mode, setMode }}>{children}</UiContext.Provider>
}

