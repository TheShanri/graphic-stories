import { useMemo, useState } from 'react'
import './App.css'
import SceneGraph, { type SceneEvent } from './SceneGraph'

const ALL_SCENE_DATA: SceneEvent[][] = [
  [
    {
      action_id: 'scene-1-event-1',
      relationship_type: 'One-to-Many (1:M)',
      operation_action_name: 'Issue command',
      characters: {
        initiators: ['Queen Mab'],
        receivers: ['Envoy Talos', 'Archivist Wren'],
      },
      description: 'Queen Mab dispatches Envoy Talos and Archivist Wren to broker calm among coastal guilds.',
    },
    {
      action_id: 'scene-1-event-2',
      relationship_type: 'Many-to-One (M:1)',
      operation_action_name: 'Deliver report',
      characters: {
        initiators: ['Envoy Talos', 'Archivist Wren'],
        receivers: ['Queen Mab'],
      },
      description: 'Envoy Talos and Archivist Wren deliver satellite observations back to the queen.',
    },
    {
      action_id: 'scene-1-event-3',
      relationship_type: 'Self-loop (1→1)',
      operation_action_name: 'Reflect',
      characters: {
        initiators: ['Queen Mab'],
        receivers: ['Queen Mab'],
      },
      description: 'Queen Mab revisits her field notes to gauge whether the strategy still holds.',
    },
  ],
  [
    {
      action_id: 'scene-2-event-1',
      relationship_type: 'One-to-One (1:1)',
      operation_action_name: 'Share warning',
      characters: {
        initiators: ['Navigator Sol'],
        receivers: ['Cartographer Ibis'],
      },
      description: 'Navigator Sol finds Ibis in the chart room and whispers about an impending geomagnetic flare.',
    },
    {
      action_id: 'scene-2-event-2',
      relationship_type: 'One-to-Many (1:M)',
      operation_action_name: 'Broadcast alert',
      characters: {
        initiators: ['Cartographer Ibis'],
        receivers: ['Harbor Scribes', 'Signal Corps'],
      },
      description: 'Ibis spreads the alert through the harbor scribes and the signal corps watch posts.',
    },
    {
      action_id: 'scene-2-event-3',
      relationship_type: 'Many-to-Many (M:N)',
      operation_action_name: 'Coordinate defenses',
      characters: {
        initiators: ['Signal Corps', 'Harbor Scribes'],
        receivers: ['Aurora Wardens', 'Tide Wardens'],
      },
      description: 'Signal Corps and Harbor Scribes team up with both warden groups to choreograph countermeasures.',
    },
  ],
  [
    {
      action_id: 'scene-3-event-1',
      relationship_type: 'Many-to-One (M:1)',
      operation_action_name: 'Request supplies',
      characters: {
        initiators: ['Aurora Wardens', 'Tide Wardens'],
        receivers: ['Quartermaster Brio'],
      },
      description: 'The wardens appeal to Quartermaster Brio for aurora nets and salt towers.',
    },
    {
      action_id: 'scene-3-event-2',
      relationship_type: 'One-to-Many (1:M)',
      operation_action_name: 'Dispatch caravans',
      characters: {
        initiators: ['Quartermaster Brio'],
        receivers: ['Aurora Wardens', 'Tide Wardens', 'Signal Corps'],
      },
      description: 'Brio sends caravans of supplies toward each perimeter cohort.',
    },
    {
      action_id: 'scene-3-event-3',
      relationship_type: 'Many-to-Many (M:N)',
      operation_action_name: 'Celebrate resilience',
      characters: {
        initiators: ['Aurora Wardens', 'Tide Wardens', 'Signal Corps'],
        receivers: ['Queen Mab', 'Navigator Sol'],
      },
      description: 'Every cohort shares a pulse of gratitude back to Queen Mab and Navigator Sol.',
    },
  ],
]

function App() {
  const [activeSceneIndex, setActiveSceneIndex] = useState(0)
  const totalScenes = ALL_SCENE_DATA.length
  const activeSceneData = ALL_SCENE_DATA[activeSceneIndex]

  const sceneTitle = useMemo(() => {
    const firstAction = activeSceneData[0]
    if (!firstAction) {
      return `Scene ${activeSceneIndex + 1}`
    }
    return `${firstAction.operation_action_name} · ${firstAction.relationship_type}`
  }, [activeSceneData, activeSceneIndex])

  const goToNextScene = () => {
    setActiveSceneIndex((current) => Math.min(totalScenes - 1, current + 1))
  }

  const goToPreviousScene = () => {
    setActiveSceneIndex((current) => Math.max(0, current - 1))
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <p className="eyebrow">Graphic Stories · Interactive dossier</p>
        <h1>Panel-based Graph Explorer</h1>
        <p>
          Step through key moments and watch how each panel reshapes the network of collaborators, messengers, and witnesses
          across the story world.
        </p>
      </header>

      <main className="visualization-panel" aria-live="polite">
        <div className="panel-nav">
          <button type="button" onClick={goToPreviousScene} disabled={activeSceneIndex === 0}>
            Previous
          </button>
          <div className="panel-status">
            <p className="eyebrow">Scene {activeSceneIndex + 1}</p>
            <p className="scene-title">{sceneTitle}</p>
            <p className="scene-count">{activeSceneIndex + 1} / {totalScenes}</p>
          </div>
          <button type="button" onClick={goToNextScene} disabled={activeSceneIndex === totalScenes - 1}>
            Next
          </button>
        </div>

        <div className="visualization-frame">
          <div className="viz-surface" role="img" aria-label={`Force graph for scene ${activeSceneIndex + 1}`}>
            <SceneGraph key={activeSceneIndex} sceneData={activeSceneData} />
          </div>
        </div>

        <section className="scene-notes" aria-label="Scene notes">
          <h2>Event log</h2>
          <ol>
            {activeSceneData.map((event) => (
              <li key={event.action_id}>
                <p className="event-name">
                  <strong>{event.operation_action_name}</strong>
                  <span>{event.relationship_type}</span>
                </p>
                <p className="event-description">{event.description}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  )
}

export default App
