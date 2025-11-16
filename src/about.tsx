import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './about.css'

const pillars = [
  {
    title: 'Narrative Science',
    body: 'We pair qualitative methods with spatial analytics so each story stays grounded in lived experiences and measurable change.',
  },
  {
    title: 'Responsible Technology',
    body: 'Every prototype documents data provenance, bias checks, and accessibility guardrails before moving into production.',
  },
  {
    title: 'Studio Partnerships',
    body: 'Graphic Stories works with studios, labs, and civic partners to co-design visual languages that travel beyond the screen.',
  },
]

const methods = [
  {
    title: 'Field Kits',
    detail: 'Interview prompts, sketch templates, and sample consent language for on-site data collection.',
  },
  {
    title: 'Data Loom',
    detail: 'A lightweight processing pipeline using TypeScript, Vite, and SWC to generate ready-to-embed visual layers.',
  },
  {
    title: 'Story Reviews',
    detail: 'Peer feedback sessions that check clarity, ethics, and resonance before a story ships.',
  },
]

const milestones = [
  { year: '2024', detail: 'Research consortium founded with three academic partners and five civic studios.' },
  { year: '2025', detail: 'Released Stories Viewer alpha with live filtering and temporal annotations.' },
  { year: '2026', detail: 'Planning residency program and publishing the first open curriculum for narrative visualization.' },
]

function AboutPage() {
  return (
    <div className="about-shell">
      <header className="about-hero">
        <div>
          <p className="eyebrow">Graphic Stories</p>
          <h1>About the Project</h1>
          <p className="lede">
            Graphic Stories is an academic initiative focused on building collaborative tooling for data-rich narratives. We
            merge speculative design with rigorous research workflows to help teams move from insights to compelling stories.
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
            Graphic Stories delivers an open toolkit for visual storytelling — from modular canvases for experimentation to
            ready-to-teach curricula. The project is currently incubated inside a consortium of universities and cultural
            institutions that care deeply about equitable technology.
          </p>
        </article>
        <article>
          <h2>How to collaborate</h2>
          <p>
            We host seasonal studios, partner residencies, and fellowships for emerging scholars. If you are interested in
            piloting our viewer, participating in critique sessions, or commissioning custom research, reach out to our
            coordination team.
          </p>
          <a className="cta" href="mailto:hello@graphicstories.edu">
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
