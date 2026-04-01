const ORDER: { key: string; label: string; icon: string }[] = [
  { key: 'breakdown', label: 'Breakdown Agent', icon: '🔍' },
  { key: 'research', label: 'Research Agent', icon: '🌐' },
  { key: 'framework', label: 'Framework Agent', icon: '📊' },
  { key: 'redTeam', label: 'Red Team Agent', icon: '⚔️' },
  { key: 'synthesis', label: 'Synthesis Agent', icon: '✨' },
]

type Props = {
  outputs: Record<string, string>
}

/** Strip mermaid block for inline preview in synthesis row (full text still in details). */
function stripMermaid(text: string) {
  return text.replace(/```mermaid[\s\S]*?```/gi, '').trim()
}

export default function AgentOutputsPanel({ outputs }: Props) {
  const hasAny = ORDER.some(({ key }) => outputs[key]?.trim())
  if (!hasAny) return null

  return (
    <section className="ui-card agent-outputs">
      <h3 className="ui-h3">Detailed agent outputs</h3>
      <p className="ui-muted" style={{ marginTop: 0 }}>
        Full Markdown-style responses from each pipeline step (streamed from the backend).
      </p>
      <div className="agent-outputs-list">
        {ORDER.map(({ key, label, icon }) => {
          const raw = outputs[key]?.trim()
          if (!raw) return null
          const preview = stripMermaid(raw).slice(0, 220)
          const hasMore = raw.length > preview.length || raw.includes('```mermaid')
          return (
            <details className="agent-output-details" key={key} open={key === 'synthesis'}>
              <summary className="agent-output-summary">
                <span className="agent-output-summary__title">
                  {icon} {label}
                </span>
                {hasMore ? <span className="agent-output-summary__hint">{preview}{preview.length >= 220 ? '…' : ''}</span> : null}
              </summary>
              <div className="agent-output-body">{raw}</div>
            </details>
          )
        })}
      </div>
    </section>
  )
}
