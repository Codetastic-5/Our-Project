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


// IMPORTANT:
// Use the Firebase Login page (the one we made earlier).
// If your Firebase login file is in src/pages/Login.jsx, use this import:
import Login from "./components/Login";

function App() {
  const { user, logout } = useAuth();

  // this controls your old homepage switching (create vs login)
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

  // LOGGED IN (Firebase)
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

  // NOT LOGGED IN (Old homepage)
  return (
    <MenuProvider>
      <ReservationProvider>
        <div className="min-h-screen flex flex-col">
          <Header isLoggedIn={false} />

          <main className="relative flex-1 pt-20">
            <Hero />

            {mode === "create" ? (
              <CreateAccount
                onSwitchMode={handleSwitchMode}
                // For now, after create account we just go to login screen.
                // Later we can connect CreateAccount to Firebase createUserWithEmailAndPassword.
                onSuccess={() => setMode("login")}
              />
            ) : (
              <Login
                // Your selectedRole can be used just for UI text.
                role={selectedRole}
                onSwitchMode={handleSwitchMode}
                // If your Login page doesn’t support onBack/onSuccess, remove these props.
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
