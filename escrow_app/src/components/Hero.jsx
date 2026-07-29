import { useNavigate } from 'react-router-dom'
import heroBg from '../assets/heroBg.jpg'

function Hero() {
  const navigate = useNavigate()

  return (
    <header className="hero">
      <div className="hero-bg" style={{ backgroundImage: `url(${heroBg})` }} />
      <div className="hero-overlay" />
      <div className="hero-content">
        <h1>Secure payments for freelancers and clients you can trust</h1>
        <p>Funds are securely held until project milestones are completed and approved by both parties.</p>
        <button className="btn btn-primary" onClick={() => navigate('/login?mode=signup')}>
          Get Started
        </button>
      </div>
    </header>
  )
}

export default Hero