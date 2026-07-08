function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-pill">
        <a href="#home" className="nav-link nav-link-active">Home</a>
        <a href="#escrows" className="nav-link">Escrows</a>
        <a href="#dashboard" className="nav-link">Dashboard</a>
      </div>
      <div className="navbar-avatar" aria-label="Account">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" stroke="#101c3a" strokeWidth="2" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#101c3a" strokeWidth="2" />
        </svg>
      </div>
    </nav>
  )
}

export default Navbar
