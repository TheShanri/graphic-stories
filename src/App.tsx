import { useMemo, useState } from 'react'
import './App.css'

export type Story = {
  id: string
  title: string
  authors: string
  discipline: string
  description: string
  duration: string
  dataSources: string[]
}

const STORIES: Story[] = [
  {
    id: 'climate-signals',
    title: 'Climate Signals in Urban Heat Islands',
    authors: 'Dr. Lea Mitchell · Civic Ecologies Lab',
    discipline: 'Environmental Humanities',
    duration: '8-minute interactive brief',
    description:
      'A layered narrative that combines thermal satellite readings with oral histories from residents to surface how microclimates shape community resilience.',
    dataSources: ['NASA ECOSTRESS', 'City of Austin archives', 'Resident interviews'],
  },
  {
    id: 'migration-pathways',
    title: 'Migration Pathways of Pollinators',
    authors: 'Prof. Daniela Ortiz · BioDesign Collective',
    discipline: 'Bio Design / Ecology',
    duration: '12-minute exploratory journey',
    description:
      'A guided story following the pollination corridor created by school gardens, featuring animated flow maps and classroom annotations.',
    dataSources: ['iNaturalist observations', 'District curriculum notes', 'Drone photogrammetry'],
  },
  {
    id: 'supply-chain',
    title: 'Decoding the Equitable Supply Chain',
    authors: 'Center for Circular Futures',
    discipline: 'Design Research / Policy',
    duration: '15-minute scenario planner',
    description:
      'Trace how textile reuse programs redistribute value through neighborhoods using Sankey-inspired diagrams and stakeholder spotlights.',
    dataSources: ['Municipal procurement datasets', 'NGO program logs', 'Studio field notes'],
  },
  {
    id: 'atlases-of-care',
    title: 'Atlases of Care Infrastructure',
    authors: 'Health + Equity Studio',
    discipline: 'Public Health Communications',
    duration: '10-minute constellation view',
    description:
      'An ambient visualization that positions mutual aid networks next to public investments to reveal opportunities for co-governance.',
    dataSources: ['County health dashboard', 'Community surveys', 'Mutual aid dispatch records'],
  },
]

function App() {
  const [activeId, setActiveId] = useState(STORIES[0].id)
  const activeStory = useMemo(() => STORIES.find((story) => story.id === activeId) ?? STORIES[0], [activeId])

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
              <div className="viz-grid" aria-hidden="true">
                {Array.from({ length: 12 }).map((_, index) => (
                  <span key={index} />
                ))}
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
        <p>Need a demo deck? <a href="mailto:hello@graphicstories.edu">hello@graphicstories.edu</a></p>
      </footer>
    </div>
  )
}

export default App
