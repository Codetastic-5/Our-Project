import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useToast } from "../context/ToastContext";

const CreateAccount = ({ onSwitchMode }) => {
  const toast = useToast();

  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
  });

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMessage("");
  };

  const handleSubmit = async () => {
    const email = formData.email.trim();
    const username = formData.username.trim();
    const password = formData.password;

    if (!email || !username || !password) {
      setErrorMessage("Please fill in all fields");
      toast.error("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters");
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      // 1) Create user in Firebase Auth
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // 2) Create Firestore user doc (role-based routing uses this)
      await setDoc(doc(db, "users", cred.user.uid), {
        role: "customer",
        name: username, // or use "username" field if you prefer
        email,
        createdAt: serverTimestamp(),
        points: 0,
      });

      setSuccessMessage("Account created successfully! Redirecting...");
      toast.success("Account created! You can now log in.");

      // Clear fields
      setFormData({ email: "", username: "", password: "" });

      // Go to login tab after a short delay (same behavior as before)
      window.setTimeout(() => {
        setSuccessMessage("");
        if (onSwitchMode) onSwitchMode("login", null);
      }, 1200);
    } catch (err) {
      const code = err?.code || "";

      if (code.includes("auth/email-already-in-use")) {
        setErrorMessage("Email is already in use.");
      } else if (code.includes("auth/invalid-email")) {
        setErrorMessage("Invalid email format.");
      } else if (code.includes("auth/weak-password")) {
        setErrorMessage("Weak password. Use at least 6 characters.");
      } else {
        setErrorMessage("Create account failed. Please try again.");
      }

      toast.error("Create account failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute top-1/2 right-8 md:right-24 lg:right-32 transform -translate-y-1/2 bg-white border-2 border-black rounded-lg p-6 w-full max-w-md shadow-lg z-10 animate-slide-in-right">
      <div className="flex justify-center gap-4 mb-4">
        <button
          className="px-4 py-2 font-semibold rounded-md bg-orange-600 text-white"
          type="button"
        >
          Create Account
        </button>

        <button
          onClick={() => onSwitchMode && onSwitchMode("login", null)}
          className="px-4 py-2 font-semibold rounded-md bg-white text-orange-600 border-2 border-orange-600 hover:bg-orange-50 transition duration-200"
          type="button"
        >
          Log In
        </button>
      </div>

      <h2 className="text-3xl font-bold text-center mb-6">CREATE ACCOUNT</h2>

      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-center">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
          {errorMessage}
        </div>
      )}

      <div className="space-y-4">
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
          autoComplete="email"
        />

        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
          autoComplete="username"
        />

        <input
          type="password"
          name="password"
          placeholder="Password (min. 6 characters)"
          value={formData.password}
          onChange={handleChange}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
          autoComplete="new-password"
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-orange-600 text-white font-bold py-3 rounded-lg hover:bg-orange-700 transition duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          type="button"
        >
          {loading ? "Creating..." : "Create Account"}
        </button>
      </div>
    </div>
  );
};

export default CreateAccount;
