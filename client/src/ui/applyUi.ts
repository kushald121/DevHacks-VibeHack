import type { UiSpec } from './loadUi'

function setVar(name: string, value: string | number | undefined) {
  if (value === undefined) return
  document.documentElement.style.setProperty(name, String(value))
}

/** Neutrals + shadows are theme-dependent; use applyThemePalette so dark mode wins over ui.json light tokens. */
export function applyThemePalette(mode: 'light' | 'dark', tokens: UiSpec['tokens']) {
  const n = tokens.color.neutral
  if (mode === 'light') {
    setVar('--ui-neutral-surface', n.surface)
    setVar('--ui-neutral-offwhite', n['off-white'])
    setVar('--ui-neutral-ink', n.ink)
    setVar('--ui-neutral-black', n.black)
    setVar('--ui-neutral-border', n.border)
    setVar('--ui-neutral-muted', n.muted)
    setVar('--ui-neutral-subtle', n.subtle)
    setVar('--ui-elevated', '#ffffff')
    setVar('--ui-text-primary', n.black)
    setVar('--ui-shadow-sm', tokens.shadow.sm)
    setVar('--ui-shadow-md', tokens.shadow.md)
    setVar('--ui-shadow-lg', tokens.shadow.lg)
    setVar('--ui-shadow-press', '2px 2px 0px #000000')
  } else {
    setVar('--ui-neutral-surface', '#141414')
    setVar('--ui-neutral-offwhite', '#0c0c0c')
    setVar('--ui-neutral-ink', '#f2f2ee')
    setVar('--ui-neutral-black', '#0a0a0a')
    setVar('--ui-neutral-border', '#3d3d3d')
    setVar('--ui-neutral-muted', '#242424')
    setVar('--ui-neutral-subtle', '#9a9a94')
    setVar('--ui-elevated', '#1c1c1c')
    setVar('--ui-text-primary', '#f2f2ee')
    setVar('--ui-shadow-sm', '3px 3px 0px rgba(0,0,0,0.85)')
    setVar('--ui-shadow-md', '4px 4px 0px rgba(0,0,0,0.85)')
    setVar('--ui-shadow-lg', '6px 6px 0px rgba(0,0,0,0.85)')
    setVar('--ui-shadow-press', '2px 2px 0px rgba(0,0,0,0.9)')
  }
}

export function applyUiSpec(ui: UiSpec) {
  const { tokens } = ui

  setVar('--ui-brand-primary', tokens.color.brand.primary)
  setVar('--ui-brand-secondary', tokens.color.brand.secondary)

  setVar('--ui-success', tokens.color.semantic?.success)
  setVar('--ui-warning', tokens.color.semantic?.warning)
  setVar('--ui-error', tokens.color.semantic?.error)
  setVar('--ui-info', tokens.color.semantic?.info)

  setVar('--ui-font-display', tokens.typography.fontFamily.display)
  setVar('--ui-font-heading', tokens.typography.fontFamily.heading)
  setVar('--ui-font-body', tokens.typography.fontFamily.body)
  setVar('--ui-font-mono', tokens.typography.fontFamily.mono)
  setVar('--ui-font-label', tokens.typography.fontFamily.label)

  setVar('--ui-container-max', tokens.layout.containerMaxWidth)
  setVar('--ui-container-pad', tokens.layout.containerPadding)
  setVar('--ui-card-pad', tokens.layout.cardPadding)
  setVar('--ui-grid-gutter', tokens.layout.gridGutter)
  setVar('--ui-gap-section', tokens.layout.sectionGap)

  setVar('--ui-radius-md', tokens.borderRadius.md)
  setVar('--ui-radius-lg', tokens.borderRadius.lg)
  setVar('--ui-radius-pill', tokens.borderRadius.pill)

  setVar('--ui-text-xs', tokens.typography.fontSize.xs)
  setVar('--ui-text-sm', tokens.typography.fontSize.sm)
  setVar('--ui-text-base', tokens.typography.fontSize.base)
  setVar('--ui-text-lg', tokens.typography.fontSize.lg)
  setVar('--ui-text-2xl', tokens.typography.fontSize['2xl'])
  setVar('--ui-text-4xl', tokens.typography.fontSize['4xl'])
  setVar('--ui-lh-normal', tokens.typography.lineHeight.normal)
  setVar('--ui-ls-wide', tokens.typography.letterSpacing.wide)
}

