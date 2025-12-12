import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './about.css'

const pillars = [
  {
    title: 'Character Interaction Networks',
    body: 'We model stories as dynamic social graphs, where nodes represent characters and directed edges encode the temporal-causal structure of interactions, capturing who interacts with whom and how often.',
  },
  {
    title: 'Archetypometrics Framework',
    body: 'Beyond social links, we map character psychology along three semantic dimensions: Fool–Hero (competence), Angel–Demon (morality), and Traditionalist–Adventurer (openness).',
  },
  {
    title: 'Event Detection via Transformation',
    body: 'We identify key narrative events not just by plot points, but as inflection points where character archetype trajectories shift sharply, grounding plot structure in psychological change.',
  },
]

const methods = [
  {
    title: 'LLM-Powered Annotation',
    detail: 'A two-stage pipeline extracts relationship operations and scores archetypes from raw text, generating structured JSON data for scene-wise analysis.',
  },
  {
    title: 'Force-Directed Simulation',
    detail: 'A custom physics engine built with React and D3 that prevents node overlap and uses quadratic Bézier curves to visualize concurrent character interactions.',
  },
  {
    title: 'Archetype Time Series',
    detail: 'Detailed character dossiers that visualize the evolution of personality scores across scenes, linking quantitative metrics to LLM-generated textual justifications.',
  },
]

const milestones = [
  { year: '2024', detail: 'Developed the Graphic Stories dashboard using React, TypeScript, and Vite for high-performance client-side rendering.' },
  { year: '2025', detail: 'Published "Characters and Archetypes for Story Decomposition," introducing the hybrid network-archetype framework.' },
  { year: '2026', detail: 'Implementing formal change-point detection algorithms to automatically segment stories based on archetype trajectory curvature.' },
]

function AboutPage() {
  return (
    <div className="about-shell">
      <header className="about-hero">
        <div>
          <p className="eyebrow">Graphic Stories</p>
          <h1>About the Project</h1>
          <p className="lede">
            Graphic Stories is a computational narrative analysis system that decomposes stories into interpretable
            interaction networks and character archetype dynamics. We combine large language models with network science to
            explore how characters evolve over time.
          </p>
        </div>
        <nav className="primary-nav">
          <a href="/">Stories Viewer</a>
          <a className="active" href="/about.html">
            About
          </a>
        </nav>
      </header>

      <section className="about-intro">
        <article>
          <h2>What we are building</h2>
          <p>
            We are building a hybrid architecture for automated story decomposition. By extracting relationship operations
            and tracking 'Fool vs. Hero', 'Angel vs. Demon', and 'Traditionalist vs. Adventurer' scores, our system
            visualizes the deep semantic structure of narratives.
          </p>
        </article>
        <article>
          <h2>How to collaborate</h2>
          <p>
            Our research focuses on explainable narrative analysis and adaptive storytelling systems. We are actively
            expanding our dataset beyond Shakespeare to include diverse media and testing our archetype scoring against
            human annotations.
          </p>
          <a className="cta" href="mailto:contact@graphicstories.vercel.app">
            Contact the team →
          </a>
        </article>
      </section>

      <section className="about-grid">
        {pillars.map((pillar) => (
          <article key={pillar.title}>
            <h3>{pillar.title}</h3>
            <p>{pillar.body}</p>
          </article>
        ))}
      </section>

      <section className="methods">
        <header>
          <p className="eyebrow">Toolkit</p>
          <h2>Core methods</h2>
          <p>
            Each release is backed by reproducible methods so that faculty, students, and civic technologists can audit and
            remix our work.
          </p>
        </header>
        <div className="method-cards">
          {methods.map((method) => (
            <article key={method.title}>
              <h3>{method.title}</h3>
              <p>{method.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="milestones">
        <header>
          <p className="eyebrow">Roadmap</p>
          <h2>Milestones</h2>
          <p>Transparent checkpoints keep collaborators aligned and show how the viewer evolves semester by semester.</p>
        </header>
        <ul>
          {milestones.map((item) => (
            <li key={item.year}>
              <span className="year">{item.year}</span>
              <p>{item.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <footer className="about-footer">
        <p>© {new Date().getFullYear()} Graphic Stories Lab</p>
        <p>
          Built with React, TypeScript, and SWC · <a href="mailto:hello@graphicstories.edu">hello@graphicstories.edu</a>
        </p>
      </footer>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AboutPage />
  </StrictMode>,
)
