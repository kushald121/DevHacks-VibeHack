import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AgentProgress, { type AgentStatus } from '../components/AgentProgress'
import ChatInterface, { type ChatMessage } from '../components/ChatInterface'
import DecisionHistory from '../components/DecisionHistory'
import AgentOutputsPanel from '../components/AgentOutputsPanel'
import FlowchartViewer from '../components/FlowchartViewer'
import MainLayout from '../layouts/MainLayout'
import { DecisionApiError, fetchTimeline, healthCheck, runWorkflowStream } from '../api/decisionApi'
import { deleteDecision, readDecisionHistory, saveDecision, type SavedDecision } from '../utils/localStorage'
import { DEFAULT_FLOW_FALLBACK, extractMermaidFromSynthesis } from '../utils/mermaidExtract'
import { getOrCreateSessionId } from '../utils/sessionId'

const demoScenarios = [
  { id: 1, title: 'Student: Gap Year Decision', input: 'Should I take a gap year to travel and find myself?', scenario: 'gap_year' as const },
  { id: 2, title: 'Founder: B2B to B2C Pivot', input: 'Should we pivot from B2B SaaS to B2C marketplace?', scenario: 'founder_path' as const },
  { id: 3, title: 'Professional: Job Offer Comparison', input: 'I have 2 job offers - Tech startup vs FAANG. Which should I choose?', scenario: 'career_switch' as const },
]

const initialAgents: AgentStatus[] = [
  { id: 'breakdown', name: 'Breakdown Agent', icon: '🔍', state: 'waiting' },
  { id: 'research', name: 'Research Agent', icon: '🌐', state: 'waiting' },
  { id: 'framework', name: 'Framework Agent', icon: '📊', state: 'waiting' },
  { id: 'redteam', name: 'Red Team Agent', icon: '⚔️', state: 'waiting' },
  { id: 'synthesis', name: 'Synthesis Agent', icon: '✨', state: 'waiting' },
]

function backendAgentToUi(agent: string): string {
  if (agent === 'redTeam') return 'redteam'
  return agent
}

type RiskLevel = 'low' | 'medium' | 'high'

function asRisk(r: string): RiskLevel {
  const x = r.toLowerCase()
  if (x === 'high' || x === 'medium' || x === 'low') return x
  return 'medium'
}

function formatTimelineBlock(data: Record<string, unknown> | null): string {
  if (!data || typeof data !== 'object') return ''
  const parts: string[] = []
  for (const key of ['immediate', 'shortTerm', 'mediumTerm', 'longTerm']) {
    const v = data[key]
    if (v == null) continue
    if (typeof v === 'object' && v !== null && 'impacts' in v && Array.isArray((v as { impacts: unknown }).impacts)) {
      parts.push(`${key}: ${(v as { impacts: string[] }).impacts.join('; ')}`)
    } else {
      parts.push(`${key}: ${JSON.stringify(v)}`)
    }
  }
  return parts.join('\n\n') || JSON.stringify(data, null, 2)
}

