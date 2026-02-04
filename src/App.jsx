import { useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import CreateAccount from "./components/CreateAccount";
import Footer from "./components/Footer";
import CustomerDashboard from "./pages/CustomerDashboard";
import CashierDashboard from "./pages/CashierDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import { MenuProvider } from "./context/MenuContext";
import { ReservationProvider } from "./context/ReservationContext";
import { useAuth } from "./context/AuthContext";
import "./App.css";
import Login from "./components/Login";

function App() {
  const { user, logout } = useAuth();

  const [mode, setMode] = useState("create");
  const [selectedRole, setSelectedRole] = useState(null);

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setMode("login");
  };

  const handleGoHome = () => {
    setMode("create");
    setSelectedRole(null);
  };

  const handleSwitchMode = (newMode, role) => {
    setMode(newMode);
    if (role !== undefined) setSelectedRole(role);
  };

  if (user) {
    return (
      <MenuProvider>
        <ReservationProvider>
          {user.role === "admin" ? (
            <AdminDashboard onLogout={logout} />
          ) : user.role === "cashier" ? (
            <CashierDashboard onLogout={logout} />
          ) : (
            <CustomerDashboard onLogout={logout} />
          )}
        </ReservationProvider>
      </MenuProvider>
    );
  }

  return (
    <MenuProvider>
      <ReservationProvider>
        <div className="min-h-screen flex flex-col">
          <Header
            isLoggedIn={false}
            onCreateClick={() => handleSwitchMode("create")}
            onLoginClick={() => handleSwitchMode("login")}
          />

          <main className="relative flex-1 flex bg-gradient-to-r from-orange-500 to-orange-300">
            <Hero />

            {mode === "create" ? (
              <CreateAccount
                onSwitchMode={handleSwitchMode}
                onSuccess={() => setMode("login")}
              />
            ) : (
              <Login
                role={selectedRole}
                onSwitchMode={handleSwitchMode}
                onBack={handleGoHome}
              />
            )}
          </main>

          <Footer onSelectRole={handleSelectRole} onGoHome={handleGoHome} />
        </div>
      </ReservationProvider>
    </MenuProvider>
  );
}

export default App;
