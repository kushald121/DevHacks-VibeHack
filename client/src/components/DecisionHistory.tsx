import { Trash2 } from 'lucide-react'
import type { SavedDecision } from '../utils/localStorage'

type Props = {
  history: SavedDecision[]
  onLoad: (decision: SavedDecision) => void
  onDelete: (id: string) => void
}

export default function DecisionHistory({ history, onLoad, onDelete }: Props) {
  return (
    <section className="ui-card">
      <h3 className="ui-h3">Decision History</h3>
      <div className="history-list">
        {history.length === 0 ? <p className="ui-muted">No decisions yet. Start a new chat to build your timeline.</p> : null}
        {history.map((item) => (
          <article className="history-row" key={item.id}>
            <div className="history-content">
              <button className="ui-btn ui-btn--ghost" type="button" onClick={() => onLoad(item)}>{item.title}</button>
              <p className="ui-muted">{new Date(item.createdAt).toLocaleString()}</p>
            </div>
            <button className="ui-btn ui-btn--ghost" type="button" onClick={() => onDelete(item.id)}><Trash2 size={14} /></button>
          </article>
        ))}
      </div>
    </section>
  )
}
