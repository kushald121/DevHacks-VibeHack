import { useState } from 'react'
import MainLayout from '../layouts/MainLayout'
import { compareOptions, DecisionApiError } from '../api/decisionApi'
import { getOrCreateSessionId } from '../utils/sessionId'

export default function ComparePage() {
  const [sessionId] = useState(() => getOrCreateSessionId())
  const [optionA, setOptionA] = useState('Remote-first startup role')
  const [optionB, setOptionB] = useState('Big tech on-site offer')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const runCompare = async () => {
    if (!optionA.trim() || !optionB.trim()) return
    setLoading(true)
    setError('')
    setResult('')
    try {
      const text = await compareOptions(sessionId, optionA.trim(), optionB.trim())
      setResult(text)
    } catch (e) {
      setError(e instanceof DecisionApiError ? e.message : e instanceof Error ? e.message : 'Compare failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout
      right={(
        <>
          <section className="ui-card">
            <h3 className="ui-h3">Comparison Mode</h3>
            <p className="ui-muted">Uses <code className="ui-code">POST /api/decision/compare</code> with your session context.</p>
          </section>
          <section className="ui-card">
            <h3 className="ui-h3">Quick Lens</h3>
            <p className="ui-muted">Run a compare after at least one chat on the home page so the session has decision context (recommended).</p>
          </section>
        </>
      )}
    >
      <section className="ui-hero">
        <p className="ui-kicker">Compare Strategies</p>
        <h1 className="ui-h1">See trade-offs before you commit.</h1>
        <p className="ui-muted">Side-by-side analysis powered by the backend comparison agent.</p>
      </section>
      <section className="ui-card">
        <h2 className="ui-h2">Decision Comparison</h2>
        <p className="ui-muted">Enter two options and run the comparison pipeline.</p>
        <div className="compare-form">
          <label className="ui-label">
            Option A
            <input className="ui-input ui-input--block" value={optionA} onChange={(e) => setOptionA(e.target.value)} />
          </label>
          <label className="ui-label">
            Option B
            <input className="ui-input ui-input--block" value={optionB} onChange={(e) => setOptionB(e.target.value)} />
          </label>
          <button className="ui-btn ui-btn--primary" type="button" disabled={loading} onClick={() => void runCompare()}>
            {loading ? 'Comparing…' : 'Compare'}
          </button>
        </div>
        {error ? <p className="error-text">{error}</p> : null}
        {result ? (
          <div className="compare-result">
            <h3 className="ui-h3">Result</h3>
            <pre className="timeline-pre">{result}</pre>
          </div>
        ) : null}
      </section>
    </MainLayout>
  )
}
