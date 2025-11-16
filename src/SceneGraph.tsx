import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

export type SceneEvent = {
  action_id: string
  relationship_type: string
  operation_action_name: string
  characters: {
    initiators: string[]
    receivers: string[]
  }
  description: string
}

type SceneGraphProps = {
  sceneData: SceneEvent[]
}

type NodeDatum = d3.SimulationNodeDatum & {
  id: string
}

type LinkDatum = d3.SimulationLinkDatum<NodeDatum> & {
  label: string
}

const RELATIONSHIP_TEMPLATES: Record<string, (actionName: string) => string> = {
  'One-to-One (1:1)': (action) => `[1 ${action} 1]`,
  'One-to-Many (1:M)': (action) => `[1 ${action} *]`,
  'Many-to-One (M:1)': (action) => `[* ${action} 1]`,
  'Many-to-Many (M:N)': (action) => `[* ${action} *]`,
  'Self-loop (1→1)': (action) => `[1 ${action} 1]`,
}

const formatEdgeLabel = (relationshipType: string, actionName: string) => {
  const formatter = RELATIONSHIP_TEMPLATES[relationshipType]
  if (formatter) {
    return formatter(actionName)
  }
  return `[${relationshipType}: ${actionName}]`
}

function SceneGraph({ sceneData }: SceneGraphProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    if (!svgRef.current) {
      return
    }

    const svg = d3.select<SVGSVGElement, unknown>(svgRef.current)
    svg.selectAll('*').remove()

    const nodeSet = new Set<string>()
    const links: LinkDatum[] = []

    sceneData.forEach((event) => {
      const { initiators = [], receivers = [] } = event.characters
      initiators.forEach((name) => nodeSet.add(name))
      receivers.forEach((name) => nodeSet.add(name))

      const targets = receivers.length > 0 ? receivers : initiators
      initiators.forEach((initiator) => {
        if (targets.length === 0) {
          links.push({
            source: initiator,
            target: initiator,
            label: formatEdgeLabel('Self-loop (1→1)', event.operation_action_name),
          })
          return
        }
        targets.forEach((receiver) => {
          links.push({
            source: initiator,
            target: receiver,
            label: formatEdgeLabel(event.relationship_type, event.operation_action_name),
          })
        })
      })
    })

    const nodes: NodeDatum[] = Array.from(nodeSet).map((id) => ({ id }))

    const width = 800
    const height = 520

    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', '100%').attr('height', '100%')

    const nodesCopy = nodes.map((node) => ({ ...node }))
    const linksCopy: LinkDatum[] = links.map((link) => ({ ...link }))

    const simulation = d3
      .forceSimulation(nodesCopy)
      .force(
        'link',
        d3
          .forceLink<NodeDatum, LinkDatum>(linksCopy)
          .id((node: NodeDatum) => node.id)
          .distance(160),
      )
      .force('charge', d3.forceManyBody<NodeDatum>().strength(-280))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<NodeDatum>().radius(40))

    const linkGroup = svg.append('g').attr('class', 'links')
    const linkElements = linkGroup
      .selectAll<SVGLineElement, LinkDatum>('line')
      .data(linksCopy)
      .join('line')
      .attr('class', 'link')

    const edgeLabels = svg
      .append('g')
      .attr('class', 'edge-labels')
      .selectAll<SVGTextElement, LinkDatum>('text')
      .data(linksCopy)
      .join('text')
      .attr('class', 'edge-label')
      .text((d: LinkDatum) => d.label)

    const nodeGroup = svg.append('g').attr('class', 'nodes')
    const nodeElements = nodeGroup
      .selectAll<SVGCircleElement, NodeDatum>('circle')
      .data(nodesCopy)
      .join('circle')
      .attr('class', 'node')
      .attr('r', 16)
      .call(
        d3
          .drag<SVGCircleElement, NodeDatum>()
          .on('start', (event: d3.D3DragEvent<SVGCircleElement, NodeDatum, NodeDatum>, d: NodeDatum) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event: d3.D3DragEvent<SVGCircleElement, NodeDatum, NodeDatum>, d: NodeDatum) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event: d3.D3DragEvent<SVGCircleElement, NodeDatum, NodeDatum>, d: NodeDatum) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
          }),
      )

    const nodeLabels = svg
      .append('g')
      .attr('class', 'node-labels')
      .selectAll<SVGTextElement, NodeDatum>('text')
      .data(nodesCopy)
      .join('text')
      .attr('class', 'node-label')
      .text((d: NodeDatum) => d.id)

    simulation.on('tick', () => {
      linkElements
        .attr('x1', (d: LinkDatum) => (d.source as NodeDatum).x ?? 0)
        .attr('y1', (d: LinkDatum) => (d.source as NodeDatum).y ?? 0)
        .attr('x2', (d: LinkDatum) => (d.target as NodeDatum).x ?? 0)
        .attr('y2', (d: LinkDatum) => (d.target as NodeDatum).y ?? 0)

      nodeElements.attr('cx', (d: NodeDatum) => d.x ?? 0).attr('cy', (d: NodeDatum) => d.y ?? 0)

      nodeLabels
        .attr('x', (d: NodeDatum) => (d.x ?? 0) + 20)
        .attr('y', (d: NodeDatum) => (d.y ?? 0) + 5)

      edgeLabels
        .attr('x', (d: LinkDatum) => (((d.source as NodeDatum).x ?? 0) + ((d.target as NodeDatum).x ?? 0)) / 2)
        .attr('y', (d: LinkDatum) => (((d.source as NodeDatum).y ?? 0) + ((d.target as NodeDatum).y ?? 0)) / 2)
    })

    return () => {
      simulation.stop()
    }
  }, [sceneData])

  return <svg ref={svgRef} className="scene-graph" role="presentation" />
}

export default SceneGraph
