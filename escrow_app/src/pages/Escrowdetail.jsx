import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './EscrowDetail.css'

const MOCK_ESCROW = {
  id: 1,
  title: 'Social Media Management for Alpha Industries.Co',
  counterpart: 'Rick Olweny',
  dueDate: '30th August 2026',
  status: 'In Progress',
  totalAmount: 30000,
  releasedAmount: 5000,
  milestones: [
    {
      id: 1,
      order: 1,
      title: 'Strategy & Content Planning',
      amount: 5000,
      description: 'Develop content strategy, target audience analysis, and monthly content calendar.',
      state: 'complete', // 'complete' | 'in_progress' | 'pending'
    },
    {
      id: 2,
      order: 2,
      title: 'Content Creation',
      amount: 25000,
      description: 'Develop content strategy, target audience analysis, and monthly content calendar.',
      state: 'in_progress',
    },
    {
      id: 3,
      order: 3,
      title: 'Performance Report',
      amount: 5000,
      description: 'Submit analytics report showing reach, engagement, and recommendations.',
      state: 'pending',
    },
  ],
}

function MilestoneStateIcon({ state }) {
  if (state === 'complete') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#16a34a" />
        <path d="M8 12l3 3 5-6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (state === 'in_progress') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#f59e0b" strokeWidth="2" />
        <path d="M12 7v5l3 2" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="#8a96a8" strokeWidth="2" strokeDasharray="3 3" />
    </svg>
  )
}

function EscrowDetail() {
  const { id } = useParams()
  const [escrow, setEscrow] = useState(MOCK_ESCROW)
  const [activeMilestone, setActiveMilestone] = useState(
    MOCK_ESCROW.milestones.find((m) => m.state === 'in_progress') || MOCK_ESCROW.milestones[0]
  )
  const [releasing, setReleasing] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/projects/${id}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setEscrow((prev) => ({ ...prev, title: data.project_title ?? prev.title }))
      })
      .catch(() => {
        // backend not reachable 
      })
  }, [id])

  const handleReleaseFunds = async () => {
    setReleasing(true)
    try {
      await fetch(`/api/escrows/${escrow.id}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: activeMilestone.amount }),
      })
    } catch {
      // surface a toast/error in a real implementation
    } finally {
      setReleasing(false)
    }
  }

  const handleAddMilestone = () => {
    console.log('open add-milestone form')
  }

  return (
    <div className="ed-page">
      <Navbar active="escrows" />

      <header className="ed-hero">
        <div className="ed-hero-overlay" />
        <div className="ed-hero-content">
          <div>
            <h1>{escrow.title}</h1>
            <p className="ed-hero-date">
              <span className="ed-hero-icon">🕐</span> {escrow.dueDate}
              <span className="ed-hero-status">{escrow.status}</span>
            </p>
          </div>

          <div className="ed-hero-stats">
            <p><span className="ed-hero-icon">👤</span> {escrow.counterpart}</p>
            <p>
              <span className="ed-hero-icon">💳</span> Ksh {escrow.totalAmount.toLocaleString()}
              <span className="ed-hero-stat-note">is protected</span>
            </p>
            <p>
              <span className="ed-hero-icon">🚩</span> Ksh {escrow.releasedAmount.toLocaleString()}
              <span className="ed-hero-stat-note">was released</span>
            </p>
          </div>
        </div>
      </header>

      <main className="ed-main">
        <section className="ed-milestones-col">
          <h2>MILESTONES</h2>

          <div className="ed-milestone-list">
            {escrow.milestones.map((m) => (
              <button
                key={m.id}
                className={`ed-milestone-card ${activeMilestone.id === m.id ? 'ed-milestone-card-active' : ''}`}
                onClick={() => setActiveMilestone(m)}
              >
                <div className="ed-milestone-top">
                  <p className="ed-milestone-title">{m.order}.{m.title}</p>
                  <span className="ed-milestone-amount">Ksh {m.amount.toLocaleString()}</span>
                </div>
                <p className="ed-milestone-desc">{m.description}</p>
                <span className="ed-milestone-icon"><MilestoneStateIcon state={m.state} /></span>
              </button>
            ))}
          </div>

          <button className="ed-add-milestone-btn" onClick={handleAddMilestone}>
            Add milestone
          </button>
        </section>

        <section className="ed-status-col">
          <h2>STATUS</h2>

          <div className="ed-status-card">
            <h3>MILESTONE {activeMilestone.order}</h3>
            <ul className="ed-status-checklist">
              <li>
                <span>Develop content strategy</span>
                <span className="ed-check">✓</span>
              </li>
              <li>
                <span>Target audience analysis</span>
                <span className="ed-check">✓</span>
              </li>
              <li>
                <span>Monthly content calendar</span>
                <span className="ed-check">✓</span>
              </li>
            </ul>

            <button
              className="ed-release-btn"
              onClick={handleReleaseFunds}
              disabled={releasing}
            >
              {releasing ? 'Releasing…' : 'Release funds'}
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default EscrowDetail