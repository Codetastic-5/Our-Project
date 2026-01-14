import { useState } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import CreateAccount from './components/CreateAccount'
import Login from './components/Login'
import Footer from './components/Footer'
import CustomerDashboard from './pages/CustomerDashboard'
import CashierDashboard from './pages/CashierDashboard'
import { MenuProvider } from './context/MenuContext'
import './App.css'

function App() {
  const [mode, setMode] = useState('create')
  const [selectedRole, setSelectedRole] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState(null)

  const handleSelectRole = (role) => {
    setSelectedRole(role)
    setMode('login')
  }

  const handleGoHome = () => {
    setMode('create')
    setSelectedRole(null)
    setIsLoggedIn(false)
    setUserRole(null)
  }

  const handleSwitchMode = (newMode, role) => {
    setMode(newMode)
    if (role !== undefined) {
      setSelectedRole(role)
    }
  }

  const handleLoginSuccess = (role) => {
    setIsLoggedIn(true)
    setUserRole(role)
  }

  const handleCreateAccountSuccess = () => {
    setIsLoggedIn(true)
    setUserRole('customer')
  }

  return (
    <MenuProvider>
      {renderContent()}
    </MenuProvider>
  )

  function renderContent() {
    // If logged in as customer, show CustomerDashboard
    if (isLoggedIn && userRole === 'customer') {
      return <CustomerDashboard onLogout={handleGoHome} />
    }

    // If logged in as cashier, show CashierDashboard
    if (isLoggedIn && userRole === 'cashier') {
      return <CashierDashboard onLogout={handleGoHome} />
    }

    if (isLoggedIn && userRole === 'admin') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-orange-100">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Admin Dashboard</h1>
            <p className="text-xl mb-4">Coming soon...</p>
            <button 
              onClick={handleGoHome}
              className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700"
            >
              Logout
            </button>
          </div>
        </div>
      )
    }

    // Default landing page
    return (
      <div className="min-h-screen flex flex-col">
        <Header isLoggedIn={false} />
        <main className="relative flex-1">
          <Hero />
          {mode === 'create' ? (
            <CreateAccount 
              onSwitchMode={handleSwitchMode} 
              onSuccess={handleCreateAccountSuccess}
            />
          ) : (
            <Login 
              role={selectedRole} 
              onSwitchMode={handleSwitchMode}
              onSuccess={handleLoginSuccess}
            />
          )}
        </main>
        <Footer onSelectRole={handleSelectRole} onGoHome={handleGoHome} />
      </div>
    )
  }
}

export default App