import d3, { type LinearScale } from '../vendor/d3-lite'

export type StatPair = {
  leftLabel: string
  rightLabel: string
  left: number
  right: number
  justification?: string
}

export type CharacterSceneStats = {
  foolHero?: StatPair
  angelDemon?: StatPair
  tradAdv?: StatPair
}

export type CharacterArcPoint = {
  sceneName: string
  stats: CharacterSceneStats
}

type Props = {
  characterId: string
  arc: CharacterArcPoint[]
  currentStats?: CharacterSceneStats
  sceneName?: string
  onClose: () => void
}

const buildPath = (points: { x: number; y: number }[], xScale: LinearScale, yScale: LinearScale) => {
  if (!points.length) {
    return ''
  }
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${xScale(point.x)} ${yScale(point.y)}`)
    .join(' ')
}

function CharacterDossier({ characterId, arc, currentStats, sceneName, onClose }: Props) {
  const chartWidth = 400
  const chartHeight = 160
  const chartMargin = { top: 18, right: 16, bottom: 60, left: 90 }
  const innerWidth = chartWidth - chartMargin.left - chartMargin.right
  const innerHeight = chartHeight - chartMargin.top - chartMargin.bottom

  const renderChart = (
    label: string,
    accessor: (stats: CharacterSceneStats) => StatPair | undefined,
    accent: string,
  ) => {
    const firstStat = arc.map((point) => accessor(point.stats)).find(Boolean)
    const entries = arc
      .map((point, index) => {
        const stat = accessor(point.stats)
        if (!stat) {
          return null
        }
        return { x: index, y: stat.right, scene: point.sceneName }
      })
      .filter((item): item is { x: number; y: number; scene: string } => Boolean(item))

    if (!entries.length) {
      return null
    }

    const xScale = d3
      .scaleLinear()
      .domain([0, Math.max(entries.length - 1, 1)])
      .range([chartMargin.left, chartMargin.left + innerWidth])
    const yScale = d3.scaleLinear().domain([0, 100]).range([chartMargin.top + innerHeight, chartMargin.top])

    const path = buildPath(entries, xScale, yScale)
    
    // FIX: Format labels to A#S# and calculate dynamic font size
    const xTicks = entries.map((entry) => {
      const match = entry.scene.match(/Act\s*(\d+).*?Scene(?:s)?\s*(\d+)/i)
      return {
        label: match ? `A${match[1]}S${match[2]}` : entry.scene,
        x: entry.x,
      }
    })
    
    // Simple heuristic to scale font down if there are many scenes
    const tickFontSize = Math.min(10, Math.max(6, innerWidth / entries.length / 1.5))

    const topLabel = firstStat?.rightLabel ?? label.split('→')[1]?.trim() ?? 'High'
    const bottomLabel = firstStat?.leftLabel ?? label.split('→')[0]?.trim() ?? 'Low'

    return (
      <div className="dossier-chart" key={label}>
        <div className="chart-header">
          <h4>{label}</h4>
          <p className="chart-scale">Scene progression</p>
        </div>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          role="img"
          aria-label={`${label} alignment over time`}
          width="100%"
          height="auto"
          preserveAspectRatio="xMidYMid meet"
        >
          <g className="chart-grid">
            {d3.ticks(0, 100, 4).map((tick) => (
              <g key={tick}>
                <line x1={chartMargin.left} x2={chartMargin.left + innerWidth} y1={yScale(tick)} y2={yScale(tick)} />
                <text x={chartMargin.left - 12} y={yScale(tick)} dominantBaseline="middle" textAnchor="end">
                  {tick}
                </text>
              </g>
            ))}
          </g>
          <g className="chart-axes">
            <line
              x1={chartMargin.left}
              x2={chartMargin.left + innerWidth}
              y1={chartMargin.top + innerHeight + 10}
              y2={chartMargin.top + innerHeight + 10}
              stroke="rgba(255,255,255,0.4)"
            />
            {xTicks.map((tick, i) => (
              <text
                key={i}
                x={xScale(tick.x)}
                y={chartMargin.top + innerHeight + 10}
                transform={`rotate(-90, ${xScale(tick.x)}, ${chartMargin.top + innerHeight + 10})`}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={tickFontSize}
                fill="rgba(255,255,255,0.8)"
              >
                {tick.label}
              </text>
            ))}
            
            {/* Removed 'Scene number' label as requested */}

            {/* Top Label: Moved up 12px to avoid overlapping "100" */}
            <text x={chartMargin.left - 8} y={chartMargin.top - 12} textAnchor="end" fontSize={11} fill="rgba(255,255,255,0.9)">
              {topLabel}
            </text>

            {/* Bottom Label: Moved down 12px to avoid overlapping "0" */}
            <text x={chartMargin.left - 8} y={chartMargin.top + innerHeight + 12} textAnchor="end" fontSize={11} fill="rgba(255,255,255,0.9)">
              {bottomLabel}
            </text>
            <text
              x={chartMargin.left - 44}
              y={chartMargin.top + innerHeight / 2}
              textAnchor="middle"
              fontSize={11}
              fill="rgba(255,255,255,0.7)"
              transform={`rotate(-90 ${chartMargin.left - 44} ${chartMargin.top + innerHeight / 2})`}
            >
              Alignment
            </text>
          </g>
          <path d={path} fill="none" stroke={accent} strokeWidth={2.5} />
          {entries.map((entry) => (
            <g key={entry.scene}>
              <circle cx={xScale(entry.x)} cy={yScale(entry.y)} r={4} fill={accent} />
              <title>
                {entry.scene}: {entry.y}
              </title>
            </g>
          ))}
        </svg>
      </div>
    )
  }

  const justificationItems = [
    currentStats?.foolHero && { title: `${currentStats.foolHero.leftLabel} → ${currentStats.foolHero.rightLabel}`, text: currentStats.foolHero.justification },
    currentStats?.angelDemon && { title: `${currentStats.angelDemon.leftLabel} → ${currentStats.angelDemon.rightLabel}`, text: currentStats.angelDemon.justification },
    currentStats?.tradAdv && { title: `${currentStats.tradAdv.leftLabel} → ${currentStats.tradAdv.rightLabel}`, text: currentStats.tradAdv.justification },
  ].filter(Boolean) as { title: string; text?: string }[]

  return (
    <aside className="dossier-overlay" aria-live="polite">
      <div className="dossier-panel">
        <div className="dossier-header">
          <div>
            <p className="eyebrow">Character dossier</p>
            <h3>{characterId}</h3>
            {sceneName ? <p className="scene-label">Current scene: {sceneName}</p> : null}
          </div>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close dossier">
            ×
          </button>
        </div>

        {justificationItems.length ? (
          <div className="dossier-justifications">
            <p className="eyebrow">Scene justification</p>
            <ul>
              {justificationItems.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}:</strong> {item.text || 'No justification provided.'}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="dossier-charts">
          {renderChart('Fool → Hero', (stats) => stats.foolHero, 'var(--accent)')}
          {renderChart('Angel → Demon', (stats) => stats.angelDemon, '#8ae2ff')}
          {renderChart('Traditionalist → Adventurer', (stats) => stats.tradAdv, '#ffd166')}
        </div>
      </div>
    </aside>
  )
}

export default CharacterDossier
