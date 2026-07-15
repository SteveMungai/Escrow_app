import {useState} from 'react'
import './Login.css'

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!username || !password) {
      setError('Please enter both your username and password.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, password }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Invalid username or password.')
      }

           const data = await res.json()
      onLogin?.(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

   return (
    <div className="login-page">
      <div className="login-left">
        <svg className="login-logo" width="48" height="48" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2c-1.5 0-2.5 1-3 2-1.5-.5-3 0-3.5 1.5-.3.9 0 1.8.6 2.4-1 .6-1.6 1.7-1.4 2.9.2 1.3 1.3 2.2 2.6 2.2h.2c.1 1.8 1.6 3.2 3.4 3.2h2.2c1.8 0 3.3-1.4 3.4-3.2h.2c1.3 0 2.4-.9 2.6-2.2.2-1.2-.4-2.3-1.4-2.9.6-.6.9-1.5.6-2.4C19 5.5 17.5 5 16 5.5c-.5-1-1.5-2-3-2z"
            stroke="#ffffff"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <circle cx="10" cy="9" r="0.6" fill="#ffffff" />
          <circle cx="14" cy="9" r="0.6" fill="#ffffff" />
        </svg>
        <h1>Secure access, anytime, anywhere.</h1>
      </div>

      <div className="login-right">
        <div className="login-card">
          <h2>Welcome back!</h2>
          <p className="login-subtitle">
            Enter your credentials to access your escrow dashboard and manage your active projects.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <label className="login-label" htmlFor="username">Username</label>
            <div className="login-input-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="#144272" strokeWidth="2" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#144272" strokeWidth="2" />
              </svg>
              <input
                id="username"
                type="text"
                placeholder="name@domain.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>

            <label className="login-label" htmlFor="password">Password</label>
            <div className="login-input-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="5" y="10" width="14" height="10" rx="2" stroke="#144272" strokeWidth="2" />
                <path d="M8 10V7a4 4 0 018 0v3" stroke="#144272" strokeWidth="2" />
              </svg>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
