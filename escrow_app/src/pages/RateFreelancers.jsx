import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './Dashboard.css'

function PersonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" fill="#ffffff" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="#ffffff" />
    </svg>
  )
}

/*Style for the star icon in rating*/
function StarPicker({ value, onChange }) {
  return (
    <div aria-label="Select rating" style={{ display: 'flex', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill={n <= value ? '#f2ff00' : 'none'}
          onClick={() => onChange(n)}
          style={{ cursor: 'pointer' }}
        >
          <path
            d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5-4.8-4.6 6.6-.9L12 2.5z"
            stroke="#ffffff"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </div>
  )
}

function RateFreelancers() {
  const navigate = useNavigate()
  const storedUser = JSON.parse(localStorage.getItem('user') || 'null')
  const token = localStorage.getItem('token')
  const userId = storedUser?.user_id
  const userName = storedUser?.name || 'there'

  const [pending, setPending] = useState([])
  const [ratings, setRatings] = useState({})
  const [comments, setComments] = useState({})
  const [submittingId, setSubmittingId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userId || !token) {
      navigate('/login')
    }
  }, [userId, token, navigate])

  useEffect(() => {
    if (!userId) return

    // A completed project the logged-in user was the client on, with a freelancer attached and no review from this user for it yet, is something they can rate.
    Promise.all([
      fetch(`/api/clients?user_id=${userId}`).then((r) => (r.ok ? r.json() : [])),
      fetch('/api/projects').then((r) => (r.ok ? r.json() : [])),
      fetch('/api/freelancers').then((r) => (r.ok ? r.json() : [])),
      fetch('/api/reviews').then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([clients, projects, freelancers, reviews]) => {
        const clientIds = clients.map((c) => c.client_id)
        const completed = projects.filter(
          (p) => clientIds.includes(p.client_id) && p.status === 'completed' && p.freelancer_id
        )

        const alreadyRated = new Set(
          reviews
            .filter((r) => r.Reviewer_id === userId)
            .map((r) => `${r.project_id}-${r.Reviewee_id}`)
        )

        const freelancerById = Object.fromEntries(freelancers.map((f) => [f.freelancer_id, f]))

        setPending(
          completed
            .filter((p) => !alreadyRated.has(`${p.project_id}-${p.freelancer_id}`))
            .map((p) => ({
              projectId: p.project_id,
              projectTitle: p.project_title,
              freelancerId: p.freelancer_id,
              freelancerName:
                freelancerById[p.freelancer_id]?.freelancer_name || `Freelancer #${p.freelancer_id}`,
            }))
        )
      })
      .catch(() => setError('Could not load your completed escrows right now.'))
  }, [userId])

  const submitRating = async (item) => {
    const rating = ratings[item.projectId] || 0
    if (!rating) {
      setError('Select a star rating before submitting.')
      return
    }
    setSubmittingId(item.projectId)
    setError('')
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reviewer_id: userId,
          reviewee_id: item.freelancerId,
          project_id: item.projectId,
          rating,
          comment: comments[item.projectId] || '',
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Could not submit rating.')
      }
      setPending((prev) => prev.filter((p) => p.projectId !== item.projectId))
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmittingId(null)
    }
  }

  return (
    <div className="dashboard-page">
      <Navbar active="dashboard" />

      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1>{userName}'s Dashboard</h1>
          <p className="dashboard-welcome">Rate freelancers from your completed escrows.</p>
        </div>

        {error && <p className="login-error">{error}</p>}

        <section className="dashboard-section">
          <h2>Pending Ratings</h2>
          <div className="dashboard-list">
            {pending.length === 0 && (
              <p className="dash-row-sub">No completed escrows waiting for a rating.</p>
            )}
            {pending.map((item) => (
              <div className="dash-row" key={`${item.projectId}-${item.freelancerId}`}>
                <span className="dash-avatar"><PersonIcon /></span>
                <div className="dash-row-info">
                  <p className="dash-row-title">{item.projectTitle}</p>
                  <p className="dash-row-sub">{item.freelancerName}</p>
                  <textarea
                    placeholder="Optional comment"
                    value={comments[item.projectId] || ''}
                    onChange={(e) =>
                      setComments((prev) => ({ ...prev, [item.projectId]: e.target.value }))
                    }
                    style={{ width: '100%', marginTop: '8px', borderRadius: '5px', padding: '6px' }}
                  />
                </div>
                <div className="dash-row-right">
                  <StarPicker
                    value={ratings[item.projectId] || 0}
                    onChange={(n) => setRatings((prev) => ({ ...prev, [item.projectId]: n }))}
                  />
                  <button
                    className="dash-btn dash-btn-filled"
                    disabled={submittingId === item.projectId}
                    onClick={() => submitRating(item)}
                    style={{ marginTop: '8px' }}
                  >
                    {submittingId === item.projectId ? 'Submitting…' : 'Submit rating'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button className="dash-view-all" onClick={() => navigate('/dashboard')}>
            Back to dashboard
          </button>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default RateFreelancers