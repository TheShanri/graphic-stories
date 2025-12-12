import { useEffect, useMemo, useState } from 'react'
import './App.css'
import InteractiveGraph, { type StoryGraph } from './components/InteractiveGraph'
import CharacterDossier from './components/CharacterDossier'

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

type RawCharacterStat = {
  justification?: string
  [key: string]: number | string | undefined
}

type RawCharacterProfile = {
  'fool-hero'?: RawCharacterStat
  'angel-demon'?: RawCharacterStat
  'traditionalist-adventurer'?: RawCharacterStat
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

type Scene = {
  characters: Record<string, RawCharacterProfile>
  actions: Record<string, SceneEvent & { type?: string }>
}

type CharacterArcPoint = {
  sceneName: string
  stats: CharacterSceneStats
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

const buildStatPair = (entry: RawCharacterStat | undefined, leftLabel: string, rightLabel: string): StatPair | undefined => {
  if (!entry) {
    return undefined
  }
  const left = typeof entry[leftLabel] === 'number' ? Number(entry[leftLabel]) : 0
  const right = typeof entry[rightLabel] === 'number' ? Number(entry[rightLabel]) : 0
  const justification = typeof entry.justification === 'string' ? entry.justification : ''
  return { leftLabel, rightLabel, left, right, justification }
}

const normalizeCharacterStats = (profile: RawCharacterProfile | undefined): CharacterSceneStats | undefined => {
  if (!profile) {
    return undefined
  }
  const stats: CharacterSceneStats = {
    foolHero: buildStatPair(profile['fool-hero'], 'Fool', 'Hero'),
    angelDemon: buildStatPair(profile['angel-demon'], 'Angel', 'Demon'),
    tradAdv: buildStatPair(profile['traditionalist-adventurer'], 'Traditionalist', 'Adventurer'),
  }
  if (!stats.foolHero && !stats.angelDemon && !stats.tradAdv) {
    return undefined
  }
  return stats
}

const normalizeName = (name: string) => name.replace(/\s*\(.*?\)\s*/g, '').trim().replace(/\s+/g, ' ').toLowerCase()

const normalizeId = (id: string) => normalizeName(id)

const formatDisplayName = (name: string) => {
  const cleaned = name.replace(/\s*\(.*?\)\s*/g, '').trim()
  if (!cleaned) {
    return name
  }
  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

const buildGraphFromScene = (scene: Scene | undefined): StoryGraph | null => {
  if (!scene) {
    return null
  }

  const characterMap = new Map<string, { label: string; stats?: CharacterSceneStats }>()
  const normalizedCharacterKeys = new Map<string, string>()
  Object.entries(scene.characters).forEach(([rawId, profile]) => {
    const normalizedId = normalizeId(rawId)
    if (!characterMap.has(normalizedId)) {
      normalizedCharacterKeys.set(normalizedId, rawId)
      characterMap.set(normalizedId, {
        label: formatDisplayName(rawId),
        stats: normalizeCharacterStats(profile),
      })
    }
  })

  const groupNodes = new Map<string, string>()

  const characterIds = Array.from(normalizedCharacterKeys.values())

  const expandParticipants = (participants: string[]) => {
    const expanded: string[] = []
    participants.forEach((id) => {
      const normalizedId = normalizeId(id)
      if (id.trim().toUpperCase() === 'ALL') {
        expanded.push(...characterIds)
      } else if (normalizedCharacterKeys.has(normalizedId)) {
        expanded.push(normalizedCharacterKeys.get(normalizedId) ?? normalizedId)
      } else {
        expanded.push(normalizedId)
        groupNodes.set(normalizedId, formatDisplayName(id))
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

  const usedNodeIds = new Set<string>()
  edges.forEach((edge) => {
    usedNodeIds.add(edge.source)
    usedNodeIds.add(edge.target)
  })

  const characterNodes: StoryGraph['nodes'] = Array.from(characterMap.entries())
    .filter(([normalizedId]) => {
      const originalId = normalizedCharacterKeys.get(normalizedId)
      return Boolean(originalId && usedNodeIds.has(originalId))
    })
    .map(([normalizedId, data]) => {
      const originalId = normalizedCharacterKeys.get(normalizedId) ?? normalizedId
      return {
        id: originalId,
        label: data.label,
        stats: data.stats,
      }
    })

  const groupNodesArray = Array.from(groupNodes.entries())
    .filter(([id]) => usedNodeIds.has(id))
    .map(([id, label]) => ({ id, label, group: 'group' }))

  return { nodes: [...characterNodes, ...groupNodesArray], edges }
}

function App() {
  const [activeId, setActiveId] = useState(STORIES[0].id)
  const [storyScenes, setStoryScenes] = useState<Record<string, StoryScenes>>({})
  const [storyErrors, setStoryErrors] = useState<Record<string, string>>({})
  const [loadingStoryId, setLoadingStoryId] = useState<string | null>(null)
  const [sceneIndex, setSceneIndex] = useState(0)
  const [selectedCharacter, setSelectedCharacter] = useState<{ id: string; stats?: CharacterSceneStats } | null>(null)
  const [isLibraryCollapsed, setIsLibraryCollapsed] = useState(true)

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
    setSelectedCharacter(null)
  }, [activeId, currentSceneKey])

  const getCharacterArc = (characterId: string): CharacterArcPoint[] => {
    const scenes = storyScenes[activeId]
    if (!scenes) {
      return []
    }
    const normalizedTarget = normalizeId(characterId)
    return sortEventKeys(Object.keys(scenes))
      .map((sceneName) => {
        const sceneCharacters = scenes[sceneName]?.characters
        const sceneProfile = sceneCharacters
          ? Object.entries(sceneCharacters).find(([id]) => normalizeId(id) === normalizedTarget)?.[1]
          : undefined
        const stats = normalizeCharacterStats(sceneProfile)
        return stats ? { sceneName, stats } : null
      })
      .filter((item): item is CharacterArcPoint => Boolean(item))
  }

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

  const handleNodeClick = (nodeId: string) => {
    const nodeStats = graph?.nodes.find((node) => node.id === nodeId)?.stats
    setSelectedCharacter({ id: nodeId, stats: nodeStats })
  }

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

      <main className={`workspace ${isLibraryCollapsed ? 'library-collapsed' : ''}`.trim()} aria-live="polite">
        <section className={`stories-panel ${isLibraryCollapsed ? 'collapsed' : ''}`} aria-label="Story library">
          <div className="panel-header">
            {!isLibraryCollapsed && (
              <div>
                <p className="eyebrow">Library</p>
                <h2>Story Index</h2>
              </div>
            )}
            <button
              className="ghost-button icon-only"
              type="button"
              onClick={() => setIsLibraryCollapsed(!isLibraryCollapsed)}
              aria-label={isLibraryCollapsed ? 'Expand Library' : 'Collapse Library'}
              title={isLibraryCollapsed ? 'Expand Library' : 'Collapse Library'}
              style={{ padding: '0.5rem', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {isLibraryCollapsed ? '»' : '«'}
            </button>
          </div>

          {!isLibraryCollapsed ? (
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
          ) : (
            <div 
              className="vertical-label" 
              onClick={() => setIsLibraryCollapsed(false)}
              style={{ 
                writingMode: 'vertical-rl', 
                textOrientation: 'mixed', 
                transform: 'rotate(180deg)', 
                marginTop: '2rem',
                cursor: 'pointer',
                color: 'var(--muted-foreground)',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                alignSelf: 'center',
                lineHeight: '1', /* FIX: Ensures text is perfectly centered in the strip */
              }}
            >
              Story Index
            </div>
          )}
        </section>

        <section className="visualization-panel" aria-label="Visualization preview">
          <div className="visualization-frame">
            <div className="viz-surface">
              <div className="viz-hint">Live network canvas</div>
              <div className="viz-chart" role="img" aria-label={`Network graph for ${activeStory.title}`}>
                {graph ? (
                  <>
                    <InteractiveGraph
                      key={currentSceneKey ?? 'no-scene'}
                      graph={graph}
                      onNodeClick={(node) => handleNodeClick(node.id)}
                    />
                    {selectedCharacter ? (
                      <CharacterDossier
                        characterId={selectedCharacter.id}
                        arc={getCharacterArc(selectedCharacter.id)}
                        currentStats={selectedCharacter.stats}
                        sceneName={currentSceneKey}
                        onClose={() => setSelectedCharacter(null)}
                      />
                    ) : null}
                  </>
                ) : (
                  <div className="viz-placeholder" aria-live="polite">
                    {isLoadingActiveStory ? 'Loading story graph…' : 'Select a story to load its graph data.'}
                  </div>
                )}
              </div>
            </div>
          </div>
          <article className="story-details">
            {/* Moved Scene Controls to the top */}
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
