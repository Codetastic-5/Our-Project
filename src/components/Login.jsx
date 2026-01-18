import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const Login = ({ role, onSwitchMode, onSuccess }) => {
  const { login } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMessage("");
  };

  const handleSubmit = async () => {
    const email = formData.identifier.trim();
    const password = formData.password;

    if (!email || !password) {
      setErrorMessage("Please fill in all fields");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      await login(email, password);

      // role is loaded from Firestore inside AuthContext (user.role)
      toast.success("Logged in successfully!");
      setFormData({ identifier: "", password: "" });

      // keep your old callback (optional)
      if (onSuccess) onSuccess(role || "customer");
    } catch (err) {
      // common Firebase errors → simple messages
      const code = err?.code || "";
      if (code.includes("auth/invalid-credential")) {
        setErrorMessage("Wrong email or password.");
      } else if (code.includes("auth/user-not-found")) {
        setErrorMessage("No account found for this email.");
      } else if (code.includes("auth/wrong-password")) {
        setErrorMessage("Wrong email or password.");
      } else if (code.includes("auth/too-many-requests")) {
        setErrorMessage("Too many attempts. Try again later.");
      } else {
        setErrorMessage("Login failed. Please try again.");
      }
      toast.error("Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute top-1/2 right-8 md:right-24 lg:right-32 transform -translate-y-1/2 bg-white border-2 border-black rounded-lg p-6 w-full max-w-md shadow-lg z-10 animate-slide-in-right">
      {!role && (
        <div className="flex justify-center gap-4 mb-4">
          <button
            onClick={() => onSwitchMode && onSwitchMode("create", null)}
            className="px-4 py-2 font-semibold rounded-md bg-white text-orange-600 border-2 border-orange-600 hover:bg-orange-50 transition duration-200"
            type="button"
          >
            Create Account
          </button>
          <button
            className="px-4 py-2 font-semibold rounded-md bg-orange-600 text-white"
            type="button"
          >
            Log In
          </button>
        </div>
      )}

      <h2 className="text-3xl font-bold text-center mb-6">
        LOG IN
        {role ? ` — ${role.charAt(0).toUpperCase() + role.slice(1)}` : ""}
      </h2>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
          {errorMessage}
        </div>
      )}

      <div className="space-y-4">
        <input
          type="email"
          name="identifier"
          placeholder="Email"
          value={formData.identifier}
          onChange={handleChange}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
          autoComplete="email"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
          autoComplete="current-password"
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-orange-600 text-white font-bold py-3 rounded-lg hover:bg-orange-700 transition duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          type="button"
        >
          {loading ? "Logging in..." : "Log In"}
        </button>
      </div>

      <div className="mt-4 text-center">
        <button
          className="text-sm text-orange-600 hover:underline"
          type="button"
          onClick={() => toast.info("Forgot password: not added yet.")}
        >
          Forgot password?
        </button>
      </div>
    </div>
  );
};

export default Login;