export default function ChatPage() {
  const sessionId = useMemo(() => getOrCreateSessionId(), [])
  const streamRef = useRef<AbortController | null>(null)
  const lastQuestionRef = useRef('')

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [agents, setAgents] = useState<AgentStatus[]>(initialAgents)
  const [history, setHistory] = useState<SavedDecision[]>(() => readDecisionHistory())
  const [selectedScenario, setSelectedScenario] = useState<number>(1)
  const [timelineMonth, setTimelineMonth] = useState(6)
  const [flowChart, setFlowChart] = useState(DEFAULT_FLOW_FALLBACK)
  const [fallbackNodeMeta, setFallbackNodeMeta] = useState<{
    title: string
    confidence: number
    risk: RiskLevel
    reasoning: string
  }>({
    title: 'Insight',
    confidence: 72,
    risk: 'medium',
    reasoning: 'Open a node to explore reasoning from the latest synthesis.',
  })
  const [timelineInsight, setTimelineInsight] = useState<string>('')
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [backendOk, setBackendOk] = useState<boolean | null>(null)
  const [agentOutputs, setAgentOutputs] = useState<Record<string, string>>({})

  const totalTokens = useMemo(() => agents.reduce((sum, a) => sum + (a.tokens ?? 0), 0), [agents])

  useEffect(() => {
    healthCheck()
      .then(() => setBackendOk(true))
      .catch(() => setBackendOk(false))
  }, [])

  const refreshTimeline = useCallback(
    async (decision: string) => {
      if (!decision.trim()) return
      setTimelineLoading(true)
      try {
        const data = await fetchTimeline(sessionId, decision)
        setTimelineInsight(formatTimelineBlock(data))
      } catch {
        setTimelineInsight('')
      } finally {
        setTimelineLoading(false)
      }
    },
    [sessionId],
  )

  useEffect(() => {
    const q = lastQuestionRef.current
    if (!q) return
    const t = window.setTimeout(() => {
      void refreshTimeline(`${q} (horizon: ${timelineMonth} months)`)
    }, 400)
    return () => window.clearTimeout(t)
  }, [timelineMonth, refreshTimeline])

  const onSend = useCallback(async () => {
    if (!input.trim() || loading) return

    streamRef.current?.abort()
    const ac = new AbortController()
    streamRef.current = ac

    const question = input.trim()
    lastQuestionRef.current = question
    const scenarioRow = demoScenarios.find((s) => s.id === selectedScenario)

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', text: question }])
    setInput('')
    setLoading(true)
    setAgentOutputs({})
    setAgents(initialAgents.map((a) => ({ ...a, state: 'waiting' as const, tokens: undefined, eta: undefined })))

    let synthesisContent = ''
    let workflowMeta = { confidence: 72, riskLevel: 'medium' }

    try {
      await runWorkflowStream(
        {
          session_id: sessionId,
          input: question,
          demo_scenario: scenarioRow?.scenario ?? null,
        },
        (ev) => {
          if (ev.type === 'agent_start') {
            const id = backendAgentToUi(ev.agent)
            setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, state: 'running', eta: undefined } : a)))
          }
          if (ev.type === 'agent_complete') {
            const id = backendAgentToUi(ev.agent)
            setAgents((prev) =>
              prev.map((a) => (a.id === id ? { ...a, state: 'complete', tokens: ev.tokens, eta: undefined } : a)),
            )
            setAgentOutputs((prev) => ({ ...prev, [ev.agent]: ev.content }))
            if (ev.agent === 'synthesis') synthesisContent = ev.content
          }
          if (ev.type === 'workflow_complete') {
            workflowMeta = { confidence: ev.confidence, riskLevel: ev.riskLevel }
          }
        },
        { signal: ac.signal },
      )

      const { chart, plainText } = extractMermaidFromSynthesis(synthesisContent)
      const display = plainText || synthesisContent.replace(/```mermaid[\s\S]*?```/gi, '').trim() || 'Analysis complete.'

      setFlowChart(chart.trim() ? chart : DEFAULT_FLOW_FALLBACK)
      setFallbackNodeMeta({
        title: 'Branch',
        confidence: workflowMeta.confidence,
        risk: asRisk(workflowMeta.riskLevel),
        reasoning: display.slice(0, 1200) + (display.length > 1200 ? '…' : ''),
      })

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: display.slice(0, 12000) + (display.length > 12000 ? '…' : ''),
          agent: 'Synthesis Agent',
          confidence: workflowMeta.confidence,
        },
      ])

      setHistory(saveDecision({ id: crypto.randomUUID(), title: question.slice(0, 38), input: question, createdAt: new Date().toISOString() }))
      void refreshTimeline(`${question} (horizon: ${timelineMonth} months)`)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      if (ac.signal.aborted) return

      const msg =
        err instanceof DecisionApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Request failed'
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', text: `Could not reach the decision engine: ${msg}. Is the backend running on port 8000?` },
      ])
      setAgents((prev) => prev.map((a) => (a.state === 'running' ? { ...a, state: 'error' as const, eta: undefined } : a)))
    } finally {
      setLoading(false)
      streamRef.current = null
    }
  }, [input, loading, sessionId, selectedScenario, timelineMonth, refreshTimeline])

  return (
    <MainLayout
      right={(
        <>
          <section className="ui-card">
            <h3 className="ui-h3">Demo</h3>
            <p className="ui-muted" style={{ marginTop: 0 }}>
              Backend: {backendOk === null ? '…' : backendOk ? 'connected' : 'offline (run uvicorn in /backend)'}
            </p>
            <div className="ui-row">
              <select className="ui-input" value={selectedScenario} onChange={(e) => setSelectedScenario(Number(e.target.value))}>
                {demoScenarios.map((sc) => <option key={sc.id} value={sc.id}>{sc.title}</option>)}
              </select>
              <button className="ui-btn ui-btn--primary" type="button" onClick={() => setInput(demoScenarios.find((s) => s.id === selectedScenario)?.input ?? '')}>Try Demo</button>
            </div>
          </section>
          <DecisionHistory history={history} onLoad={(item) => setInput(item.input)} onDelete={(id) => setHistory(deleteDecision(id))} />
          <AgentProgress agents={agents} />
        </>
      )}
    >
      <section className="ui-hero">
        <p className="ui-kicker">Premium Workspace</p>
        <h1 className="ui-h1">Make high-stakes decisions with confidence.</h1>
        <p className="ui-muted">Each agent returns a long structured report; default model is GPT-3.5 Turbo via OpenRouter (set in backend <code className="ui-code">OPENROUTER_MODEL</code>).</p>
        <div className="ui-chiprow">
          <span className="ui-chip">Live Agent Pipeline</span>
          <span className="ui-chip">SSE Progress</span>
          <span className="ui-chip">Timeline API</span>
        </div>
      </section>
      <ChatInterface messages={messages} input={input} loading={loading} tokens={totalTokens} onInput={setInput} onSend={onSend} />
      <AgentOutputsPanel outputs={agentOutputs} />
      <section className="ui-card">
        <h3 className="ui-h3">Timeline View</h3>
        <input className="ui-range" type="range" min="1" max="24" value={timelineMonth} onChange={(e) => setTimelineMonth(Number(e.target.value))} />
        <p className="ui-muted">Impact horizon: {timelineMonth} months — {timelineLoading ? 'Updating…' : 'from /api/decision/timeline'}</p>
        {timelineInsight ? <pre className="timeline-pre">{timelineInsight}</pre> : null}
      </section>
      <FlowchartViewer
        chart={flowChart}
        nodeInfo={{}}
        fallbackNodeInfo={{
          title: fallbackNodeMeta.title,
          confidence: fallbackNodeMeta.confidence,
          risk: fallbackNodeMeta.risk,
          reasoning: fallbackNodeMeta.reasoning,
        }}
      />
    </MainLayout>
  )
}
