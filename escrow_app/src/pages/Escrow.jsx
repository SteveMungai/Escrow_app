import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './Escrow.css'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'

//Placeholder values

const MOCK_ESCROWS = [
  { id: 1, title: 'Social Media Management for Alpha Industries.Co', client: 'Rick Olweny' },
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

function Escrows() {
  const [escrows, setEscrows] = useState(MOCK_ESCROWS)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/projects')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (Array.isArray(data) && data.length) {
          setEscrows(
            data.map((p) => ({
              id: p.project_id,
              title: p.project_title,
              client: `Client #${p.client_id}`,
            }))
          )
        }
      })
      .catch(() => {
        // Placeholder values as backend isn't reachable
      })
      .finally(() => setLoading(false))
  }, [])

  const handleView = (id) => {
    navigate(`/escrows/${id}`)
  }

    const handleCreate = () => {
    console.log('open create-escrow form')
  }

  const handleDelete = () => {
    console.log('open delete-escrow flow')
  }

    return (
      <div className="escrows-page">
        <Navbar active="escrows" />
  
        <main className="escrows-main">
          <h1 className="escrows-title">Created Escrows</h1>
  
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
                <button className="escrow-view-btn" onClick={() => handleView(escrow.id)}>
                  View
                  <span className="escrow-view-arrow"><ArrowRightIcon /></span>
                </button>
              </div>
            ))}
          </div>
  
          <div className="escrows-actions">
            <Link to="/escrows/create" className="escrows-action-link">
              <button className="escrows-action-btn" onClick={handleCreate}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="#ffffff" strokeWidth="2" />
                  <path d="M12 8v8M8 12h8" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Create Escrow
              </button>
            </Link>

            <button className="escrows-action-btn" onClick={handleDelete}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 7h14M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-9 0 1 13a1 1 0 001 1h8a1 1 0 001-1l1-13" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Delete Escrow
            </button>
          </div>
        </main>
  
        <Footer />
      </div>
    )
  }
  
  export default Escrows
  
