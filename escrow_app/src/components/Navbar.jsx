import { Link } from "react-router-dom"
import { useState, useRef, useEffect } from "react"

function Navbar({active='home'}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
 
  // Closes the dropdown if you click anywhere outside it
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <nav className="navbar">
      <div className="navbar-pill">
        <Link to="/" className={`nav-link ${active === 'home' ? 'nav-link-active' : ''}`}>Home</Link>
        <Link to="/escrows" className={`nav-link ${active === 'escrows' ? 'nav-link-active' : ''}`}>Escrows</Link>
        <Link to="/dashboard" className={`nav-link ${active === 'dashboard' ? 'nav-link-active' : ''}`}>Dashboard</Link>
      </div>

           <div className="navbar-account" ref={menuRef}>
        <button
          className="navbar-avatar"
          aria-label="Account menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="#101c3a" strokeWidth="2" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#101c3a" strokeWidth="2" />
          </svg>
        </button>
 
        {menuOpen && (
          <div className="navbar-dropdown">
            <Link to="/login" className="navbar-dropdown-item" onClick={() => setMenuOpen(false)}>
              Login
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
