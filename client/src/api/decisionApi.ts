const base = () => (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

async function parseJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return { raw: text }
  }
}

export type ApiErrorBody = { error?: { code?: string; message?: string }; detail?: string }

export class DecisionApiError extends Error {
  status: number
  body: unknown
  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.name = 'DecisionApiError'
    this.status = status
    this.body = body
  }
}

export async function healthCheck(): Promise<{ ok: boolean; openrouterConfigured?: boolean }> {
  const res = await fetch(`${base()}/health`)
  const data = (await parseJsonSafe(res)) as { ok?: boolean; openrouterConfigured?: boolean }
  if (!res.ok) throw new DecisionApiError('Health check failed', res.status, data)
  return { ok: Boolean(data?.ok), openrouterConfigured: data?.openrouterConfigured }
}

export type WorkflowOutputs = {
  breakdown: string
  research: string
  framework: string
  redTeam: string
  synthesis: string
}

export type RunWorkflowResponse = {
  outputs: WorkflowOutputs
  confidence: number
  riskLevel: 'low' | 'medium' | 'high' | string
  totalTokens: number
  history: unknown[]
}

export async function runWorkflow(body: {
  session_id: string
  input: string
  demo_scenario?: string | null
}): Promise<RunWorkflowResponse> {
  const res = await fetch(`${base()}/api/decision/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      session_id: body.session_id,
      input: body.input,
      demo_scenario: body.demo_scenario || undefined,
    }),
  })
  const data = await parseJsonSafe(res)
  if (!res.ok) {
    const msg =
      (data as ApiErrorBody)?.error?.message ??
      (typeof (data as ApiErrorBody)?.detail === 'string' ? (data as ApiErrorBody).detail : null) ??
      res.statusText
    throw new DecisionApiError(msg, res.status, data)
  }
  return data as RunWorkflowResponse
}

export type StreamEvent =
  | { type: 'agent_start'; agent: string }
  | { type: 'agent_complete'; agent: string; content: string; tokens: number }
  | { type: 'workflow_complete'; confidence: number; riskLevel: string; totalTokens: number }

function parseSseBlocks(buffer: string): { events: StreamEvent[]; rest: string } {
  const events: StreamEvent[] = []
  const parts = buffer.split('\n\n')
  const rest = parts.pop() ?? ''
  for (const block of parts) {
    const line = block
      .split('\n')
      .find((l) => l.startsWith('data:'))
    if (!line) continue
    const json = line.slice(5).trim()
    if (!json) continue
    try {
      events.push(JSON.parse(json) as StreamEvent)
    } catch {
      /* skip malformed chunk */
    }
  }
  return { events, rest }
}

/** SSE workflow; abort via AbortSignal. */
export async function runWorkflowStream(
  body: { session_id: string; input: string; demo_scenario?: string | null },
  onEvent: (e: StreamEvent) => void,
  options?: { signal?: AbortSignal },
): Promise<void> {
  const res = await fetch(`${base()}/api/decision/run-stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({
      session_id: body.session_id,
      input: body.input,
      demo_scenario: body.demo_scenario || undefined,
    }),
    signal: options?.signal,
  })

  if (!res.ok) {
    const data = await parseJsonSafe(res)
    const msg = (data as ApiErrorBody)?.error?.message ?? res.statusText
    throw new DecisionApiError(msg, res.status, data)
  }

  const reader = res.body?.getReader()
  if (!reader) throw new DecisionApiError('No response body', 500, null)

  const dec = new TextDecoder()
  let buf = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    const { events, rest } = parseSseBlocks(buf)
    buf = rest
    for (const e of events) onEvent(e)
  }
  if (buf.trim()) {
    const { events } = parseSseBlocks(buf + '\n\n')
    for (const e of events) onEvent(e)
  }
}

export async function fetchTimeline(sessionId: string, decision: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${base()}/api/decision/timeline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, decision }),
  })
  const data = await parseJsonSafe(res)
  if (!res.ok) {
    const msg = (data as ApiErrorBody)?.error?.message ?? res.statusText
    throw new DecisionApiError(msg, res.status, data)
  }
  return (data as { timeline?: Record<string, unknown> }).timeline ?? {}
}

export async function compareOptions(
  sessionId: string,
  optionA: string,
  optionB: string,
): Promise<string> {
  const res = await fetch(`${base()}/api/decision/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, option_a: optionA, option_b: optionB }),
  })
  const data = await parseJsonSafe(res)
  if (!res.ok) {
    const msg = (data as ApiErrorBody)?.error?.message ?? res.statusText
    throw new DecisionApiError(msg, res.status, data)
  }
  return String((data as { result?: string })?.result ?? '')
}
