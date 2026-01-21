import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
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

  // Re-authenticate user before sensitive operations
  const reauthenticate = async (currentPassword) => {
    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      currentPassword
    );
    await reauthenticateWithCredential(auth.currentUser, credential);
  };

  // Update user's email
  const updateUserEmail = async (newEmail, currentPassword) => {
    await reauthenticate(currentPassword);
    await updateEmail(auth.currentUser, newEmail);
  };

  // Update user's password
  const updateUserPassword = async (newPassword, currentPassword) => {
    await reauthenticate(currentPassword);
    await updatePassword(auth.currentUser, newPassword);
  };

  // Update user's name in Firestore
  const updateUserName = async (newName) => {
    if (!auth.currentUser) throw new Error("Not logged in");
    console.log("Updating name to:", newName, "for user:", auth.currentUser.uid);
    const userRef = doc(db, "users", auth.currentUser.uid);
    await updateDoc(userRef, { name: newName });
    console.log("Name updated successfully in Firestore");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateUserEmail,
        updateUserPassword,
        updateUserName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
