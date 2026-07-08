const steps = [
  { number: 1, label: 'Create project' },
  { number: 2, label: 'Fund escrow' },
  { number: 3, label: 'Release on completion' }
]

function HowItWorks() {
return(
    <section className="how-it-works">
      <h2 className="section-title section-title-light">HOW IT WORKS</h2>
      <div className="steps-list">
        {steps.map((step) => (
          <div className="step-row" key={step.number}>
            <span className="step-number">{step.number}</span>
            <span className="step-label">{step.label}</span>
          </div>
        ))}
      </div>
    </section>
)
}

export default HowItWorks