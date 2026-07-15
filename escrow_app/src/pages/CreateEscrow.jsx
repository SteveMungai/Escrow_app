import { useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
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

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  //Placeholder values
   const amount = parseFloat(form.totalAmount) || 0
  const platformFee = amount * 0.02
  const escrowRequired = amount
  const clientTotal = amount + platformFee

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.title || !form.counterpartUsername || !form.totalAmount) {
      setError('Please fill in the escrow title, counterpart, and amount.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_title: form.title,
          description: form.scope,
          client_id: 1, //  replace with the logged-in user's id once auth is wired up
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Could not create escrow.')
      }

      const project = await res.json()
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
                  <p className="ce-funding-label">Account balance</p>
                  <p className="ce-funding-value">Ksh {clientTotal.toLocaleString()}</p>
                </div>
              </div>
  
              {error && <p className="ce-error">{error}</p>}
  
              <button type="submit" className="ce-submit-btn" disabled={submitting}>
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
  