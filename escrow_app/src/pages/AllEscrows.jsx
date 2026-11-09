import './Transactionhistory.css'

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

function AllEscrows({ isOpen, onClose, escrows = [], onView }) {
  if (!isOpen) return null

  return (
    <div className="th-overlay" onClick={onClose}>
      <div className="th-panel" onClick={(e) => e.stopPropagation()}>
        <div className="th-header">
          <h2>All Escrows</h2>
          <button className="th-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="th-list">
          {escrows.length === 0 && <p className="th-empty">No escrows yet.</p>}

          {escrows.map((escrow) => (
            <div
              className="dash-row dash-row-light"
              key={escrow.id}
              onClick={() => onView?.(escrow.id)}
              style={{ cursor: onView ? 'pointer' : 'default' }}
            >
              <span className="dash-avatar dash-avatar-dark"><PersonIcon /></span>
              <div className="dash-row-info">
                <p className="dash-row-title dash-row-title-dark">{escrow.title}</p>
                <p className="dash-row-sub dash-row-sub-dark">{escrow.client}</p>
              </div>
              <div className="dash-row-right">
                <p className="dash-row-amount dash-row-amount-dark">
                  Ksh {escrow.amount.toLocaleString()}
                </p>
                <p className="dash-row-amount-label dash-row-amount-label-dark">
                  {STATUS_LABEL[escrow.status]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AllEscrows