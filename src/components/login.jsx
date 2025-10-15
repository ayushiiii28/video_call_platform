import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// Note: Removed the local asset import 'landingPageImage' as it cannot be guaranteed to load in this single-file environment.

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:8000";

  const handleLogin = async () => {
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }
    setLoading(true);
    try {
      // FastAPI OAuth2PasswordRequestForm expects x-www-form-urlencoded with fields: username, password
      const body = new URLSearchParams();
      body.append("username", username);
      body.append("password", password);

      const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body
      });

      if (!response.ok) {
        const maybeJson = await response.json().catch(() => null);
        const detail = maybeJson?.detail || "Login failed.";
        throw new Error(Array.isArray(detail) ? detail[0]?.msg || "Login failed." : detail);
      }

      const data = await response.json();
      // { access_token, refresh_token, token_type }
      sessionStorage.setItem("access_token", data.access_token);
      sessionStorage.setItem("refresh_token", data.refresh_token);
      sessionStorage.setItem("token_type", data.token_type || "bearer");

      navigate("/");
    } catch (e) {
      setError(e?.message || "Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // 1. Change main background to #A3AFEF and default text color to black for contrast
    <div className="flex flex-row h-screen w-screen bg-[#A3AFEF] text-black font-sans">
      
      {/* Left (Login) Section - Smaller and shifted right */}
      <div className="w-[400px] h-[500px] flex flex-col items-center justify-center ml-48 mt-40">
        
        {/* App Title - Updated style as requested: color: black, fontSize: 2rem */}
        <h2 style={{ color: "black", marginBottom: "1rem", fontSize: "2rem" }} className="font-bold self-start ml-2">Zynthora AI</h2>
        
        {/* Login Form Box - Changed background to #778AEB (dark blue) and adjusted inner colors for visibility */}
        <div className="bg-[#778AEB] backdrop-blur-sm p-10 rounded-2xl shadow-2xl shadow-black/40 w-full h-full flex flex-col justify-center space-y-6 border border-white/20">
          
          {/* Login Heading - Text color set to black (low contrast, as per previous request) */}
          <h2 className="text-2xl font-semibold text-black text-center">Login</h2>
          
          <div className="w-full space-y-5">
            <div>
              {/* Label - Text color set to black/80 (low contrast, as per previous request) */}
              <label className="block text-sm font-medium text-black/80 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                // Input - Adjusted text and placeholder to black for consistency
                className="w-full h-12 px-4 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:border-white/40 focus:bg-white/15 text-black placeholder-black/50 transition-colors duration-200"
                placeholder="Enter your username"
              />
            </div>
            
            <div>
              {/* Label - Text color set to black/80 (low contrast, as per previous request) */}
              <label className="block text-sm font-medium text-black/80 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                // Input - Adjusted text and placeholder to black for consistency
                className="w-full h-12 px-4 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:border-white/40 focus:bg-white/15 text-black placeholder-black/50 transition-colors duration-200"
                placeholder="Enter your password"
              />
            </div>
            
            {/* Link - Text color set to black/70 (low contrast, as per previous request) */}
            <a href="#" className="block text-sm text-black/70 hover:text-black transition-colors duration-200 text-center mt-1">
              Forgot Password?
            </a>
          </div>
          
          {/* Login Button - Text/border color set to black (low contrast, as per previous request) */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-[364px] h-[60px] mt-2 px-6 py-3 text-black rounded-lg border-2 border-black bg-transparent font-semibold text-lg hover:bg-black/10 transition-all duration-300 transform hover:scale-105 active:scale-95 self-center disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
          {error ? (
            <p className="text-red-700 text-sm text-center mt-2">{error}</p>
          ) : null}
        </div>
      </div>
      
      {/* Right (Image) Section - Shifted right */}
      <div className="flex-1 flex items-center justify-center pr-40">
        <div className="w-[650px] h-[670px] flex items-center justify-center ml-8">
          <img
            // Using a placeholder image URL, consistent with previous requests
            src="https://placehold.co/650x670/CED5F9/1E1E1E?text=Secure+Login"
            alt="Video conference call"
            className="w-full h-full object-cover rounded-2xl shadow-2xl shadow-black/30"
          />
        </div>
      </div>
    </div>
  );
}

export default Login;