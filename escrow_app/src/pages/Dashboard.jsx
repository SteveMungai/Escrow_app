import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './Dashboard.css'
import { useNavigate } from 'react-router-dom'
import WalletTopUp from './Topup'
import TransactionHistory from './TransactionHistory'
import AllEscrows from './AllEscrows'

const STATUS_LABEL = {
  pending: 'Pending',
  progress: 'Progress',
  complete: 'Complete',
}

function PersonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" fill="#ffffff" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="#ffffff" />
    </svg>
  )
}

function StarIcon({ filled }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? '#144272' : 'none'}>
      <path
        d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5-4.8-4.6 6.6-.9L12 2.5z"
        stroke="#144272"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TRANSACTION_TITLE(type) {
  switch (type) {
    case 'topup':
      return 'Wallet Top-up'
    case 'funding':
      return 'Escrow Funding'
    case 'milestone_release':
      return 'Milestone Release'
    case 'withdrawal':
      return 'Withdrawal'
    default:
      return type || 'Transaction'
  }
}

function Dashboard() {
  const navigate = useNavigate()

  const storedUser = JSON.parse(localStorage.getItem('user') || 'null')
  const token = localStorage.getItem('token')
  const userId = storedUser?.user_id
  const userName = storedUser?.name || 'there'
  const [userRating, setUserRating] = useState(storedUser?.rating ?? 5)

  const [escrows, setEscrows] = useState([])
  const [transactions, setTransactions] = useState([])
  const [walletBalance, setWalletBalance] = useState(0)
  const [showTopUp, setShowTopUp] = useState(false)
  const [showAllTransactions, setShowAllTransactions] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [showAllEscrows, setShowAllEscrows] = useState(false)


  const refreshProfile = () => {
  if (!userId || !token) return
  fetch('/api/users/me', { headers: { Authorization: `Bearer ${token}` } })
    .then((res) => (res.ok ? res.json() : Promise.reject()))
    .then((data) => setUserRating(data.rating ?? 5))
    .catch(() => {})
  }

  useEffect(() => {refreshProfile()},
  // eslint-disable-next-line react-hooks/exhaustive-deps
   [userId, token])

   //the above comment disables ESLint errors that would state that the dependencies of the useEffect hook are not complete. Helps when we want to run this effect when the userId or token changes, and not on every render.
  const refreshWallet = () => {
    if (!userId || !token) return

    fetch(`/api/wallet/${userId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setWalletBalance(data.balance ?? 0))
      .catch(() => setLoadError('Could not load your wallet balance.'))
  }

  useEffect(() => {
    if (!userId || !token) {
      navigate('/login')
    }
  }, [userId, token, navigate])

  // ---------- Wallet balance ----------
  useEffect(() => {
    refreshWallet()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, token])

  // ---------- Transaction history ----------
  const refreshTransactions = () => {
    if (!userId || !token) return
    fetch(`/api/wallet/history/${userId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setTransactions(Array.isArray(data) ? data : []))
      .catch(() => setLoadError('Could not load your transaction history.'))
  }

  useEffect(() => {
    refreshTransactions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, token])

  // ---------- This user's escrows ----------
  useEffect(() => {
    if (!userId) return

    Promise.all([
      fetch(`/api/clients?user_id=${userId}`).then((r) => (r.ok ? r.json() : [])),
      fetch('/api/freelancers').then((r) => (r.ok ? r.json() : [])),
      fetch('/api/projects').then((r) => (r.ok ? r.json() : [])),
      fetch('/api/escrows').then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([clients, freelancers, projects, escrowList]) => {
        const clientIds = clients.map((c) => c.client_id)
        const freelancerIds = freelancers
          .filter((f) => f.user_id === userId)
          .map((f) => f.freelancer_id)

        const myProjects = projects.filter(
          (p) => clientIds.includes(p.client_id) || freelancerIds.includes(p.freelancer_id)
        )

        const escrowByProject = {}
        escrowList.forEach((e) => {
          escrowByProject[e.project_id] = e.amount_held
        })

        setEscrows(
          myProjects.map((p) => ({
            id: p.project_id,
            title: p.project_title,
            client: `Client #${p.client_id}`,
            amount: escrowByProject[p.project_id] ?? 0,
            status:
              p.status === 'completed' ? 'complete' : p.status === 'funded' ? 'progress' : 'pending',
          }))
        )
      })
      .catch(() => setLoadError('Could not load your escrows.'))
  }, [userId])

  // Preview only the 3 most recent transactions inline 
  const previewTransactions = transactions.slice(0, 3)

  return (
    <div className="dashboard-page">
      <Navbar active="dashboard" />

      <main className="dashboard-main">
        {loadError && <p className="login-error">{loadError}</p>}

        <div className="dashboard-grid">
          {/* ---------- Left column ---------- */}
          <div className="dashboard-col">
            <div className="dashboard-header">
              <h1>{userName}'s Dashboard</h1>
              <p className="dashboard-welcome">Welcome back, {userName}!</p>
              <div className="dashboard-stars" aria-label="Freelancer rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <StarIcon key={n} filled={n <= Math.round(userRating)} />
                ))}
              </div>
              <div className="dashboard-header-actions">
                <button className="dash-btn dash-btn-filled" onClick={() => navigate('/escrows/create')}>
                  <span className="dash-btn-icon">+</span> Create Escrow
                </button>
                <button className="dash-btn dash-btn-outline" onClick={() => navigate('/rate-freelancers')}>
                  Rate Freelancers
                </button>
              </div>
            </div>

            <section className="dashboard-section">
              <h2>Active Escrows</h2>
              <div className="dashboard-list">
                {escrows.length === 0 && <p className="dash-row-sub">No escrows yet.</p>}
                {escrows.map((escrow) => (
                  <div className="dash-row" key={escrow.id}>
                    <span className="dash-avatar"><PersonIcon /></span>
                    <div className="dash-row-info">
                      <p className="dash-row-title">{escrow.title}</p>
                      <p className="dash-row-sub">{escrow.client}</p>
                    </div>
                    <div className="dash-row-right">
                      <p className="dash-row-amount">Ksh {escrow.amount.toLocaleString()}</p>
                      <p className="dash-row-amount-label">Total Escrowed</p>
                    </div>
                    <span className={`dash-badge dash-badge-${escrow.status}`}>
                      {STATUS_LABEL[escrow.status]}
                    </span>
                  </div>
                ))}
              </div>
                <button className="dash-view-all" onClick={() => setShowAllEscrows(true)}>View all Escrows</button>
          <AllEscrows isOpen={showAllEscrows} onClose={() => setShowAllEscrows(false)}escrows={escrows}onView={(id) => {
              setShowAllEscrows(false)
              navigate(`/escrows/${id}`)
            }}
          />
            </section>
          </div>

          {/* ---------- Right column ---------- */}
          <div className="dashboard-col">
            <div className="dashboard-wallet">
              <span className="wallet-icon">💳</span>
              <h3>Your wallet</h3>
              <p className="wallet-sub">
                Funds are secured by SecurePay Escrow Services.
              </p>
              <p className="wallet-label">Net Balance</p>
              <p className="wallet-balance">Ksh {walletBalance.toLocaleString()}</p>
              <button className="dash-btn dash-btn-filled wallet-topup-btn" onClick={() => setShowTopUp(true)}>
                <span className="dash-btn-icon">↑</span> Top up
              </button>

              <WalletTopUp
                isOpen={showTopUp}
                onClose={() => setShowTopUp(false)}
                userId={userId}
                onSuccess={() => {
                  refreshWallet()
                  refreshTransactions()
                }}
              />
            </div>

            <section className="dashboard-section">
              <h2>Transaction History</h2>
              <div className="dashboard-list">
                {previewTransactions.length === 0 && <p className="dash-row-sub">No transactions yet.</p>}
                {previewTransactions.map((tx) => (
                  <div className="dash-row dash-row-light" key={tx.id}>
                    <span className="dash-avatar dash-avatar-dark"><PersonIcon /></span>
                    <div className="dash-row-info">
                      <p className="dash-row-title dash-row-title-dark">{TRANSACTION_TITLE(tx.type)}</p>
                      <p className="dash-row-sub dash-row-sub-dark">{tx.status}</p>
                    </div>
                    <div className="dash-row-right">
                      <p className="dash-row-amount dash-row-amount-dark">
                        Ksh {Number(tx.amount).toLocaleString()}
                      </p>
                      <p className="dash-row-amount-label dash-row-amount-label-dark">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="dash-view-all" onClick={() => setShowAllTransactions(true)}>
                View all transactions
              </button>

              <TransactionHistory
                isOpen={showAllTransactions}
                onClose={() => setShowAllTransactions(false)}
                transactions={transactions}
              />
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default Dashboard