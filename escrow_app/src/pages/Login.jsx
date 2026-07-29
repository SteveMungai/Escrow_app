import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import './Login.css'


function Login({ onLogin }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const mode = searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  const isSignup = mode === 'signup'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const switchMode = (nextMode) => {
    setError('')
    setSearchParams(nextMode === 'signup' ? { mode: 'signup' } : {})
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (isSignup && (!name || !email || !password)) {
      setError('Please fill in your name, email, and password.')
      return
    }
    if (!isSignup && (!email || !password)) {
      setError('Please enter both your email and password.')
      return
    }

    setLoading(true)
    try {
      if (isSignup) {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Could not create your account.')
        }

        const data = await res.json()
        // Persist the JWT + user so authenticated requests (e.g. wallet topup) can attach it later, and so the session survives a page refresh.
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        onLogin?.(data) // treat a successful signup as being logged in immediately
      } else {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Invalid email or password.')
        }

        const data = await res.json()
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        onLogin?.(data)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-left">
        <img
          src="./animal.png"
          alt="Animal illustration"
          style={{ width: "90px", height: "90px", objectFit: 'cover', filter: 'brightness(0) invert(1)' }}
        />
        <h1>Secure access, anytime, anywhere.</h1>
      </div>

      <div className="login-right">
        <div className="login-card">
          <h2>{isSignup ? 'Create your account' : 'Welcome back!'}</h2>
          <p className="login-subtitle">
            {isSignup
              ? 'Sign up to start creating and managing secure escrow projects.'
              : 'Enter your credentials to access your escrow dashboard and manage your active projects.'}
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {isSignup && (
              <>
                <label className="login-label" htmlFor="name">Full name</label>
                <div className="login-input-wrap">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" stroke="#144272" strokeWidth="2" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#144272" strokeWidth="2" />
                  </svg>
                  <input
                    id="name"
                    type="text"
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                </div>
              </>
            )}

            <label className="login-label" htmlFor="email">Email</label>
            <div className="login-input-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="#144272" strokeWidth="2" />
                <path d="M3 7l9 6 9-6" stroke="#144272" strokeWidth="2" />
              </svg>
              <input
                id="email"
                type="email"
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
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
                placeholder={isSignup ? 'Create a password' : 'Enter your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
              />
            </div>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (isSignup ? 'Creating account…' : 'Signing in…') : (isSignup ? 'Create account' : 'Sign in')}
            </button>
          </form>

          <p className="login-switch">
            {isSignup ? (
              <>Already have an account?{' '}
                <button type="button" className="login-switch-link" onClick={() => switchMode('login')}>
                  Log in
                </button>
              </>
            ) : (
              <>Don't have an account?{' '}
                <button type="button" className="login-switch-link" onClick={() => switchMode('signup')}>
                  Sign up
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login