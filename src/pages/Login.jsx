import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const Login = ({ onBack }) => {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
    } catch (err) {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm space-y-4"
      >
        <h1 className="text-2xl font-bold text-center">Login</h1>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 transition"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 transition"
          required
        />

        <button
          type="submit"
          className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg font-bold transition"
        >
          Login
        </button>

        <button
          type="button"
          onClick={() => onBack?.()}
          className="w-full text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Back to Home
        </button>
      </form>
    </div>
  );
};

export default Login;
