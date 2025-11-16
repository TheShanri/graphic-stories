import { useMemo, useState } from 'react'
import './App.css'
import { max, scaleBand, scaleLinear, ticks } from 'd3'

export type Story = {
  id: string
  title: string
  authors: string
  discipline: string
  description: string
  duration: string
  dataSources: string[]
}

type ChartDatum = {
  label: string
  value: number
}

const STORIES: Story[] = [
  {
    id: 'macbeth',
    title: 'Macbeth',
    authors: 'William Shakespeare · The Scottish Play',
    discipline: 'Tragedy / Power',
    duration: 'Runtime: ~135 minutes',
    description:
      'A fevered account of ambition, prophecy, and the spectral cost of power, remixed as a civic resilience briefing for modern audiences.',
    dataSources: ['First Folio transcripts', 'Holinshed Chronicles', 'Royal correspondence marginalia'],
  },
  {
    id: 'hamlet',
    title: 'Hamlet',
    authors: 'William Shakespeare · The Prince of Denmark',
    discipline: 'Philosophy / Courtly Intrigue',
    duration: 'Runtime: ~180 minutes',
    description:
      'A reflective dossier that charts grief, espionage, and the theater within the theater—optimized for scholars comparing early modern surveillance.',
    dataSources: ['1604 quarto annotations', 'Wittenberg disputation notes', 'Court performance ledgers'],
  },
  {
    id: 'king-lear',
    title: 'King Lear',
    authors: 'William Shakespeare · Storm-Tossed Monarch',
    discipline: 'Familial Governance',
    duration: 'Runtime: ~190 minutes',
    description:
      'A stark atlas of filial negotiations, coastal storms, and the fragile mathematics of trust across three crowns.',
    dataSources: ['Stationers’ Register', 'Weather logs from Dover Cliff', 'Folger dramaturg memos'],
  },
  {
    id: 'tempest',
    title: 'The Tempest',
    authors: 'William Shakespeare · Prospero’s Masque',
    discipline: 'Mythic Science & Sound',
    duration: 'Runtime: ~150 minutes',
    description:
      'An island laboratory that remaps magic as proto-ecology, translating spirits, shipwrecks, and forgiveness into sonic data stories.',
    dataSources: ['Ship manifests from 1609 Sea Venture', 'Prospero’s marginalia', 'Masque instrumentation guides'],
  },
]

const STORY_VISUALS: Record<string, ChartDatum[]> = {
  macbeth: [
    { label: 'Prophecy', value: 38 },
    { label: 'Ambition', value: 54 },
    { label: 'Guilt', value: 72 },
    { label: 'Specters', value: 44 },
    { label: 'Fallout', value: 58 },
  ],
  hamlet: [
    { label: 'Grief', value: 64 },
    { label: 'Plots', value: 52 },
    { label: 'Soliloquy', value: 80 },
    { label: 'Espionage', value: 48 },
    { label: 'Reckoning', value: 70 },
  ],
  'king-lear': [
    { label: 'Division', value: 60 },
    { label: 'Storm', value: 76 },
    { label: 'Disguise', value: 42 },
    { label: 'Loss', value: 68 },
    { label: 'Restoration', value: 50 },
  ],
  tempest: [
    { label: 'Tempest', value: 55 },
    { label: 'Alchemy', value: 62 },
    { label: 'Spirits', value: 48 },
    { label: 'Revels', value: 70 },
    { label: 'Release', value: 57 },
  ],
}

const STORY_COLORS: Record<string, { accent: string; glow: string }> = {
  macbeth: { accent: '#ff8a7a', glow: '#5c1d2c' },
  hamlet: { accent: '#8ce5ff', glow: '#1b3651' },
  'king-lear': { accent: '#ffd580', glow: '#5a3810' },
  tempest: { accent: '#a7f0ba', glow: '#1b4437' },
}

const FALLBACK_PALETTE = { accent: '#bd8cff', glow: '#2d2250' }

const CHART_SIZE = {
  width: 780,
  height: 460,
  margin: { top: 48, right: 48, bottom: 80, left: 72 },
}

const INNER_WIDTH = CHART_SIZE.width - CHART_SIZE.margin.left - CHART_SIZE.margin.right
const INNER_HEIGHT = CHART_SIZE.height - CHART_SIZE.margin.top - CHART_SIZE.margin.bottom
const Y_TICK_COUNT = 4

