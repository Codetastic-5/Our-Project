import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
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

      console.log("providers:", auth.currentUser?.providerData);

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

  // Sign in, and optionally enforce a required role (e.g., { requiredRole: 'cashier' })
  const login = async (email, password, options = {}) => {
    // options: { requiredRole: string }
    const result = await signInWithEmailAndPassword(auth, email, password);

    // If caller requested a required role, verify Firestore user doc
    const required = options.requiredRole;
    if (required) {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) throw new Error("No user after sign-in");
        const userDoc = await getDoc(doc(db, "users", uid));
        const role = (userDoc.exists() && userDoc.data().role) || "customer";

        if (String(role).toLowerCase() !== String(required).toLowerCase()) {
          // Not authorized for this role: immediately sign out and throw an auth-like error
          await signOut(auth);
          const err = new Error(`Account is not authorized for role: ${required}`);
          err.code = "auth/unauthorized";
          throw err;
        }
      } catch (e) {
        // rethrow for callers to handle
        throw e;
      }
    }

    return result;
  }; 

  const logout = () => signOut(auth);

  // Re-authenticate user before sensitive operations
  const reauthenticate = async (currentPassword) => {
    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      currentPassword
    );
    await reauthenticateWithCredential(auth.currentUser, credential);
  };

  // Update user's password
  const updateUserPasswordWithReauth = async (newPassword, currentPassword) => {
    await reauthenticate(currentPassword);
    await updateUserPassword(newPassword);
  };

  // Update user's name in Firestore
  const updateUserName = async (newName) => {
    await updateUsername(newName);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateUserPassword: updateUserPasswordWithReauth,
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

export async function updateUsername(newName) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not logged in");

  await updateDoc(doc(db, "users", uid), {
    name: newName,
  });
}

export async function updateUserPassword(newPassword) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not logged in");

  await updatePassword(user, newPassword);
}
