import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
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
      if (userUnsub) userUnsub();

      if (!currentUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      console.log("providers:", auth.currentUser?.providerData);

      setLoading(true);

      const userRef = doc(db, "users", currentUser.uid);

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

  const login = async (email, password, options = {}) => {
    const result = await signInWithEmailAndPassword(auth, email, password);

    const required = options.requiredRole;
    if (required) {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) throw new Error("No user after sign-in");
        const userDoc = await getDoc(doc(db, "users", uid));
        const role = (userDoc.exists() && userDoc.data().role) || "customer";

        if (String(role).toLowerCase() !== String(required).toLowerCase()) {
          await signOut(auth);
          const err = new Error(`Account is not authorized for role: ${required}`);
          err.code = "auth/unauthorized";
          throw err;
        }
      } catch (e) {
        throw e;
      }
    }

    return result;
  }; 

  const logout = () => signOut(auth);

  const resetPassword = async (email) => {
    if (!email) throw new Error("Email is required");
    await sendPasswordResetEmail(auth, email);
  };

  const reauthenticate = async (currentPassword) => {
    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      currentPassword
    );
    await reauthenticateWithCredential(auth.currentUser, credential);
  };

  const updateUserPasswordWithReauth = async (newPassword, currentPassword) => {
    await reauthenticate(currentPassword);
    await updateUserPassword(newPassword);
  };

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
        resetPassword,
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
