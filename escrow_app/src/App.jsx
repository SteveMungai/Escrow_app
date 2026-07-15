import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Escrows from './pages/Escrow'
import CreateEscrow from './pages/CreateEscrow'

function LoginRoute() {
  const navigate = useNavigate()
  return <Login onLogin={() => navigate('/escrows')} />
}

function CreateEscrowRoute() {
  const navigate = useNavigate()
  return <CreateEscrow onCreated={() => navigate('/escrows')} />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/escrows" element={<Escrows />} />
        <Route path="/escrows/create" element={<CreateEscrowRoute />} />
        {/* Unknown URLs fall back to the homepage */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
