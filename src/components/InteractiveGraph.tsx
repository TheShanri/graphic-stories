import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

export type StoryGraph = {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

type GraphNode = {
  id: string
  label: string
  group?: string
}

type GraphEdge = {
  source: string
  target: string
  relationship?: string
}

type PositionedNode = GraphNode & {
  x: number
  y: number
  vx: number
  vy: number
  isFixed?: boolean
}

type Props = {
  graph: StoryGraph
}

const GRAPH_WIDTH = 760
const GRAPH_HEIGHT = 480
const NODE_RADIUS = 18
const REPULSION_STRENGTH = 1800
const SPRING_STRENGTH = 0.02
const SPRING_DISTANCE = 140
const CENTERING_STRENGTH = 0.0025
const VELOCITY_DECAY = 0.92
const UPDATE_INTERVAL = 40

const NODE_COLORS: Record<string, string> = {
  royalty: '#ffb347',
  nobility: '#a3d5ff',
  supernatural: '#d08bff',
  scholar: '#8fffe0',
  court: '#ff9ab5',
  spirits: '#b9fffc',
  mages: '#ffd8a8',
  islander: '#8dd87a',
}

const DEFAULT_NODE_COLOR = '#f2f2f2'

const createInitialNodes = (graph: StoryGraph): PositionedNode[] => {
  const centerX = GRAPH_WIDTH / 2
  const centerY = GRAPH_HEIGHT / 2
  const radius = Math.min(centerX, centerY) * 0.6
  const total = Math.max(1, graph.nodes.length)
  return graph.nodes.map((node, index) => {
    const angle = (index / total) * Math.PI * 2
    return {
      ...node,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      vx: 0,
      vy: 0,
    }
  })
}

function InteractiveGraph({ graph }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const dragState = useRef<{ nodeId: string; pointerId: number } | null>(null)
  const [positions, setPositions] = useState<PositionedNode[]>(() => {
    const seeded = createInitialNodes(graph)
    return seeded.map((node) => ({ ...node }))
  })
  const nodesRef = useRef<PositionedNode[]>(positions)

  useEffect(() => {
    const seeded = createInitialNodes(graph)
    nodesRef.current = seeded
    setPositions(seeded.map((node) => ({ ...node })))

    if (!graph.nodes.length) {
      return
    }

    const nodeIndex = new Map(seeded.map((node, index) => [node.id, index]))
    const links = graph.edges
      .map((edge) => {
        const sourceIndex = nodeIndex.get(edge.source)
        const targetIndex = nodeIndex.get(edge.target)
        if (sourceIndex === undefined || targetIndex === undefined) {
          return null
        }
        return { sourceIndex, targetIndex }
      })
      .filter((link): link is { sourceIndex: number; targetIndex: number } => Boolean(link))

    let frameId: number
    let lastUpdate = 0

    const applyForce = (node: PositionedNode, fx: number, fy: number) => {
      if (node.isFixed) {
        return
      }
      node.vx += fx
      node.vy += fy
    }

    const tick = (timestamp: number) => {
      const nodes = nodesRef.current

      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i]
          const b = nodes[j]
          const dx = b.x - a.x
          const dy = b.y - a.y
          const distSq = dx * dx + dy * dy + 0.01
          const distance = Math.sqrt(distSq)
          const force = REPULSION_STRENGTH / distSq
          const fx = (dx / distance) * force
          const fy = (dy / distance) * force
          applyForce(a, -fx, -fy)
          applyForce(b, fx, fy)
        }
      }

      links.forEach(({ sourceIndex, targetIndex }) => {
        const source = nodes[sourceIndex]
        const target = nodes[targetIndex]
        const dx = target.x - source.x
        const dy = target.y - source.y
        const distance = Math.max(Math.sqrt(dx * dx + dy * dy), 0.01)
        const delta = distance - SPRING_DISTANCE
        const force = SPRING_STRENGTH * delta
        const fx = (dx / distance) * force
        const fy = (dy / distance) * force
        applyForce(source, fx, fy)
        applyForce(target, -fx, -fy)
      })

      nodes.forEach((node) => {
        applyForce(node, (GRAPH_WIDTH / 2 - node.x) * CENTERING_STRENGTH, (GRAPH_HEIGHT / 2 - node.y) * CENTERING_STRENGTH)
      })

      nodes.forEach((node) => {
        if (node.isFixed) {
          return
        }
        node.vx *= VELOCITY_DECAY
        node.vy *= VELOCITY_DECAY
        node.x += node.vx
        node.y += node.vy
        node.x = Math.max(NODE_RADIUS, Math.min(GRAPH_WIDTH - NODE_RADIUS, node.x))
        node.y = Math.max(NODE_RADIUS, Math.min(GRAPH_HEIGHT - NODE_RADIUS, node.y))
      })

      if (timestamp - lastUpdate > UPDATE_INTERVAL) {
        setPositions(nodes.map((node) => ({ ...node })))
        lastUpdate = timestamp
      }

      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frameId)
    }
  }, [graph])

  const positionLookup = useMemo(() => new Map(positions.map((node) => [node.id, node])), [positions])

  const toGraphCoordinates = (event: ReactPointerEvent<SVGGElement>) => {
    if (!svgRef.current) {
      return { x: 0, y: 0 }
    }
    const bounds = svgRef.current.getBoundingClientRect()
    const scaleX = GRAPH_WIDTH / bounds.width
    const scaleY = GRAPH_HEIGHT / bounds.height
    return {
      x: (event.clientX - bounds.left) * scaleX,
      y: (event.clientY - bounds.top) * scaleY,
    }
  }

  const updateDraggedNode = (event: ReactPointerEvent<SVGGElement>) => {
    const state = dragState.current
    if (!state || state.pointerId !== event.pointerId) {
      return
    }
    const node = nodesRef.current.find((item) => item.id === state.nodeId)
    if (!node) {
      return
    }
    const { x, y } = toGraphCoordinates(event)
    node.x = x
    node.y = y
    node.vx = 0
    node.vy = 0
    node.isFixed = true
    setPositions(nodesRef.current.map((entry) => ({ ...entry })))
  }

  const handlePointerDown = (event: ReactPointerEvent<SVGGElement>, nodeId: string) => {
    dragState.current = { nodeId, pointerId: event.pointerId }
    event.currentTarget.setPointerCapture(event.pointerId)
    updateDraggedNode(event)
  }

  const handlePointerMove = (event: ReactPointerEvent<SVGGElement>) => {
    updateDraggedNode(event)
  }

  const handlePointerUp = (event: ReactPointerEvent<SVGGElement>) => {
    const state = dragState.current
    if (!state || state.pointerId !== event.pointerId) {
      return
    }
    const node = nodesRef.current.find((item) => item.id === state.nodeId)
    if (node) {
      node.isFixed = false
    }
    dragState.current = null
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return (
    <svg ref={svgRef} viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`} role="presentation">
      <g className="graph-links" stroke="rgba(255,255,255,0.45)" strokeWidth={1.5}>
        {graph.edges.map((edge) => {
          const source = positionLookup.get(edge.source)
          const target = positionLookup.get(edge.target)
          if (!source || !target) {
            return null
          }
          const key = `${edge.source}-${edge.target}`
          const midX = (source.x + target.x) / 2
          const midY = (source.y + target.y) / 2
          const angle = (Math.atan2(target.y - source.y, target.x - source.x) * 180) / Math.PI
          return (
            <g key={key}>
              <line x1={source.x} y1={source.y} x2={target.x} y2={target.y}>
                {edge.relationship && <title>{edge.relationship}</title>}
              </line>
              {edge.relationship ? (
                <text
                  x={midX}
                  y={midY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${angle}, ${midX}, ${midY})`}
                  fill="rgba(255,255,255,0.85)"
                  fontSize={10}
                  pointerEvents="none"
                >
                  {edge.relationship}
                </text>
              ) : null}
            </g>
          )
        })}
      </g>
      <g className="graph-nodes" fill="rgba(255,255,255,0.9)" fontSize={12}>
        {positions.map((node) => (
          <g
            key={node.id}
            transform={`translate(${node.x}, ${node.y})`}
            onPointerDown={(event) => handlePointerDown(event, node.id)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerUp}
            style={{ cursor: 'grab' }}
          >
            <circle
              r={NODE_RADIUS}
              fill={NODE_COLORS[node.group ?? ''] ?? DEFAULT_NODE_COLOR}
              stroke="rgba(0,0,0,0.35)"
              strokeWidth={1.5}
            >
              <title>{node.label}</title>
            </circle>
            <text y={NODE_RADIUS + 16} textAnchor="middle">
              {node.label}
            </text>
          </g>
        ))}
      </g>
    </svg>
  )
}

export default InteractiveGraph
