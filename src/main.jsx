import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { MenuProvider } from "./context/MenuContext";
import { ReservationProvider } from "./context/ReservationContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
        <MenuProvider>
          <ReservationProvider>
            <App />
          </ReservationProvider>
        </MenuProvider>
      </ToastProvider>
    </AuthProvider>
  </StrictMode>
);
