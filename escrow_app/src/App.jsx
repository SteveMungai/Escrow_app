import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Features from './components/Features'
import HowItWorks from './components/HowItworks'
import CTA from './components/CTA'
import Footer from './components/Footer'
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
