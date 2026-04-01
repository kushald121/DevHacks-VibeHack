import { createContext } from 'react'
import type { UiSpec } from './loadUi'

export type UiContextValue = {
  ui: UiSpec | null
  mode: 'light' | 'dark'
  setMode: (mode: 'light' | 'dark') => void
}

export const UiContext = createContext<UiContextValue | null>(null)

