import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getCurrentUser, authFetch } from '../auth'
import './CreateEscrows.css'


function CreateEscrow({ onCreated }) {
  const [form, setForm] = useState({
    title: '',
    counterpartUsername: '',
    targetDate: '',
    scope: '',
    paymentType: 'single',
    totalAmount: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [balance, setBalance] = useState(null)
  const [balanceLoading, setBalanceLoading] = useState(true)

  useEffect(() => {
    authFetch('/api/users/me/balance')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setBalance(data.balance))
      .catch(() => setBalance(null))
      .finally(() => setBalanceLoading(false))
  }, [])

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const amount = parseFloat(form.totalAmount) || 0
  const platformFee = amount * 0.02
  const escrowRequired = amount + platformFee
  const insufficientFunds = balance !== null && amount > 0 && balance < escrowRequired
  // Looks up the Client record for the logged-in user, creating one automatically the first time they create an escrow.
  const resolveClientId = async (userId) => {
    const res = await authFetch(`/api/clients?user_id=${userId}`)
    if (res.ok) {
      const clients = await res.json()
      if (clients.length > 0) return clients[0].client_id
    }

    const createRes = await authFetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })
    if (!createRes.ok) {
      throw new Error('Could not set up your client profile. Please try again.')
    }
    const newClient = await createRes.json()
    return newClient.client_id
  }

// Finds the User account matching the typed username (someone who has logged in before), then makes sure they have a Freelancer profile — creating one the first time they're picked as a counterpart.
const resolveFreelancerId = async (username) => {
  if (!username) return null

  const usersRes = await fetch('/api/users')
  if (!usersRes.ok) throw new Error('Could not look up that user right now.')
  const users = await usersRes.json()
  const match = users.find(
    (u) => u.name?.trim().toLowerCase() === username.trim().toLowerCase()
  )
  if (!match) {
    throw new Error(`No account found for "${username}" — they need to have signed up first.`)
  }

  const existingRes = await authFetch(`/api/freelancers?user_id=${match.user_id}`)
  if (existingRes.ok) {
    const existing = await existingRes.json()
    if (existing.length > 0) return existing[0].freelancer_id
  }

  const createRes = await authFetch('/api/freelancers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ freelancer_name: match.name, user_id: match.user_id }),
  })
  if (!createRes.ok) {
    throw new Error('Could not set up a freelancer profile for that user.')
  }
  const newFreelancer = await createRes.json()
  return newFreelancer.freelancer_id
}

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.title || !form.counterpartUsername || !form.totalAmount) {
      setError('Please fill in the escrow title, counterpart, and amount.')
      return
    }

    const user = getCurrentUser()
    if (!user) {
      setError('Please log in before creating an escrow.')
      return
    }

    setSubmitting(true)
    try {
      const clientId = await resolveClientId(user.user_id)
      const freelancerId = await resolveFreelancerId(form.counterpartUsername)

      const projectRes = await authFetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_title: form.title,
          description: form.scope,
          client_id: clientId,
          freelancer_id: freelancerId,
        }),
      })
      if (!projectRes.ok) {
        const data = await projectRes.json().catch(() => ({}))
        throw new Error(data.error || 'Could not create escrow.')
      }
      const project = await projectRes.json()

      const fundRes = await authFetch(`/api/projects/${project.project_id}/fund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })
      if (!fundRes.ok) {
        const data = await fundRes.json().catch(() => ({}))
        throw new Error(data.error || 'Escrow was created but funding it failed.')
      }


      await authFetch('/api/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.project_id,
          title: form.title,
          description: form.scope,
          amount,
          deadline: form.targetDate || null,
        }),
      })

      onCreated?.(project)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="create-escrow-page">
      <Navbar active="escrows" />

      <main className="create-escrow-main">
        <form className="create-escrow-card" onSubmit={handleSubmit}>
          <h1>Create Secure Escrow</h1>

          <section>
            <h2>1. Project Basics</h2>

            <label className="ce-label" htmlFor="title">Escrow title</label>
            <input
              id="title"
              className="ce-input"
              placeholder="Input"
              value={form.title}
              onChange={update('title')}
            />

            <div className="ce-row">
              <div className="ce-col">
                <label className="ce-label" htmlFor="counterpart">Counterpart Username</label>
                <input
                  id="counterpart"
                  className="ce-input"
                  placeholder="Input"
                  value={form.counterpartUsername}
                  onChange={update('counterpartUsername')}
                />
              </div>
              <div className="ce-col">
                <label className="ce-label" htmlFor="target-date">Target Completion date</label>
                <input
                  id="target-date"
                  type="date"
                  className="ce-input"
                  value={form.targetDate}
                  onChange={update('targetDate')}
                />
              </div>
            </div>

            <label className="ce-label" htmlFor="scope">Scope of work</label>
            <textarea
              id="scope"
              className="ce-textarea"
              placeholder="Describe deliverables and key requirements"
              value={form.scope}
              onChange={update('scope')}
              rows={4}
            />
          </section>

          <section>
            <h2>2. Payment and Milestones</h2>
            <p className="ce-sublabel">Choose between a single-payment or milestone based</p>

            <div className="ce-toggle-group" role="group" aria-label="Payment type">
              <button
                type="button"
                className={`ce-toggle ${form.paymentType === 'single' ? 'ce-toggle-active' : ''}`}
                onClick={() => setForm((f) => ({ ...f, paymentType: 'single' }))}
              >
                Single
              </button>
              <button
                type="button"
                className={`ce-toggle ${form.paymentType === 'milestone' ? 'ce-toggle-active' : ''}`}
                onClick={() => setForm((f) => ({ ...f, paymentType: 'milestone' }))}
              >
                Milestone
              </button>
            </div>

            <label className="ce-label" htmlFor="amount">Total Escrow Amount</label>
            <input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              className="ce-input"
              placeholder="Input"
              value={form.totalAmount}
              onChange={update('totalAmount')}
            />
          </section>

          <div className="ce-funding-box">
            <h3>Funding Overview</h3>
            <div className="ce-funding-row">
              <div>
                <p className="ce-funding-label">Escrow required</p>
                <p className="ce-funding-value">Ksh {escrowRequired.toLocaleString()}</p>
              </div>
              <div>
                <p className="ce-funding-label">Your balance</p>
                <p className={`ce-funding-value ${insufficientFunds ? 'ce-funding-value-warning' : ''}`}>
                  {balanceLoading ? '…' : balance !== null ? `Ksh ${balance.toLocaleString()}` : '—'}
                </p>
              </div>
            </div>

            {insufficientFunds && (
              <p className="ce-error">
                Insufficient balance — you need Ksh {(escrowRequired - balance).toLocaleString()} more to fund this escrow.
              </p>
            )}

            {error && <p className="ce-error">{error}</p>}

            <button type="submit" className="ce-submit-btn" disabled={submitting || insufficientFunds}>
              {submitting ? 'Creating…' : 'Create and fund escrow'}
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  )
}

export default CreateEscrow