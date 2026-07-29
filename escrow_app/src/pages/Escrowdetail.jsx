import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { authFetch } from '../auth'
import './EscrowDetail.css'

const STATUS_LABEL = {
  created: 'Pending',
  funded: 'In Progress',
  completed: 'Completed',
}

function formatDate(value) {
  if (!value) return 'No date set'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'No date set'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}
/*Icon for the star rating display*/
function StarRow({ rating }) {
  const rounded = Math.round(rating || 0)
  return (
    <span className="ed-star-row" aria-label={`Rating: ${rating ?? 0} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width="14" height="14" viewBox="0 0 24 24" fill={n <= rounded ? '#f59e0b' : 'none'}>
          <path
            d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5-4.8-4.6 6.6-.9L12 2.5z"
            stroke="#f59e0b"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </span>
  )
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


function deriveMilestoneStates(milestones) {
  let activeAssigned = false
  return milestones.map((m) => {
    const isDone = m.status === 'released' || m.status === 'completed'
    let state = 'pending'
    if (isDone) {
      state = 'complete'
    } else if (!activeAssigned) {
      state = 'in_progress'
      activeAssigned = true
    }
    return { ...m, state }
  })
}

function EscrowDetail() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [escrow, setEscrow] = useState(null)
  const [freelancer, setFreelancer] = useState(null)
  const [milestones, setMilestones] = useState([])
  const [activeMilestoneId, setActiveMilestoneId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [releasing, setReleasing] = useState(false)
  const [actionError, setActionError] = useState('')

  const [showAddForm, setShowAddForm] = useState(false)
  const [newMilestone, setNewMilestone] = useState({ title: '', description: '', amount: '', deadline: '' })
  const [addingMilestone, setAddingMilestone] = useState(false)

  const loadData = useCallback(() => {
    setLoading(true)
    setLoadError('')
    fetch(`/api/projects/${id}/full`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setProject(data.project)
        setEscrow(data.escrow)
        setFreelancer(data.freelancer)
        const withStates = deriveMilestoneStates(data.milestones)
        setMilestones(withStates)
        const active = withStates.find((m) => m.state === 'in_progress') || withStates[0]
        setActiveMilestoneId(active ? active.milestone_id : null)
      })
      .catch(() => setLoadError("Couldn't load this escrow. It may not exist yet."))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const activeMilestone = milestones.find((m) => m.milestone_id === activeMilestoneId)

  const handleReleaseFunds = async () => {
    if (!escrow || !activeMilestone) return
    setActionError('')
    setReleasing(true)
    try {
      const res = await authFetch(`/api/escrows/${escrow.Escrow_id}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: activeMilestone.amount, milestone_id: activeMilestone.milestone_id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'Could not release funds.')
      }
      loadData()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setReleasing(false)
    }
  }

  const handleAddMilestone = async (e) => {
    e.preventDefault()
    setActionError('')

    if (!newMilestone.title || !newMilestone.description) {
      setActionError('Please fill in a title and description for the milestone.')
      return
    }

    setAddingMilestone(true)
    try {
      const res = await authFetch('/api/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.project_id,
          title: newMilestone.title,
          description: newMilestone.description,
          amount: parseFloat(newMilestone.amount) || 0,
          deadline: newMilestone.deadline || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'Could not add milestone.')
      }
      setNewMilestone({ title: '', description: '', amount: '', deadline: '' })
      setShowAddForm(false)
      loadData()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setAddingMilestone(false)
    }
  }

  if (loading) {
    return (
      <div className="ed-page">
        <Navbar active="escrows" />
        <p className="ed-loading">Loading escrow…</p>
        <Footer />
      </div>
    )
  }

  if (loadError || !project) {
    return (
      <div className="ed-page">
        <Navbar active="escrows" />
        <p className="ed-loading">{loadError || 'Escrow not found.'}</p>
        <Footer />
      </div>
    )
  }

  const statusLabel = STATUS_LABEL[project.status] || project.status
  const dueDate = milestones[0]?.deadline
  const totalAmount = escrow?.amount_held ?? 0
  const releasedAmount = escrow?.released_amount ?? 0

  return (
    <div className="ed-page">
      <Navbar active="escrows" />

      <header className="ed-hero">
        <div className="ed-hero-overlay" />
        <div className="ed-hero-content">
          <div>
            <h1>{project.project_title}</h1>
            <p className="ed-hero-date">
              <span className="ed-hero-icon">🕐</span> {formatDate(dueDate)}
              <span className="ed-hero-status">{statusLabel}</span>
            </p>
          </div>

          <div className="ed-hero-stats">
            <p><span className="ed-hero-icon">👤</span> {freelancer ? freelancer.freelancer_name : 'Unassigned'}</p>
            {freelancer && <StarRow rating={freelancer.average_rating} />}
            <p>
              <span className="ed-hero-icon">💳</span> Ksh {totalAmount.toLocaleString()}
              <span className="ed-hero-stat-note">is protected</span>
            </p>
            <p>
              <span className="ed-hero-icon">🚩</span> Ksh {releasedAmount.toLocaleString()}
              <span className="ed-hero-stat-note">was released</span>
            </p>
          </div>
        </div>
      </header>

      <main className="ed-main">
        <section className="ed-milestones-col">
          <h2>MILESTONES</h2>

          {actionError && <p className="ed-action-error">{actionError}</p>}

          <div className="ed-milestone-list">
            {milestones.length === 0 && <p className="ed-empty">No milestones yet.</p>}

            {milestones.map((m) => (
              <button
                key={m.milestone_id}
                className={`ed-milestone-card ${activeMilestoneId === m.milestone_id ? 'ed-milestone-card-active' : ''}`}
                onClick={() => setActiveMilestoneId(m.milestone_id)}
              >
                <div className="ed-milestone-top">
                  <p className="ed-milestone-title">{m.title}</p>
                  <span className="ed-milestone-amount">Ksh {Number(m.amount).toLocaleString()}</span>
                </div>
                <p className="ed-milestone-desc">{m.description}</p>
                <span className="ed-milestone-icon"><MilestoneStateIcon state={m.state} /></span>
              </button>
            ))}
          </div>

          {showAddForm ? (
            <form className="ed-add-form" onSubmit={handleAddMilestone}>
              <input
                className="ed-add-input"
                placeholder="Milestone title"
                value={newMilestone.title}
                onChange={(e) => setNewMilestone((f) => ({ ...f, title: e.target.value }))}
              />
              <textarea
                className="ed-add-input"
                placeholder="Description"
                rows={2}
                value={newMilestone.description}
                onChange={(e) => setNewMilestone((f) => ({ ...f, description: e.target.value }))}
              />
              <div className="ed-add-row">
                <input
                  className="ed-add-input"
                  type="number"
                  min="0"
                  placeholder="Amount (Ksh)"
                  value={newMilestone.amount}
                  onChange={(e) => setNewMilestone((f) => ({ ...f, amount: e.target.value }))}
                />
                <input
                  className="ed-add-input"
                  type="date"
                  value={newMilestone.deadline}
                  onChange={(e) => setNewMilestone((f) => ({ ...f, deadline: e.target.value }))}
                />
              </div>
              <div className="ed-add-row">
                <button type="submit" className="ed-add-milestone-btn" disabled={addingMilestone}>
                  {addingMilestone ? 'Adding…' : 'Save milestone'}
                </button>
                <button type="button" className="ed-add-cancel-btn" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button className="ed-add-milestone-btn" onClick={() => setShowAddForm(true)}>
              Add milestone
            </button>
          )}
        </section>

        <section className="ed-status-col">
          <h2>STATUS</h2>

          <div className="ed-status-card">
            {activeMilestone ? (
              <>
                <h3>{activeMilestone.title}</h3>
                <ul className="ed-status-checklist">
                  <li>
                    <span>Amount</span>
                    <span>Ksh {Number(activeMilestone.amount).toLocaleString()}</span>
                  </li>
                  <li>
                    <span>Deadline</span>
                    <span>{formatDate(activeMilestone.deadline)}</span>
                  </li>
                  <li>
                    <span>Status</span>
                    <span className="ed-check">
                      {activeMilestone.state === 'complete' ? '✓' : activeMilestone.state === 'in_progress' ? '…' : '–'}
                    </span>
                  </li>
                </ul>

                <button
                  className="ed-release-btn"
                  onClick={handleReleaseFunds}
                  disabled={releasing || activeMilestone.state === 'complete'}
                >
                  {activeMilestone.state === 'complete'
                    ? 'Already released'
                    : releasing
                      ? 'Releasing…'
                      : 'Release funds'}
                </button>
              </>
            ) : (
              <p>No milestone selected.</p>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default EscrowDetail