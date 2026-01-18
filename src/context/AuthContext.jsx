import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let userUnsub = null;

    const authUnsub = onAuthStateChanged(auth, (currentUser) => {
      // stop previous Firestore listener (if any)
      if (userUnsub) userUnsub();

      if (!currentUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      const userRef = doc(db, "users", currentUser.uid);

      // ✅ live listener to Firestore user doc
      userUnsub = onSnapshot(
        userRef,
        (snap) => {
          const data = snap.exists() ? snap.data() : {};

          setUser({
            uid: currentUser.uid,
            email: currentUser.email,
            role: data.role ?? "customer",
            name: data.name ?? currentUser.email,
            points: data.points ?? 0,
          });

          setLoading(false);
        },
        (err) => {
          console.error("Firestore live user error:", err);
          setUser({
            uid: currentUser.uid,
            email: currentUser.email,
            role: "customer",
            name: currentUser.email,
            points: 0,
          });
          setLoading(false);
        }
      );
    });

    return () => {
      if (userUnsub) userUnsub();
      authUnsub();
    };
  }, []);

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
