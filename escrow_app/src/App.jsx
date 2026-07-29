import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Escrows from './pages/Escrow'
import CreateEscrow from './pages/CreateEscrow'
import Dashboard from './pages/Dashboard'
import EscrowDetail from './pages/Escrowdetail'
import { setAuth } from './auth'
import WalletTopUp from './pages/Topup'
import RateFreelancers from './pages/RateFreelancers'

function LoginRoute() {
  const navigate = useNavigate()
  return (
    <Login
      onLogin={(data) => {
        setAuth(data.token, data.user)
        navigate('/escrows')
      }}
    />
  )
}

function CreateEscrowRoute() {
  const navigate = useNavigate()
  return <CreateEscrow onCreated={() => navigate('/escrows/${project.project_id}')} />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/escrows" element={<Escrows />} />
        <Route path="/escrows/create" element={<CreateEscrowRoute />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/escrows/:id" element={<EscrowDetail />} />
        <Route path="/topup" element={<WalletTopUp isOpen={true} onClose={() => {}} userId={1} />} />
        <Route path="/rate-freelancers" element={<RateFreelancers />} />
        {/* Unknown URLs fall back to the homepage */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App