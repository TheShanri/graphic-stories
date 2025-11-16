import { useEffect, useMemo, useState } from 'react'
import './App.css'
import InteractiveGraph, { type StoryGraph } from './components/InteractiveGraph'

export type Story = {
  id: string
  title: string
  authors: string
  discipline: string
  description: string
  duration: string
  dataSources: string[]
}

type StoryPayload = {
  id: string
  title: string
  summary: string
  graph: StoryGraph
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

function App() {
  const [activeId, setActiveId] = useState(STORIES[0].id)
  const [storyPayloads, setStoryPayloads] = useState<Record<string, StoryPayload>>({})
  const [storyErrors, setStoryErrors] = useState<Record<string, string>>({})
  const [loadingStoryId, setLoadingStoryId] = useState<string | null>(null)

  const activeStory = useMemo(() => STORIES.find((story) => story.id === activeId) ?? STORIES[0], [activeId])
  const activePayload = storyPayloads[activeId]
  const isLoadingActiveStory = loadingStoryId === activeId && !activePayload
  const activeStoryError = storyErrors[activeId]

  useEffect(() => {
    const targetId = activeId
    if (storyPayloads[targetId]) {
      return
    }

    let isCancelled = false
    setLoadingStoryId(targetId)
    setStoryErrors((prev) => {
      const next = { ...prev }
      delete next[targetId]
      return next
    })

    fetch(`/json/${targetId}.json`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Unable to load ${targetId}.json`)
        }
        return response.json() as Promise<StoryPayload>
      })
      .then((payload) => {
        if (isCancelled) {
          return
        }
        setStoryPayloads((prev) => ({ ...prev, [targetId]: payload }))
      })
      .catch((error: Error) => {
        if (isCancelled) {
          return
        }
        setStoryErrors((prev) => ({ ...prev, [targetId]: error.message }))
      })
      .finally(() => {
        if (isCancelled) {
          return
        }
        setLoadingStoryId((current) => (current === targetId ? null : current))
      })

    return () => {
      isCancelled = true
    }
  }, [activeId, storyPayloads])

  const summaryText = activePayload?.summary ?? activeStory.description
  const graphJson = activePayload?.graph ? JSON.stringify(activePayload.graph, null, 2) : null

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
              <div className="viz-hint">Live network canvas</div>
              <div className="viz-chart" role="img" aria-label={`Network graph for ${activeStory.title}`}>
                {activePayload ? (
                  <InteractiveGraph graph={activePayload.graph} />
                ) : (
                  <div className="viz-placeholder" aria-live="polite">
                    {isLoadingActiveStory ? 'Loading story graph…' : 'Select a story to load its graph data.'}
                  </div>
                )}
              </div>
            </div>
          </div>
          <article className="story-details">
            <header>
              <p className="eyebrow">Now viewing</p>
              <h2>{activeStory.title}</h2>
              <p className="authors">{activeStory.authors}</p>
            </header>
            {activeStoryError ? (
              <p className="story-description error">{activeStoryError}</p>
            ) : (
              <p className="story-description">{summaryText}</p>
            )}
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
            <section className="graph-data-panel" aria-live="polite">
              <div className="panel-header compact">
                <div>
                  <p className="eyebrow">LLM payload</p>
                  <h3>Graph data</h3>
                </div>
                {isLoadingActiveStory && <span className="loading-pill">Loading…</span>}
              </div>
              {graphJson ? (
                <pre className="graph-json">{graphJson}</pre>
              ) : (
                <p className="graph-placeholder">
                  {isLoadingActiveStory
                    ? 'Fetching summary + graph object from the JSON knowledge base…'
                    : 'Select a story to request its summary and graph.'}
                </p>
              )}
            </section>
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
