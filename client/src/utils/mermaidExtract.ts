/** Pull ```mermaid ... ``` from synthesis; return diagram body and user-visible text. */
export function extractMermaidFromSynthesis(synthesis: string): { chart: string; plainText: string } {
  const re = /```mermaid\s*([\s\S]*?)```/i
  const m = synthesis.match(re)
  const plainText = synthesis.replace(re, '').trim()
  const chart = m ? m[1].trim() : ''
  return { chart, plainText }
}

export const DEFAULT_FLOW_FALLBACK = 'Start-->Clarify Decision\nClarify Decision-->Recommendation'
