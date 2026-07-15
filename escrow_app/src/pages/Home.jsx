import Navbar from '../../src/components/Navbar'
import Hero from '../../src/components/Hero'
import Features from '../../src/components/Features'
import HowItWorks from '../../src/components/HowItworks'
import CTA from '../../src/components/CTA'
import Footer from '../../src/components/Footer'
import './App.css'


function App() {
  return (
    <div className="page">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <CTA/>
      <Footer/>
    </div>
  )
}

export default App
