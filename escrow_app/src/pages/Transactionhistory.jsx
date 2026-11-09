import './Transactionhistory.css'

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

function TransactionHistory({ isOpen, onClose, transactions = [] }) {
  if (!isOpen) return null

  return (
    <div className="th-overlay" onClick={onClose}>
      <div className="th-panel" onClick={(e) => e.stopPropagation()}>
        <div className="th-header">
          <h2>All Transactions</h2>
          <button className="th-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="th-list">
          {transactions.length === 0 && <p className="th-empty">No transactions yet.</p>}

          {transactions.map((tx) => (
            <div className="dash-row dash-row-light" key={tx.id}>
              <span className="dash-avatar dash-avatar-dark">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" fill="#ffffff" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="#ffffff" />
                </svg>
              </span>
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
      </div>
    </div>
  )
}

export default TransactionHistory