import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { authFetch } from '../auth'
import './Escrow.css'

const MOCK_ESCROWS = [
  { id: 1, title: 'Instagram Ad Campaign Setup', client: 'Nicholas Ali' },
  { id: 2, title: 'Advertisement Creation', client: 'Tim Jackson' },
  { id: 3, title: 'LinkedIn Profile Management', client: 'Abdul Abdala' },
]

function PersonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" fill="#ffffff" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="#ffffff" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 7h14M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-9 0 1 13a1 1 0 001 1h8a1 1 0 001-1l1-13"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Escrows() {
  const navigate = useNavigate()
  const storedUser = JSON.parse(localStorage.getItem('user') || 'null')
  const userId = storedUser?.user_id

  const [escrows, setEscrows] = useState(MOCK_ESCROWS)
  const [loading, setLoading] = useState(true)
  const [manageMode, setManageMode] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    Promise.all([
      fetch('/api/clients').then((r) => (r.ok ? r.json() : [])),
      fetch('/api/freelancers').then((r) => (r.ok ? r.json() : [])),
      fetch('/api/users').then((r) => (r.ok ? r.json() : [])),
      fetch('/api/projects').then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([clients, freelancers, users, projects]) => {
        const userById = Object.fromEntries(users.map((u) => [u.user_id, u]))
        const clientById = Object.fromEntries(clients.map((c) => [c.client_id, c]))

        const myClientIds = clients.filter((c) => c.user_id === userId).map((c) => c.client_id)
        const myFreelancerIds = freelancers
          .filter((f) => f.user_id === userId)
          .map((f) => f.freelancer_id)

        const myProjects = projects.filter(
          (p) => myClientIds.includes(p.client_id) || myFreelancerIds.includes(p.freelancer_id)
        )

        if (myProjects.length > 0) {
          setEscrows(
            myProjects.map((p) => {
              const client = clientById[p.client_id]
              const clientUser = client ? userById[client.user_id] : null
              return {
                id: p.project_id,
                title: p.project_title,
                client: clientUser?.name || `Client #${p.client_id}`,
              }
            })
          )
        } else {
          setEscrows([])
        }
      })
      .catch(() => {
        // backend not reachable yet — keep the placeholder rows
      })
      .finally(() => setLoading(false))
  }, [userId])

  const handleView = (id) => {
    navigate(`/escrows/${id}`)
  }

  const handleCreate = () => {
    navigate('/escrows/create')
  }

  const handleToggleManage = () => {
    setDeleteError('')
    setManageMode((m) => !m)
  }

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Delete this escrow? This can't be undone.")
    if (!confirmed) return

    setDeleteError('')
    setDeletingId(id)

    try {
      const res = await authFetch(`/api/projects/${id}`, { method: 'DELETE' })

      if (res.status === 409) {
        const data = await res.json().catch(() => ({}))
        const counts = data.counts || {}
        const summary = Object.entries(counts)
          .filter(([, count]) => count > 0)
          .map(([label, count]) => `${count} ${label}`)
          .join(', ')

        const confirmedCascade = window.confirm(
          `This will also delete: ${summary || 'linked records'}. This can't be undone. Continue?`
        )
        if (!confirmedCascade) return

        const cascadeRes = await authFetch(`/api/projects/${id}?cascade=true`, { method: 'DELETE' })
        const cascadeData = await cascadeRes.json().catch(() => ({}))
        if (!cascadeRes.ok) {
          setDeleteError(cascadeData.error || 'Something went wrong deleting this escrow.')
          return
        }
        setEscrows((prev) => prev.filter((e) => e.id !== id))
        return
      }

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setDeleteError(data.error || 'Something went wrong deleting this escrow.')
        return
      }
      setEscrows((prev) => prev.filter((e) => e.id !== id))
    } catch {
      setDeleteError('Could not reach the server. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="escrows-page">
      <Navbar active="escrows" />

      <main className="escrows-main">
        <h1 className="escrows-title">Created Escrows</h1>

        {deleteError && <p className="escrows-delete-error">{deleteError}</p>}

        <div className="escrows-list">
          {loading && <p className="escrows-loading">Loading escrows…</p>}

          {!loading && escrows.length === 0 && (
            <p className="escrows-empty">No escrows yet — create one to get started.</p>
          )}

          {escrows.map((escrow) => (
            <div className="escrow-row" key={escrow.id}>
              <div className="escrow-row-left">
                <span className="escrow-avatar"><PersonIcon /></span>
                <div>
                  <p className="escrow-row-title">{escrow.title}</p>
                  <p className="escrow-row-client">{escrow.client}</p>
                </div>
              </div>

              {manageMode ? (
                <button
                  className="escrow-delete-btn"
                  onClick={() => handleDelete(escrow.id)}
                  disabled={deletingId === escrow.id}
                  aria-label={`Delete ${escrow.title}`}
                >
                  {deletingId === escrow.id ? '…' : <TrashIcon />}
                </button>
              ) : (
                <button className="escrow-view-btn" onClick={() => handleView(escrow.id)}>
                  View
                  <span className="escrow-view-arrow"><ArrowRightIcon /></span>
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="escrows-actions">
          <button className="escrows-action-btn" onClick={handleCreate}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#ffffff" strokeWidth="2" />
              <path d="M12 8v8M8 12h8" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Create Escrow
          </button>
          <button className="escrows-action-btn" onClick={handleToggleManage}>
            <TrashIcon />
            {manageMode ? 'Done' : 'Delete Escrow'}
          </button>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default Escrows