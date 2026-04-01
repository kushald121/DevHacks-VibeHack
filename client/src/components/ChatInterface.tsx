import { SendHorizontal } from 'lucide-react'
import VoiceInput from './VoiceInput'

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  agent?: string
  confidence?: number
}

type Props = {
  messages: ChatMessage[]
  input: string
  loading: boolean
  tokens: number
  onInput: (value: string) => void
  onSend: () => void
}

export default function ChatInterface({ messages, input, loading, tokens, onInput, onSend }: Props) {
  return (
    <section className="ui-card">
      <div className="chat-head">
        <h3 className="ui-h3">Decision Copilot</h3>
        <span className="badge">{tokens} tokens</span>
      </div>
      <div className="chat-feed">
        {messages.map((msg) => (
          <article className={`bubble ${msg.role}`} key={msg.id}>
            {msg.agent ? <span className="badge">{msg.agent}</span> : null}
            {msg.confidence ? <span className="confidence">{msg.confidence}%</span> : null}
            <p>{msg.text}</p>
            {msg.role === 'assistant' ? (
              <div className="action-row">
                <button className="ui-btn ui-btn--ghost" type="button">Refine</button>
                <button className="ui-btn ui-btn--primary" type="button">Continue</button>
                <button className="ui-btn ui-btn--ghost" type="button">Ask More</button>
              </div>
            ) : null}
          </article>
        ))}
        {loading ? <p className="loading">Running Synthesis Agent...</p> : null}
      </div>
      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => onInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSend()}
          placeholder="Ask your decision question..."
        />
        <VoiceInput onTranscript={onInput} />
        <button className="ui-btn ui-btn--primary ui-btn--icon" type="button" onClick={onSend} aria-label="Send">
          <SendHorizontal size={16} />
        </button>
      </div>
    </section>
  )
}
