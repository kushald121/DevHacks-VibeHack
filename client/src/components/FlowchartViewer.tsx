import mermaid from 'mermaid'
import { useEffect, useMemo, useRef, useState } from 'react'
import InteractiveNode from './InteractiveNode'
import { useUi } from '../ui/useUi'

type NodeInfo = { title: string; confidence: number; risk: 'low' | 'medium' | 'high'; reasoning: string }

type Props = {
  chart: string
  nodeInfo: Record<string, NodeInfo>
  /** Used when node label has no entry in nodeInfo (e.g. model-generated Mermaid). */
  fallbackNodeInfo?: NodeInfo
}

function escapeMermaidLabel(label: string) {
  return label.replaceAll('\\', '\\\\').replaceAll('"', '\\"')
}

function safeMermaidId(label: string) {
  const id = label
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9_]+/g, '_')
    .replaceAll(/^_+|_+$/g, '')
  const normalized = id.length ? id : 'node'
  return /^[a-z_]/.test(normalized) ? normalized : `n_${normalized}`
}

function normalizeSimpleFlowchart(chart: string) {
  const idByLabel = new Map<string, string>()
  const getId = (label: string) => {
    const key = label.trim()
    const existing = idByLabel.get(key)
    if (existing) return existing
    const base = safeMermaidId(key)
    let id = base
    let i = 2
    while ([...idByLabel.values()].includes(id)) {
      id = `${base}_${i++}`
    }
    idByLabel.set(key, id)
    return id
  }

  const lines = chart
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      // If the user already supplied explicit Mermaid node syntax, keep it.
      if (/[[(<{"]/.test(line)) return line

      // Handle: A-->B, A --> B, A-->|label|B
      const m = line.match(/^(.+?)\s*-->\s*(\|(.+?)\|\s*)?(.+?)$/)
      if (!m) return line

      const fromLabel = m[1].trim()
      const edgeLabel = (m[3] ?? '').trim()
      const toLabel = m[4].trim()

      const fromId = getId(fromLabel)
      const toId = getId(toLabel)

      const edge = edgeLabel ? `-->|${edgeLabel}|` : '-->'
      return `${fromId}["${escapeMermaidLabel(fromLabel)}"]${edge}${toId}["${escapeMermaidLabel(toLabel)}"]`
    })

  return lines.join('\n')
}

function buildMermaidSource(chart: string): string {
  const t = chart.trim()
  if (/^\s*(graph|flowchart)\s+/i.test(t)) {
    return t
  }
  return `graph TD\n${normalizeSimpleFlowchart(chart)}`
}

export default function FlowchartViewer({ chart, nodeInfo, fallbackNodeInfo }: Props) {
  const { mode } = useUi()
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [zoom, setZoom] = useState(1)
  const [activeNode, setActiveNode] = useState<{
    id: string
    title: string
    confidence: number
    risk: 'low' | 'medium' | 'high'
    reasoning: string
  } | null>(null)

  const rendered = useMemo(() => buildMermaidSource(chart), [chart])

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: mode === 'dark' ? 'dark' : 'default',
      securityLevel: 'loose',
    })
    const id = `m-${Date.now()}`
    mermaid
      .render(id, rendered)
      .then(({ svg }) => {
        if (!wrapRef.current) return
        wrapRef.current.innerHTML = svg
        wrapRef.current.querySelectorAll('.node').forEach((nodeEl) => {
          const el = nodeEl as HTMLElement
          const text = el.textContent?.trim() ?? ''
          const info = nodeInfo[text] ?? fallbackNodeInfo
          if (info) {
            el.classList.add(`risk-${info.risk}`)
            el.style.cursor = 'pointer'
            el.addEventListener('click', () =>
              setActiveNode({
                id: text,
                title: text,
                confidence: info.confidence,
                risk: info.risk,
                reasoning: info.reasoning,
              }))
          }
        })
      })
      .catch((err) => {
        if (!wrapRef.current) return
        const message = err instanceof Error ? err.message : String(err)
        wrapRef.current.innerHTML = `<pre style="white-space:pre-wrap;color:#ffb4ab;background:#1b0f10;padding:12px;border-radius:10px;border:1px solid #5b1a1c;">Mermaid render error:\n${message}\n\nInput:\n${rendered}</pre>`
      })
  }, [mode, nodeInfo, fallbackNodeInfo, rendered])

  return (
    <section className="ui-card">
      <div className="flow-head">
        <h3 className="ui-h3">Decision Flowchart</h3>
        <div className="flow-actions">
          <button className="ui-btn ui-btn--ghost ui-btn--icon" type="button" onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))} aria-label="Zoom out">-</button>
          <button className="ui-btn ui-btn--ghost ui-btn--icon" type="button" onClick={() => setZoom((z) => Math.min(2, z + 0.1))} aria-label="Zoom in">+</button>
        </div>
      </div>
      <div className="mermaid-wrap" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }} ref={wrapRef} />
      <InteractiveNode node={activeNode} onClose={() => setActiveNode(null)} />
    </section>
  )
}
