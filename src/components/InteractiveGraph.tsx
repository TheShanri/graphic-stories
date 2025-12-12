import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

export type StoryGraph = {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

type GraphNode = {
  id: string
  label: string
  group?: string
  stats?: CharacterSceneStats
}

type StatPair = {
  leftLabel: string
  rightLabel: string
  left: number
  right: number
  justification?: string
}

type CharacterSceneStats = {
  foolHero?: StatPair
  angelDemon?: StatPair
  tradAdv?: StatPair
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
  onNodeClick?: (node: PositionedNode) => void
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
const CURVE_SPACING = 22

type DecoratedEdge = GraphEdge & {
  curveIndex: number
  groupSize: number
  renderKey: string
}

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

function InteractiveGraph({ graph, onNodeClick }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const dragState = useRef<{ nodeId: string; pointerId: number } | null>(null)
  const [positions, setPositions] = useState<PositionedNode[]>(() => {
    const seeded = createInitialNodes(graph)
    return seeded.map((node) => ({ ...node }))
  })
  const nodesRef = useRef<PositionedNode[]>(positions)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [hoveredEdgeKey, setHoveredEdgeKey] = useState<string | null>(null)
  const [hoveredEdge, setHoveredEdge] = useState<{ x: number; y: number; label?: string } | null>(null)

  useEffect(() => {
    const seeded = createInitialNodes(graph)
    nodesRef.current = seeded
    setPositions(seeded.map((node) => ({ ...node })))
    setHoveredEdgeKey(null)
    setHoveredEdge(null)

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

  const decoratedEdges = useMemo<DecoratedEdge[]>(() => {
    const grouped = new Map<string, GraphEdge[]>()
    graph.edges.forEach((edge) => {
      const key = [edge.source, edge.target].sort().join('|')
      const existing = grouped.get(key) ?? []
      existing.push({ ...edge, relationship: edge.relationship ?? undefined })
      grouped.set(key, existing)
    })

    const decorated: DecoratedEdge[] = []
    grouped.forEach((edges, groupKey) => {
      const count = edges.length
      const offsets = count === 1 ? [0] : edges.map((_, index) => index - (count - 1) / 2)
      edges.forEach((edge, index) => {
        decorated.push({ ...edge, curveIndex: offsets[index], groupSize: count, renderKey: `${groupKey}-${index}` })
      })
    })
    return decorated
  }, [graph.edges])

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
    <>
      <svg ref={svgRef} viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`} role="presentation">
        <defs>
          <marker
            id="arrowhead"
            viewBox="0 0 10 10"
            refX="29" 
            refY="5"
            markerWidth="10"
            markerHeight="10"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path d="M0,0 L10,5 L0,10 L3,5 Z" fill="rgba(255,255,255,0.75)" />
          </marker>
        </defs>
        <g className="graph-links" stroke="rgba(255,255,255,0.45)">
          {decoratedEdges.map((edge) => {
            const source = positionLookup.get(edge.source)
            const target = positionLookup.get(edge.target)
            if (!source || !target) {
              return null
            }
            const midX = (source.x + target.x) / 2
            const midY = (source.y + target.y) / 2
            const dx = target.x - source.x
            const dy = target.y - source.y
            const distance = Math.max(Math.sqrt(dx * dx + dy * dy), 0.01)
            const normalX = (-dy / distance) * edge.curveIndex * CURVE_SPACING
            const normalY = (dx / distance) * edge.curveIndex * CURVE_SPACING
            const cx = midX + normalX
            const cy = midY + normalY
            const pathD = `M ${source.x} ${source.y} Q ${cx} ${cy} ${target.x} ${target.y}`

            const handleEdgePointerMove = (event: ReactPointerEvent<SVGPathElement>) => {
              if (!edge.relationship) {
                return
              }
              setHoveredEdge({ x: event.clientX + 10, y: event.clientY + 10, label: edge.relationship })
            }

            const isHovered = hoveredEdgeKey === edge.renderKey

            return (
              <g key={edge.renderKey}>
                {/* Visual Line: Pointer events disabled so the hit target handles them */}
                <path
                  className="graph-link"
                  d={pathD}
                  fill="none"
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  stroke={isHovered ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)'}
                  markerEnd={isHovered ? 'url(#arrowhead)' : undefined}
                  style={{ pointerEvents: 'none', transition: 'stroke 0.2s, stroke-width 0.2s' }}
                />
                
                {/* Invisible Hit Target: Thick stroke for stable hovering */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={20}
                  style={{ cursor: 'pointer' }}
                  onPointerEnter={(event) => {
                    setHoveredEdgeKey(edge.renderKey)
                    handleEdgePointerMove(event)
                  }}
                  onPointerMove={handleEdgePointerMove}
                  onPointerLeave={() => {
                    setHoveredEdgeKey(null)
                    setHoveredEdge(null)
                  }}
                />
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
              onPointerEnter={() => setHoveredNodeId(node.id)}
              onPointerOut={() => setHoveredNodeId((current) => (current === node.id ? null : current))}
              style={{ cursor: 'grab' }}
              onClick={() => onNodeClick?.(node)}
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
        {hoveredNodeId ? (
          (() => {
            const node = positionLookup.get(hoveredNodeId)
            if (!node || !node.stats) {
              return null
            }
            const bars = [
              node.stats.foolHero && { key: 'foolHero', stats: node.stats.foolHero },
              node.stats.angelDemon && { key: 'angelDemon', stats: node.stats.angelDemon },
              node.stats.tradAdv && { key: 'tradAdv', stats: node.stats.tradAdv },
            ].filter(Boolean) as { key: string; stats: StatPair }[]

            if (!bars.length) {
              return null
            }

            const barWidth = 180
            const cardWidth = barWidth + 180
            const cardHeight = bars.length * 44 + 44

            return (
              <foreignObject
                className="node-tooltip"
                x={Math.min(Math.max(node.x + NODE_RADIUS + 12, 8), GRAPH_WIDTH - cardWidth - 12)}
                y={Math.max(8, node.y - cardHeight / 2)}
                width={cardWidth}
                height={cardHeight}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'rgba(12, 14, 26, 0.85)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 12,
                    padding: '12px 14px',
                    color: '#f8f8ff',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: 'var(--accent)',
                        boxShadow: '0 0 0 4px rgba(156,108,255,0.15)',
                      }}
                    />
                    <strong style={{ fontSize: 14, letterSpacing: 0.2 }}>{node.label}</strong>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {bars.map((bar) => {
                      const total = Math.max(bar.stats.left + bar.stats.right, 1)
                      const fillPercent = Math.min(100, Math.max(0, (bar.stats.right / total) * 100))
                      return (
                        <div key={bar.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', minWidth: 64, textAlign: 'right' }}>
                            {bar.stats.leftLabel}
                          </span>
                          <div
                            style={{
                              position: 'relative',
                              width: barWidth,
                              height: 12,
                              borderRadius: 999,
                              /* FIX: Warm gradient background for the "Left" archetype */
                              background: 'linear-gradient(90deg, rgba(255, 85, 85, 0.4), rgba(255, 130, 85, 0.4))',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                position: 'absolute',
                                /* FIX: Anchor to right so "Hero" (Blue) grows from the "Hero" label side */
                                right: 0,
                                top: 0,
                                bottom: 0,
                                width: `${fillPercent}%`,
                                background: 'linear-gradient(90deg, rgba(156,108,255,0.7), rgba(120,195,255,0.9))',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', minWidth: 64 }}>
                            {bar.stats.rightLabel}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </foreignObject>
            )
          })()
        ) : null}
      </svg>
      {hoveredEdge && hoveredEdge.label ? (
        <div
          className="edge-tooltip"
          style={{
            position: 'fixed',
            left: hoveredEdge.x,
            top: hoveredEdge.y,
            transform: 'translate(-50%, -120%)',
            padding: '8px 12px',
            borderRadius: 999,
            background: 'rgba(17, 20, 32, 0.8)',
            border: '1px solid rgba(255,255,255,0.25)',
            color: '#f5f6ff',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
            pointerEvents: 'none',
            fontSize: 12,
            whiteSpace: 'nowrap',
          }}
        >
          {hoveredEdge.label}
        </div>
      ) : null}
    </>
  )
}

export default InteractiveGraph