function App() {
  const [activeId, setActiveId] = useState(STORIES[0].id)
  const activeStory = useMemo(() => STORIES.find((story) => story.id === activeId) ?? STORIES[0], [activeId])
  const chartData = useMemo(() => STORY_VISUALS[activeId] ?? [], [activeId])
  const palette = STORY_COLORS[activeId] ?? FALLBACK_PALETTE

  const yMax = useMemo(() => {
    if (!chartData.length) {
      return 1
    }
    const computed = max(chartData, (datum) => datum.value)
    if (!Number.isFinite(computed)) {
      return 1
    }
    return Math.max(1, computed)
  }, [chartData])

  const yScale = useMemo(() => scaleLinear().domain([0, yMax]).range([INNER_HEIGHT, 0]).nice(4), [yMax])
  const xScale = useMemo(
    () => scaleBand<string>().domain(chartData.map((datum) => datum.label)).range([0, INNER_WIDTH]).padding(0.35),
    [chartData],
  )

  const yTickValues = useMemo(() => {
    const [start, stop] = yScale.domain()
    return ticks(start, stop, Y_TICK_COUNT)
  }, [yScale])

  const gradientId = `${activeStory.id}-gradient`
  const chartTitleId = `${activeStory.id}-chart-title`

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-block">
          <p className="eyebrow">Graphic Stories · Research Alpha</p>
          <h1>Stories Viewer</h1>
          <p className="lede">
            A modern workspace for previewing narrative visualizations, keeping track of data provenance, and curating
            interdisciplinary collaborations.
          </p>
        </div>
        <nav className="primary-nav">
          <a className="active" href="/">
            Stories Viewer
          </a>
          <a href="/about.html">About</a>
        </nav>
      </header>

      <main className="workspace" aria-live="polite">
        <section className="stories-panel" aria-label="Story library">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Library</p>
              <h2>Story Index</h2>
            </div>
            <button className="ghost-button" type="button">
              + Submit Narrative
            </button>
          </div>
          <ul className="story-list">
            {STORIES.map((story) => (
              <li key={story.id}>
                <button
                  type="button"
                  className={`story-item ${story.id === activeId ? 'selected' : ''}`}
                  onClick={() => setActiveId(story.id)}
                >
                  <div className="story-meta">
                    <span className="discipline">{story.discipline}</span>
                    <span className="duration">{story.duration}</span>
                  </div>
                  <h3>{story.title}</h3>
                  <p>{story.authors}</p>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="visualization-panel" aria-label="Visualization preview">
          <div className="visualization-frame">
            <div className="viz-surface">
              <div className="viz-hint">Live visualization canvas</div>
              <div className="viz-chart" role="img" aria-labelledby={chartTitleId}>
                <svg viewBox={`0 0 ${CHART_SIZE.width} ${CHART_SIZE.height}`} preserveAspectRatio="xMidYMid meet">
                  <title id={chartTitleId}>Boilerplate d3 sketch for {activeStory.title}</title>
                  <defs>
                    <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor={palette.accent} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={palette.glow} stopOpacity={0.85} />
                    </linearGradient>
                  </defs>
                  <g transform={`translate(${CHART_SIZE.margin.left}, ${CHART_SIZE.margin.top})`}>
                    <g className="viz-gridlines" aria-hidden="true">
                      {yTickValues.map((tick) => (
                        <g key={tick} transform={`translate(0, ${yScale(tick)})`}>
                          <line x1={0} x2={INNER_WIDTH} />
                          <text x={-18} dy="0.35em">
                            {Math.round(tick)}
                          </text>
                        </g>
                      ))}
                    </g>
                    <g className="viz-bars">
                      {chartData.map((datum) => {
                        const xPosition = xScale(datum.label) ?? 0
                        const barHeight = INNER_HEIGHT - yScale(datum.value)
                        return (
                          <g key={datum.label} transform={`translate(${xPosition}, ${yScale(datum.value)})`}>
                            <rect width={xScale.bandwidth()} height={barHeight} rx={12} fill={`url(#${gradientId})`}>
                              <title>
                                {datum.label}: {datum.value}
                              </title>
                            </rect>
                            <text className="viz-value" x={xScale.bandwidth() / 2} y={-12}>
                              {datum.value}
                            </text>
                          </g>
                        )
                      })}
                    </g>
                    <g className="viz-axis" transform={`translate(0, ${INNER_HEIGHT})`} aria-hidden="true">
                      {chartData.map((datum) => {
                        const xPosition = (xScale(datum.label) ?? 0) + xScale.bandwidth() / 2
                        return (
                          <text key={datum.label} x={xPosition} dy="2.5rem">
                            {datum.label}
                          </text>
                        )
                      })}
                    </g>
                  </g>
                </svg>
              </div>
            </div>
          </div>
          <article className="story-details">
            <header>
              <p className="eyebrow">Now viewing</p>
              <h2>{activeStory.title}</h2>
              <p className="authors">{activeStory.authors}</p>
            </header>
            <p className="story-description">{activeStory.description}</p>
            <dl className="data-points">
              <div>
                <dt>Discipline</dt>
                <dd>{activeStory.discipline}</dd>
              </div>
              <div>
                <dt>Duration</dt>
                <dd>{activeStory.duration}</dd>
              </div>
              <div>
                <dt>Data sources</dt>
                <dd>
                  <ul>
                    {activeStory.dataSources.map((source) => (
                      <li key={source}>{source}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>
          </article>
        </section>
      </main>

      <footer className="app-footer">
        <p>© {new Date().getFullYear()} Graphic Stories Lab · Built with React, TypeScript, and SWC.</p>
        <p>
          Need a demo deck? <a href="mailto:hello@graphicstories.edu">hello@graphicstories.edu</a>
        </p>
      </footer>
    </div>
  )
}

export default App
