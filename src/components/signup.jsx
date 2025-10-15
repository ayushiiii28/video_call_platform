import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// Note: Removed the local asset import 'landingPageImage' as it cannot be guaranteed to load in this single-file environment.

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:8000";

  const validate = () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      return "All fields are required.";
    }
    // Simple email pattern fallback (backend does strict validation)
    const emailOk = /.+@.+\..+/.test(email);
    if (!emailOk) return "Please enter a valid email address.";
    if (password.length < 8) return "Password must be at least 8 characters long.";
    if (!/[0-9]/.test(password)) return "Password must contain at least one number.";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter.";
    return "";
  };

  const handleSignup = async () => {
    const validationMessage = validate();
    if (validationMessage) {
      setError(validationMessage);
      setSuccess("");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: name, email, password })
      });

      if (!response.ok) {
        const maybeJson = await response.json().catch(() => null);
        const detail = maybeJson?.detail || "Signup failed.";
        throw new Error(Array.isArray(detail) ? detail[0]?.msg || "Signup failed." : detail);
      }

      setSuccess("Account created successfully. Redirecting to login...");
      // Brief pause for UX, then navigate
      setTimeout(() => navigate("/login"), 800);
    } catch (e) {
      setError(e?.message || "Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // 1. Change main background to #A3AFEF and default text color to black for contrast
    <div className="flex flex-row h-screen w-screen bg-[#A3AFEF] text-black font-sans">
      
      {/* Left (Signup) Section - Adjusted size and positioning to match Login page */}
      <div className="w-[400px] h-[500px] flex flex-col items-center justify-center ml-48 mt-40">

        {/* App Title - Added with styles from Login.jsx */}
        <h2 style={{ color: "black", marginBottom: "1rem", fontSize: "2rem" }} className="font-bold self-start ml-2">Zynthora AI</h2>
        
        {/* Signup Form Box - Changed background to #778AEB and adjusted inner colors */}
        <div className="bg-[#778AEB] backdrop-blur-sm p-10 rounded-2xl shadow-2xl shadow-black/40 w-full h-full flex flex-col justify-center space-y-6 border border-white/20">
          
          {/* Heading - Changed text color to black for consistency (low contrast) */}
          <h2 className="text-black text-3xl font-semibold text-center mb-4">Create Account</h2>
          
          <div className="w-full space-y-5">
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              // Input style updated for consistency with Login: transparent background, black text/placeholder
              className="w-full h-12 px-4 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:border-white/40 focus:bg-white/15 text-black placeholder-black/50 transition-colors duration-200"
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              // Input style updated for consistency with Login: transparent background, black text/placeholder
              className="w-full h-12 px-4 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:border-white/40 focus:bg-white/15 text-black placeholder-black/50 transition-colors duration-200"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              // Input style updated for consistency with Login: transparent background, black text/placeholder
              className="w-full h-12 px-4 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:border-white/40 focus:bg-white/15 text-black placeholder-black/50 transition-colors duration-200"
            />
          </div>
          
          {/* Button - Changed text/border color to black for consistency (low contrast) */}
          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-[364px] h-[60px] mt-2 px-6 py-3 text-black rounded-lg border-2 border-black bg-transparent font-semibold text-lg hover:bg-black/10 transition-all duration-300 transform hover:scale-105 active:scale-95 self-center disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
          {error ? (
            <p className="text-red-700 text-sm text-center mt-2">{error}</p>
          ) : null}
          {success ? (
            <p className="text-green-700 text-sm text-center mt-2">{success}</p>
          ) : null}
        </div>
      </div>
      
      {/* Right (Image) Section - Adjusted size and positioning to match Login page */}
      <div className="flex-1 flex items-center justify-center pr-40">
        <div className="w-[650px] h-[670px] flex items-center justify-center ml-8">
          <img
            // Using a placeholder image URL for a consistent look
            src="https://placehold.co/650x670/CED5F9/1E1E1E?text=New+User+Setup"
            alt="User signup interface"
            className="w-full h-full object-cover rounded-2xl shadow-2xl shadow-black/30"
          />
        </div>
      </div>
    </div>
  );
}

export default Signup;