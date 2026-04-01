type NodeDetails = {
  id: string
  title: string
  reasoning: string
  confidence: number
  risk: 'low' | 'medium' | 'high'
}

type Props = {
  node: NodeDetails | null
  onClose: () => void
}

export default function InteractiveNode({ node, onClose }: Props) {
  if (!node) return null
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="ui-h3">{node.title}</h3>
        <p>{node.reasoning}</p>
        <p><strong>Confidence:</strong> {node.confidence}%</p>
        <p><strong>Risk:</strong> {node.risk}</p>
        <div className="action-row">
          <button className="ui-btn ui-btn--primary" type="button">Refine this branch</button>
          <button className="ui-btn ui-btn--ghost" type="button">Run scenario</button>
          <button className="ui-btn ui-btn--ghost" type="button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
