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
  const chartWidth = 320
  const chartHeight = 180
  const chartPadding = 36

  const renderChart = (
    label: string,
    accessor: (stats: CharacterSceneStats) => StatPair | undefined,
    accent: string,
  ) => {
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

    const xScale = d3.scaleLinear().domain([0, Math.max(entries.length - 1, 1)]).range([chartPadding, chartWidth - chartPadding])
    const yScale = d3.scaleLinear().domain([0, 100]).range([chartHeight - chartPadding, chartPadding])

    const path = buildPath(entries, xScale, yScale)

    return (
      <div className="dossier-chart" key={label}>
        <div className="chart-header">
          <h4>{label}</h4>
          <p className="chart-scale">Scene progression</p>
        </div>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label={`${label} alignment over time`}>
          <g className="chart-grid">
            {d3.ticks(0, 100, 4).map((tick) => (
              <g key={tick}>
                <line x1={chartPadding} x2={chartWidth - chartPadding} y1={yScale(tick)} y2={yScale(tick)} />
                <text x={chartPadding - 10} y={yScale(tick)} dominantBaseline="middle">
                  {tick}
                </text>
              </g>
            ))}
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

        <div className="dossier-charts">
          {renderChart('Fool → Hero', (stats) => stats.foolHero, 'var(--accent)')}
          {renderChart('Angel → Demon', (stats) => stats.angelDemon, '#8ae2ff')}
          {renderChart('Traditionalist → Adventurer', (stats) => stats.tradAdv, '#ffd166')}
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
      </div>
    </aside>
  )
}

export default CharacterDossier
