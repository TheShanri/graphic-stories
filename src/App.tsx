import { useEffect, useMemo, useState } from 'react'
import './App.css'
import InteractiveGraph, { type StoryGraph } from './components/InteractiveGraph'

type Story = {
  id: string
  title: string
  authors: string
  discipline: string
  duration: string
  description: string
  dataSources: string[]
}

type SceneEvent = {
  title: string
  description: string
  initiators: string[]
  receivers: string[]
}

type Scene = {
  characters: Record<string, unknown>
  actions: Record<string, SceneEvent & { type?: string }>
}

type StoryScenes = Record<string, Scene>

const STORIES: Story[] = [
  {
    id: 'macbeth_data',
    title: 'Macbeth',
    authors: 'William Shakespeare',
    discipline: 'Tragedy / Power',
    duration: 'Runtime: ~135 minutes',
    description: 'A dynamic scene-by-scene view of Macbeth built directly from JSON source files.',
    dataSources: ['First Folio transcripts', 'Holinshed Chronicles'],
  },
]

const sortEventKeys = (keys: string[]) => {
  const sorted = [...keys].sort((a, b) => {
    const numberFromKey = (key: string) => Number(key.replace(/\D+/g, ''))
    return numberFromKey(a) - numberFromKey(b)
  })
  return sorted
}

const buildGraphFromScene = (scene: Scene | undefined): StoryGraph | null => {
  if (!scene) {
    return null
  }

  const characterIds = Object.keys(scene.characters)
  const groupNodes = new Set<string>()

  const expandParticipants = (participants: string[]) => {
    const expanded: string[] = []
    participants.forEach((id) => {
      if (id === 'ALL') {
        expanded.push(...characterIds)
      } else if (characterIds.includes(id)) {
        expanded.push(id)
      } else {
        expanded.push(id)
        groupNodes.add(id)
      }
    })
    return expanded
  }

  const edges = sortEventKeys(Object.keys(scene.actions)).flatMap((eventKey) => {
    const event = scene.actions[eventKey]
    if (!event) {
      return []
    }
    const initiators = expandParticipants(event.initiators)
    const receivers = expandParticipants(event.receivers)
    const links: StoryGraph['edges'] = []
    initiators.forEach((source) => {
      receivers.forEach((target) => {
        links.push({ source, target, relationship: event.title })
      })
    })
    return links
  })

  const characterNodes: StoryGraph['nodes'] = characterIds.map((id) => ({ id, label: id }))
  const groupNodesArray = Array.from(groupNodes).map((id) => ({ id, label: id, group: 'group' }))

  return { nodes: [...characterNodes, ...groupNodesArray], edges }
}

function App() {
  const [activeId, setActiveId] = useState(STORIES[0].id)
  const [storyScenes, setStoryScenes] = useState<Record<string, StoryScenes>>({})
  const [storyErrors, setStoryErrors] = useState<Record<string, string>>({})
  const [loadingStoryId, setLoadingStoryId] = useState<string | null>(null)
  const [sceneIndex, setSceneIndex] = useState(0)

  const activeStory = useMemo(() => STORIES.find((story) => story.id === activeId) ?? STORIES[0], [activeId])
  const activeScenes = storyScenes[activeId]
  const activeStoryError = storyErrors[activeId]
  const isLoadingActiveStory = loadingStoryId === activeId && !activeScenes

  const sceneKeys = useMemo(() => (activeScenes ? Object.keys(activeScenes) : []), [activeScenes])
  const orderedSceneKeys = useMemo(() => [...sceneKeys].sort(), [sceneKeys])
  const currentSceneKey = orderedSceneKeys[sceneIndex]
  const currentScene = activeScenes?.[currentSceneKey]

  const graph = useMemo(() => buildGraphFromScene(currentScene), [currentScene])

  useEffect(() => {
    const targetId = activeId
    if (storyScenes[targetId]) {
      return
    }

    let isCancelled = false
    setLoadingStoryId(targetId)
    setSceneIndex(0)
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
        return response.json() as Promise<StoryScenes>
      })
      .then((payload) => {
        if (isCancelled) {
          return
        }
        setStoryScenes((prev) => ({ ...prev, [targetId]: payload }))
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
  }, [activeId, storyScenes])

  const handleNextScene = () => {
    setSceneIndex((index) => Math.min(index + 1, Math.max(orderedSceneKeys.length - 1, 0)))
  }

  const handlePreviousScene = () => {
    setSceneIndex((index) => Math.max(index - 1, 0))
  }

  const narrative = useMemo(() => {
    if (!currentScene) {
      return []
    }
    return sortEventKeys(Object.keys(currentScene.actions)).map((key) => ({
      key,
      title: currentScene.actions[key]?.title ?? key,
      description: currentScene.actions[key]?.description ?? '',
    }))
  }, [currentScene])

  const graphJson = graph ? JSON.stringify(graph, null, 2) : null

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
                {graph ? (
                  <InteractiveGraph key={currentSceneKey ?? 'no-scene'} graph={graph} />
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
              <p className="story-description">{activeStory.description}</p>
            )}

            <div className="scene-controls">
              <div>
                <p className="eyebrow">Scene navigation</p>
                <p className="scene-label">{currentSceneKey ? `Scene: ${currentSceneKey}` : 'No scene loaded'}</p>
              </div>
              <div className="scene-buttons">
                <button type="button" onClick={handlePreviousScene} disabled={sceneIndex === 0 || !orderedSceneKeys.length}>
                  Previous Scene
                </button>
                <button
                  type="button"
                  onClick={handleNextScene}
                  disabled={sceneIndex >= orderedSceneKeys.length - 1 || !orderedSceneKeys.length}
                >
                  Next Scene
                </button>
              </div>
            </div>

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
                  <p className="eyebrow">Scene payload</p>
                  <h3>Graph data</h3>
                </div>
                {isLoadingActiveStory && <span className="loading-pill">Loading…</span>}
              </div>
              {graphJson ? (
                <pre className="graph-json">{graphJson}</pre>
              ) : (
                <p className="graph-placeholder">
                  {isLoadingActiveStory
                    ? 'Fetching scene graph from the JSON knowledge base…'
                    : 'Select a story to request its scenes and graph.'}
                </p>
              )}
            </section>

            <section className="narrative-panel" aria-label="Scene narrative">
              <div className="panel-header compact">
                <div>
                  <p className="eyebrow">Scene narrative</p>
                  <h3>Plot steps</h3>
                </div>
              </div>
              {narrative.length ? (
                <ol className="narrative-list">
                  {narrative.map((item) => (
                    <li key={item.key}>
                      <h4>{item.title}</h4>
                      <p>{item.description}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="graph-placeholder">Load a scene to read its plot description.</p>
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
