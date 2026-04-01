import { CheckCircle2, LoaderCircle, XCircle } from 'lucide-react'

export type AgentState = 'waiting' | 'running' | 'complete' | 'error'
export type AgentStatus = {
  id: string
  name: string
  icon: string
  state: AgentState
  tokens?: number
  eta?: string
}

type Props = {
  agents: AgentStatus[]
}

export default function AgentProgress({ agents }: Props) {
  return (
    <section className="ui-card">
      <h3 className="ui-h3">Agent Progress</h3>
      <div className="agent-list">
        {agents.map((agent) => (
          <article className="agent-row" key={agent.id}>
            <p>{agent.icon} {agent.name}</p>
            <div className="agent-meta">
              {agent.state === 'running' && <LoaderCircle className="spin" size={16} />}
              {agent.state === 'complete' && <CheckCircle2 size={16} />}
              {agent.state === 'error' && <XCircle size={16} />}
              {agent.tokens ? <span>{agent.tokens} tok</span> : null}
              {agent.eta ? <span>{agent.eta}</span> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
