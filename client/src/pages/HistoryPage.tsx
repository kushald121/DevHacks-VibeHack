import DecisionHistory from '../components/DecisionHistory'
import MainLayout from '../layouts/MainLayout'
import { deleteDecision, readDecisionHistory } from '../utils/localStorage'
import { useState } from 'react'

export default function HistoryPage() {
  const [history, setHistory] = useState(() => readDecisionHistory())

  return (
    <MainLayout
      right={(
        <section className="ui-card">
          <h3 className="ui-h3">Tips</h3>
          <p className="ui-muted">Click an item to copy it back into the Chat input.</p>
        </section>
      )}
    >
      <section className="ui-hero">
        <p className="ui-kicker">Decision Memory</p>
        <h1 className="ui-h1">Revisit previous decisions instantly.</h1>
        <p className="ui-muted">Your prompts are saved locally so you can iterate and improve outcomes with full context.</p>
      </section>
      <section className="ui-card">
        <h2 className="ui-h2">History</h2>
        <p className="ui-muted">Stored locally in your browser.</p>
      </section>
      <DecisionHistory
        history={history}
        onLoad={(item) => {
          navigator.clipboard?.writeText(item.input).catch(() => {})
        }}
        onDelete={(id) => setHistory(deleteDecision(id))}
      />
    </MainLayout>
  )
}

