import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './Dashboard.css'



const MOCK_ESCROWS = [
  { id: 1, title: 'Instagram Ad Campaign Setup', client: 'Nicholas Ali', amount: 10000, status: 'pending' },
  { id: 2, title: 'Social Media Management for Alphs Industries Ltd', client: 'Rick Owens', amount: 30000, status: 'progress' },
  { id: 3, title: 'LinkedIn Brand Growth Strategy', client: 'Jane Barbra', amount: 5000, status: 'complete' },
]

const MOCK_TRANSACTIONS = [
  { id: 1, title: 'Instagram Ad Campaign Setup', client: 'Nicholas Ali', amount: 10000, date: '19/1/2026' },
  { id: 2, title: 'LinkedIn Brand Growth Strategy', client: 'Jane Barbra', amount: 5000, date: '15/1/2026' },
  { id: 3, title: 'LinkedIn Brand Growth Strategy', client: 'Jane Barbra', amount: 5000, date: '24/12/2025' },
]

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

function Dashboard({ userName = 'John' }) {
  const [escrows, setEscrows] = useState(MOCK_ESCROWS)
  const [transactions] = useState(MOCK_TRANSACTIONS)
  const [walletBalance] = useState(110000)
  

  useEffect(() => {
    fetch('/api/projects')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (Array.isArray(data) && data.length) {
          setEscrows(
            data.slice(0, 3).map((p) => ({
              id: p.project_id,
              title: p.project_title,
              client: `Client #${p.client_id}`,
              amount: 0,
              status: p.status === 'completed' ? 'complete' : p.status === 'funded' ? 'progress' : 'pending',
            }))
          )
        }
      })
      .catch(() => {
        // backend not reachable yet — keep placeholder rows
      })
  }, [])


  return (
    <div className="dashboard-page">
      <Navbar active="dashboard" />

      <main className="dashboard-main">
        <div className="dashboard-grid">
          {/* ---------- Left column ---------- */}
          <div className="dashboard-col">
            <div className="dashboard-header">
              <h1>{userName}'s Dashboard</h1>
              <p className="dashboard-welcome">Welcome back, {userName}!</p>
              <div className="dashboard-stars" aria-label="Freelancer rating">
                {[1, 2, 3, 4].map((n) => <StarIcon key={n} filled />)}
                <StarIcon filled={false} />
              </div>
              <div className="dashboard-header-actions">
                <button className="dash-btn dash-btn-filled">
                  <span className="dash-btn-icon">+</span> Create Escrow
                </button>
                <button className="dash-btn dash-btn-outline">Rate Freelancers</button>
              </div>
            </div>

            <section className="dashboard-section">
              <h2>Active Escrows</h2>
              <div className="dashboard-list">
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
              <button className="dash-view-all">View all Escrows</button>
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
              <button className="dash-btn dash-btn-filled wallet-topup-btn">
                <span className="dash-btn-icon">↑</span> Top up
              </button>
            </div>

            <section className="dashboard-section">
              <h2>Transaction History</h2>
              <div className="dashboard-list">
                {transactions.map((tx) => (
                  <div className="dash-row dash-row-light" key={tx.id}>
                    <span className="dash-avatar dash-avatar-dark"><PersonIcon /></span>
                    <div className="dash-row-info">
                      <p className="dash-row-title dash-row-title-dark">{tx.title}</p>
                      <p className="dash-row-sub dash-row-sub-dark">{tx.client}</p>
                    </div>
                    <div className="dash-row-right">
                      <p className="dash-row-amount dash-row-amount-dark">Ksh {tx.amount.toLocaleString()}</p>
                      <p className="dash-row-amount-label dash-row-amount-label-dark">{tx.date}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="dash-view-all">View all transactions</button>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default Dashboard