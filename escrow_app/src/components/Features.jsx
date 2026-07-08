const featureList = [
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M12 2l7 3v6c0 5-3.4 8.7-7 10-3.6-1.3-7-5-7-10V5l7-3z" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Escrow Protection',
    description: 'Funds are securely held with work is completed and approved, reducing risk for both parties.'
  },
    {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="6" width="18" height="13" rx="2" stroke="#fff" strokeWidth="1.6" />
        <path d="M3 10h18" stroke="#fff" strokeWidth="1.6" />
        <path d="M8 6V4h8v2" stroke="#fff" strokeWidth="1.6" />
      </svg>
    ),
    title: 'Milestone Payments',
    description: 'Break projects into stages and release payments only when each milestone is delivered.'
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M12 2l7 3v6c0 5-3.4 8.7-7 10-3.6-1.3-7-5-7-10V5l7-3z" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Trust Score Verification',
    description: 'Funds are securely stored and released based on milestone approval.'
  }
]

function Features() {
  return (
    <section className="features">
      <h2 className="section-title">FEATURES</h2>
      <div className="features-grid">
        {featureList.map((feature) => (
          <div className="feature-card" key={feature.title}>
            <div className="feature-icon">{feature.icon}</div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Features
